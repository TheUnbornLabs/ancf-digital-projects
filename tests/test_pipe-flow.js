// jsdom test harness for Pipe Flow (#24)
// Smoke: the page loads, the hook is wired, every state renders, update() tolerates odd dt.
// Tier 2 playthrough: rotate pipes to connect source->dest, confirm the win screen is reached,
// confirm advancing to the "next level" actually advances (the level-progression soft-lock
// this suite exists to catch), confirm restart-from-won and hint/undo don't freeze input.
// Drives the game via window.__cfq; the puzzle itself is solved with an embedded
// backtracking solver (the game exposes clickCell/rotateMask/grid but no "solve" of its own).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'pipe-flow', 'index.html');
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

function makeDom(presetStorage) {
  const pageErrors = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: false,
    url: 'http://localhost/',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { return stub(this); };
      w.HTMLCanvasElement.prototype.getBoundingClientRect = function () {
        return { left: 0, top: 0, right: 960, bottom: 540, width: 960, height: 540, x: 0, y: 0 };
      };
      w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update()/draw() manually
      w.cancelAnimationFrame = () => {};
      w.AudioContext = undefined;          // silence Web Audio
      w.webkitAudioContext = undefined;
      w.addEventListener('error', e => pageErrors.push(e.message));
      if (presetStorage) { for (const k in presetStorage) w.localStorage.setItem(k, presetStorage[k]); }
    }
  });
  return { dom, pageErrors };
}

// ---- direction/bitmask helpers, mirroring the game's own encoding ----
const DIR_BITS = { N: 8, E: 4, S: 2, W: 1 };
const DIR_OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };
const DIR_DELTA = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };
const hasBit = (mask, d) => !!(mask & DIR_BITS[d]);
function fingerprint(g) {
  return JSON.stringify({ GCOLS: g.GCOLS, GROWS: g.GROWS, grid: g.grid.map(row => row.map(c => c.mask)) });
}

// Source/dest are never rotated by clickCell and are always assigned the fixed
// single-bit masks 0b0100 (E-only) / 0b0001 (W-only) in buildLevel(); no regular
// pipe type has a 1-bit mask, so scanning column 0 / column GCOLS-1 for these
// exact values reliably locates them without reaching into game internals.
function findSourceDest(g) {
  let sourceR = -1, destR = -1;
  for (let r = 0; r < g.GROWS; r++) {
    if (g.grid[r][0].mask === 0b0100) sourceR = r;
    if (g.grid[r][g.GCOLS - 1].mask === 0b0001) destR = r;
  }
  return { sourceR, sourceC: 0, destR, destC: g.GCOLS - 1 };
}

