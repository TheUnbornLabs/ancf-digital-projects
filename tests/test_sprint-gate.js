// jsdom Tier 2 playthrough suite for Sprint Gate (#73)
// Core loop: gates fall from the top in two lanes (left/right); one is green (a value),
// one is red (an obligation). steer(-1|1) picks a lane; when the gate reaches the runner's
// y-band the collision resolves (score/lives update), the gate is nulled, and a NEW gate is
// scheduled via a REAL setTimeout(400ms) — this is not update()-driven, so tests must let real
// wall-clock time pass (sleep) for the next gate to appear, exactly like a real player would
// experience it. 20 gates (TOTAL) clears the round -> 'won'. Tapping/clicking at 'won' enters
// an endless "Focus Run" bonus mode via goEndless() (not exposed on the hook — reached only
// through the real mousedown/touchend/zoneTap handlers, so we dispatch a real DOM event).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'sprint-gate', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- canvas 2D context stub (same shape as the word-unscramble reference harness) ----
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

// Which steer() direction lands in the green lane / the red (obligation) lane, for the
// gate that currently exists.
function greenDir() { return g.gate.left.green ? -1 : 1; }
function redDir() { return g.gate.left.green ? 1 : -1; }

// Run update(16) frames until the current gate resolves (cleared, lives, or state changes),
// or give up after maxFrames. This is synchronous/instant in wall-clock time — no sleeping.
function driveUntilResolved(maxFrames = 400) {
  const c0 = g.game.cleared, l0 = g.game.lives, s0 = g.game.state;
  let i = 0;
  for (; i < maxFrames; i++) {
    g.update(16);
    if (g.game.cleared !== c0 || g.game.lives !== l0 || g.game.state !== s0) return true;
  }
  return false;
}

// Steer into the green lane, drive to resolution, and — if the round is still live —
// wait out the real setTimeout(400ms) that schedules the next gate. Never leaves a stray
// timer pending into the next test (that would silently rebuild a later gate out from under
// us), so every non-terminal resolution in this whole suite goes through here or missAndSettle.
async function clearGreenAndSettle() {
  const before = { cleared: g.game.cleared, lives: g.game.lives };
  const dir = greenDir();
  g.steer(dir);
  const resolved = driveUntilResolved();
  const info = { resolved, clearedBefore: before.cleared, livesBefore: before.lives, stateAfter: g.game.state };
  if (g.game.state === 'playing') await sleep(450);
  return info;
}

