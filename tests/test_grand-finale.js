// jsdom test harness for Grand Finale (#100)
// Tier 2: can a competent player get from the start of this game to the end?
// Core loop: stars rise, click/tap to collect before they expire ("miss").
// PER_ROUND=20 collected completes a round; 3 rounds -> 'won'. MAX_MISSES=8 misses -> 'gameover'.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'grand-finale', 'index.html');
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
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;          // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Pump update() in small (dt<=48, matching the game's own clamp) steps until at least
// one uncollected star exists on screen, or give up after `guard` steps.
function pumpUntilStar(guard = 120) {
  let n = 0;
  while (g.stars.filter(s => !s.collected).length === 0 && n < guard) { g.update(48); n++; }
  return n < guard;
}

// Collect exactly one star: wait for it to exist, then click it at its own coordinates
// (an exact hit — independent of jsdom's zeroed getBoundingClientRect, which clickStar
// itself does not consult; only the DOM mousedown handler does).
function collectOne() {
  const had = pumpUntilStar();
  if (!had) return null;
  const s = g.stars.find(st => !st.collected);
  g.clickStar(s.x, s.y);
  return s;
}

// Force exactly one star to expire (a miss) without touching any other in-flight star.
function missOne() {
  const had = pumpUntilStar();
  if (!had) return null;
  const s = g.stars.find(st => !st.collected);
  s.life = 10;          // about to expire
  g.update(48);          // 10 - 48 <= 0 -> update2's own expiry branch fires missStar()
  return s;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'clickStar', 'spawnStar', 'update', 'draw', 'togglePause']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.stars) && Array.isArray(g.bursts));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  eq(g.TOTAL_ROUNDS, 3, 'three rounds per the collection blurb');
  eq(g.PER_ROUND, 20, 'twenty stars per round');
  eq(g.MAX_MISSES, 8, 'eight misses ends the round');

  let drewOk = true;
  g.resetGame();
  for (const st of ['title', 'playing', 'paused', 'won', 'gameover']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  g.resetGame();
  ok('draw() runs in every state without throwing', drewOk);

  console.log('\n--- logic: setup ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame lands directly in playing (matches onDown handler)');
  eq(g.game.round, 0, 'resetGame starts at round 0');
  eq(g.game.collected, 0, 'resetGame starts with nothing collected');
  eq(g.game.misses, 0, 'resetGame starts with no misses');

  /* ======================= CORE LOOP ======================= */
  console.log('\n--- logic: core loop — collecting advances the game ---');
  g.resetGame();
  const c0 = g.game.collected, sc0 = g.game.score;
  const star1 = collectOne();
  ok('a star spawned to collect', !!star1);
  eq(g.game.collected, c0 + 1, 'collecting a star advances the collected count');
  ok('collecting a star awards score', g.game.score > sc0);
  // clickStar() awards a reaction-time bonus (+1 extra) when life remaining > 50%;
  // collectOne() always clicks the instant a star spawns, at full life, so it earns that
  // bonus -> combo goes to 2, not 1. This is the game's own documented rule (line ~112-114
  // "reaction-time bonus"), not a harness artifact — confirmed by reading the source.
  eq(g.game.combo, 2, 'collecting a fresh (full-life) star raises the combo by 2 (reaction bonus)');

  console.log('\n--- logic: three in a row — still advancing, still accepting input ---');
  g.resetGame();
  for (let i = 1; i <= 3; i++) {
    const before = g.game.collected;
    const s = collectOne();
    ok(`catch #${i} spawned a star`, !!s);
    eq(g.game.collected, before + 1, `catch #${i} advances collected (${before} -> ${before + 1})`);
  }
  eq(g.game.combo, 6, 'three clean full-life catches in a row build the combo to 6 (2 each, see reaction-bonus note above)');
  ok('the game is still in playing state after three catches', g.game.state === 'playing');

  console.log('\n--- logic: exhausting the fail condition reaches a real ending ---');
  g.resetGame();
  for (let i = 1; i <= g.MAX_MISSES; i++) {
    const s = missOne();
    ok(`miss #${i} had a star to expire`, !!s);
  }
  eq(g.game.misses, g.MAX_MISSES, `misses reached the ${g.MAX_MISSES} cap`);
  eq(g.game.state, 'gameover', 'exhausting all misses ends the round in gameover');

  console.log('\n--- logic: restart from gameover is playable again ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'restart from gameover returns to playing');
  eq(g.game.misses, 0, 'restart clears misses');
  eq(g.game.collected, 0, 'restart clears collected');
  const afterRestart = collectOne();
  ok('input is accepted immediately after restarting from gameover', !!afterRestart && g.game.collected === 1);

  console.log('\n--- logic: pause is reversible, does not freeze the game ---');
  g.resetGame();
  const beforePauseStars = g.stars.length;
  g.togglePause();
  ok('togglePause sets paused', g.game.paused === true);
  const starsSnapshot = JSON.stringify(g.stars);
  for (let i = 0; i < 20; i++) g.update(48);
  eq(JSON.stringify(g.stars), starsSnapshot, 'no simulation progresses while paused (stars unchanged)');
  g.togglePause();
  ok('togglePause resumes', g.game.paused === false);
  const resumed = collectOne();
  ok('input is accepted again after unpausing (pause does not permanently freeze the game)', !!resumed);

  /* ======================= THE FINDING ======================= */
  console.log('\n--- logic: a round with ANY miss below the gameover threshold still resolves ---');
  g.resetGame();
  // Miss 3 (well under MAX_MISSES=8, so gameover must NOT fire), then play the round out.
  // A round is PER_ROUND *collected*, so misses must not consume the spawn budget: stars
  // have to keep coming until all 20 are collected. Anything else is a soft-lock — the
  // round can then neither complete nor fail, and the player is stuck forever.
  for (let i = 0; i < 3; i++) missOne();
  eq(g.game.misses, 3, 'three stars were missed this round');
  for (let i = 0; i < g.PER_ROUND; i++) {
    const s = collectOne();
    if (!s) { ok(`star ${i + 1}/${g.PER_ROUND} still spawns after 3 misses (no spawn starvation)`, false); break; }
  }
  eq(g.game.collected, g.PER_ROUND, 'the round still yields a full 20 collected despite 3 misses');
  eq(g.game.misses, 3, 'misses did not climb toward gameover while collecting');
  eq(g.game.state, 'playing', 'three misses is under the 8-miss cap, so no gameover');
  g.update(16); // the roundDone check + its setTimeout live inside update2
  await sleep(900); // round-completion setTimeout is 800ms
  eq(g.game.round, 1, 'a round with misses DOES advance — no soft-lock');
  eq(g.game.state, 'playing', 'still playing after the round-with-misses transition');
  ok('stars spawn again in the new round', !!collectOne());

  console.log('\n--- logic: the happy path (zero misses) does complete a round and the full run wins ---');
  g.resetGame();
  for (let i = 0; i < g.PER_ROUND; i++) {
    const s = collectOne();
    if (!s) { ok(`FAILED to spawn star ${i + 1}/${g.PER_ROUND} in round 0`, false); break; }
  }
  eq(g.game.collected, g.PER_ROUND, 'round 0: all 20 stars collected with zero misses');
  g.update(16); // the roundDone check (and its setTimeout) lives inside update2 — it only
                // runs when update() is called; the 20th clickStar() alone does not trigger it
  await sleep(900); // round completion setTimeout is 800ms
  eq(g.game.round, 1, 'a flawless round (0 misses) DOES advance to round 2');
  eq(g.game.state, 'playing', 'still playing after round 1 -> 2 transition');

  for (let i = 0; i < g.PER_ROUND; i++) {
    const s = collectOne();
    if (!s) { ok(`FAILED to spawn star ${i + 1}/${g.PER_ROUND} in round 1`, false); break; }
  }
  eq(g.game.collected, g.PER_ROUND, 'round 1: all 20 stars collected with zero misses');
  g.update(16);
  await sleep(900);
  eq(g.game.round, 2, 'a second flawless round advances to round 3');

  for (let i = 0; i < g.PER_ROUND; i++) {
    const s = collectOne();
    if (!s) { ok(`FAILED to spawn star ${i + 1}/${g.PER_ROUND} in round 2`, false); break; }
  }
  eq(g.game.collected, g.PER_ROUND, 'round 2: all 20 stars collected with zero misses');
  g.update(16);
  await sleep(1600); // round-complete (800ms) then win (600ms) timeouts
  eq(g.game.state, 'won', 'clearing all three rounds flawlessly reaches the real ending: won');

  console.log('\n--- logic: restart from won is playable again ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'restart from won returns to playing');
  eq(g.game.round, 0, 'restart from won resets to round 0');
  const afterWonRestart = collectOne();
  ok('input is accepted after restarting from won', !!afterWonRestart);

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
