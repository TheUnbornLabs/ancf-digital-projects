// jsdom Tier 2 playthrough suite for Crystal Grow (#62)
// Core loop: click empty space to plant a crystal seed (max 8). Seeds grow branches
// on their own. Fill TARGET_FILL (10%) of the canvas to win; if all seeds are placed
// and coverage is still short after STALL_LIMIT (9s) of no more seeds available, it's
// game over. Driven via window.__cfq: resetGame, plantCrystal, update, draw, etc.
//
// HISTORY — why the win-reachability checks below are phrased positively:
// this suite originally ASSERTED that "won" is never reachable ("strategy A never
// reaches won across 3 RNG seeds", "even the most generous strategy stays far short
// of the 60% target"). Those assertions were green against a build whose win screen
// could not be reached by any play at all: TARGET_FILL was 0.60 while the growth
// model could only ever paint ~3% of the canvas. The suite had encoded the bug as
// the spec, so it passed the broken build — exactly the Tier 2 failure the PROTOCOL
// warns about ("test the loop, not the step"), one level up: it tested that the loop
// terminates, never that it terminates in a state the player is trying to reach.
// A playthrough suite must assert that a competent player CAN win. It now does.
//
// IMPORTANT METHODOLOGY NOTE: the game's win/lose condition is decided by
// calcCoverage(), which rasterizes every crystal onto an OFFSCREEN <canvas> and
// counts lit pixels via getImageData(). The house-style canvas stub used by every
// other suite in this folder (and by audit.js) returns getImageData => {data:[]},
// which is fine for games that don't gate progress on real pixel counts, but for
// THIS game it would silently freeze `coverage` at 0 forever and make the win
// condition look permanently unreachable as a harness artifact rather than a real
// finding. So this suite's canvas stub for OFFSCREEN canvases (anything that isn't
// the on-page #game canvas) is a small faithful line-rasterizer: it tracks real
// moveTo/lineTo/stroke calls and paints real pixels into a real buffer, so
// getImageData returns geometry that actually reflects what the game drew. The
// on-screen #game canvas still gets the cheap no-op stub since nothing reads its
// pixels back. This is the ONLY way to tell a real "win is unreachable" finding
// apart from a harness artifact for a coverage-gated game, so the extra weight is
// load-bearing, not decoration.
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

// ../games is the shipping copy: this suite lives inside the repo it tests. (It once pointed at
// an absolute path to avoid a second, un-synced game tree — that hazard is gone now the tests are
// versioned alongside the games.) ANCF_GAMES overrides, same convention as audit.js.
const GAMES_DIR = process.env.ANCF_GAMES || path.join(__dirname, '..', 'games');
const GAME = process.argv[2] || path.join(GAMES_DIR, 'crystal-grow', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');
console.log('game under test: ' + GAME);

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }

// ---- cheap no-op stub for the on-screen canvas (nothing reads its pixels back) ----
const lightStub = el => new Proxy({}, {
  get(t, p) {
    if (p === 'measureText') return () => ({ width: 10 });
    if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop() {} });
    if (p === 'canvas') return el;
    if (p === 'getImageData') return () => ({ data: [] });
    return t[p] !== undefined ? t[p] : (() => {});
  },
  set() { return true; }
});

