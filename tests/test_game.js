// jsdom test harness for Childfree Quest: The Boundary Run
// Stubs the canvas 2D context (jsdom returns null) and drives the game via window.__cfq.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const GAME = process.argv[2] ||
  path.join(__dirname, '..', 'games', 'childfree-quest-boundary-run', 'index.html');
const html = fs.readFileSync(GAME, 'utf8');

let passed = 0, failed = 0;
const fails = [];
function ok(cond, msg){ if(cond){passed++;} else {failed++; fails.push(msg);} }
function eq(a,b,msg){ ok(a===b, `${msg} (got ${a}, expected ${b})`); }

// ---- canvas 2D context stub ----
// scaleCalls records ctx.scale(x,y) so sprite-mirroring can be asserted without pixels.
const scaleCalls = [];
function makeCtxStub(canvasEl){
  const noop = ()=>{};
  return new Proxy({}, {
    get(t, p){
      if(p==='measureText') return ()=>({width:10});
      if(p==='createLinearGradient' || p==='createRadialGradient') return ()=>({addColorStop:noop});
      if(p==='canvas') return canvasEl;
      if(p==='getImageData') return ()=>({data:[]});
      if(p==='scale') return (x,y)=>{ scaleCalls.push([x,y]); };
      const v = t[p];
      if(v!==undefined) return v;
      return noop; // any method call is a no-op
    },
    set(){ return true; } // absorb fillStyle/font/etc.
  });
}

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: false,
  beforeParse(window){
    window.HTMLCanvasElement.prototype.getContext = function(){ return makeCtxStub(this); };
    window.requestAnimationFrame = ()=>0;   // disable auto-loop; we drive update() manually
    window.cancelAnimationFrame = ()=>{};
    window.AudioContext = undefined;        // silence Web Audio
    window.webkitAudioContext = undefined;
  }
});

const win = dom.window;
const cfq = win.__cfq;

ok(!!cfq, 'window.__cfq test hook is exposed');
if(!cfq){ report(); process.exit(1); }

// ---------- 1. Stage generation across all 50 stages ----------
let allBuildingsSafe = true, allHavePits = true, allReachableEnd = true;
const worldsSeen = new Set();
let stage50Boss = null;
for(let n=1; n<=50; n++){
  const L = cfq.createStage(n);
  worldsSeen.add(L.world.name);
  if(!(L.pits && L.pits.length>=1)) allHavePits = false;
  if(!(L.endX>0 && L.endX < L.len)) allReachableEnd = false;
  for(const b of L.buildings){
    if(cfq.overlapsPit(b.x, b.w, L.pits, 0)) allBuildingsSafe = false;
    const onGround = L.platforms.some(p=>p.type==='ground' && b.x+10>=p.x && b.x+b.w-10<=p.x+p.w);
    if(!onGround) allBuildingsSafe = false;
  }
  if(!L.buildings.some(b=>b.endBank)) allReachableEnd = false;
  if(n===50) stage50Boss = L.boss;
}
ok(allHavePits, 'every stage (1-50) has at least one vulnerability pit');
ok(allBuildingsSafe, 'no building overlaps a pit and all sit on ground (validateStage works)');
ok(allReachableEnd, 'every stage has a reachable end flag + end-stage bank');
eq(worldsSeen.size, 5, 'all 5 symbolic worlds appear across 50 stages');
ok(stage50Boss && stage50Boss.hp>0, 'stage 50 spawns The Life Script Golem boss');
ok(!cfq.createStage(1).boss, 'non-final stages have no boss');

// ---------- 2. Start the game ----------
cfq.resetGame();
const game = cfq.game, player = cfq.player, input = cfq.input;
eq(game.state, 'playing', 'resetGame puts game into playing state');
eq(game.stageNo, 1, 'game starts on stage 1');
eq(game.resources.lives, 3, 'player starts with 3 lives');

// ---------- 3. Player physics: gravity + landing ----------
player.x = 200; player.y = 100; player.vy = 0; player.onGround = false;
for(let i=0;i<60;i++) cfq.update(0.016);
ok(player.onGround, 'player falls under gravity and lands on a ground platform');
ok(player.y < 460, 'player rests at a sane ground height');

