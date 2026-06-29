document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
// Option-reveals-note (no scoring)
var opts=document.querySelectorAll('#quiz .opt');
function select(o){
  var q=o.getAttribute('data-q');
  document.querySelectorAll('#quiz .opt[data-q="'+q+'"]').forEach(function(z){z.classList.remove('sel');z.setAttribute('aria-pressed','false');});
  o.classList.add('sel');o.setAttribute('aria-pressed','true');
  var ex=document.querySelector('#quiz .explain[data-q="'+q+'"]');
  if(ex){ex.style.display='block';ex.textContent='To discuss: '+(o.getAttribute('data-note')||'');}
}
opts.forEach(function(o){
  o.setAttribute('role','button');o.setAttribute('tabindex','0');o.setAttribute('aria-pressed','false');
  o.addEventListener('click',function(){select(o);});
  o.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();select(o);}});
});

// Shared notes
var ta=document.getElementById('notes');
var status=document.getElementById('saveStatus');
var timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
if(ta){try{ta.value=localStorage.getItem(KEY)||'';}catch(e){}ta.addEventListener('input',function(){try{localStorage.setItem(KEY,ta.value);}catch(e){}flash('Saved ✓');});}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){var text=(ta.value||'').trim();if(!text){flash('Nothing to copy yet.');return;}function done(){flash('Copied ✓');}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fb(text,done);});}else{fb(text,done);}});
function fb(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){flash('Copy not supported.');}}
var clearBtn=document.getElementById('clearBtn');
if(clearBtn)clearBtn.addEventListener('click',function(){if(ta.value.trim()&&!window.confirm('Clear your notes on this device?'))return;ta.value='';try{localStorage.removeItem(KEY);}catch(e){}flash('Cleared.');ta.focus();});
}catch(e){console.error('project script error',e);}
});
