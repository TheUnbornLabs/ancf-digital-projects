document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var issues={
  group:"spoke disrespectfully about a group of people",
  spam:"was off-topic or repetitive (spam)",
  harass:"targeted another member personally",
  harm:"appeared to encourage harm",
  hostile:"became hostile or made a personal attack"
};
function build(){
  var issue=document.getElementById('issue').value;
  var step=document.getElementById('step').value;
  var closing=(step==='final')?
    "This is a final warning — a repeat will lead to removal from the group.":
    "Please adjust going forward — this is just a friendly first reminder, no hard feelings.";
  return 'Hello, this is a private note from the moderation team.\n\n'+
    'We noticed a message that '+(issues[issue]||'broke a community rule')+'. '+
    'Our space welcomes disagreement about ideas, but not harm toward people.\n\n'+
    closing+'\n\n'+
    'If you think we\'ve misread the situation, just reply here — we\'re happy to talk it through. Thank you for helping keep this community safe.';
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
