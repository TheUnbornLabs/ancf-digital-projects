document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var CONCEPTS=[
 ['Consent','agreeing in advance — impossible before birth'],
 ['Asymmetry','absent pain is good; absent pleasure isn\'t bad if no one is deprived'],
 ['Autonomy','your right to decide your own life and body'],
 ['Pronatalism','the assumption everyone should have children'],
 ['Childfree','an active choice not to have children'],
 ['Compassion','the wish to reduce suffering — a common root here']
];
var grid=document.getElementById('grid'),movesEl=document.getElementById('moves'),matchedEl=document.getElementById('matched'),bestEl=document.getElementById('best'),hint=document.getElementById('hint');
var best=null;try{var b=A.get?A.get('best',''):'';best=b?parseInt(b,10):null;}catch(e){}if(bestEl)bestEl.textContent=best||'—';
var cards=[],first=null,lock=false,moves=0,matched=0;
function build(){
  grid.innerHTML='';cards=[];first=null;lock=false;moves=0;matched=0;if(movesEl)movesEl.textContent=0;if(matchedEl)matchedEl.textContent=0;if(hint)hint.textContent='';
  var deck=[];CONCEPTS.forEach(function(c,i){deck.push({i:i,term:c[0]});deck.push({i:i,term:c[0]});});
  for(var k=deck.length-1;k>0;k--){var j=Math.floor(Math.random()*(k+1));var t=deck[k];deck[k]=deck[j];deck[j]=t;}
  deck.forEach(function(card){
    var b=document.createElement('button');b.className='opt';b.type='button';b.style.minHeight='64px';b.textContent='?';b.setAttribute('aria-label','Hidden card');
    b.addEventListener('click',function(){flip(b,card);});
    grid.appendChild(b);cards.push({el:b,card:card,done:false});
  });
}
function flip(el,card){
  if(lock)return;var rec=null;cards.forEach(function(c){if(c.el===el)rec=c;});if(!rec||rec.done||el===(first&&first.el))return;
  el.textContent=card.term;el.classList.add('sel');el.setAttribute('aria-label',card.term);
  if(!first){first={el:el,card:card,rec:rec};return;}
  moves++;if(movesEl)movesEl.textContent=moves;lock=true;
  if(first.card.i===card.i){
    rec.done=true;first.rec.done=true;el.classList.add('ok');first.el.classList.add('ok');
    matched++;if(matchedEl)matchedEl.textContent=matched;if(hint)hint.textContent=CONCEPTS[card.i][0]+': '+CONCEPTS[card.i][1];
    first=null;lock=false;
    if(matched===CONCEPTS.length){win();}
  }else{
    var a=first;setTimeout(function(){el.textContent='?';el.classList.remove('sel');el.setAttribute('aria-label','Hidden card');a.el.textContent='?';a.el.classList.remove('sel');a.el.setAttribute('aria-label','Hidden card');first=null;lock=false;},900);
  }
}
function win(){if(hint)hint.textContent='Solved in '+moves+' moves! '+(best===null||moves<best?'New best!':'Best: '+best);if(best===null||moves<best){best=moves;if(A.set)A.set('best',String(best));if(bestEl)bestEl.textContent=best;}}
var newBtn=document.getElementById('newBtn');if(newBtn)newBtn.addEventListener('click',build);
build();

var ta=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),t2=null;
function flash2(m){if(!refStatus)return;refStatus.textContent=m;if(t2)clearTimeout(t2);t2=setTimeout(function(){refStatus.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash2('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ta?ta.value:'',copyRef);});
}catch(e){console.error('project 065 script error',e);}
});
