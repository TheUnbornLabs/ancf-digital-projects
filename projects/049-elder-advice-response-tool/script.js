document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var who={Grandparent:'Grandmother/Grandfather',Parent:'Mum/Dad',"Respected elder":'',"Aunt or uncle":'Auntie/Uncle'};
var openers=[
  "Thank you — I really value your wisdom and the love behind your advice.",
  "I'm grateful for your guidance; it means a lot coming from you.",
  "I always take what you say to heart — thank you for caring about me."
];
var middles={
  warm:[
    "I've thought about this a great deal, and I've found a path that brings me real peace.",
    "After a lot of reflection, this is the life that feels right for me."
  ],
  firm:[
    "I've made my decision with care, and I'd be grateful to have it respected.",
    "This is settled for me, and I hope you can trust me with it."
  ]
};
var closers=[
  "Your blessing would mean a great deal to me.",
  "More than anything, I'd love to have your support.",
  "I hope, in time, you can be happy for me."
];
function pick(arr,i){return arr[((i%arr.length)+arr.length)%arr.length];}
var variant=0;
function build(){
  var tone=document.getElementById('tone').value;
  return [pick(openers,variant),pick(middles[tone]||middles.warm,variant),pick(closers,variant)].join(' ');
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
if(custom){try{var saved=localStorage.getItem(KEY);if(saved){custom.value=saved;out.textContent=saved;}}catch(e){}custom.addEventListener('input',function(){try{localStorage.setItem(KEY,custom.value);}catch(e){}flash('Saved ✓');});}
function copyText(text,btn,label){if(!text||!text.trim()||text.indexOf('will appear')>=0){flash('Generate first.');return;}function done(){if(btn){btn.textContent='Copied ✓';setTimeout(function(){btn.textContent=label;},1500);}}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fb(text,done);});}else{fb(text,done);}}
function fb(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){flash('Copy not supported.');}}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){copyText(out.textContent,copyBtn,'Copy to clipboard');});
var copyCustom=document.getElementById('copyCustom');
if(copyCustom)copyCustom.addEventListener('click',function(){copyText(custom?custom.value:'',copyCustom,'Copy my version');});
}catch(e){console.error('project script error',e);}
});
