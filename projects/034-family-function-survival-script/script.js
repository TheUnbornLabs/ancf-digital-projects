document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var fields=['s-open','s-deflect','s-firm','s-exit'].map(function(id){return document.getElementById(id);}).filter(Boolean);
fields.forEach(function(t){var saved=A.get?A.get(t.id,''):'';t.value=saved||t.getAttribute('data-def')||'';t.addEventListener('input',function(){if(A.set)A.set(t.id,t.value);});});
var status=document.getElementById('status'),timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){var L=['My pocket script','','Opener: '+fields[0].value,'Deflection: '+fields[1].value,'Firm line: '+fields[2].value,'Exit: '+fields[3].value];A.copy&&A.copy(L.join('\n'),copyBtn);});
var resetBtn=document.getElementById('resetBtn');
if(resetBtn)resetBtn.addEventListener('click',function(){if(!window.confirm('Reset all four lines to defaults?'))return;fields.forEach(function(t){t.value=t.getAttribute('data-def')||'';if(A.set)A.set(t.id,t.value);});flash('Reset.');});

var boxes=[].slice.call(document.querySelectorAll('#ready input[type=checkbox]'));
var bar=document.getElementById('readyBar'),count=document.getElementById('readyCount');
function render(){var n=0;boxes.forEach(function(b){if(b.checked)n++;});if(A.meter)A.meter(bar,n/boxes.length*100);if(count)count.textContent=n+' of '+boxes.length+' ready.';}
if(boxes.length){var s=A.getJSON?A.getJSON('ready',{}):{};s=s||{};boxes.forEach(function(b){var k=b.getAttribute('data-key');b.checked=!!s[k];b.addEventListener('change',function(){s[k]=b.checked;if(A.setJSON)A.setJSON('ready',s);render();});});render();}

var QZ=[{a:1,e:'A graceful exit lets you leave a conversation calmly and kindly.'},{a:1,e:'Preparing lines in advance lowers stress and helps you stay steady.'}];
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
}catch(e){console.error('project 034 script error',e);}
});
