document.addEventListener('DOMContentLoaded',function(){
try{
var Q=[
{"answer":1,"explain":"Curiosity and respect keep the relationship open; the others assume the choice is a mistake."},
{"answer":1,"explain":"A couple, friends, or a person and their community can all be a family."},
{"answer":1,"explain":"It is a legitimate, stable choice that deserves the same respect as choosing to parent."}
];
var picks={};
var opts=document.querySelectorAll('.opt');
var totalQ=document.querySelectorAll('.quiz-q').length;

function select(o){
  var q=o.dataset.q;
  document.querySelectorAll('.opt[data-q="'+q+'"]').forEach(function(x){
    x.classList.remove('sel');x.setAttribute('aria-pressed','false');
  });
  o.classList.add('sel');o.setAttribute('aria-pressed','true');
  picks[q]=+o.dataset.i;
}

// Make divs keyboard-accessible (role, focusable, Enter/Space)
opts.forEach(function(o){
  o.setAttribute('role','button');
  o.setAttribute('tabindex','0');
  o.setAttribute('aria-pressed','false');
  o.addEventListener('click',function(){select(o);});
  o.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '){e.preventDefault();select(o);}
  });
});

var scoreBtn=document.getElementById('quizScore');
var resetBtn=document.getElementById('quizReset');
var r=document.getElementById('quizResult');

scoreBtn.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){
    r.style.display='block';
    r.textContent='Pick an answer for all '+totalQ+' questions first — there are no wrong choices, just first reactions.';
    return;
  }
  var s=0;
  Q.forEach(function(it,i){
    var sel=picks[i];
    document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){
      var j=+x.dataset.i;x.classList.remove('ok','no');
      if(j===it.answer)x.classList.add('ok');
      else if(j===sel)x.classList.add('no');
    });
    var ex=document.querySelector('.explain[data-q="'+i+'"]');
    if(ex&&it.explain){ex.style.display='block';ex.textContent=it.explain;}
    if(sel===it.answer)s++;
  });
  r.style.display='block';
  r.textContent='You reflected on '+s+' of '+Q.length+' in line with the explained view. There are no wrong people here — only ideas to weigh.';
  if(resetBtn)resetBtn.style.display='inline-block';
});

if(resetBtn)resetBtn.addEventListener('click',function(){
  picks={};
  opts.forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});
  document.querySelectorAll('.explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});
  r.style.display='none';r.textContent='';
  resetBtn.style.display='none';
  if(opts[0])opts[0].focus();
});
}catch(e){console.error('project script error',e);}
});
