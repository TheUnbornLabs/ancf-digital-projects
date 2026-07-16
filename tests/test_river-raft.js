// jsdom Tier 2 playthrough suite for River Raft (#96)
// Tier 1 (audit.js) already passes this game clean: no load errors, no NaN, no draw
// crashes, restart-after-finish works structurally. This suite drives the REAL loop
// (steering, obstacles, stage advance, lives, win/lose) through window.__cfq and checks
// PROGRESSION over multiple steps, not one-shot setup facts.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'river-raft', 'index.html');
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
    w.requestAnimationFrame = () => 0;   // disable the auto rAF loop; we drive update() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Push a fake obstacle that overlaps the raft's current position so the next update()
// registers a real collision through the game's own collision code (same fields
// spawnObs() would produce). Reads g.obstacles / g.raft fresh each call so it survives
// buildStage() reassigning the module-level `obstacles` array to a new object.
function collideRaft(isLily) {
  const raft = g.raft;
  g.obstacles.push({ x: raft.x, y: raft.y, r: 10, vy: 0, lily: !!isLily, label: 'test', hit: false, passed: false });
}

// Let the post-hit invulnerability window fully decay by pumping real frames (dt is
// clamped to 48ms inside update(), so this is many small steps, not a big jump).
function pumpFrames(n, dt) { for (let i = 0; i < n; i++) g.update(dt || 48); }

