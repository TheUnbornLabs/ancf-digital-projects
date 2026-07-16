// jsdom Tier-2 playthrough suite for Tightrope (#89)
// Core loop: hold Left/Right to counter wind gusts and keep |tilt| under threshold while
// walking across a rope (progress 0->1). Cross 10 ropes (TOTAL) without losing all 3 lives.
// Drives the game via window.__cfq exactly as a player would, then asserts PROGRESSION,
// not just setup. See tests/audit/PROTOCOL.md.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'tightrope', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- canvas 2D context stub (jsdom returns null for getContext) ----
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

function makeGame() {
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
  return { win: dom.window, g: dom.window.__cfq, pageErrors };
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  let { win, g, pageErrors } = makeGame();
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildLevel', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && !!g.input);
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.TOTAL, 10, 'the round exposes TOTAL ropes to cross');

  let drewOk = true;
  g.resetGame();
  for (const st of ['title', 'playing', 'paused', 'won', 'gameover']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  g.resetGame();
  ok('draw() runs in every state without throwing', drewOk);

  g.resetGame();
  let updateOk = true;
  try { for (const dt of [0, 16, 16.7, 1000, -5, 5000]) g.update(dt); for (let i = 0; i < 200; i++) g.update(16); }
  catch (e) { updateOk = false; console.log('    update threw: ' + e.message); }
  ok('update() tolerates odd dt and long runs', updateOk);

  /* ======================= LOGIC: setup ======================= */
  console.log('\n--- logic: setup ---');
  ({ win, g } = makeGame());
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts the game playing');
  eq(g.game.round, 0, 'resetGame starts at round 0');
  eq(g.game.score, 0, 'resetGame resets score');
  eq(g.game.lives, 3, 'resetGame restores 3 lives');
  eq(g.game.streak, 0, 'resetGame clears streak');
  ok('a player is placed on the rope', !!g.player && g.player.x === 80);

  /* ======================= LOGIC: core loop — a single crossing ======================= */
  // The completion of a crossing is NOT applied synchronously: progress>=1 awards score and
  // schedules `setTimeout(()=>{game.round++; ...}, 400)` to move to the next rope, but game.state
  // stays 'playing' and player.x is left exactly where it is until that callback fires. Nothing
  // blocks update() from re-entering the `if(progress>=1)` branch on every frame in between.
  console.log('\n--- logic: core loop (a single crossing) ---');
  ({ win, g } = makeGame());
  g.resetGame();
  g.player.x = 880; // finish line: W-160+80 = 800+80 = 880 -> progress clamps to 1
  eq(g.progress, 0, 'progress has not been recomputed yet (still pre-frame)');
  g.update(16);
  const roundAtFinish = g.game.round;
  const score1 = g.game.score;
  ok('reaching the end of the rope awards score', score1 > 0);
  eq(g.progress, 1, 'progress reads 1 at the finish line');

  console.log('\n--- logic: do it three times running (same crossing, next 3 rendered frames) ---');
  g.update(16);
  const score2 = g.game.score;
  g.update(16);
  const score3 = g.game.score;
  g.update(16);
  const score4 = g.game.score;
  // A competent player only crossed the rope ONCE, and gave no new input on these frames.
  // Nothing should re-score or re-trigger the completion of a crossing that already completed.
  eq(score2, score1, 'a single crossing is not scored again on the very next rendered frame');
  eq(score3, score2, 'nor on the frame after that');
  eq(score4, score3, 'nor on the frame after that');
  eq(g.game.round, roundAtFinish, 'round has still not advanced synchronously (the round++ is deferred)');

  await sleep(550); // let every setTimeout(...,400) scheduled above fire
  eq(g.game.round, roundAtFinish + 1, 'after settling, crossing one rope advances the round by exactly one');
  console.log('    observed: round went from ' + roundAtFinish + ' to ' + g.game.round + ' from a single crossing; score went from ' + score1 + ' to ' + g.game.score);

  /* ======================= LOGIC: same bug under realistic (non-teleported) play ======================= */
  // Corroborate the above isn't an artifact of forcing player.x: run a simple competent-player
  // auto-balancer (lean opposite the current tilt) frame-by-frame from a fresh round until it
  // naturally reaches the finish, then keep calling update() for the ~24 more frames a real
  // browser's requestAnimationFrame would fire during the 400ms transition window, all with NO
  // additional real wall-clock time elapsed (exactly matching real 60fps timing).
  console.log('\n--- logic: realistic auto-balanced crossing corroborates the bug ---');
  ({ win, g } = makeGame());
  g.resetGame();
  let frame = 0;
  while (g.progress < 1 && g.game.state === 'playing' && frame < 3000) {
    g.input.left = g.tilt > 0.02;
    g.input.right = g.tilt < -0.02;
    g.update(16.7);
    frame++;
  }
  ok('a competent auto-balancing player naturally reaches the far end of the rope', g.progress === 1 && g.game.state === 'playing');
  const naturalScoreAtFinish = g.game.score;
  const naturalRoundAtFinish = g.game.round;
  for (let i = 0; i < 24; i++) g.update(16.7); // ~400ms of real frames, no sleep — matches real 60fps rAF timing
  eq(g.game.score, naturalScoreAtFinish, 'under realistic (non-teleported) play, score does not inflate during the transition window');
  await sleep(550);
  eq(g.game.round, naturalRoundAtFinish + 1, 'under realistic play, a single crossing still advances the round by exactly one');
  console.log('    observed: natural crossing finished at frame ' + frame + ' with score ' + naturalScoreAtFinish +
    '; after the transition window + settling, round=' + g.game.round + ' score=' + g.game.score + ' state=' + g.game.state);

  /* ======================= LOGIC: exhaust the fail condition (isolated from the above bug) ======================= */
  console.log('\n--- logic: exhaust lives -> reach a real ending ---');
  ({ win, g } = makeGame());
  g.resetGame();
  g.game.lives = 1;
  g.input.left = false; g.input.right = false; // a player who does not counter gusts will fall
  let fellAtFrame = -1;
  for (let i = 0; i < 1000 && fellAtFrame < 0; i++) {
    const livesBefore = g.game.lives;
    g.update(16);
    if (g.game.lives < livesBefore) fellAtFrame = i;
  }
  ok('not countering gusts eventually causes a fall', fellAtFrame >= 0);
  ok('the fall happened well before reaching the far end (isolated from the crossing bug above)', g.progress < 0.9);
  eq(g.game.lives, 0, 'the last life is spent');
  await sleep(550);
  eq(g.game.state, 'gameover', 'losing the last life reaches a real gameover screen (when isolated from the crossing bug)');

  /* ======================= LOGIC: restart from that ending ======================= */
  console.log('\n--- logic: restart from gameover ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'a round can be started again after a game over');
  eq(g.game.round, 0, 'restarting resets the round counter');
  eq(g.game.lives, 3, 'restarting restores full lives');
  eq(g.game.score, 0, 'restarting resets score');
  let postRestartOk = true;
  try { for (let i = 0; i < 60; i++) g.update(16); } catch (e) { postRestartOk = false; }
  ok('the game keeps running normally after a restart', postRestartOk && g.game.state === 'playing');

  console.log('\n--- logic: restart from a win screen ---');
  ({ win, g } = makeGame());
  g.resetGame();
  g.game.state = 'won';
  g.resetGame();
  eq(g.game.state, 'playing', 'a round can be started again after winning');
  eq(g.game.round, 0, 'restarting after a win resets the round counter');

  /* ======================= LOGIC: pause is a safe detour, not a soft-lock ======================= */
  console.log('\n--- logic: pause / resume ---');
  ({ win, g } = makeGame());
  g.resetGame();
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause pauses from playing');
  const scoreWhilePaused = g.game.score;
  g.update(16);
  eq(g.game.score, scoreWhilePaused, 'update() is a no-op while paused');
  g.togglePause();
  eq(g.game.state, 'playing', 'togglePause resumes back to playing');

  /* ======================= LOGIC: no skip/hint/power-up path exists ======================= */
  console.log('\n--- logic: skip / hint / power-up path ---');
  ok('Tightrope has no skip, hint, or power-up mechanic exposed on the hook (only lean input exists) — item 5 of the Tier-2 minimum bar does not apply to this game',
    !('skipWord' in g) && !('revealHint' in g) && !('revealLetter' in g) && !('usePowerUp' in g));

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
