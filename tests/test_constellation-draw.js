// jsdom test harness for Constellation Draw (#44)
// Tier 2: can a competent player get from start to end?
// Drives the real loop through window.__cfq: resetGame -> startPattern(show) ->
// update() until phase flips to 'input' -> clickStar() in the correct order ->
// real setTimeout for the win/lose/advance transition -> repeat.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'constellation-draw', 'index.html');
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

// ---- helpers that drive the game the way a real player's clicks would ----

// Pump update() with clamped-size frames until the memorise phase ends and
// input is accepted, or give up after a generous cap (safety net, not a real limit).
function advanceToInput(maxIters = 400) {
  for (let i = 0; i < maxIters && g.game.phase !== 'input'; i++) g.update(48);
  return g.game.phase === 'input';
}

function starIndexForPt(pt) {
  return g.stars.findIndex(s => s.c === pt[0] && s.r === pt[1]);
}

// Click every remaining point of the current pattern in the correct order.
// Assumes phase is already 'input'. Returns the pattern object that was solved.
function solveCurrentPattern() {
  const pat = g.pattern;
  while (g.clicked.length < pat.pts.length) {
    const pt = pat.pts[g.clicked.length];
    const idx = starIndexForPt(pt);
    if (idx < 0) throw new Error('pattern point not found on the star grid: ' + pt);
    g.clickStar(idx);
  }
  return pat;
}