async function missAndSettle(dir) {
  // dir omitted -> don't steer at all (center miss); dir given -> steer into the red lane
  if (dir !== undefined) g.steer(dir);
  const livesBefore = g.game.lives;
  const resolved = driveUntilResolved();
  const info = { resolved, livesBefore, stateAfter: g.game.state };
  if (g.game.state === 'playing') await sleep(450);
  return info;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildGate', 'steer', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.TOTAL, 20, 'round length is 20 gates');

  /* ======================= 1. core action advances ======================= */
  console.log('\n--- 1: clearing a gate advances the game ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts in playing state');
  ok('a gate exists at round start', !!g.gate);
  const r1 = await clearGreenAndSettle();
  ok('steering into the green lane resolves the gate within the frame budget', r1.resolved);
  eq(g.game.cleared, r1.clearedBefore + 1, 'clearing the green gate advances the cleared count');
  eq(g.game.lives, r1.livesBefore, 'no life is lost on a correct pass');
  eq(g.game.state, 'playing', 'still playing after advancing');
  ok('a new gate appeared after the scheduled rebuild', !!g.gate);

  /* ======================= 2. three in a row ======================= */
  console.log('\n--- 2: three consecutive clears keep advancing ---');
  const clearedStart = g.game.cleared;
  for (let n = 0; n < 3; n++) {
    const before = g.game.cleared;
    const r = await clearGreenAndSettle();
    ok(`consecutive clear ${n + 1}/3 resolves`, r.resolved);
    eq(g.game.cleared, before + 1, `consecutive clear ${n + 1}/3 advances the count`);
  }
  eq(g.game.cleared, clearedStart + 3, 'three consecutive correct passes were all counted');
  ok('still accepting input after three clears (gate present, still playing)', !!g.gate && g.game.state === 'playing');

  /* ======================= 3. exhaust the fail condition -> real ending ======================= */
  console.log('\n--- 3: losing all lives reaches a real gameover ---');
  g.resetGame();
  eq(g.game.lives, 3, 'a fresh round starts with 3 lives');
  // miss #1: steer straight into the red (obligation) lane
  const m1 = await missAndSettle(redDir());
  ok('missing via the red lane resolves', m1.resolved);
  eq(g.game.lives, m1.livesBefore - 1, 'a red-lane hit costs a life');
  ok('game not yet over after 1 of 3 lives lost', g.game.state === 'playing');
  // miss #2: don't steer at all (stay centered) -> also a miss
  const m2 = await missAndSettle();
  ok('missing by not steering (center) resolves', m2.resolved);
  eq(g.game.lives, m2.livesBefore - 1, 'an un-steered (center) pass also costs a life');
  ok('game not yet over after 2 of 3 lives lost', g.game.state === 'playing');
  // miss #3: red lane again -> last life
  const m3 = await missAndSettle(redDir());
  ok('the third miss resolves', m3.resolved);
  eq(g.game.lives, 0, 'the last life is spent');
  eq(g.game.state, 'gameover', 'losing the third life ends the game with a real gameover screen');
  ok('no gate lingers on the gameover screen', g.gate === null);

  /* ======================= 4. restart from that ending ======================= */
  console.log('\n--- 4: restart from gameover is playable again ---');
  g.resetGame(); // the real title/gameover mousedown & touchend handlers call this directly
  eq(g.game.state, 'playing', 'resetGame() returns to a playing round from gameover');
  eq(g.game.lives, 3, 'lives are restored to full on restart');
  eq(g.game.cleared, 0, 'cleared count resets to 0 on restart');
  ok('a gate exists immediately after restart', !!g.gate);
  const r4 = await clearGreenAndSettle();
  ok('after restarting from gameover, the core loop still accepts input (not soft-locked)', r4.resolved);
  eq(g.game.cleared, 1, 'the post-restart clear was counted');

  /* ======================= keyboard-entry mismatch (title & won screens) ======================= */
  // Both the title panel ("Click / tap or press <-/-> to begin.") and the won panel
  // ("Tap for a Focus Run (endless) or press <-/->.") tell the player arrow keys work here.
  // But the keydown handler is: `if(game.state!=='playing')return;` BEFORE it looks at which
  // key was pressed — so ArrowLeft/ArrowRight do nothing unless the game is already playing.
  console.log('\n--- keyboard-entry mismatch on title/won screens ---');
  g.game.state = 'title'; // the real, reachable state the page boots into
  win.document.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
  eq(g.game.state, 'playing', 'the title panel says "press <-/-> to begin" - ArrowRight should start the game');
  g.game.state = 'title';
  win.document.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
  eq(g.game.state, 'playing', 'the title panel says "press <-/-> to begin" - ArrowLeft should also start the game');
  g.game.state = 'title'; // restore for the rest of the suite; nothing downstream depends on it, but keep state sane

  /* ======================= 5. exhaust the win condition, then the bonus/endless mode ======================= */
  console.log('\n--- 5: clearing all TOTAL gates wins, and the bonus mode advances ---');
  g.resetGame();
  let reachedWon = false;
  for (let n = 0; n < g.TOTAL; n++) {
    ok(`win-run gate ${n + 1}/${g.TOTAL} exists`, !!g.gate);
    const r = await clearGreenAndSettle();
    ok(`win-run gate ${n + 1}/${g.TOTAL} resolves`, r.resolved);
    if (g.game.state === 'won') { reachedWon = true; break; }
  }
  ok('clearing every gate reaches the win screen', reachedWon);
  eq(g.game.state, 'won', 'state is won after a clean run');
  eq(g.game.cleared, g.TOTAL, 'cleared equals TOTAL at the win screen');
  ok('no gate lingers on the win screen', g.gate === null);

  // Same keyboard mismatch, now on the win screen itself (reached legitimately, not forced).
  win.document.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
  ok('the won panel says "press <-/->" - ArrowRight should enter the Focus Run (endless) bonus mode', g.game.endless === true);

  // Now the real, working entry point: a tap/click, dispatched as a genuine DOM event
  // (goEndless() is not on the test hook — this is the only legitimate way to reach it).
  const canvasEl = win.document.getElementById('game');
  canvasEl.dispatchEvent(new win.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  eq(g.game.state, 'playing', 'clicking the win screen enters the Focus Run (endless) bonus mode');
  eq(g.game.endless, true, 'endless flag is set entering the bonus mode');
  await sleep(150); // goEndless() schedules its first gate via setTimeout(50ms)
  ok('a gate appears in the bonus round', !!g.gate);

  const rBonus = await clearGreenAndSettle();
  ok('the bonus/endless mode advances rather than consuming the win and freezing', rBonus.resolved);
  eq(g.game.cleared, g.TOTAL + 1, 'endless mode keeps counting clears past TOTAL');
  eq(g.game.state, 'playing', 'still playing in endless mode after advancing past TOTAL');

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
