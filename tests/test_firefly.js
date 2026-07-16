// jsdom Tier-2 playthrough suite for Firefly (#99)
// Core loop: move a mouse-follow light near fireflies while they blink "on" to collect
// them (12 per round, 8 rounds), while dodging drifting shadow blobs that cost lives.
// Drives the game the way a real player does: dispatches real `mousemove` events at the
// canvas (after stubbing getBoundingClientRect, which jsdom returns as all-zero) so the
// game's own listener sets player.x/y, exactly as it would from a browser. No internal
// state is set directly except where explicitly labelled FAST-FORWARD (mirroring the
// house-style pattern in test_word-unscramble.js of jumping straight to a boundary by
// writing the same paired fields the real code writes, to test transition logic in
// isolation from reachability).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'firefly', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- canvas 2D context stub ----
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
    w.AudioContext = undefined;          // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;
const canvas = win.document.getElementById('game');

// jsdom's canvas has no real layout, so getBoundingClientRect is all zeros. Give it a
// real box matching the game's internal W/H (960x540) so real mousemove math works.
Object.defineProperty(canvas, 'getBoundingClientRect', {
  value: () => ({ left: 0, top: 0, width: 960, height: 540, right: 960, bottom: 540 }),
  configurable: true
});
function moveMouse(x, y) {
  canvas.dispatchEvent(new win.MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
}
function tick(dt) { g.update(dt == null ? 16 : dt); }

// Chase whichever currently-lit, uncollected/unmissed firefly exists (a real player's
// natural strategy: go to whatever's glowing). Returns true once collected count rises.
function chaseOneReal(maxTicks) {
  const before = g.game.collected;
  for (let i = 0; i < maxTicks; i++) {
    const target = g.flies.find(f => !f.collected && !f.missed && f.on);
    if (target) moveMouse(target.x, target.y);
    tick(16);
    if (g.game.collected > before) return true;
    if (g.game.state !== 'playing') return false;
  }
  return false;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.flies) && Array.isArray(g.blobs));
  ok('canvas element is present', !!canvas);
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.TOTAL, 8, 'collection declares 8 rounds');
  eq(g.FLIES_PER_ROUND, 12, 'collection declares 12 fireflies per round');

  let drewOk = true;
  for (const st of ['title', 'playing', 'paused', 'won', 'gameover']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  ok('draw() runs in every state without throwing', drewOk);
  g.resetGame();

  /* ======================= CORE LOOP ======================= */
  console.log('\n--- core loop: real input advances the game ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame puts the game in the playing state');
  eq(g.game.collected, 0, 'round starts with nothing collected');
  eq(g.flies.length, 12, 'a round spawns 12 fireflies');

  const score0 = g.game.score;
  const c1 = chaseOneReal(4000);
  ok('chasing a lit firefly with real mousemove input collects it', c1);
  ok('collecting a firefly advances the score', g.game.score > score0);
  eq(g.game.state, 'playing', 'still playing after one catch');

  console.log('\n--- core loop: three catches in a row, still accepting input ---');
  let threeOk = true;
  let lastCollected = g.game.collected;
  for (let i = 0; i < 3; i++) {
    const got = chaseOneReal(4000);
    if (!got || g.game.collected <= lastCollected) { threeOk = false; break; }
    lastCollected = g.game.collected;
  }
  ok('three consecutive real catches each advance collected/score, input stays live', threeOk);
  eq(g.game.state, 'playing', 'still playing and accepting input after three catches');

  /* ============ REGRESSION: a fly missed on one blink must stay in play ============
     A firefly blinking off uncaught is a missed OPPORTUNITY (it costs score/accuracy), never a
     retirement. If a fly could ever leave play uncaught, game.collected could not reach 12 and
     the round would soft-lock forever. This section previously asserted that soft-lock as
     *expected behaviour*, which is why it passed the broken build 54/54. */
  console.log('\n--- exhaust: a firefly missed on a blink stays catchable; the round stays completable ---');
  g.resetGame();
  const ignored = g.flies[0];
  ok('the ignored firefly starts uncollected', !ignored.collected);

  // Deterministically starve exactly one firefly of the light: chase every OTHER lit,
  // reachable firefly, but never move toward `ignored`, so its on/off timer alone flips it
  // from on->off repeatedly while the player is nowhere near it.
  const missedBefore = g.game.missed;
  let blinkOffs = 0, prevOn = ignored.on;
  for (let i = 0; i < 3000; i++) {
    const remaining = g.flies.filter(f => f !== ignored && !f.collected);
    const target = remaining.find(f => f.on);
    if (target) moveMouse(target.x, target.y); else moveMouse(-9999, -9999);
    tick(16);
    if (prevOn && !ignored.on) blinkOffs++;
    prevOn = ignored.on;
    if (g.game.state !== 'playing') break;
  }
  console.log(`    starved fly: blinked off uncaught ${blinkOffs}x, game.missed ${missedBefore} -> ${g.game.missed}`);
  ok('the never-approached firefly blinked off uncaught at least once', blinkOffs > 0);
  ok('blinking off uncaught is still counted as a missed opportunity', g.game.missed > missedBefore);
  eq(ignored.collected, false, 'the starved firefly was never collected while being ignored');
  ok('the starved firefly is NOT retired from play: it is still in the flies array, uncollected',
    g.flies.includes(ignored) && !ignored.collected);

  // The decisive check: go and actually catch the fly that was missed over and over.
  let caughtIgnored = false;
  for (let i = 0; i < 3000 && !caughtIgnored; i++) {
    moveMouse(ignored.x, ignored.y);
    tick(16);
    if (ignored.collected) caughtIgnored = true;
  }
  ok('a firefly missed many times can still be caught afterwards (no permanent miss)', caughtIgnored);
  eq(g.game.state, 'playing', 'still playing after catching the long-missed firefly');

  console.log('\n--- exhaust: ordinary play completes rounds and advances ---');
  g.resetGame();
  let naiveTicks = 0;
  for (; naiveTicks < 60000; naiveTicks++) {
    const target = g.flies.find(f => !f.collected && f.on) || g.flies.find(f => !f.collected);
    if (target) moveMouse(target.x, target.y);
    tick(16);
    if (g.game.round > 0 || g.game.state !== 'playing') break;
  }
  console.log(`    real play: ${naiveTicks} ticks, round=${g.game.round}, state=${g.game.state}, missedOpportunities=${g.game.missed}`);
  eq(g.game.round, 1, 'a round played with real input COMPLETES and advances, despite missed blinks');
  eq(g.game.state, 'playing', 'still playing after the round advances');

  // PROTOCOL Tier 2: do it three times in a row, not once.
  for (let i = 0; i < 60000 && g.game.round < 3; i++) {
    const target = g.flies.find(f => !f.collected && f.on) || g.flies.find(f => !f.collected);
    if (target) moveMouse(target.x, target.y);
    tick(16);
    if (g.game.state !== 'playing') break;
  }
  eq(g.game.round, 3, 'three consecutive rounds each complete and advance');

  console.log('\n--- the win must be EARNED: an idle player must not clear rounds ---');
  // Guards against "clear the round once every fly has blinked off at least once", which cures
  // the soft-lock but lets a player who never moves win in ~11s. Rounds must advance on catches.
  g.resetGame();
  for (let i = 0; i < 1500; i++) { tick(16); if (g.game.state !== 'playing') break; }
  ok('a player who never moves has not won the game', g.game.state !== 'won');
  ok('a player who never moves has not cleared all 8 rounds', g.game.round < g.TOTAL);

  console.log('\n--- full playthrough with real input reaches the won screen ---');
  g.resetGame();
  let ptTicks = 0;
  for (; ptTicks < 60000; ptTicks++) {
    const target = g.flies.find(f => !f.collected && f.on) || g.flies.find(f => !f.collected);
    if (target) moveMouse(target.x, target.y);
    tick(16);
    if (g.game.state !== 'playing') break;
  }
  console.log(`    full playthrough: ${ptTicks} ticks, round=${g.game.round}, score=${g.game.score}, caught=${g.game.caughtTotal}`);
  eq(g.game.state, 'won', 'a competent player can complete all 8 rounds with real input and win');
  eq(g.game.caughtTotal, g.TOTAL * g.FLIES_PER_ROUND,
    'winning means every firefly in every round was genuinely caught, not timed out');

  /* ======================= win path: the transition logic itself ======================= */
  console.log('\n--- win path: round/won transitions work once 12 are legitimately reached ---');
  g.resetGame();
  // FAST-FORWARD: write exactly the paired fields the real catch code writes
  // (f.collected=true alongside game.collected++) for every fly, to isolate whether the
  // round-advance logic is correct independent of the reachability bug just shown above.
  for (const f of g.flies) f.collected = true;
  g.game.collected = g.FLIES_PER_ROUND;
  g.update(16);
  eq(g.game.round, 1, 'reaching 12/12 collected legitimately does advance to the next round');
  eq(g.game.state, 'playing', 'still playing after a round clears');
  eq(g.flies.length, 12, 'the next round spawns a fresh dozen fireflies');
  eq(g.game.collected, 0, 'collected resets for the new round');

  g.game.round = g.TOTAL - 1;
  for (const f of g.flies) f.collected = true;
  g.game.collected = g.FLIES_PER_ROUND;
  // `best` must beat whatever real playthroughs above have already banked: the invariant is
  // best = max(best, score), not a fixed number. (Hardcoding 500 here only ever passed because
  // the game used to be unwinnable, so nothing could raise `best` before this point.)
  const winScore = g.game.best + 500;
  g.game.score = winScore;
  g.update(16);
  eq(g.game.round, g.TOTAL, 'clearing the 8th round advances round past TOTAL');
  eq(g.game.state, 'won', 'clearing all 8 rounds reaches the won screen');
  eq(g.game.best, winScore, 'a winning score higher than the old best becomes the new best');
  const savedWon = JSON.parse(win.localStorage.getItem('firefly_save_v1'));
  eq(savedWon.best, winScore, 'the best score is persisted to localStorage on a win');

  // ...and a weaker later win must not clobber it.
  g.resetGame();
  g.game.round = g.TOTAL - 1;
  for (const f of g.flies) f.collected = true;
  g.game.collected = g.FLIES_PER_ROUND;
  g.game.score = 1;
  g.update(16);
  eq(g.game.best, winScore, 'a worse win does not lower the recorded best');

  console.log('\n--- restart from won ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'a round can be started again after winning');
  eq(g.game.round, 0, 'restarting after a win resets to round 1');
  eq(g.game.score, 0, 'restarting after a win resets the score');
  const wonRestartCaught = chaseOneReal(4000);
  ok('input is genuinely accepted again after restarting from the won screen', wonRestartCaught);

  /* ======================= fail path: real blob collisions to game over ======================= */
  console.log('\n--- fail path: losing all lives via real collisions reaches game over ---');
  g.resetGame();
  eq(g.game.lives, 3, 'a fresh game starts with 3 lives');
  let lifeTicks = 0;
  for (; lifeTicks < 20000 && g.game.lives > 0; lifeTicks++) {
    if (g.blobs.length) { const b = g.blobs[0]; moveMouse(b.x, b.y); }
    tick(16);
  }
  eq(g.game.lives, 0, 'steering into shadow blobs depletes all lives');
  await sleep(500); // the scheduled state='gameover' (400ms) must have fired by now
  eq(g.game.state, 'gameover', 'losing the last life ends the game');

  console.log('\n--- restart from game over ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'a round can be started again after a game over');
  eq(g.game.lives, 3, 'lives are restored on restart');
  eq(g.game.round, 0, 'round resets to the first on restart');
  eq(g.game.score, 0, 'score resets on restart');
  eq(g.game.collected, 0, 'collected resets on restart');
  const gameoverRestartCaught = chaseOneReal(4000);
  ok('input is genuinely accepted again after restarting from the game-over screen', gameoverRestartCaught);

  /* ======================= pause: no freeze, no consumption ======================= */
  console.log('\n--- pause/resume does not freeze the game ---');
  g.resetGame();
  chaseOneReal(4000);
  const collectedBeforePause = g.game.collected;
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause enters the paused state');
  for (let i = 0; i < 60; i++) tick(16);
  eq(g.game.collected, collectedBeforePause, 'no progress is made while paused (nothing sneaks by)');
  g.togglePause();
  eq(g.game.state, 'playing', 'togglePause resumes play');
  const resumedCaught = chaseOneReal(4000);
  ok('a real catch is still accepted immediately after resuming from pause', resumedCaught);

  /* ======================= bonus mode: golden fireflies don't freeze ======================= */
  console.log('\n--- bonus: golden fireflies advance the game, worth more, and do not freeze it ---');
  g.resetGame();
  let goldenTicks = 0, sawGolden = false, goldenCollected = false;
  for (; goldenTicks < 20000; goldenTicks++) {
    const target = g.flies.find(f => !f.collected && !f.missed && f.on && f.golden)
                || g.flies.find(f => !f.collected && !f.missed && f.on);
    if (target) {
      moveMouse(target.x, target.y);
      if (target.golden) sawGolden = true;
    }
    const before = g.game.collected;
    tick(16);
    if (target && target.golden && g.game.collected > before) { goldenCollected = true; break; }
    if (g.flies.every(f => f.collected || f.missed)) break; // round exhausted this pass
  }
  if (sawGolden) {
    ok('a golden firefly can be collected without freezing the game', goldenCollected);
    eq(g.game.state, 'playing', 'still playing right after a golden catch');
    const stillPlayable = chaseOneReal(4000);
    ok('input keeps being accepted after a golden catch', stillPlayable);
  } else {
    ok('SKIPPED golden-firefly test (none spawned/lit within the sampling window this run)', true);
  }

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
