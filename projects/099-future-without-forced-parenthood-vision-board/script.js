document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var STARTERS={
 freedom:['Everyone decides whether and when to have children.','No one is pressured in any direction.'],
 support:['Strong safety nets for parents and non-parents alike.','Accessible, judgment-free information and care.'],
 respect:['Reproductive choices honoured, whatever they are.','No shaming, no assumptions.'],
 dignity:['Bodily autonomy protected for all.','Every life path treated as worthy.']
};
var data=A.getJSON?A.getJSON('vboard',{}):{};data=data||{};
var cols=[].slice.call(document.querySelectorAll('#board .vcol'));
var count=document.getElementById('count');
function save(){if(A.setJSON)A.setJSON('vboard',data);}
function total(){var n=0;cols.forEach(function(c){n+=(data[c.getAttribute('data-k')]||[]).length;});return n;}
function renderCol(c){
  var k=c.getAttribute('data-k');var list=c.querySelector('.vlist');list.innerHTML='';
  (data[k]||[]).forEach(function(txt,i){
    var row=document.createElement('div');row.className='vitem';
    var span=document.createElement('span');span.textContent=txt;
    var del=document.createElement('button');del.className='vx';del.type='button';del.setAttribute('aria-label','Remove');del.textContent='×';
    del.addEventListener('click',function(){data[k].splice(i,1);save();renderCol(c);updateCount();});
    row.appendChild(span);row.appendChild(del);list.appendChild(row);
  });
}
function updateCount(){if(count)count.textContent=total()+' hope'+(total()===1?'':'s');}
function add(c,txt){txt=(txt||'').trim();if(!txt)return;var k=c.getAttribute('data-k');if(!data[k])data[k]=[];data[k].push(txt);save();renderCol(c);updateCount();}
cols.forEach(function(c){
  renderCol(c);
  var inp=c.querySelector('.vadd input'),btn=c.querySelector('.vadd button');
  btn.addEventListener('click',function(){add(c,inp.value);inp.value='';inp.focus();});
  inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();add(c,inp.value);inp.value='';}});
});
updateCount();
var startersBtn=document.getElementById('startersBtn'),copyBtn=document.getElementById('copyBtn'),clearBtn=document.getElementById('clearBtn');
if(startersBtn)startersBtn.addEventListener('click',function(){cols.forEach(function(c){var k=c.getAttribute('data-k');(STARTERS[k]||[]).forEach(function(s){if(!data[k])data[k]=[];if(data[k].indexOf(s)<0)data[k].push(s);});renderCol(c);});save();updateCount();});
if(copyBtn)copyBtn.addEventListener('click',function(){var L=['A Future Without Forced Parenthood — my vision',''];cols.forEach(function(c){var k=c.getAttribute('data-k');L.push(c.querySelector('h4').textContent+':');(data[k]||[]).forEach(function(t){L.push('  • '+t);});if(!(data[k]||[]).length)L.push('  (empty)');L.push('');});A.copy&&A.copy(L.join('\n'),copyBtn);});
if(clearBtn)clearBtn.addEventListener('click',function(){if(!window.confirm('Clear the whole board?'))return;data={};save();cols.forEach(renderCol);updateCount();});

var QZ=[{a:1,e:'The vision is freedom for every choice — children or none.'},{a:1,e:'Force removes choice; the decision should be yours.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;QZ.forEach(function(it,i){document.querySelectorAll('#quiz .opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You got '+sc+' of '+QZ.length+'.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});
}catch(e){console.error('project 099 script error',e);}
});
