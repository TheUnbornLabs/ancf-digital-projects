document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var Q=[
 {t:'Childfree people dislike children.',myth:true,e:'Myth — many adore others\' kids; not wanting your own is different.'},
 {t:'Antinatalism is only about future births, not existing people.',myth:false,e:'Reality — it concerns creating new lives, never anyone already here.'},
 {t:'You\'ll definitely regret not having children.',myth:true,e:'Myth — regret is possible on any path; most childfree-by-choice adults report contentment.'},
 {t:'Reproductive autonomy protects the choice to have children too.',myth:false,e:'Reality — it defends freedom in both directions.'},
 {t:'Not wanting kids means you\'re selfish.',myth:true,e:'Myth — a personal choice harms no one; "selfish" is usually a pressure tactic.'},
 {t:'A family can be a couple with no children.',myth:false,e:'Reality — love and commitment make a family, not headcount.'},
 {t:'Children are a reliable retirement plan.',myth:true,e:'Myth — planning, savings, and community are far more dependable.'},
 {t:'Antinatalism requires hating people.',myth:true,e:'Myth — it\'s an ethical argument, often rooted in concern for wellbeing.'},
 {t:'"Childfree" and "childless" mean exactly the same thing.',myth:true,e:'Myth — childfree is a choice; childless usually describes circumstance.'},
 {t:'Disagreeing with someone\'s choice is the same as disrespecting them.',myth:true,e:'Myth — disagreement and respect can absolutely coexist.'}
];
var order=[],idx=0,score=0,best=0,playing=false;
try{best=parseInt(A.get?A.get('best','0'):'0',10)||0;}catch(e){}
var roundEl=document.getElementById('round'),scoreEl=document.getElementById('score'),bestEl=document.getElementById('best'),stEl=document.getElementById('statement'),fb=document.getElementById('fb');
if(bestEl)bestEl.textContent=best;
function start(){order=Q.map(function(_,i){return i;});for(var i=order.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=order[i];order[i]=order[j];order[j]=t;}idx=0;score=0;playing=true;if(scoreEl)scoreEl.textContent=0;next();}
function next(){if(idx>=order.length){finish();return;}if(roundEl)roundEl.textContent=idx+1;stEl.textContent='“'+Q[order[idx]].t+'”';fb.textContent='';}
function answer(saysMyth){
  if(!playing)return;var q=Q[order[idx]];var ok=(saysMyth===q.myth);if(ok)score++;if(scoreEl)scoreEl.textContent=score;
  fb.innerHTML=(ok?'<span class="tag-good" style="font-weight:800">Correct.</span> ':'<span class="tag-bad" style="font-weight:800">Not quite.</span> ')+q.e;
  idx++;setTimeout(next,1400);
}
function finish(){playing=false;stEl.textContent='Done! You scored '+score+' / '+Q.length+'.';if(score>best){best=score;if(A.set)A.set('best',String(best));if(bestEl)bestEl.textContent=best;}fb.textContent='Press Start to play again.';if(roundEl)roundEl.textContent=10;}
var startBtn=document.getElementById('startBtn'),mythBtn=document.getElementById('mythBtn'),realBtn=document.getElementById('realBtn');
if(startBtn)startBtn.addEventListener('click',start);
if(mythBtn)mythBtn.addEventListener('click',function(){answer(true);});
if(realBtn)realBtn.addEventListener('click',function(){answer(false);});

var ta=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),t2=null;
function flash2(m){if(!refStatus)return;refStatus.textContent=m;if(t2)clearTimeout(t2);t2=setTimeout(function(){refStatus.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash2('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ta?ta.value:'',copyRef);});
}catch(e){console.error('project 064 script error',e);}
});
