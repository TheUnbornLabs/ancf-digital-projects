// jsdom Tier-2 playthrough suite for Leaf Fall (#98)
// Core loop: a leaf falls continuously from top to bottom; the player steers it
// laterally with the mouse against side wind gusts, trying to land it inside one of
// three calm zones at the bottom. Every fall (hit or miss, as long as the player still
// has lives) advances the round counter; missing a zone or drifting off-screen costs a
// life. 8 rounds to win, 3 lives before game over.
// Drives the game the way a real player does: dispatches real `mousemove` events at the
// canvas (after stubbing getBoundingClientRect, which jsdom returns as all-zero) so the
// game's own listener sets mx, exactly as it would from a browser. Direct state writes
// are used only where explicitly labelled FAST-FORWARD, to isolate transition logic from
// reachability (house style, see test_word-unscramble.js / test_firefly.js).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'leaf-fall', 'index.html');
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
const canvas = win.document.getElementById('game');
const W = 960, H = 540;

// jsdom's canvas has no real layout, so getBoundingClientRect is all zeros. Give it a
// real box matching the game's internal W/H so real mousemove math (eventX) works.
Object.defineProperty(canvas, 'getBoundingClientRect', {
  value: () => ({ left: 0, top: 0, width: W, height: H, right: W, bottom: H }),
  configurable: true
});
function moveMouse(x, y) {
  canvas.dispatchEvent(new win.MouseEvent('mousemove', { clientX: x, clientY: y == null ? 270 : y, bubbles: true }));
}
function tick(dt) { g.update(dt == null ? 16 : dt); }
// The real player-facing restart path is a click/tap on the canvas (onDown), which
// branches on game.state itself. Calling the hook's resetGame() directly would bypass
// that branch entirely and could not catch a guard bug in onDown (e.g. the real
// word-unscramble-class bug: the 'gameover' branch of that if-check going missing).
function clickCanvas(x, y) {
  canvas.dispatchEvent(new win.MouseEvent('mousedown', { clientX: x == null ? W / 2 : x, clientY: y == null ? H / 2 : y, bubbles: true }));
}

// Continuously steer toward the centre of an open (unhit) zone, correcting every frame
// exactly as a real player watching the leaf would. Returns once the round advances
// (a landing attempt resolved, hit or miss) or the game leaves 'playing'.
function fallAimingAtZone(maxTicks) {
  maxTicks = maxTicks || 4000;
  const startRound = g.game.round;
  for (let i = 0; i < maxTicks; i++) {
    if (g.game.state !== 'playing') return { advanced: false, ticks: i };
    const open = g.zones.filter(z => !z.hit);
    const tx = open.length ? (open[0].x + open[0].w / 2) : W / 2;
    moveMouse(tx, 500);
    tick(16);
    if (g.game.round !== startRound) return { advanced: true, ticks: i };
  }
  return { advanced: false, ticks: maxTicks, timeout: true };
}

