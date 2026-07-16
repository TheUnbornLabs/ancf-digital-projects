const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'..','games','boundary-catch','index.html'),'utf8');
const stub=el=>new Proxy({},{get(t,p){if(p==='measureText')return ()=>({width:10});if(p==='createLinearGradient'||p==='createRadialGradient')return ()=>({addColorStop(){}});if(p==='canvas')return el;if(p==='getImageData')return ()=>({data:[]});return t[p]!==undefined?t[p]:(()=>{});},set(){return true;}});
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:false,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=function(){return stub(this);};w.requestAnimationFrame=()=>0;w.cancelAnimationFrame=()=>{};w.AudioContext=undefined;w.webkitAudioContext=undefined;}});
const g=dom.window.__game;

let pass=0,fail=0;
function ok(name,cond){ if(cond){pass++; console.log('  ok  - '+name);} else {fail++; console.log('  FAIL- '+name);} }

// (a) hook exists
ok('hook __game exists', !!g && typeof g.update==='function' && typeof g.draw==='function');
ok('hook exposes game/basket/input', !!g.game && !!g.basket && !!g.input);

// (b) reset -> playing, capacity 0, score 0
g.reset(1337);
ok('reset -> state playing', g.game.state==='playing');
ok('reset -> capacity 0', g.game.capacity===0);
ok('reset -> score 0', g.game.score===0);
ok('reset -> kept 0', g.game.kept===0);

function makeItem(kind){
  const text = kind==='good' ? g.GOOD_ITEMS[0] : g.OVERLOAD_ITEMS[0];
  return {x:g.basket.x, y:g.basket.y, r:30, vy:100, vx:0, kind, text, caught:false, dead:false, flash:0, spin:0, rot:0, born:0};
}

// (c) catching a GOOD item raises score
g.reset(1337);
let s0=g.game.score, k0=g.game.kept;
g.catchItem(makeItem('good'));
ok('catch GOOD raises score', g.game.score>s0);
ok('catch GOOD raises kept', g.game.kept===k0+1);

// (d) catching an OVERLOAD item raises capacity
g.reset(1337);
let c0=g.game.capacity;
g.catchItem(makeItem('overload'));
ok('catch OVERLOAD raises capacity', g.game.capacity>c0);

// (e) capacity overflow -> gameover
g.reset(1337);
let guard=0;
while(g.game.state==='playing' && guard<100){ g.catchItem(makeItem('overload')); guard++; }
ok('capacity overflow -> gameover', g.game.state==='gameover');
ok('capacity at/over max on overflow', g.game.capacity>=g.game.capacityMax);

// (f) letting an overload item fall does NOT raise capacity (and rewards)
g.reset(1337);
let capBefore=g.game.capacity, scoreBefore=g.game.score, declBefore=g.game.declined;
g.missItem(makeItem('overload'));
ok('miss OVERLOAD does not raise capacity', g.game.capacity<=capBefore);
ok('miss OVERLOAD rewards score', g.game.score>scoreBefore);
ok('miss OVERLOAD increments declined', g.game.declined===declBefore+1);
let sc2=g.game.score, cap2=g.game.capacity;
g.missItem(makeItem('good'));
ok('miss GOOD gives no score', g.game.score===sc2);
ok('miss GOOD does not raise capacity', g.game.capacity<=cap2);

// (g) every spawned item is classified good/overload
g.reset(1337);
let allClassified=true, sawGood=false, sawBad=false;
for(let w=1;w<=6;w++){
  g.game.wave=w;
  for(let i=0;i<40;i++){
    const it=g.spawnItem();
    if(it.kind!=='good' && it.kind!=='overload') allClassified=false;
    if(g.classifyText(it.text)!==it.kind) allClassified=false;
    if(it.kind==='good') sawGood=true; if(it.kind==='overload') sawBad=true;
  }
}
ok('every spawned item classified good/overload', allClassified);
ok('both good and overload appear across waves', sawGood && sawBad);

// (h) draw() runs in title/playing/paused/gameover/waveComplete
['title','playing','paused','gameover','waveComplete'].forEach(st=>{
  g.reset(1337); g.setState(st);
  g.spawnItem(); g.spawnItem();
  let threw=false; try{ g.draw(); }catch(e){ threw=true; console.log('    draw threw in '+st+': '+e.message); }
  ok('draw() runs in '+st, !threw);
});

// (i) deterministic: same seed -> same first items
function firstItems(seed,n){
  g.reset(seed); g.game.wave=1; g.game.spawnSeq=0;
  const out=[];
  for(let i=0;i<n;i++){ const it=g.spawnItem(); out.push(it.kind+'|'+it.text+'|'+it.x.toFixed(2)); }
  return out;
}
const A=firstItems(1337,12).join(',');
const B=firstItems(1337,12).join(',');
const C=firstItems(424242,12).join(',');
ok('same seed -> identical first items', A===B);
ok('different seed -> different stream', A!==C);

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail===0?0:1);
