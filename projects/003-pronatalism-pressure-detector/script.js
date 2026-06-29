document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};
var WORDS=['none','mild','moderate','strong','severe'];

/* ---------- Source ratings → meter + chart + response ---------- */
var inputs=[].slice.call(document.querySelectorAll('#sources input[type=range]'));
var sevBar=document.getElementById('sevBar'),sevPct=document.getElementById('sevPct'),sevNote=document.getElementById('sevNote');
var srcChart=document.getElementById('srcChart'),responseBox=document.getElementById('responseBox');
function update(){
  var total=0,maxItem=null,maxVal=-1,items=[];
  inputs.forEach(function(inp){
    var v=+inp.value;total+=v;items.push({label:inp.getAttribute('data-axis'),value:v});
    var out=document.getElementById(inp.id.replace('s-','o-'));if(out)out.textContent=WORDS[v];
    if(v>maxVal){maxVal=v;maxItem=inp.getAttribute('data-axis');}
  });
  var maxTotal=inputs.length*4,pct=Math.round(total/maxTotal*100);
  if(A.meter)A.meter(sevBar,pct);if(sevPct)sevPct.textContent=pct+'%';
  if(A.barChart)A.barChart(srcChart,items,{max:4,fmt:function(v){return WORDS[v];},title:'Pressure rating by source'});
  if(sevNote){
    if(total===0)sevNote.textContent='No notable pressure recorded right now — a calm place to be.';
    else if(pct<30)sevNote.textContent='Low overall pressure. Strongest source: '+maxItem+'.';
    else if(pct<60)sevNote.textContent='Moderate overall pressure, weighing most from: '+maxItem+'.';
    else sevNote.textContent='High overall pressure, heaviest from: '+maxItem+'. Be gentle with yourself.';
  }
  if(responseBox){
    if(total===0)responseBox.textContent='Rate a few sources above to see a suggestion.';
    else if(pct<30)responseBox.textContent='A light touch is probably enough: a calm one-liner and a change of subject. Strongest source — '+maxItem+'.';
    else if(pct<60)responseBox.textContent='Consider a clear, repeatable boundary for '+maxItem+' pressure. You do not owe anyone a justification. Use the generator below.';
    else responseBox.textContent='With pressure this strong (mainly '+maxItem+'), a firm, repeated boundary helps — and if it ever includes threats or control over your choices, that is coercion, and stepping back is valid. You deserve support.';
  }
  var store={};inputs.forEach(function(inp){store[inp.id]=inp.value;});if(A.setJSON)A.setJSON('sources',store);
}
if(inputs.length){
  var s=A.getJSON?A.getJSON('sources',null):null;
  inputs.forEach(function(inp){if(s&&s[inp.id]!=null)inp.value=s[inp.id];inp.addEventListener('input',update);});
  update();
}

/* ---------- Boundary-line generator ---------- */
var ack={Family:"I know this comes from a place of love,",Cultural:"I know this is what tends to be expected,",Religious:"I respect that this matters deeply to you,",Economic:"I hear the practical worries behind this,","Gender-role":"I know there are expectations about what I 'should' do,","Fear-based":"I know you worry about my future,"};
var toneLine={gentle:"and I've made a decision that's right for me. I'd be grateful if we could let it rest. I'm always happy to talk about other things.",firm:"and my decision is made. I'm not going to keep discussing it.",final:"and this is settled. Please don't raise it again."};
var bGen=document.getElementById('bGen'),bOut=document.getElementById('bOut'),bCopy=document.getElementById('bCopy'),bSource=document.getElementById('bSource'),bTone=document.getElementById('bTone');
function buildBoundary(){return (ack[bSource.value]||'I appreciate your concern,')+' '+(toneLine[bTone.value]||toneLine.firm);}
if(bGen)bGen.addEventListener('click',function(){bOut.textContent=buildBoundary();});
if(bCopy)bCopy.addEventListener('click',function(){A.copy&&A.copy(bOut.textContent&&bOut.textContent.indexOf('appear')===-1?bOut.textContent:buildBoundary(),bCopy);});

/* ---------- Quiz ---------- */
var Q=[{a:1,e:'An open question that accepts your answer is curiosity, not pressure.'},{a:1,e:'Threats, ultimatums, or ignoring a clear no are coercion — no longer a conversation.'},{a:1,e:'Naming a pattern is for your own clarity, not to blame or to win.'}];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sB=document.getElementById('quizScore'),rB=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sB)sB.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var sc=0;Q.forEach(function(it,i){document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}if(picks[i]===it.a)sc++;});
  res.style.display='block';res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.';if(rB)rB.style.display='inline-block';
});
if(rB)rB.addEventListener('click',function(){picks={};document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});res.style.display='none';rB.style.display='none';});

/* ---------- Reflection + summary ---------- */
var ta=document.getElementById('reflect'),status=document.getElementById('saveStatus'),timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyBtn=document.getElementById('copyBtn'),clearBtn=document.getElementById('clearBtn');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash('Saved ✓');});
if(clearBtn)clearBtn.addEventListener('click',function(){if(ta.value.trim()&&!window.confirm('Clear your reflection on this device?'))return;ta.value='';if(A.remove)A.remove('reflect');flash('Cleared.');ta.focus();});
if(copyBtn)copyBtn.addEventListener('click',function(){
  var lines=['Pronatalism pressure — my summary',''];
  inputs.forEach(function(inp){lines.push('  • '+inp.getAttribute('data-axis')+': '+WORDS[+inp.value]);});
  if(bOut&&bOut.textContent&&bOut.textContent.indexOf('appear')===-1)lines.push('','My boundary line:',bOut.textContent);
  lines.push('','My reflection:',(ta&&ta.value.trim())?ta.value.trim():'(left blank)');
  if(A.copy)A.copy(lines.join('\n'),copyBtn);
});
}catch(e){console.error('project 003 script error',e);}
});
