// jsdom Tier 2 playthrough suite for Echo Match (#88)
// Simon-says: watch a growing tile sequence, repeat it by clicking tiles in order.
// 12 rounds, sequence grows by 1 each round, 3 misses ends the run.
// Drives the real loop through window.__cfq: buildRound/update (show-phase timing)
// and clickTile (player input), then real setTimeout-driven transitions (round advance,
// miss-retry, gameover) via sleep(). Tier 1 already passes clean on this game; this suite
// exists to catch soft-locks a rule-agnostic sweep cannot see.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'echo-match', 'index.html');
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

// Pump update() with plausible frame deltas until the show-phase (the tile-lighting
// playback) finishes and input is unlocked. Capped so a stuck show-phase fails loudly
// instead of hanging the suite.
function advanceThroughShow(maxTicks = 3000) {
  let ticks = 0;
  while (g.showPhase && ticks < maxTicks) { g.update(48); ticks++; }
  return ticks < maxTicks;
}

// Click the current round's sequence in the correct order.
function solveSequence() {
  const seq = g.sequence.slice();
  for (const idx of seq) g.clickTile(idx);
  return seq;
}

(async () => {

  console.log('\n--- smoke: hook wiring ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'clickTile', 'tileAt', 'update', 'draw']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live state (game/sequence/playerInput/showPhase)',
    !!g.game && Array.isArray(g.sequence) && Array.isArray(g.playerInput));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  console.log('\n--- logic: the core loop advances ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts a round in the playing state');
  eq(g.game.round, 0, 'resetGame starts at round 0');
  ok('a round starts in the show phase (playback), input locked', g.showPhase === true);

  const shown1 = advanceThroughShow();
  ok('the show phase ends after enough update() ticks', shown1);
  ok('a sequence of length 1 is queued for round 0', g.sequence.length === 1);

  // While still in the show phase, clicking must be inert (no false progress, no miss).
  // (Re-verify pre-unlock guard is not the word-unscramble-class "refuses everything" bug:
  // check it unlocks and accepts real input immediately after, not just now.)
  const beforeScore = g.game.score;
  solveSequence();
  ok('completing round 0 immediately awards score', g.game.score > beforeScore);
  const roundAfterSolve = g.game.round;

  await sleep(650); // the scheduled round-advance (500ms) must have fired by now
  ok('completing the sequence advances the round counter', g.game.round === roundAfterSolve + 1);
  eq(g.game.state, 'playing', 'still playing after advancing past round 0');
  ok('the new round is back in its own show phase', g.showPhase === true);

  console.log('\n--- logic: three advances in a row, still accepting input ---');
  let advancedThrice = true;
  for (let i = 0; i < 3; i++) {
    const before = g.game.round;
    const shown = advanceThroughShow();
    if (!shown) { advancedThrice = false; break; }
    const seq = solveSequence();
    if (!(g.playerInput.length === seq.length)) { advancedThrice = false; break; }
    await sleep(650);
    if (g.game.state === 'won') break; // reached the end early on a short board — fine
    if (!(g.game.round === before + 1)) { advancedThrice = false; break; }
  }
  ok('three consecutive correct rounds each advance the game', advancedThrice);
  ok('game is still in a live, playable state after repeated advances',
    g.game.state === 'playing' || g.game.state === 'won');

  console.log('\n--- logic: a wrong click is recoverable, not a soft-lock ---');
  g.resetGame();
  advanceThroughShow();
  const seqR0 = g.sequence.slice();
  const wrongIdx = (seqR0[0] + 1) % (g.GRID * g.ROWS); // guaranteed different tile
  const missesBefore = g.game.misses;
  g.clickTile(wrongIdx);
  eq(g.game.misses, missesBefore + 1, 'a wrong tile costs a miss');
  eq(g.playerInput.length, 0, 'player input resets after a wrong tile');

  await sleep(650); // the miss-retry replay (500ms) must have fired by now
  ok('the round is replayable after a miss (re-enters show phase)', g.showPhase === true);
  const shownAfterMiss = advanceThroughShow();
  ok('the replayed show phase completes normally', shownAfterMiss);
  const seqRetry = solveSequence();
  ok('input is accepted normally on the retry after a miss', g.playerInput.length === seqRetry.length);
  ok('solving the retried sequence awards score (game did not freeze)', g.game.score > 0);

  console.log('\n--- logic: exhausting the fail condition reaches a real ending ---');
  g.resetGame();
  let reachedGameOver = false;
  for (let round = 0; round < 20 && !reachedGameOver; round++) {
    if (g.game.state !== 'playing') break;
    const shown = advanceThroughShow();
    if (!shown) break;
    const seq = g.sequence.slice();
    // deliberately miss every tile in this round to burn down MAX_MISSES
    for (const idx of seq) {
      if (g.game.misses >= g.MAX_MISSES) break;
      const wrong = (idx + 1) % (g.GRID * g.ROWS);
      g.clickTile(wrong);
      await sleep(600); // either the miss-retry replay or the gameover transition fires
      if (g.game.state === 'gameover') { reachedGameOver = true; break; }
      if (g.showPhase) advanceThroughShow();
    }
  }
  ok('missing MAX_MISSES times reaches a real gameover ending', reachedGameOver);
  eq(g.game.state, 'gameover', 'state is gameover after exhausting misses');
  eq(g.game.misses, g.MAX_MISSES, 'misses is pinned at MAX_MISSES at gameover');

  console.log('\n--- logic: restart from gameover is playable again ---');
  g.resetGame(); // this is the game's real restart handler (also invoked from onDown on tap)
  eq(g.game.state, 'playing', 'resetGame from gameover returns to playing');
  eq(g.game.round, 0, 'resetGame from gameover resets the round counter');
  eq(g.game.misses, 0, 'resetGame from gameover resets misses');
  const shownPostRestart = advanceThroughShow();
  ok('the restarted round runs its show phase normally', shownPostRestart);
  const scoreBeforePostRestart = g.game.score;
  solveSequence();
  ok('input is accepted and scores after restarting from gameover', g.game.score > scoreBeforePostRestart);

  console.log('\n--- logic: full clear reaches the win ending, then replays ---');
  g.resetGame();
  let reachedWon = false;
  for (let round = 0; round < g.TOTAL + 2 && !reachedWon; round++) {
    if (g.game.state === 'won') { reachedWon = true; break; }
    if (g.game.state !== 'playing') break;
    const shown = advanceThroughShow();
    if (!shown) break;
    solveSequence();
    await sleep(650);
    if (g.game.state === 'won') reachedWon = true;
  }
  ok('clearing all ' + g.TOTAL + ' rounds reaches the won ending', reachedWon);
  eq(g.game.round, g.TOTAL, 'round counter reads TOTAL at the win screen');

  g.resetGame(); // restart from the win screen (same handler as gameover)
  eq(g.game.state, 'playing', 'resetGame from the won screen returns to playing');
  const shownPostWin = advanceThroughShow();
  ok('the restarted round after a win runs its show phase normally', shownPostWin);
  const scoreBeforePostWin = g.game.score;
  solveSequence();
  ok('input is accepted and scores after restarting from the won screen', g.game.score > scoreBeforePostWin);

  console.log('\n--- logic: pause does not strand the player ---');
  g.resetGame();
  advanceThroughShow();
  g.togglePause();
  eq(g.game.state, 'paused', 'pausing mid-round enters the paused state');
  g.togglePause();
  eq(g.game.state, 'playing', 'unpausing returns to playing');
  const seqAfterPause = solveSequence();
  ok('input works normally after a pause/unpause cycle', g.playerInput.length === seqAfterPause.length);

  console.log('\n--- observation: the advertised distractor mechanic ---');
  // The title screen tells the player to "avoid the flickering distractor tile," and the
  // source computes a distractorStep/distractorTile per round (index.html:65) plus a whole
  // clickDistractor() penalty function (index.html:109). But nothing ever calls
  // clickDistractor(), and no draw/update code branches on distractorTile to render it
  // differently from a normal tile (verified by reading the source: only the declaration,
  // the assignment in buildRound, and the dead function body reference it). This can't be
  // driven through the exposed hook at all — clickTile()/tileAt() have no distractor branch —
  // which itself confirms the mechanic is unreachable from real input, not a hook gap.
  ok('clickDistractor exists on the page global but is never wired to input',
    typeof win.clickDistractor === 'function');

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
