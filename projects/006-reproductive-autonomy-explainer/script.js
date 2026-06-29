document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
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
if(saveBtn)saveBtn.addEventListener('click',function(){
  try{localStorage.setItem(KEY,ta.value);}catch(e){}
  flash('Saved ✓');
});
if(clearBtn)clearBtn.addEventListener('click',function(){
  if(ta.value.trim()&&!window.confirm('Clear your reflection on this device?'))return;
  ta.value='';try{localStorage.removeItem(KEY);}catch(e){}
  flash('Cleared.');ta.focus();
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

/* ---------- Free-choice self-check ---------- */
var fcList=document.getElementById('fcList');
if(fcList){
  var fcBoxes=fcList.querySelectorAll('input[type=checkbox]');
  var fcBar=document.getElementById('fcBar');
  var fcCount=document.getElementById('fcCount');
  var fcMsg=document.getElementById('fcMsg');
  var fcStore={};
  try{fcStore=JSON.parse(localStorage.getItem(KEY+':fc')||'{}')||{};}catch(e){fcStore={};}
  function fcRender(){
    var n=0;
    fcBoxes.forEach(function(b){if(b.checked)n++;});
    if(fcBar)fcBar.style.width=Math.round(n/fcBoxes.length*100)+'%';
    if(fcCount)fcCount.textContent=n+' of '+fcBoxes.length+' conditions ticked.';
    if(fcMsg){
      if(n===fcBoxes.length)fcMsg.textContent='Every condition feels in place — that points to a genuinely free choice.';
      else if(n===0)fcMsg.textContent='';
      else fcMsg.textContent='The unticked items are where your freedom may be under pressure — worth naming, not blaming yourself for.';
    }
  }
  fcBoxes.forEach(function(b){
    var key=b.getAttribute('data-key');
    b.checked=!!fcStore[key];
    b.addEventListener('change',function(){
      fcStore[key]=b.checked;
      try{localStorage.setItem(KEY+':fc',JSON.stringify(fcStore));}catch(e){}
      fcRender();
    });
  });
  fcRender();
}
}catch(e){console.error('project script error',e);}
});
