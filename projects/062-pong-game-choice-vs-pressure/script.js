document.addEventListener('DOMContentLoaded',function(){
try{

var c=document.getElementById('game'),x=c.getContext('2d');c.width=360;c.height=300;
var py=120,ay=120,bx=180,by=150,vx=3,vy=2.4,ps=70,you=0,cpu=0;
function mv(y){py=Math.max(0,Math.min(c.height-ps,y-ps/2));}
c.addEventListener('mousemove',function(e){var r=c.getBoundingClientRect();mv(e.clientY-r.top);});
c.addEventListener('touchmove',function(e){var r=c.getBoundingClientRect();mv(e.touches[0].clientY-r.top);e.preventDefault();},{passive:false});
function loop(){bx+=vx;by+=vy;if(by<6||by>c.height-6)vy=-vy;
ay+=(by-(ay+ps/2))*0.07;ay=Math.max(0,Math.min(c.height-ps,ay));
if(bx<22&&by>py&&by<py+ps)vx=Math.abs(vx);
if(bx>c.height+20){}
if(bx>c.width-22&&by>ay&&by<ay+ps)vx=-Math.abs(vx);
if(bx<0){cpu++;bx=180;by=150;vx=3;}if(bx>c.width){you++;bx=180;by=150;vx=-3;}
x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);
x.fillStyle='#f4f1ec';x.fillRect(8,py,8,ps);x.fillStyle='#8b0000';x.fillRect(c.width-16,ay,8,ps);
x.beginPath();x.fillStyle='#fff';x.arc(bx,by,6,0,7);x.fill();
x.font='14px sans-serif';x.fillText('Choice '+you+'   Pressure '+cpu,110,20);
requestAnimationFrame(loop);}loop();

}catch(e){console.error('project script error',e);}
});
