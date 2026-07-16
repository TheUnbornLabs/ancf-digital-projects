// jsdom test harness for Rune Match (#79)
// Memory card matching game: 20 face-down cards (10 pairs), 6 rounds, no fail
// condition (no lives/timer that ends the game) — the only ending is clearing
// all six rounds. Drives the real loop through window.__cfq: clickCard, update,
// resetGame, plus the actual canvas mousedown handler for the restart path.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'rune-match', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
const canvas = win.document.getElementById('game');

// The round-start "peek" (all cards briefly revealed) blocks clickCard while
// peekT>0. peekT itself isn't exposed on the hook, but its max is 1400ms and
// update() clamps dt to 48ms/call, so 40 calls (1920ms of sim time) always
// clears it regardless of round.
function skipPeek() { for (let i = 0; i < 40; i++) g.update(48); }

// Solve every remaining pair in the current round by only ever clicking two
// cards that are known to match (never triggers the mismatch/lockout path).
// Returns the number of pairs cleared.
function clearRound() {
  skipPeek();
  const byRune = {};
  g.cards.forEach((c, i) => { if (!c.matched) (byRune[c.rune] = byRune[c.rune] || []).push(i); });
  const pairs = Object.values(byRune).filter(ix => ix.length === 2);
  for (const [i1, i2] of pairs) { g.clickCard(i1); g.clickCard(i2); }
  return pairs.length;
}

