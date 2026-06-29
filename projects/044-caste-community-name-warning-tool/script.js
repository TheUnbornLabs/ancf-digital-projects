document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var P=[
 [/\ball (of )?(them|those people|that community|that lot)\b|those people|people like (them|those)|that whole (community|lot)/i,'Group generalisation — speaking about a whole group as one.'],
 [/\b(typical|classic) (of )?(them|that|those)\b|they'?re all the same|you know how (they|those) are|that'?s how (they|those) are/i,'Stereotyping — assuming a group shares one trait.'],
 [/\b(caste|community|religion|religious|tribe|ethnic|race)\b[^.]{0,40}\b(inferior|superior|dirty|criminal|backward|lazy|greedy|primitive|savage)\b/i,'Dehumanising claim about a group.'],
 [/\bblame the\b|it'?s (the|those) [a-z]+ ?(community|people|caste)? ?fault|because of (the|those) [a-z]+ people/i,'Scapegoating — blaming a group for a problem.']
];
var text=document.getElementById('text'),out=document.getElementById('out');
function scan(){
  var t=(text.value||'');if(!t.trim()){out.textContent='No screen yet.';return;}
  var hits=[];P.forEach(function(p){if(p[0].test(t))hits.push('• '+p[1]);});
  if(hits.length){out.innerHTML='<span class="tag-bad" style="font-weight:800">⚠ Please reconsider before posting.</span><br>This draft may generalise about or target a group:<br><br>'+hits.join('<br>')+'<br><br>Our rules ask us to critique <strong>structures, pressures, and specific behaviours — never a caste, community, religion, or ethnic group</strong>. See "How to rephrase" below.';}
  else out.innerHTML='<span class="tag-good" style="font-weight:800">✓ No group-targeting patterns detected.</span><br>Tools miss nuance — please still read it through with kindness in mind, and aim at systems and behaviours.';
}
var scanBtn=document.getElementById('scanBtn'),clearBtn=document.getElementById('clearBtn');
if(scanBtn)scanBtn.addEventListener('click',scan);if(text)text.addEventListener('input',scan);
if(clearBtn)clearBtn.addEventListener('click',function(){if(text)text.value='';out.textContent='No screen yet.';});

var QZ=[{a:1,e:'Fair criticism aims at systems, pressures, and specific behaviours — never at a whole group.'},{a:1,e:'"They always do X" is a stereotype to avoid; situations drive behaviour, not identity.'}];
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
}catch(e){console.error('project 044 script error',e);}
});
