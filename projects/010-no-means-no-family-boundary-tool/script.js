document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;

var openers={
  warm:["I know this comes from a place of love.","I appreciate that you care about my happiness.","I can tell you mean well."],
  brief:["",""],
  humor:["I appreciate the interest in my life plan!","You're persistent — I'll give you that!","We could put this question on a loop, but…"]
};
var situations={
  general:"I've made my decision about children, and it isn't changing.",
  timeline:"I don't have a timeline to share, and that's okay.",
  changemind:"I've thought about this carefully — it isn't a phase.",
  careold:"Children aren't a retirement plan; I'm looking after my future in other ways.",
  ownkids:"I understand it was different for you. For me, this is the right choice.",
  duty:"I respect where this comes from, and I've made a considered decision for my own life.",
  compare:"I'm not in a competition with anyone — this is my life, and my choice is my own.",
  public:"I'd rather not get into this here. Let's catch up properly another time."
};
var cores={
  warm:["and I'd be grateful if {p} could respect it.","and it would mean a lot if {p} let it rest."],
  brief:["I'd like us to move on from this topic.","Please consider it settled."],
  humor:["so we can officially retire this question.","let's mark it 'asked and answered'."]
};
var redirects=["I'm always happy to talk about other things.","Now — tell me what's new with you.","Let's move on to something lighter."];

function pick(arr,i){return arr[((i%arr.length)+arr.length)%arr.length];}

var variant=0;
function build(){
  var tone=document.getElementById('tone').value;
  var who=document.getElementById('who').value;
  var sit=document.getElementById('situation').value;
  var pronoun=(who==='group')?'we':'you';
  var opener=pick(openers[tone]||[""] ,variant);
  var sitLine=situations[sit]||situations.general;
  var core=pick(cores[tone]||cores.brief,variant).replace('{p}',pronoun);
  var redir=pick(redirects,variant);
  var parts=[];
  if(opener)parts.push(opener);
  parts.push(sitLine);
  if(core)parts.push(core);
  parts.push(redir);
  // join, fixing capitalisation after a connective like "and"
  var s=parts.join(' ').replace(/\.\s+and\b/g,', and').replace(/\s+/g,' ').trim();
  return s;
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

// restore any saved custom text
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
