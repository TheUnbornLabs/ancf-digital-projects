// jsdom test harness for Mirror Nav (#64)
// A grid maze where controls are mirrored (both axes, or a single axis on every 3rd level).
// Tier 2: drive the real loop through window.__cfq and assert progression over time, not setup.
//
// Core loop per level: solve the maze -> tryMove() walks the player onto the exit cell ->
// a score bonus is awarded and a setTimeout(500ms) either builds the next maze or (after the
// 8th) sets state='won'. There is no fail condition / no lives in this game — the only
// "ending" is winning by clearing all 8 levels, so "exhaust the fail condition" is read as
// "clear the whole run and reach state==='won'". There is no skip/hint/power-up mechanic in
// this game, so that Tier-2 minimum is marked N/A rather than faked.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'mirror-nav', 'index.html');
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

// ---- maze solver: BFS over the real (unmirrored) grid, independent of the game's own carve ----
function solvePath(walls, ROWS, COLS, start, end) {
  const q = [start];
  const visited = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
  const prev = {};
  visited[start.r][start.c] = true;
  const key = (r, c) => r + ',' + c;
  while (q.length) {
    const cur = q.shift();
    if (cur.r === end.r && cur.c === end.c) break;
    const neighbors = [];
    if (cur.c + 1 < COLS && !walls.h[cur.r][cur.c]) neighbors.push({ r: cur.r, c: cur.c + 1, dr: 0, dc: 1 });
    if (cur.c - 1 >= 0 && !walls.h[cur.r][cur.c - 1]) neighbors.push({ r: cur.r, c: cur.c - 1, dr: 0, dc: -1 });
    if (cur.r + 1 < ROWS && !walls.v[cur.r][cur.c]) neighbors.push({ r: cur.r + 1, c: cur.c, dr: 1, dc: 0 });
    if (cur.r - 1 >= 0 && !walls.v[cur.r - 1][cur.c]) neighbors.push({ r: cur.r - 1, c: cur.c, dr: -1, dc: 0 });
    for (const n of neighbors) {
      if (!visited[n.r][n.c]) {
        visited[n.r][n.c] = true;
        prev[key(n.r, n.c)] = { from: cur, dr: n.dr, dc: n.dc };
        q.push(n);
      }
    }
  }
  const moves = [];
  let cur = end;
  while (!(cur.r === start.r && cur.c === start.c)) {
    const p = prev[key(cur.r, cur.c)];
    if (!p) return null; // unreachable — would itself be a serious finding (maze generator broken)
    moves.push({ dr: p.dr, dc: p.dc });
    cur = p.from;
  }
  moves.reverse();
  return moves;
}
// tryMove(dr,dc) mirrors the *input* into a *real* move. Both transforms are sign-flip
// involutions, so applying the same transform to a desired real move recovers the input
// that produces it.
function invert(mr, mc, flipAxis) {
  if (flipAxis === 'x') return { dr: mr, dc: -mc };
  if (flipAxis === 'y') return { dr: -mr, dc: mc };
  return { dr: -mr, dc: -mc };
}
function getFlipAxis(lv) { return (lv > 0 && lv % 3 === 2) ? (((lv / 3) | 0) % 2 === 0 ? 'x' : 'y') : null; }

