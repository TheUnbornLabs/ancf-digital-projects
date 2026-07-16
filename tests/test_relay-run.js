// jsdom Tier-2 playthrough suite for Relay Run (#93)
// Endless-runner: click/tap to jump hurdles labelled with obligations, run through
// value gates for a streak bonus, clear DIST_PER_ROUND distance x TOTAL rounds, 3 lives.
// Drives the real loop via window.__cfq: resetGame / jump / update / draw.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'relay-run', 'index.html');
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
    w.requestAnimationFrame = () => 0;   // disable the auto-loop; we drive update() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;          // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Run update() in a tight synchronous loop until a predicate is satisfied (no real time
// passes between calls -> any pending setTimeout()-based transition has NOT fired yet).
function fastForward(predicate, dt = 16.7, cap = 5000) {
  let i = 0;
  while (!predicate() && i < cap) { g.update(dt); i++; }
  return i;
}
// Run update() at a realistic ~16ms real-wall-clock cadence for `ms` of real time,
// exactly the way requestAnimationFrame would drive it in an actual browser.
async function realtimeFrames(ms, dt = 16.7) {
  const start = Date.now();
  let frames = 0;
  while (Date.now() - start < ms) { g.update(dt); frames++; await sleep(16); }
  return frames;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API',
    ['resetGame', 'buildRound', 'jump', 'update', 'draw', 'togglePause', 'toggleMute']
      .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game/player/obstacles state', !!g.game && 'player' in g && 'obstacles' in g);
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.game.state, 'title', 'game boots into the title screen');
  eq(g.TOTAL, 10, 'ten rounds configured');
  eq(g.DIST_PER_ROUND, 2000, 'distance-per-round configured');

  let drewOk = true;
  g.resetGame();
  for (const st of ['title', 'playing', 'paused', 'won', 'gameover']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  ok('draw() runs in every state without throwing', drewOk);
  g.resetGame();   // clear the forced states before the real tests start

  /* ======================= CORE LOOP ======================= */
  console.log('\n--- logic: core loop (jump input + time-based progression) ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts a round in the playing state');
  eq(g.game.round, 0, 'round starts at 0');
  eq(g.game.lives, 3, 'round starts with 3 lives');
  eq(g.game.dist, 0, 'round starts at distance 0');
  ok('player starts standing on the ground', g.player.onGround === true);

  const distBefore = g.game.dist;
  fastForward(() => g.game.dist > distBefore + 100);
  ok('distance advances the longer the round runs', g.game.dist > distBefore);

  g.jump();
  ok('the core action (jump) leaves the ground', g.player.onGround === false);
  ok('the core action (jump) sets upward velocity', g.player.vy < 0);
  fastForward(() => g.player.onGround === true, 16.7, 200);
  ok('the player returns to the ground after the jump arc completes', g.player.onGround === true);
  eq(g.game.state, 'playing', 'still playing after a jump cycle');

  console.log('\n--- logic: do it three times running (still advancing, still accepting input) ---');
  let threeOk = true;
  for (let i = 0; i < 3; i++) {
    const d0 = g.game.dist;
    g.jump();
    if (g.player.onGround !== false || g.player.vy >= 0) threeOk = false;
    fastForward(() => g.player.onGround === true, 16.7, 200);
    if (g.player.onGround !== true) threeOk = false;
    if (!(g.game.dist > d0)) threeOk = false;
    if (g.game.state !== 'playing') threeOk = false;
  }
  ok('three consecutive jump cycles all land cleanly, distance keeps advancing, input stays accepted', threeOk);

  /* ======================= ROUND TRANSITION: baseline ======================= */
  console.log('\n--- logic: a single isolated crossing of the finish line advances the round by 1 ---');
  g.resetGame();
  g.game.lives = 999; // isolate the transition from the (separately tested) hurdle-death path
  fastForward(() => g.game.dist >= g.DIST_PER_ROUND - 1);
  const roundBeforeSingle = g.game.round;
  g.update(16.7); // exactly one frame crosses the threshold
  ok('the crossing frame is registered (dist over the line, round not yet advanced)',
    g.game.dist >= g.DIST_PER_ROUND && g.game.round === roundBeforeSingle);
  await sleep(600); // let the scheduled transition fire; deliberately call update() no more
  eq(g.game.round, roundBeforeSingle + 1, 'a single crossing frame advances the round by exactly one');
  eq(g.game.dist, 0, 'the new round starts at distance 0');

  /* ======================= ROUND TRANSITION: sustained frames (real playthrough shape) ======================= */
  console.log('\n--- logic: round transition under realistic sustained frame-stepping ---');
  console.log('    (drives update() at a real ~16ms cadence across the finish line, exactly as a');
  console.log('     real requestAnimationFrame loop would while the game\'s own 400ms transition delay elapses)');
  g.resetGame();
  g.game.lives = 999;
  fastForward(() => g.game.dist >= g.DIST_PER_ROUND - 50);
  const roundBeforeSustained = g.game.round;
  const scoreBeforeSustained = g.game.score;
  const framesRun = await realtimeFrames(500);
  await sleep(500); // drain any timers still pending
  const roundAfterSustained = g.game.round;
  const scoreAfterSustained = g.game.score;
  console.log(`    observed: ${framesRun} realtime frames stepped; round ${roundBeforeSustained} -> ${roundAfterSustained}; score ${scoreBeforeSustained} -> ${scoreAfterSustained}`);
  eq(roundAfterSustained, roundBeforeSustained + 1,
    'completing one round under realistic continuous play still advances the round counter by exactly one');
  ok('completing one round under realistic continuous play awards a single round-completion bonus, not a multiple',
    scoreAfterSustained - scoreBeforeSustained <= 100);

  /* ======================= FAIL CONDITION -> ENDING ======================= */
  console.log('\n--- logic: exhaust the fail condition (lose all 3 lives) -> gameover ---');
  g.resetGame();
  eq(g.game.lives, 3, 'fresh round has 3 lives before the fail-condition test');
  const itersToZero = fastForward(() => g.game.lives <= 0, 16.7, 3000);
  eq(g.game.lives, 0, 'standing still against the hurdle stream drains lives to zero');
  await sleep(600);
  eq(g.game.state, 'gameover', 'losing the last life reaches the gameover ending');
  console.log(`    (lives reached 0 after ${itersToZero} update() calls, dist ${g.game.dist.toFixed(0)})`);

  console.log('\n--- logic: restart from the gameover ending is playable again ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from gameover returns to playing');
  eq(g.game.round, 0, 'restart resets the round counter');
  eq(g.game.lives, 3, 'restart restores full lives');
  eq(g.game.dist, 0, 'restart resets distance');
  g.jump();
  ok('input is accepted immediately after restarting from gameover', g.player.onGround === false);

  console.log('\n--- logic: reach the "won" ending and restart from it ---');
  g.resetGame();
  g.game.lives = 999;
  g.game.round = g.TOTAL - 1; // stand on the last round; drive one clean, isolated crossing
  fastForward(() => g.game.dist >= g.DIST_PER_ROUND - 1);
  g.update(16.7);
  await sleep(600);
  eq(g.game.state, 'won', 'clearing the final round reaches the "won" ending');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from the "won" ending returns to playing');
  eq(g.game.round, 0, 'restart from "won" resets the round counter');

  /* ======================= POWER-UP (DASH / DOUBLE-JUMP) ======================= */
  console.log('\n--- logic: the dash power-up advances rather than consuming and freezing ---');
  g.resetGame();
  g.jump();
  ok('setup: player is airborne before testing the dash', g.player.onGround === false);
  g.game.dashCharge = 5;
  g.game.dashReady = true;
  const vyBeforeDash = g.player.vy;
  g.jump(); // airborne + dashReady -> the double-jump / dash branch
  ok('the dash gives a second upward impulse while airborne', g.player.vy < 0 && g.player.vy !== vyBeforeDash);
  eq(g.game.dashReady, false, 'the dash is consumed (dashReady clears)');
  eq(g.game.dashCharge, 0, 'the dash charge resets after use');
  const framesToLand = fastForward(() => g.player.onGround === true, 16.7, 300);
  ok('the player lands normally after using the dash (no physics freeze)', g.player.onGround === true);
  g.jump();
  ok('a further jump after the dash is still accepted (input is not frozen)',
    g.player.onGround === false && g.player.vy < 0);
  eq(g.game.state, 'playing', 'still playing after the dash sequence');

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
