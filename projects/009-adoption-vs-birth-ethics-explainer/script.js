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

/* ---------- "What weighs on you?" checklist ---------- */
var weighList=document.getElementById('weighList');
if(weighList){
  var wBoxes=weighList.querySelectorAll('input[type=checkbox]');
  var wCount=document.getElementById('weighCount');
  var wStatus=document.getElementById('weighStatus');
  var wStore={};
  try{wStore=JSON.parse(localStorage.getItem(KEY+':weigh')||'{}')||{};}catch(e){wStore={};}
  var wTimer=null;
  function wFlash(msg){if(!wStatus)return;wStatus.textContent=msg;if(wTimer)clearTimeout(wTimer);wTimer=setTimeout(function(){wStatus.textContent='';},1600);}
  function wRender(){
    var n=0;wBoxes.forEach(function(b){if(b.checked)n++;});
    if(wCount)wCount.textContent=n+' selected.';
  }
  wBoxes.forEach(function(b){
    var key=b.getAttribute('data-key');
    b.checked=!!wStore[key];
    b.addEventListener('change',function(){
      wStore[key]=b.checked;
      try{localStorage.setItem(KEY+':weigh',JSON.stringify(wStore));}catch(e){}
      wRender();
    });
  });
  wRender();
  var wCopy=document.getElementById('weighCopy');
  if(wCopy)wCopy.addEventListener('click',function(){
    var picked=[];
    wBoxes.forEach(function(b){if(b.checked)picked.push('• '+b.parentNode.textContent.trim());});
    if(!picked.length){wFlash('Tick a few first.');return;}
    var text='What weighs on me (adoption vs birth):\n'+picked.join('\n');
    function done(){wFlash('Copied ✓');}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fallbackCopy(text,done);});}
    else{fallbackCopy(text,done);}
  });
}
}catch(e){console.error('project script error',e);}
});
