document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var Q=[
 {t:'Freedom',q:'A life shaped by your own hands is not an empty one.'},
 {t:'Freedom',q:'The road not taken is still a road, and it can lead somewhere good.'},
 {t:'Meaning',q:'Meaning is grown, not inherited — and it grows in many soils.'},
 {t:'Meaning',q:'Care can flow to students, friends, communities, and the world — parenthood holds no monopoly on love.'},
 {t:'Identity',q:'“Childfree” names a freedom to, not only a freedom from.'},
 {t:'Identity',q:'You are allowed to be the author of your own ordinary, extraordinary life.'},
 {t:'Relationships',q:'A family can be two people, or a circle of friends; love makes it, not headcount.'},
 {t:'Relationships',q:'Being childfree is not the same as being childless — follow the word a person uses for themselves.'},
 {t:'Peace',q:'Choosing your own life is not a debt you owe anyone an explanation for.'},
 {t:'Peace',q:'Regret is possible on every path; so is contentment.'},
 {t:'Dignity',q:'Not wanting children is a complete sentence.'},
 {t:'Dignity',q:'A considered choice is not invalidated by anyone else’s surprise.'}
];
var themes=[];Q.forEach(function(x){if(themes.indexOf(x.t)<0)themes.push(x.t);});
var active='All',showFav=false;
var favs=A.getJSON?(A.getJSON('favs',{})||{}):{};
var filters=document.getElementById('qfilters'),list=document.getElementById('qlist'),chart=document.getElementById('themeChart');
function chip(label){var b=document.createElement('span');b.className='chip'+(label===active?' active':'');b.textContent=label;b.setAttribute('role','button');b.setAttribute('tabindex','0');
  function go(){active=label;showFav=false;paintChips();render();}
  b.addEventListener('click',go);b.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});return b;}
function paintChips(){filters.innerHTML='';filters.appendChild(chip('All'));themes.forEach(function(t){filters.appendChild(chip(t));});}
function render(){
  list.innerHTML='';
  Q.forEach(function(x,i){
    if(showFav&&!favs[i])return;
    if(!showFav&&active!=='All'&&x.t!==active)return;
    var card=document.createElement('div');card.className='panel';card.style.margin='10px 0';card.style.padding='14px 16px';
    var bq=document.createElement('p');bq.style.margin='0 0 8px';bq.style.fontSize='var(--fs-lg)';bq.textContent='“'+x.q+'”';
    var meta=document.createElement('div');meta.className='btn-row';meta.style.margin='0';
    var tag=document.createElement('span');tag.className='pill';tag.textContent=x.t;
    var sp=document.createElement('span');sp.className='spacer';
    var fav=document.createElement('button');fav.className='btn';fav.type='button';fav.style.padding='6px 12px';fav.textContent=favs[i]?'★ Favourited':'☆ Favourite';
    fav.addEventListener('click',function(){favs[i]=!favs[i];if(A.setJSON)A.setJSON('favs',favs);fav.textContent=favs[i]?'★ Favourited':'☆ Favourite';if(showFav)render();});
    var cp=document.createElement('button');cp.className='btn';cp.type='button';cp.style.padding='6px 12px';cp.textContent='Copy';
    cp.addEventListener('click',function(){A.copy&&A.copy('“'+x.q+'”',cp);});
    meta.appendChild(tag);meta.appendChild(sp);meta.appendChild(fav);meta.appendChild(cp);
    card.appendChild(bq);card.appendChild(meta);list.appendChild(card);
  });
  if(!list.children.length){var e=document.createElement('p');e.className='note';e.textContent=showFav?'No favourites yet — tap ☆ on a line.':'No lines in this theme.';list.appendChild(e);}
}
paintChips();render();
var counts=themes.map(function(t){return {label:t,value:Q.filter(function(x){return x.t===t;}).length};});
if(A.barChart)A.barChart(chart,counts,{max:Math.max.apply(null,counts.map(function(c){return c.value;})),fmt:function(v){return v;},title:'Affirmations per theme'});

var randomBtn=document.getElementById('randomBtn'),randomOut=document.getElementById('randomOut');
if(randomBtn)randomBtn.addEventListener('click',function(){var x=Q[Math.floor(Math.random()*Q.length)];randomOut.style.display='block';randomOut.textContent='“'+x.q+'”  — ['+x.t+']';});
var favBtn=document.getElementById('favBtn');
if(favBtn)favBtn.addEventListener('click',function(){showFav=!showFav;favBtn.textContent=showFav?'Show all':'Show favourites';if(showFav){active='All';paintChips();}render();});

/* ---------- Quiz ---------- */
var QZ=[{a:1,e:'It means your choice needs no further justification — it stands on its own.'},{a:1,e:'They are for quiet encouragement and reflection, not for winning arguments or ruling others.'}];
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
}catch(e){console.error('project 022 script error',e);}
});
