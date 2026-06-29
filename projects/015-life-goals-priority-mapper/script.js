document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var ORDER=['now','soon','someday'],NEXT={now:'soon',soon:'someday',someday:'now'};
var cols={now:document.getElementById('col-now'),soon:document.getElementById('col-soon'),someday:document.getElementById('col-someday')};
var chart=document.getElementById('goalChart'),input=document.getElementById('goalInput');
var goals=A.getJSON?(A.getJSON('goals',[])||[]):[];
function save(){if(A.setJSON)A.setJSON('goals',goals);}
function render(){
  ORDER.forEach(function(c){if(cols[c])cols[c].innerHTML='';});
  goals.forEach(function(g){
    var wrap=document.createElement('div');wrap.className='check';wrap.style.justifyContent='space-between';
    var span=document.createElement('span');span.textContent=g.text;span.style.flex='1';
    var move=document.createElement('button');move.className='btn';move.type='button';move.style.padding='4px 10px';move.style.fontSize='var(--fs-xs)';move.textContent='→ '+NEXT[g.cat];move.setAttribute('aria-label','Move "'+g.text+'" to '+NEXT[g.cat]);
    move.addEventListener('click',function(){g.cat=NEXT[g.cat];save();render();});
    var del=document.createElement('button');del.className='btn';del.type='button';del.style.padding='4px 10px';del.style.fontSize='var(--fs-xs)';del.textContent='×';del.setAttribute('aria-label','Remove "'+g.text+'"');
    del.addEventListener('click',function(){goals=goals.filter(function(x){return x!==g;});save();render();});
    var btns=document.createElement('span');btns.appendChild(move);btns.appendChild(document.createTextNode(' '));btns.appendChild(del);
    wrap.appendChild(span);wrap.appendChild(btns);
    if(cols[g.cat])cols[g.cat].appendChild(wrap);
  });
  ORDER.forEach(function(c){if(cols[c]&&!cols[c].children.length){var e=document.createElement('p');e.className='note';e.textContent='(empty)';cols[c].appendChild(e);}});
  var counts=ORDER.map(function(c){return {label:c.charAt(0).toUpperCase()+c.slice(1),value:goals.filter(function(g){return g.cat===c;}).length};});
  if(A.barChart)A.barChart(chart,counts,{max:Math.max(1,goals.length),title:'Goals per horizon',fmt:function(v){return v;}});
}
var addGoal=document.getElementById('addGoal');
function add(){var t=(input.value||'').trim();if(!t)return;goals.push({text:t,cat:'now'});input.value='';save();render();input.focus();}
if(addGoal)addGoal.addEventListener('click',add);
if(input)input.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();add();}});
render();

var status=document.getElementById('status'),timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){
  if(!goals.length){flash('Add a goal first.');return;}
  var lines=['My life-goals map',''];
  ORDER.forEach(function(c){lines.push(c.toUpperCase()+':');var g=goals.filter(function(x){return x.cat===c;});if(g.length)g.forEach(function(x){lines.push('  • '+x.text);});else lines.push('  (none)');lines.push('');});
  if(A.copy)A.copy(lines.join('\n'),copyBtn);
});
var clearBtn=document.getElementById('clearBtn');
if(clearBtn)clearBtn.addEventListener('click',function(){if(goals.length&&!window.confirm('Clear all goals on this device?'))return;goals=[];save();render();flash('Cleared.');});

/* ---------- Quiz ---------- */
var Q=[{a:1,e:'Sorting turns a vague pile into clear next steps — it does not guarantee outcomes, but it clarifies them.'},{a:1,e:'A "Someday" goal is a real goal that simply is not now — keeping it visible is healthy.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;Q.forEach(function(it,i){document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});

/* ---------- Reflection ---------- */
var ta=document.getElementById('reflect'),refStatus=document.getElementById('refStatus'),t2=null;
function flash2(m){if(!refStatus)return;refStatus.textContent=m;if(t2)clearTimeout(t2);t2=setTimeout(function(){refStatus.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyRef=document.getElementById('copyRef');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash2('Saved ✓');});
if(copyRef)copyRef.addEventListener('click',function(){A.copy&&A.copy(ta?ta.value:'',copyRef);});
}catch(e){console.error('project 015 script error',e);}
});
