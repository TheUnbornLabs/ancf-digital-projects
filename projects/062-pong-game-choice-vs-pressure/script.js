document.addEventListener('DOMContentLoaded',function(){
try{
var c=document.getElementById('game');if(!c)return;
var x=c.getContext('2d');c.width=360;c.height=300;
var ps=70,py,ay,bx,by,vx,vy,you,cpu,running,kbd=0;
var scoreLabel=document.getElementById('scoreLabel');
var status=document.getElementById('status');
function setScore(){if(scoreLabel)scoreLabel.textContent='Choice '+you+' · Pressure '+cpu;}
function setStatus(m){if(status)status.textContent=m;}
function reset(){py=115;ay=115;you=0;cpu=0;running=true;serve(1);setStatus('First to 7 — keep the rally going.');}
function serve(dir){bx=180;by=150;vx=3*dir;vy=(Math.random()*3-1.5);}
function mv(y){py=Math.max(0,Math.min(c.height-ps,y-ps/2));}
c.addEventListener('mousemove',function(e){var r=c.getBoundingClientRect();mv((e.clientY-r.top)*(c.height/r.height));});
c.addEventListener('touchmove',function(e){var r=c.getBoundingClientRect();mv((e.touches[0].clientY-r.top)*(c.height/r.height));e.preventDefault();},{passive:false});
document.addEventListener('keydown',function(e){if(e.key==='ArrowUp')kbd=-1;if(e.key==='ArrowDown')kbd=1;});
document.addEventListener('keyup',function(e){if(e.key==='ArrowUp'||e.key==='ArrowDown')kbd=0;});

function loop(){
  if(running){
    if(kbd)py=Math.max(0,Math.min(c.height-ps,py+kbd*6));
    bx+=vx;by+=vy;
    if(by<6){by=6;vy=-vy;}if(by>c.height-6){by=c.height-6;vy=-vy;}
    ay+=(by-(ay+ps/2))*0.06;ay=Math.max(0,Math.min(c.height-ps,ay));
    if(bx<22&&by>py&&by<py+ps){vx=Math.abs(vx);vy+=(by-(py+ps/2))*0.05;}
    if(bx>c.width-22&&by>ay&&by<ay+ps){vx=-Math.abs(vx);}
    if(bx<0){cpu++;setScore();serve(1);}
    if(bx>c.width){you++;setScore();serve(-1);}
    if(you>=7||cpu>=7){running=false;setStatus(you>=7?'You held the rally — Choice wins! Press Restart.':'Pressure edged ahead. Press Restart to try again.');}
  }
  x.fillStyle='#111';x.fillRect(0,0,c.width,c.height);
  x.strokeStyle='#3a3a3a';x.setLineDash([8,10]);x.beginPath();x.moveTo(c.width/2,0);x.lineTo(c.width/2,c.height);x.stroke();x.setLineDash([]);
  x.fillStyle='#f4f1ec';x.fillRect(8,py,8,ps);
  x.fillStyle='#b3122a';x.fillRect(c.width-16,ay,8,ps);
  x.beginPath();x.fillStyle='#fff';x.arc(bx,by,6,0,Math.PI*2);x.fill();
  x.font='14px system-ui,sans-serif';x.fillStyle='#fff';
  x.fillText('Choice '+you+'   Pressure '+cpu,c.width/2-70,20);
  if(!running){x.font='16px system-ui,sans-serif';x.textAlign='center';x.fillText(you>=7?'Choice wins!':'Pressure wins',c.width/2,c.height/2);x.textAlign='left';}
  requestAnimationFrame(loop);
}
document.getElementById('restart').addEventListener('click',function(){reset();setScore();});
reset();setScore();loop();
}catch(e){console.error('project script error',e);}
});
