document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var DIMS=['Creates a new life?','Main concern','About existing people?','Key claim','On others’ choices'];
var POS={
 anti:{label:'Antinatalism',d:['Questions it','Ethics of creating life','No — future births only','Creating a life needs justification','Respects them; argues the ethics']},
 cf:{label:'Childfree (by choice)',d:['Not for oneself','Personal autonomy & life design','N/A — a personal choice','A life without children can be full','Lives and lets live']},
 pro:{label:'Pronatalism','d':['Encourages it','Continuity & social norms','N/A','Having children is the expected good','Often pressures toward children']},
 auto:{label:'Reproductive autonomy',d:['Neutral','Freedom to decide either way','Protects living people’s rights','The choice belongs to each person','Defends all choices equally']},
 care:{label:'Adoption-focused care',d:['No — cares for existing','Meeting an existing need','Centres existing children','Care can go to those already here','Non-judgemental of other paths']}
};
var keys=Object.keys(POS);
var a=document.getElementById('a'),b=document.getElementById('b'),cmp=document.getElementById('cmp');
keys.forEach(function(k){var o1=document.createElement('option');o1.value=k;o1.textContent=POS[k].label;a.appendChild(o1);var o2=o1.cloneNode(true);b.appendChild(o2);});
a.value='anti';b.value='cf';
function render(){
  var pa=POS[a.value],pb=POS[b.value];
  var html='<div class="kv" style="grid-template-columns:1fr 1fr 1fr;gap:8px 12px"><strong></strong><strong style="color:var(--accent-2)">'+pa.label+'</strong><strong style="color:var(--accent-2)">'+pb.label+'</strong>';
  DIMS.forEach(function(d,i){html+='<strong>'+d+'</strong><span>'+pa.d[i]+'</span><span>'+pb.d[i]+'</span>';});
  html+='</div>';cmp.innerHTML=html;
}
[a,b].forEach(function(s){s.addEventListener('change',render);});render();
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){var pa=POS[a.value],pb=POS[b.value];var L=['Comparison: '+pa.label+' vs '+pb.label,''];DIMS.forEach(function(d,i){L.push(d+'\n  - '+pa.label+': '+pa.d[i]+'\n  - '+pb.label+': '+pb.d[i]);});A.copy&&A.copy(L.join('\n'),copyBtn);});

var QZ=[{a:1,e:'Antinatalism and childfree are related but distinct — one is an ethical argument, the other a personal choice.'},{a:1,e:'Reproductive autonomy defends the freedom to choose either way.'}];
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
}catch(e){console.error('project 055 script error',e);}
});
