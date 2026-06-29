document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var L={
 kind:['We\'re happy as we are, thank you for asking!','No plans on that front — but it\'s sweet that you care.','That\'s not in the cards for us, and we\'re content.'],
 witty:['Right after I finish raising myself!','We\'re focusing on our houseplants for now.','Statistically? Unlikely. Personally? Also unlikely.'],
 firm:['That\'s a private decision, and it\'s settled.','We\'re not planning to — and I\'d rather not discuss it.','I\'ll share news if there\'s ever news to share.'],
 deflect:['Oh, who knows! Anyway — how are you doing?','Big question for a small-talk moment! Tell me your news.','Let\'s not put me on the spot — what\'s new with you?']
};
var vibe=document.getElementById('vibe'),out=document.getElementById('out'),all=document.getElementById('all');var idx=0;
function renderAll(){all.innerHTML='';(L[vibe.value]||[]).forEach(function(s){var li=document.createElement('li');li.textContent=s;all.appendChild(li);});}
function give(){var arr=L[vibe.value]||L.kind;out.textContent='“'+arr[idx%arr.length]+'”';idx++;}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',give);
if(vibe)vibe.addEventListener('change',function(){idx=0;renderAll();out.textContent='Tap "Give me a line".';});
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(out.textContent&&out.textContent.indexOf('Pick a vibe')<0&&out.textContent.indexOf('Give me')<0?out.textContent:'“'+(L[vibe.value]||L.kind)[0]+'”',copyBtn);});
renderAll();

var QZ=[{a:0,e:'A good one-liner is a polite way to close the topic — never an insult.'},{a:1,e:'You owe basic courtesy, never a justification of your private life.'}];
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
}catch(e){console.error('project 035 script error',e);}
});
