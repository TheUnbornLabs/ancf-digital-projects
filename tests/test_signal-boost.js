// jsdom Tier 2 playthrough suite for Signal Boost (#65)
// Core loop: toggle nodes ON/OFF to route a signal from SOURCE to RECEIVER through
// ON-nodes, avoiding "noise" nodes, then press SEND. 10 rounds, 5 lives.
// This suite drives the real loop through window.__cfq and asserts PROGRESSION
// (round advances, lives fall, a real ending is reached, restart works) rather
// than one-shot setup checks.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'signal-boost', 'index.html');
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

// The hook has no exposed "start" call — in the real game, clicking the title/
// won/gameover panel calls resetGame() then sets state='playing' (index.html
// onDown, ~line 456). Replicate exactly that, the same entry point a player uses.
function startGame() {
  g.resetGame();
  g.game.state = 'playing';
}

// Find a src->sink path over the RAW edge graph (ignores on/off), same BFS the
// game's own hint feature (litPathAny) uses to find a structural route. Returns
// an array of node indices from source to sink inclusive.
function findPath() {
  const nodes = g.nodes, edges = g.edges;
  const srcIdx = nodes.findIndex(n => n.source);
  const sinkIdx = nodes.findIndex(n => n.sink);
  const parent = new Array(nodes.length).fill(-1);
  const vis = new Set([srcIdx]); const q = [srcIdx];
  while (q.length) {
    const i = q.shift(); if (i === sinkIdx) break;
    for (const e of edges) {
      if (e.a === i || e.b === i) {
        const oi = e.a === i ? e.b : e.a;
        if (!vis.has(oi)) { vis.add(oi); parent[oi] = i; q.push(oi); }
      }
    }
  }
  const p = []; let cur = sinkIdx;
  while (cur !== srcIdx && parent[cur] !== -1) { p.unshift(cur); cur = parent[cur]; }
  p.unshift(srcIdx);
  return p;
}

// A competent player: find a route, switch every node on it ON (the game only
// lets a player toggle non-source/non-sink nodes — same guard onDown applies),
// then press send. This is the exact "solve the puzzle" action a real player
// performs each round.
function solveAndSend() {
  const p = findPath();
  for (const ni of p) {
    const n = g.nodes[ni];
    if (!n.source && !n.sink && !n.on) g.toggleNode(ni);
  }
  g.checkSignal();
}

