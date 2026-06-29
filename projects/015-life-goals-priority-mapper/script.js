document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var N=3;
var labels=['Now (this year)','Soon (1–3 years)','Someday / maybe'];
var cols=[];
var status=document.getElementById('saveStatus');
var timer=null;
function flash(msg){if(!status)return;status.textContent=msg;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='Saved on this device only.';},1400);}

function countItems(val){
  return (val||'').split('\n').map(function(s){return s.trim();}).filter(function(s){return s.length;}).length;
}
function updateCount(i){
  var c=document.getElementById('count'+i);
  if(c){var n=countItems(cols[i].value);c.textContent=n+' item'+(n===1?'':'s');}
}

for(var i=0;i<N;i++){
  (function(i){
    var t=document.getElementById('col'+i);
    cols.push(t);
    if(!t)return;
    try{t.value=localStorage.getItem(KEY+i)||'';}catch(e){}
    updateCount(i);
    t.addEventListener('input',function(){
      try{localStorage.setItem(KEY+i,t.value);}catch(e){}
      updateCount(i);flash('Saved ✓');
    });
  })(i);
}

// Starter chips -> append to "Now" column
var starters=document.getElementById('starters');
if(starters)starters.addEventListener('click',function(e){
  var b=e.target.closest('[data-goal]');
  if(!b||!cols[0])return;
  var goal=b.getAttribute('data-goal');
  var cur=cols[0].value.replace(/\s*$/,'');
  cols[0].value=(cur?cur+'\n':'')+goal;
  try{localStorage.setItem(KEY+0,cols[0].value);}catch(e){}
  updateCount(0);flash('Added to "Now" ✓');
});

// Copy map
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){
  var parts=['My life-goals map',''];
  cols.forEach(function(t,i){
    parts.push(labels[i]+':');
    var items=(t.value||'').split('\n').map(function(s){return s.trim();}).filter(function(s){return s.length;});
    if(items.length){items.forEach(function(it){parts.push('  • '+it);});}
    else parts.push('  (none yet)');
    parts.push('');
  });
  var text=parts.join('\n');
  function done(){flash('Copied ✓');}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done,function(){fallback(text,done);});
  }else{fallback(text,done);}
});
function fallback(text,done){
  try{
    var ta=document.createElement('textarea');
    ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.focus();ta.select();
    document.execCommand('copy');document.body.removeChild(ta);done();
  }catch(e){flash('Copy not supported — select the text manually.');}
}

// Clear all
var clearAllBtn=document.getElementById('clearAllBtn');
if(clearAllBtn)clearAllBtn.addEventListener('click',function(){
  if(!window.confirm('Clear all three columns on this device? This cannot be undone.'))return;
  cols.forEach(function(t,i){t.value='';try{localStorage.removeItem(KEY+i);}catch(e){}updateCount(i);});
  flash('All cleared.');
  if(cols[0])cols[0].focus();
});
}catch(e){console.error('project script error',e);}
});
