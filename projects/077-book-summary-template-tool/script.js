document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var custom=document.getElementById('custom');
var status=document.getElementById('saveStatus');
var timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
function v(id){var e=document.getElementById(id);return e?e.value.trim():'';}
function scaffold(){
  var t=v('title')||'[title]',a=v('author')||'[author]',tk=v('takeaway')||'[your one-line takeaway]';
  return 'BOOK SUMMARY\n'+
    'Title: '+t+'\n'+
    'Author: '+a+'\n\n'+
    'Thesis (the main argument, stated fairly):\n  \n\n'+
    'Three key ideas:\n  1. \n  2. \n  3. \n\n'+
    'Strongest objection I noticed:\n  \n\n'+
    'My takeaway: '+tk+'\n'+
    'Would I recommend it, and to whom:\n  \n'+
    'Rating /5: ';
}
// restore
if(custom){try{var saved=localStorage.getItem(KEY);if(saved)custom.value=saved;}catch(e){}custom.addEventListener('input',function(){try{localStorage.setItem(KEY,custom.value);}catch(e){}flash('Saved ✓');});}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',function(){
  if(custom.value.trim()&&!window.confirm('Replace the current text with a fresh template?'))return;
  custom.value=scaffold();try{localStorage.setItem(KEY,custom.value);}catch(e){}flash('Template ready ✓');custom.focus();
});
var copyCustom=document.getElementById('copyCustom');
if(copyCustom)copyCustom.addEventListener('click',function(){
  var text=(custom.value||'').trim();
  if(!text){flash('Generate a template first.');return;}
  function done(){copyCustom.textContent='Copied ✓';setTimeout(function(){copyCustom.textContent='Copy my summary';},1500);}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fb(text,done);});}else{fb(text,done);}
});
function fb(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){flash('Copy not supported.');}}
}catch(e){console.error('project script error',e);}
});
