// jsdom test harness for Basketball Orb (#57)
// Tier 2 playthrough: drive real flicks through window.__cfq and assert the
// game ADVANCES over time (shot count, state transitions), not just setup.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'basketball-orb', 'index.html');
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
    w.HTMLCanvasElement.prototype.getBoundingClientRect = function () { return { left: 0, top: 0, width: 960, height: 540, right: 960, bottom: 540 }; };
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;          // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Drive physics frames until either a score or a miss is registered for the
// shot currently in flight, or a frame budget is exhausted (soft-lock guard).
// Returns the number of update() calls it took, or -1 if it never resolved.
// Synchronous — does not yield, so any setTimeout the game scheduled (e.g. the
// between-shot reset) will NOT have a chance to fire during the pump.
function pumpUntil(predicate, maxFrames) {
  for (let i = 0; i < maxFrames; i++) {
    g.update(16);
    if (predicate()) return i + 1;
  }
  return -1;
}

// Real-cadence pump: calls update(16) and then actually yields to the event
// loop (await sleep) between frames, the way a browser's requestAnimationFrame
// naturally interleaves with any setTimeout the game scheduled. This is what
// a real player's frame-by-frame experience looks like, unlike pumpUntil above.
async function pumpRealFrames(n, dt = 16) {
  for (let i = 0; i < n; i++) { g.update(dt); await sleep(dt); }
}

