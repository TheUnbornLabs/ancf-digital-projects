// jsdom test harness for Haiku Build (#49)
// Tier 2: can a competent player drag every haiku's tiles into place and reach the win screen?
// Stubs the canvas 2D context (jsdom returns null) and drives the game via window.__cfq.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'haiku-build', 'index.html');
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
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Drive dt in small steps to mimic a real rAF cadence (16ms frames), for a total of `ms`.
function pump(ms) {
  for (let t = 0; t < ms; t += 16) g.update(16);
}

// Place every tile of the CURRENT haiku into its correct slot, in slot order.
// snapToSlot compares by label only (not object identity), so any unplaced tile
// bearing the expected word is a legal placement -- this mirrors what a player
// physically does when dragging the tile that shows the right word.
function solveCurrentHaikuCorrectly() {
  const haiku = g.HAIKUS[g.game.hIdx % g.HAIKUS.length];
  for (let si = 0; si < g.slots.length; si++) {
    const s = g.slots[si];
    if (s.tile) continue; // already filled (shouldn't happen on a fresh haiku)
    const expected = haiku.lines[s.line][s.pos];
    const tile = g.tiles.find(t => t.slotIdx < 0 && t.label === expected);
    if (!tile) { ok('FIXTURE: found a tile for "' + expected + '" (line ' + s.line + ' pos ' + s.pos + ')', false); continue; }
    g.snapToSlot(tile, si);
  }
}

