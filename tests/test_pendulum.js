// jsdom Tier 2 playthrough suite for Pendulum (#97)
// Core loop: a pendulum swings on its own physics; the player clicks the instant the bob
// enters a narrowing "golden zone" on the arc. Hit -> score + streak; miss -> streak reset.
// After a 1400ms feedback delay the round advances. 12 rounds, then 'won'. No lives/fail state
// other than reaching the end of the round count — every playthrough resolves to 'won'.
//
// This suite drives the REAL physics via update() and calls tryHit() only when the exposed
// angle/zoneA/zoneW say the bob is actually inside the zone (or actually isn't, for the miss
// path) — it does not force state fields that the game itself keeps in lockstep (hit/miss/angle
// have no setters on the hook; only game.* fields are settable, and only game.paused is poked
// here, deliberately, to test the pause interaction).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'pendulum', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- canvas 2D context stub (jsdom has no canvas backend) ----
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

// Drive real physics forward (dt=16ms per tick, matching a ~60fps frame) until the bob is
// inside the current golden zone, then stop. This is the same information a real player has
// (the zone is drawn on screen) expressed through the hook's angle/zoneA/zoneW getters.
function stepUntilInZone(maxSteps = 20000) {
  for (let i = 0; i < maxSteps; i++) {
    g.update(16);
    if (Math.abs(g.angle - g.zoneA) < g.zoneW / 2) return i;
  }
  return -1;
}

