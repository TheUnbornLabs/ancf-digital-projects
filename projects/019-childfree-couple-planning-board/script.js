document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var areas=[].slice.call(document.querySelectorAll('#board textarea'));
var bar=document.getElementById('bar'),pct=document.getElementById('pct'),chart=document.getElementById('boardChart');
function words(t){t=(t||'').trim();return t?t.split(/\s+/).length:0;}
function render(){
  var filled=0,items=[];
  areas.forEach(function(t){var w=words(t.value);if(w>0)filled++;items.push({label:t.getAttribute('data-label'),value:w});});
  if(A.meter)A.meter(bar,filled/areas.length*100);if(pct)pct.textContent=Math.round(filled/areas.length*100)+'%';
  if(A.barChart)A.barChart(chart,items,{max:Math.max(5,Math.max.apply(null,items.map(function(i){return i.value;}))),fmt:function(v){return v;},title:'Words per area'});
}
if(areas.length){
  var s=A.getJSON?A.getJSON('board',{}):{};s=s||{};
  areas.forEach(function(t){if(s[t.id]!=null)t.value=s[t.id];t.addEventListener('input',function(){s[t.id]=t.value;if(A.setJSON)A.setJSON('board',s);render();});});
  render();
}
var status=document.getElementById('status'),timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
var saveBtn=document.getElementById('saveBtn'),copyBtn=document.getElementById('copyBtn'),clearBtn=document.getElementById('clearBtn');
if(saveBtn)saveBtn.addEventListener('click',function(){var s={};areas.forEach(function(t){s[t.id]=t.value;});if(A.setJSON)A.setJSON('board',s);flash('Saved ✓');});
if(copyBtn)copyBtn.addEventListener('click',function(){
  var lines=['Our childfree planning board',''];var any=false;
  areas.forEach(function(t){if(t.value.trim()){any=true;lines.push(t.getAttribute('data-label')+':',t.value.trim(),'');}});
  if(!any){flash('Write something first.');return;}
  if(A.copy)A.copy(lines.join('\n'),copyBtn);
});
if(clearBtn)clearBtn.addEventListener('click',function(){if(!window.confirm('Clear the whole board on this device?'))return;areas.forEach(function(t){t.value='';});if(A.remove)A.remove('board');render();flash('Cleared.');});

/* ---------- Quiz ---------- */
var Q=[{a:1,e:'A childfree life is a canvas to fill with what you value — not an absence to justify.'},{a:0,e:'Writing plans down makes them more real and actionable; it does not lock you in — you can always revise.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;Q.forEach(function(it,i){document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 019 script error',e);}
});
