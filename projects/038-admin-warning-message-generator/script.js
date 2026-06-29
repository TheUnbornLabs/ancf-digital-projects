document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var issueText={harassment:'targeting or harassing another member',hate:'using hateful language about a group',attack:'making a personal attack rather than addressing the idea',spam:'repeated spam or self-promotion',offtopic:'repeatedly posting off-topic'};
var stepText={
 reminder:function(it){return 'Hi — a friendly heads-up. We noticed some '+it+'. No big deal yet, but our group asks us to keep things kind and on-topic. Could you ease off that? Thanks for being part of this.';},
 formal:function(it){return 'Hi — this is a formal warning. '+cap(it)+' breaks our group rules. Please stop now. We value you here, and we also need everyone to feel safe. Continuing may lead to a temporary mute. Happy to talk it through privately.';},
 final:function(it){return 'Hi — this is a final warning. '+cap(it)+' has continued after a previous warning and must stop immediately. Any further breach will mean removal from the group. We\'d genuinely rather you stayed and kept to the rules. The path back is simple: respect the space and the people in it.';}
};
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
var issue=document.getElementById('issue'),step=document.getElementById('step'),out=document.getElementById('out');
function build(){out.value=stepText[step.value](issueText[issue.value]||'a rule breach');if(A.set)A.set('warn',out.value);}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',build);
if(issue)issue.addEventListener('change',build);if(step)step.addEventListener('change',build);
if(out){if(A.get)out.value=A.get('warn','');out.addEventListener('input',function(){if(A.set)A.set('warn',out.value);});if(!out.value)build();}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(out.value||'',copyBtn);});

var QZ=[{a:1,e:'A fair warning names the specific behaviour and the rule — not the person\'s character.'},{a:1,e:'When harassment occurs, protect the target first.'}];
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
}catch(e){console.error('project 038 script error',e);}
});
