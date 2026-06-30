/* Project 041 · Pronatalist Phrase Translator — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var CATS={timing:'Timing',legacy:'Legacy',worth:'Worth & selfishness',future:'Fear of the future',nature:'"Natural" & duty'};
  var P=[
    {cat:'timing',phrase:"You'll change your mind",keys:['change your mind','change ur mind','youll change','come around'],really:'I can\'t imagine being sure of this, so I\'ll treat your decision as temporary.',assume:'That you don\'t truly know yourself, and a clear "no" is just a phase.',reply:'I\'ve thought about it carefully and I\'m at peace with it. People can be just as sure of wanting children, and we don\'t doubt them.'},
    {cat:'timing',phrase:"Your clock is ticking",keys:['clock is ticking','biological clock','tick','not getting younger','running out of time'],really:'Time is short, so you should decide the way I\'d decide.',assume:'That there\'s one right window for everyone and your worth depends on beating it.',reply:'My timing is mine to set. Any real fertility questions are between me and a doctor, not the dinner table.'},
    {cat:'legacy',phrase:"Who'll give us grandchildren?",keys:['grandchild','grandkid','grandbab','grand-bab'],really:'I have a wish to be a grandparent and I\'m placing it on you.',assume:'That your body and plans exist to fulfil someone else\'s wish.',reply:'I know you\'d love that, and I understand. It isn\'t in my plans — and that\'s mine to decide.'},
    {cat:'legacy',phrase:"Who'll carry on the family name?",keys:['family name','carry on the family','family line','bloodline','pass on the name'],really:'A life only counts if it\'s biologically continued.',assume:'That a name matters more than the person, and DNA is the only legacy.',reply:'Plenty of meaningful lives leave nothing genetic and everything else — ideas, care, kindness. Legacy is broader than a surname.'},
    {cat:'worth',phrase:"Isn't that selfish?",keys:['selfish','self-centred','self centered','all about you'],really:'Someone is being deprived by your choice.',assume:'That not having a child takes something from a person — but no one is being deprived.',reply:'There\'s no one being shortchanged here. Choosing the life that honestly fits me isn\'t selfish to anyone.'},
    {cat:'worth',phrase:"A family isn't complete without kids",keys:['complete without','not a real family','start a family','complete family','real family'],really:'You\'re not a real family until a child arrives.',assume:'That a couple or a person is incomplete until they reproduce.',reply:'Two people who love each other are already a family. Wholeness isn\'t something a child is required to deliver.'},
    {cat:'future',phrase:"Who'll care for you when you're old?",keys:['care for you','look after you','when you\'re old','old age','die alone','end up alone','lonely when'],really:'Children are an insurance policy, and you\'ll regret skipping it.',assume:'That kids guarantee care, and the childfree face a lonely end.',reply:'Children are no guarantee of care, and I\'d rather plan my later years thoughtfully than create a person to insure against loneliness.'},
    {cat:'future',phrase:"You'll regret it",keys:['regret','youll be sorry','you\'ll be sorry','wish you had'],really:'I\'m sure future-you will feel as I do.',assume:'That regret runs only one way, and your future feelings are mine to predict.',reply:'Maybe I will, maybe I won\'t — either way, that\'s exactly why I want to choose deliberately rather than by default.'},
    {cat:'nature',phrase:"It's only natural",keys:['only natural','it\'s natural','its natural','what we\'re made for','meant to','nature intended'],really:'Because it\'s common in nature, you owe it.',assume:'That whatever is natural is therefore a duty everyone must perform.',reply:'Lots of things are natural without being required. What evolution made common doesn\'t settle what I should do with one life.'},
    {cat:'nature',phrase:"It's different when it's your own",keys:['different when it\'s your own','your own kid','your own child','once you have your own'],really:'You can\'t know your feelings, so your "no" doesn\'t count.',assume:'That a future feeling you\'re told you\'ll have should decide this for you.',reply:'It might well be different — which is exactly why I\'d rather choose deliberately than leap because someone promised the magic would kick in.'}
  ];
  var current=null;
  function norm(s){ return (s||'').toLowerCase().replace(/[^a-z' ]/g,' ').replace(/\s+/g,' ').trim(); }
  function match(q){ q=norm(q); if(!q) return null; var best=null,bestScore=0;
    P.forEach(function(p){ var sc=0; p.keys.forEach(function(k){ if(q.indexOf(norm(k))>=0) sc+=norm(k).length; }); if(norm(p.phrase).indexOf(q)>=0||q.indexOf(norm(p.phrase))>=0) sc+=5;
      if(sc>bestScore){ bestScore=sc; best=p; } });
    return bestScore>0?best:null; }
  function show(p,note){
    current=p; var box=$('trOut'); if(!box) return;
    if(!p){ box.innerHTML='<p class="note">No close match found. Try a few key words (e.g. "selfish", "grandchildren", "regret"), or pick one from the library below.</p>'; current=null; return; }
    box.innerHTML=(note?'<p class="outmeta">'+esc(note)+'</p>':'')+
      '<div class="row"><span class="lbl">The phrase</span><div class="val">"'+esc(p.phrase)+'"</div></div>'+
      '<div class="row"><span class="lbl">What it really means</span><div class="val">'+esc(p.really)+'</div></div>'+
      '<div class="row"><span class="lbl">The hidden assumption</span><div class="val">'+esc(p.assume)+'</div></div>'+
      '<div class="row"><span class="lbl">A kind, clear reply</span><div class="val reply">'+esc(p.reply)+'</div></div>';
  }
  $('trBtn').addEventListener('click',function(){ var p=match($('trIn').value); show(p, p?'Closest match:':null); });
  $('trIn').addEventListener('keydown',function(e){ if(e.key==='Enter'){ var p=match($('trIn').value); show(p,p?'Closest match:':null); } });
  $('copyBtn').addEventListener('click',function(){ if(current&&A.copy) A.copy(current.reply,$('copyBtn')); });

  /* library */
  var fcat='all',fq='';
  function renderChips(){ var box=$('catChips'); if(!box) return; var cats=['all'].concat(Object.keys(CATS));
    box.innerHTML=cats.map(function(c){ return '<button type="button" class="fchip'+(c===fcat?' active':'')+'" data-c="'+c+'">'+(c==='all'?'All':esc(CATS[c]))+'</button>'; }).join('');
    box.querySelectorAll('.fchip').forEach(function(b){ b.addEventListener('click',function(){ fcat=b.getAttribute('data-c'); renderChips(); renderLib(); }); }); }
  function renderLib(){ var box=$('libList'); if(!box) return;
    var list=P.filter(function(p){ if(fcat!=='all'&&p.cat!==fcat) return false; if(fq){ if((p.phrase+' '+p.assume+' '+p.reply).toLowerCase().indexOf(fq)<0) return false; } return true; });
    box.innerHTML=list.map(function(p){ var i=P.indexOf(p); return '<div class="phrase-item" data-i="'+i+'">"'+esc(p.phrase)+'"<span class="a">'+esc(CATS[p.cat])+' — tap to translate</span></div>'; }).join('');
    box.querySelectorAll('.phrase-item').forEach(function(el){ el.addEventListener('click',function(){ var p=P[+el.getAttribute('data-i')]; show(p,null); var t=$('translate'); if(t&&t.scrollIntoView) t.scrollIntoView({behavior:'smooth',block:'start'}); }); });
    var c=$('libCount'); if(c) c.textContent='Showing '+list.length+' of '+P.length+' phrases.'; }
  $('libSearch').addEventListener('input',function(){ fq=this.value.trim().toLowerCase(); renderLib(); });

  /* favourites */
  var favs=(A.getJSON?A.getJSON('favs',[]):[])||[];
  function renderFavs(){ var box=$('favs'); if(!box) return; if(!favs.length){ box.innerHTML='<p class="note">No saved replies yet — translate a phrase and tap ☆ Save.</p>'; return; }
    box.innerHTML=favs.map(function(t,i){ return '<div class="favrow"><span>'+esc(t)+'</span><button type="button" class="cp" data-i="'+i+'">Copy</button><button type="button" data-i="'+i+'" aria-label="Remove">×</button></div>'; }).join('');
    box.querySelectorAll('.cp').forEach(function(b){ b.addEventListener('click',function(){ if(A.copy) A.copy(favs[+b.getAttribute('data-i')],b); }); });
    box.querySelectorAll('button:not(.cp)').forEach(function(b){ b.addEventListener('click',function(){ favs.splice(+b.getAttribute('data-i'),1); if(A.setJSON)A.setJSON('favs',favs); renderFavs(); }); }); }
  $('saveBtn').addEventListener('click',function(){ if(current&&favs.indexOf(current.reply)<0){ favs.push(current.reply); if(A.setJSON)A.setJSON('favs',favs); renderFavs(); } });

  renderChips(); renderLib(); renderFavs(); show(P[0],'Example:');

  (function(){
    var Q=[{a:0},{a:0}], E=['Translating a phrase is about seeing its assumption so it has less grip — not winning.','Most pressure phrases are well-meant but rest on an unexamined assumption.'];
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
    var s=$('rSave'),cl=$('rClear');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 041 script error', e); }
});
