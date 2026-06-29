document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var vibe=document.getElementById('vibe'),out=document.getElementById('out');
var boxes=[].slice.call(document.querySelectorAll('#ints input[type=checkbox]'));
function joinNice(a){if(a.length<=1)return a.join('');if(a.length===2)return a[0]+' and '+a[1];return a.slice(0,-1).join(', ')+', and '+a[a.length-1];}
var open={friendly:'Childfree and loving it.',witty:'Childfree by choice, chaos-free by design.',calm:'Living childfree, intentionally and at my own pace.'};
var close={friendly:'Say hi!',witty:'Houseplants: thriving. Me: also thriving.',calm:'Building a quiet, full life.'};
function build(){
  var picks=boxes.filter(function(b){return b.checked;}).map(function(b){return b.getAttribute('data-w');});
  var mid=picks.length?(' Into '+joinNice(picks)+'.'):' Into a life that\'s fully my own.';
  out.value=(open[vibe.value]||open.friendly)+mid+' '+(close[vibe.value]||close.friendly);
  if(A.set)A.set('bio',out.value);
}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',build);
if(out){if(A.get)out.value=A.get('bio','');out.addEventListener('input',function(){if(A.set)A.set('bio',out.value);});if(!out.value)build();}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(out.value||'',copyBtn);});

var QZ=[{a:1,e:'Lead with what you love and value.'},{a:1,e:'Edit it so it sounds like you.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+QZ.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 072 script error',e);}
});
