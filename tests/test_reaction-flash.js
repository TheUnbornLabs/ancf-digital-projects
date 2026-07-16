// jsdom Tier 2 playthrough suite for Reaction Flash (#23)
// Loop: state title -> playing; per round phase wait -> red -> green -> result -> advance.
// Click ONLY on green (onGreenClick); clicking red (onRedClick) or missing the green
// window costs a life. 10 rounds (ROUNDS). 3 lives. Ends in 'won' or 'gameover'.
// This suite drives the REAL loop through window.__cfq and asserts progression across
// steps (soft-lock catcher), not just single-step setup facts.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'reaction-flash', 'index.html');
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
    w.requestAnimationFrame = () => 0;  // disable auto-loop; we drive update() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;         // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Drive update(dt) repeatedly until pred() is true or the step budget runs out.
// dt is simulated time — the game's phase machine (phaseT) is driven entirely by
// accumulated dt, not by wall-clock time, so this is deterministic regardless of
// how fast this loop actually executes.
function driveUntil(pred, maxSteps = 3000, dt = 20) {
  let i = 0;
  while (!pred() && i < maxSteps) { g.update(dt); i++; }
  return pred();
}

// Play one round by responding correctly to the green flash. Returns true if the
// round was reached and clicked; caller checks progression afterward.
function playGreenRound() {
  const reachedGreen = driveUntil(() => g.phase === 'green' || g.game.state !== 'playing');
  if (g.game.state !== 'playing') return false;
  if (!reachedGreen) return false;
  g.onGreenClick();
  return true;
}

