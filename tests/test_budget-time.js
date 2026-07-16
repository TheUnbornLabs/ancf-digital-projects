// jsdom test harness for Budget Time (#66)
// Tier 2 playthrough suite: drives the real loop through window.__cfq and asserts
// PROGRESSION over time (not just single-step setup), per tests/audit/PROTOCOL.md.
// Core action: placeAtCell(c,r) -- the same function the real keyboard-placement
// path calls (kbSelIdx defaults to 0 / MY_BLOCKS[0], which is fine: we only need
// distinct cells to advance countMine()). Win/lose transitions happen inside
// update(), not inside dropBlock/placeAtCell, so every progression check calls
// update() before reading game.state.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'budget-time', 'index.html');
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
  url: 'http://localhost/',           // gives us a real localStorage for the best-score test
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = function () { return stub(this); };
    w.requestAnimationFrame = () => 0;  // disable auto-loop; we drive update() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;         // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// first N cells in row-major (day, hour) order -- doesn't matter which cells,
// only that they're distinct and empty.
function cellsInOrder(n) {
  const cells = [];
  for (let c = 0; c < g.DAYS && cells.length < n; c++)
    for (let r = 0; r < g.HOURS && cells.length < n; r++)
      cells.push([c, r]);
  return cells;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'countMine', 'countEmpty', 'addObligation',
    'forceObligationTick', 'dropBlock', 'placeAtCell', 'cellAt', 'update', 'draw',
    'togglePause', 'toggleMute'].every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.grid) && Array.isArray(g.pool));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  console.log('\n--- logic: core loop (the check that catches soft-locks) ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts the round in playing state');
  eq(g.countMine(), 0, 'resetGame starts with zero claimed cells');
  eq(g.countEmpty(), g.DAYS * g.HOURS, 'resetGame starts with every cell empty');

  const placed1 = g.placeAtCell(0, 0);
  ok('placing a block on an empty cell succeeds', placed1 === true);
  eq(g.countMine(), 1, 'placing a block advances the claimed count');
  ok('the placed cell holds the block data', !!g.grid[0][0] && g.grid[0][0] !== 'obl' && typeof g.grid[0][0].label === 'string');

  console.log('\n--- logic: three times running, still advancing, still accepting input ---');
  let mineBefore = g.countMine();
  for (const [c, r] of [[0, 1], [0, 2], [0, 3]]) {
    const p = g.placeAtCell(c, r);
    ok(`placing at (${c},${r}) is accepted`, p === true);
    eq(g.countMine(), mineBefore + 1, `claimed count advances after placing at (${c},${r})`);
    mineBefore = g.countMine();
  }
  eq(g.game.state, 'playing', 'still playing after four consecutive placements');

  console.log('\n--- logic: an occupied cell refuses placement without crashing ---');
  const reOffer = g.placeAtCell(0, 0);
  ok('re-placing on an already-claimed cell is refused', reOffer === false);
  eq(g.countMine(), 4, 'a refused placement does not change the claimed count');
  ok('draw() does not throw after a refused placement', (() => { try { g.draw(); return true; } catch (e) { return false; } })());

  console.log('\n--- logic: win path (exhaust the win condition) ---');
  g.resetGame();
  const winCells = cellsInOrder(g.TARGET_MINE);
  let allPlaced = true;
  for (const [c, r] of winCells) { if (!g.placeAtCell(c, r)) allPlaced = false; }
  ok('every cell needed for the win could be claimed', allPlaced);
  eq(g.countMine(), g.TARGET_MINE, 'exactly TARGET_MINE cells are claimed');
  eq(g.game.state, 'playing', 'state has not transitioned yet (the win check runs inside update)');
  g.update(0);
  eq(g.game.state, 'won', 'reaching TARGET_MINE claimed cells wins the game on the next update');
  eq(g.game.score, g.TARGET_MINE, 'score reflects the claimed cells at the moment of winning');
  eq(win.localStorage.getItem('cfq_budgettime_best'), String(g.TARGET_MINE), 'the best score is persisted to localStorage after winning');

  console.log('\n--- logic: restart from a win ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from the won screen returns to playing');
  eq(g.countMine(), 0, 'the grid is cleared on restart');
  eq(g.countEmpty(), g.DAYS * g.HOURS, 'every cell is empty again on restart');
  const postWinPlace = g.placeAtCell(1, 1);
  ok('placement works again after restarting from a win', postWinPlace === true && g.countMine() === 1);

  console.log('\n--- logic: lose path (exhaust the fail condition) ---');
  g.resetGame();
  for (let i = 0; i < g.DAYS * g.HOURS; i++) g.addObligation();
  eq(g.countEmpty(), 0, 'obligations can fill every remaining cell');
  ok('the player claimed nothing in this run', g.countMine() === 0);
  eq(g.game.state, 'playing', 'state has not transitioned yet (the lose check runs inside update)');
  g.update(0);
  eq(g.game.state, 'gameover', 'a full board with too few claimed cells ends the game');

  console.log('\n--- logic: restart from a loss ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from the gameover screen returns to playing');
  eq(g.countEmpty(), g.DAYS * g.HOURS, 'the grid is cleared on restart');
  const postLossPlace = g.placeAtCell(2, 2);
  ok('placement works again after restarting from a loss', postLossPlace === true && g.countMine() === 1);

  console.log('\n--- logic: pause does not soft-lock the loop ---');
  // This game has no skip/hint/power-up; pause/resume is the closest analogous
  // suspend-then-continue path, so it gets the same "does it come back?" scrutiny.
  g.resetGame();
  g.placeAtCell(3, 3);
  const mineAtPause = g.countMine();
  const emptyAtPause = g.countEmpty();
  g.togglePause();
  ok('pausing sets the paused flag', g.game.paused === true);
  for (let i = 0; i < 80; i++) g.update(48);   // ~3.8s of game time if it were running
  eq(g.game.state, 'playing', 'the game does not end while paused');
  eq(g.countMine(), mineAtPause, 'no progress silently occurs while paused');
  eq(g.countEmpty(), emptyAtPause, 'the obligation clock is frozen while paused (no cells fill on their own)');
  g.togglePause();
  ok('unpausing clears the paused flag', g.game.paused === false);
  const placedAfterResume = g.placeAtCell(3, 4);
  ok('placing is accepted again after resuming from pause', placedAfterResume === true);
  eq(g.countMine(), mineAtPause + 1, 'progress resumes after unpausing');

  console.log('\n--- logic: obligations landing do not freeze input ---');
  g.resetGame();
  g.addObligation();
  ok('an obligation fills a cell (rightmost-first)', g.grid[g.DAYS - 1][g.HOURS - 1] === 'obl');
  const placeAfterObl = g.placeAtCell(0, 0);
  ok('placing your own block still works right after an obligation lands', placeAfterObl === true);

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
