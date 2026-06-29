document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};

/* ---------- Matrix ---------- */
var matrix=document.getElementById('matrix');
if(matrix){matrix.querySelectorAll('.cell').forEach(function(c){
  c.setAttribute('role','button');c.setAttribute('tabindex','0');c.setAttribute('aria-expanded','false');
  function tg(){var o=c.classList.toggle('open');c.setAttribute('aria-expanded',o?'true':'false');}
  c.addEventListener('click',tg);c.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();tg();}});
});}

/* ---------- Premise checker ---------- */
var wrap=document.getElementById('argcheck'),summary=document.getElementById('argSummary');
var labels=['P1 — Presence of pain is bad','P2 — Presence of pleasure is good','P3 — Absence of pain is good (with no one to enjoy it)','P4 — Absence of pleasure is not bad unless someone is deprived','C — Coming into existence is always a harm'];
if(wrap){
  var opts=wrap.querySelectorAll('.opt');var state={};try{state=JSON.parse(localStorage.getItem('ancf-'+location.pathname+':arg')||'{}')||{};}catch(e){state={};}
  function paint(){opts.forEach(function(o){var p=o.getAttribute('data-p'),v=o.getAttribute('data-v');var on=state[p]===v;o.classList.toggle('sel',on);o.setAttribute('aria-pressed',on?'true':'false');});}
  function summarise(){
    var ans=Object.keys(state).length;if(!ans){summary.textContent='Mark the steps above to see a summary.';return;}
    var acc=0;for(var i=0;i<4;i++){if(state[i]==='accept')acc++;}var concl=state[4];
    var msg='You accept '+acc+' of the 4 premises'+(concl?(', and you '+concl+' the conclusion.'):'.');
    if(acc===4&&concl==='reject')msg+=' Accepting every premise but rejecting the conclusion is a recognised move — which premise would you weaken?';
    else if(acc===4&&concl==='accept')msg+=' Your view is internally consistent with the argument.';
    else if(state[2]==='reject')msg+=' Rejecting P3 is the classic "a good for no one isn’t good" line.';
    else msg+=' There is no wrong answer — the value is seeing exactly where you get off the train.';
    summary.textContent=msg;
  }
  if(A.initOptions)A.initOptions(wrap,function(p,v,o){state[p]=o.getAttribute('data-v');try{localStorage.setItem('ancf-'+location.pathname+':arg',JSON.stringify(state));}catch(e){}paint();summarise();});
  paint();summarise();
  var argStatus=document.getElementById('argStatus'),at=null;
  function aflash(m){if(!argStatus)return;argStatus.textContent=m;if(at)clearTimeout(at);at=setTimeout(function(){argStatus.textContent='';},1600);}
  var argCopy=document.getElementById('argCopy');
  if(argCopy)argCopy.addEventListener('click',function(){if(!Object.keys(state).length){aflash('Mark some steps first.');return;}var lines=['My position on Benatar’s argument:',''];for(var i=0;i<5;i++){lines.push(labels[i]+' → '+(state[i]?state[i].toUpperCase():'not marked'));}if(A.copy)A.copy(lines.join('\n'),argCopy);});
  var argReset=document.getElementById('argReset');
  if(argReset)argReset.addEventListener('click',function(){state={};try{localStorage.removeItem('ancf-'+location.pathname+':arg');}catch(e){}paint();summarise();aflash('Reset.');});
}

/* ---------- Quiz ---------- */
var QZ=[{a:1,e:'It turns on P3: treating an absent harm as "good" even with no one to enjoy that good.'},{a:0,e:'The most common objection is that "a good for no one" is not really good — it targets P3.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+QZ.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});

/* ---------- Reflection ---------- */
var ta=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),t2=null;
function flash2(m){if(!refStatus)return;refStatus.textContent=m;if(t2)clearTimeout(t2);t2=setTimeout(function(){refStatus.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash2('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ta?ta.value:'',copyRef);});
}catch(e){console.error('project 025 script error',e);}
});
