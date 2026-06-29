document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var CAP={
 joy:{warm:'Building a life that feels like mine — full days, deep friendships, and room to breathe. Childfree and content. 💛',bold:'Childfree and thriving. My life, my design, no apologies.',reflective:'Some lives are measured in milestones; mine, in mornings I actually wanted. Childfree, and at peace with it.'},
 autonomy:{warm:'Everyone deserves to decide their own path — to parent, or not. That freedom is for all of us.',bold:'My body, my timeline, my choice. Reproductive autonomy isn\'t negotiable.',reflective:'The quietest radical idea: the question of children belongs to each of us.'},
 boundary:{warm:'I love the people who ask — and this is still my decision to make. Thank you for trusting me with it.',bold:'Asked and answered. My choice stands, and that\'s okay.',reflective:'A boundary said kindly is still a boundary. I\'m at peace with mine.'},
 myth:{warm:'Gentle reminder: not wanting children isn\'t the same as not loving them. Both can be true.',bold:'"You\'ll regret it" is not a fact. Contentment on this path is common — and real.',reflective:'A family is made of love, not headcount. That\'s always been enough.'},
 reflect:{warm:'Choosing your own life, slowly and on purpose, is its own quiet kind of brave.',bold:'I stopped asking permission for my own life. Best decision yet.',reflective:'What would I want if no one were watching? I keep building from that answer.'}
};
var TAGS={joy:'#childfree #childfreebychoice #mylifemyrules',autonomy:'#reproductiveautonomy #mybodymychoice #bodilyautonomy',boundary:'#boundaries #childfree #selfrespect',myth:'#childfreecommunity #mythbusting #respectallchoices',reflect:'#childfreelife #intentionalliving #reflection'};
var topic=document.getElementById('topic'),tone=document.getElementById('tone'),out=document.getElementById('out'),tags=document.getElementById('tags'),lenOut=document.getElementById('lenOut'),lenBar=document.getElementById('lenBar');
function tagFor(){return TAGS[topic.value]||'';}
function build(){out.value=(CAP[topic.value]||CAP.joy)[tone.value]||'';tags.textContent='Suggested tags: '+tagFor();if(A.set)A.set('cap',out.value);len();}
function len(){var n=(out.value||'').length;if(lenOut)lenOut.textContent=n+' chars';if(A.meter)A.meter(lenBar,Math.min(100,n/220*100));}
var genBtn=document.getElementById('genBtn'),againBtn=document.getElementById('againBtn');
if(genBtn)genBtn.addEventListener('click',build);
if(againBtn)againBtn.addEventListener('click',function(){var tones=['warm','bold','reflective'];tone.value=tones[(tones.indexOf(tone.value)+1)%3];build();});
if(topic)topic.addEventListener('change',build);
if(out){if(A.get){out.value=A.get('cap','');}out.addEventListener('input',function(){if(A.set)A.set('cap',out.value);len();});if(!out.value)build();else{tags.textContent='Suggested tags: '+tagFor();len();}}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){A.copy&&A.copy((out.value||'')+'\n\n'+tagFor(),copyBtn);});

var QZ=[{a:1,e:'A respectful caption states your view without putting others down.'},{a:1,e:'Edit the draft so it sounds like you — that\'s when it lands.'}];
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
}catch(e){console.error('project 032 script error',e);}
});
