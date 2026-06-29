document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;

var openers=[
  "Open warm: a big greeting and a quick question about THEIR news.",
  "Lead with affection: hug, compliment, and ask what's new with them.",
  "Arrive relaxed: greet widely, settle in, get a drink before the questions start."
];
var lines={
  patient:["\"It's a settled choice for us, and we're at peace with it.\"","\"We've thought about it a lot — this is right for us. How are things with you?\""],
  low:["\"We're happy as we are — anyway, tell me about you!\"","\"That's a settled one for us. What's new in your world?\""],
  playful:["\"Still gloriously well-rested, thanks for asking!\"","\"We're fully booked on hobbies and naps — no vacancies!\""]
};
var exits=[
  "\"I'm going to grab a drink / help in the kitchen\" — then take a breath.",
  "\"Let me go say hi to [relative]\" — and drift to a calmer corner.",
  "Step outside for two minutes of air; you're allowed to reset."
];
function pick(arr,i){return arr[((i%arr.length)+arr.length)%arr.length];}

var variant=0;
function build(){
  var energy=document.getElementById('energy').value;
  var topic=document.getElementById('topic').value;
  var lineSet=lines[energy]||lines.patient;
  return 'POCKET SCRIPT\n'+
    '1) Opening — '+pick(openers,variant)+'\n'+
    '2) If asked about "'+topic+'": '+pick(lineSet,variant)+'\n'+
    '3) Broken record (if pushed): repeat the same line, calmly, once more.\n'+
    '4) Exit — '+pick(exits,variant)+'\n'+
    'Remember: warm tone, short answers, no essays owed.';
}

var out=document.getElementById('genOut');
var custom=document.getElementById('custom');
var status=document.getElementById('saveStatus');
var timer=null;
function flash(msg){if(!status)return;status.textContent=msg;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}

function generate(){
  var text=build();
  out.textContent=text;
  if(custom){custom.value=text;try{localStorage.setItem(KEY,custom.value);}catch(e){}}
}
var genBtn=document.getElementById('genBtn');
var againBtn=document.getElementById('againBtn');
if(genBtn)genBtn.addEventListener('click',function(){variant=0;generate();});
if(againBtn)againBtn.addEventListener('click',function(){variant++;generate();});

if(custom){
  try{var saved=localStorage.getItem(KEY);if(saved){custom.value=saved;out.textContent=saved;}}catch(e){}
  custom.addEventListener('input',function(){try{localStorage.setItem(KEY,custom.value);}catch(e){}flash('Saved ✓');});
}

function copyText(text,btn,label){
  if(!text||!text.trim()){flash('Nothing to copy yet.');return;}
  function done(){if(btn){btn.textContent='Copied ✓';setTimeout(function(){btn.textContent=label;},1500);}}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done,function(){fallback(text,done);});
  }else{fallback(text,done);}
}
function fallback(text,done){
  try{
    var t=document.createElement('textarea');
    t.value=text;t.style.position='fixed';t.style.opacity='0';
    document.body.appendChild(t);t.focus();t.select();
    document.execCommand('copy');document.body.removeChild(t);done();
  }catch(e){flash('Copy not supported — select the text manually.');}
}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){copyText(out.textContent,copyBtn,'Copy to clipboard');});
var copyCustom=document.getElementById('copyCustom');
if(copyCustom)copyCustom.addEventListener('click',function(){copyText(custom?custom.value:'',copyCustom,'Copy my version');});
}catch(e){console.error('project script error',e);}
});
