// jsdom Tier 2 playthrough suite for Weight Scale (#46)
// Core loop: drag "expectation" weights onto RELEASE (trash), drag "value" weights
// onto KEEP (value). Correct/incorrect both mark a weight disposed. A round ends when
// every weight is disposed; rounds 1-4 auto-advance via a real 650ms setTimeout inside
// checkDone(), round 5 completing sets state='won' immediately. Running the clock to 0
// while state==='playing' sets state='gameover'. Restart is wired through the canvas
// 'mousedown' handler (onDown), which calls the real resetGame() when state is
// title/won/gameover -- NOT exposed directly on the hook, so we dispatch a real DOM
// event at it rather than guessing an entry point (see PROTOCOL.md's stale-reference /
// guessed-entry-point warnings).
//
// This game has no skip/hint/power-up. The only optional control is Pause, so item 5
// of the Tier 2 minimum bar is satisfied by verifying pause suspends progress without
// permanently freezing it (unpausing resumes normally).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'weight-scale', 'index.html');
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

// same round-composition formula as buildRound(), used only to size expectations
function expectedCount(r) { return (4 + r * 2) + Math.min(r + 1, 5); }
function correctZoneFor(w) { return w.type === 'exp' ? 'trash' : 'value'; }

// Drop every current weight in its CORRECT zone via the hook's real dispose() --
// the same function onUp() calls on a real drop. Snapshot first: dispose() mutates
// game state (and the last call may trigger a round transition) but never removes
// entries from the array, so iterating a snapshot is safe.
function clearRoundCorrectly() {
  const snap = g.weights.slice();
  for (const w of snap) g.dispose(w, correctZoneFor(w));
  return snap;
}

