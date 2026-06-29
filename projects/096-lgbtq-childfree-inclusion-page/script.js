document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
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
function fb(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){flash('Copy not supported — select the text manually.');}}
}catch(e){console.error('project script error',e);}
});
