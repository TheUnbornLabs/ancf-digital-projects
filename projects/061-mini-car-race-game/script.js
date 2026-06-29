document.addEventListener('DOMContentLoaded',function(){
try{

var c=document.getElementById('game'),x=c.getContext('2d');c.width=320;c.height=440;
var lanes=[60,160,260],pl=1,obs=[],sp=2.6,score=0,alive=true,t=0;
function reset(){pl=1;obs=[];sp=2.6;score=0;alive=true;t=0;}
function move(d){pl=Math.max(0,Math.min(2,pl+d));}
document.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);});
c.addEventListener('click',function(e){var r=c.getBoundingClientRect();(e.clientX-r.left< c.width/2)?move(-1):move(1);});
function loop(){if(!alive){x.fillStyle='#fff';x.font='16px sans-serif';x.fillText('Pressure caught you. Tap Restart.',30,210);return;}
t++;if(t%48===0){obs.push({l:Math.floor(Math.random()*3),y:-40});sp+=0.06;}
x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);
x.strokeStyle='#3a3a3a';x.setLineDash([14,14]);[110,210].forEach(function(lx){x.beginPath();x.moveTo(lx,0);x.lineTo(lx,c.height);x.stroke();});x.setLineDash([]);
obs.forEach(function(o){o.y+=sp;x.fillStyle='#8b0000';x.fillRect(lanes[o.l]-18,o.y,36,30);
if(o.l===pl&&o.y>360&&o.y<410)alive=false;});
obs=obs.filter(function(o){if(o.y>c.height){score++;return false;}return true;});
x.fillStyle='#f4f1ec';x.fillRect(lanes[pl]-16,380,32,30);
x.fillStyle='#fff';x.font='14px sans-serif';x.fillText('Freedom passed: '+score,10,22);
requestAnimationFrame(loop);}
document.getElementById('restart').addEventListener('click',function(){reset();loop();});
loop();

}catch(e){console.error('project script error',e);}
});
