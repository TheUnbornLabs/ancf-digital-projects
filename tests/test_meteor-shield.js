// jsdom Tier 2 (playthrough) suite for Meteor Shield (#70)
// Core loop: click/tap a falling pressure meteor to destroy it before it reaches the
// central peace orb. 3 lives, 60-second survival. No skip/hint items; the "bonus" path
// tested here is the combo multiplier and the periodic telegraphed "pressure wave".
//
// This does NOT re-check Tier 1 concerns (load errors, NaN, draw crashes) which already
// pass. It asserts PROGRESSION: does destroying a meteor actually advance the game, three
// times running, through to a real ending, and back out again.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'meteor-shield', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }

// ---- canvas 2D context stub (jsdom returns null for getContext('2d')) ----
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

// A meteor placed exactly at the orb centre with r=20 is guaranteed to be hit-testable
// by destroyAt (distance 0 < r+8) and, if left alone, guaranteed to collide with the orb
// on the very next update() (distance 0 < ORB_R + r). Used to force outcomes deterministically
// instead of hoping RNG spawn positions cooperate.
function plantMeteor(overrides) {
  const m = Object.assign({ x: g.CX, y: g.CY, vx: 0, vy: 0, r: 20, label: 'conform', exploding: false, explT: 0, spawnDist: 0 }, overrides || {});
  g.meteors.push(m);
  return m;
}

