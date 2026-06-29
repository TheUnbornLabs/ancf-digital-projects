document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var TOPICS=[
 ['t1','We want children at all'],
 ['t2','We would want them relatively soon'],
 ['t3','We would want more than one'],
 ['t4','We would share care equally'],
 ['t5','We are comfortable with the finances'],
 ['t6','We are okay with the impact on careers'],
 ['t7','We know what we would do if we disagree']
];
var wrap=document.getElementById('topics');
var state=A.getJSON?(A.getJSON('align',{})||{}):{};
function sel(id,who,val){
  var s='<select data-t="'+id+'" data-who="'+who+'" aria-label="'+who+' view on '+id+'">';
  [['','—'],['yes','Yes'],['unsure','Unsure'],['no','No']].forEach(function(o){s+='<option value="'+o[0]+'"'+(val===o[0]?' selected':'')+'>'+o[1]+'</option>';});
  return s+'</select>';
}
if(wrap){
  var html='';
  TOPICS.forEach(function(t){
    var st=state[t[0]]||{};
    html+='<div style="margin:12px 0"><div style="font-weight:600;font-size:var(--fs-sm);margin-bottom:6px">'+t[1]+'</div><div class="row"><div><label class="field" style="margin-top:0">You</label>'+sel(t[0],'you',st.you||'')+'</div><div><label class="field" style="margin-top:0">Partner</label>'+sel(t[0],'partner',st.partner||'')+'</div></div></div>';
  });
  wrap.innerHTML=html;
}
var readyBar=document.getElementById('readyBar'),readyPct=document.getElementById('readyPct'),chart=document.getElementById('alignChart');
function compute(){
  var both=0,aligned=0,unsure=0,differ=0;
  TOPICS.forEach(function(t){
    var st=state[t[0]]||{};
    if(st.you&&st.partner){both++;
      if(st.you===st.partner&&st.you!=='unsure')aligned++;
      else if(st.you==='unsure'||st.partner==='unsure')unsure++;
      else differ++;
    }
  });
  if(A.meter)A.meter(readyBar,both/TOPICS.length*100);if(readyPct)readyPct.textContent=Math.round(both/TOPICS.length*100)+'%';
  if(A.barChart)A.barChart(chart,[{label:'Aligned',value:aligned},{label:'Unsure',value:unsure},{label:'Differ',value:differ}],{max:Math.max(1,TOPICS.length),fmt:function(v){return v;},title:'Alignment'});
}
if(wrap)wrap.addEventListener('change',function(e){
  var s=e.target;if(s.tagName!=='SELECT')return;var id=s.getAttribute('data-t'),who=s.getAttribute('data-who');
  state[id]=state[id]||{};state[id][who]=s.value;if(A.setJSON)A.setJSON('align',state);compute();
});
compute();

var notes=document.getElementById('notes'),status=document.getElementById('status'),timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
if(notes&&A.get){notes.value=A.get('notes','');notes.addEventListener('input',function(){A.set('notes',notes.value);});}
var saveBtn=document.getElementById('saveBtn'),copyBtn=document.getElementById('copyBtn'),clearBtn=document.getElementById('clearBtn');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('notes',notes.value);flash('Saved ✓');});
if(copyBtn)copyBtn.addEventListener('click',function(){
  var lines=['Children conversation — my talking points',''];
  TOPICS.forEach(function(t){var st=state[t[0]]||{};lines.push(t[1]+': you '+(st.you||'—')+', partner '+(st.partner||'—'));});
  if(notes&&notes.value.trim())lines.push('','Notes:',notes.value.trim());
  if(A.copy)A.copy(lines.join('\n'),copyBtn);
});
if(clearBtn)clearBtn.addEventListener('click',function(){
  if(!window.confirm('Clear all entries on this device?'))return;
  state={};if(A.remove){A.remove('align');A.remove('notes');}if(notes)notes.value='';
  if(wrap)wrap.querySelectorAll('select').forEach(function(s){s.value='';});compute();flash('Cleared.');
});

/* ---------- Quiz ---------- */
var Q=[{a:1,e:'The aim is honest mutual understanding, not winning or avoidance.'},{a:1,e:'A real difference on children is serious and deserves honesty, faced together — not papered over.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;Q.forEach(function(it,i){document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 018 script error',e);}
});
