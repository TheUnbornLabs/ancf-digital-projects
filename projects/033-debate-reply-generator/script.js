document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var R={
 mind:{calm:'I might, and if I do, that\'s fine — but I\'ve thought about this carefully, and right now it\'s a settled, considered choice.',curious:'What makes a considered decision count less than a guess about my future self? I\'m comfortable either way.',firm:'I\'ve decided, and "you\'ll change your mind" isn\'t an argument — it\'s a prediction. Let\'s leave it there.'},
 care:{calm:'Children aren\'t a retirement plan; I\'m building friendships, savings, and support I can actually count on.',curious:'Is having children really the most reliable plan for old age? I\'d rather plan deliberately.',firm:'No one should be born to be a carer. I\'m planning for my future in fairer ways.'},
 selfish:{calm:'Choosing the life that fits me isn\'t selfish — and plenty of caring people are childfree.',curious:'Which is more selfish: choosing not to parent, or having a child for the wrong reasons? Neither, maybe — it\'s personal.',firm:'Calling a personal choice "selfish" is a way to pressure, not a fact. My decision harms no one.'},
 natural:{calm:'"Natural" isn\'t the same as "obligatory" — we choose against many natural urges every day.',curious:'If natural settled ethics, a lot of medicine and culture would be off the table. Why is this the exception?',firm:'Appeals to "nature" don\'t decide my life. People build meaningful lives in many ways.'},
 society:{calm:'Society needs many things; no individual is obligated to supply population. I contribute in other ways.',curious:'Should anyone be born to serve a demographic target? That seems to use a person as a means.',firm:'Collective needs don\'t override one person\'s autonomy over their own body and life.'}
};
var claim=document.getElementById('claim'),style=document.getElementById('style'),out=document.getElementById('out');
function build(){out.value=(R[claim.value]||R.mind)[style.value]||'';if(A.set)A.set('reply',out.value);}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',build);
if(claim)claim.addEventListener('change',build);if(style)style.addEventListener('change',build);
if(out){if(A.get)out.value=A.get('reply','');out.addEventListener('input',function(){if(A.set)A.set('reply',out.value);});if(!out.value)build();}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(out.value||'',copyBtn);});

var QZ=[{a:1,e:'Aim at the argument, not the person — that keeps the relationship and your dignity.'},{a:1,e:'You\'re obliged to debate no one; engaging is always your choice.'}];
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
}catch(e){console.error('project 033 script error',e);}
});
