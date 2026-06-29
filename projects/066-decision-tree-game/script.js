document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var N={
 start:{t:'Dinner with the family. Your aunt smiles: "So — when are the little ones coming?"',c:[
   {t:'Pause, smile, deflect',p:2,n:'b1'},{t:'Snap back',p:0,n:'b2'},{t:'Start over-explaining',p:0,n:'b3'}]},
 b1:{t:'She presses gently: "Don\'t leave it too late, dear."',c:[
   {t:'Acknowledge her care, then set a boundary',p:2,n:'good'},{t:'Go quiet and change the subject',p:1,n:'ok'}]},
 b2:{t:'Voices rise a little; the table goes quiet.',c:[
   {t:'Take a breath and reset kindly',p:2,n:'ok'},{t:'Escalate the point',p:0,n:'low'}]},
 b3:{t:'She debates each reason you give.',c:[
   {t:'Stop, and name a boundary calmly',p:2,n:'good'},{t:'Keep justifying yourself',p:0,n:'low'}]},
 good:{t:'You stayed warm and held your line. Everyone moved on — and so did you.',c:[]},
 ok:{t:'A little tense, but you handled it and kept the peace. Perfectly fine.',c:[]},
 low:{t:'It got heated this time. That happens — and you can always try a different path.',c:[]}
};
var score=0;
var scene=document.getElementById('scene'),choices=document.getElementById('choices'),ending=document.getElementById('ending'),restart=document.getElementById('restart'),pts=document.getElementById('pts');
function render(key){
  var n=N[key];scene.textContent=n.t;choices.innerHTML='';ending.style.display='none';
  if(!n.c.length){ending.style.display='block';ending.textContent='Ending reached — '+score+' freedom points. '+(score>=4?'Beautifully handled!':(score>=2?'Solid work.':'Worth another go.'));restart.style.display='inline-block';return;}
  n.c.forEach(function(ch){var b=document.createElement('button');b.className='btn';b.type='button';b.textContent=ch.t;b.addEventListener('click',function(){score+=ch.p;if(pts)pts.textContent=score;render(ch.n);});choices.appendChild(b);});
  restart.style.display='inline-block';
}
if(restart)restart.addEventListener('click',function(){score=0;if(pts)pts.textContent=0;render('start');});
render('start');

var ta=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),t2=null;
function flash2(m){if(!refStatus)return;refStatus.textContent=m;if(t2)clearTimeout(t2);t2=setTimeout(function(){refStatus.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash2('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ta?ta.value:'',copyRef);});
}catch(e){console.error('project 066 script error',e);}
});
