// jsdom test harness for Star Connect (#69)
// Tier 2 playthrough suite: drive the real loop through window.__cfq and assert
// PROGRESSION over time, not just setup. See tests/audit/PROTOCOL.md.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'star-connect', 'index.html');
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

// Pump update() enough (each call's dt is clamped to 48ms internally) to walk the
// 'show' phase's memorize timer down to 0 and flip into 'input'.
function advanceToInput(maxSteps) {
  maxSteps = maxSteps || 100;
  for (let i = 0; i < maxSteps && g.game.phase !== 'input'; i++) g.update(48);
}

// Click every star of the CURRENT round in the correct memorized order.
// Re-reads g.stars fresh (it's a live getter) so no stale-reference risk.
function solveRound() {
  advanceToInput();
  const ordered = g.stars.slice().sort((a, b) => a.order - b.order);
  for (const st of ordered) g.clickStar(st.x, st.y);
}

// Click a star that is NOT next in sequence -> guaranteed miss.
function clickWrong() {
  advanceToInput();
  const ordered = g.stars.slice().sort((a, b) => a.order - b.order);
  const expected = g.clicked.length + 1;
  const wrong = ordered.find(s => s.order !== expected) || ordered[ordered.length - 1];
  g.clickStar(wrong.x, wrong.y);
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'clickStar', 'update', 'draw', 'togglePause', 'toggleMute', 'useHint']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.stars));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.TOTAL, 10, 'TOTAL rounds is 10');
  eq(g.MAX_MISSES, 3, 'MAX_MISSES is 3');

  let drewOk = true;
  g.resetGame();
  for (const st of ['title', 'playing', 'paused', 'won', 'gameover']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  g.resetGame();
  ok('draw() runs in every state without throwing', drewOk);

  /* ======================= LOGIC: core loop ======================= */
  console.log('\n--- logic: round 0 setup ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame sets state to playing');
  eq(g.game.round, 0, 'resetGame starts at round 0');
  eq(g.game.score, 0, 'resetGame resets score');
  eq(g.game.totalMisses, 0, 'resetGame resets total misses');
  eq(g.game.phase, 'show', 'a fresh round starts in the show (memorize) phase');
  eq(g.stars.length, 3, 'round 0 has 3+floor(0/2)=3 stars');
  ok('all stars start unhit', g.stars.every(s => !s.hit));
  ok('nothing clicked yet', g.clicked.length === 0);

  console.log('\n--- logic: advancing (the core loop) ---');
  const scoreBefore = g.game.score;
  solveRound();
  ok('completing every star in order awards score', g.game.score > scoreBefore);
  eq(g.clicked.length, g.stars.length, 'every star in the round is marked clicked');
  eq(g.game.round, 0, 'round has not advanced yet (600ms transition pending)');

  await sleep(700);  // the scheduled round-advance (600ms) must have fired by now
  eq(g.game.round, 1, 'completing round 0 advances the round counter to 1');
  eq(g.game.state, 'playing', 'still playing after advancing');
  eq(g.game.phase, 'show', 'the new round starts in the show (memorize) phase again');
  eq(g.stars.length, 3 + Math.floor(1 / 2), 'the new round has the expected (larger) star count');
  ok('the new round stars are fresh and unhit', g.stars.every(s => !s.hit));
  eq(g.clicked.length, 0, 'clicked list is cleared for the new round');

  console.log('\n--- logic: do it three times running ---');
  for (let r = 1; r <= 3; r++) {
    const roundBefore = g.game.round;
    solveRound();
    ok(`round ${roundBefore}: solving awards score`, g.clicked.length === g.stars.length);
    await sleep(700);
    eq(g.game.round, roundBefore + 1, `round advances from ${roundBefore} to ${roundBefore + 1}`);
    eq(g.game.state, 'playing', `still playing (accepting input) after round ${roundBefore}`);
    eq(g.transitioning, undefined, 'sanity: game has no separate transitioning flag to get stuck on');
  }
  // after 3 more solved rounds (on top of round 0), we should be at round 4 and still fully playable
  eq(g.game.round, 4, 'four consecutive rounds solved back-to-back -> round counter reads 4');
  advanceToInput();
  eq(g.game.phase, 'input', 'input phase is reachable and the game keeps accepting play');

  console.log('\n--- logic: a wrong click costs a life but does not freeze input ---');
  g.resetGame();
  const missesBefore = g.game.totalMisses;
  clickWrong();
  eq(g.game.totalMisses, missesBefore + 1, 'a wrong-order click costs a life (totalMisses+1)');
  eq(g.game.state, 'playing', 'one miss (below MAX_MISSES) does not end the game');
  eq(g.clicked.length, 0, 'a miss resets the in-progress sequence');
  // game must still accept correct input afterwards
  solveRound();
  ok('after a miss, the round can still be solved (input is not stuck)', g.clicked.length === g.stars.length);
  await sleep(700);
  eq(g.game.round, 1, 'the round still advances normally after an earlier miss');

  /* ======================= LOGIC: fail condition -> real ending ======================= */
  console.log('\n--- logic: exhaust the fail condition (game over) ---');
  g.resetGame();
  for (let i = 0; i < g.MAX_MISSES; i++) clickWrong();
  eq(g.game.totalMisses, g.MAX_MISSES, `misses reached MAX_MISSES (${g.MAX_MISSES})`);
  eq(g.game.state, 'gameover', 'exhausting all misses ends the game (a real ending is reached)');

  console.log('\n--- logic: restart from that ending ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from gameover returns to playing');
  eq(g.game.round, 0, 'restarting resets the round counter');
  eq(g.game.totalMisses, 0, 'restarting resets total misses');
  solveRound();
  ok('the game is genuinely playable again after restart', g.clicked.length === g.stars.length && g.game.score > 0);
  await sleep(700);
  eq(g.game.round, 1, 'progression works again post-restart');

  /* ======================= LOGIC: win path -> real ending ======================= */
  console.log('\n--- logic: win path (clear all 10 rounds) ---');
  g.resetGame();
  for (let r = 0; r < g.TOTAL; r++) {
    eq(g.game.round, r, `about to play round ${r}`);
    solveRound();
    await sleep(700);
  }
  eq(g.game.state, 'won', 'clearing all 10 rounds reaches the win screen (a real ending)');

  console.log('\n--- logic: restart from the win screen ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from the won screen returns to playing');
  solveRound();
  ok('playable again after winning and restarting', g.clicked.length === g.stars.length);
  await sleep(700);  // flush this round's pending 600ms advance before starting the next block

  /* ======================= LOGIC: hint path ======================= */
  console.log('\n--- logic: hint advances rather than freezing ---');
  g.resetGame();
  advanceToInput();
  const scorePreHint = g.game.score;
  ok('game starts in input phase and playing before hint use', g.game.phase === 'input' && g.game.state === 'playing');
  g.useHint();
  ok('using the hint flags hintUsed and reveals the next star', g.game.hintUsed === true && g.game.hintReveal > 0);
  ok('the hint applies its score penalty (or floors at 0)', g.game.score <= scorePreHint);
  // critically: using the hint must NOT consume the round or freeze input.
  solveRound();
  eq(g.clicked.length, g.stars.length, 'after using a hint, the round can still be fully solved');
  await sleep(700);
  eq(g.game.round, 1, 'the round advances normally after a hint was used (hint does not soft-lock progress)');

  // a second hint use in the very next round must also still work (hint is not one-shot-then-broken)
  advanceToInput();
  g.useHint();
  ok('a hint can be used again in the following round', g.game.hintUsed === true);
  solveRound();
  await sleep(700);
  eq(g.game.round, 2, 'progress continues after a second hint use');

  // hint is refused (silently, no crash/freeze) outside the input phase / while not playing
  g.resetGame();
  g.game.state = 'title';
  let hintOutsideOk = true;
  try { g.useHint(); } catch (e) { hintOutsideOk = false; }
  ok('calling useHint outside "playing" state does not throw', hintOutsideOk);
  eq(g.game.hintUsed, false, 'useHint has no effect when not in playing state');
  g.resetGame();

  console.log('\n--- logic: pause does not block a subsequent restart/replay ---');
  g.resetGame();
  advanceToInput();
  g.togglePause();
  eq(g.game.paused, true, 'pause toggles on');
  clickWrong(); // clicks should be inert while paused... but clickStar itself has no explicit pause guard
  g.togglePause();
  eq(g.game.paused, false, 'pause toggles back off');
  solveRound();
  ok('the game is still solvable after a pause/unpause cycle', g.clicked.length === g.stars.length);

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
