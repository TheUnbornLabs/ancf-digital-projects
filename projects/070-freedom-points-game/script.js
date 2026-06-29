document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var D=[
 {t:'At dinner, a relative asks: "When are the kids coming?"',o:[['Calm one-liner, then change the subject',2],['Justify yourself at length',1],['Snap back',0]]},
 {t:'After a pushy phone call, you feel a wave of guilt.',o:[['Remind yourself this is your choice',2],['Spiral into self-blame',0]]},
 {t:'A friend tells you they\'re childfree too.',o:[['Warmly affirm them',2],['Compete over who\'s more certain',0]]},
 {t:'An elder gives firm, unwanted advice.',o:[['Thank them, and keep your boundary',2],['Give in just to avoid conflict',0]]},
 {t:'Someone compares you to a sibling with kids.',o:[['Kindly decline the comparison',2],['Get competitive about it',0]]}
];
var idx=0,score=0,best=0,playing=false;
try{best=parseInt(A.get?A.get('best','0'):'0',10)||0;}catch(e){}
var roundEl=document.getElementById('round'),ptsEl=document.getElementById('pts'),bestEl=document.getElementById('best'),scene=document.getElementById('scene'),choices=document.getElementById('choices'),fb=document.getElementById('fb');
if(bestEl)bestEl.textContent=best;
function start(){idx=0;score=0;playing=true;if(ptsEl)ptsEl.textContent=0;next();}
function next(){if(idx>=D.length){finish();return;}if(roundEl)roundEl.textContent=idx+1;scene.textContent=D[idx].t;fb.textContent='';choices.innerHTML='';
  D[idx].o.forEach(function(opt){var b=document.createElement('button');b.className='btn';b.type='button';b.textContent=opt[0];b.addEventListener('click',function(){pick(opt[1]);});choices.appendChild(b);});}
function pick(p){if(!playing)return;score+=p;if(ptsEl)ptsEl.textContent=score;fb.textContent=(p>=2?'+2 — calm and self-respecting.':(p===1?'+1 — fine, though you owe no one a lecture.':'+0 — understandable, but try the kinder, steadier move.'));idx++;choices.innerHTML='';setTimeout(next,1100);}
function finish(){playing=false;scene.textContent='Done! '+score+' / 10 freedom points. '+(score>=8?'Beautifully self-respecting.':(score>=5?'Solid practice.':'Worth another round.'));if(score>best){best=score;if(A.set)A.set('best',String(best));if(bestEl)bestEl.textContent=best;}fb.textContent='Press Start to play again.';if(roundEl)roundEl.textContent=5;choices.innerHTML='';}
var startBtn=document.getElementById('startBtn');if(startBtn)startBtn.addEventListener('click',start);

var ta=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),t2=null;
function flash2(m){if(!refStatus)return;refStatus.textContent=m;if(t2)clearTimeout(t2);t2=setTimeout(function(){refStatus.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash2('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ta?ta.value:'',copyRef);});
}catch(e){console.error('project 070 script error',e);}
});
