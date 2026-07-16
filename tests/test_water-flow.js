// jsdom test harness for Water Flow (#60)
// Tier 2 playthrough suite: can a competent player get from the start of this
// game to the end? Water Flow is an untimed pipe-rotation puzzle (8 puzzles,
// no lives/clock/fail-state); "exhausting the fail condition" means clearing
// all 8 puzzles to reach the real 'won' screen.
//
// The core action (rotate a pipe segment) is driven through window.__cfq.rotate(r,c)
// -- the exact function the real click handler (onDown) calls for an in-grid click.
// A small deterministic DFS solver (using only hook-exposed data: grid/src/sink/
// PIPE_TYPES/ROWS/COLS) finds and applies a real sequence of rotate() clicks that
// connects source to sink, so we can drive the actual solve loop puzzle after
// puzzle instead of just forcing state. Two screen transitions (title->playing,
// won->playing) are additionally driven with a REAL simulated canvas mousedown,
// because that is exactly where the word-unscramble-class guard bugs live
// (a handler that refuses to fire from a particular screen).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'water-flow', 'index.html');
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
    w.requestAnimationFrame = () => 0;  // disable auto-loop; we drive update()/draw() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;         // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;
const canvasEl = win.document.getElementById('game');
// jsdom has no layout engine, so getBoundingClientRect() is all zeros by default.
// Pin it to the game's own internal resolution (960x540) so a real dispatched
// mousedown maps 1:1 onto game pixel coordinates, exactly like a real browser
// would report for a canvas stretched to fill the viewport.
if (canvasEl) {
  Object.defineProperty(canvasEl, 'getBoundingClientRect', {
    value: () => ({ left: 0, top: 0, right: 960, bottom: 540, width: 960, height: 540 })
  });
}
function realClick(x, y) {
  const ev = new win.MouseEvent('mousedown', { clientX: x, clientY: y, bubbles: true, cancelable: true });
  canvasEl.dispatchEvent(ev);
}
// Reproduces the game's own recalcLayout() math (index.html ~line 77-81) so we
// can compute the real pixel center of a grid cell for a genuine click.
function cellCenter(r, c) {
  const W = 960, H = 540;
  let CELL = Math.min(80, Math.floor((W - 40) / g.COLS), Math.floor((H - 140) / g.ROWS));
  CELL = Math.max(40, CELL);
  const GX = (W - g.COLS * CELL) / 2, GY = (H - g.ROWS * CELL) / 2 + 16;
  return { x: GX + c * CELL + CELL / 2, y: GY + r * CELL + CELL / 2 };
}

