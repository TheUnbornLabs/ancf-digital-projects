/* Project 051 · Antinatalism FAQ — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var CATS={basics:'Basics',arguments:'The arguments',myths:'Common myths',ethics:'Ethics',living:'Living with it',criticisms:'Criticisms'};
  var FAQ=[
    {c:'basics',q:'What is antinatalism?',a:'Antinatalism is the philosophical view that coming into existence carries a negative value, and that — for various reasons — it is ethically problematic to bring new sentient beings into the world. It is a claim about the ethics of procreation, not a claim that existing lives are worthless.'},
    {c:'basics',q:'Is antinatalism new?',a:'No. Pessimistic and anti-procreative themes appear across history — in some ancient Greek lines of thought, in Schopenhauer\'s 19th-century pessimism, and in 20th-century writers. The modern philosophical form is most associated with David Benatar\'s 2006 book Better Never to Have Been.'},
    {c:'basics',q:'Are all antinatalists the same?',a:'No. There are different routes to the view: an argument from asymmetry (Benatar), arguments from consent, from the risk of serious harm, from the environment, and from suffering-focused ethics. People can hold one strand strongly and another not at all.'},
    {c:'basics',q:'Is antinatalism the same as being childfree?',a:'No, though they\'re often confused. Being childfree is a personal lifestyle choice; antinatalism is an ethical claim about procreation in general. Many childfree people are not antinatalists, and one can find the arguments interesting without adopting the label.'},
    {c:'arguments',q:'What is Benatar\'s asymmetry argument?',a:'Benatar argues there is an asymmetry between pleasure and pain: the absence of pain is good even if no one enjoys that absence, while the absence of pleasure is only bad if there is someone for whom it is a deprivation. From this he concludes that coming into existence is always a net harm. Critics dispute the asymmetry on several grounds.'},
    {c:'arguments',q:'What is the consent argument?',a:'It holds that a person cannot consent to being born, yet birth exposes them to serious, unavoidable risks and harms. Since we usually require consent before imposing risks on someone, procreation is ethically fraught. Critics note consent is impossible either way, since a non-existent being cannot refuse either.'},
    {c:'arguments',q:'What is the risk-based argument?',a:'Rather than claiming every life is bad, this milder version stresses that procreation gambles with someone else\'s wellbeing: you cannot guarantee a life free of serious suffering, and the downside can be severe and irreversible. It frames birth as imposing a non-consensual risk.'},
    {c:'arguments',q:'What is suffering-focused ethics?',a:'A family of views holding that reducing suffering matters more than, or takes priority over, creating happiness. On such views, preventing the suffering a new life would contain can outweigh the goods it would also contain. It overlaps with, but is distinct from, antinatalism.'},
    {c:'myths',q:'Does antinatalism mean wanting people to die?',a:'No — this is the most common misconception. Antinatalism concerns not creating new lives; it says nothing in favour of ending existing ones. Most antinatalists strongly oppose harming or coercing anyone who already exists.',myth:true},
    {c:'myths',q:'Is antinatalism just depression or being suicidal?',a:'No. It is a reasoned ethical position that people reach through argument, and many who hold it report being quite content. Conflating a philosophical view with a mental-health crisis misreads both. (That said, if these themes touch a personal struggle, support from a trusted person or professional is always worth seeking.)',myth:true},
    {c:'myths',q:'Doesn\'t antinatalism hate life or humanity?',a:'Not necessarily. Many antinatalists say their view comes from compassion — a wish to prevent suffering — rather than contempt. One can love existing people deeply while questioning the ethics of creating new ones.',myth:true},
    {c:'myths',q:'If antinatalists are right, won\'t humanity just end?',a:'In practice, antinatalism is a minority philosophical view with no prospect of universal adoption, so this is a thought experiment rather than a forecast. Philosophically, antinatalists differ on how they weigh extinction; some accept it as a consequence, others focus only on individual procreative ethics.',myth:true},
    {c:'ethics',q:'Can you value your own life and still be an antinatalist?',a:'Yes, and many do. Holding that it would have been better never to come into existence is compatible with making the most of the life one has. The two claims operate at different levels — one about creation, one about how to live now.'},
    {c:'ethics',q:'Is antinatalism anti-natalist toward specific groups?',a:'A sound antinatalism applies to procreation as such, universally. Any version that singled out particular castes, races, classes, or communities would be eugenics or bigotry, not antinatalism — and most antinatalist philosophers explicitly reject that.'},
    {c:'ethics',q:'How does antinatalism relate to abortion rights?',a:'They are logically separate. Antinatalism is about whether to create new lives; abortion debates concern bodily autonomy and the status of a pregnancy. People across the spectrum on abortion can hold, or reject, antinatalism.'},
    {c:'ethics',q:'Isn\'t creating a happy life a good thing?',a:'This is a central objection. Many ethicists hold that bringing a flourishing person into being adds genuine value to the world. Antinatalists reply that the goods of a life don\'t straightforwardly offset its harms, especially when the person had no say. Reasonable people weigh this differently.'},
    {c:'living',q:'How do antinatalists treat people who have children?',a:'Thoughtful antinatalists distinguish the ethics of an act from judgement of a person. Most aim to discuss the idea without condemning parents, recognising that procreation is a near-universal, deeply human, and socially encouraged choice.'},
    {c:'living',q:'Can antinatalists be happy?',a:'Yes. The view is about the ethics of starting new lives, not about resigning yourself to misery. Plenty of people who find the arguments persuasive lead warm, engaged, meaningful lives.'},
    {c:'living',q:'How do I discuss antinatalism without alienating people?',a:'Lead with curiosity, not conclusions; separate the idea from any judgement of the listener; and concede the genuine force of the objections. It\'s an emotionally charged topic, so warmth and humility carry the conversation much further than zeal.'},
    {c:'living',q:'Do I have to call myself an antinatalist to take it seriously?',a:'Not at all. You can find the arguments worth understanding, agree with some and not others, and never adopt the label. Engaging an idea honestly is separate from joining a camp.'},
    {c:'criticisms',q:'What is the strongest objection to antinatalism?',a:'Many philosophers point to the asymmetry argument\'s contested premises — particularly the claim that absent pleasure isn\'t a loss while absent pain is a gain. Others argue that lives contain real, non-instrumental goods that can make existence worthwhile, and that most people, on reflection, are glad to exist.'},
    {c:'criticisms',q:'Doesn\'t most people\'s glad-to-exist feeling refute it?',a:'It\'s a serious challenge. Antinatalists reply that adaptation and optimism bias can shape such reports, and that being glad you exist doesn\'t settle whether creating you was permissible. Critics find this reply unconvincing. The disagreement is genuine and ongoing.'},
    {c:'criticisms',q:'Is antinatalism falsifiable or just opinion?',a:'It\'s a normative (ethical) position, so it isn\'t "falsifiable" like a scientific claim — but that doesn\'t make it mere opinion. It stands or falls on the strength of its arguments and how well it withstands objection, like any view in ethics.'},
    {c:'criticisms',q:'If life is worth living, isn\'t the view self-defeating?',a:'Not obviously. Antinatalists can grant that a life, once underway, is worth continuing while still holding it would have been better not to start it — much as one can make the best of a situation one wouldn\'t have chosen. Whether that distinction holds up is exactly what the debate turns on.'}
  ];
  var fcat='all',fq='';
  function renderChips(){ var box=$('catChips'); if(!box) return; var cats=['all'].concat(Object.keys(CATS));
    box.innerHTML=cats.map(function(c){ return '<button type="button" class="fchip'+(c===fcat?' active':'')+'" data-c="'+c+'">'+(c==='all'?'All':esc(CATS[c]))+'</button>'; }).join('');
    box.querySelectorAll('.fchip').forEach(function(b){ b.addEventListener('click',function(){ fcat=b.getAttribute('data-c'); renderChips(); renderList(); }); }); }
  function renderList(){ var box=$('faqList'); if(!box) return;
    var list=FAQ.filter(function(f){ if(fcat!=='all'&&f.c!==fcat) return false; if(fq){ if((f.q+' '+f.a).toLowerCase().indexOf(fq)<0) return false; } return true; });
    if(!list.length){ box.innerHTML='<p class="note">No questions match. Try a different word or topic.</p>'; var c0=$('faqCount'); if(c0)c0.textContent=''; return; }
    box.innerHTML=list.map(function(f){ var i=FAQ.indexOf(f); return '<details data-i="'+i+'"><summary><b>'+esc(f.q)+'</b><span class="chev">▾</span></summary><div class="body"><p class="faq-a">'+esc(f.a)+'</p><div class="faq-foot"><span class="cat-pill">'+esc(CATS[f.c])+'</span>'+(f.myth?'<span class="myth">Myth</span>':'')+'<button type="button" class="cp" data-i="'+i+'">Copy answer</button></div></div></details>'; }).join('');
    box.querySelectorAll('.cp').forEach(function(b){ b.addEventListener('click',function(e){ e.preventDefault(); if(A.copy) A.copy(FAQ[+b.getAttribute('data-i')].a,b); }); });
    var c=$('faqCount'); if(c) c.textContent='Showing '+list.length+' of '+FAQ.length+' questions.'; }
  $('faqSearch').addEventListener('input',function(){ fq=this.value.trim().toLowerCase(); renderList(); });
  renderChips(); renderList();

  (function(){
    var Q=[{a:0},{a:0}], E=['Antinatalism is the view that coming into existence carries a negative value — an ethical claim about procreation.','A common myth is conflating antinatalism with being suicidal or wanting people dead; it concerns not creating new lives.'];
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
} catch(e){ console.error('project 051 script error', e); }
});
