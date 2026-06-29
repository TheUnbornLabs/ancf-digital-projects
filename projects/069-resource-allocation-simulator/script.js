document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
function fmt(x){return Math.round(x).toLocaleString();}
var pool=document.getElementById('pool'),size=document.getElementById('size'),oP=document.getElementById('o-pool'),oS=document.getElementById('o-size'),perOut=document.getElementById('perOut'),chart=document.getElementById('allocChart');
function update(){
  var p=+pool.value,s=+size.value;if(oP)oP.textContent=p;if(oS)oS.textContent=s;
  if(perOut)perOut.textContent=fmt(p/s)+' / person';
  var items=[];for(var n=1;n<=6;n++){items.push({label:n+(n===1?' person':' people'),value:Math.round(p/n)});}
  if(A.barChart)A.barChart(chart,items,{fmt:fmt,title:'Per-person share'});
  if(A.setJSON)A.setJSON('alloc',{p:pool.value,s:size.value});
}
[pool,size].forEach(function(e){if(e)e.addEventListener('input',update);});
(function(){var st=A.getJSON?A.getJSON('alloc',null):null;if(st){if(st.p)pool.value=st.p;if(st.s)size.value=st.s;}})();
update();

var QZ=[{a:1,e:'"More people, smaller slices" holds only when the pool is fixed.'},{a:1,e:'It is a neutral division illustration — not a judgment or a claim that love is finite.'}];
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
}catch(e){console.error('project 069 script error',e);}
});
