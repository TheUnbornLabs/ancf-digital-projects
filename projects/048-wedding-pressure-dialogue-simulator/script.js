document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var N=3;
var fields=[];
var labels=['Scene 1 — "When are you next?"','Scene 2 — "Your home will be empty"','Scene 3 — Unsolicited advice'];
var status=document.getElementById('saveStatus');
var timer=null;
function flash(msg){if(!status)return;status.textContent=msg;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='Saved only on this device.';},1400);}
for(var i=0;i<N;i++){
  (function(i){
    var t=document.getElementById('rf'+i);
    if(!t)return;fields.push(t);
    try{t.value=localStorage.getItem(KEY+i)||'';}catch(e){}
    t.addEventListener('input',function(){try{localStorage.setItem(KEY+i,t.value);}catch(e){}flash('Saved ✓');});
  })(i);
}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){
  var lines=['My wedding-season replies',''];
  fields.forEach(function(t,i){lines.push(labels[i],(t.value||'').trim()||'(left blank)','');});
  var text=lines.join('\n');
  function done(){flash('Copied ✓');}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fb(text,done);});}else{fb(text,done);}
});
function fb(text,done){try{var ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();document.execCommand('copy');document.body.removeChild(ta);done();}catch(e){flash('Copy not supported — select the text manually.');}}
var clearAllBtn=document.getElementById('clearAllBtn');
if(clearAllBtn)clearAllBtn.addEventListener('click',function(){
  if(!window.confirm('Clear all replies on this device? This cannot be undone.'))return;
  fields.forEach(function(t,i){t.value='';try{localStorage.removeItem(KEY+i);}catch(e){}});
  flash('All cleared.');if(fields[0])fields[0].focus();
});
}catch(e){console.error('project script error',e);}
});
