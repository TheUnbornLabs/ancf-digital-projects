/* Project 057 · Buddhism & Antinatalism Notes — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var NOTES=[
    {h:'The Four Noble Truths',t:'the heart of the teaching',d:'There is dukkha (unsatisfactoriness); it arises from craving (tanhā); it can cease; and a path leads to that cessation — the Noble Eightfold Path. The frame is diagnosis and cure, not despair.',bear:'The honest acknowledgement that existence contains dukkha resonates with suffering-focused thinking. But Buddhism’s response is a path to liberation, not a conclusion against being born.'},
    {h:'Dukkha',t:'unsatisfactoriness, "suffering"',d:'Not only pain, but the subtle unease running through impermanent experience — even pleasures pass. Recognising dukkha clearly is the starting point, not the destination.',bear:'Some readers hear an antinatalist echo here. Yet Buddhism treats dukkha as workable through practice and insight, which reframes rather than forecloses a life.'},
    {h:'Tanhā — craving',t:'the origin of dukkha',d:'The Second Noble Truth locates the cause of dukkha in craving and clinging — to pleasure, to existence, even to non-existence. Release comes from loosening that grip.',bear:'Notably, Buddhism names craving for non-existence (vibhava-taṇhā) as itself a form of clinging — a pointed difference from a stance built on preferring never to have been.'},
    {h:'Saṃsāra & rebirth',t:'the round of becoming',d:'Unawakened existence is pictured as a cycle of rebirth driven by karma and craving. The aim is liberation (nirvāṇa) — the cooling of that fire — within or across lives.',bear:'Because the goal is awakening rather than the end of procreation, the tradition addresses the cycle through practice, not through a programme of not having children.'},
    {h:'The Middle Way',t:'between extremes',d:'The Buddha’s path avoids both sensual indulgence and harsh asceticism. Balance, not negation, characterises the approach.',bear:'A caution against absolutist conclusions in either direction. The Middle Way models holding hard truths about suffering without collapsing into life-denial.'},
    {h:'Karuṇā & mettā',t:'compassion & loving-kindness',d:'Central to the path is boundless compassion and goodwill toward all sentient beings — wishing their suffering to ease and their wellbeing to grow.',bear:'This active care for all beings is one reason the tradition is life-affirming in spirit, even as it takes suffering seriously. Compassion seeks to relieve suffering, not to prevent beings from existing.'}
  ];
  (function(){ var box=$('noteCards'); if(!box) return; box.innerHTML=NOTES.map(function(n){ return '<div class="note-card"><h4>'+esc(n.h)+'</h4><div class="term">'+esc(n.t)+'</div><p>'+esc(n.d)+'</p><div class="bear"><b>Bearing on questions of birth:</b> '+esc(n.bear)+'</div></div>'; }).join(''); })();

  $('mythbust').innerHTML='<h4>Short answer: no.</h4><p>Buddhism is not antinatalist. Its goal is the cessation of suffering through awakening, and it offers respected paths for both monastics and lay people — the latter ordinarily including marriage and family. Monastic celibacy is a renunciation chosen for the path, not a verdict that others should not have children.</p><p>The tradition even names craving for <em>non-existence</em> as a form of clinging to be released, which sits in tension with a stance built on preferring never to have been. Some modern thinkers have drawn antinatalist-adjacent readings from Buddhist premises, but that is their argument — not the teaching of this living, diverse tradition of hundreds of millions.</p>';

  var CD=[
    {tag:'conv',h:'Converge: suffering is real and central',d:'Both take dukkha seriously and refuse to paper over it. The First Noble Truth and suffering-focused ethics share an unflinching starting point.'},
    {tag:'conv',h:'Converge: craving distorts judgement',d:'Buddhism’s analysis of how craving and aversion cloud the mind offers tools anyone can use to think more clearly about emotionally charged choices.'},
    {tag:'div',h:'Diverge: the response to suffering',d:'Antinatalism responds to suffering partly by questioning whether to create new lives. Buddhism responds with a path to liberate beings who already crave and suffer.'},
    {tag:'div',h:'Diverge: craving for non-existence',d:'Buddhism treats the wish for non-existence as itself a subtle form of clinging. An antinatalist conclusion can look, from this angle, like another attachment to be released.'},
    {tag:'div',h:'Diverge: rebirth and continuity',d:'In a worldview of rebirth, not having children doesn’t end one’s own saṃsāra. The framing of the problem — and its solution — differs at the metaphysical root.'}
  ];
  (function(){ var box=$('cdCards'); if(!box) return; box.innerHTML=CD.map(function(c){ return '<div class="scard"><h4>'+esc(c.h)+'</h4><span class="cdtag '+c.tag+'">'+(c.tag==='conv'?'Converge':'Diverge')+'</span><div class="more" style="margin-top:8px">'+esc(c.d)+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(card){ card.addEventListener('click',function(){ card.classList.toggle('open'); }); }); })();

  (function(){
    var Q=[{a:0},{a:0}], E=['No — its goal is liberation from craving; lay family life is a respected path, and it even names craving for non-existence as clinging.','The First Noble Truth concerns dukkha, the unsatisfactoriness woven through existence.'];
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
} catch(e){ console.error('project 057 script error', e); }
});