// ---- faithful-enough line rasterizer for OFFSCREEN canvases (calcCoverage's pixel count) ----
// Supports exactly the ops crystal-grow's drawCrystalOC()/calcCoverage() issue:
// fillStyle/fillRect (background clear, no-op since the buffer starts zeroed),
// strokeStyle/lineWidth/lineCap (tracked, lineWidth affects stroke thickness),
// beginPath/moveTo/lineTo/stroke (real geometry -> real pixels), getImageData (real data).
function makeRasterCanvas(el) {
  const w = el.width, h = el.height;
  const buf = new Uint8ClampedArray(w * h * 4);
  let curX, curY, lineWidth = 1, segments = [];
  function rasterLine(x0, y0, x1, y1) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    const half = Math.max(1, lineWidth / 2);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      for (let dx = -half; dx <= half; dx++) for (let dy = -half; dy <= half; dy++) {
        const px = Math.round(x + dx), py = Math.round(y + dy);
        if (px >= 0 && px < w && py >= 0 && py < h) {
          const idx = (py * w + px) * 4;
          buf[idx] = 255; buf[idx + 1] = 255; buf[idx + 2] = 255; buf[idx + 3] = 255;
        }
      }
    }
  }
  return {
    get canvas() { return el; },
    set fillStyle(v) {}, get fillStyle() { return '#000'; },
    set strokeStyle(v) {}, get strokeStyle() { return '#fff'; },
    set lineWidth(v) { lineWidth = v; }, get lineWidth() { return lineWidth; },
    set lineCap(v) {}, get lineCap() { return 'round'; },
    fillRect() {},
    beginPath() { segments = []; curX = undefined; curY = undefined; },
    moveTo(x, y) { curX = x; curY = y; },
    lineTo(x, y) { segments.push([curX, curY, x, y]); curX = x; curY = y; },
    stroke() { for (const s of segments) rasterLine(s[0], s[1], s[2], s[3]); segments = []; },
    closePath() {}, fill() {}, arc() {}, setLineDash() {},
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    getImageData() { return { data: buf }; },
    save() {}, restore() {}, translate() {},
  };
}

const pageErrors = [];
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: false,
  url: 'http://localhost/',
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = function () {
      return this.id === 'game' ? lightStub(this) : makeRasterCanvas(this);
    };
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;          // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});
const win = dom.window;
const g = win.__cfq;

