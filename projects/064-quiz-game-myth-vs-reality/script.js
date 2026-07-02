/* Project 064 · Myth vs Reality Quiz — Challenge Mode: escalating difficulty every 10s */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var headless=/jsdom/i.test((window.navigator&&window.navigator.userAgent)||'');

  /* d: 1=easy 2=medium 3=hard. 100 original statements, mixed philosophy/definitions/social-pressure/self-reflection. */
  var ITEMS=[
    {d:1,myth:true,t:'Antinatalism means wanting existing people to die.',e:'Myth. Antinatalism concerns not creating new lives; it says nothing in favour of harming anyone who already exists.'},
    {d:1,myth:true,t:'Being childfree means you must dislike children.',e:'Myth. Many childfree people love children as aunts, mentors, and friends — the choice is about their own life, not a verdict on kids.'},
    {d:1,myth:false,t:'"Childfree" usually implies a deliberate choice, while "childless" more often implies circumstance.',e:'Reality. The two words carry different connotations in common usage, even though people use them differently too.'},
    {d:1,myth:true,t:'Having children guarantees you\'ll be cared for in old age.',e:'Myth. Children are no guarantee of care, and thoughtful planning serves later life far more reliably.'},
    {d:1,myth:true,t:'Most pressure to have kids is deliberately malicious.',e:'Myth. The great majority is well-meant — which is exactly what makes it hard to push back on.'},
    {d:1,myth:false,t:'You can find antinatalist arguments interesting while still valuing your own life.',e:'Reality. The two operate at different levels — one about creation, one about how to live now.'},
    {d:1,myth:true,t:'Antinatalism and the abortion debate are the same issue.',e:'Myth. They are logically separate: one is about creating new lives, the other about bodily autonomy and a pregnancy\'s status.'},
    {d:1,myth:false,t:'Reproductive autonomy includes the right to not have children, not only the right to have them.',e:'Reality. Autonomy runs both ways — the freedom to have, and to not have, children.'},
    {d:1,myth:true,t:'It\'s an established fact that childfree people regret their choice more than parents regret theirs.',e:'Myth. The research is mixed and contested; no such settled finding exists. Regret occurs on every path.'},
    {d:1,myth:false,t:'Pronatalism — the assumption everyone should have kids — shows up in some form across most cultures.',e:'Reality. It appears in most societies in some form, which is partly why it feels so natural.'},
    {d:1,myth:true,t:'A couple isn\'t a "real family" until they have children.',e:'Myth. Two people who love each other are already a family; wholeness isn\'t something a child must deliver.'},
    {d:1,myth:false,t:'Choosing a childfree life is a recognised, studied topic in sociology and demography.',e:'Reality. It has been studied across those fields, especially since the 1970s.'},
    {d:1,myth:true,t:'Every childfree person chose that path for the exact same reason.',e:'Myth. Reasons vary widely — career, health, values, finances, simply not wanting kids, and more.'},
    {d:1,myth:true,t:'Antinatalism has zero presence in academic philosophy.',e:'Myth. It\'s a minority position, but it\'s discussed in peer-reviewed philosophy journals and university-press books.'},
    {d:1,myth:false,t:'"DINK" (dual income, no kids) is a term sometimes used to describe childfree couples.',e:'Reality. It\'s a common shorthand, originally from marketing and demographic writing.'},
    {d:1,myth:true,t:'Every antinatalist is also part of the environmental movement.',e:'Myth. Some overlap exists, but antinatalism is usually an argument about the ethics of creating a life, not primarily about population numbers.'},
    {d:1,myth:false,t:'A childfree person can still enjoy spending time with nieces, nephews, or friends\' kids.',e:'Reality. Not wanting your own children doesn\'t mean disliking children in general.'},
    {d:1,myth:true,t:'Choosing not to have children is a purely modern invention with no historical precedent.',e:'Myth. Individuals and couples across history have remained childless by choice, even before the modern vocabulary existed.'},
    {d:1,myth:false,t:'The Voluntary Human Extinction Movement (VHEMT) is a real, publicly known movement.',e:'Reality. It has existed publicly since the late 1980s, advocating that people stop having children.'},
    {d:1,myth:true,t:'Every version of antinatalism claims life is never worth starting, with zero exceptions.',e:'Myth. Some versions are conditional or limited rather than absolute — the tradition isn\'t one single claim.'},
    {d:1,myth:true,t:'Parenthood is the only path to a meaningful life.',e:'Myth. Meaning gets built many ways — work, relationships, creativity, service — parenthood is one path among many, not a requirement.'},
    {d:1,myth:false,t:'"Who will take care of you when you\'re old?" is a commonly cited example of pronatalist pressure.',e:'Reality. It\'s one of the most frequently reported lines aimed at childfree people.'},
    {d:1,myth:true,t:'People who choose not to have kids are legally required to explain why.',e:'Myth. No one owes a legal justification for a private reproductive choice.'},
    {d:1,myth:false,t:'A person can change their mind about wanting children at different points in life.',e:'Reality. Views on this can shift in either direction, at any age.'},
    {d:1,myth:true,t:'Childfree men face exactly the same social pressure as childfree women, with no difference at all.',e:'Myth. The pressure often looks and feels different by gender, even though both face it.'},
    {d:1,myth:true,t:'"Antinatalism" and "efilism" are exactly interchangeable terms.',e:'Myth. They overlap but aren\'t identical — efilism typically extends its concern to all sentient life, not only humans.'},
    {d:1,myth:false,t:'Some couples decide together, mutually and without outside pressure, not to have children.',e:'Reality. Plenty of childfree decisions are simply a shared preference, nothing more dramatic.'},
    {d:1,myth:true,t:'Wanting to remain childfree is always a symptom of trauma or a mental health issue.',e:'Myth. It can be, for some — but for most it\'s simply a preference, like any other life choice.'},
    {d:1,myth:false,t:'There is peer-reviewed academic literature studying childfree adults specifically.',e:'Reality. Researchers have studied this population directly for decades.'},
    {d:1,myth:false,t:'A person\'s reproductive choice, on its own, tells you nothing about whether they\'d have been a "good" parent.',e:'Reality. Wanting or not wanting children isn\'t a parenting-skill test.'},
    {d:1,myth:true,t:'Only wealthy people choose to be childfree.',e:'Myth. The choice cuts across income levels; reasons rarely reduce to money alone.'},
    {d:1,myth:false,t:'Some non-parents are still involved in caregiving, through roles like fostering, mentoring, or extended-family support.',e:'Reality. Caregiving and parenthood aren\'t the same thing.'},
    {d:1,myth:true,t:'Every self-identified antinatalist refuses all involvement with children, including teaching or mentoring.',e:'Myth. Antinatalism is a position about creating new lives, not a ban on caring about children who already exist.'},
    {d:1,myth:false,t:'Staying quiet instead of justifying yourself when asked "so when are you having kids?" is a completely valid response.',e:'Reality. You don\'t owe anyone an explanation for a private decision.'},
    {d:2,myth:false,t:'David Benatar\'s 2006 book "Better Never to Have Been" is one of the most discussed modern academic texts on antinatalism.',e:'Reality. It\'s widely cited — and widely argued with — in contemporary philosophy of population ethics.'},
    {d:2,myth:false,t:'Arthur Schopenhauer\'s 19th-century pessimistic philosophy is often cited by later writers on antinatalism.',e:'Reality. His work on suffering and will is a common reference point, even though he predates the term.'},
    {d:2,myth:true,t:'Antinatalism as a line of thought is only a few years old, invented sometime in the 21st century.',e:'Myth. Its roots trace back through 19th- and 20th-century philosophical pessimism, long before the recent surge in attention.'},
    {d:2,myth:false,t:'Peter Wessel Zapffe\'s 1933 essay "The Last Messiah" is commonly cited in discussions of philosophical pessimism.',e:'Reality. It\'s an early, frequently referenced text in this territory.'},
    {d:2,myth:true,t:'Every argument for reducing population size is automatically an antinatalist argument.',e:'Myth. Population-reduction arguments are usually about numbers and resources; antinatalism is usually about the ethics of creating any individual life.'},
    {d:2,myth:false,t:'The "asymmetry" between pleasure and pain in existence versus non-existence is a central part of Benatar\'s argument.',e:'Reality. It\'s the core mechanism his case is built on.'},
    {d:2,myth:true,t:'Benatar\'s asymmetry argument is universally accepted among philosophers, with no serious objections ever raised.',e:'Myth. It\'s influential but heavily contested; several of its premises are actively disputed in the literature.'},
    {d:2,myth:true,t:'"Natalism" and "pronatalism" are always used as strictly identical terms with no difference in emphasis.',e:'Myth. Usage varies, but "pronatalism" more often implies actively promoting or incentivising births.'},
    {d:2,myth:false,t:'Various religious and philosophical traditions throughout history have included ascetic or pessimistic views on procreation.',e:'Reality. Strands of this appear across multiple traditions, long predating any modern label.'},
    {d:2,myth:true,t:'Antinatalism is the same thing as being "anti-family."',e:'Myth. It\'s a position about creating new lives, not a stance against existing families or relationships.'},
    {d:2,myth:false,t:'A person can support other people\'s right to have children while personally choosing not to.',e:'Reality. Respecting a right doesn\'t require exercising it yourself.'},
    {d:2,myth:true,t:'"I personally don\'t want kids" and "no one should ever have kids" are exactly the same claim.',e:'Myth. One is a personal preference; the other is a universal philosophical claim — very different in scope.'},
    {d:2,myth:false,t:'Some research on parental happiness shows more mixed, complicated results than a simple "parents are happier" headline suggests.',e:'Reality. Findings vary by study design, country, and life stage — it\'s not a settled, simple picture.'},
    {d:2,myth:true,t:'Everyone who studies or writes about antinatalism personally wishes they had never been born.',e:'Myth. Many scholars engage with it critically or neutrally, including to argue against it.'},
    {d:2,myth:false,t:'The phrase "childless by choice" was in use before "childfree" became the more common self-description.',e:'Reality. "Childfree" became the more popular self-identifier later, especially with online communities.'},
    {d:2,myth:false,t:'Efilism generally extends its ethical concern to all sentient life, not only humans.',e:'Reality. That broader scope is one of the more common ways it\'s distinguished from antinatalism.'},
    {d:2,myth:true,t:'Critiquing the ethics of procreation as a general practice is the same as condemning people who already had children.',e:'Myth. Examining a practice and judging an individual are different things — most careful arguments separate the two.'},
    {d:2,myth:false,t:'Cultural "baby fever" narratives sometimes frame a personal decision as if it were a universal biological inevitability.',e:'Reality. That framing shows up often in media and casual conversation, and it isn\'t universally true.'},
    {d:2,myth:true,t:'Financial cost is the one single reason every childfree person gives, with no other reasons ever mentioned.',e:'Myth. Cited reasons range across freedom, career, health, the state of the world, or simply preference.'},
    {d:2,myth:false,t:'Concerns about climate change and resource use show up in some, but not all, people\'s reasons for not having children.',e:'Reality. It\'s one factor among many, not a universal one.'},
    {d:2,myth:true,t:'An argument being uncomfortable to hear is the same thing as it being logically wrong.',e:'Myth. Discomfort is a reaction, not a refutation — an argument still has to be answered on its merits.'},
    {d:2,myth:false,t:'Workplace policies have sometimes offered fewer scheduling accommodations to childfree employees than to parents.',e:'Reality. This is a documented pattern in some workplace-policy discussions, not a fringe claim.'},
    {d:2,myth:true,t:'Every philosopher who studies antinatalism uses one single, universally agreed-upon definition of it.',e:'Myth. Definitions vary — strong versus weak, universal versus conditional — the tradition isn\'t monolithic.'},
    {d:2,myth:false,t:'A "conditional" antinatalist position can allow that procreation might be acceptable under some limited circumstances.',e:'Reality. Not every version of the position is absolute.'},
    {d:2,myth:false,t:'Émile Cioran, a 20th-century philosopher known for pessimistic writing, is sometimes cited in discussions of this territory.',e:'Reality. His work is a frequent reference point, alongside Schopenhauer and Zapffe.'},
    {d:2,myth:true,t:'Any argument against creating new lives is automatically also an argument for ending existing ones.',e:'Myth. This is a common but false equivalence — the two questions are logically distinct.'},
    {d:2,myth:false,t:'Population ethics is an established subfield within academic moral philosophy.',e:'Reality. It has its own literature, conferences, and specialists.'},
    {d:2,myth:true,t:'Debates about reproductive choice have no historical connection to broader conversations about bodily autonomy.',e:'Myth. The two conversations have long overlapped in ethics and law.'},
    {d:2,myth:false,t:'Someone can be at peace with their own life while still finding certain antinatalist arguments worth thinking through.',e:'Reality. Engaging with an idea intellectually doesn\'t require adopting it personally.'},
    {d:2,myth:true,t:'Antinatalist arguments about suffering claim that literally every moment of every life is pure suffering.',e:'Myth. Most versions are more nuanced — about risk, consent, and asymmetry — not a blanket claim that all experience is agony.'},
    {d:2,myth:false,t:'"Antinatalism" is a coined term combining "natal" (birth) with the "anti-" prefix.',e:'Reality. That\'s the term\'s basic etymology.'},
    {d:2,myth:false,t:'Assuming every childfree person "should just adopt instead" overlooks that adoption is its own separate decision with its own considerations.',e:'Reality. Adoption isn\'t a default fallback — it\'s a distinct choice with its own process, motivations, and challenges.'},
    {d:2,myth:false,t:'Someone childless due to circumstance, like infertility, and someone childfree by choice can face similar social assumptions despite very different situations.',e:'Reality. Both groups often get treated the same by outside assumptions, even though their situations differ.'},
    {d:2,myth:true,t:'Anyone raised without pressure to have kids will automatically end up not wanting them.',e:'Myth. Upbringing is one influence among many; it doesn\'t determine the outcome on its own.'},
    {d:2,myth:true,t:'Weighing childbearing decisions in ethical terms is a uniquely modern habit that no past philosopher ever engaged in.',e:'Myth. Philosophers and religious thinkers have weighed procreation in ethical terms for a very long time.'},
    {d:3,myth:false,t:'Documented cases of adults choosing to remain childless or childfree exist across different historical periods, even though the modern vocabulary is recent.',e:'Reality. The choice itself predates the terminology we now use for it.'},
    {d:3,myth:true,t:'Every serious version of antinatalism claims no life is ever worth starting, under any possible future, with zero exceptions across the whole tradition.',e:'Myth. Treating the strongest, most absolute version as the only version overstates the tradition — conditional and weaker forms exist too.'},
    {d:3,myth:false,t:'The asymmetry argument holds that the absence of pain (if a person never exists) and the absence of pleasure (if a person never exists) are not equally weighted in value.',e:'Reality. That unequal weighting is exactly what the argument turns on.'},
    {d:3,myth:true,t:'Antinatalism logically requires believing that people who already exist have no right to keep living.',e:'Myth. The position concerns whether to create a new life, not whether existing lives deserve to continue.'},
    {d:3,myth:false,t:'A thought experiment can be philosophically useful for testing intuitions even when its conclusion feels bleak.',e:'Reality. Philosophy regularly uses uncomfortable scenarios precisely because they stress-test our assumptions.'},
    {d:3,myth:true,t:'If a philosophical argument makes you uneasy, that discomfort alone proves the argument is wrong.',e:'Myth. Feelings are a reasonable reason to look closer, but they aren\'t a refutation by themselves.'},
    {d:3,myth:false,t:'Some antinatalist reasoning focuses on the fact that a future person can\'t consent in advance to being exposed to life\'s risks.',e:'Reality. The impossibility of prior consent is one recurring thread in this reasoning.'},
    {d:3,myth:true,t:'Every antinatalist argument is fundamentally religious, with no purely secular philosophical version.',e:'Myth. Secular, purely philosophical versions — like Benatar\'s — are among the most widely discussed.'},
    {d:3,myth:false,t:'Antinatalist reasoning isn\'t philosophically uniform — some versions lean on weighing harms and benefits, others on rights-based reasoning.',e:'Reality. Different thinkers arrive at similar conclusions from different ethical starting points.'},
    {d:3,myth:true,t:'Pronatalism being the more common view is, by itself, proof that it\'s the correct one.',e:'Myth. Popularity isn\'t evidence of correctness — that\'s a classic reasoning shortcut worth catching in yourself.'},
    {d:3,myth:true,t:'Something being biologically common or "natural" automatically makes it ethically required.',e:'Myth. This is the naturalistic fallacy — what commonly happens in nature doesn\'t by itself tell you what ought to happen.'},
    {d:3,myth:true,t:'Continuing a family\'s genetic line is, by itself, a sufficient ethical justification for creating a new person — a claim with no serious counterargument.',e:'Myth. This is a contested premise, not a settled one — many ethicists ask what obligation, if any, a new person\'s wellbeing owes to someone else\'s lineage.'},
    {d:3,myth:false,t:'It\'s possible to hold a pessimistic view about future lives in the abstract while still finding real meaning in your own present life.',e:'Reality. Abstract philosophical positions and lived, personal meaning can coexist without contradiction.'},
    {d:3,myth:false,t:'Whether never existing can count as a "harm" to a person who never exists is a genuinely unsettled question philosophers still debate.',e:'Reality. It\'s an open puzzle in population ethics, not a question with one obvious answer.'},
    {d:3,myth:true,t:'Every academic who studies antinatalist philosophy personally endorses it.',e:'Myth. Studying a position — including to critique it — is different from holding it.'},
    {d:3,myth:true,t:'Criticizing the societal pressure to reproduce automatically means condemning any specific parent\'s personal choice.',e:'Myth. Critiquing a system of pressure and judging one person\'s decision are not the same move.'},
    {d:3,myth:false,t:'There\'s a difference between critiquing a systemic pressure to reproduce and criticizing one particular person\'s decision to become a parent.',e:'Reality. Keeping that distinction clear is what separates fair critique from unfair judgment of individuals.'},
    {d:3,myth:true,t:'Because most people eventually want children, anyone who says they don\'t must just be going through a phase that will pass.',e:'Myth. This is a hasty generalisation — a common pattern doesn\'t guarantee every individual case follows it.'},
    {d:3,myth:true,t:'A 20-year-old\'s certainty about not wanting children is scientifically guaranteed to reverse by their 40s.',e:'Myth. No such guarantee exists; some people\'s certainty holds for life, and some people\'s changes — both are real outcomes.'},
    {d:3,myth:false,t:'Some people stay certain about a life choice for decades, and some people change their minds — both patterns show up in real life, and neither is "the truth" for everyone.',e:'Reality. Individual variation is the honest answer here, not a single predictable trajectory.'},
    {d:3,myth:false,t:'Regret statistics casually cited about childfree adults often turn out to be exaggerated or untraceable to any credible source once you check.',e:'Reality. Numbers that circulate in conversation frequently don\'t hold up when you try to trace them back to a real study — worth checking before repeating.'},
    {d:3,myth:true,t:'"Antinatalism" and "misanthropy" mean exactly the same thing.',e:'Myth. One is a position about the ethics of creating new lives; the other is a general dislike of people. They can overlap, but they aren\'t synonyms.'},
    {d:3,myth:false,t:'Someone can care deeply about human welfare and still conclude, personally, that they\'d rather not create a new person themselves.',e:'Reality. Caring about people already here and choosing not to add one more are compatible positions.'},
    {d:3,myth:false,t:'Framing a woman\'s reproductive decisions mainly around a "ticking" biological clock can flatten a complex personal choice into a single deadline narrative.',e:'Reality. The metaphor tends to crowd out every other factor in the decision.'},
    {d:3,myth:true,t:'Only women receive social pressure about reproductive timelines; men experience no comparable version of it.',e:'Myth. Men face related pressure too, often framed differently — around legacy, masculinity, or "settling down."'},
    {d:3,myth:true,t:'Whether tax policy or workplace norms should favor parents over non-parents is a settled, uncontroversial question with no real debate.',e:'Myth. It\'s an actively debated policy question, not a closed case.'},
    {d:3,myth:true,t:'Pointing out that a social norm exists proves that the norm is fair or correct.',e:'Myth. This is the appeal-to-tradition fallacy — existing and being fair are two different things.'},
    {d:3,myth:false,t:'Trying to state the strongest version of an argument you disagree with, before responding to it, is a useful way to test your own reasoning.',e:'Reality. This habit (sometimes called steelmanning) tends to sharpen your own position, not weaken it.'},
    {d:3,myth:true,t:'A high score on a myth-vs-reality quiz proves that your own life choices are the "correct" ones.',e:'Myth. Knowing the facts and having made the "right" personal decision are two different things — this quiz tests knowledge, not your life.'},
    {d:3,myth:false,t:'It\'s possible to walk away from a philosophical debate still disagreeing with it, while understanding it more clearly than before.',e:'Reality. Understanding an argument and agreeing with it are not the same outcome — both are worth aiming for separately.'},
    {d:3,myth:false,t:'Catching yourself having assumed something about parenthood or childfreedom was "just obviously true" — before ever checking — is an ordinary, useful moment of self-reflection, not a personal failure.',e:'Reality. Noticing an unchecked assumption is exactly how you get sharper — that\'s the whole point of this quiz.'}
  ];

  var MAXLEVEL=8, LIVES_START=3;
  var scoreEl=$('score'), streakEl=$('streak'), bestEl=$('best'), levelEl=$('level'), livesEl=$('lives');
  var meterFill=$('meter'), qhost=$('qhost');
  var best=(A.getJSON?A.getJSON('best',0):0)||0;
  var bestLevel=(A.getJSON?A.getJSON('bestLevel',0):0)||0;
  if(bestEl) bestEl.textContent=best;

  var st={running:false,over:false,score:0,streak:0,roundBest:0,lives:LIVES_START,level:1,elapsed:0,
    timeLimit:10,tLeft:10,awaiting:false,used:[],cur:-1,missed:[],timer:null};

  function tierForLevel(lvl){ return lvl<=2?1:(lvl<=5?2:3); }
  function timeLimitForLevel(lvl){ return Math.max(4,11-lvl); }

  function pickIndex(){
    var tier=tierForLevel(st.level);
    var pool=[];
    for(var i=0;i<ITEMS.length;i++){ if(ITEMS[i].d===tier && st.used.indexOf(i)===-1) pool.push(i); }
    if(!pool.length){ for(var j=0;j<ITEMS.length;j++){ if(st.used.indexOf(j)===-1) pool.push(j); } }
    if(!pool.length){ st.used=[]; for(var k=0;k<ITEMS.length;k++) pool.push(k); }
    return pool[Math.floor(Math.random()*pool.length)];
  }

  function hud(){
    if(scoreEl)scoreEl.textContent=st.score;
    if(streakEl)streakEl.textContent=st.streak;
    if(bestEl)bestEl.textContent=best;
    if(levelEl)levelEl.textContent=st.level;
    if(livesEl)livesEl.textContent=new Array(Math.max(0,st.lives)+1).join('♥ ').trim()||'—';
  }

  function timerBar(){ if(A.meter&&meterFill) A.meter(meterFill,st.timeLimit?st.tLeft/st.timeLimit*100:0); }

  function diffLabel(d){ return d===1?'Warm-up':(d===2?'Level up':'Expert'); }

  function renderIntro(){
    if(!qhost) return;
    var bl=bestLevel?('<p class="note">Best level reached so far: <strong>'+bestLevel+'</strong></p>'):'';
    qhost.innerHTML='<div class="qcard"><p class="stmt">100 myth-or-reality statements. Answer fast — every 10 seconds the challenge gets harder: tougher statements, less time to answer, and 3 lives before it\'s over.</p>'+bl+'<button class="btn btn-primary" id="startBtn" type="button">Start Challenge</button></div>';
    var b=$('startBtn'); if(b) b.addEventListener('click',startGame);
    if(A.meter&&meterFill)A.meter(meterFill,0);
  }

  function startGame(){
    if(st.timer) clearInterval(st.timer);
    var timer=null;
    if(!headless) timer=setInterval(tick,1000);
    Object.assign(st,{running:true,over:false,score:0,streak:0,roundBest:0,lives:LIVES_START,level:1,elapsed:0,
      timeLimit:10,tLeft:10,awaiting:false,used:[],cur:-1,missed:[],timer:timer});
    hud();
    next();
  }

  function next(){
    st.cur=pickIndex();
    st.used.push(st.cur);
    st.timeLimit=timeLimitForLevel(st.level);
    st.tLeft=st.timeLimit;
    st.awaiting=true;
    renderQuestion();
    hud(); timerBar();
  }

  function renderQuestion(){
    if(!qhost) return;
    var it=ITEMS[st.cur];
    qhost.innerHTML='<div class="qcard"><p class="note">Level '+st.level+' · <span class="diffbadge d'+it.d+'">'+diffLabel(it.d)+'</span> · '+st.timeLimit+'s to answer</p><div class="stmt">"'+esc(it.t)+'"</div><div class="mr"><button type="button" class="myth" data-v="myth">Myth</button><button type="button" class="real" data-v="real">Reality</button></div><div class="fb" id="fb"></div></div>';
    qhost.querySelectorAll('.mr button').forEach(function(b){ b.addEventListener('click',function(){ resolve(b.getAttribute('data-v')==='myth'); }); });
  }

  function resolve(saidMythOrNull){
    if(!st.awaiting) return;
    st.awaiting=false;
    var it=ITEMS[st.cur];
    var timedOut=(saidMythOrNull===null);
    var correct=(!timedOut && saidMythOrNull===it.myth);
    if(correct){ st.score++; st.streak++; if(st.streak>st.roundBest) st.roundBest=st.streak; if(st.streak>best){ best=st.streak; if(A.setJSON)A.setJSON('best',best); } }
    else { st.lives--; st.streak=0; st.missed.push(it); }
    hud();
    var host=qhost.querySelector('.qcard');
    if(host){ host.querySelectorAll('.mr button').forEach(function(b){ b.disabled=true; b.style.opacity=0.6; }); }
    var over=(st.lives<=0);
    var fb=$('fb');
    if(fb){ fb.classList.add('show');
      fb.innerHTML='<div class="verdict '+(correct?'ok':'no')+'">'+(timedOut?'Time\'s up ✗':(correct?'Correct ✓':'Not quite ✗'))+'</div><span class="tag '+(it.myth?'tmyth':'treal')+'">'+(it.myth?'MYTH':'REALITY')+'</span><p style="margin-top:8px">'+esc(it.e)+'</p><button class="btn btn-primary" id="nextBtn" type="button">'+(over?'See results':'Next')+'</button>';
    }
    var nb=$('nextBtn'); if(nb) nb.addEventListener('click',function(){ over?gameOver():next(); });
  }

  function tick(){
    if(!st.running) return;
    st.elapsed++;
    var lvl=Math.min(MAXLEVEL,Math.floor(st.elapsed/10)+1);
    if(lvl!==st.level) st.level=lvl;
    if(st.awaiting){
      st.tLeft--; timerBar();
      if(st.tLeft<=0) resolve(null);
    }
    hud();
  }

  function gameOver(){
    st.running=false; st.over=true;
    if(st.timer){ clearInterval(st.timer); st.timer=null; }
    if(st.level>bestLevel){ bestLevel=st.level; if(A.setJSON)A.setJSON('bestLevel',bestLevel); }
    var reviewHtml='';
    if(st.missed.length){
      reviewHtml='<div class="review"><h4>What tripped you up</h4>'+st.missed.map(function(it){
        return '<div class="rvitem"><span class="tag '+(it.myth?'tmyth':'treal')+'">'+(it.myth?'MYTH':'REALITY')+'</span><p class="stmt2">"'+esc(it.t)+'"</p><p class="note">'+esc(it.e)+'</p></div>';
      }).join('')+'</div>';
    }
    qhost.innerHTML='<div class="qcard"><div class="big" style="font-size:2rem;font-weight:800">'+st.score+' correct · reached Level '+st.level+'</div><p class="stmt">Longest streak this round: '+st.roundBest+'</p><p class="note">Whatever the score says, the goal was never a perfect run — it was catching which assumptions you were carrying in without checking.</p>'+reviewHtml+'<button class="btn btn-primary" id="againBtn" type="button">Play again</button></div>';
    var a=$('againBtn'); if(a) a.addEventListener('click',startGame);
    if(A.meter&&meterFill)A.meter(meterFill,0);
  }

  hud(); renderIntro();

  /* test hook: lets the jsdom harness drive the game without waiting on real timers */
  window.__quiz={state:st,items:ITEMS,start:startGame,tick:tick,resolve:resolve,next:next};

  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 064 script error', e); }
});
