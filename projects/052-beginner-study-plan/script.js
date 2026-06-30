/* Project 052 · Beginner Study Plan — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var WEEKS=[
    {t:'Week 1 — Foundations',items:[
      {s:'001-antinatalism-intro-guide',n:'Read the intro guide (and dip into the Reader)'},
      {s:'051-antinatalism-faq',n:'Skim the Antinatalism FAQ for the lay of the land'},
      {s:'024-philosophy-timeline',n:'Place the ideas in history with the timeline'},
      {s:'021-antinatalist-quote-archive',n:'Sit with a few study-prompts from the archive'},
      {s:'004-parenthood-assumption-quiz',n:'Surface your own starting assumptions'}
    ]},
    {t:'Week 2 — The arguments',items:[
      {s:'025-benatar-argument-explainer',n:'Work through Benatar\'s asymmetry'},
      {s:'026-consent-argument-explainer',n:'Explore the consent argument'},
      {s:'027-risk-argument-explainer',n:'Examine the risk-based argument'},
      {s:'008-suffering-risk-thought-experiment',n:'Try the suffering-risk thought experiment'},
      {s:'040-bad-argument-detector',n:'Sharpen your reasoning with the fallacy detector'}
    ]},
    {t:'Week 3 — Society & autonomy',items:[
      {s:'003-pronatalism-pressure-detector',n:'Understand pronatalism and its pressure'},
      {s:'006-reproductive-autonomy-explainer',n:'Study reproductive autonomy'},
      {s:'046-social-shame-explainer',n:'See how social shame operates'},
      {s:'047-cultural-pressure-map',n:'Map where pressure comes from for you'},
      {s:'039-respectful-debate-guide',n:'Learn to discuss it all respectfully'}
    ]},
    {t:'Week 4 — Living it',items:[
      {s:'002-childfree-life-intro-guide',n:'Read the Childfree Life guide'},
      {s:'050-childfree-faq',n:'Browse the Childfree FAQ'},
      {s:'016-personal-peace-checklist',n:'Build a personal peace plan'},
      {s:'034-family-function-survival-script',n:'Prepare for family conversations'},
      {s:'005-is-this-my-choice-reflection-tool',n:'Reflect: is this my own choice?'}
    ]}
  ];
  var total=0; WEEKS.forEach(function(w){ total+=w.items.length; });
  var done=(A.getJSON?A.getJSON('done',{}):{})||{};
  var PACE={relaxed:'About 2 items a week — finish in roughly 10 weeks, no rush.',standard:'About 5 items a week — one focused theme per week, four weeks total.',intensive:'One item a day — through the whole plan in about three weeks.'};
  function key(wi,ii){ return wi+'-'+ii; }
  function render(){
    var box=$('weeks'); if(!box) return;
    box.innerHTML=WEEKS.map(function(w,wi){ var dc=0; w.items.forEach(function(it,ii){ if(done[key(wi,ii)]) dc++; });
      var pct=Math.round(dc/w.items.length*100);
      return '<div class="week"><div class="wh"><h4>'+esc(w.t)+'</h4><span class="miniwrap"><span class="minibar" style="width:'+pct+'%"></span></span><span class="wp">'+dc+'/'+w.items.length+'</span></div><div class="items">'+
        w.items.map(function(it,ii){ var k=key(wi,ii),ck=!!done[k]; return '<div class="item'+(ck?' done':'')+'" data-k="'+k+'"><input type="checkbox" id="c_'+k+'" '+(ck?'checked':'')+'><label for="c_'+k+'">'+esc(it.n)+' — <a href="../'+it.s+'/index.html">open ↗</a></label></div>'; }).join('')+
        '</div></div>'; }).join('');
    box.querySelectorAll('input').forEach(function(inp){ inp.addEventListener('change',function(){ var k=inp.id.slice(2); if(inp.checked) done[k]=1; else delete done[k]; if(A.setJSON)A.setJSON('done',done); render(); }); });
    var dn=Object.keys(done).length, pct=Math.round(dn/total*100);
    if(A.meter)A.meter($('overallMeter'),pct); var m=$('overallMsg'); if(m) m.textContent=dn+' of '+total+' steps complete ('+pct+'%)'+(dn===total?' — you finished the plan! 🎓':'');
  }
  function showPace(){ var n=$('paceNote'); if(n) n.textContent=PACE[$('pace').value]; }
  $('pace').addEventListener('change',showPace);
  $('resetBtn').addEventListener('click',function(){ if(Object.keys(done).length&&!window.confirm('Reset all progress?'))return; done={}; if(A.setJSON)A.setJSON('done',done); render(); });

  (function(){ var box=$('howCards'); if(!box) return;
    var H=[['Read to understand, not to win','Try to state each view in its strongest form before deciding what you think. You can disagree better once you truly understand.'],
      ['Sit with discomfort','Some ideas here are heavy. Notice the discomfort, take breaks, and return — that\'s studying, not failing.'],
      ['Keep your own notes','Jot reactions as you go. Your evolving thoughts are the real product of this plan, more than any single answer.']];
    box.innerHTML=H.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();

  showPace(); render();

  (function(){
    var ta=$('r1'), status=$('saveStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 052 script error', e); }
});
