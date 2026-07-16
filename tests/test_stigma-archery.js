// jsdom Tier 2 playthrough suite for Stigma Archery (#29)
// Can a competent player get from the title screen to "All Stigmas Burst!"
// and play again? Drives the REAL loop through window.__cfq + real DOM
// mouse events on the canvas, not by forcing state.
//
// Known gotcha for THIS game (documented in tests/audit/PROTOCOL.md):
//   startRound(rnd) REQUIRES an argument. Calling it bare feeds
//   `rnd*8123+5` = NaN into seeded(), producing bubbles.y = NaN. Every
//   call below passes an explicit round number.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'stigma-archery', 'index.html');
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
function makeDom(onError) {
  return new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: false,
    url: 'http://localhost/',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { return stub(this); };
      w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update() manually
      w.cancelAnimationFrame = () => {};
      w.AudioContext = undefined;          // silence Web Audio
      w.webkitAudioContext = undefined;
      if (onError) w.addEventListener('error', e => onError(e.message));
    }
  });
}
const dom = makeDom(m => pageErrors.push(m));

const win = dom.window;
const g = win.__cfq;
const canvas = win.document.getElementById('game');

function mdown() { canvas.dispatchEvent(new win.MouseEvent('mousedown', { bubbles: true })); }
function mup()   { canvas.dispatchEvent(new win.MouseEvent('mouseup',   { bubbles: true })); }
function ticks(n) { for (let i = 0; i < n; i++) g.update(16); }

// Charge briefly and release: this is the ONLY way to make fire() do
// anything, because `charging` is only flipped true by the canvas'
// mousedown handler (startCharge()) -- calling g.fire() directly with no
// prior mousedown is always a no-op (charging stays false). Then run
// enough update() ticks for the arrow to resolve (hit, or fly off-screen).
function shoot(holdTicks = 3, resolveTicks = 160) {
  mdown();
  ticks(holdTicks);
  mup();
  ticks(resolveTicks);
}

// A round is fully resolved once every bubble is popped (whether by a hit,
// by drifting off the left edge, or by the round's own shot-exhaustion
// safety net). `roundOver` itself is a module-local we can't read, but this
// externally-observable condition is exactly what gates its effect.
function roundResolved() { return g.bubbles.length > 0 && g.bubbles.every(b => b.popped); }

