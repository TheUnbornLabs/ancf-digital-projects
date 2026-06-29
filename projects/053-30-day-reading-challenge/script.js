document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var PROMPTS=[
 'Define antinatalism in your own words.','Define "childfree" and how it differs from "childless".','Write down one assumption about parenthood you grew up with.','Read about consent and birth — note one question it raises.','Explain the asymmetry argument to an imaginary friend.','List three sources of pressure you personally feel.','Write a calm reply to "you\'ll change your mind".','Note one thing money has to do with this choice — and one thing it doesn\'t.','Map how you\'d spend a gained free hour each week.','Read a counter-argument and state it fairly.','Write what a meaningful life looks like for you.','Notice one myth and the reality behind it.','Reflect: whose voice do you hear when judged?','Consider the non-identity problem; jot your reaction.','Write one boundary line you could actually say.','List who supports your autonomy — and thank one of them.','Explore the environmental argument and its limits.','Reflect on identity and belonging in your choice.','Draft your own one-line affirmation.','Read about reproductive autonomy; note why it cuts both ways.','Write the strongest objection to your own current view.','Consider adoption, fostering, and support — note your leanings.','Reflect on later-life planning beyond children.','Notice a fallacy in a recent debate you saw.','Write a kind reply to an elder\'s advice.','Reflect: what would you want if no one were watching?','List three things that give your days meaning.','Plan how you\'ll handle the next family gathering.','Write what you\'d tell a younger you.','Summarise your considered view in three sentences.'
];
var wrap=document.getElementById('days'),bar=document.getElementById('bar'),pct=document.getElementById('pct'),count=document.getElementById('count');
var done=A.getJSON?(A.getJSON('days',{})||{}):{};
function render(){
  var n=0;for(var k in done){if(done[k])n++;}
  if(A.meter)A.meter(bar,n/PROMPTS.length*100);if(pct)pct.textContent=Math.round(n/PROMPTS.length*100)+'%';if(count)count.textContent=n+' of '+PROMPTS.length+' done.';
}
PROMPTS.forEach(function(p,i){
  var lab=document.createElement('label');lab.className='check';
  var cb=document.createElement('input');cb.type='checkbox';cb.checked=!!done['d'+i];
  cb.addEventListener('change',function(){done['d'+i]=cb.checked;if(A.setJSON)A.setJSON('days',done);render();});
  var sp=document.createElement('span');sp.innerHTML='<strong>Day '+(i+1)+':</strong> '+p;
  lab.appendChild(cb);lab.appendChild(sp);wrap.appendChild(lab);
});
render();
var status=document.getElementById('status'),timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
var resetBtn=document.getElementById('resetBtn');
if(resetBtn)resetBtn.addEventListener('click',function(){if(!window.confirm('Reset all 30 days?'))return;done={};if(A.remove)A.remove('days');wrap.querySelectorAll('input').forEach(function(c){c.checked=false;});render();flash('Reset.');});

var QZ=[{a:1,e:'A little each day is the point — consistency over cramming.'},{a:1,e:'Missing a day is fine; just pick up where you left off.'}];
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
}catch(e){console.error('project 053 script error',e);}
});
