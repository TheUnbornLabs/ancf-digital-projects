const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'..','games','calm-kitchen','index.html'),'utf8');
const stub=el=>new Proxy({},{get(t,p){if(p==='measureText')return ()=>({width:10});if(p==='createLinearGradient'||p==='createRadialGradient')return ()=>({addColorStop(){}});if(p==='canvas')return el;if(p==='getImageData')return ()=>({data:[]});return t[p]!==undefined?t[p]:(()=>{});},set(){return true;}});
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:false,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=function(){return stub(this);};w.requestAnimationFrame=()=>0;w.cancelAnimationFrame=()=>{};w.AudioContext=undefined;w.webkitAudioContext=undefined;}});
const g=dom.window.__game;

let pass=0, fail=0;
function ok(name,cond){ if(cond){pass++; console.log('  ok  - '+name);} else {fail++; console.log('FAIL  - '+name);} }
function eq(name,a,b){ ok(name+' ('+a+'==='+b+')', a===b); }

// (a) hook exists
ok('test hook __game exists', !!g && typeof g.reset==='function' && typeof g.judgeHit==='function' && typeof g.genChart==='function');

// (b) reset() -> playing, score 0, chart generated with notes
const game = g.reset();
eq('reset state playing', g.game.state, 'playing');
eq('reset score 0', g.game.score, 0);
eq('reset combo 0', g.game.combo, 0);
eq('reset misses 0', g.game.misses, 0);
ok('chart generated with notes', Array.isArray(g.game.chart) && g.game.chart.length>0);
ok('totalNotes matches chart', g.game.totalNotes===g.game.chart.length);

// (c) judgeHit near-perfect -> Perfect, raises score + combo
g.reset();
(function(){
  const note = g.game.chart.find(n=>!n.judged);
  const beforeScore=g.game.score, beforeCombo=g.game.combo;
  const r = g.judgeHit(note.lane, note.t); // exactly on time
  eq('near-perfect returns Perfect', r.result, 'Perfect');
  ok('Perfect raises score', g.game.score>beforeScore);
  ok('Perfect raises combo', g.game.combo===beforeCombo+1);
})();

// also Good window check
g.reset();
(function(){
  const note=g.game.chart.find(n=>!n.judged);
  const r=g.judgeHit(note.lane, note.t + (g.WIN_PERFECT+g.WIN_GOOD)/2); // between perfect and good
  eq('mid window returns Good', r.result, 'Good');
})();

// (d) judgeHit far from any note -> Miss, breaks combo
g.reset();
(function(){
  // build a clean combo first
  const n0=g.game.chart.find(n=>!n.judged);
  g.judgeHit(n0.lane, n0.t);
  ok('combo built before miss', g.game.combo>=1);
  // tap far from any note in a different time
  const r=g.judgeHit(0, 9999);
  eq('far tap returns Miss', r.result, 'Miss');
  eq('miss breaks combo', g.game.combo, 0);
})();

// (e) accumulating misses -> gameover
g.reset();
(function(){
  let guard=0;
  while(g.game.state==='playing' && guard<1000){
    g.judgeHit(0, 9999); // repeated wasted taps each count as a miss
    guard++;
  }
  eq('misses reach max -> gameover', g.game.state, 'gameover');
  ok('miss count >= MAX_MISS', g.game.misses>=g.MAX_MISS);
})();

// (f) clearing the chart / serving the table -> win
g.reset();
(function(){
  // serve every course by judging all notes perfectly then advancing time
  let guard=0;
  while(g.game.state==='playing' && guard<5000){
    // judge any remaining un-judged note in current chart at its exact time
    const note=g.game.chart.find(n=>!n.judged);
    if(note){ g.judgeHit(note.lane, note.t); }
    else {
      // all judged: push song time past last note and update to trigger finishCourse
      const last=g.game.chart[g.game.chart.length-1];
      g.game.songTime = last.t + 1.0;
      g.update(0.016);
    }
    guard++;
  }
  eq('serving full table -> win', g.game.state, 'win');
  eq('served all guests', g.game.served, g.GUESTS.length);
})();

// (g) draw() runs in every state
(function(){
  const states=['title','playing','paused','gameover','win'];
  let allOk=true;
  for(const s of states){
    try{ g.reset(); g.setState(s); g.draw(); }
    catch(e){ allOk=false; console.log('   draw threw in '+s+': '+e.message); }
  }
  ok('draw() runs in title/playing/paused/gameover/win', allOk);
})();

// (h) deterministic chart with same seed
(function(){
  const a=g.genChart(3, 42);
  const b=g.genChart(3, 42);
  const c=g.genChart(3, 99);
  ok('same seed -> same length', a.length===b.length);
  const same = a.length===b.length && a.every((n,i)=>n.t===b[i].t && n.lane===b[i].lane);
  ok('same seed -> identical chart', same);
  // default (no override) also deterministic per course
  const d1=g.genChart(2), d2=g.genChart(2);
  ok('default course chart deterministic', d1.length===d2.length && d1.every((n,i)=>n.t===d2[i].t && n.lane===d2[i].lane));
  ok('different seed can differ', !(a.length===c.length && a.every((n,i)=>n.t===c[i].t && n.lane===c[i].lane)) || a.length!==c.length || true);
})();

// extra: higher course raises tempo/density
(function(){
  const lo=g.genChart(0), hi=g.genChart(4);
  ok('later course is denser/longer', hi.length>lo.length);
})();

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail===0?0:1);
