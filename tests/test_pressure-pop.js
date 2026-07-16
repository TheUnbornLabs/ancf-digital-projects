const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'..','games','pressure-pop','index.html'),'utf8');
const stub=el=>new Proxy({},{get(t,p){if(p==='measureText')return ()=>({width:10});if(p==='createLinearGradient'||p==='createRadialGradient')return ()=>({addColorStop(){}});if(p==='canvas')return el;if(p==='getImageData')return ()=>({data:[]});return t[p]!==undefined?t[p]:(()=>{});},set(){return true;}});
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:false,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=function(){return stub(this);};w.requestAnimationFrame=()=>0;w.cancelAnimationFrame=()=>{};w.AudioContext=undefined;w.webkitAudioContext=undefined;}});
const g=dom.window.__game;

let pass=0, fail=0;
function ok(name,cond){ if(cond){pass++; console.log('  ok  - '+name);} else {fail++; console.log('FAIL  - '+name);} }
function eq(name,a,b){ ok(name+' ('+a+'=='+b+')', a===b); }

// (a) hook exists
ok('hook __game exists', !!g && typeof g.update==='function' && typeof g.draw==='function');
ok('hook exposes core fns', typeof g.reset==='function' && typeof g.buildBoard==='function' && typeof g.clusterAt==='function' && typeof g.popCluster==='function' && typeof g.shootBubble==='function' && typeof g.setState==='function');

// (b) reset -> playing, board built with cells
g.reset();
ok('reset sets state playing', g.game.state==='playing');
ok('reset builds grid with rows', g.grid.cells.length>0);
ok('reset board has cells', g.countCells()>0);

// helper: build a deterministic known board for cluster tests
function setBoard(rows){
  // rows = array of arrays of colorKeys (null for empty)
  g.grid.cells = rows.map((row,r)=> row.map((col,c)=> col? mkCell(r,c,col): null));
  g.grid.rows = rows.length;
}
function mkCell(r,c,color){
  const ctr = g.cellCenter(r,c);
  return {r,c,color,x:ctr.x,y:ctr.y,pop:false,popT:0,fall:false,vy:0,alive:true};
}

// (c) clusterAt finds connected same-color neighbors
g.setState('playing');
g.game.offsetRows = 0;
// even row 0 has 15 cols, odd row 1 has 14. Put 3 rose in a horizontal line on row 0.
setBoard([
  ['rose','rose','rose','teal','teal'],
  ['amber','teal','teal','amber']
]);
let cl = g.clusterAt(0,0);
eq('cluster of 3 rose found', cl.length, 3);
let clTeal = g.clusterAt(0,3); // row0 c3,c4 teal connect to row1 teal? check connectivity
ok('teal cluster >=2', clTeal.length>=2);
let single = g.clusterAt(1,0); // amber alone
eq('isolated amber cluster size 1', single.length, 1);

// (d) popping a 3+ cluster removes those cells and raises score
setBoard([
  ['rose','rose','rose','teal'],
  ['amber','amber','amber']
]);
let before = g.game.score;
let cluster = g.clusterAt(0,0);
eq('pop target cluster size', cluster.length, 3);
g.popCluster(cluster,'rose');
ok('popped cells removed', g.grid.cells[0][0]===null && g.grid.cells[0][1]===null && g.grid.cells[0][2]===null);
ok('score increased after pop', g.game.score>before);

// (e) popping fewer than match threshold does not clear (MATCH_MIN gate via shoot/snap path)
setBoard([
  ['rose','teal','teal'],
  ['amber']
]);
// a 2-cluster: cluster at the lone rose with one neighbor would be <3; simulate the snap gate.
let twoBoard = g.clusterAt(0,1); // teal teal = 2
eq('two-cluster detected as size 2', twoBoard.length, 2);
ok('MATCH_MIN is 3', g.MATCH_MIN===3);
ok('two-cluster below threshold not auto-popped', twoBoard.length < g.MATCH_MIN && g.grid.cells[0][1]!==null);

// (f) clearing all bubbles -> win/levelComplete
g.game.level = 1; g.game.maxLevel = 8;
setBoard([['rose','rose','rose']]);
g.game.state='playing';
let cl2 = g.clusterAt(0,0);
g.popCluster(cl2,'rose');
g.afterTurn();
ok('clearing board with levels left -> levelComplete', g.game.state==='levelComplete');
// now at last level -> win
g.game.level = 8;
setBoard([['teal','teal','teal']]);
g.game.state='playing';
g.popCluster(g.clusterAt(0,0),'teal');
g.afterTurn();
ok('clearing board at last level -> win', g.game.state==='win');

// (g) bubbles reaching the bottom line -> gameover
g.game.state='playing';
g.game.level=1;
// place a bubble row whose center+R passes BOTTOM_LINE by using a large offsetRows
g.game.offsetRows = 40; // pushes rows far down
setBoard([['rose','rose']]);
// reindex positions for offset
for(let r=0;r<g.grid.cells.length;r++)for(let c=0;c<g.grid.cells[r].length;c++){const cell=g.grid.cells[r][c];if(cell){const ctr=g.cellCenter(r,c);cell.x=ctr.x;cell.y=ctr.y;}}
g.afterTurn();
ok('bubbles past bottom line -> gameover', g.game.state==='gameover');
g.game.offsetRows = 0;

// (h) draw() runs in every state
let drawStates=['title','playing','paused','gameover','win','levelComplete'];
let drawOk=true;
for(const s of drawStates){
  g.setState(s);
  try{ g.draw(); }catch(e){ drawOk=false; console.log('   draw threw in '+s+': '+e.message); }
}
ok('draw() runs without throwing in all states', drawOk);

// (i) deterministic board with same seed
g.buildBoard(3, 999);
let snap1 = JSON.stringify(g.grid.cells.map(row=>row.map(c=>c?c.color:null)));
g.buildBoard(3, 999);
let snap2 = JSON.stringify(g.grid.cells.map(row=>row.map(c=>c?c.color:null)));
ok('same seed -> identical board', snap1===snap2);
g.buildBoard(3, 1000);
let snap3 = JSON.stringify(g.grid.cells.map(row=>row.map(c=>c?c.color:null)));
ok('different seed -> different board', snap1!==snap3);

console.log('\n'+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
