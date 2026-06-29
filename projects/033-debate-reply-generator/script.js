document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;

var R={
  selfish:{
    socratic:["Can a personal choice that harms no one really be called selfish?","Is it selfish to know yourself well enough not to parent for the wrong reasons?"],
    calm:["Choosing the life that fits me isn't selfish — and many caring people are childfree.","Selfishness is about harming others for gain; this choice harms no one."],
    bridge:["I hear that you value selflessness — so do I. I just express it in ways other than parenting."]
  },
  regret:{
    socratic:["Would we accept 'you might regret it' as a reason for any other considered decision?","If regret is the worry, isn't it possible to regret either path?"],
    calm:["Regret is possible in any life, including parenthood. I've made this choice with open eyes.","I'm at peace with my decision and its trade-offs."],
    bridge:["I get that you don't want me to be unhappy. I've really thought about this, and I'm content."]
  },
  unnatural:{
    socratic:["Many human choices differ from nature — what makes this one wrong rather than simply different?","Is 'natural' always the same as 'good'?"],
    calm:["People build meaningful lives in countless ways; mine is one of them.","'Different from the default' isn't the same as wrong."],
    bridge:["I understand it feels unusual to you. For me it's simply the honest fit."]
  },
  careold:{
    socratic:["Is it fair to expect a child to be a retirement plan?","Do children guarantee care in old age — for anyone?"],
    calm:["Children aren't a care plan; I'm building friendships, savings, and support I can rely on.","I'm planning my later years directly, which is wise for everyone."],
    bridge:["I know you worry about my future — that's love. I'm taking real steps to be secure."]
  },
  duty:{
    socratic:["Whose life bears the cost of that duty — and should that person get a say?","Can a duty be genuine if it's assigned rather than chosen?"],
    calm:["I respect our family and traditions, and I've made a considered choice for my own life.","Honouring my family doesn't require a decision this personal to go their way."],
    bridge:["I love this family, and I want to contribute to it — just not in this particular way."]
  },
  greatparent:{
    socratic:["Is being capable of something the same as being called to it?","Could I be good at it and still know it isn't right for me?"],
    calm:["Thank you — that's kind. Being able to do something well isn't a reason I have to.","I appreciate the faith in me; this is still a no, made with care."],
    bridge:["That's genuinely warm of you to say. I'd channel that capacity into other parts of my life."]
  }
};
function pick(arr,i){return arr[((i%arr.length)+arr.length)%arr.length];}

var variant=0;
function build(){
  var claim=document.getElementById('claim').value;
  var style=document.getElementById('style').value;
  var set=(R[claim]&&R[claim][style])||["I respect that you see it differently; I'd ask for the same respect I'd give your path."];
  return pick(set,variant);
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
