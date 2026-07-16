// jsdom Tier 2 playthrough suite for Decode Signal (#94)
// Core loop: an affirmation is shown as scrambled word-tiles. Click a tile to select it,
// click another to swap. When every tile matches the affirmation's word order, the round
// is solved -> a 700ms setTimeout fires buildRound(round+1), or game.state='won' at TOTAL.
// This suite drives that loop through window.__cfq and asserts PROGRESSION, not setup.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'decode-signal', 'index.html');
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
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update()/draw() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Solve the CURRENT round via the same clickTile(i) two-click-swap mechanic a player uses.
// Cycle-sort: fix position 0, then 1, etc. Each swap places at least one more tile correctly
// without disturbing already-fixed ones (idx is always > pos, since positions < pos are
// already correct and can't hold the word we're looking for unless it were already placed).
function solveCurrentRound() {
  let guard = 0;
  while (!g.solved && guard < 30) {
    const round = g.game.round;
    const aff = g.AFFIRMATIONS[round % g.AFFIRMATIONS.length].split(' ');
    const tiles = g.tiles;
    const pos = tiles.findIndex((t, i) => t.word !== aff[i]);
    if (pos < 0) break;
    const idx = tiles.findIndex(t => t.word === aff[pos]);
    if (idx < 0) break; // should never happen for a true permutation
    g.clickTile(pos);
    g.clickTile(idx);
    guard++;
  }
  return guard;
}

// Solve the CURRENT round entirely via the hint button (the power-up path).
function solveCurrentRoundByHint() {
  let guard = 0;
  while (!g.solved && guard < 30) {
    g.useHint();
    guard++;
  }
  return guard;
}

