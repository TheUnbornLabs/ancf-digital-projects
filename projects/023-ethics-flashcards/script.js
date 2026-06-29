document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var CARDS=[
 ['Consent','Agreeing to something in advance. A future person cannot consent to being born — they do not yet exist to be asked.'],
 ['Asymmetry','Benatar’s claim: the absence of pain is good even if no one enjoys it, while the absence of pleasure is not bad unless someone is deprived.'],
 ['Non-identity problem','A person exists only because they were born, so comparing them to "never existing" makes "harm to them" hard to define.'],
 ['Reproductive autonomy','The right to decide whether, when, and how to have children — including the freedom to have none.'],
 ['Pronatalism','The cultural assumption that having children is the normal, expected, superior path.'],
 ['Antinatalism','The view that creating a new person deserves serious ethical questioning rather than being an automatic good.'],
 ['Childfree','An active choice not to have children (distinct from "childless", which is usually circumstance).'],
 ['Harm prevention','Acting so that avoidable suffering does not happen in the first place.'],
 ['Bodily autonomy','The principle that the final say over your own body rests with you.'],
 ['Coercion','Pressure that overrides free choice — from threats to persistent guilt that ignores your "no".'],
 ['Proxy consent','Deciding on another’s behalf (as parents do for a child’s surgery); contested for a person who does not yet exist.'],
 ['Expected value','Weighing each outcome by its probability and summing — one lens for thinking about risk.']
];
var known=A.getJSON?(A.getJSON('known',{})||{}):{};
var wrap=document.getElementById('cards'),bar=document.getElementById('knownBar'),pct=document.getElementById('knownPct');
function renderMeter(){var n=0;CARDS.forEach(function(c,i){if(known[i])n++;});if(A.meter)A.meter(bar,n/CARDS.length*100);if(pct)pct.textContent=Math.round(n/CARDS.length*100)+'%';}
function build(order){
  wrap.innerHTML='';
  order.forEach(function(i){
    var c=CARDS[i];
    var flip=document.createElement('div');flip.className='flip';flip.style.height='160px';flip.setAttribute('tabindex','0');flip.setAttribute('role','button');flip.setAttribute('aria-label','Flip card: '+c[0]);
    var inner=document.createElement('div');inner.className='inner';
    var f=document.createElement('div');f.className='face';f.innerHTML='<strong>'+c[0]+'</strong>';
    var b=document.createElement('div');b.className='face back';b.style.fontSize='var(--fs-sm)';b.textContent=c[1];
    inner.appendChild(f);inner.appendChild(b);flip.appendChild(inner);
    function dofl(){flip.classList.toggle('on');}
    flip.addEventListener('click',function(e){if(e.target.tagName==='BUTTON')return;dofl();});
    flip.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();dofl();}});
    var kb=document.createElement('button');kb.className='btn';kb.type='button';kb.style.width='100%';kb.style.marginTop='6px';kb.style.padding='6px';kb.style.fontSize='var(--fs-xs)';
    kb.textContent=known[i]?'✓ Know it':'Mark: Learning';
    kb.addEventListener('click',function(e){e.stopPropagation();known[i]=!known[i];if(A.setJSON)A.setJSON('known',known);kb.textContent=known[i]?'✓ Know it':'Mark: Learning';renderMeter();});
    var cell=document.createElement('div');cell.appendChild(flip);cell.appendChild(kb);
    wrap.appendChild(cell);
  });
}
var order=CARDS.map(function(_,i){return i;});
build(order);renderMeter();
var shuffleBtn=document.getElementById('shuffleBtn');
if(shuffleBtn)shuffleBtn.addEventListener('click',function(){for(var i=order.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=order[i];order[i]=order[j];order[j]=t;}build(order);});
var resetKnown=document.getElementById('resetKnown');
if(resetKnown)resetKnown.addEventListener('click',function(){if(!window.confirm('Reset your known/learning marks?'))return;known={};if(A.remove)A.remove('known');build(order);renderMeter();});

/* ---------- Quiz ---------- */
var QZ=[{a:1,e:'A person exists only because they were born — so "were they harmed compared to non-existence?" is philosophically tricky.'},{a:0,e:'"Childfree" implies an active choice; "childless" usually describes circumstance.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+QZ.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});

/* ---------- Reflection ---------- */
var ta=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),t2=null;
function flash2(m){if(!refStatus)return;refStatus.textContent=m;if(t2)clearTimeout(t2);t2=setTimeout(function(){refStatus.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash2('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ta?ta.value:'',copyRef);});
}catch(e){console.error('project 023 script error',e);}
});
