document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
function num(id){var e=document.getElementById(id);var v=parseFloat(e?e.value:0);return isNaN(v)?0:v;}
function fmt(x){return Math.round(x).toLocaleString();}
var ids=['age','retire','savings','monthly','rate','target'];
var rate=document.getElementById('rate'),oRate=document.getElementById('o-rate');
var potOut=document.getElementById('potOut'),contribOut=document.getElementById('contribOut'),growthOut=document.getElementById('growthOut');
var targetWrap=document.getElementById('targetWrap'),targetBar=document.getElementById('targetBar'),targetPct=document.getElementById('targetPct'),chart=document.getElementById('growthChart');

function potAt(t,savings,monthly,r){ // t years
  var mr=r/12,months=t*12;
  var fromSav=savings*Math.pow(1+r,t);
  var fromCon=mr===0?monthly*months:monthly*((Math.pow(1+mr,months)-1)/mr);
  return fromSav+fromCon;
}
function recompute(){
  var age=num('age'),retire=num('retire'),savings=num('savings'),monthly=num('monthly'),r=num('rate')/100,target=num('target');
  if(oRate)oRate.textContent=num('rate')+'%';
  var years=Math.max(0,retire-age);
  var pot=potAt(years,savings,monthly,r);
  var contributed=savings+monthly*years*12;
  if(potOut)potOut.textContent=fmt(pot);
  if(contribOut)contribOut.textContent=fmt(contributed);
  if(growthOut)growthOut.textContent=fmt(Math.max(0,pot-contributed));
  if(target>0){targetWrap.style.display='block';var p=Math.min(100,Math.round(pot/target*100));if(A.meter)A.meter(targetBar,p);if(targetPct)targetPct.textContent=p+'%';}
  else if(targetWrap)targetWrap.style.display='none';
  // chart milestones
  var items=[];if(years<=0){items.push({label:'now',value:Math.round(pot)});}
  else{var steps=Math.min(5,years);for(var i=1;i<=steps;i++){var t=Math.round(years*i/steps);items.push({label:'+'+t+'y',value:Math.round(potAt(t,savings,monthly,r))});}}
  if(A.barChart)A.barChart(chart,items,{fmt:fmt,title:'Projected pot over time'});
  var store={};ids.forEach(function(id){store[id]=num(id);});if(A.setJSON)A.setJSON('retire',store);
}
ids.forEach(function(id){var e=document.getElementById(id);if(e)e.addEventListener('input',recompute);});
(function(){var s=A.getJSON?A.getJSON('retire',null):null;if(s)ids.forEach(function(id){var e=document.getElementById(id);if(e&&s[id]!=null&&!(id==='target'&&!s[id]))e.value=s[id];});})();
recompute();

/* ---------- Quiz ---------- */
var Q=[{a:1,e:'Deliberate financial and social planning is the dependable route — children are not a retirement plan.'},{a:1,e:'It is illustrative; real returns vary and this model excludes tax and inflation.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;Q.forEach(function(it,i){document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});

/* ---------- Reflection ---------- */
var ta=document.getElementById('reflect'),status=document.getElementById('saveStatus'),timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyBtn=document.getElementById('copyBtn'),clearBtn=document.getElementById('clearBtn');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash('Saved ✓');});
if(clearBtn)clearBtn.addEventListener('click',function(){if(ta.value.trim()&&!window.confirm('Clear your reflection on this device?'))return;ta.value='';if(A.remove)A.remove('reflect');flash('Cleared.');ta.focus();});
if(copyBtn)copyBtn.addEventListener('click',function(){
  var age=num('age'),retire=num('retire'),years=Math.max(0,retire-age),savings=num('savings'),monthly=num('monthly'),r=num('rate')/100;
  var pot=potAt(years,savings,monthly,r);
  var lines=['Retirement planning — my projection (illustrative)',''];
  lines.push('From age '+age+' to '+retire+' ('+years+' yrs), saving '+fmt(monthly)+'/mo at '+num('rate')+'%:');
  lines.push('Projected pot: '+fmt(pot));
  lines.push('','My reflection:',(ta&&ta.value.trim())?ta.value.trim():'(left blank)');
  lines.push('','(Illustrative only — not financial advice.)');
  if(A.copy)A.copy(lines.join('\n'),copyBtn);
});
}catch(e){console.error('project 020 script error',e);}
});
