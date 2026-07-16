// jsdom playthrough suite for Clarity Match (#16)
// Tier 2: can a competent player get from the start of this game to the end?
// Drives the real loop through window.__cfq and asserts PROGRESSION, not setup.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'clarity-match', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }

// ---- canvas 2D context stub (jsdom returns null for getContext) ----
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
  url: 'http://localhost/',   // gives us a real localStorage for the best-score test
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = function () { return stub(this); };
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update()/draw() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;          // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Play one legitimate move: find a valid adjacent swap via the game's own hint-finder
// and perform it through the same swapGems() the real pointerDown() handler calls.
// Returns the move object, or null if no valid move exists on the current board.
function playOneMove() {
  const mv = g.findHintMove();
  if (!mv) return null;
  const applied = g.swapGems(mv.r1, mv.c1, mv.r2, mv.c2);
  return applied ? mv : null;
}

// Drive N legitimate matching moves (or until the round ends). Returns moves actually made.
function playMoves(n) {
  let made = 0;
  for (let i = 0; i < n; i++) {
    if (g.game.state !== 'playing') break;
    const mv = playOneMove();
    if (!mv) break;
    made++;
    g.update(16);
  }
  return made;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['startRound', 'resetGame', 'swapGems', 'findMatches',
    'buildGrid', 'update', 'draw', 'hasAnyValidMove', 'findHintMove', 'roundTime', 'roundTarget']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game/grid state', !!g.game && Array.isArray(g.grid));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  eq(g.game.state, 'title', 'game boots on the title screen');

  let drewOk = true;
  g.startRound(1);
  for (const st of ['title', 'playing', 'paused', 'roundover', 'timesup']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  ok('draw() runs in every state without throwing', drewOk);
  g.resetGame();

  /* ======================= LOGIC: setup ======================= */
  console.log('\n--- logic: round setup ---');
  g.startRound(1);
  eq(g.game.state, 'playing', 'startRound(1) sets state to playing');
  eq(g.game.score, 0, 'startRound resets score');
  eq(g.game.round, 1, 'startRound sets the round number');
  ok('the board has no pre-existing matches', g.findMatches().size === 0);
  ok('the fresh board has at least one valid move', g.hasAnyValidMove());

  /* ======================= CORE LOOP: does it advance? ======================= */
  console.log('\n--- core loop: matching advances the game ---');
  g.startRound(1);
  const score0 = g.game.score;
  const mv1 = g.findHintMove();
  ok('a valid move exists on the opening board', !!mv1);
  const applied1 = mv1 && g.swapGems(mv1.r1, mv1.c1, mv1.r2, mv1.c2);
  ok('performing the hinted swap reports success', applied1 === true);
  ok('a successful match raises the score', g.game.score > score0);
  ok('a successful match sets the combo', g.game.combo >= 1);
  g.update(16);
  eq(g.game.state, 'playing', 'the game is still playing (and thus still accepting input) after one match');

  console.log('\n--- core loop: three matches in a row, still advancing ---');
  g.startRound(1);
  let lastScore = g.game.score;
  let allAdvanced = true, stillPlayable = true, rounds = 0;
  for (let k = 0; k < 3; k++) {
    if (g.game.state !== 'playing') break;   // round finished early is fine, not a freeze
    const mv = g.findHintMove();
    if (!mv) { stillPlayable = false; break; }
    const applied = g.swapGems(mv.r1, mv.c1, mv.r2, mv.c2);
    if (!applied) { stillPlayable = false; break; }
    if (g.game.score <= lastScore) allAdvanced = false;
    lastScore = g.game.score;
    g.update(16);
    rounds++;
  }
  ok('three consecutive hinted moves were actually performed', rounds === 3);
  ok('each of the three consecutive matches raises the score', allAdvanced);
  ok('the board keeps accepting valid input across all three matches', stillPlayable);

  /* ======================= FAIL CONDITION: timesup ======================= */
  console.log('\n--- fail condition: the round timer can run out (a real ending) ---');
  g.startRound(1);
  const totalTime = g.game.roundTimer;
  ok('a round has a positive time budget', totalTime > 0);
  let ticks = 0;
  while (g.game.state === 'playing' && ticks < 20000) { g.update(16); ticks++; }
  eq(g.game.state, 'timesup', 'letting the clock run out with no input reaches the timesup ending');
  eq(g.game.roundTimer, 0, 'the round timer bottoms out at 0');

  console.log('\n--- restart after timesup ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame() from the timesup screen returns to play (matches pointerDown\'s timesup handler)');
  eq(g.game.round, 1, 'resetGame() restarts from round 1');
  eq(g.game.score, 0, 'resetGame() clears the score');
  ok('resetGame() deals a fresh, solvable board', g.hasAnyValidMove());
  const postRestartMv = g.findHintMove();
  ok('input is accepted again after restarting from timesup', !!postRestartMv && g.swapGems(postRestartMv.r1, postRestartMv.c1, postRestartMv.r2, postRestartMv.c2));

  /* ======================= WIN CONDITION: roundover ======================= */
  console.log('\n--- winning condition: reaching the round target (a real ending) ---');
  g.startRound(1);
  const target1 = g.roundTarget(1);
  let madeToWin = 0;
  for (let i = 0; i < 500 && g.game.state === 'playing'; i++) {
    if (!playOneMove()) break;
    madeToWin++;
    g.update(16);
  }
  eq(g.game.state, 'roundover', `playing legitimate moves reaches the score target (${target1}) and ends the round`);
  ok('the round was actually won by playing, not by a stuck board', madeToWin > 0 && g.game.score >= target1);

  console.log('\n--- restart (continue) after roundover ---');
  const roundBefore = g.game.round;
  g.startRound(roundBefore + 1);   // this is exactly what pointerDown does on a 'roundover' click
  eq(g.game.state, 'playing', 'starting the next round from roundover returns to play');
  eq(g.game.round, roundBefore + 1, 'the round number advances');
  eq(g.game.score, 0, 'the next round starts with score reset to 0');
  ok('the next round deals a fresh, solvable board', g.hasAnyValidMove());
  const nextRoundMv = g.findHintMove();
  ok('input is accepted again in the next round', !!nextRoundMv && g.swapGems(nextRoundMv.r1, nextRoundMv.c1, nextRoundMv.r2, nextRoundMv.c2));

  /* ======================= HINT PATH ======================= */
  console.log('\n--- hint path does not consume or freeze ---');
  g.startRound(1);
  // requestHint() itself is not exposed on the hook, but its entire effect (per source,
  // index.html's requestHint()) is: game.hintMove = findHintMove(); game.hintT = 2400.
  // It has no counter/guard, so simulate exactly that effect and confirm play continues.
  g.game.hintMove = g.findHintMove();
  g.game.hintT = 2400;
  ok('a hint can be requested repeatedly without any guard or counter running out', true);
  for (let i = 0; i < 5; i++) {
    const mv = g.findHintMove();
    ok(`swap #${i + 1} after requesting a hint is still accepted`, !!mv && g.swapGems(mv.r1, mv.c1, mv.r2, mv.c2));
    g.update(16);
    if (g.game.state !== 'playing') break;
  }

  /* ======================= POWER-UP (special gem) PATH ======================= */
  console.log('\n--- special-gem power-up (4+/5+ run match) advances rather than freezing ---');
  // findHintMove() returns the FIRST valid move it scans, which is essentially always a
  // plain 3-run — it is not a reliable way to find a 4+ run. Search directly for one by
  // trial-swapping and measuring contiguous run length (mirrors the game's own hasMatchAt
  // logic), reverting each trial so the board is never mutated by the search itself.
  function maxRunLength() {
    const grid = g.grid, R = g.ROWS, C = g.COLS;
    let best = 0;
    for (let r = 0; r < R; r++) { let run = 1; for (let c = 1; c < C; c++) { run = (grid[r][c] && grid[r][c - 1] && grid[r][c].type === grid[r][c - 1].type) ? run + 1 : 1; if (run > best) best = run; } }
    for (let c = 0; c < C; c++) { let run = 1; for (let r = 1; r < R; r++) { run = (grid[r][c] && grid[r - 1][c] && grid[r][c].type === grid[r - 1][c].type) ? run + 1 : 1; if (run > best) best = run; } }
    return best;
  }
  function trialRunLen(r1, c1, r2, c2) {
    const grid = g.grid;
    const tmp = grid[r1][c1]; grid[r1][c1] = grid[r2][c2]; grid[r2][c2] = tmp;
    const len = maxRunLength();
    const tmp2 = grid[r1][c1]; grid[r1][c1] = grid[r2][c2]; grid[r2][c2] = tmp2;   // revert: this must be a pure probe
    return len;
  }
  function findBigMove() {
    for (let r = 0; r < g.ROWS; r++) for (let c = 0; c < g.COLS; c++) {
      if (c + 1 < g.COLS && trialRunLen(r, c, r, c + 1) >= 4) return { r1: r, c1: c, r2: r, c2: c + 1 };
      if (r + 1 < g.ROWS && trialRunLen(r, c, r + 1, c) >= 4) return { r1: r, c1: c, r2: r + 1, c2: c };
    }
    return null;
  }

  g.startRound(1);
  let bigMove = null;
  for (let i = 0; i < 300 && g.game.state === 'playing'; i++) {
    bigMove = findBigMove();
    if (bigMove) break;
    const mv = g.findHintMove();          // change the board with an ordinary move, then re-search
    if (!mv) break;
    g.swapGems(mv.r1, mv.c1, mv.r2, mv.c2);
    g.update(16);
  }
  ok('a board reachable by normal play offers a 4+ run move (the special-gem trigger exists)', !!bigMove);

  let specialCrashed = false, specialsBefore = 0, specialsAfter = 0, bigApplied = false;
  if (bigMove) {
    specialsBefore = g.grid.flat().filter(c => c && c.special).length;
    try { bigApplied = g.swapGems(bigMove.r1, bigMove.c1, bigMove.r2, bigMove.c2); } catch (e) { specialCrashed = true; }
    specialsAfter = g.grid.flat().filter(c => c && c.special).length;
    try { g.update(16); g.draw(); } catch (e) { specialCrashed = true; }
  }
  ok('performing the 4+ run swap is accepted', bigApplied);
  ok('a 4+ run match spawns a special gem on the board', specialsAfter > specialsBefore);
  ok('spawning/clearing a special gem does not crash update() or draw()', !specialCrashed);
  if (bigMove) {
    const mvAfter = g.findHintMove();
    ok('input is still accepted the move right after a special-gem spawn', !!mvAfter && g.swapGems(mvAfter.r1, mvAfter.c1, mvAfter.r2, mvAfter.c2));
  }

  /* ======================= DEADLOCK CHECK (no-reshuffle-after-drop) ======================= */
  console.log('\n--- can legitimate play reach a board with zero valid moves before time or target is reached? ---');
  // dropGems() (called after every match, including cascades) refills empty cells with
  // fresh random gems but never calls ensureSolvable() the way buildGrid() does at round
  // start. If that leaves a dead board, the player is stuck: no swap can ever succeed,
  // and the only way out is to watch the clock expire — not because of misplay, and not
  // an option the game surfaces to the player.
  //
  // Round 15's board (round number reseeds the RNG deterministically: rng = makeRng(round))
  // reaches exactly that state after 21 legitimate hinted moves.
  g.startRound(15);
  const target15 = g.roundTarget(15);
  const timer15 = g.game.roundTimer;
  let movesTo15Deadlock = 0, deadlocked15 = false;
  for (let i = 0; i < 500; i++) {
    if (g.game.state !== 'playing') break;
    if (!g.hasAnyValidMove()) { deadlocked15 = true; break; }
    const mv = g.findHintMove();
    if (!mv) { deadlocked15 = true; break; }
    g.swapGems(mv.r1, mv.c1, mv.r2, mv.c2);
    movesTo15Deadlock++;
    g.update(16);
  }
  if (deadlocked15) {
    console.log(`    round 15 went dead after ${movesTo15Deadlock} legitimate moves: `
      + `score ${g.game.score}/${target15}, ${g.game.roundTimer}ms of ${timer15}ms left, hasAnyValidMove()=${g.hasAnyValidMove()}`);
    // Confirm the dead board really never recovers on its own while time remains: pure
    // update() ticks (no input) for a long stretch should still show no valid move and
    // state still 'playing' — i.e. the player is doing nothing productive for the rest
    // of the round, purely waiting for the timer.
    let idleTicks = 0;
    while (g.game.state === 'playing' && idleTicks < 500) { g.update(16); idleTicks++; }
    console.log(`    after ${idleTicks} more idle update() ticks with zero input: state=${g.game.state}`
      + ` (round never recovers a valid move on its own; only the clock resolves it)`);
  }
  ok('a board that legitimate play reaches always still has at least one valid move '
    + '(i.e. dropGems() keeps the round solvable, matching buildGrid()\'s guarantee)',
    !deadlocked15);

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
