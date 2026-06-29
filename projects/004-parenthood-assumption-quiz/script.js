document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};

/* ---------- Spot-the-assumption quiz ---------- */
var Q=[
 {a:0,e:'"It\'s just what people do" appeals to tradition — habit standing in for a reason.'},
 {a:1,e:'This leans on fear of loneliness, framing children as insurance against being alone.'},
 {a:0,e:'It ties adulthood and worth to a life script — an appeal to status.'},
 {a:0,e:'"Continue the line" frames birth as an obligation owed to others — duty.'},
 {a:1,e:'It ties a person\'s completeness to gender — a gender-role assumption.'}
];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;Q.forEach(function(it,i){document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You named '+sc+' of '+Q.length+' assumptions as explained. Every phrase can carry more than one — the point is to notice them.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});

/* ---------- Assumption-type bar chart ---------- */
var inputs=[].slice.call(document.querySelectorAll('#types input[type=range]'));
var chart=document.getElementById('typeChart');
function strongest(){var mv=-1,ml=null;inputs.forEach(function(inp){if(+inp.value>mv){mv=+inp.value;ml=inp.getAttribute('data-axis');}});return mv>0?ml:null;}
function drawTypes(){
  var items=inputs.map(function(inp){return {label:inp.getAttribute('data-axis'),value:+inp.value};});
  if(A.barChart)A.barChart(chart,items,{max:4,title:'Assumption strength'});
  var store={};inputs.forEach(function(inp){store[inp.id]=inp.value;});if(A.setJSON)A.setJSON('types',store);
}
if(inputs.length){
  var ts=A.getJSON?A.getJSON('types',null):null;
  inputs.forEach(function(inp){if(ts&&ts[inp.id]!=null)inp.value=ts[inp.id];var out=document.getElementById(inp.id.replace('t-','o-'));if(out)out.textContent=inp.value;inp.addEventListener('input',function(){if(out)out.textContent=inp.value;drawTypes();});});
  drawTypes();
}

/* ---------- "Where did it come from?" checklist ---------- */
var srcWrap=document.getElementById('sources');
var boxes=srcWrap?[].slice.call(srcWrap.querySelectorAll('input[type=checkbox]')):[];
if(boxes.length){
  var st=A.getJSON?A.getJSON('origins',{}):{};st=st||{};
  boxes.forEach(function(b){var k=b.getAttribute('data-key');b.checked=!!st[k];b.addEventListener('change',function(){st[k]=b.checked;if(A.setJSON)A.setJSON('origins',st);});});
}

/* ---------- Reflection + insight summary ---------- */
var ta=document.getElementById('reflect'),status=document.getElementById('saveStatus'),timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyBtn=document.getElementById('copyBtn'),clearBtn=document.getElementById('clearBtn');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash('Saved ✓');});
if(clearBtn)clearBtn.addEventListener('click',function(){if(ta.value.trim()&&!window.confirm('Clear your reflection on this device?'))return;ta.value='';if(A.remove)A.remove('reflect');flash('Cleared.');ta.focus();});
if(copyBtn)copyBtn.addEventListener('click',function(){
  var lines=['Parenthood assumptions — my insight summary',''];
  var s=strongest();lines.push('Strongest assumption for me: '+(s||'(none rated yet)'));
  var picked=boxes.filter(function(b){return b.checked;}).map(function(b){return b.parentNode.textContent.trim();});
  lines.push('Likely sources: '+(picked.length?picked.join(', '):'(none ticked)'));
  lines.push('','My reflection:',(ta&&ta.value.trim())?ta.value.trim():'(left blank)');
  if(A.copy)A.copy(lines.join('\n'),copyBtn);
});
}catch(e){console.error('project 004 script error',e);}
});
