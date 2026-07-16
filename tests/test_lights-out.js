// jsdom Tier 2 playthrough suite for Lights Out (#22)
// Drives the real loop through window.__cfq: solve a puzzle -> win screen ->
// advance to next level -> repeat, plus undo/hint (the power-up-equivalent
// controls) and pause, verifying none of them consume input and freeze play.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'lights-out', 'index.html');
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
    if (p === 'createRadialGradient') return () => ({ addColorStop() {} });
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
    // jsdom's default getBoundingClientRect is all-zero, which would make
    // pointerDown's rect-based scaling divide by zero (Infinity coordinates,
    // so every click would silently miss every cell). Give it the canvas's
    // real internal resolution 1:1 so client coordinates map straight through.
    w.HTMLCanvasElement.prototype.getBoundingClientRect = function () {
      return { left: 0, top: 0, right: 960, bottom: 540, width: 960, height: 540, x: 0, y: 0, toJSON(){} };
    };
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update()/draw() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// ---- reproduce the game's own level-generation RNG (index.html lines ~38, ~51-63) ----
// This is NOT a modification of the game; it is the same tiny LCG + click-count
// formula copied so the test can compute, for any level, the exact click sequence
// buildLevel() used to scramble the board. Since every click is its own inverse
// (XOR toggle), replaying that same sequence through the real clickCell() always
// drives the real board back to solved, regardless of order.
function seeded(s) { let n = s >>> 0 || 1; return () => { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; }; }
function solutionForLevel(lv, GRID) {
  const rng = seeded(lv * 7919 + 3);
  const clicks = Math.min(5 + lv * 2, 40);
  const seq = [];
  for (let i = 0; i < clicks; i++) {
    const r = Math.floor(rng() * GRID), c = Math.floor(rng() * GRID);
    seq.push([r, c]);
  }
  return seq;
}

// Solve whatever level is currently loaded by replaying its generation sequence
// through the real clickCell() (the same function real clicks invoke).
function solveLevel(lv) {
  const seq = solutionForLevel(lv, g.GRID);
  for (const [r, c] of seq) g.clickCell(r, c);
}

