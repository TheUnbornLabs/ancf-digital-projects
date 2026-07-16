// jsdom Tier-2 playthrough suite for Orbit Keeper (#41)
// Core loop: click/tap fires a radial thrust that pushes the planet away from the
// star; gravity continuously pulls it back in. Survive 60s with the planet's
// distance from the star (r) kept between INNER_R and OUTER_R to win; leaving that
// band 3 times (lives 3->0) ends the run. This suite drives that loop through the
// window.__cfq hook (and, for the state-transition clicks, real canvas mousedown
// events) and asserts progression, not just setup.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'orbit-keeper', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }

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

function makeDom() {
  const pageErrors = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: false,
    url: 'http://localhost/',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { return stub(this); };
      w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update() manually
      w.cancelAnimationFrame = () => {};
      w.AudioContext = undefined;          // silence Web Audio
      w.webkitAudioContext = undefined;
      w.addEventListener('error', e => pageErrors.push(e.message));
    }
  });
  return { dom, win: dom.window, pageErrors };
}

// board is fixed at W=960,H=540 in the source -> star sits at (480,270)
const CX = 480, CY = 270;
function radius(planet) { return Math.hypot(planet.x - CX, planet.y - CY); }

// A competent player's controller: thrust once (with a short cooldown to avoid
// overshoot) whenever the planet drifts near the inner danger zone, otherwise let
// gravity do the work. Confirmed by probing several thresholds; this one clears the
// full 60s with zero lives lost.
function playToWin(g, maxSteps) {
  let cd = 0;
  for (let i = 0; i < maxSteps; i++) {
    const r = radius(g.planet);
    if (cd > 0) cd--;
    if (r < 150 && cd === 0) { g.thrust(); cd = 5; }
    g.update(16);
    if (g.game.state !== 'playing') return i + 1;
  }
  return maxSteps;
}

// Neglecting the core action entirely (never thrusting) is a legitimate way to lose:
// the initial tangential velocity is a near-circular-orbit approximation, damping
// (0.9995/frame) bleeds it down, and gravity wins. Confirmed deterministic (no RNG
// in the physics path) -> reaches gameover at the same step count every run.
function playToLose(g, maxSteps) {
  for (let i = 0; i < maxSteps; i++) {
    g.update(16);
    if (g.game.state !== 'playing') return i + 1;
  }
  return maxSteps;
}

