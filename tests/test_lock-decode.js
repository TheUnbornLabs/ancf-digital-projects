// jsdom test harness for Lock Decode (#47)
// Tier 2: drive the real tumbler/unlock loop through window.__cfq and assert PROGRESSION,
// not just setup. See tests/audit/PROTOCOL.md.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'lock-decode', 'index.html');
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

// Spin every tumbler the exact number of steps needed to match the target for the
// CURRENT round (reads live game state each time — never caches a round's tumblers/target).
function solveRound() {
  const pool = g.game._pool || g.SYMBOLS.length;
  const n = g.game.tumCount;
  for (let i = 0; i < n; i++) {
    const t = g.target[i];
    let steps = (t - g.tumblers[i] + pool) % pool;
    for (let s = 0; s < steps; s++) g.spinTumbler(i);
  }
}
function allMatch() {
  return g.tumblers.every((v, i) => v === g.target[i]);
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'spinTumbler', 'tryUnlock', 'tumAt',
    'unlockBtnHit', 'hintBtnHit', 'useHint', 'update', 'draw'].every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.tumblers) && Array.isArray(g.target));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.TOTAL, 10, 'the collection is 10 rounds');

  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame enters playing state');
  eq(g.game.round, 1, 'resetGame starts at round 1');
  ok('a target and tumblers of matching length exist', g.target.length === g.game.tumCount && g.tumblers.length === g.game.tumCount);
  ok('the round does not start already solved (deterministic seed keeps it a real puzzle)', !allMatch());

  /* ======================= CORE LOOP ======================= */
  console.log('\n--- logic: core action advances the round ---');
  g.resetGame();
  solveRound();
  ok('spinning tumblers to the target makes every tumbler match', allMatch());
  const scoreBefore1 = g.game.score;
  g.tryUnlock();
  ok('a matching unlock is accepted (no wrongAnim fired)', g.game.wrongAnim === 0);
  ok('unlock awards score immediately', g.game.score > scoreBefore1);
  ok('unlock starts the unlock animation', g.game.unlockAnim > 0);
  eq(g.game.state, 'playing', 'state stays playing during the unlock animation (advance is scheduled, not instant)');

  await sleep(850); // tryUnlock's setTimeout fires at 800ms
  eq(g.game.round, 2, 'after the scheduled advance, round has incremented to 2');
  eq(g.game.state, 'playing', 'still playing after round advances');
  eq(g.game.spins, 0, 'the new round starts with a fresh spin counter');
  ok('the new round is a fresh puzzle (tumblers/target rebuilt)', g.target.length === g.game.tumCount);

  console.log('\n--- logic: do it three times running ---');
  for (let r = 2; r <= 4; r++) {
    eq(g.game.round, r, `entering the loop at round ${r}`);
    ok(`round ${r}: input is accepted before solving (spin changes a tumbler)`, (() => {
      const before = g.tumblers[0];
      g.spinTumbler(0);
      const changed = g.tumblers[0] !== before;
      // undo/redo-agnostic: just re-solve after this probe spin
      return changed;
    })());
    solveRound();
    ok(`round ${r}: solved puzzle matches target`, allMatch());
    g.tryUnlock();
    ok(`round ${r}: unlock accepted`, g.game.wrongAnim === 0 && g.game.unlockAnim > 0);
    await sleep(850);
    eq(g.game.round, r + 1, `round advanced to ${r + 1}`);
    eq(g.game.state, 'playing', `still playing after round ${r}`);
  }

  console.log('\n--- logic: exhaust to a real ending ---');
  g.resetGame();
  g.buildRound(g.TOTAL); // jump to the final round the same way buildRound(round+1) does internally
  eq(g.game.round, g.TOTAL, 'now on the final round');
  solveRound();
  ok('final round solvable to a match', allMatch());
  const scoreAtFinal = g.game.score;
  g.tryUnlock();
  await sleep(850);
  eq(g.game.state, 'won', 'clearing the final round reaches the won screen');
  ok('score carries through to the won screen', g.game.score >= scoreAtFinal);
  ok('best score is at least the final score', g.game.best >= g.game.score);
  eq(win.localStorage.getItem('lockdecode_best'), String(g.game.best), 'best score persists to localStorage');

  console.log('\n--- logic: restart from the ending ---');
  eq(g.game.state, 'won', 'precondition: game is on the won screen');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from won returns to playing');
  eq(g.game.round, 1, 'resetGame from won goes back to round 1');
  eq(g.game.score, 0, 'resetGame from won clears score');
  solveRound();
  ok('the game is genuinely playable again (can solve round 1 again)', allMatch());
  g.tryUnlock();
  ok('unlock works again after restart', g.game.unlockAnim > 0);
  await sleep(850);
  eq(g.game.round, 2, 'progression works again after a restart-from-won cycle');

  console.log('\n--- logic: hint does not consume-and-freeze ---');
  g.resetGame();
  const hintsBefore = g.game.hintsLeft;
  ok('hints are available at round start', hintsBefore > 0);
  g.useHint();
  eq(g.game.hintsLeft, hintsBefore - 1, 'using a hint spends one hint');
  ok('the hint flags a real mismatched tumbler', g.game.hintFlash >= 0 && g.tumblers[g.game.hintFlash] !== g.target[g.game.hintFlash]);
  // the core loop must still work after using a hint (hint must not freeze input)
  solveRound();
  ok('after using a hint, the round can still be solved', allMatch());
  g.tryUnlock();
  ok('after using a hint, unlock is still accepted', g.game.unlockAnim > 0 && g.game.wrongAnim === 0);
  await sleep(850);
  eq(g.game.round, 2, 'after using a hint, the round still advances normally');

  console.log('\n--- logic: hint exhaustion is refused, not a freeze ---');
  g.resetGame();
  g.game.hintsLeft = 0;
  const flashBefore = g.game.hintFlash;
  g.useHint();
  eq(g.game.hintsLeft, 0, 'hint is refused when none remain (stays at 0, not negative)');
  eq(g.game.hintFlash, flashBefore, 'no new hint flash is set when hints are exhausted');
  // and the core loop still works after a refused hint call
  solveRound();
  g.tryUnlock();
  ok('input still accepted after a refused hint call', g.game.unlockAnim > 0);

  console.log('\n--- logic: a wrong unlock does not lose progress or freeze input ---');
  g.resetGame();
  // deliberately mismatch (not yet solved): tryUnlock should be refused, not silently accepted
  const wasSolved = allMatch();
  if (!wasSolved) {
    g.tryUnlock();
    ok('an incomplete lock is refused (wrongAnim fires, round does not advance)', g.game.wrongAnim > 0);
    eq(g.game.round, 1, 'round does not advance on a failed unlock attempt');
    solveRound();
    ok('the round can still be solved normally after a failed unlock attempt', allMatch());
    g.tryUnlock();
    // note: wrongAnim from the earlier failed attempt won't have decayed to 0 here because
    // rAF-driven update() never ran between the two clicks in this harness (rAF is disabled
    // by design) — that's a harness artifact, not a game bug, so we only assert on unlockAnim.
    ok('unlock is accepted once actually solved', g.game.unlockAnim > 0);
    await sleep(850); // let this round's scheduled advance fully resolve before the next section
  } else {
    ok('SKIPPED wrong-unlock test (round 1 started pre-solved, cannot happen with this seed)', true);
  }

  /* ======================= EXPLOIT PROBE: double-unlock ======================= */
  // tryUnlock() has no state/transitioning guard: nothing stops it from being called a
  // second time while unlockAnim is still counting down and the round has not yet been
  // rebuilt (game.state stays 'playing' the whole 800ms). A player double-clicking/
  // double-tapping the UNLOCK button while it still shows a match can trigger this.
  console.log('\n--- probe: double-unlock while advance is pending ---');
  g.resetGame();
  g.buildRound(5);
  solveRound();
  ok('round 5 solved before the double-unlock probe', allMatch());
  const roundBeforeDouble = g.game.round;
  g.tryUnlock();               // schedules buildRound(6) in ~800ms
  const scoreAfterFirst = g.game.score;
  const streakAfterFirst = g.game.streak;
  g.tryUnlock();               // tumblers still match target (nothing rebuilt them yet) -> must be REFUSED
  const scoreAfterSecond = g.game.score;
  ok('a second immediate tryUnlock() call is refused while the advance is pending (re-entrancy guard)',
    scoreAfterSecond === scoreAfterFirst && g.game.streak === streakAfterFirst);
  await sleep(900); // let any scheduled callbacks fire
  eq(g.game.round, roundBeforeDouble + 1, 'two stacked tryUnlock() calls advance the round counter by exactly ONE (round ' + (roundBeforeDouble + 1) + ' must still be presented and solved)');
  eq(g.game.state, 'playing', 'the game is still playable after a double-unlock');

  console.log('\n--- probe: double-unlock on the second-to-last round can end the game early ---');
  g.resetGame();
  g.buildRound(g.TOTAL - 1); // round 9 of 10
  solveRound();
  ok('round 9 solved before the probe', allMatch());
  g.tryUnlock();  // schedules buildRound(10)
  g.tryUnlock();  // still matches -> must be refused, not a second advance into the win check
  await sleep(900);
  eq(g.game.state, 'playing', 'a double-tap of UNLOCK on round 9 must NOT reach the won screen: round 10 still has to be presented and solved');
  eq(g.game.round, g.TOTAL, 'a double-tap of UNLOCK on round 9 lands on round 10, not past it');

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
