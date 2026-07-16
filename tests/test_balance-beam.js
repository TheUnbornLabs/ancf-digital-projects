// jsdom Tier-2 playthrough suite for Balance Beam (#37)
// Drives the real loop through window.__cfq: resetGame, placeFalling, update.
// Asserts PROGRESSION (survived time, score, state transitions) rather than setup.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'balance-beam', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }

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
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Run update() until a new falling weight appears (or give up after maxIters).
function untilFalling(maxIters = 400) {
  for (let i = 0; i < maxIters && !g.falling; i++) g.update(16);
  return !!g.falling;
}

// Place the current falling weight on the side that pushes the RUNNING SUM of
// (val*dx) for every weight ever placed back toward zero -- the best an
// omniscient player could do, since dx magnitude is chosen by the game (rng)
// and only the left/right side is under player control.
function placeBestEffortCorrective() {
  if (!g.falling) return false;
  const valSign = g.falling.val >= 0 ? 1 : -1;
  const currentSum = g.weights.reduce((a, w) => a + w.val * w.dx, 0);
  const desiredProductSign = currentSum > 0 ? -1 : (currentSum < 0 ? 1 : 1);
  const sideSign = desiredProductSign * valSign;
  g.placeFalling(sideSign < 0);
  return true;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'placeFalling', 'update', 'draw', 'setSeed']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game);
  ok('no uncaught page errors on load', pageErrors.length === 0);

  console.log('\n--- logic: the core action (placing a weight) ---');
  g.setSeed(1);
  g.resetGame(false);
  eq(g.game.state, 'playing', 'resetGame(false) starts a playing round');
  ok('a falling weight is present at round start', !!g.falling);
  const score0 = g.game.score;
  ok('placing the weight is accepted', (() => { g.placeFalling(true); return true; })());
  ok('falling is cleared after placement', g.falling === null);
  ok('placing a weight changes the score', g.game.score !== score0);

  console.log('\n--- logic: does ONE legitimate placement survive to the next spawn? ---');
  // A competent player's very first, single, ordinary placement should not by
  // itself end the game before a second (corrective) weight can even arrive.
  // Drive time forward and see whether the round is still playable.
  let stillPlayingAt1s = null, frameOfGameOver = null;
  for (let i = 0; i < 200; i++) {   // ~3.2s of simulated play, past the ~2.8s first spawn interval
    g.update(16);
    if (g.game.state !== 'playing' && frameOfGameOver === null) frameOfGameOver = i;
    if (i === 62) stillPlayingAt1s = (g.game.state === 'playing'); // ~1.0s mark
  }
  ok('EXPECTED (per game design): the round survives past 1 second on a single ordinary placement',
    stillPlayingAt1s === true);
  eq(g.game.state, 'playing', 'EXPECTED: still playing ~3.2s after one ordinary placement, i.e. input is still meaningful');
  if (frameOfGameOver !== null) console.log(`    observed: gameover reached at frame ${frameOfGameOver} (~${(frameOfGameOver*16/1000).toFixed(2)}s) after a single placement`);

  console.log('\n--- logic: three placements in a row, still advancing ---');
  g.setSeed(2);
  g.resetGame(false);
  let placementsLanded = 0, threeInARowStillPlaying = true;
  for (let round = 0; round < 3; round++) {
    if (!untilFalling()) { threeInARowStillPlaying = false; break; }
    if (g.game.state !== 'playing') { threeInARowStillPlaying = false; break; }
    g.placeFalling(round % 2 === 0);   // alternate sides, a plausible player heuristic
    placementsLanded++;
  }
  ok('EXPECTED: three placements in a row are all reachable with the game still playing throughout',
    placementsLanded === 3 && threeInARowStillPlaying);
  console.log(`    observed: ${placementsLanded}/3 placements landed before the round stopped accepting input (state=${g.game.state})`);

  console.log('\n--- logic: exhaust the fail condition -> a real ending ---');
  g.setSeed(3);
  g.resetGame(false);
  eq(g.game.lives, 3, 'round starts with 3 lives');
  let guard = 0;
  while (g.game.state === 'playing' && guard < 20000) {
    guard++;
    if (g.falling) g.placeFalling(guard % 2 === 0);
    g.update(16);
  }
  eq(g.game.state, 'gameover', 'losing all lives reaches a real gameover ending');
  eq(g.game.lives, 0, 'gameover happens exactly when lives hit 0');
  ok('gameover records a best score', g.game.best >= g.game.score);

  console.log('\n--- logic: restart from that ending is playable again ---');
  g.resetGame(false);
  eq(g.game.state, 'playing', 'resetGame from gameover returns to playing');
  eq(g.game.lives, 3, 'lives are restored on restart');
  eq(g.game.score, 0, 'score resets on restart');
  eq(g.game.survived, 0, 'survived resets on restart');
  eq(g.weights.length, 0, 'weights are cleared on restart (no stale beam state)');
  ok('a fresh falling weight is spawned on restart', !!g.falling);
  const scoreBeforeRestartPlace = g.game.score;
  g.placeFalling(true);
  ok('input is accepted again after restart', g.falling === null);
  ok('the post-restart placement actually changes score', g.game.score !== scoreBeforeRestartPlace);
  for (let i = 0; i < 50; i++) g.update(16);
  ok('time advances again after restart', g.game.survived > 0);

  console.log('\n--- logic: is the 60s win screen reachable through legitimate interactive play? ---');
  // Best-effort strategy: an "omniscient" player who always picks the side
  // that pushes the running net torque of every weight ever placed back
  // toward zero (the best possible use of the only control the player has --
  // left/right side choice; the fall distance itself is chosen by the game).
  let anyWin = false, bestSurvived = 0, winCount = 0;
  const N_TRIALS = 25;
  for (let t = 0; t < N_TRIALS; t++) {
    g.setSeed(1000 + t * 37);
    g.resetGame(false);
    let gg = 0;
    while (g.game.state === 'playing' && gg < 20000) {
      gg++;
      if (g.falling) placeBestEffortCorrective();
      g.update(16);
    }
    if (g.game.survived > bestSurvived) bestSurvived = g.game.survived;
    if (g.game.state === 'won') { anyWin = true; winCount++; }
  }
  ok(`EXPECTED: at least one of ${N_TRIALS} best-effort interactive playthroughs reaches 'won'`, anyWin);
  console.log(`    observed: ${winCount}/${N_TRIALS} wins via interactive play; best survived time = ${bestSurvived.toFixed(2)}s (need 60s)`);

  console.log('\n--- logic: control -- never placing any weight at all ---');
  g.setSeed(4);
  g.resetGame(false);
  let noTouchGuard = 0;
  while (g.game.state === 'playing' && noTouchGuard < 5000) { noTouchGuard++; g.update(16); }
  console.log(`    observed: never touching the screen -> state='${g.game.state}', survived=${g.game.survived.toFixed(1)}s, score=${g.game.score}`);
  ok('control check ran to completion', g.game.state === 'won' || g.game.state === 'gameover');

  console.log('\n--- logic: bonus/endless mode advances rather than freezing ---');
  g.setSeed(5);
  g.resetGame(true);   // this is what pressing "E" on the won screen calls
  eq(g.game.state, 'playing', 'endless mode starts in the playing state');
  eq(g.game.endless, true, 'endless flag is set');
  eq(g.game.score, 0, 'endless mode starts with a fresh score');
  ok('endless round has a falling weight to interact with', untilFalling());
  const endlessScore0 = g.game.score;
  g.placeFalling(true);
  ok('placement is accepted in endless mode', g.falling === null);
  ok('placement changes score in endless mode', g.game.score !== endlessScore0);
  // endless mode should not silently freeze -- it should keep processing
  // update()/placeFalling() calls (whatever the outcome) rather than stop
  // responding altogether.
  let endlessGuard = 0, endlessResponsive = true;
  while (endlessGuard < 500) {
    endlessGuard++;
    if (g.falling) { const before = g.falling; g.placeFalling(endlessGuard % 2 === 0); if (g.falling === before) { endlessResponsive = false; break; } }
    g.update(16);
    if (g.game.state !== 'playing') break;   // endless also has a real gameover; that's a valid, non-frozen outcome
  }
  ok('endless mode keeps accepting/processing input (does not freeze) even though it can still end in gameover',
    endlessResponsive);

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