(async () => {
  const { win, pageErrors } = makeDom();
  const g = win.__cfq;

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API',
    ['resetGame', 'thrust', 'update', 'draw', 'togglePause', 'toggleMute']
      .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game/planet state', !!g.game && !!g.game.state);
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.game.state, 'title', 'game boots on the title screen');

  console.log('\n--- logic: core action changes trajectory (1) ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame (the real restart handler) enters play');
  eq(g.game.lives, 3, 'a fresh run starts with 3 lives');
  eq(g.game.score, 0, 'a fresh run starts at score 0');
  eq(g.game.survived, 0, 'a fresh run starts at 0s survived');

  {
    const vx0 = g.planet.vx, vy0 = g.planet.vy;
    g.thrust();
    ok('thrust() changes the planet velocity immediately', g.planet.vx !== vx0 || g.planet.vy !== vy0);
  }

  console.log('\n--- logic: time and score progress under play (the check that catches soft-locks) ---');
  {
    const survived0 = g.game.survived;
    for (let i = 0; i < 100; i++) g.update(16);
    ok('game.survived advances over repeated update() calls', g.game.survived > survived0);
    ok('game.survived tracks roughly real elapsed time (100 * 16ms)',
      Math.abs(g.game.survived - 1.6) < 0.2);
    eq(g.game.state, 'playing', 'still playing after 100 frames of neutral play');
  }

  console.log('\n--- logic: three actions in a row, still advancing, still accepting input (2) ---');
  g.resetGame();
  {
    let allChanged = true;
    for (let i = 0; i < 3; i++) {
      const vx0 = g.planet.vx, vy0 = g.planet.vy;
      g.thrust();
      if (g.planet.vx === vx0 && g.planet.vy === vy0) allChanged = false;
      g.update(16);
    }
    ok('three consecutive thrusts each change velocity (input keeps being accepted)', allChanged);
    eq(g.game.state, 'playing', 'game is still playing after three thrusts in a row');
  }

  console.log('\n--- logic: winning the core loop (a competent player reaches the end) ---');
  g.resetGame();
  {
    const steps = playToWin(g, 4200);
    eq(g.game.state, 'won', 'a controller that thrusts near the inner edge survives to a win');
    ok('the win is reached at ~60s survived', g.game.survived >= 60 && g.game.survived < 61);
    ok('score accumulated meaningfully over the run', g.game.score > 0);
    ok('lives were preserved by competent play', g.game.lives === 3);
    ok('reaching the win did not require an implausible number of frames', steps < 4200);
  }

  console.log('\n--- logic: exhausting the fail condition reaches a real ending (3) ---');
  g.resetGame();
  {
    const steps = playToLose(g, 1500);
    eq(g.game.state, 'gameover', 'never thrusting eventually loses all 3 lives and ends the run');
    eq(g.game.lives, 0, 'gameover is reached with 0 lives left');
    ok('losing did not require an implausible number of frames', steps < 1500);
  }

  console.log('\n--- logic: restart from an ending is playable again (4) ---');
  {
    // still in 'gameover' from the block above
    g.resetGame();
    eq(g.game.state, 'playing', 'resetGame from gameover returns to playing');
    eq(g.game.lives, 3, 'lives are fully restored after restart');
    eq(g.game.score, 0, 'score resets to 0 after restart');
    eq(g.game.survived, 0, 'survived time resets to 0 after restart');
    const vx0 = g.planet.vx;
    g.thrust();
    ok('input is accepted immediately after restart', g.planet.vx !== vx0);
  }

  console.log('\n--- logic: restart from a WIN is also playable again ---');
  {
    g.resetGame();
    playToWin(g, 4200);
    eq(g.game.state, 'won', 'setup: reached won again');
    g.resetGame();
    eq(g.game.state, 'playing', 'resetGame from won returns to playing');
    eq(g.game.lives, 3, 'lives are fully restored after restarting from a win');
    eq(g.game.survived, 0, 'survived resets to 0 after restarting from a win');
  }

  console.log('\n--- logic: the real click path (not just the hook) drives both transitions ---');
  {
    const { win: win2 } = makeDom();
    const g2 = win2.__cfq;
    const canvas2 = win2.document.getElementById('game');
    eq(g2.game.state, 'title', 'fresh instance boots on title');
    canvas2.dispatchEvent(new win2.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    eq(g2.game.state, 'playing', 'a real mousedown on the canvas starts the run from title');
    playToLose(g2, 1500);
    eq(g2.game.state, 'gameover', 'setup: neglect run reaches gameover');
    canvas2.dispatchEvent(new win2.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    eq(g2.game.state, 'playing', 'a real mousedown on the canvas restarts from gameover');
    eq(g2.game.lives, 3, 'the click-driven restart also restores lives');
  }

  console.log('\n--- logic: the bonus path (debris deflect) advances, does not consume-and-freeze (5) ---');
  g.resetGame();
  {
    // Place a piece of debris directly on the planet -- this is a legitimate in-bounds
    // collision state a player reaches by drifting into debris, not a forced pairing.
    g.debris.push({ x: g.planet.x, y: g.planet.y, vx: 0, vy: 0, t: 0, word: 'test', r: 5, hit: false });
    const scoreBefore = g.game.score;
    g.update(16);
    ok('colliding with debris awards the deflect bonus', g.game.score >= scoreBefore + 8);
    ok('the debris is marked hit (consumed) rather than re-triggering', g.debris[0] && g.debris[0].hit === true);
    eq(g.game.state, 'playing', 'the game is still playing immediately after a deflect');
    const survivedBefore = g.game.survived;
    g.update(16); g.update(16);
    ok('play continues to advance after a deflect (not frozen)', g.game.survived > survivedBefore);
  }

  console.log('\n--- logic: pause is a hold, not a soft-lock ---');
  g.resetGame();
  {
    g.update(16);
    g.togglePause();
    eq(g.game.state, 'paused', 'togglePause pauses an in-progress run');
    const survivedPaused = g.game.survived;
    g.update(16); g.update(16);
    eq(g.game.survived, survivedPaused, 'time does not advance while paused (by design)');
    eq(g.game.state, 'paused', 'still paused after update() calls');
    g.togglePause();
    eq(g.game.state, 'playing', 'togglePause resumes play');
    const survivedResumed = g.game.survived;
    g.update(16); g.update(16);
    ok('time advances again after resuming (pause did not freeze the run)', g.game.survived > survivedResumed);
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
