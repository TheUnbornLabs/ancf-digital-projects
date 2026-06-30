/* Project 090 · Safe Moderation Checklist — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var GROUPS=[
    {t:'Setting up',cls:'',items:['Clear, pinned rules everyone can find','A simple, private way to report problems','More than one moderator, so no one is alone','Agreed escalation steps (nudge → warning → removal)','A shared place for mods to log and discuss issues']},
    {t:'Day to day',cls:'',items:['Apply rules consistently, to friends and strangers alike','Address issues early, before they escalate','Act on the behaviour, not the person\'s worth','Keep warnings private; praise in public','Welcome newcomers and model the tone you want']},
    {t:'When things go wrong',cls:'',items:['Stay calm; a measured response sets the temperature','Hear all sides before deciding','Explain decisions briefly and fairly','Hand over if you\'re too close or too tired','Know your limits — signpost professional help when needed, don\'t play counsellor']},
    {t:'Caring for the moderators',cls:'care',items:['You\'re allowed to log off — the queue can wait','Take breaks after heavy or hostile episodes','Debrief with a fellow mod; don\'t carry it alone','Rotate duties so no one burns out','Remember: a volunteer\'s wellbeing matters more than any thread']}
  ];
  var done=(A.getJSON?A.getJSON('done',{}):{})||{}; var total=0; GROUPS.forEach(function(g){ total+=g.items.length; });
  function render(){ var box=$('phases'); if(!box) return;
    box.innerHTML=GROUPS.map(function(g,gi){ var dc=0; g.items.forEach(function(_,ii){ if(done[gi+'-'+ii]) dc++; });
      return '<div class="phase '+g.cls+'"><div class="ph">'+esc(g.t)+'<span class="pp">'+dc+'/'+g.items.length+'</span></div><div class="items">'+g.items.map(function(it,ii){ var k=gi+'-'+ii; return '<label data-k="'+k+'" class="'+(done[k]?'done':'')+'"><input type="checkbox" '+(done[k]?'checked':'')+'><span>'+esc(it)+'</span></label>'; }).join('')+'</div></div>'; }).join('');
    box.querySelectorAll('input').forEach(function(c){ c.addEventListener('change',function(){ var k=c.closest('label').getAttribute('data-k'); if(c.checked)done[k]=1; else delete done[k]; if(A.setJSON)A.setJSON('done',done); render(); upd(); }); }); }
  function upd(){ var dn=Object.keys(done).length, pct=Math.round(dn/total*100); if(A.meter)A.meter($('meter'),pct); var m=$('msg'); if(m) m.textContent=dn+' of '+total+' habits in place ('+pct+'%)'+(dn===total?' — a well-tended space, and a cared-for team. 🌿':''); }
  function text(){ var L=['SAFE MODERATION CHECKLIST','']; GROUPS.forEach(function(g,gi){ L.push(g.t.toUpperCase()); g.items.forEach(function(it,ii){ L.push((done[gi+'-'+ii]?'[x] ':'[ ] ')+it); }); L.push(''); }); return L.join('\n').trim(); }
  $('copyBtn').addEventListener('click',function(){ if(A.copy) A.copy(text(),$('copyBtn')); });
  $('resetBtn').addEventListener('click',function(){ if(Object.keys(done).length&&!window.confirm('Reset all progress?'))return; done={}; if(A.setJSON)A.setJSON('done',done); render(); upd(); });
  (function(){ var box=$('prinCards'); if(!box) return;
    var C=[['Consistency is fairness','The same rule for everyone, friend or stranger, is what makes a space feel safe. Favouritism quietly poisons trust.'],['Early & calm','Most conflicts shrink if met early and without heat. Your composure is the most powerful moderation tool you have.'],['Mods are people too','A community is only as healthy as those holding it. Building in rest, handover, and limits isn\'t indulgence — it\'s sustainability.']];
    box.innerHTML=C.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  render(); upd();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 090 script error', e); }
});
