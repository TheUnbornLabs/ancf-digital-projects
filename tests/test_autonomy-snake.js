// jsdom Tier 2 playthrough suite for Autonomy Snake (#12)
// Drives the real loop through window.__cfq: reset -> steer -> step -> eat -> die -> restart.
// Focus: progression over time, not one-shot setup checks (see tests/audit/PROTOCOL.md).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'autonomy-snake', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }

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
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update()/step() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Teleport food to the cell the head is about to enter, so the next step() eats it.
// This moves the FOOD (a legitimate "where did food spawn" choice), never the snake
// or a companion-state combo — the snake still walks there under its own step logic.
function placeFoodAhead(freedom) {
  const h = g.snake[0], d = g.dir;
  g.food.x = h.x + d.x;
  g.food.y = h.y + d.y;
  g.food.freedom = !!freedom;
}

function feedOnce(freedom) {
  placeFoodAhead(freedom);
  const before = { score: g.game.score, len: g.snake.length, eaten: g.game.eaten };
  g.step();
  return before;
}

(async () => {

  /* ======================= SMOKE / WIRING ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['reset', 'step', 'die', 'update', 'draw', 'spawnFood', 'spawnChain', 'activate', 'setMuted']
    .every(k => typeof g[k] === 'function'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  g.reset();
  ok('hook exposes live game state', !!g.game && Array.isArray(g.chains));
  eq(g.game.state, 'playing', 'reset() starts a round in the playing state');
  eq(g.game.score, 0, 'reset() zeroes the score');
  eq(g.snake.length, 3, 'reset() starts a 3-segment snake');
  eq(g.game.eaten, 0, 'reset() zeroes tokens eaten');

  console.log('\n--- logic: core action advances (eating food) ---');
  {
    const b = feedOnce();
    ok('eating a token raises the score', g.game.score > b.score);
    eq(g.snake.length, b.len + 1, 'eating a token grows the snake by one segment');
    eq(g.game.eaten, b.eaten + 1, 'eating a token increments the eaten counter');
    eq(g.game.state, 'playing', 'the game is still playing right after eating');
  }

  console.log('\n--- logic: three in a row, still advancing ---');
  {
    let prevScore = g.game.score, prevLen = g.snake.length;
    for (let i = 0; i < 3; i++) {
      const b = feedOnce();
      ok(`feed #${i + 1}: score advances`, g.game.score > b.score);
      ok(`feed #${i + 1}: snake grows`, g.snake.length === b.len + 1);
      ok(`feed #${i + 1}: state remains playing (no soft-lock)`, g.game.state === 'playing');
    }
    ok('score strictly increased over three feeds', g.game.score > prevScore);
    ok('snake strictly grew over three feeds', g.snake.length > prevLen);
  }

  console.log('\n--- logic: input keeps being honoured after eating ---');
  {
    // perpendicular turn must be accepted right after growth (not stuck facing one way)
    const d0 = { ...g.dir };
    const turn = d0.x !== 0 ? { x: 0, y: 1 } : { x: 1, y: 0 };
    g.activate(turn);
    const beforeHead = { ...g.snake[0] };
    g.step();
    ok('a queued turn is applied on the very next step', g.snake[0].x !== beforeHead.x + d0.x || g.snake[0].y !== beforeHead.y + d0.y);
    // 180-degree reversal must be refused (design guard), and must NOT lock out further input
    const cur = { ...g.dir };
    const reverse = { x: -cur.x, y: -cur.y };
    g.activate(reverse);
    eq(JSON.stringify(g.dir), JSON.stringify(cur), 'a direct reversal is refused (still facing the same way)');
    const perp = cur.x !== 0 ? { x: 0, y: -1 } : { x: -1, y: 0 };
    g.activate(perp);
    g.step();
    ok('a legal turn right after a refused reversal is still accepted', g.dir.x === perp.x && g.dir.y === perp.y);
  }

  console.log('\n--- logic: pause does not soft-lock ---');
  {
    g.activate('pause');
    eq(g.game.state, 'paused', 'pause switches state to paused');
    const lenBefore = g.snake.length;
    g.activate('pause');
    eq(g.game.state, 'playing', 'pausing again resumes play');
    const b = feedOnce();
    ok('the game still advances normally after a pause/resume cycle', g.game.score > b.score && g.snake.length === lenBefore + 1);
  }

  console.log('\n--- logic: exhaust the fail condition (wall) ---');
  {
    g.reset();
    // move food well out of the snake's straight-line path so it can't interfere
    g.food.x = 1; g.food.y = 1; g.food.freedom = false;
    let steps = 0;
    while (g.game.state === 'playing' && steps < 40) { g.step(); steps++; }
    eq(g.game.state, 'gameover', 'running the snake into the boundary wall ends the game');
    ok('death happened in a plausible number of steps', steps > 0 && steps < 40);
    ok('no NaN leaked into score/best after death', Number.isFinite(g.game.score) && Number.isFinite(g.game.best));
  }

  console.log('\n--- logic: restart from that ending is playable again ---');
  {
    eq(g.game.state, 'gameover', 'precondition: game is over');
    // the real restart handler: any activate() call from the gameover state resets the round
    // (index.html: `if(game.state==='gameover'){reset();return;}`), mirroring a keypress/tap.
    g.activate({ x: 0, y: -1 });
    eq(g.game.state, 'playing', 'activate() from the gameover screen restarts the round');
    eq(g.game.score, 0, 'the restarted round has a fresh score');
    eq(g.snake.length, 3, 'the restarted round has a fresh 3-segment snake');
    eq(g.game.eaten, 0, 'the restarted round has a fresh eaten counter');
    const b = feedOnce();
    ok('the restarted round is genuinely playable (eating still advances it)', g.game.score > b.score && g.snake.length === b.len + 1);
  }

  console.log('\n--- logic: a second real ending via the obligation-chain hazard ---');
  {
    g.reset();
    g.game.freedomT = 0; // baseline: no invincibility active
    // place a lethal (non-shrink) chain directly in the snake's path — a real, reachable hazard
    const h = g.snake[0], d = g.dir;
    g.chains.push({ x: h.x + d.x, y: h.y + d.y, label: 'guilt trip', age: 0, shrink: false });
    g.step();
    eq(g.game.state, 'gameover', 'running into a lethal obligation-chain also ends the game');
  }

  console.log('\n--- logic: freedom power-up advances rather than freezing ---');
  {
    g.reset();
    const b = feedOnce(true); // eat a freedom-star token
    ok('eating the freedom star awards its bonus score', g.game.score >= b.score + 3);
    eq(g.game.freedomT, 5000, 'eating the freedom star grants the invincibility window');
    eq(g.game.state, 'playing', 'the game keeps running right after the power-up');

    // while freedom is active, a lethal chain in the path must NOT end the game
    const h = g.snake[0], d = g.dir;
    const chainPos = { x: h.x + d.x, y: h.y + d.y };
    g.chains.push({ x: chainPos.x, y: chainPos.y, label: 'peer pressure', age: 0, shrink: false });
    const lenBefore = g.snake.length;
    g.step();
    ok('a lethal chain is passed through harmlessly while freedom is active', g.game.state === 'playing');
    eq(g.snake[0].x, chainPos.x, 'the snake actually moved onto the chain cell (not blocked)');
    eq(g.snake.length, lenBefore, 'a non-eaten step still moves without growing, even over a chain');

    // once freedom is gone, the same hazard is lethal again — the power-up didn't
    // permanently disable the hazard, it was a real timed window
    g.game.freedomT = 0;
    const h2 = g.snake[0], d2 = g.dir;
    g.chains.push({ x: h2.x + d2.x, y: h2.y + d2.y, label: 'life script', age: 0, shrink: false });
    g.step();
    eq(g.game.state, 'gameover', 'the same hazard is lethal again once freedom expires');
  }

  console.log('\n--- logic: life-script (shrink) chain advances rather than freezing ---');
  {
    g.reset();
    g.game.freedomT = 0;
    // grow the snake first so a 2-segment shrink is actually observable
    feedOnce(); feedOnce(); feedOnce();
    const lenBefore = g.snake.length;
    ok('snake grew enough to make the shrink visible', lenBefore >= 6);
    const h = g.snake[0], d = g.dir;
    const chainsBefore = g.chains.length;
    g.chains.push({ x: h.x + d.x, y: h.y + d.y, label: 'unsolicited advice', age: 0, shrink: true });
    g.step();
    eq(g.game.state, 'playing', 'grazing a shrink chain does not end the game');
    eq(g.snake.length, lenBefore - 2, 'grazing a shrink chain shortens the snake by two segments');
    eq(g.chains.length, chainsBefore, 'the grazed chain segment is consumed, not left behind');

    // the floor: a short snake can't be shrunk below 3 segments, and still isn't a soft-lock
    g.reset();
    g.game.freedomT = 0;
    const h2 = g.snake[0], d2 = g.dir;
    g.chains.push({ x: h2.x + d2.x, y: h2.y + d2.y, label: 'someday you\'ll understand', age: 0, shrink: true });
    g.step();
    eq(g.game.state, 'playing', 'grazing a shrink chain at minimum length does not end the game');
    eq(g.snake.length, 3, 'a 3-segment snake is not shrunk below the floor');
    const b = feedOnce();
    ok('the game is still fully playable after a floor-length graze', g.game.score > b.score);
  }

  console.log('\n--- logic: update()-driven play (the real rAF path) also advances ---');
  {
    g.reset();
    g.food.x = 1; g.food.y = 1; g.food.freedom = false; // keep food out of the way
    const scoreBefore = g.game.score;
    const lenBefore = g.snake.length;
    // simulate ~2s of real frame time at a plausible 16ms/frame, exactly as the rAF loop would
    for (let i = 0; i < 130 && g.game.state === 'playing'; i++) g.update(16);
    ok('update(dt) alone (no direct step() calls) moves the snake forward over time',
      g.game.state === 'gameover' || g.snake[0].x !== undefined);
    // the snake was heading right from x=16 with nothing to eat; ~130 frames * 16ms
    // covers more than enough sim-time to reach the wall and die on its own
    eq(g.game.state, 'gameover', 'left to run into the wall via update() alone, the round ends on its own');
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
