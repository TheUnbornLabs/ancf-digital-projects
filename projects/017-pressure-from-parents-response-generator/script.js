document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;

var openers={
  loving:["Thank you for caring about my future.","I know this comes from love, and I don't take that for granted.","I can tell you want the best for me."],
  final:["I want to be clear and gentle about this.","Let me say this once, calmly."],
  honest:["I'd like to be open with you.","Can I be honest about where I'm at?"]
};
var goals={
  peace:"I've decided not to have children, and I'm genuinely at peace with it.",
  rest:"I'd really like us to let this topic rest now.",
  close:"Even though we may see this differently, I want us to stay close."
};
var concerns={
  none:"",
  future:"I'm building a secure, connected future — I won't be alone, and I'm planning for it.",
  grandkids:"I understand you hoped for grandchildren, and I'm sorry this part is hard.",
  others:"What relatives think matters less to me than living a life that's honestly mine.",
  tradition:"I respect our traditions, and I've thought about this carefully for my own life."
};
var closers={
  loving:["I hope you can trust me with my own life.","I love you, and I hope we can move forward together."],
  final:["My decision is settled, and I'd be grateful if we could leave it there.","This is set, and I'm at peace with it."],
  honest:["I'd love for us to understand each other, even if we don't fully agree.","Thanks for hearing me out."]
};

function pick(arr,i){if(!arr||!arr.length)return '';return arr[((i%arr.length)+arr.length)%arr.length];}

var variant=0;
function build(){
  var tone=document.getElementById('tone').value;
  var goal=document.getElementById('goal').value;
  var concern=document.getElementById('concern').value;
  var parts=[];
  var opener=pick(openers[tone],variant);
  if(opener)parts.push(opener);
  parts.push(goals[goal]||goals.peace);
  if(concerns[concern])parts.push(concerns[concern]);
  parts.push(pick(closers[tone],variant));
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
