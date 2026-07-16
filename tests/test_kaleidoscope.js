// jsdom test harness for Kaleidoscope (#52)
// A meditative drawing toy: paint mirrored strokes to fill a coverage meter to
// TARGET_COVERAGE (45%). No lives/lose-state — the only "ending" is the win screen.
//
// Why this suite needs a REAL canvas, not the usual stub:
// the game's whole progress metric (game.coverage) is computed by reading real
// pixels back out of an offscreen canvas via getImageData() (see calcCoverage()).
// The house-style stub used by every other suite here returns getImageData() ->
// {data:[]}, which would silently freeze coverage at 0 forever and make the win
// condition permanently unreachable in a way that has nothing to do with the game
// -- a harness artifact, not a bug. So this file implements a small transform-aware
// rasterizer (save/restore/translate/rotate/scale + circle-fill + getImageData/
// putImageData) so the coverage meter reflects what was actually "painted",
// exactly like a real <canvas> would.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'kaleidoscope', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }

const W = 960, H = 540;

// ---- real-enough 2D context ----
function makeCtx(canvasEl) {
  const cw = canvasEl.width || W, ch = canvasEl.height || H;
  const buf = new Uint8ClampedArray(cw * ch * 4);
  let m = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  let stack = [];
  let lastArc = null;

  function mul(p, q) {
    return {
      a: p.a * q.a + p.c * q.b, b: p.b * q.a + p.d * q.b,
      c: p.a * q.c + p.c * q.d, d: p.b * q.c + p.d * q.d,
      e: p.a * q.e + p.c * q.f + p.e, f: p.b * q.e + p.d * q.f + p.f
    };
  }
  function applyPt(x, y) { return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }; }
  function scaleMag() { return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1; }
  function idx(x, y) { return (y * cw + x) * 4; }
  function stampCircle(cx, cy, r) {
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(cw - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(ch - 1, Math.ceil(cy + r));
    const r2 = r * r;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx + 0.5, dy = y - cy + 0.5;
        if (dx * dx + dy * dy <= r2) { const i = idx(x, y); buf[i] = 255; buf[i + 1] = 255; buf[i + 2] = 255; buf[i + 3] = 255; }
      }
    }
  }
  function fillRectDevice(x, y, w, h, transparent) {
    const x0 = Math.max(0, Math.floor(x)), x1 = Math.min(cw, Math.ceil(x + w));
    const y0 = Math.max(0, Math.floor(y)), y1 = Math.min(ch, Math.ceil(y + h));
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { const i = idx(xx, yy); buf[i] = 0; buf[i + 1] = 0; buf[i + 2] = 0; buf[i + 3] = transparent ? 0 : 255; }
  }

  const methods = {
    save() { stack.push({ a: m.a, b: m.b, c: m.c, d: m.d, e: m.e, f: m.f }); },
    restore() { if (stack.length) m = stack.pop(); },
    translate(tx, ty) { m = mul(m, { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty }); },
    rotate(theta) { const c = Math.cos(theta), s = Math.sin(theta); m = mul(m, { a: c, b: s, c: -s, d: c, e: 0, f: 0 }); },
    scale(sx, sy) { m = mul(m, { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 }); },
    setTransform(a, b, c, d, e, f) { m = { a, b, c, d, e, f }; },
    resetTransform() { m = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }; },
    beginPath() { lastArc = null; },
    closePath() {}, moveTo() {}, lineTo() {}, arcTo() {}, rect() {},
    arc(x, y, r) { lastArc = { x, y, r }; },
    fill() { if (lastArc) { const c = applyPt(lastArc.x, lastArc.y); stampCircle(c.x, c.y, lastArc.r * scaleMag()); } },
    stroke() {}, // the game only ever fills circles into the coverage canvas; strokes are visual-only
    fillRect(x, y, w, h) { fillRectDevice(x, y, w, h, false); },
    clearRect(x, y, w, h) { fillRectDevice(x, y, w, h, true); },
    getImageData(sx, sy, sw, sh) { return { data: buf.slice(0), width: cw, height: ch }; },
    putImageData(img) { if (img && img.data) buf.set(img.data); },
    drawImage() {},
    measureText() { return { width: 10 }; },
    createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { return { addColorStop() {} }; },
  };
  return new Proxy(methods, {
    get(t, p) { if (p === 'canvas') return canvasEl; if (p in t) return t[p]; return () => {}; },
    set(t, p, v) { t[p] = v; return true; }
  });
}

