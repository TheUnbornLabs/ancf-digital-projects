document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var boxes=[].slice.call(document.querySelectorAll('.peace input[type=checkbox]'));
var bar=document.getElementById('bar'),pct=document.getElementById('pct'),count=document.getElementById('count');
function render(){var n=0;boxes.forEach(function(b){if(b.checked)n++;});if(A.meter)A.meter(bar,n/boxes.length*100);if(pct)pct.textContent=Math.round(n/boxes.length*100)+'%';if(count)count.textContent=n+' of '+boxes.length+' ticked.';}
if(boxes.length){var s=A.getJSON?A.getJSON('peace',{}):{};s=s||{};boxes.forEach(function(b){var k=b.getAttribute('data-key');b.checked=!!s[k];b.addEventListener('change',function(){s[k]=b.checked;if(A.setJSON)A.setJSON('peace',s);render();});});render();}

var status=document.getElementById('status'),timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){
  var picked=boxes.filter(function(b){return b.checked;}).map(function(b){return '• '+b.parentNode.textContent.trim();});
  if(!picked.length){flash('Tick a few first.');return;}
  if(A.copy)A.copy('My personal peace plan:\n'+picked.join('\n'),copyBtn);
});
var clearBtn=document.getElementById('clearBtn');
if(clearBtn)clearBtn.addEventListener('click',function(){if(!window.confirm('Clear all ticks on this device?'))return;boxes.forEach(function(b){b.checked=false;});if(A.remove)A.remove('peace');render();flash('Cleared.');});

/* ---------- Quiz ---------- */
var Q=[{a:1,e:'Protecting your peace is a reasonable, healthy skill — it lets you stay kind without being worn down.'},{a:1,e:'You owe basic respect, but not a debate or full justification of your private decisions.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;Q.forEach(function(it,i){document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});

/* ---------- Reflection ---------- */
var ta=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),t2=null;
function flash2(m){if(!refStatus)return;refStatus.textContent=m;if(t2)clearTimeout(t2);t2=setTimeout(function(){refStatus.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash2('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ta?ta.value:'',copyRef);});
}catch(e){console.error('project 016 script error',e);}
});
