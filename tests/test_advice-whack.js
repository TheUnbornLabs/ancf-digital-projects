// jsdom test harness for Advice Whack (#13)
// Tier 2: can a competent player get from the start of this game to the end?
// Drives the real loop via window.__cfq plus real DOM events (mousedown/keydown)
// for the transitions the hook doesn't expose directly (title/roundover/gameover/shop clicks).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'advice-whack', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }

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
const canvas = win.document.getElementById('game');

// The game maps clientX/clientY through canvas.getBoundingClientRect(); jsdom returns all
// zeros for unrendered elements, which would divide-by-zero. Mock it 1:1 with the internal
// 960x540 canvas resolution so clientX/clientY == in-game px/py exactly.
canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 960, height: 540, right: 960, bottom: 540 });

function click(x, y) {
  const ev = new win.MouseEvent('mousedown', { clientX: x, clientY: y, bubbles: true });
  canvas.dispatchEvent(ev);
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
function key(code) {
  const ev = new win.KeyboardEvent('keydown', { code, bubbles: true });
  win.dispatchEvent(ev);
}
// Simulates exactly what the real rAF loop does for one frame, given the loop's own
// state gating: `if(state==='playing'||state==='boss') update(dt); else time+=dt; draw();`
function frame(dt) {
  if (g.game.state === 'playing' || g.game.state === 'boss') g.update(dt);
  g.draw();
}

// Build a synthetic mole with the exact shape spawnMole() produces, riseT=0 (fully risen
// per the hit-test geometry used at age=0), so tryHit(x,y) at the hole's raw position hits it.
function pushMole(holeIdx, isGood) {
  const h = g.HOLES[holeIdx];
  const mole = {
    holeIdx, text: isGood ? g.GOOD[0] : g.BAD[0], isGood, life: 1800, age: 0,
    popT: 0, hit: false, riseT: 0, hitsLeft: 1, mtype: 'normal',
    gaslightTimer: 0, gaslightDir: 0, squash: 1, scaleT: 0,
  };
  g.moles.push(mole);
  return h;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['tryHit', 'startRound', 'resetGame', 'update', 'draw', 'spawnMole']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state and content', !!g.game && Array.isArray(g.HOLES) && Array.isArray(g.BAD) && Array.isArray(g.GOOD));
  ok('canvas element is present', !!canvas);
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.HOLES.length, 12, '12 holes (4x3 grid)');

  console.log('\n--- smoke: title -> playing ---');
  eq(g.game.state, 'title', 'game boots into the title screen');
  click(480, 270);   // any click on the title screen starts the game (pointerDown: state==='title' -> resetGame())
  eq(g.game.state, 'playing', 'clicking the title screen starts the game');
  eq(g.game.round, 1, 'starts on round 1');
  eq(g.game.lives, 3, 'starts with 3 lives');
  eq(g.game.score, 0, 'starts with 0 score');

  console.log('\n--- logic: core action (the check that catches soft-locks) ---');
  g.resetGame();
  const score0 = g.game.score;
  const h1 = pushMole(0, false);
  g.tryHit(h1.x, h1.y);
  ok('whacking a bad bubble advances the score', g.game.score > score0);
  eq(g.game.combo, 1, 'whacking a bad bubble raises the combo');

  console.log('\n--- logic: do it three times running -> still advancing, still accepting input ---');
  let prevScore = g.game.score;
  let allAdvanced = true;
  for (let i = 1; i <= 3; i++) {
    const h = pushMole(i, false);
    g.tryHit(h.x, h.y);
    if (!(g.game.score > prevScore)) allAdvanced = false;
    prevScore = g.game.score;
  }
  ok('three consecutive whacks each advance the score', allAdvanced);
  eq(g.game.combo, 4, 'combo keeps climbing across consecutive hits (1 from before + 3 more)');

  console.log('\n--- logic: normal round-over transition (non-boss round) ---');
  g.resetGame();   // round 1; round+1=2 is not a boss round
  eq(g.game.round, 1, 'sanity: round 1');
  g.game.roundTimer = 1;
  frame(16);
  eq(g.game.state, 'roundover', 'letting the round timer run out ends a normal round');
  key('Enter');
  eq(g.game.state, 'playing', 'pressing Enter on round-over starts the next round');
  eq(g.game.round, 2, 'the round counter advances to round 2');

  console.log('\n--- logic: exhaust the fail condition -> a real ending is reached ---');
  g.resetGame();
  eq(g.game.lives, 3, 'sanity: 3 lives after reset');
  for (let i = 0; i < 3 && g.game.state === 'playing'; i++) {
    const h = pushMole(i, true);   // a "kind" green bubble — hitting it costs a life
    g.tryHit(h.x, h.y);
  }
  eq(g.game.lives, 0, 'three wrong (good-bubble) hits drain all three lives');
  eq(g.game.state, 'gameover', 'losing the last life reaches a real ending screen');

  console.log('\n--- logic: restart from that ending -> playable again ---');
  click(480, 270);
  eq(g.game.state, 'playing', 'clicking the game-over screen restarts the game');
  eq(g.game.lives, 3, 'lives are restored on restart');
  eq(g.game.score, 0, 'score is reset on restart');
  eq(g.game.round, 1, 'round counter is reset on restart');
  // and the core action still works after a restart
  const hR = pushMole(0, false);
  const scoreBefore = g.game.score;
  g.tryHit(hR.x, hR.y);
  ok('input is still accepted after a restart', g.game.score > scoreBefore);

  console.log('\n--- logic: power-up path (Focus Mode / slow time) advances rather than freezing ---');
  g.resetGame();
  g.game.slowCharges = 1;
  key('KeyF');
  eq(g.game.slowCharges, 0, 'activating Focus Mode spends the charge');
  const h5 = pushMole(0, false);
  const scoreBeforeSlow = g.game.score;
  frame(16);
  g.tryHit(h5.x, h5.y);
  ok('the game still accepts hits while slow-time is active', g.game.score > scoreBeforeSlow);
  for (let i = 0; i < 300 && g.game.state === 'playing'; i++) frame(16);
  ok('slow-time expires and the round keeps running (does not freeze in the slow state)',
    g.game.state === 'playing' || g.game.state === 'roundover');

  console.log('\n--- CRITICAL: shop -> boss-round transition ---');
  // Boss rounds occur when the NEXT round is a multiple of 5 (isBossRound). Finishing round 4
  // routes through the shop screen before the boss fight (index.html:450-454).
  g.resetGame();
  g.startRound(4);
  eq(g.game.round, 4, 'sanity: on round 4 (the round before the first boss round)');
  g.game.roundTimer = 1;
  frame(16);
  eq(g.game.state, 'shop', 'finishing round 4 routes to the shop before the boss fight');

  // draw() must run at least once in the shop state so the click-handler's button-rect
  // cache (shopButtons) is populated — exactly what the real per-frame draw() call does.
  g.draw();
  // Click the shop's "Continue ->" button (skx=420,sky=400,120x38 at 960x540 canvas res).
  click(480, 419);
  const stateRightAfterClick = g.game.state;
  ok('clicking Continue in the shop enters the boss fight', stateRightAfterClick === 'boss');

  // Now simulate exactly one more animation frame the way the real rAF loop would:
  // `if(state==='playing'||state==='boss') update(dt);` — update() is called because
  // state is 'boss'.
  frame(16);
  const stateAfterOneFrame = g.game.state;
  ok('THE BUG: the boss fight survives a single frame update',
    stateAfterOneFrame === 'boss');
  if (stateAfterOneFrame !== 'boss') {
    console.log(`    observed: state flipped from 'boss' back to '${stateAfterOneFrame}' after just one update(16) frame`);
    console.log(`    game.round is still ${g.game.round} (never incremented past 4), game.roundTimer is ${g.game.roundTimer}`);
  }

  // The boss must stay playable across a sustained run of real frames, not just one.
  let stableFrames = 0;
  for (let f = 0; f < 200; f++) { frame(16); if (g.game.state !== 'boss') break; stableFrames++; }
  ok(`the boss fight stays playable across 200 frames (survived ${stableFrames})`, stableFrames === 200);

  // The boss round must NOT end on the round clock — only bossDefeated() ends it.
  // This is the second path: startBoss() refreshing roundTimer alone would still
  // dump the player back to the shop here once the 60s boss clock expired.
  g.game.roundTimer = 1;
  frame(16); frame(16);
  eq(g.game.state, 'boss', 'the boss round ignores the round clock expiring (ends only via bossDefeated)');

  // And the boss is actually beatable: killing its HP must advance past round 4.
  g.game.bossHP = 1;
  const bm = g.moles.find(m => !m.isGood);
  if (bm) { bm.riseT = 1; bm.age = 300; const bh = g.HOLES[bm.holeIdx]; g.tryHit(bh.x, bh.y - 40); }
  eq(g.game.bossHP, 0, 'whacking the boss on its last HP drops it to zero');
  await sleep(900); // bossDefeated() defers state='roundover' by 600ms
  eq(g.game.state, 'roundover', 'defeating the boss reaches the round-over screen');
  click(480, 300);
  eq(g.game.state, 'playing', 'clicking through round-over starts the next round');
  eq(g.game.round, 5, 'the round counter advances past the boss to round 5');

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
