document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var F=[
 [/you'?re (just )?(stupid|selfish|naive|a hypocrite|broken)|people like you|what would you know/i,'Ad hominem — attacking the person instead of the argument.'],
 [/unnatural|against nature|natural order|not natural/i,'Appeal to nature — treating "natural" as automatically right.'],
 [/always been|it'?s tradition|that'?s how it'?s always|for centuries/i,'Appeal to tradition — "we\'ve always done it" isn\'t a reason.'],
 [/next thing you know|where does it end|leads to|slippery slope|before you know it/i,'Slippery slope — assuming one step must cause an extreme outcome.'],
 [/so you'?re saying|you basically want|you just hate|so you think (everyone|all)/i,'Straw man — distorting a view into a weaker one.'],
 [/either you|you'?re either|only two|with us or against|if you don'?t .* then you/i,'False dilemma — pretending there are only two options.'],
 [/everyone (does|knows|has)|most people|nobody (does|thinks)|normal people/i,'Appeal to majority — popularity isn\'t proof.'],
 [/how could you|after everything|you should be ashamed|think of/i,'Appeal to emotion / guilt — feelings used in place of reasons.']
];
var text=document.getElementById('text'),out=document.getElementById('out'),fBar=document.getElementById('fBar'),fPct=document.getElementById('fPct');
function scan(){
  var t=(text.value||'');
  if(!t.trim()){out.textContent='No scan yet.';if(A.meter)A.meter(fBar,0);if(fPct)fPct.textContent='0';return;}
  var hits=[];F.forEach(function(f){if(f[0].test(t))hits.push('• '+f[1]);});
  if(fPct)fPct.textContent=hits.length;if(A.meter)A.meter(fBar,Math.min(100,hits.length/F.length*100));
  if(hits.length)out.textContent=hits.length+' pattern'+(hits.length>1?'s':'')+' to examine:\n\n'+hits.join('\n')+'\n\nA flagged pattern weakens the reasoning — it doesn\'t prove the conclusion false, or the speaker bad.';
  else out.textContent='No common fallacy patterns matched. That doesn\'t make the argument sound — judge the reasoning yourself too.';
}
var scanBtn=document.getElementById('scanBtn'),clearBtn=document.getElementById('clearBtn'),exBtn=document.getElementById('exBtn');
if(scanBtn)scanBtn.addEventListener('click',scan);
if(text)text.addEventListener('input',scan);
if(clearBtn)clearBtn.addEventListener('click',function(){if(text)text.value='';scan();});
if(exBtn)exBtn.addEventListener('click',function(){if(text)text.value='Everyone has kids — it\'s just natural. You\'ll change your mind, and people like you always do. Either you have children or you\'ll die alone.';scan();});

var QZ=[{a:0,e:'"Everyone does it" is an appeal to majority — popularity isn\'t proof.'},{a:1,e:'A flagged fallacy means the reasoning is worth examining — not that the person is bad or the conclusion false.'}];
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
}catch(e){console.error('project 040 script error',e);}
});
