/* Project 021 · Antinatalist Quote Archive — interactive logic. All texts are ORIGINAL prompts. */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var THEMES={asymmetry:'The asymmetry',consent:'Consent',suffering:'Suffering & risk',pessimism:'Philosophical pessimism',compassion:'Compassion & care',meaning:'Meaning',eastern:'Eastern currents',ecological:'Ecological',autonomy:'Autonomy'};
  var THEME_DESC={asymmetry:'Why a missing harm can count as good while a missing pleasure costs no one.',consent:'The one decision made for a person before they exist to be asked.',suffering:'Every life risks pain that cannot be agreed to in advance.',pessimism:'The long tradition that takes life\'s hardness seriously.',compassion:'Concern for the not-yet-born as a form of care, not coldness.',meaning:'Whether meaning answers the question, or sits beside it.',eastern:'Resonances in Buddhist and Jain thought about craving and release.',ecological:'Weighing a new life against finite shared resources.',autonomy:'The freedom to question birth rather than assume it.'};
  var P=[
    {id:1,theme:'asymmetry',src:'after Benatar',text:'A harm that never happens is a quiet good — even with no one there to enjoy it. A joy that never happens is a loss to no one, because no one is missing it.'},
    {id:2,theme:'asymmetry',src:'after Benatar',text:'We feel for the suffering that fills the world, yet never grieve the empty lands where no happy people were ever born. Sit with why those feel different.'},
    {id:3,theme:'consent',src:'after Shiffrin',text:'Almost everything we do to a person, we ask them first. Birth is the lone exception — done to someone before there is a someone to ask.'},
    {id:4,theme:'consent',src:'after Shiffrin',text:'A gift can be real and still arrive uninvited, bundled with a weight the receiver never agreed to carry.'},
    {id:5,theme:'suffering',src:'study prompt',text:'To create a life is to place a one-time bet, with someone else\'s whole existence as the stake, on dice they will never get to refuse.'},
    {id:6,theme:'suffering',src:'study prompt',text:'However well a life goes, no one can promise it will be spared. What would it take to make that gamble fair to the one who must live it?'},
    {id:7,theme:'pessimism',src:'after Schopenhauer',text:'Wanting is restlessness; getting is brief; then wanting returns. Notice how rarely the ledger of striving settles in our favour.'},
    {id:8,theme:'pessimism',src:'after Zapffe',text:'A mind that craves meaning and justice was set loose in a universe that offers neither on demand. Much of culture is the art of not looking at that gap.'},
    {id:9,theme:'pessimism',src:'after Cioran',text:'Of all the mornings a person opens their eyes to, the first — the very fact of having been started — is the one they were never consulted about.'},
    {id:10,theme:'pessimism',src:'after Mainländer',text:'Some have wondered whether the deepest current in things runs not toward more, but toward rest. A dark thought, worth examining rather than fleeing.'},
    {id:11,theme:'compassion',src:'study prompt',text:'To wish that no child be born into avoidable suffering is not coldness toward children. For many, it is exactly their warmth, followed to its end.'},
    {id:12,theme:'compassion',src:'study prompt',text:'You can love the children who exist with your whole heart and still ask, soberly, whether to summon a new one into the same uncertain world.'},
    {id:13,theme:'meaning',src:'after Benatar',text:'A life can brim with local meaning — love, work, wonder — and still leave open the prior question of whether it needed to begin at all.'},
    {id:14,theme:'meaning',src:'study prompt',text:'Does meaning repay suffering, or simply run alongside it on a different track? Try holding the two apart and see what changes.'},
    {id:15,theme:'eastern',src:'after Buddhist thought',text:'If craving is the engine of dissatisfaction, then to start a new craver is to light another fire. The old traditions did not look away from this.'},
    {id:16,theme:'eastern',src:'after Jain thought',text:'Some have sought release from the long wheel of rebirth. Read their restraint not as despair, but as a fierce, ancient form of care.'},
    {id:17,theme:'ecological',src:'study prompt',text:'A single new life is also a lifetime of consumption on a crowded planet. Weigh it honestly — neither inflating the figure nor pretending it is zero.'},
    {id:18,theme:'ecological',src:'study prompt',text:'It is fair to ask what world we hand a future person, and fair to remember that systems, not single births, do most of the harm.'},
    {id:19,theme:'autonomy',src:'study prompt',text:'The first freedom is not to choose an answer, but to notice the question was never really open. Birth, too, can be examined.'},
    {id:20,theme:'autonomy',src:'study prompt',text:'"Everyone does it" is a description, not a reason. What looks settled often turns out to be merely unexamined.'},
    {id:21,theme:'asymmetry',src:'study prompt',text:'Picture the never-born. There is no one there to be deprived — and that absence of a sufferer is the whole strange heart of the argument.'},
    {id:22,theme:'suffering',src:'study prompt',text:'We rightly hesitate to gamble with another\'s body for their own good. Creating a person is the largest such gamble we ever make.'},
    {id:23,theme:'compassion',src:'study prompt',text:'The question is not whether life can be wonderful — often it is — but whether a wonder no one is yet waiting for must be brought about.'},
    {id:24,theme:'meaning',src:'study prompt',text:'If a life must contain its own justification, ask: justified to whom, and by a standard set before the liver of it existed to agree?'},
    {id:25,theme:'pessimism',src:'study prompt',text:'To take suffering seriously is not to deny joy. It is to refuse to let joy do all the talking when a whole life hangs in the balance.'},
    {id:26,theme:'consent',src:'study prompt',text:'"They\'ll be glad later" is told after the fact, by us, on their behalf. Notice how much work that small sentence is asked to do.'},
    {id:27,theme:'autonomy',src:'study prompt',text:'You can find a question worth asking without already knowing the answer — and treat both those who answer yes and those who answer no with equal respect.'},
    {id:28,theme:'ecological',src:'study prompt',text:'Hold two truths at once: an individual\'s footprint is real, and blaming individuals can let the larger machinery off the hook.'}
  ];
  var favs = (A.getJSON?A.getJSON('favs',[]):[]) || [];
  function isFav(id){ return favs.indexOf(id)>-1; }
  function toggleFav(id){ var i=favs.indexOf(id); if(i>-1) favs.splice(i,1); else favs.push(id); if(A.setJSON) A.setJSON('favs',favs); }

  /* featured */
  var current=null;
  function draw(){ current=P[Math.floor(Math.random()*P.length)]; renderFeatured(); }
  function renderFeatured(){ var f=$('featured'); if(!f||!current) return; f.innerHTML='<p class="qt">'+esc(current.text)+'</p><p class="qm">'+esc(THEMES[current.theme])+' · <em>'+esc(current.src)+'</em></p>'; var fb=$('featFav'); if(fb) fb.textContent=isFav(current.id)?'★ Saved':'☆ Save'; }
  $('drawBtn') && $('drawBtn').addEventListener('click',draw);
  $('featCopy') && $('featCopy').addEventListener('click',function(){ if(current&&A.copy) A.copy(current.text,$('featCopy')); });
  $('featFav') && $('featFav').addEventListener('click',function(){ if(current){ toggleFav(current.id); renderFeatured(); render(); } });
  draw();

  /* browse */
  var activeTheme='all', term='';
  (function(){
    var chips=$('themeChips'); if(!chips) return;
    var arr=[{k:'all',l:'All'},{k:'fav',l:'★ Favourites'}].concat(Object.keys(THEMES).map(function(k){ return {k:k,l:THEMES[k]}; }));
    chips.innerHTML=arr.map(function(c){ return '<span class="chip2'+(c.k==='all'?' active':'')+'" data-k="'+c.k+'" role="button" tabindex="0">'+esc(c.l)+'</span>'; }).join('');
    chips.querySelectorAll('.chip2').forEach(function(c){ function sel(){ activeTheme=c.getAttribute('data-k'); chips.querySelectorAll('.chip2').forEach(function(x){x.classList.remove('active');}); c.classList.add('active'); render(); } c.addEventListener('click',sel); c.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();sel();} }); });
    var se=$('qSearch'); if(se) se.addEventListener('input',function(){ term=se.value.toLowerCase().trim(); render(); });
  })();
  function matches(q){ if(activeTheme==='fav'){ if(!isFav(q.id)) return false; } else if(activeTheme!=='all' && q.theme!==activeTheme) return false; if(!term) return true; return (q.text+' '+THEMES[q.theme]+' '+q.src).toLowerCase().indexOf(term)>-1; }
  function render(){
    var box=$('qCards'); if(!box) return;
    var shown=P.filter(matches);
    if($('qCount')) $('qCount').textContent=shown.length+' of '+P.length+' prompts'+(activeTheme!=='all'&&activeTheme!=='fav'?(' · '+THEMES[activeTheme]):'')+(activeTheme==='fav'?' · favourites':'')+(term?(' · "'+term+'"'):'');
    if(!shown.length){ box.innerHTML='<p class="qempty">'+(activeTheme==='fav'?'No favourites yet — tap ☆ on any prompt to save it.':'No prompts match that search.')+'</p>'; return; }
    box.innerHTML=shown.map(function(q){ return '<div class="qcard"><p class="qt">'+esc(q.text)+'</p><div class="qm"><span class="theme">'+esc(THEMES[q.theme])+'</span><span class="src">'+esc(q.src)+'</span><span class="spacer" style="flex:1"></span><span class="acts"><button type="button" class="fav'+(isFav(q.id)?' on':'')+'" data-id="'+q.id+'">'+(isFav(q.id)?'★':'☆')+'</button><button type="button" class="cpy" data-id="'+q.id+'">Copy</button></span></div></div>'; }).join('');
    box.querySelectorAll('.fav').forEach(function(b){ b.addEventListener('click',function(){ toggleFav(+b.getAttribute('data-id')); render(); renderFeatured(); }); });
    box.querySelectorAll('.cpy').forEach(function(b){ b.addEventListener('click',function(){ var q=P.filter(function(x){return x.id===+b.getAttribute('data-id');})[0]; if(q&&A.copy) A.copy(q.text,b); }); });
  }
  render();

  /* themeKv */
  (function(){ var kv=$('themeKv'); if(!kv) return; kv.innerHTML=Object.keys(THEMES).map(function(k){ return '<strong>'+esc(THEMES[k])+'</strong><span>'+esc(THEME_DESC[k])+'</span>'; }).join(''); })();

  /* quiz */
  (function(){
    var Q=[{a:1},{a:0},{a:1}], E=['They\'re original prompts inspired by the tradition — not quotations.','The asymmetry argument is most associated with David Benatar (2006).','A study prompt is a tool for thinking with an idea in your own way.'];
    var picks={}, total=document.querySelectorAll('#quizbox .quiz-q').length;
    if(A.initOptions) A.initOptions($('quizbox'),function(q,i){ picks[q]=+i; });
    var sB=$('quizScore'), rB=$('quizReset'), res=$('quizResult');
    if(sB) sB.addEventListener('click',function(){ if(Object.keys(picks).length<total){ res.style.display='block'; res.textContent='Pick an answer for all '+total+' questions first.'; return; }
      var sc=0; Q.forEach(function(it,i){ document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){ var j=+x.getAttribute('data-i'); x.classList.remove('ok','no'); if(j===it.a)x.classList.add('ok'); else if(j===picks[i])x.classList.add('no'); }); var ex=document.querySelector('.explain[data-q="'+i+'"]'); if(ex){ ex.style.display='block'; ex.textContent=E[i]; } if(picks[i]===it.a)sc++; });
      res.style.display='block'; res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.'; if(rB) rB.style.display='inline-block'; });
    if(rB) rB.addEventListener('click',function(){ picks={}; document.querySelectorAll('#quizbox .opt').forEach(function(x){ x.classList.remove('sel','ok','no'); }); document.querySelectorAll('#quizbox .explain').forEach(function(ex){ ex.style.display='none'; ex.textContent=''; }); res.style.display='none'; rB.style.display='none'; });
  })();
  /* reflection */
  (function(){
    var ta=$('r1'), status=$('saveStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('saveBtn'),cp=$('copyBtn'),cl=$('clearBtn');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
    if(cp) cp.addEventListener('click',function(){ var sel=P.filter(function(q){return isFav(q.id);}); var L=['My saved prompts','']; if(!sel.length) L.push('(no favourites yet)'); sel.forEach(function(q){ L.push('• '+q.text+'  ['+THEMES[q.theme]+', '+q.src+']'); }); if(A.copy) A.copy(L.join('\n'),cp); });
  })();
} catch(e){ console.error('project 021 script error', e); }
});