// Play one round by clicking red (the losing action). Returns true if reached and clicked.
function playRedRound() {
  const reachedRed = driveUntil(() => g.phase === 'red' || g.game.state !== 'playing');
  if (g.game.state !== 'playing') return false;
  if (!reachedRed) return false;
  g.onRedClick();
  return true;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'startRound', 'onGreenClick', 'onRedClick', 'advance', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state and phase', !!g.game && typeof g.phase === 'string');
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.ROUNDS, 10, 'ROUNDS is 10');

  let drewOk = true;
  for (const st of ['title', 'playing', 'paused', 'won', 'gameover']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  ok('draw() runs in every state without throwing', drewOk);
  g.resetGame(); // clear the forced states above before real logic testing

  /* ======================= PROGRESSION: CORE LOOP ======================= */
  console.log('\n--- logic: core loop advances (soft-lock catcher) ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts playing');
  eq(g.game.round, 1, 'resetGame starts at round 1');
  eq(g.phase, 'wait', 'round starts in the wait phase');

  const timesBefore = g.game.times.length;
  const played1 = playGreenRound();
  ok('round 1: reached the green phase and clicked it', played1);
  eq(g.phase, 'result', 'a green click moves the phase to result');
  eq(g.game.times.length, timesBefore + 1, 'a successful green click records a reaction time');

  const advanced1 = driveUntil(() => g.phase === 'wait' || g.game.state !== 'playing');
  ok('round 1 -> round 2: the result phase resolves on its own (advance() fires)', advanced1);
  eq(g.game.state, 'playing', 'still playing after round 1');
  eq(g.game.round, 2, 'round counter advanced from 1 to 2');
  eq(g.phase, 'wait', 'the new round starts fresh in the wait phase');

  /* ======================= PROGRESSION: THREE IN A ROW ======================= */
  console.log('\n--- logic: three rounds in a row, still advancing ---');
  for (let n = 0; n < 3; n++) {
    const roundBefore = g.game.round;
    const played = playGreenRound();
    ok(`consecutive round ${n + 1}: green click accepted`, played);
    const advanced = driveUntil(() => g.phase === 'wait' || g.game.state !== 'playing');
    ok(`consecutive round ${n + 1}: advanced afterward`, advanced);
    eq(g.game.state, 'playing', `consecutive round ${n + 1}: still playing`);
    eq(g.game.round, roundBefore + 1, `consecutive round ${n + 1}: round counter incremented (${roundBefore} -> ${roundBefore + 1})`);
  }
  // game.round is now 5; still accepting input for the next click too
  ok('after 4 consecutive successful rounds, another green click is still accepted',
    (() => { const before = g.game.times.length; playGreenRound(); return g.game.times.length === before + 1; })());
  driveUntil(() => g.phase === 'wait' || g.game.state !== 'playing');
  eq(g.game.round, 6, 'round counter reached 6 after 5 consecutive clean rounds');

  /* ======================= FAIL CONDITION -> REAL ENDING ======================= */
  console.log('\n--- logic: exhausting the fail condition reaches a real ending ---');
  g.resetGame();
  eq(g.game.lives, 3, 'a fresh game starts with 3 lives');

  // Lose lives by clicking red. Only the FINAL life-loss schedules a real
  // (wall-clock) setTimeout to flip state to 'gameover' -- update()'s own
  // phaseT->advance() path is simulated-time only and gated behind
  // `if(game.state!=='playing')return`, so as long as we don't drive update()
  // across that real 700ms window ourselves, there's no race to worry about.
  let lives = g.game.lives;
  for (let n = 0; n < 2; n++) {
    const clicked = playRedRound();
    ok(`losing life ${n + 1}: red phase reached and clicked`, clicked);
    eq(g.game.lives, lives - 1, `losing life ${n + 1}: a life is lost`);
    lives = g.game.lives;
    ok(`losing life ${n + 1}: state is still playing (lives remain)`,
      g.game.state === 'playing');
    const advanced = driveUntil(() => g.phase === 'wait' || g.game.state !== 'playing');
    ok(`losing life ${n + 1}: round still advances after a red click`, advanced);
  }
  eq(g.game.lives, 1, 'two lives spent, one remaining');

  // final life
  const finalClick = playRedRound();
  ok('final red click reached and clicked', finalClick);
  eq(g.game.lives, 0, 'the last life is spent');
  eq(g.game.state, 'playing', 'state has not flipped yet (the gameover flip is a real 700ms timer)');
  await sleep(800); // let the real setTimeout fire; do NOT call update() during this window
  eq(g.game.state, 'gameover', 'losing the last life reaches a real gameover ending');

  /* ======================= RESTART FROM GAMEOVER ======================= */
  console.log('\n--- logic: restart from gameover is playable again ---');
  g.resetGame(); // the exact call pointerDown() makes when state is 'gameover'
  eq(g.game.state, 'playing', 'restart from gameover resumes playing');
  eq(g.game.lives, 3, 'restart from gameover restores full lives');
  eq(g.game.round, 1, 'restart from gameover resets to round 1');
  eq(g.phase, 'wait', 'restart from gameover resets phase to wait');
  const playedAfterRestart = playGreenRound();
  ok('post-restart: a green click is accepted (not stuck)', playedAfterRestart);
  const advancedAfterRestart = driveUntil(() => g.phase === 'wait' || g.game.state !== 'playing');
  ok('post-restart: the round advances (not frozen)', advancedAfterRestart);
  eq(g.game.round, 2, 'post-restart: round counter reaches 2');

  /* ======================= FULL WIN PLAYTHROUGH (all 10 rounds) ======================= */
  console.log('\n--- logic: a competent player can reach the end (win) ---');
  g.resetGame();
  let roundsCompleted = 0;
  let guard = 0;
  while (g.game.state === 'playing' && guard < ROUNDS_GUARD()) {
    const played = playGreenRound();
    if (!played) break;
    roundsCompleted++;
    driveUntil(() => g.phase === 'wait' || g.game.state !== 'playing');
    guard++;
  }
  function ROUNDS_GUARD() { return g.ROUNDS + 2; }
  eq(g.game.state, 'won', 'clicking green cleanly for every round reaches the won ending');
  eq(roundsCompleted, g.ROUNDS, `all ${g.ROUNDS} rounds were completed to reach the win`);
  // Note: avgMs can legitimately be 0 here -- this harness clicks green in the same
  // synchronous tick the phase flips (flashStart=Date.now(); ms=Date.now()-flashStart),
  // so 0ms is a real (if inhumanly fast) value, not a game defect.
  ok('win screen reports a numeric average reaction time', typeof g.game.avgMs === 'number' && g.game.avgMs >= 0 && g.game.avgMs < 9999);
  ok('win screen records a full set of per-round results', g.game.results.length === g.ROUNDS);
  ok('best time is a number after winning (not left at the Infinity sentinel)', g.game.best !== Infinity && typeof g.game.best === 'number');

  /* ======================= RESTART FROM WIN ======================= */
  console.log('\n--- logic: restart from the win screen is playable again ---');
  g.resetGame(); // the exact call pointerDown() makes when state is 'won'
  eq(g.game.state, 'playing', 'restart from won resumes playing');
  eq(g.game.round, 1, 'restart from won resets to round 1');
  eq(g.game.lives, 3, 'restart from won restores full lives');
  const playedAfterWinRestart = playGreenRound();
  ok('post-win-restart: a green click is accepted (not stuck)', playedAfterWinRestart);
  ok('post-win-restart: the round advances (not frozen)',
    driveUntil(() => g.phase === 'wait' || g.game.state !== 'playing'));
  eq(g.game.round, 2, 'post-win-restart: round counter reaches 2');

  /* ======================= PAUSE PATH (this game's only mode-toggle) ======================= */
  console.log('\n--- logic: pause suspends but does not freeze the loop ---');
  g.resetGame();
  driveUntil(() => g.phase === 'red'); // land mid-round so there is live phase state to freeze
  const phaseAtPause = g.phase;
  const roundAtPause = g.game.round;
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause enters the paused state');
  for (let i = 0; i < 50; i++) g.update(20); // simulate ~1s of frames while paused
  eq(g.phase, phaseAtPause, 'the phase does not progress while paused');
  eq(g.game.round, roundAtPause, 'the round does not change while paused');
  g.togglePause();
  eq(g.game.state, 'playing', 'togglePause resumes playing');
  const resumedAdvance = driveUntil(() => g.phase !== phaseAtPause || g.game.state !== 'playing');
  ok('after resuming, the phase progresses again (pause did not permanently freeze the loop)', resumedAdvance);
  // finish the round out to be sure the whole cycle still completes post-pause
  if (g.phase === 'green') g.onGreenClick();
  else if (g.phase === 'red') g.onRedClick();
  const advancedPostPause = driveUntil(() => g.phase === 'wait' || g.game.state !== 'playing');
  ok('the round started before a pause still completes normally after resuming', advancedPostPause);

  /* ======================= MUTE SANITY ======================= */
  console.log('\n--- logic: mute toggle does not affect the loop ---');
  const mutedBefore = g.game.muted;
  g.toggleMute();
  eq(g.game.muted, !mutedBefore, 'toggleMute flips the muted flag');
  ok('a round still plays normally while muted', playGreenRound());
  g.toggleMute(); // restore

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
