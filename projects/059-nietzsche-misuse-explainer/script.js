document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var M=[
 ['"Nietzsche proves life is meaningless."','He diagnosed nihilism as a danger to overcome, not a goal. His project was to affirm life and create new, life-affirming values.'],
 ['"What doesn\'t kill you makes you stronger" — so suffering is fine.','A glib reduction. His view of suffering is complex: it can ennoble or destroy, and isn\'t a blanket endorsement of hardship.'],
 ['"The Übermensch means a superior race."','No. It\'s about self-overcoming and creating one\'s own values. The racial reading is a later distortion he would have rejected.'],
 ['"Nietzsche supports antinatalism / life isn\'t worth living."','The opposite, really: amor fati and eternal recurrence are radical "yes-saying" to life — a poor fit for pessimism.'],
 ['(A random "Nietzsche quote" from the internet.)','Many viral "Nietzsche quotes" are misattributed or fabricated. Check the source and the work before trusting one.']
];
var pick=document.getElementById('pick'),out=document.getElementById('out');
M.forEach(function(m,i){var o=document.createElement('option');o.value=i;o.textContent=m[0];pick.appendChild(o);});
function show(){var m=M[+pick.value]||M[0];out.innerHTML='<strong>Claim:</strong> '+m[0]+'<br><strong>Fairer reading:</strong> '+m[1];}
if(pick){pick.addEventListener('change',show);show();}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){var m=M[+pick.value]||M[0];A.copy&&A.copy('Claim: '+m[0]+'\nFairer reading: '+m[1],copyBtn);});

var QZ=[{a:1,e:'His deepest theme is a radical affirmation of life (amor fati, eternal recurrence).'},{a:0,e:'Always read a thinker in context before quoting them.'}];
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
}catch(e){console.error('project 059 script error',e);}
});
