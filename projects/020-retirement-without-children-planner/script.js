document.addEventListener('DOMContentLoaded',function(){
try{
var ids=['monthly','other','years','swr'];
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
  var monthly=num(inputs.monthly,0);
  var other=num(inputs.other,0);
  var years=num(inputs.years,0,50);
  var swr=num(inputs.swr,1,10);
  var gap=monthly-other;
  if(gap<=0){
    out.textContent='Your other income already meets the target in this model — no extra fund needed for income.\n(Care planning below still matters for everyone.)';
    return;
  }
  var annualGap=gap*12;
  var simpleFund=annualGap*years;
  var ruleFund=annualGap/(swr/100);
  var lines=[
    'Monthly gap to self-fund: '+fmt(gap),
    'Annual gap: '+fmt(annualGap),
    '',
    'A) Simple drawdown over '+years+' years: '+fmt(simpleFund),
    'B) Withdrawal-rule fund at '+swr+'%/yr: '+fmt(ruleFund),
    '',
    'Before investment growth, inflation, and tax — a professional can refine this.'
  ];
  out.textContent=lines.join('\n');
}

ids.forEach(function(id){if(inputs[id])inputs[id].addEventListener('input',calc);});
calc();
}catch(e){console.error('project script error',e);}
});
