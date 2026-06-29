document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var reduce=document.getElementById('reduce'),months=document.getElementById('months'),
    oRed=document.getElementById('o-reduce'),oMon=document.getElementById('o-months'),
    totHrs=document.getElementById('totHrs'),totNights=document.getElementById('totNights'),totDays=document.getElementById('totDays'),chart=document.getElementById('debtChart');
var DPM=30.4;
function recompute(){
  var r=+reduce.value,m=+months.value;
  if(oRed)oRed.textContent=r+' h';if(oMon)oMon.textContent=m;
  var hrs=r*DPM*m;
  if(totHrs)totHrs.textContent=Math.round(hrs).toLocaleString();
  if(totNights)totNights.textContent=Math.round(hrs/8).toLocaleString();
  if(totDays)totDays.textContent=Math.round(hrs/24).toLocaleString();
  var milestones=[1,3,6,12];
  var items=milestones.map(function(mm){return {label:mm+' mo',value:Math.round(r*DPM*mm/8)};});
  if(A.barChart)A.barChart(chart,items,{title:'Cumulative sleep debt (full nights)',fmt:function(v){return v;}});
  if(A.set){A.set('reduce',String(r));A.set('months',String(m));}
}
if(reduce&&months){
  var sr=A.get?A.get('reduce',''):'';if(sr!=='')reduce.value=sr;
  var sm=A.get?A.get('months',''):'';if(sm!=='')months.value=sm;
  recompute();reduce.addEventListener('input',recompute);months.addEventListener('input',recompute);
}

/* ---------- Quiz ---------- */
var Q=[{a:1,e:'Small nightly shortfalls compound — over months they add up to a large cumulative total.'},{a:1,e:'It is an illustrative thinking tool, not a medical assessment or a prediction for anyone specific.'}];
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
  var r=+reduce.value,m=+months.value,hrs=r*DPM*m;
  var lines=['Sleep loss — my model (illustrative)',''];
  lines.push(r+' h/night lost over '+m+' months ≈ '+Math.round(hrs).toLocaleString()+' hours ('+Math.round(hrs/8).toLocaleString()+' full nights).');
  lines.push('','My reflection:',(ta&&ta.value.trim())?ta.value.trim():'(left blank)');
  if(A.copy)A.copy(lines.join('\n'),copyBtn);
});
}catch(e){console.error('project 014 script error',e);}
});
