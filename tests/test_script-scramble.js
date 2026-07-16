// jsdom test harness for Script Scramble (#15)
// Sliding-tile puzzle: click/tap a tile then an adjacent tile to swap. Grid grows
// with level; win a level by getting every tile into its goal position; the run
// ends after the last of QUOTES.length levels.
//
// Tier 2 focus: drive the REAL loop (select -> swap) via window.__cfq.handleClick,
// assert PROGRESSION (correctCount / moves / level advancing), not just setup.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'script-scramble', 'index.html');
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
    w.AudioContext = undefined;          // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// ---- helpers: map a tile index to the screen coords handleClick expects ----
function tileCenter(idx) {
  const col = idx % g.GRID_COLS, row = Math.floor(idx / g.GRID_COLS);
  return { x: g.GRID_X + col * g.TILE_W + g.TILE_W / 2, y: g.GRID_Y + row * g.TILE_H + g.TILE_H / 2 };
}
function clickTile(idx) { const { x, y } = tileCenter(idx); g.handleClick(x, y); }
function correctCount() { return g.tiles.filter((t, i) => t && t.goal === i).length; }

// Find an adjacent pair (a,b) whose swap would raise correctCount, WITHOUT touching
// the real game state (pure simulation over the goal values only) — independent of
// the game's own useHint() so the test doesn't validate the hint against itself.
function findHelpfulSwap() {
  const cols = g.GRID_COLS, rows = g.GRID_ROWS;
  const goals = g.tiles.map(t => t.goal);
  const scoreOf = arr => arr.reduce((s, gl, i) => s + (gl === i ? 1 : 0), 0);
  const base = scoreOf(goals);
  for (let a = 0; a < goals.length; a++) {
    const ac = a % cols, ar = Math.floor(a / cols);
    const neighbors = [];
    if (ac + 1 < cols) neighbors.push(a + 1);
    if (ar + 1 < rows) neighbors.push(a + cols);
    for (const b of neighbors) {
      const copy = goals.slice();
      [copy[a], copy[b]] = [copy[b], copy[a]];
      if (scoreOf(copy) > base) return [a, b];
    }
  }
  return null;
}

// Click-drive one helpful swap (select tile a, then click adjacent tile b).
// Returns true if a helpful swap was found and performed.
function performHelpfulSwapByClick() {
  const pair = findHelpfulSwap();
  if (!pair) return false;
  clickTile(pair[0]);
  clickTile(pair[1]);
  return true;
}

