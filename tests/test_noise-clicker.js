// jsdom test harness for Noise Clicker (#20)
// Tier 2 playthrough: idle clicker. Click bubbles -> hours/total accrue ->
// buy upgrades -> auto-click accrues too -> reach WIN_TARGET lifetime total ->
// 'won' screen -> click to restart. Drives the real loop via window.__cfq.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'noise-clicker', 'index.html');
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
  url: 'http://localhost/',           // real localStorage, like the game uses for saves
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

// Click a live (non-dying) bubble by manual action (mirrors what pointerDown->hitBubble does).
function clickABubble() {
  const b = g.bubbles.find(b => !b.dying);
  if (!b) return null;
  g.silenceBubble(b, false);
  return b;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'spawnBubble', 'silenceBubble', 'hitBubble',
    'buyUpgrade', 'calcPerSec', 'update', 'draw', 'upgradeCost', 'allMaxed', 'doPrestige']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.UPGRADES));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.game.state, 'title', 'game boots on the title screen');

  // clear any leftover localStorage from a previous run of this same test process
  win.localStorage.clear();

  console.log('\n--- logic: starting a round ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame moves to playing');
  eq(g.game.hours, 0, 'resetGame zeroes hours');
  eq(g.game.total, 0, 'resetGame zeroes lifetime total');
  ok('resetGame spawns starting bubbles', g.bubbles.length >= 5);

  console.log('\n--- logic: the core loop advances (catches soft-locks) ---');
  const b0 = clickABubble();
  ok('a bubble was available to click', !!b0);
  ok('silencing a bubble marks it dying', b0.dying === true);
  ok('silencing a bubble raises hours', g.game.hours > 0);
  ok('silencing a bubble raises the lifetime total', g.game.total > 0);
  const hoursAfter1 = g.game.hours, totalAfter1 = g.game.total;

  console.log('\n--- logic: do it three times running -> still advancing ---');
  const b1 = clickABubble();
  ok('a second bubble was available', !!b1);
  ok('a second click keeps raising hours', g.game.hours > hoursAfter1);
  const hoursAfter2 = g.game.hours;

  const b2 = clickABubble();
  ok('a third bubble was available', !!b2);
  ok('a third click keeps raising hours', g.game.hours > hoursAfter2);
  ok('three clicks silenced three distinct bubbles', new Set([b0, b1, b2]).size === 3);
  ok('the game is still in playing state after repeated input', g.game.state === 'playing');

  // let update() run the dying bubbles to completion and spawn replacements,
  // proving update()/draw() tolerate a live in-progress session
  let tickOk = true;
  try { for (let i = 0; i < 60; i++) { g.update(16); g.draw(); } }
  catch (e) { tickOk = false; console.log('    update/draw threw: ' + e.message); }
  ok('update() and draw() tolerate a running session', tickOk);
  ok('dying bubbles are eventually removed by update()', g.bubbles.every(b => !b.dying) || g.bubbles.length < 30);

  console.log('\n--- logic: upgrade / auto-click path advances rather than freezing ---');
  g.resetGame();
  win.localStorage.clear();
  g.resetGame();
  const cost0 = g.upgradeCost(g.UPGRADES[0]);
  g.game.hours = cost0 + 5;
  const boughtBefore = g.UPGRADES[0].bought;
  g.buyUpgrade(0);
  eq(g.UPGRADES[0].bought, boughtBefore + 1, 'buying an upgrade spends hours and increments it');
  ok('hours were actually deducted', g.game.hours < cost0 + 5);
  ok('perSec becomes positive after buying an auto-clicker', g.game.perSec > 0);

  const totalBeforeAuto = g.game.total;
  let autoTicks = 0;
  for (let i = 0; i < 500; i++) { g.update(16); if (g.game.autoClicks > 0) { autoTicks = i; break; } }
  ok('auto-click fires during update() and raises the lifetime total', g.game.total > totalBeforeAuto);
  ok('auto-click is recorded distinctly from manual clicks', g.game.autoClicks > 0);
  ok('the game keeps accepting manual input alongside auto-click', (() => {
    const before = g.game.hours;
    const b = clickABubble();
    return !!b && g.game.hours > before;
  })());

  console.log('\n--- logic: exhaust the win condition -> a real ending is reached ---');
  g.resetGame();
  win.localStorage.clear();
  g.resetGame();
  eq(g.game.state, 'playing', 'fresh round starts playing');
  // drive total right up to the threshold, then cross it with one real click,
  // exactly like a player who has ground out the full WIN_TARGET
  g.game.total = g.UPGRADES ? g.WIN_TARGET !== undefined ? g.WIN_TARGET - 0.5 : g.game.total : g.game.total;
  eq(g.game.state, 'playing', 'still playing just under the win target');
  const bWin = g.bubbles.find(b => !b.dying) || (g.spawnBubble(), g.bubbles[g.bubbles.length - 1]);
  g.silenceBubble(bWin, false);
  eq(g.game.state, 'won', 'crossing WIN_TARGET reaches the won ending');
  ok('the win records a best total', g.game.bestTotal > 0);
  ok('the win persists a save', win.localStorage.getItem('noiseClicker.save.v1') !== null);
  ok('the win persists a best score', win.localStorage.getItem('noiseClicker.best.v1') !== null);

  console.log('\n--- logic: restart from that ending -> playable again ---');
  // This mirrors exactly what pointerDown() does when state==='won': call resetGame().
  g.resetGame();
  eq(g.game.state, 'playing', 'restart from the won screen returns to playing');
  eq(g.game.hours, 0, 'BUG CHECK: hours should read 0 immediately after restart');
  ok('BUG CHECK: total should read back below WIN_TARGET immediately after restart ' +
    '(got ' + g.game.total + ', WIN_TARGET=' + g.WIN_TARGET + ')',
    g.game.total < g.WIN_TARGET);

  const bAfterRestart = g.bubbles.find(b => !b.dying);
  if (bAfterRestart) g.silenceBubble(bAfterRestart, false);
  ok('BUG CHECK: one click after restart should NOT immediately re-win ' +
    '(state is now "' + g.game.state + '", total=' + g.game.total + ')',
    g.game.state === 'playing');

  console.log('\n--- logic: title screen also restarts cleanly ---');
  g.resetGame();
  win.localStorage.clear();
  g.game.state = 'title';
  g.resetGame(); // what pointerDown does when state==='title'
  eq(g.game.state, 'playing', 'clicking the title screen starts a fresh playing round');
  eq(g.game.total, 0, 'a genuinely fresh start (no prior save) has total 0');

  console.log('\n--- logic: pause does not desync the loop ---');
  g.resetGame();
  win.localStorage.clear();
  g.resetGame();
  g.togglePause();
  ok('pausing sets paused', g.game.paused === true);
  const hoursWhilePaused0 = g.game.hours;
  for (let i = 0; i < 30; i++) g.update(16);
  eq(g.game.hours, hoursWhilePaused0, 'update() does not accrue hours while paused');
  g.togglePause();
  ok('unpausing clears paused', g.game.paused === false);
  const bAfterPause = clickABubble();
  ok('input is accepted again after unpausing', !!bAfterPause && g.game.hours > hoursWhilePaused0);

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