// ---------- 4. Jump leaves the ground ----------
input.jumpPressed = true; input.jump = true;
cfq.update(0.016);
ok(player.vy < 0, 'jump produces upward velocity');
input.jump = false;

// ---------- 5. Pit trigger: shake + health drain ----------
cfq.loadStage(5);
const L5 = game.level; const pit = L5.pits[0];
player.x = pit.x + pit.w/2 - player.w/2;
player.y = pit.y + 30; player.vy = 0;
const hpBefore = game.resources.health;
game.shake = 0;
cfq.update(0.05);
ok(player.triggerPit === pit, 'standing in a pit sets the triggered state');
ok(game.shake > 0, 'pit trigger causes screen shake');
cfq.update(0.2);
ok(game.resources.health < hpBefore, 'staying in a pit drains health');

// ---------- 6. Escaping a pit grants agency ----------
const agBefore = game.resources.agency;
player.y = pit.y - 80;
cfq.update(0.05);
ok(game.resources.agency > agBefore, 'escaping a pit rewards +agency');
ok(player.triggerPit === null, 'trigger state clears after escaping');

// ---------- 7. Shop effects apply and cost tokens ----------
game.resources.tokens = 100;
const livesBefore = game.resources.lives;
const bought = cfq.applyShopEffect('extraLife', 35);
ok(bought, 'a purchasable item buys successfully when affordable');
eq(game.resources.lives, livesBefore+1, 'Life Insurance grants an extra life');
eq(game.resources.tokens, 65, 'tokens are deducted by the item cost');
game.resources.tokens = 2;
const poor = cfq.applyShopEffect('extraLife', 35);
ok(poor === false, 'purchase is rejected when tokens are insufficient');

// ---------- 8. Shop catalog covers all 15 places ----------
let allShopsHaveItems = true;
for(const type of Object.keys(cfq.placeData)){
  const opts = cfq.shopOptions(type);
  if(!(Array.isArray(opts) && opts.length>=3)) allShopsHaveItems = false;
}
ok(allShopsHaveItems, 'all 15 places expose >=3 purchasable items');

// ---------- 9. Losing all lives ends the game ----------
game.resources.lives = 0;
cfq.loseLife();
eq(game.state, 'gameover', 'losing the last life triggers game over');

// ---------- 10. Crows lead with the beak ----------
// The crow sprite is authored facing right, so ctx.scale(-1,1) must mirror it when
// it travels left. Regression: the mirror ternary was inverted, so every crow (vx is
// always negative) flew backwards.
function crowFacingFor(vx){
  scaleCalls.length = 0;
  win.drawCrow({ x:100, y:100, w:38, h:26, baseY:100, vx, phase:0, taken:false });
  const m = scaleCalls.find(s => s[0] === 1 || s[0] === -1);
  return m ? m[0] : null;
}
ok(typeof win.drawCrow === 'function', 'drawCrow is reachable for the facing test');
eq(crowFacingFor(-1.5), -1, 'crow travelling left is mirrored to face left');
eq(crowFacingFor(1.5), 1, 'crow travelling right is drawn unmirrored (faces right)');
// the crows the game actually builds all drift left, so they must all face left
const sampleCrows = [cfq.makeCrow ? cfq.makeCrow(500,250) : win.makeCrow(500,250),
                     cfq.makeCrow ? cfq.makeCrow(900,220) : win.makeCrow(900,220)];
ok(sampleCrows.every(c => c.vx < 0), 'generated crows drift left');
ok(sampleCrows.every(c => crowFacingFor(c.vx) === -1), 'every generated crow faces its direction of travel');

function report(){
  console.log(`\n==== TEST RESULTS ====`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  if(fails.length){ console.log('\nFailures:'); fails.forEach(f=>console.log('  x '+f)); }
  console.log(failed===0 ? '\nALL TESTS GREEN' : '\nSOME TESTS FAILED');
}
report();
process.exit(failed===0?0:1);
