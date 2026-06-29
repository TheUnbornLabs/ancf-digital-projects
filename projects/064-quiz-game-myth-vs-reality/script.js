document.addEventListener('DOMContentLoaded',function(){
try{
var Q=[
{answer:0,explain:"Myth. Many childfree people love children; they simply don't want to raise their own."},
{answer:0,explain:"Myth. It concerns the ethics of birth, never harm to anyone living."},
{answer:1,explain:"Reality. Autonomy defends the freedom to have children AND the freedom not to."},
{answer:0,explain:"Myth. Regret varies for both choices; a considered decision is what counts."},
{answer:0,explain:"Myth. Childfree is a personal choice; antinatalism is an ethical argument. They overlap but differ."},
{answer:1,explain:"Reality. Pronatalist pressure shows up, in different forms, across many cultures worldwide."}
];
var picks={};
var opts=document.querySelectorAll('#quiz .opt');
var totalQ=document.querySelectorAll('#quiz .quiz-q').length;
function select(o){var q=o.dataset.q;document.querySelectorAll('#quiz .opt[data-q="'+q+'"]').forEach(function(z){z.classList.remove('sel');z.setAttribute('aria-pressed','false');});o.classList.add('sel');o.setAttribute('aria-pressed','true');picks[q]=+o.dataset.i;}
opts.forEach(function(o){o.setAttribute('role','button');o.setAttribute('tabindex','0');o.setAttribute('aria-pressed','false');o.addEventListener('click',function(){select(o);});o.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();select(o);}});});
var scoreBtn=document.getElementById('quizScore');
var resetBtn=document.getElementById('quizReset');
var r=document.getElementById('quizResult');
scoreBtn.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){r.style.display='block';r.textContent='Answer all '+totalQ+' first — myth or reality for each.';return;}
  var s=0;
  Q.forEach(function(it,i){var sel=picks[i];document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(z){var j=+z.dataset.i;z.classList.remove('ok','no');if(j===it.answer)z.classList.add('ok');else if(j===sel)z.classList.add('no');});var ex=document.querySelector('#quiz .explain[data-q="'+i+'"]');if(ex&&it.explain){ex.style.display='block';ex.textContent=it.explain;}if(sel===it.answer)s++;});
  r.style.display='block';r.textContent='You busted '+s+' of '+totalQ+' correctly. Read the notes under each — knowing why beats the score.';
  if(resetBtn)resetBtn.style.display='inline-block';
});
if(resetBtn)resetBtn.addEventListener('click',function(){picks={};opts.forEach(function(z){z.classList.remove('sel','ok','no');z.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});r.style.display='none';r.textContent='';resetBtn.style.display='none';if(opts[0])opts[0].focus();});
}catch(e){console.error('project script error',e);}
});
