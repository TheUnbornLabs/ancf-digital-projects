document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var archive=document.getElementById('archive'),q=document.getElementById('q'),qcount=document.getElementById('qcount');
var ALL=[];
function render(items){
  archive.innerHTML='';
  if(!items.length){archive.innerHTML='<p class="note">No projects match that search.</p>';if(qcount)qcount.textContent='0 of '+ALL.length;return;}
  var frag=document.createDocumentFragment();
  items.forEach(function(p){
    var a=document.createElement('a');a.className='arch-item';a.href='../'+p.slug+'/index.html';
    var num=('00'+p.number).slice(-3);
    a.innerHTML='<span class="arch-num">'+num+'</span><span class="arch-t">'+p.title+'</span><span class="arch-c">'+(p.category||'')+'</span>';
    frag.appendChild(a);
  });
  archive.appendChild(frag);
  if(qcount)qcount.textContent=items.length+' of '+ALL.length;
}
function filter(){var s=(q.value||'').toLowerCase().trim();if(!s){render(ALL);return;}render(ALL.filter(function(p){return (p.title+' '+(p.category||'')+' '+('00'+p.number).slice(-3)).toLowerCase().indexOf(s)>=0;}));}
if(q)q.addEventListener('input',filter);
function load(data){ALL=(data&&data.projects)||[];ALL.sort(function(a,b){return a.number-b.number;});render(ALL);}
if(window.fetch){
  fetch('../../data/projects.json').then(function(r){return r.json();}).then(load).catch(function(){
    archive.innerHTML='<p class="note">Open the <a href="../../index.html">home grid</a> to browse all 100 projects.</p>';
  });
}else{
  archive.innerHTML='<p class="note">Open the <a href="../../index.html">home grid</a> to browse all 100 projects.</p>';
}

var MSG=[
'To whoever is reading this —',
'',
'You made it through one hundred small projects about a big idea: that every person deserves to think clearly and choose freely about whether to have children. No pressure, no shame — just information, reflection, and respect.',
'',
'Whatever you choose, your life is your own. Argue ideas, respect people, and be gentle with yourself along the way.',
'',
'Thank you for being here.',
'— ANCF Digital Projects'
].join('\n');
var out=document.getElementById('out');
if(out){if(A.get)out.value=A.get('closing','')||MSG;else out.value=MSG;out.addEventListener('input',function(){if(A.set)A.set('closing',out.value);});}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(out.value||'',copyBtn);});

var QZ=[{a:1,e:'The heart of it all is free, informed, respected choice for everyone.'},{a:1,e:'The rule throughout: argue ideas; respect people.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(qq,i){picks[qq]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You got '+sc+' of '+QZ.length+'.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 100 script error',e);}
});
