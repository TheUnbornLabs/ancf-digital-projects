document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;var N=4;
var labels=['What freedom looks like','Support people need','Things I can do','Voices to amplify'];
var cols=[];var status=document.getElementById('saveStatus');var timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='Saved on this device only.';},1400);}
function cnt(v){return (v||'').split('\n').map(function(s){return s.trim();}).filter(function(s){return s.length;}).length;}
function uc(i){var c=document.getElementById('count'+i);if(c){var n=cnt(cols[i].value);c.textContent=n+' item'+(n===1?'':'s');}}
for(var i=0;i<N;i++){(function(i){var t=document.getElementById('col'+i);cols.push(t);if(!t)return;try{t.value=localStorage.getItem(KEY+i)||'';}catch(e){}uc(i);t.addEventListener('input',function(){try{localStorage.setItem(KEY+i,t.value);}catch(e){}uc(i);flash('Saved ✓');});})(i);}
var starters=document.getElementById('starters');
if(starters)starters.addEventListener('click',function(e){var b=e.target.closest('[data-goal]');if(!b||!cols[0])return;var g=b.getAttribute('data-goal');var cur=cols[0].value.replace(/\s*$/,'');cols[0].value=(cur?cur+'\n':'')+g;try{localStorage.setItem(KEY+0,cols[0].value);}catch(e){}uc(0);flash('Added ✓');});
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){var parts=['My vision for a future without forced parenthood',''];cols.forEach(function(t,i){parts.push(labels[i]+':');var it=(t.value||'').split('\n').map(function(s){return s.trim();}).filter(function(s){return s.length;});if(it.length){it.forEach(function(z){parts.push('  • '+z);});}else parts.push('  (none yet)');parts.push('');});var text=parts.join('\n');function done(){flash('Copied ✓');}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fb(text,done);});}else{fb(text,done);}});
function fb(text,done){try{var ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();document.execCommand('copy');document.body.removeChild(ta);done();}catch(e){flash('Copy not supported.');}}
var clr=document.getElementById('clearAllBtn');
if(clr)clr.addEventListener('click',function(){if(!window.confirm('Clear all four columns on this device? This cannot be undone.'))return;cols.forEach(function(t,i){t.value='';try{localStorage.removeItem(KEY+i);}catch(e){}uc(i);});flash('All cleared.');if(cols[0])cols[0].focus();});
}catch(e){console.error('project script error',e);}
});