// ---- deterministic pipe solver -----------------------------------------
// Rotates pipes via the real g.rotate(r,c) hook (the same function the click
// handler calls) until source connects to sink. Pure DFS over grid cells with
// backtracking: for each candidate next cell, try every rotation that opens
// toward the current cell; if the branch dead-ends, undo the rotation (real
// clicks back to the starting rot) and try the next candidate.
const DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]]; // 0 top, 1 right, 2 bottom, 3 left
const OPP = [2, 3, 0, 1];
function openingsAt(gr, r, c, PT) { const cell = gr[r][c]; return PT[cell.typeIdx].open[cell.rot]; }
function rotCountAt(gr, r, c, PT) { const cell = gr[r][c]; return PT[cell.typeIdx].open.length; }
function solveCurrentPuzzle(maxNodes = 200000) {
  const ROWS = g.ROWS, COLS = g.COLS, PT = g.PIPE_TYPES;
  const src = g.src, sink = g.sink;
  let nodes = 0;
  const fixed = new Set([src.r + '_' + src.c]);
  function dfs(r, c) {
    if (++nodes > maxNodes) throw new Error('node budget exceeded');
    if (r === sink.r && c === sink.c) return true;
    const op = openingsAt(g.grid, r, c, PT);
    for (let d = 0; d < 4; d++) {
      if (!op[d]) continue;
      const nr = r + DIRS[d][0], nc = c + DIRS[d][1];
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      const key = nr + '_' + nc;
      if (fixed.has(key)) continue;
      const neededDir = OPP[d];
      const startRot = g.grid[nr][nc].rot;
      const rotCount = rotCountAt(g.grid, nr, nc, PT);
      const validKs = [];
      for (let k = 0; k < rotCount; k++) {
        const testRot = (startRot + k) % rotCount;
        if (PT[g.grid[nr][nc].typeIdx].open[testRot][neededDir]) validKs.push(k);
      }
      if (nr === sink.r && nc === sink.c) {
        if (validKs.length === 0) continue;
        for (let i = 0; i < validKs[0]; i++) g.rotate(nr, nc);
        return true;
      }
      for (const k of validKs) {
        for (let i = 0; i < k; i++) g.rotate(nr, nc);
        fixed.add(key);
        if (dfs(nr, nc)) return true;
        fixed.delete(key);
        while (g.grid[nr][nc].rot !== startRot) g.rotate(nr, nc); // undo real clicks
      }
    }
    return false;
  }
  return dfs(src.r, src.c);
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['game', 'grid', 'src', 'sink', 'resetGame', 'resetPuzzle', 'buildPuzzle',
    'rotate', 'checkFlow', 'openings', 'connects', 'cellAt2', 'update', 'draw', 'PIPE_TYPES', 'COLS', 'ROWS',
    'TOTAL', 'toggleMute', 'togglePause', 'doReset', 'doHint', 'bfsSolved', 'cloneGrid']
    .every(k => g[k] !== undefined));
  ok('canvas element is present', !!canvasEl);
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.TOTAL, 8, 'the collection has 8 puzzles');

  let drewOk = true;
  g.buildPuzzle(0);
  for (const st of ['title', 'playing', 'paused', 'won']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  ok('draw() runs in every state without throwing', drewOk);

  g.resetGame();
  let updateOk = true;
  try { for (const dt of [0, 16, 16.7, 1000, -5]) g.update(dt); for (let i = 0; i < 200; i++) g.update(16); }
  catch (e) { updateOk = false; console.log('    update threw: ' + e.message); }
  ok('update() tolerates odd dt and long runs', updateOk);

  /* ================= real-click transitions ================= */
  console.log('\n--- real click: title screen starts the game ---');
  g.game.state = 'title';
  realClick(480, 270);
  eq(g.game.state, 'playing', 'a real click on the title screen starts the game (via the real onDown handler)');
  eq(g.game.pIdx, 0, 'starting fresh begins at puzzle 1 (pIdx 0)');
  eq(g.game.score, 0, 'starting fresh resets score');

  console.log('\n--- real click: rotating a pipe through the actual click handler ---');
  {
    const rr = g.src.r, rc = g.src.c + 1 < g.COLS ? g.src.c + 1 : g.src.c; // a cell beside the source
    const { x, y } = cellCenter(rr, rc);
    ok('cellAt2 agrees with our own layout math for a real click target',
      !!g.cellAt2(x, y) && g.cellAt2(x, y).r === rr && g.cellAt2(x, y).c === rc);
    const rotBefore = g.grid[rr][rc].rot;
    const movesBefore = g.game.moves;
    realClick(x, y);
    ok('a real click on a grid cell rotates it (via the real onDown -> rotate path)',
      g.grid[rr][rc].rot !== rotBefore);
    eq(g.game.moves, movesBefore + 1, 'the real click counted as one move');
  }
  g.resetGame(); // clean slate; the manual rotate above is not part of the intended solve

  /* ======================= the core loop ======================= */
  console.log('\n--- core loop: solving a puzzle advances to the next one ---');
  eq(g.game.pIdx, 0, 'a fresh game starts at puzzle 1');
  let solvedOk = solveCurrentPuzzle();
  ok('the solver connects source to sink on puzzle 1', solvedOk);
  ok('completing the connection marks the puzzle solved', g.game.solved === true);
  ok('a solved puzzle is confirmed by the game\'s own BFS', g.bfsSolved(g.grid, g.src, g.sink) === true);
  ok('completing a puzzle awards score', g.game.score > 0);
  const scoreAfterP1 = g.game.score;

  await sleep(750); // the scheduled buildPuzzle() (700ms) must have fired by now
  eq(g.game.pIdx, 1, 'completing puzzle 1 advances the puzzle index');
  eq(g.game.state, 'playing', 'still playing after advancing (no soft-lock)');
  eq(g.game.solved, false, 'the new puzzle starts unsolved');
  eq(g.game.moves, 0, 'the new puzzle starts with a fresh move count');
  // confirm input really is live on the new puzzle, not just that the flag says so
  {
    const before = JSON.stringify(g.grid.map(row => row.map(c => c.rot)));
    g.rotate(0, g.COLS - 1); // an arbitrary cell far from src/sink, harmless to rotate
    const after = JSON.stringify(g.grid.map(row => row.map(c => c.rot)));
    ok('input is genuinely accepted on the new puzzle (a rotate call changes state)', before !== after);
  }

  console.log('\n--- core loop: three more times in a row ---');
  for (let i = 1; i <= 3; i++) {
    const pBefore = g.game.pIdx;
    const scoreBefore = g.game.score;
    const solved = solveCurrentPuzzle();
    ok(`solve #${i + 1} (puzzle idx ${pBefore}) connects source to sink`, solved);
    ok(`solve #${i + 1} awards more score`, g.game.score > scoreBefore);
    await sleep(750);
    eq(g.game.pIdx, pBefore + 1, `solve #${i + 1} advances the puzzle index`);
    eq(g.game.state, 'playing', `still playing after solve #${i + 1} (no soft-lock)`);
    eq(g.game.solved, false, `puzzle after solve #${i + 1} starts unsolved`);
  }
  ok('score has been climbing across four consecutive solves', g.game.score > scoreAfterP1);

  console.log('\n--- exhausting the puzzle set reaches the real ending ---');
  // pIdx is now 4 (0-indexed); puzzles 4,5,6 remain playing, puzzle 7 is the last one
  while (g.game.pIdx < g.TOTAL - 1) {
    const pBefore = g.game.pIdx;
    const solved = solveCurrentPuzzle();
    ok(`puzzle idx ${pBefore} is solvable`, solved);
    await sleep(750);
  }
  eq(g.game.pIdx, g.TOTAL - 1, 'the last puzzle (index 7) is now current');
  const finalSolved = solveCurrentPuzzle();
  ok('the final puzzle (8 of 8) is solvable', finalSolved);
  await sleep(750);
  eq(g.game.state, 'won', 'clearing all 8 puzzles reaches the real ending screen');
  const scoreAtWin = g.game.score;
  ok('the win screen retains a non-zero final score', scoreAtWin > 0);

  console.log('\n--- restart from the ending ---');
  const bestBeforeRestart = g.game.best;
  realClick(480, 270); // real click on the 'won' screen, via the actual onDown handler
  eq(g.game.state, 'playing', 'a real click on the win screen restarts the game (via the real onDown handler)');
  eq(g.game.pIdx, 0, 'restarting returns to puzzle 1');
  eq(g.game.score, 0, 'restarting resets the score');
  ok('the best score set during the completed run is preserved across restart', g.game.best >= bestBeforeRestart);

  console.log('\n--- playable again after restart (not stale) ---');
  for (let i = 0; i < 2; i++) {
    const pBefore = g.game.pIdx;
    const solved = solveCurrentPuzzle();
    ok(`post-restart solve #${i + 1} (puzzle idx ${pBefore}) connects source to sink`, solved);
    await sleep(750);
    eq(g.game.pIdx, pBefore + 1, `post-restart solve #${i + 1} advances the puzzle index`);
    eq(g.game.state, 'playing', `still playing after post-restart solve #${i + 1}`);
  }

  /* ======================= hint / reset don't freeze ======================= */
  console.log('\n--- hint does not consume input or freeze the game ---');
  g.resetPuzzle(); // fresh copy of the current puzzle (moves back to 0)
  eq(g.game.moves, 0, 'resetPuzzle() restarts the current puzzle with 0 moves');
  eq(g.game.solved, false, 'resetPuzzle() leaves the puzzle unsolved');
  g.doHint();
  ok('doHint() sets a hint cell while playing', g.game.hintCell !== null);
  {
    const movesBefore = g.game.moves;
    const solved = solveCurrentPuzzle();
    ok('the game still accepts input (and is solvable) right after using a hint', solved);
    ok('solving after a hint still moved the puzzle forward (moves increased)', g.game.moves > movesBefore);
  }
  await sleep(750);
  ok('the puzzle after a mid-solve hint advanced normally, not stuck', g.game.state === 'playing' || g.game.state === 'won');

  console.log('\n--- hint is inert once the puzzle is already solved (no leak into next puzzle) ---');
  {
    solveCurrentPuzzle();
    ok('puzzle solved (setup for hint-during-transition check)', g.game.solved === true);
    g.doHint(); // guarded by `if(...||game.solved) return;` -- should be a no-op
    const hintCellDuringTransition = g.game.hintCell;
    await sleep(750);
    ok('a hint call made during the solve->advance transition does not leak into the new puzzle',
      g.game.hintT === 0 && g.game.hintCell === null);
  }

  console.log('\n--- reset-puzzle button regenerates a solvable, playable puzzle ---');
  {
    const pIdxBefore = g.game.pIdx;
    g.rotate(0, 0); // make an arbitrary move so moves > 0 before reset
    ok('a move was registered before reset', g.game.moves > 0);
    g.resetPuzzle();
    eq(g.game.pIdx, pIdxBefore, 'resetPuzzle() does not change which puzzle is active');
    eq(g.game.moves, 0, 'resetPuzzle() clears the move counter');
    eq(g.game.solved, false, 'resetPuzzle() clears the solved flag');
    const solved = solveCurrentPuzzle();
    ok('the puzzle is still solvable immediately after a mid-puzzle reset', solved);
    await sleep(750);
    ok('the game advances normally after a reset-then-solve', g.game.state === 'playing' || g.game.state === 'won');
  }

  console.log('\n--- pause blocks input, unpause restores it ---');
  {
    if (g.game.state !== 'playing') { g.resetGame(); }
    g.togglePause();
    ok('togglePause() while playing sets paused', g.game.paused === true);
    const before = JSON.stringify(g.grid.map(row => row.map(c => c.rot)));
    g.rotate(g.src.r, g.src.c); // attempt a rotate while paused
    const after = JSON.stringify(g.grid.map(row => row.map(c => c.rot)));
    eq(before, after, 'rotate() is refused while paused');
    g.togglePause();
    ok('togglePause() again resumes', g.game.paused === false);
    const solved = solveCurrentPuzzle();
    ok('input is accepted again after unpausing (puzzle is still solvable)', solved);
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
