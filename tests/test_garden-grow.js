// jsdom Tier 2 playthrough suite for Garden Grow (#40)
// Core loop: click a plot to water it (fills waterT over 2 clicks); update() advances
// stage 0->1->2->3(bloomed) each time waterT hits WATER_MS. Weeds spawn on non-bloomed,
// weed-free plots; clicking a weed removes it (score+combo); leaving a weed too long
// knocks the flower back a stage and penalizes score. Win = all 12 plots bloomed.
// This suite drives that real loop and asserts progression, not just setup.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'garden-grow', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; fails.push(name); console.log('FAIL  ' + name); } }
function eq(a, b, name) { ok(name + ` (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`, a === b); }

// ---- canvas 2D context stub (jsdom returns null without the native `canvas` package) ----
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

// Water plot i with a single "tick": two clicks fill waterT to WATER_MS (2000 each),
// then one update() call is what actually applies the stage++ (mirrors real play:
// click, click, then time passes). Returns the plot's stage after the tick.
function waterTick(i) {
  g.clickPlot(i);
  g.clickPlot(i);
  g.update(16);
  return g.plots[i].stage;
}

// Grow plot i to full bloom. If a weed is occupying it, clear the weed first (a real
// player would do exactly this before they can keep watering). Bounded loop so a real
// soft-lock fails loudly instead of hanging the suite.
function growPlot(i) {
  for (let guard = 0; guard < 40 && !g.plots[i].bloomed; guard++) {
    if (g.plots[i].weed) { g.clickPlot(i); g.update(16); continue; }
    waterTick(i);
  }
  return g.plots[i].bloomed;
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'clickPlot', 'update', 'draw', 'plotAt', 'togglePause', 'toggleMute']
    .every(k => typeof g[k] === 'function'));
  ok('hook exposes live game state', !!g.game && Array.isArray(g.FLOWERS) && Array.isArray(g.WEEDS));
  const canvasEl = win.document.getElementById('game');
  ok('canvas element is present', !!canvasEl);
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.FLOWERS.length, 12, 'flower list has 12 entries (matches 4x3 grid)');

  g.resetGame();
  eq(g.plots.length, g.GCOLS * g.GROWS2, 'plots array matches grid size');

  let drewOk = true;
  for (const st of ['title', 'playing', 'paused', 'won']) {
    try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
  }
  g.resetGame();
  ok('draw() runs in every state without throwing', drewOk);

  /* ======================= CORE LOOP ======================= */
  console.log('\n--- logic: core action advances the game ---');
  g.resetGame();
  eq(g.game.state, 'playing', 'resetGame starts a playable round');
  eq(g.game.round, 1, 'resetGame starts at round 1');
  ok('no plot starts bloomed', g.plots.every(p => !p.bloomed));

  const p0stage0 = g.plots[0].stage;
  const s1 = waterTick(0);
  ok('watering a plot advances its stage (the check that catches soft-locks)', s1 === p0stage0 + 1);
  const s2 = waterTick(0);
  eq(s2, 2, 'a second watering tick advances the stage again');
  const scoreBeforeBloom = g.game.score;
  const s3 = waterTick(0);
  eq(s3, 3, 'a third watering tick brings the plot to stage 3');
  ok('stage 3 marks the plot bloomed', g.plots[0].bloomed === true);
  eq(g.game.score, scoreBeforeBloom + 30, 'blooming a flower awards its +30');

  console.log('\n--- logic: do it three times running, still advancing ---');
  const bloomedBefore = g.plots.filter(p => p.bloomed).length;
  ok('three more plots each bloom in turn, input stays accepted', [1, 2, 3].every(i => growPlot(i)));
  const bloomedAfter = g.plots.filter(p => p.bloomed).length;
  eq(bloomedAfter, bloomedBefore + 3, 'bloomed count rose by exactly 3');
  ok('still accepting input after 4 consecutive plots (state is playing)', g.game.state === 'playing');

  /* ======================= EXHAUST FAIL CONDITION -> ENDING ======================= */
  console.log('\n--- logic: exhausting the garden reaches a real ending ---');
  for (let i = 4; i < g.plots.length; i++) growPlot(i);
  eq(g.plots.filter(p => p.bloomed).length, 12, 'all 12 plots reached full bloom');
  eq(g.game.state, 'won', 'blooming every plot transitions the game to won');
  const scoreAtWin = g.game.score;
  ok('best score is captured on win', g.game.best === scoreAtWin);
  eq(win.localStorage.getItem('gardenGrow.best'), String(scoreAtWin), 'the best score is persisted to localStorage');

  /* ======================= RESTART FROM ENDING ======================= */
  console.log('\n--- logic: restart from the won screen (via the real click handler) ---');
  // The game's own restart-from-won path is startNextRound(), invoked from the
  // pointerDown handler bound to the canvas -- it is not exposed on the hook, so we
  // drive it the way a player actually would: a real click on the canvas.
  const ev = new win.MouseEvent('mousedown', { clientX: 480, clientY: 270, bubbles: true });
  canvasEl.dispatchEvent(ev);

  eq(g.game.state, 'playing', 'clicking the won screen returns to playing');
  eq(g.game.round, 2, 'clicking the won screen starts round 2 (the real restart handler)');
  eq(g.game.score, scoreAtWin, 'score carries over into the next round (this is not a fresh reset)');
  ok('every plot is fresh again for the new round', g.plots.every(p => !p.bloomed && p.stage === 0));

  console.log('\n--- logic: playable again after restart (no soft-lock introduced) ---');
  const roundTwoStage = waterTick(0);
  eq(roundTwoStage, 1, 'watering advances a plot again in round 2');

  /* ======================= WEED HAZARD PATH ======================= */
  console.log('\n--- logic: clicking a weed removes it and the plot stays playable ---');
  g.resetGame();
  const comboBefore = g.game.combo;
  const scoreBeforeWeed = g.game.score;
  // Force the exact combination of fields the game itself sets together on natural
  // spawn (weed, weedKind, weedT=0) on an untouched plot -- not a state no player reaches.
  g.plots[0].weed = 'rush'; g.plots[0].weedKind = 'normal'; g.plots[0].weedT = 0;
  g.clickPlot(0);
  ok('clicking a weeded plot removes the weed', g.plots[0].weed === null);
  ok('removing a weed raises the combo', g.game.combo === comboBefore + 1);
  ok('removing a weed awards points', g.game.score > scoreBeforeWeed);
  const afterWeedStage = waterTick(0);
  eq(afterWeedStage, 1, 'the plot is waterable again immediately after its weed is cleared');

  console.log('\n--- logic: an unremoved weed knocks the flower back, does not freeze it ---');
  g.resetGame();
  waterTick(1); // plot 1 is now at stage 1
  eq(g.plots[1].stage, 1, 'setup: plot 1 pre-grown to stage 1');
  g.game.score = 100; // give the penalty something to actually subtract from (0 is clamped, not a bug, but tells us nothing)
  g.plots[1].weed = 'noise'; g.plots[1].weedKind = 'normal'; g.plots[1].weedT = 0;
  const killMs = (() => { // read the same schedule the game itself uses at this bloom/round count
    const bloomed = g.plots.filter(p => p.bloomed).length;
    return Math.max(2600, 5000 - bloomed * 150 - (g.game.round - 1) * 500);
  })();
  g.plots[1].weedT = killMs + 50; // simulate the player failing to click it in time
  const scoreBeforeKill = g.game.score;
  g.update(16);
  ok('an expired weed clears itself', g.plots[1].weed === null);
  eq(g.plots[1].stage, 0, 'an expired weed knocks the flower back one stage');
  ok('an expired weed penalizes score', g.game.score < scoreBeforeKill);
  eq(g.game.combo, 0, 'an expired weed resets the combo');
  const afterKillStage = waterTick(1);
  eq(afterKillStage, 1, 'the punished plot is still waterable afterward (no soft-lock from the penalty path)');

  console.log('\n--- logic: the "fast" weed variant dies on its own shorter clock ---');
  g.resetGame();
  g.plots[2].weed = 'nag'; g.plots[2].weedKind = 'fast'; g.plots[2].weedT = 0;
  const fastKillMs = 2500; // WEED_KILL_MS_BASE(5000) * 0.5 at round 1 / 0 bloomed
  g.plots[2].weedT = fastKillMs + 10;
  g.update(16);
  ok('a fast weed expires at half the normal kill time', g.plots[2].weed === null);
  const fastAfterStage = waterTick(2);
  eq(fastAfterStage, 1, 'the plot recovers a fast weed and is waterable afterward');

  console.log('\n--- logic: the "spreading" weed variant jumps plots without crashing or freezing either one ---');
  g.resetGame();
  // Plot 0 gets a spreading weed; its two in-bounds neighbors (right=1, down=4) are
  // both left empty as legitimate jump targets, exactly as the game's own spread
  // logic requires. Which one it picks is decided by the game's own seeded rng, so
  // this test accepts either -- it is not the thing under test.
  g.plots[0].weed = 'compare'; g.plots[0].weedKind = 'spreading'; g.plots[0].weedT = 0; g.plots[0]._spread = false;
  const spreadKillMs = 5000;
  g.plots[0].weedT = Math.floor(spreadKillMs * 0.5) + 10; // past the spread trigger, short of the kill
  let spreadThrew = false;
  try { g.update(16); } catch (e) { spreadThrew = true; console.log('    update threw on spread: ' + e.message); }
  ok('the spread tick does not throw', !spreadThrew);
  const spreadTarget = [1, 4].find(j => g.plots[j].weed === 'compare');
  ok('the weed jumped to one of the two valid empty neighbors', spreadTarget !== undefined);
  ok('the jumped-to copy is a plain (non-spreading) weed', spreadTarget !== undefined && g.plots[spreadTarget].weedKind === 'normal');
  ok('the original plot still carries its own weed', g.plots[0].weed === 'compare');
  // Both plots must remain recoverable -- clear each and confirm each waters normally.
  g.clickPlot(0); g.clickPlot(spreadTarget);
  ok('both the source and the spread-to plot are clearable', g.plots[0].weed === null && g.plots[spreadTarget].weed === null);
  const srcStage = waterTick(0), dstStage = waterTick(spreadTarget);
  eq(srcStage, 1, 'the source plot is waterable after its weed clears');
  eq(dstStage, 1, 'the spread-to plot is waterable after its weed clears');

  /* ======================= PAUSE ======================= */
  console.log('\n--- logic: pause halts growth without breaking resume ---');
  g.resetGame();
  g.clickPlot(3); g.clickPlot(3); // fill waterT on plot 3 without letting it flip stage yet
  const waterTPaused = g.plots[3].waterT;
  g.togglePause();
  eq(g.game.state, 'paused', 'togglePause enters the paused state');
  for (let i = 0; i < 5; i++) g.update(16);
  eq(g.plots[3].waterT, waterTPaused, 'plot growth does not progress while paused');
  eq(g.plots[3].stage, 0, 'a fully-watered plot does not flip stage while paused');
  g.togglePause();
  eq(g.game.state, 'playing', 'togglePause resumes play');
  g.update(16);
  eq(g.plots[3].stage, 1, 'growth resumes immediately after unpausing');

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
