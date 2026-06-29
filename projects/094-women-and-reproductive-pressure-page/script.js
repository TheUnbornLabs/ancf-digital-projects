document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var ref=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),timer=null;
function flash(m){if(!refStatus)return;refStatus.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){refStatus.textContent='';},1600);}
if(ref&&A.get)ref.value=A.get('reflect','');
if(ref)ref.addEventListener('input',function(){if(A.set)A.set('reflect',ref.value);});
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ref.value);flash('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ref.value||'',copyRef);});

var QZ=[{a:1,e:'It respects every choice while naming unfair pressure — judging no one.'},{a:1,e:'A woman\'s worth is inherent, whatever she chooses.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You got '+sc+' of '+QZ.length+'.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 094 script error',e);}
});