// Deterministically make the NEXT checkSignal() fail, regardless of round
// layout or default node state. Turns every toggleable node off (what a
// player who mis-reads the network would do), and if that's not enough to
// keep the sink dark (a direct SRC-RCV edge can exist), forces the sink off
// too. This is a harness convenience for reaching the fail path quickly —
// not a claim about what's reachable through the UI's own restrictions.
function forceFail() {
  for (const n of g.nodes) {
    if (!n.source && !n.sink && n.on) {
      const ni = g.nodes.indexOf(n);
      g.toggleNode(ni);
    }
  }
  const sinkIdx = g.nodes.findIndex(n => n.sink);
  if (g.nodes[sinkIdx].lit) g.toggleNode(sinkIdx);
  g.checkSignal();
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'checkSignal', 'propagate', 'nodeAt',
    'update', 'draw', 'toggleNode', 'undoToggle', 'useHint', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game/nodes/edges state', !!g.game && Array.isArray(g.nodes) && Array.isArray(g.edges));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.TOTAL, 10, 'the round total is 10');

  let drewOk = true;
  startGame();
  for (const st of ['title', 'playing', 'paused', 'won', 'gameover']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  ok('draw() runs in every state without throwing', drewOk);
  startGame();   // clear the forced states above

  let updateOk = true;
  try { for (const dt of [0, 16, 16.7, 1000, -5]) g.update(dt); for (let i = 0; i < 200; i++) g.update(16); }
  catch (e) { updateOk = false; console.log('    update threw: ' + e.message); }
  ok('update() tolerates odd dt and long runs', updateOk);

  /* ======================= LOGIC: THE CORE LOOP ======================= */
  console.log('\n--- logic: core loop advances (catches soft-locks) ---');
  startGame();
  eq(g.game.state, 'playing', 'starting a game sets state to playing');
  eq(g.game.round, 0, 'a fresh game starts on round 0');
  eq(g.game.lives, 5, 'a fresh game starts with 5 lives');

  const roundBefore = g.game.round;
  const scoreBefore = g.game.score;
  solveAndSend();
  ok('a correct solve is accepted (awaitingNext set)', g.game.awaitingNext === true);
  eq(g.game.score, scoreBefore + 1, 'a correct solve raises the score immediately');

  await sleep(700);   // the scheduled round transition (600ms) must have fired by now
  eq(g.game.round, roundBefore + 1, 'a correct solve + send advances to the next round');
  eq(g.game.awaitingNext, false, 'input is unblocked on the new round');
  eq(g.game.state, 'playing', 'still playing after advancing');
  ok('the new round has a freshly built node layout', g.nodes.length > 0);

  console.log('\n--- logic: three rounds running, still accepting input ---');
  for (let i = 0; i < 3; i++) {
    const r0 = g.game.round;
    solveAndSend();
    ok(`round ${r0}: solve is accepted`, g.game.awaitingNext === true);
    await sleep(700);
    eq(g.game.round, r0 + 1, `round ${r0}: advances to round ${r0 + 1}`);
    eq(g.game.awaitingNext, false, `round ${r0}: playable again after advancing`);
    eq(g.game.state, 'playing', `round ${r0}: still in playing state`);
  }

  console.log('\n--- logic: playing every round through to a real win ---');
  startGame();
  let roundsPlayed = 0;
  while (g.game.state === 'playing' && roundsPlayed < 30) {
    solveAndSend();
    await sleep(700);
    roundsPlayed++;
  }
  eq(g.game.state, 'won', 'clearing all 10 rounds reaches the won screen');
  eq(g.game.round, 10, 'the round counter reflects all 10 rounds cleared');
  ok('a real win is reached within the expected number of rounds (10)', roundsPlayed === 10);

  console.log('\n--- logic: restart from the win screen ---');
  ok('canvas draws the won panel without throwing', (() => { try { g.draw(); return true; } catch (e) { return false; } })());
  startGame();   // replays the game's own resetGame()+state='playing' entry point
  eq(g.game.state, 'playing', 'a game can be started again after a win');
  eq(g.game.round, 0, 'round resets to 0 after restarting from a win');
  eq(g.game.lives, 5, 'lives reset to 5 after restarting from a win');
  solveAndSend();
  await sleep(700);
  ok('input is accepted again after restarting from a win', g.game.round === 1);

  console.log('\n--- logic: exhausting lives reaches a real game over ---');
  startGame();
  let guard = 0;
  while (g.game.state === 'playing' && g.game.lives > 0 && guard < 20) {
    const livesBefore = g.game.lives;
    forceFail();
    if (g.game.lives === livesBefore && g.game.state === 'playing') {
      // forceFail should always register a failed attempt; if it didn't, stop
      // rather than spin — this would itself be a finding.
      break;
    }
    guard++;
    if (g.game.state !== 'gameover') await sleep(50);
  }
  await sleep(350);   // the last-life -> gameover transition is scheduled 280ms out
  eq(g.game.lives, 0, 'lives are fully exhausted');
  eq(g.game.state, 'gameover', 'losing the last life ends the game with a real gameover state');
  ok('draws the gameover panel without throwing', (() => { try { g.draw(); return true; } catch (e) { return false; } })());

  console.log('\n--- logic: restart from game over ---');
  startGame();
  eq(g.game.state, 'playing', 'a game can be started again after a game over');
  eq(g.game.lives, 5, 'lives are restored after restarting from a game over');
  eq(g.game.round, 0, 'round resets to 0 after restarting from a game over');
  solveAndSend();
  ok('an awaitingNext transition is accepted right after a game-over restart', g.game.awaitingNext === true);
  await sleep(700);
  eq(g.game.round, 1, 'the game advances normally after a game-over restart');
  eq(g.game.state, 'playing', 'still playing after advancing post-restart');

  /* ======================= LOGIC: HINT / UNDO (bonus paths) ======================= */
  console.log('\n--- logic: hint path advances rather than freezing ---');
  startGame();
  const bonusBefore = g.game.bonus;
  g.useHint();
  ok('using a hint sets a visible hint edge', g.game.hintEdge >= 0 && g.game.hintT > 0);
  eq(g.game.bonus, Math.max(0, bonusBefore - 1), 'using a hint spends a bonus point (floored at 0)');
  // the game must still be fully playable and able to advance after a hint
  solveAndSend();
  ok('a solve is still accepted after using a hint', g.game.awaitingNext === true);
  await sleep(700);
  eq(g.game.round, 1, 'the round still advances after a hint was used');
  eq(g.game.awaitingNext, false, 'input is unblocked after advancing post-hint');

  console.log('\n--- logic: hint cooldown expires via update(), does not permanently lock ---');
  startGame();
  g.useHint();
  ok('hint is on cooldown immediately after use', g.game.hintT > 0);
  for (let i = 0; i < 200 && g.game.hintT > 0; i++) g.update(16);
  eq(g.game.hintT, 0, 'the hint cooldown fully decays with enough update() ticks');
  eq(g.game.hintEdge, -1, 'the hint edge clears once the cooldown decays');
  g.useHint();
  ok('a second hint can be used once the cooldown has decayed', g.game.hintT > 0);

  console.log('\n--- logic: undo does not desync propagation or block play ---');
  startGame();
  const path = findPath();
  const midNode = path.find(ni => !g.nodes[ni].source && !g.nodes[ni].sink);
  if (midNode !== undefined) {
    const onBefore = g.nodes[midNode].on;
    g.toggleNode(midNode);
    ok('toggling a node flips its on state', g.nodes[midNode].on === !onBefore);
    g.undoToggle();
    eq(g.nodes[midNode].on, onBefore, 'undo reverts the last toggle');
  } else {
    ok('SKIPPED undo test (round has no toggleable node on the solving path)', true);
  }
  // the game must remain fully playable after an undo
  solveAndSend();
  ok('a solve is accepted after using undo', g.game.awaitingNext === true);
  await sleep(700);
  eq(g.game.round, 1, 'the round advances normally after an undo');

  console.log('\n--- logic: best score persists to localStorage across a played round ---');
  startGame();
  solveAndSend();
  await sleep(700);
  const savedBest = win.localStorage.getItem('signalboost_best');
  ok('a best score is persisted to localStorage after a scoring round', savedBest !== null && parseInt(savedBest, 10) >= 1);

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
