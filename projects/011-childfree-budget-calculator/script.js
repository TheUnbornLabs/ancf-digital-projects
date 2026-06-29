document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
function n(v){v=parseFloat(v);return isNaN(v)||v<0?0:v;}
function fmt(x){return Math.round(x).toLocaleString();}

var cats=[].slice.call(document.querySelectorAll('#root, .panel')); // noop guard
var inputs=['c-childcare','c-food','c-edu','c-health','c-activities','c-housing'].map(function(id){return document.getElementById(id);}).filter(Boolean);
var sumMonth=document.getElementById('sumMonth'),sumYear=document.getElementById('sumYear'),sum18=document.getElementById('sum18'),catChart=document.getElementById('catChart');
var years=document.getElementById('years'),rate=document.getElementById('rate'),oY=document.getElementById('o-years'),oR=document.getElementById('o-rate'),projOut=document.getElementById('projOut');

function recompute(){
  var month=0,items=[];
  inputs.forEach(function(inp){var v=n(inp.value);month+=v;items.push({label:inp.getAttribute('data-label'),value:v*12});});
  if(sumMonth)sumMonth.textContent=fmt(month);
  if(sumYear)sumYear.textContent=fmt(month*12);
  if(sum18)sum18.textContent=fmt(month*12*18);
  if(A.barChart)A.barChart(catChart,items,{fmt:fmt,title:'Annual estimate by category'});
  var store={};inputs.forEach(function(inp){store[inp.id]=inp.value;});if(A.setJSON)A.setJSON('budget',store);
  projection(month);
}
function projection(month){
  if(!projOut)return;
  if(!month){projOut.textContent='Enter monthly amounts above to see a projection.';return;}
  var yr=years?+years.value:20,rt=rate?+rate.value:5,r=rt/100/12,nn=yr*12;
  var fv=r===0?month*nn:month*((Math.pow(1+r,nn)-1)/r);
  var contributed=month*nn;
  projOut.textContent='Investing about '+fmt(month)+' / month for '+yr+' years at '+rt+'% could grow to roughly '+fmt(fv)+' (you would have contributed '+fmt(contributed)+'). Illustrative only — returns vary and are never guaranteed.';
}
if(inputs.length){
  var s=A.getJSON?A.getJSON('budget',null):null;
  inputs.forEach(function(inp){if(s&&s[inp.id]!=null)inp.value=s[inp.id];inp.addEventListener('input',recompute);});
}
if(years)years.addEventListener('input',function(){oY.textContent=years.value;recompute();});
if(rate)rate.addEventListener('input',function(){oR.textContent=rate.value+'%';recompute();});
recompute();

/* ---------- Quiz ---------- */
var Q=[{a:1,e:'These are rough, editable illustrations — replace them with your own figures.'},{a:0,e:'Compound growth means returns can themselves earn returns over time — but it is never risk-free or guaranteed.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;Q.forEach(function(it,i){document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});

/* ---------- Reflection + summary ---------- */
var ta=document.getElementById('reflect'),status=document.getElementById('saveStatus'),timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyBtn=document.getElementById('copyBtn'),clearBtn=document.getElementById('clearBtn');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash('Saved ✓');});
if(clearBtn)clearBtn.addEventListener('click',function(){if(ta.value.trim()&&!window.confirm('Clear your reflection on this device?'))return;ta.value='';if(A.remove)A.remove('reflect');flash('Cleared.');ta.focus();});
if(copyBtn)copyBtn.addEventListener('click',function(){
  var month=0;inputs.forEach(function(inp){month+=n(inp.value);});
  var lines=['Childfree budget — my estimate (illustrative)',''];
  lines.push('Per month: '+fmt(month),'Per year: '+fmt(month*12),'Over 18 years: '+fmt(month*12*18));
  lines.push('','My reflection:',(ta&&ta.value.trim())?ta.value.trim():'(left blank)');
  if(A.copy)A.copy(lines.join('\n'),copyBtn);
});
}catch(e){console.error('project 011 script error',e);}
});
