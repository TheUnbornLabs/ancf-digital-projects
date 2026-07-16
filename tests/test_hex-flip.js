// jsdom Tier 2 playthrough suite for Hex Flip (#72)
// Tier 1 (structural) already passes clean. This suite drives the REAL loop through
// window.__cfq and asserts progression: can a competent player get from level 1 to the
// win screen, level after level, using the hint/undo features along the way, and restart
// afterward? Per-step "state starts at X" assertions are not the point here.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'hex-flip', 'index.html');
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
    w.requestAnimationFrame = () => 0;  // disable auto-loop; we drive update()/draw() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;         // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// grid is exposed live (getter re-reads the module-level `grid` var each call), so no
// staleness risk even though buildLevel() reassigns it wholesale.
function mismatchCount() {
  const grid = g.grid;
  const first = grid[0][0].on;
  let n = 0;
  for (const col of grid) for (const cell of col) if (cell.on !== first) n++;
  return n;
}

// A competent player's solving strategy: replay the level's own recorded scramble
// sequence (each click is self-inverse/commutative for ordinary hexes, so replaying it
// undoes the scramble). If a locked hex is present and the literal replay leaves it out
// of sync (see the "hint" findings below — this happens whenever the locked hex was hit
// an odd number of times while scrambling), two more direct clicks on the locked hex
// fix it without disturbing anything else (its neighbours see two clicks = net zero).
function solveLevel() {
  const sol = g.game.solution.slice();
  for (const [c, r] of sol) g.doFlip(c, r);
  if (g.game.locked && g.game.state === 'playing' && mismatchCount() !== 0) {
    const { c: lc, r: lr } = g.game.locked;
    g.doFlip(lc, lr);
    g.doFlip(lc, lr);
  }
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke (minimal — Tier 1 already covers structural checks) ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildLevel', 'doFlip', 'checkWin', 'hexAt',
    'hexNeighbors', 'update', 'draw', 'undo', 'hint', 'goToMenu']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state and grid', !!g.game && Array.isArray(g.grid));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.TOTAL, 10, 'the collection reports 10 levels');

  /* ======================= CORE LOOP: does completing a puzzle advance? ======================= */
  console.log('\n--- core loop: solving a level advances the game ---');
  g.resetGame();
  eq(g.game.level, 0, 'a fresh game starts on level 1 (index 0)');
  eq(g.game.state, 'playing', 'a fresh game is playing');
  const mmStart = mismatchCount();
  ok('the freshly scrambled level 1 is not already solved', mmStart > 0);

  solveLevel();
  eq(mismatchCount(), 0, 'the solving strategy actually clears the board');
  eq(g.game.state, 'transition', 'winning a level freezes input in a transition state');

  // input during the transition must be refused, not merely ignored-and-corrupting
  const gridBefore = JSON.stringify(g.grid);
  g.doFlip(0, 0);
  eq(JSON.stringify(g.grid), gridBefore, 'clicks during the win transition do not mutate the board');

  await sleep(650); // the level's 600ms setTimeout must have fired by now
  eq(g.game.level, 1, 'the game actually advanced to level 2 (index 1)');
  eq(g.game.state, 'playing', 'the new level is playable');
  ok('the new level has its own (unsolved) scramble', mismatchCount() > 0);

  /* ======================= do it three times running ======================= */
  console.log('\n--- core loop: three levels in a row, still advancing, still accepting input ---');
  for (let i = 0; i < 3; i++) {
    const lvlBefore = g.game.level;
    solveLevel();
    ok(`level ${lvlBefore + 1}: solving clears the board`, mismatchCount() === 0);
    await sleep(650);
    eq(g.game.level, lvlBefore + 1, `level ${lvlBefore + 1}: the game advanced to the next level`);
    eq(g.game.state, 'playing', `level ${lvlBefore + 1}: input is accepted again on the new level`);
    const flipProbe = JSON.stringify(g.grid);
    g.doFlip(0, 0);
    ok(`level ${lvlBefore + 1}: a real click after advancing actually changes the board (not soft-locked)`,
      JSON.stringify(g.grid) !== flipProbe);
    g.undo(); // put back what we just used to probe, so solveLevel() starts from the real scramble
  }

  /* ======================= exhaust the fail condition: reach a real ending ======================= */
  console.log('\n--- exhausting all levels reaches the real win screen ---');
  // we are on level index 4 now (0-3 done above); finish 4..9
  let guard = 0;
  while (g.game.state !== 'won' && guard++ < 20) {
    solveLevel();
    await sleep(650);
  }
  eq(g.game.state, 'won', 'clearing all 10 levels reaches the win screen');
  ok('the win screen reports the level count reached', g.game.level >= g.TOTAL);

  /* ======================= restart from the ending ======================= */
  console.log('\n--- restart from the win screen is playable again ---');
  // resetGame is the exact function bound to a click on the win/title screen (onDown:
  // "if(game.state==='title'||game.state==='won'){resetGame();return;}") — this is the
  // game's own restart handler, not a guessed entry point.
  g.resetGame();
  eq(g.game.state, 'playing', 'restarting from the win screen returns to play');
  eq(g.game.level, 0, 'restarting resets to level 1');
  eq(g.game.score, 0, 'restarting resets score');
  const mmRestart = mismatchCount();
  ok('the restarted level is a real unsolved scramble', mmRestart > 0);
  solveLevel();
  eq(mismatchCount(), 0, 'the game is genuinely playable after restart — solving still works');
  await sleep(650);
  eq(g.game.level, 1, 'and still advances after a restart');

  /* ======================= undo ======================= */
  console.log('\n--- undo: does not consume progress into a frozen state ---');
  g.resetGame();
  const gridPreFlip = JSON.stringify(g.grid);
  const movesPre = g.game.moves;
  g.doFlip(0, 0);
  ok('a flip changes the board', JSON.stringify(g.grid) !== gridPreFlip);
  g.undo();
  eq(JSON.stringify(g.grid), gridPreFlip, 'undo restores the exact previous board');
  eq(g.game.moves, movesPre, 'undo restores the move counter');
  // still fully playable after undo
  g.doFlip(0, 0);
  ok('the game accepts input again immediately after an undo', JSON.stringify(g.grid) !== gridPreFlip);
  g.undo();

  console.log('\n--- undo: refused gracefully when history is empty (does not throw or freeze) ---');
  g.resetGame();
  const gridEmpty = JSON.stringify(g.grid);
  let undoThrew = false;
  try { g.undo(); } catch (e) { undoThrew = true; }
  ok('calling undo with empty history does not throw', !undoThrew);
  eq(JSON.stringify(g.grid), gridEmpty, 'undo with empty history leaves the board untouched');
  g.doFlip(0, 0);
  ok('the game is still playable after a no-op undo', JSON.stringify(g.grid) !== gridEmpty);

  /* ======================= hint ======================= */
  console.log('\n--- hint: does it advance, or does it consume-and-freeze? ---');
  g.buildLevel(2); // a level with a multi-move solution and no locked hex, for a clean signal
  ok('this probe level needs more than one move', g.game.solution.length > 1);

  g.hint();
  ok('hint highlights a cell', !!g.game.hintCell);
  const hint1 = { c: g.game.hintCell.c, r: g.game.hintCell.r };

  // Follow the hint literally, the way a player relying on it would.
  const mmAfterHint0 = mismatchCount();
  g.doFlip(hint1.c, hint1.r);
  const mmAfterHint1 = mismatchCount();
  g.hint();
  const hint2 = { c: g.game.hintCell.c, r: g.game.hintCell.r };

  // The loop, not the step: a hint the player has already played must ADVANCE to the next
  // step. Re-suggesting the played cell invites the player to undo their own progress.
  ok('hint() advances to a new cell after the player clicks the one it suggested '
    + `(hint1=${JSON.stringify(hint1)}, hint2=${JSON.stringify(hint2)})`,
    hint1.c !== hint2.c || hint1.r !== hint2.r);

  // Following the hint chain must keep improving the board, never regress it.
  g.doFlip(hint2.c, hint2.r);
  const mmAfterHint2 = mismatchCount();
  ok('following the hint a second time keeps improving the board, rather than undoing the '
    + `first move (mismatch before hint=${mmAfterHint0}, after 1st follow=${mmAfterHint1}, `
    + `after 2nd follow=${mmAfterHint2})`,
    mmAfterHint2 < mmAfterHint1);

  // Following the hint chain to exhaustion must actually solve the level.
  let hguard = 0;
  while (g.game.state === 'playing' && hguard++ < 60) {
    g.hint();
    if (!g.game.hintCell) break;
    g.doFlip(g.game.hintCell.c, g.game.hintCell.r);
  }
  ok('following the hint chain to exhaustion solves the level (mismatch '
    + `${mismatchCount()}, state=${g.game.state})`, mismatchCount() === 0);

  // The queue must roll back with the board, or undo silently strands a required step.
  g.buildLevel(2);
  g.hint();
  const uh1 = { c: g.game.hintCell.c, r: g.game.hintCell.r };
  g.doFlip(uh1.c, uh1.r);
  g.undo();
  g.hint();
  const uh2 = { c: g.game.hintCell.c, r: g.game.hintCell.r };
  ok('undo rolls the hint back in step with the board, so the undone move is suggested '
    + `again rather than skipped (before=${JSON.stringify(uh1)}, after undo=${JSON.stringify(uh2)})`,
    uh1.c === uh2.c && uh1.r === uh2.r);

  // A stale highlight from the previous level must not point at the new board.
  g.hint();
  ok('hint highlights before the level change', !!g.game.hintCell);
  g.buildLevel(3);
  ok('buildLevel clears the previous level\'s hint highlight', !g.game.hintCell);

  /* ======================= locked-hex levels: is the recorded solution actually correct? ======================= */
  console.log('\n--- locked-hex levels (6-9): is the data hint() relies on actually valid? ---');
  // Locked hexes appear from level index 6 on. Deterministic per-level RNG means the same
  // locked cell and scramble happen on every playthrough, so this is not circumstantial.
  let anyLockedLevelSeen = false, anyMismatchAfterLiteralReplay = false;
  for (let lv = 6; lv <= 9; lv++) {
    g.buildLevel(lv);
    if (!g.game.locked) continue;
    anyLockedLevelSeen = true;
    for (const [c, r] of g.game.solution) g.doFlip(c, r);
    const mm = mismatchCount();
    if (mm !== 0) anyMismatchAfterLiteralReplay = true;
    console.log(`    level index ${lv}: locked=${JSON.stringify(g.game.locked)} `
      + `mismatch after literally replaying game.solution = ${mm} (state=${g.game.state})`);
    if (mm !== 0) {
      // confirm the game is NOT soft-locked here: it just needs the player to notice the
      // locked hex and click it twice more (the fix solveLevel() above already relies on).
      const { c: lc, r: lr } = g.game.locked;
      g.doFlip(lc, lr); g.doFlip(lc, lr);
      ok(`level index ${lv}: the puzzle is still completable with two extra direct clicks `
        + 'on the locked hex (not a soft-lock, just a broken solution/hint record)',
        mismatchCount() === 0);
    }
  }
  ok('the probe actually exercised at least one locked-hex level', anyLockedLevelSeen);
  ok('FINDING: game.solution (the array hint() reads from) does not actually solve the '
    + 'puzzle on at least one locked-hex level when replayed literally, exactly as the '
    + "code comment at buildLevel() claims it will (\"self-inverse: same sequence undoes "
    + 'the scramble" — false whenever a locked hex is hit an odd number of times while '
    + 'scrambling)', anyMismatchAfterLiteralReplay);

  /* ======================= transition freeze resolves in bounded time ======================= */
  console.log('\n--- the win-transition freeze is temporary, not a soft-lock ---');
  g.resetGame();
  solveLevel();
  eq(g.game.state, 'transition', 'winning enters the transition state');
  let ticks = 0;
  while (g.game.state === 'transition' && ticks++ < 200) { g.update(16); await sleep(5); }
  ok('the transition state resolves on its own within a bounded number of ticks', g.game.state !== 'transition');

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
