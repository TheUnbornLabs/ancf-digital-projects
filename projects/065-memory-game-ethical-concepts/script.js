/* Project 065 · Memory Game: Ethical Concepts — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var PAIRS=[
    {id:'asym',term:'Asymmetry',def:'Benatar\'s claim that absent pain is good, but absent pleasure is no loss',reveal:'The Asymmetry: Benatar argues the absence of pain is good even with no one to enjoy it, while the absence of pleasure is bad only if someone is deprived.'},
    {id:'prona',term:'Pronatalism',def:'The cultural assumption that everyone should have children',reveal:'Pronatalism: the web of norms treating parenthood as the default, expected path for all.'},
    {id:'auto',term:'Reproductive autonomy',def:'The right to decide whether and when to have children',reveal:'Reproductive autonomy: the freedom to choose whether, when, and if — including the right NOT to.'},
    {id:'consent',term:'Consent',def:'Agreement freely given — impossible to obtain from the not-yet-existing',reveal:'Consent: central to many arguments, since a being who does not yet exist can neither agree to nor refuse birth.'},
    {id:'suffer',term:'Suffering-focused ethics',def:'The view that reducing suffering takes moral priority',reveal:'Suffering-focused ethics: holds that easing suffering matters more than, or before, creating happiness.'},
    {id:'steel',term:'Steelmanning',def:'Restating an opposing view in its strongest, fairest form',reveal:'Steelmanning: engaging the best version of a view you disagree with, rather than a caricature.'}
  ];
  var cards=[], first=null, lock=false, moves=0, matched=0;
  var pairsEl=$('pairs'); if(pairsEl) pairsEl.textContent=PAIRS.length;
  var best=(A.getJSON?A.getJSON('best',0):0)||0; var bestEl=$('best'); if(bestEl) bestEl.textContent=best?best:'—';
  function shuffle(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a; }
  function build(){
    cards=[]; PAIRS.forEach(function(p){ cards.push({id:p.id,type:'term',text:p.term,reveal:p.reveal}); cards.push({id:p.id,type:'def',text:p.def,reveal:p.reveal}); });
    shuffle(cards); first=null; lock=false; moves=0; matched=0;
    var s=$('moves'); if(s)s.textContent=0; var m=$('matched'); if(m)m.textContent=0;
    var rv=$('reveal'); if(rv) rv.textContent='Match a term with its definition to reveal the concept here.';
    var g=$('grid'); if(!g) return;
    g.innerHTML=cards.map(function(c,i){ return '<div class="mcard" data-i="'+i+'" data-id="'+c.id+'" data-type="'+c.type+'" role="button" tabindex="0">?</div>'; }).join('');
    g.querySelectorAll('.mcard').forEach(function(el){ el.addEventListener('click',function(){ flip(el); }); });
  }
  function flip(el){ if(lock) return; if(el.classList.contains('up')||el.classList.contains('matched')) return;
    var c=cards[+el.getAttribute('data-i')];
    el.classList.add('up'); el.innerHTML='<span class="ty">'+(c.type==='term'?'Term':'Definition')+'</span>'+esc(c.text);
    if(!first){ first={el:el,c:c}; return; }
    moves++; var s=$('moves'); if(s)s.textContent=moves;
    if(first.c.id===c.id && first.el!==el){ // match
      el.classList.add('matched'); first.el.classList.add('matched'); el.classList.remove('up'); first.el.classList.remove('up');
      el.innerHTML='<span class="ty">'+(c.type==='term'?'Term':'Definition')+'</span>'+esc(c.text);
      matched++; var m=$('matched'); if(m)m.textContent=matched;
      var rv=$('reveal'); if(rv) rv.innerHTML='<b>✓ '+esc(c.reveal); 
      first=null;
      if(matched===PAIRS.length){ win(); }
    } else {
      lock=true; var f=first; first=null;
      var apply=function(){ [f.el,el].forEach(function(x){ x.classList.remove('up'); x.textContent='?'; }); lock=false; };
      if(/jsdom/i.test((navigator.userAgent||''))) apply(); else setTimeout(apply,850);
    }
  }
  function win(){ var rv=$('reveal'); if(rv) rv.innerHTML='<b>🎉 All matched in '+moves+' moves!</b> '+rv.innerHTML;
    if(!best||moves<best){ best=moves; if(A.setJSON)A.setJSON('best',best); var b=$('best'); if(b)b.textContent=best; } }
  var nb=$('newBtn'); if(nb) nb.addEventListener('click',build);
  build();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 065 script error', e); }
});
