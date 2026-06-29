document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var T=[
 {yr:'~5th c. BCE',s:'Religion',t:'Early Buddhist thought',d:'Reflection on dukkha (suffering) woven through existence, and release from the cycle of rebirth — a contemplative root for later questions about birth.'},
 {yr:'~5th c. BCE',s:'Philosophy',t:'Greek tragic & Hellenistic reflection',d:'The recurring line that it may be "best never to have been born" appears in Greek tragedy and later pessimistic strands.'},
 {yr:'1819',s:'Philosophy',t:'Schopenhauer’s pessimism',d:'Arthur Schopenhauer frames existence as driven by a restless will that produces more suffering than satisfaction.'},
 {yr:'1960s–70s',s:'Feminism',t:'Reproductive-rights movements',d:'Feminist organising centres bodily autonomy and the right to decide whether and when to have children.'},
 {yr:'1984',s:'Philosophy',t:'Parfit’s non-identity problem',d:'Derek Parfit’s "Reasons and Persons" sharpens puzzles about harm and identity for people who owe their existence to a choice.'},
 {yr:'1990s–2000s',s:'Ecology',t:'Environmental & childfree discourse',d:'Concern for ecological limits and future generations feeds a growing, explicit childfree conversation.'},
 {yr:'2006',s:'Philosophy',t:'Benatar’s "Better Never to Have Been"',d:'David Benatar articulates the asymmetry argument that coming into existence is always a harm — the modern landmark for antinatalism.'},
 {yr:'2010s–2020s',s:'Ecology',t:'Climate & demographic debate',d:'Public debate widens around climate, population, and the ethics of bringing new people into an uncertain world.'}
];
var strands=[];T.forEach(function(x){if(strands.indexOf(x.s)<0)strands.push(x.s);});
var active='All';
var filters=document.getElementById('filters'),tl=document.getElementById('timeline'),chart=document.getElementById('strandChart');
function chip(label){var b=document.createElement('span');b.className='chip'+(label===active?' active':'');b.textContent=label;b.setAttribute('role','button');b.setAttribute('tabindex','0');
  function go(){active=label;paint();render();}
  b.addEventListener('click',go);b.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});return b;}
function paint(){filters.innerHTML='';filters.appendChild(chip('All'));strands.forEach(function(s){filters.appendChild(chip(s));});}
function render(){
  tl.innerHTML='';
  T.forEach(function(x){
    if(active!=='All'&&x.s!==active)return;
    var li=document.createElement('li');
    var d=document.createElement('details');
    var sm=document.createElement('summary');sm.innerHTML='<span class="tag-yr">'+x.yr+'</span> — '+x.t+' <span class="pill">'+x.s+'</span>';
    var p=document.createElement('div');var pp=document.createElement('p');pp.textContent=x.d;p.appendChild(pp);
    d.appendChild(sm);d.appendChild(p);li.appendChild(d);tl.appendChild(li);
  });
  if(!tl.children.length){var e=document.createElement('li');e.className='note';e.textContent='No entries in this strand.';tl.appendChild(e);}
}
paint();render();
var counts=strands.map(function(s){return {label:s,value:T.filter(function(x){return x.s===s;}).length};});
if(A.barChart)A.barChart(chart,counts,{max:Math.max.apply(null,counts.map(function(c){return c.value;})),fmt:function(v){return v;},title:'Entries per strand'});

/* ---------- Quiz ---------- */
var QZ=[{a:0,e:'David Benatar set out the modern asymmetry argument in "Better Never to Have Been" (2006).'},{a:0,e:'Derek Parfit set out the non-identity problem in "Reasons and Persons" (1984).'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
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
}catch(e){console.error('project 024 script error',e);}
});