const W = 960, H = 540;
// A grid of 8 points spread well clear of each other and of the canvas edges.
// Voids drift, so planting can still be rejected; retry with a jitter on failure.
const GRID = [[150, 140], [430, 140], [710, 140], [150, 400], [430, 400], [710, 400], [300, 270], [600, 270]];
function plantAllSpread(hook) {
  let planted = 0;
  for (const [ox, oy] of GRID) {
    let x = ox, y = oy, done = false;
    for (let a = 0; a < 30 && !done; a++) {
      const before = hook.crystals.length;
      hook.plantCrystal(x, y);
      if (hook.crystals.length > before) { done = true; planted++; }
      else { x += 13; if (x > 900) x = 80; y += 7; if (y > 500) y = 80; }
    }
  }
  return planted;
}
// A deliberately BAD line of play: all 8 seeds jammed against the left edge, so most of the
// branch growth runs off-canvas and never counts toward coverage. This is how a player loses.
const EDGE = [[20, 60], [20, 120], [20, 180], [20, 240], [20, 300], [20, 360], [20, 420], [20, 480]];
function plantEdge(hook) {
  let planted = 0;
  for (const [ox, oy] of EDGE) {
    const [x, y] = safeSpot(hook, ox, oy);
    const before = hook.crystals.length;
    hook.plantCrystal(x, y);
    if (hook.crystals.length > before) planted++;
  }
  return planted;
}
// Drive one round to a terminal state. Returns {term, peak}.
function playOut(hook, maxFrames) {
  let peak = 0, term = null;
  for (let i = 0; i < (maxFrames || 6000) && !term; i++) {
    hook.update(16);
    if (hook.coverage > peak) peak = hook.coverage;
    if (hook.game.state === 'won' || hook.game.state === 'gameover') term = hook.game.state;
  }
  return { term, peak };
}
function safeSpot(hook, hintX, hintY) {
  let x = hintX, y = hintY;
  for (let a = 0; a < 30; a++) {
    const clash = hook.voids.some(v => Math.hypot(x - v.x, y - v.y) < v.r + 10);
    if (!clash) return [x, y];
    x += 17; if (x > 900) x = 80; y += 11; if (y > 500) y = 80;
  }
  return [x, y];
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'plantCrystal', 'addBranch', 'calcCoverage', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.crystals) && Array.isArray(g.voids));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.MAX_SEEDS, 8, 'MAX_SEEDS is 8');
  eq(g.TARGET_FILL, 0.10, 'TARGET_FILL is 10% (must stay within what the growth model can paint)');

  let drewOk = true;
  g.resetGame();
  for (const st of ['title', 'playing', 'paused', 'won', 'gameover']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  ok('draw() runs in every state without throwing', drewOk);

  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame() starts a playing round');
  eq(g.crystals.length, 0, 'a fresh round starts with no crystals');
  eq(g.game.seedsUsed, 0, 'a fresh round starts with 0 seeds used');
  eq(g.coverage, 0, 'a fresh round starts at 0 coverage');

  /* ======================= CORE LOOP: single plant advances ======================= */
  console.log('\n--- core loop: one plant advances the game ---');
  g.resetGame();
  {
    const [x, y] = safeSpot(g, 480, 270);
    const before = { crystals: g.crystals.length, seeds: g.game.seedsUsed };
    g.plantCrystal(x, y);
    ok('planting a seed adds a crystal', g.crystals.length === before.crystals + 1);
    eq(g.game.seedsUsed, before.seeds + 1, 'planting a seed increments seedsUsed');
    eq(g.game.state, 'playing', 'planting a seed does not end the round');

    // let it grow and confirm real advancement (branch length AND measured coverage,
    // using the real drawn geometry via the raster stub - not merely a state flag).
    const c = g.crystals[0];
    const len0 = c.branches[0].len;
    for (let i = 0; i < 60; i++) g.update(16); // ~1s
    ok('a planted crystal grows its branch over time', c.branches[0].len > len0);
    for (let i = 0; i < 400; i++) g.update(16); // ~6.4s more, past the 200ms coverage-sample tick
    ok('measured coverage rises above 0 as the crystal grows', g.coverage > 0);
    // score is Math.floor(coverage*100); a single crystal's coverage can be well under
    // 1%, so score legitimately stays 0 here - what matters is it's never negative and
    // stays consistent with the measured coverage (real advancement, not a stuck value).
    ok('score is a non-negative function of coverage (Math.floor(coverage*100))', g.game.score === Math.floor(g.coverage * 100) && g.game.score >= 0);
  }

  /* ======================= THREE IN A ROW: still advancing, still accepting input ======================= */
  console.log('\n--- core loop x3: still advancing, still accepting input ---');
  g.resetGame();
  {
    const spots = [[300, 200], [600, 200], [450, 400]];
    let n = 0;
    for (const [hx, hy] of spots) {
      const [x, y] = safeSpot(g, hx, hy);
      const before = g.crystals.length;
      g.plantCrystal(x, y);
      if (g.crystals.length > before) n++;
    }
    eq(n, 3, 'three separate plants are all accepted');
    eq(g.crystals.length, 3, 'three crystals now exist');
    eq(g.game.seedsUsed, 3, 'seedsUsed reflects all three plants');
    eq(g.game.state, 'playing', 'still playing after three plants');
    // a fourth plant right after must still be accepted (no soft-lock creeping in)
    const [x4, y4] = safeSpot(g, 700, 450);
    const before4 = g.crystals.length;
    g.plantCrystal(x4, y4);
    ok('a fourth plant is still accepted immediately after three in a row', g.crystals.length === before4 + 1);
  }

  /* ======================= REJECTIONS DO NOT SOFT-LOCK ======================= */
  console.log('\n--- rejections (void / seed cap) leave the game playable ---');
  g.resetGame();
  {
    ok('at least one void exists to test rejection against', g.voids.length > 0);
    const v = g.voids[0];
    const before = g.crystals.length;
    g.plantCrystal(v.x, v.y); // dead center of a void -> must be rejected
    eq(g.crystals.length, before, 'planting on a void is rejected (no crystal added)');
    eq(g.game.state, 'playing', 'a rejected plant does not break the game state');
    // planting a legal seed right after a rejection must still work
    const [x, y] = safeSpot(g, 500, 300);
    const before2 = g.crystals.length;
    g.plantCrystal(x, y);
    ok('input is still accepted right after a rejected plant', g.crystals.length === before2 + 1);
  }
  g.resetGame();
  {
    plantAllSpread(g);
    eq(g.crystals.length, g.MAX_SEEDS, 'all 8 seeds can be planted');
    const before = g.crystals.length;
    g.plantCrystal(500, 300); // 9th seed, cap already reached
    eq(g.crystals.length, before, 'a 9th plant beyond MAX_SEEDS is rejected');
    eq(g.game.state, 'playing', 'being at the seed cap does not itself end the round');
  }

  /* ======================= EXHAUST THE FAIL CONDITION -> REAL ENDING ======================= */
  console.log('\n--- exhausting the fail condition reaches a real ending ---');
  // Poor placement (all 8 against the left edge, growth wasted off-canvas) must still be able to
  // stall out. Reachability across RNG seeds, not a single-seed guarantee: a competent line wins,
  // so the losing ending is only reachable by playing badly - which must remain possible.
  let gameoverCoverage = null;
  {
    let attempts = 0, term = null;
    while (attempts < 8 && term !== 'gameover') {
      g.resetGame();
      const planted = plantEdge(g);
      if (attempts === 0) eq(planted, g.MAX_SEEDS, 'all 8 seeds got planted for the exhaustion run');
      term = playOut(g).term;
      attempts++;
    }
    eq(term, 'gameover', 'a badly-placed garden (8 seeds on the edge) still ends in "Garden Stalled"');
    ok('the round genuinely stalled (stallT tripped the STALL_LIMIT)', g.game.stallT > 0);
    gameoverCoverage = g.coverage;
    console.log('    reached gameover in ' + attempts + ' attempt(s); coverage at gameover: '
      + (gameoverCoverage * 100).toFixed(2) + '% (target: ' + (g.TARGET_FILL * 100) + '%)');
    ok('coverage at gameover is genuinely short of the target', gameoverCoverage < g.TARGET_FILL);
  }

  /* ======================= RESTART FROM THAT ENDING -> PLAYABLE AGAIN ======================= */
  console.log('\n--- restart from gameover is playable again ---');
  {
    eq(g.game.state, 'gameover', 'precondition: we are on the gameover screen');
    g.resetGame(); // the real restart handler (index.html onDown(): title/won/gameover -> resetGame())
    eq(g.game.state, 'playing', 'resetGame() from gameover returns to playing');
    eq(g.crystals.length, 0, 'restarting clears all crystals');
    eq(g.game.seedsUsed, 0, 'restarting clears seedsUsed');
    eq(g.coverage, 0, 'restarting clears measured coverage');
    eq(g.game.stallT, 0, 'restarting clears the stall timer');
    const [x, y] = safeSpot(g, 480, 270);
    const before = g.crystals.length;
    g.plantCrystal(x, y);
    ok('planting works again immediately after restart', g.crystals.length === before + 1);
  }

  // repeat the exhaust -> restart cycle a second time to rule out one-shot luck
  console.log('\n--- a second exhaust -> restart cycle also works ---');
  {
    g.resetGame();
    plantAllSpread(g);
    let terminal = null;
    for (let i = 0; i < 3000 && !terminal; i++) { g.update(16); if (g.game.state === 'won' || g.game.state === 'gameover') terminal = g.game.state; }
    ok('a second playthrough also reaches a terminal state', terminal === 'won' || terminal === 'gameover');
    g.resetGame();
    eq(g.game.state, 'playing', 'restart works a second time too');
  }

  /* ======================= PAUSE (the closest thing to a modifier/skip mechanic) ======================= */
  console.log('\n--- pause freezes progress and resumes correctly ---');
  g.resetGame();
  {
    plantAllSpread(g); // trip into the stalled-but-not-yet-gameover window
    for (let i = 0; i < 100; i++) g.update(16); // ~1.6s into the 9s stall countdown, still playing
    ok('precondition: still playing, stall clock already running', g.game.state === 'playing' && g.game.stallT > 0);
    g.togglePause();
    eq(g.game.state, 'paused', 'togglePause() pauses an in-progress round');
    const stallSnapshot = g.game.stallT;
    for (let i = 0; i < 200; i++) g.update(16); // ~3.2s of updates while paused
    eq(g.game.stallT, stallSnapshot, 'the stall countdown does not advance while paused');
    eq(g.game.state, 'paused', 'the game stays paused across many update() calls');
    g.togglePause();
    eq(g.game.state, 'playing', 'togglePause() resumes an in-progress round');
    for (let i = 0; i < 50; i++) g.update(16);
    ok('the stall countdown resumes after unpausing', g.game.stallT > stallSnapshot);
  }

  /* ======================= NO SKIP / HINT / POWER-UP MECHANIC EXISTS ======================= */
  console.log('\n--- skip/hint/power-up path ---');
  ok('documented: Crystal Grow has no skip, hint, or power-up/bonus mechanic '
    + '(only plant-seed as the core action, plus pause/mute UI controls that are not '
    + 'consumable resources) - this checklist item does not apply to this game',
    typeof g.game.skips === 'undefined' && typeof g.game.hints === 'undefined' && typeof g.game.revealsLeft === 'undefined');

  /* ======================= WIN-CONDITION REACHABILITY (the central Tier 2 question) ======================= */
  console.log('\n--- can a competent player actually reach the "won" ending? ---');
  {
    // THE central assertion: a competent line of play must actually reach the win screen.
    // Coverage is measured off the real rasterized geometry, so this is a true reachability
    // result, not a state flag being poked.
    const trialsA = [];
    for (let t = 0; t < 5; t++) {
      g.resetGame();
      plantAllSpread(g);
      let peak = 0, terminal = null, secs = 0;
      for (let i = 0; i < 6000 && !terminal; i++) {
        g.update(16);
        if (g.coverage > peak) peak = g.coverage;
        if (g.game.state === 'won' || g.game.state === 'gameover') { terminal = g.game.state; secs = i * 16 / 1000; }
      }
      trialsA.push({ peak, terminal, secs });
    }
    trialsA.forEach((r, i) => console.log(`    trial A${i}: peak coverage ${(r.peak * 100).toFixed(2)}%, terminal=${r.terminal} at t=${r.secs.toFixed(1)}s`));
    const wins = trialsA.filter(r => r.terminal === 'won').length;
    ok(`a competent line (plant all 8, spread out) reaches "won" - ${wins}/5 RNG seeds won`, wins >= 4);
    ok('the winning runs actually crossed TARGET_FILL by measured geometry',
      trialsA.filter(r => r.terminal === 'won').every(r => r.peak >= g.TARGET_FILL));

    // The win must be earned inside the stall window, not by out-waiting it.
    ok('wins land before the 9s stall deadline', trialsA.filter(r => r.terminal === 'won').every(r => r.secs < 9.0));

    // Strategy B: below MAX_SEEDS the stall clock never arms, so growth can mature indefinitely.
    g.resetGame();
    const spots7 = GRID.slice(0, 7);
    for (const [hx, hy] of spots7) { const [x, y] = safeSpot(g, hx, hy); g.plantCrystal(x, y); }
    for (let i = 0; i < 600; i++) g.update(16);
    ok('with only 7/8 seeds planted the stall clock does not arm', g.game.stallT === 0);

    // Winning must pay a real score: the coverage + time + efficiency bonuses computed at the
    // moment of the win must SURVIVE the frame (update() used to re-derive score from coverage
    // immediately after calcCoverage() won the round, silently discarding both bonuses).
    g.resetGame();
    plantAllSpread(g);
    const rw = playOut(g);
    if (rw.term === 'won') {
      console.log(`    win score=${g.game.score} best=${g.game.best} coverage=${(g.coverage * 100).toFixed(2)}%`);
      ok('the win score keeps its time/efficiency bonuses (score > raw coverage%)',
        g.game.score > Math.floor(g.coverage * 100));
      ok('the win score is consistent with game.best (score >= best on a fresh best)', g.game.score <= g.game.best);
    } else {
      ok('scoring check ran on a winning round', false);
    }
  }

  /* ======================= WINNING IS REPEATABLE ACROSS ROUNDS ======================= */
  console.log('\n--- win -> restart -> win again (difficulty ramps with roundsWon) ---');
  {
    g.resetGame();
    let roundsWonSeen = 0;
    for (let round = 1; round <= 3; round++) {
      plantAllSpread(g);
      const r = playOut(g);
      console.log(`    round${round}: terminal=${r.term} peak=${(r.peak * 100).toFixed(2)}% voids=${g.voids.length} roundsWon=${g.game.roundsWon}`);
      if (r.term === 'won') roundsWonSeen++;
      g.resetGame();
      if (g.game.state !== 'playing') break;
    }
    ok('the game stays winnable round after round as difficulty ramps (3/3 rounds won)', roundsWonSeen === 3);
    eq(g.game.state, 'playing', 'still playable after three won rounds');
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
