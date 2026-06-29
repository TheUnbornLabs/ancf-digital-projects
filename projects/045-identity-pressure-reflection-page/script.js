document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var WORDS=['none','mild','moderate','strong','very strong'];
var inputs=[].slice.call(document.querySelectorAll('#pressures input[type=range]'));
var chart=document.getElementById('presChart');
function update(){var items=inputs.map(function(inp){var out=document.getElementById(inp.id.replace('i-','o-'));if(out)out.textContent=WORDS[+inp.value];return {label:inp.getAttribute('data-axis'),value:+inp.value};});if(A.barChart)A.barChart(chart,items,{max:4,fmt:function(v){return WORDS[v];},title:'Identity pressure'});var store={};inputs.forEach(function(inp){store[inp.id]=inp.value;});if(A.setJSON)A.setJSON('idp',store);}
if(inputs.length){var s=A.getJSON?A.getJSON('idp',null):null;inputs.forEach(function(inp){if(s&&s[inp.id]!=null)inp.value=s[inp.id];inp.addEventListener('input',update);});update();}

var QZ=[{a:1,e:'Loving your culture and choosing differently can both be true at once.'},{a:0,e:'Genuine belonging can hold disagreement — it doesn\'t require total obedience.'}];
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
}catch(e){console.error('project 045 script error',e);}
});
