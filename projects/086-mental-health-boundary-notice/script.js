/* Project 086 · Mental Health Boundary Notice — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  var WHERE={group:'this group',post:'this post',thread:'this thread'};
  var P={
    cw:{warm:['💛 A gentle ask for {w}: some topics here can land heavily for people. Could we add a short content warning before sensitive subjects (loss, trauma, etc.)? It lets everyone choose when to engage. Thank you for caring for each other.','Hi all — a kind request for {w}. Many of us hold heavy experiences. A one-line heads-up before sensitive content goes a long way. Appreciated. 🌿'],brief:['Reminder for {w}: please add a brief content warning before sensitive topics. Thanks all.','Quick ask: content warnings before heavy subjects in {w}, please.']},
    heavy:{warm:['💛 Heads-up: {w} touches some heavy ground. Take it at your own pace — it\'s completely okay to read later, skip, or step away. Look after yourselves.','Note for {w}: this gets into difficult territory. No pressure to engage — your wellbeing comes first. 🌿'],brief:['Heads-up: {w} covers heavy topics. Engage at your own pace.','CW: {w} is a heavy one. Skip or step away anytime.']},
    break:{warm:['A soft reminder for {w}: if any of this is weighing on you, it\'s okay to close the app and come back later. Rest is allowed. We\'ll still be here. 💛','Friendly nudge for {w}: these conversations can be a lot. Stepping away for a bit isn\'t quitting — it\'s self-care. 🌿'],brief:['Reminder: it\'s okay to take a break from {w} anytime.','If {w} feels heavy, step away. Rest is allowed.']},
    support:{warm:['💛 A caring note for {w}: if anything here is bringing up real distress, please be gentle with yourself — and consider reaching out to someone you trust or a qualified professional. You don\'t have to carry it alone.','For anyone in {w} who\'s finding this hard: your feelings are valid, and support is okay to seek — a trusted person or a professional can help in ways a thread can\'t. 🌿'],brief:['If {w} is bringing up distress, please reach out to someone you trust or a professional.','Be gentle with yourself. Support beyond {w} is okay to seek.']},
    pause:{warm:['💛 Let\'s gently pause {w} for a moment. Things have gotten intense, and a breath helps everyone. We can pick it back up with cooler heads — no one\'s in trouble.','Pausing {w} kindly for a bit. The heat\'s risen; let\'s let it settle and return with care. 🌿'],brief:['Let\'s pause {w} for a bit to let things cool down. Thanks all.','Gentle pause on {w} — back when things have settled.']}
  };
  var current='';
  function gen(){ var pool=P[$('purpose').value][$('tone').value]; var w=WHERE[$('where').value]; var t=pick(pool).replace(/\{w\}/g,w); if(t===current&&pool.length>1) t=pick(pool).replace(/\{w\}/g,w); current=t; $('out').textContent=t; }
  $('genBtn').addEventListener('click',gen); $('anotherBtn').addEventListener('click',gen);
  ['purpose','where','tone'].forEach(function(id){ var el=$(id); if(el) el.addEventListener('change',gen); });
  $('copyBtn').addEventListener('click',function(){ if(current&&A.copy) A.copy(current,$('copyBtn')); });
  (function(){ var box=$('prinCards'); if(!box) return;
    var C=[['Care, don\'t diagnose','Speak to the space and the feeling, never label a person\'s mental state. "This is heavy" is kind; "you seem unwell" is not yours to say.'],['Make leaving easy','The most caring message often just gives permission to step back. "It\'s okay to read later" lifts a quiet pressure.'],['Point outward when needed','For real distress, the kindest thing is to gently encourage trusted people or professionals — a community thread can hold someone, but it can\'t treat them.']];
    box.innerHTML=C.map(function(p){ return '<div class="scard"><h4>'+p[0]+'</h4><span class="tg">Tap to expand</span><div class="more">'+p[1]+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  gen();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 086 script error', e); }
});
