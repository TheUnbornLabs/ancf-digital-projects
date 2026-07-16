// jsdom test harness for Fog Lift (#78)
// Tier 2 playthrough: drive the REAL sweep-to-reveal loop through window.__cfq and
// assert progression across rounds, not just setup.
//
// Fog Lift's core mechanic lives entirely in canvas pixel alpha: sweep() punches
// destination-out holes in an offscreen fog canvas, and calcClear() reads the alpha
// channel back via getImageData() to compute % cleared. A naive stub (empty/zeroed
// getImageData) makes coverage either always 0 or always 100% regardless of what the
// player actually swept -- that would test the harness, not the game. So this file
// implements a small real pixel-buffer canvas stub (fillRect + arc-fill with
// composite-operation support) and drives sweep() the way a real finger/mouse would:
// tiling swipes across the canvas until the swept area is read back as cleared.
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'fog-lift', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }
function gte(a, b, name) { ok(name + ` (got ${a}, expected >= ${b})`, a >= b); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- a real (if minimal) 2D canvas pixel stub ----
// Tracks alpha-channel state per canvas so fillRect/arc+fill/getImageData round-trip
// truthfully. Everything else (strokes, text, gradients) is a safe no-op: this game
// never reads them back, it only ever reads the fog canvas's alpha channel.
class FakeCtx2D {
  constructor(el) {
    this.canvas = el;
    this.fillStyle = '#000'; this.strokeStyle = '#000';
    this.globalCompositeOperation = 'source-over'; this.globalAlpha = 1;
    this.font = ''; this.textAlign = 'start'; this.textBaseline = 'alphabetic';
    this.lineWidth = 1; this.lineCap = 'butt'; this.lineJoin = 'miter';
    this._arc = null;
  }
  _buf() {
    const w = this.canvas.width | 0, h = this.canvas.height | 0;
    if (!this._pix || this._pix.length !== w * h * 4) this._pix = new Uint8ClampedArray(w * h * 4);
    return this._pix;
  }
  _alphaOf(style) {
    if (typeof style === 'string') { const m = style.match(/rgba?\([^)]+,\s*([\d.]+)\s*\)/); if (m) return parseFloat(m[1]); }
    return 1;
  }
  setTransform() {} clearRect() {} save() {} restore() {} translate() {}
  moveTo() {} lineTo() {} arcTo() {} closePath() {} stroke() {}
  fillRect(x, y, w, h) {
    const buf = this._buf(), cw = this.canvas.width | 0, ch = this.canvas.height | 0;
    const a = Math.round(this._alphaOf(this.fillStyle) * 255);
    const x0 = Math.max(0, Math.floor(x)), x1 = Math.min(cw, Math.ceil(x + w));
    const y0 = Math.max(0, Math.floor(y)), y1 = Math.min(ch, Math.ceil(y + h));
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) buf[(yy * cw + xx) * 4 + 3] = a;
  }
  beginPath() { this._arc = null; }
  arc(x, y, r) { this._arc = { x, y, r }; }
  fill() {
    if (!this._arc) return;
    const buf = this._buf(), cw = this.canvas.width | 0, ch = this.canvas.height | 0;
    const { x: cx, y: cy, r } = this._arc;
    const destOut = this.globalCompositeOperation === 'destination-out';
    const a = destOut ? 0 : Math.round(this._alphaOf(this.fillStyle) * 255);
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(cw, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(ch, Math.ceil(cy + r));
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
      const dx = xx - cx, dy = yy - cy;
      if (dx * dx + dy * dy <= r * r) buf[(yy * cw + xx) * 4 + 3] = a;
    }
  }
  measureText(t) { return { width: String(t == null ? '' : t).length * 7 }; }
  createLinearGradient() { return { addColorStop() {} }; }
  createRadialGradient() { return { addColorStop() {} }; }
  drawImage() {} fillText() {}
  getImageData(x, y, w, h) {
    const buf = this._buf(), cw = this.canvas.width | 0;
    const out = new Uint8ClampedArray(w * h * 4);
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const s = ((y + yy) * cw + (x + xx)) * 4, d = (yy * w + xx) * 4;
      out[d] = buf[s]; out[d + 1] = buf[s + 1]; out[d + 2] = buf[s + 2]; out[d + 3] = buf[s + 3];
    }
    return { data: out };
  }
}

