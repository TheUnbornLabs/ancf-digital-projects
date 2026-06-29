document.addEventListener('DOMContentLoaded',function(){
try{
var k='ancf-'+location.pathname;
var boxes=[].slice.call(document.querySelectorAll('#list input[type=checkbox]'));
var bar=document.getElementById('bar');
var pct=document.getElementById('pct');
var saved=[];
try{saved=JSON.parse(localStorage.getItem(k)||'[]');}catch(e){}
boxes.forEach(function(b,i){b.checked=!!saved[i];});
function upd(){
  var n=boxes.filter(function(b){return b.checked;}).length;
  var p=boxes.length?Math.round(100*n/boxes.length):0;
  if(bar)bar.style.width=p+'%';
  if(pct)pct.textContent=p+'% ticked ('+n+'/'+boxes.length+') — progress is saved on this device.';
  try{localStorage.setItem(k,JSON.stringify(boxes.map(function(b){return b.checked;})));}catch(e){}
}
boxes.forEach(function(b){b.addEventListener('change',upd);});
var resetBtn=document.getElementById('resetBtn');
if(resetBtn)resetBtn.addEventListener('click',function(){
  if(!window.confirm('Uncheck everything on this device?'))return;
  boxes.forEach(function(b){b.checked=false;});
  upd();
});
upd();
}catch(e){console.error('project script error',e);}
});
