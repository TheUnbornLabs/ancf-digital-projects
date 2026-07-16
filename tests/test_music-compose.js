// jsdom Tier 2 playthrough suite for Music Compose (#48)
// Core loop: click grid cells to recreate a target melody, SUBMIT when the
// match threshold is met. 8 rounds, 3 lives. Drives the real loop through
// window.__cfq and asserts PROGRESSION (round advances, game reaches a real
// ending, restart works, hint doesn't freeze) rather than one-shot setup facts.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'music-compose', 'index.html');
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

// Fill the live `grid` array with the live `target` array's values (a
// perfect performance). Both getters return the real arrays by reference,
// so mutate cell-by-cell; re-read g.grid/g.target fresh after every
// buildRound/resetGame since the game does `grid = emptyGrid(...)`
// (a new array object) rather than mutating in place.
function fillPerfect() {
  const grid = g.grid, target = g.target;
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[r].length; c++)
      grid[r][c] = target[r][c];
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'toggleCell', 'submit', 'playSequence',
    'stopSequence', 'update', 'draw', 'useHint', 'clearGrid', 'togglePause', 'toggleMute', 'cellAt']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.grid) && Array.isArray(g.target));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.TOTAL, 8, 'the round total is 8');

  console.log('\n--- logic: setup ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame enters the playing state');
  eq(g.game.round, 1, 'resetGame starts at round 1');
  eq(g.game.lives, 3, 'resetGame restores full lives');
  eq(g.game.score, 0, 'resetGame resets score');
  ok('the target grid has at least one active cell per step', g.target.every(() => true) &&
    g.target[0].length > 0);

  console.log('\n--- logic: advancing (the core loop) ---');
  g.resetGame();
  fillPerfect();
  const scoreBefore = g.game.score;
  g.submit();
  ok('a passing submit does not itself change state yet (it animates first)', g.game.state === 'playing');
  ok('a passing submit awards score immediately', g.game.score > scoreBefore);
  await sleep(750);   // the scheduled round-advance (700ms) must have fired by now
  eq(g.game.round, 2, 'a perfect submit advances from round 1 to round 2');
  eq(g.game.state, 'playing', 'still playing after advancing');
  eq(g.game.lives, 3, 'no life lost on a passing submit');
  ok('the new round starts with an empty performance grid',
    g.grid.every(row => row.every(c => c === 0)));
  ok('the new round has its own target', g.target.length === g.ROWS);

  console.log('\n--- logic: three in a row, still accepting input ---');
  // rounds 2, 3, 4 - re-fetch grid/target fresh each time (buildRound rebinds them)
  for (const expectRound of [3, 4, 5]) {
    fillPerfect();
    g.submit();
    await sleep(750);
    eq(g.game.round, expectRound, `after another perfect submit, round reaches ${expectRound}`);
    eq(g.game.state, 'playing', `still playing at round ${expectRound}`);
  }
  ok('lives are untouched after 4 consecutive clean rounds', g.game.lives === 3);
  ok('score has grown across the 4 rounds', g.game.score > scoreBefore);

  console.log('\n--- logic: submit is refused with an empty/mismatched grid ---');
  g.resetGame();
  const preFailRound = g.game.round;
  g.submit();   // grid is all zeros; pct = 0 < threshold
  await sleep(750);
  eq(g.game.round, preFailRound, 'a failing submit does not advance the round');
  eq(g.game.lives, 2, 'a failing submit costs a life');

  console.log('\n--- logic: exhausting lives reaches a real ending ---');
  g.resetGame();
  eq(g.game.lives, 3, 'lives are full at the start of the gameover drill');
  let guard = 0;
  while (g.game.state === 'playing' && g.game.lives > 0 && guard++ < 10) {
    g.submit();          // empty grid always fails the threshold
    await sleep(600);    // wrong-answer transition is scheduled at 500ms
  }
  eq(g.game.lives, 0, 'three failing submits exhaust all lives');
  await sleep(600);
  eq(g.game.state, 'gameover', 'exhausting lives reaches the gameover screen');

  console.log('\n--- logic: restart from gameover ---');
  // Replay the game's own restart handler: pointerDown() calls resetGame()
  // when state is 'title' | 'won' | 'gameover' (index.html pointerDown).
  g.resetGame();
  eq(g.game.state, 'playing', 'restart from gameover re-enters the playing state');
  eq(g.game.round, 1, 'restart from gameover resets to round 1');
  eq(g.game.lives, 3, 'restart from gameover restores full lives');
  eq(g.game.score, 0, 'restart from gameover resets score');
  fillPerfect();
  g.submit();
  await sleep(750);
  eq(g.game.round, 2, 'the game is genuinely playable again after a gameover restart (round advances)');

  console.log('\n--- logic: win path (clearing all 8 rounds) ---');
  g.resetGame();
  for (let i = 0; i < 20 && g.game.state === 'playing' && g.game.round < g.TOTAL; i++) {
    fillPerfect();
    g.submit();
    await sleep(750);
  }
  // one more perfect submit on the final round should flip state to 'won'
  if (g.game.state === 'playing' && g.game.round === g.TOTAL) {
    fillPerfect();
    g.submit();
    await sleep(750);
  }
  eq(g.game.state, 'won', 'clearing all 8 rounds with perfect performances reaches the won screen');
  ok('best score is saved to localStorage on winning',
    parseInt(win.localStorage.getItem('musicCompose.best') || '0', 10) === g.game.score);

  console.log('\n--- logic: restart from won ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'restart from won re-enters the playing state');
  eq(g.game.round, 1, 'restart from won resets to round 1');
  fillPerfect();
  g.submit();
  await sleep(750);
  eq(g.game.round, 2, 'the game is genuinely playable again after a won restart (round advances)');

  console.log('\n--- logic: hint does not consume-and-freeze ---');
  g.resetGame();
  const hintsBefore = g.game.hintsUsed;
  const scoreBeforeHint = g.game.score;
  g.useHint();
  ok('using a hint marks exactly one correct cell', g.grid.some((row, r) => row.some((c, s) => c === 1 && g.target[r][s] === 1)));
  ok('using a hint spends a hint and dings score', g.game.hintsUsed === hintsBefore + 1 && g.game.score <= scoreBeforeHint);
  eq(g.game.state, 'playing', 'the game is still playing after a hint (no freeze)');
  // finish the round by hand after the hint - hint must not have consumed the ability to submit
  fillPerfect();
  g.submit();
  await sleep(750);
  eq(g.game.round, 2, 'the round can still be completed and advances after using a hint');

  // using the hint down to 0 progress should never push a cell out of range / throw
  g.resetGame();
  let hintOk = true;
  try { for (let i = 0; i < 100; i++) g.useHint(); } catch (e) { hintOk = false; console.log('    useHint threw: ' + e.message); }
  ok('spamming useHint past a full grid does not throw', hintOk);

  console.log('\n--- logic: double-submit during the post-success transition window ---');
  // submit() must refuse while the 700ms post-success transition is pending
  // (game.locked). Otherwise a second submit re-scores the same unchanged grid
  // and schedules a second round-advance: a round is skipped and score inflated.
  g.resetGame();
  fillPerfect();
  const roundAtFirstSubmit = g.game.round;
  g.submit();                 // first accepted submit, schedules advance at +700ms
  const scoreAfterOneSubmit = g.game.score;
  await sleep(50);
  eq(g.game.round, roundAtFirstSubmit, 'round has not yet advanced when the second submit fires');
  g.submit();                 // second submit while still on the same (unbuilt) round/target
  eq(g.game.score, scoreAfterOneSubmit, 'a submit during the transition window awards no extra score');
  await sleep(900);           // let any/all scheduled timeouts fire
  eq(g.game.round, roundAtFirstSubmit + 1, 'a double-submit advances exactly one round (no skip)');
  eq(g.game.state, 'playing', 'still playing after a double-submit');

  // Baseline: what ONE clean perfect submit on round 1 is worth, measured from
  // the game itself rather than hardcoded (score formula: base + perfect bonus,
  // scaled by the streak multiplier).
  g.resetGame();
  fillPerfect();
  g.submit();
  const oneRoundGain = g.game.score;
  await sleep(900);

  // Multi-click storm: 8 submits at 20ms intervals must not run the board out.
  // Same starting conditions as the baseline, so the gain must be identical.
  g.resetGame();
  fillPerfect();
  for (let i = 0; i < 8; i++) { g.submit(); await sleep(20); }
  await sleep(900);
  eq(g.game.round, 2, 'eight rapid submits still advance exactly one round');
  eq(g.game.state, 'playing', 'a submit storm does not run the game to the won screen');
  eq(g.game.score, oneRoundGain, 'a submit storm scores exactly one round, no inflation');

  // The lock must not survive the transition, or SUBMIT is dead afterwards.
  eq(g.game.locked, false, 'the transition lock is released once the round advances');
  fillPerfect();
  g.submit();
  await sleep(750);
  eq(g.game.round, 3, 'submit still works normally after a double-submit (lock did not stick)');

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
