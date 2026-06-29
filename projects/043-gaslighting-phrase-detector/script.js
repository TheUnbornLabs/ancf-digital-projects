document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var P=[
 [/that never happened|you'?re imagining|i never said|you made that up|you'?re misremembering/i,'Denial — rewriting or erasing what happened.'],
 [/you'?re overreacting|too sensitive|can'?t take a joke|blowing it out|it'?s not a big deal/i,'Minimising — shrinking your feelings or concerns.'],
 [/your fault|you made me|you'?re the problem|if you hadn'?t|you brought this on/i,'Blame-shifting — making their behaviour your responsibility.'],
 [/you'?re crazy|you'?re paranoid|everyone agrees with me|no one else thinks|you need help/i,'Reality-doubt — casting you as the unreliable one.']
];
var text=document.getElementById('text'),out=document.getElementById('out'),iBar=document.getElementById('iBar'),iPct=document.getElementById('iPct');
function scan(){
  var t=(text.value||'');if(!t.trim()){out.textContent='No scan yet.';if(A.meter)A.meter(iBar,0);if(iPct)iPct.textContent='0%';return;}
  var hits=[];P.forEach(function(p){if(p[0].test(t))hits.push('• '+p[1]);});
  var pct=Math.round(hits.length/P.length*100);if(A.meter)A.meter(iBar,pct);if(iPct)iPct.textContent=pct+'%';
  if(hits.length){var s=hits.length+' pattern'+(hits.length>1?'s':'')+' associated with gaslighting:\n\n'+hits.join('\n')+'\n\nA phrase isn\'t proof — but trust your own memory and feelings.';if(hits.length>=2)s+='\n\nIf this is a recurring dynamic that leaves you doubting yourself, please consider talking with someone you trust.';out.textContent=s;}
  else out.textContent='No clear patterns matched. Your perception still counts — trust it.';
}
var scanBtn=document.getElementById('scanBtn'),clearBtn=document.getElementById('clearBtn');
if(scanBtn)scanBtn.addEventListener('click',scan);if(text)text.addEventListener('input',scan);
if(clearBtn)clearBtn.addEventListener('click',function(){if(text)text.value='';scan();});

var QZ=[{a:0,e:'Gaslighting makes a person doubt their memory and perception.'},{a:1,e:'Take it seriously and consider support — it is not your fault.'}];
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
}catch(e){console.error('project 043 script error',e);}
});