// Place one deliberately WRONG tile into a given line (any tile whose label does not
// match the expected word for slot 0 of that line). Used to drive toward game over.
function placeWrongTileInLine(line) {
  const haiku = g.HAIKUS[g.game.hIdx % g.HAIKUS.length];
  const si = g.slots.findIndex(s => s.line === line && s.pos === 0);
  const expected = haiku.lines[line][0];
  const tile = g.tiles.find(t => t.slotIdx < 0 && t.label !== expected);
  if (!tile) return false;
  g.snapToSlot(tile, si);
  return true;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildHaiku', 'snapToSlot', 'nearestSlot',
    'checkDone', 'hitTile', 'update', 'draw', 'doHint', 'doShuffle', 'repackPool']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game/tiles/slots state', !!g.game && Array.isArray(g.tiles) && Array.isArray(g.slots));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  eq(g.HAIKUS.length, 8, 'there are 8 haikus to complete');
  ok('every haiku has 3 lines of 5/7/5 syllable tiles', g.HAIKUS.every(h =>
    h.lines.length === 3 &&
    h.lines[0].length === 5 && h.lines[1].length === 7 && h.lines[2].length === 5));

  let drewOk = true;
  g.resetGame();
  for (const st of ['title', 'playing', 'paused', 'won', 'gameover']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  g.resetGame();
  ok('draw() runs in every state without throwing', drewOk);

  let updateOk = true;
  try { for (const dt of [0, 16, 16.7, 1000, -5, 48000]) g.update(dt); for (let i = 0; i < 200; i++) g.update(16); }
  catch (e) { updateOk = false; console.log('    update threw: ' + e.message); }
  ok('update() tolerates odd dt and long runs', updateOk);

  /* ======================= LOGIC: SETUP ======================= */
  console.log('\n--- logic: setup ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts play');
  eq(g.game.hIdx, 0, 'resetGame starts on the first haiku');
  eq(g.game.score, 0, 'resetGame zeroes the score');
  eq(g.game.fails, 0, 'resetGame zeroes fails');
  ok('every slot starts empty', g.slots.every(s => !s.tile));
  ok('every tile starts unplaced', g.tiles.every(t => t.slotIdx < 0));

  /* ======================= LOGIC: CORE LOOP (advance) ======================= */
  console.log('\n--- logic: completing a haiku advances the game (the core loop) ---');
  g.resetGame();
  const hIdxBefore = g.game.hIdx;
  const scoreBefore = g.game.score;
  solveCurrentHaikuCorrectly();
  ok('all 3 lines register correct after solving', g.slots.every(s => s.tile && !s.wrong));
  ok('solving the haiku awards score', g.game.score > scoreBefore);
  ok('a completion animation window opens (input should be briefly blocked)', g.game.correctAnim > 0);

  // A player just watches: pump well past the 800ms correctAnim window used elsewhere
  // in this file's own code (advanceIfDone is invoked from update() while correctAnim>0).
  pump(3000);
  eq(g.game.hIdx, hIdxBefore + 1,
    'completing haiku ' + hIdxBefore + ' advances hIdx to the next haiku');
  ok('a fresh (unsolved) set of slots is loaded for the next haiku',
    g.game.hIdx !== hIdxBefore ? g.slots.some(s => !s.tile) || g.game.hIdx === hIdxBefore : true);
  eq(g.game.state, 'playing', 'still playing after advancing past haiku 1');

  /* ======================= LOGIC: THREE IN A ROW ======================= */
  console.log('\n--- logic: three haikus solved in a row, still advancing ---');
  g.resetGame();
  for (let i = 0; i < 3; i++) {
    const before = g.game.hIdx;
    solveCurrentHaikuCorrectly();
    pump(3000);
    ok('haiku #' + (i + 1) + ' (hIdx ' + before + ') advances the round',
      g.game.hIdx === before + 1 && g.game.state === 'playing');
    ok('haiku #' + (i + 1) + ': tiles are still draggable afterward (a fresh pool exists)',
      g.tiles.some(t => t.slotIdx < 0));
  }

  /* ======================= LOGIC: WIN PATH ======================= */
  console.log('\n--- logic: clearing all 8 haikus reaches a real ending ---');
  g.resetGame();
  let reachedWon = false;
  for (let i = 0; i < g.HAIKUS.length && !reachedWon; i++) {
    solveCurrentHaikuCorrectly();
    pump(3000);
    if (g.game.state === 'won') reachedWon = true;
  }
  ok('solving all ' + g.HAIKUS.length + ' haikus reaches the "won" state', reachedWon);
  if (reachedWon) {
    ok('best score is persisted on a win', win.localStorage.getItem('haikuBuild_best') !== null);
  }

  /* ======================= LOGIC: FAIL CONDITION -> GAME OVER ======================= */
  console.log('\n--- logic: exhausting the fail condition reaches game over ---');
  g.resetGame();
  eq(g.game.maxFails, 6, 'sanity: maxFails is 6 (documented threshold)');
  let overshoot = 0;
  for (let i = 0; i < 20 && g.game.state === 'playing'; i++) {
    const placed = placeWrongTileInLine(i % 3);
    if (!placed) break;
    overshoot++;
  }
  eq(g.game.state, 'gameover', 'placing ' + g.game.maxFails + ' wrong tiles reaches game over');
  ok('game over carries a human-readable reason', typeof g.game.gameoverReason === 'string' && g.game.gameoverReason.length > 0);

  /* ======================= LOGIC: RESTART FROM GAME OVER ======================= */
  console.log('\n--- logic: restart from game over is playable again ---');
  // index.html's onDown calls resetGame() directly whenever state is 'gameover' (or 'won'/'title').
  ok('precondition: we are actually at gameover before restarting', g.game.state === 'gameover');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from gameover returns to play');
  eq(g.game.hIdx, 0, 'restarting goes back to the first haiku');
  eq(g.game.fails, 0, 'restarting clears fails');
  ok('a fresh, empty board is ready to accept placements', g.slots.every(s => !s.tile));
  // prove input is actually accepted post-restart, not just that flags reset
  const beforeScore = g.game.score;
  solveCurrentHaikuCorrectly();
  ok('placements are accepted after restarting from game over', g.game.score > beforeScore);

  /* ======================= LOGIC: RESTART FROM WIN ======================= */
  console.log('\n--- logic: restart from the win screen is playable again ---');
  g.resetGame();
  for (let i = 0; i < g.HAIKUS.length && g.game.state !== 'won'; i++) { solveCurrentHaikuCorrectly(); pump(3000); }
  ok('precondition: we are actually at the won screen before restarting', g.game.state === 'won');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from won returns to play');
  eq(g.game.hIdx, 0, 'restarting after a win goes back to the first haiku');

  /* ======================= LOGIC: HINT ======================= */
  console.log('\n--- logic: hint advances play rather than consuming and freezing ---');
  g.resetGame();
  const hintCostBefore = g.game.hintCost;
  g.doHint();
  ok('using a hint marks a slot and a cost', g.game.hintSlot !== -1 && g.game.hintCost > hintCostBefore);
  // the hint must not block further legitimate play
  const beforeScoreH = g.game.score;
  solveCurrentHaikuCorrectly();
  pump(3000);
  ok('play continues normally after using a hint (haiku still completable & advances)',
    g.game.score > beforeScoreH && g.game.hIdx === 1 && g.game.state === 'playing');

  /* ======================= LOGIC: SHUFFLE ======================= */
  console.log('\n--- logic: shuffle re-labels the pool without freezing input ---');
  g.resetGame();
  g.doShuffle();
  ok('game is still playing after a shuffle', g.game.state === 'playing');
  const beforeScoreS = g.game.score;
  solveCurrentHaikuCorrectly();
  ok('placements are still accepted after a shuffle', g.game.score > beforeScoreS);

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