// Solve the CURRENT maze (whatever level is live) and drive the player onto the exit
// through the real public API (tryMove), exactly as keyboard/swipe input would.
function solveCurrentLevel() {
  const flipAxis = getFlipAxis(g.game.level);
  const moves = solvePath(g.walls, g.ROWS, g.COLS, { r: g.player.r, c: g.player.c }, { r: g.exit2.r, c: g.exit2.c });
  ok('level ' + g.game.level + ' has a solvable path from start to exit', !!moves);
  for (const m of moves) {
    const inp = invert(m.dr, m.dc, flipAxis);
    g.tryMove(inp.dr, inp.dc);
  }
  return moves;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildMaze', 'tryMove', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game);
  eq(g.game.state, 'title', 'the game boots on the title screen (player/walls do not exist yet — expected)');
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.TOTAL, 8, 'the run is 8 levels');

  console.log('\n--- logic: starting the game from the title screen ---');
  // The title panel's own displayed text (panelDraw('Mirror Nav', [...])) ends with:
  // "Click / tap or press any key to begin." Verify that promise against the real
  // keydown handler, using actual KeyboardEvents dispatched on document (not the hook —
  // this is genuinely input-path behavior, not internal state).
  for (const key of ['ArrowRight', ' ', 'Enter', 'a']) {
    win.document.dispatchEvent(new win.KeyboardEvent('keydown', { key }));
  }
  eq(g.game.state, 'title',
    'pressing a key other than P/Escape/M does NOT start the game from the title screen ' +
    '(the keydown handler returns early whenever state !== "playing", for every key except ' +
    'pause/mute) — this contradicts the title screen\'s own instruction "...or press any key to begin"');
  const md = new win.MouseEvent('mousedown', { bubbles: true });
  win.document.getElementById('game').dispatchEvent(md);
  eq(g.game.state, 'playing', 'a mouse click on the canvas does start the game from the title screen');

  let drewOk = true;
  for (const st of ['title', 'playing', 'paused', 'won']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  g.resetGame();
  ok('draw() runs in every state without throwing', drewOk);

  let updateOk = true;
  try { for (const dt of [0, 16, 16.7, 1000, -5]) g.update(dt); for (let i = 0; i < 200; i++) g.update(16); }
  catch (e) { updateOk = false; console.log('    update threw: ' + e.message); }
  ok('update() tolerates odd dt and long runs', updateOk);

  /* ======================= CORE LOOP: does the game advance? ======================= */
  console.log('\n--- logic: core action advances the game (soft-lock check) ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts a fresh run in the playing state');
  eq(g.game.level, 0, 'resetGame starts at level 0');
  eq(g.game.score, 0, 'resetGame resets score');

  const level0ExitCell = { r: g.exit2.r, c: g.exit2.c };
  solveCurrentLevel();
  eq(g.player.r, level0ExitCell.r, 'solving level 0 walks the player onto the exit row');
  eq(g.player.c, level0ExitCell.c, 'solving level 0 walks the player onto the exit col');
  ok('reaching the exit awards a score bonus immediately', g.game.score > 0);
  eq(g.game.level, 0, 'the level number itself only advances after the transition delay');

  await sleep(700); // the scheduled level-advance (500ms) must have fired by now
  eq(g.game.level, 1, 'completing level 0 advances to level 1');
  eq(g.game.state, 'playing', 'still playing after advancing');
  eq(g.player.r, 0, 'the new level starts the player back at row 0');
  eq(g.player.c, 0, 'the new level starts the player back at col 0');
  eq(g.game.moves, 0, 'the new level resets the move counter');

  /* ======================= do it three times running ======================= */
  console.log('\n--- logic: three levels in a row, still advancing, still accepting input ---');
  let prevScore = g.game.score;
  for (let i = 0; i < 3; i++) {
    const levelBefore = g.game.level;
    solveCurrentLevel();
    ok(`level ${levelBefore}: reaching the exit is accepted (game.moves > 0)`, g.game.moves > 0);
    await sleep(700);
    eq(g.game.level, levelBefore + 1, `level ${levelBefore} -> ${levelBefore + 1}: the run keeps advancing`);
    eq(g.game.state, 'playing', `level ${levelBefore + 1}: still playing, input still live`);
    ok(`level ${levelBefore + 1}: score keeps increasing`, g.game.score > prevScore);
    prevScore = g.game.score;
  }
  eq(g.game.level, 4, 'four consecutive clears land on level 4 (0,1,2,3 cleared)');

  /* ======================= exhaust to a real ending ======================= */
  console.log('\n--- logic: clearing the whole run reaches a real ending ---');
  // Continue from level 4 through to the end (levels 4,5,6,7 remaining; 5 and one of the
  // mod-3 levels exercise the single-axis-flip variant levels along the way).
  while (g.game.level < g.TOTAL && g.game.state === 'playing') {
    const flipAxis = getFlipAxis(g.game.level);
    if (flipAxis) console.log(`  level ${g.game.level} is a single-axis flip level (${flipAxis})`);
    solveCurrentLevel();
    await sleep(700);
  }
  eq(g.game.state, 'won', 'clearing all 8 levels reaches the won state');
  ok('the final score is positive and reasonable', g.game.score > 0);
  eq(g.game.best, g.game.score, 'best score is updated to match a fresh best run');
  ok('the best score persisted to localStorage', win.localStorage.getItem('mirrorNav_best_v1') === String(g.game.score));

  /* ======================= restart from that ending ======================= */
  console.log('\n--- logic: restart from the ending is playable again ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from the won screen returns to playing');
  eq(g.game.level, 0, 'resetGame from the won screen goes back to level 0');
  eq(g.game.score, 0, 'resetGame from the won screen resets score');
  eq(g.player.r, 0, 'resetGame from the won screen resets the player position (row)');
  eq(g.player.c, 0, 'resetGame from the won screen resets the player position (col)');

  const movesAfterRestart = solvePath(g.walls, g.ROWS, g.COLS, { r: 0, c: 0 }, { r: g.exit2.r, c: g.exit2.c });
  ok('the restarted run has a solvable level 0', !!movesAfterRestart);
  const firstMove = movesAfterRestart[0];
  const inp = invert(firstMove.dr, firstMove.dc, null);
  const beforePos = { r: g.player.r, c: g.player.c };
  g.tryMove(inp.dr, inp.dc);
  ok('input is accepted immediately after restarting (player actually moved)',
    g.player.r !== beforePos.r || g.player.c !== beforePos.c);

  /* ======================= skip / hint / power-up path ======================= */
  console.log('\n--- logic: skip / hint / power-up mode ---');
  ok('N/A: Mirror Nav has no skip, hint, or power-up mechanic (only pause/mute) — ' +
     'nothing to check here without inventing a feature the game does not have', true);

  // Pause is the closest thing to an interrupt-and-resume path; verify it doesn't freeze input.
  g.resetGame();
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause pauses a playing round');
  const posWhilePaused = { r: g.player.r, c: g.player.c };
  g.tryMove(1, 0);
  eq(g.player.r, posWhilePaused.r, 'movement is refused while paused (row unchanged)');
  eq(g.player.c, posWhilePaused.c, 'movement is refused while paused (col unchanged)');
  g.togglePause();
  eq(g.game.state, 'playing', 'togglePause resumes back to playing');
  g.tryMove(-1, 0);
  ok('movement is accepted again immediately after resuming from pause',
    g.player.r !== posWhilePaused.r || g.player.c !== posWhilePaused.c);

  /* ======================= exit re-entry during the transition window ======================= */
  console.log('\n--- logic: re-entering the exit before the transition timeout fires ---');
  // The win-check in tryMove() has no "transitioning" guard: game.state stays 'playing' for
  // the full 500ms between reaching the exit and the scheduled level-advance/win. If the
  // player steps off the exit tile and back onto it again inside that window (very plausible
  // in THIS game specifically, since mirrored controls are the whole premise and overshoot-
  // then-correct near the exit is a natural failure mode), the win logic re-fires and stacks
  // another setTimeout on top of the first.
  g.resetGame();
  const walls0 = g.walls, ROWS0 = g.ROWS, COLS0 = g.COLS;
  const path0 = solvePath(walls0, ROWS0, COLS0, { r: 0, c: 0 }, { r: g.exit2.r, c: g.exit2.c });
  for (const m of path0) { const i = invert(m.dr, m.dc, null); g.tryMove(i.dr, i.dc); }
  const scoreAtExit = g.game.score;
  const levelAtExit = g.game.level;
  eq(g.game.state, 'playing', 'state is still playing right after touching the exit (no transitioning guard)');

  // Step off the exit the way we came, then step back onto it, synchronously — before the
  // 500ms setTimeout has any chance to fire.
  const lastMove = path0[path0.length - 1];
  const stepOff = invert(-lastMove.dr, -lastMove.dc, null);
  const stepBack = invert(lastMove.dr, lastMove.dc, null);
  g.tryMove(stepOff.dr, stepOff.dc);
  g.tryMove(stepBack.dr, stepBack.dc);
  const scoreAfterReentry = g.game.score;
  const levelAfterReentrySync = g.game.level;

  eq(scoreAfterReentry, scoreAtExit,
     `re-entering the exit tile before the transition fires does not award a second bonus ` +
     `for the same arrival (score stayed at ${scoreAtExit}, but got ${scoreAfterReentry}; ` +
     `level was ${levelAfterReentrySync} right before waiting)`);

  await sleep(1200); // let every queued setTimeout fire
  eq(g.game.level, levelAtExit + 1,
     `a single logical exit arrival advances the level by exactly one, even if the exit tile ` +
     `is re-entered before the transition timeout fires (level ${levelAtExit} -> expected ${levelAtExit + 1}, got ${g.game.level})`);
  eq(g.game.state, 'playing', 'the game does not crash or freeze after re-entering the exit — it stays playable');

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
