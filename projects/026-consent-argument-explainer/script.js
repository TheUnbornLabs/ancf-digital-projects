document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;

/* ---------- Analogy explorer ---------- */
var feedback={
  patient:"PUSHES AGAINST the strict consent argument. We treat unconscious patients via proxy/hypothetical consent and call it legitimate — suggesting un-consented action for someone's good can be fine.",
  gift:"PUSHES AGAINST it. A welcome surprise gift shows we don't always need prior permission to give someone a benefit — though a life contains harms a gift usually doesn't.",
  contract:"PUSHES FOR it. Binding someone to lifelong obligations they never agreed to feels wrong — and birth imposes far more than any contract. This is the analogy the argument leans on.",
  climate:"CUTS BOTH WAYS. We constantly make un-consented decisions for future people; that can seem acceptable (so birth might be too) — or a reason to act with great caution (supporting the argument)."
};
var wrap=document.getElementById('analogies');
var out=document.getElementById('analogyOut');
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
    try{localStorage.setItem(KEY+':analogy',k);}catch(e){}
  }
  opts.forEach(function(o){
    o.setAttribute('role','button');
    o.setAttribute('tabindex','0');
    o.setAttribute('aria-pressed','false');
    o.addEventListener('click',function(){choose(o);});
    o.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(o);}});
  });
  try{var saved=localStorage.getItem(KEY+':analogy');if(saved){paint(saved);if(out)out.textContent=feedback[saved]||'';}}catch(e){}
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