const pageErrors = [];
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: false,
  url: 'http://localhost/',
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = function () { if (!this.__ctx) this.__ctx = makeCtx(this); return this.__ctx; };
    // jsdom does no layout, so getBoundingClientRect() is all-zero by default;
    // the game divides by rect.width/height in getPos(), so 0 would produce
    // Infinity/NaN coordinates that have nothing to do with the game's own logic.
    w.HTMLElement.prototype.getBoundingClientRect = function () { return { left: 0, top: 0, right: W, bottom: H, width: W, height: H, x: 0, y: 0, toJSON() { return {}; } }; };
    w.requestAnimationFrame = () => 0;  // disable auto-loop; we drive update()/draw() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;
const canvasEl = win.document.getElementById('game');

function fire(type, x, y) {
  const ev = new win.MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true });
  canvasEl.dispatchEvent(ev);
}
function stroke(points) {
  fire('mousedown', points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) fire('mousemove', points[i][0], points[i][1]);
  fire('mouseup', points[points.length - 1][0], points[points.length - 1][1]);
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetCanvas', 'calcCoverage', 'paint', 'update', 'draw',
    'undoLastStroke', 'togglePause', 'toggleMute', 'cyclePalette', 'doReset', 'getBest']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.PALETTES) && typeof g.TARGET_COVERAGE === 'number');
  ok('canvas element is present', !!canvasEl);
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.game.state, 'title', 'game boots into the title state');

  /* ======================= CORE LOOP ======================= */
  console.log('\n--- core loop: starting play & the first stroke advances coverage ---');
  fire('mousedown', 480, 270);   // first click from the title screen just starts play, no paint yet
  fire('mouseup', 480, 270);
  eq(g.game.state, 'playing', 'clicking the title screen starts play');
  eq(g.game.coverage, 0, 'coverage starts at 0 in a fresh round');
  eq(g.game.strokeCount, 0, 'stroke count starts at 0 in a fresh round');

  const sc0 = g.game.strokeCount;
  stroke([[100, 100], [140, 140], [180, 100], [220, 160]]);
  ok('a stroke increments strokeCount', g.game.strokeCount === sc0 + 1);
  g.calcCoverage();
  const covAfter1 = g.game.coverage;
  ok('the core action (a stroke) advances coverage off zero -- the check that catches a soft-lock', covAfter1 > 0);

  console.log('\n--- core loop: three more strokes running, still advancing & accepting input ---');
  let prevCov = covAfter1, prevStrokes = g.game.strokeCount;
  for (let i = 0; i < 3; i++) {
    const bx = 150 + i * 150, by = 200 + i * 60;
    stroke([[bx, by], [bx + 40, by + 30], [bx + 80, by], [bx + 40, by - 30]]);
    g.calcCoverage();
    ok(`stroke #${i + 2} increments strokeCount`, g.game.strokeCount === prevStrokes + 1);
    ok(`stroke #${i + 2} does not decrease coverage`, g.game.coverage >= prevCov);
    prevStrokes = g.game.strokeCount; prevCov = g.game.coverage;
  }
  ok('after 4 consecutive strokes the game is still playing (no soft-lock)', g.game.state === 'playing' && !g.game.won);

  /* ======================= REACH A REAL ENDING ======================= */
  console.log('\n--- reaching the win condition (this game\'s only ending) ---');
  // Kaleidoscope has no lose-state (no lives/timeout-death) -- the sole ending
  // is the win screen at TARGET_COVERAGE. Sweep a dense, deterministic grid over
  // the whole canvas via the exposed paint() hook (each dab is auto-mirrored into
  // 16 places by the game's own 8-fold symmetry) and call update() periodically
  // so the game's own coverageT/500ms gate recomputes coverage and checks the
  // win condition exactly the way it does during normal play.
  const stepsX = 40, stepsY = 24;
  let iterations = 0;
  const MAX_ITER = stepsX * stepsY;
  outer:
  for (let iy = 0; iy < stepsY; iy++) {
    for (let ix = 0; ix < stepsX; ix++) {
      g.paint((ix / (stepsX - 1)) * W, (iy / (stepsY - 1)) * H, '#fff');
      iterations++;
      if (iterations % 4 === 0) g.update(500);
      if (g.game.won) break outer;
    }
  }
  g.update(500);
  ok('the game reaches its own win condition (a real ending) from ordinary play', g.game.won === true);
  ok(`reaching the ending took a bounded number of dabs (${iterations}/${MAX_ITER})`, iterations < MAX_ITER);
  ok('coverage at the win threshold is at least TARGET_COVERAGE', g.game.coverage >= g.TARGET_COVERAGE);
  eq(g.game.state, 'playing', 'the win is represented as a flag on the playing state, not a separate game-over state');
  let drawOkAtWin = true;
  try { g.draw(); } catch (e) { drawOkAtWin = false; console.log('    draw() threw at the win screen: ' + e.message); }
  ok('draw() renders the win screen without throwing', drawOkAtWin);
  const bestAtWin = g.getBest();
  ok('winning records a real best time (not the null "no record" sentinel)', typeof bestAtWin.bestTime === 'number' && bestAtWin.bestTime >= 0);
  ok('winning records a real best stroke count', typeof bestAtWin.bestStrokes === 'number' && bestAtWin.bestStrokes >= 0);

  /* ======================= RESTART FROM THE ENDING ======================= */
  console.log('\n--- restart from the ending is playable again ---');
  const palBefore = g.game.palIdx;
  fire('mousedown', 480, 270);   // the game's own restart handler for the win screen
  fire('mouseup', 480, 270);
  eq(g.game.won, false, 'clicking the win screen clears the won flag');
  eq(g.game.coverage, 0, 'clicking the win screen resets coverage to 0');
  eq(g.game.strokeCount, 0, 'clicking the win screen resets the stroke count');
  eq(g.game.state, 'playing', 'the game is still in the playing state after restarting from a win');
  ok('the palette advances on restart-from-win (visible feedback that a new round began)', g.game.palIdx !== palBefore);

  stroke([[300, 300], [340, 330], [380, 300]]);
  g.calcCoverage();
  ok('a fresh stroke after restart-from-win advances coverage again', g.game.coverage > 0);
  ok('strokeCount is counting again after restart-from-win', g.game.strokeCount === 1);

  /* ======================= SECONDARY CONTROLS (skip/hint/power-up equivalents) ======================= */
  console.log('\n--- undo: consumes a stroke without freezing the loop ---');
  g.doReset();
  eq(g.game.coverage, 0, 'doReset clears coverage');
  eq(g.game.strokeCount, 0, 'doReset clears stroke count');
  stroke([[400, 200], [440, 240], [480, 200]]);
  g.calcCoverage();
  const covBeforeUndo = g.game.coverage;
  const strokesBeforeUndo = g.game.strokeCount;
  ok('setup: there is coverage/strokes to undo', covBeforeUndo > 0 && strokesBeforeUndo > 0);
  g.undoLastStroke();
  ok('undo decrements strokeCount', g.game.strokeCount === strokesBeforeUndo - 1);
  ok('undo reduces coverage back toward the pre-stroke value', g.game.coverage < covBeforeUndo);
  stroke([[500, 300], [540, 340], [580, 300]]);
  g.calcCoverage();
  ok('the game is still paintable immediately after an undo (undo does not freeze the loop)', g.game.strokeCount === strokesBeforeUndo && g.game.coverage > 0);

  console.log('\n--- pause: blocks input but is recoverable, not a freeze ---');
  g.doReset();
  const strokesBeforePause = g.game.strokeCount;
  g.togglePause();
  ok('togglePause pauses the game', g.game.paused === true);
  stroke([[200, 400], [240, 440]]);   // an attempted stroke while paused
  ok('a stroke attempted while paused is refused (by design) rather than corrupting state', g.game.strokeCount === strokesBeforePause);
  g.togglePause();
  ok('togglePause unpauses the game', g.game.paused === false);
  stroke([[200, 400], [240, 440], [280, 400]]);
  g.calcCoverage();
  ok('after unpausing, a stroke is accepted again -- pause is recoverable, not a soft-lock', g.game.strokeCount === strokesBeforePause + 1 && g.game.coverage > 0);

  console.log('\n--- palette cycling and mute do not disturb the loop ---');
  const palIdx0 = g.game.palIdx;
  g.cyclePalette(); g.cyclePalette(); g.cyclePalette(); g.cyclePalette();
  eq(g.game.palIdx, palIdx0, 'cycling the palette 4 times (a full loop of 4 palettes) returns to the start');
  let cycleDrawOk = true;
  try { g.draw(); } catch (e) { cycleDrawOk = false; }
  ok('draw() still renders fine after repeated palette cycling', cycleDrawOk);
  const muteBefore = g.game.muted;
  g.toggleMute();
  ok('toggleMute flips the mute flag', g.game.muted === !muteBefore);
  const strokesBeforeMuteStroke = g.game.strokeCount;
  stroke([[600, 150], [640, 190]]);
  g.calcCoverage();
  ok('the game is still playable after toggling mute', g.game.strokeCount === strokesBeforeMuteStroke + 1 && g.game.coverage >= 0);

  console.log('\n--- reset control: clears progress without freezing the loop ---');
  const strokesBeforeReset = g.game.strokeCount;
  ok('setup: there is progress to reset', strokesBeforeReset > 0);
  g.doReset();
  eq(g.game.coverage, 0, 'doReset clears coverage back to 0');
  eq(g.game.strokeCount, 0, 'doReset clears strokeCount back to 0');
  eq(g.game.won, false, 'doReset clears the won flag');
  stroke([[700, 250], [740, 290], [780, 250]]);
  g.calcCoverage();
  ok('the game is playable again immediately after a reset', g.game.coverage > 0 && g.game.strokeCount === 1);

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
