document.addEventListener('DOMContentLoaded',function(){
try{
var T={
  autonomy:{hook:'"Whose business is it whether you have kids?"',point:'Reproductive autonomy means the choice — in either direction — is yours.'},
  childfree:{hook:'"Childfree and childless aren\'t the same thing — here\'s the difference."',point:'Childfree is a choice; childless is often circumstance. Both deserve respect.'},
  regret:{hook:'"\'You\'ll regret it\' — will I, though?"',point:'Regret is possible in any life. A considered choice is what actually protects against it.'},
  boundary:{hook:'"How do you answer the kids question without a fight?"',point:'Name your boundary calmly, then change the subject. Repetition beats argument.'}
};
var ctas=['"Decide for yourself — and be gentle with others doing the same."','"Save this for the next family dinner."','"Your life, your call. Be kind out there."'];
function pick(a,i){return a[((i%a.length)+a.length)%a.length];}
var variant=0;
function build(){
  var t=T[document.getElementById('topic').value]||T.autonomy;
  var len=document.getElementById('length').value;
  var label=(len==='long')?'60 seconds':'30 seconds';
  var body=(len==='long')?'BODY: Make the point, give one real example, then briefly answer the most common objection.':'BODY: Make the one point with a single, vivid example.';
  return 'VIDEO SCRIPT ('+label+')\n'+
    'HOOK (0-3s): '+t.hook+'\n'+
    'POINT: '+t.point+'\n'+
    body+'\n'+
    'TONE: calm, kind, never mocking anyone.\n'+
    'CTA: '+pick(ctas,variant);
}

var out=document.getElementById('genOut');
var custom=document.getElementById('custom');
var status=document.getElementById('saveStatus');
var KEY='ancf-'+location.pathname;
var timer=null;
function flash(msg){if(!status)return;status.textContent=msg;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
function generate(){var text=build();out.textContent=text;if(custom){custom.value=text;try{localStorage.setItem(KEY,custom.value);}catch(e){}}}
var genBtn=document.getElementById('genBtn');
var againBtn=document.getElementById('againBtn');
if(genBtn)genBtn.addEventListener('click',function(){variant=0;generate();});
if(againBtn)againBtn.addEventListener('click',function(){variant++;generate();});
if(custom){try{var saved=localStorage.getItem(KEY);if(saved){custom.value=saved;out.textContent=saved;}}catch(e){}custom.addEventListener('input',function(){try{localStorage.setItem(KEY,custom.value);}catch(e){}flash('Saved ✓');});}
function copyText(text,btn,label){if(!text||!text.trim()||text.indexOf('will appear')>=0){flash('Generate first.');return;}function done(){if(btn){btn.textContent='Copied ✓';setTimeout(function(){btn.textContent=label;},1500);}}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fb(text,done);});}else{fb(text,done);}}
function fb(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){flash('Copy not supported.');}}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){copyText(out.textContent,copyBtn,'Copy to clipboard');});
var copyCustom=document.getElementById('copyCustom');
if(copyCustom)copyCustom.addEventListener('click',function(){copyText(custom?custom.value:'',copyCustom,'Copy my version');});
}catch(e){console.error('project script error',e);}
});
