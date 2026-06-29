document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var bodies={
  welcome:"Welcome! This is a respectful space for reflection on childfree and antinatalist topics. Please read the pinned rules, then introduce yourself whenever you're ready — we're glad you're here.",
  event:"You're invited to our upcoming gathering.\nWhat: [event name]\nWhen: [date & time]\nWhere: [place / link]\nPlease RSVP by [date]. All respectful members are welcome.",
  policy:"We've updated our community guidelines to keep everyone safe and respected. Key change: [describe the change]. Please review the pinned rules. Questions are welcome — just reply here.",
  reminder:"A gentle reminder: [the reminder]. Thanks for helping keep this space kind and on-topic."
};
var signoff={warm:"\n\nWith care,\nYour mods 🤍",formal:"\n\nRegards,\nThe moderation team"};
function build(){
  var type=document.getElementById('type').value;
  var tone=document.getElementById('tone').value;
  var title={welcome:'WELCOME',event:'EVENT ANNOUNCEMENT',policy:'POLICY UPDATE',reminder:'REMINDER'}[type]||'NOTICE';
  return '📢 '+title+'\n\n'+(bodies[type]||'')+(signoff[tone]||'');
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
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fallback(text,done);});}else{fallback(text,done);}
}
function fallback(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){flash('Copy not supported.');}}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){copyText(out.textContent,copyBtn,'Copy to clipboard');});
var copyCustom=document.getElementById('copyCustom');
if(copyCustom)copyCustom.addEventListener('click',function(){copyText(custom?custom.value:'',copyCustom,'Copy my version');});
}catch(e){console.error('project script error',e);}
});
