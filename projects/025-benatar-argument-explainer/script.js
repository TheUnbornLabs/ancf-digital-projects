document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;

/* ---------- "Where is it weakest" interactive ---------- */
var feedback={
  box3:"This targets the heart of the argument. Critics call it the 'good for no one' objection: a state arguably can't be good if there's no subject it's good for. If box (3) fails, the asymmetry has no engine.",
  box4:"A sharp choice. Opponents argue the rating is asymmetric by stipulation — if the absence of pleasure is counted as 'bad' (a deprivation of possible good), the argument dissolves into symmetry.",
  infer:"You accept the boxes but doubt the leap. This is the 'lives can be net positive / it proves too much' line: even granting the asymmetry, it may not follow that existence is ALWAYS a net harm.",
  none:"Fair — many find it compelling. The deepest test then is whether you'd accept its conclusion in every case, including a life that is overwhelmingly happy."
};
var wrap=document.getElementById('weak');
var outW=document.getElementById('weakOut');
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
    if(outW)outW.textContent=feedback[k]||'';
    try{localStorage.setItem(KEY+':weak',k);}catch(e){}
  }
  opts.forEach(function(o){
    o.setAttribute('role','button');
    o.setAttribute('tabindex','0');
    o.setAttribute('aria-pressed','false');
    o.addEventListener('click',function(){choose(o);});
    o.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(o);}});
  });
  try{
    var saved=localStorage.getItem(KEY+':weak');
    if(saved){paint(saved);if(outW)outW.textContent=feedback[saved]||'';}
  }catch(e){}
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