// One full round: find the zone, click, wait out the feedback delay so the game has
// actually advanced (this is the step Word Unscramble's suite never took).
async function playRoundForHit() {
  const steps = stepUntilInZone();
  const roundBefore = g.game.round;
  g.tryHit();
  const gotHit = g.hit, gotMiss = g.miss;
  await sleep(1500); // NEXT_ROUND_DELAY is 1400ms
  return { steps, gotHit, gotMiss, roundBefore };
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API',
    ['resetGame', 'buildRound', 'tryHit', 'nextRound', 'update', 'draw', 'resize']
      .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game);
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.game.state, 'title', 'game boots on the title screen');
  ok('TOTAL rounds is a positive number', typeof g.TOTAL === 'number' && g.TOTAL > 0);

  /* ======================= CORE LOOP ======================= */
  console.log('\n--- core loop: start via the real click handler ---');
  const canvas = win.document.getElementById('game');
  const downEvt = () => canvas.dispatchEvent(new win.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  downEvt();   // this is exactly what a player's first click does
  eq(g.game.state, 'playing', 'a real mousedown on the title screen starts the game');
  eq(g.game.round, 0, 'the game starts at round 0');
  eq(g.game.score, 0, 'the game starts at score 0');

  console.log('\n--- core loop: a hit advances the round (catches soft-locks) ---');
  g.resetGame();
  const scoreBefore = g.game.score;
  const r1 = await playRoundForHit();
  ok('the bob reaches the golden zone within a reasonable number of physics steps', r1.steps >= 0);
  ok('clicking inside the zone registers as a hit', r1.gotHit === true && r1.gotMiss === false);
  ok('a hit increases the score', g.game.score > scoreBefore);
  eq(g.game.streak, 1, 'a hit raises the streak to 1');
  eq(g.game.round, r1.roundBefore + 1, 'completing a round advances the round counter');
  eq(g.game.state, 'playing', 'still playing after the round advances');
  ok('hit/miss flags are cleared for the new round', g.hit === false && g.miss === false);

  console.log('\n--- core loop: three rounds running, still advancing, still accepting input ---');
  let lastScore = g.game.score, lastStreak = g.game.streak;
  for (let i = 0; i < 3; i++) {
    const roundBefore = g.game.round;
    const r = await playRoundForHit();
    ok(`round ${i}: input is accepted (hit or miss registered)`, r.gotHit || r.gotMiss);
    eq(g.game.round, roundBefore + 1, `round ${i}: the round counter advances`);
    eq(g.game.state, 'playing', `round ${i}: game is still in the playing state`);
    if (r.gotHit) {
      ok(`round ${i}: a hit increased the score`, g.game.score > lastScore);
      ok(`round ${i}: streak increased on a hit`, g.game.streak === lastStreak + 1);
    }
    lastScore = g.game.score; lastStreak = g.game.streak;
  }

  console.log('\n--- core loop: a miss is accepted too and does not stall the round ---');
  g.resetGame();
  // at the very start of a round the bob sits at +-AMPLITUDE with zero velocity; the zone is
  // built to sit strictly inside the reachable range, so clicking immediately is a genuine miss.
  const angleAtStart = g.angle;
  ok('setup: the start-of-round angle is actually outside the zone (miss is reachable)',
    Math.abs(angleAtStart - g.zoneA) >= g.zoneW / 2);
  const roundBeforeMiss = g.game.round;
  const streakBeforeMiss = g.game.streak;
  g.tryHit();
  ok('clicking outside the zone registers as a miss', g.miss === true && g.hit === false);
  await sleep(1500);
  eq(g.game.round, roundBeforeMiss + 1, 'a miss still advances to the next round (no stall)');
  eq(g.game.streak, 0, 'a miss resets the streak to 0');
  eq(g.game.state, 'playing', 'still playing after a miss');

  console.log('\n--- input guard: clicking during the feedback window is inert, not a new hit ---');
  g.resetGame();
  stepUntilInZone();
  g.tryHit();
  const scoreDuringFeedback = g.game.score;
  const roundDuringFeedback = g.game.round;
  g.tryHit();  // re-click immediately, before the 1400ms delay fires
  eq(g.game.score, scoreDuringFeedback, 're-clicking mid-feedback does not double-award score');
  eq(g.game.round, roundDuringFeedback, 're-clicking mid-feedback does not skip a round');
  await sleep(1500);
  eq(g.game.round, roundDuringFeedback + 1, 'the round still advances normally once the delay elapses');

  console.log('\n--- exhaust the round count: a real ending is reached ---');
  g.resetGame();
  let safety = 0;
  while (g.game.state === 'playing' && safety < g.TOTAL + 5) {
    await playRoundForHit();
    safety++;
  }
  eq(g.game.state, 'won', 'clearing every round reaches the won screen');
  eq(g.game.round, g.TOTAL, 'the round counter lands exactly on TOTAL at the end');
  ok('a final score was recorded', g.game.score > 0);
  ok('best score was updated to at least the final score', g.game.best >= g.game.score);

  console.log('\n--- restart from the ending: playable again ---');
  const wonScore = g.game.score, wonBest = g.game.best;
  downEvt();  // the real click handler is what a player uses on the won screen too
  eq(g.game.state, 'playing', 'a click on the won screen restarts the game');
  eq(g.game.round, 0, 'restarting resets the round counter');
  eq(g.game.score, 0, 'restarting resets the score');
  eq(g.game.streak, 0, 'restarting resets the streak');
  ok('the best score set on the previous run is preserved across restart', g.game.best === wonBest && wonBest >= wonScore);

  const rAfterRestart = await playRoundForHit();
  ok('post-restart: input is accepted again (hit or miss registered)', rAfterRestart.gotHit || rAfterRestart.gotMiss);
  eq(g.game.round, 1, 'post-restart: the round advances normally, proving the loop is not soft-locked');

  console.log('\n--- full second playthrough after restart also reaches a real ending ---');
  g.resetGame();
  safety = 0;
  while (g.game.state === 'playing' && safety < g.TOTAL + 5) {
    await playRoundForHit();
    safety++;
  }
  eq(g.game.state, 'won', 'a second full playthrough also reaches the won screen (no cumulative state leak)');

  console.log('\n--- skip / hint / power-up path ---');
  // Pendulum has no skip, hint, or power-up mechanic — it is a pure timing game with a single
  // action (click). Confirm that directly rather than assuming: no such API is exposed, and the
  // only other player-facing controls are pause and mute, neither of which consumes a resource
  // or can freeze the core loop.
  ok('no skip/hint/power-up API exists to test (single-action game, verified absent from hook)',
    !('skipWord' in g) && !('revealHint' in g) && !('useHint' in g) && !('powerUp' in g));

  console.log('\n--- pause does not block eventual progress ---');
  g.resetGame();
  stepUntilInZone();
  g.tryHit();
  const roundAtPauseClick = g.game.round;
  g.game.paused = true;
  await sleep(1600);   // longer than NEXT_ROUND_DELAY
  ok('note: the round-advance timer is wall-clock (setTimeout), not gated on paused, so it still '
     + 'fires while paused — this does not freeze the game (round=' + g.game.round + ', was '
     + roundAtPauseClick + '), only worth knowing if reviewing pause semantics',
     g.game.round === roundAtPauseClick + 1);
  g.game.paused = false;

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
