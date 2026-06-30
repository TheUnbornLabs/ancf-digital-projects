/* Project 100 · Final Archive — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var P=(window.ANCF_PROJECTS||[]).slice();
  var fcat='all', fq='';
  // stats
  (function(){ var box=$('statsBox'); if(!box) return; var cats={}; P.forEach(function(p){ cats[p.c]=(cats[p.c]||0)+1; });
    var nCat=Object.keys(cats).length;
    box.innerHTML=[['100','projects'],[''+nCat,'categories'],['0','ads or trackers'],['∞','times free to use']].map(function(s){ return '<div class="stat"><div class="v">'+s[0]+'</div><div class="k">'+s[1]+'</div></div>'; }).join(''); })();
  function cats(){ var c={}; P.forEach(function(p){ c[p.c]=(c[p.c]||0)+1; }); return c; }
  function renderChips(){ var box=$('catChips'); if(!box) return; var c=cats(); var ids=['all'].concat(Object.keys(c).sort());
    box.innerHTML=ids.map(function(id){ var lab=id==='all'?'All ('+P.length+')':esc(id)+' ('+c[id]+')'; return '<button type="button" class="fchip'+(id===fcat?' active':'')+'" data-c="'+esc(id)+'">'+lab+'</button>'; }).join('');
    box.querySelectorAll('.fchip').forEach(function(b){ b.addEventListener('click',function(){ fcat=b.getAttribute('data-c'); renderChips(); render(); }); }); }
  function pad(n){ return ('00'+n).slice(-3); }
  function render(){ var box=$('plist'); if(!box) return;
    var list=P.filter(function(p){ if(fcat!=='all'&&p.c!==fcat) return false; if(fq){ if((p.t+' '+p.c).toLowerCase().indexOf(fq)<0) return false; } return true; }).sort(function(a,b){ return a.n-b.n; });
    if(!list.length){ box.innerHTML='<p class="note">No projects match. Try another word or category.</p>'; var c0=$('count'); if(c0)c0.textContent=''; return; }
    box.innerHTML=list.map(function(p){ return '<a class="pcard" href="../'+esc(p.s)+'/index.html"><span class="pn">PROJECT '+pad(p.n)+'</span><h4>'+esc(p.t)+'</h4><span class="pc">'+esc(p.c)+'</span></a>'; }).join('');
    var c=$('count'); if(c) c.textContent='Showing '+list.length+' of '+P.length+' projects.'; }
  $('search').addEventListener('input',function(){ fq=this.value.trim().toLowerCase(); render(); });
  $('randomBtn').addEventListener('click',function(){ if(!P.length) return; var p=P[Math.floor(Math.random()*P.length)]; window.location.href='../'+p.s+'/index.html'; });
  renderChips(); render();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 100 script error', e); }
});
