const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'..','games','quiet-hours','index.html'),'utf8');
const stub=el=>new Proxy({},{get(t,p){if(p==='measureText')return ()=>({width:10});if(p==='createLinearGradient'||p==='createRadialGradient')return ()=>({addColorStop(){}});if(p==='canvas')return el;if(p==='getImageData')return ()=>({data:[]});return t[p]!==undefined?t[p]:(()=>{});},set(){return true;}});
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:false,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=function(){return stub(this);};w.requestAnimationFrame=()=>0;w.cancelAnimationFrame=()=>{};w.AudioContext=undefined;w.webkitAudioContext=undefined;}});
const g=dom.window.__game;

let pass=0, fail=0;
function ok(name,cond){ if(cond){pass++; console.log('  ok  '+name);} else {fail++; console.log('FAIL  '+name);} }

ok('hook __game exists', !!g && typeof g.update==='function' && typeof g.draw==='function');
ok('hook exposes lantern/game/input', !!g.game && !!g.lantern && !!g.input);

g.reset();
ok('reset sets state playing', g.game.state==='playing');
ok('reset distance 0', g.game.distance===0);
ok('reset score 0', g.game.score===0);

g.reset();
const vy0 = g.lantern.vy;
for(let i=0;i<8;i++) g.update(16);
ok('gravity increases downward vy', g.lantern.vy > vy0 && g.lantern.vy > 0);

g.reset();
for(let i=0;i<5;i++) g.update(16);
g.flap();
ok('flap produces upward (negative) vy', g.lantern.vy < 0);

g.reset();
const score0 = g.game.score;
let passed=false;
for(let i=0;i<4000 && !passed;i++){
  const gates = g.gates;
  let target = null;
  for(const gt of gates){ const sx = gt.x - g.game.scrollX; if(sx + g.constants.PILLAR_W >= g.constants.LANTERN_X - 30){ target = gt; break; } }
  if(target){ g.lantern.y = target.gapY; g.lantern.vy = 0; }
  g.update(16);
  if(g.game.score > score0) passed=true;
}
ok('passing a gate increases score', g.game.score > score0);
ok('distance increased while playing', g.game.distance > 0);

g.reset();
g.lantern.y = g.constants.PLAY_BOTTOM + 100;
g.update(16);
ok('floor collision -> gameover', g.game.state==='gameover');

g.reset();
const firstGate = g.gates[0];
g.game.scrollX = firstGate.x - g.constants.LANTERN_X;
ok('collisionAt detects pillar', g.collisionAt(g.constants.PLAY_TOP + 5)===true);
g.lantern.y = g.constants.PLAY_TOP + 5;
g.update(16);
ok('pillar collision -> gameover', g.game.state==='gameover');

let drewOk=true;
for(const st of ['title','playing','paused','gameover']){
  try{ g.setState(st); g.draw(); }catch(e){ drewOk=false; console.log('  draw threw in '+st+': '+e.message); }
}
ok('draw() runs in all states', drewOk);

g.game.seed = 4242;
const a1 = g.makeGate(7), a2 = g.makeGate(7), a3 = g.makeGate(8);
ok('makeGate deterministic same index', a1.gapY===a2.gapY && a1.gapH===a2.gapH && a1.label===a2.label);
ok('makeGate differs across indices', a1.gapY!==a3.gapY || a1.label!==a3.label);
g.game.seed = 999;
g.reset(); const r1 = g.gates.map(x=>x.gapY+'/'+x.gapH+'/'+x.x).join(',');
g.reset(); const r2 = g.gates.map(x=>x.gapY+'/'+x.gapH+'/'+x.x).join(',');
ok('reset deterministic with same seed', r1===r2 && r1.length>0);

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail===0?0:1);
