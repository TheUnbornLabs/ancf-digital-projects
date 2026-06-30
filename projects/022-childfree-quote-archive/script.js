/* Project 022 · Childfree Quote Archive — interactive logic. All texts ORIGINAL. */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var THEMES={peace:'Peace',freedom:'Freedom',identity:'Identity',relationships:'Relationships',purpose:'Purpose',boundaries:'Boundaries',joy:'Joy',selftrust:'Self-trust'};
  var P=[
    {id:1,theme:'selftrust',text:'I know my own mind, and I am allowed to trust it.'},
    {id:2,theme:'freedom',text:'My open future is not empty — it is mine to fill.'},
    {id:3,theme:'peace',text:'I do not owe anyone an explanation for the shape of my life.'},
    {id:4,theme:'identity',text:'I am whole exactly as I am, with no one missing from the picture.'},
    {id:5,theme:'relationships',text:'My family is the love I share, not a quota I fill.'},
    {id:6,theme:'purpose',text:'My life can matter in a hundred ways that have nothing to do with passing on my name.'},
    {id:7,theme:'boundaries',text:'"It isn\'t for me" is a complete and kind answer.'},
    {id:8,theme:'joy',text:'My quiet mornings are not a lack; they are a life I chose.'},
    {id:9,theme:'selftrust',text:'A choice I have examined is one I can stand in, whatever others say.'},
    {id:10,theme:'freedom',text:'I get to author my days, and that is a gift I refuse to waste.'},
    {id:11,theme:'peace',text:'I can love the people who question me and still hold my line.'},
    {id:12,theme:'identity',text:'Womanhood, manhood, adulthood — none of them come with a reproductive quota.'},
    {id:13,theme:'relationships',text:'I can pour deep care into the children already in my life.'},
    {id:14,theme:'purpose',text:'I leave my mark in ideas, kindness, and the people I help — not only in DNA.'},
    {id:15,theme:'boundaries',text:'I can disappoint someone\'s hope without having wronged them.'},
    {id:16,theme:'joy',text:'There is so much to love in a life that is fully, freely my own.'},
    {id:17,theme:'selftrust',text:'My certainty is not a phase, and my doubts, when they come, are just weather.'},
    {id:18,theme:'freedom',text:'I am not running from a life; I am running toward the one that fits me.'},
    {id:19,theme:'peace',text:'I release the comments that were never really about me.'},
    {id:20,theme:'identity',text:'I am not incomplete. I am not "yet." I am here, and I am enough.'},
    {id:21,theme:'relationships',text:'The right people love me for my choices, not in spite of them.'},
    {id:22,theme:'purpose',text:'I can give the world my attention, my work, and my heart — generously and on my own terms.'},
    {id:23,theme:'boundaries',text:'I can change the subject with a smile and keep my peace intact.'},
    {id:24,theme:'joy',text:'Rest, freedom, and time are not luxuries I must apologise for.'},
    {id:25,theme:'selftrust',text:'I would rather choose honestly than perform a life for approval.'},
    {id:26,theme:'freedom',text:'My time is mine to spend on depth, not just on busyness.'},
    {id:27,theme:'purpose',text:'A meaningful life looks different for different people, and mine is allowed to look like this.'},
    {id:28,theme:'peace',text:'I plan for my future with care, and I meet it without fear.'}
  ];
  var favs = (A.getJSON?A.getJSON('favs',[]):[]) || [];
  function isFav(id){ return favs.indexOf(id)>-1; }
  function toggleFav(id){ var i=favs.indexOf(id); if(i>-1) favs.splice(i,1); else favs.push(id); if(A.setJSON) A.setJSON('favs',favs); }

  var current=null;
  function draw(){ current=P[Math.floor(Math.random()*P.length)]; renderFeatured(); }
  function renderFeatured(){ var f=$('featured'); if(!f||!current) return; f.innerHTML='<p class="qt">'+esc(current.text)+'</p><p class="qm">'+esc(THEMES[current.theme])+'</p>'; var fb=$('featFav'); if(fb) fb.textContent=isFav(current.id)?'★ Saved':'☆ Save'; }
  $('drawBtn') && $('drawBtn').addEventListener('click',draw);
  $('featCopy') && $('featCopy').addEventListener('click',function(){ if(current&&A.copy) A.copy(current.text,$('featCopy')); });
  $('featFav') && $('featFav').addEventListener('click',function(){ if(current){ toggleFav(current.id); renderFeatured(); render(); } });
  draw();

  var activeTheme='all', term='';
  (function(){
    var chips=$('themeChips'); if(!chips) return;
    var arr=[{k:'all',l:'All'},{k:'fav',l:'★ Favourites'}].concat(Object.keys(THEMES).map(function(k){ return {k:k,l:THEMES[k]}; }));
    chips.innerHTML=arr.map(function(c){ return '<span class="chip2'+(c.k==='all'?' active':'')+'" data-k="'+c.k+'" role="button" tabindex="0">'+esc(c.l)+'</span>'; }).join('');
    chips.querySelectorAll('.chip2').forEach(function(c){ function sel(){ activeTheme=c.getAttribute('data-k'); chips.querySelectorAll('.chip2').forEach(function(x){x.classList.remove('active');}); c.classList.add('active'); render(); } c.addEventListener('click',sel); c.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();sel();} }); });
    var se=$('qSearch'); if(se) se.addEventListener('input',function(){ term=se.value.toLowerCase().trim(); render(); });
  })();
  function matches(q){ if(activeTheme==='fav'){ if(!isFav(q.id)) return false; } else if(activeTheme!=='all' && q.theme!==activeTheme) return false; if(!term) return true; return (q.text+' '+THEMES[q.theme]).toLowerCase().indexOf(term)>-1; }
  function render(){
    var box=$('qCards'); if(!box) return;
    var shown=P.filter(matches);
    if($('qCount')) $('qCount').textContent=shown.length+' of '+P.length+' affirmations'+(activeTheme!=='all'&&activeTheme!=='fav'?(' · '+THEMES[activeTheme]):'')+(activeTheme==='fav'?' · favourites':'')+(term?(' · "'+term+'"'):'');
    if(!shown.length){ box.innerHTML='<p class="qempty">'+(activeTheme==='fav'?'No favourites yet — tap ☆ on any line to save it.':'No affirmations match that search.')+'</p>'; return; }
    box.innerHTML=shown.map(function(q){ return '<div class="qcard"><p class="qt">'+esc(q.text)+'</p><div class="qm"><span class="theme">'+esc(THEMES[q.theme])+'</span><span class="spacer" style="flex:1"></span><span class="acts"><button type="button" class="fav'+(isFav(q.id)?' on':'')+'" data-id="'+q.id+'">'+(isFav(q.id)?'★':'☆')+'</button><button type="button" class="cpy" data-id="'+q.id+'">Copy</button></span></div></div>'; }).join('');
    box.querySelectorAll('.fav').forEach(function(b){ b.addEventListener('click',function(){ toggleFav(+b.getAttribute('data-id')); render(); renderFeatured(); }); });
    box.querySelectorAll('.cpy').forEach(function(b){ b.addEventListener('click',function(){ var q=P.filter(function(x){return x.id===+b.getAttribute('data-id');})[0]; if(q&&A.copy) A.copy(q.text,b); }); });
  }
  render();

  /* builder */
  (function(){
    var OPEN=['My life is','I am','I choose','I trust that I am','Today, I am','I give myself permission to be'];
    var CORE={
      'free and unhurried':'free','whole and enough, exactly as I am':'whole','at peace with the path I\'ve chosen':'peace','building a life that is fully my own':'building','generous with my time and my heart':'generous','steady, whatever others may ask':'steady','allowed to want a different kind of life':'allowed','grateful for the freedom I hold':'grateful'};
    var bo=$('bOpen'), bc=$('bCore'), out=$('affOut');
    if(!bo) return;
    bo.innerHTML=OPEN.map(function(o){ return '<option>'+esc(o)+'</option>'; }).join('');
    bc.innerHTML=Object.keys(CORE).map(function(c){ return '<option>'+esc(c)+'</option>'; }).join('');
    function build(){ var t=bo.value+' '+bc.value+'.'; t=t.charAt(0).toUpperCase()+t.slice(1); out.textContent=t; }
    [bo,bc].forEach(function(s){ s.addEventListener('change',build); });
    var keys=Object.keys(CORE);
    $('affGen').addEventListener('click',function(){ bo.selectedIndex=Math.floor(Math.random()*OPEN.length); bc.selectedIndex=Math.floor(Math.random()*keys.length); build(); });
    $('affCopy').addEventListener('click',function(){ if(A.copy) A.copy(out.textContent,$('affCopy')); });
    $('affSave').addEventListener('click',function(){ var t=out.textContent; var custom=A.getJSON?A.getJSON('custom',[]):[]; custom=custom||[]; if(custom.indexOf(t)<0) custom.push(t); if(A.setJSON) A.setJSON('custom',custom); var b=$('affSave'); var o=b.textContent; b.textContent='Saved ✓'; setTimeout(function(){b.textContent=o;},1400); });
    build();
  })();

  (function(){
    var Q=[{a:1},{a:1}], E=['They\'re original lines written for this project, not famous quotations.','An affirmation works best as a gentle, honest reminder that genuinely resonates with you.'];
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
    var s=$('saveBtn'),cp=$('copyBtn'),cl=$('clearBtn');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
    if(cp) cp.addEventListener('click',function(){ var sel=P.filter(function(q){return isFav(q.id);}); var custom=(A.getJSON?A.getJSON('custom',[]):[])||[]; var L=['My favourite affirmations','']; sel.forEach(function(q){ L.push('• '+q.text); }); custom.forEach(function(t){ L.push('• '+t+' (mine)'); }); if(!sel.length&&!custom.length) L.push('(none saved yet)'); if(A.copy) A.copy(L.join('\n'),cp); });
  })();
} catch(e){ console.error('project 022 script error', e); }
});
