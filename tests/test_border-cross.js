// jsdom Tier 2 playthrough suite for Border Cross (#86)
// Frogger-style: move up 5 lanes of traffic to reach the goal, 10 levels, 3 lives.
// Drives the real loop via window.__cfq: tryMove (core action), update (physics/collision),
// resetGame (the game's own restart handler, same one onDown() calls from title/won/gameover).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'border-cross', 'index.html');
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
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Move the player one full lane-step toward the goal (up) and let any transition settle.
async function crossOneLane() {
  g.tryMove(0, -(g.LANE_H + 8));
}

// Force a collision on this frame regardless of where traffic actually is:
// place a stationary hazard exactly on the player and step the simulation once.
// This is the direct, deterministic way to exhaust lives without depending on
// traffic RNG/timing, and it exercises the real collision branch in update().
function forceCollision() {
  const p = g.player;
  g.game.invulnT = 0;              // bypass the post-respawn grace window ourselves
  g.traffic.length = 0;
  g.traffic.push({ x: p.x, y: p.y, vx: 0, w: 200, h: 200, label: 'x', col: 'x' });
  g.update(16);
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildLevel', 'tryMove', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game/player/traffic state', !!g.game && Array.isArray(g.traffic));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.LANES, 5, 'five lanes');
  eq(g.TOTAL, 10, 'ten levels');

  const STEP = g.LANE_H + 8;

  console.log('\n--- logic: setup ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts playing');
  eq(g.game.round, 0, 'resetGame starts at round 0');
  eq(g.game.lives, 3, 'resetGame restores full lives');
  eq(g.game.score, 0, 'resetGame resets score');
  ok('player exists after reset', !!g.player);

  console.log('\n--- logic: core action advances (catches soft-locks) ---');
  g.resetGame();
  const y0 = g.player.y;
  const score0 = g.game.score;
  g.tryMove(0, -STEP);
  ok('moving toward the goal moves the player (y decreases)', g.player.y < y0);
  ok('crossing a lane boundary awards a point', g.game.score > score0);
  eq(g.game.state, 'playing', 'still playing after one lane crossed');

  console.log('\n--- logic: three lane-crossings in a row keep advancing ---');
  g.resetGame();
  let prevY = g.player.y, prevScore = g.game.score, advancedAll = true;
  for (let i = 0; i < 3; i++) {
    g.tryMove(0, -STEP);
    if (!(g.player.y < prevY) || !(g.game.score > prevScore)) advancedAll = false;
    prevY = g.player.y; prevScore = g.game.score;
  }
  ok('three consecutive moves each advance position and score', advancedAll);
  eq(g.game.state, 'playing', 'input still accepted after three moves');

  console.log('\n--- logic: reaching the goal advances a level ---');
  g.resetGame();
  const round0 = g.game.round;
  const stepsToGoal = Math.ceil((g.player.y - 30) / STEP) + 1;  // SAFE_Y -> goal needs 7 steps, not LANES+1
  for (let i = 0; i < stepsToGoal; i++) g.tryMove(0, -STEP);
  eq(g.game.state, 'transition', 'reaching the far side locks input during the level-change delay');
  await sleep(500);   // the scheduled round-advance (400ms) must have fired by now
  ok('the round counter advanced', g.game.round === round0 + 1);
  eq(g.game.state, 'playing', 'the new level is playable (no soft-lock after crossing)');
  ok('a fresh player/traffic exist for the new level', !!g.player && g.traffic.length > 0);

  console.log('\n--- logic: three level-clears in a row (repeated core loop) ---');
  g.resetGame();
  let roundsCleared = 0, stuck = false;
  for (let lvl = 0; lvl < 3 && !stuck; lvl++) {
    const before = g.game.round;
    for (let i = 0; i < stepsToGoal; i++) g.tryMove(0, -STEP);
    if (g.game.state !== 'transition') { stuck = true; break; }
    await sleep(500);
    if (g.game.round !== before + 1 || g.game.state !== 'playing') { stuck = true; break; }
    roundsCleared++;
  }
  ok('three levels cleared back-to-back, still accepting input each time', roundsCleared === 3 && !stuck);

  console.log('\n--- logic: dash (double-tap) mechanic advances, does not freeze ---');
  g.resetGame();
  const yBeforeDash = g.player.y;
  const now0 = win.performance.now();
  win.document.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'ArrowUp' }));
  win.document.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'ArrowUp' }));
  // two ArrowUp within 260ms should register as a dash (2 steps) per the double-tap handler
  ok('a quick double-tap moves the player (dash or two single steps both count as progress)', g.player.y < yBeforeDash);
  eq(g.game.state, 'playing', 'game still playable immediately after a dash attempt');
  // whatever happened, the game must still accept a further plain move afterward
  const yAfterDash = g.player.y;
  g.tryMove(0, -STEP);
  ok('input keeps being accepted the frame after a dash attempt (no freeze)', g.player.y < yAfterDash);

  console.log('\n--- logic: pause/resume does not freeze the game ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'playing before pause');
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause pauses');
  g.togglePause();
  eq(g.game.state, 'playing', 'togglePause resumes back to playing');
  const yBeforeMove = g.player.y;
  g.tryMove(0, -STEP);
  ok('movement works again after a pause/resume cycle', g.player.y < yBeforeMove);

  console.log('\n--- logic: exhausting lives reaches a real game-over ---');
  g.resetGame();
  eq(g.game.lives, 3, 'starts with 3 lives');
  forceCollision();
  eq(g.game.lives, 2, 'first forced collision costs a life');
  eq(g.game.state, 'playing', 'still playing with lives remaining');
  forceCollision();
  eq(g.game.lives, 1, 'second forced collision costs another life');
  eq(g.game.state, 'playing', 'still playing with one life remaining');
  forceCollision();
  eq(g.game.lives, 0, 'third forced collision exhausts lives');
  await sleep(500);   // the scheduled gameover (400ms) must have fired by now
  eq(g.game.state, 'gameover', 'losing the last life reaches a real game-over screen');

  console.log('\n--- logic: restart from game-over is playable again ---');
  g.resetGame();   // this is exactly what onDown() calls when state is 'gameover'
  eq(g.game.state, 'playing', 'a round can be started again after a game over');
  eq(g.game.lives, 3, 'lives are restored on restart');
  eq(g.game.round, 0, 'round counter resets on restart');
  const yPostRestart = g.player.y;
  g.tryMove(0, -STEP);
  ok('movement is accepted again after restarting from game-over', g.player.y < yPostRestart);

  console.log('\n--- logic: clearing all 10 levels reaches a real win, then restart works ---');
  g.resetGame();
  let wonOk = true;
  for (let lvl = 0; lvl < g.TOTAL && wonOk; lvl++) {
    for (let i = 0; i < stepsToGoal; i++) g.tryMove(0, -STEP);
    if (g.game.state !== 'transition') { wonOk = false; break; }
    await sleep(500);
  }
  ok('progressed through all levels without getting stuck', wonOk);
  eq(g.game.state, 'won', 'clearing all 10 levels reaches the win screen');

  g.resetGame();   // exactly what onDown() calls when state is 'won'
  eq(g.game.state, 'playing', 'a round can be started again after winning');
  eq(g.game.round, 0, 'round resets after a post-win restart');
  const yPostWinRestart = g.player.y;
  g.tryMove(0, -STEP);
  ok('movement is accepted again after restarting from the win screen', g.player.y < yPostWinRestart);

  console.log('\n--- logic: best score persists (sanity, not the focus of this suite) ---');
  ok('best score is a non-negative number after play', typeof g.game.best === 'number' && g.game.best >= 0);

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