// Continuously steer toward whichever on-screen x is farthest from every open zone's
// centre, to deliberately miss the landing (a real, if unskilled, way to lose a life)
// without drifting the leaf off-screen (which would be a different failure path).
function fallMissingZone(maxTicks) {
  maxTicks = maxTicks || 4000;
  const startRound = g.game.round;
  const startLives = g.game.lives;
  for (let i = 0; i < maxTicks; i++) {
    if (g.game.state !== 'playing') return { resolved: false, ticks: i };
    const open = g.zones.filter(z => !z.hit);
    let tx = W / 2;
    if (open.length) {
      const candidates = [60, W - 60, W / 2];
      let best = candidates[0], bestDist = -1;
      for (const c of candidates) {
        const d = Math.min(...open.map(z => Math.abs(c - (z.x + z.w / 2))));
        if (d > bestDist) { bestDist = d; best = c; }
      }
      tx = best;
    }
    moveMouse(tx, 500);
    tick(16);
    if (g.game.round !== startRound || g.game.lives !== startLives || g.game.state !== 'playing') {
      return { resolved: true, ticks: i, lostLife: g.game.lives < startLives, roundAdvanced: g.game.round !== startRound, state: g.game.state };
    }
  }
  return { resolved: false, ticks: maxTicks, timeout: true };
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.zones) && Array.isArray(g.gusts));
  ok('canvas element is present', !!canvas);
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.TOTAL, 8, 'collection declares 8 rounds');

  console.log('\n--- smoke: the real player entry point (click the title screen) ---');
  eq(g.game.state, 'title', 'the game loads straight into the title screen');
  clickCanvas();
  eq(g.game.state, 'playing', 'a real click on the title screen starts the round (onDown -> resetGame)');

  let drewOk = true;
  for (const st of ['title', 'playing', 'paused', 'won', 'gameover']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  ok('draw() runs in every state without throwing', drewOk);
  g.resetGame();

  /* ======================= CORE LOOP ======================= */
  console.log('\n--- core loop: real steering input advances the game ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame puts the game in the playing state');
  eq(g.game.round, 0, 'a fresh game starts at round 0');
  eq(g.game.lives, 3, 'a fresh game starts with 3 lives');
  eq(g.zones.length, 3, 'a round spawns 3 calm zones');

  const score0 = g.game.score;
  const lives0 = g.game.lives;
  const r1 = fallAimingAtZone();
  ok('steering with real mousemove input resolves the fall (round advances)', r1.advanced);
  eq(g.game.round, 1, 'landing/falling once advances the round counter to 1');
  ok('the game is still in a live state after one fall', g.game.state === 'playing' || g.game.state === 'won');
  ok('aiming at the zone centre scores without losing a life', g.game.score > score0 && g.game.lives === lives0);

  console.log('\n--- core loop: three falls in a row, still advancing, still accepting input ---');
  let threeOk = true;
  let lastRound = g.game.round;
  for (let i = 0; i < 3; i++) {
    if (g.game.state !== 'playing') { threeOk = false; break; }
    const r = fallAimingAtZone();
    if (!r.advanced || g.game.round <= lastRound) { threeOk = false; break; }
    lastRound = g.game.round;
  }
  ok('three consecutive real falls each advance the round, input stays live', threeOk);
  eq(g.game.round, 4, 'round counter reflects four resolved falls total');
  eq(g.game.state, 'playing', 'still playing after four rounds (well short of the 8-round win)');

  /* ======================= exhaust the fail condition ======================= */
  console.log('\n--- exhaust: repeatedly missing the zone drains lives to a real game over ---');
  g.resetGame();
  eq(g.game.lives, 3, 'lives reset to 3 on a fresh game');
  let missTicksTotal = 0, missRounds = 0;
  while (g.game.state === 'playing' && g.game.lives > 0 && missRounds < 20) {
    const r = fallMissingZone();
    missTicksTotal += r.ticks;
    missRounds++;
    if (!r.resolved) break;
  }
  console.log(`    missed ${missRounds} falls (${missTicksTotal} ticks), lives=${g.game.lives}, state=${g.game.state}`);
  eq(g.game.lives, 0, 'deliberately missing the zone every fall drains all 3 lives');
  await sleep(500); // endGameover's scheduled state='gameover' (400ms) must have fired by now
  eq(g.game.state, 'gameover', 'losing the last life reaches a real game-over screen');

  /* ======================= restart from that ending ======================= */
  console.log('\n--- restart from game over (via a real click, the actual player path) ---');
  eq(g.game.state, 'gameover', 'precondition: still on the game-over screen from the exhaust test above');
  clickCanvas();
  eq(g.game.state, 'playing', 'a real click on the game-over screen restarts the round (onDown -> resetGame)');
  eq(g.game.lives, 3, 'lives are restored on restart');
  eq(g.game.round, 0, 'round resets to the first on restart');
  eq(g.game.score, 0, 'score resets on restart');
  const restartFall = fallAimingAtZone();
  ok('input is genuinely accepted again after restarting from the game-over screen', restartFall.advanced);
  eq(g.game.round, 1, 'the restarted game actually advances on real input');

  /* ======================= win path ======================= */
  console.log('\n--- win path: clearing all 8 rounds reaches a real won screen ---');
  g.resetGame();
  let winOk = true, winRounds = 0;
  while (g.game.state === 'playing' && winRounds < 12) {
    const r = fallAimingAtZone();
    winRounds++;
    if (!r.advanced) { winOk = false; break; }
  }
  console.log(`    resolved ${winRounds} falls to reach state=${g.game.state}, round=${g.game.round}, lives=${g.game.lives}, score=${g.game.score}`);
  ok('aiming at the zone centre every fall keeps resolving without getting stuck', winOk);
  eq(g.game.state, 'won', 'clearing all 8 rounds (surviving without losing all lives) wins the game');
  ok('the best score is updated on a win', g.game.best >= g.game.score);
  eq(win.localStorage.getItem('leaffall_best_v1'), String(g.game.best), 'the best score is persisted to localStorage on a win');

  console.log('\n--- restart from won (via a real click, the actual player path) ---');
  eq(g.game.state, 'won', 'precondition: still on the won screen from the win-path test above');
  clickCanvas();
  eq(g.game.state, 'playing', 'a real click on the won screen restarts the round (onDown -> resetGame)');
  eq(g.game.round, 0, 'restarting after a win resets to round 0');
  eq(g.game.score, 0, 'restarting after a win resets the score');
  const wonRestartFall = fallAimingAtZone();
  ok('input is genuinely accepted again after restarting from the won screen', wonRestartFall.advanced);

  /* ======================= pause: no freeze, no consumption ======================= */
  console.log('\n--- pause/resume does not freeze the game ---');
  g.resetGame();
  fallAimingAtZone();
  const roundBeforePause = g.game.round;
  const scoreBeforePause = g.game.score;
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause enters the paused state');
  for (let i = 0; i < 120; i++) tick(16);
  eq(g.game.round, roundBeforePause, 'no round progress is made while paused');
  eq(g.game.score, scoreBeforePause, 'no score progress is made while paused');
  g.togglePause();
  eq(g.game.state, 'playing', 'togglePause resumes play');
  const resumedFall = fallAimingAtZone();
  ok('a real fall is still resolved and advances the round immediately after resuming', resumedFall.advanced);

  /* ======================= bonus/hazard path: a gust hit must not freeze play ======================= */
  console.log('\n--- gust hits (the hazard/bonus-adjacent mechanic) break streak but do not freeze play ---');
  g.resetGame();
  // Fly straight down the middle without steering toward any zone; over enough rounds a
  // gust will very likely clip the leaf (marking cleanRound=false / hitDone), which must
  // still let subsequent falls resolve normally rather than getting stuck.
  let sawGustHit = false;
  let gustRounds = 0;
  while (g.game.state === 'playing' && gustRounds < 20 && !sawGustHit) {
    const startRound = g.game.round;
    for (let i = 0; i < 4000 && g.game.round === startRound && g.game.state === 'playing'; i++) {
      moveMouse(W / 2, 500); // deliberately do not track the zone; just watch for a gust clip
      tick(16);
      if (g.leaf && g.leaf.cleanRound === false) sawGustHit = true;
    }
    gustRounds++;
  }
  if (sawGustHit) {
    ok('a gust clipped the leaf at some point during undirected play', sawGustHit);
    const afterGustFall = fallAimingAtZone();
    ok('after being clipped by a gust, the next real steering input still resolves a fall', afterGustFall.advanced);
    eq(g.game.state, 'playing', 'still playing (or won) after the gust-affected round resolves');
  } else {
    ok('SKIPPED gust-clip check (no gust happened to clip the undirected leaf within the sampling window)', true);
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
