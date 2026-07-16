// jsdom Tier 2 playthrough suite for Recipe: Chosen Life (#67)
// Core loop: a recipe is shown; drag/drop the matching ingredients into the pot via
// tryAdd(item). Wrong ingredients cost a mistake (3 = game over). Completing a round's
// ingredient list schedules a REAL setTimeout (700ms) that advances to the next round,
// or to 'won' after 8 rounds, then a Chef's Challenge bonus round.
// The hook has no clickLetter-style helper; tryAdd(itemObj) IS the core action, called
// directly on live objects from window.__cfq.items (mirrors what onUp() does on a drop
// inside the pot radius).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'recipe-chosen', 'index.html');
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
    w.requestAnimationFrame = () => 0;  // disable auto-loop; we drive update() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;         // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Add every correct ingredient for the CURRENT recipe/round via the real tryAdd() path.
// Re-reads g.recipe/g.items live each call (both are getters), so it never holds a
// stale reference across a round transition.
function addAllCorrect() {
  for (const ing of g.recipe.ingredients) {
    const it = g.items.find(x => x.label === ing && x.correct && !x.inPot);
    if (it) g.tryAdd(it);
  }
}
function firstWrongItem() {
  return g.items.find(x => !x.correct && !x.inPot);
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'buildChallenge', 'tryAdd', 'update', 'draw']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.RECIPES) && Array.isArray(g.WRONG));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  eq(g.RECIPES.length, 8, 'there are 8 base recipes');
  ok('every recipe has 4 ingredients', g.RECIPES.every(r => r.ingredients.length === 4));
  eq(g.TOTAL, 8, 'TOTAL rounds constant is 8');
  eq(g.MAX_MISTAKES, 3, 'MAX_MISTAKES constant is 3');

  let drewOk = true;
  g.resetGame();
  for (const st of ['title', 'playing', 'paused', 'won', 'gameover']) {
    try {
      if (st === 'paused') { g.game.state = 'playing'; g.game.paused = true; } else { g.game.paused = false; g.game.state = st; }
      g.draw();
    } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  g.resetGame();   // this test forces state directly; clear it so later tests start clean
  ok('draw() runs in every state without throwing', drewOk);

  let updateOk = true;
  try { for (const dt of [0, 16, 16.7, 1000, -5, 5000]) g.update(dt); for (let i = 0; i < 300; i++) g.update(16); }
  catch (e) { updateOk = false; console.log('    update threw: ' + e.message); }
  ok('update() tolerates odd dt and long runs', updateOk);
  g.resetGame();

  /* ======================= LOGIC: the core loop ======================= */
  console.log('\n--- logic: starting a round ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame puts the game into playing state');
  eq(g.game.round, 0, 'resetGame starts at round 0');
  eq(g.game.score, 0, 'resetGame resets score');
  eq(g.game.mistakes, 0, 'resetGame resets mistakes');
  ok('a recipe is selected', !!g.recipe && Array.isArray(g.recipe.ingredients));
  eq(g.added.length, 0, 'nothing is in the pot yet');
  ok('the item pool contains every correct ingredient plus distractors',
    g.recipe.ingredients.every(ing => g.items.some(it => it.label === ing && it.correct)));

  console.log('\n--- logic: advancing (the core loop) ---');
  g.resetGame();
  const recipe0 = g.recipe.name;
  addAllCorrect();
  eq(g.added.length, g.recipe.ingredients.length, 'adding every correct ingredient fills the recipe');
  ok('completing the recipe awards score', g.game.score > 0);
  eq(g.game.state, 'playing', 'the round completion is a scheduled transition, not immediate');

  await sleep(750);   // the scheduled round-advance timeout (700ms) must have fired by now
  ok('completing a round advances to the next one', g.game.round === 1);
  eq(g.game.state, 'playing', 'still playing after advancing');
  ok('the new round has a fresh recipe', !!g.recipe && g.added.length === 0);
  ok('input is accepted on the new round',
    (() => { const it = g.items.find(x => x.correct && !x.inPot); if (!it) return false; g.tryAdd(it); return g.added.length === 1; })());

  console.log('\n--- logic: three rounds running (still advancing, still accepting input) ---');
  g.resetGame();
  let roundsAdvanced = 0;
  for (let r = 0; r < 3; r++) {
    const before = g.game.round;
    addAllCorrect();
    await sleep(750);
    if (g.game.round === before + 1 && g.game.state === 'playing') roundsAdvanced++;
  }
  eq(roundsAdvanced, 3, 'three consecutive round completions each advance the round counter');

  console.log('\n--- logic: wrong ingredients ---');
  g.resetGame();
  const wrong0 = firstWrongItem();
  if (wrong0) {
    const mistakes0 = g.game.mistakes;
    const addedBefore = g.added.length;
    const wasAdded = g.tryAdd(wrong0);
    eq(wasAdded, false, 'tryAdd on a wrong ingredient is refused');
    eq(g.game.mistakes, mistakes0 + 1, 'a wrong ingredient costs a mistake');
    eq(g.added.length, addedBefore, 'a wrong ingredient is not added to the pot');
    eq(g.game.state, 'playing', 'a single mistake does not end the round');
  } else {
    ok('SKIPPED wrong-ingredient test (no distractor found)', true);
  }

  console.log('\n--- logic: exhausting the fail condition -> a real ending ---');
  g.resetGame();
  const wrongItem = firstWrongItem();
  ok('a wrong ingredient exists to test against', !!wrongItem);
  if (wrongItem) {
    for (let i = 0; i < g.MAX_MISTAKES; i++) g.tryAdd(wrongItem);
    eq(g.game.mistakes, g.MAX_MISTAKES, 'three mistakes are recorded');
    eq(g.game.state, 'gameover', 'exhausting mistakes reaches the gameover screen');
  }

  console.log('\n--- logic: restart from that ending ---');
  const scoreAtGameover = g.game.score;
  g.resetGame();   // mirrors onDown()'s real handler for the non-'won' branch (gameover -> resetGame())
  eq(g.game.state, 'playing', 'the game is playable again after restarting from gameover');
  eq(g.game.round, 0, 'restarting resets to round 0');
  eq(g.game.score, 0, 'restarting resets the score');
  eq(g.game.mistakes, 0, 'restarting resets mistakes');
  ok('a fresh recipe is ready and input is accepted after restart',
    (() => { const it = g.items.find(x => x.correct && !x.inPot); if (!it) return false; g.tryAdd(it); return g.added.length === 1; })());

  console.log('\n--- logic: clearing all 8 rounds -> won, then the Chef\'s Challenge bonus round ---');
  g.resetGame();
  let cleared = true;
  for (let r = 0; r < g.TOTAL; r++) {
    addAllCorrect();
    await sleep(750);
  }
  eq(g.game.state, 'won', 'clearing all 8 recipes reaches the won screen');
  eq(g.game.challengeCleared, false, 'the base game win is not yet a challenge clear');

  // mirrors onDown()'s real handler: state==='won' && !challenge && !challengeCleared -> buildChallenge()
  g.buildChallenge();
  eq(g.game.state, 'playing', 'the Chef\'s Challenge bonus round starts playing, not frozen');
  eq(g.recipe.name, "Chef's Challenge", 'the bonus round loads the challenge recipe');
  const challengeIngredientCount = g.RECIPES.reduce((a, r) => a + r.ingredients.length, 0);
  eq(g.recipe.ingredients.length, challengeIngredientCount, 'the challenge recipe contains every ingredient from every recipe');

  addAllCorrect();
  eq(g.added.length, challengeIngredientCount, 'every correct ingredient in the challenge can be added');
  await sleep(750);
  ok('completing the Chef\'s Challenge reaches its own real ending',
    g.game.state === 'won' && g.game.challengeCleared === true);

  // mirrors onDown()'s real handler: state==='won' && challengeCleared -> resetGame()
  g.resetGame();
  eq(g.game.state, 'playing', 'the game is playable again after clearing the Chef\'s Challenge');
  eq(g.game.round, 0, 'post-challenge restart resets to round 0');
  eq(g.game.challenge, false, 'post-challenge restart leaves challenge mode');

  /* ======================= LOGIC: race between completion and the round timer ======================= */
  console.log('\n--- logic: completing a round right at the time limit ---');
  // A player who drops the final ingredient with only a frame or two left on the clock
  // completes the recipe (added.length reaches the requirement, score is awarded,
  // completeRound() schedules the 700ms advance) but the round timer has NOT been
  // switched off. The very next update() tick -- which fires every frame regardless,
  // exactly like real gameplay -- can push roundTime past roundLimit and call
  // finishFail(), which sets state='gameover' immediately. This is reached with
  // ordinary update(dt) calls; no property is force-set to an impossible combination.
  g.resetGame();
  let frames = 0;
  while (g.game.roundLimit - g.game.roundTime > 16 && frames < 10000) { g.update(16); frames++; }
  const remainingMs = g.game.roundLimit - g.game.roundTime;
  addAllCorrect();
  const stateRightAfterCompletion = g.game.state;
  const scoreRightAfterCompletion = g.game.score;
  g.update(16);   // the next animation frame after the winning drop
  console.log(`    (drove the clock down to ${remainingMs}ms remaining, then completed the recipe;`
    + ` state right after completion was '${stateRightAfterCompletion}', score ${scoreRightAfterCompletion};`
    + ` state after one more frame tick: '${g.game.state}')`);
  ok('FINDING CHECK: a round completed at the buzzer is not silently converted to a loss by the next frame tick',
    !(stateRightAfterCompletion === 'playing' && g.game.state === 'gameover'));

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
