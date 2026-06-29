document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
// Checklist
var boxes=[].slice.call(document.querySelectorAll('#list input[type=checkbox]'));
var bar=document.getElementById('bar');
var pct=document.getElementById('pct');
var saved=[];try{saved=JSON.parse(localStorage.getItem(KEY+':chk')||'[]');}catch(e){}
boxes.forEach(function(b,i){b.checked=!!saved[i];});
function upd(){var n=boxes.filter(function(b){return b.checked;}).length;var p=boxes.length?Math.round(100*n/boxes.length):0;if(bar)bar.style.width=p+'%';if(pct)pct.textContent=p+'% ticked ('+n+'/'+boxes.length+').';try{localStorage.setItem(KEY+':chk',JSON.stringify(boxes.map(function(b){return b.checked;})));}catch(e){}}
boxes.forEach(function(b){b.addEventListener('change',upd);});
var resetBtn=document.getElementById('resetBtn');
if(resetBtn)resetBtn.addEventListener('click',function(){if(!window.confirm('Uncheck everything on this device?'))return;boxes.forEach(function(b){b.checked=false;});upd();});
upd();
// Reflection
var ta=document.getElementById('reflect');
var status=document.getElementById('saveStatus');
var saveBtn=document.getElementById('saveBtn');
var copyBtn=document.getElementById('copyBtn');
var clearBtn=document.getElementById('clearBtn');
var timer=null;
function flash(msg){if(!status)return;status.textContent=msg;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
if(ta){try{ta.value=localStorage.getItem(KEY)||'';}catch(e){}ta.addEventListener('input',function(){try{localStorage.setItem(KEY,ta.value);}catch(e){}});}
if(saveBtn)saveBtn.addEventListener('click',function(){try{localStorage.setItem(KEY,ta.value);}catch(e){}flash('Saved ✓');});
if(clearBtn)clearBtn.addEventListener('click',function(){if(ta.value.trim()&&!window.confirm('Clear your reflection on this device?'))return;ta.value='';try{localStorage.removeItem(KEY);}catch(e){}flash('Cleared.');ta.focus();});
if(copyBtn)copyBtn.addEventListener('click',function(){var text=(ta.value||'').trim();if(!text){flash('Nothing to copy yet.');return;}function done(){flash('Copied ✓');}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fb(text,done);});}else{fb(text,done);}});
function fb(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){flash('Copy not supported.');}}
}catch(e){console.error('project script error',e);}
});
