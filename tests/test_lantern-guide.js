// jsdom Tier 2 playthrough suite for Lantern Guide (#83)
// Core loop: move the lantern (cursor-follow) onto seeds to collect 20/round,
// avoid/absorb shadow hits (3 lives), clear 8 rounds to win.
// Drives the game through window.__cfq. No mouse-event simulation is used for
// movement because jsdom has no layout engine (canvas.getBoundingClientRect()
// is always {0,0,0,0}), which would fabricate NaN cursor coordinates that are
// a harness artifact, not a game bug. Instead we mutate the exposed `lantern`
// object directly -- it is the exact same reference the game's own onMove()
// mutates, never reassigned, so this is a faithful stand-in for "the player
// moved the cursor here."
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'lantern-guide', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- canvas 2D context stub (jsdom returns null from getContext) ----
const stub = el => new Proxy({}, {
  get(t, p) {
    if (p === 'measureText') return () => ({ width: 10 });
    if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop() {} });
    if (p === 'canvas') return el;
    if (p === 'getImageData') return () => ({ data: [] });
    return t[p] !== undefined ? t[p] : (() => {});
  },
  set() { return true; }
});

const pageErrors = [];
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: false,
  url: 'http://localhost/',
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = function () { return stub(this); };
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// ---- helpers ----

// Shadows chase the lantern every frame. To isolate the seed-collection /
// round-advance logic from the (separately tested) combat system, pin every
// shadow to a corner just before each update() call. clamp(v,0,W) forces
// whatever we set back onto the canvas at (0,0), which is >=~85px from the
// nearest legal seed spawn (seeds spawn at x,y >= 60,60 => hypot(60,60)=~85),
// comfortably outside even the boss's hitReach (66). This does not touch the
// seed/round-advance code under test at all.
function pinShadowsAway() {
  for (const sh of g.shadows) { sh.x = -9999; sh.y = -9999; }
}

function warmup(frames) { for (let i = 0; i < frames; i++) { pinShadowsAway(); g.update(16); } }

// Move the lantern onto seed `idx` and let one frame register the collision.
// Returns true if that seed is now collected.
function collectSeedByIndex(idx) {
  const sd = g.seeds[idx];
  pinShadowsAway();
  g.lantern.x = sd.x; g.lantern.y = sd.y;
  g.update(16);
  return sd.collected === true;
}

// Collect seeds in index order (skipping any already collected) until the
// round's completion threshold fires or the game leaves 'playing'.
function collectUntilRoundComplete(indices) {
  for (const idx of indices) {
    if (g.game.state !== 'playing') break;
    if (g.game.collected >= g.SEEDS_NEEDED) break;
    if (g.seeds[idx].collected) continue;
    collectSeedByIndex(idx);
  }
}

