// jsdom Tier-2 playthrough suite for Bubble Rise (#91)
// Drives the real loop through window.__cfq: pop joy bubbles, avoid pressure bubbles,
// survive 60s / lose 3 lives, and confirms the actual restart handler (a real mousedown
// on the canvas, exactly what a player does) gets the game moving again.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'bubble-rise', 'index.html');
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
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update()/draw() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;
const canvasEl = win.document.getElementById('game');
// jsdom's getBoundingClientRect is all-zero by default -> division by zero in onDown's
// coordinate scaling. Give it real dimensions matching the canvas's own W/H (960x540)
// so a simulated click lands at real game coordinates, same as a real browser would.
canvasEl.getBoundingClientRect = () => ({ left: 0, top: 0, right: 960, bottom: 540, width: 960, height: 540 });

// Dispatch a real mousedown on the canvas at game-space (x,y) — this is the actual
// input path a player uses (canvas.addEventListener('mousedown', onDown)), including
// the title/won/gameover -> resetGame() restart branch which is NOT exposed on __cfq.
function clickAt(x, y) {
  const ev = new win.MouseEvent('mousedown', { clientX: x, clientY: y, bubbles: true, cancelable: true });
  canvasEl.dispatchEvent(ev);
}

// Force-spawn a bubble of a known type at a known position by using the exposed live
// `bubbles` array reference (the __cfq getter returns the real array, not a copy) and
// the real spawnBubble() to get a real-shaped object, then overwrite its fields.
// This is the only way to control bubble type without fighting the seeded RNG, and it
// keeps every other field (radius, wobble, etc.) exactly as the game itself produces.
function forceBubble(joy, x = 480, y = 300) {
  g.spawnBubble();
  const b = g.bubbles[g.bubbles.length - 1];
  b.joy = joy;
  b.x = x; b.y = y;
  b.popped = false; b.escaped = false;
  return b;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'spawnBubble', 'clickBubble', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.bubbles));
  ok('canvas element is present', !!canvasEl);
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.game.state, 'title', 'game boots into the title screen');

  console.log('\n--- logic: starting the game (title -> playing) ---');
  clickAt(480, 270);
  eq(g.game.state, 'playing', 'clicking the title screen starts the round');
  eq(g.game.lives, 3, 'a fresh round starts with 3 lives');
  eq(g.game.score, 0, 'a fresh round starts at score 0');

  console.log('\n--- logic: core action advances the game (joy pop) ---');
  // combo is incremented BEFORE the bonus is computed (game.combo++ happens first in
  // clickBubble), so the first pop already scores at combo=1 (10+1*2=12), not combo=0.
  let b1 = forceBubble(true, 480, 300);
  const score0 = g.game.score, popped0 = g.game.popped, combo0 = g.game.combo;
  g.clickBubble(480, 300);
  ok('popping a joy bubble raises the score', g.game.score > score0);
  eq(g.game.score, score0 + 12, 'first joy pop awards 10+combo*2 with combo pre-incremented to 1 (=12)');
  eq(g.game.popped, popped0 + 1, 'popped counter advances');
  eq(g.game.combo, combo0 + 1, 'combo advances on a joy pop');
  ok('the bubble is marked popped, not left dangling', b1.popped === true);
  eq(g.game.state, 'playing', 'still playing after a pop (no soft-lock)');

  console.log('\n--- logic: three joy pops in a row -> still advancing, still accepting input ---');
  const scoreAfter1 = g.game.score;
  const b2 = forceBubble(true, 500, 300);
  g.clickBubble(500, 300);
  ok('second pop in a row advances the score again', g.game.score > scoreAfter1);
  eq(g.game.combo, 2, 'combo keeps climbing on consecutive pops');
  eq(g.game.score, scoreAfter1 + 14, 'combo bonus scales with combo (now 2: 10+2*2=14)');

  const scoreAfter2 = g.game.score;
  const b3 = forceBubble(true, 520, 300);
  g.clickBubble(520, 300);
  ok('third pop in a row still advances the score', g.game.score > scoreAfter2);
  eq(g.game.combo, 3, 'combo reaches 3 after three consecutive pops');
  eq(g.game.state, 'playing', 'game is still playing and accepting input after three pops');
  ok('maxCombo tracks the streak', g.game.maxCombo >= 3);

  console.log('\n--- logic: pressure bubble punishes and resets streak, but keeps the game alive ---');
  const scoreBeforeBad = g.game.score, livesBeforeBad = g.game.lives;
  const bBad = forceBubble(false, 540, 300);
  g.clickBubble(540, 300);
  eq(g.game.score, Math.max(0, scoreBeforeBad - 5), 'popping a pressure bubble costs 5 points');
  eq(g.game.lives, livesBeforeBad - 1, 'popping a pressure bubble costs a life');
  eq(g.game.combo, 0, 'popping a pressure bubble resets the combo');
  eq(g.game.state, 'playing', 'losing a (non-final) life does not end the round early');

  console.log('\n--- logic: bubbles escaping off-screen (the avoidance mechanic) ---');
  // the escape check is b.y <= -100; place bubbles well past that threshold so the
  // upward movement inside update() (vy is negative) can't put them back above it
  {
    const joyEsc = forceBubble(true, 300, -150);
    g.game.combo = 5; // set a nonzero combo to observe the reset
    const scoreBefore = g.game.score;
    g.update(16);
    ok('an unpopped joy bubble that escapes off the top is marked escaped', joyEsc.escaped === true);
    eq(g.game.combo, 0, 'letting a joy bubble escape resets the combo');
    ok('letting a joy bubble escape costs a small score penalty', g.game.score <= scoreBefore);
  }
  {
    const avoidedBefore = g.game.pressureAvoided;
    const pressEsc = forceBubble(false, 300, -150);
    g.update(16);
    ok('an unpopped pressure bubble that escapes is marked escaped', pressEsc.escaped === true);
    eq(g.game.pressureAvoided, avoidedBefore + 1, 'letting a pressure bubble float away increments pressureAvoided (the intended play)');
  }

  console.log('\n--- logic: pause is escapable, not a soft-lock ---');
  g.resetGame();
  {
    const elapsedBefore = g.game.elapsed;
    g.update(16); g.update(16);
    ok('elapsed advances while playing', g.game.elapsed > elapsedBefore);
    g.togglePause();
    eq(g.game.state, 'paused', 'togglePause pauses the game');
    const elapsedPaused = g.game.elapsed;
    g.update(16); g.update(16); g.update(16);
    eq(g.game.elapsed, elapsedPaused, 'elapsed does not advance while paused');
    // a click while paused must NOT be swallowed into a reset or a stray pop
    clickAt(480, 270);
    eq(g.game.state, 'paused', 'clicking the canvas while paused has no effect (still paused, not reset)');
    g.togglePause();
    eq(g.game.state, 'playing', 'togglePause resumes the game');
    g.update(16);
    ok('elapsed resumes advancing after unpausing', g.game.elapsed > elapsedPaused);
    const b = forceBubble(true, 480, 300);
    const sBefore = g.game.score;
    g.clickBubble(480, 300);
    ok('input is accepted again after a pause/resume cycle', g.game.score > sBefore);
  }

  console.log('\n--- logic: exhausting the fail condition reaches a real ending ---');
  g.resetGame();
  eq(g.game.lives, 3, 'lives reset to 3 on a fresh round');
  for (let i = 0; i < 3; i++) {
    forceBubble(false, 480, 300);
    g.clickBubble(480, 300);
  }
  eq(g.game.lives, 0, 'three pressure pops exhaust all lives');
  eq(g.game.state, 'playing', 'game over is deliberately delayed (setTimeout) not instantaneous');
  await sleep(500); // the 400ms setTimeout(()=>game.state='gameover') must have fired
  eq(g.game.state, 'gameover', 'losing the last life reaches a real gameover screen (not stuck at lives=0)');

  console.log('\n--- logic: restart from gameover via the REAL restart handler ---');
  clickAt(480, 270); // real mousedown -> onDown -> resetGame(), exactly what a player does
  eq(g.game.state, 'playing', 'clicking the gameover screen restarts the round');
  eq(g.game.lives, 3, 'restarted round has full lives');
  eq(g.game.score, 0, 'restarted round has score 0');
  eq(g.bubbles.length, 0, 'restarted round clears leftover bubbles');
  {
    const b = forceBubble(true, 480, 300);
    const sBefore = g.game.score;
    g.clickBubble(480, 300);
    ok('the game is genuinely playable again after restart (a pop scores)', g.game.score > sBefore);
  }

  console.log('\n--- logic: the win path (surviving the full 60s) is reachable and also restarts cleanly ---');
  g.resetGame();
  g.game.elapsed = g.game.time = 59990;
  g.update(20);
  eq(g.game.state, 'won', 'surviving to the end of the 60s timer reaches the won screen');
  ok('lives were still positive at the moment of winning', g.game.lives > 0);

  clickAt(480, 270); // restart from the won screen, same real handler
  eq(g.game.state, 'playing', 'clicking the won screen restarts the round');
  eq(g.game.elapsed, 0, 'restarted round has elapsed reset to 0');
  {
    const b = forceBubble(true, 480, 300);
    const sBefore = g.game.score;
    g.clickBubble(480, 300);
    ok('the game is genuinely playable again after a win-restart', g.game.score > sBefore);
  }

  console.log('\n--- logic: best-score persistence across a game over ---');
  g.resetGame();
  g.game.score = 500;
  g.game.lives = 1;
  forceBubble(false, 480, 300);
  // the fatal hit is itself a pressure pop, so score drops by 5 (Math.max(0,score-5))
  // BEFORE the best-score comparison runs -> the score that becomes "best" is 495, not 500
  g.clickBubble(480, 300);
  await sleep(500);
  eq(g.game.state, 'gameover', 'ending reached for the best-score check');
  eq(g.game.score, 495, 'the fatal pressure pop deducts 5 before the best check runs');
  eq(g.game.best, 495, 'the post-penalty score becomes the new best on game over');
  eq(win.localStorage.getItem('bubbleRise_best'), '495', 'best score is persisted to localStorage');
  clickAt(480, 270);
  eq(g.game.newBest, false, 'newBest flag clears on the next restart (does not stick forever)');

  console.log('\n--- logic: the flurry event (bonus/pressure spike) advances rather than freezing ---');
  g.resetGame();
  eq(g.game.flurry, 0, 'no flurry active at round start');
  const firstScheduledAt = g.game.nextFlurryAt;
  g.game.elapsed = firstScheduledAt - 10;
  g.update(20);
  ok('reaching the scheduled time starts a flurry', g.game.flurry > 0);
  // nextFlurryAt is set to (elapsed at trigger + 15000) the moment the flurry STARTS,
  // so it should already have moved past the originally-scheduled time
  ok('the next flurry is scheduled further out as soon as this one starts', g.game.nextFlurryAt > firstScheduledAt);
  const nextFlurryAtDuringFlurry = g.game.nextFlurryAt;
  // run the flurry all the way out
  let iterations = 0;
  while (g.game.flurry > 0 && iterations < 500) { g.update(16); iterations++; }
  ok('the flurry ends on its own within a bounded number of frames (not stuck forever)', g.game.flurry === 0 && iterations < 500);
  eq(g.game.state, 'playing', 'the game is still playing after a flurry ends');
  // the game must keep spawning/accepting input after the flurry, not freeze
  {
    const before = g.bubbles.length;
    for (let i = 0; i < 100 && g.bubbles.length === before; i++) g.update(50);
    ok('bubbles continue to spawn after a flurry ends (spawn loop not frozen)', g.bubbles.length > before);
    const b = forceBubble(true, 480, 300);
    const sBefore = g.game.score;
    g.clickBubble(480, 300);
    ok('input is still accepted after a flurry cycle', g.game.score > sBefore);
  }
  // advance elapsed to the next scheduled flurry and confirm a SECOND flurry actually
  // fires (the cycle repeats rather than a one-shot event that never recurs)
  g.game.elapsed = nextFlurryAtDuringFlurry - 10;
  g.update(20);
  ok('a second flurry fires when its scheduled time arrives (the event genuinely recurs)', g.game.flurry > 0);

  console.log('\n--- logic: draw() does not throw across the states just exercised ---');
  let drewOk = true;
  for (const st of ['title', 'playing', 'paused', 'won', 'gameover']) {
    const saved = g.game.state;
    g.game.state = st;
    try { g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
    g.game.state = saved;
  }
  ok('draw() runs in every state without throwing', drewOk);

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
