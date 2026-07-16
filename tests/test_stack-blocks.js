// jsdom Tier 2 playthrough suite for Stack Blocks (#76)
// Core loop: a block swings, click/tap drops it onto the tower. Overlap with the
// block below is kept (overhang cut off / debris falls); miss entirely -> tower falls,
// game over after a short delay. Reach TARGET (15) blocks -> "endless" continues.
// Drives the loop through window.__cfq: resetGame, drop, update, plus direct mutation
// of the live swinger object (the hook getter returns the real object by reference,
// so tests can position it deterministically instead of guessing timing).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'stack-blocks', 'index.html');
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
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Force a perfectly-aligned drop: same width/x as the current top block, so
// overlap is 100% and the tower's usable width never shrinks. This lets us
// climb to TARGET deterministically without fighting the rubber-band floor.
function goodDrop() {
  const top = g.tower[g.tower.length - 1];
  g.swinger.x = top.x;
  g.drop();
}

// Force a total miss: push the swinger far enough away that overlap <= 0.
function missDrop() {
  g.swinger.x = 100000;
  g.drop();
}

(async () => {
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'nextSwinger', 'drop', 'update', 'draw']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.tower));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.game.state, 'title', 'game opens on the title screen');

  console.log('\n--- logic: starting the game ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame (the title-click handler) starts play');
  eq(g.tower.length, 1, 'the tower starts with just the foundation block');
  eq(g.game.score, 0, 'score starts at 0');
  ok('a swinger is spawned to play', !!g.swinger);

  console.log('\n--- logic: core loop advances (catches soft-locks) ---');
  const w0 = g.tower.length;
  goodDrop();
  ok('a good drop adds a block to the tower', g.tower.length === w0 + 1);
  ok('a good drop awards score', g.game.score > 0);
  ok('a new swinger spawns immediately after a good drop', !!g.swinger);
  eq(g.game.state, 'playing', 'still playing after one drop');

  console.log('\n--- logic: three drops in a row, still advancing ---');
  let lastHeight = g.tower.length;
  let stillAccepting = true;
  for (let i = 0; i < 3; i++) {
    goodDrop();
    if (g.tower.length !== lastHeight + 1) stillAccepting = false;
    lastHeight = g.tower.length;
  }
  ok('three consecutive good drops each advance the tower by one block', stillAccepting);
  ok('input is still accepted after three drops (swinger present)', !!g.swinger);
  eq(g.game.state, 'playing', 'still playing after three more drops');

  console.log('\n--- logic: climbing to the stated target ---');
  // We are at tower.length-1 blocks placed so far (foundation doesn't count).
  while (g.tower.length - 1 < 15 && g.game.state === 'playing') goodDrop();
  eq(g.tower.length - 1, 15, 'reached the 15-block target the hint text promises');
  ok('endless mode flag flips on at the target', g.game.endless === true);
  const stateAtTarget = g.game.state;
  eq(stateAtTarget, 'playing',
    'CONFIRMED: reaching the 15-block target does NOT transition to a "won" state — ' +
    'play continues uninterrupted into endless mode (see findings)');

  console.log('\n--- logic: bonus mode (endless) advances, does not freeze ---');
  const heightAtEndlessStart = g.tower.length;
  const scoreAtEndlessStart = g.game.score;
  let endlessAdvancing = true;
  for (let i = 0; i < 5; i++) {
    const before = g.tower.length;
    goodDrop();
    if (g.tower.length !== before + 1) endlessAdvancing = false;
  }
  ok('endless mode keeps advancing the tower on further good drops', endlessAdvancing);
  ok('endless mode keeps awarding score', g.game.score > scoreAtEndlessStart);
  ok('endless mode does not consume input and freeze', g.tower.length > heightAtEndlessStart);
  eq(g.game.state, 'playing', 'endless mode leaves the player in the playing state');

  console.log('\n--- logic: the promised "won" screen is unreachable ---');
  // grep-level confirmation, done at runtime: draw() has a whole panel for
  // state==='won' (a "Tower Built!" screen) and onDown treats 'won' as a
  // restart-eligible screen like title/gameover -- but nothing in the game
  // ever assigns game.state = 'won'. We just proved that at runtime above:
  // 20 successful drops (5 past target) and the state never left 'playing'.
  ok('after 20 successful drops the game has never entered the won state',
    stateAtTarget === 'playing' && g.game.state === 'playing');

  console.log('\n--- logic: rubber-band floor keeps the game winnable ---');
  // Repeated slightly-off-center (but still overlapping) drops should shrink
  // the usable width down to, but never below, MIN_OVERLAP_FLOOR.
  g.resetGame();
  let minWidthSeen = Infinity;
  let neverBelowFloor = true;
  for (let i = 0; i < 40 && g.game.state === 'playing'; i++) {
    const top = g.tower[g.tower.length - 1];
    if (!g.swinger) break;
    g.swinger.x = top.x + 6; // nudge right each time; still overlapping
    g.drop();
    const newTop = g.tower[g.tower.length - 1];
    minWidthSeen = Math.min(minWidthSeen, newTop.w);
    if (newTop.w < g.MIN_OVERLAP_FLOOR - 0.001) neverBelowFloor = false;
  }
  ok('after repeated off-center drops the tower is still standing (playing)', g.game.state === 'playing');
  ok('usable width never drops below the documented floor', neverBelowFloor);
  ok('the rubber-band floor actually engaged in this run (width did shrink toward it)',
    minWidthSeen < 150);

  console.log('\n--- logic: exhausting the fail condition reaches a real ending ---');
  g.resetGame();
  goodDrop(); goodDrop(); // build a little height first, like a real player would
  const scoreBeforeMiss = g.game.score;
  ok('swinger exists right before the fatal miss', !!g.swinger);
  missDrop();
  ok('a total miss clears the swinger immediately', g.swinger === null || g.swinger === undefined);
  eq(g.game.state, 'playing', 'game over is deferred (debris animation), not instant');
  await sleep(750); // drop()'s own setTimeout(...,700) must have fired by now
  eq(g.game.state, 'gameover', 'exhausting the fail condition reaches a real gameover screen');
  ok('the run score is preserved on the gameover screen', g.game.score === scoreBeforeMiss);

  console.log('\n--- logic: restart from that ending is playable again ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from the gameover screen returns to playing');
  eq(g.tower.length, 1, 'the tower is rebuilt to just the foundation');
  eq(g.game.score, 0, 'score is reset');
  eq(g.game.endless, false, 'endless flag is cleared on restart');
  ok('a fresh swinger is ready to play', !!g.swinger);
  goodDrop();
  ok('input is accepted immediately after restart (tower advances)', g.tower.length === 2);

  console.log('\n--- logic: restart works even after an endless-mode run ends ---');
  g.resetGame();
  while (g.tower.length - 1 < 16 && g.game.state === 'playing') goodDrop(); // push into endless
  ok('reached endless mode again', g.game.endless === true);
  missDrop();
  await sleep(750);
  eq(g.game.state, 'gameover', 'an endless-mode run also reaches a real gameover');
  g.resetGame();
  eq(g.game.state, 'playing', 'restart after an endless-mode gameover works');
  eq(g.game.endless, false, 'endless flag does not leak into the new run');
  eq(g.tower.length, 1, 'tower is rebuilt after an endless-mode restart');

  console.log('\n--- logic: best score persists across the restart cycle ---');
  g.resetGame();
  goodDrop();
  const bestAfterRun = g.game.best;
  ok('a completed drop can raise the best score', bestAfterRun >= 1);
  missDrop();
  await sleep(750);
  g.resetGame();
  eq(g.game.best, bestAfterRun, 'best score survives resetGame (not reset to 0)');
  eq(win.localStorage.getItem('stackblocks_best'), String(bestAfterRun),
    'best score is persisted to localStorage');

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
