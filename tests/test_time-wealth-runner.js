// Logic + smoke tests for Time Wealth Runner (jsdom, canvas-stubbed).
const fs=require('fs'),path=require('path');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'..','games','time-wealth-runner','index.html'),'utf8');

const stub=el=>new Proxy({},{get(t,p){
  if(p==='measureText')return ()=>({width:10});
  if(p==='createLinearGradient'||p==='createRadialGradient')return ()=>({addColorStop(){}});
  if(p==='canvas')return el;
  if(p==='getImageData')return ()=>({data:[]});
  return t[p]!==undefined?t[p]:(()=>{});
},set(){return true;}});

const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:false,beforeParse(w){
  w.HTMLCanvasElement.prototype.getContext=function(){return stub(this);};
  w.requestAnimationFrame=()=>0; w.cancelAnimationFrame=()=>{};
  w.AudioContext=undefined; w.webkitAudioContext=undefined;
}});
const g=dom.window.__game;

let pass=0, fail=0;
function ok(name,cond){ if(cond){pass++; console.log('  ok  - '+name);} else {fail++; console.log('FAIL  - '+name);} }
function eq(name,a,b){ ok(name+' ('+a+' == '+b+')', a===b); }

// (a) test hook exists
ok('test hook __game exists', !!g);
ok('hook exposes game/player/input', !!g.game && !!g.player && !!g.input);
ok('hook exposes mechanic fns', typeof g.reset==='function' && typeof g.spawnChunk==='function'
  && typeof g.collectHour==='function' && typeof g.takeHit==='function' && typeof g.setState==='function');

// (b) reset() -> playing, zeroed score/combo
g.reset(777);
eq('reset state playing', g.game.state, 'playing');
eq('reset hours zero', g.game.hours, 0);
eq('reset combo 1', g.game.combo, 1);
eq('reset strikes 3', g.game.strikes, 3);

// (c) collecting an hour increases hours-banked and combo, and combo multiplies
g.reset(777);
const c1={x:0,y:0,w:22,h:22,taken:false,bob:0};
g.collectHour(c1);
ok('first collect adds 1h', g.game.hours===1);
ok('first collect comboCount 1', g.game.comboCount===1);
// collect enough to bump multiplier (every 4 collects -> +1x)
for(let i=0;i<4;i++){ g.collectHour({x:0,y:0,w:22,h:22,taken:false,bob:0}); }
ok('combo multiplier grew above 1', g.game.combo>1);
const before=g.game.hours;
g.collectHour({x:0,y:0,w:22,h:22,taken:false,bob:0});
ok('gain scaled by combo (>1 added)', (g.game.hours-before)===g.game.combo && g.game.combo>1);
// double-collect of same coin does nothing
const taken=g.game.hours;
g.collectHour(c1);
ok('re-collecting taken coin is no-op', g.game.hours===taken);

// (d) taking a hit resets combo and decrements strikes
g.reset(777);
for(let i=0;i<8;i++){ g.collectHour({x:0,y:0,w:22,h:22,taken:false,bob:0}); }
ok('combo built before hit', g.game.combo>1);
const strikesBefore=g.game.strikes;
g.takeHit({x:0,y:0,w:40,h:40,label:'Doomscroll'});
eq('hit resets combo to 1', g.game.combo, 1);
eq('hit resets comboCount', g.game.comboCount, 0);
eq('hit decrements strikes', g.game.strikes, strikesBefore-1);
// invulnerability blocks immediate second hit
const s2=g.game.strikes;
g.takeHit({x:0,y:0,w:40,h:40,label:'x'});
eq('invuln blocks immediate second hit', g.game.strikes, s2);

// (e) losing all strikes -> gameover
g.reset(777);
g.game.invuln=0; g.takeHit(null);
g.game.invuln=0; g.takeHit(null);
g.game.invuln=0; g.takeHit(null);
eq('three hits -> gameover', g.game.state, 'gameover');

// (f) jump produces upward velocity / double-jump works
g.reset(777);
g.player.onGround=true; g.player.jumps=0; g.player.vy=0;
g.doJump();
ok('jump gives upward velocity', g.player.vy<0 && g.player.jumps===1);
const firstV=g.player.vy;
g.doJump();
ok('double-jump works', g.player.jumps===2 && g.player.vy<0);
g.doJump();
ok('no triple-jump', g.player.jumps===2);

// jump via update+input while playing
g.reset(777);
g.player.onGround=true; g.player.jumps=0; g.player.vy=0;
g.input.jumpPressed=true;
g.update(0.016);
ok('update consumes jumpPressed -> velocity', g.player.vy<0 && g.player.jumps>=1);

// (g) draw() runs without throwing in title, playing, paused, gameover
function drawOK(state){
  try{ g.setState ? null : null; g.game.state=state; g.draw(); return true; }
  catch(e){ console.log('   draw threw in '+state+': '+e.message); return false; }
}
g.reset(777);
ok('draw title no throw', drawOK('title'));
ok('draw playing no throw', drawOK('playing'));
ok('draw paused no throw', drawOK('paused'));
ok('draw gameover no throw', drawOK('gameover'));

// (h) deterministic spawn: same seed -> same first chunk
function firstChunk(seed){
  g.reset(seed);
  // reset() already calls ensureSpawn; capture current hazards+coins snapshot
  const hz=g.game.hazards.map(h=>[Math.round(h.x),Math.round(h.y),h.w,h.h,h.type]);
  const co=g.game.coins.map(c=>[Math.round(c.x),Math.round(c.y)]);
  return JSON.stringify({hz,co});
}
const A=firstChunk(424242);
const B=firstChunk(424242);
ok('same seed -> identical first chunks', A===B);
const C=firstChunk(999999);
ok('different seed -> different chunks', A!==C);

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail===0?0:1);
