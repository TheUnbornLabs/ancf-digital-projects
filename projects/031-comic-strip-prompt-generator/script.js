document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var D={
 consent:[
  ['A signpost is planted in an empty field before anyone arrives.','A traveller appears and reads: "You agreed to this road."','They shrug: "Funny — I was never asked." The signpost looks sheepish.'],
  ['A waiter sets a giant mystery dish at an empty table.','A diner sits down: "I didn\'t order this."','Waiter: "But you\'ll probably like it!" Diner raises an eyebrow.']
 ],
 pressure:[
  ['A tiny snowball labelled "just curious" rolls downhill.','It gathers labels: "when?", "who\'ll care for you?", "everyone does it".','At the bottom it\'s a boulder. A calm figure simply steps aside.'],
  ['A garden where every plant is told to grow the same flower.','One plant quietly grows something else, beautifully.','The gardener pauses, then waters it too.']
 ],
 autonomy:[
  ['A person holds a map with one road drawn in bold.','They notice the paper is blank underneath the printed route.','They pick up a pen and draw their own path. The map smiles.'],
  ['A remote control labelled "your life" sits on a crowded table.','Many hands reach for it at once.','The owner gently takes it back, presses "my choice", and relaxes.']
 ],
 freedom:[
  ['An open field stretches in every direction.','A voice off-panel: "But which way is correct?"','The walker: "Any of them, if it\'s mine." Birds scatter happily.'],
  ['A calendar with every box pre-filled by someone else.','A hand erases a few boxes, leaving them blank.','The blank boxes glow — room to breathe.']
 ],
 myth:[
  ['A myth balloon floats by: "You\'ll regret it."','A pin labelled "actually, contentment is common" drifts near.','Pop. The balloon deflates into a small, harmless puff.'],
  ['A poster reads "A real family = children."','Someone adds, with a marker, "...or love, in any shape."','The poster reads better now; passers-by nod.']
 ]
};
var toneNote={gentle:'Tone: warm and gentle.',witty:'Tone: light and witty.',poignant:'Tone: quiet and poignant.'};
var theme=document.getElementById('theme'),tone=document.getElementById('tone'),p1=document.getElementById('p1'),p2=document.getElementById('p2'),p3=document.getElementById('p3');
var variant=0;
function build(){var arr=D[theme.value]||D.consent;var v=arr[variant%arr.length];p1.textContent=v[0];p2.textContent=v[1];p3.textContent=v[2]+' ('+toneNote[tone.value]+')';}
var genBtn=document.getElementById('genBtn'),againBtn=document.getElementById('againBtn');
if(genBtn)genBtn.addEventListener('click',function(){variant=0;build();});
if(againBtn)againBtn.addEventListener('click',function(){variant++;build();});
if(theme)theme.addEventListener('change',function(){variant=0;build();});
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){var t='Comic storyboard ('+theme.value+', '+tone.value+'):\nPanel 1: '+p1.textContent+'\nPanel 2: '+p2.textContent+'\nPanel 3: '+p3.textContent;A.copy&&A.copy(t,copyBtn);});
build();

var QZ=[{a:1,e:'Kind satire aims at situations, ideas, and pressures — never at a person\'s identity or group.'},{a:0,e:'A classic three-panel comic moves through setup, turn, and resolution.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+QZ.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});

var ta=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),t2=null;
function flash2(m){if(!refStatus)return;refStatus.textContent=m;if(t2)clearTimeout(t2);t2=setTimeout(function(){refStatus.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash2('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ta?ta.value:'',copyRef);});
}catch(e){console.error('project 031 script error',e);}
});
