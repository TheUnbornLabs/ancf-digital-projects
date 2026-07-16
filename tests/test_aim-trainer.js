// jsdom playthrough (Tier 2) suite for Aim Trainer (#75)
// Core loop: 30s timed round. Click GREEN circles (+score, streak bonus), avoid RED
// hexagons (-5, resets streak). No lives/lose-state — the only "ending" is the clock
// running out (state -> 'won'). Final 5s is a rapid-fire "boss wave".
// Drives the real loop through window.__cfq and asserts progression, not setup.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'aim-trainer', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }

// ---- canvas 2D context stub (jsdom has no real canvas backend) ----
const stub = el => new Proxy({}, {
  get(t, p) {
    if (p === 'measureText') return () => ({ width: 10 });
    if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop() {} });
    if (p === 'createRadialGradient') return () => ({ addColorStop() {} });
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
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;          // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Find the first not-yet-hit target of the given color in the live targets array.
function findTarget(green) {
  return g.targets.find(t => t.green === green && !t.hit);
}

// Spawn targets (deterministic rng, since resetGame(seed) below fixes the seed) until
// one of the requested color shows up, then click it dead-center (guaranteed hit).
// Returns the target that was clicked, or null if none appeared within the budget.
function spawnAndClick(green, budget) {
  for (let i = 0; i < (budget || 40); i++) {
    g.spawnTarget();
    const t = findTarget(green);
    if (t) { g.clickAt(t.x, t.y); return t; }
  }
  return null;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'spawnTarget', 'clickAt', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.targets));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.DURATION, 30000, 'round duration is 30s');
  ok('label pools are populated', g.GREEN_LABELS.length > 0 && g.RED_LABELS.length > 0);

  /* ======================= CORE LOOP: ADVANCE ======================= */
  console.log('\n--- logic: core action advances the game ---');
  g.resetGame(12345);   // fixed seed for a deterministic spawn sequence
  eq(g.game.state, 'playing', 'resetGame starts a round');
  eq(g.game.score, 0, 'resetGame starts score at 0');

  const t1 = spawnAndClick(true);
  ok('a green target could be spawned and clicked', !!t1);
  ok('clicking a green target advances the score', g.game.score > 0);
  eq(g.game.hits, 1, 'the hit counter advances');
  eq(g.game.streak, 1, 'the streak advances');
  const scoreAfter1 = g.game.score;

  /* ======================= THREE IN A ROW ======================= */
  console.log('\n--- logic: three in a row, still advancing, still accepting input ---');
  const t2 = spawnAndClick(true);
  ok('a second green target could be spawned and clicked', !!t2);
  ok('score keeps advancing on the 2nd hit', g.game.score > scoreAfter1);
  eq(g.game.hits, 2, 'hit counter keeps advancing (2)');
  eq(g.game.streak, 2, 'streak keeps advancing (2)');
  const scoreAfter2 = g.game.score;

  const t3 = spawnAndClick(true);
  ok('a third green target could be spawned and clicked', !!t3);
  ok('score keeps advancing on the 3rd hit', g.game.score > scoreAfter2);
  eq(g.game.hits, 3, 'hit counter keeps advancing (3)');
  eq(g.game.streak, 3, 'streak keeps advancing (3)');
  // streak of 3 crosses the combo-multiplier threshold (comboMult bumps every 3 streak)
  ok('a 3-streak awards a combo bonus (>10/hit average)', g.game.score > 30);

  // red distractor: costs points, resets streak, but the game keeps running (not a freeze)
  const tRed = spawnAndClick(false);
  ok('a red distractor could be spawned and clicked', !!tRed);
  eq(g.game.streak, 0, 'clicking red resets the streak');
  eq(g.game.misses, 1, 'the miss counter advances');
  // game must still accept input right after a miss (no soft-lock on penalty)
  const t4 = spawnAndClick(true);
  ok('input is still accepted immediately after a miss', !!t4);
  eq(g.game.hits, 4, 'hit counter still advances after a miss');

  /* ======================= EXHAUST THE FAIL CONDITION ======================= */
  console.log('\n--- logic: exhausting the round reaches a real ending ---');
  g.resetGame(999);
  eq(g.game.state, 'playing', 'fresh round is playing');
  // score at least one hit so this round's score exceeds the starting best (0) and
  // actually exercises the "new high score" save path, not just the no-op branch
  spawnAndClick(true, 80);
  let frames = 0;
  while (g.game.state === 'playing' && frames < 5000) { g.update(16); frames++; }
  eq(g.game.state, 'won', 'running the clock out reaches the won screen');
  ok('the round actually consumed close to the full 30s of elapsed time', g.game.elapsed >= 30000);
  ok('draw() does not throw on the won screen', (() => { try { g.draw(); return true; } catch (e) { return false; } })());
  ok('this round set a new best (score > 0 beat the starting best of 0)', g.game.score > 0 && g.game.best === g.game.score);
  const savedBest = win.localStorage.getItem('aimTrainerBest');
  ok('best score persists to localStorage', savedBest !== null && parseInt(savedBest, 10) === g.game.best);

  /* ======================= RESTART FROM THE ENDING ======================= */
  console.log('\n--- logic: restart from the ending is playable again ---');
  // This is exactly the production restart path: onDown() calls resetGame() bare
  // when game.state is 'won' (or 'title'). We call the same function it calls.
  const bestBeforeRestart = g.game.best;
  g.resetGame();
  eq(g.game.state, 'playing', 'restart from won returns to playing');
  eq(g.game.score, 0, 'restart resets score');
  eq(g.game.elapsed, 0, 'restart resets the clock');
  eq(g.game.hits, 0, 'restart resets hits');
  eq(g.game.streak, 0, 'restart resets streak');
  eq(g.targets.length, 0, 'restart clears the live targets');
  eq(g.game.best, bestBeforeRestart, 'the best score survives a restart');

  const tAfterRestart = spawnAndClick(true);
  ok('a green target can be spawned and clicked after restart', !!tAfterRestart);
  ok('score advances again after restart (not soft-locked)', g.game.score > 0);

  // second full lap: run this fresh round out to its own ending too
  frames = 0;
  while (g.game.state === 'playing' && frames < 5000) { g.update(16); frames++; }
  eq(g.game.state, 'won', 'a second full round also reaches its own ending');

  /* ======================= BOSS WAVE (the game's "power-up"-adjacent special mode) ======================= */
  console.log('\n--- logic: boss wave (final-5s rapid fire) still advances, does not freeze ---');
  g.resetGame(42);
  // fast-forward to just inside the boss window without crossing into 'won'
  while (g.game.elapsed < g.DURATION - 5000 + 200 && g.game.state === 'playing') g.update(16);
  ok('the round is still playing once the boss window starts', g.game.state === 'playing');
  const bossScoreBefore = g.game.score;
  const tBoss = spawnAndClick(true, 80);
  ok('a green target can still be spawned and clicked during the boss wave', !!tBoss);
  ok('clicking during the boss wave still advances the score', g.game.score > bossScoreBefore);
  // let the boss wave run out and confirm it still reaches a normal ending (no crash/freeze)
  frames = 0;
  while (g.game.state === 'playing' && frames < 2000) { g.update(16); frames++; }
  eq(g.game.state, 'won', 'the boss wave still ends in a normal won screen');

  /* ======================= PAUSE / RESUME (the game's only other mode toggle) ======================= */
  console.log('\n--- logic: pause does not freeze the round ---');
  g.resetGame(7);
  spawnAndClick(true);
  const scoreBeforePause = g.game.score;
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause pauses an active round');
  // time and spawns must not advance while paused (update() early-returns off 'playing')
  const elapsedAtPause = g.game.elapsed;
  for (let i = 0; i < 50; i++) g.update(16);
  eq(g.game.elapsed, elapsedAtPause, 'elapsed time is frozen while paused');
  g.togglePause();
  eq(g.game.state, 'playing', 'togglePause resumes the round');
  const tAfterResume = spawnAndClick(true);
  ok('input is accepted again after resuming from pause', !!tAfterResume);
  ok('score keeps advancing after a pause/resume cycle', g.game.score > scoreBeforePause);

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
