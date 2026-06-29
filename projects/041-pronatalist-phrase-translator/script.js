document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var P=[
 ['"You\'ll change your mind."','Assumes your decision isn\'t real or considered.','A considered choice is not a phase. If it ever changes, that\'s mine to decide.'],
 ['"Who\'ll look after you when you\'re old?"','Assumes children are a retirement plan.','I\'m building friendships, savings, and care I can actually count on.'],
 ['"It\'s selfish."','Assumes a personal choice harms others.','Choosing the life that fits me harms no one — and plenty of caring people are childfree.'],
 ['"It\'s only natural."','Assumes "natural" settles what you should do.','People build meaningful lives in many ways; natural isn\'t the same as obligatory.'],
 ['"A real family has children."','Ties your worth and "family" to having kids.','Love makes a family, in any shape — not headcount.'],
 ['"You\'d be such a good parent."','A compliment that assumes parenthood is your goal.','Thank you — and it\'s still not the path I\'m choosing.'],
 ['"Everyone has kids."','Appeals to majority pressure.','Common isn\'t the same as right for me.'],
 ['"You\'ll regret it."','Predicts future regret to create fear.','Regret is possible on every path; I\'m at peace with mine.']
];
var sel=document.getElementById('phrase'),out=document.getElementById('out');
P.forEach(function(p,i){var o=document.createElement('option');o.value=i;o.textContent=p[0];sel.appendChild(o);});
function show(){var p=P[+sel.value]||P[0];out.innerHTML='<strong>Phrase:</strong> '+p[0]+'<br><strong>Assumes:</strong> '+p[1]+'<br><strong>A kind reply:</strong> “'+p[2]+'”';}
if(sel){sel.addEventListener('change',show);show();}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){var p=P[+sel.value]||P[0];A.copy&&A.copy(p[0]+'\nAssumes: '+p[1]+'\nReply: “'+p[2]+'”',copyBtn);});

var QZ=[{a:1,e:'It\'s for understanding the assumption underneath — not catching anyone out.'},{a:1,e:'Most pressure phrases come from people who usually mean well.'}];
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
}catch(e){console.error('project 041 script error',e);}
});
