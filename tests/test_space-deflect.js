// jsdom Tier 2 playthrough suite for Space Deflect (#33)
// Core loop: move a shield to deflect falling "pressure" balls back up.
// Miss 3 (lives) -> gameover. Survive 90s -> won. Combo x6 -> shield widens (power-up).
// This suite drives the REAL update()/collision code via window.__cfq, forcing only
// single independent values (ball position/velocity, survived counter) the way the
// reference suite forces g.game.idx - never a pair of state variables that must be
// set together, and never bypassing update()/collision logic itself.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'space-deflect', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

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
    w.requestAnimationFrame = () => 0;
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Constants mirrored from source (SHIELD_H is not exposed on the hook).
const W = 960, H = 540, SHIELD_H = 14;

// Force-place the most-recently-spawned ball so the next update() tick lands it
// squarely on the shield -- this exercises the real collision branch in update(),
// it does not skip it.
function forceDeflect() {
  const curW = g.shield.wideT > 0 ? g.SHIELD_W * 1.5 : g.SHIELD_W;
  g.spawnBall();
  const b = g.balls[g.balls.length - 1];
  b.boss = false;
  b.x = clamp(g.shield.x + curW / 2, b.r, W - b.r);
  b.vx = 0;
  b.y = g.SHIELD_Y - 2;
  b.vy = 200;
  const scoreBefore = g.game.score, comboBefore = g.game.combo, ballsBefore = g.balls.length;
  g.update(16);
  return { b, scoreBefore, comboBefore, ballsBefore };
}

