document.addEventListener('DOMContentLoaded',function(){
try{

var c=document.getElementById('game'),x=c.getContext('2d');c.width=320;c.height=320;
var p={x:160,y:160},toks=[],foes=[],score=0,alive=true,keys={};
for(var i=0;i<5;i++)toks.push({x:30+Math.random()*260,y:30+Math.random()*260});
for(var j=0;j<3;j++)foes.push({x:Math.random()*320,y:Math.random()*320});
document.addEventListener('keydown',function(e){keys[e.key]=true;});
document.addEventListener('keyup',function(e){keys[e.key]=false;});
c.addEventListener('touchmove',function(e){var r=c.getBoundingClientRect();p.x=e.touches[0].clientX-r.left;p.y=e.touches[0].clientY-r.top;e.preventDefault();},{passive:false});
function reset(){p={x:160,y:160};score=0;alive=true;toks=[];for(var i=0;i<5;i++)toks.push({x:30+Math.random()*260,y:30+Math.random()*260});}
function loop(){if(!alive){x.fillStyle='#fff';x.font='16px sans-serif';x.fillText('Caught. Freedom: '+score+'. Tap Restart.',24,160);return;}
if(keys['ArrowUp'])p.y-=3;if(keys['ArrowDown'])p.y+=3;if(keys['ArrowLeft'])p.x-=3;if(keys['ArrowRight'])p.x+=3;
p.x=Math.max(8,Math.min(312,p.x));p.y=Math.max(8,Math.min(312,p.y));
x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);
toks.forEach(function(o){x.fillStyle='#f4f1ec';x.beginPath();x.arc(o.x,o.y,6,0,7);x.fill();
if(Math.hypot(o.x-p.x,o.y-p.y)<14){o.x=30+Math.random()*260;o.y=30+Math.random()*260;score++;}});
foes.forEach(function(f){f.x+=(p.x-f.x)*0.012;f.y+=(p.y-f.y)*0.012;x.fillStyle='#8b0000';x.fillRect(f.x-9,f.y-9,18,18);
if(Math.hypot(f.x-p.x,f.y-p.y)<16)alive=false;});
x.fillStyle='#b3122a';x.beginPath();x.arc(p.x,p.y,9,0,7);x.fill();
x.fillStyle='#fff';x.font='14px sans-serif';x.fillText('Freedom tokens: '+score,10,20);
requestAnimationFrame(loop);}
document.getElementById('restart').addEventListener('click',reset);loop();

}catch(e){console.error('project script error',e);}
});
