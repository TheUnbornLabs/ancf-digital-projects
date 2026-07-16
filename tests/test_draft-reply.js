// jsdom Tier 2 playthrough suite for Draft Reply (#77)
// A pressure message is shown; pick the best boundary reply. 4 options, 1 correct,
// 12 scenarios (TOTAL). Round-advance is scheduled with a real setTimeout (1000ms after
// a pick, 900ms after a timeout), not tied to update(dt) or requestAnimationFrame, so this
// suite awaits real wall-clock delays to observe it — same style as test_word-unscramble.js.
//
// Tier 1 already passed this game clean. This suite drives the actual loop through
// window.__cfq and asserts PROGRESSION: does choosing an answer really advance the round,
// three times running, all the way to a real ending, and can the player restart and play
// again? It also specifically re-checks the historical draft-reply bug class recorded in
// PROTOCOL.md — the timeout sentinel is chosen=-2, so any guard written as `chosen>=0`
// (instead of `chosen!==-1`) never fires and the round never advances after a timeout.
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'draft-reply', 'index.html');
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
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Index of the correct option among the current round's shuffled options.
function correctIndex() {
  const s = g.SCENARIOS[g.game.round % g.SCENARIOS.length];
  return g.options.indexOf(s.answer);
}
function wrongIndex() {
  const ci = correctIndex();
  return ci === 0 ? 1 : 0;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'choose', 'update', 'draw', 'optionAt', 'toggleMute', 'togglePause']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state and scenario data', !!g.game && Array.isArray(g.SCENARIOS) && Array.isArray(g.options));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.SCENARIOS.length, g.TOTAL, 'scenario count matches TOTAL rounds');
  ok('game starts on the title screen', g.game.state === 'title');

  let drewOk = true;
  for (const st of ['title', 'playing', 'won']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  ok('draw() runs in every state without throwing', drewOk);

  /* ======================= CORE LOOP ======================= */
  console.log('\n--- core loop: choosing an answer advances the round ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts the round playing');
  eq(g.game.round, 0, 'resetGame starts at round 0');
  eq(g.game.score, 0, 'resetGame resets score');
  eq(g.game.streak, 0, 'resetGame resets streak');

  let ci = correctIndex();
  ok('a correct option is found among the shuffled options', ci >= 0);
  g.choose(ci);
  eq(g.game.chosen, ci, 'choosing marks the option as chosen');
  eq(g.game.score, 1, 'a correct choice awards a point');
  eq(g.game.round, 0, 'the round does not advance immediately on choice (it animates first)');

  await sleep(1150);   // the scheduled round-advance (1000ms) must have fired by now
  eq(g.game.round, 1, 'after the delay, the round advances to the next scenario');
  eq(g.game.chosen, -1, 'the new round is unblocked (chosen resets to -1)');
  eq(g.game.state, 'playing', 'still playing after advancing');

  console.log('\n--- core loop: three correct answers running, still advancing, still accepting input ---');
  for (let i = 0; i < 3; i++) {
    const roundBefore = g.game.round;
    const scoreBefore = g.game.score;
    const idx = correctIndex();
    ok(`round ${roundBefore}: a correct option is found`, idx >= 0);
    g.choose(idx);
    ok(`round ${roundBefore}: choosing is accepted (chosen leaves -1)`, g.game.chosen !== -1);
    eq(g.game.score, scoreBefore + 1, `round ${roundBefore}: score increments on the correct pick`);
    await sleep(1150);
    eq(g.game.round, roundBefore + 1, `round ${roundBefore}: advances to round ${roundBefore + 1} after the delay`);
    eq(g.game.chosen, -1, `round ${roundBefore + 1}: input is unblocked on the new round`);
    eq(g.game.state, 'playing', `round ${roundBefore + 1}: still playing`);
  }

  /* ======================= TIMEOUT PATH (historical bug class) ======================= */
  console.log('\n--- timeout path: letting the clock run out also advances the round ---');
  // PROTOCOL.md records a real draft-reply bug here: timeExpire() sets chosen=-2, and a
  // guard written as `if(chosen>=0)return` never fires for a negative sentinel, so the
  // round never advanced after a timeout. Reproduce the full timeout -> advance sequence.
  const roundBeforeTimeout = g.game.round;
  const timeMaxBeforeTimeout = g.game.timeMax;
  ok('a per-round timer is running', timeMaxBeforeTimeout > 0);
  let ticks = 0;
  while (g.game.chosen === -1 && ticks < 4000) { g.update(16); ticks++; }
  ok('the clock actually ran out (did not loop forever)', ticks < 4000);
  eq(g.game.chosen, -2, 'timing out sets the timeout sentinel (-2), not a normal pick index');
  eq(g.game.streak, 0, 'timing out resets the streak (treated as a miss)');
  eq(g.game.round, roundBeforeTimeout, 'the round has not advanced yet, only the pick is resolved');

  // The historical bug (PROTOCOL.md) was in choose()'s guard, not timeExpire()'s: a guard
  // written as `if(chosen>=0)return` never fires for the timeout sentinel (-2), so a click
  // landing in the settle window between timeExpire() and the scheduled round-advance would
  // re-enter choose() on an already-resolved round — double-scoring and scheduling a second,
  // overlapping round-advance timeout. Reproduce exactly that click.
  const scoreAtTimeout = g.game.score;
  const clickIdx = correctIndex();
  g.choose(clickIdx);
  eq(g.game.chosen, -2, 'a click landing after a timeout does not overwrite the timeout sentinel');
  eq(g.game.score, scoreAtTimeout, 'a click landing after a timeout is not scored (round already resolved)');

  await sleep(1050);   // the scheduled round-advance (900ms) must have fired by now
  eq(g.game.round, roundBeforeTimeout + 1, 'after a timeout, the round advances to the next scenario');
  eq(g.game.chosen, -1, 'input is unblocked on the round after a timeout');
  eq(g.game.state, 'playing', 'still playing after a timeout advance');
  const idxAfterTimeout = correctIndex();
  g.choose(idxAfterTimeout);
  ok('input is genuinely accepted on the round after a timeout', g.game.chosen === idxAfterTimeout);
  await sleep(1150);

  /* ======================= WRONG-ANSWER PATH ALSO ADVANCES ======================= */
  console.log('\n--- wrong-answer (miss) path also advances, not just correct picks ---');
  for (let i = 0; i < 3; i++) {
    const roundBefore = g.game.round;
    const streakBefore = g.game.streak;
    const wi = wrongIndex();
    g.choose(wi);
    eq(g.game.chosen, wi, `round ${roundBefore}: a wrong pick is still registered as chosen`);
    if (streakBefore > 0) eq(g.game.streak, 0, `round ${roundBefore}: a miss resets the streak`);
    await sleep(1150);
    eq(g.game.round, roundBefore + 1, `round ${roundBefore}: a miss still advances to the next round (no soft-lock on failure)`);
    eq(g.game.chosen, -1, `round ${roundBefore + 1}: input is unblocked after a miss`);
  }

  /* ======================= EXHAUST TO A REAL ENDING ======================= */
  console.log('\n--- exhausting all 12 rounds reaches a real ending ---');
  let guard = 0;
  while (g.game.state === 'playing' && guard < 30) {
    const idx = correctIndex();
    g.choose(idx >= 0 ? idx : 0);
    await sleep(1150);
    guard++;
  }
  ok('the round loop terminated (did not spin past 30 iterations)', guard < 30);
  eq(g.game.state, 'won', 'clearing all 12 rounds reaches the won screen');
  eq(g.game.round, g.TOTAL, 'the round counter reflects every scenario having been played');
  ok('a completed run reports a numeric score and correctCount', typeof g.game.score === 'number' && typeof g.game.correctCount === 'number');
  let wonDrawOk = true;
  try { g.draw(); } catch (e) { wonDrawOk = false; }
  ok('the won screen draws without throwing (summary panel, missed-scenario list)', wonDrawOk);

  /* ======================= RESTART FROM THE ENDING ======================= */
  console.log('\n--- restart from the ending is playable again ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from the won screen returns to playing');
  eq(g.game.round, 0, 'resetGame from the won screen resets the round counter');
  eq(g.game.score, 0, 'resetGame from the won screen resets the score');
  eq(g.game.streak, 0, 'resetGame from the won screen resets the streak');
  eq(g.game.chosen, -1, 'resetGame from the won screen unblocks input');
  const idxAfterRestart = correctIndex();
  ok('a correct option exists in the restarted round', idxAfterRestart >= 0);
  g.choose(idxAfterRestart);
  ok('input is genuinely accepted after restarting (round 2 of playing this session)', g.game.chosen === idxAfterRestart);
  eq(g.game.score, 1, 'scoring works normally after a restart');
  await sleep(1150);
  eq(g.game.round, 1, 'the restarted run advances normally too');

  /* ======================= STREAK / BONUS MULTIPLIER DOES NOT FREEZE PLAY ======================= */
  console.log('\n--- streak multiplier (the closest thing to a bonus mode here) advances, not freezes ---');
  // This game has no separate skip/hint/power-up action; the closest analogue is the
  // streak-based scoring multiplier and the per-round timer shrink that comes with it.
  // Drive a long correct streak and confirm the round keeps advancing and the timer
  // never collapses to zero or below its documented floor.
  g.resetGame();
  let minTimeMaxSeen = Infinity;
  for (let i = 0; i < 6 && g.game.state === 'playing'; i++) {
    minTimeMaxSeen = Math.min(minTimeMaxSeen, g.game.timeMax);
    const idx = correctIndex();
    g.choose(idx >= 0 ? idx : 0);
    await sleep(1150);
  }
  ok('a long correct streak keeps advancing rounds (streak reached ' + g.game.streak + ')', g.game.round >= 5 || g.game.state === 'won');
  ok('the per-round timer never collapses to zero or below (stayed at/above 4s floor)', minTimeMaxSeen >= 4);

  /* ======================= PAUSE DOES NOT SOFT-LOCK THE TIMER ======================= */
  console.log('\n--- pausing mid-round does not corrupt the timer or block resuming ---');
  g.resetGame();
  const timeLeftBeforePause = g.game.timeLeft;
  g.togglePause();
  ok('pausing sets the paused flag', g.game.paused === true);
  for (let i = 0; i < 50; i++) g.update(16);
  eq(g.game.timeLeft, timeLeftBeforePause, 'time does not drain while paused');
  g.togglePause();
  ok('unpausing clears the paused flag', g.game.paused === false);
  const idxAfterPause = correctIndex();
  g.choose(idxAfterPause);
  ok('input is accepted normally after unpausing', g.game.chosen === idxAfterPause);

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
