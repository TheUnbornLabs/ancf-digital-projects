/* Project 056 · Stoicism & Antinatalism Notes — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var NOTES=[
    {h:'The dichotomy of control',t:'ta eph’ hēmin — "what is up to us"',d:'Epictetus opens the Enchiridion by dividing the world into what is up to us (our judgements, choices, responses) and what is not (other people, outcomes, our body, reputation). Peace comes from investing only in the former.',bear:'A practical tool for the pressure around this topic: a relative’s opinion of your choice is "not up to you"; your own considered decision and how you respond are. It steadies you — but it doesn’t answer whether to have children.'},
    {h:'Amor fati & living “according to nature”',t:'love of one’s fate',d:'The Stoics urged accepting and even loving what happens, and living in agreement with nature and reason. For them, "nature" included our social nature — we are made for community and cooperation.',bear:'Because Stoic "nature" was deeply social, it leaned toward participation in family and city, not away from it. Borrowing "according to nature" as an antinatalist slogan misreads what the Stoics meant.'},
    {h:'Premeditatio malorum',t:'premeditation of adversity',d:'Calmly picturing possible hardships in advance — loss, illness, death — to rob them of their shock and to treasure what we have while we have it.',bear:'It can ease anxiety about an uncertain future either way. Note, though, that the Stoics used it to engage life more fully, including raising and eventually losing loved ones — not to avoid attachments.'},
    {h:'Oikeiōsis & cosmopolitanism',t:'“affiliation”; world-citizenship',d:'Stoic ethics begins from oikeiōsis: our natural concern radiating outward from self to family to all humanity. Hierocles pictured drawing those outer circles inward. Marcus called himself a citizen of the world.',bear:'This is the strongest reason the Stoics were not antinatalists: their ethics actively affirmed family and the wider human community as goods to be sustained and served.'},
    {h:'Virtue as the only true good',t:'the sole good is moral excellence',d:'For the Stoics, only virtue is truly good; health, wealth, even children are "preferred indifferents" — naturally preferable, but not what makes a life good or bad.',bear:'A subtle point: children weren’t the source of a good life for the Stoics (virtue was), yet they were still "preferred." So Stoicism neither makes parenthood mandatory nor counts against it.'},
    {h:'The Stoic view of death',t:'a natural transformation',d:'Death is a natural process, not an evil — Seneca and Marcus return to this often. What matters is how we live, not how long.',bear:'This calm view of mortality touches existential worries here, but the Stoics drew from it a call to live well now, not a verdict about whether new lives should begin.'}
  ];
  (function(){ var box=$('noteCards'); if(!box) return; box.innerHTML=NOTES.map(function(n){ return '<div class="note-card"><h4>'+esc(n.h)+'</h4><div class="term">'+esc(n.t)+'</div><p>'+esc(n.d)+'</p><div class="bear"><b>Bearing on questions of birth:</b> '+esc(n.bear)+'</div></div>'; }).join(''); })();

  $('mythbust').innerHTML='<h4>Short answer: no.</h4><p>The Stoics were not antinatalists, and reading them that way is a common error. Their ethics of <em>oikeiōsis</em> and cosmopolitanism affirmed family and civic participation as natural goods. <strong>Marcus Aurelius</strong> (121–180 CE) had many children; <strong>Epictetus</strong> discussed marriage and child-rearing as ordinarily fitting (with a special exception he entertains only for the wandering Cynic philosopher); <strong>Seneca</strong> wrote consolations that assume the deep value of family ties.</p><p class="note">What Stoicism <em>does</em> offer this topic is temperament, not a thesis: tools for facing pressure, uncertainty, and others’ opinions with steadiness. Take the tools; don’t invent the thesis.</p>';

  var CD=[
    {tag:'conv',h:'Converge: equanimity under pressure',d:'Both a Stoic and someone navigating reproductive pressure benefit from separating their own considered judgement from the noise of others’ expectations. The dichotomy of control is genuinely useful here.'},
    {tag:'conv',h:'Converge: clear-eyed about suffering',d:'Stoicism doesn’t deny that life contains hardship; it trains a sober look at it. That sobriety is shared ground with suffering-focused thinking, even if the conclusions differ.'},
    {tag:'div',h:'Diverge: value of new life',d:'Antinatalism assigns a negative value to coming into existence. Stoic ethics, rooted in social oikeiōsis, treats family and community as goods to sustain — the opposite leaning.'},
    {tag:'div',h:'Diverge: “according to nature”',d:'For antinatalists "natural" carries no authority. For Stoics, living "according to nature" — including our social nature — was central and pointed toward, not away from, human continuity.'},
    {tag:'div',h:'Diverge: the aim of the philosophy',d:'Stoicism is fundamentally life-affirming: its goal is to live virtuously and well, here and now. Antinatalism is a claim about whether to start lives at all — a different question entirely.'}
  ];
  (function(){ var box=$('cdCards'); if(!box) return; box.innerHTML=CD.map(function(c){ return '<div class="scard"><h4>'+esc(c.h)+'</h4><span class="cdtag '+c.tag+'">'+(c.tag==='conv'?'Converge':'Diverge')+'</span><div class="more" style="margin-top:8px">'+esc(c.d)+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(card){ card.addEventListener('click',function(){ card.classList.toggle('open'); }); }); })();

  (function(){
    var Q=[{a:0},{a:0}], E=['No — the Stoics valued family and civic life as natural goods; they were not antinatalists.','The dichotomy of control distinguishes what is up to us from what is not.'];
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
} catch(e){ console.error('project 056 script error', e); }
});
