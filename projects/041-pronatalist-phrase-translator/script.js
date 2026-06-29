document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var data={
  changemind:{said:'"You\'ll change your mind"',assumes:'that your decision is not yet real or fully rational.',
    replies:['"I hear the care behind that — and I\'ve thought about it carefully."','"If that ever changes, you\'ll be among the first to know. For now, this is me."']},
  different:{said:'"It\'s different when they\'re yours"',assumes:'that your present feelings can\'t be trusted.',
    replies:['"Maybe it would be — and I still get to decide what\'s right for my life."','"I believe you that it was different for you. This is my honest answer."']},
  careold:{said:'"Who\'ll care for you when you\'re old?"',assumes:'that children are an insurance policy.',
    replies:['"I\'d rather build friendships and savings I can actually count on."','"Care comes from many places — I\'m planning for mine directly."']},
  home:{said:'"A home needs children"',assumes:'that a household has no value without them.',
    replies:['"My home is already full of love and purpose."','"A home is made by the people in it, however many that is."']},
  selfish:{said:'"It\'s selfish not to have kids"',assumes:'that a personal choice is a moral failing.',
    replies:['"Choosing the life that fits me isn\'t selfish — and plenty of caring people are childfree."','"Selfishness is about harming others; this harms no one."']},
  incomplete:{said:'"You\'re not complete without children"',assumes:'that your worth depends on parenthood.',
    replies:['"I\'m already whole — I\'m not a person-in-waiting."','"My completeness isn\'t conditional on having children."']}
};
function pick(arr,i){return arr[((i%arr.length)+arr.length)%arr.length];}
var variant=0;
function build(){
  var key=document.getElementById('phrase').value;
  var d=data[key]||data.changemind;
  return 'They said: '+d.said+'\nOften assumes: '+d.assumes+'\nA kind reply: '+pick(d.replies,variant);
}
var out=document.getElementById('genOut');
var custom=document.getElementById('custom');
var status=document.getElementById('saveStatus');
var timer=null;
function flash(msg){if(!status)return;status.textContent=msg;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
function generate(){var t=build();out.textContent=t;if(custom){custom.value=t;try{localStorage.setItem(KEY,custom.value);}catch(e){}}}
var genBtn=document.getElementById('genBtn');
var againBtn=document.getElementById('againBtn');
if(genBtn)genBtn.addEventListener('click',function(){variant=0;generate();});
if(againBtn)againBtn.addEventListener('click',function(){variant++;generate();});
if(custom){
  try{var saved=localStorage.getItem(KEY);if(saved){custom.value=saved;out.textContent=saved;}}catch(e){}
  custom.addEventListener('input',function(){try{localStorage.setItem(KEY,custom.value);}catch(e){}flash('Saved ✓');});
}
function copyText(text,btn,label){
  if(!text||!text.trim()||text.indexOf('will appear')>=0){flash('Translate first.');return;}
  function done(){if(btn){btn.textContent='Copied ✓';setTimeout(function(){btn.textContent=label;},1500);}}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fb(text,done);});}else{fb(text,done);}
}
function fb(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){flash('Copy not supported.');}}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){copyText(out.textContent,copyBtn,'Copy to clipboard');});
var copyCustom=document.getElementById('copyCustom');
if(copyCustom)copyCustom.addEventListener('click',function(){copyText(custom?custom.value:'',copyCustom,'Copy my version');});
}catch(e){console.error('project script error',e);}
});
