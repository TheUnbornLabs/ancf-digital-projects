document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;

/* ---------- Flip cards (keyboard accessible) ---------- */
var container=document.getElementById('cards');
var cards=[].slice.call(document.querySelectorAll('#cards .flip'));
cards.forEach(function(c){
  c.setAttribute('role','button');
  c.setAttribute('tabindex','0');
  c.setAttribute('aria-pressed','false');
  var term=c.getAttribute('data-term')||'card';
  c.setAttribute('aria-label',term+' — flip to see definition');
  function toggle(){
    c.classList.toggle('on');
    c.setAttribute('aria-pressed',c.classList.contains('on')?'true':'false');
  }
  c.addEventListener('click',toggle);
  c.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}
  });
});

var flipAll=document.getElementById('flipAll');
if(flipAll)flipAll.addEventListener('click',function(){
  cards.forEach(function(c){c.classList.add('on');c.setAttribute('aria-pressed','true');});
});
var resetCards=document.getElementById('resetCards');
if(resetCards)resetCards.addEventListener('click',function(){
  cards.forEach(function(c){c.classList.remove('on');c.setAttribute('aria-pressed','false');});
});
var shuffle=document.getElementById('shuffle');
if(shuffle&&container)shuffle.addEventListener('click',function(){
  var arr=cards.slice();
  for(var i=arr.length-1;i>0;i--){
    var j=Math.floor(Math.random()*(i+1));
    var tmp=arr[i];arr[i]=arr[j];arr[j]=tmp;
  }
  arr.forEach(function(c){c.classList.remove('on');c.setAttribute('aria-pressed','false');container.appendChild(c);});
});

/* ---------- Self-test checklist ---------- */
var boxes=[].slice.call(document.querySelectorAll('#selftest input[type=checkbox]'));
var bar=document.getElementById('bar');
var pct=document.getElementById('pct');
var saved=[];
try{saved=JSON.parse(localStorage.getItem(KEY+':test')||'[]');}catch(e){}
boxes.forEach(function(b,i){b.checked=!!saved[i];});
function upd(){
  var n=boxes.filter(function(b){return b.checked;}).length;
  var p=boxes.length?Math.round(100*n/boxes.length):0;
  if(bar)bar.style.width=p+'%';
  if(pct)pct.textContent=n+' of '+boxes.length+' mastered.';
  try{localStorage.setItem(KEY+':test',JSON.stringify(boxes.map(function(b){return b.checked;})));}catch(e){}
}
boxes.forEach(function(b){b.addEventListener('change',upd);});
var resetTest=document.getElementById('resetTest');
if(resetTest)resetTest.addEventListener('click',function(){
  if(!window.confirm('Reset the self-test on this device?'))return;
  boxes.forEach(function(b){b.checked=false;});upd();
});
upd();
}catch(e){console.error('project script error',e);}
});