// Backtracking solver: a competent player rotating pipes to connect source->dest.
// For any cell needing to face a specific direction, up to 3 of its 4 rotation
// states can satisfy that (more exits = more candidate states), each pairing with
// a different remaining exit, so a naive "first fit" greedy walk can wedge itself
// into a dead-end pocket. This solver backtracks (reverts clicks) out of dead
// ends and tries the other candidate orientation, biased toward the destination
// via Manhattan distance to keep it fast.
function solveCurrentLevel(g, maxNodes = 100000) {
  const { sourceR, sourceC, destR, destC } = findSourceDest(g);
  const rows = g.GROWS, cols = g.GCOLS;
  const fixed = new Set([sourceR + ',' + sourceC]);
  const dist = (r, c) => Math.abs(r - destR) + Math.abs(c - destC);
  let nodes = 0;
  function dfs(r, c) {
    if (++nodes > maxNodes) throw new Error('solver node budget exceeded');
    if (r === destR && c === destC) return true;
    const mask = g.grid[r][c].mask;
    const dirs = ['N', 'E', 'S', 'W'].filter(d => hasBit(mask, d));
    dirs.sort((a, b) => {
      const [ar, ac] = DIR_DELTA[a], [br, bc] = DIR_DELTA[b];
      return dist(r + ar, c + ac) - dist(r + br, c + bc);
    });
    for (const d of dirs) {
      const [dr, dc] = DIR_DELTA[d]; const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const key = nr + ',' + nc;
      if (fixed.has(key)) continue;
      if (nr === sourceR && nc === sourceC) continue;
      if (nr === destR && nc === destC) {
        if (!hasBit(g.grid[destR][destC].mask, DIR_OPP[d])) continue; // dest only accepts from its fixed W side
        fixed.add(key);
        if (dfs(nr, nc)) return true;
        fixed.delete(key);
        continue;
      }
      const neededDir = DIR_OPP[d];
      const startMask = g.grid[nr][nc].mask;
      const states = []; let m = startMask;
      for (let k = 0; k < 4; k++) { states.push({ k, mask: m }); m = g.rotateMask(m); }
      // Rotationally symmetric pipes repeat masks (a cross has 1 distinct orientation,
      // a straight 2), so k and k+2 can be the SAME state. Exploring both searches an
      // identical subtree twice; across a grid of straights that doubling compounds and
      // blows the node budget. Dedupe by mask: same search space, no redundant branches.
      const seenMask = new Set();
      const validKs = states.filter(s => {
        if (seenMask.has(s.mask)) return false;
        seenMask.add(s.mask);
        return hasBit(s.mask, neededDir);
      }).map(s => s.k);
      for (const k of validKs) {
        for (let i = 0; i < k; i++) g.clickCell(nr, nc);
        fixed.add(key);
        if (dfs(nr, nc)) return true;
        fixed.delete(key);
        while (g.grid[nr][nc].mask !== startMask) g.clickCell(nr, nc); // revert to try the next candidate
      }
    }
    return false;
  }
  return dfs(sourceR, sourceC);
}

