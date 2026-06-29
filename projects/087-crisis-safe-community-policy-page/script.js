document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var TEMPLATE=[
'Our community cares about your wellbeing.',
'',
'We talk about meaningful, sometimes heavy topics here. This is a place for support and reflection — it cannot replace professional help.',
'',
'If you are struggling, please reach out to someone you trust or a qualified professional. You deserve support.',
'',
'If you or someone else may be in immediate danger, contact local emergency services or a crisis line right away:',
'  • Emergency services: [local number]',
'  • Crisis line(s): [local crisis line(s)]',
'',
'How our moderators respond: with kindness, without judgment. We will gently share support resources. We are not counsellors, and we won\'t diagnose or give clinical advice — but we will always treat you with care.',
'',
'Please keep conversations supportive. Avoid graphic detail. Be gentle with yourself and others. Thank you for helping keep this a safe place. 💛'
].join('\n');
var out=document.getElementById('out');
if(out){if(A.get)out.value=A.get('policy','')||TEMPLATE;else out.value=TEMPLATE;out.addEventListener('input',function(){if(A.set)A.set('policy',out.value);});}
var copyBtn=document.getElementById('copyBtn'),resetBtn=document.getElementById('resetBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(out.value||'',copyBtn);});
if(resetBtn)resetBtn.addEventListener('click',function(){if(!window.confirm('Reset to the default template?'))return;out.value=TEMPLATE;if(A.set)A.set('policy',out.value);});

var boxes=[].slice.call(document.querySelectorAll('#docs input[type=checkbox]'));
var bar=document.getElementById('docBar'),count=document.getElementById('docCount');
function render(){var n=boxes.filter(function(b){return b.checked;}).length;if(A.meter)A.meter(bar,n/boxes.length*100);if(count)count.textContent=n+' of '+boxes.length+' in place.';}
var saved=A.getJSON?A.getJSON('ready',{}):{};saved=saved||{};
boxes.forEach(function(b){var k=b.getAttribute('data-key');if(saved[k])b.checked=true;b.addEventListener('change',function(){saved[k]=b.checked;if(A.setJSON)A.setJSON('ready',saved);render();});});
render();

var QZ=[{a:1,e:'Moderators respond kindly and connect people to real help — they aren\'t therapists.'},{a:1,e:'Pre-agreed steps help everyone respond calmly when it matters most.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You got '+sc+' of '+QZ.length+'.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 087 script error',e);}
});
