document.addEventListener('DOMContentLoaded',function(){
try{
var c=document.getElementById('game');if(!c)return;
var x=c.getContext('2d');c.width=380;c.height=220;
var s=document.getElementById('rate'),o=document.getElementById('rOut');
var STEPS=30;
function draw(){
  var r=parseFloat(s.value);
  var exp=[],lin=[],n=1;
  var addPerStep=r/100; // linear adds the same fraction of the start each step
  for(var i=0;i<=STEPS;i++){exp.push(n);lin.push(1+addPerStep*i);n=n*(1+r/100);}
  var fin=exp[STEPS];
  var dbl=r>0?(70/r):Infinity;
  o.textContent='At '+r+'%/step: 1 unit becomes '+fin.toFixed(1)+' after '+STEPS+' steps'+
    (isFinite(dbl)?(' · doubling time ≈ '+dbl.toFixed(0)+' steps.'):' · no growth (flat line).');
  var max=Math.max(exp[STEPS],lin[STEPS],1.0001);
  x.fillStyle='#111';x.fillRect(0,0,c.width,c.height);
  function plot(arr,color,w){
    x.strokeStyle=color;x.lineWidth=w;x.beginPath();
    arr.forEach(function(v,i){var px=12+i*((c.width-24)/STEPS),py=(c.height-14)-(v/max)*(c.height-30);i?x.lineTo(px,py):x.moveTo(px,py);});
    x.stroke();
  }
  plot(lin,'#7d7d7d',1.5);
  plot(exp,'#b3122a',2.5);
  x.fillStyle='#cfcfcf';x.font='12px system-ui,sans-serif';
  x.fillStyle='#b3122a';x.fillText('exponential',12,16);
  x.fillStyle='#9d9d9d';x.fillText('linear',12,32);
}
s.addEventListener('input',draw);
draw();
}catch(e){console.error('project script error',e);}
});
