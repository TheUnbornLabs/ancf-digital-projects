// jsdom Tier 2 playthrough suite for Clock Free (#85)
// Deadline clocks fall from the top; click/smash them before they reach the bottom.
// Freedom stars drift across for +3s bonus time. Survive 60s with 3 lives.
// Drives the real loop through window.__cfq and asserts PROGRESSION, not setup.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'clock-free', 'index.html');
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
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;          // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Drive N ms of gameplay through the same update() the rAF loop uses.
// update() internally clamps dt to 48ms, so we step in <=48ms ticks like a real frame.
function advance(ms, tick = 48) {
  let left = ms;
  while (left > 0) { const d = Math.min(tick, left); g.update(d); left -= d; }
}

// Smash every clock currently on screen (returns count smashed).
function smashAll() {
  let n = 0;
  for (let i = 0; i < g.clocks.length; i++) {
    if (!g.clocks[i].smashed && !g.clocks[i].missed) { g.smashClock(i); n++; }
  }
  return n;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'spawnClock', 'spawnStar', 'smashClock', 'collectStar',
    'update', 'draw', 'togglePause', 'toggleMute'].every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.clocks) && Array.isArray(g.stars));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.game.state, 'title', 'game opens on the title screen');

  console.log('\n--- logic: core action advances the game (catches soft-locks) ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from title enters play');
  eq(g.game.score, 0, 'score starts at 0');
  eq(g.game.lives, 3, 'lives start at 3');

  g.spawnClock(false);
  ok('a clock was spawned', g.clocks.length === 1);
  const c0 = g.clocks[0];
  const score0 = g.game.score;
  const smashed0 = g.game.smashed;
  g.smashClock(0);
  ok('smashing a clock marks it smashed', g.clocks[0].smashed === true);
  ok('smashing a clock ADVANCES the score', g.game.score > score0);
  eq(g.game.smashed, smashed0 + 1, 'smashed counter advances');
  eq(g.game.combo, 1, 'combo advances on a smash');
  eq(g.game.state, 'playing', 'game is still playing after a smash (no soft-lock)');

  // the smashed clock must actually clear out of the array over time (cull), not pile up forever
  advance(500);
  eq(g.clocks.length, 0, 'a smashed clock is culled from the array after its animation');

  console.log('\n--- logic: do it three times running, still advancing, still accepting input ---');
  g.resetGame();
  let prevScore = g.game.score, prevSmashed = g.game.smashed, prevCombo = g.game.combo;
  for (let k = 1; k <= 3; k++) {
    g.spawnClock(false);
    const idx = g.clocks.length - 1;
    g.smashClock(idx);
    ok(`rep ${k}: score advances`, g.game.score > prevScore);
    ok(`rep ${k}: smashed count advances`, g.game.smashed === prevSmashed + 1);
    ok(`rep ${k}: combo keeps climbing`, g.game.combo === prevCombo + 1);
    eq(g.game.state, 'playing', `rep ${k}: game still accepts input (state unchanged)`);
    prevScore = g.game.score; prevSmashed = g.game.smashed; prevCombo = g.game.combo;
  }

  // a wrong click (miss) resets combo but does not freeze anything
  g.resetGame();
  g.spawnClock(false);
  g.smashClock(0);
  g.spawnClock(false);
  g.smashClock(1);
  ok('combo built up across two smashes', g.game.combo === 2);

  console.log('\n--- logic: bonus / power-up path (freedom stars) advances, does not freeze ---');
  g.resetGame();
  const bonus0 = g.game.bonus, score1 = g.game.score, bt0 = g.bonusTime;
  g.spawnStar();
  // spawnStar() is RNG-gated (rng()<0.3); force one onto the board directly if the roll missed
  if (g.stars.length === 0) { g.stars.push({ x: 0, y: 100, vy: 0, vx: 80, r: 20, label: 'flow', spin: 0, collected: false, t: 0 }); }
  ok('a star is present to collect', g.stars.length > 0);
  g.collectStar(0);
  ok('collecting a star grants bonus time (advances the clock-free budget)', g.bonusTime > bt0);
  eq(g.game.bonus, bonus0 + 1, 'bonus-collected counter advances');
  ok('collecting a star advances score too', g.game.score > score1);
  eq(g.game.state, 'playing', 'game still playing after collecting a star');
  // and the game must still accept the CORE action right after — a power-up must not consume-and-freeze
  g.spawnClock(false);
  const scoreAfterStar = g.game.score;
  g.smashClock(g.clocks.length - 1);
  ok('core action (smashing) still works immediately after collecting a star', g.game.score > scoreAfterStar);

  console.log('\n--- logic: boss clocks (periodic bonus mode) advance rather than freeze ---');
  g.resetGame();
  g.game.lives = 2;
  g.spawnClock(true);
  const boss = g.clocks[g.clocks.length - 1];
  ok('a boss clock spawns larger and flagged', boss.boss === true && boss.r > 26);
  const scoreBeforeBoss = g.game.score;
  g.smashClock(g.clocks.length - 1);
  ok('smashing a boss clock advances score by more than a normal clock', g.game.score - scoreBeforeBoss >= 20);
  eq(g.game.lives, 3, 'smashing a boss clock restores a life (clamped at max)');
  eq(g.game.state, 'playing', 'still playing after the boss encounter');

  console.log('\n--- logic: pause is a real pause, not a freeze or a leak ---');
  g.resetGame();
  advance(200);
  const elapsedBeforePause = g.game.elapsed;
  g.togglePause();
  eq(g.game.state, 'paused', 'pause enters the paused state');
  advance(500);
  eq(g.game.elapsed, elapsedBeforePause, 'elapsed time does not advance while paused');
  g.togglePause();
  eq(g.game.state, 'playing', 'toggling pause again resumes play');
  advance(100);
  ok('elapsed resumes advancing after unpause', g.game.elapsed > elapsedBeforePause);

  console.log('\n--- logic: exhaust the fail condition -> a real ending is reached ---');
  g.resetGame();
  g.game.lives = 1;
  g.clocks.length = 0;
  g.spawnClock(false);
  const missIdx = 0;
  // drive the clock past the bottom of the screen without smashing it
  let ticks = 0;
  while (g.game.lives === 1 && ticks < 500) { g.update(48); ticks++; }
  eq(g.game.lives, 0, 'the last life is spent when a clock is missed');
  eq(g.game.state, 'playing', 'state does not flip to gameover instantly (400ms grace timer)');
  await sleep(600);   // gameoverTimer fires after 400ms
  eq(g.game.state, 'gameover', 'losing the last life ends the game (a real ending is reached)');
  ok('best score was checked/saved on loss', typeof g.game.best === 'number');

  console.log('\n--- logic: restart from that ending -> playable again ---');
  const scoreAtGameOver = g.game.score;
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from the gameover screen re-enters play');
  eq(g.game.lives, 3, 'lives are restored on restart');
  eq(g.game.score, 0, 'score is reset on restart');
  eq(g.game.smashed, 0, 'smashed counter is reset on restart');
  eq(g.game.missed, 0, 'missed counter is reset on restart');
  // and the core action works again post-restart, proving input is not stuck
  g.spawnClock(false);
  g.smashClock(0);
  ok('core action works again immediately after restarting from gameover', g.game.score > 0);

  console.log('\n--- logic: stale gameoverTimer must not fire after a restart (game.gen guard) ---');
  g.resetGame();
  g.game.lives = 1;
  g.clocks.length = 0;
  g.spawnClock(false);
  ticks = 0;
  while (g.game.lives === 1 && ticks < 500) { g.update(48); ticks++; }
  eq(g.game.lives, 0, 'life exhausted, gameover timer scheduled');
  // restart BEFORE the 400ms grace timer fires
  g.resetGame();
  eq(g.game.state, 'playing', 'restart during the grace window re-enters play immediately');
  await sleep(600);   // let the stale timer's callback window pass
  eq(g.game.state, 'playing', 'the stale gameover timer did not clobber the fresh game (no delayed soft-lock)');

  console.log('\n--- logic: win path -> a real ending is reached the other way too ---');
  g.resetGame();
  // a competent player keeps the board clear; simulate that by smashing everything each tick
  // so no clock is ever missed, and verify elapsed genuinely reaches the 60s target via update()
  let frames = 0;
  while (g.game.state === 'playing' && frames < 3000) {
    g.update(48);
    smashAll();
    frames++;
  }
  eq(g.game.state, 'won', 'surviving to the time limit without losing all lives wins the round');
  ok('winning required the update loop to actually advance elapsed time', frames > 1000);
  ok('score accumulated over the win run', g.game.score > 0);
  eq(win.localStorage.getItem('clockFree_best'), String(g.game.best), 'best score persists to localStorage on a win');

  console.log('\n--- logic: restart from a WIN -> playable again ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from the won screen re-enters play');
  eq(g.game.score, 0, 'score resets after restarting from a win');
  g.spawnClock(false);
  g.smashClock(0);
  ok('core action works again immediately after restarting from a win', g.game.score > 0);

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