(async () => {

  /* ======================= SMOKE (hook wiring only; Tier 1 owns load/draw/NaN) ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildStage', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game/raft/obstacles state', !!g.game && !!g.input);
  ok('hook exposes stage constants', g.TOTAL === 10 && g.DIST_PER_STAGE === 3000);
  ok('no uncaught page errors on load', pageErrors.length === 0);

  /* ======================= CORE LOOP: does the game ADVANCE? ======================= */
  console.log('\n--- core loop: real drive through stage 1 ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts the game playing');
  eq(g.game.round, 0, 'resetGame starts at round 0');
  eq(g.game.dist, 0, 'resetGame starts at distance 0');
  const riverW0 = g.riverRight() - g.riverLeft();

  // Drive real frames, clearing obstacles each tick so a "competent player" outcome
  // (no random collision) isolates the thing under test: does surviving time actually
  // move the game forward? This exercises update()'s real dist/spawn/stage-advance code,
  // not a forced field assignment.
  let ticks = 0;
  while (g.game.round === 0 && ticks < 5000) {
    g.update(48);
    g.obstacles.length = 0; // a perfect dodge of everything spawned this tick
    ticks++;
  }
  ok('surviving drives the round from 0 to 1 within a bounded number of frames', g.game.round === 1);
  eq(g.game.state, 'playing', 'still playing after the first stage clears');
  ok('score is credited for clearing a stage', g.game.score >= 50);
  const riverW1 = g.riverRight() - g.riverLeft();
  ok('the river narrows on the next stage (difficulty ramps)', riverW1 < riverW0);

  console.log('\n--- core loop: three stage-advances in a row, still accepting input ---');
  for (let i = 0; i < 3; i++) {
    const roundBefore = g.game.round;
    g.game.dist = g.DIST_PER_STAGE; // one step from the threshold this frame will cross
    g.update(48);
    ok(`stage-advance ${i + 1}/3 moves the round forward`, g.game.round === roundBefore + 1);
    eq(g.game.state, 'playing', `still playing after stage-advance ${i + 1}/3`);
    // still accepting input: steering must actually move the raft on the new stage
    const vxBefore = g.raft.vx;
    g.input.left = true;
    g.update(48);
    g.input.left = false;
    ok(`input is still accepted after stage-advance ${i + 1}/3`, g.raft.vx !== vxBefore);
  }

  /* ======================= BONUS MECHANIC: lily pickups don't freeze the loop ======================= */
  console.log('\n--- bonus mechanic: lily pickups advance rather than freeze ---');
  g.resetGame();
  let lastScore = g.game.score;
  for (let i = 0; i < 3; i++) {
    collideRaft(true); // a lily overlapping the raft
    g.update(16);
    ok(`lily pickup ${i + 1}/3 raises the score`, g.game.score > lastScore);
    lastScore = g.game.score;
    eq(g.game.state, 'playing', `still playing after lily pickup ${i + 1}/3`);
    const vxBefore = g.raft.vx;
    g.input.right = true;
    g.update(16);
    g.input.right = false;
    ok(`input is still accepted after lily pickup ${i + 1}/3`, g.raft.vx !== vxBefore);
  }
  ok('collecting lilies back-to-back builds a streak', g.game.streak >= 3);

  /* ======================= FAIL CONDITION: exhaust lives -> real ending ======================= */
  console.log('\n--- exhausting the fail condition ---');
  g.resetGame();
  eq(g.game.lives, 3, 'a fresh game starts with 3 lives');
  pumpFrames(20); // let the post-buildStage spawn-in invulnerability (600ms) fully decay

  collideRaft(false);
  g.update(16);
  eq(g.game.lives, 2, 'a rock collision costs a life');
  pumpFrames(30); // let the post-hit invulnerability (1200ms) decay before the next hit

  collideRaft(false);
  g.update(16);
  eq(g.game.lives, 1, 'a second rock collision costs another life');
  pumpFrames(30);

  collideRaft(false);
  g.update(16);
  eq(g.game.lives, 0, 'the last life is spent');
  eq(g.game.state, 'playing', 'state does not flip to gameover synchronously (it is scheduled)');
  await sleep(500); // the game's own setTimeout(...,400) must have fired by now
  eq(g.game.state, 'gameover', 'losing the last life reaches a real gameover ending');

  /* ======================= RESTART FROM GAMEOVER ======================= */
  console.log('\n--- restart from gameover ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'the game can be restarted after gameover');
  eq(g.game.lives, 3, 'restarting restores full lives');
  eq(g.game.round, 0, 'restarting resets the round');
  eq(g.game.score, 0, 'restarting resets the score');
  // and it is not a one-shot fluke: driving after restart still advances
  collideRaft(true);
  g.update(16);
  ok('the restarted game still responds to play (lily scores)', g.game.score > 0);

  /* ======================= WIN PATH: clearing all TOTAL rivers ======================= */
  console.log('\n--- win path: clearing every river ---');
  g.resetGame();
  g.game.score = 12345; // above whatever best currently is, to exercise the save-best path
  g.game.round = g.TOTAL - 1;
  g.game.dist = g.DIST_PER_STAGE;
  g.update(16);
  eq(g.game.state, 'won', 'clearing the final river reaches a real won ending');
  eq(win.localStorage.getItem('cfq_river_raft_best'), String(g.game.score), 'a new best score is saved to localStorage on win');

  /* ======================= RESTART FROM WON ======================= */
  console.log('\n--- restart from won ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'the game can be restarted after winning');
  eq(g.game.round, 0, 'restarting after a win resets the round');
  eq(g.game.lives, 3, 'restarting after a win restores full lives');
  collideRaft(true);
  g.update(16);
  ok('the restarted game still responds to play after a win (lily scores)', g.game.score > 0);

  /* ======================= PAUSE: reversible, not a soft-lock ======================= */
  console.log('\n--- pause does not freeze the game permanently ---');
  g.resetGame();
  pumpFrames(5);
  g.togglePause();
  ok('togglePause sets paused', g.game.paused === true);
  const distPaused = g.game.dist;
  g.update(48); g.update(48);
  eq(g.game.dist, distPaused, 'distance does not advance while paused');
  g.togglePause();
  ok('togglePause resumes', g.game.paused === false);
  g.update(48);
  ok('distance advances again after unpausing', g.game.dist > distPaused);

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
