document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var ack={warm:"I love you, and I know this comes from how much you care.",balanced:"I know this matters to you, and I appreciate that you care.",firm:"I know you care — and I need you to really hear me on this."};
var sitClause={general:"You've asked about grandchildren a few times.",disappointment:"I can tell you're disappointed.",legacy:"I know the family name matters to you.",worry:"I know you worry I'll be alone one day.",comparison:"I know others my age have taken a different path."};
var boundary={warm:"I've thought about this with real care, and a childfree life is right for me — and I'd love to stay close to you through all of it.",balanced:"I've made a considered decision that's right for me, and I'd really value your support.",firm:"My decision is made and I need it respected. I won't keep discussing it, but I'm always happy to talk about other things."};
var sit=document.getElementById('sit'),balance=document.getElementById('balance'),oBal=document.getElementById('o-balance'),out=document.getElementById('out'),custom=document.getElementById('custom'),balChart=document.getElementById('balChart');
function bucket(){var v=+balance.value;return v<34?'warm':(v>66?'firm':'balanced');}
function drawBal(){var v=+balance.value;if(A.barChart)A.barChart(balChart,[{label:'Warmth',value:100-v},{label:'Firmness',value:v}],{max:100,fmt:function(x){return x+'%';},title:'Reply balance'});if(oBal)oBal.textContent=bucket().charAt(0).toUpperCase()+bucket().slice(1);}
function build(){var b=bucket();return ack[b]+' '+sitClause[sit.value]+' '+boundary[b];}
if(balance){balance.addEventListener('input',drawBal);drawBal();}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',function(){var t=build();out.textContent=t;if(custom){custom.value=t;if(A.set)A.set('custom',t);}});
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(out.textContent&&out.textContent.indexOf('appear')===-1?out.textContent:build(),copyBtn);});

if(custom&&A.get){custom.value=A.get('custom','');if(custom.value)out.textContent=custom.value;custom.addEventListener('input',function(){A.set('custom',custom.value);});}
var copyCustom=document.getElementById('copyCustom'),saveCustom=document.getElementById('saveCustom'),saveStatus=document.getElementById('saveStatus'),st=null;
function flash(m){if(!saveStatus)return;saveStatus.textContent=m;if(st)clearTimeout(st);st=setTimeout(function(){saveStatus.textContent='';},1600);}
if(copyCustom)copyCustom.addEventListener('click',function(){A.copy&&A.copy(custom?custom.value:'',copyCustom);});
if(saveCustom)saveCustom.addEventListener('click',function(){if(A.set)A.set('custom',custom?custom.value:'');flash('Saved ✓');});

/* ---------- Quiz ---------- */
var Q=[{a:1,e:'Naming their care first lowers defensiveness, so the boundary that follows lands better.'},{a:1,e:'Warmth and firmness are fully compatible — you can be kind and clear at once.'}];
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
var ta=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),t2=null;
function flash2(m){if(!refStatus)return;refStatus.textContent=m;if(t2)clearTimeout(t2);t2=setTimeout(function(){refStatus.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash2('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ta?ta.value:'',copyRef);});
}catch(e){console.error('project 017 script error',e);}
});
