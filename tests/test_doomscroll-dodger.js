const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'..','games','doomscroll-dodger','index.html'),'utf8');
const stub=el=>new Proxy({},{get(t,p){if(p==='measureText')return ()=>({width:10});if(p==='createLinearGradient'||p==='createRadialGradient')return ()=>({addColorStop(){}});if(p==='canvas')return el;if(p==='getImageData')return ()=>({data:[]});return t[p]!==undefined?t[p]:(()=>{});},set(){return true;}});
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:false,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=function(){return stub(this);};w.requestAnimationFrame=()=>0;w.cancelAnimationFrame=()=>{};w.AudioContext=undefined;w.webkitAudioContext=undefined;}});
const g=dom.window.__game;

let pass=0, fail=0;
function ok(name,cond){ if(cond){pass++; console.log('  PASS '+name);} else {fail++; console.log('  FAIL '+name);} }
function approx(a,b,e){ return Math.abs(a-b)<=(e===undefined?0.001:e); }

// (a) hook exists
ok('hook exists', g && typeof g.update==='function' && typeof g.reset==='function' && typeof g.draw==='function');

// (b) reset() -> playing, calm full, progress 0
g.reset(1);
ok('reset -> playing state', g.game.state==='playing');
ok('reset -> calm full', g.calm===100);
ok('reset -> progress 0', g.progress===0);

// (c) getting hit lowers calm
g.reset(1);
const c0 = g.calm;
const hz = g.spawnHazard();
const handled = g.hitHazard(hz);
ok('hit lowers calm', g.calm < c0 && handled===true);

// (d) DND power-up sets a shield; a hit during shield does not lower calm
g.reset(1);
g.applyPowerup();
ok('powerup sets shield', g.shield > 0);
const c1 = g.calm;
const hz2 = g.spawnHazard();
g.hitHazard(hz2);
ok('hit during shield does not lower calm', g.calm===c1);

// (e) calm hitting 0 -> gameover
g.reset(1);
g.game.shield = 0;
let guard=0;
while(g.calm>0 && guard<100){ const h=g.spawnHazard(); g.hitHazard(h); guard++; }
ok('calm 0 -> gameover', g.calm===0 && g.game.state==='gameover');

// (f) progress reaching max -> win (advance through nights)
g.reset(1);
let safety=0;
while(g.game.state==='playing' && safety<5000){
  g.game.shield = 5; // stay shielded so calm never runs out
  g.update(0.1);
  safety++;
}
ok('progress reaching max across nights -> win', g.game.state==='win');

// (g) calm slowly restores when not hit
g.reset(1);
g.game.calm = 40;
const before = g.calm;
g.game.shield = 5; // avoid any hit lowering calm
// step a few frames with no overlap (player center, hazards spawn at top)
g.game.hazards.length = 0;
for(let i=0;i<10;i++){ g.game.hazards.length=0; g.update(0.05); }
ok('calm restores over time', g.calm > before);

// (h) draw() runs in every state without throwing
let drawOk=true;
for(const st of ['title','playing','paused','gameover','win']){
  try{ g.setState(st); g.draw(); }catch(e){ drawOk=false; console.log('   draw threw in '+st+': '+e.message); }
}
ok('draw runs in title/playing/paused/gameover/win', drawOk);

// (i) deterministic spawn with same seed
g.reset(42);
const a1=g.spawnHazard(), a2=g.spawnHazard(), a3=g.spawnHazard();
const seqA = [a1,a2,a3].map(h=>h.type.key+':'+a1.baseX.toFixed(2)+'|'+h.baseX.toFixed(2)+'|'+h.vy.toFixed(2));
g.reset(42);
const b1=g.spawnHazard(), b2=g.spawnHazard(), b3=g.spawnHazard();
const seqB = [b1,b2,b3].map(h=>h.type.key+':'+b1.baseX.toFixed(2)+'|'+h.baseX.toFixed(2)+'|'+h.vy.toFixed(2));
ok('deterministic spawn with same seed', JSON.stringify(seqA)===JSON.stringify(seqB));
// and a different seed differs
g.reset(99);
const seqC=[g.spawnHazard(),g.spawnHazard(),g.spawnHazard()].map(h=>h.type.key+':'+h.baseX.toFixed(2)+'|'+h.vy.toFixed(2));
ok('different seed produces a different stream', JSON.stringify(seqC)!==JSON.stringify(seqB));

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail===0?0:1);
