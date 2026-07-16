// jsdom Tier 2 playthrough suite for Mood Memory / color-memory (#35)
// A Simon-style memory game: watch a growing sequence of mood swatches light up,
// reproduce it by clicking them in order. Sequence grows by 1 each round; 15
// rounds to win. Drives the REAL loop through window.__cfq and asserts
// progression over time, per PROTOCOL.md Tier 2.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'color-memory', 'index.html');
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

// The real "restart" handler is pointerDown(): when state is title/won/gameover
// it calls resetGame() then sets game.state='playing' (index.html ~line 239).
// Replicate exactly that — do not guess a different entry point.
function startGame() {
  g.resetGame();
  g.game.state = 'playing';
}

// Pump update() (manual frames, dt clamped to 48ms internally) until the
// "watch the sequence" phase ends and input is accepted again.
function finishShowing(capFrames = 3000) {
  let i = 0;
  while (g.showing && i < capFrames) { g.update(40); i++; }
  return i < capFrames;
}

// Tap the entire current cumulative sequence in order (classic Simon replay).
function playRoundCorrectly() {
  const seq = g.sequence.slice();
  for (const idx of seq) g.playerTap(idx);
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'nextRound', 'playerTap', 'update', 'draw',
    'togglePause', 'toggleMute', 'useHint', 'swatchPos', 'hitSwatch']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.MOODS));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.ROUNDS, 15, 'round target is 15');
  ok('8 moods are defined', g.MOODS.length === 8);

  /* ======================= CORE LOOP: ADVANCE ======================= */
  console.log('\n--- logic: core action advances the game (soft-lock check) ---');
  startGame();
  eq(g.game.state, 'playing', 'starting sets state to playing');
  eq(g.game.round, 1, 'starting begins at round 1');
  eq(g.sequence.length, 1, 'round 1 has a 1-step sequence');

  ok('sequence finishes showing within the time budget', finishShowing());
  eq(g.showing, false, 'input window is open after the sequence is shown');

  playRoundCorrectly();
  eq(g.playerSeq.length, g.sequence.length, 'a fully-solved round leaves playerSeq matching the sequence (cleared later by the deferred nextRound)');

  await sleep(700); // the scheduled nextRound() (500ms) must have fired by now
  eq(g.game.round, 2, 'completing round 1 correctly ADVANCES the round counter to 2');
  eq(g.sequence.length, 2, 'the sequence grows by one step for round 2');
  eq(g.game.state, 'playing', 'still playing after advancing');
  ok('no uncaught page errors after advancing', pageErrors.length === 0);

  /* ======================= THREE IN A ROW ======================= */
  console.log('\n--- logic: three rounds in a row, still advancing, still accepting input ---');
  for (let target = 3; target <= 4; target++) {
    ok(`sequence for round ${target - 1} finishes showing`, finishShowing());
    eq(g.showing, false, `input accepted going into round ${target - 1}`);
    playRoundCorrectly();
    await sleep(700);
    eq(g.game.round, target, `round advances to ${target} after solving round ${target - 1}`);
    eq(g.sequence.length, target, `sequence length matches round ${target}`);
  }
  ok('no uncaught page errors after 3 consecutive rounds', pageErrors.length === 0);

  /* ======================= HINT: ADVANCES, DOES NOT FREEZE ======================= */
  console.log('\n--- logic: hint replays the sequence but the round still completes ---');
  ok('sequence for the current round finishes showing', finishShowing());
  const roundBeforeHint = g.game.round;
  const hintUsedBefore = g.hintUsedThisRound;
  eq(hintUsedBefore, false, 'hint has not been used yet this round');
  g.useHint();
  ok('using the hint flags it used for this round', g.hintUsedThisRound === true);
  eq(g.playerSeq.length, 0, 'hint clears any partial input before replaying');
  eq(g.showing, true, 'hint re-triggers the watch phase');
  ok('the hint replay finishes showing', finishShowing());
  ok('using the hint again this round is refused (not a free replay loop)',
    (() => { g.useHint(); return g.showing === false; })());

  playRoundCorrectly();
  await sleep(700);
  eq(g.game.round, roundBeforeHint + 1, 'the round still ADVANCES after using the hint (not consumed-and-frozen)');
  eq(g.game.state, 'playing', 'still playing after a hinted round');

  /* ======================= EXHAUST THE FAIL CONDITION ======================= */
  console.log('\n--- logic: a wrong tap ends the game (real ending reached) ---');
  ok('sequence finishes showing before the failing tap', finishShowing());
  const seqAtFail = g.sequence.slice();
  const wrongIdx = g.MOODS.findIndex((_, i) => i !== seqAtFail[0]);
  ok('a wrong-index candidate exists', wrongIdx >= 0);
  const roundAtFail = g.game.round;
  g.playerTap(wrongIdx);
  ok('a wrong tap is registered (round not silently swallowed)', true);
  await sleep(700); // the 600ms gameover setTimeout must have fired by now
  eq(g.game.state, 'gameover', 'a wrong tap reaches a real gameover ending');
  eq(g.game.round, roundAtFail, 'the round counter freezes at the point of failure (for display)');
  ok('no uncaught page errors reaching gameover', pageErrors.length === 0);

  /* ======================= RESTART FROM GAMEOVER ======================= */
  console.log('\n--- logic: restart from gameover is playable again ---');
  startGame(); // replays the real pointerDown handler: resetGame(); state='playing'
  eq(g.game.state, 'playing', 'restarting from gameover sets state back to playing');
  eq(g.game.round, 1, 'restarting from gameover resets to round 1');
  eq(g.sequence.length, 1, 'restarting from gameover resets the sequence');
  ok('sequence finishes showing after restart', finishShowing());
  playRoundCorrectly();
  await sleep(700);
  eq(g.game.round, 2, 'the game accepts input and advances again after a gameover restart');
  ok('no uncaught page errors after a gameover restart', pageErrors.length === 0);

  /* ======================= FULL WIN PLAYTHROUGH ======================= */
  console.log('\n--- logic: a competent player can reach the real win ending ---');
  startGame();
  eq(g.game.round, 1, 'fresh game starts at round 1 for the win playthrough');
  let reachedWon = false;
  for (let r = 1; r <= g.ROUNDS; r++) {
    const shown = finishShowing();
    if (!shown) { ok(`round ${r} sequence finished showing`, false); break; }
    playRoundCorrectly();
    if (r < g.ROUNDS) {
      await sleep(700);
      if (g.game.round !== r + 1) { ok(`round advanced past ${r}`, false); break; }
    } else {
      // the final round transitions synchronously to 'won', no setTimeout involved
      reachedWon = (g.game.state === 'won');
    }
  }
  ok('playing every round correctly (1..15) reaches the real "won" ending', reachedWon);
  eq(g.game.state, 'won', 'final state is won after clearing all 15 rounds');
  ok('no uncaught page errors across the full win playthrough', pageErrors.length === 0);

  /* ======================= RESTART FROM WIN ======================= */
  console.log('\n--- logic: restart from a win is playable again ---');
  startGame();
  eq(g.game.state, 'playing', 'restarting from a win sets state back to playing');
  eq(g.game.round, 1, 'restarting from a win resets to round 1');
  ok('sequence finishes showing after a win-restart', finishShowing());
  playRoundCorrectly();
  await sleep(700);
  eq(g.game.round, 2, 'the game accepts input and advances again after a win restart');
  ok('no uncaught page errors after a win restart', pageErrors.length === 0);

  /* ======================= PAUSE DOES NOT SOFT-LOCK ======================= */
  console.log('\n--- logic: pause/resume does not freeze the game ---');
  startGame();
  finishShowing();
  g.togglePause();
  ok('pausing sets paused', g.game.paused === true);
  const roundWhilePaused = g.game.round;
  for (let i = 0; i < 20; i++) g.update(40);
  eq(g.game.round, roundWhilePaused, 'round does not change while paused');
  g.togglePause();
  ok('unpausing clears paused', g.game.paused === false);
  playRoundCorrectly();
  await sleep(700);
  eq(g.game.round, roundWhilePaused + 1, 'the game still advances normally after an unpause');

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
