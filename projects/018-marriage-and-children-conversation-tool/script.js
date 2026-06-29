document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;

var stageText={dating:"we're dating seriously",engaged:"we're engaged",married:"we're married"};
var stanceText={
  firm:"I feel clear that I don't want children.",
  leaning:"I'm currently leaning toward not having children.",
  exploring:"I'm still working out how I really feel about children."
};
var openers=[
  "There's something important to me, and I'd like to share it honestly.",
  "Can we talk about something that's been on my mind? It matters to me.",
  "I'd love to have an open, no-pressure conversation about our future."
];
var goalText={
  understand:"I'd really like to understand where you are, without either of us having to defend ourselves.",
  share:"I wanted to be honest with you about where I stand, and hear your thoughts too.",
  together:"I'd love for us to figure out what feels right for both of us, together."
};

function pick(arr,i){return arr[((i%arr.length)+arr.length)%arr.length];}

var variant=0;
function build(){
  var stage=document.getElementById('stage').value;
  var stance=document.getElementById('stance').value;
  var goal=document.getElementById('goal').value;
  var parts=[
    pick(openers,variant),
    stanceText[stance]||stanceText.exploring,
    'Since '+(stageText[stage]||stageText.dating)+', '+(goalText[goal]||goalText.understand)
  ];
  return parts.join(' ').replace(/\s+/g,' ').trim();
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
