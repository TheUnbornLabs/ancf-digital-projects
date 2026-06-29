document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var open={group:'A gentle note for our group:',post:'A gentle note on this thread:',event:'A gentle note for this meetup:'};
var ctx=document.getElementById('ctx'),warmth=document.getElementById('warmth'),out=document.getElementById('out');
function build(){
  var L=[open[ctx.value]||open.group,''];
  L.push('We talk about some big, heavy topics here, and we want this to be a kind place for everyone.');
  if(warmth.value==='full'){
    L.push('','Please be gentle with yourself and with each other. It\'s okay to step back from a conversation any time. If something here feels like too much, that\'s a sign to take care of you first.');
  }
  L.push('','This space is for support and reflection — it can\'t replace professional help. If you\'re going through a hard time, please reach out to someone you trust or a qualified professional.');
  L.push('','If you or someone else may be in immediate danger, please contact local emergency services or a crisis line right away: [local support].');
  L.push('','Thank you for helping keep this a safe, caring place. 💛');
  out.value=L.join('\n');if(A.set)A.set('notice',out.value);
}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',build);
if(ctx)ctx.addEventListener('change',build);if(warmth)warmth.addEventListener('change',build);
if(out){if(A.get)out.value=A.get('notice','');out.addEventListener('input',function(){if(A.set)A.set('notice',out.value);});if(!out.value)build();}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(out.value||'',copyBtn);});

var QZ=[{a:1,e:'A good notice conveys care and points to real support — it isn\'t a telling-off.'},{a:1,e:'A group can support people and signpost professional help, not replace it.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You got '+sc+' of '+QZ.length+'.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 086 script error',e);}
});
