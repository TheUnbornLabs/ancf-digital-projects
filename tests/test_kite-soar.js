// jsdom test harness for Kite Soar (#90)
// Tier 2 playthrough suite: drives the real update()/star-collection/round-advance loop
// through window.__cfq and asserts PROGRESSION over time, not just setup state.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'kite-soar', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Let a deferred transition (round-advance, gameover) land.
// rAF is stubbed off below, so a bare sleep() advances real time while the game loop
// stays frozen - a state a real browser never reaches. settle() does BOTH: passes real
// time AND pumps update(), so it is agnostic to how the game defers its transitions and
// still models an actual playing browser. Deliberately does not assert - callers do.
const settle = async ms => { await sleep(ms); pump(ms); };
const pump = ms => { for (let i = 0; i < Math.ceil(ms / 16); i++) g.update(16); };

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
    w.AudioContext = undefined;         // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// ---- helpers -------------------------------------------------------------

// Move every cloud far off canvas so collision tests don't contaminate
// star-collection / round-advance tests with incidental life loss. Clouds
// and stars are independent subsystems; lives/gameover get their own
// dedicated tests below where clouds are the thing under test.
function neutralizeClouds() {
  for (const c of g.clouds) { c.x = -99999; c.y = -99999; c.vx = 0; c.vy = 0; }
}

// Advance real game time (via update()) until every star in the current
// round has fully faded in (alpha >= 1), matching what a real player would
// wait through. Parks the kite in a corner, away from cloud spawn.
function fadeAllStarsIn() {
  const k = g.kite; k.x = 25; k.y = 25;
  for (let i = 0; i < 30; i++) g.update(48); // 1440ms of game time; delay max ~800 + fade 400
}

// Fly the kite onto uncollected, faded-in stars one at a time until the
// round's collected count reaches at least `target`. May overshoot by more
// than one star in a single update() if stars are clustered (this is real,
// observed behavior of the game, not a test artifact - see the dedicated
// over-collection test below).
function collectUntil(target) {
  let guard = 0;
  while (g.game.collected < target && g.game.state === 'playing' && guard < 200) {
    const st = g.stars.find(s => !s.collected);
    if (!st) break;
    const k = g.kite; k.x = st.x; k.y = st.y;
    g.update(16);
    guard++;
  }
}

