document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var titles={autonomy:'Whose Choice Is It? Reproductive Autonomy for Everyone',antinatalism:'Antinatalism, Fairly Explained',childfree:'The Childfree Choice: A Full Life, Freely Chosen',pressure:'Naming Pronatalist Pressure — Kindly'};
var topic=document.getElementById('topic'),frame=document.getElementById('frame'),out=document.getElementById('out');
function build(){
  var t=titles[topic.value]||titles.autonomy;var L=['Working title: '+t,''];
  if(frame.value==='personal'){
    L.push('1. Open with a moment','   - A small scene that sets the question.','2. What I used to assume','3. What changed my thinking','4. The strongest objection — and my honest response','5. Where I\'ve landed (held lightly)','6. Close: an invitation, not a verdict');
  }else{
    L.push('1. Introduction','   - Hook + the question this piece answers.','2. Background / key terms','3. The main case','   - Point A, Point B, Point C (one idea each).','4. The opposing view (steelmanned)','   - Its strongest form, stated fairly.','5. Synthesis','   - Where the views meet and diverge; what\'s really at stake.','6. Conclusion','   - A measured takeaway + respect for disagreement.');
  }
  L.push('','Reminder: argue the idea, respect the people.');out.value=L.join('\n');if(A.set)A.set('outline',out.value);
}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',build);
if(topic)topic.addEventListener('change',build);if(frame)frame.addEventListener('change',build);
if(out){if(A.get)out.value=A.get('outline','');out.addEventListener('input',function(){if(A.set)A.set('outline',out.value);});if(!out.value)build();}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy(out.value||'',copyBtn);});

var QZ=[{a:1,e:'Including the opposing view strengthens your article and builds trust.'},{a:1,e:'A synthesis weighs the views and earns trust.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+QZ.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 079 script error',e);}
});
