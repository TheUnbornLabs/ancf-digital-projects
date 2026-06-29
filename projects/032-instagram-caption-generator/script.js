document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;

var moodLines={
  reflective:["Still learning, still choosing, still me.","Quiet certainty has its own kind of joy.","I keep choosing this, and it keeps feeling right."],
  empowered:["My life, my terms.","I built this on purpose.","No apologies, no permission needed."],
  light:["No regrets, lots of naps.","Plot twist: I'm thriving.","Living my softest, most unbothered era."],
  warm:["Grateful for the life I actually chose.","Surrounded by the people I picked.","Gentle days, full heart."]
};
var stories={
  reflective:"For a long time I assumed I'd follow the script. Then I asked what I actually wanted — and built a life around the honest answer.",
  empowered:"People kept handing me a timeline. I handed it back. This is the life I'm choosing, fully and on purpose.",
  light:"I was promised I'd 'change my mind.' Instead I changed my plans, my mornings, and my stress levels. Highly recommend.",
  warm:"My family is the one I tend on purpose — friends, partners, community. It's smaller than expected and bigger than I imagined."
};
var tags="#Childfree #ReproductiveAutonomy #MyChoice #ChosenFamily";
function pick(arr,i){return arr[((i%arr.length)+arr.length)%arr.length];}

var variant=0;
function build(){
  var mood=document.getElementById('mood').value;
  var topic=document.getElementById('topic').value;
  var length=document.getElementById('length').value;
  var line=pick(moodLines[mood]||moodLines.reflective,variant);
  var body;
  if(length==='short'){
    body=topic+'. '+line;
  }else if(length==='long'){
    body=topic+'.\n\n'+(stories[mood]||stories.reflective)+'\n\n'+line;
  }else{
    body=topic+'. '+line+' Choosing the life that fits me, and wishing the same freedom for everyone.';
  }
  return body+'\n\n'+tags;
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
