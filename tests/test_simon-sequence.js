// jsdom Tier 2 playthrough suite for Value Sequence / "simon-sequence" (#32)
// Simon-style memory game: watch a sequence of value-lights, repeat it back;
// each round appends one more value. This suite drives the REAL loop through
// window.__cfq and asserts progression over time (not just single-step setup).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'simon-sequence', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }
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
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;          // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Replicates the game's own SHOW_DUR/PAUSE_DUR ramp (index.html: updateSpeedForLevel)
// so we can deterministically drive update() past the "showing" phase into
// "waiting for input" without needing a hook-exposed flag for it (there isn't one).
function stepDurationForLevel(level) {
  const shrink = Math.min(1, Math.max(0, level - 1) * 0.04);
  const SHOW_DUR = Math.max(220, Math.round(600 - (600 - 220) * shrink));
  const PAUSE_DUR = Math.max(110, Math.round(300 - (300 - 110) * shrink));
  return SHOW_DUR + PAUSE_DUR;
}
// Drive update() with clamped dt (game clamps to 0..48 internally) until the
// sequence has finished playing back and the game is ready to accept taps.
function advanceThroughShowing(margin = 300) {
  const step = stepDurationForLevel(g.game.level);
  const total = step * g.sequence.length + margin;
  let elapsed = 0;
  while (elapsed < total) { g.update(48); elapsed += 48; }
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'nextRound', 'playerTap', 'update', 'draw', 'peekSequence']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.VALUES));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.game.state, 'title', 'game starts on the title screen');
  eq(g.VALUES.length, 6, 'there are 6 value-lights');

  /* ======================= CORE LOOP ======================= */
  console.log('\n--- core loop: one round advances the game ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame() from title starts play');
  eq(g.game.level, 1, 'round starts at level 1');
  eq(g.sequence.length, 1, 'level 1 sequence has 1 step');
  eq(g.game.peekUsed, false, 'peek is unused at the start of a game');

  advanceThroughShowing();
  const seq1 = g.sequence.slice();
  g.playerTap(seq1[0]);
  eq(g.playerSeq.length, 1, 'a correct tap is accepted and recorded');
  ok('completing the sequence enters the resolving/advance state', g.game.resolving === true);

  await sleep(700); // the scheduled nextRound() (600ms) must have fired by now
  eq(g.game.level, 2, 'completing level 1 advances the level counter');
  eq(g.sequence.length, 2, 'the sequence grows by one element');
  eq(g.playerSeq.length, 0, 'playerSeq is cleared for the new round');
  eq(g.game.state, 'playing', 'still playing after advancing');
  ok('the new (longer) sequence still starts with the previous elements',
    g.sequence[0] === seq1[0]);

  /* ======================= THREE IN A ROW ======================= */
  console.log('\n--- three correct rounds in a row: still advancing, still accepting input ---');
  for (let round = 0; round < 3; round++) {
    const levelBefore = g.game.level;
    const lenBefore = g.sequence.length;
    advanceThroughShowing();
    const seq = g.sequence.slice();
    for (let i = 0; i < seq.length; i++) {
      const beforeTapLen = g.playerSeq.length;
      g.playerTap(seq[i]);
      ok(`round ${round + 1}: tap ${i + 1}/${seq.length} is accepted (input not frozen mid-sequence)`,
        g.playerSeq.length === beforeTapLen + 1 || i === seq.length - 1 /* last tap may trigger reset+resolving before we re-read */);
    }
    await sleep(700);
    eq(g.game.level, levelBefore + 1, `round ${round + 1}: level advances (was ${levelBefore})`);
    eq(g.sequence.length, lenBefore + 1, `round ${round + 1}: sequence length grows (was ${lenBefore})`);
    eq(g.game.state, 'playing', `round ${round + 1}: still playing, still accepting input`);
  }

  /* ======================= EXHAUST THE FAIL CONDITION ======================= */
  console.log('\n--- exhausting the fail condition reaches a real ending ---');
  const levelReached = g.game.level;
  advanceThroughShowing();
  const seqFail = g.sequence.slice();
  const correctFirst = seqFail[0];
  const wrongFirst = (correctFirst + 1) % g.VALUES.length;
  g.playerTap(wrongFirst);
  ok('a wrong tap is registered (resolving begins)', g.game.resolving === true);
  eq(g.playerSeq.length, 0, 'a wrong tap is not added to the player sequence');

  await sleep(700); // the scheduled game-over transition (600ms) must have fired
  eq(g.game.state, 'gameover', 'a wrong tap ends the game');
  eq(g.game.level, levelReached, 'the level counter freezes at the level reached on death');
  ok('the best score reflects the level reached', g.game.best >= levelReached);

  // a wrong tap after a correct partial sequence (mid-sequence failure) also ends the game
  console.log('\n--- mid-sequence wrong tap (not just tap 1) also ends the game ---');
  g.resetGame();
  // play up to level 3 so there is a sequence with more than one step to fail partway through
  for (let i = 0; i < 2; i++) {
    advanceThroughShowing();
    const seq = g.sequence.slice();
    for (const idx of seq) g.playerTap(idx);
    await sleep(700);
  }
  ok('reached a multi-step sequence to test a mid-sequence failure', g.sequence.length >= 3);
  advanceThroughShowing();
  const seqMid = g.sequence.slice();
  g.playerTap(seqMid[0]); // correct first tap
  eq(g.playerSeq.length, 1, 'first tap of the mid-sequence test is accepted');
  const wrongSecond = (seqMid[1] + 1) % g.VALUES.length;
  g.playerTap(wrongSecond); // wrong second tap
  await sleep(700);
  eq(g.game.state, 'gameover', 'a wrong tap partway through a longer sequence also ends the game');

  /* ======================= RESTART FROM THE ENDING ======================= */
  console.log('\n--- restart from gameover is playable again ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame() from gameover returns to playing');
  eq(g.game.level, 1, 'the restarted game begins at level 1 again');
  eq(g.sequence.length, 1, 'the restarted game has a fresh 1-step sequence');
  eq(g.game.peekUsed, false, 'peek is refreshed (unused) on restart');

  // prove it is not just a state label: actually complete a round after restarting
  advanceThroughShowing();
  const seqRestart = g.sequence.slice();
  for (const idx of seqRestart) g.playerTap(idx);
  await sleep(700);
  eq(g.game.level, 2, 'a round completed after restart genuinely advances the level');

  /* ======================= PEEK (the one hint/power-up path) ======================= */
  console.log('\n--- peek: advances rather than consuming and freezing ---');
  g.resetGame();
  // peek is only meant to work while waiting for input; calling it during the
  // initial "showing" playback should be refused, not silently consumed.
  g.peekSequence();
  eq(g.game.peekUsed, false, 'peek is refused while the sequence is still being shown (not yet consumed)');

  advanceThroughShowing();
  const levelAtPeek = g.game.level;
  const seqAtPeek = g.sequence.slice();
  g.peekSequence();
  eq(g.game.peekUsed, true, 'peek is consumed once used at the right time');

  // peek replays the sequence (re-enters showing); the player must still be able
  // to finish the round afterwards -- this is exactly the "consumes and freezes" bug shape.
  advanceThroughShowing();
  for (const idx of seqAtPeek) g.playerTap(idx);
  await sleep(700);
  eq(g.game.level, levelAtPeek + 1, 'the round completes normally after using peek (peek does not freeze input)');
  eq(g.game.state, 'playing', 'still playing after a peek-assisted round');

  // peek is one-use per game: a second call must not silently restart showing again
  // (which would swallow the very next tap because playerTap requires waitingInput).
  advanceThroughShowing();
  const seqAfterPeekUsed = g.sequence.slice();
  g.peekSequence(); // should be a no-op now (peekUsed already true)
  g.playerTap(seqAfterPeekUsed[0]);
  eq(g.playerSeq.length, 1, 'a second peek call does not re-arm showing and swallow the next tap');

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
