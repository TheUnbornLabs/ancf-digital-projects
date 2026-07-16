// jsdom test harness for Word Unscramble (#25)
// Smoke tests: the page loads, the hook is wired, and every state renders.
// Logic tests: word queue, letter matching, lives, scoring, skip, timer, reveals.
// Stubs the canvas 2D context (jsdom returns null) and drives the game via window.__cfq.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'word-unscramble', 'index.html');
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
  url: 'http://localhost/',           // gives us a real localStorage for the best-score test
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

// Click the letters of the current word in the correct order.
// Returns the word that was solved.
function solveCurrentWord() {
  const word = g.current.w;
  for (let k = 0; k < word.length; k++) {
    const li = g.letters.findIndex(l => !l.used && l.ch === word[k]);
    if (li < 0) break;
    g.clickLetter(li);
  }
  return word;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['startRound', 'nextWord', 'clickLetter', 'skipWord', 'revealHint',
    'revealLetter', 'update', 'draw', 'resetGame', 'layoutLetters', 'letterAt']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.WORDS));
  ok('canvas element is present', !!win.document.getElementById('game'));
  ok('no uncaught page errors on load', pageErrors.length === 0);

  eq(g.WORDS.length, 20, 'word list has 20 entries');
  ok('every word has text and a hint', g.WORDS.every(x => typeof x.w === 'string' && x.w.length > 2 && typeof x.hint === 'string' && x.hint.length > 0));
  ok('every word is uppercase A-Z', g.WORDS.every(x => /^[A-Z]+$/.test(x.w)));
  ok('word list has no duplicates', new Set(g.WORDS.map(x => x.w)).size === g.WORDS.length);

  let drewOk = true;
  g.startRound();
  for (const st of ['title', 'playing', 'paused', 'won', 'gameover']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  g.resetGame();   // this test forces state directly; clear it so later tests start clean
  ok('draw() runs in every state without throwing', drewOk);

  // A player who dies must be able to start again (index.html:317 calls startRound()
  // straight from the gameover screen).
  g.resetGame();
  g.game.state = 'gameover';
  g.startRound();
  eq(g.game.state, 'playing', 'a round can be started again after a game over');
  g.resetGame();   // isolate: if the line above fails, don't cascade into every later test

  g.startRound();
  let updateOk = true;
  try { for (const dt of [0, 16, 16.7, 1000, -5]) g.update(dt); for (let i = 0; i < 200; i++) g.update(16); }
  catch (e) { updateOk = false; console.log('    update threw: ' + e.message); }
  ok('update() tolerates odd dt and long runs', updateOk);

  /* ======================= LOGIC ======================= */
  console.log('\n--- logic: setup & queue ---');
  ok('WORDS_BY_LEN is a permutation of WORDS',
    g.WORDS_BY_LEN.length === g.WORDS.length &&
    new Set(g.WORDS_BY_LEN.map(x => x.w)).size === g.WORDS.length);
  ok('WORDS_BY_LEN is sorted shortest-first (difficulty ramp)',
    g.WORDS_BY_LEN.every((x, i, a) => i === 0 || a[i - 1].w.length <= x.w.length));

  g.startRound();
  eq(g.game.state, 'playing', 'startRound sets state to playing');
  eq(g.game.score, 0, 'startRound resets score');
  eq(g.game.lives, g.game.maxLives, 'startRound restores full lives');
  eq(g.game.skips, 1, 'startRound grants one skip');
  eq(g.game.revealsLeft, 1, 'startRound grants one reveal');
  eq(g.game.combo, 0, 'startRound clears combo');
  eq(g.queue.length, g.WORDS.length, 'queue holds every word');
  ok('queue is ordered shortest-first (ramp survives the shuffle)',
    g.queue.every((x, i, a) => i === 0 || a[i - 1].w.length <= x.w.length));
  ok('a current word is selected', !!g.current && typeof g.current.w === 'string');
  eq(g.transitioning, false, 'round starts un-blocked');

  console.log('\n--- logic: letters ---');
  ok('scrambled letters are an exact permutation of the word',
    g.letters.map(l => l.ch).slice().sort().join('') === g.current.w.split('').sort().join(''));
  ok('all letters start unused', g.letters.every(l => !l.used));
  eq(g.typed.length, 0, 'nothing is typed yet');

  // correct letter
  g.startRound();
  const w1 = g.current.w;
  const firstIdx = g.letters.findIndex(l => l.ch === w1[0]);
  g.clickLetter(firstIdx);
  eq(g.typed.join(''), w1[0], 'clicking the correct letter types it');
  ok('the used letter is marked used', g.letters[firstIdx].used === true);

  // clicking an already-used letter is inert
  const typedLen = g.typed.length;
  g.clickLetter(firstIdx);
  eq(g.typed.length, typedLen, 'clicking a used letter does nothing');

  // wrong letter
  g.startRound();
  const w2 = g.current.w;
  const wrongIdx = g.letters.findIndex(l => l.ch !== w2[0]);
  if (wrongIdx >= 0) {
    const lives0 = g.game.lives;
    g.clickLetter(wrongIdx);
    eq(g.game.lives, lives0 - 1, 'a wrong letter costs a life');
    eq(g.typed.length, 0, 'a wrong letter is not typed');
    eq(g.game.combo, 0, 'a wrong letter resets the combo');
  } else { ok('SKIPPED wrong-letter test (word has identical letters)', true); }

  console.log('\n--- logic: advancing (the core loop) ---');
  g.startRound();
  const solved = solveCurrentWord();
  eq(g.typed.join(''), solved, 'typing every letter completes the word');
  ok('completing a word awards score', g.game.score > 0);
  eq(g.game.combo, 1, 'completing a word raises the combo');
  ok('completion blocks input while it animates', g.transitioning === true);

  await sleep(700);   // the scheduled nextWord() (500ms) must have fired by now
  ok('completing a word advances to the next word', !!g.current && g.current.w !== solved);
  eq(g.game.idx, 2, 'the word index advances to the second word');
  eq(g.transitioning, false, 'input is unblocked on the new word');
  eq(g.game.state, 'playing', 'still playing after advancing');
  eq(g.typed.length, 0, 'the new word starts with nothing typed');
  ok('the new word has freshly scrambled letters',
    g.letters.length > 0 && g.letters.every(l => !l.used));

  console.log('\n--- logic: skip ---');
  g.startRound();
  const beforeSkip = g.current.w;
  const skips0 = g.game.skips;
  g.skipWord();
  eq(g.game.skips, skips0 - 1, 'skipping spends a skip');
  ok('skipping advances to a new word', g.current.w !== beforeSkip);
  eq(g.transitioning, false, 'the game is playable after a skip');
  const acceptedIdx = g.letters.findIndex(l => !l.used && l.ch === g.current.w[0]);
  g.clickLetter(acceptedIdx);
  ok('input is accepted after a skip', g.typed.length === 1);

  g.startRound();
  g.game.skips = 0;
  const noSkipWord = g.current.w;
  g.skipWord();
  eq(g.game.skips, 0, 'skip is refused when none remain');
  eq(g.current.w, noSkipWord, 'the word does not change when skip is refused');

  console.log('\n--- logic: timer ---');
  g.startRound();
  const tMax1 = g.barTMax;
  g.game.idx = 10; g.nextWord();
  ok('the per-word timer shortens as the round progresses', g.barTMax < tMax1);
  g.game.idx = 500; g.nextWord();   // far past the floor
  ok('the per-word timer never drops below its floor', g.barTMax >= 6000);

  // running out of time costs a life and moves on
  g.startRound();
  const livesT0 = g.game.lives;
  for (let i = 0; i < 2000 && g.game.lives === livesT0; i++) g.update(16);
  eq(g.game.lives, livesT0 - 1, 'running out of time costs a life');
  await sleep(700);
  eq(g.game.idx, 2, 'running out of time moves on to the next word');
  eq(g.transitioning, false, 'the game is playable after a timeout');

  console.log('\n--- logic: lives & game over ---');
  g.startRound();
  g.game.lives = 1;
  const wLast = g.current.w;
  const badIdx = g.letters.findIndex(l => l.ch !== wLast[0]);
  if (badIdx >= 0) {
    g.clickLetter(badIdx);
    eq(g.game.lives, 0, 'the last life is spent');
    await sleep(700);
    eq(g.game.state, 'gameover', 'losing the last life ends the game');
  } else { ok('SKIPPED gameover test (word has identical letters)', true); }
  g.resetGame();   // leave a clean slate; restart-after-gameover has its own test above

  console.log('\n--- logic: reveals & hints ---');
  g.startRound();
  const reveals0 = g.game.revealsLeft;
  const needed = g.current.w[0];
  g.revealLetter();
  eq(g.game.revealsLeft, reveals0 - 1, 'revealing a letter spends a reveal');
  eq(g.typed.join(''), needed, 'the revealed letter is the one that was needed');
  g.game.revealsLeft = 0;
  const typedBefore = g.typed.length;
  g.revealLetter();
  eq(g.typed.length, typedBefore, 'reveal is refused when none remain');

  g.startRound();
  g.revealHint();
  ok('revealing the hint flags a score penalty', g.game.hintUsed === true && g.game.hintPenalty > 0);

  // an unspent hint penalty must not follow the player into their next round
  g.startRound();
  g.revealHint();
  g.startRound();
  ok('a hint penalty does not carry into the next round',
    g.game.hintUsed === false && g.game.hintPenalty === 0);

  console.log('\n--- logic: scoring & persistence ---');
  g.startRound();
  solveCurrentWord();
  await sleep(700);
  const scoreOneWord = g.game.score;
  ok('a solved word is worth at least 1 point', scoreOneWord >= 1);

  // hint penalty reduces the award
  g.startRound();
  g.revealHint();
  solveCurrentWord();
  await sleep(700);
  ok('using the hint scores no more than solving clean', g.game.score <= scoreOneWord);

  // win path: queue exhausted
  g.startRound();
  g.game.idx = g.queue.length;
  g.nextWord();
  eq(g.game.state, 'won', 'clearing every word wins the round');

  // best score persists
  g.startRound();
  g.game.score = 999;
  g.game.idx = g.queue.length;
  g.nextWord();
  eq(win.localStorage.getItem('word-unscramble-best'), '999', 'the best score is saved to localStorage');

  console.log('\n--- logic: hit testing ---');
  g.startRound();
  g.layoutLetters();
  const L0 = g.letters[0];
  eq(g.letterAt(L0.x + 5, L0.y + 5), 0, 'letterAt finds the letter under the cursor');
  eq(g.letterAt(L0.x - 500, L0.y - 500), -1, 'letterAt returns -1 away from any letter');

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
