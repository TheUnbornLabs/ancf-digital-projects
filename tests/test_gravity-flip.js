// jsdom Tier-2 playthrough suite for Gravity Flip (#28)
// Drives the real loop through window.__cfq plus real DOM input events
// (the hook has no generic "click" method, so screen transitions are
// exercised via canvas mousedown dispatch, exactly like a real player).
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'gravity-flip', 'index.html');
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
    w.AudioContext = undefined;
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;
const canvas = win.document.getElementById('game');

// Real player input: dispatch an actual mousedown on the canvas, exactly
// the event the game itself listens for (canvas.addEventListener('mousedown', ...)).
function click() {
  canvas.dispatchEvent(new win.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
}

console.log('\n--- smoke ---');
ok('window.__cfq test hook is exposed', !!g);
if (!g) { report(); process.exit(1); }
ok('hook exposes the core API', ['resetGame', 'buildLevel', 'flip', 'update', 'draw', 'togglePause', 'toggleMute', 'goTitle']
  .every(k => typeof g[k] === 'function'));
ok('hook exposes live game state', !!g.game);
ok('canvas element is present', !!canvas);
ok('no uncaught page errors on load', pageErrors.length === 0);
eq(g.game.state, 'title', 'game boots on the title screen');

console.log('\n--- smoke: draw survives every state ---');
let drewOk = true;
for (const st of ['title', 'playing', 'won', 'gameover', 'allclear', 'paused']) {
  try { g.game.state = st; g.draw(); } catch (e) { drewOk = false; console.log('    draw threw in ' + st + ': ' + e.message); }
}
ok('draw() runs in every state without throwing', drewOk);
g.resetGame();

// Helper: the hook has no portal getter, but the portal's position is a
// fixed formula in the source (portal.x = levelLen-60, levelLen = 1800+lv*200,
// portal.y = H/2-40 = 230, h=80). We teleport the live player object into
// that box and let the real update()/rectOverlap()/portal code do the rest
// -- the state transition it produces is the actual proof, not the formula.
// The strip immediately before portal.x is guaranteed obstacle-free (spikes
// stop by levelLen-400+56, blocks stop by levelLen-500+140; portal starts at
// levelLen-60), so this reproduces "the player reached the exit" without
// needing to dodge anything -- appropriate since we're testing progression,
// not dodging skill.
function levelLenFor(lv) { return 1800 + lv * 200; }
function portalXFor(lv) { return levelLenFor(lv) - 60; }
function warp() {
  const lv = g.game.level;
  g.player.x = portalXFor(lv) + 5;   // well inside portal box horizontally
  g.player.y = 230 + 10;             // well inside portal box vertically (230..310)
}

console.log('\n--- core loop: title -> playing ---');
g.resetGame();
eq(g.game.state, 'playing', 'resetGame() starts play');
eq(g.game.level, 1, 'resetGame() starts at level 1');
eq(g.player.x, 80, 'player starts at the spawn x');
ok('hook exposes live player/obstacles state once a level exists', !!g.player && Array.isArray(g.obstacles) && g.obstacles.length > 0);

// Real death trigger: center the live player exactly on a real obstacle from
// the current level's own obstacle array and run one update tick -- the
// actual rectOverlap()/die() code in update() does the rest. (An earlier
// version of this harness tried to force player.y out of [-40, H+40], but
// the floor/ceil clamp in update() re-clamps y into range on every tick
// BEFORE the out-of-bounds check runs, so that path is not reachable through
// normal physics -- obstacle collision is the real, reachable death.)
function killPlayerOnObstacle() {
  const o = g.obstacles[0];
  g.player.x = o.x + o.w / 2 - PLAYER_W_HALF;
  g.player.y = o.y + o.h / 2 - PLAYER_H_HALF;
}
const PLAYER_W_HALF = 11, PLAYER_H_HALF = 11; // PLAYER_W=22, PLAYER_H=22 (fixed constants in source)

console.log('\n--- core loop: reaching the portal ADVANCES the game (catches soft-locks) ---');
const obstaclesBefore = g.obstacles;
warp();
g.update(16);
eq(g.game.state, 'won', 'reaching the portal transitions to the won screen');
eq(g.game.level, 1, 'level number itself only bumps on the next click, not on arrival');

click(); // real player input: advance to next level from the won screen
eq(g.game.state, 'playing', 'clicking through "won" resumes play');
eq(g.game.level, 2, 'clicking through "won" advances to the next level');
eq(g.player.x, 80, 'the new level respawns the player at the start');
ok('the new level gets a fresh obstacle set', g.obstacles !== obstaclesBefore);

console.log('\n--- core loop: do it three times running -> still advancing, still accepting input ---');
for (let i = 0; i < 3; i++) {
  const lvBefore = g.game.level;
  ok('flip() is accepted while playing (level ' + lvBefore + ')', (() => {
    const dirBefore = g.gravDir;
    g.flip();
    return g.gravDir === -dirBefore;
  })());
  warp();
  g.update(16);
  eq(g.game.state, 'won', 'level ' + lvBefore + ' clears again via the portal');
  click();
  eq(g.game.state, 'playing', 'advances past level ' + lvBefore + ' won screen');
  eq(g.game.level, lvBefore + 1, 'level counter incremented to ' + (lvBefore + 1));
}

console.log('\n--- fail condition: does 3 deaths on one level ever reach "gameover"? ---');
// Trigger real deaths the way a player actually dies: colliding with a real
// obstacle from the level's own array -> update()'s rectOverlap() calls the
// real die() (index.html:81).
g.resetGame();
eq(g.game.state, 'playing', 'clean slate for the fail-condition probe');
const levelPinned = g.game.level;
let sawGameOver = false;
let deathsObserved = 0;
for (let i = 0; i < 6 && !sawGameOver; i++) {
  killPlayerOnObstacle();
  g.update(16);
  if (g.game.deaths > deathsObserved) deathsObserved = g.game.deaths;
  if (g.game.state === 'gameover') sawGameOver = true;
  else {
    // must still be playing the SAME level, freshly rebuilt, to keep dying
    eq(g.game.state, 'playing', 'death #' + (i + 1) + ' returns the player to play (not stuck)');
    eq(g.game.level, levelPinned, 'death #' + (i + 1) + ' keeps the player on the same level to retry');
  }
}
// The loop stops the instant gameover fires, so the total-death counter must
// read exactly MAX_DEATHS_PER_LEVEL here -- deaths 4..6 are never dealt.
eq(deathsObserved, 3, 'every real obstacle-collision death up to the gameover was registered (total counter)');
ok('gameover was reached within 6 deaths on one level (MAX_DEATHS_PER_LEVEL=3)', sawGameOver);

console.log('\n--- the per-level tally survives the retry rebuild ---');
g.resetGame();
killPlayerOnObstacle(); g.update(16); // death #1 on level 1 (real collision death)
const levelDeathsAfterFirstDeath = g.game.levelDeaths;
eq(levelDeathsAfterFirstDeath, 1,
  'die() preserves game.levelDeaths across the buildLevel() retry rebuild, ' +
  'so the tally accumulates and can reach MAX_DEATHS_PER_LEVEL=3');

console.log('\n--- "clean streak" only credits a level the player did not die on ---');
g.resetGame();
const streak0 = g.game.cleanStreak;
killPlayerOnObstacle(); g.update(16); // die once on level 1 (real collision death, not forced)
eq(g.game.deaths, 1, 'one real death was registered');
eq(g.game.levelDeaths, 1, 'levelDeaths survives the retry rebuild');
warp();
g.update(16); // clear the level right after dying on it
eq(g.game.state, 'won', 'the level clears on the very next attempt');
eq(g.game.levelDeaths, 1, 'levelDeaths still reads 1 when the win is scored');
ok('cleanStreak does NOT increment on a level the player died on',
  g.game.cleanStreak === 0);
// ...and a genuinely clean level still does credit the streak.
click(); // on to the next level, no deaths this time
warp();
g.update(16);
eq(g.game.state, 'won', 'the next level clears cleanly');
eq(g.game.levelDeaths, 0, 'a fresh level starts the tally at 0');
ok('cleanStreak increments on a clean level', g.game.cleanStreak === streak0 + 1);

console.log('\n--- restart from an ending is playable again ---');
// gameover is now reachable through real play, so drive it for real: clear
// level 1, then die MAX_DEATHS_PER_LEVEL times on level 2, then restart.
g.resetGame();
warp(); g.update(16); click();          // clear level 1 -> now on level 2
eq(g.game.level, 2, 'on level 2 before the fatal run');
for (let i = 0; i < 3; i++) { killPlayerOnObstacle(); g.update(16); }
eq(g.game.state, 'gameover', 'three real deaths on level 2 reach the gameover screen');
eq(g.game.levelDeaths, 3, 'the tally reads MAX_DEATHS_PER_LEVEL at gameover');
click();
eq(g.game.state, 'playing', 'clicking through "gameover" restarts play');
eq(g.game.level, 1, 'restart returns to level 1');
eq(g.game.deaths, 0, 'restart clears the death counter');
eq(g.game.levelDeaths, 0, 'restart clears the per-level tally (no instant re-gameover)');
// a stale tally would end the new run on its very first death
killPlayerOnObstacle(); g.update(16);
eq(g.game.state, 'playing', 'the first death of the new run does NOT instantly game over');

console.log('\n--- all-clear path (level 20) and restart from it ---');
g.resetGame();
// Every real call site sets game.level immediately before calling buildLevel(lv)
// with that same value (resetGame(): level=1 then buildLevel(1); pointerDown's
// won-handler: level++ then buildLevel(level)). buildLevel() itself never
// touches game.level, so the harness must preserve that invariant too --
// this is a legitimate fast-forward to level 20 instead of grinding 19 levels,
// not a forced/inconsistent state.
g.game.level = 20;
g.buildLevel(20);
eq(g.game.level, 20, 'fast-forwarded to level 20 via the real buildLevel()');
warp();
g.update(16);
eq(g.game.state, 'allclear', 'clearing level 20 reaches the true final screen');
click();
eq(g.game.state, 'playing', 'clicking through "allclear" restarts play');
eq(g.game.level, 1, 'restart from allclear returns to level 1');

console.log('\n--- pause does not eat input or freeze the game ---');
g.resetGame();
g.togglePause();
eq(g.game.state, 'paused', 'togglePause() pauses from playing');
const yBefore = g.player.y;
g.update(16);
eq(g.player.y, yBefore, 'no physics runs while paused');
g.togglePause();
eq(g.game.state, 'playing', 'togglePause() resumes play');
ok('flip() is accepted again after resuming from pause', (() => {
  const d = g.gravDir; g.flip(); return g.gravDir === -d;
})());

console.log('\n--- no power-up/skip/hint mechanic in this game (N/A) ---');
ok('N/A: gravity-flip has no skip/hint/bonus-mode input to probe', true);

report();
process.exit(fail === 0 ? 0 : 1);

function report() {
  console.log('\n==== TEST RESULTS ====');
  console.log('PASSED: ' + pass);
  console.log('FAILED: ' + fail);
  if (fails.length) { console.log('\nFailures:'); fails.forEach(f => console.log('  x ' + f)); }
  console.log(fail === 0 ? '\nALL TESTS GREEN' : '\nSOME TESTS FAILED');
}