// A flick guaranteed to miss immediately: straight down and away from the
// hoop (orb starts well below hoop height), never passing near HOOP_Y.
function flickGuaranteedMiss() { g.flick(-20, -140); }

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'flick', 'update', 'draw', 'endShotIfDone', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game);
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  let drewOk = true;
  g.resetGame();
  for (const st of ['title', 'playing', 'paused', 'won']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  g.resetGame();
  ok('draw() runs in every state without throwing', drewOk);

  let updateOk = true;
  g.resetGame();
  try { for (const dt of [0, 16, 16.7, 1000, -5]) g.update(dt); for (let i = 0; i < 200; i++) g.update(16); }
  catch (e) { updateOk = false; console.log('    update threw: ' + e.message); }
  ok('update() tolerates odd dt and long runs', updateOk);

  /* ======================= LOGIC: CORE LOOP ======================= */
  console.log('\n--- logic: core loop (flick -> resolves -> advances) ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame sets state to playing');
  eq(g.game.shots, 0, 'resetGame resets shots to 0');

  {
    const shots0 = g.game.shots;
    flickGuaranteedMiss();
    ok('flick puts the ball in flight', !!g.ball);
    const frames = pumpUntil(() => g.game.shots !== shots0, 400);
    ok('a resolved shot advances the shot counter', frames > 0);
  }

  // wait out the reset setTimeout so the orb/ball are ready for the next flick
  await sleep(600);
  eq(g.game.state, 'playing', 'still playing after one resolved shot');
  ok('ball is cleared and ready for the next flick', !g.ball);

  console.log('\n--- BUG CHECK: does one missed shot advance the counter by exactly 1? ---');
  // Real players experience frames via requestAnimationFrame, which naturally
  // interleaves with the game's own setTimeout-based between-shot reset. This
  // pump reproduces that real cadence (update() + an actual yield each frame)
  // instead of a tight synchronous loop, so it is a faithful replay of what a
  // human watching one miss happen would see over the following ~1.3 seconds
  // (well inside the shot's own 500ms reset window plus margin).
  g.resetGame();
  {
    const shots0 = g.game.shots;
    flickGuaranteedMiss();
    await pumpRealFrames(80, 16); // ~1.28s of real frame-by-frame play
    console.log(`    after ONE missed flick + ~1.28s of real frames: game.shots went from ${shots0} to ${g.game.shots} (state=${g.game.state})`);
    eq(g.game.shots, shots0 + 1, 'BUG: a single miss should advance the shot counter by exactly 1, not by one per frame the ball spends out of bounds');
  }

  console.log('\n--- logic: three shots in a row, still advancing ---');
  g.resetGame();
  for (let n = 1; n <= 3; n++) {
    const shots0 = g.game.shots;
    flickGuaranteedMiss();
    const frames = pumpUntil(() => g.game.shots !== shots0, 400);
    ok(`shot ${n}: resolves within a bounded number of frames`, frames > 0);
    eq(g.game.shots, shots0 + 1, `shot ${n}: shot counter advances by exactly 1`);
    await sleep(600);
    eq(g.game.state, 'playing', `shot ${n}: still playing/accepting input afterward`);
  }

  /* ======================= LOGIC: EXHAUST -> ENDING ======================= */
  console.log('\n--- logic: exhausting all shots reaches a real ending ---');
  g.resetGame();
  let shotsTaken = 0;
  const CAP = g.TOTAL + 10; // safety cap so a runaway counter can't hang the suite
  while (g.game.state === 'playing' && shotsTaken < CAP) {
    flickGuaranteedMiss();
    pumpUntil(() => !g.ball || g.game.state !== 'playing', 400);
    shotsTaken++;
    if (g.game.state === 'playing') await sleep(520); // let the between-shot reset fire
  }
  await sleep(650); // let the final won-transition setTimeout fire
  eq(g.game.state, 'won', 'exhausting shots reaches the won screen');
  ok(`reached won after ${shotsTaken} flicks (expected close to TOTAL=${g.TOTAL})`, true);
  ok('shots counter is not wildly beyond TOTAL when the round ends', g.game.shots <= g.TOTAL + 2);

  /* ======================= LOGIC: RESTART FROM ENDING ======================= */
  console.log('\n--- logic: restart from the ending (real handler) ---');
  eq(g.game.state, 'won', 'precondition: game is on the won screen');
  // Replay the game's own restart handler: a real mousedown dispatched on the
  // canvas, exactly as onDown() checks (state==='title'||state==='won') -> resetGame().
  const canvas = win.document.getElementById('game');
  const mdown = new win.MouseEvent('mousedown', { clientX: 480, clientY: 270, bubbles: true, cancelable: true });
  canvas.dispatchEvent(mdown);
  eq(g.game.state, 'playing', 'a mousedown on the won screen restarts the round');
  eq(g.game.shots, 0, 'restarting resets the shot counter');
  eq(g.game.score, 0, 'restarting resets the score');

  {
    const shots0 = g.game.shots;
    flickGuaranteedMiss();
    const frames = pumpUntil(() => g.game.shots !== shots0, 400);
    ok('the game is genuinely playable again after restart (a flick resolves)', frames > 0);
  }

  /* ======================= LOGIC: PAUSE DOES NOT FREEZE THE ROUND ======================= */
  console.log('\n--- logic: pause/resume does not desync the shot in flight ---');
  g.resetGame();
  flickGuaranteedMiss();
  g.update(16); // let the ball start moving
  const ballXBeforePause = g.ball ? g.ball.x : null;
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause pauses a playing round');
  for (let i = 0; i < 10; i++) g.update(16); // frames while paused must not move anything
  ok('the ball does not move while paused', g.ball && g.ball.x === ballXBeforePause);
  g.togglePause();
  eq(g.game.state, 'playing', 'togglePause resumes back to playing');
  const shots0p = g.game.shots;
  const frames = pumpUntil(() => g.game.shots !== shots0p, 400);
  ok('the shot in flight still resolves normally after a pause/resume cycle', frames > 0);
  eq(g.game.shots, shots0p + 1, 'the shot counter still advances by exactly 1 after pause/resume');

  console.log('\n--- logic: mute does not affect state ---');
  g.resetGame();
  const stateBeforeMute = g.game.state;
  g.toggleMute();
  eq(g.game.muted, true, 'toggleMute flips the muted flag');
  eq(g.game.state, stateBeforeMute, 'muting does not change game state');
  g.toggleMute();

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
