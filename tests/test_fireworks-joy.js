// jsdom test harness for Fireworks of Joy (#53)
// Tier 2 playthrough suite: drive the real click -> launch -> explode -> win loop
// through window.__cfq and assert progression, not setup.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'fireworks-joy', 'index.html');
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
    w.AudioContext = undefined;         // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Launch one firework at a fixed, reachable target and run update() long enough
// for the rocket to travel and explode (matches the real per-frame loop cadence).
function launchAndSettle(tx, ty, frames) {
  g.launchFirework(tx, ty);
  for (let i = 0; i < (frames || 40); i++) g.update(16);
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['launchFirework', 'update', 'draw', 'resetGame']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.WORDS));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.game.state, 'title', 'game boots on the title screen');
  eq(g.TARGET, 20, 'target is 20 launches');

  /* ======================= CORE LOOP: ADVANCE ======================= */
  console.log('\n--- logic: one launch advances the game ---');
  g.resetGame(); // matches onDown's title->playing transition path
  eq(g.game.state, 'playing', 'resetGame puts the game into playing state');
  eq(g.game.count, 0, 'resetGame starts the count at 0');

  const count0 = g.game.count;
  const rockets0 = g.rockets.length;
  g.launchFirework(480, 300);
  eq(g.game.count, count0 + 1, 'a single launch advances the count by 1');
  ok('a rocket is actually created', g.rockets.length === rockets0 + 1);

  // run update() until the rocket resolves into particles (travel takes ~500ms max)
  let framesToExplode = 0;
  while (g.rockets.length > 0 && framesToExplode < 100) { g.update(16); framesToExplode++; }
  eq(g.rockets.length, 0, 'the rocket explodes (is removed from flight) within a bounded number of frames');
  ok('exploding produced particles', g.particles.length > 0);

  /* ======================= THREE IN A ROW ======================= */
  console.log('\n--- logic: three launches in a row keep advancing ---');
  g.resetGame();
  let lastCount = g.game.count;
  for (let i = 0; i < 3; i++) {
    g.launchFirework(300 + i * 50, 200 + i * 30);
    ok(`launch #${i + 1} advances the count`, g.game.count === lastCount + 1);
    lastCount = g.game.count;
  }
  eq(g.game.count, 3, 'three launches leave the count at 3');
  // let all in-flight rockets resolve and confirm the game keeps accepting input afterward
  for (let i = 0; i < 100 && g.rockets.length > 0; i++) g.update(16);
  eq(g.rockets.length, 0, 'all three rockets resolve');
  g.launchFirework(400, 250);
  eq(g.game.count, 4, 'input is still accepted after three launches resolve');

  /* ======================= EXHAUST TO A REAL ENDING ======================= */
  console.log('\n--- logic: reaching 20 launches produces a real win ---');
  g.resetGame();
  eq(g.game.count, 0, 'clean slate before the full run');
  for (let i = 0; i < 20; i++) {
    launchAndSettle(200 + (i % 7) * 90, 150 + (i % 5) * 40, 40);
  }
  eq(g.game.count, 20, 'twenty launches brings the count to the target');
  eq(g.game.state, 'playing', 'state is still playing immediately at the 20th launch (win is deferred)');
  // the cooldown flash is a feedback cue for a launch *attempted after* the target is hit,
  // not for the 20th launch itself -- verify that's what actually happens
  const countAtTarget = g.game.count;
  g.launchFirework(500, 300);
  eq(g.game.count, countAtTarget, 'an extra launch attempt past the target does not increment count');
  ok('the extra attempt engages the cooldown flash', g.game.cooldownT > 0);

  // the win transition is scheduled via a real setTimeout(...,1200) in launchFirework;
  // update()/draw() do not drive it, so we must wait on the real clock, same as a player would.
  await sleep(1400);
  eq(g.game.state, 'won', 'after the scheduled delay, a real won ending is reached');
  eq(g.save.completions, 1, 'reaching the ending records a completion');
  ok('a fastest time is recorded', typeof g.save.fastestMs === 'number' && g.save.fastestMs > 0);

  // a further launch attempt at the ending is inert, not crashing, not double-counting
  const countAtWin = g.game.count;
  g.launchFirework(400, 300);
  eq(g.game.count, countAtWin, 'launching is refused once the game has already ended (state is not playing)');

  /* ======================= RESTART FROM THE ENDING ======================= */
  console.log('\n--- logic: restart from the ending is playable again ---');
  // resetGame is the real restart handler: resetBtn's click listener calls it directly,
  // and onDown calls it before re-dispatching the click when state is 'title' or 'won'.
  g.resetGame();
  eq(g.game.state, 'playing', 'restart returns to playing');
  eq(g.game.count, 0, 'restart clears the count');
  eq(g.rockets.length, 0, 'restart clears in-flight rockets');
  eq(g.particles.length, 0, 'restart clears particles');
  g.launchFirework(450, 260);
  eq(g.game.count, 1, 'input is accepted again after restarting from the ending');
  for (let i = 0; i < 100 && g.rockets.length > 0; i++) g.update(16);
  ok('the restarted round can also be driven to completion', (() => {
    for (let i = 1; i < 20; i++) launchAndSettle(220 + (i % 6) * 80, 160 + (i % 4) * 45, 40);
    return g.game.count === 20;
  })());

  /* ======================= PAUSE: reversible, not a soft-lock ======================= */
  console.log('\n--- logic: pause blocks and then releases input (not a one-way freeze) ---');
  await sleep(1400); // let the pending win timeout from the block above resolve and settle
  g.resetGame();
  g.launchFirework(400, 200);
  const rBefore = { x: g.rockets[0].x, y: g.rockets[0].y };
  g.game.paused = true;
  for (let i = 0; i < 20; i++) g.update(16);
  ok('update() does not move rockets while paused', g.rockets[0].x === rBefore.x && g.rockets[0].y === rBefore.y);
  const countPaused = g.game.count;
  g.launchFirework(300, 220); // simulates a click while paused -- real onDown guards this, but
                              // launchFirework itself has no pause guard; verify what actually happens
  const acceptedWhilePaused = g.game.count !== countPaused;
  g.game.paused = false;
  for (let i = 0; i < 40 && g.rockets.length > 0; i++) g.update(16);
  ok('unpausing resumes rocket motion / resolution', g.rockets.length === 0);
  const countAfterUnpause = g.game.count;
  g.launchFirework(350, 240);
  ok('input is accepted normally after unpausing', g.game.count === countAfterUnpause + 1);
  console.log('    note: launchFirework() itself has no paused-guard (only onDown does); ' +
    'called directly while paused it ' + (acceptedWhilePaused ? 'DID' : 'did NOT') + ' still count a launch.');

  /* ======================= STALE-TIMEOUT RESTART (candidate finding) ======================= */
  console.log('\n--- candidate: restarting during the post-20th-launch pause ---');
  await sleep(1400); // drain anything pending from the pause test above
  g.resetGame();
  const completionsBefore = g.save.completions;
  for (let i = 0; i < 20; i++) launchAndSettle(200 + (i % 7) * 90, 150 + (i % 5) * 40, 40);
  eq(g.game.count, 20, 'reached 20 again for the interruption scenario');
  ok('a win timeout is now pending (state still playing)', g.game.state === 'playing');

  // Player hits the always-visible restart button DURING the 1200ms pre-win pause,
  // exactly as resetBtn's click handler would (it calls resetGame() unconditionally,
  // with no check on game.state).
  await sleep(300);
  g.resetGame();
  eq(g.game.state, 'playing', 'restart mid-pause immediately returns to playing');
  eq(g.game.count, 0, 'restart mid-pause clears the count');
  // Player continues into their new round for a bit.
  g.launchFirework(300, 200);
  g.launchFirework(320, 210);
  eq(g.game.count, 2, 'the new round after the interruption accepts input normally for now');

  // Now the ORIGINAL setTimeout(...,1200) from before the restart fires (total elapsed > 1200ms
  // since the 20th launch of the first round). resetGame() never cancels it (no clearTimeout
  // anywhere in the file), and the callback applies itself unconditionally.
  await sleep(1200);
  console.log('    save.completions before interruption = ' + completionsBefore +
    ', after = ' + g.save.completions);
  eq(g.game.count, 2, 'BUG: the active new round (count=2) must not be disturbed by a stale timeout from the interrupted round');
  eq(g.game.state, 'playing', 'BUG: game.state must still be "playing" -- a stale win-timeout from before the restart should not be able to overwrite an active new round');
  eq(g.save.completions, completionsBefore, 'BUG: a round that only reached 2/20 must not be recorded as a completion');

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