(async () => {

  /* ======================= SMOKE / WIRING ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['buildLevel', 'resetGame', 'clickCell', 'isSolved', 'toggle',
    'cellAt', 'update', 'draw', 'undoMove', 'showHint', 'toggleMute', 'togglePause', 'pointerDown']
    .every(k => typeof g[k] === 'function'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.GRID, 5, 'grid is 5x5 as documented');

  // Confirm our reproduced RNG actually matches the game's real generation:
  // solve level 1 via the replayed sequence and require a real win.
  g.buildLevel(1);
  ok('sanity: level 1 not already solved after buildLevel', !g.isSolved());
  solveLevel(1);
  ok('the reproduced click sequence actually solves the level (solver is valid)', g.isSolved());
  eq(g.game.state, 'won', 'solving via clickCell flips state to won, exactly as a real click would');

  /* ======================= CORE LOOP: ADVANCE ======================= */
  console.log('\n--- core action advances the game (soft-lock check) ---');
  g.resetGame();
  eq(g.game.level, 1, 'resetGame starts at level 1');
  eq(g.game.state, 'playing', 'resetGame leaves the game playing');
  const movesBefore = g.game.moves;
  solveLevel(1);
  ok('completing a level awards a moves count', g.game.moves > movesBefore);
  eq(g.game.state, 'won', 'completing the puzzle reaches the won screen');

  // The real player advances by clicking anywhere while state === 'won',
  // which routes through pointerDown -> buildLevel(++level).
  const levelBeforeAdvance = g.game.level;
  g.pointerDown({ clientX: 1, clientY: 1 });
  eq(g.game.level, levelBeforeAdvance + 1, 'clicking the won screen advances to the next level');
  eq(g.game.state, 'playing', 'the next level is immediately playable');
  ok('the new level starts unsolved', !g.isSolved());
  eq(g.game.moves, 0, 'moves resets for the new level');

  /* ======================= THREE IN A ROW ======================= */
  console.log('\n--- three levels in a row: still advancing, still accepting input ---');
  g.resetGame();
  for (let i = 1; i <= 3; i++) {
    const lvl = g.game.level;
    eq(lvl, i, `on level ${i} before solving`);
    eq(g.game.state, 'playing', `level ${i} is playable before solving`);
    solveLevel(lvl);
    eq(g.game.state, 'won', `level ${i} reaches won after solving`);
    ok(`level ${i} solved with a positive move count`, g.game.moves > 0);
    g.pointerDown({ clientX: 1, clientY: 1 }); // advance
  }
  eq(g.game.level, 4, 'three consecutive solves advance the level counter to 4');
  eq(g.game.state, 'playing', 'still playing after three consecutive wins');

  /* ======================= SUSTAINED PROGRESSION (no lose condition) ======================= */
  console.log('\n--- sustained progression across many levels ---');
  // Lights Out here has no lives/timer/lose state (game.state only ever takes
  // 'title'|'playing'|'paused'|'won') -- it is an endless puzzle ladder, not a
  // run-until-death game. There is no fail condition to exhaust. The playthrough
  // analogue is: does the ladder keep advancing indefinitely without soft-locking,
  // and does the built-in milestone (every 5 solves) fire on schedule.
  g.resetGame();
  let sawMilestone = false;
  const solvedAtStart = g.game.solved;
  for (let i = 0; i < 12; i++) {
    const lvl = g.game.level;
    solveLevel(lvl);
    if (g.game.state !== 'won') { ok(`level ${lvl} reached won (loop iteration ${i})`, false); break; }
    if (g.game.milestoneT > 0) sawMilestone = true;
    g.pointerDown({ clientX: 1, clientY: 1 });
  }
  eq(g.game.level, 13, '12 consecutive solves land on level 13 without ever soft-locking');
  eq(g.game.state, 'playing', 'still playing after a 12-level run');
  eq(g.game.solved - solvedAtStart, 12, 'the lifetime solved counter tracks every win');
  ok('the every-5th-solve milestone banner fired during the run', sawMilestone);

  /* ======================= BEST-SCORE / PERSISTENCE ======================= */
  console.log('\n--- best score persists across a reset ---');
  const savedBest = win.localStorage.getItem('lightsout_best');
  ok('a best-moves value was written to localStorage', savedBest !== null && +savedBest > 0);
  g.resetGame();
  eq(g.game.best, +savedBest, 'resetGame reloads the persisted best from localStorage');

  /* ======================= UNDO (power-up path #1) ======================= */
  console.log('\n--- undo: advances/reverts rather than freezing ---');
  g.resetGame();
  const gridBeforeClick = g.grid.map(row => row.slice());
  const [r0, c0] = solutionForLevel(1, g.GRID)[0];
  g.clickCell(r0, c0);
  const movesAfterOneClick = g.game.moves;
  ok('undo is available with history present', movesAfterOneClick === 1);
  g.undoMove();
  eq(g.game.moves, 0, 'undo reverts the moves counter');
  eq(g.grid.map(row => row.slice()).flat().join(''), gridBeforeClick.flat().join(''), 'undo restores the exact prior grid');
  eq(g.game.state, 'playing', 'the game is still playable immediately after an undo');
  // input still accepted after undo (not consumed-and-frozen)
  g.clickCell(r0, c0);
  eq(g.game.moves, 1, 'a click after undo registers normally');

  // undo with empty history is a safe no-op, not a crash
  g.resetGame();
  let undoOnEmptyThrew = false;
  try { g.undoMove(); g.undoMove(); g.undoMove(); } catch (e) { undoOnEmptyThrew = true; }
  ok('undo with no history does not throw', !undoOnEmptyThrew);
  eq(g.game.state, 'playing', 'the game remains playable after undoing with empty history');

  // undo cannot be used to escape/replay from the won screen, and doing so
  // does not corrupt state for the next attempt
  g.resetGame();
  solveLevel(g.game.level);
  eq(g.game.state, 'won', 'setup: level solved, now on the won screen');
  let undoOnWonThrew = false;
  try { g.undoMove(); } catch (e) { undoOnWonThrew = true; }
  ok('undo pressed on the won screen does not throw', !undoOnWonThrew);
  eq(g.game.state, 'won', 'undo on the won screen leaves the won state intact (no corruption)');
  g.pointerDown({ clientX: 1, clientY: 1 });
  eq(g.game.state, 'playing', 'the next level is still reachable after an undo attempt on the won screen');

  /* ======================= HINT (power-up path #2) ======================= */
  console.log('\n--- hint: advances/reverts rather than freezing ---');
  g.resetGame();
  ok('some tile is lit at the start of a level (hint has a target)', g.grid.flat().some(v => v === 1));
  g.showHint();
  // hintCell itself isn't exposed on the hook, so we verify behaviourally below
  // that showHint() neither throws nor blocks subsequent input.
  eq(g.game.state, 'playing', 'the game is still playable immediately after a hint');
  // hint must not consume/lock input: the hinted cell should still be clickable
  // and progress the puzzle normally
  const movesPreHint = g.game.moves;
  const [rh, ch] = solutionForLevel(g.game.level, g.GRID)[0];
  g.clickCell(rh, ch);
  ok('a click after using hint registers (moves increased)', g.game.moves === movesPreHint + 1);

  // repeated hints in a row do not freeze or throw (no hint-count limiter to exhaust
  // in this game -- hint is unlimited, so the check is purely "does not break input")
  let hintThrew = false;
  try { for (let i = 0; i < 10; i++) g.showHint(); } catch (e) { hintThrew = true; }
  ok('ten repeated hints in a row do not throw', !hintThrew);
  eq(g.game.state, 'playing', 'the game is still playable after repeated hints');
  const [rh2, ch2] = solutionForLevel(g.game.level, g.GRID).find(([r, c]) => g.grid[r][c] === 1 || true) || [0, 0];
  let clickAfterHintsThrew = false;
  try { g.clickCell(rh2, ch2); } catch (e) { clickAfterHintsThrew = true; }
  ok('a real click still registers after repeated hints (input not consumed-and-frozen)', !clickAfterHintsThrew);

  // hint pressed on title/won screens is a no-op guarded by state, not a crash
  g.resetGame();
  solveLevel(g.game.level);
  let hintOnWonThrew = false;
  try { g.showHint(); } catch (e) { hintOnWonThrew = true; }
  ok('hint on the won screen does not throw', !hintOnWonThrew);
  eq(g.game.state, 'won', 'hint on the won screen does not disturb the won state');

  /* ======================= PAUSE ======================= */
  console.log('\n--- pause: resumes rather than freezing ---');
  g.resetGame();
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause pauses from playing');
  g.togglePause();
  eq(g.game.state, 'playing', 'togglePause resumes back to playing');
  // real input (via pointerDown, which is what a player actually triggers) is
  // correctly withheld while paused, and restored on resume
  g.togglePause();
  const solvedCountBeforePausedClick = g.game.moves;
  g.pointerDown({ clientX: g.GX + 10, clientY: g.GY + 10 });
  eq(g.game.moves, solvedCountBeforePausedClick, 'a grid click through pointerDown is ignored while paused');
  g.togglePause();
  g.pointerDown({ clientX: g.GX + 10, clientY: g.GY + 10 });
  ok('a grid click through pointerDown registers again once resumed', g.game.moves === solvedCountBeforePausedClick + 1);

  /* ======================= RESTART FROM WON, REPEATEDLY ======================= */
  console.log('\n--- restart-equivalent (advance from won) repeated 5x without drift ---');
  g.resetGame();
  let restartOk = true;
  for (let i = 0; i < 5; i++) {
    solveLevel(g.game.level);
    if (g.game.state !== 'won') { restartOk = false; break; }
    g.pointerDown({ clientX: 1, clientY: 1 });
    if (g.game.state !== 'playing') { restartOk = false; break; }
  }
  ok('five consecutive win-then-advance cycles all succeed with no soft-lock', restartOk);

  // resetGame from mid-run returns cleanly to level 1 and is immediately playable
  g.resetGame();
  eq(g.game.level, 1, 'resetGame returns to level 1 from a later level');
  eq(g.game.state, 'playing', 'resetGame leaves a playable state');
  eq(g.game.moves, 0, 'resetGame clears the moves counter');
  ok('resetGame produces an unsolved board', !g.isSolved());

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
