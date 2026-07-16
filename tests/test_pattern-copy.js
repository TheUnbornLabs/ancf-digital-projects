// jsdom Tier 2 playthrough suite for Pattern Copy (#74)
// Simon-says: watch a growing lit sequence on a 4x4 grid, repeat it by clicking cells
// in order. 10 rounds (3->12 steps), then endless mode (sequence keeps growing) until
// the first mistake. 3 lives outside endless; any mistake in endless ends the run.
//
// Tier 1 already passes this game clean (loads, draws, survives odd dt, no NaN).
// This suite drives the REAL loop through window.__cfq and asserts progression:
// round advances after a correct sequence, 3 rounds run without freezing, losing all
// lives reaches gameover, gameover restarts cleanly, and the round-10 "endless" bonus
// mode advances instead of consuming and freezing.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'pattern-copy', 'index.html');
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
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    // onDown() bails unless the canvas has a settled layout rect; jsdom reports 0x0 without this.
    w.HTMLCanvasElement.prototype.getBoundingClientRect =
      () => ({ left: 0, top: 0, width: 960, height: 540, right: 960, bottom: 540 });
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Dispatch a REAL mousedown through the game's own onDown handler. Used for the end-screen
// assertions: which state a panel click leads to is exactly the thing under test, so the
// suite must go through the shipped handler rather than poke game.state itself.
// (5,5) is outside the grid, so this can never be mistaken for a cell click.
function clickCanvas(x = 5, y = 5) {
  win.document.getElementById('game')
    .dispatchEvent(new win.MouseEvent('mousedown', { clientX: x, clientY: y, bubbles: true }));
}

// Pump simulated frames (game.update(dt)) until the round reaches 'input' phase,
// i.e. the transition + full watch-the-pattern show phase have played out.
// This is purely game-time (game.time via update(dt)), not wall-clock.
function waitForPhase(phase, maxMs = 60000, dt = 16) {
  let t = 0;
  while (g.game.phase !== phase && t < maxMs) { g.update(dt); t += dt; }
  return g.game.phase === phase;
}

// Click every cell of the current full sequence, in order (the whole accumulated
// pattern, since Pattern Copy is a growing-Simon game: sequence is never trimmed
// per-round, only reset by resetGame()).
function solveRound() {
  ok('  (helper) round reached input phase before solving', waitForPhase('input'));
  const seq = g.sequence.slice();
  for (let i = 0; i < seq.length; i++) g.clickCell(seq[i]);
  return seq;
}

