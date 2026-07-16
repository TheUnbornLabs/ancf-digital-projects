// jsdom Tier 2 playthrough suite for Nonogram Mini (#38)
// Drives the real game loop through window.__cfq and asserts PROGRESSION,
// not just setup. See tests/audit/PROTOCOL.md.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'nonogram-mini', 'index.html');
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

// Fill every cell that the CURRENT puzzle needs filled (in scan order), leaving
// "0" cells untouched. This is exactly enough to satisfy isSolved().
function fillRequiredCells(skipCells) {
  skip: for (let r = 0; r < g.N; r++) {
    for (let c = 0; c < g.N; c++) {
      if (g.puzzle.grid[r][c] === 1 && g.userGrid[r][c] !== 1) {
        if (skipCells && skipCells.some(s => s.r === r && s.c === c)) continue;
        g.toggleFill(r, c);
      }
    }
  }
}

// Solve the current puzzle by filling every required cell, one cell short,
// then filling the last one separately so the caller can inspect the
// "about to complete" moment if needed. Returns nothing; just drives it home.
function solveCurrentPuzzle() {
  fillRequiredCells();
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'loadPuzzle', 'toggleFill', 'markEmpty', 'isSolved',
    'update', 'draw', 'cellAt', 'cluesFor', 'undo', 'giveHint', 'toggleMute', 'togglePause', 'toggleMode']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.PUZZLES));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  eq(g.PUZZLES.length, 10, 'puzzle list has 10 entries');
  ok('every puzzle has a title and a grid', g.PUZZLES.every(p => typeof p.title === 'string' && Array.isArray(p.grid)));

  let drewOk = true;
  g.resetGame();
  for (const st of ['title', 'playing', 'paused', 'won']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  g.resetGame();
  ok('draw() runs in every state without throwing', drewOk);

  let updateOk = true;
  try { for (const dt of [0, 16, 16.7, 1000, -5]) g.update(dt); for (let i = 0; i < 200; i++) g.update(16); }
  catch (e) { updateOk = false; console.log('    update threw: ' + e.message); }
  ok('update() tolerates odd dt and long runs', updateOk);

  /* ======================= LOGIC: THE CORE LOOP ======================= */
  console.log('\n--- logic: setup ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame sets state to playing');
  eq(g.game.puzzleIdx, 0, 'resetGame starts at puzzle 0');
  eq(g.game.totalScore, 0, 'resetGame clears total score');
  eq(g.game.moves, 0, 'resetGame clears moves');
  ok('a puzzle grid is loaded', !!g.puzzle && Array.isArray(g.puzzle.grid));
  ok('the user grid starts blank', g.userGrid.every(row => row.every(v => v === 0)));

  console.log('\n--- logic: advancing (the core loop) ---');
  g.resetGame();
  const puzzle0 = g.puzzle;
  const movesBefore = g.game.moves;
  solveCurrentPuzzle();
  ok('filling cells increases the move count', g.game.moves > movesBefore);
  ok('the puzzle is solved once every required cell is filled', g.isSolved());
  ok('completing a puzzle awards a score', g.game.score > 0 && g.game.totalScore > 0);

  await sleep(700);   // the scheduled advance (500ms) must have fired by now
  ok('completing a puzzle advances to the next puzzle', g.puzzle !== puzzle0);
  eq(g.game.puzzleIdx, 1, 'the puzzle index advances to the second puzzle');
  eq(g.game.state, 'playing', 'still playing after advancing');
  eq(g.game.moves, 0, 'the new puzzle starts with a fresh move count');
  ok('the new puzzle grid starts blank', g.userGrid.every(row => row.every(v => v === 0)));

  console.log('\n--- logic: three in a row, still accepting input ---');
  for (let round = 0; round < 3; round++) {
    const before = g.puzzle;
    const idxBefore = g.game.puzzleIdx;
    solveCurrentPuzzle();
    ok(`round ${round}: puzzle solves`, g.isSolved());
    await sleep(700);
    ok(`round ${round}: advances to a new puzzle`, g.puzzle !== before);
    eq(g.game.puzzleIdx, idxBefore + 1, `round ${round}: puzzleIdx increments`);
    eq(g.game.state, 'playing', `round ${round}: still playing`);
    // still accepting input: a fill actually changes the grid
    const r0c0Before = g.userGrid[0][0];
    g.toggleFill(0, 0);
    ok(`round ${round}: input is still accepted after advancing`, g.userGrid[0][0] !== r0c0Before);
    g.toggleFill(0, 0); // undo that probe fill so it doesn't corrupt the solve
  }

  console.log('\n--- logic: wrong move then correction still leads to a solve ---');
  g.resetGame();
  // find a 0-cell to probe a wrong move on
  let wrongCell = null;
  outer: for (let r = 0; r < g.N; r++) for (let c = 0; c < g.N; c++) {
    if (g.puzzle.grid[r][c] === 0) { wrongCell = { r, c }; break outer; }
  }
  if (wrongCell) {
    const wrongBefore = g.game.wrongMoves;
    g.toggleFill(wrongCell.r, wrongCell.c);   // fill a cell that should stay empty
    eq(g.game.wrongMoves, wrongBefore + 1, 'filling a should-be-empty cell counts as a wrong move');
    ok('the puzzle is not solved with a wrong fill standing', !g.isSolved());
    g.toggleFill(wrongCell.r, wrongCell.c);   // toggle it back off
    eq(g.userGrid[wrongCell.r][wrongCell.c], 0, 'toggling again clears the wrong fill');
    solveCurrentPuzzle();
    ok('the puzzle can still be solved after correcting a wrong move', g.isSolved());
    await sleep(700);
    ok('play continues normally after a corrected wrong move', g.game.state === 'playing');
  } else {
    ok('SKIPPED wrong-move test (puzzle has no empty cell)', true);
  }

  /* ======================= LOGIC: HINT PATH ======================= */
  console.log('\n--- logic: hint path advances rather than freezing ---');
  g.resetGame();
  const puzzleBeforeHints = g.puzzle;
  const idxBeforeHints = g.game.puzzleIdx;
  const hintsBefore = g.game.hintsUsed;
  let hintCalls = 0;
  while (!g.isSolved() && hintCalls < 200) { g.giveHint(); hintCalls++; }
  ok('hints alone can fully solve the puzzle', g.isSolved());
  ok('using hints is tracked', g.game.hintsUsed > hintsBefore);
  await sleep(700);
  ok('solving via hints advances to the next puzzle (does not freeze)', g.puzzle !== puzzleBeforeHints);
  eq(g.game.puzzleIdx, idxBeforeHints + 1, 'puzzleIdx advances after a hint-only solve');
  eq(g.game.state, 'playing', 'still playing after a hint-only solve');
  // hint path does not consume-and-freeze: normal fill input still works afterwards
  const preFill = g.game.moves;
  fillRequiredCells();
  ok('normal input is accepted right after a hint-driven advance', g.game.moves > preFill || g.isSolved());

  console.log('\n--- logic: hint is refused when nothing to hint (no soft-lock, no crash) ---');
  g.resetGame();
  // solve everything manually first
  solveCurrentPuzzle();
  ok('manual solve completes before the extra-hint probe', g.isSolved());
  let hintThrew = false;
  try { g.giveHint(); } catch (e) { hintThrew = true; }
  ok('calling giveHint on an already-solved board does not throw', !hintThrew);
  await sleep(700);
  eq(g.game.state, 'playing', 'the game is still playable after the redundant hint call');

  /* ======================= LOGIC: PAUSE DOES NOT SOFT-LOCK ======================= */
  console.log('\n--- logic: pause / resume does not block progress ---');
  g.resetGame();
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause pauses the game');
  const hintsWhilePaused = g.game.hintsUsed;
  g.giveHint();
  eq(g.game.hintsUsed, hintsWhilePaused, 'hint is refused while paused (guard is legitimate here)');
  g.togglePause();
  eq(g.game.state, 'playing', 'togglePause resumes the game');
  const movesBeforeResume = g.game.moves;
  g.toggleFill(0, 0);
  ok('input is accepted again after resuming from pause', g.game.moves > movesBeforeResume);
  g.toggleFill(0, 0); // revert probe fill

  console.log('\n--- logic: undo does not desync progression ---');
  g.resetGame();
  fillRequiredCells();       // solve everything
  await sleep(700);          // let it advance
  const idxAfterFirstSolve = g.game.puzzleIdx;
  ok('undo on a freshly loaded puzzle does not throw or block play', (() => {
    try { g.undo(); return true; } catch (e) { return false; }
  })());
  eq(g.game.state, 'playing', 'still playing after an undo call on the new puzzle');
  solveCurrentPuzzle();
  ok('the puzzle can still be solved after an undo call', g.isSolved());
  await sleep(700);
  eq(g.game.puzzleIdx, idxAfterFirstSolve + 1, 'progression continues normally after undo');

  /* ======================= LOGIC: EXHAUST TO A REAL ENDING ======================= */
  console.log('\n--- logic: exhaust all puzzles to reach a real ending ---');
  g.resetGame();
  let guard = 0;
  while (g.game.state !== 'won' && guard < 30) {
    solveCurrentPuzzle();
    if (g.game.state === 'won') break;
    await sleep(700);
    guard++;
  }
  eq(g.game.state, 'won', 'clearing every puzzle reaches the won screen');
  eq(g.game.puzzleIdx, g.PUZZLES.length - 1, 'puzzleIdx sits on the final puzzle at the win screen');
  ok('a total score was accumulated across the run', g.game.totalScore > 0);

  console.log('\n--- logic: restart from the win screen is playable again ---');
  const totalScoreAtWin = g.game.totalScore;
  g.resetGame();   // the real restart handler: canvas mousedown on state 'won' calls resetGame()
  eq(g.game.state, 'playing', 'restart from the win screen returns to playing');
  eq(g.game.puzzleIdx, 0, 'restart from the win screen resets to the first puzzle');
  eq(g.game.totalScore, 0, 'restart from the win screen resets the total score');
  ok('the reset score is actually a fresh run, not a stale carry-over', g.game.totalScore !== totalScoreAtWin || totalScoreAtWin === 0);
  const movesAtRestart = g.game.moves;
  solveCurrentPuzzle();
  ok('the first puzzle can be solved again after restarting', g.isSolved());
  await sleep(700);
  eq(g.game.puzzleIdx, 1, 'progression works again after a restart-from-win');

  console.log('\n--- logic: best-move tracking persists across a restart ---');
  ok('best score table is written to localStorage after solving puzzle 0', win.localStorage.getItem('nonogramBest') !== null);
  const bestTable = JSON.parse(win.localStorage.getItem('nonogramBest'));
  ok('best score table has an entry for puzzle 0', typeof bestTable.p0 === 'number');

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
