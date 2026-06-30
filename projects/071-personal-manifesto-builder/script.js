/* Project 071 · Personal Manifesto Builder — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function v(id){ return ($(id).value||'').trim(); }
  var TONE={
    plain:{open:'This is what I have decided.',l1:'I am choosing ',l2:'What I protect by this is ',l3:'I will no longer carry ',l4:'And I wish for everyone, including those who choose otherwise, ',close:'This is mine to choose, and I have.'},
    warm:{open:'A gentle note to myself.',l1:'I am choosing, with care, ',l2:'I am holding close ',l3:'I am setting down ',l4:'And I hope, warmly, for others — even those on a different path — ',close:'I can be kind to them and true to me, both at once.'},
    bold:{open:'I will say this plainly.',l1:'I choose ',l2:'I stand for ',l3:'I am done apologising for ',l4:'And I demand for everyone the same freedom I claim — ',close:'My life is mine. That is the whole of it.'},
    poetic:{open:'Quietly, and for keeps:',l1:'I am choosing ',l2:'I keep, like a small lamp, ',l3:'I lay down, at last, ',l4:'And I wish, for every traveller on every road, ',close:'Let this be enough. It is.'}
  };
  function fallback(s,d){ return s?s:d; }
  function build(){
    var t=TONE[$('tone').value];
    var a=fallback(v('q1'),'a life that is fully my own');
    var b=fallback(v('q2'),'my freedom and my peace');
    var c=fallback(v('q3'),'other people\'s timelines for me');
    var d=fallback(v('q4'),'the same freedom to choose, and peace with their choice');
    var m=t.open+'\n\n'+t.l1+a+'.\n'+t.l2+b+'.\n'+t.l3+c+'.\n'+t.l4+d+'.\n\n'+t.close;
    $('out').textContent=m; return m;
  }
  ['q1','q2','q3','q4'].forEach(function(id){ var el=$(id); if(el) el.addEventListener('input',build); });
  $('tone').addEventListener('change',build);
  $('buildBtn').addEventListener('click',build);
  $('copyBtn').addEventListener('click',function(){ if(A.copy) A.copy($('out').textContent,$('copyBtn')); });
  var versions=(A.getJSON?A.getJSON('versions',[]):[])||[];
  function renderV(){ var box=$('versions'); if(!box) return; if(!versions.length){ box.innerHTML='<p class="note">No saved versions yet — tap ☆ Save version to keep one.</p>'; return; }
    box.innerHTML=versions.map(function(t,i){ return '<div class="vrow"><span>'+esc(t.replace(/\n+/g,' / ').slice(0,90))+'…</span><button type="button" class="ld" data-i="'+i+'" title="Load" style="color:var(--accent-2);font-weight:700">Load</button><button type="button" data-i="'+i+'" aria-label="Remove">×</button></div>'; }).join('');
    box.querySelectorAll('.ld').forEach(function(b){ b.addEventListener('click',function(){ $('out').textContent=versions[+b.getAttribute('data-i')]; }); });
    box.querySelectorAll('button:not(.ld)').forEach(function(b){ b.addEventListener('click',function(){ versions.splice(+b.getAttribute('data-i'),1); if(A.setJSON)A.setJSON('versions',versions); renderV(); }); }); }
  $('saveBtn').addEventListener('click',function(){ var m=build(); if(versions.indexOf(m)<0){ versions.push(m); if(A.setJSON)A.setJSON('versions',versions); renderV(); } });
  renderV(); build();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 071 script error', e); }
});
