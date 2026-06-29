document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var cv=document.getElementById('game'),ctx=cv&&cv.getContext('2d');
var scoreEl=document.getElementById('score'),bestEl=document.getElementById('best'),msg=document.getElementById('msg');
var W=300,H=420,laneX=[50,150,250],lane=1,player={w:46,h:64},obstacles=[],score=0,speed=2.4,spawnT=0,playing=false,best=0,raf=null;
try{best=parseInt(A.get?A.get('best','0'):'0',10)||0;}catch(e){}
if(bestEl)bestEl.textContent=best;

function reset(){lane=1;obstacles=[];score=0;speed=2.4;spawnT=0;}
function spawn(){var l=Math.floor(Math.random()*3);obstacles.push({l:l,y:-50});}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
function draw(){
  ctx.clearRect(0,0,W,H);rect(0,0,W,H,'#0c0c0e');
  ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=2;ctx.setLineDash([14,16]);
  ctx.beginPath();ctx.moveTo(100,0);ctx.lineTo(100,H);ctx.moveTo(200,0);ctx.lineTo(200,H);ctx.stroke();ctx.setLineDash([]);
  obstacles.forEach(function(o){rect(laneX[o.l]-23,o.y,46,46,'#e23a52');});
  var px=laneX[lane]-player.w/2,py=H-90;rect(px,py,player.w,player.h,'#2f9e9e');rect(px+6,py+10,player.w-12,18,'#bdece9');
}
function over(){playing=false;if(raf)cancelAnimationFrame(raf);if(score>best){best=score;if(A.set)A.set('best',String(best));if(bestEl)bestEl.textContent=best;}if(msg)msg.textContent='Crashed! Score '+score+'. Press Start to try again.';}
function loop(){
  if(!playing)return;
  spawnT++;if(spawnT>Math.max(38-Math.floor(score/120),16)){spawnT=0;spawn();}
  for(var i=obstacles.length-1;i>=0;i--){var o=obstacles[i];o.y+=speed;if(o.y>H){obstacles.splice(i,1);continue;}
    if(o.l===lane&&o.y+46>H-90&&o.y<H-90+player.h){return over();}}
  score++;if(score%240===0)speed+=0.5;if(scoreEl)scoreEl.textContent=score;
  draw();raf=requestAnimationFrame(loop);
}
function start(){if(playing)return;reset();playing=true;if(msg)msg.textContent='Go! Dodge the red blocks.';draw();raf=requestAnimationFrame(loop);}
function move(d){lane=Math.max(0,Math.min(2,lane+d));if(!playing)draw();}
var startBtn=document.getElementById('startBtn'),L=document.getElementById('left'),R=document.getElementById('right');
if(startBtn)startBtn.addEventListener('click',start);
if(L)L.addEventListener('click',function(){move(-1);});
if(R)R.addEventListener('click',function(){move(1);});
document.addEventListener('keydown',function(e){
  if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){e.preventDefault();if(!playing)start();move(-1);}
  else if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){e.preventDefault();if(!playing)start();move(1);}
});
if(ctx){reset();draw();}

/* reflection */
var ta=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),t2=null;
function flash2(m){if(!refStatus)return;refStatus.textContent=m;if(t2)clearTimeout(t2);t2=setTimeout(function(){refStatus.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash2('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ta?ta.value:'',copyRef);});
}catch(e){console.error('project 061 script error',e);}
});
