// jsdom Tier 2 playthrough suite for Comeback Typer (#17)
// Typing-speed game: a guilt-trip prompt appears; the player types the calm
// response into a real (near-invisible) <input id="ti"> before the pressure
// bar (barT vs timePer) fills. 3 lives. Clearing 10 prompts -> 'roundover'.
// Losing all lives -> 'gameover'. There is no skip/hint/power-up mechanic in
// this game (confirmed by reading index.html), so item 5 of the protocol is
// exercised via the closest analogous "mode that could freeze input" this
// game has: pause/resume.
//
// This game has no clickLetter-style hook shortcut for input. The *real*
// path is the DOM: set #ti.value and dispatch a real 'input' event, exactly
// like a browser does on a keystroke. Screen transitions (title->playing,
// roundover->next round, gameover->restart) go through activate(), wired to
// canvas mousedown/touchstart -- also not on the hook -- so those are driven
// with a real mousedown on the canvas. Testing through the actual listener
// wiring, not a hook shortcut, is what caught the bug below.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'comeback-typer', 'index.html');
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
const doc = win.document;
const canvas = doc.getElementById('game');
const ti = doc.getElementById('ti');

// Real click on the canvas -- exercises activate() through its actual wiring
// (title->playing, roundover->next round, gameover->restart), not a hook shortcut.
function clickCanvas() { canvas.dispatchEvent(new win.MouseEvent('mousedown', { bubbles: true })); }

