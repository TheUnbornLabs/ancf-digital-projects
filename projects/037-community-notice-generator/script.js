document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var type=document.getElementById('type'),title=document.getElementById('title'),detail=document.getElementById('detail'),out=document.getElementById('out');
function build(){
  var t=(title.value||'(topic)').trim(),d=(detail.value||'(details)').trim(),k=type.value;
  var msg='';
  if(k==='welcome')msg='👋 Welcome!\n\n'+t+'\n\nWe\'re glad you\'re here. '+d+'\n\nPlease say hello and check the pinned rules. Anything you need, message an admin.';
  else if(k==='event')msg='📅 Event: '+t+'\n\n'+d+'\n\nAll members welcome — bring your questions. Reply here if you\'re coming, and share with anyone who\'d enjoy it.';
  else if(k==='policy')msg='📌 Policy update: '+t+'\n\nWhat\'s changing: '+d+'\n\nWhy: to keep this space safe and welcoming for everyone. Questions are welcome — message an admin.';
  else msg='🔔 Reminder: '+t+'\n\n'+d+'\n\nThanks, everyone. 💛';
  out.value=msg;if(A.set)A.set('notice',out.value);
}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',build);
[type,title,detail].forEach(function(e){if(e)e.addEventListener('input',function(){});});
if(out){if(A.get)out.value=A.get('notice','');out.addEventListener('input',function(){if(A.set)A.set('notice',out.value);});}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(out.value||'',copyBtn);});

var QZ=[{a:1,e:'A clear notice answers what, when, why, and the next step.'},{a:1,e:'Good notices are short and skimmable — they respect people\'s time.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+QZ.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});

var ta=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),t2=null;
function flash2(m){if(!refStatus)return;refStatus.textContent=m;if(t2)clearTimeout(t2);t2=setTimeout(function(){refStatus.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash2('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ta?ta.value:'',copyRef);});
}catch(e){console.error('project 037 script error',e);}
});
