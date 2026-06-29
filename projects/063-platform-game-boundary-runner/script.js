document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var cv=document.getElementById('game'),ctx=cv&&cv.getContext('2d');
var scoreEl=document.getElementById('score'),bestEl=document.getElementById('best'),msg=document.getElementById('msg');
var W=360,H=200,ground=160,player={x:40,y:ground,vy:0,w:26,h:30,onGround:true},obs=[],score=0,speed=3.2,spawnT=0,playing=false,best=0,raf=null;
try{best=parseInt(A.get?A.get('best','0'):'0',10)||0;}catch(e){}if(bestEl)bestEl.textContent=best;
function reset(){player.y=ground;player.vy=0;player.onGround=true;obs=[];score=0;speed=3.2;spawnT=0;}
function jump(){if(player.onGround){player.vy=-9.2;player.onGround=false;}}
function draw(){
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#0c0c0e';ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(255,255,255,.2)';ctx.beginPath();ctx.moveTo(0,ground+2);ctx.lineTo(W,ground+2);ctx.stroke();
  ctx.fillStyle='#e23a52';obs.forEach(function(o){ctx.fillRect(o.x,ground-o.h,o.w,o.h);});
  ctx.fillStyle='#2f9e9e';ctx.fillRect(player.x,player.y-player.h,player.w,player.h);
}
function over(){playing=false;if(raf)cancelAnimationFrame(raf);if(score>best){best=score;if(A.set)A.set('best',String(best));if(bestEl)bestEl.textContent=best;}if(msg)msg.textContent='Tripped! Distance '+score+'. Press Start to run again.';}
function loop(){
  if(!playing)return;
  player.vy+=0.6;player.y+=player.vy;if(player.y>=ground){player.y=ground;player.vy=0;player.onGround=true;}
  spawnT++;if(spawnT>Math.max(70-Math.floor(score/60),36)){spawnT=0;obs.push({x:W,w:16+Math.random()*14,h:18+Math.random()*22});}
  for(var i=obs.length-1;i>=0;i--){var o=obs[i];o.x-=speed;if(o.x+o.w<0){obs.splice(i,1);continue;}
    if(player.x<o.x+o.w&&player.x+player.w>o.x&&player.y>ground-o.h){return over();}}
  score++;if(score%200===0)speed+=0.4;if(scoreEl)scoreEl.textContent=score;
  draw();raf=requestAnimationFrame(loop);
}
function start(){if(playing)return;reset();playing=true;if(msg)msg.textContent='Run! Jump the red blocks.';draw();raf=requestAnimationFrame(loop);}
var startBtn=document.getElementById('startBtn'),jumpBtn=document.getElementById('jumpBtn');
if(startBtn)startBtn.addEventListener('click',start);
if(jumpBtn)jumpBtn.addEventListener('click',function(){if(!playing)start();jump();});
if(cv)cv.addEventListener('click',function(){if(!playing)start();jump();});
document.addEventListener('keydown',function(e){if(e.key===' '||e.key==='ArrowUp'||e.key==='w'||e.key==='W'){e.preventDefault();if(!playing)start();jump();}});
if(ctx){reset();draw();}

var ta=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),t2=null;
function flash2(m){if(!refStatus)return;refStatus.textContent=m;if(t2)clearTimeout(t2);t2=setTimeout(function(){refStatus.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash2('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ta?ta.value:'',copyRef);});
}catch(e){console.error('project 063 script error',e);}
});
