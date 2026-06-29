document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var c=document.getElementById('game');
if(!c)return;
var x=c.getContext('2d');
c.width=320;c.height=440;
var lanes=[60,160,260],pl=1,obs=[],sp=2.6,score=0,alive=true,t=0,raf=null;
var scoreLabel=document.getElementById('scoreLabel');
var status=document.getElementById('status');
var hi=0;try{hi=parseInt(localStorage.getItem(KEY+':hi')||'0',10)||0;}catch(e){}

function reset(){pl=1;obs=[];sp=2.6;score=0;alive=true;t=0;setStatus('Go! Dodge the red blocks.');}
function setStatus(m){if(status)status.textContent=m;}
function setScore(){if(scoreLabel)scoreLabel.textContent='Freedom passed: '+score+'  ·  Best: '+hi;}
function move(d){if(alive)pl=Math.max(0,Math.min(2,pl+d));}

document.addEventListener('keydown',function(e){
  if(e.key==='ArrowLeft'){move(-1);e.preventDefault();}
  if(e.key==='ArrowRight'){move(1);e.preventDefault();}
});
function tap(e){var r=c.getBoundingClientRect();var cx=(e.touches?e.touches[0].clientX:e.clientX);((cx-r.left)<r.width/2)?move(-1):move(1);}
c.addEventListener('click',tap);
c.addEventListener('touchstart',function(e){e.preventDefault();tap(e);},{passive:false});
var lb=document.getElementById('leftBtn'),rb=document.getElementById('rightBtn');
if(lb)lb.addEventListener('click',function(){move(-1);});
if(rb)rb.addEventListener('click',function(){move(1);});

function gameOver(){
  alive=false;
  if(score>hi){hi=score;try{localStorage.setItem(KEY+':hi',String(hi));}catch(e){}}
  setScore();
  setStatus('Pressure caught you at '+score+'. Best: '+hi+'. Press Restart to try again.');
}
function loop(){
  if(!alive){
    x.fillStyle='rgba(0,0,0,.55)';x.fillRect(0,160,c.width,90);
    x.fillStyle='#fff';x.font='16px system-ui,sans-serif';x.textAlign='center';
    x.fillText('Pressure caught you.',c.width/2,200);
    x.fillText('Tap Restart.',c.width/2,224);
    x.textAlign='left';
    return;
  }
  t++;
  if(t%48===0){obs.push({l:Math.floor(Math.random()*3),y:-40});sp+=0.06;}
  x.fillStyle='#111';x.fillRect(0,0,c.width,c.height);
  x.strokeStyle='#3a3a3a';x.setLineDash([14,14]);
  [110,210].forEach(function(lx){x.beginPath();x.moveTo(lx,0);x.lineTo(lx,c.height);x.stroke();});
  x.setLineDash([]);
  obs.forEach(function(o){
    o.y+=sp;
    x.fillStyle='#b3122a';x.fillRect(lanes[o.l]-18,o.y,36,30);
    if(o.l===pl&&o.y>360&&o.y<410){gameOver();}
  });
  obs=obs.filter(function(o){if(o.y>c.height){score++;setScore();return false;}return true;});
  x.fillStyle='#f4f1ec';x.fillRect(lanes[pl]-16,380,32,30);
  x.fillStyle='#fff';x.font='14px system-ui,sans-serif';
  x.fillText('Freedom passed: '+score,10,22);
  raf=requestAnimationFrame(loop);
}
document.getElementById('restart').addEventListener('click',function(){if(raf)cancelAnimationFrame(raf);reset();setScore();loop();});
reset();setScore();loop();
}catch(e){console.error('project script error',e);}
});
