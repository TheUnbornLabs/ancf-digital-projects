// jsdom Tier-2 playthrough suite for Jigsaw Lite (#31)
// Drives the REAL onDown/onMove/onUp mouse listeners (not a guessed internal
// function) by dispatching real MouseEvents at the canvas, after stubbing
// canvas.getBoundingClientRect (jsdom has no layout engine, so the real
// element would report a 0x0 rect and every coordinate would come out
// Infinity/NaN). The hook's tryPlace/isDone/buildRound are only used for
// *inspection*, never as a substitute for the drag gesture, because the
// round-advance / win logic lives entirely inside the real onUp listener
// and is not exposed on window.__cfq.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'jigsaw-lite', 'index.html');
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
    w.requestAnimationFrame = () => 0;   // disable auto-loop; we drive update()/draw() manually
    w.cancelAnimationFrame = () => {};
    w.AudioContext = undefined;          // silence Web Audio
    w.webkitAudioContext = undefined;
    w.addEventListener('error', e => pageErrors.push(e.message));
  }
});

const win = dom.window;
const g = win.__cfq;
const canvas = win.document.getElementById('game');

// jsdom does not lay out the page, so the real getBoundingClientRect would
// be all zeros (-> Infinity/NaN pointer coords in getPointer()). Give it the
// game's own internal resolution so clientX/clientY map 1:1 to canvas space.
canvas.getBoundingClientRect = () => ({ left: 0, top: 0, right: 960, bottom: 540, width: 960, height: 540, x: 0, y: 0 });

function dispatch(type, x, y) {
  const ev = new win.MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true });
  canvas.dispatchEvent(ev);
}

// The game's hitPiece() returns the TOPMOST unplaced piece under the pointer,
// and scattered pieces can overlap, so a fixed corner offset like p.x+2 does
// not reliably address p -- it may address whatever is stacked on top of it.
// Mirror the game's own hit test and pick a point that really resolves to p,
// so a gesture aimed at p acts on p (as it would for a player, who can see
// which tile is on top and aim at exposed pixels).
function topmostAt(x, y) {
  const C = g.CELL;
  for (let i = g.pieces.length - 1; i >= 0; i--) {
    const q = g.pieces[i];
    if (!q.placed && x >= q.x && x <= q.x + C && y >= q.y && y <= q.y + C) return q;
  }
  return null;
}
function grabPointFor(p) {
  const C = g.CELL;
  for (let iy = 1; iy <= 7; iy++) {
    for (let ix = 1; ix <= 7; ix++) {
      const x = p.x + C * ix / 8, y = p.y + C * iy / 8;
      if (topmostAt(x, y) === p) return { x, y };
    }
  }
  return null; // fully buried; caller treats as un-aimable
}

// Grab a still-unplaced piece and drop it exactly on its target in one
// mousedown/mousemove/mouseup gesture -- the real player action. The grab
// offset is preserved through the drop so the piece lands exactly on target.
function dragPieceHome(p) {
  const pt = grabPointFor(p);
  if (!pt) return;
  const ox = pt.x - p.x, oy = pt.y - p.y;
  dispatch('mousedown', pt.x, pt.y);
  dispatch('mousemove', p.targetX + ox, p.targetY + oy);
  dispatch('mouseup', p.targetX + ox, p.targetY + oy);
}

// Press and release without moving = the game's rotate control (a tap).
// This is a real gesture through the real listeners, exactly like a drag;
// it is not a hook shortcut.
function tapPiece(p) {
  const pt = grabPointFor(p);
  if (!pt) return;
  dispatch('mousedown', pt.x, pt.y);
  dispatch('mouseup', pt.x, pt.y);
}

// The full player repertoire for one piece: rotate it upright (rounds >=4
// spawn pieces pre-rotated and only rot===0 is placeable), then drag it home.
// Rounds 1-3 spawn everything at rot 0, so the tap loop simply never runs there.
function playPieceHome(p) {
  for (let t = 0; p.rot !== 0 && t < 8; t++) tapPiece(p);
  dragPieceHome(p);
}

// One pass: try to play every currently-unplaced piece home exactly once.
// Returns how many of them actually placed. A pass that places 0 pieces
// while the round is still incomplete means no amount of correct play
// can finish it (a real soft-lock, not a timing fluke).
function placeAllOnce() {
  const unplaced = g.pieces.filter(p => !p.placed);
  let placed = 0;
  for (const p of unplaced) { playPieceHome(p); if (p.placed) placed++; }
  return { attempted: unplaced.length, placed };
}

