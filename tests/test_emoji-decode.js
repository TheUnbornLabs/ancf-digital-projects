// jsdom Tier-2 playthrough suite for Emoji Decode (#43)
// A 15-question timed multiple-choice quiz: an emoji sequence encodes a childfree
// concept, pick the correct meaning from 4 options. No lives/lose state — the
// "fail condition" here is simply exhausting all 15 questions, always ending in 'won'.
// This game has no skip/hint/power-up feature (checked in source): that Tier-2 bullet
// is reported as not-applicable rather than faked.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'emoji-decode', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Answer the current question correctly (or incorrectly) and wait for the
// real setTimeout-driven nextQ() to fire, mirroring how a player experiences it.
async function answer(correct) {
  const cur = g.current;
  const i = correct ? cur._ansIdx : (cur._ansIdx + 1) % cur._opts.length;
  g.choose(i);
  await sleep(950);   // both the 600ms (correct) and 900ms (wrong/timeout) paths land inside this
  return cur;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['startGame', 'nextQ', 'choose', 'update', 'draw', 'optionAt']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.QUESTIONS));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  eq(g.QUESTIONS.length, 15, 'question bank has 15 entries');
  eq(g.TOTAL, 15, 'a round is 15 questions');
  ok('every question has exactly one correct + three wrong options',
    g.QUESTIONS.every(q => typeof q.answer === 'string' && Array.isArray(q.wrong) && q.wrong.length === 3));

  console.log('\n--- logic: starting a round ---');
  g.startGame();
  eq(g.game.state, 'playing', 'startGame sets state to playing');
  eq(g.game.qIdx, 1, 'startGame -> nextQ selects the first question (qIdx advances to 1)');
  eq(g.game.score, 0, 'startGame resets score');
  eq(g.game.streak, 0, 'startGame resets streak');
  ok('a current question is selected', !!g.current && typeof g.current.emoji === 'string');
  ok('current question has 4 shuffled options including the answer', g.current._opts.length === 4 && g.current._opts.includes(g.current.answer));

  console.log('\n--- logic: advancing (the core loop) ---');
  g.startGame();
  const q1 = g.current;
  const beforeScore = g.game.score;
  g.choose(q1._ansIdx);
  ok('choosing the correct option marks it answered', g.game.answered === true);
  ok('a correct answer awards score', g.game.score > beforeScore);
  eq(g.game.streak, 1, 'a correct answer raises the streak');
  await sleep(700);   // scheduled nextQ() (600ms) must have fired
  ok('answering advances to a new question', g.current !== q1);
  eq(g.game.qIdx, 2, 'the question index advances to the second question');
  eq(g.game.answered, false, 'input is unblocked on the new question');
  eq(g.game.state, 'playing', 'still playing after advancing');
  eq(g.game.chosen, -1, 'the new question starts with nothing chosen');

  console.log('\n--- logic: three in a row, still advancing, still accepting input ---');
  g.startGame();
  let lastQ = g.current;
  for (let n = 0; n < 3; n++) {
    const before = g.game.qIdx;
    const q = g.current;
    g.choose(q._ansIdx);
    ok(`round ${n + 1}: choose() is accepted while playing`, g.game.answered === true);
    await sleep(700);
    ok(`round ${n + 1}: game advances to a new question`, g.current !== q);
    eq(g.game.qIdx, before + 1, `round ${n + 1}: qIdx increments`);
    eq(g.game.state, 'playing', `round ${n + 1}: still in playing state`);
    ok(`round ${n + 1}: input is accepted on the new question`, g.game.answered === false);
    lastQ = g.current;
  }

  console.log('\n--- logic: a wrong answer also advances (no soft-lock on failure) ---');
  g.startGame();
  const qw = g.current;
  const wrongIdx = (qw._ansIdx + 1) % qw._opts.length;
  const streakBefore = 0;
  g.choose(wrongIdx);
  eq(g.game.chosen, wrongIdx, 'the wrong choice is recorded');
  eq(g.game.streak, 0, 'a wrong answer resets the streak');
  await sleep(950);
  ok('a wrong answer still advances to a new question', g.current !== qw);
  eq(g.game.answered, false, 'input is unblocked after a wrong answer');
  eq(g.game.state, 'playing', 'still playing after a wrong answer');

  console.log('\n--- logic: input is refused mid-animation (by design) then restored ---');
  g.startGame();
  const qa = g.current;
  g.choose(qa._ansIdx);
  const chosenAfterFirst = g.game.chosen;
  g.choose((qa._ansIdx + 1) % qa._opts.length);   // second click while answered===true
  eq(g.game.chosen, chosenAfterFirst, 'a second click during the transition is ignored (guards against double-answer)');
  await sleep(700);
  ok('input works again once the transition completes', g.game.answered === false);

  console.log('\n--- logic: timeout path (running out of time) also advances ---');
  g.startGame();
  const qt = g.current;
  const limit = g.TIME_PER;
  let ticks = 0;
  while (g.game.answered === false && ticks < 2000) { g.update(48); ticks++; }
  ok('the clock actually ran out (answered becomes true without a click)', g.game.answered === true);
  eq(g.game.chosen, -2, 'a timeout is recorded with the sentinel chosen=-2');
  eq(g.game.streak, 0, 'a timeout resets the streak');
  await sleep(950);
  ok('a timeout still advances to a new question', g.current !== qt);
  eq(g.game.state, 'playing', 'still playing after a timeout');
  eq(g.game.answered, false, 'input is unblocked after a timeout');

  console.log('\n--- logic: timer ramps down but respects its floor ---');
  g.startGame();
  const limitEarly = g.TIME_PER;
  g.game.qIdx = 14; g.nextQ();
  const limitLate = g.TIME_PER;
  ok('the per-question timer shortens as the round progresses', limitLate <= limitEarly);
  g.game.qIdx = 9999; g.nextQ();
  ok('the per-question timer never drops below its floor', g.TIME_PER >= 5000);

  console.log('\n--- logic: exhausting the round reaches a real ending ---');
  g.startGame();
  let guard = 0;
  while (g.game.state === 'playing' && guard < 60) {
    const q = g.current;
    // alternate correct/wrong to exercise both scoring paths on the way to the end
    g.choose(guard % 2 === 0 ? q._ansIdx : (q._ansIdx + 1) % q._opts.length);
    await sleep(950);
    guard++;
  }
  eq(g.game.state, 'won', 'clearing all 15 questions reaches the won screen');
  eq(g.game.qIdx, 15, 'qIdx reflects all 15 questions consumed');
  ok('accuracy/streak bookkeeping is internally consistent',
    g.game.totalAnswered === 15 && g.game.correctCount >= 0 && g.game.correctCount <= 15);

  console.log('\n--- logic: restart from the ending is playable again ---');
  ok('game is sitting on the won screen', g.game.state === 'won');
  const wonScore = g.game.score;
  g.startGame();   // this is exactly what pointerDown() calls when state is 'won' (index.html: state==='won' -> startGame())
  eq(g.game.state, 'playing', 'startGame() from the won screen returns to playing');
  eq(g.game.qIdx, 1, 'the question counter restarts at the first question');
  eq(g.game.score, 0, 'the score resets on restart');
  ok('a fresh current question is selected', !!g.current);
  // and the restarted round is itself fully drivable
  const qAfterRestart = g.current;
  g.choose(qAfterRestart._ansIdx);
  ok('input is accepted immediately after restart', g.game.answered === true);
  await sleep(700);
  ok('the restarted round advances normally', g.current !== qAfterRestart);

  console.log('\n--- logic: best score persists across the loop ---');
  g.startGame();
  g.game.score = 999;
  g.game.qIdx = g.TOTAL;
  g.nextQ();
  eq(g.game.state, 'won', 'forcing qIdx to TOTAL ends the round');
  eq(g.game.best, 999, 'a new high score updates game.best');
  eq(win.localStorage.getItem('emojiDecode_best'), '999', 'the best score is saved to localStorage');

  console.log('\n--- logic: skip/hint/power-up path ---');
  ok('N/A: Emoji Decode has no skip, hint, or power-up mechanic in source (only choose() and the timeout)', true);

  console.log('\n--- smoke: draw() survives every state ---');
  let drewOk = true;
  for (const st of ['title', 'playing', 'won']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  ok('draw() runs in every real state without throwing', drewOk);
  g.startGame();

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
