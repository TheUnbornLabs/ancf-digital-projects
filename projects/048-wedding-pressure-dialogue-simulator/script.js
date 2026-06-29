document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var NODES={
 start:{line:'A relative grins across the table: "You two are next! When are the kids coming?"',opts:[
   {t:'"Ha! Let us get through the cake first."',fb:'Light and deflecting — buys you space without conflict.',next:'r2'},
   {t:'"No plans on that front, but thanks for thinking of us."',fb:'Warm and clear — names your position kindly.',next:'r2'},
   {t:'"Why does everyone keep asking me that?"',fb:'Understandable, but a question-for-a-question can raise heat. A redirect often lands softer.',next:'r2'}
 ]},
 r2:{line:'They lean in: "But you\'d be such wonderful parents — don\'t leave it too late!"',opts:[
   {t:'"That\'s kind of you. It\'s a decision we\'re happy with."',fb:'Acknowledge + decline — keeps warmth and the boundary.',next:'r3'},
   {t:'"Our timeline is ours to manage, but I appreciate you care."',fb:'Firm and gracious — names the boundary without a fight.',next:'r3'},
   {t:'(Say nothing and look away.)',fb:'Silence is allowed — though a short line plus a redirect usually feels better for you.',next:'r3'}
 ]},
 r3:{line:'You want to move on. What\'s your exit?',opts:[
   {t:'"Anyway — how\'s your garden coming along?"',fb:'A clean redirect to their world. Most people happily follow.',next:'end'},
   {t:'"I\'m going to grab a dance — back soon!"',fb:'A graceful physical exit. Perfectly fine.',next:'end'},
   {t:'"Let\'s catch up properly later, just us."',fb:'Warm and forward-looking — closes the topic kindly.',next:'end'}
 ]},
 end:{line:'Nicely handled — you stayed warm and kept your boundary. That\'s the whole skill: acknowledge, decline, redirect.',opts:[]}
};
var lineEl=document.getElementById('line'),choices=document.getElementById('choices'),feedback=document.getElementById('feedback'),restart=document.getElementById('restart');
function render(key){
  var n=NODES[key]||NODES.start;lineEl.textContent=n.line;choices.innerHTML='';feedback.style.display='none';
  if(!n.opts.length){restart.style.display='inline-block';return;}
  n.opts.forEach(function(o){var b=document.createElement('button');b.className='btn';b.type='button';b.textContent=o.t;
    b.addEventListener('click',function(){feedback.style.display='block';feedback.textContent=o.fb;choices.innerHTML='';
      var nx=document.createElement('button');nx.className='btn btn-primary';nx.type='button';nx.textContent='Continue →';nx.addEventListener('click',function(){render(o.next);});choices.appendChild(nx);});
    choices.appendChild(b);});
  restart.style.display='inline-block';
}
if(restart)restart.addEventListener('click',function(){render('start');});
render('start');

var QZ=[{a:1,e:'Acknowledge, decline, and redirect keeps you warm and your boundary intact.'},{a:1,e:'Rehearsing tends to make the real moment easier.'}];
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
}catch(e){console.error('project 048 script error',e);}
});
