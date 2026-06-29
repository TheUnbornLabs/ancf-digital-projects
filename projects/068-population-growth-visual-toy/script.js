document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
function fmt(x){return Math.round(x).toLocaleString();}
var start=document.getElementById('start'),rate=document.getElementById('rate'),years=document.getElementById('years');
var oS=document.getElementById('o-start'),oR=document.getElementById('o-rate'),oY=document.getElementById('o-years');
var finalOut=document.getElementById('finalOut'),dblOut=document.getElementById('dblOut'),chart=document.getElementById('growthChart');
function update(){
  var s=+start.value,r=+rate.value/100,y=+years.value;
  if(oS)oS.textContent=s;if(oR)oR.textContent=(+rate.value)+'%';if(oY)oY.textContent=y;
  var fin=s*Math.pow(1+r,y);
  if(finalOut)finalOut.textContent=fmt(fin);
  if(dblOut)dblOut.textContent=(r>0?(Math.round(Math.log(2)/Math.log(1+r))+' yrs'):'never (0%)');
  var items=[];var steps=5;for(var i=0;i<=steps;i++){var t=Math.round(y*i/steps);items.push({label:t+'y',value:Math.round(s*Math.pow(1+r,t))});}
  if(A.barChart)A.barChart(chart,items,{fmt:fmt,title:'Number over time'});
  if(A.setJSON)A.setJSON('pop',{s:start.value,r:rate.value,y:years.value});
}
[start,rate,years].forEach(function(e){if(e)e.addEventListener('input',update);});
(function(){var st=A.getJSON?A.getJSON('pop',null):null;if(st){if(st.s)start.value=st.s;if(st.r)rate.value=st.r;if(st.y)years.value=st.y;}})();
update();

var QZ=[{a:1,e:'Exponential growth feels slow at first, then sudden.'},{a:1,e:'It is a neutral maths demonstration — not a claim about real populations or a group.'}];
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
}catch(e){console.error('project 068 script error',e);}
});