(async () => {

  /* ======================= SMOKE (hook wiring only; Tier 1 already covers load/NaN/draw) ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game/lantern/seeds/shadows state', !!g.game && !!g.lantern && Array.isArray(g.seeds) && Array.isArray(g.shadows));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.game.state, 'title', 'game opens on the title screen');

  /* ======================= CORE LOOP: one action advances ======================= */
  console.log('\n--- core loop: a single collection advances the game (soft-lock check) ---');
  g.resetGame();   // this is literally what onDown() calls from the title screen
  eq(g.game.state, 'playing', 'starting from the title screen enters play');
  eq(g.game.round, 0, 'round starts at 0');
  eq(g.game.collected, 0, 'no seeds collected yet');

  warmup(60);   // round 0 starts at game.time=0; seeds fade in over up to 600ms, need alpha>0.3 to be collectible
  const c1 = collectSeedByIndex(0);
  ok('the targeted seed actually registered as collected', c1);
  eq(g.game.collected, 1, 'collecting a seed advances the collected count');
  eq(g.game.state, 'playing', 'the game is still playing (not soft-locked) after one collection');

  /* ======================= do it three times running ======================= */
  console.log('\n--- core loop: three collections in a row, still advancing, still accepting input ---');
  collectSeedByIndex(1);
  eq(g.game.collected, 2, 'second collection advances the count');
  collectSeedByIndex(2);
  eq(g.game.collected, 3, 'third collection advances the count');
  ok('lantern position is still live/mutable (input still accepted)', g.lantern.x === g.seeds[2].x && g.lantern.y === g.seeds[2].y);
  eq(g.game.state, 'playing', 'still playing after three collections in a row');

  /* ======================= full playthrough to a real ending (WIN), including the power-up path ======================= */
  console.log('\n--- full playthrough: clear all rounds to a real win, exercising the golden-seed power-up on the way ---');
  // finish round 0 (already collected seeds 0,1,2 above)
  collectUntilRoundComplete(Array.from({ length: g.SEEDS_NEEDED }, (_, i) => i));
  eq(g.game.collected, g.SEEDS_NEEDED, 'round 0: all 20 seeds collected');
  eq(g.game.score, 2, 'round 0: clearing with zero hits awards completion (+1) and the no-hit clear bonus (+1)');
  ok('round 0: still playing at the instant of completion (round transition is deferred)', g.game.state === 'playing');

  await sleep(600);   // the scheduled round-advance (500ms) must have fired by now
  eq(g.game.round, 1, 'round advances to 1 after the completion timeout fires');
  eq(g.game.state, 'playing', 'round 1 is playable (no soft-lock across the round transition)');
  eq(g.game.collected, 0, 'round 1 starts with a fresh collected count');
  ok('round 1 has a fresh, uncollected seed set', g.seeds.every(sd => !sd.collected));

  // round 1 is the first round with a golden power-up seed (index SEEDS_NEEDED+4)
  const goldenIdx = g.SEEDS_NEEDED + 4;
  ok('round 1 spawns the golden power-up seed', g.seeds[goldenIdx].golden === true);
  pinShadowsAway();
  const gotGolden = collectSeedByIndex(goldenIdx);
  ok('the golden seed registers as collected', gotGolden);
  ok('collecting the golden seed grants the light-boost power-up rather than freezing anything', g.game.lightBoostT > 0);
  const boostAfterPickup = g.game.lightBoostT;
  eq(g.game.state, 'playing', 'still playing immediately after the power-up pickup');
  eq(g.game.collected, 1, 'the golden seed also counts toward the round quota (by design)');

  // prove the power-up path *advances* rather than consuming-and-freezing: keep playing normally afterward
  collectUntilRoundComplete(Array.from({ length: g.SEEDS_NEEDED }, (_, i) => i));
  eq(g.game.collected, g.SEEDS_NEEDED, 'round 1: quota reached after the power-up plus the remaining normal seeds');
  ok('input/collection kept working after the power-up all the way to round completion', g.game.state === 'playing');

  // let the boost tick down through ordinary updates without breaking anything
  for (let i = 0; i < 5; i++) { pinShadowsAway(); g.update(16); }
  ok('the power-up timer decays via normal updates (does not stay stuck)', g.game.lightBoostT < boostAfterPickup);

  await sleep(600);
  eq(g.game.round, 2, 'round advances to 2 after round 1 (power-up round) completes cleanly');

  // clear the remaining rounds (2..7) to reach the real ending
  for (let r = 2; r < g.TOTAL; r++) {
    collectUntilRoundComplete(Array.from({ length: g.SEEDS_NEEDED }, (_, i) => i));
    eq(g.game.collected, g.SEEDS_NEEDED, `round ${r}: quota reached`);
    await sleep(600);
  }
  eq(g.game.state, 'won', 'clearing all 8 rounds reaches the real win ending');
  eq(g.game.round, g.TOTAL, 'round counter reflects all rounds cleared');
  eq(g.game.score, g.TOTAL * 2, 'a perfect no-hit run banks completion + bonus every round');
  eq(g.game.best, g.TOTAL * 2, 'best score is updated to the perfect run');

  /* ======================= restart after WIN is playable ======================= */
  console.log('\n--- restart after the win screen is playable again ---');
  g.resetGame();   // exactly what onDown() calls from the 'won' screen
  eq(g.game.state, 'playing', 'restarting from the win screen re-enters play');
  eq(g.game.round, 0, 'round resets to 0');
  eq(g.game.score, 0, 'score resets to 0');
  eq(g.game.lives, 3, 'lives reset to full');
  ok('a fresh collection works right after a post-win restart', collectSeedByIndex(0));
  eq(g.game.collected, 1, 'collection counts correctly after a post-win restart');

  /* ======================= exhaust the fail condition -> a real ending ======================= */
  console.log('\n--- exhausting lives reaches a real gameover ending ---');
  g.resetGame();
  eq(g.game.lives, 3, 'lives start full');
  g.game.lives = 1;   // drive straight to the last-life scenario; a real player gets here via 2 prior hits
  const sh = g.shadows[0];
  sh.x = g.lantern.x; sh.y = g.lantern.y;   // put a shadow exactly where the lantern is: guaranteed contact
  g.update(16);
  eq(g.game.lives, 0, 'the last life is spent on contact with a shadow');
  ok('still reports playing at the instant of the fatal hit (gameover is deferred like round-advance)', g.game.state === 'playing');
  await sleep(500);   // the scheduled gameover (400ms) must have fired by now
  eq(g.game.state, 'gameover', 'losing the last life reaches the real gameover ending');

  /* ======================= restart after GAMEOVER is playable ======================= */
  console.log('\n--- restart after gameover is playable again ---');
  g.resetGame();   // exactly what onDown() calls from the 'gameover' screen
  eq(g.game.state, 'playing', 'restarting from gameover re-enters play');
  eq(g.game.round, 0, 'round resets to 0');
  eq(g.game.lives, 3, 'lives reset to full');
  eq(g.game.collected, 0, 'collected resets to 0');
  ok('a fresh collection works right after a post-gameover restart', collectSeedByIndex(0));
  eq(g.game.collected, 1, 'collection counts correctly after a post-gameover restart');
  collectSeedByIndex(1);
  collectSeedByIndex(2);
  eq(g.game.collected, 3, 'three collections in a row still work after a post-gameover restart');

  report();
  process.exit(fail === 0 ? 0 : 1);
})();

function report() {
  console.log('\n==== TEST RESULTS ====');
  console.log('PASSED: ' + pass);
  console.log('FAILED: ' + fail);
  if (fails.length) { console.log('\nFailures:'); fails.forEach(f => console.log('  x ' + f)); }
  console.log(fail === 0 ? '\nALL TESTS GREEN' : '\nSOME TESTS FAILED');
}
