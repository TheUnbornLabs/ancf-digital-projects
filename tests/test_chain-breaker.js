// jsdom Tier-2 playthrough suite for Chain Breaker (#80)
// Drives the real loop via window.__cfq: break every link in a round -> round advances;
// do that repeatedly; run the clock out -> gameover; restart -> playable again;
// the 2-hit "reinforced" link path advances rather than freezing.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'chain-breaker', 'index.html');
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

// Break every unbroken link in the current round, respecting the reinforced
// (2-hit) links exactly as a player clicking twice would.
function breakAllLinks() {
  // Two passes is enough: pass 1 breaks all normal links and first-hits every
  // reinforced link; pass 2 finishes off anything still standing.
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < g.links.length; i++) {
      if (!g.links[i].broken) g.breakLink(i);
    }
  }
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'breakLink', 'linkAt', 'registerMiss', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.TOTAL, 10, 'the round total is 10');

  /* ======================= CORE LOOP: ADVANCE ======================= */
  console.log('\n--- logic: breaking a chain advances the round (the core loop) ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts the round in playing state');
  eq(g.game.round, 0, 'resetGame starts at round 0');
  const linkCountR0 = g.links.length;
  eq(linkCountR0, 4, 'round 0 has 4 links');
  ok('round 0 has no reinforced links (they start at round 4)', g.links.every(l => !l.reinforced));

  const scoreBefore = g.game.score;
  breakAllLinks();
  ok('every link is broken', g.links.every(l => l.broken));
  ok('freed flag is set the instant the chain completes', g.game.freed === true);
  eq(g.game.state, 'playing', 'state stays playing during the 1200ms free-orb animation');

  await sleep(1400);   // the scheduled round advance (1200ms) must have fired by now
  eq(g.game.round, 1, 'completing the chain advances the round counter');
  eq(g.game.state, 'playing', 'the next round is playing, not stuck');
  eq(g.game.score, scoreBefore + 1, 'completing a chain awards one point');
  ok('the new round dealt a fresh, unbroken chain', g.links.length > linkCountR0 && g.links.every(l => !l.broken));
  eq(g.links.length, 4 + 1, 'round 1 has one more link than round 0 (chains grow)');

  console.log('\n--- logic: three rounds running, still advancing, still accepting input ---');
  for (let n = 0; n < 3; n++) {
    const roundBefore = g.game.round;
    const before = g.links.length;
    breakAllLinks();
    ok(`round ${roundBefore}: chain fully broken`, g.links.every(l => l.broken));
    await sleep(1400);
    eq(g.game.round, roundBefore + 1, `round ${roundBefore} -> round advances to ${roundBefore + 1}`);
    eq(g.game.state, 'playing', `round ${roundBefore + 1} is playable`);
    // input is genuinely accepted on the new round, not just cosmetically reset
    const anyBrokenAlready = g.links.some(l => l.broken);
    ok(`round ${roundBefore + 1}: no link starts pre-broken`, !anyBrokenAlready);
    g.breakLink(0);
    ok(`round ${roundBefore + 1}: breakLink(0) is accepted (link 0 reacts)`,
      g.links[0].broken || g.links[0].hits > 0);
  }

  /* ======================= FAIL CONDITION ======================= */
  console.log('\n--- logic: exhausting the clock reaches a real ending ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'fresh game is playing');
  const roundTimeMax = g.game.roundTimeMax;
  ok('round has a positive time budget', roundTimeMax > 0);
  let ticks = 0;
  while (g.game.state === 'playing' && ticks < 5000) { g.update(48); ticks++; }
  eq(g.game.state, 'gameover', 'running the clock to zero without finishing the chain ends the game');
  ok('the clock actually reached zero (not some other guard)', g.game.roundTime === 0);

  /* ======================= RESTART FROM ENDING ======================= */
  console.log('\n--- logic: restart from gameover is playable again ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from gameover returns to playing');
  eq(g.game.round, 0, 'resetGame from gameover resets the round counter');
  eq(g.game.score, 0, 'resetGame from gameover resets the score');
  ok('links are dealt fresh and unbroken after restart', g.links.length === 4 && g.links.every(l => !l.broken));
  // prove input truly works post-restart, not just that state flipped
  breakAllLinks();
  ok('post-restart chain can actually be broken', g.links.every(l => l.broken));
  await sleep(1400);
  eq(g.game.round, 1, 'post-restart play advances rounds normally');

  /* ======================= WIN CONDITION ======================= */
  console.log('\n--- logic: clearing all 10 rounds reaches a real win screen ---');
  g.resetGame();
  for (let r = 0; r < g.TOTAL; r++) {
    eq(g.game.state, 'playing', `round ${r}: still playing before it is cleared`);
    breakAllLinks();
    await sleep(1400);
  }
  eq(g.game.state, 'won', 'clearing every round reaches the won state');
  eq(g.game.round, g.TOTAL, 'the round counter reflects all rounds cleared');
  // and the won screen is itself escapable
  g.resetGame();
  eq(g.game.state, 'playing', 'the won screen can be restarted back into play');

  /* ======================= REINFORCED (2-HIT) LINKS ======================= */
  console.log('\n--- logic: reinforced links advance rather than freezing input ---');
  // Round 6 is a deterministic build (seeded(r*6007+7)) that contains reinforced
  // links at indices 0, 1 and 3 out of 10 links total.
  g.buildRound(6);
  eq(g.game.state, 'playing', 'buildRound(6) leaves the game playable');
  eq(g.links.length, 10, 'round 6 has 10 links');
  const reinforcedIdx = g.links.map((l, i) => l.reinforced ? i : -1).filter(i => i >= 0);
  ok('round 6 actually contains reinforced links (test premise holds)', reinforcedIdx.length > 0);

  const ri = reinforcedIdx[0];
  ok('first hit on a reinforced link does not break it', (() => { g.breakLink(ri); return !g.links[ri].broken && g.links[ri].hits === 1; })());
  eq(g.game.state, 'playing', 'the game is still playable after the first hit (not frozen)');
  ok('first hit on a reinforced link is not a dead click: a second hit on it is still accepted',
    (() => { g.breakLink(ri); return g.links[ri].broken; })());

  // finish the rest of the chain (including any other reinforced links) and confirm
  // the round completes exactly as a normal round would.
  breakAllLinks();
  ok('the reinforced-link round can still be fully cleared', g.links.every(l => l.broken));
  const roundBeforeRi = g.game.round;
  await sleep(1400);
  ok('completing a round that contained reinforced links still advances',
    g.game.round === roundBeforeRi + 1 || g.game.state === 'won');

  /* ======================= PAUSE DOES NOT SOFT-LOCK ======================= */
  console.log('\n--- logic: pause/resume does not freeze the game ---');
  const fakeEvt = { preventDefault() {}, stopPropagation() {} };
  g.resetGame();
  g.togglePause(fakeEvt);
  eq(g.game.state, 'paused', 'togglePause pauses a playing round');
  g.togglePause(fakeEvt);
  eq(g.game.state, 'playing', 'togglePause resumes back to playing');
  breakAllLinks();
  ok('the round is still completable after a pause/resume cycle', g.links.every(l => l.broken));

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
