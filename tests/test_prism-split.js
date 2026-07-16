// jsdom Tier 2 playthrough suite for Prism Split (#87)
// Tier 1 (generic invariants: load errors, NaN, draw crashes) already passes clean for this
// game, so this suite does NOT re-check those. It drives the REAL puzzle loop through
// window.__cfq and asks: can a competent player actually get from puzzle 1 to the end?
//
// Core mechanic: click a mirror -> rotateMirror(i,dir) adds +/-(PI/8) to its angle and calls
// checkSolve(). Each mirror is only reachable, by a real player, at one of 16 discrete angles
// (fixed step size, periodic every 16 clicks). So "is this puzzle solvable" is not just a
// geometry question -- it's "does one of those 16^n discrete combinations land a beam within
// the ~30px target tolerance". We brute-force that per round as an oracle (direct angle
// mutation, not claimed to be player input), then REPLAY the discovered solution using the
// real rotateMirror() clicks and assert the game actually advances.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'prism-split', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
    w.requestAnimationFrame = () => 0;   // disable the game's own rAF loop; we drive it manually
    w.cancelAnimationFrame = () => {};
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;

// ---- brute-force oracle: for a given round, find (if it exists) a set of per-mirror
// click-counts (0-15, each step = PI/8) that hits every target. Uses direct angle
// mutation + checkSolve() as a solver, NOT as a claim of player input.
function solveRound(round) {
  g.buildPuzzle(round);
  const initAngles = g.mirrors.map(m => m.angle);
  const colorGroups = {};
  g.mirrors.forEach((m, i) => { (colorGroups[m.col] = colorGroups[m.col] || []).push(i); });

  const perColorKs = {}; // col -> [k,...] click-counts for that color's mirror indices
  let fullySolvable = true;

  for (const t of g.targets) {
    const idxs = colorGroups[t.col] || [];
    const n = idxs.length;
    const total = Math.pow(16, n);
    let foundKs = null;
    for (let code = 0; code < total && !foundKs; code++) {
      if (g.solved) g.buildPuzzle(round);   // reset stale solved flag from a lucky earlier combo
      let c = code; const ks = [];
      for (let d = 0; d < n; d++) { ks.push(c % 16); c = Math.floor(c / 16); }
      idxs.forEach((idx, d) => { g.mirrors[idx].angle = initAngles[idx] + ks[d] * Math.PI / 8; });
      g.checkSolve();
      const tgt = g.targets.find(x => x.col === t.col);
      if (tgt && tgt.hit) foundKs = ks;
    }
    if (!foundKs) { fullySolvable = false; perColorKs[t.col] = null; }
    else perColorKs[t.col] = { idxs, ks: foundKs };
  }

  // combined verification: fresh puzzle, apply every color's discovered combo at once
  let combinedSolves = false;
  if (fullySolvable) {
    g.buildPuzzle(round);
    for (const t of g.targets) {
      const sol = perColorKs[t.col];
      sol.idxs.forEach((idx, d) => { g.mirrors[idx].angle = initAngles[idx] + sol.ks[d] * Math.PI / 8; });
    }
    g.checkSolve();
    combinedSolves = g.solved === true && g.targets.every(x => x.hit);
  }
  return { fullySolvable, combinedSolves, perColorKs, colorGroups };
}

