document.addEventListener('DOMContentLoaded',function(){
try{
var k='ancf-'+location.pathname;
var N=4;
var fields=[];
var status=document.getElementById('saveStatus');
function setStatus(msg){if(status)status.textContent=msg;}
var timer=null;
function flash(msg){
  setStatus(msg);
  if(timer)clearTimeout(timer);
  timer=setTimeout(function(){setStatus('Saved only on this device.');},1400);
}

// Prompt labels, for the copy/export feature
var prompts=[];
for(var i=0;i<N;i++){
  var lbl=document.querySelector('label[for="rf'+i+'"]');
  prompts.push(lbl?lbl.textContent:('Prompt '+(i+1)));
  (function(i){
    var t=document.getElementById('rf'+i);
    if(!t)return;
    fields.push(t);
    try{t.value=localStorage.getItem(k+i)||'';}catch(e){}
    t.addEventListener('input',function(){
      try{localStorage.setItem(k+i,t.value);}catch(e){}
      flash('Saved ✓');
    });
  })(i);
}

var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){
  var lines=[];
  fields.forEach(function(t,i){
    lines.push(prompts[i]);
    lines.push((t.value||'').trim()||'(left blank)');
    lines.push('');
  });
  var text='“Is This My Choice?” — my reflections\n\n'+lines.join('\n');
  function done(){flash('Copied to clipboard ✓');}
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

var clearAllBtn=document.getElementById('clearAllBtn');
if(clearAllBtn)clearAllBtn.addEventListener('click',function(){
  if(!window.confirm('Clear all four reflections on this device? This cannot be undone.'))return;
  fields.forEach(function(t,i){t.value='';try{localStorage.removeItem(k+i);}catch(e){}});
  flash('All cleared.');
  if(fields[0])fields[0].focus();
});
}catch(e){console.error('project script error',e);}
});
