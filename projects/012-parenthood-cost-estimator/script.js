document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
function n(v){v=parseFloat(v);return isNaN(v)||v<0?0:v;}
function fmt(x){return Math.round(x).toLocaleString();}

var ids=['p-early','p-school','p-teen','p-adult'];
var inputs=ids.map(function(id){return document.getElementById(id);}).filter(Boolean);
var total17=document.getElementById('total17'),total22=document.getElementById('total22'),perMonth=document.getElementById('perMonth'),chart=document.getElementById('phaseChart');
function recompute(){
  var items=[],to17=0,adult=0;
  inputs.forEach(function(inp){
    var yrs=+inp.getAttribute('data-years'),phaseTotal=n(inp.value)*yrs;
    items.push({label:inp.getAttribute('data-label'),value:phaseTotal});
    if(inp.id==='p-adult')adult=phaseTotal;else to17+=phaseTotal;
  });
  if(total17)total17.textContent=fmt(to17);
  if(total22)total22.textContent=fmt(to17+adult);
  if(perMonth)perMonth.textContent=fmt(to17/(18*12));
  if(A.barChart)A.barChart(chart,items,{fmt:fmt,title:'Cost by phase'});
  var store={};inputs.forEach(function(inp){store[inp.id]=inp.value;});if(A.setJSON)A.setJSON('cost',store);
}
if(inputs.length){var s=A.getJSON?A.getJSON('cost',null):null;inputs.forEach(function(inp){if(s&&s[inp.id]!=null)inp.value=s[inp.id];inp.addEventListener('input',recompute);});recompute();}

/* ---------- Quiz ---------- */
var Q=[{a:1,e:'It is for exploring your own figures and assumptions — not declaring a path right or predicting exact costs.'},{a:1,e:'Cost is one real factor among many; loving families raise children at every budget.'}];
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
  var to17=0,adult=0;inputs.forEach(function(inp){var t=n(inp.value)*(+inp.getAttribute('data-years'));if(inp.id==='p-adult')adult=t;else to17+=t;});
  var lines=['Parenthood cost — my estimate (illustrative)',''];
  lines.push('Total to age 17: '+fmt(to17),'Total incl. 18–22: '+fmt(to17+adult),'Approx per month (to 17): '+fmt(to17/(18*12)));
  lines.push('','My reflection:',(ta&&ta.value.trim())?ta.value.trim():'(left blank)');
  if(A.copy)A.copy(lines.join('\n'),copyBtn);
});
}catch(e){console.error('project 012 script error',e);}
});