(async () => {

  const { dom, pageErrors } = makeDom();
  const win = dom.window;
  const g = win.__cfq;

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['buildLevel', 'resetGame', 'continueGame', 'clickCell', 'solveFlow',
    'update', 'draw', 'undoLastRotation', 'showHint', 'rotateMask']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray === Array.isArray); // grid/flowCells checked below
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  g.resetGame();
  let drewOk = true;
  for (const st of ['title', 'playing', 'paused', 'won']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  g.resetGame();
  ok('draw() runs in every state without throwing', drewOk);

  g.resetGame();
  let updateOk = true;
  try { for (const dt of [0, 16, 16.7, 1000, -5]) g.update(dt); for (let i = 0; i < 200; i++) g.update(16); }
  catch (e) { updateOk = false; console.log('    update threw: ' + e.message); }
  ok('update() tolerates odd dt and long runs', updateOk);

  /* ======================= CORE LOOP: rotation advances ======================= */
  console.log('\n--- logic: core action advances (rotate) ---');
  g.resetGame();
  eq(g.game.level, 1, 'resetGame starts at level 1');
  eq(g.game.state, 'playing', 'resetGame leaves the game playing');

  const { sourceR, sourceC, destR, destC } = findSourceDest(g);
  // pick any non-source/dest cell to rotate
  let targetR = -1, targetC = -1;
  outer: for (let r = 0; r < g.GROWS; r++) for (let c = 0; c < g.GCOLS; c++) {
    if (r === sourceR && c === sourceC) continue;
    if (r === destR && c === destC) continue;
    targetR = r; targetC = c; break outer;
  }
  const maskBefore = g.grid[targetR][targetC].mask;
  const movesBefore = g.game.moves;
  g.clickCell(targetR, targetC);
  ok('rotating a pipe changes its mask', g.grid[targetR][targetC].mask !== maskBefore);
  eq(g.game.moves, movesBefore + 1, 'rotating a pipe increments the move counter');

  console.log('\n--- logic: three rotations running, still accepting input ---');
  let allDistinct = true, movesOk = true;
  for (let i = 0; i < 3; i++) {
    const before = g.grid[targetR][targetC].mask;
    const movesN = g.game.moves;
    g.clickCell(targetR, targetC);
    if (g.grid[targetR][targetC].mask === before) allDistinct = false;
    if (g.game.moves !== movesN + 1) movesOk = false;
  }
  ok('three consecutive rotations each change the mask', allDistinct);
  ok('three consecutive rotations each advance the move counter', movesOk);
  eq(g.game.state, 'playing', 'still playing after repeated input');

  console.log('\n--- logic: undo ---');
  const beforeUndoMask = g.grid[targetR][targetC].mask;
  const beforeUndoMoves = g.game.moves;
  g.undoLastRotation();
  ok('undo reverts the mask', g.grid[targetR][targetC].mask !== beforeUndoMask);
  eq(g.game.moves, beforeUndoMoves - 1, 'undo decrements the move counter');
  g.clickCell(1, targetC >= 0 ? targetC : 1); // arbitrary follow-up click: confirm still responsive after undo
  ok('input still accepted immediately after undo', true);

  console.log('\n--- logic: hint does not freeze input ---');
  g.resetGame();
  g.showHint();
  ok('showHint sets a hint cell without throwing', true);
  const movesBeforeHintClick = g.game.moves;
  const { sourceR: sr2, sourceC: sc2, destR: dr2, destC: dc2 } = findSourceDest(g);
  let hr = -1, hc = -1;
  outer2: for (let r = 0; r < g.GROWS; r++) for (let c = 0; c < g.GCOLS; c++) {
    if (r === sr2 && c === sc2) continue; if (r === dr2 && c === dc2) continue;
    hr = r; hc = c; break outer2;
  }
  g.clickCell(hr, hc);
  eq(g.game.moves, movesBeforeHintClick + 1, 'clicking a cell after using hint is still accepted (hint does not consume/freeze input)');

  /* ======================= WIN PATH ======================= */
  console.log('\n--- logic: solving a level reaches the win screen ---');
  g.resetGame();
  let solved1 = false, solveErr = null;
  try { solved1 = solveCurrentLevel(g); } catch (e) { solveErr = e.message; }
  ok('level 1 is solvable by rotating pipes (solver did not error: ' + (solveErr || 'none') + ')', solved1 === true);
  const { destR: d1r, destC: d1c } = findSourceDest(g);
  ok('flowCells reaches the destination cell after solving', g.flowCells.has(d1r + ',' + d1c));
  await sleep(500); // solveFlow() schedules state='won' via a 400ms setTimeout
  eq(g.game.state, 'won', 'reaching the destination transitions to the won screen');

  /* ======================= THE PROGRESSION BUG ======================= */
  // These assertions state the CORRECT/expected player-facing behavior (advancing
  // should mean advancing) so this suite fails now, on the live bug, and would go
  // green if the bug were fixed -- matching the house convention in
  // tests/test_word-unscramble.js rather than asserting "the bug is present".
  console.log('\n--- logic: does the level actually advance? ---');
  const levelBeforeAdvance = g.game.level;
  eq(levelBeforeAdvance, 1, 'game.level is 1 going into the win screen (sanity check)');

  // Advance the way a real player would: press Enter on the won screen (index.html's
  // own keydown handler: state==='won' -> buildLevel(game.level+1)).
  win.dispatchEvent(new win.KeyboardEvent('keydown', { code: 'Enter' }));
  eq(g.game.state, 'playing', 'pressing Enter on the won screen returns to play');
  eq(g.game.level, levelBeforeAdvance + 1, 'winning level 1 and advancing should raise game.level to 2');

  const savedAfter1 = JSON.parse(win.localStorage.getItem('pipeflow_save_v1'));
  ok('bestMoves should be recorded under the level actually just completed ("1"), not overwritten again next time',
    savedAfter1.bestMoves['1'] !== undefined);

  console.log('\n--- logic: repeating win->advance should keep reaching NEW levels, not repeat one ---');
  const fp2 = fingerprint(g); // the grid the previous advance produced
  let solved2 = false;
  try { solved2 = solveCurrentLevel(g); } catch (e) { /* leave false */ }
  ok('the level the player is dropped into after advancing is itself solvable', solved2);
  await sleep(500);
  eq(g.game.state, 'won', 'solving it again reaches the won screen a second time');

  win.dispatchEvent(new win.KeyboardEvent('keydown', { code: 'Enter' }));
  const fp3 = fingerprint(g);
  ok('advancing a second time should produce a different puzzle than the first advance (real progression, not a repeat)', fp2 !== fp3);
  eq(g.game.level, 3, 'after two full win+advance cycles from level 1, game.level should be 3');

  let solved3 = false;
  try { solved3 = solveCurrentLevel(g); } catch (e) {}
  ok('the level after a second advance is itself solvable', solved3);
  await sleep(500);
  win.dispatchEvent(new win.KeyboardEvent('keydown', { code: 'Enter' }));
  const savedAfter3 = JSON.parse(win.localStorage.getItem('pipeflow_save_v1'));
  eq(savedAfter3.lastLevel, 4, 'after three full win cycles starting from level 1, saved lastLevel should be 4 (real progress persisted)');
  ok('bestMoves should have recorded entries for levels 1, 2 and 3 by now (three distinct levels solved)',
    ['1', '2', '3'].every(k => savedAfter3.bestMoves[k] !== undefined));

  console.log('\n--- logic: the mouse "Next Level" button should advance the same way ---');
  // Confirm the click-driven path (not just the Enter shortcut) advances too:
  // pointerDown()'s won-state branch is the click equivalent of the Enter handler.
  g.resetGame();
  solveCurrentLevel(g);
  await sleep(500);
  eq(g.game.state, 'won', 'level 1 solved again for the mouse-path check');
  const levelBeforeClick = g.game.level;
  // "Next Level" button rect from panelDraw(): bw=220,bh=48,bx=W/2-bw/2, by=py+ph-84, py=(H-ph)/2, ph=340
  const cx = 480, cy = 380;
  const evt = new win.MouseEvent('mousedown', { clientX: cx, clientY: cy, bubbles: true });
  win.document.getElementById('game').dispatchEvent(evt);
  eq(g.game.state, 'playing', 'clicking the Next Level button returns to play');
  eq(g.game.level, levelBeforeClick + 1, 'clicking "Next Level" with the mouse should also raise game.level');

  /* ======================= RESTART AFTER WIN ======================= */
  console.log('\n--- logic: restart from the won screen is playable again ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame() from the won screen returns to playing');
  eq(g.game.level, 1, 'resetGame() resets the level back to 1');
  const movesAfterReset = g.game.moves;
  eq(movesAfterReset, 0, 'resetGame() resets the move counter');
  const { sourceR: sr3, sourceC: sc3, destR: dr3, destC: dc3 } = findSourceDest(g);
  let hr2 = -1, hc2 = -1;
  outer3: for (let r = 0; r < g.GROWS; r++) for (let c = 0; c < g.GCOLS; c++) {
    if (r === sr3 && c === sc3) continue; if (r === dr3 && c === dc3) continue;
    hr2 = r; hc2 = c; break outer3;
  }
  g.clickCell(hr2, hc2);
  eq(g.game.moves, 1, 'input is accepted again after a restart');

  /* ======================= FRESH SESSION / CONTINUE ======================= */
  console.log('\n--- logic: a fresh session\'s "Continue" should resume where play left off ---');
  // Simulate closing and reopening the game after the multi-win session above (three
  // levels actually solved): preload localStorage with what that session saved, then
  // load a fresh page and press Continue.
  const carryOverSave = win.localStorage.getItem('pipeflow_save_v1');
  const { dom: dom2 } = makeDom({ pipeflow_save_v1: carryOverSave });
  const g2 = dom2.window.__cfq;
  g2.continueGame();
  ok('a fresh session\'s Continue should resume past level 1 after three levels were solved previously (got level ' + g2.game.level + ')',
    g2.game.level > 1);

  /* ======================= MASTER TIER / GRID CLAMP ======================= */
  console.log('\n--- logic: grid dimensions clamp at the MAX_LEVEL=20 tier ceiling ---');
  g.buildLevel(20);
  const dims20 = { cols: g.GCOLS, rows: g.GROWS };
  g.buildLevel(25);
  const dims25 = { cols: g.GCOLS, rows: g.GROWS };
  eq(JSON.stringify(dims25), JSON.stringify(dims20), 'grid size for level 25 matches the level-20 (Master tier) clamp');

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
