// jsdom Tier-2 playthrough suite for Echo Dissolve (#59)
// Drives the real loop through window.__cfq: spawn echoes, dissolve them (the core
// action), let time pass via update(), exhaust lives to reach a real ending, restart,
// and exercise the bonus "endless" mode entered from the win screen.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'echo-dissolve', 'index.html');
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
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;          // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Push a hostile echo directly onto the centre so the next update() collides with it
// (a player who simply fails to click one in time produces exactly this: dist<=INNER_R+r).
function pushCentreEcho() {
  g.echoes.push({ x: 480, y: 270, tx: 480, ty: 270, phrase: 'x', t: 0, life: 9999, r: 30, dissolved: false, warned: false });
}

// Dissolve whatever live echo currently exists, exactly the way onDown->dissolveAt
// is invoked for a click landing on it (same coordinates as the echo itself).
function dissolveOneLiveEcho() {
  if (g.echoes.length === 0) g.spawnEcho();
  const target = g.echoes.find(e => !e.dissolved);
  if (!target) return false;
  g.dissolveAt(target.x, target.y);
  return true;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'spawnEcho', 'dissolveAt', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.echoes));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  let drewOk = true;
  g.resetGame(false);
  for (const st of ['title', 'playing', 'paused', 'won', 'gameover']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  ok('draw() runs in every state without throwing', drewOk);
  g.resetGame(false);   // clear the forced states before driving real logic

  console.log('\n--- logic: setup ---');
  eq(g.game.state, 'playing', 'resetGame(false) starts a normal round');
  eq(g.game.lives, 3, 'a fresh round grants 3 lives');
  eq(g.game.score, 0, 'a fresh round starts at score 0');
  eq(g.game.endless, false, 'a fresh normal round is not endless');
  eq(g.echoes.length, 0, 'a fresh round starts with no echoes on screen');

  /* ============ core loop: dissolving advances the game ============ */
  console.log('\n--- core action: dissolving an echo advances the game ---');
  g.resetGame(false);
  g.spawnEcho();
  const e0 = g.echoes[0];
  const streak0 = g.game.streak;
  g.dissolveAt(e0.x, e0.y);
  ok('the dissolved echo is flagged dissolved', g.echoes[0].dissolved === true);
  ok('dissolving raises the streak', g.game.streak === streak0 + 1);
  ok('dissolving immediately awards score', g.game.score > 0);
  g.update(16);
  ok('the dissolved echo is swept from the board on the next tick', g.echoes.length === 0);

  console.log('\n--- do it three times running: still advancing, still accepting input ---');
  g.resetGame(false);
  let lastStreak = g.game.streak;
  let acceptedAllThree = true;
  for (let i = 0; i < 3; i++) {
    const accepted = dissolveOneLiveEcho();
    if (!accepted) acceptedAllThree = false;
    ok(`dissolve #${i + 1} raises the streak (now ${g.game.streak})`, g.game.streak === lastStreak + 1);
    lastStreak = g.game.streak;
    g.update(16);   // one real animation frame between actions, same as live play
  }
  ok('all three dissolves in a row were accepted (no soft-lock on repeated input)', acceptedAllThree);

  // ---- scoring bug: does the per-dissolve bonus actually survive to the HUD? ----
  console.log('\n--- scoring: do per-dissolve bonuses persist past the next frame? ---');
  g.resetGame(false);
  g.spawnEcho();
  const eA = g.echoes[0];
  g.dissolveAt(eA.x, eA.y);
  const scoreRightAfterDissolve = g.game.score;
  ok('a dissolve awards a non-trivial bonus at the instant of the click', scoreRightAfterDissolve >= 20);
  g.update(16);   // a single real animation frame, as would follow instantly in live play
  ok('BUG: a dissolve bonus should still be reflected in game.score one frame later, ' +
     `but it collapsed from ${scoreRightAfterDissolve} to ${g.game.score} ` +
     '(index.html: `game.score=Math.floor(game.survived*5)+game.score*0;` — `game.score*0` is always 0 ' +
     'regardless of the current score, so every update() tick silently erases whatever the player just earned ' +
     'and replaces it with the pure time-based floor)',
     g.game.score >= scoreRightAfterDissolve);

  // Confirm this is not a one-off: across a realistic, actively-played full round the
  // final score should reflect the many bonuses earned, not just time survived.
  g.resetGame(false);
  let dissolves = 0;
  while (g.game.state === 'playing' && g.game.survived < 60) {
    if (dissolveOneLiveEcho()) dissolves++;
    g.update(16);
  }
  ok('a full round with many successful dissolves was actually played', dissolves > 50);
  const timeOnlyScore = Math.floor(g.game.survived * 5);
  ok(`BUG: after ${dissolves} successful dissolves this round, the final score (${g.game.score}) ` +
     `should exceed the pure-survival-time score (${timeOnlyScore}) — instead it is exactly equal, ` +
     'meaning every dissolve/streak bonus earned during play was discarded and skillful play is worth ' +
     'nothing versus simply surviving',
     g.game.score > timeOnlyScore);

  console.log('\n--- exhaust the fail condition: reach a real ending ---');
  g.resetGame(false);
  eq(g.game.lives, 3, 'starts with 3 lives');
  for (let i = 1; i <= 3; i++) {
    const streakBefore = g.game.streak;
    // build a little streak first so we can see it actually reset on damage
    if (i === 1) { g.spawnEcho(); dissolveOneLiveEcho(); }
    const livesBefore = g.game.lives;
    pushCentreEcho();
    g.update(16);
    eq(g.game.lives, livesBefore - 1, `collision ${i} costs exactly one life`);
    if (i < 3) eq(g.game.state, 'playing', `still playing after losing life ${i} of 3`);
  }
  eq(g.game.state, 'gameover', 'losing the third life ends the round');
  eq(g.game.streak, 0, 'a collision resets the streak to 0');

  console.log('\n--- restart from that ending: playable again ---');
  g.resetGame(false);
  eq(g.game.state, 'playing', 'resetGame(false) from gameover returns to playing');
  eq(g.game.lives, 3, 'lives are restored on restart');
  eq(g.game.score, 0, 'score is reset on restart');
  eq(g.echoes.length, 0, 'the board is cleared on restart');
  const acceptedAfterRestart = dissolveOneLiveEcho();
  ok('input is accepted again after restarting from gameover', acceptedAfterRestart);
  ok('the game advances again after restarting from gameover', g.game.score > 0 || g.game.streak > 0);

  console.log('\n--- win path ---');
  g.resetGame(false);
  g.game.survived = 59.99;
  g.update(16);
  eq(g.game.state, 'won', 'surviving 60 seconds in normal mode wins the round');

  console.log('\n--- bonus mode (endless): advances rather than consuming and freezing ---');
  // The real handler for entering endless is resetGame(true), called from the 'won'
  // screen by the keydown('e') listener. Replay that exact call.
  g.resetGame(true);
  eq(g.game.state, 'playing', 'entering endless mode starts a live round');
  eq(g.game.endless, true, 'endless flag is set');
  eq(g.game.lives, 3, 'endless mode starts with full lives');

  // Endless must not soft-lock: dissolving still works, and it must not silently
  // auto-win at 60s (defeating the point of "endless").
  const acceptedInEndless = dissolveOneLiveEcho();
  ok('dissolving is accepted in endless mode', acceptedInEndless);
  let ranPastMinute = false;
  for (let i = 0; i < 6000 && g.game.state === 'playing'; i++) {
    if (dissolveOneLiveEcho()) { /* keep clearing threats so we survive past 60s */ }
    g.update(16);
    if (g.game.survived > 61) { ranPastMinute = true; break; }
  }
  ok('endless mode does not auto-win at 60s (survived past a minute while still playing)',
    ranPastMinute && g.game.state === 'playing');

  // Endless must still be escapable via the normal fail condition (not an inescapable mode).
  g.game.lives = 1;
  pushCentreEcho();
  g.update(16);
  eq(g.game.state, 'gameover', 'endless mode still ends normally when lives run out');

  // And restarting a normal round from there drops endless again (no stuck flag).
  g.resetGame(false);
  eq(g.game.endless, false, 'restarting a normal round after endless clears the endless flag');

  console.log('\n--- pause: freezes and resumes cleanly, no permanent lock ---');
  g.resetGame(false);
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause enters the paused state');
  const survivedWhilePaused = g.game.survived;
  g.update(16); g.update(16);
  eq(g.game.survived, survivedWhilePaused, 'time does not advance while paused');
  g.togglePause();
  eq(g.game.state, 'playing', 'togglePause resumes play');
  g.update(16);
  ok('time advances again after resuming', g.game.survived > survivedWhilePaused);

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
