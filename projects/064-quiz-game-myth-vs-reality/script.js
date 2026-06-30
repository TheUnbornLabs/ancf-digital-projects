/* Project 064 · Myth vs Reality Quiz — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var ITEMS=[
    {t:'Antinatalism means wanting existing people to die.',myth:true,e:'Myth. Antinatalism concerns not creating new lives; it says nothing in favour of harming anyone who already exists.'},
    {t:'Being childfree means you must dislike children.',myth:true,e:'Myth. Many childfree people love children as aunts, mentors, and friends — the choice is about their own life, not a verdict on kids.'},
    {t:'"Childfree" usually implies a deliberate choice.',myth:false,e:'Reality. "Childfree" generally signals a chosen path, while "childless" more often implies circumstance.'},
    {t:'Having children guarantees you\'ll be cared for in old age.',myth:true,e:'Myth. Children are no guarantee of care, and thoughtful planning serves later life far more reliably.'},
    {t:'Most pressure to have kids is deliberately malicious.',myth:true,e:'Myth. The great majority is well-meant — which is exactly what makes it hard to push back on.'},
    {t:'The "biological clock" phrase came from a biology textbook.',myth:true,e:'Myth. It was popularised by a 1978 newspaper column, not by biology.'},
    {t:'You can value your own life and still find antinatalist arguments interesting.',myth:false,e:'Reality. The two operate at different levels — one about creation, one about how to live now.'},
    {t:'Antinatalism and abortion debates are the same issue.',myth:true,e:'Myth. They are logically separate: one is about creating new lives, the other about bodily autonomy and a pregnancy\'s status.'},
    {t:'Reproductive autonomy includes the right to NOT have children.',myth:false,e:'Reality. Autonomy runs both ways — the freedom to have, and to not have, children.'},
    {t:'It\'s an established fact that the childfree regret it more than parents.',myth:true,e:'Myth. The research is mixed and contested; no such settled finding exists. Regret occurs on every path.'},
    {t:'Pronatalism — the assumption everyone should have kids — appears across nearly every culture.',myth:false,e:'Reality. It shows up in some form in most societies, which is partly why it feels so natural.'},
    {t:'A couple isn\'t a "real family" until they have children.',myth:true,e:'Myth. Two people who love each other are already a family; wholeness isn\'t something a child must deliver.'},
    {t:'Benatar\'s asymmetry argument is settled and beyond dispute.',myth:true,e:'Myth. It is influential but widely debated; several of its premises are actively contested.'},
    {t:'Choosing a childfree life is a recognised, studied social phenomenon.',myth:false,e:'Reality. It has been studied across sociology and demography, especially since the 1970s.'}
  ];
  var idx=0, score=0, streak=0, best=(A.getJSON?A.getJSON('best',0):0)||0;
  var totalEl=$('total'); if(totalEl) totalEl.textContent=ITEMS.length;
  var bestEl=$('best'); if(bestEl) bestEl.textContent=best;
  function render(){
    var host=$('qhost'); if(!host) return;
    if(idx>=ITEMS.length){ host.innerHTML='<div class="qcard"><div class="big" style="font-size:2rem;font-weight:800">'+score+' / '+ITEMS.length+'</div><p class="stmt">'+verdictMsg()+'</p><button class="btn btn-primary" id="againBtn" type="button">Play again</button></div>';
      var a=$('againBtn'); if(a) a.addEventListener('click',function(){ idx=0;score=0;streak=0; upd(); render(); }); if(A.meter)A.meter($('meter'),100); return; }
    var it=ITEMS[idx];
    host.innerHTML='<div class="qcard"><p class="note">Statement '+(idx+1)+' of '+ITEMS.length+'</p><div class="stmt">"'+esc(it.t)+'"</div><div class="mr"><button type="button" class="myth" data-v="myth">Myth</button><button type="button" class="real" data-v="real">Reality</button></div><div class="fb" id="fb"></div></div>';
    host.querySelectorAll('.mr button').forEach(function(b){ b.addEventListener('click',function(){ answer(b.getAttribute('data-v')==='myth'); }); });
    if(A.meter)A.meter($('meter'),Math.round(idx/ITEMS.length*100));
  }
  function verdictMsg(){ var p=score/ITEMS.length; return p>=0.85?'Excellent — you can tell the myths from the facts.':p>=0.6?'Nicely done. A few myths still slip through — the explanations help.':'Good effort — and now you\'ve seen the explanations, which is the real win.'; }
  function answer(saidMyth){ var it=ITEMS[idx]; var correct=(saidMyth===it.myth);
    if(correct){ score++; streak++; if(streak>best){ best=streak; if(A.setJSON)A.setJSON('best',best); } } else streak=0;
    upd();
    var host=$('qhost'); host.querySelectorAll('.mr button').forEach(function(b){ b.disabled=true; b.style.opacity=0.6; });
    var fb=$('fb'); if(fb){ fb.classList.add('show'); fb.innerHTML='<div class="verdict '+(correct?'ok':'no')+'">'+(correct?'Correct ✓':'Not quite ✗')+'</div><span class="tag '+(it.myth?'tmyth':'treal')+'">'+(it.myth?'MYTH':'REALITY')+'</span><p style="margin-top:8px">'+esc(it.e)+'</p><button class="btn btn-primary" id="nextBtn" type="button">'+(idx+1>=ITEMS.length?'See results':'Next')+'</button>'; }
    var nb=$('nextBtn'); if(nb) nb.addEventListener('click',function(){ idx++; render(); });
  }
  function upd(){ var s=$('score'); if(s)s.textContent=score; var st=$('streak'); if(st)st.textContent=streak; var b=$('best'); if(b)b.textContent=best; }
  upd(); render();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 064 script error', e); }
});
