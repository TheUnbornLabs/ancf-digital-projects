document.addEventListener('DOMContentLoaded',function(){
try{
var openers={
  resolute:["I choose my life with {v} at its centre.","At the heart of my life is {v} — chosen, not inherited."],
  warm:["I'm building a life around {v}, with an open heart.","{V} guides me, and I hold it gently."],
  bold:["My life runs on {v}, unapologetically.","I put {v} first, and I won't shrink from it."]
};
var middles={
  resolute:["I make my decisions thoughtfully, and hold them with calm conviction.","I act from reflection, not from pressure."],
  warm:["I make my decisions thoughtfully, and welcome honest conversation about them.","I stay open to others while staying true to myself."],
  bold:["I decide for myself, and I don't outsource that to anyone.","I'd rather be honestly me than comfortably expected."]
};
var closer="I respect others' paths, and I ask the same respect for mine.";
function pick(a,i){return a[((i%a.length)+a.length)%a.length];}
var variant=0;
function build(){
  var v=document.getElementById('value').value;
  var tone=document.getElementById('tone').value;
  var vl=v.toLowerCase();
  function fillv(s){return s.replace('{v}',vl).replace('{V}',v);}
  return 'MY MANIFESTO\n'+fillv(pick(openers[tone]||openers.resolute,variant))+' '+pick(middles[tone]||middles.resolute,variant)+' '+closer;
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
