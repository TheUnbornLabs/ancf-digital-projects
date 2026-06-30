/* Project 096 · LGBTQ+ Childfree Inclusion — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var P=[
    ['Paths to family are varied','For LGBTQ+ people, building a family can take many shapes — adoption, fostering, surrogacy, co-parenting, blended and chosen families, and more. None is a lesser version; all are family.'],
    ['Childfree is fully valid here','Remaining childfree is an equally real, equally respectable choice — not a consolation prize or a circumstance to be pitied. It belongs in this conversation as fully as any other.'],
    ['Assumptions cut both ways','Sometimes the assumption is "you can\'t or won\'t have children"; sometimes there\'s pressure to prove legitimacy by having them. Both are assumptions worth setting down.'],
    ['Chosen family is family','Many LGBTQ+ people build profound networks of chosen family. Care, belonging, and legacy flow through these bonds, with or without children.'],
    ['Intersecting pressures','Reproductive pressure can layer with pressure about identity itself. Naming both, separately, helps you answer each on its own terms.'],
    ['You define your family','However it\'s shaped — partners, friends, pets, community, children or none — you are the author of what "family" means for you.']
  ];
  (function(){ var box=$('pointCards'); if(!box) return; box.innerHTML=P.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  var AFF=[
    'My family is whatever I build it to be.',
    'Childfree is a full choice, not a fallback.',
    'I don\'t owe anyone proof of legitimacy through children.',
    'My chosen family is real family.',
    'I get to define belonging on my own terms.',
    'However I form — or don\'t form — a family, it\'s mine to decide.'
  ];
  (function(){ var box=$('affirmsBox'); if(!box) return; box.innerHTML=AFF.map(function(t,i){ return '<div class="aff"><span>'+esc(t)+'</span><button type="button" data-i="'+i+'">Copy</button></div>'; }).join('');
    box.querySelectorAll('button').forEach(function(b){ b.addEventListener('click',function(){ if(A.copy) A.copy(AFF[+b.getAttribute('data-i')],b); }); }); })();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 096 script error', e); }
});
