document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var fields=['m-values','m-build','m-bound','m-hope'].map(function(id){return document.getElementById(id);}).filter(Boolean);
fields.forEach(function(t){if(A.get)t.value=A.get(t.id,'');t.addEventListener('input',function(){if(A.set)A.set(t.id,t.value);});});
var out=document.getElementById('out');
if(out&&A.get){out.value=A.get('out','');out.addEventListener('input',function(){A.set('out',out.value);});}
function g(id){var e=document.getElementById(id);return e&&e.value.trim();}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',function(){
  var L=['My manifesto',''];
  L.push('I value '+(g('m-values')||'freedom, connection, and peace')+'.');
  L.push('I am building '+(g('m-build')||'a life that is fully my own')+'.');
  L.push('My boundary: '+(g('m-bound')||'the decisions about my life are mine to make')+'.');
  L.push('My hope: '+(g('m-hope')||'to live with intention, and to treat others with the respect I ask for myself')+'.');
  L.push('','This is my choice, made with care — and I extend the same dignity to those who choose differently.');
  out.value=L.join('\n');if(A.set)A.set('out',out.value);
});
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(out.value||'',copyBtn);});

var QZ=[{a:1,e:'A strong manifesto names what you\'re building, not just what you avoid.'},{a:0,e:'Writing your values down makes them steadier and clearer — and you can always revise.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+QZ.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 071 script error',e);}
});
