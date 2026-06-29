document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};

/* ---------- Ethical-tension radar ---------- */
var radar=document.getElementById('tenRadar');
var inputs=[].slice.call(document.querySelectorAll('#tension input[type=range]'));
function draw(){
  var items=inputs.map(function(inp){return {label:inp.getAttribute('data-axis'),value:+inp.value};});
  if(A.radar)A.radar(radar,items);
  var store={};inputs.forEach(function(inp){store[inp.id]=inp.value;});if(A.setJSON)A.setJSON('tension',store);
}
if(inputs.length){
  var ts=A.getJSON?A.getJSON('tension',null):null;
  inputs.forEach(function(inp){if(ts&&ts[inp.id]!=null)inp.value=ts[inp.id];var out=document.getElementById(inp.id.replace('x-','o-'));if(out)out.textContent=inp.value+'%';inp.addEventListener('input',function(){if(out)out.textContent=inp.value+'%';draw();});});
  draw();
}

/* ---------- Quiz ---------- */
var Q=[{a:1,e:'Actual consent needs an existing person; before birth there is none.'},{a:0,e:'A person exists only because they were born, so comparing them to "never existing" is philosophically tricky — the non-identity problem.'},{a:1,e:'A fair treatment presents the strongest objections, not just one side.'}];
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
  var lines=['Consent & birth — my summary',''];
  if(inputs.length){lines.push('My weighting:');inputs.forEach(function(inp){lines.push('  • '+inp.getAttribute('data-axis')+': '+inp.value+'%');});}
  lines.push('','My reflection:',(ta&&ta.value.trim())?ta.value.trim():'(left blank)');
  if(A.copy)A.copy(lines.join('\n'),copyBtn);
});
}catch(e){console.error('project 007 script error',e);}
});
