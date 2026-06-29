document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var c=document.getElementById('game');if(!c)return;
var x=c.getContext('2d');c.width=320;c.height=320;
var p,toks,foes,score,alive,keys={},raf;
var scoreLabel=document.getElementById('scoreLabel');
var status=document.getElementById('status');
var hi=0;try{hi=parseInt(localStorage.getItem(KEY+':hi')||'0',10)||0;}catch(e){}
function setScore(){if(scoreLabel)scoreLabel.textContent='Freedom tokens: '+score+'  ·  Best: '+hi;}
function setStatus(m){if(status)status.textContent=m;}
function spawnToks(){toks=[];for(var i=0;i<5;i++)toks.push({x:30+Math.random()*260,y:30+Math.random()*260});}
function reset(){p={x:160,y:160};score=0;alive=true;spawnToks();foes=[];for(var j=0;j<3;j++)foes.push({x:Math.random()*320,y:Math.random()*320});setStatus('Go! Collect tokens, dodge the red squares.');}
document.addEventListener('keydown',function(e){if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key)>=0){keys[e.key]=true;e.preventDefault();}});
document.addEventListener('keyup',function(e){keys[e.key]=false;});
c.addEventListener('touchmove',function(e){var r=c.getBoundingClientRect();p.x=(e.touches[0].clientX-r.left)*(c.width/r.width);p.y=(e.touches[0].clientY-r.top)*(c.height/r.height);e.preventDefault();},{passive:false});
function gameOver(){alive=false;if(score>hi){hi=score;try{localStorage.setItem(KEY+':hi',String(hi));}catch(e){}}setScore();setStatus('Caught at '+score+' tokens. Best: '+hi+'. Press Restart.');}
function loop(){
  if(!alive){
    x.fillStyle='rgba(0,0,0,.55)';x.fillRect(0,130,c.width,60);
    x.fillStyle='#fff';x.font='15px system-ui,sans-serif';x.textAlign='center';
    x.fillText('Caught! Freedom: '+score+'. Tap Restart.',c.width/2,165);x.textAlign='left';
    return;
  }
  if(keys['ArrowUp'])p.y-=3;if(keys['ArrowDown'])p.y+=3;if(keys['ArrowLeft'])p.x-=3;if(keys['ArrowRight'])p.x+=3;
  p.x=Math.max(8,Math.min(312,p.x));p.y=Math.max(8,Math.min(312,p.y));
  x.fillStyle='#111';x.fillRect(0,0,c.width,c.height);
  toks.forEach(function(o){x.fillStyle='#f4f1ec';x.beginPath();x.arc(o.x,o.y,6,0,Math.PI*2);x.fill();if(Math.hypot(o.x-p.x,o.y-p.y)<14){o.x=30+Math.random()*260;o.y=30+Math.random()*260;score++;setScore();}});
  foes.forEach(function(f){f.x+=(p.x-f.x)*0.013;f.y+=(p.y-f.y)*0.013;x.fillStyle='#b3122a';x.fillRect(f.x-9,f.y-9,18,18);if(Math.hypot(f.x-p.x,f.y-p.y)<16){gameOver();}});
  x.fillStyle='#e23a52';x.beginPath();x.arc(p.x,p.y,9,0,Math.PI*2);x.fill();
  x.fillStyle='#fff';x.font='14px system-ui,sans-serif';x.fillText('Freedom tokens: '+score,10,20);
  raf=requestAnimationFrame(loop);
}
document.getElementById('restart').addEventListener('click',function(){if(raf)cancelAnimationFrame(raf);reset();setScore();loop();});
reset();setScore();loop();
}catch(e){console.error('project script error',e);}
});
