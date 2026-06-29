document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var D={
 autonomy:{hook:'"When are you having kids?" — what if the real answer is: that\'s mine to decide?',body:['Reproductive autonomy means deciding whether, when, and if to have children.','It protects everyone — the choice to have kids and the choice not to.'],cta:'Whatever you choose, you deserve respect. Follow for more calm, rights-based takes.'},
 childfree:{hook:'A childfree life isn\'t an empty one — here\'s why.',body:['Meaning grows from freedom, friendship, creativity, care, and rest.','Not wanting children is a complete sentence.'],cta:'Living your own way? You\'re in good company. Like and follow.'},
 argument:{hook:'One question at the heart of birth ethics — in 30 seconds.',body:['We seek consent before acting on anyone, except at the one moment they can\'t be asked.','That\'s the consent argument: imposing the risks of a life needs justifying.'],cta:'Thoughtful people disagree here — and that\'s okay. Follow to think it through.'},
 pressure:{hook:'Getting "the kids question" again? Try this.',body:['Acknowledge their care, set a calm boundary, then change the subject.','You don\'t owe anyone a justification.'],cta:'Save this for the next family dinner. Follow for more.'}
};
var topic=document.getElementById('topic'),len=document.getElementById('len'),out=document.getElementById('out');
function build(){
  var d=D[topic.value]||D.autonomy;var L=['[HOOK] '+d.hook,'','[BODY]'];
  var pts=len.value==='short'?d.body.slice(0,1):d.body;pts.forEach(function(p){L.push('• '+p);});
  L.push('','[CTA] '+d.cta);out.value=L.join('\n');if(A.set)A.set('script',out.value);
}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',build);
if(topic)topic.addEventListener('change',build);if(len)len.addEventListener('change',build);
if(out){if(A.get)out.value=A.get('script','');out.addEventListener('input',function(){if(A.set)A.set('script',out.value);});if(!out.value)build();}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(out.value||'',copyBtn);});

var QZ=[{a:0,e:'The hook — the first few seconds — matters most.'},{a:1,e:'A good CTA is a kind invitation, not a demand.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+QZ.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 078 script error',e);}
});
