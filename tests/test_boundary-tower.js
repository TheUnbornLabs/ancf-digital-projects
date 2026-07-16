// jsdom Tier-2 playthrough suite for Boundary Tower (#14)
// Tower-defense: waves of "pressure" enemies walk a fixed path; the player places
// towers on empty grid cells to damage them before they breach (cost lives).
// Tier 1 already passed this game clean (loads, draws, survives odd dt, no NaN,
// restart-from-gameover works). This suite drives the REAL loop through the
// window.__cfq hook and asserts PROGRESSION across wave transitions, pause/resume,
// and the tower economy - not just single-step setup checks.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'boundary-tower', 'index.html');
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

function makeGame() {
  const pageErrors = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: false,
    url: 'http://localhost/',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { return stub(this); };
      w.requestAnimationFrame = () => 0;   // rAF disabled; we drive update() manually
      w.cancelAnimationFrame = () => {};
      w.AudioContext = undefined;
      w.webkitAudioContext = undefined;
      w.addEventListener('error', e => pageErrors.push(e.message));
    }
  });
  return { win: dom.window, g: dom.window.__cfq, pageErrors };
}

// Advance the simulation with REALISTIC per-frame dt (~16.67ms, i.e. 60fps).
// Investigation note: using large dt chunks (e.g. 48ms, update()'s clamp ceiling)
// to "fast forward" changes projectile-vs-enemy closing-speed physics - a
// stationary in-range target that gets reliably hit at dt=16.67 came back
// completely un-hit over 1.4s of simulated time at dt=48 (the homing step
// overshoots the 6px hit radius every tick and never converges). So this
// harness always steps at real frame time, never inflates dt to save iterations.
function pump(g, ms, dt = 16.67) {
  const n = Math.ceil(ms / dt);
  for (let i = 0; i < n; i++) g.update(dt);
}

// Let the inter-wave gap elapse, delivering time BOTH ways: real wall-clock time
// (for a build that schedules the transition on a wall-clock timer) and simulated
// frames (for a build that drives the gap from update()'s own dt). Whichever
// mechanism the game uses, the gap passes - so the assertions downstream test
// "does the wave advance", not "which timer implementation did the author pick".
// This deliberately does NOT weaken anything: on a build that drops the
// transition when paused, the pause assertion below still fails, because there
// the gap never elapses by either route.
async function passGap(g, ms = 2200) { await sleep(ms); pump(g, ms); }

// Run update() until the current wave has fully resolved (queue drained AND
// no enemies left AND spawning flag dropped), OR the run ends (gameover), OR
// a generous tick budget is exhausted - so a genuine freeze fails loudly
// instead of hanging the suite.
function pumpUntilWaveResolved(g, maxTicks = 4000, dt = 16.67) {
  let ticks = 0;
  while (ticks < maxTicks && g.game.state === 'playing' &&
         !(g.game.spawning === false && g.enemies.length === 0 && ticks > 5)) {
    g.update(dt);
    ticks++;
  }
  return ticks;
}

