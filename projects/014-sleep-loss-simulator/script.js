document.addEventListener('DOMContentLoaded',function(){
try{
var need=document.getElementById('need');
var actual=document.getElementById('actual');
var days=document.getElementById('days');
var out=document.getElementById('calcOut');
var presets=document.getElementById('presets');

function num(el,min,max){
  var v=parseFloat(el&&el.value);
  if(isNaN(v))v=0;
  if(typeof min==='number'&&v<min)v=min;
  if(typeof max==='number'&&v>max)v=max;
  return v;
}
function r1(n){return (Math.round(n*10)/10).toString();}

function calc(){
  var nd=num(need,0,12);
  var ac=num(actual,0,12);
  var dy=num(days,0,730);
  var deficit=nd-ac;
  if(deficit<=0){
    out.textContent='No sleep debt in this model — you meet or exceed your nightly need. Nicely done.';
    return;
  }
  var total=deficit*dy;
  var fullNights=nd>0?total/nd:0;
  var lines=[
    'Nightly deficit: '+r1(deficit)+' h',
    'Cumulative sleep debt: '+r1(total)+' h over '+dy+' night'+(dy===1?'':'s'),
    '≈ '+r1(fullNights)+' full nights of sleep missed',
    'Roughly '+r1(deficit*7)+' h short per week'
  ];
  out.textContent=lines.join('\n');
}

[need,actual,days].forEach(function(el){if(el)el.addEventListener('input',calc);});

if(presets)presets.addEventListener('click',function(e){
  var b=e.target.closest('[data-need]');
  if(!b)return;
  need.value=b.getAttribute('data-need');
  actual.value=b.getAttribute('data-actual');
  days.value=b.getAttribute('data-days');
  calc();
});

calc();
}catch(e){console.error('project script error',e);}
});