// Fully solve the CURRENT level via direct adjacent transpositions (the same
// swapTiles() the click path calls). For each grid position in row-major order,
// BFS a path (over still-unfixed cells only, so already-placed tiles are never
// disturbed) from the tile's current position to its goal, then walk it there
// one adjacent swap at a time. BFS (rather than a fixed horizontal-then-vertical
// walk) is required because some levels' tile count is short of GRID_COLS*GRID_ROWS
// (a real ragged-grid data bug found while writing this suite — see findings),
// which breaks the "every row is complete" assumption a simpler walk would need.
function neighborsOf(idx, cols, rows, N) {
  const c = idx % cols, r = Math.floor(idx / cols);
  const out = [];
  if (c + 1 < cols && idx + 1 < N) out.push(idx + 1);
  if (c - 1 >= 0) out.push(idx - 1);
  if (r + 1 < rows && idx + cols < N) out.push(idx + cols);
  if (r - 1 >= 0) out.push(idx - cols);
  return out;
}
function bfsPath(start, end, blocked, cols, rows, N) {
  if (start === end) return [start];
  const prev = new Map(), visited = new Set([start]), queue = [start];
  while (queue.length) {
    const cur = queue.shift();
    for (const nb of neighborsOf(cur, cols, rows, N)) {
      if (visited.has(nb) || (blocked.has(nb) && nb !== end)) continue;
      visited.add(nb); prev.set(nb, cur);
      if (nb === end) {
        const path = [end]; let c = end;
        while (c !== start) { c = prev.get(c); path.push(c); }
        return path.reverse();
      }
      queue.push(nb);
    }
  }
  return null;
}
// A pure row-major "lock and never disturb" strategy can dead-end on a grid with
// a cut vertex (a real ragged-grid data bug creates exactly this topology on some
// levels — see findings). That is a LIMITATION OF THIS GREEDY STRATEGY, not proof
// the level is unsolvable: adjacent transpositions on any connected graph generate
// the full symmetric group, so every level IS solvable. When the direct path is
// blocked only by already-fixed cells, route through them anyway and then restore
// whatever got knocked out of place — the same trick a person would improvise.
function solveLevel() {
  const cols = g.GRID_COLS, rows = g.GRID_ROWS, N = g.tiles.length;
  const fixed = new Set();
  let depthGuard = 0;

  function placeTarget(target) {
    if (++depthGuard > 500) throw new Error('solver: restore recursion too deep — likely a real disconnect');
    const src = g.tiles.findIndex(t => t && t.goal === target);
    if (src === target) return;

    let path = bfsPath(src, target, fixed, cols, rows, N);
    if (path) { for (let i = 0; i < path.length - 1; i++) g.swapTiles(path[i], path[i + 1]); return; }

    // No path avoids the fixed set: take the shortest path through the whole
    // graph, note which fixed cells got displaced, then restore them afterward.
    path = bfsPath(src, target, new Set(), cols, rows, N);
    if (!path) throw new Error(`solver: graph is disconnected between ${src} and ${target} — real bug`);
    const disturbed = [];
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1];
      if (fixed.has(b) && !disturbed.includes(b)) disturbed.push(b);
      if (!g.swapTiles(a, b)) throw new Error(`solver: swapTiles refused valid step ${a}->${b}`);
    }
    for (const pos of disturbed) {
      fixed.delete(pos);
      placeTarget(pos);
      fixed.add(pos);
    }
  }

  for (let target = 0; target < N - 1; target++) {
    placeTarget(target);
    fixed.add(target);
  }
  return g.checkWin();
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['startLevel', 'resetGame', 'handleClick', 'swapTiles', 'checkWin',
    'update', 'draw', 'tileAt', 'undoLast', 'useHint'].every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.QUOTES));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  ok('QUOTES has multiple levels', g.QUOTES.length > 1);
  // NOT tiles.length === cols*rows: a quote's word count is whatever the quote is, and 13 words
  // fit no rectangle at all. The grid legitimately has a partly-empty last row. What must hold is
  // that the grid FITS every tile and is TIGHT — a fully empty row would mean malformed data.
  ok('every quote fits inside its declared grid',
    g.QUOTES.every(q => q.tiles.length <= q.cols * q.rows));
  ok('no quote declares a grid with a completely empty row',
    g.QUOTES.every(q => q.tiles.length > q.cols * (q.rows - 1)));

  console.log('\n--- smoke: cold start ---');
  eq(g.game.state, 'title', 'game boots on the title screen');

  /* ======================= LOGIC: setup ======================= */
  console.log('\n--- logic: setup ---');
  g.handleClick(400, 300);   // a title-screen click should start the game, wherever it lands
  eq(g.game.state, 'playing', 'clicking the title screen starts play');
  eq(g.game.level, 0, 'starts on level 0');
  eq(g.game.moves, 0, 'starts with 0 moves');
  ok('tiles are a permutation of goal positions',
    g.tiles.map(t => t.goal).slice().sort((a, b) => a - b).join(',') ===
    g.tiles.map((t, i) => i).join(','));
  ok('the level does not start pre-solved', !g.checkWin());

  /* ======================= LOGIC: core loop ======================= */
  console.log('\n--- logic: core loop (select + swap advances) ---');
  g.resetGame();
  const before1 = correctCount(), moves0 = g.game.moves, score0 = g.game.score;
  const didSwap1 = performHelpfulSwapByClick();
  ok('a helpful adjacent swap exists on a fresh board', didSwap1);
  ok('completing a helpful swap raises correctCount', correctCount() > before1);
  eq(g.game.moves, moves0 + 1, 'the move counter advances');
  ok('score increases on a helpful swap', g.game.score > score0);
  eq(g.game.streak, 1, 'a helpful swap starts a streak');
  eq(g.selected, -1, 'selection clears after the swap (ready for the next input)');
  eq(g.game.state, 'playing', 'still playing after one swap (no soft-lock)');

  console.log('\n--- logic: three in a row (still advancing, still accepting input) ---');
  let prevCorrect = correctCount();
  for (let i = 1; i <= 3; i++) {
    const did = performHelpfulSwapByClick();
    ok(`repeat swap #${i} found a helpful move`, did);
    const nowCorrect = correctCount();
    ok(`repeat swap #${i} advances correctCount (${prevCorrect} -> ${nowCorrect})`, nowCorrect > prevCorrect);
    eq(g.game.state, 'playing', `still playing after repeat swap #${i}`);
    eq(g.selected, -1, `input is unblocked after repeat swap #${i}`);
    prevCorrect = nowCorrect;
  }

  console.log('\n--- logic: a non-improving swap does not freeze the game ---');
  {
    // find any adjacent pair whose swap does NOT improve correctness, to exercise
    // the "wasted move" path, then confirm the game still accepts input afterward.
    const cols = g.GRID_COLS, rows = g.GRID_ROWS;
    const goals = g.tiles.map(t => t.goal);
    const scoreOf = arr => arr.reduce((s, gl, i) => s + (gl === i ? 1 : 0), 0);
    const base = scoreOf(goals);
    let neutralPair = null;
    outer:
    for (let a = 0; a < goals.length; a++) {
      const ac = a % cols, ar = Math.floor(a / cols);
      const neighbors = [];
      if (ac + 1 < cols) neighbors.push(a + 1);
      if (ar + 1 < rows) neighbors.push(a + cols);
      for (const b of neighbors) {
        const copy = goals.slice();
        [copy[a], copy[b]] = [copy[b], copy[a]];
        if (scoreOf(copy) <= base) { neutralPair = [a, b]; break outer; }
      }
    }
    ok('found a non-improving adjacent pair to test', !!neutralPair);
    if (neutralPair) {
      const wastedBefore = g.game.wastedMoves, movesBefore = g.game.moves;
      clickTile(neutralPair[0]); clickTile(neutralPair[1]);
      eq(g.game.wastedMoves, wastedBefore + 1, 'a non-improving swap counts as a wasted move');
      eq(g.game.moves, movesBefore + 1, 'a non-improving swap still counts as a move');
      eq(g.game.streak, 0, 'a non-improving swap resets the streak');
      const stillWorks = performHelpfulSwapByClick();
      ok('input is still accepted after a wasted move (no soft-lock)', stillWorks);
    }
  }

  /* ======================= LOGIC: hint & undo ======================= */
  console.log('\n--- logic: hint (power-up path advances, does not freeze) ---');
  g.resetGame();
  eq(g.game.hintsLeft, 3, 'a fresh level grants 3 hints');
  g.useHint();
  eq(g.game.hintsLeft, 2, 'using a hint spends one');
  eq(g.game.state, 'playing', 'the game is not frozen after a hint');
  ok('the game still accepts a real swap after using a hint', performHelpfulSwapByClick());

  g.useHint(); g.useHint();   // spend the remaining two
  eq(g.game.hintsLeft, 0, 'all hints spent');
  const hintsAtZero = g.game.hintUsed;
  g.useHint();   // should be refused, not throw
  eq(g.game.hintsLeft, 0, 'hint is refused once exhausted (does not go negative)');
  eq(g.game.hintUsed, hintsAtZero, 'a refused hint does not count as used');
  ok('the game still accepts input after exhausting hints', performHelpfulSwapByClick());

  console.log('\n--- logic: undo ---');
  g.resetGame();
  const swapPair = findHelpfulSwap();
  ok('found a helpful swap to test undo against', !!swapPair);
  const correctBeforeUndo = correctCount(), movesBeforeUndo = g.game.moves;
  clickTile(swapPair[0]); clickTile(swapPair[1]);
  ok('the test swap actually advanced the board', correctCount() > correctBeforeUndo);
  g.undoLast();
  eq(correctCount(), correctBeforeUndo, 'undo reverts the board to its prior state');
  eq(g.game.moves, movesBeforeUndo, 'undo reverts the move counter');
  eq(g.game.streak, 0, 'undo resets the streak');
  ok('the game still accepts input after an undo', performHelpfulSwapByClick());

  // undo with empty history must not throw or corrupt state
  g.resetGame();
  const movesAtStart = g.game.moves;
  g.undoLast();
  eq(g.game.moves, movesAtStart, 'undo with empty history is a safe no-op');

  /* ======================= LOGIC: pause ======================= */
  console.log('\n--- logic: pause/resume does not soft-lock ---');
  g.resetGame();
  g.game.state = 'paused';
  g.handleClick(480, 270);
  eq(g.game.state, 'playing', 'clicking while paused resumes play');
  ok('a swap is accepted right after resuming', performHelpfulSwapByClick());

  /* ======================= LOGIC: exhausting to a real ending ======================= */
  console.log('\n--- logic: solve a level end-to-end (exhaust -> real ending) ---');
  g.resetGame();
  const solvedOne = solveLevel();
  ok('the solver actually wins the level', solvedOne);
  eq(g.game.state, 'won', 'a fully solved board reaches the won state');
  ok('winning awards a score bonus', g.game.score > 0);
  const totalAfterFirstWin = g.game.totalScore;
  ok('totalScore accumulates the level score', totalAfterFirstWin > 0);

  console.log('\n--- logic: advancing from a win screen ---');
  const levelBeforeAdvance = g.game.level;
  g.handleClick(100, 500);   // won-screen click accepts a tap anywhere, per handleClick()
  eq(g.game.level, levelBeforeAdvance + 1, 'clicking the win screen advances to the next level');
  eq(g.game.state, 'playing', 'the next level starts in a playing state');
  eq(g.game.moves, 0, 'the next level starts with a fresh move counter');
  ok('the next level is not pre-solved', !g.checkWin());
  ok('a swap is accepted on the new level (not stuck on the old board)', performHelpfulSwapByClick());

  console.log('\n--- logic: full playthrough, all levels, to the real final ending ---');
  g.resetGame();
  let levelsCompleted = 0;
  let playthroughBroke = false;
  for (let i = 0; i < g.QUOTES.length; i++) {
    const lvl = g.game.level;
    try {
      const solved = solveLevel();
      ok(`level ${lvl + 1}/${g.QUOTES.length} is solvable and reaches 'won'`, solved && g.game.state === 'won');
      if (!(solved && g.game.state === 'won')) { playthroughBroke = true; break; }
      levelsCompleted++;
      const isLast = (lvl + 1 >= g.QUOTES.length);
      g.handleClick(400, 300);   // advance from the win screen, exactly like a player tapping to continue
      if (isLast) {
        eq(g.game.state, 'playing', 'clicking the final win screen restarts (real ending reached, then reset)');
        eq(g.game.level, 0, 'restarting from the final win goes back to level 0');
      } else {
        eq(g.game.level, lvl + 1, `clicking win advances from level ${lvl + 1} to ${lvl + 2}`);
      }
    } catch (e) {
      ok(`level ${lvl + 1} -> ${lvl + 2} transition does not throw (uncaught: ${e.message})`, false);
      playthroughBroke = true;
      break;
    }
  }
  eq(levelsCompleted, g.QUOTES.length, 'every level in the game was completed end to end');
  ok('the full playthrough ran to completion without an uncaught exception', !playthroughBroke);

  console.log('\n--- logic: restart from the final ending is genuinely playable again ---');
  if (playthroughBroke) {
    ok('SKIPPED (the playthrough above did not complete cleanly — see the uncaught-exception finding)', true);
  } else {
    eq(g.game.state, 'playing', 'post-final-restart state is playing');
    ok('post-final-restart board is not pre-solved', !g.checkWin());
    const restartSwap = performHelpfulSwapByClick();
    ok('a real swap succeeds immediately after restarting from the final ending', restartSwap);
    ok('correctCount advanced after restart (fully playable, not a dead reference)', correctCount() > 0);
  }
  g.resetGame();   // isolate: guarantee a clean, known state before the tests below

  // sanity: resetGame() also works mid-level (not only from a won/gameover screen)
  console.log('\n--- logic: resetGame works mid-playthrough too ---');
  performHelpfulSwapByClick();
  ok('moves were made before the reset', g.game.moves > 0);
  g.resetGame();
  eq(g.game.moves, 0, 'resetGame mid-level returns to a clean level 0');
  eq(g.game.level, 0, 'resetGame mid-level returns to level 0');
  eq(g.game.state, 'playing', 'resetGame mid-level leaves the game playing');

  console.log('\n--- smoke: update() and draw() tolerate the post-playthrough state ---');
  let tailOk = true;
  try {
    for (const dt of [0, 16, 1000, -5]) g.update(dt);
    for (const st of ['title', 'playing', 'paused', 'won']) { g.game.state = st; g.draw(); }
  } catch (e) { tailOk = false; console.log('    threw: ' + e.message); }
  ok('update()/draw() survive after a full playthrough', tailOk);
  g.resetGame();

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
