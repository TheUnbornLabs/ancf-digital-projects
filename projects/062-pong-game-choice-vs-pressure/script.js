document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var cv=document.getElementById('game'),ctx=cv&&cv.getContext('2d');
var scoreEl=document.getElementById('score'),bestEl=document.getElementById('best'),msg=document.getElementById('msg');
var W=320,H=360,pad={w:74,h:12,x:123},ball={x:160,y:80,vx:2.6,vy:2.8,r:8},score=0,playing=false,best=0,raf=null,move=0;
try{best=parseInt(A.get?A.get('best','0'):'0',10)||0;}catch(e){}if(bestEl)bestEl.textContent=best;
function reset(){pad.x=123;ball.x=160;ball.y=80;ball.vx=(Math.random()>.5?1:-1)*2.6;ball.vy=2.8;score=0;}
function draw(){
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#0c0c0e';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#2f9e9e';ctx.fillRect(pad.x,H-pad.h-6,pad.w,pad.h);
  ctx.beginPath();ctx.fillStyle='#e23a52';ctx.arc(ball.x,ball.y,ball.r,0,7);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.25)';ctx.font='12px system-ui';ctx.fillText('Choice',ball.x-18,ball.y-14);
}
function over(){playing=false;if(raf)cancelAnimationFrame(raf);if(score>best){best=score;if(A.set)A.set('best',String(best));if(bestEl)bestEl.textContent=best;}if(msg)msg.textContent='Dropped! Rally '+score+'. Press Start to try again.';}
function loop(){
  if(!playing)return;
  pad.x+=move*5;pad.x=Math.max(0,Math.min(W-pad.w,pad.x));
  ball.x+=ball.vx;ball.y+=ball.vy;
  if(ball.x<ball.r){ball.x=ball.r;ball.vx*=-1;}if(ball.x>W-ball.r){ball.x=W-ball.r;ball.vx*=-1;}
  if(ball.y<ball.r){ball.y=ball.r;ball.vy*=-1;}
  if(ball.y>H-pad.h-6-ball.r){
    if(ball.x>pad.x-ball.r&&ball.x<pad.x+pad.w+ball.r){ball.y=H-pad.h-6-ball.r;ball.vy*=-1;ball.vy-=0.12;ball.vx+=(ball.x-(pad.x+pad.w/2))*0.03;score++;if(scoreEl)scoreEl.textContent=score;}
    else if(ball.y>H){return over();}
  }
  draw();raf=requestAnimationFrame(loop);
}
function start(){if(playing)return;reset();playing=true;if(msg)msg.textContent='Keep it up!';draw();raf=requestAnimationFrame(loop);}
var startBtn=document.getElementById('startBtn'),L=document.getElementById('left'),R=document.getElementById('right');
if(startBtn)startBtn.addEventListener('click',start);
function press(d){move=d;if(!playing&&d)start();}
if(L){L.addEventListener('mousedown',function(){press(-1);});L.addEventListener('mouseup',function(){move=0;});L.addEventListener('touchstart',function(e){e.preventDefault();press(-1);});L.addEventListener('touchend',function(){move=0;});L.addEventListener('click',function(){pad.x=Math.max(0,pad.x-30);if(!playing)draw();});}
if(R){R.addEventListener('mousedown',function(){press(1);});R.addEventListener('mouseup',function(){move=0;});R.addEventListener('touchstart',function(e){e.preventDefault();press(1);});R.addEventListener('touchend',function(){move=0;});R.addEventListener('click',function(){pad.x=Math.min(W-pad.w,pad.x+30);if(!playing)draw();});}
document.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){e.preventDefault();press(-1);}else if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){e.preventDefault();press(1);}});
document.addEventListener('keyup',function(e){if(['ArrowLeft','ArrowRight','a','A','d','D'].indexOf(e.key)>=0)move=0;});
if(ctx){reset();draw();}

var ta=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),t2=null;
function flash2(m){if(!refStatus)return;refStatus.textContent=m;if(t2)clearTimeout(t2);t2=setTimeout(function(){refStatus.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash2('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ta?ta.value:'',copyRef);});
}catch(e){console.error('project 062 script error',e);}
});