(async () => {

  console.log('\n--- prerequisites ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'spawnMeteor', 'destroyAt', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state and entity arrays', !!g.game && Array.isArray(g.meteors) && Array.isArray(g.particles));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  console.log('\n--- core loop: destroying a meteor advances the game ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame() starts a playing round');
  eq(g.game.score, 0, 'resetGame() clears score');
  eq(g.game.lives, 3, 'resetGame() restores 3 lives');

  const m1 = plantMeteor({ x: 400, y: 300 });
  const scoreBefore = g.game.score;
  g.destroyAt(m1.x, m1.y);
  ok('a hit meteor is flagged exploding, not left alive', m1.exploding === true);
  ok('destroying a meteor advances the score', g.game.score > scoreBefore);
  eq(g.game.combo, 1, 'the first destroy in a session starts a combo of 1');

  // let the explosion finish and confirm the entity is actually cleared (no zombie entities)
  for (let i = 0; i < 25; i++) g.update(16);
  ok('the exploded meteor is removed from the array once its animation finishes',
    !g.meteors.includes(m1));

  console.log('\n--- do it three times running: still advancing, still accepting input ---');
  let lastScore = g.game.score;
  let allAdvanced = true;
  for (let i = 0; i < 3; i++) {
    const m = plantMeteor({ x: 450 + i, y: 250 });
    g.destroyAt(m.x, m.y);
    if (!(m.exploding === true && g.game.score > lastScore)) allAdvanced = false;
    lastScore = g.game.score;
    for (let j = 0; j < 25; j++) g.update(16);
  }
  ok('three consecutive destroys each advance state and score, no soft-lock', allAdvanced);
  eq(g.game.state, 'playing', 'still playing after three consecutive destroys');

  console.log('\n--- combo / bonus path: chaining does not consume-and-freeze ---');
  g.resetGame();
  const combos = [];
  for (let i = 0; i < 4; i++) {
    const m = plantMeteor({ x: 500 + i, y: 200 });
    g.destroyAt(m.x, m.y);            // no update() between hits -> stays inside the 1200ms combo window
    combos.push(g.game.combo);
  }
  ok('combo climbs with rapid consecutive destroys', combos.join(',') === '1,2,3,4');
  const preMultScore = g.game.score;
  const m5 = plantMeteor({ x: 505, y: 200 });
  g.destroyAt(m5.x, m5.y);
  ok('once the combo multiplier kicks in, destroys still register (not stuck consuming for free)',
    g.game.score > preMultScore && g.game.combo === 5);

  // a miss resets the combo but must not freeze subsequent input
  g.destroyAt(9999, 9999);   // whiff: empty space
  eq(g.game.combo, 0, 'a miss resets the combo');
  const m6 = plantMeteor({ x: 300, y: 300 });
  const scorePreM6 = g.game.score;
  g.destroyAt(m6.x, m6.y);
  ok('input after a whiff is still accepted', m6.exploding === true && g.game.score > scorePreM6);

  console.log('\n--- pressure wave (telegraphed bonus event) advances rather than freezing ---');
  g.resetGame();
  const meteorsBeforeWave = g.meteors.length;
  g.game.waveTimer = 14999;             // one update tick from crossing the 15000ms threshold
  g.update(48);
  ok('the wave timer threshold arms the telegraph window', g.game.waveWarnT > 0);
  let waveFired = false;
  for (let i = 0; i < 40 && !waveFired; i++) {
    g.update(48);
    if (g.game.waveWarnT === 0) waveFired = true;
  }
  ok('the telegraphed pressure wave actually fires', waveFired);
  ok('the wave spawns extra meteors rather than locking the board',
    g.meteors.length > meteorsBeforeWave);
  ok('game is still in playing state after a wave, not stuck', g.game.state === 'playing');
  // and the player can still act on the new meteors
  const waveTarget = g.meteors.find(mm => !mm.exploding);
  if (waveTarget) {
    const s0 = g.game.score;
    g.destroyAt(waveTarget.x, waveTarget.y);
    ok('meteors spawned by a pressure wave are destroyable like any other', g.game.score > s0);
  } else {
    ok('SKIPPED wave-target destroy check (no non-exploding meteor present)', true);
  }

  console.log('\n--- exhausting the fail condition reaches a real ending ---');
  g.resetGame();
  eq(g.game.lives, 3, 'fresh round has 3 lives');
  let hitCount = 0;
  for (let i = 0; i < 3 && g.game.state === 'playing'; i++) {
    plantMeteor();               // sits exactly on the orb -> guaranteed collision next update
    const livesBefore = g.game.lives;
    g.update(16);
    if (g.game.lives < livesBefore) hitCount++;
  }
  eq(hitCount, 3, 'three orb collisions actually cost three lives');
  eq(g.game.lives, 0, 'lives are exhausted');
  eq(g.game.state, 'gameover', 'losing the last life reaches a real gameover ending');

  console.log('\n--- restart from gameover is playable again ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame() from gameover returns to playing');
  eq(g.game.lives, 3, 'lives are restored after restarting from gameover');
  eq(g.game.score, 0, 'score is reset after restarting from gameover');
  const mAfterRestart = plantMeteor({ x: 350, y: 350 });
  g.destroyAt(mAfterRestart.x, mAfterRestart.y);
  ok('input is accepted immediately after restarting from gameover', mAfterRestart.exploding === true);

  console.log('\n--- the win path: surviving the full 60s reaches a real ending ---');
  g.resetGame();
  // Clear meteors after every tick so none reach the orb; isolates "does survived-time
  // progression actually reach the win state" from the (separately-tested) destroy mechanic.
  let ticks = 0;
  const maxTicks = 1400;   // 1400 * 48ms = 67.2s of simulated time, comfortably past the 60s target
  while (g.game.state === 'playing' && ticks < maxTicks) {
    g.update(48);
    g.meteors.length = 0;
    ticks++;
  }
  eq(g.game.state, 'won', 'surviving 60 seconds reaches the won ending');
  ok('the win was reached in a bounded number of ticks (progression actually happened)', ticks < maxTicks);

  console.log('\n--- restart from won is playable again ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame() from won returns to playing');
  eq(g.game.lives, 3, 'lives are restored after restarting from a win');
  const mAfterWin = plantMeteor({ x: 320, y: 320 });
  g.destroyAt(mAfterWin.x, mAfterWin.y);
  ok('input is accepted immediately after restarting from a win', mAfterWin.exploding === true);
  ok('the game is still advancing after the full reset/win/reset cycle (no cumulative freeze)',
    g.game.score > 0);

  console.log('\n--- best-score persistence across the ending (sanity, not a soft-lock check) ---');
  g.resetGame();
  g.game.score = 12345;
  g.game.lives = 1;
  plantMeteor();
  g.update(16);
  eq(g.game.state, 'gameover', 'forcing the last collision still ends the round cleanly');
  eq(win.localStorage.getItem('meteorShield_best'), '12345', 'a new high score is persisted on ending');

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
