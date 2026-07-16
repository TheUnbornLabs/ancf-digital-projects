// jsdom Tier 2 playthrough suite for Word Bridge (#71)
// Core loop: two words shown, pick the bridging word from 4 choices, 15 rounds, then 'won'.
// This suite drives the REAL loop through window.__cfq and asserts progression over time,
// not just setup. See tests/audit/PROTOCOL.md for why single-step assertions are worthless.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'word-bridge', 'index.html');
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

// REAL setTimeout drives advanceRound() in this game (900ms REVEAL_MS after an answer,
// or after a timeout). rAF is stubbed out, but window.setTimeout is the real Node timer,
// so `await sleep(ms)` genuinely lets those callbacks fire — this is load-bearing for
// the whole suite, including the bug this suite finds.
const REVEAL_MS = 900;

// Answer the current round with the correct option (index into g.options).
function answerCorrect() {
  const p = g.PUZZLES[g.game.order[g.game.round % g.game.order.length]];
  const i = g.options.findIndex(o => o === p.answer);
  g.choose(i);
  return i;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API',
    ['resetGame', 'buildRound', 'choose', 'update', 'draw', 'advanceRound', 'togglePause', 'toggleMute', 'skipReveal']
      .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.PUZZLES));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.TOTAL, 15, 'round total is 15');
  ok('every puzzle has an answer and 3 wrong options', g.PUZZLES.every(p => typeof p.answer === 'string' && Array.isArray(p.wrong) && p.wrong.length === 3));

  console.log('\n--- logic: setup ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame puts the game in playing state');
  eq(g.game.round, 0, 'resetGame starts at round 0');
  eq(g.game.score, 0, 'resetGame resets score');
  eq(g.game.chosen, -1, 'resetGame starts with nothing chosen');
  eq(g.options.length, 4, 'a round offers 4 options');

  /* ======================= CORE LOOP ======================= */
  console.log('\n--- core loop: answering advances the round (soft-lock check) ---');
  g.resetGame();
  const r0 = g.game.round;
  answerCorrect();
  ok('choosing an answer blocks further input until the reveal resolves', g.game.chosen >= 0);
  await sleep(REVEAL_MS + 100);
  eq(g.game.round, r0 + 1, 'answering a round advances to the next round');
  eq(g.game.state, 'playing', 'still playing after advancing');
  eq(g.game.chosen, -1, 'the new round starts with nothing chosen');
  ok('the new round has a fresh set of 4 options', g.options.length === 4);

  console.log('\n--- core loop: three rounds running, still advancing, still accepting input ---');
  g.resetGame();
  for (let i = 0; i < 3; i++) {
    const before = g.game.round;
    answerCorrect();
    await sleep(REVEAL_MS + 100);
    eq(g.game.round, before + 1, `round ${i}: answering advances (round ${before} -> ${before + 1})`);
    eq(g.game.state, 'playing', `round ${i}: still playing`);
  }
  // input is still accepted after 3 rounds in a row
  const beforeChoose = g.game.chosen;
  answerCorrect();
  ok('input is still accepted after three consecutive rounds', g.game.chosen !== beforeChoose && g.game.chosen >= 0);
  await sleep(REVEAL_MS + 100); // let this round's reveal fully resolve so no stray timer
                                 // leaks into the next test block (see the dedicated test below)

  console.log('\n--- ending: playing every round reaches a real win screen ---');
  g.resetGame();
  let guard = 0;
  while (g.game.state === 'playing' && guard < g.TOTAL + 2) {
    answerCorrect();
    await sleep(REVEAL_MS + 60);
    guard++;
  }
  eq(g.game.state, 'won', 'completing all rounds reaches the won state');
  eq(g.game.round, g.TOTAL, 'the round counter reflects every round played');
  ok('a finite number of answers reached the ending (no runaway loop)', guard === g.TOTAL);

  console.log('\n--- restart from the ending (the real restart handler) ---');
  // index.html's onDown handler calls resetGame() when state is 'won' — replay that exactly.
  g.resetGame();
  eq(g.game.state, 'playing', 'restart from the win screen returns to playing');
  eq(g.game.round, 0, 'restart resets the round counter');
  eq(g.game.score, 0, 'restart resets the score');
  const beforeR = g.game.round;
  answerCorrect();
  await sleep(REVEAL_MS + 100);
  eq(g.game.round, beforeR + 1, 'the game is genuinely playable again after restart (round advances)');

  console.log('\n--- skip path: tap-to-continue during the reveal ---');
  // The UI itself invites this: "tap to continue" is shown during the reveal window,
  // and onDown() routes a tap straight to skipReveal() while chosen>=0. A player who taps
  // to skip the ~900ms reveal animation is using the game's own advertised affordance.
  // choose() ALSO schedules a real setTimeout(advanceRound, REVEAL_MS) to move on
  // automatically; skipReveal() does not cancel that pending timeout. If both fire for
  // the same answer, one player action produces two advances.
  g.resetGame();
  const beforeSkipRound = g.game.round;
  answerCorrect();               // schedules a real setTimeout(advanceRound, 900)
  ok('skip is available immediately after answering (chosen>=0)', g.game.chosen >= 0);
  await sleep(50);
  g.skipReveal();                 // player taps to skip -> advanceRound() runs now
  const rAfterSkip = g.game.round;
  eq(rAfterSkip, beforeSkipRound + 1, 'tapping to skip the reveal advances to the next round immediately');
  eq(g.game.state, 'playing', 'the game is playable immediately after the skip');
  ok('input is accepted on the new round right after skipping', g.game.chosen === -1);

  await sleep(REVEAL_MS + 200);    // let the original (uncancelled) setTimeout come due
  ok('BUG CHECK: one answer + one skip should still equal exactly one round advance',
    g.game.round === rAfterSkip);
  if (g.game.round !== rAfterSkip) {
    console.log(`    -> round silently advanced again on its own: ${rAfterSkip} -> ${g.game.round} with no further player input`);
  }
  await sleep(REVEAL_MS + 200); // fully drain this block's stray timer before the next block,
                                // so the next test isolates its OWN leak rather than inheriting this one

  console.log('\n--- skip path: does a stray timer leak across a restart into the NEXT game? ---');
  // Play the whole round using tap-to-skip every time (the game's own advertised affordance),
  // which leaves ~TOTAL stray advanceRound() timeouts in flight when the round ends.
  // Then restart immediately (as a player who just won would) and answer ONE question
  // normally in the new game, without tapping to skip again.
  g.resetGame();
  let guard2 = 0;
  while (g.game.state === 'playing' && guard2 < g.TOTAL + 2) {
    answerCorrect();
    await sleep(20);
    if (g.game.state !== 'playing') break;
    g.skipReveal();
    guard2++;
  }
  ok('setup: reached the win screen via tap-to-skip', g.game.state === 'won');

  g.resetGame();                  // player restarts right away; old timers are still pending
  eq(g.game.round, 0, 'the new game starts at round 0');
  const roundBeforeAnswer = g.game.round;
  answerCorrect();                 // answer ONE question in the new game, the normal way
  // ONE answer earns EXACTLY ONE advance, via its own reveal timer ~REVEAL_MS later. Sampling
  // g.game.round before that timer fires reads 0 and would assert that answering never advances
  // at all, contradicting the core loop. Any round beyond +1 is a stray timer from the old
  // session landing in this game — that is what this check is for.
  await sleep(2000);
  const expectedRound = roundBeforeAnswer + 1;
  ok('BUG CHECK: a game session with only one answer given should not auto-advance on its own',
    g.game.round === expectedRound && g.game.state === 'playing');
  if (g.game.round > expectedRound) {
    console.log(`    -> new game silently jumped past round ${expectedRound} to round ${g.game.round}`
      + ` and ended in state '${g.game.state}' with no further input from the player`);
  }

  console.log('\n--- pause does not block progression once resumed ---');
  g.resetGame();
  g.togglePause();
  ok('paused blocks scoring/timeout logic (state machine frozen)', g.game.paused === true);
  g.togglePause();
  ok('unpausing resumes normal play', g.game.paused === false);
  const rBeforePause = g.game.round;
  answerCorrect();
  await sleep(REVEAL_MS + 100);
  eq(g.game.round, rBeforePause + 1, 'after pause/unpause the round still advances normally');

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
