// jsdom test harness for Photo Arrange (#50)
// Tier 2 playthrough: drag-and-drop polaroid photos into album slots, 6 rounds.
// Drives the real loop through window.__cfq (snapToSlot is the actual drop handler
// invoked by onUp; resetGame is the actual handler invoked by onDown from title/won).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'photo-arrange', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- canvas 2D context stub (same shape as the house reference) ----
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
    w.AudioContext = undefined;          // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Drop every currently-scattered photo onto its correct slot (idx === slot index).
function solveRoundCorrectly() {
  const list = g.photos.slice();
  for (const p of list) g.snapToSlot(p, p.idx);
}

// Drop every photo onto the WRONG slot (a fixed-point-free cyclic shift), so the
// round still finishes (every photo gets *a* slot) but nothing is correct.
function solveRoundAllWrong() {
  const list = g.photos.slice();
  const n = list.length;
  for (const p of list) g.snapToSlot(p, (p.idx + 1) % n);
}

function allPlaced() { return g.photos.every(p => p.slotIdx >= 0); }

// Fire the canvas's real mousedown handler (this is what onDown actually is bound to;
// for state 'title'/'won' it calls resetGame() and returns before touching coordinates).
function realClickCanvas() {
  const canvas = win.document.getElementById('game');
  canvas.dispatchEvent(new win.MouseEvent('mousedown', { clientX: 480, clientY: 270, bubbles: true, cancelable: true }));
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'snapToSlot', 'slotAt', 'checkDone',
    'hitPhoto', 'update', 'draw', 'togglePause', 'toggleMute', 'useHint']
    .every(k => typeof g[k] === 'function'));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  eq(g.ALBUMS.length, 6, 'there are 6 albums (6 rounds)');
  ok('every album has exactly 5 photos', g.ALBUMS.every(a => a.photos.length === 5));
  ok('album names are unique', new Set(g.ALBUMS.map(a => a.name)).size === g.ALBUMS.length);

  eq(g.game.state, 'title', 'game boots on the title screen');

  console.log('\n--- smoke: draw/update tolerate odd input ---');
  let drewOk = true;
  for (const st of ['title', 'playing', 'won']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  ok('draw() runs in every state without throwing', drewOk);
  g.game.state = 'title';

  let updateOk = true;
  try { for (const dt of [0, 16, 16.7, 1000, -5]) g.update(dt); } catch (e) { updateOk = false; console.log('    update threw: ' + e.message); }
  ok('update() tolerates odd dt', updateOk);

  /* ======================= CORE LOOP ======================= */
  console.log('\n--- core loop: real click starts the game from title ---');
  realClickCanvas();
  eq(g.game.state, 'playing', 'clicking the title screen starts round 1 (real onDown handler)');
  eq(g.game.round, 1, 'round is 1 at the start');
  eq(g.game.score, 0, 'score starts at 0');

  console.log('\n--- core loop: completing a round ADVANCES it ---');
  const round0 = g.game.round;
  ok('round starts with all 5 photos scattered (none slotted)', g.photos.length === 5 && g.photos.every(p => p.slotIdx < 0));
  solveRoundCorrectly();
  ok('every photo now has a slot', allPlaced());
  ok('completing the round flags transitioning (input should pause for the animation)', g.game.transitioning === true);
  ok('completing the round starts the correct-flash animation', g.game.correctAnim > 0);

  await sleep(800); // the scheduled round-advance (700ms) must have fired by now
  eq(g.game.round, round0 + 1, 'the round actually advanced after the transition');
  eq(g.game.state, 'playing', 'still playing after advancing to the next round');
  eq(g.game.transitioning, false, 'input is unblocked on the new round');
  ok('the new round has a fresh, fully-scattered photo set', g.photos.length === 5 && g.photos.every(p => p.slotIdx < 0));

  console.log('\n--- core loop: do it repeatedly -> still advancing, still accepting input ---');
  let lastRound = g.game.round;
  let stuck = false;
  for (let i = 0; i < 3; i++) {
    solveRoundCorrectly();
    ok(`round ${lastRound}: all photos placed`, allPlaced());
    await sleep(800);
    if (g.game.round !== lastRound + 1) { stuck = true; break; }
    eq(g.game.transitioning, false, `round ${lastRound}: input is unblocked after advancing`);
    lastRound = g.game.round;
  }
  ok('three consecutive rounds each advanced by exactly one (no soft-lock)', !stuck);

  console.log('\n--- core loop: exhaust every round -> reach a real ending ---');
  let guard = 0;
  while (g.game.state === 'playing' && guard < 10) {
    solveRoundCorrectly();
    await sleep(800);
    guard++;
  }
  eq(g.game.state, 'won', 'clearing all 6 rounds reaches the won screen');
  ok('the won screen was reached in a bounded number of rounds', guard < 10);

  console.log('\n--- restart from the ending ---');
  const scoreAtWin = g.game.score;
  realClickCanvas();
  eq(g.game.state, 'playing', 'clicking the won screen restarts (real onDown handler)');
  eq(g.game.round, 1, 'round resets to 1 on restart');
  eq(g.game.score, 0, 'score resets to 0 on restart');
  ok('the score achieved before restart was a real, positive score', scoreAtWin > 0);

  // playable again, not just reset
  solveRoundCorrectly();
  await sleep(800);
  eq(g.game.round, 2, 'after restart, the game is genuinely playable (round advances again)');

  /* ======================= HINT PATH ======================= */
  console.log('\n--- hint path: advances rather than consuming and freezing ---');
  g.resetGame();
  eq(g.game.hintsLeft, 3, 'a fresh game grants 3 hints');
  g.useHint();
  eq(g.game.hintsLeft, 2, 'using a hint spends one');
  ok('using a hint glows a target photo', g.game.hintGlowIdx >= 0 && g.game.hintGlowT > 0);

  // the round must still be completable after a hint is used
  solveRoundCorrectly();
  ok('after using a hint, the round can still be completed', allPlaced());
  await sleep(800);
  eq(g.game.round, 2, 'the round advanced normally after a hint was used');
  eq(g.game.transitioning, false, 'input is unblocked after a hinted round advances');

  // exhaust hints entirely
  g.useHint(); g.useHint();
  eq(g.game.hintsLeft, 0, 'hints can be exhausted to 0');
  const glowBefore = g.game.hintGlowIdx;
  g.useHint(); // no hints left; must be refused, not throw
  eq(g.game.hintsLeft, 0, 'using a hint with none left is refused (stays at 0)');

  // and the game must remain fully playable with zero hints left
  solveRoundCorrectly();
  ok('with hints exhausted, the round can still be completed', allPlaced());
  await sleep(800);
  eq(g.game.round, 3, 'the round still advances with zero hints remaining (no freeze)');

  /* ======================= MISTAKES DO NOT SOFT-LOCK ======================= */
  console.log('\n--- an all-wrong round still finishes (mistakes are penalised, not fatal) ---');
  const roundBeforeWrong = g.game.round;
  const scoreBeforeWrong = g.game.score;
  solveRoundAllWrong();
  ok('every photo still ends up in *a* slot even when every match is wrong', allPlaced());
  ok('an all-wrong round still flags transitioning (it still completes)', g.game.transitioning === true);
  await sleep(800);
  eq(g.game.round, roundBeforeWrong + 1, 'an all-wrong round still advances to the next round');
  eq(g.game.transitioning, false, 'input is unblocked after an all-wrong round advances');
  ok('score never goes negative from mistake penalties', g.game.score >= 0);
  ok('score does not need to increase on an all-wrong round (sanity, not a hard requirement)', g.game.score >= scoreBeforeWrong);

  /* ======================= BUMPED PHOTO IS NOT LOST ======================= */
  console.log('\n--- dropping a second photo on an occupied slot bumps the first one back (not lost) ---');
  g.resetGame();
  const [p0, p1, p2, p3, p4] = g.photos.slice();
  g.snapToSlot(p0, 0);
  eq(p0.slotIdx, 0, 'first photo occupies slot 0');
  g.snapToSlot(p1, 0); // bump p0 out
  eq(p1.slotIdx, 0, 'second photo now occupies slot 0');
  eq(p0.slotIdx, -1, 'the bumped photo is returned to the unslotted pool, not stranded');
  ok('the round is not falsely considered done while a photo is bumped out', !allPlaced());

  // recover: place the bumped photo and everyone else so the round can still finish
  g.snapToSlot(p0, 1);
  g.snapToSlot(p2, 2);
  g.snapToSlot(p3, 3);
  g.snapToSlot(p4, 4);
  ok('after recovering the bumped photo, every photo has a slot', allPlaced());
  ok('the round completes normally after a bump-and-recover sequence', g.game.transitioning === true);
  await sleep(800);
  eq(g.game.state, 'playing', 'still playing after the bump-recovery round advances');

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