(async () => {

  console.log('\n--- smoke (minimal; Tier 1 already covers load/NaN/draw) ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the playthrough API', ['resetGame', 'buildPuzzle', 'rotateMirror', 'undoLast',
    'checkSolve', 'mirrorAt', 'update', 'draw', 'setMirrorAngle'].every(k => typeof g[k] === 'function'));
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.TOTAL, 8, 'the collection has 8 puzzles');

  /* ================= discovery: is every puzzle solvable by discrete clicks? ================= */
  console.log('\n--- discovery: brute-forcing each round\'s discrete-angle solution space ---');
  const solutions = [];
  for (let r = 0; r < g.TOTAL; r++) {
    const res = solveRound(r);
    solutions.push(res);
    ok(`round ${r}: every colour has a reachable (16-step) mirror angle that hits its target`, res.fullySolvable);
    ok(`round ${r}: the per-colour solutions combine into one fully-solved puzzle`, res.combinedSolves);
  }
  const anyUnsolvable = solutions.some(s => !s.fullySolvable || !s.combinedSolves);

  if (anyUnsolvable) {
    // A puzzle a player structurally cannot complete via the real control scheme (discrete
    // PI/8 steps). Report it and stop the playthrough here rather than fabricating further state.
    report();
    process.exit(fail === 0 ? 0 : 1);
  }

  /* ================= real playthrough: replay discovered solutions via rotateMirror() ================= */
  console.log('\n--- core loop: solving via real rotateMirror() clicks advances the game ---');
  g.resetGame();
  eq(g.game.round, 0, 'resetGame starts at round 0');
  eq(g.game.state, 'playing', 'resetGame leaves the game in the playing state');

  for (let r = 0; r < g.TOTAL; r++) {
    eq(g.game.round, r, `round counter reads ${r} before solving it`);
    const sol = solutions[r].perColorKs;
    // replay every colour's discovered click-count on the CURRENT live mirrors (indices are
    // stable per round -- buildPuzzle constructs the same layout for the same round every time).
    for (const col in sol) {
      const { idxs, ks } = sol[col];
      idxs.forEach((idx, d) => { for (let c = 0; c < ks[d]; c++) g.rotateMirror(idx, 1); });
    }
    ok(`round ${r}: all real clicks land the puzzle solved`, g.solved === true);
    const scoreBefore = g.game.score;
    ok(`round ${r}: solving awards score`, g.game.score >= 1);

    await sleep(750); // checkSolve's own setTimeout(700) must have fired by now

    if (r < g.TOTAL - 1) {
      eq(g.game.round, r + 1, `round ${r}: solving advances the round counter`);
      eq(g.game.state, 'playing', `round ${r}: still playing after advancing`);
      eq(g.solved, false, `round ${r}: the new puzzle is unsolved`);
      ok(`round ${r}: input is accepted on the new puzzle (not soft-locked)`,
        (() => { const before = g.mirrors[0] ? g.mirrors[0].angle : null; g.rotateMirror(0, 1);
                  const after = g.mirrors[0].angle; g.rotateMirror(0, -1); return before !== null && after !== before; })());
    } else {
      eq(g.game.round, r + 1, 'the final puzzle still increments the round counter internally');
      eq(g.game.state, 'won', 'clearing all 8 puzzles reaches the real ending (state=won)');
    }
  }

  console.log('\n--- restart from the ending ---');
  ok('the game is at the won screen', g.game.state === 'won');
  g.resetGame(); // the real restart handler: onDown() calls resetGame() when state is 'title'/'won'
  eq(g.game.round, 0, 'restart from won returns to round 0');
  eq(g.game.score, 0, 'restart from won resets score');
  eq(g.game.state, 'playing', 'restart from won is playable again');
  ok('best score survived the restart (not corrupted, not re-zeroed)', g.game.best >= 1);

  // prove "playable again" means something: solve round 0 again from this fresh state
  {
    const sol0 = solveRound(0); // re-derive against the just-reset (deterministic) layout
    for (const col in sol0.perColorKs) {
      const { idxs, ks } = sol0.perColorKs[col];
      idxs.forEach((idx, d) => { for (let c = 0; c < ks[d]; c++) g.rotateMirror(idx, 1); });
    }
    ok('after restart, round 0 can be solved again via real clicks', g.solved === true);
    await sleep(750);
    eq(g.game.round, 1, 'after restart, solving round 0 again advances to round 1');
  }

  /* ================= undo path: must not consume-and-freeze ================= */
  console.log('\n--- undo (the game\'s power-tool: rotate back) ---');
  g.resetGame();
  const m0AngleBefore = g.mirrors[0].angle;
  g.rotateMirror(0, 1);
  const m0AngleAfterClick = g.mirrors[0].angle;
  ok('a click actually rotates the mirror', m0AngleAfterClick !== m0AngleBefore);
  g.undoLast();
  eq(g.mirrors[0].angle, m0AngleBefore, 'undo reverts the last rotation exactly');
  // input must still be accepted after an undo -- solve the round for real to prove it
  {
    const solU = solveRound(0);
    g.resetGame();
    for (const col in solU.perColorKs) {
      const { idxs, ks } = solU.perColorKs[col];
      idxs.forEach((idx, d) => { for (let c = 0; c < ks[d]; c++) g.rotateMirror(idx, 1); });
    }
    g.rotateMirror(0, 1);       // overshoot by one click
    g.undoLast();               // undo the overshoot
    ok('undo does not block subsequent solving', g.solved === true);
  }

  // undo is refused once solved (celebration-lock), and that lock releases on its own
  g.resetGame();
  const solU2 = solveRound(0);
  g.resetGame();
  for (const col in solU2.perColorKs) {
    const { idxs, ks } = solU2.perColorKs[col];
    idxs.forEach((idx, d) => { for (let c = 0; c < ks[d]; c++) g.rotateMirror(idx, 1); });
  }
  ok('solved flag is set right after the winning click', g.solved === true);
  const angleAtSolve = g.mirrors[0].angle;
  g.undoLast(); // guarded: "if(solved||!history.length)return;"
  eq(g.mirrors[0].angle, angleAtSolve, 'undo is refused while the solve celebration is playing');
  await sleep(750);
  eq(g.game.round, 1, 'the celebration lock releases on its own and the round still advances');

  /* ================= hint button: must not consume a resource that then freezes input ================= */
  console.log('\n--- hint (visual-only assist) ---');
  g.resetGame();
  const hintBtn = win.document.getElementById('hintbtn');
  ok('hint button exists', !!hintBtn);
  const stateBeforeHint = g.game.state;
  hintBtn.dispatchEvent(new win.Event('click'));
  hintBtn.dispatchEvent(new win.Event('click'));
  hintBtn.dispatchEvent(new win.Event('click'));
  eq(g.game.state, stateBeforeHint, 'clicking hint repeatedly does not change game state');
  {
    const solH = solveRound(0);
    g.resetGame();
    hintBtn.dispatchEvent(new win.Event('click')); // use the hint mid-puzzle
    for (const col in solH.perColorKs) {
      const { idxs, ks } = solH.perColorKs[col];
      idxs.forEach((idx, d) => { for (let c = 0; c < ks[d]; c++) g.rotateMirror(idx, 1); });
    }
    ok('the puzzle can still be solved for real after using the hint', g.solved === true);
  }

  /* ================= pause: must not be a permanent freeze ================= */
  console.log('\n--- pause / unpause ---');
  g.resetGame();
  const pauseBtn = win.document.getElementById('pausebtn');
  pauseBtn.dispatchEvent(new win.Event('click'));
  eq(g.game.paused, true, 'pause button pauses the game');
  pauseBtn.dispatchEvent(new win.Event('click'));
  eq(g.game.paused, false, 'pause button unpauses the game');
  {
    const solP = solveRound(0);
    g.resetGame();
    for (const col in solP.perColorKs) {
      const { idxs, ks } = solP.perColorKs[col];
      idxs.forEach((idx, d) => { for (let c = 0; c < ks[d]; c++) g.rotateMirror(idx, 1); });
    }
    ok('the game is still fully playable after a pause/unpause cycle', g.solved === true);
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
