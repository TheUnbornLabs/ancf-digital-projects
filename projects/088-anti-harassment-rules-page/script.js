document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var TEMPLATE=[
'Our community welcomes everyone and protects everyone.',
'',
'1. Treat every member with respect. Address ideas, never attack people.',
'2. No harassment of any kind — including insults, threats, stalking, or repeated unwanted contact.',
'3. No hostility based on gender, religion, caste, ethnicity, nationality, disability, sexual orientation, age, or background.',
'4. Respect everyone\'s reproductive choices — in any direction. No shaming people for having, or not having, children.',
'5. Disagree freely, but kindly. Strong views are welcome; cruelty is not.',
'6. Respect privacy. Don\'t share others\' personal information.',
'',
'How to report: contact a moderator privately at [contact]. Reports are taken seriously and handled discreetly. Both sides are considered fairly, and we act in proportion — a reminder, a warning, or removal as needed.',
'',
'Thank you for helping keep this a safe and welcoming place for all.'
].join('\n');
var out=document.getElementById('out');
if(out){if(A.get)out.value=A.get('rules','')||TEMPLATE;else out.value=TEMPLATE;out.addEventListener('input',function(){if(A.set)A.set('rules',out.value);});}
var copyBtn=document.getElementById('copyBtn'),resetBtn=document.getElementById('resetBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(out.value||'',copyBtn);});
if(resetBtn)resetBtn.addEventListener('click',function(){if(!window.confirm('Reset to the default template?'))return;out.value=TEMPLATE;if(A.set)A.set('rules',out.value);});

var QZ=[{a:1,e:'Good rules protect every member, whatever their background or views.'},{a:1,e:'A clear reporting process is what makes the rules real and usable.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You got '+sc+' of '+QZ.length+'.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 088 script error',e);}
});
