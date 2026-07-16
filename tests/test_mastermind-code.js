// jsdom test harness for Value Code (#26) — Mastermind variant
// Tier 2 playthrough suite: drives the real guess/submit loop through window.__cfq
// and asserts PROGRESSION (tries advancing, win/lose transitions, restart, hint,
// difficulty scaling with streak), not just setup state.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'mastermind-code', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }

// ---- canvas 2D context stub (same pattern as the house reference suite) ----
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

// Push a full 4-value guess into the live `current` array via the exposed getter
// reference (there is no dedicated pickColor() API — the palette click handler
// itself just does current.push(pi), so mutating the same array the getter
// returns is the equivalent of a player tapping those swatches in order).
function pushGuess(arr) {
  const cur = g.current;
  arr.forEach(c => cur.push(c));
}

// Pump update() past the winning->won transition. update() clamps dt to 48ms
// per call, so WIN_TRANSITION_MS (420ms) needs several calls, not one big one.
function pumpToWon(maxCalls) {
  for (let i = 0; i < (maxCalls || 20) && g.game.state === 'winning'; i++) g.update(50);
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'makeSecret', 'submit', 'evaluate', 'update', 'draw',
    'useHint', 'undoPeg', 'togglePause', 'toggleMute', 'setForcedSecret']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.VALUES));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  /* ======================= CORE LOOP: ADVANCING ======================= */
  console.log('\n--- logic: core action advances (wrong guess) ---');
  // Force a known secret so guesses are deterministic instead of guessed blind.
  g.setForcedSecret([0, 1, 2, 3]);
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts a playing round');
  eq(JSON.stringify(g.secret), JSON.stringify([0, 1, 2, 3]), 'forced secret is honoured');
  eq(g.CODE_LEN, 4, 'code length is 4');
  eq(g.MAX_TRIES, 8, 'fresh streak gives the base 8 tries');

  const triesBefore = g.tries.length;
  pushGuess([5, 5, 5, 5]);   // guaranteed wholly wrong: 5 is not in the forced secret
  eq(g.current.length, 4, 'four pegs were placed');
  g.submit();
  eq(g.tries.length, triesBefore + 1, 'submitting a guess advances the try count');
  eq(g.current.length, 0, 'the guess row clears after submitting');
  eq(g.game.state, 'playing', 'a wrong guess (with tries remaining) keeps the round alive');
  const lastTry = g.tries[g.tries.length - 1];
  eq(lastTry.black, 0, 'the wrong guess scored no black pegs');
  eq(lastTry.white, 0, 'the wrong guess scored no white pegs');

  console.log('\n--- logic: three times running, still advancing/accepting input ---');
  for (let i = 0; i < 3; i++) {
    const before = g.tries.length;
    pushGuess([5, 5, 5, 5]);
    ok(`round ${i + 1}: input accepted before submit`, g.current.length === 4);
    g.submit();
    eq(g.tries.length, before + 1, `round ${i + 1}: submitting still advances the try count`);
    eq(g.game.state, 'playing', `round ${i + 1}: still playing, still accepting input`);
  }

  // back/undo button does not freeze input either
  pushGuess([5, 5, 5]);
  g.undoPeg(2);
  eq(g.current.length, 2, 'undoPeg removes one peg without freezing input');
  pushGuess([5]);
  eq(g.current.length, 3, 'input is still accepted after an undo');
  g.undoPeg(0); g.undoPeg(0); g.undoPeg(0);
  eq(g.current.length, 0, 'guess row can be fully cleared');

  /* ======================= EXHAUST FAIL CONDITION ======================= */
  console.log('\n--- logic: exhaust the fail condition -> real ending ---');
  eq(g.tries.length, 4, 'sanity: four tries spent so far this round');
  while (g.tries.length < g.MAX_TRIES && g.game.state === 'playing') {
    pushGuess([5, 5, 5, 5]);
    g.submit();
  }
  eq(g.game.state, 'gameover', 'exhausting every try without cracking the code ends the game');
  eq(g.tries.length, 8, 'gameover happens exactly at the max-tries mark');

  /* ======================= RESTART FROM ENDING ======================= */
  console.log('\n--- logic: restart from gameover is playable again ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from gameover returns to a playing round');
  eq(g.tries.length, 0, 'tries are cleared on restart');
  eq(g.current.length, 0, 'the guess row is cleared on restart');
  // prove input really works post-restart, not just the flags
  pushGuess([5, 5, 5, 5]);
  g.submit();
  eq(g.tries.length, 1, 'a fresh guess after restart is accepted and scored');

  /* ======================= WIN PATH ======================= */
  console.log('\n--- logic: cracking the code -> winning -> won ---');
  g.setForcedSecret([0, 1, 2, 3]);
  g.resetGame();
  pushGuess([0, 1, 2, 3]);
  g.submit();
  eq(g.game.state, 'winning', 'a fully correct guess enters the winning transition');
  const lastTryWin = g.tries[g.tries.length - 1];
  eq(lastTryWin.black, 4, 'the winning try scored all four black pegs');
  pumpToWon();
  eq(g.game.state, 'won', 'the winning transition resolves to won after enough update() ticks');
  ok('best streak was recorded', g.best.bestStreak >= 1);
  eq(g.game.streak, 1, 'the streak increments on a win');

  console.log('\n--- logic: restart from a win is playable again ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from won returns to a playing round');
  eq(g.tries.length, 0, 'tries are cleared after a win-restart');

  /* ======================= DIFFICULTY SCALES WITH STREAK (real progression) ======================= */
  console.log('\n--- logic: repeated wins advance difficulty (not just score) ---');
  // streak is already 1; win three more times in a row to push streak to 4
  for (let w = 0; w < 3; w++) {
    g.setForcedSecret([0, 1, 2, 3]);
    g.resetGame();
    pushGuess([0, 1, 2, 3]);
    g.submit();
    ok(`win ${w + 2}: enters winning`, g.game.state === 'winning');
    pumpToWon();
    eq(g.game.state, 'won', `win ${w + 2}: resolves to won`);
  }
  eq(g.game.streak, 4, 'four wins in a row raise the streak to 4');
  g.resetGame();
  eq(g.MAX_TRIES, 7, 'at streak 4 the max-tries budget has actually shrunk (real difficulty progression)');

  /* ======================= STREAK RESETS ON LOSS ======================= */
  console.log('\n--- logic: a loss resets the streak, not just the round ---');
  eq(g.game.streak, 4, 'sanity: streak is 4 entering this loss');
  while (g.tries.length < g.MAX_TRIES && g.game.state === 'playing') {
    pushGuess([5, 5, 5, 5]);
    g.submit();
  }
  eq(g.game.state, 'gameover', 'the round can still be lost at the harder difficulty');
  eq(g.game.streak, 0, 'losing resets the streak back to 0');

  /* ======================= HINT: ADVANCES, DOES NOT FREEZE ======================= */
  console.log('\n--- logic: hint advances rather than consuming and freezing ---');
  g.setForcedSecret([0, 1, 2, 3]);
  g.resetGame();
  eq(g.game.hintUsed, false, 'hint is available at the start of a fresh round');
  g.useHint();
  eq(g.game.hintUsed, true, 'using the hint flags it spent');
  eq(g.current.length, 4, 'the hint fills the guess row rather than leaving it half-done');
  const secretNow = g.secret;
  ok('at least one placed peg matches the secret at its position (the hinted peg)',
    g.current.some((v, i) => v === secretNow[i]));

  // a second hint in the same round is refused, but the game keeps working
  const currentSnapshot = g.current.slice();
  g.useHint();
  eq(JSON.stringify(g.current), JSON.stringify(currentSnapshot), 'a second hint in the same round is refused (no double-spend)');
  eq(g.game.hintUsed, true, 'hintUsed stays true after the refused second call');

  // input remains accepted after using the hint: submit the hinted guess
  const triesBeforeHintSubmit = g.tries.length;
  g.submit();
  ok('the game accepted the submit after a hint (not frozen)',
    g.tries.length === triesBeforeHintSubmit + 1 || g.game.state === 'winning');

  console.log('\n--- logic: hint resets for the next round ---');
  g.setForcedSecret([0, 1, 2, 3]);
  g.resetGame();
  eq(g.game.hintUsed, false, 'a new round restores the hint');

  /* ======================= PAUSE DOES NOT PERMANENTLY FREEZE ======================= */
  console.log('\n--- logic: pause/resume does not lock the game ---');
  eq(g.game.state, 'playing', 'sanity: playing before pausing');
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause pauses a playing round');
  g.togglePause();
  eq(g.game.state, 'playing', 'togglePause resumes back to playing');
  pushGuess([5, 5, 5, 5]);
  g.submit();
  ok('input still works normally after a pause/resume cycle', g.tries.length >= 1);

  /* ======================= NON-FORCED (REAL RANDOM) MODE STILL WORKS ======================= */
  console.log('\n--- logic: clearing the forced secret still yields a playable, winnable round ---');
  g.setForcedSecret(null);
  g.resetGame();
  ok('a randomly generated secret has the right length', g.secret.length === g.CODE_LEN);
  ok('every secret value is a valid palette index', g.secret.every(v => v >= 0 && v < g.VALUES.length));
  // guess the actual (unknown-to-a-real-player, but known-to-us) secret to prove
  // the win path still works when the secret isn't forced
  pushGuess(g.secret.slice());
  g.submit();
  eq(g.game.state, 'winning', 'guessing the real random secret still wins normally');
  pumpToWon();
  eq(g.game.state, 'won', 'the random-mode win also resolves to won');

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
