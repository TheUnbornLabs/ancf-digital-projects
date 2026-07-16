// Logic + smoke tests for Carbon Clear (#7). jsdom, no screenshots.
const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'..','games','carbon-clear','index.html'),'utf8');
const stub=el=>new Proxy({},{get(t,p){if(p==='measureText')return ()=>({width:10});if(p==='createLinearGradient'||p==='createRadialGradient')return ()=>({addColorStop(){}});if(p==='canvas')return el;if(p==='getImageData')return ()=>({data:[]});return t[p]!==undefined?t[p]:(()=>{});},set(){return true;}});
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:false,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=function(){return stub(this);};w.requestAnimationFrame=()=>0;w.cancelAnimationFrame=()=>{};w.AudioContext=undefined;w.webkitAudioContext=undefined;}});
const g=dom.window.__game;

let pass=0,fail=0;
function ok(name,cond){ if(cond){pass++; console.log('  ok  '+name);} else {fail++; console.log('FAIL  '+name);} }
function eq(name,a,b){ ok(name+' ('+a+'=='+b+')', a===b); }

// (a) hook exists
ok('hook __game exists', !!g && typeof g.update==='function' && typeof g.draw==='function');
ok('hook exposes mechanics', typeof g.splitClutter==='function' && typeof g.collectPart==='function' && typeof g.genLevel==='function');

// (b) reset() -> playing, footprint at start, clutter spawned
g.reset();
eq('reset -> playing', g.game.state, 'playing');
ok('footprint at start value', g.game.footprint===g.game.footprintStart && g.game.footprint>0);
ok('clutter spawned', g.game.clutter.length>0);
ok('starfield present', g.game.stars.length>0);

// (c) thrust changes velocity & position drifts with momentum
g.reset();
const sx=g.ship.x, sy=g.ship.y;
g.ship.vx=0; g.ship.vy=0; g.ship.angle=0;
g.input.thrust=true;
g.update(0.1);
ok('thrust changes velocity', (g.ship.vx!==0 || g.ship.vy!==0));
g.input.thrust=false;
const px=g.ship.x;
g.update(0.1);
ok('position drifts with momentum (thrust off)', g.ship.x!==px && Math.abs(g.ship.vx)>0);
ok('moved from spawn', g.ship.x!==sx || g.ship.y!==sy);

// (d) screen-wrap keeps ship on-screen
g.reset();
g.ship.x=950; g.ship.y=10; g.ship.vx=600; g.ship.vy=-600; g.ship.angle=0; g.input.thrust=false;
for(let i=0;i<10;i++) g.update(0.05);
ok('ship x wrapped on-screen', g.ship.x>=0 && g.ship.x<=960);
ok('ship y wrapped on-screen', g.ship.y>=0 && g.ship.y<=540);

// (e) splitting a large clutter yields smaller pieces
g.reset();
const big=g.game.clutter.find(c=>c.size===3);
ok('a large (size 3) clutter exists', !!big);
const beforeParts=g.game.parts.length;
const pieces=g.splitClutter(big);
ok('split yields smaller pieces', pieces.length>0 && pieces.every(p=>p.size===big.size-1));
ok('split drops scoopable parts', g.game.parts.length>beforeParts);
ok('original chunk removed', g.game.clutter.indexOf(big)===-1);

// (f) collecting parts lowers footprint
g.reset();
const c0=g.game.clutter[0];
g.splitClutter(c0);
const fpBefore=g.game.footprint;
const part=g.game.parts[0];
ok('a part exists to collect', !!part);
g.collectPart(part);
ok('collecting lowers footprint', g.game.footprint<fpBefore);

// (g) footprint reaching target -> levelComplete/win
g.reset();
g.game.footprint = g.game.target + 1.0;
g.game.parts.push({x:0,y:0,vx:0,vy:0,radius:7,value:5,color:'#fff',age:0,spin:0,angle:0});
g.collectPart(g.game.parts[g.game.parts.length-1]);
ok('reaching target -> levelComplete or win', g.game.state==='levelComplete'||g.game.state==='win');

// (h) every level fact card has BOTH a stat and a counter-nuance
let cardsOk=true;
for(let lv=1; lv<=g.game.maxLevel; lv++){
  g.genLevel(lv);
  const fc=g.game.factCard;
  if(!fc || !fc.stat || !fc.nuance || fc.stat.length<10 || fc.nuance.length<10) cardsOk=false;
}
ok('each level fact card has stat AND counter-nuance', cardsOk);
ok('factCards exposed and even-handed', g.factCards.every(c=>c.stat && c.nuance));

// (i) draw() runs without throwing in every state
const states=['title','playing','paused','gameover','win','levelComplete','factCard'];
let drawOk=true;
for(const s of states){ try{ g.setState(s); g.draw(); }catch(e){ drawOk=false; console.log('   draw threw in '+s+': '+e.message);} }
ok('draw() runs in title/playing/paused/gameover/win/factCard', drawOk);

// (j) deterministic level with same seed
g.genLevel(3);
const snapA=g.game.clutter.map(c=>[Math.round(c.x*1000),Math.round(c.y*1000),c.size,Math.round(c.vx*1000)]);
const tgtA=g.game.target, fpA=g.game.footprintStart;
g.genLevel(3);
const snapB=g.game.clutter.map(c=>[Math.round(c.x*1000),Math.round(c.y*1000),c.size,Math.round(c.vx*1000)]);
ok('deterministic: same seed -> same clutter layout', JSON.stringify(snapA)===JSON.stringify(snapB));
ok('deterministic: same target & footprint', g.game.target===tgtA && g.game.footprintStart===fpA);

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
