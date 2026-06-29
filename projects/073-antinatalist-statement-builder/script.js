document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var core={consent:'I hold that creating a new person imposes the risks of a whole life on someone who cannot consent in advance, and that this deserves serious ethical justification.',suffering:'I hold that because every life carries some risk of serious suffering, choosing not to create a new person is a reasonable way to avoid imposing that risk on someone who cannot weigh it.',asymmetry:'I find the asymmetry argument compelling: the absence of suffering is good even with no one to enjoy it, while the absence of pleasure is not a loss when there is no one to be deprived.',autonomy:'I hold that whether to bring a new person into existence is a weighty ethical decision rather than an automatic duty, and that the question belongs to careful reflection.',ecology:'I weigh ecological limits as one personal consideration among many, focused on systems and consumption rather than on judging any family.'};
var pre={measured:'After careful thought, ',personal:'For me, ',academic:'On the view I find most defensible, '};
var basis=document.getElementById('basis'),tone=document.getElementById('tone'),out=document.getElementById('out');
function build(){out.value=(pre[tone.value]||'')+(core[basis.value]||core.consent)+' I hold this view about the ethics of creating life, not as any judgement of parents, children, or families — for whom I have full respect — and I welcome disagreement made in good faith.';if(A.set)A.set('stmt',out.value);}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',build);
if(basis)basis.addEventListener('change',build);if(tone)tone.addEventListener('change',build);
if(out){if(A.get)out.value=A.get('stmt','');out.addEventListener('input',function(){if(A.set)A.set('stmt',out.value);});if(!out.value)build();}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(out.value||'',copyBtn);});

var QZ=[{a:1,e:'Argue the idea, with respect for people.'},{a:1,e:'A respect line keeps a strong claim civil and fair.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+QZ.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 073 script error',e);}
});
