// jsdom Tier-2 playthrough suite for Timeline Sort (#45)
// Drag labelled life-event cards onto a 5-slot timeline, 6 rounds, MISS_LIMIT=8 total
// wrong placements across the run. Drives the real loop via window.__cfq: snapToSlot()
// is the actual placement function the pointer handlers call, so using it directly
// exercises the same code path a player's drag-drop would.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'timeline-sort', 'index.html');
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
    w.requestAnimationFrame = () => 0;  // disable auto-loop; setTimeout-based round transitions still fire
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// Place every card of the CURRENT round into its correct slot (a clean, perfect round).
function placeRoundCorrectly() {
  const cards = g.cards.slice();
  for (const c of cards) g.snapToSlot(c, c.correct);
}

// Place every card of the CURRENT round into a WRONG slot (guaranteed miss each time:
// (correct+1) mod SLOTS is a cyclic shift of a 0..SLOTS-1 permutation, so it never equals
// the original index).
function placeRoundAllWrong() {
  const cards = g.cards.slice();
  for (const c of cards) g.snapToSlot(c, (c.correct + 1) % g.SLOTS);
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'checkDone', 'nearestSlot',
    'snapToSlot', 'retryRound', 'togglePause', 'setMuted', 'update', 'draw']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes a live game object', !!g.game);
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.MAX_ROUNDS, g.SETS.length, 'MAX_ROUNDS matches the number of themed sets');
  eq(g.SLOTS, 5, 'five slots per round');
  ok('every set has exactly SLOTS events', g.SETS.every(s => s.events.length === g.SLOTS));

  // cards/slots do not exist until the first buildRound() (title screen has none yet)
  g.resetGame();
  ok('hook exposes live cards/slots state once a round is built', Array.isArray(g.cards) && Array.isArray(g.slots));
  ok('draw() runs after reset without throwing', (() => { try { g.draw(); return true; } catch (e) { return false; } })());

  /* ======================= CORE LOOP: does completing a round advance? ======================= */
  console.log('\n--- core loop: perfect round advances ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts in playing state');
  eq(g.game.round, 1, 'resetGame starts at round 1');
  eq(g.game.misses, 0, 'resetGame clears misses');

  const scoreBefore = g.game.score;
  placeRoundCorrectly();
  eq(g.game.round, 2, 'completing round 1 perfectly advances the round counter immediately');
  ok('a perfect round awards score', g.game.score > scoreBefore);
  ok('the round is not yet rebuilt (next buildRound is deferred)', g.cards.every(c => c.placed));

  await sleep(1000); // the scheduled buildRound() (900ms) must have fired by now
  ok('the next round\'s cards are freshly unplaced', g.cards.length === g.SLOTS && g.cards.every(c => !c.placed));
  eq(g.game.state, 'playing', 'still playing after the round transition');
  eq(g.slots.every(s => s.card === null), true, 'the new round\'s slots start empty');

  /* ======================= do it three times running ======================= */
  console.log('\n--- core loop: three rounds in a row, still advancing, still accepting input ---');
  // we are now on round 2; clear a fresh baseline
  g.resetGame();
  for (let r = 1; r <= 3; r++) {
    eq(g.game.round, r, `round counter is ${r} before completing it`);
    const before = g.game.score;
    // prove input is accepted mid-round: place the first card alone and see it register
    const c0 = g.cards[0];
    g.snapToSlot(c0, c0.correct);
    ok(`input is accepted on round ${r} (a placement registers)`, c0.placed === true);
    // then finish the round with the rest of the cards
    for (const c of g.cards.slice(1)) g.snapToSlot(c, c.correct);
    eq(g.game.round, r + 1, `completing round ${r} advances to round ${r + 1}`);
    ok(`round ${r} awarded score`, g.game.score > before);
    await sleep(1000);
    ok(`round ${r + 1}'s cards are ready and unplaced`, g.cards.every(c => !c.placed));
  }

  /* ======================= full clean playthrough: reach the win screen ======================= */
  console.log('\n--- reach a real ending: win by completing all rounds ---');
  g.resetGame();
  for (let r = 1; r < g.MAX_ROUNDS; r++) {
    placeRoundCorrectly();
    await sleep(1000);
  }
  eq(g.game.round, g.MAX_ROUNDS, `round counter reaches ${g.MAX_ROUNDS} for the final round`);
  placeRoundCorrectly(); // final round: MAX_ROUNDS branch sets state='won' synchronously, no setTimeout
  eq(g.game.state, 'won', 'clearing every round wins the run');
  eq(g.game.roundResults.length, g.MAX_ROUNDS, 'every round\'s result was recorded on a clean run');
  ok('every recorded round on a clean run was perfect', g.game.roundResults.every(r => r.correct === r.total));

  /* ======================= restart from the win screen ======================= */
  console.log('\n--- restart after winning ---');
  g.resetGame(); // this is the real restart handler onDown2 calls when state is 'won'/'gameover'/'title'
  eq(g.game.state, 'playing', 'a run can be started again after winning');
  eq(g.game.round, 1, 'restart resets the round counter');
  eq(g.game.roundResults.length, 0, 'restart clears round history');
  placeRoundCorrectly();
  eq(g.game.round, 2, 'the restarted run is genuinely playable (round 1 completes and advances)');

  /* ======================= exhaust the fail condition: reach game over ======================= */
  console.log('\n--- exhaust the fail condition: too many misses ---');
  g.resetGame();
  placeRoundAllWrong();               // round 1: 5 misses
  eq(g.game.misses, 5, 'five wrong placements in round 1 register as five misses');
  ok('misses below the limit do not end the run yet', g.game.state === 'playing' && g.game.round === 2);
  await sleep(1000);
  placeRoundAllWrong();               // round 2: 5 more misses -> 10 >= MISS_LIMIT(8)
  eq(g.game.misses, 10, 'ten total misses recorded across two bad rounds');
  eq(g.game.state, 'gameover', 'exceeding MISS_LIMIT ends the run in gameover');

  /* ======================= restart from game over ======================= */
  console.log('\n--- restart after a game over ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'a run can be started again after a game over');
  eq(g.game.misses, 0, 'restart clears the miss counter');
  placeRoundCorrectly();
  eq(g.game.round, 2, 'the restarted run after a game over is genuinely playable');

  /* ======================= drag-based placement path (nearestSlot) ======================= */
  console.log('\n--- alternate input path: nearestSlot + snapToSlot (drag-drop) ---');
  g.resetGame();
  {
    const card = g.cards[0];
    const slot = g.slots[card.correct];
    const idx = g.nearestSlot(slot.x, slot.y);
    eq(idx, card.correct, 'nearestSlot resolves a drop centred on a slot to that slot');
    g.snapToSlot(card, idx);
    ok('a drag-drop placement registers', card.placed === true && card.slotIdx === card.correct);
  }

  /* ======================= retryRound: does it advance or corrupt state? ======================= */
  console.log('\n--- retryRound: mid-round retry must not corrupt history ---');
  g.resetGame();
  placeRoundCorrectly();              // finish round 1 cleanly
  await sleep(1000);                  // round 2 loads
  eq(g.game.roundResults.length, 1, 'round 1\'s result is recorded before any retry');
  // place two of round 2's five cards, then retry mid-round (this is the realistic player
  // action: press R after botching part of the round, per the on-screen "R retry round" hint)
  const round2Cards = g.cards.slice();
  g.snapToSlot(round2Cards[0], round2Cards[0].correct);
  g.snapToSlot(round2Cards[1], round2Cards[1].correct);
  const resultsBeforeRetry = g.game.roundResults.length;
  const roundBeforeRetry = g.game.round;
  g.retryRound();
  eq(g.game.round, roundBeforeRetry, 'retryRound keeps the player on the same round');
  eq(g.game.state, 'playing', 'retryRound does not freeze the game');
  ok('retryRound resets the current round\'s cards to unplaced', g.cards.every(c => !c.placed));
  // input still accepted after retry (not soft-locked)
  const c0 = g.cards[0];
  g.snapToSlot(c0, c0.correct);
  ok('input is accepted after retryRound (not consuming-and-freezing)', c0.placed === true);

  // Round 2 never pushed a result of its own (it was retried before completing), so retrying it
  // must leave round 1's genuinely-earned entry untouched.
  eq(g.game.roundResults.length, resultsBeforeRetry,
    'retryRound() preserves an earlier completed round\'s recorded result when the retried round ' +
    'never pushed one of its own');
  eq(g.game.roundResults[0] && g.game.roundResults[0].round, 1,
    'the surviving entry is round 1\'s');
  eq(g.game.roundResults[0] && g.game.roundResults[0].correct, 5,
    'round 1\'s result is intact, not just present');

  /* ---- retry inside the 900ms round-transition gap: the pending buildRound must be cancelled ---- */
  console.log('\n--- retryRound: pressing R during the post-round transition gap ---');
  g.resetGame();
  placeRoundCorrectly();              // round 1 done; buildRound(2) is scheduled 900ms out
  g.retryRound();                     // R pressed inside that gap -> rebuilds round 2 immediately
  eq(g.game.roundResults.length, 1, 'an in-gap retry does not delete round 1\'s result either');
  const gapCard = g.cards[0];
  g.snapToSlot(gapCard, gapCard.correct);
  ok('a card placed right after an in-gap retry registers', gapCard.placed === true);
  await sleep(1000);                  // the stale timer would fire here if it were not cancelled
  ok('the stale round-transition timer does not rebuild the round and wipe the placement',
    g.cards.filter(c => c.placed).length === 1);
  eq(g.game.state, 'playing', 'still playable after an in-gap retry');

  /* ---- the retried round can still be completed and scored (retry is not a dead end) ---- */
  console.log('\n--- retryRound: the retried round remains completable ---');
  const scorePreFinish = g.game.score;
  for (const c of g.cards) if (!c.placed) g.snapToSlot(c, c.correct);
  eq(g.game.round, 3, 'completing the retried round 2 advances to round 3');
  ok('the retried round awarded score', g.game.score > scorePreFinish);
  eq(g.game.roundResults.length, 2, 'the retried round records its own result once completed');
  eq(g.game.roundResults[1] && g.game.roundResults[1].round, 2, 'and that result is filed under round 2');

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
