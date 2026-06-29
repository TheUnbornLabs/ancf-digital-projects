document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var cv=document.getElementById('game'),ctx=cv&&cv.getContext('2d');
var scoreEl=document.getElementById('score'),bestEl=document.getElementById('best'),msg=document.getElementById('msg');
var W=320,H=320,p={x:160,y:160,r:10},token={x:80,y:80,r:7},chasers=[],score=0,best=0,playing=false,raf=null,vx=0,vy=0,cspeed=1.3;
try{best=parseInt(A.get?A.get('best','0'):'0',10)||0;}catch(e){}if(bestEl)bestEl.textContent=best;
function rnd(m){return 20+Math.random()*(m-40);}
function reset(){p.x=160;p.y=160;token.x=rnd(W);token.y=rnd(H);chasers=[{x:20,y:20},{x:W-20,y:H-20}];score=0;cspeed=1.3;vx=vy=0;}
function draw(){
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#0c0c0e';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#f0b429';ctx.beginPath();ctx.arc(token.x,token.y,token.r,0,7);ctx.fill();
  ctx.fillStyle='#e23a52';chasers.forEach(function(c){ctx.beginPath();ctx.arc(c.x,c.y,9,0,7);ctx.fill();});
  ctx.fillStyle='#2f9e9e';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();
}
function over(){playing=false;if(raf)cancelAnimationFrame(raf);if(score>best){best=score;if(A.set)A.set('best',String(best));if(bestEl)bestEl.textContent=best;}if(msg)msg.textContent='Caught! Tokens '+score+'. Press Start to play again.';}
function loop(){
  if(!playing)return;
  p.x=Math.max(p.r,Math.min(W-p.r,p.x+vx*3));p.y=Math.max(p.r,Math.min(H-p.r,p.y+vy*3));
  var dx=token.x-p.x,dy=token.y-p.y;if(dx*dx+dy*dy<(p.r+token.r)*(p.r+token.r)){score++;if(scoreEl)scoreEl.textContent=score;token.x=rnd(W);token.y=rnd(H);cspeed+=0.07;}
  chasers.forEach(function(c){var a=p.x-c.x,b=p.y-c.y,d=Math.sqrt(a*a+b*b)||1;c.x+=a/d*cspeed;c.y+=b/d*cspeed;if(a*a+b*b<(p.r+9)*(p.r+9))return over();});
  draw();raf=requestAnimationFrame(loop);
}
function start(){if(playing)return;reset();playing=true;if(msg)msg.textContent='Collect gold, dodge red!';draw();raf=requestAnimationFrame(loop);}
var keys={};
document.addEventListener('keydown',function(e){var k=e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(k)>=0)e.preventDefault();setDir(k,true);if(!playing&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].indexOf(k)>=0)start();});
document.addEventListener('keyup',function(e){setDir(e.key,false);});
function setDir(k,on){var v=on?1:0;if(k==='ArrowLeft'||k==='a'||k==='A')vx=on?-1:(vx<0?0:vx);else if(k==='ArrowRight'||k==='d'||k==='D')vx=on?1:(vx>0?0:vx);else if(k==='ArrowUp'||k==='w'||k==='W')vy=on?-1:(vy<0?0:vy);else if(k==='ArrowDown'||k==='s'||k==='S')vy=on?1:(vy>0?0:vy);}
function padBtn(id,fx,fy){var b=document.getElementById(id);if(!b)return;function dn(e){if(e)e.preventDefault();if(!playing)start();vx=fx;vy=fy;}function up(){if(fx)vx=0;if(fy)vy=0;}b.addEventListener('mousedown',dn);b.addEventListener('mouseup',up);b.addEventListener('mouseleave',up);b.addEventListener('touchstart',dn);b.addEventListener('touchend',up);}
padBtn('up',0,-1);padBtn('dwn',0,1);padBtn('lft',-1,0);padBtn('rgt',1,0);
var startBtn=document.getElementById('startBtn');if(startBtn)startBtn.addEventListener('click',start);
if(ctx){reset();draw();}

var ta=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),t2=null;
function flash2(m){if(!refStatus)return;refStatus.textContent=m;if(t2)clearTimeout(t2);t2=setTimeout(function(){refStatus.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash2('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ta?ta.value:'',copyRef);});
}catch(e){console.error('project 067 script error',e);}
});