// Fire up to maxShots times (or until the round resolves), with no attempt
// to aim. This is the "bad but persistent player" path: it exercises the
// round's built-in shot-exhaustion safety net (index.html: roundShots >=
// MAX_SHOTS_PER_ROUND forces any remaining bubbles closed) so that round
// completion does not depend on landing hits.
function clearRoundByAttrition(maxShots = 8) {
  for (let i = 0; i < maxShots && !roundResolved(); i++) shoot();
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'startRound', 'fire', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.bubbles) && Array.isArray(g.STIGMAS));
  ok('canvas element is present', !!canvas);
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.game.state, 'title', 'game boots on the title screen');
  eq(g.ROUNDS, 10, 'ROUNDS constant is 10 (used throughout this suite)');

  console.log('\n--- logic: starting the game (title -> playing) ---');
  mdown(); // canvas mousedown handler: state==='title' -> resetGame()
  mup();
  eq(g.game.state, 'playing', 'clicking the title screen starts the game');
  eq(g.game.round, 1, 'the game starts on round 1');
  eq(g.game.score, 0, 'score starts at 0 on a fresh game');

  console.log('\n--- regression: is every spawned bubble actually reachable? ---');
  // spawnBubbles(rnd) seeds its RNG purely from the round number
  // (seeded(rnd*8123+5)), so each round's bubble layout is IDENTICAL on
  // every playthrough, every time. That determinism is fine in itself --
  // but it means any structural defect in a layout is guaranteed, not luck.
  //
  // THE INVARIANT: every bubble's spd must be > 0. update() moves bubbles
  // with `b.x -= b.spd`, and bubbles spawn at x = W+r+i*140, already right
  // of the arrow's live boundary (x > W+10). So a bubble with spd < 0
  // starts unreachable and only moves further away -- it is not a
  // hard-to-hit bubble, it is a structurally unhittable one.
  //
  // This previously asserted `unreachable === 5`, i.e. it asserted the BUG
  // (round 2 spawned 5/5 bubbles moving away). That encoded broken
  // behaviour as expected, so the suite went green on a build where an
  // entire round could not be played. It now asserts the invariant.
  {
    const spdsRound2run1 = (() => { g.startRound(2); return g.bubbles.map(b => b.spd); })();
    const spdsRound2run2 = (() => { g.startRound(2); return g.bubbles.map(b => b.spd); })();
    eq(JSON.stringify(spdsRound2run2), JSON.stringify(spdsRound2run1),
      'round 2\'s bubble velocities are identical across independent (re)spawns -- deterministic, not random per playthrough');
    const unreachable = spdsRound2run1.filter(s => s < 0).length;
    ok(`round 2 spawns 0 bubbles moving away from the archer (all reachable) -- got spd=[${spdsRound2run1}]`,
      unreachable === 0);
    // Same invariant across EVERY round, not just the one the finding named:
    // the sign was drawn per bubble, so each round is its own dice roll.
    const badRounds = [];
    for (let r = 1; r <= g.ROUNDS; r++) {
      g.startRound(r);
      const bad = g.bubbles.filter(b => !(b.spd > 0)).length;
      if (bad) badRounds.push(`round ${r}: ${bad}/5 spd=[${g.bubbles.map(b => b.spd)}]`);
    }
    ok(`every bubble in all ${g.ROUNDS} rounds drifts toward the archer (spd > 0)` +
      (badRounds.length ? ' -- offenders: ' + badRounds.join('; ') : ''), badRounds.length === 0);
    // And prove reachability dynamically, not just by the sign: each bubble
    // must actually enter the arrow's live zone (x <= W+10) within a round's
    // worth of ticks, rather than merely being signed correctly.
    //
    // This runs in a THROWAWAY window on purpose. Ticking a round to
    // completion makes the game queue its 800ms setTimeout round-advance;
    // doing that 10x in the shared window would leave 10 pending timers that
    // fire during the next `await sleep(850)` and rocket the game to 'won',
    // failing every later check. The probe must not perturb the run it audits.
    {
      const probe = makeDom();
      const pg = probe.window.__cfq;
      const unreached = [];
      for (let r = 1; r <= pg.ROUNDS; r++) {
        pg.startRound(r);
        const reached = pg.bubbles.map(() => false);
        for (let i = 0; i < 900; i++) { pg.update(16); pg.bubbles.forEach((b, j) => { if (b.x <= 970) reached[j] = true; }); }
        const miss = reached.filter(v => !v).length;
        if (miss) unreached.push(`round ${r}: ${miss}/5`);
      }
      ok('every bubble in every round actually drifts into the arrow\'s live zone (x <= W+10)' +
        (unreached.length ? ' -- never reachable: ' + unreached.join('; ') : ''), unreached.length === 0);
      probe.window.close(); // drop any timers this probe queued
    }
    // restore the clean round-1 state the rest of the suite expects
    g.startRound(1);
    eq(g.game.round, 1, 'restored to round 1 after the reachability check');
  }

  console.log('\n--- logic: core action advances the game (catches soft-locks) ---');
  {
    const roundBefore = g.game.round;
    const shotsBefore = g.game.shots;
    shoot();
    ok('firing an arrow is registered as a shot', g.game.shots > shotsBefore);
    clearRoundByAttrition();
    ok('the round\'s bubbles are all resolved after the shot budget', roundResolved());
    await sleep(850); // the 800ms setTimeout that starts the next round
    ok('clearing a round advances the round NUMBER (the core loop advances)', g.game.round === roundBefore + 1);
    eq(g.game.state, 'playing', 'still playing after the round transition');
    ok('a fresh set of bubbles is in play for the new round', g.bubbles.length === 5 && g.bubbles.every(b => !b.popped));
  }

  console.log('\n--- logic: do it three times running -- still advancing, still accepting input ---');
  for (let i = 0; i < 3; i++) {
    const roundBefore = g.game.round;
    const shotsBefore = g.game.shots;
    clearRoundByAttrition();
    ok(`pass ${i + 1}: firing is still accepted (shots increased)`, g.game.shots > shotsBefore);
    ok(`pass ${i + 1}: bubbles resolve`, roundResolved());
    await sleep(850);
    ok(`pass ${i + 1}: round number advances`, g.game.round === roundBefore + 1);
    eq(g.game.state, 'playing', `pass ${i + 1}: still playing after advancing`);
  }

  console.log('\n--- logic: pause advances rather than freezing (bonus-path analogue) ---');
  {
    g.togglePause();
    ok('togglePause() actually sets paused', g.game.paused === true);
    const bubbleXs0 = g.bubbles.map(b => b.x);
    const roundBefore = g.game.round;
    ticks(30); // ~480ms of simulated time while paused
    ok('bubbles do not move while paused', g.bubbles.every((b, i) => b.x === bubbleXs0[i]));
    eq(g.game.round, roundBefore, 'the round does not change while paused');
    g.togglePause();
    ok('togglePause() unpauses', g.game.paused === false);
    const shotsBefore = g.game.shots;
    shoot();
    ok('firing works again immediately after unpausing (pause did not freeze input)', g.game.shots > shotsBefore);
    clearRoundByAttrition();
    await sleep(850);
    ok('the round advances normally after a pause/unpause cycle', g.game.round === roundBefore + 1);
  }

  console.log('\n--- logic: streak / bonus path advances rather than freezing ---');
  {
    // Get a deterministic set of bubbles for this check (round 1, all of
    // whose bubbles are reachable -- see the regression check above) rather
    // than gambling on whichever round the attrition loop happened to land on.
    g.resetGame(); // documented restart path; also clears score/streak to 0
    eq(g.game.round, 1, 'resetGame() returns to round 1 for a known bubble layout');
    let hitsForced = 0;
    for (const b of g.bubbles) {
      if (hitsForced >= 3) break;
      // Let the bubble drift into the arrow's live range (x < W+10) first --
      // bubbles spawn off-screen to the right, and an arrow forced onto an
      // off-screen x is treated as flying past the boundary, not a hit.
      let guard = 0;
      while (!b.popped && b.x > 900 && guard < 500) { g.update(16); guard++; }
      mdown(); ticks(2); mup(); // fire an arrow (charging must be true first)
      if (g.arrow) {
        // Place the live arrow object (the SAME mutable object the game
        // itself steps, not a copy) directly on the live bubble, exactly
        // like a player's arrow arriving on-target.
        g.arrow.x = b.x; g.arrow.y = b.y; g.arrow.vx = 1; g.arrow.vy = 0;
      }
      g.update(16); // resolve the collision this tick
      if (b.popped) hitsForced++;
      ticks(20);
    }
    ok('three aimed hits actually popped three bubbles', hitsForced === 3);
    ok('three hits in a row raise the streak counter to >= 3', g.game.streak >= 3);
    ok('score increased from the forced hits', g.game.score > 0);
    // Bonus mode must not consume input and then freeze it: fire again.
    const shotsBefore = g.game.shots;
    shoot();
    ok('firing is still accepted immediately after a streak bonus', g.game.shots > shotsBefore);
    // finish clearing whatever remains of this round and confirm it still
    // advances -- the streak path must not leave the round stuck.
    clearRoundByAttrition();
    await sleep(850);
    eq(g.game.round, 2, 'the round after a streak bonus still advances normally');
  }

  console.log('\n--- logic: exhaust the fail condition -- reach a real ending ---');
  // This game has no "lose" state (no lives/gameover) -- its only terminal
  // state is 'won' after round ROUNDS is cleared. Play the remaining
  // rounds out for real through the same fire loop used above.
  let iterations = 0;
  while (g.game.state === 'playing' && g.game.round <= g.ROUNDS && iterations < 20) {
    const r = g.game.round;
    clearRoundByAttrition();
    ok(`round ${r} bubbles resolve`, roundResolved());
    await sleep(850);
    iterations++;
  }
  eq(g.game.state, 'won', 'clearing all 10 rounds reaches the "won" ending');
  ok('best score was saved on winning', g.game.best >= g.game.score);
  eq(win.localStorage.getItem('stigmaArchery_best'), String(g.game.best), 'best score persisted to localStorage');

  console.log('\n--- logic: restart from the ending -- playable again ---');
  mdown(); // canvas handler: state==='won' -> resetGame()
  mup();
  eq(g.game.state, 'playing', 'clicking the won screen restarts the game');
  eq(g.game.round, 1, 'restart goes back to round 1');
  eq(g.game.score, 0, 'restart resets the score');
  ok('bubbles are freshly spawned on restart', g.bubbles.length === 5 && g.bubbles.every(b => !b.popped));
  const shotsBeforeRestart = g.game.shots;
  shoot();
  ok('firing is accepted again after restarting from the win screen', g.game.shots > shotsBeforeRestart);

  console.log('\n--- logic: startRound(rnd) requires an explicit round argument ---');
  g.startRound(3);
  ok('startRound(3) with an explicit round produces finite bubble coordinates',
    g.bubbles.every(b => Number.isFinite(b.x) && Number.isFinite(b.y)));
  eq(g.game.round, 3, 'startRound(3) sets round to the passed argument');

  console.log('\n--- robustness: odd dt values do not break the driven loop ---');
  let updateOk = true;
  try { for (const dt of [0, -5, 5000, 48.001]) g.update(dt); } catch (e) { updateOk = false; console.log('    update threw: ' + e.message); }
  ok('update() tolerates odd dt without throwing mid-playthrough', updateOk);
  ok('no uncaught page errors accumulated during the whole playthrough', pageErrors.length === 0);

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
