document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var T={
 sasia:'In much of South Asia, family and marriage carry strong social weight, so choosing childfree life is often a quietly courageous, increasingly visible decision — especially among younger and urban people.',
 easia:'Across East Asia, falling birth rates have made personal choice a prominent public conversation, with many weighing careers, cost, and freedom alongside tradition.',
 europe:'In many European countries, childfree living is comparatively openly discussed, though social expectations and gentle pressure still appear in families.',
 namerica:'In North America, a sizeable, vocal childfree community exists online and offline, alongside ongoing debates about cost, climate, and autonomy.',
 latam:'In Latin America, strong family traditions meet a growing movement of people, especially women, asserting reproductive choice and rethinking expectations.',
 mena:'Across the Middle East and North Africa, family is highly valued and the topic is often private, yet individual voices choosing differently are emerging.',
 ssa:'In parts of Sub-Saharan Africa, children carry deep cultural and economic meaning, and childfree choices, while less discussed publicly, exist and are slowly gaining voice.',
 oceania:'In Australia, New Zealand and across Oceania, childfree life is fairly openly discussed, with conversations often touching on lifestyle, environment, and freedom.'
};
var detail=document.getElementById('detail');
[].slice.call(document.querySelectorAll('#regions .region')).forEach(function(b){
  b.addEventListener('click',function(){
    document.querySelectorAll('#regions .region').forEach(function(x){x.classList.remove('active');});
    b.classList.add('active');
    detail.innerHTML='<p><strong>'+b.textContent+'</strong></p><p>'+(T[b.getAttribute('data-k')]||'')+'</p><p class="note">A broad theme, not a rule — individuals vary widely.</p>';
  });
});

var QZ=[{a:1,e:'It offers broad themes and explicitly respects individual variation.'},{a:1,e:'Childfree choices exist in every culture and region.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You got '+sc+' of '+QZ.length+'.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 091 script error',e);}
});