(async () => {

  /* ======================= SMOKE ======================= */
  console.log('\n--- smoke ---');
  ok('window.__cfq test hook is exposed', !!g);
  if (!g) { report(); process.exit(1); }
  ok('hook exposes the core API', ['resetGame', 'buildRound', 'tryPlace', 'isDone', 'update', 'draw']
    .every(k => typeof g[k] === 'function'));
  ok('canvas element is present', !!canvas);
  ok('no uncaught page errors on load', pageErrors.length === 0);
  eq(g.game.state, 'title', 'the game opens on the title screen');

  /* ================ core loop: click to start ================ */
  console.log('\n--- core loop: starting the game is the real onDown handler ---');
  dispatch('mousedown', 480, 270);
  dispatch('mouseup', 480, 270);
  eq(g.game.state, 'playing', 'clicking the title screen starts round 1 (via the real onDown listener)');
  eq(g.game.round, 1, 'round starts at 1');

  /* ========= core action -> the game advances (catches soft-locks) ========= */
  console.log('\n--- core loop: completing round 1 advances the round ---');
  const round1Pieces = g.pieces.length;
  ok('round 1 has pieces to place', round1Pieces > 0);
  ok('round 1 has zero rotated pieces (rotation is documented as a later-round feature)',
    g.pieces.every(p => p.rot === 0));
  let r = placeAllOnce();
  eq(r.placed, round1Pieces, 'every round-1 piece places on the first correctly-aimed drag');
  ok('the round is complete', g.isDone());
  await sleep(700); // onUp schedules setTimeout(buildRound, 600) on round completion
  eq(g.game.round, 2, 'completing round 1 advances to round 2');
  eq(g.game.state, 'playing', 'still playing after advancing');
  ok('round 2 has a fresh, unplaced piece set', g.pieces.length > 0 && g.pieces.every(p => !p.placed));

  // is input still accepted on the new round?
  const probe = g.pieces[0];
  dispatch('mousedown', probe.x + 2, probe.y + 2);
  ok('a piece can be picked up on the new round (input is not frozen)',
    !!g.dragging && g.dragging.targetX === probe.targetX && g.dragging.targetY === probe.targetY);
  dispatch('mouseup', probe.x + 2, probe.y + 2); // put it back down where it started (not placed)

  /* ========= do it three times running -> still advancing ========= */
  console.log('\n--- core loop: three rounds in a row ---');
  for (const expectNext of [3, 4]) {
    const n = g.pieces.length;
    r = placeAllOnce();
    eq(r.placed, n, `every piece places on round ${expectNext - 1}`);
    ok(`round ${expectNext - 1} completes`, g.isDone());
    await sleep(700);
    eq(g.game.round, expectNext, `completing round ${expectNext - 1} advances to round ${expectNext}`);
    eq(g.game.state, 'playing', `still playing after reaching round ${expectNext}`);
  }
  // At this point rounds 1->2->3->4 have all been driven through the real
  // mouse listeners: three consecutive successful advances, input accepted
  // after each one.

  /* ========= the rotation rounds ========= */
  console.log('\n--- rotation rounds: the rotate control must exist and must work ---');
  eq(g.game.round, 4, 'round 4 is the first round with rotation enabled per the code (rnd>=4)');
  const round4Rotated = g.pieces.filter(p => p.rot !== 0);
  console.log(`    round 4: ${round4Rotated.length} of ${g.pieces.length} pieces spawned pre-rotated`);
  ok('round 4 really does spawn pre-rotated pieces (otherwise this round proves nothing)',
    round4Rotated.length > 0);

  // tryPlace() only accepts rot===0, so a rotated piece is unplaceable until
  // the player can rotate it. Assert the control exists BEFORE relying on it,
  // so a regression that removes it fails here with a clear message rather
  // than as a mystery timeout further down.
  const rp = round4Rotated[0];
  const rotBefore = rp.rot, movesBeforeTap = g.game.moves, missBeforeTap = g.game.totalMisses;
  tapPiece(rp);
  ok(`tapping a piece in place rotates it (${rotBefore} -> ${rp.rot})`,
    rp.rot === (rotBefore + 90) % 360);
  eq(g.game.moves, movesBeforeTap, 'rotating is not charged as a move');
  eq(g.game.totalMisses, missBeforeTap, 'rotating is not charged as a miss');
  const q = g.pieces.find(p => !p.placed && p.rot !== 0);
  dragPieceHome(q);
  ok('a rotated piece still refuses to snap home while rot!==0 (the gate is intact)', !q.placed);

  // q now lies exactly on its own outline but still rotated. Dragging it
  // "home" again would be a zero-distance gesture -- indistinguishable from a
  // tap -- so rotating it upright is the only gesture left that can complete
  // it. If this fails, a piece can sit visibly correct on its outline and
  // refuse to go in until the player jiggles it.
  const qMoves = g.game.moves, qMiss = g.game.totalMisses;
  for (let t = 0; q.rot !== 0 && t < 8; t++) tapPiece(q);
  eq(q.rot, 0, 'the resting piece can be rotated upright in place');
  ok('rotating a piece already resting on its outline snaps it home', q.placed);
  eq(g.game.moves, qMoves, 'the rotate that completed it is still not charged as a move');
  eq(g.game.totalMisses, qMiss, 'the rotate that completed it is not charged as a miss');

  // Now play round 4 the way a real player would: rotate upright, then drag home.
  for (let i = 0; i < 8 && !g.isDone(); i++) placeAllOnce();
  const stuckPieces = g.pieces.filter(p => !p.placed);
  ok('a competent player, rotating each piece upright and dragging it onto its target, can complete round 4',
    g.isDone());
  if (!g.isDone()) {
    console.log(`    -> ${stuckPieces.length} piece(s) still stuck: ` +
      JSON.stringify(stuckPieces.map(p => ({ idx: p.idx, rot: p.rot }))));
  }
  ok('every placed piece ended upright', g.pieces.every(p => !p.placed || p.rot === 0));
  await sleep(700);
  eq(g.game.round, 5, 'clearing round 4 advances to round 5');
  eq(g.game.state, 'playing', 'still playing on round 5');

  /* ========= exhaust to a real ending ========= */
  console.log('\n--- round 5 (also rotated) -> the real win screen ---');
  ok('round 5 also spawns pre-rotated pieces', g.pieces.some(p => p.rot !== 0));
  for (let i = 0; i < 8 && !g.isDone(); i++) placeAllOnce();
  ok('round 5 completes too', g.isDone());
  await sleep(700);
  eq(g.game.state, 'won', 'clearing the final round reaches the real win screen through actual play');

  /* ========= restart from an ending is playable again ========= */
  console.log('\n--- restart from the REAL win screen ---');
  // Reached by playing, not forced: this exercises onDown's own
  // `state==='won' -> resetGame()` branch from the state the game itself set.
  dispatch('mousedown', 480, 270);
  dispatch('mouseup', 480, 270);
  eq(g.game.state, 'playing', 'clicking the real win screen restarts via the real onDown handler');
  eq(g.game.round, 1, 'restart resets to round 1');
  ok('restart deals a fresh, unplaced piece set', g.pieces.length > 0 && g.pieces.every(p => !p.placed));

  // The rotate control is gated on ROT_ENABLED (rnd>=4). On rounds 1-3 a tap
  // in place must keep its original meaning -- a failed placement -- or the
  // fix for rounds 4-5 would have silently changed the early game.
  const t0 = g.pieces[0], m0 = g.game.moves, x0 = g.game.totalMisses;
  tapPiece(t0);
  eq(t0.rot, 0, 'tapping on a non-rotation round does not rotate');
  eq(g.game.moves, m0 + 1, 'tapping on a non-rotation round still counts as a move');
  eq(g.game.totalMisses, x0 + 1, 'tapping on a non-rotation round still counts as a miss');

  r = placeAllOnce();
  eq(r.placed, g.pieces.length, 'after restarting, round 1 (no rotation) is completable again');

  /* ========= skip / hint / power-up path ========= */
  console.log('\n--- skip / hint / power-up ---');
  ok('SKIPPED: Jigsaw Lite has no skip, hint, or power-up mechanic on the core loop ' +
    '(only Pause and Mute, which do not touch progress) -- nothing to drive here', true);

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
