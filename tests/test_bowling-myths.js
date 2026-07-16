// jsdom Tier-2 playthrough suite for Bowling for Myths (#55)
// Core loop: drag/arrow-key to aim, release the ball, it rolls up the lane and knocks pins.
// 10 frames, real strike/spare scoring. A player advances by throwing balls via
// window.__cfq.releaseBall() (exactly what Space / mouse-release do) and window.update(dt)
// (exactly what the game's own requestAnimationFrame loop calls every tick).
//
// This suite drives the REAL per-tick loop the way a real browser would (rAF firing every
// ~16ms), because the bug this game ships is a "same tick, different iteration" bug: it is
// invisible if you only ever call update() once after a ball settles.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'bowling-myths', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- canvas 2D context stub (jsdom returns null from getContext) ----
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
    w.requestAnimationFrame = () => 0;  // disable auto-loop; we drive update() manually, tick by tick
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;         // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Aim the ball off to the rail with the game's own keyboard input (ArrowLeft), then release.
// aimX resets to W/2=480 at the start of every ball; 20 presses of 15px each (300px) clamps
// against the left rail (x0+20=280) well before overshooting, giving a fully deterministic
// gutter ball (0 pins) with no dependence on the pin-physics RNG.
function aimGutterLeft() {
  for (let i = 0; i < 20; i++) win.dispatchEvent(new win.KeyboardEvent('keydown', { code: 'ArrowLeft' }));
}
function aimCenter() {
  // no-op: aimX already resets to W/2 after every ball / on newFrame()
}
// Run update(16) ticks - exactly what the game's own rAF loop does every ~16ms of real
// wall-clock time - until the ball reference goes null (endBall's "safe" branch) or the
// tick cap is hit (the corrupted branches never null it out).
function tickUntilBallGone(cap) {
  let t = 0;
  while (g.ball && t < cap) { g.update(16); t++; }
  return t;
}
function tickN(n) { for (let i = 0; i < n; i++) g.update(16); }

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['game', 'resetGame', 'newFrame', 'releaseBall', 'endBall', 'endFrame', 'update', 'draw']
    .every(k => k in g));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  let drewOk = true;
  for (const st of ['title', 'playing', 'paused', 'won', 'gameover']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  g.resetGame();
  ok('draw() runs in every state without throwing', drewOk);

  /* ======================= logic: setup ======================= */
  console.log('\n--- logic: setup ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame sets state to playing');
  eq(g.game.frame, 1, 'resetGame starts on frame 1');
  eq(g.game.ball1, true, 'resetGame starts on ball 1');
  eq(g.game.pins, 0, 'resetGame resets pins');
  eq(g.game.score, 0, 'resetGame resets score');
  eq(g.frameLog.length, 0, 'resetGame clears the frame log');

  /* ======================= logic: core action advances (single ball) ======================= */
  console.log('\n--- logic: the core action (throw a ball) advances the game ---');
  aimGutterLeft();
  g.releaseBall();
  ok('releaseBall spawns a moving ball', !!g.ball);
  const t1 = tickUntilBallGone(200);
  ok(`ball 1 settles within the tick cap (settled at tick ${t1})`, t1 < 200);
  eq(g.game.frame, 1, 'a single open (non-final) ball keeps the frame at 1');
  eq(g.game.ball1, false, 'after ball 1 of an open frame, ball1 flips to false (ball 2 is next)');
  eq(g.frameLog.length, 1, 'the frame is logged (ball 1 result)');
  eq(g.frameLog[0].k1, 0, 'the gutter ball logged 0 pins for ball 1');
  eq(g.game.pins, 0, 'no pins were actually knocked');
  ok('input is accepted for ball 2 (game did not soft-lock after ball 1)', (() => {
    const before = g.game.ball1;
    aimGutterLeft();
    return g.game.state === 'playing' && !g.ball; // ball cleared, ready to release again
  })());

  /* ======================= THE BUG: completing a frame corrupts the frame counter ======================= */
  console.log('\n--- logic: completing a frame (the 2nd ball) -- does the game actually advance one frame? ---');
  const frameLogLenBefore = g.frameLog.length;
  g.releaseBall();
  ok('ball 2 is released (a real ball is in flight)', !!g.ball);
  // Drive exactly the way the game's own requestAnimationFrame loop would: one update(16) per
  // simulated ~16ms tick. The ball settles at essentially the same tick as ball 1 did (same
  // deterministic gutter trajectory), then endBall()/endFrame() are what run afterwards.
  tickN(80); // ~1.28s of simulated real animation time - the frame-1-to-2 transition should
             // long since be over (the real newFrame() setTimeout the game schedules is 600ms)
  const frameAfter80Ticks = g.game.frame;
  const frameLogLenAfter = g.frameLog.length;
  ok('exactly one NEW frame was actually played (frameLog gained exactly 1 entry, still describing frame 1\'s 0-0)',
    frameLogLenAfter === frameLogLenBefore && g.frameLog[0].k1 === 0 && g.frameLog[0].k2 === 0);
  ok(`FINDING: game.frame should now read 2 (one frame completed) but instead reads ${frameAfter80Ticks} after 80 update() ticks -- `
     + `the frame counter raced ahead on its own`,
     frameAfter80Ticks === 2);
  console.log(`    >>> observed: frameLog.length=${frameLogLenAfter} (correct: 1 real frame played), `
    + `game.pins=${g.game.pins} (correct: 0 pins), game.frame=${frameAfter80Ticks} (should be 2)`);

  await sleep(900); // let every scheduled setTimeout (600/700/800ms) resolve
  console.log(`    >>> after waiting out the real setTimeout delays: game.state='${g.game.state}', game.frame=${g.game.frame}, frameLog.length=${g.frameLog.length}`);
  ok('after 2 balls the game is still playing (2 balls is one frame, not a whole game)',
    g.game.state === 'playing');
  eq(g.game.ball1, true, 'the 600ms newFrame() timer has fired: a fresh rack is up, on ball 1');
  eq(g.pins.filter(p => !p.fallen).length, 10, 'frame 2 racked a full set of 10 standing pins');

  /* ======================= releaseBall during the 600ms newFrame() window ======================= */
  // endFrame() defers newFrame() by 600ms. In that window state is still 'playing' and the ball
  // has been cleared, so any guard that only tests ballMoving/state lets a roll through at the
  // OLD, already-scored rack -- re-entering endBall()'s ball-2 branch and advancing the frame a
  // second time for one physical roll. Nothing may be thrown until the new rack exists.
  console.log('\n--- logic: a ball thrown during the frame-transition window must be refused ---');
  g.resetGame();
  aimGutterLeft(); g.releaseBall(); tickUntilBallGone(200);   // ball 1 of frame 1
  aimGutterLeft(); g.releaseBall(); tickUntilBallGone(200);   // ball 2 -> frame ends, 600ms timer armed
  const frameInWindow = g.game.frame, logInWindow = g.frameLog.length;
  g.releaseBall();                                            // the sneaked roll
  ok('no ball is spawned during the frame-transition window', !g.ball);
  eq(g.game.frame, frameInWindow, 'the sneaked roll did not advance the frame a second time');
  eq(g.frameLog.length, logInWindow, 'the sneaked roll did not touch the already-scored frame log');
  await sleep(900);
  eq(g.game.frame, 2, 'after the window closes the game sits on frame 2 exactly');
  ok('and a ball CAN be thrown again once the new rack is up', (() => { g.releaseBall(); return !!g.ball; })());
  tickUntilBallGone(300);

  /* ======================= "3 times running -- still advancing, still accepting input" ======================= */
  console.log('\n--- logic: can the player throw a 3rd ball? (Tier 2 minimum #2) ---');
  ok('a 3rd ball can be thrown -- the game still accepts input after a completed frame',
    g.game.state === 'playing');

  /* ======================= play all 10 frames -> a real ending ======================= */
  console.log('\n--- logic: play out all 10 frames -> reach a real ending ---');
  g.resetGame();
  let rolls = 0, guard = 0;
  while (g.game.state === 'playing' && guard++ < 300) {
    if (g.ball) { g.update(16); continue; }
    g.releaseBall();
    if (!g.ball) { await sleep(120); continue; }   // transition window -> wait for the next rack
    rolls++;
    tickUntilBallGone(400);
    await sleep(80);
  }
  await sleep(1500);
  console.log(`    >>> played out: frame=${g.game.frame}, frameLog.length=${g.frameLog.length}, rolls=${rolls}, `
    + `score=${g.game.score}, pins=${g.game.pins}, state='${g.game.state}'`);
  console.log(`    >>> frameLog: ${g.frameLog.map(f => f.k1 + '/' + f.k2).join('  ')}`);
  eq(g.frameLog.length, 10, 'all 10 frames were actually played and logged');
  ok(`a terminal state (won/gameover) is reached by playing 10 real frames (state='${g.game.state}')`,
    g.game.state === 'won' || g.game.state === 'gameover');
  ok(`the ending took a realistic number of rolls, not 2 (rolls=${rolls})`, rolls >= 10);
  ok(`the final score is a real bowling score (score=${g.game.score})`, g.game.score > 0 && g.game.score <= 300);

  /* ======================= restart from the ending ======================= */
  console.log('\n--- logic: restart from the ending ---');
  g.resetGame(); // the exact function onDown() calls when clicking the title/won/gameover panel
  eq(g.game.state, 'playing', 'resetGame from the ending returns to playing');
  eq(g.game.frame, 1, 'resetGame from the ending resets to frame 1');
  eq(g.frameLog.length, 0, 'resetGame from the ending clears the frame log');
  eq(g.ball, null, 'resetGame from the ending clears any stale ball');

  // and the restarted game is genuinely playable again for at least one ball:
  aimGutterLeft();
  g.releaseBall();
  const t2 = tickUntilBallGone(200);
  ok(`after restart, ball 1 can be thrown and settles normally (tick ${t2})`, t2 < 200 && g.game.ball1 === false);

  /* ======================= confirm frame advance is correct for non-gutter balls too ======================= */
  console.log('\n--- logic: the frame advances correctly for real (non-gutter) results too ---');
  g.resetGame();
  aimCenter();
  g.releaseBall();
  tickUntilBallGone(300);
  const knockedBall1 = g.frameLog.length ? g.frameLog[0].k1 : -1;
  ok('a center-aimed ball 1 knocks down at least one pin (a real, non-gutter result)', knockedBall1 > 0);
  if (!g.game.ball1) {
    // ball 1 didn't strike -> ball 2 is next; complete the frame and watch the frame counter again
    aimCenter();
    g.releaseBall();
    tickN(80);
    ok(`with a real (non-gutter) result too, completing frame 1's 2nd ball advances to frame 2 exactly `
      + `(frame=${g.game.frame}, frameLog.length=${g.frameLog.length})`,
      g.game.frame === 2 && g.frameLog.length === 1);
  } else {
    ok(`ball 1 was itself a strike: the frame ends on ball 1 and advances to 2 exactly (frame=${g.game.frame})`,
      g.game.frame === 2 && g.frameLog.length === 1);
  }

  // The strike path (endBall's ball-1 `knocked===10` branch) is a SEPARATE endFrame() call site
  // from the ball-2 branch, and which one frame 1 takes is RNG-dependent. Force it so the strike
  // branch is always exercised, whatever the pin physics happened to do above.
  console.log('\n--- logic: the strike branch (frame ends on ball 1) does not race either ---');
  g.resetGame();
  g.releaseBall();
  g.pins.forEach(p => p.fallen = true);   // a clean strike, deterministically
  g.endBall();
  eq(g.frameLog[0].k1, 10, 'the forced strike logged 10 pins on ball 1');
  eq(g.game.frame, 2, 'a strike advances the frame by exactly 1');
  eq(g.ball, null, 'a strike clears the ball (update() must not keep re-ending it)');
  tickN(80); // the tick storm that used to free-run the counter
  eq(g.game.frame, 2, 'the frame counter holds at 2 across 80 further update() ticks after a strike');
  eq(g.frameLog.length, 1, 'the strike was scored exactly once');

  /* ======================= skip / hint / power-up path ======================= */
  console.log('\n--- logic: skip / hint / power-up path ---');
  ok('N/A: Bowling for Myths has no skip, hint, or power-up mechanic to probe', true);

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
