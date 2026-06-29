document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};

/* ---------- Life-domain radar ---------- */
var domRadar=document.getElementById('domRadar');
var dInputs=[].slice.call(document.querySelectorAll('#domains input[type=range]'));
function drawDom(){
  var items=dInputs.map(function(inp){return {label:inp.getAttribute('data-axis'),value:+inp.value};});
  if(A.radar)A.radar(domRadar,items);
  var store={};dInputs.forEach(function(inp){store[inp.id]=inp.value;});
  if(A.setJSON)A.setJSON('domains',store);
}
if(dInputs.length){
  var ds=A.getJSON?A.getJSON('domains',null):null;
  dInputs.forEach(function(inp){
    if(ds&&ds[inp.id]!=null)inp.value=ds[inp.id];
    var out=document.getElementById(inp.id.replace('d-','o-'));if(out)out.textContent=inp.value+'%';
    inp.addEventListener('input',function(){if(out)out.textContent=inp.value+'%';drawDom();});
  });
  drawDom();
}

/* ---------- Flip cards ---------- */
document.querySelectorAll('#myths .flip').forEach(function(f){
  function flip(){f.classList.toggle('on');f.setAttribute('aria-pressed',f.classList.contains('on')?'true':'false');}
  f.addEventListener('click',flip);
  f.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();flip();}});
});

/* ---------- Values checklist ---------- */
var valWrap=document.getElementById('values');
var boxes=valWrap?[].slice.call(valWrap.querySelectorAll('input[type=checkbox]')):[];
var valBar=document.getElementById('valBar'),valCount=document.getElementById('valCount');
function valRender(){
  var n=0;boxes.forEach(function(b){if(b.checked)n++;});
  if(A.meter)A.meter(valBar,n/boxes.length*100);
  if(valCount)valCount.textContent=n+' of '+boxes.length+' selected.';
}
if(boxes.length){
  var vstore=A.getJSON?A.getJSON('values',{}):{};vstore=vstore||{};
  boxes.forEach(function(b){
    var k=b.getAttribute('data-key');b.checked=!!vstore[k];
    b.addEventListener('change',function(){vstore[k]=b.checked;if(A.setJSON)A.setJSON('values',vstore);valRender();});
  });
  valRender();
}

/* ---------- Statement generator ---------- */
function joinNice(arr){if(arr.length<=1)return arr.join('');if(arr.length===2)return arr[0]+' and '+arr[1];return arr.slice(0,-1).join(', ')+', and '+arr[arr.length-1];}
var stmt=document.getElementById('stmt');
if(stmt&&A.get){stmt.value=A.get('stmt','');stmt.addEventListener('input',function(){A.set('stmt',stmt.value);});}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',function(){
  var picked=boxes.filter(function(b){return b.checked;}).map(function(b){return b.getAttribute('data-label');});
  var body=picked.length?('It lets me prioritise '+joinNice(picked)+'.'):'It lets me shape my time, energy, and future on my own terms.';
  stmt.value="I've chosen a childfree life. "+body+" This is my decision, made with care — and I respect those who choose differently.";
  if(A.set)A.set('stmt',stmt.value);
});
var copyStmt=document.getElementById('copyStmt');
if(copyStmt)copyStmt.addEventListener('click',function(){if(A.copy)A.copy(stmt.value,copyStmt);});

/* ---------- Quiz ---------- */
var Q=[
 {a:1,e:'"Childfree" is an active choice; "childless" usually describes circumstance.'},
 {a:1,e:'Most childfree-by-choice adults report being content with the decision.'},
 {a:1,e:'Love and commitment make a family — children are one possible part, not the definition.'}
];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sBtn=document.getElementById('quizScore'),rBtn=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sBtn)sBtn.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var s=0;Q.forEach(function(it,i){
    document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});
    var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}
    if(picks[i]===it.a)s++;});
  res.style.display='block';res.textContent='You matched '+s+' of '+Q.length+' with the explained view.';if(rBtn)rBtn.style.display='inline-block';
});
if(rBtn)rBtn.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rBtn.style.display='none';});

/* ---------- Reflection + summary ---------- */
var ta=document.getElementById('reflect'),status=document.getElementById('saveStatus'),timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyBtn=document.getElementById('copyBtn'),clearBtn=document.getElementById('clearBtn');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash('Saved ✓');});
if(clearBtn)clearBtn.addEventListener('click',function(){if(ta.value.trim()&&!window.confirm('Clear your reflection on this device?'))return;ta.value='';if(A.remove)A.remove('reflect');flash('Cleared.');ta.focus();});
if(copyBtn)copyBtn.addEventListener('click',function(){
  var lines=['Childfree Life — my summary',''];
  if(dInputs.length){lines.push('Life-domain balance:');dInputs.forEach(function(inp){lines.push('  • '+inp.getAttribute('data-axis')+': '+inp.value+'%');});}
  var picked=boxes.filter(function(b){return b.checked;}).map(function(b){return b.getAttribute('data-label');});
  lines.push('','Values I chose: '+(picked.length?joinNice(picked):'(none yet)'));
  if(stmt&&stmt.value.trim())lines.push('','My statement:',stmt.value.trim());
  lines.push('','My reflection:',(ta&&ta.value.trim())?ta.value.trim():'(left blank)');
  if(A.copy)A.copy(lines.join('\n'),copyBtn);
});
}catch(e){console.error('project 002 script error',e);}
});
