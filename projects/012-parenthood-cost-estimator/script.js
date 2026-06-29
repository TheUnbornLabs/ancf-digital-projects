document.addEventListener('DOMContentLoaded',function(){
try{
var ids=['yearly','years','kids','inflation'];
var inputs={};
ids.forEach(function(id){inputs[id]=document.getElementById(id);});
var out=document.getElementById('calcOut');

function num(el,min,max){
  var v=parseFloat(el&&el.value);
  if(isNaN(v))v=0;
  if(typeof min==='number'&&v<min)v=min;
  if(typeof max==='number'&&v>max)v=max;
  return v;
}
function fmt(n){return Math.round(n).toLocaleString();}

function calc(){
  var yearly=num(inputs.yearly,0);
  var years=num(inputs.years,0,30);
  var kids=num(inputs.kids,0,12);
  var inflation=num(inputs.inflation,0,20);
  var i=inflation/100;

  var flatPerChild=yearly*years;
  var flatTotal=flatPerChild*kids;
  var adjPerChild=(i===0)?flatPerChild:yearly*((Math.pow(1+i,years)-1)/i);
  var adjTotal=adjPerChild*kids;
  var months=years*12;
  var avgMonthly=months>0?flatTotal/months:0;

  if(kids===0||years===0){
    out.textContent='Set years of support and number of children above 0 to see an estimate.';
    return;
  }
  var lines=[
    'Flat estimate (today\'s prices):',
    '  per child: '+fmt(flatPerChild),
    '  all '+kids+' child'+(kids>1?'ren':'')+': '+fmt(flatTotal),
    '  average per month (per child): '+fmt(flatPerChild/months),
    '',
    'Inflation-adjusted ('+inflation+'%/yr):',
    '  per child: '+fmt(adjPerChild),
    '  all '+kids+' child'+(kids>1?'ren':'')+': '+fmt(adjTotal)
  ];
  out.textContent=lines.join('\n');
}

ids.forEach(function(id){if(inputs[id])inputs[id].addEventListener('input',calc);});
calc();
}catch(e){console.error('project script error',e);}
});
