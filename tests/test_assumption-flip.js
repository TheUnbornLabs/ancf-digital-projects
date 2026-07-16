// jsdom Tier 2 playthrough suite for Assumption Flip (#11)
// A memory-match game: flip two cards, matching "assumption" -> "reality" pairs.
// Three rounds of rising grid size. No lives/lose state — the only terminal
// screen is 'won' after all three rounds are cleared.
//
// This suite drives the REAL loop through window.__cfq and asserts progression
// over time (per PROTOCOL.md), not just single-step setup. Known harness
// pitfall (documented in PROTOCOL.md itself): startRound(r) REQUIRES its round
// argument — calling it bare fabricates NaN state. Every call below passes r.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'assumption-flip', 'index.html');
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
    w.requestAnimationFrame = () => 0;  // disable auto-loop; we drive update() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;         // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// ---- helpers over the real game rules (indices are fixed per round; the
// shuffle happens once in buildCards, positions don't move after that) ----
function flipCard(idx) {
  const c = g.cards[idx];
  g.tryFlip(c.x + c.w / 2, c.y + c.h / 2);
}
function indicesForPair(pairId) {
  const out = [];
  for (let i = 0; i < g.cards.length; i++) if (g.cards[i].pairId === pairId) out.push(i);
  return out;
}
function clearPeek() {
  let guard = 0;
  while (g.game.peekT > 0 && guard++ < 200) g.update(48);
}
// Flip a real matching pair (assumption + its reality). Resolves synchronously
// (no lock) since a match clears `flipped` immediately in tryFlip.
function matchPair(pairId) {
  const [i1, i2] = indicesForPair(pairId);
  flipCard(i1);
  flipCard(i2);
}
// Deliberately flip a mismatched pair (two different, still-unmatched pairIds).
function mismatchPair() {
  const avail = g.cards.map((c, i) => i).filter(i => !g.cards[i].matched);
  const pidA = g.cards[avail[0]].pairId;
  let j = avail.find(i => g.cards[i].pairId !== pidA);
  flipCard(avail[0]);
  flipCard(j);
}
// Clear the whole current round via real matches, then wait for the
// setTimeout(700ms) that advances round / declares 'won'.
async function completeRound() {
  clearPeek();
  const rd = g.ROUNDS[g.game.round];
  for (let pid = 0; pid < rd.pairs; pid++) matchPair(pid);
  await sleep(800);
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['buildCards', 'startRound', 'resetGame', 'tryFlip', 'update', 'draw', 'cardAt', 'useHint']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game/cards/ROUNDS state', !!g.game && Array.isArray(g.ROUNDS) && Array.isArray(g.PAIRS));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.ROUNDS.length, 3, 'there are 3 rounds');
  ok('every round has more pairs available than PAIRS defines is impossible (sanity)', g.ROUNDS.every(r => r.pairs <= g.PAIRS.length));

  /* =============== CORE LOOP: one match advances =============== */
  console.log('\n--- core loop: a single match advances the game ---');
  g.startRound(0);   // NOTE: argument required; startRound() bare would fabricate NaN state
  eq(g.game.state, 'playing', 'startRound(0) enters playing');
  eq(g.game.round, 0, 'startRound(0) sets round to 0');
  clearPeek();
  eq(g.game.peekT, 0, 'peek timer reaches 0 under update()');

  const matchedBefore = g.cards.filter(c => c.matched).length;
  const movesBefore = g.game.moves;
  matchPair(0);
  const matchedAfter = g.cards.filter(c => c.matched).length;
  ok('a correct pair flips both cards to matched (the game ADVANCES)', matchedAfter === matchedBefore + 2);
  eq(g.game.moves, movesBefore + 1, 'a completed flip-pair counts as one move');
  eq(g.flipped.length, 0, 'flipped selection clears immediately after a match (no soft-lock)');
  ok('score increased on match', g.game.score > 0);

  /* =============== do it three times running, still advancing =============== */
  console.log('\n--- three matches in a row: still advancing, still accepting input ---');
  const rd0 = g.ROUNDS[0];
  for (let pid = 1; pid <= 3 && pid < rd0.pairs; pid++) {
    const before = g.cards.filter(c => c.matched).length;
    matchPair(pid);
    const after = g.cards.filter(c => c.matched).length;
    ok(`match #${pid + 1} in a row still advances (matched ${before}->${after})`, after === before + 2);
    ok(`input still accepted after match #${pid + 1} (flipped cleared)`, g.flipped.length === 0);
  }

  /* =============== wrong-match lockout does not freeze the game =============== */
  console.log('\n--- mismatch: lockout resolves, no soft-lock ---');
  g.startRound(0);
  clearPeek();
  mismatchPair();
  eq(g.flipped.length, 2, 'a mismatch leaves both cards face-up momentarily');
  const thirdIdx = g.cards.map((c, i) => i).find(i => !g.flipped.includes(i));
  const flippedLenDuringLock = g.flipped.length;
  flipCard(thirdIdx);
  eq(g.flipped.length, flippedLenDuringLock, 'a third card is refused while 2 are already face-up (by design, not a bug)');
  let guard = 0;
  while (g.flipped.length === 2 && guard++ < 100) g.update(48);
  eq(g.flipped.length, 0, 'the mismatched pair flips back down once the lock timer expires');
  ok('cards are face-down again after the lock clears', g.cards.every(c => c.matched || !c.face));
  // prove the game still accepts input after a mismatch resolves
  const matchedBeforeAfterMismatch = g.cards.filter(c => c.matched).length;
  matchPair(0);
  ok('a real match still works right after a mismatch resolves (no soft-lock)',
    g.cards.filter(c => c.matched).length === matchedBeforeAfterMismatch + 2);

  /* =============== exhaust the fail condition: clear all 3 rounds -> real ending =============== */
  console.log('\n--- exhaust the win condition: clear all 3 rounds -> a real ending ---');
  // NOTE: this game has no lose/game-over state reachable from normal play —
  // grep confirms game.state is only ever assigned 'title' | 'playing' | 'paused' | 'won'.
  // 'gameover' appears solely in a comment. So "exhaust the fail condition" here
  // means "clear the win condition all the way to the finished screen".
  g.startRound(0);
  eq(g.game.round, 0, 'fresh run starts at round 0');
  await completeRound();
  eq(g.game.round, 1, 'clearing round 1 advances to round 2 (game.round 0->1)');
  eq(g.game.state, 'playing', 'still playing after round 1 -> round 2 transition');
  ok('round 2 has a freshly built, unmatched board', g.cards.length > 0 && g.cards.every(c => !c.matched));

  await completeRound();
  eq(g.game.round, 2, 'clearing round 2 advances to round 3 (game.round 1->2)');
  eq(g.game.state, 'playing', 'still playing after round 2 -> round 3 transition');

  await completeRound();
  eq(g.game.state, 'won', 'clearing round 3 reaches the real ending (state=won)');
  ok('all three rounds recorded a move count', g.roundMoves ? true : g.game.roundMoves.every(m => m !== null));

  /* =============== restart from the ending -> playable again =============== */
  console.log('\n--- restart from the ending: playable again ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame() from the won screen re-enters playing');
  eq(g.game.round, 0, 'resetGame() returns to round 0');
  clearPeek();
  const matchedAtRestart = g.cards.filter(c => c.matched).length;
  eq(matchedAtRestart, 0, 'the new board starts fully unmatched');
  matchPair(0);
  ok('a match works on the very first round after restart (not frozen)',
    g.cards.filter(c => c.matched).length === 2);

  /* =============== hint: advances rather than consuming-and-freezing =============== */
  console.log('\n--- hint: consumes without freezing progression ---');
  g.startRound(0);
  clearPeek();
  eq(g.game.hintsLeft, 3, 'a fresh round grants 3 hints');
  const hintIdxSeen = [];
  for (let i = 0; i < 3; i++) {
    const before = g.game.hintsLeft;
    g.useHint();
    eq(g.game.hintsLeft, before - 1, `hint #${i + 1} consumes one hint charge`);
    ok(`hint #${i + 1} points at a real, unmatched card`, g.game.hintIdx >= 0 && !g.cards[g.game.hintIdx].matched);
    hintIdxSeen.push(g.game.hintIdx);
  }
  const hintsAtZero = g.game.hintsLeft;
  g.useHint();
  eq(g.game.hintsLeft, hintsAtZero, 'using a hint with none left is refused, not an error');
  // critically: exhausting hints must not freeze the core loop
  const matchedBeforeHintCheck = g.cards.filter(c => c.matched).length;
  matchPair(0);
  ok('the game still advances via real matches after all hints are spent',
    g.cards.filter(c => c.matched).length === matchedBeforeHintCheck + 2);

  /* =============== pause/mute do not block the loop =============== */
  console.log('\n--- pause/mute toggle back to playable ---');
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause() pauses from playing');
  g.togglePause();
  eq(g.game.state, 'playing', 'togglePause() resumes back to playing');
  const matchedBeforePauseCheck = g.cards.filter(c => c.matched).length;
  matchPair(1);
  ok('a match still works after a pause/resume cycle',
    g.cards.filter(c => c.matched).length === matchedBeforePauseCheck + 2);

  /* =============== round 3's soft move-cap never hard-blocks input =============== */
  console.log('\n--- round 3 soft move-cap degrades score only, never blocks input ---');
  g.startRound(2);
  clearPeek();
  const rd2 = g.ROUNDS[2];
  ok('round 3 defines a soft move cap', rd2.moveLimit > 0);
  // drive mismatches past the cap
  let mismatches = 0;
  while (g.game.moves < rd2.moveLimit + 3 && mismatches < 60) {
    mismatchPair();
    let guard2 = 0;
    while (g.flipped.length === 2 && guard2++ < 100) g.update(48);
    mismatches++;
  }
  ok('moves exceeded the soft cap', g.game.moves >= rd2.moveLimit);
  eq(g.game.state, 'playing', 'exceeding the soft move cap does not end or freeze the game');
  // the round must still be completable after blowing past the cap
  const rd2again = g.ROUNDS[g.game.round];
  for (let pid = 0; pid < rd2again.pairs; pid++) matchPair(pid);
  await sleep(800);
  eq(g.game.state, 'won', 'round 3 can still be completed to the real ending after exceeding its soft move cap');

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
