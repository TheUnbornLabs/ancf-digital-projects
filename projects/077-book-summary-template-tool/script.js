/* Project 077 · Book Summary Template Tool — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function val(id){ return ($(id).value||'').trim(); }
  var ideas=[], lines=[];
  function renderList(box,arr,id){ var el=$(box); if(!el) return; el.innerHTML=arr.length?arr.map(function(t,i){ return '<div class="dli"><span>'+esc(t)+'</span><button type="button" data-i="'+i+'" aria-label="Remove">×</button></div>'; }).join(''):'';
    el.querySelectorAll('button').forEach(function(b){ b.addEventListener('click',function(){ arr.splice(+b.getAttribute('data-i'),1); renderList(box,arr,id); build(); }); }); }
  function add(inId,arr,box){ var inp=$(inId); var v=(inp.value||'').trim(); if(!v) return; arr.push(v); inp.value=''; renderList(box,arr); build(); inp.focus(); }
  function build(){
    var L=[]; var title=val('fTitle')||'(untitled)'; var author=val('fAuthor');
    L.push('📖 '+title+(author?' — '+author:'')); if(val('fRating')) L.push(val('fRating')); L.push('');
    if(val('fThesis')){ L.push('THESIS'); L.push(val('fThesis')); L.push(''); }
    if(ideas.length){ L.push('KEY IDEAS'); ideas.forEach(function(t,i){ L.push('  • '+t); }); L.push(''); }
    if(lines.length){ L.push('LINES WORTH REMEMBERING (paraphrased)'); lines.forEach(function(t){ L.push('  — '+t); }); L.push(''); }
    if(val('fCritique')){ L.push('MY CRITIQUE'); L.push(val('fCritique')); L.push(''); }
    if(val('fTakeaway')){ L.push('ONE TAKEAWAY'); L.push('→ '+val('fTakeaway')); }
    $('out').textContent=L.join('\n').trim();
  }
  ['fTitle','fAuthor','fThesis','fCritique','fTakeaway','fRating'].forEach(function(id){ var el=$(id); if(el) el.addEventListener('input',build); var e2=$(id); if(e2)e2.addEventListener('change',build); });
  $('ideaAdd').addEventListener('click',function(){ add('ideaIn',ideas,'ideasList'); });
  $('lineAdd').addEventListener('click',function(){ add('lineIn',lines,'linesList'); });
  $('ideaIn').addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); $('ideaAdd').click(); } });
  $('lineIn').addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); $('lineAdd').click(); } });
  $('copyBtn').addEventListener('click',function(){ if(A.copy) A.copy($('out').textContent,$('copyBtn')); });
  var lib=(A.getJSON?A.getJSON('lib',[]):[])||[];
  function renderLib(){ var box=$('libraryBox'); if(!box) return; if(!lib.length){ box.innerHTML='<p class="note">No saved summaries yet — fill the form and tap ☆ Save to library.</p>'; return; }
    box.innerHTML=lib.map(function(b,i){ return '<div class="lrow"><span><b>'+esc(b.title)+'</b>'+(b.author?' — '+esc(b.author):'')+'</span><button type="button" class="ld" data-i="'+i+'" style="color:var(--accent-2);font-weight:700">Load</button><button type="button" data-i="'+i+'" aria-label="Remove">×</button></div>'; }).join('');
    box.querySelectorAll('.ld').forEach(function(b){ b.addEventListener('click',function(){ load(lib[+b.getAttribute('data-i')]); }); });
    box.querySelectorAll('button:not(.ld)').forEach(function(b){ b.addEventListener('click',function(){ lib.splice(+b.getAttribute('data-i'),1); if(A.setJSON)A.setJSON('lib',lib); renderLib(); }); }); }
  function snapshot(){ return {title:val('fTitle')||'(untitled)',author:val('fAuthor'),thesis:val('fThesis'),ideas:ideas.slice(),lines:lines.slice(),critique:val('fCritique'),takeaway:val('fTakeaway'),rating:val('fRating')}; }
  function load(b){ $('fTitle').value=b.title||''; $('fAuthor').value=b.author||''; $('fThesis').value=b.thesis||''; $('fCritique').value=b.critique||''; $('fTakeaway').value=b.takeaway||''; $('fRating').value=b.rating||''; ideas=(b.ideas||[]).slice(); lines=(b.lines||[]).slice(); renderList('ideasList',ideas); renderList('linesList',lines); build(); }
  $('saveBtn').addEventListener('click',function(){ lib.push(snapshot()); if(A.setJSON)A.setJSON('lib',lib); renderLib(); });
  $('newBtn').addEventListener('click',function(){ ['fTitle','fAuthor','fThesis','fCritique','fTakeaway'].forEach(function(id){ $(id).value=''; }); $('fRating').value=''; ideas=[]; lines=[]; renderList('ideasList',ideas); renderList('linesList',lines); build(); });
  renderLib(); build();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 077 script error', e); }
});