function clickCanvasAt(x, y) {
  const ev = new win.MouseEvent('mousedown', { clientX: x, clientY: y, bubbles: true, cancelable: true });
  canvas.dispatchEvent(ev);
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'clickCard', 'cardAt', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.RUNES));
  ok('canvas element is present', !!canvas);
  ok('no uncaught page errors on load', pageErrors.length === 0);

  eq(g.TOTAL, 6, 'the round collection has 6 rounds');
  const pairCount = Math.min(g.COLS * g.ROWS / 2, g.RUNES.length);
  eq(pairCount, 10, 'the board holds 10 pairs (20 cards)');

  let drewOk = true;
  g.resetGame();
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

  /* ======================= LOGIC: core loop ======================= */
  console.log('\n--- logic: setup ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame sets state to playing');
  eq(g.game.round, 0, 'resetGame starts at round 0');
  eq(g.game.score, 0, 'resetGame resets score');
  eq(g.game.moves, 0, 'resetGame resets moves');
  eq(g.game.transition, false, 'round starts un-blocked');
  eq(g.cards.length, 20, 'the board has 20 cards');
  ok('exactly 10 distinct runes, each appearing twice',
    Object.values(g.cards.reduce((m, c) => (m[c.rune] = (m[c.rune] || 0) + 1, m), {})).every(n => n === 2)
    && new Set(g.cards.map(c => c.rune)).size === 10);

  console.log('\n--- logic: peek blocks input, then releases it ---');
  g.resetGame();
  const preSkipFlipped = g.flipped.length;
  g.clickCard(0);   // still inside the peek window — must be a no-op
  eq(g.flipped.length, preSkipFlipped, 'clicking during the round-start peek has no effect');
  skipPeek();
  g.clickCard(0);
  ok('clicking after the peek ends is accepted', g.flipped.length === 1 || g.cards[0].matched);

  console.log('\n--- logic: advancing (the core loop) ---');
  g.resetGame();
  const scoreBefore = g.game.score;
  const pairsCleared = clearRound();
  eq(pairsCleared, 10, 'clearing a round matches all 10 pairs');
  ok('clearing every pair awards a point immediately', g.game.score === scoreBefore + 1);
  ok('completing a round blocks input while it transitions', g.game.transition === true);
  eq(g.game.round, 0, 'round counter has not advanced yet (still inside the 600ms transition)');

  await sleep(700);   // the scheduled round-advance (600ms) must have fired by now
  eq(g.game.round, 1, 'completing a round advances the round counter');
  eq(g.game.transition, false, 'input is unblocked on the new round');
  eq(g.game.state, 'playing', 'still playing after advancing (round 2 of 6)');
  ok('the new round deals a fresh, fully face-down (unmatched) board',
    g.cards.length === 20 && g.cards.every(c => !c.matched));

  console.log('\n--- logic: three rounds in a row, still advancing ---');
  g.resetGame();
  const roundTrail = [g.game.round];
  for (let i = 0; i < 3; i++) {
    clearRound();
    await sleep(700);
    roundTrail.push(g.game.round);
  }
  eq(roundTrail.join(','), '0,1,2,3', 'three consecutive clears advance the round counter 0->1->2->3');
  ok('still accepting input after three consecutive clears',
    (() => { skipPeek(); const before = g.flipped.length; g.clickCard(0); return g.flipped.length === before + 1 || g.cards[0].matched; })());

  console.log('\n--- logic: mismatch path does not soft-lock ---');
  g.resetGame();
  skipPeek();
  const rune0 = g.cards[0].rune;
  const wrongIdx = g.cards.findIndex((c, i) => i !== 0 && c.rune !== rune0);
  ok('a non-matching pair exists to test', wrongIdx >= 0);
  g.clickCard(0);
  g.clickCard(wrongIdx);
  eq(g.lockout, true, 'a mismatched pair engages the lockout');
  const flippedDuringLockout = g.flipped.length;
  g.clickCard((wrongIdx + 1) % g.cards.length === 0 ? 1 : 2); // try a third card mid-lockout
  eq(g.flipped.length, flippedDuringLockout, 'a third click during lockout is refused, not queued');
  await sleep(900);   // the scheduled un-flip (800ms) must have fired by now
  eq(g.lockout, false, 'lockout releases on its own after the mismatch delay');
  eq(g.flipped.length, 0, 'the mismatched cards are flipped back down');
  ok('the mismatched cards are no longer revealed',
    !g.cards[0].revealed && !g.cards[wrongIdx].revealed);
  const afterLockoutFlipped = g.flipped.length;
  g.clickCard(0);
  ok('input is accepted again after a mismatch resolves', g.flipped.length === afterLockoutFlipped + 1);

  console.log('\n--- logic: pause does not soft-lock ---');
  g.resetGame();
  skipPeek();
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause pauses the game');
  const timeAtPause = g.game.time;
  g.update(500);
  eq(g.game.time, timeAtPause, 'simulation time is frozen while paused');
  g.togglePause();
  eq(g.game.state, 'playing', 'togglePause resumes back to playing');
  const beforeResumeFlip = g.flipped.length;
  g.clickCard(0);
  ok('input is accepted again after resuming from pause',
    g.flipped.length === beforeResumeFlip + 1 || g.cards[0].matched);

  console.log('\n--- logic: exhaust the game -> reach a real ending ---');
  // This game has no fail condition (no lives, no losing timer) — the only
  // ending is clearing all 6 rounds, so that is the path exercised here.
  g.resetGame();
  const trail = [g.game.round];
  let iterations = 0;
  while (g.game.state === 'playing' && iterations < 20) {
    clearRound();
    await sleep(700);
    trail.push(g.game.round);
    iterations++;
  }
  eq(g.game.state, 'won', 'clearing all six rounds reaches the real ending (won)');
  eq(g.game.round, g.TOTAL, 'the round counter reflects all rounds cleared');
  ok('every round strictly advanced with no repeat/stall (no soft-lock across the whole run)',
    trail.every((r, i) => i === 0 || r > trail[i - 1]));
  eq(trail.length, g.TOTAL + 1, 'exactly 6 advances were needed, no extra stalled iterations');
  ok('the win screen reports a full score', g.game.score === g.TOTAL);

  console.log('\n--- logic: restart from the ending via the REAL restart handler ---');
  // Drive this through the actual canvas mousedown listener (onDown), not by
  // guessing an entry point — a click anywhere on the canvas while state is
  // 'won' is what index.html itself treats as "play again".
  eq(g.game.transition, false, 'not mid-transition, so the restart tap will be honoured');
  clickCanvasAt(480, 270);
  eq(g.game.state, 'playing', 'a real click on the canvas restarts the game from the won screen');
  eq(g.game.round, 0, 'restart returns to round 0');
  eq(g.game.score, 0, 'restart resets the score');
  skipPeek();
  const postRestartFlipped = g.flipped.length;
  g.clickCard(0);
  ok('input is accepted again after restarting', g.flipped.length === postRestartFlipped + 1 || g.cards[0].matched);

  console.log('\n--- logic: restart tap is refused mid-transition (by design, not a soft-lock) ---');
  // While game.transition is true the state is still 'playing' (not yet
  // 'won'/'title'), so onDown's restart branch cannot fire here anyway; this
  // just confirms the transition flag itself does not wedge the real loop.
  g.resetGame();
  clearRound();
  ok('transition flag is set immediately after the final pair of a round', g.game.transition === true);
  eq(g.game.state, 'playing', 'state is still "playing" during the transition (restart branch does not apply yet)');
  await sleep(700);
  eq(g.game.transition, false, 'the transition flag clears on its own once the round-advance timeout fires');

  console.log('\n--- logic: no skip / hint / power-up path in this game ---');
  // Rune Match has no skip, hint, or power-up mechanic — the source (clickCard,
  // onDown, the hook surface) exposes only flip/match/pause/mute. Documenting
  // the absence rather than fabricating a test for a feature that isn't there.
  const hasSkipOrHint = /skipWord|revealHint|revealLetter|powerUp|useHint/i.test(html);
  ok('N/A: no skip/hint/power-up mechanic exists to test (confirmed absent from source)', !hasSkipOrHint);

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
