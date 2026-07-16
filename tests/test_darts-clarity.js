// jsdom Tier 2 playthrough suite for Darts of Clarity (#56)
// Core loop: aim (mouse/touch) -> throwDart(x,y) -> dart lands -> score/streak update ->
// dartsLeft decrements -> at 0 darts, state becomes 'won' after a 600ms setTimeout.
// Restart handler (from onDown): state==='title'||state==='won' -> resetGame().
// Drives the game through window.__cfq exactly as a player's clicks would, using the
// same resetGame()/throwDart() functions the real input handlers call.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'darts-clarity', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }
function eqArr(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b)); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- canvas 2D context stub (jsdom returns null for getContext) ----
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
    w.requestAnimationFrame = () => 0;   // disable the real rAF loop; we drive update()/draw() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;          // silence Web Audio (tone() no-ops if AC() returns null)
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Deterministic aim: throwDart() offsets the throw by (Math.random()-.5)*wob*2, using the
// *jsdom window's* Math object (scripts run in the jsdom realm, not Node's global realm --
// overriding Node's global Math.random has NO effect on the game; it must be win.Math.random).
// Forcing win.Math.random() -> 0.5 collapses the offset to exactly 0, so a throw at (ax,ay)
// lands EXACTLY at (ax,ay) regardless of wobble, letting us place darts at exact distances
// from the board centre without flaky randomness.
const realRandom = win.Math.random;
function withCenteredAim(fn) {
  win.Math.random = () => 0.5;
  try { return fn(); } finally { win.Math.random = realRandom; }
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API',
    ['resetGame', 'throwDart', 'update', 'draw', 'togglePause', 'toggleMute', 'currentWobble']
      .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state and rings', !!g.game && Array.isArray(g.RINGS) && g.RINGS.length > 0);
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.TOTAL_DARTS, 10, 'round is 10 darts');

  let drewOk = true;
  g.resetGame();
  for (const st of ['title', 'playing', 'paused', 'won']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  g.resetGame();
  ok('draw() runs in every state without throwing', drewOk);

  console.log('\n--- logic: setup ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame sets state to playing');
  eq(g.game.score, 0, 'resetGame resets score');
  eq(g.game.dartsLeft, g.TOTAL_DARTS, 'resetGame restores all 10 darts');
  eq(g.darts.length, 0, 'resetGame clears thrown darts');
  eq(g.game.streak, 0, 'resetGame clears streak');

  /* ======================= CORE LOOP: ADVANCEMENT ======================= */
  console.log('\n--- logic: core action advances (catches soft-locks) ---');
  g.resetGame();
  const dartsBefore = g.game.dartsLeft;
  const scoreBefore = g.game.score;
  withCenteredAim(() => g.throwDart(g.CX, g.CY));
  eq(g.game.dartsLeft, dartsBefore - 1, 'a single throw consumes exactly one dart');
  ok('a bullseye-aimed throw scores points', g.game.score > scoreBefore);
  eq(g.darts.length, 1, 'the thrown dart is recorded');
  eq(g.game.state, 'playing', 'still playing after one throw (round not over)');

  console.log('\n--- logic: three throws in a row, still advancing, still accepting input ---');
  g.resetGame();
  const scores = [g.game.score];
  const dartsLeftSeq = [g.game.dartsLeft];
  for (let i = 0; i < 3; i++) {
    withCenteredAim(() => g.throwDart(g.CX, g.CY));
    scores.push(g.game.score);
    dartsLeftSeq.push(g.game.dartsLeft);
  }
  eqArr(dartsLeftSeq, [10, 9, 8, 7], 'dartsLeft counts down 10 -> 9 -> 8 -> 7 across three throws');
  ok('score strictly increases after each of the three throws',
    scores[1] > scores[0] && scores[2] > scores[1] && scores[3] > scores[2]);
  eq(g.game.state, 'playing', 'still playing (input still accepted) after three throws');

  /* ======================= CORE SCORING BUG (found while driving the loop) ======================= */
  console.log('\n--- logic: inner rings must award more than outer rings (dartboard value hierarchy) ---');
  // The board defines 5 concentric rings with DECREASING radius and INCREASING value:
  //   Clarity r<=30 = 50pts, Focus r<=60 = 30pts, Purpose r<=100 = 20pts,
  //   Intention r<=150 = 10pts, Awareness r<=200 = 5pts.
  // A dead-center hit (d=0) is the most precise shot possible and should score the Clarity
  // max, 50pts. throwDart's ring-detection loop (index.html:125-126) reads:
  //   for(let i=RINGS.length-1;i>=0;i--){ if(d<=RINGS[i].r){...break;} }
  // which starts at i=4 (Awareness, the LARGEST radius, r=200) and breaks on the FIRST match.
  // Since d<=200 is true for essentially every on-board hit, it matches Awareness immediately
  // and never evaluates the smaller, higher-value rings underneath it.
  function ringHit(dist) {
    g.resetGame();
    return withCenteredAim(() => { g.throwDart(g.CX + dist, g.CY); return { pts: g.darts[0].pts, label: g.darts[0].label }; });
  }
  const centerHit = ringHit(0);
  eq(centerHit.label, 'Clarity', 'a dead-center hit (d=0) is labelled Clarity, the innermost ring');
  eq(centerHit.pts, 50, 'a dead-center hit scores the Clarity max (50pts)');

  const r20 = ringHit(20);   // inside r=30 Clarity ring
  const r50 = ringHit(50);   // inside r=60 Focus ring
  const r90 = ringHit(90);   // inside r=100 Purpose ring
  const r140 = ringHit(140); // inside r=150 Intention ring
  const r190 = ringHit(190); // inside r=200 Awareness ring
  const r210 = ringHit(210); // outside all rings -> miss
  eq(r20.pts, 50, 'a hit 20px from centre (inside the Clarity ring) scores 50');
  eq(r50.pts, 30, 'a hit 50px from centre (inside the Focus ring) scores 30');
  eq(r90.pts, 20, 'a hit 90px from centre (inside the Purpose ring) scores 20');
  eq(r140.pts, 10, 'a hit 140px from centre (inside the Intention ring) scores 10');
  eq(r190.pts, 5, 'a hit 190px from centre (inside the Awareness ring) scores 5');
  eq(r210.pts, 0, 'a hit 210px from centre (outside every ring) is a genuine miss');
  ok('a more precise shot scores strictly more than a less precise one (value hierarchy holds)',
    r20.pts > r50.pts && r50.pts > r90.pts && r90.pts > r140.pts && r140.pts > r190.pts);

  console.log('\n--- logic: streak/combo bonus (requires landing in Clarity or Focus) ---');
  g.resetGame();
  withCenteredAim(() => g.throwDart(g.CX, g.CY)); // dead-center: should be a "high value" hit
  eq(g.game.streak, 1, 'a dead-center bullseye counts as a high-value hit and starts a streak');
  withCenteredAim(() => g.throwDart(g.CX, g.CY));
  withCenteredAim(() => g.throwDart(g.CX, g.CY));
  eq(g.game.streak, 3, 'three consecutive dead-center bullseyes build a streak of 3');
  ok('the streak bonus adds extra points beyond the third consecutive bullseye',
    g.game.score > 150); // 3 x 50 with no bonus would be exactly 150

  console.log('\n--- logic: a miss breaks the streak but still advances ---');
  g.resetGame();
  withCenteredAim(() => g.throwDart(g.CX, g.CY));
  const missScore = g.game.score;
  withCenteredAim(() => g.throwDart(-5000, -5000)); // guaranteed miss, far off the board
  eq(g.game.streak, 0, 'a miss resets the streak');
  eq(g.game.score, missScore, 'a miss adds no points');
  eq(g.game.dartsLeft, g.TOTAL_DARTS - 2, 'a miss still consumes a dart (round still advances)');
  ok('input is still accepted immediately after a miss', (() => {
    const before = g.game.dartsLeft;
    withCenteredAim(() => g.throwDart(g.CX, g.CY));
    return g.game.dartsLeft === before - 1;
  })());

  /* ======================= EXHAUST FAIL CONDITION: REACH A REAL ENDING ======================= */
  console.log('\n--- logic: exhausting all darts (all bullseyes) reaches a real ending ---');
  g.resetGame();
  withCenteredAim(() => { for (let i = 0; i < g.TOTAL_DARTS; i++) g.throwDart(g.CX, g.CY); });
  eq(g.game.dartsLeft, 0, 'all 10 darts are spent');
  eq(g.game.state, 'playing', 'state has not flipped to won yet (the transition is on a 600ms timeout)');
  await sleep(700);
  eq(g.game.state, 'won', 'after the timeout, state becomes won (a real ending is reached)');
  ok('a completed round with all bullseyes has a nonzero final score', g.game.score > 0);

  console.log('\n--- logic: exhausting all darts (all misses) also reaches the ending (skill-independent) ---');
  g.resetGame();
  withCenteredAim(() => { for (let i = 0; i < g.TOTAL_DARTS; i++) g.throwDart(-5000, -5000); });
  eq(g.game.dartsLeft, 0, 'all 10 darts are spent even when every throw misses');
  await sleep(700);
  eq(g.game.state, 'won', 'the round-complete screen is reached even with 0 hits (ending is not luck-gated)');
  eq(g.game.score, 0, 'an all-miss round ends with score 0');

  console.log('\n--- logic: throwing beyond dartsLeft=0 is refused, not crashed ---');
  const dartsLenBefore = g.darts.length;
  withCenteredAim(() => g.throwDart(g.CX, g.CY));
  eq(g.darts.length, dartsLenBefore, 'a throw after the round ended is a no-op (guarded by dartsLeft<=0)');

  /* ======================= RESTART FROM THE ENDING ======================= */
  console.log('\n--- logic: restart from the ending is playable again ---');
  // This is exactly what the real onDown() handler does when state is 'won': resetGame().
  g.resetGame();
  eq(g.game.state, 'playing', 'restart from won returns to playing');
  eq(g.game.dartsLeft, g.TOTAL_DARTS, 'restart from won gives back all 10 darts');
  eq(g.game.score, 0, 'restart from won resets score to 0');
  eq(g.darts.length, 0, 'restart from won clears the thrown-darts list');
  ok('input is accepted immediately on the new round (no leftover soft-lock)', (() => {
    const before = g.game.dartsLeft;
    withCenteredAim(() => g.throwDart(g.CX, g.CY));
    return g.game.dartsLeft === before - 1 && g.game.score > 0;
  })());

  console.log('\n--- logic: a second full playthrough end-to-end also completes cleanly ---');
  g.resetGame();
  withCenteredAim(() => { for (let i = 0; i < g.TOTAL_DARTS; i++) g.throwDart(g.CX, g.CY); });
  await sleep(700);
  eq(g.game.state, 'won', 'a second consecutive full round also reaches won');
  g.resetGame();
  eq(g.game.state, 'playing', 'a third restart after the second round is playable again');

  console.log('\n--- logic: best score persists across restarts (0 = "no record", not Infinity) ---');
  // Confirm this game's sentinel: loadBest() returns 0 (not Infinity) when nothing is stored yet,
  // so we assert against 0, avoiding the Infinity-sentinel false-positive class from PROTOCOL.md.
  g.resetGame();
  withCenteredAim(() => { for (let i = 0; i < g.TOTAL_DARTS; i++) g.throwDart(g.CX, g.CY); });
  await sleep(700);
  const bestAfterRound1 = g.game.best;
  ok('best score updates after a scoring round (no-record sentinel is 0, not Infinity)', bestAfterRound1 > 0);
  g.resetGame();
  eq(g.game.best, bestAfterRound1, 'best score survives a restart (only score/dartsLeft/darts reset)');
  const stored = win.localStorage.getItem(g.LS_KEY);
  eq(parseInt(stored, 10), bestAfterRound1, 'best score is persisted to localStorage under LS_KEY');

  /* ======================= "POWER-UP" PATH: DELIBERATE-AIM DWELL BONUS ======================= */
  console.log('\n--- logic: the dwell/aim-hold bonus recharges every dart, never freezes ---');
  g.resetGame();
  eq(g.game.aimHoldMs, 0, 'aimHoldMs starts at 0');
  for (let i = 0; i < 100; i++) g.update(16); // ~1600ms of holding aim while playing
  ok('aimHoldMs accumulates while playing (dwell bonus is charging)', g.game.aimHoldMs > 0);
  const heldMs = g.game.aimHoldMs;
  withCenteredAim(() => g.throwDart(g.CX, g.CY));
  eq(g.game.aimHoldMs, 0, 'throwing spends the dwell bonus (aimHoldMs resets to 0), it is not left stuck');
  for (let i = 0; i < 50; i++) g.update(16); // ~800ms
  ok('aimHoldMs recharges again after being spent (not a one-shot power-up that freezes)', g.game.aimHoldMs > 0 && g.game.aimHoldMs !== heldMs);
  ok('aimHoldMs is clamped, does not grow unbounded', (() => {
    for (let i = 0; i < 500; i++) g.update(16); // ~8000ms, well past any cap
    return g.game.aimHoldMs <= 4000;
  })());

  console.log('\n--- logic: pause blocks throws but never permanently freezes input ---');
  g.resetGame();
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause enters the paused state');
  const dartsLeftPaused = g.game.dartsLeft;
  withCenteredAim(() => g.throwDart(g.CX, g.CY));
  eq(g.game.dartsLeft, dartsLeftPaused, 'a throw while paused is refused (state guard), not consumed');
  g.togglePause();
  eq(g.game.state, 'playing', 'togglePause resumes back to playing');
  withCenteredAim(() => g.throwDart(g.CX, g.CY));
  eq(g.game.dartsLeft, dartsLeftPaused - 1, 'input is accepted again immediately after resuming (no lingering freeze)');

  console.log('\n--- observation: the score multiplier field never rises above 1 ---');
  // Independent of the ring bug above: game.multiplier is initialised to 1, clamped to
  // [1,4] on every hit, and reset to 1 on every miss -- but no code path anywhere in the
  // file ever increments it. It is permanently inert dead code; not user-facing (the UI
  // never shows the word "multiplier"), so this is a low-severity note, not a progression bug.
  g.resetGame();
  withCenteredAim(() => { for (let i = 0; i < 5; i++) g.throwDart(g.CX, g.CY); });
  eq(g.game.multiplier, 1, 'game.multiplier stays at 1 even after 5 consecutive bullseyes/streak growth (see report)');

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
