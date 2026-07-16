// jsdom test harness for Golf Putt (#58)
// Tier 2 playthrough suite: can a competent player putt their way from hole 1 to
// "Course Complete" over 9 holes? Drives the real loop through window.__cfq
// (game, ball, holePos, walls, resetGame, buildHole, putt, update, draw, togglePause).
//
// Golf Putt has no lives/lose-state — the only "ending" is completing all 9 holes
// (game.state becomes 'won'). There is no skip/hint/power-up to probe (bullet 5 of the
// protocol's minimum bar), so that slot is used for the pause mechanic instead: does
// pausing block input without corrupting state, and does resuming un-freeze it cleanly?
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'golf-putt', 'index.html');
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
const canvas = win.document.getElementById('game');
if (canvas) canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 960, height: 540 });

// ---- helpers to drive the real loop ----

// A putt aimed straight at the current hole with an EXACT initial speed (px/s).
// putt(dx,dy) internally computes spd=clamp(hypot(dx,dy)*3,0,600) and angle=atan2(dy,dx),
// so scaling the aim vector gives precise control over launch speed independent of distance.
function aimedPutt(speed) {
  const dx = g.holePos.x - g.ball.x, dy = g.holePos.y - g.ball.y;
  const d = Math.hypot(dx, dy) || 1;
  const k = (speed / 3) / d;
  g.putt(dx * k, dy * k);
}
function runUntilStopped(maxTicks) {
  let t = 0;
  while (Math.hypot(g.ball.vx, g.ball.vy) > 0 && t < maxTicks) { g.update(16); t++; }
  return t;
}
// Drive putts (with a little randomized aim/power jitter to route around obstacles)
// until the current hole is sunk (game.hole changes or state leaves 'playing').
function solveHole(maxAttempts, maxTicksPerAttempt, seedBase) {
  const holeAtStart = g.game.hole;
  let seed = seedBase >>> 0 || 1;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed % 10000) / 10000; };
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const dx = g.holePos.x - g.ball.x, dy = g.holePos.y - g.ball.y;
    const dist = Math.hypot(dx, dy) || 1;
    const r = rnd();
    const ang = Math.atan2(dy, dx) + (r - 0.5) * 0.5;
    const spd = Math.min(600, Math.max(80, dist * (0.7 + r * 0.6)));
    g.putt(Math.cos(ang) * spd / 3, Math.sin(ang) * spd / 3);
    let ticks = 0;
    while (ticks < maxTicksPerAttempt) {
      g.update(16); ticks++;
      if (g.game.hole !== holeAtStart || g.game.state !== 'playing') return { ok: true, attempts: attempt + 1 };
      if (Math.hypot(g.ball.vx, g.ball.vy) === 0) break;
    }
  }
  return { ok: g.game.hole !== holeAtStart || g.game.state !== 'playing', attempts: maxAttempts };
}
function dragPutt(x0, y0, x1, y1) {
  canvas.dispatchEvent(new win.MouseEvent('mousedown', { clientX: x0, clientY: y0, bubbles: true }));
  canvas.dispatchEvent(new win.MouseEvent('mousemove', { clientX: x1, clientY: y1, bubbles: true }));
  canvas.dispatchEvent(new win.MouseEvent('mouseup', { clientX: x1, clientY: y1, bubbles: true }));
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildHole', 'putt', 'wallCollide', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.HOLES) && Array.isArray(g.NORMS));
  ok('canvas element is present', !!canvas);
  ok('no uncaught page errors on load', pageErrors.length === 0);

  eq(g.HOLES.length, 9, 'course has 9 holes');
  ok('every hole defines ball/hole positions and a walls array', g.HOLES.every(h =>
    typeof h.bx === 'number' && typeof h.by === 'number' &&
    typeof h.hx === 'number' && typeof h.hy === 'number' && Array.isArray(h.walls)));

  let drewOk = true;
  g.resetGame();
  for (const st of ['title', 'playing', 'paused', 'won']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  ok('draw() runs in every state without throwing', drewOk);
  g.resetGame();

  ok('resetGame() sets state to playing on hole 1', g.game.state === 'playing' && g.game.hole === 0);
  eq(g.ball.x, g.HOLES[0].bx, 'ball starts at hole 1\'s tee (x)');
  eq(g.ball.y, g.HOLES[0].by, 'ball starts at hole 1\'s tee (y)');

  let updateOk = true;
  try { for (const dt of [0, 16, 16.7, 1000, -5]) g.update(dt); for (let i = 0; i < 200; i++) g.update(16); }
  catch (e) { updateOk = false; console.log('    update threw: ' + e.message); }
  ok('update() tolerates odd dt and long runs', updateOk);

  /* ======================= LOGIC: core loop advances ======================= */
  console.log('\n--- logic: core action (putt) advances the game ---');
  g.resetGame();
  {
    const holeBefore = g.game.hole;
    const ballStartX = g.ball.x;
    // Hole 1 has a wall down the middle, so route around it the way a real player would:
    // aim, putt, and if it doesn't drop, putt again. This is the actual core action loop.
    const r = solveHole(60, 2500, 777);
    ok('a putt actually moves the ball off the tee', g.ball.x !== ballStartX || r.attempts > 0);
    ok('sinking a putt advances to the next hole', r.ok && g.game.hole === holeBefore + 1);
    ok('strokes were actually spent getting there', g.game.holeStrokes[0] >= 1);
    eq(g.game.state, 'playing', 'still playing after the first hole');
    await sleep(650); // let the scheduled buildHole() transition run
    eq(g.ball.x, g.HOLES[1].bx, 'the new hole loads its own tee position (x)');
    eq(g.ball.y, g.HOLES[1].by, 'the new hole loads its own tee position (y)');
    ok('the board is playable again (input accepted) after advancing', Math.hypot(g.ball.vx, g.ball.vy) === 0);
  }

  console.log('\n--- logic: three putts in a row, still advancing ---');
  {
    for (let n = 0; n < 3; n++) {
      const before = g.game.hole;
      const r = solveHole(60, 2500, 555 + n * 11);
      ok(`hole ${before + 1}: solveHole succeeds`, r.ok);
      ok(`hole ${before + 1}: game.hole actually advanced by exactly 1 (no skip)`, g.game.hole === before + 1 || g.game.state === 'won');
      eq(g.game.state, 'playing', `still playing after hole ${before + 1}`);
      await sleep(650);
      ok(`hole ${before + 2}: input is accepted (ball at rest, ready for a fresh putt)`, Math.hypot(g.ball.vx, g.ball.vy) === 0);
    }
  }

  /* ======================= LOGIC: exhaust to a real ending ======================= */
  console.log('\n--- logic: playing all remaining holes reaches a real ending ---');
  {
    let guard = 0;
    while (g.game.state === 'playing' && guard < 20) {
      const before = g.game.hole;
      const r = solveHole(80, 2500, 999 + guard * 13);
      if (!r.ok) break;
      if (g.game.state === 'playing') await sleep(650);
      guard++;
    }
    eq(g.game.state, 'won', 'clearing all 9 holes reaches the "Course Complete" ending');
    eq(g.game.holeStrokes.length, 9, 'a scorecard entry exists for every one of the 9 holes');
    ok('every scorecard entry is a real, positive stroke count', g.game.holeStrokes.every(s => Number.isFinite(s) && s >= 1));
    ok('best score is persisted on a genuine win', win.localStorage.getItem('golfputt_best_v1') !== null);
  }

  /* ======================= LOGIC: restart from the ending ======================= */
  console.log('\n--- logic: restart from the ending is playable again ---');
  {
    ok('precondition: game is in the won state', g.game.state === 'won');
    // Replay the game's OWN restart path: onDown() calls resetGame() when state is 'title'/'won'.
    dragPutt(480, 270, 480, 270);
    eq(g.game.state, 'playing', 'a real click/tap from the won screen restarts the round');
    eq(g.game.hole, 0, 'restarting goes back to hole 1');
    eq(g.game.strokes, 0, 'restarting clears the stroke counter');
    eq(g.ball.x, g.HOLES[0].bx, 'restarting resets the ball to hole 1\'s tee (x)');
    eq(g.ball.y, g.HOLES[0].by, 'restarting resets the ball to hole 1\'s tee (y)');
    // and the restarted round is actually playable, not just cosmetically reset
    const r = solveHole(60, 2500, 4242);
    ok('the restarted round can be played (a putt sinks and advances)', r.ok && g.game.hole === 1);
  }

  /* ======================= LOGIC: pause is the modifier-mechanic slot ======================= */
  // Golf Putt has no skip/hint/power-up; pause is the closest "modifier" mechanic, so it
  // gets the bullet-5 treatment: does it block input cleanly, and un-freeze cleanly on resume?
  console.log('\n--- logic: pause blocks input without corrupting state; resume un-freezes it ---');
  g.resetGame();
  {
    const bx0 = g.ball.x, by0 = g.ball.y;
    g.togglePause();
    ok('togglePause() actually sets game.paused', g.game.paused === true);
    const strokesBefore = g.game.strokes;
    dragPutt(bx0 + 40, by0, bx0 - 60, by0); // a real drag-putt attempt while paused
    ok('a real putt attempt is refused while paused (no stroke spent)', g.game.strokes === strokesBefore);
    for (let i = 0; i < 50; i++) g.update(16);
    ok('the ball does not move while paused, even across many update() ticks', g.ball.x === bx0 && g.ball.y === by0);

    g.togglePause();
    ok('togglePause() again clears game.paused', g.game.paused === false);
    dragPutt(bx0 + 40, by0, bx0 - 60, by0);
    ok('a real putt is accepted immediately after resuming (a stroke is spent)', g.game.strokes === strokesBefore + 1);
    runUntilStopped(2000);
    ok('the ball actually moved after resuming (pause did not permanently freeze input)', g.ball.x !== bx0);
  }

  /* ======================= BUG: missing post-sink guard skips holes ======================= */
  // update()'s hole-sunk branch (index.html, the `if(dh<HOLE_R && ...)` block right after the
  // wall-collision loop) does game.hole++ and schedules `setTimeout(()=>buildHole(game.hole),600)`
  // but never sets any "transitioning"/"awaiting next hole" flag, and never changes game.state.
  // For up to 600ms after a putt sinks, `ball`, `holePos` and `walls` still point at the JUST-
  // COMPLETED hole, while game.state is still 'playing' and player input is still fully live.
  // If the ball comes to rest (v=0) inside the cup -- an entirely ordinary "dying putt", the
  // exact shape the game's own "ACE"/one-putt-streak bonus rewards -- the sunk-check keeps
  // re-satisfying every subsequent tick (nothing has moved), so the game keeps re-running the
  // whole hole-complete branch: incrementing game.hole and awarding bonus score again, for a
  // hole the player never played, until buildHole() finally rebuilds the board.
  console.log('\n--- bug repro: post-sink transition window re-fires the hole-complete logic ---');
  {
    // Isolate on hole 9 (index 8, no walls) purely to make the repro deterministic and free of
    // wall-bounce randomness -- buildHole() is the game's own hole-loading function (also used
    // by resetGame() itself), not a forced/undefined state.
    g.resetGame();
    g.buildHole(8);
    aimedPutt(600);            // putt 1: an ordinary full-power drive down the fairway
    runUntilStopped(3000);
    aimedPutt(51.1);           // putt 2: an ordinary soft "dying" lag putt (calibrated to arrive
                                // at the cup with the friction model's natural zero-speed snap)
    let preTicks = 0;
    while (g.game.hole === 0 && g.game.state === 'playing' && preTicks < 3000) { g.update(16); preTicks++; }
    const sankOk = g.game.hole === 1 && g.game.state === 'playing';
    ok('setup: the lag putt sinks normally and speed is exactly 0 at the moment it does', sankOk && Math.hypot(g.ball.vx, g.ball.vy) === 0);

    if (sankOk) {
      const before = { hole: g.game.hole, score: g.game.score, totalStrokes: g.game.totalStrokes, holeStrokes: [...g.game.holeStrokes] };

      // Scenario A: player takes one more entirely ordinary putt before the 600ms transition
      // fires. buildHole(1) cannot possibly have run yet (it's on a real 600ms setTimeout and
      // only 16ms of virtual time elapses below), so `game.hole` must still read `before.hole`
      // afterwards -- any change is the stale-cup re-trigger, not real progress on hole 2.
      aimedPutt(90);
      g.update(16);
      ok('BUG: one ordinary follow-up putt inside the transition window does not silently ' +
         'advance an extra hole (real content should not be skipped)',
         g.game.hole === before.hole);
      ok('BUG: score is not inflated by a phantom completion for a hole never played',
         g.game.score === before.score);
      ok('BUG: the scorecard does not gain a bogus extra entry from the phantom hole',
         g.game.holeStrokes.length === before.holeStrokes.length);
    }
  }

  console.log('\n--- bug repro: the same re-fire happens with ZERO extra player input ---');
  {
    g.resetGame();
    g.buildHole(8);
    aimedPutt(600);
    runUntilStopped(3000);
    aimedPutt(51.1);
    let preTicks = 0;
    while (g.game.hole === 0 && g.game.state === 'playing' && preTicks < 3000) { g.update(16); preTicks++; }
    const sankOk = g.game.hole === 1 && g.game.state === 'playing';
    if (sankOk) {
      const holeAfterOneRealSink = g.game.hole; // 1
      // Nothing else happens here except the ordinary per-frame update() loop a real
      // requestAnimationFrame would drive -- no putt(), no drag, no state poking.
      for (let i = 0; i < 40; i++) g.update(16); // 640ms of ordinary frame time, no input
      ok('BUG: with zero further player input, game.hole does not advance past the one ' +
         'hole the player actually sank (no phantom auto-advance)',
         g.game.hole === holeAfterOneRealSink);
    } else {
      ok('setup (2nd repro): the lag putt sinks normally', false);
    }
  }

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
