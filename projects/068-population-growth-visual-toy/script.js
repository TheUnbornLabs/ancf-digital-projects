document.addEventListener('DOMContentLoaded',function(){
try{

var c=document.getElementById('game'),x=c.getContext('2d');c.width=360;c.height=220;
var s=document.getElementById('rate'),o=document.getElementById('rOut');
function draw(){var r=parseFloat(s.value);var n=1,pts=[];for(var y=0;y<30;y++){pts.push(n);n=n*(1+r/100);}
o.textContent='Growth rate '+r+'% / step → after 30 steps, 1 unit becomes '+n.toFixed(1)+' units.';
x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);var max=pts[pts.length-1];
x.strokeStyle='#b3122a';x.lineWidth=2;x.beginPath();
pts.forEach(function(v,i){var px=10+i*(340/29),py=210-(v/max)*195;i?x.lineTo(px,py):x.moveTo(px,py);});x.stroke();
x.fillStyle='#5d5d5d';x.font='12px sans-serif';x.fillText('exponential curve',12,18);}
s.addEventListener('input',draw);draw();

}catch(e){console.error('project script error',e);}
});
