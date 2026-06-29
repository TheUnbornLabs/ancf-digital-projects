document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var base=['Be kind. Critique ideas, never people.','No harassment, slurs, or targeting anyone\'s identity (gender, religion, caste, ethnicity, sexuality, disability, or class).','Respect everyone\'s reproductive choices — including people who have children.','No medical, legal, or financial advice presented as fact; share sources, not pressure.','Keep personal data private; no screenshots or sharing members\' details without consent.'];
var focusRules={support:['This is a support space first — listen before debating.','Content warnings for heavy topics; no graphic detail.'],study:['Cite sources where you can; distinguish opinion from evidence.','Disagree respectfully; steelman before you rebut.'],activism:['Plan actions that are legal, non-violent, and inclusive.','No targeting individuals; aim at systems and ideas.'],general:['Stay roughly on-topic; off-topic chat in the designated thread.']};
var strictRules={light:['Admins step in only for safety issues.'],standard:['Warnings, then temporary mute, then removal for repeated breaches.'],strict:['One clear warning, then removal. Zero tolerance for harassment or hate.']};
var focus=document.getElementById('focus'),strict=document.getElementById('strict'),out=document.getElementById('out');
function build(){
  var list=base.concat(focusRules[focus.value]||[]).concat(strictRules[strict.value]||[]);
  var head='Group rules — '+focus.options[focus.selectedIndex].text+' ('+strict.value+' moderation)\n\nWe\'re here to think, support, and respect each other. By staying, you agree to:\n';
  out.value=head+list.map(function(r,i){return (i+1)+'. '+r;}).join('\n')+'\n\nQuestions? Message an admin. Welcome aboard.';
  if(A.set)A.set('rules',out.value);
}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',build);
if(focus)focus.addEventListener('change',build);if(strict)strict.addEventListener('change',build);
if(out){if(A.get)out.value=A.get('rules','');out.addEventListener('input',function(){if(A.set)A.set('rules',out.value);});if(!out.value)build();}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(out.value||'',copyBtn);});

var QZ=[{a:1,e:'Good rules are welcoming and protective at once — they say what the group is for.'},{a:1,e:'Safety-first rules protect every member, including from harassment.'}];
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
}catch(e){console.error('project 036 script error',e);}
});
