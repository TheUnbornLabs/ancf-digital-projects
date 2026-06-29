document.addEventListener('DOMContentLoaded',function(){
try{

var c=document.getElementById('game'),x=c.getContext('2d');c.width=360;c.height=240;
var gy=190,py=gy,vy=0,jump=false,obs=[],sp=3,score=0,alive=true,t=0;
function hop(){if(py>=gy){vy=-9;}}
document.addEventListener('keydown',function(e){if(e.code==='Space')hop();});
c.addEventListener('click',hop);
function reset(){py=gy;vy=0;obs=[];sp=3;score=0;alive=true;t=0;}
function loop(){if(!alive){x.fillStyle='#fff';x.font='16px sans-serif';x.fillText('Tripped on a boundary. Tap Restart.',40,120);return;}
t++;vy+=0.6;py+=vy;if(py>gy){py=gy;vy=0;}
if(t%70===0){obs.push({x:c.width,w:16+Math.random()*14});sp+=0.05;}
x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);x.fillStyle='#3a3a3a';x.fillRect(0,gy+24,c.width,4);
obs.forEach(function(o){o.x-=sp;x.fillStyle='#8b0000';x.fillRect(o.x,gy,o.w,24);
if(o.x<46&&o.x+o.w>22&&py>=gy-2)alive=false;});
obs=obs.filter(function(o){if(o.x+o.w<0){score++;return false;}return true;});
x.fillStyle='#f4f1ec';x.fillRect(22,py,22,24);
x.fillStyle='#fff';x.font='14px sans-serif';x.fillText('Boundaries kept: '+score,10,20);
requestAnimationFrame(loop);}
document.getElementById('restart').addEventListener('click',function(){reset();loop();});loop();

}catch(e){console.error('project script error',e);}
});
