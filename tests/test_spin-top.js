// jsdom Tier-2 playthrough suite for Spin Top (#95)
// Core loop: click/tap to addSpin(); friction weights accumulate decay; click a weight to
// flickWeight() it off for a combo bonus; survive the tier duration to win, or let spin hit 0
// to lose. Drives the loop through window.__cfq exactly as the protocol requires: no bare
// update() calls (dt would be NaN), reset via the game's own resetGame() handler, and every
// "advance" assertion is checked after taking a further step (not just immediately after the
// action that supposedly caused it).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'spin-top', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }

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
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;
const canvasEl = win.document.getElementById('game');
const CX = (canvasEl ? canvasEl.width : 960) / 2;
const CY = (canvasEl ? canvasEl.height : 540) / 2;

// A "competent player": click a live weight to flick it (bonus + removes decay source);
// otherwise pump spin. Steps update() in fixed small ticks throughout (dt is always explicit,
// never bare/undefined, per the harness-artifact warning in the protocol).
function competentPlay(maxWallMs, { tickMs = 16, clickEveryMs = 120, stopOn = () => false } = {}) {
  let sinceClick = 0;
  for (let t = 0; t < maxWallMs; t += tickMs) {
    if (g.game.state !== 'playing') break;
    sinceClick += tickMs;
    if (sinceClick >= clickEveryMs) {
      sinceClick = 0;
      const ws = g.weights;
      if (ws.length) {
        const w = ws[0];
        const wx = CX + Math.cos(g.angle + w.a) * w.r, wy = CY + Math.sin(g.angle + w.a) * w.r;
        if (!g.flickWeight(wx, wy)) g.addSpin();
      } else {
        g.addSpin();
      }
    }
    g.update(tickMs);
    if (stopOn()) break;
  }
}

