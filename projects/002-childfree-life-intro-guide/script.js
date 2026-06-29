document.addEventListener('DOMContentLoaded',function(){
try{
var base='ancf-'+location.pathname;

/* ---------- Reflection tool ---------- */
var t=document.getElementById('reflect');
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
if(t){
  try{t.value=localStorage.getItem(base)||'';}catch(e){}
  t.addEventListener('input',function(){try{localStorage.setItem(base,t.value);}catch(e){}});
}
if(saveBtn)saveBtn.addEventListener('click',function(){
  try{localStorage.setItem(base,t.value);}catch(e){}
  flash('Saved ✓');
});
if(clearBtn)clearBtn.addEventListener('click',function(){
  if(t.value.trim()&&!window.confirm('Clear your reflection on this device?'))return;
  t.value='';try{localStorage.removeItem(base);}catch(e){}
  flash('Cleared.');t.focus();
});
if(copyBtn)copyBtn.addEventListener('click',function(){
  var text=(t.value||'').trim();
  if(!text){flash('Nothing to copy yet.');return;}
  function done(){flash('Copied ✓');}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done,function(){fallbackCopy(text,done);});
  }else{fallbackCopy(text,done);}
});
function fallbackCopy(text,done){
  try{
    var ta=document.createElement('textarea');
    ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.focus();ta.select();
    document.execCommand('copy');document.body.removeChild(ta);done();
  }catch(e){flash('Copy not supported — select the text manually.');}
}

/* ---------- Sources-of-meaning self-inventory ---------- */
var list=document.getElementById('meaningList');
if(list){
  var boxes=list.querySelectorAll('input[type=checkbox]');
  var bar=document.getElementById('meaningBar');
  var count=document.getElementById('meaningCount');
  var store={};
  try{store=JSON.parse(localStorage.getItem(base+':meaning')||'{}')||{};}catch(e){store={};}
  function render(){
    var n=0;
    boxes.forEach(function(b){if(b.checked)n++;});
    if(bar)bar.style.width=Math.round(n/boxes.length*100)+'%';
    if(count)count.textContent=n+' of '+boxes.length+' selected.';
  }
  boxes.forEach(function(b){
    var key=b.getAttribute('data-key');
    b.checked=!!store[key];
    b.addEventListener('change',function(){
      store[key]=b.checked;
      try{localStorage.setItem(base+':meaning',JSON.stringify(store));}catch(e){}
      render();
    });
  });
  render();
}
}catch(e){console.error('project script error',e);}
});
