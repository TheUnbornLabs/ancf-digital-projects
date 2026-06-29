document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var P=[
 [/you'?ll regret|you'?ll be alone|don'?t come crying|or else|you'?ll be sorry|you'?ll lose/i,'Fear — predicting loss or punishment.'],
 [/you owe|after all (i|we)|it'?s your duty|least you could do|expected of you|we sacrificed/i,'Obligation — framing a choice as a debt you must repay.'],
 [/how could you|so ungrateful|breaking my heart|disappoint|selfish|ashamed/i,'Guilt — implying you are a bad person for choosing.'],
 [/before i die|i won'?t be around|my only wish|all i ever wanted|grandchildren before/i,'Leverage — using mortality or longing as pressure.']
];
var text=document.getElementById('text'),out=document.getElementById('out'),iBar=document.getElementById('iBar'),iPct=document.getElementById('iPct');
function scan(){
  var t=(text.value||'');if(!t.trim()){out.textContent='No scan yet.';if(A.meter)A.meter(iBar,0);if(iPct)iPct.textContent='0%';return;}
  var hits=[];P.forEach(function(p){if(p[0].test(t))hits.push('• '+p[1]);});
  var pct=Math.round(hits.length/P.length*100);if(A.meter)A.meter(iBar,pct);if(iPct)iPct.textContent=pct+'%';
  if(hits.length){var s=hits.length+' lever'+(hits.length>1?'s':'')+' worth noticing:\n\n'+hits.join('\n')+'\n\nNaming a pattern is for your clarity — it does not prove harm was meant.';if(hits.length>=3)s+='\n\nThat\'s a lot of pressure in one message. If this is a steady pattern, please consider talking it through with someone you trust.';out.textContent=s;}
  else out.textContent='No clear FOG patterns matched. Trust your own read, too — tools miss nuance.';
}
var scanBtn=document.getElementById('scanBtn'),clearBtn=document.getElementById('clearBtn');
if(scanBtn)scanBtn.addEventListener('click',scan);if(text)text.addEventListener('input',scan);
if(clearBtn)clearBtn.addEventListener('click',function(){if(text)text.value='';scan();});

var QZ=[{a:0,e:'The three levers are fear, obligation, and guilt (FOG).'},{a:1,e:'A flagged pattern is worth noticing for your own clarity — it doesn\'t convict anyone.'}];
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
}catch(e){console.error('project 042 script error',e);}
});
