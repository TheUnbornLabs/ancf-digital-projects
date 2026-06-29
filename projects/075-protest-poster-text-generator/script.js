document.addEventListener('DOMContentLoaded',function(){
try{
var S={
  autonomy:['MY BODY, MY DECISION — RESPECT REPRODUCTIVE AUTONOMY','MY FUTURE IS MINE TO AUTHOR','AUTONOMY IS FOR EVERYONE'],
  respect:['EVERY CHOICE DESERVES RESPECT — PARENT OR CHILDFREE','RESPECT THE PERSON, NOT JUST THE PATH','DIFFERENT CHOICES, EQUAL DIGNITY'],
  choice:['MORE CHOICES, NOT FEWER','FREEDOM TO DECIDE, IN EVERY DIRECTION','TO HAVE OR NOT — BOTH ARE FREEDOM'],
  solidarity:['MOTHERS & CHILDFREE — SAME FREEDOM, SAME SIDE','SOLIDARITY OVER JUDGEMENT','WE RISE BY WIDENING RESPECT']
};
function pick(a,i){return a[((i%a.length)+a.length)%a.length];}
var variant=0;
function build(){var s=S[document.getElementById('focus').value]||S.autonomy;return pick(s,variant);}

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
