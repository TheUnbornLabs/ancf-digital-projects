document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var R={
  gracious:[
    '"That’s not in our plans, but thank you for thinking of us."',
    '"We’re happy as we are — it means a lot that you care."',
    '"Not for us, but I appreciate you asking kindly."'
  ],
  deflecting:[
    '"Who knows what life holds! How are you doing?"',
    '"We’ll see what the years bring — anyway, tell me your news!"',
    '"Big question for a small plate of snacks! How’s your week been?"'
  ],
  honest:[
    '"We’ve chosen not to have children, and we’re really content with that."',
    '"It’s a settled choice for us — a happy one."',
    '"We’re childfree by choice, and at peace with it."'
  ],
  playful:[
    '"Still gloriously well-rested, thanks!"',
    '"Our plant babies keep us plenty busy."',
    '"We’re fully booked on hobbies and naps — no vacancies!"'
  ],
  boundary:[
    '"That’s a personal one I’d rather not get into — thanks for understanding."',
    '"I’m going to leave that question there, but I’m happy to chat about other things."',
    '"We’ve decided, and it’s not up for discussion — no hard feelings."'
  ]
};
function pick(arr,i){return arr[((i%arr.length)+arr.length)%arr.length];}
var variant=0;
var out=document.getElementById('genOut');
function build(){
  var vibe=document.getElementById('vibe').value;
  var set=R[vibe]||R.gracious;
  return pick(set,variant);
}
function generate(){out.textContent=build();}
var genBtn=document.getElementById('genBtn');
var againBtn=document.getElementById('againBtn');
if(genBtn)genBtn.addEventListener('click',function(){variant=0;generate();});
if(againBtn)againBtn.addEventListener('click',function(){variant++;generate();});

var copyBtn=document.getElementById('copyBtn');
function flashBtn(btn,label){btn.textContent='Copied ✓';setTimeout(function(){btn.textContent=label;},1500);}
if(copyBtn)copyBtn.addEventListener('click',function(){
  var text=(out.textContent||'').trim();
  if(!text||text.indexOf('will appear')>=0){return;}
  function done(){flashBtn(copyBtn,'Copy to clipboard');}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done,function(){fallback(text,done);});
  }else{fallback(text,done);}
});
function fallback(text,done){
  try{
    var t=document.createElement('textarea');
    t.value=text;t.style.position='fixed';t.style.opacity='0';
    document.body.appendChild(t);t.focus();t.select();
    document.execCommand('copy');document.body.removeChild(t);done();
  }catch(e){}
}
}catch(e){console.error('project script error',e);}
});
