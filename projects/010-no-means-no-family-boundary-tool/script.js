document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};

/* ---------- Boundary script generator ---------- */
var lead={general:"I know you're keen to know about kids.",timeline:"I know you'd like a timeline.",changemind:"I hear that you think I'll change my mind.",careold:"I know you worry about my old age.",duty:"I know this feels like a family duty.",public:"I'd rather not get into this here."};
var wrap={gentle:" I've made my decision, and I'd be grateful if we could let it rest. I'm always happy to talk about other things.",firm:" My decision is made, and I'm not going to keep discussing it. Let's move on.",final:" This is settled. Please don't raise it again.",repeated:" We've talked about this before — my answer hasn't changed, and I'm going to change the subject now."};
var tone=document.getElementById('tone'),situation=document.getElementById('situation'),genOut=document.getElementById('genOut'),custom=document.getElementById('custom');
function build(){return (lead[situation.value]||lead.general)+(wrap[tone.value]||wrap.firm);}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',function(){var t=build();genOut.textContent=t;if(custom){custom.value=t;if(A.set)A.set('custom',t);}});
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(genOut.textContent&&genOut.textContent.indexOf('appear')===-1?genOut.textContent:build(),copyBtn);});

/* custom save/copy */
if(custom&&A.get){custom.value=A.get('custom','');if(custom.value)genOut.textContent=custom.value;custom.addEventListener('input',function(){A.set('custom',custom.value);});}
var copyCustom=document.getElementById('copyCustom'),saveCustom=document.getElementById('saveCustom'),saveStatus=document.getElementById('saveStatus'),st1=null;
function flash1(m){if(!saveStatus)return;saveStatus.textContent=m;if(st1)clearTimeout(st1);st1=setTimeout(function(){saveStatus.textContent='';},1600);}
if(copyCustom)copyCustom.addEventListener('click',function(){A.copy&&A.copy(custom?custom.value:'',copyCustom);});
if(saveCustom)saveCustom.addEventListener('click',function(){if(A.set)A.set('custom',custom?custom.value:'');flash1('Saved ✓');});

/* ---------- Emotional-blackmail detector ---------- */
var P=[
 [/after everything|how could you|you owe|ungrateful|selfish|disappoint/i,'Guilt — implying you are letting people down.'],
 [/you have to|you must|your duty|supposed to|expected of you/i,'Obligation — framing a choice as a non-negotiable demand.'],
 [/you'?ll regret|you'?ll be alone|or else|cut you off|don'?t expect|won'?t forgive/i,'Fear / threat — predicting loss or withdrawing love.'],
 [/everyone else|your sister|your brother|other people|why can'?t you/i,'Comparison — measuring you against others.'],
 [/before i die|i won'?t be around|my only wish|grandchildren before/i,'Self-pity / urgency — using time or mortality as leverage.']
];
var bbText=document.getElementById('bbText'),bbOut=document.getElementById('bbOut'),bbBar=document.getElementById('bbBar'),bbPct=document.getElementById('bbPct');
function scan(){
  var t=(bbText.value||'');
  if(!t.trim()){bbOut.textContent='No scan yet.';if(A.meter)A.meter(bbBar,0);if(bbPct)bbPct.textContent='0%';return;}
  var hits=[];P.forEach(function(p){if(p[0].test(t))hits.push('• '+p[1]);});
  var pct=Math.round(hits.length/P.length*100);
  if(A.meter)A.meter(bbBar,pct);if(bbPct)bbPct.textContent=pct+'%';
  if(hits.length)bbOut.textContent=hits.length+' pattern'+(hits.length>1?'s':'')+' worth noticing:\n\n'+hits.join('\n')+'\n\nNaming a pattern is for your clarity — it does not prove the speaker meant harm. If these are frequent and ignore your "no", that matters.';
  else bbOut.textContent='No flagged patterns found. Trust your own judgement too — tools miss nuance.';
}
var bbBtn=document.getElementById('bbBtn'),bbClear=document.getElementById('bbClear');
if(bbBtn)bbBtn.addEventListener('click',scan);
if(bbText)bbText.addEventListener('input',scan);
if(bbClear)bbClear.addEventListener('click',function(){if(bbText)bbText.value='';scan();});

/* ---------- Quiz ---------- */
var Q=[{a:0,e:'A boundary is a statement, not a request for permission — you need not Justify, Argue, Defend, or Explain.'},{a:1,e:'Threats or control are coercion; stepping back and seeking support is the healthiest, most self-respecting move.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;Q.forEach(function(it,i){document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});

/* ---------- Reflection ---------- */
var ta=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),st2=null;
function flash2(m){if(!refStatus)return;refStatus.textContent=m;if(st2)clearTimeout(st2);st2=setTimeout(function(){refStatus.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef'),clearBtn=document.getElementById('clearBtn');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash2('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ta?ta.value:'',copyRef);});
if(clearBtn)clearBtn.addEventListener('click',function(){if(ta.value.trim()&&!window.confirm('Clear your reflection on this device?'))return;ta.value='';if(A.remove)A.remove('reflect');flash2('Cleared.');ta.focus();});
}catch(e){console.error('project 010 script error',e);}
});
