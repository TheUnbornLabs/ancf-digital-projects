document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var DATA={
 autonomy:['Whose choice is it, really?','Reproductive autonomy = deciding whether, when, and if to have children.','It cuts both ways — it protects the choice to have kids and the choice not to.','No one owes anyone a justification for a decision about their own body and life.','However you choose, you deserve respect. 💛'],
 joy:['A childfree life is a full life.','Meaning grows from freedom, friendship, creativity, care, and rest.','Not wanting children isn\'t missing out — it\'s choosing differently.','You\'re allowed to build a life that simply fits you.','And to wish the same joy for those who choose kids.'],
 consent:['One question at the heart of birth ethics:','We seek consent before acting on anyone — except at the one moment they can\'t be asked.','That\'s the consent argument: imposing the risks of a life needs justifying.','Thoughtful people land on different sides — that\'s okay.','Understanding it well beats rushing to a verdict.'],
 myth:['Three myths, busted:','"Childfree people dislike kids." → Many adore them; not wanting your own is different.','"You\'ll definitely regret it." → Regret is possible on every path; most report contentment.','"It\'s selfish." → A personal choice harms no one.','Be kind to every choice, including the ones unlike yours.'],
 support:['A friend just told you they\'re childfree. Here\'s how to show up:','Lead with "thank you for telling me."','Resist advice; offer presence instead.','Affirm: "That\'s your call, and I respect it."','Friendship over opinions, every time. 💛']
};
var topic=document.getElementById('topic'),slides=document.getElementById('slides');
function render(){
  var arr=DATA[topic.value]||DATA.autonomy;slides.innerHTML='';
  arr.forEach(function(s,i){var c=document.createElement('div');c.className='meter-card';c.style.margin='8px 0';c.innerHTML='<div class="lab"><span>Slide '+(i+1)+(i===0?' · Hook':(i===arr.length-1?' · Close':' · Point'))+'</span></div>';var p=document.createElement('p');p.className='note';p.style.margin='6px 0 0';p.textContent=s;c.appendChild(p);slides.appendChild(c);});
}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',render);
if(topic)topic.addEventListener('change',render);
render();
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){var arr=DATA[topic.value]||DATA.autonomy;var L=[];arr.forEach(function(s,i){L.push('Slide '+(i+1)+': '+s);});A.copy&&A.copy(L.join('\n'),copyBtn);});

var QZ=[{a:1,e:'Slide 1 is a short, clear hook.'},{a:0,e:'Each middle slide works best with one clear idea.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+QZ.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 074 script error',e);}
});
