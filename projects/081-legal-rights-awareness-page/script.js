document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var boxes=[].slice.call(document.querySelectorAll('#docs input[type=checkbox]'));
var bar=document.getElementById('docBar'),count=document.getElementById('docCount');
function render(){var n=boxes.filter(function(b){return b.checked;}).length;if(A.meter)A.meter(bar,n/boxes.length*100);if(count)count.textContent=n+' of '+boxes.length+' selected.';}
var saved=A.getJSON?A.getJSON('docs',{}):{};saved=saved||{};
boxes.forEach(function(b){var k=b.getAttribute('data-key');if(saved[k])b.checked=true;b.addEventListener('change',function(){saved[k]=b.checked;if(A.setJSON)A.setJSON('docs',saved);render();});});
render();

var ref=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),timer=null;
function flash(m){if(!refStatus)return;refStatus.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){refStatus.textContent='';},1600);}
if(ref&&A.get)ref.value=A.get('reflect','');
if(ref)ref.addEventListener('input',function(){if(A.set)A.set('reflect',ref.value);});
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ref.value);flash('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ref.value||'',copyRef);});

var QZ=[{a:1,e:'This is general awareness — laws vary, so see a qualified professional.'},{a:1,e:'Without a will, default rules decide, which may not match your wishes.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You got '+sc+' of '+QZ.length+'.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 081 script error',e);}
});
