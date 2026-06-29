document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var fields=[].slice.call(document.querySelectorAll('#board textarea'));
var bar=document.getElementById('bar'),pct=document.getElementById('pct');
function render(){var n=0;fields.forEach(function(t){if((t.value||'').trim())n++;});if(A.meter)A.meter(bar,n/fields.length*100);if(pct)pct.textContent=Math.round(n/fields.length*100)+'%';}
if(fields.length){var s=A.getJSON?A.getJSON('debate',{}):{};s=s||{};fields.forEach(function(t){if(s[t.id]!=null)t.value=s[t.id];t.addEventListener('input',function(){s[t.id]=t.value;if(A.setJSON)A.setJSON('debate',s);render();});});render();}
var status=document.getElementById('status'),timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
var saveBtn=document.getElementById('saveBtn'),copyBtn=document.getElementById('copyBtn'),clearBtn=document.getElementById('clearBtn');
if(saveBtn)saveBtn.addEventListener('click',function(){var s={};fields.forEach(function(t){s[t.id]=t.value;});if(A.setJSON)A.setJSON('debate',s);flash('Saved ✓');});
if(copyBtn)copyBtn.addEventListener('click',function(){var L=['Debate notes',''];fields.forEach(function(t){if(t.value.trim()){L.push(t.getAttribute('data-label')+':',t.value.trim(),'');}});if(L.length<=2){flash('Fill something first.');return;}A.copy&&A.copy(L.join('\n'),copyBtn);});
if(clearBtn)clearBtn.addEventListener('click',function(){if(!window.confirm('Clear all notes?'))return;fields.forEach(function(t){t.value='';});if(A.remove)A.remove('debate');render();flash('Cleared.');});

var QZ=[{a:1,e:'Preparing the other side\'s strongest points makes you better prepared and fairer.'},{a:1,e:'Naming common ground lowers the heat and builds trust.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+QZ.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 076 script error',e);}
});
