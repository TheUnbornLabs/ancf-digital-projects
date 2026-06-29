document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;

/* ---------- Framework lens switcher ---------- */
var feedback={
  ev:"EXPECTED VALUE — weighs each outcome by its probability and sums. A high chance of a good life can outweigh a small chance of a bad one. On this lens, creating a likely-happy life is usually permissible. Verdict: leans PERMISSIBLE.",
  precaution:"PRECAUTIONARY PRINCIPLE — avoid imposing any real risk of severe, irreversible harm, whatever the upside. Because a life can contain catastrophic suffering, 'probably fine' isn't enough. Verdict: leans CAUTIOUS / against.",
  maximin:"MAXIMIN — judge a choice by its worst possible outcome and prefer the option whose worst case is least bad. Since the worst case of a life can be very bad, and non-existence has no bad case, this lens counsels restraint. Verdict: leans against.",
  parity:"EVERYDAY-RISK PARITY — we impose un-consented risks on future people constantly (driving them, schooling, vaccinating) and call it fine. If those are acceptable, birth may be too. Verdict: leans PERMISSIBLE."
};
var wrap=document.getElementById('lenses');
var out=document.getElementById('lensOut');
if(wrap){
  var opts=[].slice.call(wrap.querySelectorAll('.opt'));
  function paint(sel){
    opts.forEach(function(o){
      var on=o.getAttribute('data-k')===sel;
      o.classList.toggle('sel',on);
      o.setAttribute('aria-pressed',on?'true':'false');
    });
  }
  function choose(o){
    var k=o.getAttribute('data-k');
    paint(k);
    if(out)out.textContent=feedback[k]||'';
    try{localStorage.setItem(KEY+':lens',k);}catch(e){}
  }
  opts.forEach(function(o){
    o.setAttribute('role','button');
    o.setAttribute('tabindex','0');
    o.setAttribute('aria-pressed','false');
    o.addEventListener('click',function(){choose(o);});
    o.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(o);}});
  });
  try{var saved=localStorage.getItem(KEY+':lens');if(saved){paint(saved);if(out)out.textContent=feedback[saved]||'';}}catch(e){}
}

/* ---------- Reflection tool ---------- */
var ta=document.getElementById('reflect');
var status=document.getElementById('saveStatus');
var saveBtn=document.getElementById('saveBtn');
var copyBtn=document.getElementById('copyBtn');
var clearBtn=document.getElementById('clearBtn');
var timer=null;
function flash(msg){if(!status)return;status.textContent=msg;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
if(ta){
  try{ta.value=localStorage.getItem(KEY)||'';}catch(e){}
  ta.addEventListener('input',function(){try{localStorage.setItem(KEY,ta.value);}catch(e){}});
}
if(saveBtn)saveBtn.addEventListener('click',function(){try{localStorage.setItem(KEY,ta.value);}catch(e){}flash('Saved ✓');});
if(clearBtn)clearBtn.addEventListener('click',function(){
  if(ta.value.trim()&&!window.confirm('Clear your reflection on this device?'))return;
  ta.value='';try{localStorage.removeItem(KEY);}catch(e){}flash('Cleared.');ta.focus();
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
}catch(e){console.error('project script error',e);}
});