const pageErrors = [];
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: false,
  url: 'http://localhost/',
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = function () {
      if (!this.__fakeCtx) this.__fakeCtx = new FakeCtx2D(this);
      return this.__fakeCtx;
    };
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update()/draw() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(String(e.message || e.error)));
  }
});
const win = dom.window;
const g = win.__cfq;

// Tile sweep() calls densely enough across the whole canvas to actually clear the
// fog past the round's target, the way repeated mouse/finger swipes would.
function sweepWholeCanvas(round) {
  const r = g.brushFor(round);
  const step = Math.max(6, r * 0.85);
  for (let y = step / 2; y < 540; y += step)
    for (let x = step / 2; x < 960; x += step)
      g.sweep(x, y);
}

(async () => {
  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildFog', 'sweep', 'calcClear', 'update', 'draw',
    'targetFor', 'brushFor', 'toggleMute', 'togglePause'].every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game);
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.TOTAL, 8, 'the round set has 8 affirmations');
  ok('close to TARGET_CLEAR at round 0', Math.abs(g.targetFor(0) - g.TARGET_CLEAR) < 1e-9);

  let drewOk = true;
  for (const st of ['title', 'playing', 'won']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  ok('draw() runs in every state without throwing', drewOk);
  g.game.state = 'title';   // undo the forced state directly; don't lean on resetGame() to
  g.resetGame();            // escape a state we ourselves forced -- that's a harness artifact, not a game check

  /* ======================= CORE LOOP: sweep -> clear -> advance ======================= */
  console.log('\n--- core loop: sweeping the fog advances the round (the soft-lock check) ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame puts the game in playing state');
  eq(g.game.round, 0, 'resetGame starts at round 0');
  eq(g.game.score, 0, 'resetGame starts score at 0');

  const scoresSeen = [];
  for (let round = 0; round < 3; round++) {
    const before = g.game.round;
    sweepWholeCanvas(round);
    g.calcClear();
    gte(g.coverage, g.targetFor(round), `round ${round}: sweeping the canvas clears past its target (${(g.targetFor(round) * 100).toFixed(0)}%)`);

    g.update(16); // update() itself notices coverage>=target and fires completeRound()
    ok(`round ${round}: completing triggers the advance-in-progress guard`, g.game.advancing === true);

    await sleep(700); // completeRound()'s own 600ms setTimeout must have fired by now
    ok(`round ${round}: the round actually advances (idx/round increments)`, g.game.round === before + 1 || g.game.state === 'won');
    eq(g.game.advancing, false, `round ${round}: advancing guard clears after the transition`);
    eq(g.game.state, 'playing', `round ${round}: still playing after advancing`);
    scoresSeen.push(g.game.score);
  }
  ok('score rose on each of the first 3 rounds (1,2,3)', JSON.stringify(scoresSeen) === JSON.stringify([1, 2, 3]));
  ok('the gallery records one revealed affirmation per round', g.game.gallery.length === 3);

  console.log('\n--- core loop: still accepting input after 3 advances ---');
  {
    const cov0 = g.coverage;
    sweepWholeCanvas(g.game.round);
    g.calcClear();
    ok('sweeping on the 4th round still changes measured coverage', g.coverage > cov0 - 1e-9 && g.coverage > 0);
  }

  /* ======================= EXHAUST TO A REAL ENDING ======================= */
  console.log('\n--- exhaust the round set: a real ending is reached ---');
  // Rounds 3..7 (already cleared 0,1,2 above) -> round index should be 3 now.
  eq(g.game.round, 3, 'after 3 completed rounds the round index is 3');
  while (g.game.state === 'playing' && g.game.round < g.TOTAL) {
    const r = g.game.round;
    sweepWholeCanvas(r);
    g.calcClear();
    g.update(16);
    await sleep(700);
  }
  eq(g.game.state, 'won', 'clearing all 8 affirmations reaches the won screen');
  eq(g.game.round, g.TOTAL, 'round counter reflects all 8 rounds completed');
  eq(g.game.gallery.length, g.TOTAL, 'the gallery holds all 8 revealed affirmations');
  let wonDrawOk = true;
  try { g.draw(); } catch (e) { wonDrawOk = false; }
  ok('the won (gallery) screen draws without throwing', wonDrawOk);

  console.log('\n--- no fail state: letting the soft timer run out does not trap the player ---');
  // The code comments this as "soft timer, visual only, no fail state". Confirm it:
  // round overrun must not strand the game in a stuck / non-playing state.
  g.resetGame();
  for (let i = 0; i < 700; i++) g.update(16);            // far past ROUND_TIME(9000ms) with no sweeping
  eq(g.game.state, 'playing', 'running the timer out does not end or freeze the round');
  sweepWholeCanvas(0);
  g.calcClear();
  gte(g.coverage, g.targetFor(0), 'the round is still completable after the timer visually expires');
  g.update(16);
  await sleep(700);
  eq(g.game.round, 1, 'the round advances normally even after the soft timer ran out');

  /* ======================= RESTART FROM THE ENDING ======================= */
  console.log('\n--- restart from the won screen: playable again ---');
  // Drive it back to 'won' first (this is the entry point the real pointer handler
  // calls: `if(game.state==='title'||game.state==='won'){resetGame();return;}`).
  while (g.game.state !== 'won') {
    const r = g.game.round;
    sweepWholeCanvas(r);
    g.calcClear();
    g.update(16);
    await sleep(700);
  }
  eq(g.game.state, 'won', 'setup: back at the won screen');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame from the won screen returns to playing');
  eq(g.game.round, 0, 'restarting resets the round counter to 0');
  eq(g.game.score, 0, 'restarting resets the score to 0');
  eq(g.game.gallery.length, 0, 'restarting clears the gallery');
  sweepWholeCanvas(0);
  g.calcClear();
  gte(g.coverage, g.targetFor(0), 'after restart, sweeping clears fog again');
  g.update(16);
  await sleep(700);
  eq(g.game.round, 1, 'after restart, a round can be completed again (not a dead loop)');
  eq(g.game.score, 1, 'after restart, score counts up fresh (no leftover state)');

  /* ======================= REENTRANCY: the advancing guard doesn't double-fire ======================= */
  console.log('\n--- the in-progress guard does not consume extra completions ---');
  {
    const r = g.game.round;
    sweepWholeCanvas(r);
    g.calcClear();
    g.update(16);
    ok('advancing flips true right after crossing the target', g.game.advancing === true);
    const scoreDuring = g.game.score;
    for (let i = 0; i < 10; i++) g.update(16); // still mid-transition; must not re-fire completeRound
    eq(g.game.score, scoreDuring, 'repeated update() calls during the transition do not award score twice');
    await sleep(700);
  }

  /* ======================= PAUSE: does not soft-lock the loop ======================= */
  console.log('\n--- pause/resume advances rather than freezing input ---');
  g.resetGame();
  g.sweep(100, 100);          // a small, deliberately partial sweep (well under target)
  g.calcClear();
  const covBeforePause = g.coverage;
  ok('a single partial sweep leaves coverage below target (sanity check for the next assertion)',
    covBeforePause > 0 && covBeforePause < g.targetFor(0));
  g.togglePause();
  ok('togglePause pauses the game', g.game.paused === true);
  sweepWholeCanvas(0); // sweep() itself guards on game.paused; should be a no-op
  g.calcClear();
  eq(g.coverage, covBeforePause, 'sweeping the whole canvas while paused has no effect (guarded, as expected)');
  g.togglePause();
  ok('togglePause resumes the game', g.game.paused === false);
  sweepWholeCanvas(0);
  g.calcClear();
  gte(g.coverage, g.targetFor(0), 'after resuming, sweeping still clears fog and can complete the round');
  g.update(16);
  ok('the round can still complete normally after a pause/resume cycle', g.game.advancing === true);
  await sleep(700);
  eq(g.game.state, 'playing', 'game continues normally after pause/resume');

  console.log('\n--- mute toggle does not affect game progression ---');
  const mutedBefore = g.game.muted;
  g.toggleMute();
  eq(g.game.muted, !mutedBefore, 'toggleMute flips the muted flag');
  g.toggleMute();
  eq(g.game.muted, mutedBefore, 'toggling twice restores the original muted flag');
  eq(g.game.state, 'playing', 'mute toggling does not change game state');

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