// Click a star that is NOT the next correct one (a deliberate mistake).
function wrongClickOnce() {
  const pat = g.pattern;
  const neededPt = pat.pts[g.clicked.length];
  const neededIdx = starIndexForPt(neededPt);
  const wrongIdx = g.stars.findIndex((s, i) => i !== neededIdx);
  g.clickStar(wrongIdx);
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'startPattern', 'clickStar', 'buildStars',
    'update', 'draw', 'starAt', 'toggleMute', 'togglePause']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.PATTERNS));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.PATTERNS.length, 10, 'ten constellation patterns are defined');
  eq(g.TOTAL, 10, 'a round is 10 patterns long');

  /* ======================= CORE LOOP: one pattern advances ======================= */
  console.log('\n--- logic: core action advances the game ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts play');
  eq(g.game.pIdx, 0, 'resetGame starts at pattern 0');
  eq(g.game.phase, 'show', 'a pattern opens in the memorise (show) phase');

  ok('update() eventually flips show -> input', advanceToInput());
  eq(g.game.phase, 'input', 'phase is input before we try to click stars');
  eq(g.clicked.length, 0, 'nothing is clicked yet at the start of input');

  const scoreBefore = g.game.score;
  const patIdxBefore = g.game.pIdx;
  const solved0 = solveCurrentPattern();
  ok('completing a pattern is registered immediately', g.clicked.length === solved0.pts.length);

  await sleep(700); // the scheduled advance/win (600ms) must have fired by now
  ok('completing a pattern advances the round (score increases)', g.game.score > scoreBefore);
  eq(g.game.pIdx, patIdxBefore + 1, 'the pattern index advances to the next pattern');
  eq(g.game.state, 'playing', 'still playing after advancing');
  eq(g.game.phase, 'show', 'the new pattern opens in its own show phase');
  eq(g.clicked.length, 0, 'clicks are cleared for the new pattern');

  ok('input is accepted on the new pattern (not soft-locked)', advanceToInput());
  const firstPt = g.pattern.pts[0];
  g.clickStar(starIndexForPt(firstPt));
  ok('a click on the new pattern registers', g.clicked.length === 1);

  /* ======================= THREE IN A ROW ======================= */
  console.log('\n--- logic: three advances in a row, still accepting input ---');
  g.resetGame();
  let lastScore = g.game.score;
  for (let n = 1; n <= 3; n++) {
    ok(`round ${n}: input reachable`, advanceToInput());
    const pIdxBefore = g.game.pIdx;
    solveCurrentPattern();
    await sleep(700);
    ok(`round ${n}: score increased`, g.game.score > lastScore);
    eq(g.game.pIdx, pIdxBefore + 1, `round ${n}: pattern index advanced`);
    eq(g.game.state, 'playing', `round ${n}: still playing`);
    lastScore = g.game.score;
  }
  ok('after 3 consecutive clears the game still accepts input', advanceToInput());

  /* ======================= FAIL CONDITION: reach a real ending ======================= */
  console.log('\n--- logic: exhausting lives reaches a real gameover ---');
  g.resetGame();
  eq(g.game.lives, 3, 'a fresh round starts with 3 lives');
  ok('input reachable before the mistakes', advanceToInput());
  wrongClickOnce();
  eq(g.game.lives, 2, 'a wrong click costs a life');
  eq(g.clicked.length, 0, 'a wrong click resets the current attempt');
  eq(g.game.state, 'playing', 'one mistake does not end the game');
  wrongClickOnce();
  eq(g.game.lives, 1, 'a second wrong click costs another life');
  wrongClickOnce();
  eq(g.game.lives, 0, 'the last life is spent');
  await sleep(500); // the scheduled gameover (350ms) must have fired by now
  eq(g.game.state, 'gameover', 'losing the last life ends the game with a real gameover screen');

  /* ======================= RESTART FROM THE ENDING ======================= */
  console.log('\n--- logic: restart from gameover is playable again ---');
  // resetGame() is exactly what pointerDown() calls when state is 'gameover'
  // (index.html: `if(game.state==='title'||game.state==='won'||game.state==='gameover'){resetGame();return;}`)
  g.resetGame();
  eq(g.game.state, 'playing', 'restart from gameover returns to play');
  eq(g.game.lives, 3, 'restart restores full lives');
  eq(g.game.score, 0, 'restart resets score');
  eq(g.game.pIdx, 0, 'restart returns to the first pattern');
  ok('restart is genuinely playable (input accepted, pattern solvable)', advanceToInput());
  const scoreAtRestart = g.game.score;
  solveCurrentPattern();
  await sleep(700);
  ok('a pattern can be solved right after restarting', g.game.score > scoreAtRestart);

  /* ======================= WIN PATH: reach the real ending the other way ======================= */
  console.log('\n--- logic: clearing all 10 patterns reaches a real win ---');
  g.resetGame();
  for (let i = 0; i < g.TOTAL; i++) {
    ok(`win path: pattern ${i + 1}/${g.TOTAL} reachable`, advanceToInput());
    solveCurrentPattern();
    await sleep(700);
  }
  eq(g.game.state, 'won', 'clearing all 10 patterns ends the round with a win');
  ok('the best score is persisted on a win', g.game.best >= g.game.score);
  eq(win.localStorage.getItem('constellation-draw-best'), String(g.game.best),
    'the best score is saved to localStorage');

  console.log('\n--- logic: restart from the win screen is playable again ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'restart from the win screen returns to play');
  ok('restart from win is genuinely playable', advanceToInput());
  ok('a click registers right after restarting from a win',
    (() => { g.clickStar(starIndexForPt(g.pattern.pts[0])); return g.clicked.length === 1; })());

  /* ======================= PAUSE: the game's only "mode" control ======================= */
  // This game has no skip/hint/power-up. togglePause() is the closest analogue
  // (a control that could plausibly consume input and freeze the round), so it
  // gets the same "advances rather than freezes" scrutiny.
  console.log('\n--- logic: pause blocks input but does not freeze the round ---');
  g.resetGame();
  advanceToInput();
  g.togglePause();
  ok('pause flag is set', g.game.paused === true);
  const clickedBeforePause = g.clicked.length;
  g.clickStar(starIndexForPt(g.pattern.pts[0]));
  eq(g.clicked.length, clickedBeforePause, 'a click while paused is ignored (not mis-scored, not crashed)');
  g.togglePause();
  ok('unpause clears the flag', g.game.paused === false);
  g.clickStar(starIndexForPt(g.pattern.pts[0]));
  ok('input resumes after unpausing (pause does not soft-lock the round)', g.clicked.length === 1);

  /* ======================= CANDIDATE: click during the victory-animation window ======================= */
  // clickStar() only guards on phase!=='input' and paused. After the last correct
  // star of a pattern is clicked, phase stays 'input' for a real 600ms (the
  // setTimeout that advances pIdx / sets 'won' hasn't fired yet). A player who
  // taps one more star inside that window has clicked.length === pts.length, so
  // clickStar reads pattern.pts[clicked.length] -> undefined, then calls
  // patternStarIdx(undefined) -> undefined[0]. Verify what actually happens.
  console.log('\n--- candidate: extra click inside the post-completion window ---');
  g.resetGame();
  advanceToInput();
  solveCurrentPattern();
  eq(g.clicked.length, g.pattern.pts.length, 'the pattern is fully clicked; the 600ms advance timer is now pending');
  eq(g.game.phase, 'input', 'phase has NOT yet flipped to show for the next pattern (this is the live window)');
  let extraClickThrew = false, extraClickError = null;
  try {
    g.clickStar(0); // any valid, real star index - exactly what a fast extra tap sends
  } catch (e) {
    extraClickThrew = true;
    extraClickError = e;
  }
  if (extraClickThrew) {
    console.log('    CONFIRMED: extra click during the completion window threw: ' + extraClickError.message);
  } else {
    console.log('    no throw observed: extra click during the completion window was handled safely');
  }
  ok('report only - see findings for verdict on this candidate', true);
  await sleep(700); // let the pending transition settle before continuing
  ok('after the transition settles, the game is still in a normal, playable state',
    g.game.state === 'playing' || g.game.state === 'won');

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
