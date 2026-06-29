document.addEventListener('DOMContentLoaded',function(){
try{
var ids=['income','essentials','saverate','growth'];
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
function fmt(n){
  // thousands separators, no decimals
  return Math.round(n).toLocaleString();
}
function fv(annual,g,n){
  if(g===0)return annual*n;
  return annual*((Math.pow(1+g,n)-1)/g);
}
function calc(){
  var income=num(inputs.income,0);
  var essentials=num(inputs.essentials,0);
  var saverate=num(inputs.saverate,0,100);
  var growth=num(inputs.growth,0,30);
  var leftover=income-essentials;
  if(leftover<0){
    out.textContent='Essentials are higher than take-home pay by '+fmt(-leftover)+' per month.\nThe model needs a positive monthly leftover to estimate savings.';
    return;
  }
  var annualSavings=leftover*12*(saverate/100);
  var annualFlexible=leftover*12-annualSavings;
  var g=growth/100;
  var lines=[
    'Monthly leftover: '+fmt(leftover),
    'Annual leftover: '+fmt(leftover*12),
    'Estimated annual savings: '+fmt(annualSavings),
    'Estimated annual flexible spending: '+fmt(annualFlexible),
    '',
    'Projected savings balance (growth '+growth+'%/yr):',
    '  after 10 years: '+fmt(fv(annualSavings,g,10)),
    '  after 20 years: '+fmt(fv(annualSavings,g,20)),
    '  after 30 years: '+fmt(fv(annualSavings,g,30))
  ];
  out.textContent=lines.join('\n');
}

ids.forEach(function(id){
  if(inputs[id])inputs[id].addEventListener('input',calc);
});
calc();
}catch(e){console.error('project script error',e);}
});