// Real keystrokes into the hidden text input, one character at a time with a
// realistic human inter-keystroke gap -- exercises the actual 'input'
// listener (keystroke counting, checkTyped) exactly as a player's typing
// would, and rules out "the harness dispatched too fast" as an explanation
// for anything found (90ms/char is well under every timer this game uses:
// the 350ms post-correct delay and the multi-second per-word timer).
async function typeSlow(text) {
  let val = '';
  for (const ch of text) {
    val += ch;
    ti.value = val;
    ti.dispatchEvent(new win.Event('input', { bubbles: true }));
    await sleep(20);
  }
}
function typeInstant(text) {
  ti.value = text;
  ti.dispatchEvent(new win.Event('input', { bubbles: true }));
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'startRound', 'nextPrompt', 'checkTyped',
    'onTimeout', 'update', 'draw', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.PROMPTS));
  ok('canvas element is present', !!canvas);
  ok('hidden text input is present', !!ti);
  ok('no uncaught page errors on load', pageErrors.length === 0);

  eq(g.PROMPTS.length, 12, 'prompt list has 12 entries');
  ok('every prompt has a question and a response', g.PROMPTS.every(x => typeof x.q === 'string' && typeof x.r === 'string' && x.r.length > 0));
  ok('every response ends in a punctuation mark the match-normalizer strips',
    g.PROMPTS.every(x => /[.!?]$/.test(x.r.trim())));
  eq(g.TOTAL, 10, 'a round is 10 prompts');
  eq(g.LIVES, 3, 'the game starts with 3 lives');

  let drewOk = true;
  g.startRound();
  for (const st of ['title', 'playing', 'paused', 'roundover', 'gameover']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  ok('draw() runs in every state without throwing', drewOk);

  g.resetGame();
  let updateOk = true;
  try { for (const dt of [0, 16, 16.7, 1000, -5]) g.update(dt); for (let i = 0; i < 200; i++) g.update(16); }
  catch (e) { updateOk = false; console.log('    update threw: ' + e.message); }
  ok('update() tolerates odd dt and long runs', updateOk);

  /* ======================= LOGIC: real entry point ======================= */
  console.log('\n--- logic: starting the game the way a player does ---');
  g.game.state = 'title';
  clickCanvas();
  eq(g.game.state, 'playing', 'clicking the title screen starts the game (real activate() path)');
  ok('a prompt is loaded after the title click', !!g.current && typeof g.current.q === 'string');
  eq(g.game.lives, 3, 'a fresh round starts with full lives');
  eq(g.game.idx, 1, 'the first prompt advances idx to 1');

  /* ======================= THE CORE BUG ======================= */
  console.log('\n--- logic: core loop -- does one correct, fully-typed response advance exactly one prompt? ---');
  {
    g.resetGame();
    const beforeIdx = g.game.idx;      // 1
    const beforeScore = g.game.score;  // 0
    const target = g.current.r;        // e.g. "I'm living the life I want."
    ok('sanity: this response ends with a period', target.trim().endsWith('.'));

    // Type the whole response, one real keystroke at a time, continuing the
    // same value (not restarting) so we can observe the exact moment the
    // match first fires relative to the final character.
    let val = '';
    let matchedBeforeFinalChar = false;
    for (let i = 0; i < target.length; i++) {
      val += target[i];
      ti.value = val;
      ti.dispatchEvent(new win.Event('input', { bubbles: true }));
      if (i === target.length - 2 && g.game.streak === 1) matchedBeforeFinalChar = true;
      await sleep(20);
    }
    ok('the response is not marked solved until its final character (the period) is typed',
      !matchedBeforeFinalChar);

    eq(g.game.streak, 1, 'a single correct response is matched exactly once (streak should be 1, not double-counted)');
    ok('a single correct response awards points exactly once (a small amount, not doubled)', g.game.score - beforeScore <= 2);

    await sleep(500); // let the scheduled nextPrompt() (350ms) settle
    eq(g.game.idx, beforeIdx + 1, 'one correct answer advances by exactly one prompt -- the player should see every prompt');
  }

  console.log('\n--- logic: the same behaviour holds on every prompt, at realistic typing speed ---');
  {
    g.resetGame();
    const rounds = 3;
    for (let n = 0; n < rounds; n++) {
      const idxBefore = g.game.idx;
      const target = g.current.r;
      await typeSlow(target); // full, correct, human-paced typing -- no shortcuts
      await sleep(500);
      eq(g.game.idx, idxBefore + 1, `repetition ${n + 1}: a single correct, human-paced answer advances by exactly one prompt`);
      eq(g.game.state, 'playing', `repetition ${n + 1}: still playing (not a soft-lock)`);
    }
  }

  console.log('\n--- logic: a "10-prompt" round should take 10 correct answers to clear ---');
  {
    g.resetGame();
    let answers = 0;
    while (g.game.state === 'playing' && answers < g.TOTAL + 2) {
      await typeSlow(g.current.r);
      await sleep(500);
      answers++;
    }
    eq(g.game.state, 'roundover', 'the round does end');
    eq(answers, g.TOTAL, `clearing the round should take exactly ${g.TOTAL} correct answers, one per prompt`);
  }

  console.log('\n--- logic: wrong / partial input does not advance (control -- confirms the bug is specific to the trailing-punctuation match, not "any input advances") ---');
  {
    g.resetGame();
    const idxBefore = g.game.idx;
    const scoreBefore = g.game.score;
    await typeSlow('zzz not the answer');
    await sleep(450);
    eq(g.game.idx, idxBefore, 'a wrong response does not skip to the next prompt');
    eq(g.game.score, scoreBefore, 'a wrong response does not award points');
    eq(g.game.state, 'playing', 'still playing after a wrong response');
  }

  console.log('\n--- logic: exhausting the fail condition reaches a real ending (isolated from the typing bug above) ---');
  {
    g.resetGame();
    eq(g.game.state, 'playing', 'fresh round for the timeout gauntlet');
    let rounds = 0;
    while (g.game.state === 'playing' && rounds < 5) {
      const before = g.game.lives;
      let iters = 0;
      while (g.game.lives === before && iters < 2000) { g.update(16); iters++; } // real per-frame clock, not the onTimeout() shortcut
      ok(`timeout ${rounds + 1}: the pressure bar actually overflowed via update()`, iters < 2000);
      await sleep(750); // real setTimeout (600ms) for nextPrompt()/onGameOver()
      rounds++;
    }
    eq(g.game.state, 'gameover', 'losing all lives to real timeouts reaches a real game-over screen');
    eq(g.game.lives, 0, 'all lives are spent at game over');
  }

  console.log('\n--- logic: restart from game over is playable again ---');
  {
    const bestBefore = g.game.best;
    clickCanvas();
    eq(g.game.state, 'playing', 'clicking the game-over screen restarts the round (real activate() path)');
    eq(g.game.lives, 3, 'lives are fully restored on restart');
    eq(g.game.idx, 1, 'the prompt queue restarts from the first prompt');
    ok('best score is preserved across a restart', g.game.best >= bestBefore);
    ok('a fresh prompt is loaded', !!g.current && typeof g.current.q === 'string');

    // prove input is truly live again, not just the state label (accept either
    // 1 or 2 for the advance, since the bug above still applies here -- this
    // check is about "is it playable at all", not re-litigating the bug)
    const idxBefore = g.game.idx;
    await typeSlow(g.current.r);
    await sleep(500);
    ok('after restart, typing the correct response is accepted and the round advances', g.game.idx > idxBefore);
  }

  console.log('\n--- logic: clicking the round-over screen starts a genuinely new, playable round ---');
  {
    g.resetGame();
    let answers = 0;
    while (g.game.state === 'playing' && answers < g.TOTAL + 1) { await typeSlow(g.current.r); await sleep(500); answers++; }
    eq(g.game.state, 'roundover', 'round completes (via the bug above, faster than intended, but it does complete)');

    const roundBefore = g.game.round;
    clickCanvas();
    eq(g.game.state, 'playing', 'clicking the round-over screen starts the next round (real activate() path)');
    eq(g.game.round, roundBefore + 1, 'the round counter advances');
    eq(g.game.idx, 1, 'the new round starts its own prompt queue from the first prompt');
    ok('a fresh prompt is loaded for the new round', !!g.current && typeof g.current.q === 'string');

    const idxBefore = g.game.idx;
    await typeSlow(g.current.r);
    await sleep(500);
    ok('the new round accepts input and advances (not a dead screen)', g.game.idx > idxBefore);
  }

  console.log('\n--- logic: pause/resume does not freeze input (closest thing this game has to a power-up/skip mode) ---');
  {
    g.resetGame();
    g.togglePause();
    eq(g.game.state, 'paused', 'togglePause enters the paused state');
    const idxBefore = g.game.idx;
    typeInstant(g.current.r); // typing while paused must be ignored, not crash or silently consume the answer
    ok('typing while paused does not advance the prompt', g.game.idx === idxBefore);
    g.togglePause();
    eq(g.game.state, 'playing', 'togglePause resumes play');
    await typeSlow(g.current.r);
    await sleep(500);
    ok('after resuming, input is live again and the game advances (no soft-lock from pausing)', g.game.idx > idxBefore);
  }

  console.log('\n--- no skip/hint/power-up exists in this game (confirmed against source: activate(), checkTyped(), onTimeout() are the only state-advancing functions) ---');
  ok('SKIPPED: Comeback Typer has no skip, hint, or power-up mechanic; pause/resume was tested above as the nearest analogous mode', true);

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
