document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var inputs=[].slice.call(document.querySelectorAll('#week input[type=range]'));
var discHrs=document.getElementById('discHrs'),discBar=document.getElementById('discBar'),discNote=document.getElementById('discNote'),chart=document.getElementById('weekChart');
function recompute(){
  var used=0,items=[];
  inputs.forEach(function(inp){var v=+inp.value;used+=v;items.push({label:inp.getAttribute('data-label'),value:v});var out=document.getElementById(inp.id.replace('h-','o-'));if(out)out.textContent=v;});
  var disc=Math.max(0,168-used);
  items.push({label:'Discretionary',value:disc});
  if(discHrs)discHrs.textContent=disc+' h/wk';
  if(A.meter)A.meter(discBar,disc/168*100);
  if(discNote)discNote.textContent='That is about '+disc+' discretionary hours a week — roughly '+(disc*52).toLocaleString()+' hours a year.'+(used>168?' (Your commitments exceed 168 — the week is over-full; something has to give.)':'');
  if(A.barChart)A.barChart(chart,items,{max:Math.max(168,used),title:'Weekly hours'});
  var store={};inputs.forEach(function(inp){store[inp.id]=inp.value;});if(A.setJSON)A.setJSON('week',store);
}
if(inputs.length){var s=A.getJSON?A.getJSON('week',null):null;inputs.forEach(function(inp){if(s&&s[inp.id]!=null)inp.value=s[inp.id];inp.addEventListener('input',recompute);});recompute();}

/* ---------- Quiz ---------- */
var Q=[{a:0,e:'Discretionary time is what remains after your set commitments — it is yours to direct.'},{a:1,e:'All else equal, more caregiving hours leave fewer discretionary hours — though that time is often given gladly.'}];
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
  var used=0;inputs.forEach(function(inp){used+=+inp.value;});var disc=Math.max(0,168-used);
  var lines=['Time freedom — my week (illustrative)',''];
  inputs.forEach(function(inp){lines.push('  • '+inp.getAttribute('data-label')+': '+inp.value+' h/wk');});
  lines.push('  • Discretionary: '+disc+' h/wk (~'+(disc*52).toLocaleString()+' h/yr)');
  lines.push('','My reflection:',(ta&&ta.value.trim())?ta.value.trim():'(left blank)');
  if(A.copy)A.copy(lines.join('\n'),copyBtn);
});
}catch(e){console.error('project 013 script error',e);}
});
