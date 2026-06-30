/* Project 089 · Respectful Language Guide — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var CATS={parents:'About parents',childfree:'About the childfree',debate:'In debate',groups:'About groups',self:'Self-talk'};
  var SW=[
    {c:'parents',bad:'"Breeders."',good:'"People who have children" / "parents."',why:'Slurs for parents poison the well and make your view easy to dismiss. Plain description keeps you credible.'},
    {c:'parents',bad:'"You only had kids because you\'re selfish."',good:'"I think the reasons people have children deserve real examination."',why:'Aims at the question, not the person\'s character.'},
    {c:'parents',bad:'"Sheeple who never questioned it."',good:'"Many people follow the default without examining it — most of us do, about something."',why:'Contempt invites defensiveness; shared humility invites reflection.'},
    {c:'childfree',bad:'"I\'m childfree, unlike those baby-obsessed people."',good:'"I\'m childfree, and I respect that others choose differently."',why:'You can affirm your path without putting anyone else\'s down.'},
    {c:'childfree',bad:'"Normal people get this; parents never will."',good:'"This resonates with a lot of childfree people; others may see it differently."',why:'Avoids an us-vs-them frame that shuts down listening.'},
    {c:'debate',bad:'"That\'s a stupid argument."',good:'"I think that argument has a gap — here\'s where."',why:'Critique the reasoning, not the intelligence of the person.'},
    {c:'debate',bad:'"You clearly haven\'t thought about this."',good:'"Have you considered X? I\'d be curious how you\'d answer it."',why:'Turns an accusation into an invitation.'},
    {c:'debate',bad:'"Anyone who disagrees is a hypocrite."',good:'"I find this position hard to square with X — help me understand."',why:'Names the tension without branding people.'},
    {c:'groups',bad:'"That community is backward about this."',good:'"This particular custom is worth challenging, wherever it appears."',why:'Targets the behaviour or norm, never a caste, community, or faith.'},
    {c:'groups',bad:'"Those people all think the same."',good:'"Some people hold this view; many in the same group don\'t."',why:'Resists the stereotype; most groups contain real diversity.'},
    {c:'groups',bad:'"It\'s their religion\'s fault."',good:'"Some interpretations treat childbearing as compulsory — and many believers question that."',why:'Critiques an idea within a tradition, not the tradition or its people wholesale.'},
    {c:'self',bad:'"There\'s something wrong with me for not wanting this."',good:'"Wanting a different life than the default isn\'t a defect."',why:'Even self-talk deserves the kindness you\'d offer a friend.'},
    {c:'self',bad:'"I\'m being selfish."',good:'"I\'m choosing honestly, and that harms no one."',why:'Replaces a shaming label with an accurate description.'},
    {c:'self',bad:'"Everyone else manages, so I\'m the problem."',good:'"Different people need different lives. Mine is allowed to be different."',why:'Swaps comparison-as-evidence for self-respect.'}
  ];
  var fcat='all',fq='';
  function renderChips(){ var box=$('catChips'); if(!box) return; var cats=['all'].concat(Object.keys(CATS));
    box.innerHTML=cats.map(function(c){ return '<button type="button" class="fchip'+(c===fcat?' active':'')+'" data-c="'+c+'">'+(c==='all'?'All':esc(CATS[c]))+'</button>'; }).join('');
    box.querySelectorAll('.fchip').forEach(function(b){ b.addEventListener('click',function(){ fcat=b.getAttribute('data-c'); renderChips(); render(); }); }); }
  function render(){ var box=$('swapBox'); if(!box) return;
    var list=SW.filter(function(s){ if(fcat!=='all'&&s.c!==fcat) return false; if(fq){ if((s.bad+' '+s.good+' '+s.why).toLowerCase().indexOf(fq)<0) return false; } return true; });
    if(!list.length){ box.innerHTML='<p class="note">No matches — try another word or filter.</p>'; var c0=$('count'); if(c0)c0.textContent=''; return; }
    box.innerHTML=list.map(function(s){ var i=SW.indexOf(s); return '<div class="sw"><span class="lbl">Instead of</span><div class="bad">'+esc(s.bad)+'</div><span class="lbl" style="margin-top:6px">Try</span><div class="good">'+esc(s.good)+'</div><div class="why">'+esc(s.why)+'</div><button type="button" class="cp" data-i="'+i+'">Copy the kinder version</button></div>'; }).join('');
    box.querySelectorAll('.cp').forEach(function(b){ b.addEventListener('click',function(){ if(A.copy) A.copy(SW[+b.getAttribute('data-i')].good,b); }); });
    var c=$('count'); if(c) c.textContent='Showing '+list.length+' of '+SW.length+' swaps.'; }
  $('search').addEventListener('input',function(){ fq=this.value.trim().toLowerCase(); render(); });
  renderChips(); render();
  (function(){ var box=$('whyCards'); if(!box) return;
    var C=[['Heard beats right','The kindest phrasing is the one that actually lands. Contempt makes people defend; warmth makes them consider.'],['Ideas, not identities','Aiming at arguments rather than people keeps you honest and keeps the door open. It\'s also simply fairer.'],['Your dignity, too','Kind words protect your own self-respect as much as the listener\'s. You never have to choose between firm and decent.']];
    box.innerHTML=C.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 089 script error', e); }
});
