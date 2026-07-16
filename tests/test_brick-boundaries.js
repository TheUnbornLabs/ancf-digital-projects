const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'..','games','brick-boundaries','index.html'),'utf8');
const stub=el=>new Proxy({},{get(t,p){if(p==='measureText')return ()=>({width:10});if(p==='createLinearGradient'||p==='createRadialGradient')return ()=>({addColorStop(){}});if(p==='canvas')return el;if(p==='getImageData')return ()=>({data:[]});return t[p]!==undefined?t[p]:(()=>{});},set(){return true;}});
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:false,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=function(){return stub(this);};w.requestAnimationFrame=()=>0;w.cancelAnimationFrame=()=>{};w.AudioContext=undefined;w.webkitAudioContext=undefined;}});
const g=dom.window.__game;

let pass=0, fail=0;
function ok(name,cond){ if(cond){pass++; console.log('  ok  '+name);} else {fail++; console.log('FAIL  '+name);} }

// (a) hook exists
ok('hook exists', !!g && typeof g.update==='function' && typeof g.reset==='function');

// (b) reset() -> playing, level built with bricks, lives>0
g.reset();
ok('reset -> playing', g.game.state==='playing');
ok('bricks built', Array.isArray(g.bricks) && g.bricks.length>0);
ok('lives > 0', g.game.lives>0);

// (c) ball moves and bounces off walls (velocity flips at a boundary)
g.reset();
let b=g.balls[0];
b.stuck=false; b.x=b.r; b.y=200; b.vx=-6; b.vy=2; b.trail=[];
let prevX=b.x;
g.update(0.016); // crosses left wall, vx flips to +
ok('ball moves', b.y!==200);
ok('ball bounces off left wall (vx flips +)', b.vx>0);
// top wall
b.x=400; b.y=b.r; b.vx=0; b.vy=-6;
g.update(0.016);
ok('ball bounces off top wall (vy flips +)', b.vy>0);

// (d) hitting a brick decrements/removes it and raises score
g.reset();
let scoreBefore=g.game.score;
let target=g.bricks.find(x=>x.alive && x.maxHp===1) || g.bricks.find(x=>x.alive);
let aliveBefore=g.bricks.filter(x=>x.alive).length;
let maxhp=target.maxHp;
for(let i=0;i<maxhp;i++) g.hitBrick(target);
ok('brick destroyed after maxHp hits', target.alive===false);
ok('score raised on brick hit', g.game.score>scoreBefore);
ok('alive count decreased', g.bricks.filter(x=>x.alive).length < aliveBefore);

// (e) clearing all bricks -> levelComplete or win
g.reset();
g.bricks.forEach(x=>{ x.hp=1; });
g.bricks.forEach(x=>g.hitBrick(x));
let bb=g.balls[0]; bb.stuck=false; bb.vx=1; bb.vy=-1;
g.update(0.016);
ok('cleared all bricks -> win/levelComplete', g.game.state==='levelComplete' || g.game.state==='win');

// (f) ball below paddle loses a life; losing all lives -> gameover
g.reset();
g.game.lives=2;
let lb=g.balls[0]; lb.stuck=false; lb.x=400; lb.y=600; lb.vx=0; lb.vy=5;
g.update(0.016);
ok('ball drop loses a life', g.game.lives===1);
// drain last life — mutate the live balls array (do not reassign the getter)
g.game.lives=1;
g.balls.length=0;
g.balls.push({x:400,y:600,vx:0,vy:5,r:8,stuck:false,trail:[]});
g.update(0.016);
ok('losing all lives -> gameover', g.game.state==='gameover');

// (g) power-up applies effect
g.reset();
let baseW=g.paddle.w;
g.applyPowerup('wide');
ok('wide power-up widens paddle', g.paddle.w>baseW);
g.reset();
let nb=g.balls.length;
g.balls[0].stuck=false; g.balls[0].vx=2; g.balls[0].vy=-4;
g.applyPowerup('multi');
ok('multi power-up adds balls', g.balls.length>nb);
g.reset();
g.applyPowerup('slow');
ok('slow power-up sets slow timer', g.game.slowTimer>0);
g.reset();
let lvb=g.game.lives;
g.applyPowerup('life');
ok('life power-up adds a life', g.game.lives===lvb+1);

// (h) draw() runs in every state
function drawOk(state){ try{ g.setState(state); g.draw(); return true; }catch(e){ return false; } }
g.reset();
ok('draw title', drawOk('title'));
ok('draw playing', drawOk('playing'));
ok('draw paused', drawOk('paused'));
ok('draw gameover', drawOk('gameover'));
ok('draw win', drawOk('win'));
ok('draw levelComplete', drawOk('levelComplete'));

// (i) deterministic level with same seed
let L1=g.genLevel(3), L2=g.genLevel(3);
let same = L1.length===L2.length && L1.every((br,i)=> br.x===L2[i].x && br.y===L2[i].y && br.tier===L2[i].tier && br.label===L2[i].label);
ok('deterministic genLevel (same seed -> same layout)', same);
let L3=g.genLevel(5);
ok('different levels differ', L3.length!==L1.length || !L3.every((br,i)=> L1[i] && br.x===L1[i].x && br.tier===L1[i].tier));
let hasTough = g.genLevel(6).some(br=>br.maxHp>=2);
ok('later level has tough (2-hit) bricks', hasTough);

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
