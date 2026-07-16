// jsdom logic + smoke tests for Free Path Climber.
const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'..','games','free-path-climber','index.html'),'utf8');
const stub=el=>new Proxy({},{get(t,p){if(p==='measureText')return ()=>({width:10});if(p==='createLinearGradient'||p==='createRadialGradient')return ()=>({addColorStop(){}});if(p==='canvas')return el;if(p==='getImageData')return ()=>({data:[]});return t[p]!==undefined?t[p]:(()=>{});},set(){return true;}});
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:false,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=function(){return stub(this);};w.requestAnimationFrame=()=>0;w.cancelAnimationFrame=()=>{};w.AudioContext=undefined;w.webkitAudioContext=undefined;}});
const g=dom.window.__game;

let passed=0,failed=0;const fails=[];
function ok(c,m){if(c){passed++;}else{failed++;fails.push(m);}}
function eq(a,b,m){ok(a===b,`${m} (got ${a}, expected ${b})`);}

// (a) hook exists
ok(g && typeof g.update==='function' && typeof g.draw==='function' && typeof g.reset==='function' && typeof g.genRow==='function','(a) test hook exposes update/draw/reset/genRow');

// (b) reset -> playing, height 0
g.reset();
eq(g.game.state,'playing','(b) reset sets state playing');
eq(g.game.height,0,'(b) reset sets height 0');

// (c) gravity pulls player down and they land on a platform
g.reset();
g.player.onGround=false; g.player.onPlatform=null;
const startY=g.player.y;
for(let i=0;i<60;i++) g.update(0.016);
ok(g.player.onGround===true,'(c) player lands on a platform under gravity');
ok(g.player.onPlatform!=null,'(c) player has a supporting platform after falling');

// (d) hopping produces upward velocity (negative vy = up)
g.reset();
g.player.onGround=true;
g.hop(1);
ok(g.player.vy<0,'(d) hop produces upward (negative) velocity');

// (e) climbing increases height/score
g.reset();
const h0=g.game.height;
// teleport player upward several rows and let update register height
g.player.y = g.FLOOR_Y - g.ROW_GAP*5 - 20;
g.player.vy=0; g.player.onGround=false;
g.update(0.016);
ok(g.game.height>h0,`(e) climbing increases height (h0=${h0} -> ${g.game.height})`);

// (f) rising tide reaching the player -> gameover
g.reset();
g.game.tideY = g.player.y - 100; // tide above player's head => caught (tide rises, y decreases)
g.update(0.016);
eq(g.game.state,'gameover','(f) tide catching player triggers gameover');

// (g) reaching summit height -> win
g.reset();
g.player.y = g.FLOOR_Y - g.ROW_GAP*(g.SUMMIT_HEIGHT+2);
g.player.onGround=false; g.player.vy=0;
g.game.tideY = g.player.y + 5000; // keep tide far away
g.update(0.016);
eq(g.game.state,'win','(g) reaching summit height triggers win');

// (h) draw() runs in every state without throwing
g.reset();
for(const st of ['title','playing','paused','gameover','win']){
  let threw=false;
  g.setState(st);
  try{ g.draw(); }catch(e){ threw=true; }
  ok(!threw,`(h) draw() runs in state ${st}`);
}

// (i) deterministic genRow with same index reproduces same row
const r1=g.genRow(37), r2=g.genRow(37);
ok(JSON.stringify(r1)===JSON.stringify(r2),'(i) genRow(37) deterministic / reproducible');
const rA=g.genRow(12), rB=g.genRow(40);
ok(JSON.stringify(rA)!==JSON.stringify(rB),'(i) different indices produce different rows');

console.log(`\nFree Path Climber tests: ${passed} passed, ${failed} failed`);
if(failed){ console.log('FAILURES:'); fails.forEach(f=>console.log('  - '+f)); process.exit(1); }
else { console.log('ALL GREEN'); process.exit(0); }