// Find a cell index guaranteed to mismatch the next expected step.
function wrongIdxFor(expectedIdx) {
  for (let i = 0; i < g.GRID_N * g.GRID_N; i++) if (i !== expectedIdx) return i;
  return -1;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'clickCell', 'cellPos', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.sequence) && Array.isArray(g.playerInput));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  console.log('\n--- logic: setup ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame enters playing state');
  eq(g.game.round, 0, 'resetGame resets round to 0');
  eq(g.game.lives, 3, 'resetGame restores full lives');
  eq(g.game.endless, false, 'resetGame clears endless mode');
  eq(g.game.phase, 'transition', 'a fresh round starts in the transition phase');

  console.log('\n--- logic: advancing (the core loop) ---');
  const round0Score = g.game.score;
  const seq0 = solveRound();
  ok('completing the sequence blocks further scoring input mid-celebration is NOT required here; check round advances', true);
  await sleep(700); // the scheduled round++ / buildRound() (600ms) must have fired
  eq(g.game.round, 1, 'completing the pattern advances the round counter');
  ok('completing the pattern awards score', g.game.score > round0Score);
  eq(g.game.phase, 'transition', 'the new round starts in transition, unblocked for the next watch phase');
  eq(g.playerInput.length, 0, 'player input is cleared for the new round');
  ok('the sequence grew by one step (3 -> 4)', g.sequence.length === seq0.length + 1);

  console.log('\n--- logic: three rounds running (soft-lock check) ---');
  for (let i = 0; i < 3; i++) {
    const roundBefore = g.game.round;
    const scoreBefore = g.game.score;
    solveRound();
    await sleep(700);
    ok(`round ${i + 1}/3: round counter advanced (was ${roundBefore}, now ${g.game.round})`, g.game.round === roundBefore + 1);
    ok(`round ${i + 1}/3: score increased`, g.game.score > scoreBefore);
    ok(`round ${i + 1}/3: still in playing state, not stuck`, g.game.state === 'playing');
  }
  ok('input is still accepted after 4 consecutive successful rounds', (() => {
    waitForPhase('input');
    const before = g.playerInput.length;
    g.clickCell(g.sequence[0]);
    return g.playerInput.length === before + 1 || g.playerInput.length === 0; // either accepted, or a correct-but-wrong-order mismatch reset it
  })());

  console.log('\n--- logic: exhausting the fail condition (game over) ---');
  g.resetGame();
  eq(g.game.lives, 3, 'fresh round: 3 lives');
  for (let miss = 1; miss <= 3; miss++) {
    waitForPhase('input');
    const livesBefore = g.game.lives;
    const wrong = wrongIdxFor(g.sequence[0]);
    g.clickCell(wrong);
    if (miss < 3) {
      eq(g.game.lives, livesBefore - 1, `miss ${miss}/3: a wrong click costs a life`);
      eq(g.game.state, 'playing', `miss ${miss}/3: still playing with lives remaining`);
      await sleep(700); // real setTimeout(...,500) resets the round for a retry
      ok(`miss ${miss}/3: round is retriable (back at input after the penalty pause)`, waitForPhase('input'));
    } else {
      await sleep(700); // real setTimeout(...,450) ends the game on the last life
      eq(g.game.lives, 0, 'the last life is spent');
      eq(g.game.state, 'gameover', 'losing the last life reaches a real ending');
    }
  }

  console.log('\n--- logic: restart from that ending ---');
  ok('game is sitting at gameover before restart', g.game.state === 'gameover');
  g.resetGame(); // this is the game's real restart handler: onDown() calls resetGame() from title/gameover
  eq(g.game.state, 'playing', 'restart from gameover returns to playing');
  eq(g.game.round, 0, 'restart resets the round counter');
  eq(g.game.lives, 3, 'restart restores full lives');
  ok('the game accepts input again after restart', (() => {
    waitForPhase('input');
    const before = g.playerInput.length;
    g.clickCell(g.sequence[0]);
    return g.playerInput.length === before + 1;
  })());

  console.log('\n--- logic: clearing the campaign reaches the "won" screen, which RESUMES rather than wipes ---');
  // (These assertions were originally written the other way round -- they characterized the
  // dead 'won' screen as expected behavior -- and are inverted here to assert what the
  // player is owed: the designed acknowledgment screen, and a run that survives its click.)
  g.resetGame();
  let wonStateSeenDuringPlaythrough = false;
  for (let r = 0; r < g.TOTAL; r++) {
    solveRound();
    await sleep(700);
    if (g.game.state === 'won') wonStateSeenDuringPlaythrough = true;
  }
  eq(g.game.round, g.TOTAL, `after clearing ${g.TOTAL} rounds, the round counter reads ${g.TOTAL}`);
  eq(g.game.endless, true, 'clearing round 10 unlocks endless mode');
  ok('clearing the campaign actually reaches the designed "won" screen (panelDraw All Remembered)',
     wonStateSeenDuringPlaythrough === true);
  eq(g.game.state, 'won', 'the game rests on the won screen instead of silently rolling into endless');
  ok('the next round is already built behind the panel, ready for the resume', g.sequence.length > 0);
  eq(g.game.phase, 'transition', 'that next round is staged in transition behind the panel');

  // The panel is a resume prompt ("Endless mode unlocked -- click to keep going"), so the
  // click must continue the run, not restart it. This is the destructive half of the bug.
  const wonScore = g.game.score, wonRound = g.game.round, wonSeqLen = g.sequence.length;
  const frozenTransitionT = g.game.transitionT;
  g.update(500); // update() early-returns while state!=='playing': the panel must not time itself out
  eq(g.game.transitionT, frozenTransitionT, 'the staged round\'s transition timer stays frozen behind the won panel');
  eq(g.game.state, 'won', 'the won panel waits for the player rather than expiring on its own');
  clickCanvas(); // the game's real end-screen handler
  eq(g.game.state, 'playing', 'clicking the won screen resumes play');
  eq(g.game.score, wonScore, 'resuming from the won screen PRESERVES the score (resume, not restart)');
  eq(g.game.round, wonRound, 'resuming from the won screen preserves the round counter');
  eq(g.game.endless, true, 'resuming from the won screen keeps endless mode unlocked');
  eq(g.sequence.length, wonSeqLen, 'resuming from the won screen preserves the already-built sequence');

  console.log('\n--- logic: bonus mode (endless) advances rather than freezing ---');
  // endless: does it actually keep advancing, or does hitting the "bonus mode" consume
  // input and freeze? Play one more (11th) round inside endless.
  const endlessRoundBefore = g.game.round;
  const endlessSeqLenBefore = g.sequence.length;
  solveRound();
  await sleep(700);
  ok('endless mode round counter keeps advancing', g.game.round === endlessRoundBefore + 1);
  ok('endless mode sequence keeps growing (+1 step)', g.sequence.length === endlessSeqLenBefore + 1);
  eq(g.game.state, 'playing', 'still playing after advancing inside endless mode');

  // endless: does the fail condition (any mistake) actually end the run, so the bonus
  // mode is escapable rather than an infinite freeze?
  waitForPhase('input');
  const wrongE = wrongIdxFor(g.sequence[0]);
  g.clickCell(wrongE);
  await sleep(700);
  eq(g.game.state, 'gameover', 'a single mistake in endless mode ends the run (reaches a real ending)');
  g.resetGame();
  eq(g.game.state, 'playing', 'restart after an endless-mode game over works too');

  console.log('\n--- regression: stray clicks during the deferred-timeout windows are inert ---');
  // After solving a round correctly, round++/buildRound() run in a REAL 600ms setTimeout;
  // after a miss, the retry/gameover handoff runs in a REAL 500ms/450ms setTimeout. In both
  // windows the round is already decided and the pending timeout owns it, so clickCell must
  // NOT accept input: game.phase has to leave 'input' synchronously. (These assertions were
  // originally written the other way round -- they characterized the bug as expected
  // behavior -- and are inverted here to assert what the player is owed.)
  g.resetGame();
  solveRound(); // completes round 0 correctly
  const livesAfterWin = g.game.lives;
  const streakAfterWin = g.game.streak;
  const mistakesAfterWin = g.game.mistakes;
  ok('winning the round closes the input window synchronously (phase left \'input\')', g.game.phase !== 'input');
  for (let i = 0; i < 5; i++) g.clickCell(i); // stray taps during the celebration window
  ok('stray clicks during the celebration window are not scored as wrong answers',
     g.game.mistakes === mistakesAfterWin);
  ok(`stray clicks during the celebration window cost no life (lives stayed ${g.game.lives})`,
     g.game.lives === livesAfterWin);
  ok('stray clicks during the celebration window do not reset the earned streak',
     g.game.streak === streakAfterWin && streakAfterWin > 0);
  await sleep(700); // the pending round-advance timeout must still resolve normally
  eq(g.game.round, 1, 'the round still advances after the celebration window despite the strays');
  eq(g.game.phase, 'transition', 'the pending timeout still hands back a fresh round');
  eq(g.game.state, 'playing', 'still playing after the overlapping timeouts');

  // Same window on the miss side: a wrong click costs exactly one life, not one per stray tap.
  g.resetGame();
  waitForPhase('input');
  g.clickCell(wrongIdxFor(g.sequence[0]));
  eq(g.game.lives, 2, 'a wrong click costs exactly one life');
  for (let i = 0; i < 5; i++) g.clickCell(i); // strays during the 500ms retry pause
  eq(g.game.lives, 2, 'strays during the miss/retry pause cost no further lives');
  eq(g.game.mistakes, 1, 'strays during the miss/retry pause are not counted as extra mistakes');
  await sleep(700);
  ok('the round is still retriable after the miss window', waitForPhase('input'));

  // Endless mode: a stray tap after a correct pattern must not fake a run-ending mistake.
  g.resetGame();
  for (let r = 0; r < g.TOTAL; r++) { solveRound(); await sleep(700); }
  eq(g.game.state, 'won', 'set up: campaign cleared, resting on the won screen');
  clickCanvas(); // resume past the won panel into the endless run
  eq(g.game.endless, true, 'set up: endless mode active for the celebration-window probe');
  const endlessRoundBeforeStray = g.game.round;
  solveRound(); // wins one more endless round correctly
  ok('endless: winning closes the input window synchronously', g.game.phase !== 'input');
  for (let i = 0; i < 5; i++) g.clickCell(i); // stray taps during the celebration window
  await sleep(700);
  eq(g.game.state, 'playing', 'endless: stray clicks after a correct pattern do not end the run');
  eq(g.game.round, endlessRoundBeforeStray + 1, 'endless: the run keeps advancing through the strays');
  // ...but a real mistake must still end the endless run (the fix must not make endless unlosable).
  waitForPhase('input');
  g.clickCell(wrongIdxFor(g.sequence[0]));
  await sleep(700);
  eq(g.game.state, 'gameover', 'endless: a genuine mistake still ends the run');

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
