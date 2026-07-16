// jsdom Tier 2 playthrough suite for Paper Fold (#54)
// Origami puzzle: fold a square along U/D/L/R to match a TARGET w/h within a move budget.
// 10 puzzles, canonical solution per puzzle lives in PUZZLES[i].moves.
// Drives the real loop via window.__cfq: fold(), undoFold(), giveHint(), resetGame(), buildPuzzle().
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'paper-fold', 'index.html');
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
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update()/timers manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Solve the CURRENT puzzle via its own canonical move list. Returns after all folds issued
// (does not wait for the post-solve transition timeout — caller does that).
function solveCurrent() {
  const p = g.PUZZLES[g.game.pIdx];
  for (const dir of p.moves) g.fold(dir);
}

// A direction that does NOT match what the next canonical move needs, so it changes the
// "wrong" axis and won't accidentally satisfy the target (U/D both halve h; L/R both halve w,
// so to genuinely miss we must fold the other axis).
function wrongDir(neededDir) {
  return (neededDir === 'U' || neededDir === 'D') ? 'L' : 'U';
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildPuzzle', 'fold', 'checkSolved', 'undoFold', 'giveHint', 'update', 'draw']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state and puzzle list', !!g.game && Array.isArray(g.PUZZLES));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.PUZZLES.length, g.TOTAL, 'PUZZLES length matches TOTAL');
  eq(g.TOTAL, 10, 'ten puzzles in the set');

  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame lands in the playing state');
  eq(g.game.pIdx, 0, 'resetGame starts at the first puzzle');

  console.log('\n--- logic: core action advances the puzzle (catches soft-locks) ---');
  g.resetGame();
  eq(g.game.pIdx, 0, 'starting puzzle is #0');
  const p0 = g.PUZZLES[0];
  eq(p0.moves.length, 1, 'puzzle 0 is a single fold');
  const scoreBefore = g.game.score;
  g.fold(p0.moves[0]);
  ok('a solving fold marks the puzzle solved', g.game.solved === true);
  ok('a solving fold blocks further input while it animates', g.game.transitioning === true);

  // input really is blocked mid-transition, not just cosmetically
  const pIdxDuringTransition = g.game.pIdx;
  g.fold('L');   // must be a no-op: transitioning guard at the top of fold()
  eq(g.game.pIdx, pIdxDuringTransition, 'a fold during the solve transition is refused');

  await sleep(700);   // the scheduled buildPuzzle(next) (600ms) must have fired by now
  eq(g.game.pIdx, 1, 'completing a puzzle advances to the next puzzle');
  eq(g.game.transitioning, false, 'input is unblocked on the new puzzle');
  eq(g.game.state, 'playing', 'still playing after advancing');
  ok('score increased for the solved puzzle', g.game.score > scoreBefore);
  ok('the new puzzle has a fresh move budget', g.game.movesLeft === g.PUZZLES[1].moves.length);
  eq(g.game.solved, false, 'the new puzzle starts unsolved');

  console.log('\n--- logic: three in a row -> still advancing, still accepting input ---');
  g.resetGame();
  for (let i = 0; i < 3; i++) {
    const startIdx = g.game.pIdx;
    ok(`puzzle ${startIdx}: fold accepted (movesLeft ${g.game.movesLeft} -> solve)`, !g.game.transitioning);
    solveCurrent();
    ok(`puzzle ${startIdx}: solving it set solved`, g.game.solved === true);
    await sleep(700);
    eq(g.game.pIdx, startIdx + 1, `puzzle ${startIdx}: advanced to puzzle ${startIdx + 1}`);
    eq(g.game.transitioning, false, `puzzle ${startIdx}: input unblocked after advancing`);
    eq(g.game.state, 'playing', `puzzle ${startIdx}: still playing`);
  }

  console.log('\n--- logic: exhausting the move budget without solving -> retry, not a freeze ---');
  g.resetGame();
  const pf = g.PUZZLES[0];   // moves:['D'], budget of 1
  const wrong = wrongDir(pf.moves[0]);
  const targetBefore = { ...g.game.target };
  g.fold(wrong);   // spends the only move on the wrong axis
  ok('the wrong-axis fold does not mark the puzzle solved', g.game.solved === false);
  eq(g.game.movesLeft, 0, 'the move budget is exhausted');
  ok('exhausting the budget without solving starts the fail transition', g.game.transitioning === true);
  await sleep(700);
  eq(g.game.pIdx, 0, 'a failed puzzle attempt retries the SAME puzzle (by design, not a game over)');
  eq(g.game.transitioning, false, 'input is unblocked after the retry rebuild');
  eq(g.game.movesLeft, pf.moves.length, 'the move budget is restored on retry');
  ok('the target is unchanged on retry', g.game.target.w === targetBefore.w && g.game.target.h === targetBefore.h);
  // and the player is not stuck: the puzzle is genuinely solvable again
  g.fold(pf.moves[0]);
  ok('after a failed retry, the correct fold solves the puzzle', g.game.solved === true);
  await sleep(700);
  eq(g.game.pIdx, 1, 'the retried puzzle can still be completed and advances normally');

  console.log('\n--- logic: exhaust the real fail condition -> reach a real ending (won) ---');
  g.resetGame();
  for (let i = 0; i < g.TOTAL; i++) {
    eq(g.game.pIdx, i, `about to solve puzzle ${i}`);
    solveCurrent();
    ok(`puzzle ${i} solved`, g.game.solved === true);
    await sleep(700);
  }
  eq(g.game.state, 'won', 'clearing all 10 puzzles reaches the won screen');
  eq(g.game.score, g.TOTAL, 'final score equals the puzzle count');
  ok('a new best is recorded', g.game.best >= g.TOTAL);
  eq(win.localStorage.getItem('paperfold_best'), String(g.game.best), 'best score persists to localStorage');

  console.log('\n--- logic: restart from that ending -> playable again ---');
  // resetGame() is exactly the handler onDown() calls from the 'won' state (index.html onDown()).
  ok('game is in the won state before restart', g.game.state === 'won');
  g.resetGame();
  eq(g.game.state, 'playing', 'restart from won returns to playing');
  eq(g.game.pIdx, 0, 'restart returns to the first puzzle');
  eq(g.game.score, 0, 'restart resets the score');
  eq(g.game.transitioning, false, 'restart leaves input unblocked');
  eq(g.game.movesLeft, g.PUZZLES[0].moves.length, 'restart restores the first puzzle move budget');
  // and it is really playable, not just reset-looking:
  g.fold(g.PUZZLES[0].moves[0]);
  ok('after restart, folding solves the first puzzle again', g.game.solved === true);
  await sleep(700);
  eq(g.game.pIdx, 1, 'play continues normally after a post-win restart');

  console.log('\n--- logic: hint (power-up path) advances rather than consuming and freezing ---');
  g.resetGame();
  // fast-forward to puzzle 5 ('Small Square', moves D,R,U) via buildPuzzle so hint has a
  // non-trivial multi-step puzzle to report against
  g.buildPuzzle(5);
  eq(g.game.pIdx, 5, 'jumped to puzzle 5 for the hint test');
  const p5 = g.PUZZLES[5];

  g.giveHint();
  eq(g.game.hintDir, p5.moves[0], 'the hint names the correct first move');
  ok('giveHint does not block input', g.game.transitioning === false);

  // calling hint repeatedly is not a limited resource that can run out and freeze the game
  g.giveHint(); g.giveHint(); g.giveHint();
  eq(g.game.hintDir, p5.moves[0], 'hint remains available and correct after repeated calls');

  // following the hint actually advances the puzzle (hint isn't a dead-end / consuming trap)
  g.fold(p5.moves[0]);
  ok('acting on the hint advances the puzzle (movesLeft decreased)', g.game.movesLeft === p5.moves.length - 1);
  ok('hint clears itself after the move it pointed to is taken', g.game.hintDir === null);

  g.giveHint();
  eq(g.game.hintDir, p5.moves[1], 'the hint tracks the next required move after progress');
  g.fold(p5.moves[1]);
  g.giveHint();
  eq(g.game.hintDir, p5.moves[2], 'the hint tracks the final required move');
  g.fold(p5.moves[2]);
  ok('following the hint for every step solves the puzzle', g.game.solved === true);
  await sleep(700);
  eq(g.game.pIdx, 6, 'the puzzle advances normally after being solved via hints');

  console.log('\n--- logic: undo (the other power/reversal path) does not consume-and-freeze ---');
  g.resetGame();
  g.buildPuzzle(3);   // moves: ['D','D'], budget 2
  const p3 = g.PUZZLES[3];
  const movesBeforeUndoNoop = g.game.movesLeft;
  g.undoFold();
  eq(g.game.movesLeft, movesBeforeUndoNoop, 'undo with empty history is a harmless no-op, not a crash');

  g.fold(p3.moves[0]);
  eq(g.game.movesLeft, p3.moves.length - 1, 'first fold spent a move');
  g.undoFold();
  eq(g.game.movesLeft, p3.moves.length, 'undo restores the spent move');
  eq(g.game.solved, false, 'undo leaves the puzzle unsolved and playable');

  // after undoing, the puzzle must still be solvable through to completion (no lockout)
  solveCurrent();
  ok('after an undo, the puzzle can still be solved normally', g.game.solved === true);
  await sleep(700);
  eq(g.game.pIdx, 4, 'play continues normally after using undo mid-puzzle');

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
