document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;

/* ---------- Reflection tool ---------- */
var ta=document.getElementById('reflect');
var status=document.getElementById('saveStatus');
var saveBtn=document.getElementById('saveBtn');
var copyBtn=document.getElementById('copyBtn');
var clearBtn=document.getElementById('clearBtn');
var statusTimer=null;
function flash(msg){
  if(!status)return;
  status.textContent=msg;
  if(statusTimer)clearTimeout(statusTimer);
  statusTimer=setTimeout(function(){status.textContent='';},1600);
}
if(ta){
  try{ta.value=localStorage.getItem(KEY)||'';}catch(e){}
  // autosave as you type
  ta.addEventListener('input',function(){try{localStorage.setItem(KEY,ta.value);}catch(e){}});
}
if(saveBtn)saveBtn.addEventListener('click',function(){
  try{localStorage.setItem(KEY,ta.value);}catch(e){}
  flash('Saved ✓');
});
if(clearBtn)clearBtn.addEventListener('click',function(){
  if(ta.value.trim()&&!window.confirm('Clear your reflection on this device?'))return;
  ta.value='';
  try{localStorage.removeItem(KEY);}catch(e){}
  flash('Cleared.');
  ta.focus();
});
if(copyBtn)copyBtn.addEventListener('click',function(){
  var text=(ta.value||'').trim();
  if(!text){flash('Nothing to copy yet.');return;}
  function done(){flash('Copied ✓');}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done,function(){fallbackCopy(text,done);});
  }else{fallbackCopy(text,done);}
});
function fallbackCopy(text,done){
  try{
    var t=document.createElement('textarea');
    t.value=text;t.style.position='fixed';t.style.opacity='0';
    document.body.appendChild(t);t.focus();t.select();
    document.execCommand('copy');document.body.removeChild(t);done();
  }catch(e){flash('Copy not supported — select the text manually.');}
}

/* ---------- Mini quiz ---------- */
var Q=[
{answer:1,explain:"Antinatalism questions whether creating a new life is automatically good — never whether existing people may live."},
{answer:1,explain:"It is usually motivated by concern for well-being and harm prevention, not hatred."},
{answer:1,explain:"Here, consent means a future person cannot agree to existence before they exist."},
{answer:1,explain:"Childfree is a personal lifestyle choice; antinatalism is an ethical argument. They overlap but are not identical."},
{answer:1,explain:"The asymmetry of pleasure and suffering, and the impossibility of consent, are central themes."}
];
var picks={};
var opts=document.querySelectorAll('#quiz .opt');
var totalQ=document.querySelectorAll('#quiz .quiz-q').length;
function select(o){
  var q=o.dataset.q;
  document.querySelectorAll('#quiz .opt[data-q="'+q+'"]').forEach(function(x){
    x.classList.remove('sel');x.setAttribute('aria-pressed','false');
  });
  o.classList.add('sel');o.setAttribute('aria-pressed','true');
  picks[q]=+o.dataset.i;
}
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
var result=document.getElementById('quizResult');
if(scoreBtn)scoreBtn.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){
    result.style.display='block';
    result.textContent='Pick an answer for all '+totalQ+' questions first — there are no wrong people here, only ideas to weigh.';
    return;
  }
  var s=0;
  Q.forEach(function(it,i){
    var sel=picks[i];
    document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){
      var j=+x.dataset.i;x.classList.remove('ok','no');
      if(j===it.answer)x.classList.add('ok');
      else if(j===sel)x.classList.add('no');
    });
    var ex=document.querySelector('#quiz .explain[data-q="'+i+'"]');
    if(ex&&it.explain){ex.style.display='block';ex.textContent=it.explain;}
    if(sel===it.answer)s++;
  });
  result.style.display='block';
  result.textContent='You matched the explained view on '+s+' of '+totalQ+'. Read the notes under each question — understanding the idea matters more than the score.';
  if(resetBtn)resetBtn.style.display='inline-block';
});
if(resetBtn)resetBtn.addEventListener('click',function(){
  picks={};
  opts.forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});
  document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});
  result.style.display='none';result.textContent='';
  resetBtn.style.display='none';
  if(opts[0])opts[0].focus();
});
}catch(e){console.error('project script error',e);}
});
