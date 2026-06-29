document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;

var beats=[
  "faces a familiar, well-meant question about the future.",
  "is handed a swirl of heavy expectations, gift-wrapped with love.",
  "notices the pressure building, like steam in a kettle.",
  "is asked, again, when they'll follow 'the plan'."
];
var resolutions=[
  "chooses themselves, calmly and kindly — everyone keeps their dignity.",
  "sets a warm boundary, and the room softens.",
  "breathes, smiles, and changes the subject with grace.",
  "celebrates a quiet, unglamorous win that's entirely their own."
];
function pick(arr,i){return arr[((i%arr.length)+arr.length)%arr.length];}

var variant=0;
function build(){
  var hero=document.getElementById('hero').value;
  var theme=document.getElementById('theme').value;
  var format=document.getElementById('format').value;
  var beat=pick(beats,variant);
  var res=pick(resolutions,variant);
  var head='COMIC PREMISE — theme: '+theme+'\n';
  if(format==='four'){
    return head+
      'Panel 1: '+hero+' '+beat+'\n'+
      'Panel 2: The expectation looms large (draw it as a metaphor, not a person).\n'+
      'Panel 3: '+hero+' takes a breath.\n'+
      'Panel 4: '+hero+' '+res+'\n'+
      'Tone: gentle, metaphorical, never mocking real people.';
  }
  if(format==='single'){
    return head+
      'One panel: '+hero+' '+beat+' In the same frame, a small caption shows them already '+res+'\n'+
      'Tone: warm, witty, kind.';
  }
  if(format==='wordless'){
    return head+
      'Wordless strip: show '+hero+' through expression and metaphor only.\n'+
      '• Beat 1: '+beat.replace(/\.$/,'')+' (no words).\n'+
      '• Beat 2: the weight of it, drawn as an object.\n'+
      '• Beat 3: '+hero+' '+res+'\n'+
      'Let body language carry the whole story.';
  }
  // diary
  return head+
    'Diary entry from '+hero+':\n'+
    '"Today I '+beat.replace(/\.$/,'')+'. It was a lot. But by the end, I '+res+'"\n'+
    'Pair with a simple doodle in the margin.';
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
