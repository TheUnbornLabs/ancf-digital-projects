/* Project 019 · Childfree Couple Planning Board — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var AREAS=[
    {k:'travel',ico:'✈️',label:'Travel & adventure',tag:'Places and experiences to share',sparks:['A big trip every year','See the northern lights','A spontaneous weekend habit','Live abroad for a season']},
    {k:'home',ico:'🏡',label:'Home & nest',tag:'The space your life happens in',sparks:['A home office each','A garden / allotment','A pet or two','A guest room for friends']},
    {k:'growth',ico:'🌱',label:'Growth & learning',tag:'Skills, study, creativity',sparks:['Learn an instrument','A creative project','A course or degree','Read more, deeply']},
    {k:'people',ico:'💞',label:'People & community',tag:'Friends, family, belonging',sparks:['Be the fun aunt/uncle','Host regular dinners','Build a chosen family','Volunteer together']},
    {k:'health',ico:'🌅',label:'Health & vitality',tag:'Body, mind, energy',sparks:['Train for an event','Cook well together','Protect real rest','A morning ritual we love']},
    {k:'contribution',ico:'🤲',label:'Contribution & legacy',tag:'What you give and leave',sparks:['Mentor someone','Support a cause we love','Plant trees / restore land','Leave a meaningful bequest']}
  ];
  var data = (A.getJSON?A.getJSON('board',{}):{}) || {};
  function save(){ if(A.setJSON) A.setJSON('board',data); }

  function render(){
    var box=$('boardGrid'); if(!box) return;
    box.innerHTML=AREAS.map(function(a){
      var items=data[a.k]||[];
      return '<div class="area" data-k="'+a.k+'"><h4>'+a.ico+' '+esc(a.label)+'</h4><p class="tag">'+esc(a.tag)+'</p>'+
        '<div class="items">'+(items.length?items.map(function(it,i){ return '<div class="it"><span>'+esc(it)+'</span><button type="button" data-i="'+i+'" aria-label="Remove">×</button></div>'; }).join(''):'<span class="note" style="font-size:var(--fs-xs)">Nothing here yet.</span>')+'</div>'+
        '<div class="addr"><input type="text" placeholder="Add your own…" aria-label="Add to '+esc(a.label)+'"><button class="btn btn-primary" type="button">+</button></div>'+
        '<div class="sparks">'+a.sparks.map(function(s){ return '<span class="spark" role="button" tabindex="0">'+esc(s)+'</span>'; }).join('')+'</div></div>';
    }).join('');
    box.querySelectorAll('.area').forEach(function(el){
      var k=el.getAttribute('data-k');
      function add(v){ v=(v||'').trim(); if(!v) return; data[k]=data[k]||[]; data[k].push(v); save(); render(); }
      var inp=el.querySelector('.addr input'), btn=el.querySelector('.addr button');
      btn.addEventListener('click',function(){ add(inp.value); });
      inp.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); add(inp.value); } });
      el.querySelectorAll('.it button').forEach(function(b){ b.addEventListener('click',function(){ data[k].splice(+b.getAttribute('data-i'),1); save(); render(); }); });
      el.querySelectorAll('.spark').forEach(function(s){ function go(){ add(s.textContent); } s.addEventListener('click',go); s.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();go();} }); });
    });
  }
  render();

  /* vision statement */
  (function(){
    var vt=$('vTime'), va=$('vAbout'), out=$('visionOut'), status=$('saveStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    function upd(){ var t=(vt&&vt.value.trim())||'', a=(va&&va.value.trim())||''; if(out){ if(t||a){ out.textContent='“Over the next few years, we\'re building '+(t||'…')+' — because at its heart, our life is about '+(a||'…')+'.”'; } else { out.textContent=''; } } if(A.set){ A.set('vTime',vt?vt.value:''); A.set('vAbout',va?va.value:''); } }
    if(vt&&A.get){ vt.value=A.get('vTime',''); vt.addEventListener('input',upd); }
    if(va&&A.get){ va.value=A.get('vAbout',''); va.addEventListener('input',upd); }
    upd();
    var s=$('saveBtn'),cp=$('copyBtn'),cl=$('clearBtn');
    if(s) s.addEventListener('click',function(){ upd(); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(!window.confirm('Clear the whole board on this device?'))return; data={}; save(); render(); flash('Cleared.'); });
    if(cp) cp.addEventListener('click',function(){ var L=['Our childfree life board','']; AREAS.forEach(function(a){ var items=data[a.k]||[]; if(items.length){ L.push(a.label+':'); items.forEach(function(it){ L.push('  • '+it); }); L.push(''); } }); if(out&&out.textContent){ L.push(out.textContent.replace(/[“”]/g,'')); } if(A.copy) A.copy(L.join('\n'),cp); });
  })();

  /* quiz */
  (function(){
    var Q=[{a:0},{a:1}], E=['It helps you define what a life IS, not just what it isn\'t.','Add what inspires you and revisit it over time — perfection isn\'t the point.'];
    var picks={}, total=document.querySelectorAll('#quizbox .quiz-q').length;
    if(A.initOptions) A.initOptions($('quizbox'),function(q,i){ picks[q]=+i; });
    var sB=$('quizScore'), rB=$('quizReset'), res=$('quizResult');
    if(sB) sB.addEventListener('click',function(){ if(Object.keys(picks).length<total){ res.style.display='block'; res.textContent='Pick an answer for all '+total+' questions first.'; return; }
      var sc=0; Q.forEach(function(it,i){ document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){ var j=+x.getAttribute('data-i'); x.classList.remove('ok','no'); if(j===it.a)x.classList.add('ok'); else if(j===picks[i])x.classList.add('no'); }); var ex=document.querySelector('.explain[data-q="'+i+'"]'); if(ex){ ex.style.display='block'; ex.textContent=E[i]; } if(picks[i]===it.a)sc++; });
      res.style.display='block'; res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.'; if(rB) rB.style.display='inline-block'; });
    if(rB) rB.addEventListener('click',function(){ picks={}; document.querySelectorAll('#quizbox .opt').forEach(function(x){ x.classList.remove('sel','ok','no'); }); document.querySelectorAll('#quizbox .explain').forEach(function(ex){ ex.style.display='none'; ex.textContent=''; }); res.style.display='none'; rB.style.display='none'; });
  })();
  (function(){
    var ta=$('r1'), status=$('rStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 019 script error', e); }
});
