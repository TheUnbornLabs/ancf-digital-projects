document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var honour={grandparent:'I really value your wisdom, and I know this comes from love.',relative:'Thank you — I know you care about me, and I respect your experience.',neighbour:'That\'s kind of you, and I appreciate you looking out for me.'};
var bound={warm:'I\'ve thought about this with care, and a life without children is right for me. I\'d love to keep enjoying your company through all of it.',"gentle-firm":'I\'ve made a considered decision that\'s right for my life, and I\'d be grateful to leave it there.',brief:'It\'s a settled decision for me — but thank you for caring.'};
var who=document.getElementById('who'),tone=document.getElementById('tone'),out=document.getElementById('out');
function build(){out.value=(honour[who.value]||'')+' '+(bound[tone.value]||'');if(A.set)A.set('reply',out.value);}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',build);
if(who)who.addEventListener('change',build);if(tone)tone.addEventListener('change',build);
if(out){if(A.get)out.value=A.get('reply','');out.addEventListener('input',function(){if(A.set)A.set('reply',out.value);});if(!out.value)build();}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(out.value||'',copyBtn);});

var QZ=[{a:1,e:'Respecting an elder and keeping your boundary are fully compatible.'},{a:1,e:'Thanking an elder for their care can sit right alongside a clear "no".'}];
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
}catch(e){console.error('project 049 script error',e);}
});
