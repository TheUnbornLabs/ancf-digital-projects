document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
function build(){
  var focus=document.getElementById('focus').value;
  var strict=document.getElementById('strict').value;
  var enforce=(strict==='Strict')?'Admins remove rule-breakers after one warning.':
    (strict==='Relaxed')?'Admins prefer a friendly nudge first; removal only for serious or repeated harm.':
    'Admins issue a warning, then remove on repeat.';
  return 'GROUP RULES — '+focus+'\n\n'+
    '1. Be respectful. No hate toward parents, children, women, men, castes, religions, ethnic groups, disabled people, or LGBTQ+ people.\n'+
    '2. No harassment, doxxing, threats, or dehumanising language.\n'+
    '3. No encouragement of self-harm or violence. If someone is struggling, respond with care and share support resources.\n'+
    '4. Stay roughly on topic: '+focus.toLowerCase()+'.\n'+
    '5. Disagree with ideas, not people. Critique claims kindly.\n'+
    '6. No spam, ads, or unsolicited DMs to members.\n'+
    '7. Respect privacy: what\'s shared here stays here.\n'+
    '8. Enforcement: '+enforce+'\n'+
    '9. This group is for education and support — not medical, legal, or financial advice.';
}
var out=document.getElementById('genOut');
var custom=document.getElementById('custom');
var status=document.getElementById('saveStatus');
var timer=null;
function flash(msg){if(!status)return;status.textContent=msg;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
function generate(){var t=build();out.textContent=t;if(custom){custom.value=t;try{localStorage.setItem(KEY,custom.value);}catch(e){}}}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',generate);
if(custom){
  try{var saved=localStorage.getItem(KEY);if(saved){custom.value=saved;out.textContent=saved;}}catch(e){}
  custom.addEventListener('input',function(){try{localStorage.setItem(KEY,custom.value);}catch(e){}flash('Saved ✓');});
}
function copyText(text,btn,label){
  if(!text||!text.trim()||text.indexOf('will appear')>=0){flash('Generate first.');return;}
  function done(){if(btn){btn.textContent='Copied ✓';setTimeout(function(){btn.textContent=label;},1500);}}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fallback(text,done);});}
  else{fallback(text,done);}
}
function fallback(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){flash('Copy not supported.');}}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){copyText(out.textContent,copyBtn,'Copy to clipboard');});
var copyCustom=document.getElementById('copyCustom');
if(copyCustom)copyCustom.addEventListener('click',function(){copyText(custom?custom.value:'',copyCustom,'Copy my version');});
}catch(e){console.error('project script error',e);}
});
