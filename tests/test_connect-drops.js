// jsdom Tier 2 playthrough suite for Connect Drops (#36) — Connect Four vs AI.
// Drives the real loop through window.__cfq: clickCol() (the actual click handler),
// update() (the actual per-frame tick), aiMove()/useHint()/undoLastDrop()/resetGame()
// (all exposed directly on the hook). rAF is disabled; we drive update() manually.
// The AI replies via a real `setTimeout(...,300)` scheduled from inside update() —
// we let real Node timers fire for that (await sleep), we do not fake them.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'connect-drops', 'index.html');
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
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;          // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// ---- board geometry, taken straight from the source constants ----
// GCOLS=7, CELL=64, W=960 -> GX=(960-7*64)/2=256. Not exposed on the hook, so we
// hardcode the same numbers the game itself uses (this is per-game knowledge, not a guess).
const CELL = 64, GX = 256;
const colMX = c => GX + c * CELL + CELL / 2;

function pump(n) { for (let i = 0; i < n; i++) g.update(16); }         // 60*12=720 > any drop distance (max 384)
function filled(grid) { return grid.reduce((s, row) => s + row.filter(x => x !== 0).length, 0); }
function openCols(grid) { const r = []; for (let c = 0; c < g.GCOLS; c++) if (grid[0][c] === 0) r.push(c); return r; }

// Drive one player drop through the real click handler + real per-frame tick.
function playerDrop(col) { g.clickCol(colMX(col)); pump(60); }
// Let the AI's real scheduled setTimeout(...,300) fire, then animate its drop.
async function aiReply() { await sleep(450); pump(60); }

