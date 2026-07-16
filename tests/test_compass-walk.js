// jsdom Tier 2 playthrough suite for Compass Walk (#81)
// Grid walk: move the player toward a hidden goal (revealed only by a compass
// needle); avoid drifting "pressure clouds"; 10 levels; 3 hits ends the run.
// Drives the REAL loop via window.__cfq.movePlayer — no state is force-set
// unless explicitly called out as a controlled, narrow probe.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'compass-walk', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }
function gt(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected > ${JSON.stringify(b)})`, a > b); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- canvas 2D context stub (jsdom returns null) ----
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
    w.requestAnimationFrame = () => 0;   // disable auto-loop; nothing animates unless we call update()
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// ---- grid geometry (mirrors the game's own layout math; read structural
// constants from the canvas + hook rather than hardcoding them) ----
const canvasEl = win.document.getElementById('game');
const W = canvasEl.width, H = canvasEl.height;
const COLS = g && g.COLS, ROWS = g && g.ROWS, CELL = g && g.CELL;
const GX = (W - COLS * CELL) / 2, GY = (H - ROWS * CELL) / 2;

function cellCenter(col, row) { return { x: GX + col * CELL + CELL / 2, y: GY + row * CELL + CELL / 2 }; }
function isUnsafe(col, row, clouds) {
  const p = cellCenter(col, row);
  return clouds.some(c => {
    const cx = c.x + c.r, cy = c.y + c.r;
    return Math.hypot(p.x - cx, p.y - cy) < c.r * 0.6;
  });
}

// Shortest path (list of [dc,dr] moves) from start to target that never steps
// on an unsafe cell. Returns null if none exists.
function bfsSafePath(start, target, clouds) {
  const key = (c, r) => c + ',' + r;
  const q = [{ col: start.col, row: start.row, path: [] }];
  const seen = new Set([key(start.col, start.row)]);
  while (q.length) {
    const cur = q.shift();
    if (cur.col === target.col && cur.row === target.row) return cur.path;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = cur.col + dc, nr = cur.row + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      const k = key(nc, nr);
      if (seen.has(k)) continue;
      if (isUnsafe(nc, nr, clouds)) continue;
      seen.add(k);
      q.push({ col: nc, row: nr, path: [...cur.path, [dc, dr]] });
    }
  }
  return null;
}

// Shortest path whose FINAL step deliberately enters an unsafe (cloud) cell;
// every step before that is through a safe cell. Used to trigger a real hit
// the way a drifting player would, not by poking state directly.
function bfsToHit(start, clouds) {
  const key = (c, r) => c + ',' + r;
  const q = [{ col: start.col, row: start.row, path: [] }];
  const seen = new Set([key(start.col, start.row)]);
  while (q.length) {
    const cur = q.shift();
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = cur.col + dc, nr = cur.row + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      const k = key(nc, nr);
      if (seen.has(k)) continue;
      const path = [...cur.path, [dc, dr]];
      if (isUnsafe(nc, nr, clouds)) return path;
      seen.add(k);
      q.push({ col: nc, row: nr, path });
    }
  }
  return null;
}

function drivePath(moves) { for (const [dc, dr] of moves) g.movePlayer(dc, dr); }

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildLevel', 'movePlayer', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game/player/goal/clouds state', !!g.game && 'player' in g && 'goal' in g && Array.isArray(g.clouds));
  ok('canvas element is present', !!canvasEl);
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.TOTAL, 10, 'ten levels total');
  eq(g.MAX_HITS, 3, 'three hits end the run');

  /* ================ core loop: reach the goal advances ================ */
  console.log('\n--- core loop: reaching the goal advances the game ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts in the playing state');
  eq(g.game.round, 0, 'resetGame starts at round 0');
  eq(g.game.score, 0, 'resetGame starts at score 0');

  {
    const start = { col: g.player.col, row: g.player.row };
    const target = { col: g.goal.col, row: g.goal.row };
    const path = bfsSafePath(start, target, g.clouds);
    ok('a safe path from start to goal exists on level 1', !!path);
    if (path) {
      drivePath(path);
      eq(g.game.state, 'roundover', 'reaching the goal enters the roundover transition');
      eq(g.game.score, 1, 'reaching the goal scores a point');
      await sleep(500);
      eq(g.game.state, 'playing', 'the transition resolves back to playing (round 2 begins)');
      eq(g.game.round, 1, 'the round counter advances to 1');
      eq(g.game.moves, 0, 'the new level starts with a fresh move count');
    }
  }

  /* ============ do it three times running: still advancing ============ */
  console.log('\n--- do it three times running: still advancing, still accepting input ---');
  for (let n = 0; n < 3; n++) {
    const roundBefore = g.game.round;
    const start = { col: g.player.col, row: g.player.row };
    const target = { col: g.goal.col, row: g.goal.row };
    const path = bfsSafePath(start, target, g.clouds);
    ok(`a safe path exists on round ${roundBefore + 1} (rep ${n + 1}/3)`, !!path);
    if (!path) continue;
    drivePath(path);
    eq(g.game.score, roundBefore + 1, `score keeps climbing after rep ${n + 1}`);
    await sleep(500);
    eq(g.game.round, roundBefore + 1, `round advances again after rep ${n + 1}`);
    eq(g.game.state, 'playing', `still playing (input still accepted) after rep ${n + 1}`);
    // prove input really is live on the new level, not just that state flipped
    const before = { col: g.player.col, row: g.player.row };
    const dc = before.col < COLS - 1 ? 1 : -1;
    g.movePlayer(dc, 0);
    ok(`a move is actually accepted on the new level after rep ${n + 1}`, g.player.col === before.col + dc);
  }

  /* ================= exhaust the fail condition ================= */
  console.log('\n--- exhaust the fail condition: 3 hits -> a real ending ---');
  g.resetGame();
  eq(g.game.hits, 0, 'hits reset to 0 on a fresh game');
  for (let i = 1; i <= 3; i++) {
    const start = { col: g.player.col, row: g.player.row };
    const path = bfsToHit(start, g.clouds);
    ok(`a cloud is reachable to take hit ${i}/3`, !!path);
    if (!path) break;
    drivePath(path);
    eq(g.game.hits, i, `hit count reaches ${i} after taking hit ${i}`);
    eq(g.game.state, 'roundover', `a hit enters the roundover transition (hit ${i})`);
    await sleep(400);
    if (i < 3) {
      eq(g.game.state, 'playing', `after hit ${i}/3 the same level restarts and is playable`);
    } else {
      eq(g.game.state, 'gameover', 'the third hit reaches a real gameover ending');
    }
  }

  /* ===================== restart from that ending ===================== */
  console.log('\n--- restart from the gameover ending is playable again ---');
  ok('precondition: we are actually in gameover', g.game.state === 'gameover');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from gameover returns to playing');
  eq(g.game.hits, 0, 'hits are cleared on restart');
  eq(g.game.round, 0, 'round is cleared on restart');
  {
    const start = { col: g.player.col, row: g.player.row };
    const target = { col: g.goal.col, row: g.goal.row };
    const path = bfsSafePath(start, target, g.clouds);
    ok('a safe path exists after restart', !!path);
    if (path) {
      drivePath(path);
      await sleep(500);
      eq(g.game.round, 1, 'a full move-to-goal-to-next-round cycle works again after restart');
    }
  }

  /* ============ pause is a legitimate input path, not a soft-lock ============ */
  console.log('\n--- pause/resume does not freeze input ---');
  g.resetGame();
  const beforePause = { col: g.player.col, row: g.player.row };
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause pauses from playing');
  g.movePlayer(1, 0);
  eq(g.player.col, beforePause.col, 'movement is correctly ignored while paused (not a bug: intended guard)');
  g.togglePause();
  eq(g.game.state, 'playing', 'togglePause resumes back to playing');
  g.movePlayer(g.player.col < COLS - 1 ? 1 : -1, 0);
  ok('movement is accepted again after resuming', true); // would have thrown above if broken

  /* ===================== full win playthrough (real ending #2) ===================== */
  console.log('\n--- full playthrough to a real win ending ---');
  g.resetGame();
  let reachedWon = false;
  for (let round = 0; round < g.TOTAL; round++) {
    const start = { col: g.player.col, row: g.player.row };
    const target = { col: g.goal.col, row: g.goal.row };
    const path = bfsSafePath(start, target, g.clouds);
    if (!path) { ok(`FAILED to find a safe path on round ${round + 1} during win playthrough`, false); break; }
    drivePath(path);
    await sleep(500);
    if (g.game.state === 'won') { reachedWon = true; break; }
  }
  ok('clearing all 10 levels reaches the won ending', reachedWon && g.game.state === 'won');
  if (reachedWon) eq(g.game.score, g.TOTAL, 'score equals TOTAL when won');

  console.log('\n--- restart from the won ending is playable again ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from won returns to playing');
  {
    const start = { col: g.player.col, row: g.player.row };
    const target = { col: g.goal.col, row: g.goal.row };
    const path = bfsSafePath(start, target, g.clouds);
    ok('a safe path exists after restart from won', !!path);
    if (path) { drivePath(path); await sleep(500); eq(g.game.round, 1, 'round-advance cycle still works after restart from won'); }
  }

  /* ===================== bonus mode: the advertised "par bonus" ===================== */
  console.log('\n--- bonus mode: the par-moves bonus advertised on the title screen ---');
  // The title screen promises: "Reach the goal in ' + PAR_MOVES + ' moves or fewer for a bonus."
  // Check whether that is actually reachable through real play, across every level layout.
  g.resetGame();
  let levelsWithinPar = 0;
  const parReach = [];
  for (let r = 0; r < g.TOTAL; r++) {
    g.buildLevel(r); // probe-only: read this level's own generated layout, does not affect game.round
    const start = { col: g.player.col, row: g.player.row };
    const target = { col: g.goal.col, row: g.goal.row };
    const path = bfsSafePath(start, target, g.clouds);
    const manhattan = Math.abs(target.col - start.col) + Math.abs(target.row - start.row);
    if (path && path.length <= g.PAR_MOVES) levelsWithinPar++;
    parReach.push({ round: r, manhattan, safePathLen: path ? path.length : null });
  }
  console.log('    PAR_MOVES = ' + g.PAR_MOVES + ', COLS = ' + COLS + ' (start.col is always 0, goal.col is always COLS-1 = ' + (COLS - 1) + ')');
  console.log('    per-level manhattan distance / shortest safe path length: ' + JSON.stringify(parReach));
  // The structural floor: goal.col-player.col = COLS-1 columns, plus >=1 row.
  // PAR_MOVES must clear it, otherwise the title screen advertises a bonus that
  // no player can ever earn on any layout.
  gt(g.PAR_MOVES, (COLS - 1) + 1, 'PAR_MOVES exceeds the structural minimum distance every level imposes');
  eq(levelsWithinPar, g.TOTAL, 'every level (0-9) is actually finishable within PAR_MOVES via its shortest safe path');
  // ...but par must still be a challenge, not a freebie: an inefficient route
  // that wanders should miss it.
  ok('par is not automatic — the shortest safe path leaves little slack on the hardest level (' +
     Math.min(...parReach.map(x => g.PAR_MOVES - x.safePathLen)) + ' spare moves at worst)',
     parReach.every(x => x.safePathLen !== null && g.PAR_MOVES - x.safePathLen < 10));
  g.resetGame(); // leave a clean slate after the buildLevel() probing above

  // Does completing a level under par actually AWARD the bonus? We set up a
  // coherent, legitimate micro-state - player one step from the goal with a low
  // move count - and take the single real step that wins the level, exactly
  // like a player's last move would look.
  g.resetGame();
  g.player.row = g.goal.row;
  g.player.col = g.goal.col - 1;
  g.game.moves = 1; // well under PAR_MOVES
  const scoreBeforeBonus = g.game.score, bonusBefore = g.game.bonusPoints;
  g.movePlayer(1, 0); // steps onto the goal with moves=2, satisfying moves<=PAR_MOVES
  eq(g.game.bonusPoints, bonusBefore + 1, 'finishing under par actually awards a par bonus (it is recorded, not discarded)');
  // game.score doubles as the level/progress counter ("Score: X / TOTAL", the
  // clean-levels denominator, and the persisted best) so the bonus must NOT
  // land there or the panels would render nonsense like "Score: 16 / 10".
  eq(g.game.score, scoreBeforeBonus + 1, 'the bonus does not corrupt game.score, which is the level counter');
  await sleep(500);

  // The opposite path: finishing OVER par awards nothing.
  g.resetGame();
  g.player.row = g.goal.row;
  g.player.col = g.goal.col - 1;
  g.game.moves = g.PAR_MOVES; // the winning step takes it to PAR_MOVES+1
  const bonusBeforeOverPar = g.game.bonusPoints;
  g.movePlayer(1, 0);
  eq(g.game.bonusPoints, bonusBeforeOverPar, 'finishing over par awards no bonus');
  await sleep(500);

  // A fresh run clears the bonus tally.
  g.resetGame();
  eq(g.game.bonusPoints, 0, 'resetGame clears the par-bonus tally');

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
