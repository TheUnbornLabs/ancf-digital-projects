// jsdom test harness for Breath Timer (#30)
// Tier 2 playthrough suite: this is a passive, time-driven game (no click-to-advance
// core loop) — the "core action" is real elapsed time via update(dt), and the
// "input" is press-and-hold in sync with the guide for a rhythm bonus. There is no
// lives/fail condition; the only ending is completing the target number of cycles.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'breath-timer', 'index.html');
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
    // give the canvas a real, non-zero bounding rect so pointer-coordinate math
    // (used by the title/won option panels) doesn't divide by zero
    w.HTMLCanvasElement.prototype.getBoundingClientRect = function () {
      return { left: 0, top: 0, width: 960, height: 540, right: 960, bottom: 540 };
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
const canvas = win.document.getElementById('game');

// Advance game time by exactly `ms`, respecting the engine's own per-call dt clamp
// (update() clamps dt to [0,48]) so nothing is lost or double-counted.
function advance(ms) {
  let remaining = ms;
  while (remaining > 0) {
    const step = Math.min(48, remaining);
    g.update(step);
    remaining -= step;
  }
}
function mousedown(x, y) { canvas.dispatchEvent(new win.MouseEvent('mousedown', { clientX: x, clientY: y, bubbles: true })); }
function mouseup(x, y) { canvas.dispatchEvent(new win.MouseEvent('mouseup', { clientX: x, clientY: y, bubbles: true })); }
function keydown(code) { win.dispatchEvent(new win.KeyboardEvent('keydown', { code, bubbles: true, cancelable: true })); }

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'update', 'draw', 'toggleMute', 'togglePause', 'setPattern', 'setCycles']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && !!g.PATTERNS && Array.isArray(g.SESSION_LENGTHS));
  ok('canvas element is present', !!canvas);
  ok('no uncaught page errors on load', pageErrors.length === 0);

  console.log('\n--- setup ---');
  // Use box breathing (4 equal 4s phases) at the shortest session length (3 cycles)
  // so a full playthrough is a bounded, fast, deterministic amount of game time.
  g.setPattern('box');
  g.setCycles(3);
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts a session in the playing state');
  eq(g.game.cycle, 0, 'a fresh session starts at cycle 0');
  eq(g.game.phaseIdx, 0, 'a fresh session starts on the first phase');
  eq(g.CYCLES, 3, 'the selected session length took effect');
  ok('the selected pattern took effect (4 equal-length phases)',
    g.PHASES.length === 4 && g.PHASES.every(p => p.dur === 4000));

  /* ================= core loop: does it advance? ================= */
  console.log('\n--- core loop: time-driven advance (catches soft-locks) ---');
  const dur0 = g.PHASES[0].dur;
  advance(dur0 - 1);
  eq(g.game.phaseIdx, 0, 'just before a phase ends, the phase has not yet changed');
  advance(2);
  eq(g.game.phaseIdx, 1, 'crossing the phase duration advances to the next phase');
  eq(g.game.state, 'playing', 'still playing after a phase transition');
  ok('phaseT resets on transition', g.game.phaseT < 4);

  console.log('\n--- core loop: three transitions running, still advancing/accepting input ---');
  let sawIdx = [g.game.phaseIdx];
  for (let i = 0; i < 3; i++) {
    const before = g.game.phaseIdx;
    advance(g.PHASES[before].dur + 1);
    sawIdx.push(g.game.phaseIdx);
  }
  ok('three consecutive phase-advances all actually changed the phase',
    sawIdx.every((v, i) => i === 0 || v !== sawIdx[i - 1]));
  eq(g.game.state, 'playing', 'still playing after several transitions');
  // input (press-and-hold) is still accepted after repeated advances
  mousedown(400, 300);
  eq(g.game.pressed, true, 'a real mousedown on the canvas is still accepted as "pressed" after repeated advances');
  mouseup(400, 300);
  eq(g.game.pressed, false, 'mouseup releases the press');

  console.log('\n--- bonus mode: press-hold rhythm advances rather than freezing ---');
  g.setPattern('box'); g.setCycles(3); g.resetGame();
  // Hold correctly through Inhale+Hold (target 1.0, should press), release for
  // Exhale+Pause (target 0.0, should release) — i.e. play it "well" and confirm
  // the rhythm bonus rewards the player instead of stalling progression.
  mousedown(400, 300);
  advance(g.PHASES[0].dur + 1); // Inhale -> Hold
  advance(g.PHASES[1].dur + 1); // Hold -> Exhale
  mouseup(400, 300);
  advance(g.PHASES[2].dur + 1); // Exhale -> Pause
  advance(g.PHASES[3].dur + 1); // Pause -> Inhale (cycle completes)
  eq(g.game.cycle, 1, 'a full correctly-played cycle completes and is counted');
  eq(g.game.state, 'playing', 'playing a cycle in sync does not freeze the game');
  ok('playing in sync earns a positive score (bonus is not a dead-end trap)', g.game.score > 0);

  console.log('\n--- pause: escapable, does not permanently freeze progression ---');
  g.setPattern('box'); g.setCycles(3); g.resetGame();
  advance(1000);
  const phaseTBeforePause = g.game.phaseT;
  g.togglePause();
  ok('togglePause actually pauses', g.game.paused === true);
  advance(2000);
  eq(g.game.phaseT, phaseTBeforePause, 'while paused, the phase clock does not advance');
  keydown('Escape');
  ok('Escape resumes from pause via the real key handler', g.game.paused === false);
  advance(500);
  ok('after resuming, the phase clock advances again (pause is not a permanent freeze)',
    g.game.phaseT > phaseTBeforePause);

  /* ================= ending: reach it, then restart ================= */
  console.log('\n--- reaching the only ending (session complete) ---');
  g.setPattern('box'); g.setCycles(3); g.resetGame();
  for (let c = 0; c < 3; c++) {
    for (let p = 0; p < 4; p++) advance(g.PHASES[p].dur + 1);
  }
  eq(g.game.state, 'won', 'completing every cycle reaches the won screen');
  eq(g.game.cycle, 3, 'the cycle counter reflects the full session');
  eq(win.localStorage.getItem('bt_best_cycles'), '3', 'best-cycles record is persisted to localStorage');
  ok('sessions-completed counter is persisted to localStorage', parseInt(win.localStorage.getItem('bt_best_sessions'), 10) >= 1);
  let drawOk = true;
  try { g.draw(); } catch (e) { drawOk = false; console.log('    draw threw on the won screen: ' + e.message); }
  ok('the won screen renders without throwing', drawOk);

  console.log('\n--- restart from the ending via the REAL player-facing handler ---');
  // The real restart path from 'won' is the game's own keydown handler (Space/Enter)
  // and the pointerDown handler (click anywhere on the panel) — not a raw hook call.
  keydown('Space');
  eq(g.game.state, 'playing', 'pressing Space on the won screen restarts the session (real handler)');
  eq(g.game.cycle, 0, 'the restarted session starts at cycle 0');
  eq(g.game.score, 0, 'the restarted session starts at score 0');
  // and prove it is not just cosmetically "playing" — it actually advances again
  advance(g.PHASES[0].dur + 1);
  eq(g.game.phaseIdx, 1, 'after restarting, the phase clock advances again (no post-ending soft-lock)');

  console.log('\n--- restart from the ending via a real click, from the title screen too ---');
  // Drive it back to won again, then use a real mousedown (not a direct resetGame()
  // call) on an area of the panel with no button — the game's own documented
  // "tap anywhere else also starts" fallback (index.html pointerDown).
  g.setPattern('box'); g.setCycles(3); g.resetGame();
  for (let c = 0; c < 3; c++) { for (let p = 0; p < 4; p++) advance(g.PHASES[p].dur + 1); }
  eq(g.game.state, 'won', 'session reaches won a second time');
  mousedown(5, 5); // top-left corner: outside every option/start button rect
  eq(g.game.state, 'playing', 'a real click via the fallback handler restarts from the won screen');
  advance(g.PHASES[0].dur + 1);
  eq(g.game.phaseIdx, 1, 'the click-restarted session is genuinely playable, not just cosmetically reset');

  console.log('\n--- odd dt values do not break the loop (light robustness check) ---');
  g.setPattern('relax'); g.setCycles(5); g.resetGame();
  let updateOk = true;
  try { for (const dt of [0, -5, 1000, 48, 48.7]) g.update(dt); } catch (e) { updateOk = false; console.log('    update threw: ' + e.message); }
  ok('update() tolerates dt=0, negative dt, and over-large dt without throwing', updateOk);
  eq(g.game.state, 'playing', 'still playing after odd dt values');

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
