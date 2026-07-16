// jsdom Tier 2 playthrough suite for Domino Knock (#51)
// Drives the real loop through window.__cfq: tap first domino -> chain falls -> round
// advances via a real setTimeout -> repeat across rounds -> exhaust lives -> gameover ->
// restart -> win path (round 8 clears -> 'won').
// No skip/hint/power-up exists in this game (confirmed by reading source: only tap-to-
// start-chain and pause/mute controls) so that Tier-2 bullet is reported as N/A, not skipped.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'domino-knock', 'index.html');
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
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update()/draw() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Drive the falling chain to completion by pumping update() with a fixed dt.
// Returns the number of update() calls used, or -1 if it never finished within the budget.
function pumpUntilAllFallen(maxCalls = 400, dt = 16) {
  for (let i = 0; i < maxCalls; i++) {
    g.update(dt);
    if (g.game.allFallen) return i + 1;
  }
  return -1;
}

// tap the coordinates of dominoes[idx] (defaults to the first/highlighted domino)
function tapDomino(idx = 0) {
  const d = g.dominoes[idx];
  g.handleTap(d.x + g.DW / 2, 0 /*CY placeholder replaced below*/);
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'startChain', 'update', 'draw', 'handleTap', 'hitTestDomino']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state and dominoes', !!g.game && Array.isArray(g.dominoes));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.game.state, 'title', 'game starts on the title screen');
  eq(g.TOTAL, 8, 'the collection has 8 rounds');

  // find CY the same way the game does: dominoes sit at H/2+20 in canvas space (H=540)
  const CY = 540 / 2 + 20;
  function tap(idx) {
    const d = g.dominoes[idx];
    g.handleTap(d.x + g.DW / 2, CY);
  }

  console.log('\n--- logic: starting from the title screen ---');
  g.handleTap(10, 10);   // any tap on 'title' must start the game (real restart/start handler)
  eq(g.game.state, 'playing', 'tapping the title screen starts round 1');
  eq(g.game.round, 1, 'round starts at 1');
  eq(g.game.lives, 3, 'round starts with 3 lives');
  eq(g.game.score, 0, 'round starts with score 0');
  ok('a row of dominoes is built', g.dominoes.length >= 5);

  /* ======================= CORE LOOP: ONE ROUND ======================= */
  console.log('\n--- logic: core action advances the game (round 1) ---');
  const idx0 = g.hitTestDomino(g.dominoes[0].x + g.DW / 2, CY);
  eq(idx0, 0, 'hit-testing the highlighted first domino returns index 0');
  eq(g.game.falling, false, 'the chain has not started yet');
  tap(0);
  eq(g.game.falling, true, 'tapping the first domino starts the chain');

  const calls1 = pumpUntilAllFallen();
  ok('pumping update() drives the chain to completion within budget', calls1 > 0);
  eq(g.game.allFallen, true, 'all dominoes have fallen');
  eq(g.game.score, 1, 'clearing the round awards a point');
  eq(g.game.combo, 1, 'clearing the round raises the combo');
  eq(g.game.round, 1, 'round number has not advanced yet (advance is on a delayed timeout)');

  await sleep(950);   // the real 900ms setTimeout that advances the round must have fired
  eq(g.game.round, 2, 'after the round-advance timeout fires, round advances to 2');
  eq(g.game.state, 'playing', 'still playing after advancing to round 2');
  eq(g.game.falling, false, 'the new round is not mid-chain');
  eq(g.game.allFallen, false, 'the new round has not been cleared yet');
  ok('a fresh row of dominoes was built for round 2', g.dominoes.length >= 5);

  /* ======================= THREE IN A ROW ======================= */
  console.log('\n--- logic: three rounds in a row, still advancing, still accepting input ---');
  for (let r = 2; r <= 4; r++) {
    eq(g.game.round, r, `entering round ${r}`);
    const hit = g.hitTestDomino(g.dominoes[0].x + g.DW / 2, CY);
    eq(hit, 0, `round ${r}: the first domino is still tappable`);
    tap(0);
    ok(`round ${r}: tapping the first domino starts the chain`, g.game.falling === true);
    const calls = pumpUntilAllFallen();
    ok(`round ${r}: the chain completes within budget`, calls > 0);
    eq(g.game.score, r, `round ${r}: score increments to ${r}`);
    await sleep(950);
  }
  eq(g.game.round, 5, 'after 4 cleared rounds, round is now 5 — the loop keeps advancing');

  /* ======================= MISS ON BLANK SPACE IS A NO-OP ======================= */
  console.log('\n--- logic: tapping blank space neither penalizes nor freezes input ---');
  {
    const livesBefore = g.game.lives;
    const missIdx = g.hitTestDomino(5, 5);   // far corner, no domino there
    eq(missIdx, -1, 'hitTestDomino returns -1 for a blank point');
    g.handleTap(5, 5);
    eq(g.game.lives, livesBefore, 'tapping blank space costs no life');
    eq(g.game.falling, false, 'tapping blank space does not start the chain');
    // the game must still be perfectly playable afterwards
    tap(0);
    ok('the real first domino is still tappable after a blank tap', g.game.falling === true);
    const calls = pumpUntilAllFallen();
    ok('the chain still completes after a preceding blank tap', calls > 0);
    await sleep(950);
  }

  /* ======================= PAUSE MID-CHAIN DOES NOT SOFT-LOCK ======================= */
  console.log('\n--- logic: pausing mid-chain and resuming does not freeze the game ---');
  {
    tap(0);
    g.update(16); g.update(16);   // let the chain begin
    ok('the chain is under way', g.game.falling === true && !g.game.allFallen);
    win.document.getElementById('btnPause').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    ok('pause flag is set', g.game.paused === true);
    const chainTBefore = g.game.chainT;
    for (let i = 0; i < 30; i++) g.update(16);
    eq(g.game.chainT, chainTBefore, 'update() while paused does not advance the chain timer');
    win.document.getElementById('btnPause').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    ok('unpausing clears the pause flag', g.game.paused === false);
    const calls = pumpUntilAllFallen();
    ok('after unpausing, the chain resumes and completes', calls > 0);
    await sleep(950);
  }

  /* ======================= EXHAUST THE FAIL CONDITION -> REAL ENDING ======================= */
  console.log('\n--- logic: exhausting lives reaches a real gameover ending ---');
  {
    const roundAtStart = g.game.round;
    const livesStart = g.game.lives;
    eq(livesStart, 3, 'lives are still full going into the miss sequence (misses reset per life, not per round)');
    for (let i = 1; i <= 3; i++) {
      const before = g.game.lives;
      // tap a wrong domino (index 1, guaranteed not the highlighted index 0)
      tap(1);
      if (i < 3) {
        eq(g.game.lives, before - 1, `wrong tap #${i} costs a life`);
        eq(g.game.state, 'playing', `wrong tap #${i} does not end the game yet (${before - 1} lives left)`);
      } else {
        eq(g.game.lives, 0, 'the last life is spent on the 3rd wrong tap');
        eq(g.game.state, 'gameover', 'losing the last life ends the game — a real, reachable ending');
      }
    }
    ok('round number is unchanged by the loss (game ended mid-round)', g.game.round === roundAtStart);
  }

  /* ======================= RESTART FROM THAT ENDING ======================= */
  console.log('\n--- logic: restarting from gameover is playable again ---');
  {
    g.handleTap(10, 10);   // tapping anywhere on the gameover screen is the game's real restart path
    eq(g.game.state, 'playing', 'tapping the gameover screen restarts the game');
    eq(g.game.round, 1, 'restart resets to round 1');
    eq(g.game.lives, 3, 'restart restores full lives');
    eq(g.game.score, 0, 'restart resets score to 0');
    eq(g.game.combo, 0, 'restart resets combo to 0');
    const hit = g.hitTestDomino(g.dominoes[0].x + g.DW / 2, CY);
    eq(hit, 0, 'after restart the first domino is tappable again');
    tap(0);
    ok('after restart, tapping the first domino starts a chain', g.game.falling === true);
    const calls = pumpUntilAllFallen();
    ok('after restart, the chain completes normally', calls > 0);
    await sleep(950);
    eq(g.game.round, 2, 'after restart, round-advance still works (not permanently broken by the earlier gameover)');
  }

  /* ======================= SKIP / HINT / POWER-UP PATH ======================= */
  console.log('\n--- logic: skip/hint/power-up check ---');
  ok('N/A: Domino Knock has no skip, hint, or power-up mechanic (only tap-to-start-chain, ' +
     'pause, and mute) — confirmed by reading the full source; nothing to exercise here', true);

  /* ======================= WIN PATH: CLEAR ALL 8 ROUNDS -> REAL ENDING ======================= */
  console.log('\n--- logic: clearing the final round reaches the real win ending ---');
  {
    // Jump to the final round the same way the game itself does when it advances rounds
    // (update()'s own timeout callback does `game.round++; buildRound(game.round)` — round and
    // the buildRound() argument are always set together, so we replicate that pairing exactly
    // rather than forcing round without rebuilding, or rebuilding without setting round).
    g.game.round = g.TOTAL;
    g.buildRound(g.game.round);
    eq(g.game.state, 'playing', 'round 8 is built into a playable state');
    eq(g.game.round, g.TOTAL, 'round is now the final round (8)');

    const scoreBefore = g.game.score;
    tap(0);
    const calls = pumpUntilAllFallen();
    ok('the final round chain completes within budget', calls > 0);
    eq(g.game.score, scoreBefore + 1, 'clearing the final round increments the score by one');

    await sleep(950);
    eq(g.game.state, 'won', 'clearing round 8 reaches the real win screen, not another round');

    // the win screen must itself be escapable back into a fresh, playable game
    g.handleTap(10, 10);
    eq(g.game.state, 'playing', 'tapping the win screen restarts the game');
    eq(g.game.round, 1, 'restart from the win screen resets to round 1');
    const hit = g.hitTestDomino(g.dominoes[0].x + g.DW / 2, CY);
    eq(hit, 0, 'after restarting from the win screen, the first domino is tappable');
  }

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
