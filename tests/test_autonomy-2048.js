// jsdom Tier 2 playthrough suite for Autonomy 2048 (#21)
// Drives the real move()/reset()/undo() loop through window.__cfq and asserts
// PROGRESSION over time, not just setup. See tests/audit/PROTOCOL.md.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'autonomy-2048', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }
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
    w.requestAnimationFrame = () => 0;   // disable the auto rAF loop; we drive move()/update() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

function boardStr(b) { return b.map(r => r.join(',')).join('|'); }

// Try each direction until one actually changes the board (a competent player
// picks a direction that does something; not every direction is legal on a
// given board). Returns the direction tried, or null if none work.
function tryAnyMove() {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const before = g.game.moves;
    g.move(dr, dc);
    if (g.game.moves > before) return [dr, dc];
  }
  return null;
}

function clearBoard() {
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) g.board[r][c] = 0;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['reset', 'move', 'addTile', 'canMove', 'update', 'draw', 'undo', 'toggleMute', 'togglePause']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game);
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.GRID, 4, 'grid is 4x4');
  // NOTE: g.board is undefined at load — the game starts on a 'title' screen
  // and only builds a board inside reset(), which fires on the player's first
  // click/keypress. That is correct behavior, not a bug; verified below.
  eq(g.game.state, 'title', 'the game opens on the title screen with no board yet');

  /* ======================= CORE LOOP: PROGRESSION ======================= */
  console.log('\n--- core loop: a move advances the game ---');
  g.reset(12345);
  ok('reset() builds a real 4x4 board', Array.isArray(g.board) && g.board.length === 4 && g.board.every(r => r.length === 4));
  eq(g.game.state, 'playing', 'reset() starts a playing round');
  eq(g.game.score, 0, 'reset() starts score at 0');
  eq(g.game.moves, 0, 'reset() starts moves at 0');

  const before1 = boardStr(g.board);
  const movesBefore1 = g.game.moves;
  const dir1 = tryAnyMove();
  ok('a legal direction exists on a fresh board', dir1 !== null);
  ok('the board actually changed after the move', boardStr(g.board) !== before1);
  eq(g.game.moves, movesBefore1 + 1, 'the moves counter advances by exactly one');
  ok('still in playing state after one move', g.game.state === 'playing');

  console.log('\n--- core loop: three moves in a row, still advancing ---');
  g.reset(999);
  let stuck = false;
  for (let i = 0; i < 3; i++) {
    const b = boardStr(g.board);
    const m0 = g.game.moves;
    const dir = tryAnyMove();
    if (dir === null) { stuck = true; break; }
    ok(`move #${i + 1} changes the board`, boardStr(g.board) !== b);
    ok(`move #${i + 1} advances the moves counter`, g.game.moves === m0 + 1);
    ok(`move #${i + 1} leaves the game accepting input (state still playing)`, g.game.state === 'playing');
  }
  ok('three consecutive moves were all accepted (no premature soft-lock)', !stuck);

  console.log('\n--- core loop: an illegal direction is refused, not consumed ---');
  // Build a board where only "up" does anything: a single column of stacked
  // distinct values already pressed to the top, rest empty.
  g.reset(1);
  clearBoard();
  // column 0 packed to the top, one empty cell at the bottom
  g.board[0][0] = 2; g.board[1][0] = 4; g.board[2][0] = 8; g.board[3][0] = 0;
  const movesX = g.game.moves;
  g.move(-1, 0); // up: already fully compacted & no merges possible -> no-op
  eq(g.game.moves, movesX, 'a no-op direction does not advance the moves counter');
  eq(g.game.state, 'playing', 'a no-op move leaves the game in playing state');
  g.move(1, 0); // down: room to fall into the empty cell -> a real move
  eq(g.game.moves, movesX + 1, 'a different, legal direction still works right after a no-op');

  /* ======================= WIN PATH ======================= */
  console.log('\n--- exhausting the win condition ---');
  g.reset(2);
  clearBoard();
  g.board[0][0] = 1024; g.board[0][1] = 1024;
  const scoreBeforeWin = g.game.score;
  g.move(0, -1); // slide left: merges the two 1024s into 2048
  ok('the merge into 2048 is reflected on the board immediately', g.board.flat().includes(2048));
  eq(g.game.state, 'playing', 'state has not yet flipped to won (200ms delay still pending)');
  await sleep(300);
  eq(g.game.state, 'won', 'reaching 2048 flips state to won after the delay');
  ok('the win awarded score', g.game.score > scoreBeforeWin);

  console.log('\n--- restart after winning ---');
  g.reset();
  eq(g.game.state, 'playing', 'reset() from the won screen returns to playing');
  eq(g.game.score, 0, 'score is cleared on restart');
  eq(g.game.moves, 0, 'moves is cleared on restart');
  const postWinDir = tryAnyMove();
  ok('the game accepts input again after restarting from a win', postWinDir !== null);

  /* ======================= LOSE PATH ======================= */
  console.log('\n--- exhausting the fail condition (no legal moves left) ---');
  // Fully pack the board so exactly one merge is available (the two 4s in
  // row 0); every other adjacency is a strict 8/16 checkerboard so nothing
  // else can ever match, and the cell that empties out after the merge
  // (0,3) borders only 8s/16s, so whatever addTile() drops there (2 or 4)
  // still can't match anything. This makes the post-move board provably
  // stuck regardless of the RNG's tile choice.
  g.reset(3);
  const pre = [
    [4, 4, 16, 8],
    [16, 8, 16, 8],
    [8, 16, 8, 16],
    [16, 8, 16, 8],
  ];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) g.board[r][c] = pre[r][c];
  ok('the rigged pre-move board is completely full (no empty cells)', g.board.flat().every(v => v !== 0));
  g.move(0, -1); // slide left: merges the (4,4) pair; refills the vacated cell
  ok('the merge happened (board changed)', g.board[0][1] !== 4 || g.board[0][0] !== 4);
  ok('the resulting board has no empty cells (addTile refilled it)', g.board.flat().every(v => v !== 0));
  ok('canMove() independently confirms no legal moves remain', g.canMove() === false);
  eq(g.game.state, 'playing', 'state has not yet flipped to gameover (200ms delay still pending)');
  await sleep(300);
  eq(g.game.state, 'gameover', 'exhausting all legal moves reaches a real gameover ending');

  console.log('\n--- restart after losing ---');
  g.reset();
  eq(g.game.state, 'playing', 'reset() from the gameover screen returns to playing');
  eq(g.game.moves, 0, 'moves is cleared on restart');
  const postLoseDir = tryAnyMove();
  ok('the game accepts input again after restarting from a loss', postLoseDir !== null);

  /* ======================= POWER-UP ANALOG: UNDO ======================= */
  // This game has no skip/hint system; undo is its power-up-shaped mechanic
  // (bounded use: exactly one level deep). Verify it restores state and,
  // crucially, that the game keeps accepting input afterward rather than
  // freezing (the failure shape the protocol calls out).
  console.log('\n--- power-up analog: undo advances/restores rather than freezing ---');
  g.reset(4321);
  const snapBoard = boardStr(g.board);
  const snapScore = g.game.score;
  const snapMoves = g.game.moves;
  const dirU = tryAnyMove();
  ok('a move exists to undo', dirU !== null);
  ok('the move actually changed the board', boardStr(g.board) !== snapBoard);
  g.undo();
  eq(boardStr(g.board), snapBoard, 'undo restores the exact pre-move board');
  eq(g.game.score, snapScore, 'undo restores the pre-move score');
  eq(g.game.moves, snapMoves, 'undo restores the pre-move move count');
  eq(g.game.state, 'playing', 'undo leaves the game in playing state, not frozen');

  // the game must still accept input right after an undo
  const dirAfterUndo = tryAnyMove();
  ok('input is accepted again immediately after an undo', dirAfterUndo !== null);

  // undo is one level deep: a second consecutive undo (nothing new to undo
  // against, since the last move already consumed the snapshot) must be
  // refused WITHOUT freezing further input.
  g.reset(555);
  tryAnyMove();
  g.undo();
  const boardAfterFirstUndo = boardStr(g.board);
  g.undo(); // no snapshot left -> should be a safe no-op, not a throw/freeze
  eq(boardStr(g.board), boardAfterFirstUndo, 'a second consecutive undo (nothing to undo) is a safe no-op');
  const dirAfterDoubleUndo = tryAnyMove();
  ok('the game still accepts input after an exhausted undo', dirAfterDoubleUndo !== null);

  // undo must not be usable to escape/mutate a non-playing state
  g.reset(6);
  clearBoard();
  g.board[0][0] = 1024; g.board[0][1] = 1024;
  g.move(0, -1);
  await sleep(300);
  eq(g.game.state, 'won', 'sanity: state is won going into the undo-while-won check');
  let undoThrew = false;
  try { g.undo(); } catch (e) { undoThrew = true; }
  ok('undo() does not throw when called from a non-playing (won) state', !undoThrew);
  eq(g.game.state, 'won', 'undo does not silently un-freeze/escape the won screen');

  /* ======================= PAUSE IS NOT A SOFT-LOCK ======================= */
  console.log('\n--- pause/resume does not freeze the game ---');
  g.reset(7);
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause() pauses from playing');
  const beforePause = boardStr(g.board);
  g.move(0, 1);
  eq(boardStr(g.board), beforePause, 'moves are correctly refused while paused');
  g.togglePause();
  eq(g.game.state, 'playing', 'togglePause() resumes back to playing');
  const dirAfterResume = tryAnyMove();
  ok('the game accepts input again after resuming from pause', dirAfterResume !== null);

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
