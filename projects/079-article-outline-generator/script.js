/* Project 079 · Article Outline Generator — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function gen(){
    var topic=($('topic').value||'').trim()||'Your topic', framing=$('framing').value, depth=+$('depth').value;
    var L=['ARTICLE OUTLINE','Working title: '+topic,'Framing: '+framing,'',
      '1. HOOK / OPENING','   • Open with the question, a scene, or a surprising fact','   • Make the reader feel why this matters',''];
    var n=2;
    if(framing==='persuasive'){
      L.push(n++ +'. THESIS'); L.push('   • State your position in one clear sentence'); L.push('   • Preview the reasons to come'); L.push('');
      for(var i=0;i<depth;i++){ L.push(n++ +'. ARGUMENT '+(i+1)); L.push('   • Claim:'); L.push('   • Evidence / reasoning:'); L.push('   • Example or illustration:'); L.push(''); }
      L.push(n++ +'. THE STRONGEST OPPOSING VIEW  ⟵ built in'); L.push('   • State the best counter-argument fairly (steelman it)'); L.push('   • Acknowledge what it gets right'); L.push('   • Respond honestly — without strawmanning'); L.push('');
      L.push(n++ +'. CONCLUSION'); L.push('   • Restate the position, now earned'); L.push('   • End with an invitation, not a lecture');
    } else if(framing==='balanced'){
      L.push(n++ +'. FRAME THE QUESTION'); L.push('   • Why reasonable people disagree'); L.push('');
      L.push(n++ +'. THE CASE FOR'); for(var a=0;a<Math.max(1,depth-1);a++){ L.push('   • Point '+(a+1)+':'); } L.push('');
      L.push(n++ +'. THE CASE AGAINST  ⟵ equal weight'); for(var b=0;b<Math.max(1,depth-1);b++){ L.push('   • Point '+(b+1)+':'); } L.push('');
      L.push(n++ +'. WHERE THE EVIDENCE / BALANCE LIES'); L.push('   • Weigh them honestly'); L.push('');
      L.push(n++ +'. CONCLUSION'); L.push('   • A considered, non-dogmatic close');
    } else if(framing==='explainer'){
      L.push(n++ +'. DEFINE THE TERMS'); L.push('   • Plain-language definitions'); L.push('');
      for(var e=0;e<depth;e++){ L.push(n++ +'. KEY ASPECT '+(e+1)); L.push('   • Explain clearly, with an example'); L.push(''); }
      L.push(n++ +'. COMMON MISCONCEPTIONS / OBJECTIONS  ⟵ built in'); L.push('   • Address what people often get wrong or push back on'); L.push('');
      L.push(n++ +'. SUMMARY'); L.push('   • The reader should now be able to explain it themselves');
    } else { // personal
      L.push(n++ +'. THE MOMENT'); L.push('   • A specific scene that sparked the reflection'); L.push('');
      for(var p=0;p<depth;p++){ L.push(n++ +'. REFLECTION '+(p+1)); L.push('   • What you felt / thought / learned'); L.push(''); }
      L.push(n++ +'. THE OTHER SIDE OF MY OWN STORY  ⟵ built in'); L.push('   • Where you doubt yourself, or see the other view\'s pull'); L.push('   • Honesty here makes the essay trustworthy'); L.push('');
      L.push(n++ +'. WHERE I\'VE LANDED (FOR NOW)'); L.push('   • A humble, honest close');
    }
    $('out').textContent=L.join('\n');
  }
  $('genBtn').addEventListener('click',gen);
  ['topic','framing','depth'].forEach(function(id){ var el=$(id); if(el) el.addEventListener('input',gen); var e2=$(id); if(e2) e2.addEventListener('change',gen); });
  $('copyBtn').addEventListener('click',function(){ if(A.copy) A.copy($('out').textContent,$('copyBtn')); });
  (function(){ var box=$('aboutCards'); if(!box) return;
    var C=[['It stress-tests your case','Writing the opposing view forces you to find your argument\'s weak joints before a critic does — and to shore them up.'],['It earns trust','Readers can tell when you\'re dodging. Meeting the best counter-argument head-on signals you\'re after truth, not just a win.'],['It\'s how minds actually change','People move when they feel understood. An article that fairly states their view first has a chance of being heard at all.']];
    box.innerHTML=C.map(function(p){ return '<div class="scard"><h4>'+p[0]+'</h4><span class="tg">Tap to expand</span><div class="more">'+p[1]+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  gen();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 079 script error', e); }
});
