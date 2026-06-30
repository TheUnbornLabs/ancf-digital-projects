/* Project 050 · Childfree FAQ — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var CATS={identity:'Identity & choice',relationships:'Relationships',family:'Family & pressure',future:'The future',society:'Society & judgement',meaning:'Meaning & regret'};
  var FAQ=[
    {c:'identity',q:'What\'s the difference between "childfree" and "childless"?',a:'"Childfree" generally describes people who have chosen not to have children. "Childless" more often describes not having children due to circumstance — infertility, timing, loss, or a wished-for child that didn\'t arrive. The words overlap and people use them differently for themselves, so the kindest move is to follow each person\'s lead.'},
    {c:'identity',q:'Does being childfree mean you dislike children?',a:'No. Plenty of childfree people adore children — as aunts, uncles, teachers, mentors, and friends. Choosing not to raise your own is a decision about your life, not a statement about whether children are wonderful. Many simply know parenthood isn\'t the right role for them.'},
    {c:'identity',q:'Isn\'t it selfish to choose not to have children?',a:'There\'s no existing person being deprived by the choice, so there\'s no one to be selfish toward. Living honestly rather than performing a life for approval is a reasonable thing to do. Ironically, having a child mainly to satisfy others would be the less considered choice.'},
    {c:'identity',q:'When did you decide, and how can you be so sure?',a:'For some it\'s a lifelong knowing; for others it arrives after real reflection. Certainty here is no stranger than certainty about wanting children — we rarely ask parents how they can be "so sure." A clear, considered decision is allowed to simply be clear.'},
    {c:'identity',q:'Is this just a phase you\'ll grow out of?',a:'People are capable of knowing their own minds, and "you\'ll change your mind" is said to certainty of every kind. If feelings did shift later, that would be something to navigate then — not a reason to hand the decision to someone else now.'},
    {c:'relationships',q:'How do I bring this up with a partner or a date?',a:'Sooner is kinder than later, said plainly and without apology: "Having children isn\'t in my plans, and I wanted to be upfront." It\'s not a flaw to disclose; it\'s compatibility information you both deserve early, the same as any major life direction.'},
    {c:'relationships',q:'What if my partner and I disagree about having kids?',a:'This is one of the few areas where "meeting in the middle" rarely works, since you can\'t half-have a child. It deserves honest, unpressured conversation — ideally early — about what each of you truly needs. Sometimes love and compatibility point in different directions, and naming that honestly is its own kind of care.'},
    {c:'relationships',q:'Will I end up lonely without children?',a:'Children are no guarantee against loneliness — many parents feel it, and many childfree people build rich, connected lives. Loneliness is better addressed directly, through friendships, community, and chosen family, than insured against by creating a person.'},
    {c:'relationships',q:'How do I handle friends who\'ve drifted after having kids?',a:'Life stages change friendships for everyone, in both directions. Some bonds adapt; some cool for a while and warm again later. It helps to reach out on their terms, keep the door open, and also invest in friendships that aren\'t tied to matching life paths.'},
    {c:'family',q:'How do I tell my parents I\'m not giving them grandchildren?',a:'Lead with the relationship: acknowledge that the wish is real and comes from love, then state your decision kindly and clearly. "I know you\'d treasure grandchildren, and I understand — it isn\'t in my plans." You can hold their feelings with compassion without treating them as a debt you owe.'},
    {c:'family',q:'My family won\'t stop asking. What can I say?',a:'A short, warm, repeatable line works better than a fresh debate each time: "I\'m at peace with my choice, and I\'d rather not keep revisiting it." Calm repetition, without escalating, signals the topic is settled while keeping the warmth intact.'},
    {c:'family',q:'What about carrying on the family name or legacy?',a:'A great many meaningful lives leave nothing genetic behind and everything else — ideas, kindness, care, work, and the values handed to the next generation. Legacy is far broader than a surname, and a name is not a sufficient reason to create a person.'},
    {c:'family',q:'How do I respond to "it\'s different when it\'s your own"?',a:'It may well be different — which is exactly why it deserves to be a deliberate choice rather than a leap taken on the promise that a feeling will arrive. "You might feel differently" isn\'t a reason to decide a whole life for someone else.'},
    {c:'future',q:'Who will take care of you when you\'re old?',a:'Having children is not a reliable care plan, and raising one for that purpose isn\'t fair to anyone. Thoughtful later-life planning — savings, community, friendships, chosen family, and professional care — addresses old age far more directly than hoping a child will.'},
    {c:'future',q:'How should childfree people plan for retirement and care?',a:'Much like anyone, but a little more intentionally: build savings and a care fund, nurture a wide network across ages, document your wishes, and choose people you trust for important roles. Many tools exist for exactly this, and planning early turns a vague worry into a solid footing.'},
    {c:'future',q:'Won\'t you regret it later?',a:'Maybe, maybe not — and the same is true of any major life choice, including having children. Possible future feelings are a reason to choose carefully and honestly now, not to outsource the decision. Studies of life satisfaction find content people on every path.'},
    {c:'future',q:'Isn\'t the human race in danger if people stop having kids?',a:'One person\'s choice has no meaningful effect on humanity\'s continuation, and global population is in no danger from individual decisions. Framing a deeply personal choice as a species-level duty asks one person to carry a weight that was never theirs.'},
    {c:'society',q:'Why do strangers feel entitled to ask about my plans?',a:'Pronatalism — the cultural assumption that everyone will and should have children — makes the question feel as ordinary as asking about the weather. Naming that doesn\'t excuse the intrusion, but it can make it sting less: it\'s usually an unexamined default, not a personal judgement.'},
    {c:'society',q:'How do I answer nosy questions politely but firmly?',a:'A boundary can be warm: "That\'s a bit personal, but thanks for asking — how about you?" You\'re allowed to redirect, decline, or simply not answer. Politeness and a clear limit are not opposites; you can have both at once.'},
    {c:'society',q:'Do I owe people an explanation for my choice?',a:'No. "It\'s not for me" is a complete sentence. Sharing your reasons can be generous when you want to, but it\'s never an obligation, and an answer being met with debate is a sign to close the topic, not to justify harder.'},
    {c:'society',q:'How do I deal with judgement at work or in my community?',a:'Keep it light and closed in professional or casual settings — a friendly deflection protects your privacy without a confrontation. Seek out the people and spaces that respect your choice, and remember a stranger\'s opinion costs you nothing unless you decide to spend on it.'},
    {c:'meaning',q:'Where do childfree people find meaning and purpose?',a:'In all the same places anyone does: love, friendship, creativity, work, learning, service, community, and care of many kinds. Children are one source of meaning among many, not the only one — and a life can be entirely full without them.'},
    {c:'meaning',q:'Can a marriage or partnership feel complete without children?',a:'Yes. Two people who love each other are already a family, and wholeness isn\'t something a child is required to deliver. Many couples describe their relationship as richer for the time, attention, and freedom they can give each other and the world.'},
    {c:'meaning',q:'How do I make peace with my decision when doubt creeps in?',a:'Doubt visits every meaningful choice; it isn\'t proof you chose wrong. It can help to revisit your honest reasons, separate your own voice from borrowed ones, talk with people who get it, and treat yourself with the same kindness you\'d offer a friend. Peace is usually built, not found.'}
  ];
  var fcat='all',fq='';
  function renderChips(){ var box=$('catChips'); if(!box) return; var cats=['all'].concat(Object.keys(CATS));
    box.innerHTML=cats.map(function(c){ return '<button type="button" class="fchip'+(c===fcat?' active':'')+'" data-c="'+c+'">'+(c==='all'?'All':esc(CATS[c]))+'</button>'; }).join('');
    box.querySelectorAll('.fchip').forEach(function(b){ b.addEventListener('click',function(){ fcat=b.getAttribute('data-c'); renderChips(); renderList(); }); }); }
  function renderList(){ var box=$('faqList'); if(!box) return;
    var list=FAQ.filter(function(f){ if(fcat!=='all'&&f.c!==fcat) return false; if(fq){ if((f.q+' '+f.a).toLowerCase().indexOf(fq)<0) return false; } return true; });
    if(!list.length){ box.innerHTML='<p class="note">No questions match. Try a different word or topic.</p>'; var c0=$('faqCount'); if(c0)c0.textContent=''; return; }
    box.innerHTML=list.map(function(f){ var i=FAQ.indexOf(f); return '<details data-i="'+i+'"><summary><b>'+esc(f.q)+'</b><span class="chev">▾</span></summary><div class="body"><p class="faq-a">'+esc(f.a)+'</p><div class="faq-foot"><span class="cat-pill">'+esc(CATS[f.c])+'</span><button type="button" class="cp" data-i="'+i+'">Copy answer</button></div></div></details>'; }).join('');
    box.querySelectorAll('.cp').forEach(function(b){ b.addEventListener('click',function(e){ e.preventDefault(); if(A.copy) A.copy(FAQ[+b.getAttribute('data-i')].a,b); }); });
    var c=$('faqCount'); if(c) c.textContent='Showing '+list.length+' of '+FAQ.length+' questions.'; }
  $('faqSearch').addEventListener('input',function(){ fq=this.value.trim().toLowerCase(); renderList(); });
  renderChips(); renderList();

  (function(){
    var Q=[{a:0},{a:0}], E=['"Childfree" implies a choice; "childless" more often implies circumstance.','A respectful answer states your choice without judging people who choose differently.'];
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
} catch(e){ console.error('project 050 script error', e); }
});