// Real player restart: dispatch an actual 'mousedown' DOM event at the canvas,
// exercising onDown() itself (not a hook shortcut) so the real restart guard runs.
function clickCanvasRestart() {
  const canvas = win.document.getElementById('game');
  const evt = new win.MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 1, clientY: 1 });
  canvas.dispatchEvent(evt);
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'dispose', 'checkDone', 'hitWeight', 'update', 'draw', 'togglePause', 'toggleMute', 'tileSize']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.weights));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  ok('EXPECTATIONS and VALUES word banks are non-empty and disjoint',
    g.EXPECTATIONS.length > 0 && g.VALUES.length > 0 &&
    g.EXPECTATIONS.every(x => !g.VALUES.includes(x)));

  let drewOk = true;
  for (const st of ['title', 'playing', 'roundClear', 'won', 'gameover']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  try { g.game.state = 'playing'; g.game.paused = true; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in paused overlay: ' + e.message); }
  g.resetGame();
  ok('draw() runs in every state (incl. paused overlay) without throwing', drewOk);

  g.resetGame();
  let updateOk = true;
  try { for (const dt of [0, 16, 16.7, 1000, -5, 5000]) g.update(dt); for (let i = 0; i < 300; i++) g.update(16); }
  catch (e) { updateOk = false; console.log('    update threw: ' + e.message); }
  ok('update() tolerates odd dt and long runs', updateOk);

  /* ======================= LOGIC: setup ======================= */
  console.log('\n--- logic: setup ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame sets state to playing');
  eq(g.game.round, 1, 'resetGame starts at round 1');
  eq(g.game.score, 0, 'resetGame resets score');
  eq(g.game.paused, false, 'resetGame clears paused');
  eq(g.weights.length, expectedCount(1), 'round 1 has the expected weight count');
  ok('all weights start un-disposed', g.weights.every(w => !w.disposed));
  ok('both expectation and value weights are present', g.weights.some(w => w.type === 'exp') && g.weights.some(w => w.type === 'val'));

  /* ======================= LOGIC: core loop advances ======================= */
  console.log('\n--- logic: core loop (does clearing a round advance the game?) ---');
  g.resetGame();
  const round0 = g.game.round;
  const score0 = g.game.score;
  clearRoundCorrectly();
  ok('disposing every weight correctly raises the score', g.game.score > score0);
  ok('all weights in the round are marked disposed', g.weights.every(w => w.disposed));
  eq(g.game.state, 'roundClear', 'clearing round 1 (of 5) enters the roundClear transition, not a freeze');

  await sleep(800);   // checkDone()'s real 650ms setTimeout must have fired by now
  eq(g.game.round, round0 + 1, 'the round number actually advances after the transition');
  eq(g.game.state, 'playing', 'the game is back in playing state after advancing');
  eq(g.weights.length, expectedCount(round0 + 1), 'the new round has a freshly built (larger) weight set');
  ok('the new round starts fully un-disposed', g.weights.every(w => !w.disposed));
  ok('the timer resets for the new round', g.game.timeLeft === g.game.roundTime && g.game.timeLeft > 0);

  console.log('\n--- logic: input is still accepted after advancing ---');
  const wA = g.weights.find(w => !w.disposed);
  const scoreBeforeA = g.game.score;
  g.dispose(wA, correctZoneFor(wA));
  ok('a single weight can still be disposed on the new round', wA.disposed === true && g.game.score > scoreBeforeA);
  ok('hitWeight still finds live weights by position', (() => {
    const live = g.weights.find(w => !w.disposed);
    if (!live) return true;
    return g.hitWeight(live.x, live.y) === live;
  })());

  /* ======================= LOGIC: three advances in a row ======================= */
  console.log('\n--- logic: three consecutive round-clears (still advancing, still accepting input) ---');
  g.resetGame();
  let prevRound = g.game.round;
  let prevScore = g.game.score;
  for (let i = 0; i < 3; i++) {
    clearRoundCorrectly();
    ok(`round ${prevRound}: clearing it raises score (pass ${i + 1}/3)`, g.game.score > prevScore);
    await sleep(800);
    ok(`round ${prevRound}: game advances to round ${prevRound + 1} (pass ${i + 1}/3)`, g.game.round === prevRound + 1 && g.game.state === 'playing');
    ok(`round ${prevRound + 1}: fresh weights are all live and interactive (pass ${i + 1}/3)`, g.weights.length > 0 && g.weights.every(w => !w.disposed));
    prevRound = g.game.round;
    prevScore = g.game.score;
  }
  eq(g.game.round, 4, 'three successive clears from round 1 land on round 4');

  console.log('\n--- logic: an incorrect drop still counts toward round completion (mistakes do not soft-lock a round) ---');
  g.resetGame();
  const wrongSnap = g.weights.slice();
  const streakBefore = g.game.streak;
  for (const w of wrongSnap) g.dispose(w, w.type === 'exp' ? 'value' : 'trash'); // every drop deliberately wrong
  ok('every weight is still marked disposed after wrong-zone drops', wrongSnap.every(w => w.disposed));
  ok('wrong drops still trigger the round-complete transition', g.game.state === 'roundClear');
  eq(g.game.streak, 0, 'wrong drops reset the streak (score-only consequence, not a lock)');
  await sleep(800);
  eq(g.game.round, 2, 'the round advances even though every weight was mis-sorted');

  /* ======================= LOGIC: exhausting the fail condition ======================= */
  console.log('\n--- logic: win ending (clear all 5 rounds) ---');
  g.resetGame();
  for (let r = 1; r <= 5; r++) {
    ok(`round ${r} is reachable and has live weights`, g.game.round === r && g.game.state === 'playing' && g.weights.length > 0);
    clearRoundCorrectly();
    if (r < 5) {
      eq(g.game.state, 'roundClear', `round ${r}/5 clear enters the transition screen`);
      await sleep(800);
    }
  }
  eq(g.game.state, 'won', 'clearing round 5 ends the game in the won state (no further wait needed)');
  ok('the winning score was saved as best', win.localStorage.getItem('weightscale_best') === String(g.game.score));

  console.log('\n--- logic: lose ending (run the clock out) ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'a fresh game after a win is playable again');
  let ticks = 0;
  while (g.game.state === 'playing' && ticks < 5000) { g.update(48); ticks++; }
  eq(g.game.state, 'gameover', 'letting the round timer expire reaches a real game-over ending');
  ok('reaching game over took a bounded, sane number of updates', ticks > 0 && ticks < 5000);
  ok('the score at time of loss was saved as best if it was a new high', win.localStorage.getItem('weightscale_best') !== null);

  /* ======================= LOGIC: restart from either ending ======================= */
  console.log('\n--- logic: restart from game-over is a real DOM click, not a hook shortcut ---');
  eq(g.game.state, 'gameover', 'precondition: we are on the gameover screen');
  clickCanvasRestart();
  eq(g.game.state, 'playing', 'clicking the canvas on the gameover screen restarts the game');
  eq(g.game.round, 1, 'restarting resets to round 1');
  eq(g.game.score, 0, 'restarting resets the score');
  eq(g.game.paused, false, 'restarting clears any stuck paused flag');
  ok('restarting rebuilds a live, interactive weight set', g.weights.length === expectedCount(1) && g.weights.every(w => !w.disposed));
  const wR = g.weights.find(w => !w.disposed);
  g.dispose(wR, correctZoneFor(wR));
  ok('input is accepted again immediately after restarting', wR.disposed === true && g.game.score > 0);

  console.log('\n--- logic: restart from the won screen also works ---');
  g.resetGame();
  for (let r = 1; r <= 5; r++) {
    clearRoundCorrectly();
    if (r < 5) await sleep(800);
  }
  eq(g.game.state, 'won', 'precondition: we are on the won screen');
  clickCanvasRestart();
  eq(g.game.state, 'playing', 'clicking the canvas on the won screen restarts the game');
  eq(g.game.round, 1, 'restarting from a win resets to round 1');
  const wR2 = g.weights.find(w => !w.disposed);
  g.dispose(wR2, correctZoneFor(wR2));
  ok('input is accepted again after restarting from a win', wR2.disposed === true);

  console.log('\n--- logic: title screen click also starts the game (first entry point) ---');
  g.game.state = 'title';
  clickCanvasRestart();
  eq(g.game.state, 'playing', 'clicking the canvas on the title screen starts the game');

  /* ======================= LOGIC: pause (this game's only optional control) ======================= */
  console.log('\n--- logic: pause suspends progress but never permanently freezes it ---');
  g.resetGame();
  const timeAtPause = g.game.timeLeft;
  const scoreAtPause = g.game.score;
  g.togglePause();
  eq(g.game.paused, true, 'togglePause pauses the game');
  for (let i = 0; i < 50; i++) g.update(16);
  eq(g.game.timeLeft, timeAtPause, 'time does not advance while paused');
  eq(g.game.score, scoreAtPause, 'score does not change while paused (nothing silently happens)');
  g.togglePause();
  eq(g.game.paused, false, 'togglePause resumes the game');
  g.update(16);
  ok('time resumes ticking after unpausing', g.game.timeLeft < timeAtPause);
  const wP = g.weights.find(w => !w.disposed);
  g.dispose(wP, correctZoneFor(wP));
  ok('dropping a weight after unpausing still advances the game (pause did not consume-and-freeze it)', wP.disposed === true && g.game.score > scoreAtPause);

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
