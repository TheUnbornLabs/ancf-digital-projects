/* Project 023 · Ethics Flashcards — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var CATS={args:'Core arguments','consent':'Consent & risk',thinkers:'Thinkers & terms',autonomy:'Autonomy & ethics',related:'Related views'};
  var CARDS=[
    {id:1,cat:'args',term:'Antinatalism',def:'The view that bringing a new person into existence is ethically weighty — in its strong form, always a harm to the one created.'},
    {id:2,cat:'args',term:'The Asymmetry',def:'Benatar\'s claim: absent pain is good even with no one to enjoy it, while absent pleasure is no loss unless someone is deprived.'},
    {id:3,cat:'args',term:'Philanthropic argument',def:'Benatar\'s argument from concern for the created person (the asymmetry), as opposed to harm they may cause others.'},
    {id:4,cat:'args',term:'Misanthropic argument',def:'Benatar\'s separate argument: each new person will also cause significant harm to others over a lifetime.'},
    {id:5,cat:'consent',term:'Consent',def:'Agreement given in advance. Birth is the one act done to a person before they exist to be asked.'},
    {id:6,cat:'consent',term:'Non-identity problem',def:'Parfit\'s puzzle: you may not "harm" a future person by creating them if their only alternative is never existing.'},
    {id:7,cat:'consent',term:'Hypothetical consent',def:'What a rational person would supposedly agree to — a constructed, not actual, agreement.'},
    {id:8,cat:'consent',term:'Risk imposition',def:'Creating a person stakes their whole life on outcomes they never agreed to; a one-shot, uninsurable gamble.'},
    {id:9,cat:'consent',term:'Precautionary principle',def:'When a harm is serious and irreversible, avoid it even at some cost to the possible upside.'},
    {id:10,cat:'thinkers',term:'David Benatar',def:'South African philosopher; "Better Never to Have Been" (2006) gave antinatalism its modern analytic shape.'},
    {id:11,cat:'thinkers',term:'Schopenhauer',def:'19th-c. pessimist; life as blind striving between pain and boredom. A precursor to antinatalism.'},
    {id:12,cat:'thinkers',term:'Zapffe',def:'Norwegian; "The Last Messiah" (1933): consciousness "overshot," producing dread we manage with four defenses.'},
    {id:13,cat:'thinkers',term:'Derek Parfit',def:'"Reasons and Persons" (1984): the non-identity problem and the repugnant conclusion in population ethics.'},
    {id:14,cat:'thinkers',term:'Pollyannaism',def:'Benatar\'s term for our optimism bias — systematically overrating how good our lives are.'},
    {id:15,cat:'thinkers',term:'Hedonic adaptation',def:'The tendency to return to a baseline of feeling after good or bad events — the "treadmill".'},
    {id:16,cat:'autonomy',term:'Reproductive autonomy',def:'The right and real ability to decide whether, when, and how to have children — including none.'},
    {id:17,cat:'autonomy',term:'Bodily autonomy',def:'Decisions acting on a person\'s own body belong first to that person — the deepest root of the principle.'},
    {id:18,cat:'autonomy',term:'Pronatalism',def:'The cultural and structural set of assumptions and pressures that treat parenthood as the default path.'},
    {id:19,cat:'autonomy',term:'Procreative beneficence',def:'Savulescu\'s idea: if having a child, a duty to select for the best life — about WHICH child, not WHETHER.'},
    {id:20,cat:'autonomy',term:'Naturalistic fallacy',def:'Inferring "ought" from "is" — that because something is natural or common, it is therefore right or required.'},
    {id:21,cat:'related',term:'Negative utilitarianism',def:'The view that reducing suffering takes priority over promoting happiness.'},
    {id:22,cat:'related',term:'Childfree vs childless',def:'Childfree = not having children by choice; childless usually = wanting but not having them.'},
    {id:23,cat:'related',term:'VHEMT',def:'The Voluntary Human Extinction Movement (1991): voluntary, non-coercive non-reproduction for the biosphere.'},
    {id:24,cat:'related',term:'Reproductive justice',def:'A framework (coined 1994) for the right to have a child, to not have one, and to parent in safe conditions.'}
  ];
  var known = (A.getJSON?A.getJSON('known',{}):{}) || {};
  function isK(id){ return !!known[id]; }
  function setK(id,v){ known[id]=v; if(A.setJSON) A.setJSON('known',known); }

  var activeCat='all';
  (function(){ var chips=$('catChips'); if(!chips) return;
    var arr=[{k:'all',l:'All'}].concat(Object.keys(CATS).map(function(k){ return {k:k,l:CATS[k]}; }));
    chips.innerHTML=arr.map(function(c){ return '<span class="chip2'+(c.k==='all'?' active':'')+'" data-k="'+c.k+'" role="button" tabindex="0">'+esc(c.l)+'</span>'; }).join('');
    chips.querySelectorAll('.chip2').forEach(function(c){ function sel(){ activeCat=c.getAttribute('data-k'); chips.querySelectorAll('.chip2').forEach(function(x){x.classList.remove('active');}); c.classList.add('active'); renderDeck(); } c.addEventListener('click',sel); c.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();sel();} }); });
  })();

  function renderDeck(){
    var box=$('deckGrid'); if(!box) return;
    var shown=CARDS.filter(function(c){ return activeCat==='all'||c.cat===activeCat; });
    box.innerHTML=shown.map(function(c){ return '<div class="fc'+(isK(c.id)?' known':'')+'" data-id="'+c.id+'" tabindex="0"><span class="know" data-id="'+c.id+'">'+(isK(c.id)?'✓ known':'mark')+'</span><div class="inner"><div class="face front"><b>'+esc(c.term)+'</b><span class="cat">'+esc(CATS[c.cat])+'</span></div><div class="face back">'+esc(c.def)+'</div></div></div>'; }).join('');
    box.querySelectorAll('.fc').forEach(function(el){
      function flip(e){ if(e&&e.target&&e.target.classList.contains('know')) return; el.classList.toggle('flipped'); }
      el.addEventListener('click',flip);
      el.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); el.classList.toggle('flipped'); } });
    });
    box.querySelectorAll('.know').forEach(function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); var id=+b.getAttribute('data-id'); setK(id,!isK(id)); renderDeck(); updateProg(); }); });
    updateProg();
  }
  function updateProg(){ var n=CARDS.filter(function(c){return isK(c.id);}).length; var bar=$('deckBar'); if(bar) bar.style.width=Math.round(n/CARDS.length*100)+'%'; var cnt=$('deckCount'); if(cnt) cnt.textContent=n+' / '+CARDS.length+' known'; }
  $('resetKnown') && $('resetKnown').addEventListener('click',function(){ if(!window.confirm('Reset all "known" marks?'))return; known={}; if(A.setJSON)A.setJSON('known',known); renderDeck(); });
  renderDeck();

  /* study mode */
  (function(){
    var area=$('studyArea'); if(!area) return;
    var queue=[], idx=0, flipped=false, right=0;
    function start(onlyUnknown){ queue=CARDS.filter(function(c){ return !onlyUnknown || !isK(c.id); }); queue=queue.sort(function(){return Math.random()-0.5;}); idx=0; right=0; flipped=false; if(!queue.length){ area.innerHTML='<div class="study"><p class="done">Nothing to study — every card is marked known. 🎉</p></div>'; return; } render(); }
    function render(){
      if(idx>=queue.length){ area.innerHTML='<div class="study"><p class="done">Session complete!</p><p class="meta">You recalled '+right+' of '+queue.length+'. The deck above remembers what you marked known.</p><div class="btn-row" style="justify-content:center"><button class="btn btn-primary" id="stRestart" type="button">Study again</button></div></div>'; $('stRestart').addEventListener('click',function(){ start(false); }); return; }
      var c=queue[idx];
      area.innerHTML='<div class="study"><p class="meta">Card '+(idx+1)+' of '+queue.length+'</p>'+
        '<div class="scard" id="stCard">'+(flipped?('<span class="cat">'+esc(CATS[c.cat])+'</span><span class="def">'+esc(c.def)+'</span>'):('<span class="term">'+esc(c.term)+'</span><span class="hint">tap to reveal the definition</span>'))+'</div>'+
        (flipped?'<div class="btn-row" style="justify-content:center"><button class="btn btn-primary" id="stKnew" type="button">I knew it ✓</button><button class="btn" id="stReview" type="button">Review again</button></div>':'<div class="btn-row" style="justify-content:center"><button class="btn" id="stFlip" type="button">Flip</button></div>')+'</div>';
      $('stCard').addEventListener('click',function(){ flipped=true; render(); });
      if($('stFlip')) $('stFlip').addEventListener('click',function(){ flipped=true; render(); });
      if($('stKnew')) $('stKnew').addEventListener('click',function(){ setK(c.id,true); right++; idx++; flipped=false; render(); updateProg(); renderDeck(); });
      if($('stReview')) $('stReview').addEventListener('click',function(){ idx++; flipped=false; render(); });
    }
    $('studyAll') && $('studyAll').addEventListener('click',function(){ start(false); });
    $('studyUnknown') && $('studyUnknown').addEventListener('click',function(){ start(true); });
  })();

  (function(){
    var Q=[{a:0},{a:0},{a:0}], E=['The asymmetry is David Benatar\'s (2006).','The non-identity problem is Derek Parfit\'s (1984).','Childfree implies the absence of children is by choice.'];
    var picks={}, total=document.querySelectorAll('#quizbox .quiz-q').length;
    if(A.initOptions) A.initOptions($('quizbox'),function(q,i){ picks[q]=+i; });
    var sB=$('quizScore'), rB=$('quizReset'), res=$('quizResult');
    if(sB) sB.addEventListener('click',function(){ if(Object.keys(picks).length<total){ res.style.display='block'; res.textContent='Pick an answer for all '+total+' questions first.'; return; }
      var sc=0; Q.forEach(function(it,i){ document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){ var j=+x.getAttribute('data-i'); x.classList.remove('ok','no'); if(j===it.a)x.classList.add('ok'); else if(j===picks[i])x.classList.add('no'); }); var ex=document.querySelector('.explain[data-q="'+i+'"]'); if(ex){ ex.style.display='block'; ex.textContent=E[i]; } if(picks[i]===it.a)sc++; });
      res.style.display='block'; res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.'; if(rB) rB.style.display='inline-block'; });
    if(rB) rB.addEventListener('click',function(){ picks={}; document.querySelectorAll('#quizbox .opt').forEach(function(x){ x.classList.remove('sel','ok','no'); }); document.querySelectorAll('#quizbox .explain').forEach(function(ex){ ex.style.display='none'; ex.textContent=''; }); res.style.display='none'; rB.style.display='none'; });
  })();
  (function(){
    var ta=$('r1'), status=$('saveStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('saveBtn'),cl=$('clearBtn');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 023 script error', e); }
});