// Test-only scaffold: give the run ample gold and effectively infinite lives.
// This isolates "does the wave-transition mechanism survive repeated cycles"
// from how well the player happens to be defending, by holding "does dying end
// the test early" constant. It is not a claim about what an ordinary player can
// achieve - the undefended control runs below still reach a real gameover.
function surviveIndefinitely(g) {
  g.game.gold = 5000;
  g.game.lives = 999999;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  let { win, g, pageErrors } = makeGame();
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'startWave', 'placeTower', 'sellTower', 'upgradeTower',
    'update', 'draw', 'togglePause', 'toggleMute', 'toggleSpeed']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game/entity state', !!g.game && Array.isArray(g.towers) && Array.isArray(g.enemies));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.game.state, 'title', 'game opens on the title screen');

  let drewOk = true;
  for (const st of ['title', 'playing', 'paused', 'gameover']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  ok('draw() runs in every state without throwing', drewOk);
  g.game.state = 'title';

  console.log('\n--- smoke: starting a run ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame() enters play');
  eq(g.game.wave, 1, 'resetGame() starts at wave 1');
  eq(g.game.lives, 10, 'resetGame() restores full lives');
  eq(g.game.gold, 100, 'resetGame() restores starting gold');
  ok('a wave 1 spawn queue is active', g.game.spawning === true);

  /* ======================= CORE LOOP: does placing a tower do anything? ======================= */
  console.log('\n--- core loop: the placement action itself ---');
  ({ win, g, pageErrors } = makeGame());
  g.resetGame();
  const goldBefore = g.game.gold;
  g.placeTower(0, 6); // empty cell next to the path-start chokepoint
  eq(g.towers.length, 1, 'placeTower adds a tower');
  eq(g.game.gold, goldBefore - g.towers[0].type.cost, 'placeTower spends gold equal to the tower cost');
  ok('the tower sits off the path (a legal cell)', !g.PATHSET.has('0,6'));

  console.log('\n--- core loop: does the wave actually advance over time (the soft-lock check) ---');
  const ticksToResolve = pumpUntilWaveResolved(g);
  ok('wave 1 fully resolves within a bounded number of frames (not frozen)', ticksToResolve < 4000);
  ok('the spawn queue empties and enemies clear (game state actually moved)', g.game.spawning === false && g.enemies.length === 0);
  const livesAfterWave1_withTower = g.game.lives;
  const scoreAfterWave1_withTower = g.game.score;

  console.log('\n--- core loop: does a placed tower actually change the outcome vs. no defense? ---');
  // Same starting gold, same deterministic wave-1 seed (seeded(wave*1337+7)), only
  // difference is whether a tower was ever placed. If towers do their job, the
  // defended run should lose fewer lives / score more than the undefended run.
  const { g: gNoTower } = makeGame();
  gNoTower.resetGame();
  pumpUntilWaveResolved(gNoTower);
  const livesAfterWave1_noTower = gNoTower.game.lives;
  const scoreAfterWave1_noTower = gNoTower.game.score;

  console.log(`    no-tower run:   lives ${livesAfterWave1_noTower}, score ${scoreAfterWave1_noTower}`);
  console.log(`    with-tower run (1 Boundary tower at the path-start chokepoint): lives ${livesAfterWave1_withTower}, score ${scoreAfterWave1_withTower}`);
  ok('placing a tower with the starting budget measurably reduces lives lost ' +
     'vs. placing no tower at all (the core action should matter)',
     livesAfterWave1_withTower > livesAfterWave1_noTower);

  /* ======================= 3x IN A ROW: the transition mechanism across repeated cycles ======================= */
  // Uses the fortify() scaffold to survive multiple waves, isolating "does the
  // transition/spawn mechanism hold up over repeated cycles" from the
  // already-reported tower-economy finding above.
  console.log('\n--- do it three times running: consecutive wave transitions while unpaused ---');
  ({ win, g, pageErrors } = makeGame());
  g.resetGame();
  surviveIndefinitely(g);
  let waveSeq = [g.game.wave];
  let stillAcceptingInput = true;
  for (let i = 0; i < 3; i++) {
    pumpUntilWaveResolved(g);
    if (g.game.state !== 'playing') break;
    await passGap(g); // the wave-clear -> next-wave transition has a 2000ms gap
    waveSeq.push(g.game.wave);
    const before = g.towers.length;
    g.placeTower(2 + i, 2); // try placing on a fresh cell each iteration
    if (g.towers.length === before && g.game.gold >= 50) stillAcceptingInput = false;
  }
  console.log('    wave sequence:', waveSeq.join(' -> '), '| final state:', g.game.state);
  ok('three consecutive unpaused wave-clears each advance to the next wave',
    waveSeq.length === 4 &&
    waveSeq[1] === waveSeq[0] + 1 && waveSeq[2] === waveSeq[1] + 1 && waveSeq[3] === waveSeq[2] + 1);
  ok('placing towers is still accepted after repeated wave transitions', stillAcceptingInput);

  /* ======================= THE BUG: pause during the wave-clear gap ======================= */
  console.log('\n--- power/utility path: pausing during the inter-wave gap ---');
  ({ win, g, pageErrors } = makeGame());
  g.resetGame();
  pumpUntilWaveResolved(g);
  eq(g.game.wave, 1, 'still wave 1 right after it resolves (before the scheduled transition fires)');
  ok('the wave-clear scheduled the next wave (spawning dropped to false)', g.game.spawning === false);

  // A player pausing here is completely ordinary - it's the exact moment the game
  // presents as a breather between waves (wave-clear banner, no enemies on screen).
  g.togglePause();
  eq(g.game.state, 'paused', 'the game is now paused');
  // Deliver the gap by BOTH routes while paused - real wall-clock time AND
  // simulated frames. Neither may advance the wave: a paused game must not
  // progress, but it must not lose the pending transition either.
  await sleep(2300);
  pump(g, 5000);
  eq(g.game.wave, 1, 'wave did NOT advance while paused (a paused game must not progress)');

  g.togglePause();
  eq(g.game.state, 'playing', 'unpausing returns to the playing state');
  pump(g, 20000);
  ok('FINDING: unpausing after the inter-wave gap should let wave 2 start ' +
     '(it never does - the scheduled startWave() checked state===playing at the ' +
     'moment the pause held it, no-oped, and nothing ever retries it - a permanent soft-lock)',
     g.game.wave === 2);

  // Contrast: the SAME scenario without the pause advances normally (proves the
  // pause interaction - not general brokenness - is what causes the freeze).
  const { g: gControl } = makeGame();
  gControl.resetGame();
  pumpUntilWaveResolved(gControl);
  await passGap(gControl, 2300); // no pause this time
  ok('control (no pause): the same gap advances to wave 2 normally', gControl.game.wave === 2);

  /* ======================= EXHAUST THE FAIL CONDITION: reach a real ending ======================= */
  console.log('\n--- exhaust fail condition: reach a real gameover ---');
  ({ win, g, pageErrors } = makeGame());
  g.resetGame();
  let wavesSurvived = 0;
  let guard = 0;
  while (g.game.state === 'playing' && guard < 30) {
    pumpUntilWaveResolved(g, 4000);
    if (g.game.state !== 'playing') break;
    await passGap(g); // let the next-wave gap elapse
    wavesSurvived++;
    guard++;
  }
  console.log(`    reached state '${g.game.state}' after clearing ${wavesSurvived} full wave transition(s), final wave ${g.game.wave}, lives ${g.game.lives}`);
  eq(g.game.state, 'gameover', 'running out of lives reaches a real gameover ending (not stuck mid-wave)');
  ok('the gameover screen renders without throwing', (() => { try { g.draw(); return true; } catch (e) { return false; } })());
  ok('best score was recorded on gameover', typeof g.game.best === 'number' && g.game.best >= g.game.score);

  /* ======================= RESTART FROM THE ENDING ======================= */
  console.log('\n--- restart from that ending ---');
  const scoreAtGameover = g.game.score;
  g.resetGame(); // the real handler pointerDown() calls when state==='gameover' or 'title'
  eq(g.game.state, 'playing', 'resetGame() from gameover returns to play');
  eq(g.game.wave, 1, 'wave resets to 1 on restart');
  eq(g.game.lives, 10, 'lives reset to full on restart');
  eq(g.game.gold, 100, 'gold resets to starting amount on restart');
  eq(g.towers.length, 0, 'towers are cleared on restart');
  ok('score is not carried over from the previous run',
    g.game.score !== scoreAtGameover || scoreAtGameover === 0);

  // playable again, not just reset flags - actually advance a wave post-restart
  const ticksPostRestart = pumpUntilWaveResolved(g);
  ok('post-restart, the wave resolves again (not frozen from the previous run)', ticksPostRestart < 4000);
  await passGap(g);
  eq(g.game.wave, 2, 'post-restart, wave advances to 2 normally - fully playable again');

  /* ======================= UTILITY CONTROLS DON'T FREEZE PROGRESS ======================= */
  console.log('\n--- fast-forward / mute: do they advance rather than freeze? ---');
  ({ win, g, pageErrors } = makeGame());
  g.resetGame();
  surviveIndefinitely(g); // survive long enough to observe multiple transitions cleanly
  g.toggleSpeed();
  eq(g.game.speedMul, 2, 'fast-forward engages 2x speed');
  let ticksFF = pumpUntilWaveResolved(g);
  ok('wave still resolves normally under 2x speed', ticksFF < 4000 && g.game.state === 'playing');
  await passGap(g);
  eq(g.game.wave, 2, 'wave still advances to 2 under fast-forward (FF does not freeze the loop)');

  // toggleSpeed's own logic is `speedMul>=2 ? 1 : speedMul+1` - confirmed by direct
  // trace it can only ever alternate 1x<->2x. 3x is advertised (button cycles
  // through '1x'/'2x'/'3x' text conceptually, and update() clamps speedMul to
  // [1,3]) but is unreachable via toggleSpeed() as written - a real, minor,
  // separately-reported dead-branch bug, not a soft-lock.
  g.toggleSpeed();
  eq(g.game.speedMul, 1, 'one more toggle returns to 1x (confirms the actual 1x<->2x alternation)');
  g.toggleSpeed();
  eq(g.game.speedMul, 2, 'toggling again goes back to 2x - 3x is never reached through toggleSpeed()');

  console.log('\n--- mute does not affect progression ---');
  g.toggleMute();
  eq(g.game.muted, true, 'mute engages');
  const ticksMuted = pumpUntilWaveResolved(g);
  ok('wave still resolves while muted', ticksMuted < 4000 && g.game.state === 'playing');
  await passGap(g);
  eq(g.game.wave, 3, 'wave still advances while muted (mute does not freeze the loop)');

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