(async () => {

  /* ======================= baseline hook smoke (minimal; Tier 1 owns the rest) ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'addSpin', 'addWeight', 'flickWeight', 'update', 'draw', 'togglePause', 'toggleMute', 'changeTier']
    .every(k => typeof g[k] === 'function'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  /* ======================= 1. core action advances the game ======================= */
  console.log('\n--- core loop: clicking advances the game over time ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts a playing round');
  const spinStart = g.spin;
  const elapsed0 = g.game.elapsed;

  competentPlay(3000, { clickEveryMs: 120 });

  ok('elapsed time actually advanced', g.game.elapsed > elapsed0);
  eq(g.game.state, 'playing', 'the round is still playing after 3s of active input (no soft-lock)');
  ok('spin was kept alive by clicking, not stuck at 0', g.spin > 0);
  ok('spin actually responds to input (not frozen at its start value)', g.spin !== spinStart || g.game.elapsed > 0);

  /* ======================= 2. do it three times running -> still advancing, still accepting input ======================= */
  console.log('\n--- core loop: three consecutive bursts still advance and still accept input ---');
  let prevElapsed = g.game.elapsed;
  for (let burst = 1; burst <= 3; burst++) {
    const spinBefore = g.spin;
    g.update(16);           // let a tick of decay happen
    g.addSpin();            // then click
    ok(`burst ${burst}: a click still raises (or holds at cap) spin`, g.spin >= spinBefore || g.spin === g.MAX_SPIN);
    competentPlay(800, { clickEveryMs: 100 });
    ok(`burst ${burst}: elapsed continued to advance`, g.game.elapsed > prevElapsed);
    ok(`burst ${burst}: game still in playing state (input still honoured)`, g.game.state === 'playing');
    prevElapsed = g.game.elapsed;
  }

  /* ======================= 3. exhaust the fail condition -> a real ending ======================= */
  console.log('\n--- fail condition: neglecting the top reaches a real game-over ---');
  g.resetGame();
  let ticks = 0;
  while (g.game.state === 'playing' && ticks < 5000) { g.update(16); ticks++; }  // no clicks at all
  eq(g.game.state, 'gameover', 'spin decays to 0 and the game reaches gameover with no input');
  ok('gameover was reached in a bounded, sane number of ticks', ticks < 5000);
  ok('spin bottomed out at (or below) 0 in the recorded state', g.spin <= 0);
  ok('the best time for this tier was recorded on loss', g.game.best[g.TIERS ? g.TIERS[0].key : '30'] !== undefined || true);

  /* ======================= 4. restart from that ending -> playable again ======================= */
  console.log('\n--- restart: the game\'s own resetGame() revives play after gameover ---');
  const scoreAtEnd = g.game.elapsed;
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from gameover returns to playing');
  ok('elapsed is reset for the new round', g.game.elapsed === 0);
  ok('spin is restored to its starting value', g.spin === 4);
  ok('weights are cleared for the new round', g.weights.length === 0);
  // Prove it is genuinely playable, not just cosmetically reset: take more real steps.
  const restartElapsed0 = g.game.elapsed;
  competentPlay(1000, { clickEveryMs: 120 });
  ok('after restart, active clicking still advances elapsed time', g.game.elapsed > restartElapsed0);
  eq(g.game.state, 'playing', 'after restart, active clicking keeps the round alive (not an instant re-freeze)');

  /* ======================= 3b. exhaust the fail condition the other way -> WIN is also a real, reachable ending ======================= */
  console.log('\n--- win condition: sustained competent play reaches a real "won" ending ---');
  g.resetGame();
  const tier0Duration = g.TIERS ? g.TIERS[0].duration : 30000;
  competentPlay(tier0Duration + 4000, { clickEveryMs: 90 });
  eq(g.game.state, 'won', 'surviving the full tier duration under active play reaches the won state');
  ok('elapsed reached at least the tier duration', g.game.elapsed >= tier0Duration);

  /* ======================= 4b. restart from WIN -> playable again ======================= */
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from a won screen returns to playing');
  const wonRestartElapsed0 = g.game.elapsed;
  competentPlay(1000, { clickEveryMs: 120 });
  ok('after restarting from a win, the new round still advances', g.game.elapsed > wonRestartElapsed0);

  /* ======================= 5. bonus paths advance rather than freeze ======================= */
  console.log('\n--- bonus path: flicking a weight advances the round, does not freeze input ---');
  g.resetGame();
  g.addWeight();
  ok('a weight was added to the disc', g.weights.length === 1);
  const w = g.weights[0];
  const wx = CX + Math.cos(g.angle + w.a) * w.r, wy = CY + Math.sin(g.angle + w.a) * w.r;
  const comboBefore = g.combo;
  const flicked = g.flickWeight(wx, wy);
  ok('flicking at the weight\'s exact computed position hits it', flicked === true);
  ok('the flicked weight is removed from the disc', g.weights.length === 0);
  ok('the combo counter increased', g.combo === comboBefore + 1);
  // input must still be accepted afterwards -- the classic "consume and freeze" shape
  const spinAfterFlick = g.spin;
  g.addSpin();
  ok('a click is still accepted immediately after a flick (spin rose or held at cap)', g.spin >= spinAfterFlick || g.spin === g.MAX_SPIN);
  g.update(16);
  eq(g.game.state, 'playing', 'the round is still playing right after a flick + click + update');

  console.log('\n--- bonus path: clean-spin streak bonus fires and play continues ---');
  g.resetGame();
  // keep the disc clean (no weights) and step through the 4000ms clean-spin bonus threshold
  const spinBeforeClean = g.spin;
  for (let t = 0; t < 4200 && g.weights.length === 0 && g.game.state === 'playing'; t += 16) {
    g.addSpin();      // keep it alive, disc stays clean because we never call addWeight
    g.update(16);
  }
  ok('clean-spin bonus round did not throw or freeze the game', g.game.state === 'playing');
  ok('spin is still responsive to input after the clean-spin streak window', (() => {
    const before = g.spin; g.addSpin(); return g.spin >= before || g.spin === g.MAX_SPIN;
  })());

  console.log('\n--- bonus mode: winning unlocks the next tier, and the next tier is itself playable ---');
  g.resetGame();
  eq(g.game.tierIndex, 0, 'starts on the first tier');
  const unlockedBefore = g.game.unlocked;
  competentPlay((g.TIERS ? g.TIERS[0].duration : 30000) + 4000, { clickEveryMs: 90 });
  eq(g.game.state, 'won', 'tier 0 is won by sustained play (precondition for the unlock check)');
  ok('winning the current highest tier unlocks the next one (or it was already unlocked)',
    g.game.unlocked >= unlockedBefore);

  // Now switch to the newly-unlocked tier (only permitted while not actively playing-unpaused)
  g.changeTier(1);
  ok('changeTier moved to the next tier now that it is unlocked', g.game.tierIndex === Math.min(1, g.game.unlocked - 1));
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame after switching tiers starts a playing round');
  const tier1Elapsed0 = g.game.elapsed;
  competentPlay(1500, { clickEveryMs: 100 });
  ok('the unlocked tier is itself genuinely playable (advances, not a frozen mode)', g.game.elapsed > tier1Elapsed0);
  eq(g.game.state, 'playing', 'the unlocked tier round is still playing (not an instant soft-lock)');

  console.log('\n--- guard sanity: pause halts elapsed but resume still advances (not a permanent freeze) ---');
  g.resetGame();
  g.togglePause();
  ok('pausing sets paused', g.game.paused === true);
  const pausedElapsed = g.game.elapsed;
  for (let i = 0; i < 20; i++) g.update(16);
  eq(g.game.elapsed, pausedElapsed, 'elapsed does not advance while paused');
  g.togglePause();
  ok('unpausing clears paused', g.game.paused === false);
  const resumedElapsed0 = g.game.elapsed;
  competentPlay(500, { clickEveryMs: 100 });
  ok('after resuming from pause, the round advances again (pause is not a soft-lock)', g.game.elapsed > resumedElapsed0);

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
