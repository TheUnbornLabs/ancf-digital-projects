document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;

/* ---------- Premise checker ---------- */
var wrap=document.getElementById('argcheck');
var summary=document.getElementById('argSummary');
if(wrap){
  var opts=wrap.querySelectorAll('.opt');
  var state={};
  try{state=JSON.parse(localStorage.getItem(KEY+':arg')||'{}')||{};}catch(e){state={};}
  var NUM_PREMISES=4; // P1-P4; index 4 is the conclusion C

  function paint(){
    opts.forEach(function(o){
      var p=o.getAttribute('data-p'),v=o.getAttribute('data-v');
      var on=state[p]===v;
      o.classList.toggle('sel',on);
      o.setAttribute('aria-pressed',on?'true':'false');
    });
  }
  function summarise(){
    var answered=Object.keys(state).length;
    if(answered===0){summary.textContent='Mark the steps above to see a summary of your position.';return;}
    var acceptedPremises=0;
    for(var i=0;i<NUM_PREMISES;i++){if(state[i]==='accept')acceptedPremises++;}
    var concl=state[4];
    var msg='You have marked '+answered+' of 5 steps. You accept '+acceptedPremises+' of the 4 premises';
    msg+=concl?(', and you '+concl+' the conclusion.'):'.';
    if(acceptedPremises===NUM_PREMISES&&concl==='reject'){
      msg+=' Accepting every premise but rejecting the conclusion is a recognised (and much-debated) move — worth asking which premise you would weaken.';
    }else if(acceptedPremises===NUM_PREMISES&&concl==='accept'){
      msg+=' Your view is internally consistent with the argument as stated.';
    }else if(acceptedPremises<NUM_PREMISES&&concl==='accept'){
      msg+=' You reach the conclusion without granting every premise — perhaps another route convinces you.';
    }else{
      msg+=' There is no wrong answer here; the value is in seeing exactly where you get off the train.';
    }
    summary.textContent=msg;
  }
  function choose(o){
    var p=o.getAttribute('data-p'),v=o.getAttribute('data-v');
    state[p]=v;
    try{localStorage.setItem(KEY+':arg',JSON.stringify(state));}catch(e){}
    paint();summarise();
  }
  opts.forEach(function(o){
    o.setAttribute('role','button');
    o.setAttribute('tabindex','0');
    o.setAttribute('aria-pressed','false');
    o.addEventListener('click',function(){choose(o);});
    o.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(o);}
    });
  });
  paint();summarise();

  var labels=['P1 — A future person cannot consent to being born','P2 — Birth reliably exposes a person to some risk of serious harm','P3 — Imposing un-consented risk of serious harm normally needs justification','P4 — "It will probably be a good life" may not, alone, justify that risk','C — Therefore, creating a new person is ethically weighty'];
  var argStatus=document.getElementById('argStatus');
  var argTimer=null;
  function argFlash(msg){if(!argStatus)return;argStatus.textContent=msg;if(argTimer)clearTimeout(argTimer);argTimer=setTimeout(function(){argStatus.textContent='';},1600);}
  function argFallback(text,done){try{var x=document.createElement('textarea');x.value=text;x.style.position='fixed';x.style.opacity='0';document.body.appendChild(x);x.focus();x.select();document.execCommand('copy');document.body.removeChild(x);done();}catch(e){argFlash('Copy not supported — select manually.');}}
  var argCopy=document.getElementById('argCopy');
  if(argCopy)argCopy.addEventListener('click',function(){
    if(!Object.keys(state).length){argFlash('Mark some steps first.');return;}
    var lines=['My position on the consent argument:',''];
    for(var i=0;i<5;i++){lines.push(labels[i]+'\n   → '+(state[i]?state[i].toUpperCase():'not marked'));}
    var text=lines.join('\n');
    function done(){argFlash('Copied ✓');}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){argFallback(text,done);});}
    else{argFallback(text,done);}
  });
  var argReset=document.getElementById('argReset');
  if(argReset)argReset.addEventListener('click',function(){
    state={};try{localStorage.removeItem(KEY+':arg');}catch(e){}
    paint();summarise();argFlash('Reset.');
  });
}

/* ---------- Reflection tool ---------- */
var ta=document.getElementById('reflect');
var status=document.getElementById('saveStatus');
var saveBtn=document.getElementById('saveBtn');
var copyBtn=document.getElementById('copyBtn');
var clearBtn=document.getElementById('clearBtn');
var timer=null;
function flash(msg){
  if(!status)return;
  status.textContent=msg;
  if(timer)clearTimeout(timer);
  timer=setTimeout(function(){status.textContent='';},1600);
}
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
