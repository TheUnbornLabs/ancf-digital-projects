document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var S={
 autonomy:['My body, my future, my choice','Autonomy is for everyone','Trust people to decide their own lives','Whose life? Mine to live'],
 choice:['Every choice deserves respect','Childfree is a valid choice','Choice, not pressure','Free to choose, in every direction'],
 respect:['Respect the choice, all choices','Different paths, equal dignity','No judgement, just respect','Families come in every shape'],
 freedom:['Freedom to choose, freedom to be','Build the life that fits you','Live by your own reasons','Free people, free choices']
};
var focus=document.getElementById('focus'),out=document.getElementById('out');var idx=0;
function show(){var arr=S[focus.value]||S.autonomy;out.textContent='“'+arr[idx%arr.length]+'”';}
var genBtn=document.getElementById('genBtn'),anotherBtn=document.getElementById('anotherBtn');
if(genBtn)genBtn.addEventListener('click',function(){idx=Math.floor(Math.random()*(S[focus.value]||S.autonomy).length);show();});
if(anotherBtn)anotherBtn.addEventListener('click',function(){idx++;show();});
if(focus)focus.addEventListener('change',function(){idx=0;show();});
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(out.textContent&&out.textContent.indexOf('Pick a focus')<0?out.textContent:'“'+(S[focus.value]||S.autonomy)[0]+'”',copyBtn);});

var QZ=[{a:1,e:'A strong slogan is short, positive, and memorable.'},{a:1,e:'The best advocacy stands for a value, inclusively.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+QZ.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 075 script error',e);}
});