(async () => {

  console.log('\n--- smoke: hook wiring ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'restartRound', 'clickTile', 'useHint', 'tileAt', 'layoutTiles', 'update', 'draw']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.AFFIRMATIONS));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.AFFIRMATIONS.length, 12, 'there are 12 affirmations');
  ok('TOTAL matches the affirmation count', g.TOTAL === g.AFFIRMATIONS.length);
  ok('no affirmation repeats a word (required for the word-text correctness check)',
    g.AFFIRMATIONS.every(a => { const w = a.split(' '); return new Set(w).size === w.length; }));

  console.log('\n--- logic: starting a run ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts the run in "playing"');
  eq(g.game.round, 0, 'resetGame starts at round 0');
  eq(g.game.score, 0, 'resetGame resets score');
  eq(g.tiles.length, g.AFFIRMATIONS[0].split(' ').length, 'round 0 has one tile per word');
  ok('the round starts scrambled (not already solved)', !g.solved);

  console.log('\n--- logic: the core loop advances (catches soft-locks) ---');
  const round0Tiles = g.tiles.map(t => t.word).join('|');
  const swapsUsed = solveCurrentRound();
  ok('solveCurrentRound actually did some swaps', swapsUsed > 0);
  eq(g.solved, true, 'arranging every tile into order marks the round solved');
  ok('solving the round scores points', g.game.score > 0);

  await sleep(750);   // the scheduled advance (700ms) must have fired by now
  eq(g.game.round, 1, 'solving round 0 advances the round counter to 1');
  eq(g.solved, false, 'the new round is not pre-solved');
  eq(g.game.state, 'playing', 'still playing after advancing');
  eq(g.selected, -1, 'selection is cleared on the new round');
  ok('the new round has a freshly-scrambled tile set',
    g.tiles.map(t => t.word).join('|') !== round0Tiles);
  eq(g.tiles.length, g.AFFIRMATIONS[1].split(' ').length, 'round 1 has the right tile count for its affirmation');

  console.log('\n--- logic: three rounds running, still accepting input ---');
  for (let r = 1; r <= 3; r++) {
    const before = g.game.round;
    ok(`round ${before}: game accepts a tile click before solving`, (() => {
      g.clickTile(0); const acceptedSelect = g.selected === 0; g.clickTile(0); // deselect, no side effects
      return acceptedSelect;
    })());
    solveCurrentRound();
    ok(`round ${before}: solve reaches solved=true`, g.solved === true);
    await sleep(750);
    eq(g.game.round, before + 1, `round ${before}: advances to round ${before + 1}`);
    eq(g.game.state, 'playing', `round ${before}: still playing after advancing`);
    ok(`round ${before}: still accepting input on the new round`, g.tiles.length > 0 && !g.solved);
  }

  console.log('\n--- logic: the hint / power-up path advances rather than freezing ---');
  // We're at round 4. Use the hint repeatedly to finish this round entirely via hint.
  const roundBeforeHint = g.game.round;
  const hintsUsed = solveCurrentRoundByHint();
  ok('hinting made progress', hintsUsed > 0);
  eq(g.solved, true, 'the hint path can fully solve a round');
  ok('hintUsed is flagged for scoring', g.game.hintUsed === true);
  await sleep(750);
  eq(g.game.round, roundBeforeHint + 1, 'finishing a round via hint still advances the round counter');
  eq(g.game.state, 'playing', 'still playing after a hint-finished round advances');
  ok('a tile click is accepted on the round after a hint finish (not frozen)', (() => {
    g.clickTile(0); const accepted = g.selected === 0; g.clickTile(0);
    return accepted;
  })());

  console.log('\n--- logic: exhausting every round reaches a real ending ---');
  // We're at round 5 of 12. Alternate solve styles and drive to the end.
  let safety = 0;
  while (g.game.state === 'playing' && safety < 20) {
    solveCurrentRound();
    await sleep(750);
    safety++;
  }
  eq(g.game.state, 'won', 'clearing every affirmation reaches the "won" ending');
  eq(g.game.round, g.TOTAL, 'the round counter reflects all 12 rounds cleared');
  ok('a best score was recorded', g.game.best > 0);
  ok('the best score persisted to localStorage', Number(JSON.parse(win.localStorage.getItem('decodeSignal_v1')).best) === g.game.best);

  console.log('\n--- logic: restart from the ending is playable again ---');
  // This mirrors the game's own restart handler: onDown() calls resetGame() when
  // game.state is 'title' or 'won' (index.html onDown: game.state==='title'||game.state==='won').
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from the won screen starts a fresh run');
  eq(g.game.round, 0, 'the fresh run starts at round 0 again');
  eq(g.game.score, 0, 'the fresh run starts with score 0 again');
  ok('a tile click is accepted on the restarted run', (() => {
    g.clickTile(0); const accepted = g.selected === 0; g.clickTile(0);
    return accepted;
  })());
  const swaps2 = solveCurrentRound();
  ok('the restarted run can be solved and advances like the first run', swaps2 > 0 && g.solved === true);
  await sleep(750);
  eq(g.game.round, 1, 'the restarted run advances past round 0 just like before');

  console.log('\n--- logic: finishing the LAST round via hint also reaches "won" ---');
  // finishByHint() duplicates the round>=TOTAL win transition that clickTile's swap path
  // already has (index.html:107-115 vs :155-163). Exercise it directly so a divergence
  // between the two copies (the word-unscramble/simon-sequence bug class) would show up.
  g.resetGame();
  let toLast = 0;
  while (g.game.round < g.TOTAL - 1 && toLast < 20) {
    solveCurrentRound();
    await sleep(750);
    toLast++;
  }
  eq(g.game.round, g.TOTAL - 1, 'reached the final round (index ' + (g.TOTAL - 1) + ') via normal solving');
  eq(g.game.state, 'playing', 'still playing going into the final round');
  const finalHints = solveCurrentRoundByHint();
  ok('the final round can be finished via hint', finalHints > 0 && g.solved === true);
  await sleep(750);
  eq(g.game.state, 'won', 'finishing the final round via hint reaches "won" (not stuck mid-round)');
  eq(g.game.round, g.TOTAL, 'the round counter reflects the completed final round');

  console.log('\n--- logic: draw() survives every reachable state after a full playthrough ---');
  let drewOk = true;
  for (const st of ['title', 'playing', 'won']) {
    try { const prev = g.game.state; g.game.state = st; g.draw(); g.game.state = prev; }
    catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  ok('draw() does not throw in any reachable state', drewOk);

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
