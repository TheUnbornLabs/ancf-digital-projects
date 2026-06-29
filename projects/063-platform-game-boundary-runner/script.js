document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var c=document.getElementById('game');if(!c)return;
var x=c.getContext('2d');c.width=360;c.height=240;
var gy=190,py,vy,obs,sp,score,alive,t,raf;
var scoreLabel=document.getElementById('scoreLabel');
var status=document.getElementById('status');
var hi=0;try{hi=parseInt(localStorage.getItem(KEY+':hi')||'0',10)||0;}catch(e){}
function setScore(){if(scoreLabel)scoreLabel.textContent='Boundaries kept: '+score+'  ·  Best: '+hi;}
function setStatus(m){if(status)status.textContent=m;}
function reset(){py=gy;vy=0;obs=[];sp=3;score=0;alive=true;t=0;setStatus('Run! Jump the red blocks.');}
function hop(){if(alive&&py>=gy){vy=-9;}}
document.addEventListener('keydown',function(e){if(e.code==='Space'){hop();e.preventDefault();}});
c.addEventListener('click',hop);
c.addEventListener('touchstart',function(e){e.preventDefault();hop();},{passive:false});
var jb=document.getElementById('jumpBtn');if(jb)jb.addEventListener('click',hop);
function gameOver(){
  alive=false;
  if(score>hi){hi=score;try{localStorage.setItem(KEY+':hi',String(hi));}catch(e){}}
  setScore();
  setStatus('Tripped at '+score+'. Best: '+hi+'. Press Restart.');
}
function loop(){
  if(!alive){
    x.fillStyle='rgba(0,0,0,.55)';x.fillRect(0,90,c.width,60);
    x.fillStyle='#fff';x.font='15px system-ui,sans-serif';x.textAlign='center';
    x.fillText('Tripped on a boundary. Tap Restart.',c.width/2,124);x.textAlign='left';
    return;
  }
  t++;vy+=0.6;py+=vy;if(py>gy){py=gy;vy=0;}
  if(t%70===0){obs.push({x:c.width,w:16+Math.random()*14});sp+=0.05;}
  x.fillStyle='#111';x.fillRect(0,0,c.width,c.height);
  x.fillStyle='#3a3a3a';x.fillRect(0,gy+24,c.width,4);
  obs.forEach(function(o){
    o.x-=sp;x.fillStyle='#b3122a';x.fillRect(o.x,gy,o.w,24);
    if(o.x<46&&o.x+o.w>22&&py>=gy-2){gameOver();}
  });
  obs=obs.filter(function(o){if(o.x+o.w<0){score++;setScore();return false;}return true;});
  x.fillStyle='#f4f1ec';x.fillRect(22,py,22,24);
  x.fillStyle='#fff';x.font='14px system-ui,sans-serif';x.fillText('Boundaries kept: '+score,10,20);
  raf=requestAnimationFrame(loop);
}
document.getElementById('restart').addEventListener('click',function(){if(raf)cancelAnimationFrame(raf);reset();setScore();loop();});
reset();setScore();loop();
}catch(e){console.error('project script error',e);}
});
