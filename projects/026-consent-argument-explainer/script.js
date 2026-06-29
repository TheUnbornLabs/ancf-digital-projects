document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var wrap=document.getElementById('argcheck'),summary=document.getElementById('argSummary');
var labels=['P1 — We normally need consent to impose serious risk','P2 — A future person cannot consent to being born','P3 — Birth imposes serious, unavoidable risk','P4 — "It\'ll probably be good" doesn\'t supply the consent','C — So creating a person needs a justification we may not have'];
if(wrap){
  var opts=wrap.querySelectorAll('.opt');var key='ancf-'+location.pathname+':arg';var state={};try{state=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch(e){state={};}
  function paint(){opts.forEach(function(o){var p=o.getAttribute('data-p'),v=o.getAttribute('data-v');var on=state[p]===v;o.classList.toggle('sel',on);o.setAttribute('aria-pressed',on?'true':'false');});}
  function summarise(){var ans=Object.keys(state).length;if(!ans){summary.textContent='Mark the steps above to see a summary.';return;}var acc=0;for(var i=0;i<4;i++){if(state[i]==='accept')acc++;}var c=state[4];var m='You accept '+acc+' of the 4 premises'+(c?(', and you '+c+' the conclusion.'):'.');if(acc===4&&c==='reject')m+=' Which premise would you weaken to escape the conclusion?';else if(acc===4&&c==='accept')m+=' Your view is internally consistent.';else m+=' There is no wrong answer — see where you get off the train.';summary.textContent=m;}
  if(A.initOptions)A.initOptions(wrap,function(p,v,o){state[p]=o.getAttribute('data-v');try{localStorage.setItem(key,JSON.stringify(state));}catch(e){}paint();summarise();});
  paint();summarise();
  var argStatus=document.getElementById('argStatus'),at=null;function af(m){if(!argStatus)return;argStatus.textContent=m;if(at)clearTimeout(at);at=setTimeout(function(){argStatus.textContent='';},1600);}
  var ac=document.getElementById('argCopy');if(ac)ac.addEventListener('click',function(){if(!Object.keys(state).length){af('Mark some steps first.');return;}var L=['My position on the consent argument:',''];for(var i=0;i<5;i++){L.push(labels[i]+' → '+(state[i]?state[i].toUpperCase():'not marked'));}if(A.copy)A.copy(L.join('\n'),ac);});
  var ar=document.getElementById('argReset');if(ar)ar.addEventListener('click',function(){state={};try{localStorage.removeItem(key);}catch(e){}paint();summarise();af('Reset.');});
}

var QZ=[{a:0,e:'It applies our ordinary standard — that we seek consent before imposing serious risk on a person.'},{a:0,e:'The non-identity problem makes "harming the person born" philosophically tricky, since they exist only because of the birth.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+QZ.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});

var ta=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),t2=null;
function flash2(m){if(!refStatus)return;refStatus.textContent=m;if(t2)clearTimeout(t2);t2=setTimeout(function(){refStatus.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash2('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ta?ta.value:'',copyRef);});
}catch(e){console.error('project 026 script error',e);}
});
