document.addEventListener('DOMContentLoaded',function(){
try{
var ids=['sleep','work','care','extra'];
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
function r1(n){return (Math.round(n*10)/10).toString();}

function calc(){
  var sleep=num(inputs.sleep,0,24);
  var work=num(inputs.work,0,24);
  var care=num(inputs.care,0,24);
  var extra=num(inputs.extra,0,24);
  var committed=sleep+work+care;
  if(committed>24){
    out.textContent='Sleep + work + care add up to more than 24 hours a day — adjust the inputs.';
    return;
  }
  var fd=24-committed;
  var fw=fd*7;
  var withExtra=fd-extra;
  var lines=[
    'Current free time:',
    '  per day: '+r1(fd)+' h',
    '  per week: '+r1(fw)+' h  (~'+r1(fw/8)+' full waking days)',
    '  per year: '+r1(fd*365)+' h',
    '',
    'With '+r1(extra)+' h/day of added care:'
  ];
  if(withExtra<0){
    lines.push('  per day: 0 h (the added care alone exceeds your current free time by '+r1(-withExtra)+' h — something else would have to give)');
  }else{
    lines.push('  per day: '+r1(withExtra)+' h');
    lines.push('  per week: '+r1(withExtra*7)+' h');
  }
  lines.push('');
  lines.push('Difference: '+r1(extra)+' h/day = '+r1(extra*7)+' h/week = '+r1(extra*365)+' h/year');
  out.textContent=lines.join('\n');
}

ids.forEach(function(id){if(inputs[id])inputs[id].addEventListener('input',calc);});
calc();
}catch(e){console.error('project script error',e);}
});
