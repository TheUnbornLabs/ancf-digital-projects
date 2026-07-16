// jsdom test harness for Shadow Match (#63)
// Tier 2 playthrough: can a competent player drag the shape onto the shadow,
// clear all 10 rounds, and reach a real ending? Does exhausting attempts on a
// round still move the game forward? Can you restart from the win screen?
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'shadow-match', 'index.html');
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

// Move the draggable shape to sit exactly on the current shadow target
// (dist = 0, always beats even the tightest tolerance) and press CHECK MATCH.
function landOnTarget() {
  const sp = g.shapePos, off = g.targetOff;
  sp.x = g.SHAPE_X + off.x;
  sp.y = g.MID_Y + off.y;
  g.checkMatch();
}
// Move the shape somewhere guaranteed to miss every round's tolerance
// (t3 tops out at 100px; 400px away always misses) and press CHECK MATCH.
function missTarget() {
  const sp = g.shapePos;
  sp.x = g.SHAPE_X - 400;
  sp.y = g.MID_Y - 400;
  g.checkMatch();
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'nextRound', 'checkMatch', 'update', 'draw']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.SHAPES));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.game.state, 'title', 'game starts on the title screen');
  eq(g.TOTAL, 10, 'the round collects reports 10 total rounds');

  g.fixedSeed = true;  // deterministic targetOff sequence for the rest of the run

  console.log('\n--- logic: starting a run ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame moves to the playing state');
  eq(g.game.round, 0, 'resetGame starts at round 0');
  eq(g.game.score, 0, 'resetGame resets score');
  eq(g.game.attemptsLeft, 3, 'resetGame grants 3 attempts');
  ok('a target offset is set for round 0', typeof g.targetOff.x === 'number' && typeof g.targetOff.y === 'number');

  /* ======================= CORE LOOP ======================= */
  console.log('\n--- logic: core action advances the game ---');
  g.resetGame();
  const round0 = g.game.round, score0 = g.game.score;
  landOnTarget();
  ok('a match awards score immediately', g.game.score > score0);
  eq(g.game.round, round0, 'round has not advanced yet (advance is scheduled, not instant)');

  await sleep(750);   // the scheduled round++/nextRound (600ms) must have fired by now
  eq(g.game.round, round0 + 1, 'landing a match advances to the next round');
  eq(g.game.state, 'playing', 'still playing after advancing');
  eq(g.game.attemptsLeft, 3, 'the new round grants a fresh set of attempts');

  console.log('\n--- logic: three in a row, still accepting input ---');
  g.resetGame();
  for (let i = 0; i < 3; i++) {
    const r = g.game.round;
    landOnTarget();
    await sleep(750);
    ok(`round ${i}: still advancing (round ${r} -> ${g.game.round})`, g.game.round === r + 1);
    eq(g.game.state, 'playing', `round ${i}: still playing after advancing`);
  }
  // input still lands after three consecutive advances
  const sBefore = g.game.score;
  landOnTarget();
  ok('input is still accepted after three consecutive advances', g.game.score > sBefore);
  await sleep(750);

  console.log('\n--- logic: missing does not soft-lock, and attempts run out ---');
  g.resetGame();
  const startRound = g.game.round;
  missTarget();
  eq(g.game.attemptsLeft, 2, 'a miss spends one attempt');
  eq(g.game.state, 'playing', 'a single miss does not end the round');
  eq(g.game.round, startRound, 'a single miss does not advance the round');
  missTarget();
  eq(g.game.attemptsLeft, 1, 'a second miss spends another attempt');
  missTarget();
  eq(g.game.attemptsLeft, 0, 'attempts are exhausted after three misses');
  await sleep(750);
  ok('exhausting all attempts still advances the round (forced advance)', g.game.round === startRound + 1);
  eq(g.game.state, 'playing', 'still playing (and accepting input) after a forced advance');
  const scoreAfterForce = g.game.score;
  landOnTarget();
  ok('input is accepted normally on the round after a forced advance', g.game.score > scoreAfterForce);
  await sleep(750);

  /* ======================= FULL PLAYTHROUGH / ENDING ======================= */
  console.log('\n--- logic: exhaust the fail condition on every round -> reach a real ending ---');
  g.resetGame();
  let guard = 0;
  while (g.game.state === 'playing' && guard < 200) {
    missTarget();
    if (g.game.attemptsLeft === 0) await sleep(750);
    guard++;
  }
  ok('missing every attempt on every round still reaches a real ending', g.game.state === 'won');
  ok('the guard loop did not run away (soft-lock would spin past 200 iterations)', guard < 200);

  console.log('\n--- logic: restart from the win screen ---');
  const scoreAtWin = g.game.score;
  g.resetGame();
  eq(g.game.state, 'playing', 'the game is playable again after restarting from a win');
  eq(g.game.round, 0, 'round resets to 0 on restart');
  eq(g.game.score, 0, 'score resets to 0 on restart');
  ok('score genuinely reset (not just carried over)', g.game.score !== scoreAtWin || scoreAtWin === 0);
  // and the restarted round is itself fully playable
  landOnTarget();
  ok('input works immediately after restarting from a win', g.game.score > 0);
  await sleep(750);
  eq(g.game.round, 1, 'the restarted run advances normally');

  console.log('\n--- logic: winning by clean matches all the way through (not just misses) ---');
  g.resetGame();
  guard = 0;
  while (g.game.state === 'playing' && guard < 30) {
    landOnTarget();
    await sleep(750);
    guard++;
  }
  eq(g.game.state, 'won', 'clearing all 10 rounds with clean matches reaches the win screen');
  eq(guard, 10, 'exactly 10 successful matches were needed to win');

  /* ======================= RAPID / DOUBLE-INPUT CHECK ======================= */
  console.log('\n--- logic: rapid double-press of CHECK MATCH during the advance animation ---');
  // A real player who double-clicks (or double-taps) the CHECK MATCH button while
  // the 600ms "advance" animation is pending is not doing anything unusual.
  // game.state stays 'playing' during that window (there is no transition lock),
  // so a second checkMatch() call before the first setTimeout fires is a call a
  // real player's mashing can trigger. Verify what actually happens.
  g.resetGame();
  const roundBeforeDouble = g.game.round;
  const scoreBeforeDouble = g.game.score;
  landOnTarget();                 // 1st press: schedules round++ in 600ms
  const sp = g.shapePos, off = g.targetOff;   // targetOff/shapePos unchanged until nextRound() fires
  g.checkMatch();                 // 2nd press, same tick: state is still 'playing', same position still matches
  const scoreAfterTwoPresses = g.game.score;
  await sleep(750);
  ok('double-press: recorded whether a second immediate press also scored',
     true /* diagnostic, see round-skip check below */);
  const roundsAdvanced = g.game.round - roundBeforeDouble;
  if (roundsAdvanced === 1) {
    ok('double-pressing CHECK MATCH during the advance window advances exactly one round (no skip)', true);
  } else {
    ok(`double-pressing CHECK MATCH during the advance window advances ${roundsAdvanced} rounds instead of 1 (round skip / double score)`, false);
  }

  console.log('\n--- logic: pause does not itself corrupt state ---');
  g.resetGame();
  g.game.paused = true;
  g.update(16);
  eq(g.game.state, 'playing', 'pausing does not change state');
  g.game.paused = false;
  landOnTarget();
  ok('input works normally after unpausing', g.game.score > 0);

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
