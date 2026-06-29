document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var labels={elders:'Family elders',peers:'Peers & timelines',work:'Workplace & status',media:'Media & advertising',community:'Religious & community norms',inner:'Your own inner voice'};
var map=document.getElementById('map');
var out=document.getElementById('mapOut');
if(!map)return;
var opts=[].slice.call(map.querySelectorAll('.opt'));
var state={};
try{state=JSON.parse(localStorage.getItem(KEY+':map')||'{}')||{};}catch(e){state={};}

function paint(){
  opts.forEach(function(o){
    var k=o.getAttribute('data-key'),v=o.getAttribute('data-v');
    var on=String(state[k])===v;
    o.classList.toggle('sel',on);
    o.setAttribute('aria-pressed',on?'true':'false');
  });
}
function summarise(){
  var rated=Object.keys(state);
  if(!rated.length){out.textContent='Rate the sources above to see your map.';return;}
  var strong=rated.filter(function(k){return state[k]===2;}).map(function(k){return labels[k];});
  var some=rated.filter(function(k){return state[k]===1;}).map(function(k){return labels[k];});
  var msg='You\'ve mapped '+rated.length+' of 6 sources. ';
  if(strong.length){msg+='Strongest for you: '+strong.join(', ')+'. That\'s the one to prepare for first. ';}
  else if(some.length){msg+='Some pressure from: '+some.join(', ')+'. ';}
  else{msg+='Little pressure flagged — that\'s worth appreciating. ';}
  if(state.inner===2){msg+='Note your strong inner voice: some of that conviction may be borrowed, and you\'re allowed to question it.';}
  out.textContent=msg;
}
function choose(o){
  var k=o.getAttribute('data-key');
  state[k]=parseInt(o.getAttribute('data-v'),10);
  try{localStorage.setItem(KEY+':map',JSON.stringify(state));}catch(e){}
  paint();summarise();
}
opts.forEach(function(o){
  o.setAttribute('role','button');
  o.setAttribute('tabindex','0');
  o.setAttribute('aria-pressed','false');
  o.addEventListener('click',function(){choose(o);});
  o.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(o);}});
});
var resetBtn=document.getElementById('resetBtn');
if(resetBtn)resetBtn.addEventListener('click',function(){
  if(!window.confirm('Reset your map on this device?'))return;
  state={};try{localStorage.removeItem(KEY+':map');}catch(e){}
  paint();summarise();
});
paint();summarise();
}catch(e){console.error('project script error',e);}
});
