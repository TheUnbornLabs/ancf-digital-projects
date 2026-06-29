document.addEventListener('DOMContentLoaded',function(){
try{
var pool=document.getElementById('pool');
var people=document.getElementById('people');
var peopleVal=document.getElementById('peopleVal');
var bars=document.getElementById('bars');
var out=document.getElementById('rOut');
function num(el,min,max,def){var v=parseFloat(el.value);if(isNaN(v))v=def;if(v<min)v=min;if(v>max)v=max;return v;}
function draw(){
  var P=num(pool,1,100000,100);
  var n=Math.round(num(people,1,12,4));
  if(peopleVal)peopleVal.textContent=n;
  var share=P/n;
  // segments
  bars.innerHTML='';
  var row=document.createElement('div');row.className='seg-row';
  for(var i=0;i<n;i++){var d=document.createElement('div');d.className='seg';d.textContent=(Math.round(share*10)/10);row.appendChild(d);}
  bars.appendChild(row);
  var lines=[
    'Pool of '+P+' units shared by '+n+' = '+(Math.round(share*10)/10)+' units each.',
    '',
    'For comparison (same pool):'
  ];
  [1,2,4,8].forEach(function(pp){lines.push('  • '+pp+' person'+(pp>1?'s':'')+': '+(Math.round(P/pp*10)/10)+' each');});
  out.textContent=lines.join('\n');
}
[pool,people].forEach(function(el){el.addEventListener('input',draw);});
draw();
}catch(e){console.error('project script error',e);}
});
