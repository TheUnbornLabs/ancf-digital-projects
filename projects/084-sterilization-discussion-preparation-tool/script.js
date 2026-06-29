document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var custom=document.getElementById('custom');
var status=document.getElementById('saveStatus');
var timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
var extra={
  options:'4. Which option would you recommend for someone in my situation, and why?\n5. What are the alternatives to a permanent method?',
  risks:'4. What are the risks, the recovery time, and how permanent is each option?\n5. What does "failure rate" mean for each method?',
  serious:'4. Can you note in my record that I asked about this and my clearly stated preference?\n5. If you can\'t help with this, can you refer me to someone who can?'
};
function scaffold(){
  var f=document.getElementById('focus').value;
  return 'QUESTIONS FOR MY PROVIDER\n\n'+
    '1. What permanent and long-term contraception options are available to me?\n'+
    '2. What are the benefits and risks of each?\n'+
    '3. What should I expect before, during, and after?\n'+
    (extra[f]||extra.options)+'\n'+
    '6. What follow-up or aftercare is involved?\n\n'+
    'My own questions:\n  - \n\n'+
    '(For information only — your provider gives the medical guidance.)';
}
if(custom){try{var saved=localStorage.getItem(KEY);if(saved)custom.value=saved;}catch(e){}custom.addEventListener('input',function(){try{localStorage.setItem(KEY,custom.value);}catch(e){}flash('Saved ✓');});}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',function(){if(custom.value.trim()&&!window.confirm('Replace the current text with a fresh list?'))return;custom.value=scaffold();try{localStorage.setItem(KEY,custom.value);}catch(e){}flash('List ready ✓');custom.focus();});
var copyCustom=document.getElementById('copyCustom');
if(copyCustom)copyCustom.addEventListener('click',function(){var text=(custom.value||'').trim();if(!text){flash('Generate a list first.');return;}function done(){copyCustom.textContent='Copied ✓';setTimeout(function(){copyCustom.textContent='Copy my questions';},1500);}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fb(text,done);});}else{fb(text,done);}});
function fb(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){flash('Copy not supported.');}}
}catch(e){console.error('project script error',e);}
});