// Fly the kite directly onto a cloud repeatedly (re-reading live positions)
// until a life is lost, or until lives hit 0 / state leaves 'playing'.
function loseOneLife() {
  const before = g.game.lives;
  let guard = 0;
  while (g.game.lives === before && g.game.state === 'playing' && guard < 3000) {
    const c = g.clouds[0], k = g.kite;
    k.x = c.x; k.y = c.y;
    g.update(16);
    guard++;
  }
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.stars) && Array.isArray(g.clouds));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.STARS_NEEDED, 15, 'STARS_NEEDED constant is 15');
  eq(g.TOTAL, 8, 'TOTAL rounds constant is 8');

  eq(g.game.state, 'title', 'game boots into the title state');
  ok('draw() runs on the title screen without throwing', (() => { try { g.draw(); return true; } catch (e) { return false; } })());

  console.log('\n--- smoke: real click path (title -> playing) ---');
  // Exercise the game's own mousedown handler, not just the resetGame() hook,
  // so we know the actual production entry point works.
  {
    const canvas = win.document.getElementById('game');
    const ev = new win.MouseEvent('mousedown', { bubbles: true, clientX: 480, clientY: 270 });
    canvas.dispatchEvent(ev);
    eq(g.game.state, 'playing', 'a real mousedown on the title screen starts the game');
  }

  /* ======================= CORE LOOP: star collection & round advance ======================= */
  console.log('\n--- logic: core action advances the round (catches soft-locks) ---');
  g.resetGame();
  neutralizeClouds();
  eq(g.game.state, 'playing', 'resetGame sets state to playing');
  eq(g.game.round, 0, 'resetGame starts at round 0');
  eq(g.game.lives, 3, 'resetGame restores full lives');
  eq(g.game.collected, 0, 'resetGame clears collected count');
  eq(g.stars.length, g.STARS_NEEDED + 6, 'round spawns 6 bonus stars beyond the 15 needed');

  fadeAllStarsIn();
  ok('stars fully fade in after ~1.2s of play', g.stars.every(s => s.alpha >= 1));

  collectUntil(g.STARS_NEEDED);
  ok('flying onto stars collects them', g.game.collected >= g.STARS_NEEDED);
  eq(g.game.state, 'playing', 'still playing immediately after reaching the star quota (round-advance is scheduled, not instant)');
  eq(g.game.round, 0, 'round has not advanced yet the instant the quota is met');

  await settle(700); // the scheduled round-advance (500ms) must have landed by now
  eq(g.game.round, 1, 'completing a round advances the round counter');
  eq(g.game.collected, 0, 'the new round resets the collected count');
  eq(g.game.state, 'playing', 'still playing after advancing to the next round');
  eq(g.stars.length, g.STARS_NEEDED + 6, 'the new round has a fresh set of stars');
  ok('the new round\'s stars all start uncollected', g.stars.every(s => !s.collected));
  eq(g.kite.x, 480, 'the kite recenters horizontally for the new round');
  eq(g.kite.y, 270, 'the kite recenters vertically for the new round');

  console.log('\n--- logic: do it three rounds running (still advancing, still accepting input) ---');
  g.resetGame();
  for (let r = 0; r < 3; r++) {
    neutralizeClouds();
    fadeAllStarsIn();
    const roundBefore = g.game.round;
    collectUntil(g.STARS_NEEDED);
    ok(`round ${roundBefore}: reaching the quota is possible`, g.game.collected >= g.STARS_NEEDED);
    await settle(700);
    eq(g.game.round, roundBefore + 1, `round advances from ${roundBefore} to ${roundBefore + 1}`);
    eq(g.game.state, 'playing', `still playing after round ${roundBefore + 1}`);
    // input still accepted: moving onto a fresh star collects it
    neutralizeClouds();
    fadeAllStarsIn();
    const before = g.game.collected;
    const st = g.stars.find(s => !s.collected);
    const k = g.kite; k.x = st.x; k.y = st.y;
    g.update(16);
    ok(`round ${roundBefore + 1}: kite input is still accepted (a star is collectible)`, g.game.collected > before);
  }

  /* ======================= FAIL CONDITION: real endings ======================= */
  console.log('\n--- logic: exhaust the fail condition -> reach a real ending (gameover) ---');
  g.resetGame();
  loseOneLife();
  eq(g.game.lives, 2, 'the first cloud hit costs exactly one life');
  eq(g.game.state, 'playing', 'losing one life does not end the game');
  loseOneLife();
  eq(g.game.lives, 1, 'the second cloud hit costs another life');
  loseOneLife();
  eq(g.game.lives, 0, 'the third cloud hit exhausts all lives');
  eq(g.game.state, 'playing', 'state has not flipped to gameover the instant lives hit 0 (it is scheduled)');
  await settle(600); // the scheduled gameover (400ms) must have landed by now
  eq(g.game.state, 'gameover', 'exhausting all lives reaches a real gameover ending');

  console.log('\n--- logic: restart from gameover -> playable again ---');
  // Exercise the game's own restart handler: a real mousedown from the gameover screen.
  {
    const canvas = win.document.getElementById('game');
    const ev = new win.MouseEvent('mousedown', { bubbles: true, clientX: 480, clientY: 270 });
    canvas.dispatchEvent(ev);
    eq(g.game.state, 'playing', 'clicking from the gameover screen restarts the game');
    eq(g.game.round, 0, 'restarting resets the round counter');
    eq(g.game.lives, 3, 'restarting restores full lives');
    eq(g.game.collected, 0, 'restarting resets the collected count');
  }
  neutralizeClouds();
  fadeAllStarsIn();
  const stAfterRestart = g.stars.find(s => !s.collected);
  const kAfterRestart = g.kite; kAfterRestart.x = stAfterRestart.x; kAfterRestart.y = stAfterRestart.y;
  g.update(16);
  ok('input is accepted again after restarting from gameover', g.game.collected > 0);

  console.log('\n--- logic: full 8-round win path -> reach the other real ending ---');
  g.resetGame();
  let reachedWon = false;
  for (let r = 0; r < g.TOTAL && !reachedWon; r++) {
    neutralizeClouds();
    fadeAllStarsIn();
    collectUntil(g.STARS_NEEDED);
    await settle(700);
    if (g.game.state === 'won') reachedWon = true;
    else eq(g.game.round, r + 1, `after clearing round ${r}, round counter reads ${r + 1}`);
  }
  eq(g.game.state, 'won', 'clearing all 8 rounds reaches the win ending');
  eq(g.game.round, g.TOTAL, 'the round counter reads TOTAL at the win screen');
  ok('a best score was saved to localStorage on winning',
    win.localStorage.getItem('kiteSoar_best') !== null && parseInt(win.localStorage.getItem('kiteSoar_best'), 10) > 0);
  ok('draw() runs on the won screen without throwing', (() => { try { g.draw(); return true; } catch (e) { return false; } })());

  console.log('\n--- logic: restart from the won screen -> playable again ---');
  {
    const canvas = win.document.getElementById('game');
    const ev = new win.MouseEvent('mousedown', { bubbles: true, clientX: 480, clientY: 270 });
    canvas.dispatchEvent(ev);
    eq(g.game.state, 'playing', 'clicking from the won screen restarts the game');
    eq(g.game.round, 0, 'restarting from won resets the round counter');
  }

  /* ======================= PAUSE: the game's only "mode" besides play ======================= */
  console.log('\n--- logic: pause/resume in normal play does not freeze input ---');
  g.resetGame();
  neutralizeClouds();
  fadeAllStarsIn();
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause pauses the game');
  g.togglePause();
  eq(g.game.state, 'playing', 'toggling pause again resumes play');
  {
    const st = g.stars.find(s => !s.collected);
    const k = g.kite; k.x = st.x; k.y = st.y;
    g.update(16);
    ok('a normal (non-racing) pause/resume cycle does not consume or freeze input', g.game.collected > 0);
  }

  /* ======================= KNOWN-BUG REPRODUCTIONS =======================
     The following assert the behavior a competent player should be able to
     rely on. Each was independently reproduced against the real game file
     before being written up as a formal check; see the findings summary.
  ========================================================================= */
  console.log('\n--- bug repro: pausing right after finishing a round can permanently stall it ---');
  g.resetGame();
  neutralizeClouds();
  fadeAllStarsIn();
  collectUntil(g.STARS_NEEDED);
  eq(g.game.collected, g.STARS_NEEDED, 'exactly the quota is collected before pausing');
  g.togglePause();   // pause inside the 500ms round-advance window, before it lands
  await settle(700); // real time passes while paused; frames tick but update() early-returns
  eq(g.game.round, 0, 'the round does not advance while the game is paused');
  g.togglePause();   // resume
  await settle(700); // the deferred advance must survive the pause and land after resuming
  eq(g.game.round, 1,
    'BUG: round-advance timeout is guarded by state==="playing"; pausing during the 500ms ' +
    'window after finishing a round makes the guard silently drop the advance forever ' +
    '(HUD stays frozen at 15/15, round counter never increments) unless the player ' +
    'happens to also collect one of the 6 leftover bonus stars, which retriggers the check');

  console.log('\n--- bug repro: pausing right after the final life is lost leaves a "playing but dead" zombie state ---');
  g.resetGame();
  loseOneLife(); loseOneLife(); loseOneLife();
  eq(g.game.lives, 0, 'all lives are lost');
  g.togglePause();   // pause inside the 400ms gameover window, before it lands
  await settle(700); // real time passes while paused; frames tick but update() early-returns
  eq(g.game.state, 'paused', 'the game does not flip to gameover while paused');
  g.togglePause();   // resume
  await settle(700); // the deferred gameover must survive the pause and land after resuming
  eq(g.game.state, 'gameover',
    'BUG: the gameover timeout is guarded by state==="playing"; pausing during the 400ms ' +
    'window after the last life is lost makes the guard silently drop it, leaving the game ' +
    'in state="playing" with lives=0 (HUD shows 0 hearts) until the next cloud graze ' +
    're-triggers the death check');

  console.log('\n--- bug repro: grabbing one more star before the transition fires double-credits the life bonus ---');
  g.resetGame();
  neutralizeClouds();
  fadeAllStarsIn();
  const livesForBonus = g.game.lives;
  // Reach the quota exactly, the way any player does.
  collectUntil(g.STARS_NEEDED);
  const scoreAtQuota = g.game.score;
  const collectedAtQuota = g.game.collected;
  // Nothing on screen tells the player to stop moving the instant the HUD
  // reads 15/15 - the round has 21 stars spawned (6 more than the quota),
  // so it is entirely ordinary to fly over one more already-faded-in star
  // in the ~500ms before the round visibly changes. Simulate exactly that.
  const extra = g.stars.find(s => !s.collected);
  let overshootStarPickup = null, overshootLanded = false;
  if (extra) {
    const scoreBefore = g.game.score;
    const k = g.kite; k.x = extra.x; k.y = extra.y;
    g.update(16);
    overshootStarPickup = g.game.score - scoreBefore;
    overshootLanded = g.game.collected > collectedAtQuota; // check BEFORE the round resets collected to 0
  }
  await settle(700); // let the round-advance land
  if (extra && overshootLanded && overshootStarPickup !== null) {
    const expectedFinalScore = scoreAtQuota + overshootStarPickup + livesForBonus * 5; // exactly one life-bonus credit
    console.log(`    (collected exactly ${collectedAtQuota} at quota, score=${scoreAtQuota}; grabbed one more ` +
      `star worth ${overshootStarPickup} before the transition fired; one life-bonus (lives=${livesForBonus}) ` +
      `would make the final score ${expectedFinalScore}; actual final score=${g.game.score})`);
    eq(g.game.score, expectedFinalScore,
      'BUG: collecting one more star inside the round-advance window (ordinary, since the round ' +
      'spawns 6 bonus stars beyond the 15 needed and nothing signals the player to stop moving) ' +
      'schedules a second round-advance timeout for the same transition, crediting the ' +
      'round-completion life bonus (lives*5) a second time on top of the correct single credit');
  } else {
    ok('SKIPPED double-credit repro (no bonus star was collectible in the transition window with this seed/path)', true);
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