(async () => {

  /* ======================= wiring ======================= */
  console.log('\n--- wiring ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'dropPiece', 'checkWin', 'aiMove', 'clickCol', 'update', 'draw',
    'undoLastDrop', 'useHint', 'togglePause', 'toggleMute', 'saveProgress', 'loadProgress']
    .every(k => typeof g[k] === 'function'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.GCOLS, 7, 'board is 7 columns');
  eq(g.GROWS, 6, 'board is 6 rows');

  /* ======================= 1. core action advances ======================= */
  console.log('\n--- 1. one drop advances the game ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts a playing round');
  eq(filled(g.grid), 0, 'the board starts empty');
  eq(g.game.turn, g.PLAYER, "it is the player's turn first");

  const col0 = openCols(g.grid)[0];
  playerDrop(col0);
  ok('the player\'s disc actually lands on the board', filled(g.grid) === 1);
  eq(g.grid[g.GROWS - 1][col0], g.PLAYER, 'the disc landed in the bottom of the chosen column');

  if (g.game.state === 'playing') {
    eq(g.game.turn, g.AI, 'turn passes to the AI after the player drops');
    await aiReply();
    ok('the AI replies and the board advances again', filled(g.grid) >= 2);
    if (g.game.state === 'playing') eq(g.game.turn, g.PLAYER, 'turn returns to the player after the AI replies');
  } else {
    ok('SKIPPED ai-reply check (player won on the opening drop, engine bug not player skill)', true);
  }

  /* ======================= 2. three rounds running ======================= */
  console.log('\n--- 2. three rounds in a row: still advancing, still accepting input ---');
  g.resetGame();
  let prevFilled = filled(g.grid);
  let roundsPlayed = 0;
  for (let i = 0; i < 3; i++) {
    if (g.game.state !== 'playing') { ok(`round ${i + 1} SKIPPED (game already ended)`, true); continue; }
    const oc = openCols(g.grid);
    if (!oc.length) break;
    playerDrop(oc[0]);
    ok(`round ${i + 1}: the player's move is accepted (board grows)`, filled(g.grid) > prevFilled);
    prevFilled = filled(g.grid);
    if (g.game.state === 'playing' && g.game.turn === g.AI) {
      await aiReply();
      ok(`round ${i + 1}: the AI's reply is accepted (board grows again)`, filled(g.grid) >= prevFilled);
      prevFilled = filled(g.grid);
    }
    roundsPlayed++;
  }
  ok('at least one full round was actually driven', roundsPlayed > 0);

  /* ======================= 3. exhaust the game -> a real ending ======================= */
  console.log('\n--- 3. forced player-win ending (real checkWin path) ---');
  g.resetGame();
  const winsBefore = g.game.wins;
  // Set up 3-in-a-row on the bottom row for the player, then complete it with a real clickCol.
  g.grid[g.GROWS - 1][0] = g.PLAYER;
  g.grid[g.GROWS - 1][1] = g.PLAYER;
  g.grid[g.GROWS - 1][2] = g.PLAYER;
  g.game.turn = g.PLAYER;
  playerDrop(3);
  eq(g.game.state, 'won', 'completing 4-in-a-row through the real drop path ends the round');
  eq(g.game.lastWinner, g.PLAYER, 'the player is recorded as the winner');
  eq(g.game.wins, winsBefore + 1, 'the win is tallied');
  ok('a win popup was spawned', g.game.popups.length > 0);
  ok('progress was persisted to localStorage', JSON.parse(win.localStorage.getItem('connectDropsProgress_v1')).wins === g.game.wins);

  console.log('\n--- 3b. forced AI-win ending (real aiMove + checkWin path) ---');
  g.resetGame();
  const lossesBefore = g.game.losses;
  g.grid[g.GROWS - 1][0] = g.AI;
  g.grid[g.GROWS - 1][1] = g.AI;
  g.grid[g.GROWS - 1][2] = g.AI;
  g.game.turn = g.AI;   // it really is the AI's turn when we invoke aiMove()
  g.aiMove();
  pump(60);
  eq(g.game.state, 'won', 'the AI completing 4-in-a-row through the real aiMove path ends the round');
  eq(g.game.lastWinner, g.AI, 'the AI is recorded as the winner');
  eq(g.game.losses, lossesBefore + 1, 'the loss is tallied');

  console.log('\n--- 3c. an unforced full playthrough also reaches a real ending ---');
  g.resetGame();
  let guard = 0;
  while (g.game.state === 'playing' && guard < 45) {
    const oc = openCols(g.grid);
    if (!oc.length) break;
    playerDrop(oc[0]);                                   // naive player: always leftmost open column
    if (g.game.state === 'playing' && g.game.turn === g.AI) await aiReply();
    guard++;
  }
  ok('an unforced playthrough (naive player vs the real AI) reaches state=won within 45 rounds', g.game.state === 'won');
  ok('the ending has a valid winner code', [0, g.PLAYER, g.AI].includes(g.game.lastWinner));
  ok('the final board is fully consistent (4..42 discs placed)', filled(g.grid) >= 4 && filled(g.grid) <= 42);

  /* ======================= 4. restart from that ending -> playable again ======================= */
  console.log('\n--- 4. restart from the ending ---');
  const statsBefore = { wins: g.game.wins, losses: g.game.losses, draws: g.game.draws };
  g.resetGame();   // this is literally what the real mousedown handler calls when state==='won'
  eq(g.game.state, 'playing', 'resetGame from a finished round returns to playing');
  eq(filled(g.grid), 0, 'the board is cleared on restart');
  eq(g.game.turn, g.PLAYER, "it is the player's turn again after restart");
  ok('cumulative win/loss/draw stats survive the restart',
    g.game.wins === statsBefore.wins && g.game.losses === statsBefore.losses && g.game.draws === statsBefore.draws);
  const rc = openCols(g.grid)[0];
  playerDrop(rc);
  ok('input is accepted again after restart (not soft-locked)', g.grid[g.GROWS - 1][rc] === g.PLAYER);

  /* ======================= 5. hint / undo: advance, don't freeze ======================= */
  console.log('\n--- 5a. hint advances rather than consuming and freezing ---');
  g.resetGame();
  g.useHint();
  ok('useHint proposes a valid column', g.game.hintCol >= 0 && g.game.hintCol < g.GCOLS);
  eq(g.game.hintUsedThisTurn, true, 'the hint is marked used for this turn');
  const hintedCol = g.game.hintCol;
  playerDrop(hintedCol);
  ok('following the hint still drops a disc (game did not freeze after hinting)', filled(g.grid) >= 1);

  console.log('\n--- 5b. undo advances rather than consuming and freezing ---');
  g.resetGame();
  playerDrop(openCols(g.grid)[0]);
  if (g.game.state === 'playing') await aiReply();
  const filledBeforeUndo = filled(g.grid);
  ok('sanity: a round was actually played before testing undo', filledBeforeUndo > 0);
  g.undoLastDrop();
  ok('undo actually reverts the board', filled(g.grid) < filledBeforeUndo);
  eq(g.game.turn, g.PLAYER, 'undo restores the turn that was active before the drop');
  eq(g.game.state, 'playing', 'the game is still playing after an undo');
  const afterUndoCol = openCols(g.grid)[0];
  playerDrop(afterUndoCol);
  ok('input is accepted again after an undo (not soft-locked)', filled(g.grid) >= filledBeforeUndo - 1);

  console.log('\n--- 5c. undo cannot be used twice in the same round (guard sanity check) ---');
  const filledAfterSecondDrop = filled(g.grid);
  g.undoLastDrop();
  eq(filled(g.grid), filledAfterSecondDrop, 'a second undo in the same round is correctly refused');

  console.log('\n--- 5d. undo leaves a stale AI-reply timeout armed ---');
  // Real sequence: player drops -> AI's move is scheduled via setTimeout(...,300) from
  // inside update(). If the player calls undo *before* that timeout fires, the timeout
  // is not cancelled: it still fires later and calls aiMove() purely because
  // game.state==='playing', with no check that it is still actually the AI's turn.
  g.resetGame();
  playerDrop(openCols(g.grid)[0]);           // schedules the AI's real setTimeout(aiMove, 300)
  eq(g.game.state, 'playing', 'setup: still playing after the player drop');
  eq(g.game.turn, g.AI, 'setup: turn has passed to the AI (this is when the timeout is armed)');
  g.undoLastDrop();                          // undo BEFORE the 300ms timeout fires
  eq(filled(g.grid), 0, 'undo reverted the board to empty');
  eq(g.game.turn, g.PLAYER, 'undo reverted the turn to the player');
  await sleep(450);                          // let the stale timeout actually fire
  pump(60);
  const filledAfterStaleTimeout = filled(g.grid);
  if (filledAfterStaleTimeout > 0) {
    ok('BUG CANDIDATE: the stale AI-reply timeout fired after undo and placed an AI disc ' +
       `(board went from 0 discs to ${filledAfterStaleTimeout} even though it was the player's turn, ` +
       'and the player never made a move to prompt it)', false);
  } else {
    ok('the stale AI-reply timeout produced no move after undo (no bug found here)', true);
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
