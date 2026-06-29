document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var Q={
 options:['What options are available to me, and how do they differ?'],
 permanence:['How permanent is each option, and is reversal ever possible?'],
 risks:['What are the risks, the recovery like, and what should I expect afterwards?'],
 eligibility:['Am I eligible, and is there any required waiting period or timing?'],
 access:['Where can this be done, and what would it cost?'],
 secondopinion:['If I want a second opinion, how would I go about that?']
};
var boxes=[].slice.call(document.querySelectorAll('#focus input[type=checkbox]'));
var out=document.getElementById('out');
function build(){
  var L=['Questions for my provider:',''];var n=1;
  boxes.forEach(function(b){if(b.checked){(Q[b.getAttribute('data-key')]||[]).forEach(function(q){L.push(n+'. '+q);n++;});}});
  if(n===1){L.push('(Tick some topics above to add questions.)');}
  L.push('','I would like time to think before deciding anything.');
  out.value=L.join('\n');if(A.set)A.set('sterq',out.value);
}
var saved=A.getJSON?A.getJSON('focus',{}):{};saved=saved||{};
boxes.forEach(function(b){var k=b.getAttribute('data-key');if(saved[k])b.checked=true;b.addEventListener('change',function(){saved[k]=b.checked;if(A.setJSON)A.setJSON('focus',saved);});});
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',build);
if(out){if(A.get)out.value=A.get('sterq','');out.addEventListener('input',function(){if(A.set)A.set('sterq',out.value);});if(!out.value)build();}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(out.value||'',copyBtn);});

var QZ=[{a:1,e:'This tool only helps you prepare questions — it makes no recommendation.'},{a:1,e:'The decision belongs to you and a qualified provider.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You got '+sc+' of '+QZ.length+'.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 084 script error',e);}
});