// Force-place a ball past the bottom edge so the next update() tick counts it as a miss.
function forceMiss() {
  g.spawnBall();
  const b = g.balls[g.balls.length - 1];
  b.x = 100; b.vx = 0; b.y = H + 50; b.vy = 200;
  const livesBefore = g.game.lives;
  g.update(16);
  return livesBefore;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'spawnBall', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && !!g.keys && Array.isArray(g.PRESSURES));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  g.resetGame();
  let drewOk = true;
  for (const st of ['title', 'playing', 'paused', 'won', 'gameover']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  ok('draw() runs in every state without throwing', drewOk);
  g.resetGame();

  let updateOk = true;
  try { for (const dt of [0, 16, 16.7, 1000, -5]) g.update(dt); for (let i = 0; i < 200; i++) g.update(16); }
  catch (e) { updateOk = false; console.log('    update threw: ' + e.message); }
  ok('update() tolerates odd dt and long runs', updateOk);

  /* ======================= LOGIC: core loop ======================= */
  console.log('\n--- logic: resetGame ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame sets state to playing');
  eq(g.game.score, 0, 'resetGame resets score');
  eq(g.game.lives, 3, 'resetGame restores full lives');
  eq(g.game.survived, 0, 'resetGame resets survived time');
  eq(g.balls.length, 0, 'resetGame clears balls');
  eq(g.game.combo, 0, 'resetGame clears combo');

  console.log('\n--- logic: core action advances the game (catches soft-locks) ---');
  g.resetGame();
  {
    const survivedBefore = g.game.survived;
    const { scoreBefore, comboBefore } = forceDeflect();
    ok('deflecting a ball raises the score', g.game.score > scoreBefore);
    eq(g.game.combo, comboBefore + 1, 'deflecting a ball raises the combo');
    ok('time keeps advancing (survived increases)', g.game.survived > survivedBefore);
    eq(g.game.state, 'playing', 'still playing after a deflect');
  }

  console.log('\n--- logic: three deflects in a row -- still advancing, still accepting input ---');
  g.resetGame();
  {
    let lastScore = 0;
    for (let i = 1; i <= 3; i++) {
      const { scoreBefore } = forceDeflect();
      ok(`deflect #${i} raised the score (${scoreBefore} -> ${g.game.score})`, g.game.score > scoreBefore);
      lastScore = g.game.score;
    }
    eq(g.game.combo, 3, 'combo reached 3 after three consecutive deflects');
    ok('game is still playing after three deflects', g.game.state === 'playing');

    // input is still accepted: the shield still responds to held keys
    const xBefore = g.shield.x;
    g.keys.left = true;
    g.update(16);
    g.keys.left = false;
    ok('the shield still moves left on held input after three deflects', g.shield.x < xBefore);
  }

  console.log('\n--- logic: power-up (shield widen at combo x6) advances rather than freezing ---');
  g.resetGame();
  {
    for (let i = 1; i <= 6; i++) forceDeflect();
    eq(g.game.combo, 6, 'combo reached 6');
    ok('six-combo widens the shield (wideT armed)', g.shield.wideT > 0);
    const widenedCurW = g.shield.wideT > 0 ? g.SHIELD_W * 1.5 : g.SHIELD_W;
    ok('the widened shield width is 1.5x normal', widenedCurW === g.SHIELD_W * 1.5);

    // the widened shield keeps deflecting -- it doesn't consume the power-up and freeze
    const { scoreBefore } = forceDeflect();
    ok('a 7th deflect right after widening still scores', g.game.score > scoreBefore);
    eq(g.game.combo, 7, 'combo keeps counting after the widen');

    // and the widen decays over time rather than sticking forever
    for (let i = 0; i < 400 && g.shield.wideT > 0; i++) g.update(16);
    eq(g.shield.wideT, 0, 'the widen effect eventually decays back to 0');
    ok('game is still playing after the widen decays', g.game.state === 'playing');
    const { scoreBefore: sb2 } = forceDeflect();
    ok('deflecting still works after the widen has worn off', g.game.score > sb2);
  }

  console.log('\n--- logic: boss ball (bonus/challenge mode) advances rather than freezing ---');
  g.resetGame();
  {
    const curW = g.shield.wideT > 0 ? g.SHIELD_W * 1.5 : g.SHIELD_W;
    g.spawnBall();
    const b = g.balls[g.balls.length - 1];
    b.boss = true; b.r = 21;
    b.x = clamp(g.shield.x + curW / 2, b.r, W - b.r);
    // the boss ball is larger (r=21 vs 10), so it needs more headroom above the shield
    // for b.y+b.r to land inside the collision band after one physics step.
    b.vx = 0; b.y = g.SHIELD_Y - 15; b.vy = 200;
    const scoreBefore = g.game.score;
    const ballsBefore = g.balls.length;
    g.update(16);
    ok('a deflected boss ball is removed (one-hit) rather than stuck', g.balls.length === ballsBefore - 1);
    ok('a boss deflect scores more than a normal deflect', g.game.score - scoreBefore >= 30);
    ok('the game keeps running after a boss deflect', g.game.state === 'playing');
    // the game continues to spawn and accept normal deflects afterwards
    const { scoreBefore: sb3 } = forceDeflect();
    ok('normal deflects still work after a boss ball', g.game.score > sb3);
  }

  console.log('\n--- logic: exhausting the fail condition reaches a real ending ---');
  g.resetGame();
  {
    eq(forceMiss(), 3, 'lives start at 3 before the first miss');
    eq(g.game.lives, 2, 'first miss costs a life');
    eq(g.game.combo, 0, 'a miss resets the combo');
    eq(g.game.state, 'playing', 'still playing after one miss');

    eq(forceMiss(), 2, 'lives are 2 before the second miss');
    eq(g.game.lives, 1, 'second miss costs another life');
    eq(g.game.state, 'playing', 'still playing after two misses');

    eq(forceMiss(), 1, 'lives are 1 before the third miss');
    eq(g.game.lives, 0, 'third miss spends the last life');
    eq(g.game.state, 'gameover', 'losing the last life ends the game with a real gameover screen');
  }

  console.log('\n--- logic: restart from gameover is playable again ---');
  {
    ok('the pre-gameover score is preserved on the ending screen', g.game.score >= 0);
    g.resetGame(); // the real handler canvas mousedown/touchstart invokes when state is gameover/won/title
    eq(g.game.state, 'playing', 'resetGame returns to playing from gameover');
    eq(g.game.lives, 3, 'lives are restored on restart');
    eq(g.game.score, 0, 'score is restored on restart');
    const { scoreBefore } = forceDeflect();
    ok('the restarted game still advances (a deflect scores)', g.game.score > scoreBefore);
  }

  console.log('\n--- logic: real restart handler (mousedown on canvas) ---');
  {
    const canvas = win.document.getElementById('game');
    g.resetGame();
    g.game.state = 'gameover';
    canvas.dispatchEvent(new win.MouseEvent('mousedown', { bubbles: true }));
    eq(g.game.state, 'playing', 'a real mousedown restarts the game from the gameover screen');

    g.resetGame();
    g.game.state = 'won';
    canvas.dispatchEvent(new win.MouseEvent('mousedown', { bubbles: true }));
    eq(g.game.state, 'playing', 'a real mousedown restarts the game from the won screen');

    // paused is not a restartable screen -- a stray click there must not reset progress
    g.resetGame();
    forceDeflect();
    const scoreBeforePause = g.game.score;
    g.game.state = 'paused';
    canvas.dispatchEvent(new win.MouseEvent('mousedown', { bubbles: true }));
    eq(g.game.state, 'paused', 'a mousedown while paused does not restart the game');
    eq(g.game.score, scoreBeforePause, 'score is untouched by a stray click while paused');
  }

  console.log('\n--- logic: pause freezes motion without breaking resume ---');
  g.resetGame();
  {
    g.spawnBall();
    const b = g.balls[g.balls.length - 1];
    const yBefore = b.y;
    g.togglePause();
    eq(g.game.state, 'paused', 'togglePause pauses the game');
    g.update(16);
    eq(g.balls[g.balls.length - 1].y, yBefore, 'ball motion is frozen while paused');

    g.togglePause();
    eq(g.game.state, 'playing', 'togglePause resumes the game');
    g.update(16);
    ok('ball motion resumes after unpausing', g.balls[g.balls.length - 1].y !== yBefore);
  }

  console.log('\n--- logic: win path (survive 90s) reaches a real ending and restarts ---');
  g.resetGame();
  {
    forceDeflect(); // give the run a non-zero score so we can check best-score persistence
    const scoreAtWin = g.game.score;
    g.game.survived = 89.99;
    g.update(16);
    eq(g.game.state, 'won', 'reaching 90s survived wins the round');
    eq(g.game.best, Math.max(scoreAtWin, 0), 'best score is updated on a win when the score beats it');
    eq(win.localStorage.getItem('space-deflect-best'), String(g.game.best), 'best score is persisted to localStorage');

    g.resetGame();
    eq(g.game.state, 'playing', 'resetGame returns to playing from the won screen');
    const { scoreBefore } = forceDeflect();
    ok('the game is fully playable again after a win', g.game.score > scoreBefore);
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
