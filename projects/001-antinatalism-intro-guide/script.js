document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};

/* ---------- Asymmetry matrix (tap to reveal) ---------- */
var matrix=document.getElementById('matrix');
if(matrix){
  matrix.querySelectorAll('.cell').forEach(function(c){
    c.setAttribute('role','button');c.setAttribute('tabindex','0');c.setAttribute('aria-expanded','false');
    function toggle(){var open=c.classList.toggle('open');c.setAttribute('aria-expanded',open?'true':'false');}
    c.addEventListener('click',toggle);
    c.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
  });
}

/* ---------- Suffering-risk slider ---------- */
var risk=document.getElementById('risk'),riskOut=document.getElementById('riskOut'),
    riskBar=document.getElementById('riskBar'),riskNote=document.getElementById('riskNote');
function riskText(v){
  if(v===0)return 'You accept no real risk at all — a strongly precautionary stance. Is a zero-risk life even possible to offer?';
  if(v<=15)return 'A low tolerance: the possibility of severe suffering weighs heavily for you.';
  if(v<=40)return 'A cautious middle: you accept some risk, but serious harm clearly gives you pause.';
  if(v<=70)return 'Leaning to the expected-value view: a good life is likely enough to justify a real chance of a hard one.';
  if(v<100)return 'A high tolerance: you trust meaning and agency can outweigh substantial risk.';
  return 'You accept even a near-certain hard life — worth asking what, for you, would ever be too much to impose on another.';
}
function riskUpdate(){
  var v=+risk.value;riskOut.textContent=v+'%';
  if(A.meter)A.meter(riskBar,v);else riskBar.style.width=v+'%';
  riskNote.textContent=riskText(v);
  if(A.set)A.set('risk',String(v));
}
if(risk){var sv=A.get?A.get('risk',''):'';if(sv!=='')risk.value=sv;riskUpdate();risk.addEventListener('input',riskUpdate);}

/* ---------- Concept-understanding radar ---------- */
var radar=document.getElementById('radar');
var cInputs=[].slice.call(document.querySelectorAll('#concept input[type=range]'));
var outMap={'c-consent':'o-consent','c-harm':'o-harm','c-asym':'o-asym','c-auto':'o-auto'};
function drawRadar(){
  var items=cInputs.map(function(inp){return {label:inp.getAttribute('data-axis'),value:+inp.value};});
  if(A.radar)A.radar(radar,items);
  var store={};cInputs.forEach(function(inp){store[inp.id]=inp.value;});
  if(A.setJSON)A.setJSON('concept',store);
}
if(cInputs.length){
  var saved=A.getJSON?A.getJSON('concept',null):null;
  cInputs.forEach(function(inp){
    if(saved&&saved[inp.id]!=null)inp.value=saved[inp.id];
    var out=document.getElementById(outMap[inp.id]);if(out)out.textContent=inp.value+'%';
    inp.addEventListener('input',function(){if(out)out.textContent=inp.value+'%';drawRadar();});
  });
  drawRadar();
}

/* ---------- Mini quiz ---------- */
var Q=[
  {a:1,e:'It questions whether creating a new person is automatically good — never whether existing people may live.'},
  {a:1,e:'Consent needs someone who exists to give it; before birth there is no such person.'},
  {a:1,e:'That is the asymmetry: a prevented harm counts as good even with no one to enjoy it.'},
  {a:0,e:'Many philosophers grant the other cells but doubt that a good "for no one" makes sense.'},
  {a:1,e:'It is an argument about the ethics of creating life — not hatred, and not about anyone already here.'}
];
var picks={},totalQ=document.querySelectorAll('#quiz .quiz-q').length,quizScore=null;
if(A.initOptions)A.initOptions(document.getElementById('quiz'),function(q,i){picks[q]=+i;});
var sBtn=document.getElementById('quizScore'),rBtn=document.getElementById('quizReset'),res=document.getElementById('quizResult');
if(sBtn)sBtn.addEventListener('click',function(){
  if(Object.keys(picks).length<totalQ){res.style.display='block';res.textContent='Pick an answer for all '+totalQ+' questions first.';return;}
  var s=0;
  Q.forEach(function(it,i){
    document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){var j=+x.getAttribute('data-i');x.classList.remove('ok','no');if(j===it.a)x.classList.add('ok');else if(j===picks[i])x.classList.add('no');});
    var ex=document.querySelector('.explain[data-q="'+i+'"]');if(ex){ex.style.display='block';ex.textContent=it.e;}
    if(picks[i]===it.a)s++;
  });
  quizScore=s;res.style.display='block';res.textContent='You answered '+s+' of '+Q.length+' in line with the explained view. Re-read any explanation that surprised you.';
  if(rBtn)rBtn.style.display='inline-block';
});
if(rBtn)rBtn.addEventListener('click',function(){
  picks={};quizScore=null;
  document.querySelectorAll('#quiz .opt').forEach(function(x){x.classList.remove('sel','ok','no');x.setAttribute('aria-pressed','false');});
  document.querySelectorAll('#quiz .explain').forEach(function(ex){ex.style.display='none';ex.textContent='';});
  res.style.display='none';res.textContent='';rBtn.style.display='none';
});

/* ---------- Reflection + export summary ---------- */
var ta=document.getElementById('reflect'),status=document.getElementById('saveStatus'),timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
if(ta){ta.value=A.get?A.get('reflect',''):'';ta.addEventListener('input',function(){if(A.set)A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyBtn=document.getElementById('copyBtn'),clearBtn=document.getElementById('clearBtn');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash('Saved ✓');});
if(clearBtn)clearBtn.addEventListener('click',function(){if(ta.value.trim()&&!window.confirm('Clear your reflection on this device?'))return;ta.value='';if(A.remove)A.remove('reflect');flash('Cleared.');ta.focus();});
if(copyBtn)copyBtn.addEventListener('click',function(){
  var lines=['Antinatalism Intro Guide — my summary',''];
  if(risk)lines.push('Suffering-risk tolerance: '+risk.value+'%');
  if(cInputs.length){lines.push('Self-rated understanding:');cInputs.forEach(function(inp){lines.push('  • '+inp.getAttribute('data-axis')+': '+inp.value+'%');});}
  lines.push('Quiz score: '+(quizScore==null?'not taken yet':(quizScore+' / '+Q.length)));
  lines.push('','My reflection:',(ta&&ta.value.trim())?ta.value.trim():'(left blank)');
  if(A.copy)A.copy(lines.join('\n'),copyBtn);
});
}catch(e){console.error('project 001 script error',e);}
});
