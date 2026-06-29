document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};

/* ---------- Risk simulator ---------- */
var inputs=[].slice.call(document.querySelectorAll('#sim input[type=range]'));
function val(id){var e=document.getElementById(id);return e?+e.value:0;}
var outChart=document.getElementById('outChart'),rbChart=document.getElementById('rbChart'),
    tenBar=document.getElementById('tenBar'),tenPct=document.getElementById('tenPct'),tenNote=document.getElementById('tenNote');
function update(){
  inputs.forEach(function(inp){var out=document.getElementById(inp.id.replace('r-','o-'));if(out)out.textContent=inp.value+'%';});
  var suffer=val('r-suffer'),hard=val('r-hardship'),happy=val('r-happy'),unc=val('r-uncertain');
  if(A.barChart)A.barChart(outChart,[{label:'Serious suffering',value:suffer},{label:'Ordinary hardship',value:hard},{label:'Strong happiness',value:happy}],{max:100,fmt:function(v){return v+'%';},title:'Outcome chances'});
  var risk=suffer*1.0+hard*0.5,benefit=happy*1.0;
  if(A.barChart)A.barChart(rbChart,[{label:'Weighted risk',value:Math.round(risk)},{label:'Benefit',value:Math.round(benefit)}],{max:Math.max(150,risk,benefit),fmt:function(v){return v;},title:'Risk vs benefit'});
  var tension=(risk+benefit)>0?Math.round(risk/(risk+benefit)*100):0;
  if(A.meter)A.meter(tenBar,tension);if(tenPct)tenPct.textContent=tension+'%';
  if(tenNote){
    var base;
    if(tension>=60)base='On this weighting, risk dominates the picture.';
    else if(tension>=45)base='Risk and benefit sit in close tension here.';
    else base='On this weighting, the benefit side dominates.';
    var u=unc>=70?' With uncertainty this high, remember the numbers themselves are shaky — humility is warranted.':(unc<=30?' With low uncertainty, you are treating these estimates as fairly firm — worth asking if that confidence is earned.':'');
    tenNote.textContent=base+u;
  }
  var store={};inputs.forEach(function(inp){store[inp.id]=inp.value;});if(A.setJSON)A.setJSON('sim',store);
}
if(inputs.length){var s=A.getJSON?A.getJSON('sim',null):null;inputs.forEach(function(inp){if(s&&s[inp.id]!=null)inp.value=s[inp.id];inp.addEventListener('input',update);});update();}

/* ---------- Quiz ---------- */
var Q=[{a:1,e:'Risk = estimable odds; uncertainty = you genuinely cannot estimate them. They may carry different moral weight.'},{a:1,e:'Precaution avoids imposing any real risk of severe harm, even when the expected value looks favourable.'},{a:1,e:'It is a reflection tool for thinking — not a forecast, and not medical advice.'}];
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
  var lines=['Suffering-risk thought experiment — my summary',''];
  inputs.forEach(function(inp){lines.push('  • '+inp.getAttribute('data-axis')+': '+inp.value+'%');});
  lines.push('','My reflection:',(ta&&ta.value.trim())?ta.value.trim():'(left blank)');
  lines.push('','(Reflection only — not a prediction.)');
  if(A.copy)A.copy(lines.join('\n'),copyBtn);
});
}catch(e){console.error('project 008 script error',e);}
});
