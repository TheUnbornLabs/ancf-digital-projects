/* Project 054 · Study Circle Dashboard — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var st=(A.getJSON?A.getJSON('circle',null):null)||{topic:'',when:'',reading:'',fac:'',time:'',note:'',questions:[],rules:{}};
  var RULES=[
    {id:'ideas',label:'Critique ideas, never people'},
    {id:'airtime',label:'Share airtime — everyone speaks, no one dominates'},
    {id:'steelman',label:'Steelman before you disagree'},
    {id:'confidential',label:'What\'s shared here stays here'},
    {id:'noresolve',label:'It\'s fine to leave questions unresolved'},
    {id:'consent',label:'Heavy topics get a heads-up first'}
  ];
  var DEFAULT_RULES=['ideas','airtime','steelman'];
  var STARTERS=['What did this reading get right, and where is it weakest?','Which assumption here is doing the most work?','Where do we each personally land, and why?','What would change our minds?','Whose perspective is missing from this argument?'];

  function bindField(id,key){ var el=$(id); if(!el) return; el.value=st[key]||''; el.addEventListener("input",function(){ st[key]=el.value; save(); build(); meter(); }); }
  function save(){ if(A.setJSON)A.setJSON('circle',st); }
  function renderQ(){ var box=$('qlist'); if(!box) return;
    if(!st.questions.length){ box.innerHTML='<p class="note">No questions yet — add your own or tap "Suggest starters".</p>'; }
    else box.innerHTML=st.questions.map(function(q,i){ return '<div class="qrow"><span>'+esc(q)+'</span><button type="button" data-i="'+i+'" aria-label="Remove">×</button></div>'; }).join('');
    box.querySelectorAll('button').forEach(function(b){ b.addEventListener('click',function(){ st.questions.splice(+b.getAttribute('data-i'),1); save(); renderQ(); build(); meter(); }); }); }
  function renderRules(){ var box=$('rules'); if(!box) return;
    box.innerHTML=RULES.map(function(r){ var on=!!st.rules[r.id]; return '<label data-id="'+r.id+'" class="'+(on?'on':'')+'"><input type="checkbox" '+(on?'checked':'')+'><span>'+esc(r.label)+'</span></label>'; }).join('');
    box.querySelectorAll('input').forEach(function(c){ c.addEventListener('change',function(){ var id=c.closest('label').getAttribute('data-id'); st.rules[id]=c.checked; c.closest('label').classList.toggle('on',c.checked); save(); build(); meter(); }); }); }
  function meter(){ var sections=[!!st.topic.trim(),!!st.when.trim(),!!(st.fac.trim()||st.time.trim()||st.note.trim()),st.questions.length>0,Object.keys(st.rules).some(function(k){return st.rules[k];})];
    var dn=sections.filter(Boolean).length, pct=Math.round(dn/sections.length*100);
    if(A.meter)A.meter($('readyMeter'),pct); var m=$('readyMsg'); if(m) m.textContent='Readiness: '+pct+'% — '+dn+' of '+sections.length+' sections filled'+(dn===sections.length?'. Ready to share! 🎉':'.'); }
  function build(){
    var L=['STUDY CIRCLE PLAN','==================',''];
    L.push('📚 Topic: '+(st.topic||'(to set)'));
    L.push('🗓️  When: '+(st.when||'(to set)'));
    if(st.reading) L.push('📖 Reading: '+st.reading);
    L.push('');
    if(st.fac||st.time||st.note){ L.push('Roles:'); if(st.fac)L.push('  • Facilitator: '+st.fac); if(st.time)L.push('  • Timekeeper: '+st.time); if(st.note)L.push('  • Note-taker: '+st.note); L.push(''); }
    if(st.questions.length){ L.push('Discussion questions:'); st.questions.forEach(function(q,i){ L.push('  '+(i+1)+'. '+q); }); L.push(''); }
    var rules=RULES.filter(function(r){ return st.rules[r.id]; });
    if(rules.length){ L.push('Ground rules:'); rules.forEach(function(r){ L.push('  • '+r.label); }); }
    $('out').textContent=L.join('\n');
  }
  bindField('fTopic','topic'); bindField('fWhen','when'); bindField('fReading','reading');
  bindField('rFac','fac'); bindField('rTime','time'); bindField('rNote','note');
  $('qAdd').addEventListener('click',function(){ var inp=$('qInput'); var v=(inp.value||'').trim(); if(!v) return; st.questions.push(v); inp.value=''; save(); renderQ(); build(); meter(); });
  $('qInput').addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); $('qAdd').click(); } });
  $('qSeed').addEventListener('click',function(){ STARTERS.forEach(function(s){ if(st.questions.indexOf(s)<0) st.questions.push(s); }); save(); renderQ(); build(); meter(); });
  $('exportBtn').addEventListener('click',build);
  $('copyBtn').addEventListener('click',function(){ if(A.copy) A.copy($('out').textContent,$('copyBtn')); });
  $('resetBtn').addEventListener('click',function(){ if(!window.confirm('Reset the whole circle plan?'))return; st={topic:'',when:'',reading:'',fac:'',time:'',note:'',questions:[],rules:{}}; save(); init(); });
  // default rules on first use
  if(!Object.keys(st.rules).length){ DEFAULT_RULES.forEach(function(id){ st.rules[id]=true; }); save(); }

  (function(){ var box=$('tipCards'); if(!box) return;
    var T=[['Start with a check-in','A quick round — name and one word on how you\'re arriving — settles the group and gives everyone a first, easy turn to speak.'],
      ['Protect the quiet voices','Invite, don\'t pressure: "We haven\'t heard from everyone — any thoughts?" The best insight often comes from the person who waited.'],
      ['End with an open thread','Close by naming one question you didn\'t resolve. It respects the difficulty and gives the next session somewhere to begin.']];
    box.innerHTML=T.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();

  function init(){ ['fTopic','fWhen','fReading','rFac','rTime','rNote'].forEach(function(id){ var keys={fTopic:'topic',fWhen:'when',fReading:'reading',rFac:'fac',rTime:'time',rNote:'note'}; var el=$(id); if(el)el.value=st[keys[id]]||''; }); renderQ(); renderRules(); build(); meter(); }
  init();

  (function(){
    var ta=$('r1'), status=$('saveStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 054 script error', e); }
});
