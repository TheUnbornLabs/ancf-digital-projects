document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};

/* ---------- Scenario simulator ---------- */
var SC=[
 {v:'respected',p:'Informed choice + support',w:'You get full information and support for any decision — informed choice and respect for disagreement in action.'},
 {v:'violated',p:'Freedom from coercion',w:'Tying inheritance to having children is coercion — pressure dressed up as family duty.'},
 {v:'violated',p:'Bodily autonomy',w:'Overriding your settled decision about your own body ignores bodily autonomy and informed consent.'},
 {v:'respected',p:'Consent + respect',w:'Asking and listening without pushing honours consent and respect for disagreement.'},
 {v:'violated',p:'Freedom from coercion',w:'Framing a personal choice as a moral failure is coercion through shame.'},
 {v:'respected',p:'The conditions of a free choice',w:'Time, privacy, and no pressure are exactly the conditions a free choice needs.'}
];
var sc=document.getElementById('scenario'),scOut=document.getElementById('scenarioOut');
function scShow(){var it=SC[+sc.value]||SC[0];var tag=it.v==='respected'?'tag-good':'tag-bad';scOut.innerHTML='<span class="'+tag+'" style="font-weight:800">Autonomy '+it.v+'.</span> '+it.w+' <br><span class="note">Principle: '+it.p+'.</span>';}
if(sc){sc.addEventListener('change',scShow);scShow();}

/* ---------- Rights checklist ---------- */
var rWrap=document.getElementById('rights');
var boxes=rWrap?[].slice.call(rWrap.querySelectorAll('input[type=checkbox]')):[];
var rBar=document.getElementById('rightsBar'),rCount=document.getElementById('rightsCount');
function rRender(){var n=0;boxes.forEach(function(b){if(b.checked)n++;});if(A.meter)A.meter(rBar,n/boxes.length*100);if(rCount)rCount.textContent=n+' of '+boxes.length+' conditions present.';}
if(boxes.length){var rs=A.getJSON?A.getJSON('rights',{}):{};rs=rs||{};boxes.forEach(function(b){var k=b.getAttribute('data-key');b.checked=!!rs[k];b.addEventListener('change',function(){rs[k]=b.checked;if(A.setJSON)A.setJSON('rights',rs);rRender();});});rRender();}

/* ---------- Autonomy-safe response generator ---------- */
var R={nokids:"Thank you for telling me. That's your call to make, and I respect it completely.",
 kids:"That's wonderful that you know what you want — I'm genuinely happy for you.",
 unsure:"There's no rush at all. It's your decision, and it's okay not to have it figured out yet.",
 ster:"That's a significant, personal choice about your own body. I trust you to know what's right for you.",
 adopt:"That's a meaningful path. However you build your family is yours to decide, and I support you."};
var rSit=document.getElementById('rSit'),rGen=document.getElementById('rGen'),rOut=document.getElementById('rOut'),rCopy=document.getElementById('rCopy');
function rShow(){rOut.textContent=R[rSit.value]||'';}
if(rGen)rGen.addEventListener('click',rShow);
if(rCopy)rCopy.addEventListener('click',function(){A.copy&&A.copy(R[rSit.value]||'',rCopy);});

/* ---------- Reflection + summary ---------- */
var ta=document.getElementById('reflect'),status=document.getElementById('saveStatus'),timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyBtn=document.getElementById('copyBtn'),clearBtn=document.getElementById('clearBtn');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash('Saved ✓');});
if(clearBtn)clearBtn.addEventListener('click',function(){if(ta.value.trim()&&!window.confirm('Clear your reflection on this device?'))return;ta.value='';if(A.remove)A.remove('reflect');flash('Cleared.');ta.focus();});
if(copyBtn)copyBtn.addEventListener('click',function(){
  var lines=['Reproductive autonomy — my summary',''];
  var n=boxes.filter(function(b){return b.checked;}).length;lines.push('Conditions of a free choice present: '+n+' of '+boxes.length);
  lines.push('','My reflection:',(ta&&ta.value.trim())?ta.value.trim():'(left blank)');
  if(A.copy)A.copy(lines.join('\n'),copyBtn);
});
}catch(e){console.error('project 006 script error',e);}
});
