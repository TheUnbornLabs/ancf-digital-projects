document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var fields=[].slice.call(document.querySelectorAll('#board textarea'));
var bar=document.getElementById('bar'),pct=document.getElementById('pct');
function render(){var n=0;fields.forEach(function(t){if((t.value||'').trim())n++;});if(A.meter)A.meter(bar,n/fields.length*100);if(pct)pct.textContent=Math.round(n/fields.length*100)+'%';}
if(fields.length){var s=A.getJSON?A.getJSON('book',{}):{};s=s||{};fields.forEach(function(t){if(s[t.id]!=null)t.value=s[t.id];t.addEventListener('input',function(){s[t.id]=t.value;if(A.setJSON)A.setJSON('book',s);render();});});render();}
var status=document.getElementById('status'),timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
var saveBtn=document.getElementById('saveBtn'),copyBtn=document.getElementById('copyBtn'),clearBtn=document.getElementById('clearBtn');
if(saveBtn)saveBtn.addEventListener('click',function(){var s={};fields.forEach(function(t){s[t.id]=t.value;});if(A.setJSON)A.setJSON('book',s);flash('Saved ✓');});
if(copyBtn)copyBtn.addEventListener('click',function(){var L=['Book summary',''];fields.forEach(function(t){L.push(t.getAttribute('data-label')+': '+(t.value.trim()||'—'));});A.copy&&A.copy(L.join('\n'),copyBtn);});
if(clearBtn)clearBtn.addEventListener('click',function(){if(!window.confirm('Clear the whole summary?'))return;fields.forEach(function(t){t.value='';});if(A.remove)A.remove('book');render();flash('Cleared.');});

var QZ=[{a:1,e:'A good summary includes your own critique, not just the author\'s claims.'},{a:0,e:'One clear takeaway helps a book stick in memory.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+QZ.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 077 script error',e);}
});
