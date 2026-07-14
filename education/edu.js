/* The Education — primer interactions. Vanilla JS, uses window.ANCF. */
document.addEventListener('DOMContentLoaded', function () {
  try {
    /* ---------- theme (same behaviour as home.js) ---------- */
    var root = document.documentElement, saved = null;
    try { saved = localStorage.getItem('ancf-theme'); } catch (e) {}
    if (saved) root.setAttribute('data-theme', saved);
    else if (window.matchMedia && matchMedia('(prefers-color-scheme:dark)').matches) root.setAttribute('data-theme', 'dark');
    var tg = document.getElementById('themeBtn');
    function lab(){ if(tg) tg.textContent = (root.getAttribute('data-theme')==='dark') ? '☀ Light' : '☾ Dark'; }
    lab();
    if (tg) tg.addEventListener('click', function(){
      var d = root.getAttribute('data-theme')==='dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', d);
      try { localStorage.setItem('ancf-theme', d); } catch(e){}
      lab();
    });

    /* ---------- the ten disciplines ---------- */
    var LEVELS = {
      foundation:   { label:'Foundation',            sub:'Everything rests here' },
      external:     { label:'External pressure',     sub:'Why the default is enforced' },
      internal:     { label:'Internal pressure',     sub:'Why the default is felt' },
      institutional:{ label:'Institutional battlegrounds', sub:'Where the position meets organised power' },
      practitioner: { label:'Practitioner’s level', sub:'How to carry it — and coexist' }
    };
    var DISC = [
      { n:1, level:'foundation', name:'Moral Philosophy', lvlName:'The foundation',
        claim:`Bringing a person into existence imposes serious, unconsented, avoidable harm — not because life is worthless, but because never existing costs no one anything, while existing guarantees suffering to someone.`,
        concepts:['The asymmetry of pain and pleasure','The consent argument (Shiffrin)','The priority of preventing suffering','The non-identity structure'],
        obj:`Premise four does person-affecting work — a missing pleasure is “not bad” because no one is deprived — while premise three abandons it, calling a missing pain “good” with no one there to benefit. Held to one standard, the asymmetry collapses into symmetry.`,
        reply:`Premise three isn’t arbitrary: it’s the only reading that explains an intuition almost everyone holds — we treat a miserable child’s suffering as a reason not to conceive, but no one treats a happy child’s joy as a duty to conceive. And the case rests on three pillars, so it survives even if the asymmetry falls.`,
        group:`Most fights start from misreading this as “life is worthless” or as being about ending lives. Knowing the real comparison — starting vs. never starting — ends half of them.`,
        bridge:`Book 1, The Asymmetry, defends all four premises against the formal literature, works through the non-identity problem and Shiffrin’s conditions, walls the position off from the pro-mortalist misreading, and closes with an honest inventory of where the arguments are still vulnerable.`,
        track:'01-moral-philosophy/index.html',
        book:'complete' },
      { n:2, level:'external', name:'Political Theory', lvlName:'External pressure, part one',
        claim:`Pronatalism isn’t just a cultural mood — it’s state policy: birth deliberately promoted for national, economic, and military ends, with real mechanisms and a documented history of abuse. Choosing not to procreate is never done on neutral ground.`,
        concepts:['The instrumental state','The coercion–pressure spectrum','The historical ceiling: Romania, 1966–1989','The demographic-panic narrative'],
        obj:`“Antinatalism is eugenics-adjacent.” States have practiced coercive anti-natalism — forced sterilization of the poor, disabled, imprisoned, and minorities — under the banner of population concern.`,
        reply:`That history must be conceded in full — and it is the exact opposite of this position, which is universal in reasoning and voluntary in application. Any selective or coercive application isn’t a variant of antinatalism but its negation.`,
        group:`Keeps critique aimed at policy, never at any people or population — the marker that stops a group turning ugly.`,
        bridge:`The full volume traces coercive pronatalism (Romania, Nazi Germany, the USSR) and the contemporary policy landscape, and hands the enforcement question to sociology.`,
        book:'complete' },
      { n:3, level:'external', name:'Sociology', lvlName:'External pressure, part two',
        claim:`What the state prefers, society enforces without passing a law — through a standard life script, a stigma machinery for those who deviate, and patterns of exclusion with real costs. The sociology of the childfree is the study of how a default is policed.`,
        concepts:['The standard life script','The stigma machinery','Exclusion and identity management'],
        obj:`“This is grievance inflation.” The childfree in liberal societies face raised eyebrows, not violence or disenfranchisement — and parents face potent stigmas of their own. Borrowing the vocabulary of serious discrimination cheapens it.`,
        reply:`The honest response measures the stigma precisely rather than inflating it — naming real social costs without claiming they equal systemic oppression.`,
        group:`Names the scripts members are reacting to, so the heat lands on the pressure, not on each other.`,
        bridge:`The full volume gives the empirical literature on childfree stigma, the demography of voluntary childlessness (older and more common than panic admits), and the three stereotypes traced to their history — the raw material rhetoric later defuses.`,
        book:'complete' },
      { n:4, level:'internal', name:'Evolutionary Psychology', lvlName:'Internal pressure, part one',
        claim:`The drive to reproduce is an adaptation, not an argument — selected to maximize genetic replication, indifferent to anyone’s wellbeing or consent. Recognizing a feeling as evolved machinery dissolves its claim to moral authority. “It is natural” was never a reason.`,
        concepts:['The blind watchmaker','The decoupling of sex and reproduction','Evolutionary awareness','The naturalistic fallacy — handled with care'],
        obj:`“Your debunking cuts your own throat.” If the reproductive drive is discredited because it was selected for, so are the moral intuitions antinatalism runs on — that suffering matters, that consent matters — which are equally evolved.`,
        reply:`The reply draws a careful metaethical line: debunking bites hardest where a drive tracks nothing but reproductive success, and far less where a faculty tracks reasons we can examine. The volume defends exactly where the cut stops.`,
        group:`Defuses “it’s natural, therefore right” without pretending the drive isn’t real.`,
        bridge:`The full volume gives the evolutionary psychology of reproduction without just-so storytelling, the contraceptive decoupling of sex and reproduction, and evolutionary awareness as a trainable practice.`,
        book:'complete' },
      { n:5, level:'internal', name:'Trauma Psychology', lvlName:'Internal pressure, part two',
        claim:`Some procreation is driven by unexamined wounds rather than considered choice — the impulse to repeat, repair, or be rescued by a child who never agreed to the role. For some people, in some lineages, not having children is the most complete form of cycle-breaking available.`,
        concepts:['Repetition compulsion','The instrumentalized child','Intergenerational transmission','Cycle-breaking and prophylactic ethics'],
        obj:`“You’re medicalizing a philosophical choice and insulting every parent.” Clinical language smuggles in psychology’s authority to do the philosophy’s work — and implies anyone who wants children is unknowingly sick.`,
        reply:`Both prongs land, so the volume frames this as understanding, not diagnosis: it describes a real pattern in some lives without claiming to explain every choice or to judge loving parents.`,
        group:`The most misused discipline online — this teaches care, not diagnosis, exactly where members wound each other.`,
        bridge:`The full volume gives the psychodynamic and attachment literature on repetition and transmission, and the research on intergenerational trauma, with the clinical caution a primer can’t.`,
        book:'complete' },
      { n:6, level:'institutional', name:'Economics', lvlName:'Institutional battleground, part one',
        claim:`The economic case for procreation rests on a structure that needs each generation to fund the last — and that structure, not any child’s welfare, drives the demand for births. To create a person as a future taxpayer or caregiver is to impose an unconsented obligation at birth.`,
        concepts:['Pay-as-you-go and the demographic structure','The “Ponzi” analogy and its honest limits','The unconsented obligation','The constructed safety net'],
        obj:`“You’re doing what you condemn — reducing children to an economic calculation.” The chapter attacks natalism for instrumentalizing children, then tallies the money saved by not having them.`,
        reply:`The reply keeps the moral and the prudential separate: the objection to natalism is about imposing an obligation without consent, not about whether a child is “worth it” — and a childfree person still has to build a real safety net.`,
        group:`Replaces slogans with the actual pension math, so economic debates stop looping.`,
        bridge:`The full volume gives PAYGO systems and the dependency ratio without the Ponzi overstatement, the genuine challenges of aging societies stated fairly, and the architecture of a deliberately constructed safety net.`,
        book:'complete' },
      { n:7, level:'institutional', name:'Religious Studies', lvlName:'Institutional battleground, part two',
        claim:`The religious mandate to reproduce isn’t the single settled command it’s presented as. Within the major traditions run interpretive currents — whether the command was bounded, fulfilled, or superseded, and what stewardship of a finite world requires — that complicate any claim that faith straightforwardly obligates procreation.`,
        concepts:['The bounded-mandate reading','The supersession reading','Stewardship and eco-theology','The use of children across religious history'],
        obj:`“This is cherry-picking — motivated interpretation dressed as scholarship.” The counter-readings are real but minority currents; the dominant, historically continuous reading is strongly natalist.`,
        reply:`Met without defensiveness: the goal isn’t to defeat scripture but to show the traditions contain their own internal debate — dissenting readings given proportionate, not inflated, weight.`,
        group:`Lets members engage faith respectfully instead of dismissively — a frequent flashpoint.`,
        bridge:`The full volume gives the interpretive history of Genesis 1:28 across Jewish and Christian traditions, dominant and dissenting readings in proportion, and the supersession debate with its strongest natalist rebuttals.`,
        book:'complete' },
      { n:8, level:'institutional', name:'Law', lvlName:'Institutional battleground, part three',
        claim:`The law is not neutral on reproduction. It can obstruct those who seek not to reproduce — through paternalistic barriers to voluntary sterilization — and disadvantage those with no dependents. Reproductive autonomy has two edges; the antinatalist’s interest is in the one the law has protected far less carefully.`,
        concepts:['Bodily autonomy and its two edges','Barriers to voluntary sterilization','The symmetry of reproductive coercion','Family-status disadvantage at work'],
        obj:`“This trivializes discrimination law by dressing inconvenience as injustice.” Anti-discrimination law was built for grave, systemic exclusion — not for a childfree employee asked to cover a holiday shift.`,
        reply:`Partly right, and conceded: the volume keeps the serious claim (autonomy, sterilization access) distinct from the minor one (workplace fairness), so the weight of the framework isn’t cheapened. Educational, not legal advice — laws vary and change.`,
        group:`Keeps rights-talk accurate instead of confidently wrong.`,
        bridge:`The in-progress volume sources the law by jurisdiction and date: voluntary-sterilization law and the documented pattern of paternalistic refusal, and reproductive-autonomy jurisprudence and its asymmetric development.`,
        book:'progress' },
      { n:9, level:'practitioner', name:'Rhetoric', lvlName:'Practitioner’s level, part one',
        claim:`A true position, badly carried, persuades no one and discredits itself. Rhetoric is the discipline of stating antinatalism under hostile conditions without distorting it — its first commitment is honesty, not winning. Be understood by the reachable; remain undamaged by the unreachable; never score.`,
        concepts:['Audience triage','The instrumentality turn','Conceding the true premise','Calibrated retreat and the refusal to overclaim'],
        obj:`“Rhetoric training produces glib debaters, not honest thinkers — it teaches people to win a conversation about a conclusion they’ve already decided to hold.”`,
        reply:`A careless rhetoric chapter earns that charge; this one refuses it by making honesty the constraint the techniques serve — concede true premises, retreat where the case is weak, never overclaim. Winning while losing credibility counts as failure.`,
        group:`The core anti-fight discipline: how to disagree under hostility without distorting the position or the person.`,
        bridge:`The planned volume develops audience analysis as a skill and works through the set-piece exchanges — selfishness, legacy, care in old age, “it’s natural,” “most people are glad to be alive” — as understanding, not scripts.`,
        book:'planned' },
      { n:10, level:'practitioner', name:'Emotional Regulation', lvlName:'Practitioner’s level, part two — the destination',
        claim:`A philosophy that takes suffering seriously can become a source of suffering if held without care. The final discipline isn’t an argument for antinatalism but a practice for living with it — sustainably, generously, without bitterness or collapse. The destination was never an argument won; it was a person who can hold a heavy truth and remain whole, kind, and at peace.`,
        concepts:['The dichotomy of control','Cognitive restructuring of the outsider identity','Chosen community and selective inclusion','The guard against misanthropy'],
        obj:`“If holding this philosophy needs a whole discipline of psychological coping, that’s evidence the philosophy is harmful — true beliefs don’t need this much emotional scaffolding.”`,
        reply:`The most penetrating objection in the book, and it can’t be answered with a logical move — only by showing the practice produces care rather than despair, and by conceding honestly where a community organized around a wound goes wrong.`,
        group:`The antidote to the doom-spiral and burnout that empty out communities — “not the argument perfected, but the person intact.”`,
        bridge:`The planned volume develops holding a feeling without obeying it (the dichotomy of control), restructuring the outsider identity, building chosen community, and guarding against misanthropy.`,
        book:'planned' }
    ];
    var STATUS = {
      complete:{cls:'complete', txt:'Full volume · complete'},
      progress:{cls:'progress', txt:'Full volume · in progress'},
      planned: {cls:'planned',  txt:'Full volume · planned'}
    };

    /* ---------- progress state ---------- */
    var readState = ANCF.getJSON('read', {}) || {};
    var quizPassed = ANCF.get('quizpass', '') === '1';

    /* ---------- render discipline cards ---------- */
    var list = document.getElementById('discList');
    function esc(s){ return s; }
    DISC.forEach(function(d){
      var art = document.createElement('article');
      art.className = 'disc';
      art.id = 'd' + d.n;
      var st = STATUS[d.book];
      art.innerHTML =
        '<button class="disc-head" type="button" aria-expanded="false">' +
          '<span class="dnum">' + d.n + '</span>' +
          '<span class="dtitle"><h3>' + d.name + '</h3><span class="dlvl">' + d.lvlName + '</span></span>' +
          '<svg class="chev" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 5l6 5-6 5"/></svg>' +
        '</button>' +
        '<div class="disc-body">' +
          '<h4>The claim</h4><p class="claimline">' + d.claim + '</p>' +
          '<h4>Core concepts</h4><div class="concepts">' + d.concepts.map(function(c){return '<span>'+c+'</span>';}).join('') + '</div>' +
          '<h4>The strongest objection</h4><div class="steel"><p class="obj">' + d.obj + '</p><p class="reply"><b>The reply →</b> ' + d.reply + '</p></div>' +
          '<h4>In the group</h4><div class="ingroup"><b>Why it lowers conflict:</b> ' + d.group + '</div>' +
          '<h4>What the full volume adds</h4><p class="bridge">' + d.bridge + '</p>' +
          '<div class="disc-foot">' +
            '<span class="status ' + st.cls + '">' + st.txt + '</span>' +
            '<span class="spacer" style="flex:1"></span>' +
            (d.track ? '<a class="btn btn-primary" href="' + d.track + '">Enter the deep track →</a>' : '') +
            '<button class="btn readbtn" type="button" data-n="' + d.n + '">Mark as read</button>' +
          '</div>' +
        '</div>';
      list.appendChild(art);
    });

    /* ---------- render map tiles ---------- */
    DISC.forEach(function(d){
      var host = document.getElementById('tiles-' + d.level);
      if (!host) return;
      var b = document.createElement('button');
      b.className = 'tile'; b.type = 'button'; b.setAttribute('data-n', d.n);
      b.innerHTML = '<span class="tnum">' + d.n + '</span><span><span class="tname">' + d.name + '</span></span>';
      host.appendChild(b);
    });

    /* ---------- accordion ---------- */
    function openDisc(n, scroll){
      var art = document.getElementById('d' + n);
      if (!art) return;
      art.classList.add('open');
      var h = art.querySelector('.disc-head'); if (h) h.setAttribute('aria-expanded','true');
      if (scroll) art.scrollIntoView({behavior:'smooth', block:'start'});
    }
    list.querySelectorAll('.disc-head').forEach(function(h){
      h.addEventListener('click', function(){
        var art = h.parentNode, isOpen = art.classList.toggle('open');
        h.setAttribute('aria-expanded', isOpen ? 'true':'false');
      });
    });

    /* ---------- mark-as-read + progress ---------- */
    var pfill = document.getElementById('pfill'), pcount = document.getElementById('pcount');
    function refresh(){
      var done = 0;
      DISC.forEach(function(d){
        var read = !!readState[d.n];
        if (read) done++;
        var art = document.getElementById('d' + d.n);
        var btn = art.querySelector('.readbtn');
        art.classList.toggle('done', read);
        btn.classList.toggle('is-done', read);
        btn.textContent = read ? 'Read ✓' : 'Mark as read';
        var tile = document.querySelector('.tile[data-n="'+d.n+'"]');
        if (tile) tile.classList.toggle('done', read);
      });
      var pct = Math.round(done/DISC.length*100);
      ANCF.meter(pfill, pct);
      if (pcount) pcount.textContent = done + ' / ' + DISC.length + ' disciplines';
      updateGrad(done);
    }
    list.querySelectorAll('.readbtn').forEach(function(b){
      b.addEventListener('click', function(e){
        e.stopPropagation();
        var n = b.getAttribute('data-n');
        readState[n] = !readState[n];
        ANCF.setJSON('read', readState);
        refresh();
      });
    });
    document.querySelectorAll('.tile').forEach(function(t){
      t.addEventListener('click', function(){ openDisc(t.getAttribute('data-n'), true); });
    });

    /* ---------- asymmetry matrix ---------- */
    var amxNote = document.getElementById('amxNote');
    document.querySelectorAll('.amx .cell[data-note]').forEach(function(c){
      c.addEventListener('click', function(){
        document.querySelectorAll('.amx .cell').forEach(function(x){x.classList.remove('open');});
        c.classList.add('open');
        if (amxNote) amxNote.textContent = c.getAttribute('data-note');
      });
    });

    /* ---------- primer check quiz ---------- */
    var ANSWERS = [0, 0, 0, 0];
    var EXPL = [
      'The asymmetry is a comparison between existing and never existing — never between living and dying.',
      'The position concerns starting lives only; existing people’s interests carry full moral weight.',
      'It is universal in its reasoning and voluntary in its application — that second word is not negotiable.',
      'Every discipline must name its strongest objection and answer it without caricature — that is the basis of the project’s credibility.'
    ];
    var picked = {};
    if (window.ANCF && ANCF.initOptions) {
      ANCF.initOptions(document.getElementById('quizbox'), function(q,i){ picked[q] = +i; });
    }
    var scoreBtn = document.getElementById('quizScore'), resetBtn = document.getElementById('quizReset'),
        resultEl = document.getElementById('quizResult');
    if (scoreBtn) scoreBtn.addEventListener('click', function(){
      var correct = 0;
      for (var q=0; q<ANSWERS.length; q++){
        var ex = document.querySelector('.explain[data-q="'+q+'"]');
        if (ex){ ex.style.display='block'; ex.textContent = (picked[q]===ANSWERS[q] ? '✓ ' : '✗ ') + EXPL[q]; }
        if (picked[q]===ANSWERS[q]) correct++;
      }
      if (resultEl){
        resultEl.style.display='block';
        resultEl.textContent = 'You got ' + correct + ' of ' + ANSWERS.length + '. ' +
          (correct>=3 ? 'That’s a pass — the primer’s core is yours.' : 'Re-read the thesis and the markers, then try again.');
      }
      quizPassed = correct>=3;
      ANCF.set('quizpass', quizPassed ? '1':'0');
      if (resetBtn) resetBtn.style.display='inline-block';
      updateGrad();
    });
    if (resetBtn) resetBtn.addEventListener('click', function(){
      picked = {};
      document.querySelectorAll('#quizbox .opt').forEach(function(o){o.classList.remove('sel');o.setAttribute('aria-pressed','false');});
      document.querySelectorAll('#quizbox .explain').forEach(function(e){e.style.display='none';});
      if (resultEl) resultEl.style.display='none';
      resetBtn.style.display='none';
    });

    /* ---------- graduation ---------- */
    var grad = document.getElementById('grad'), gradMsg = document.getElementById('gradMsg');
    function updateGrad(doneCount){
      if (typeof doneCount !== 'number') doneCount = DISC.filter(function(d){return !!readState[d.n];}).length;
      var all = doneCount >= DISC.length;
      var ready = all && quizPassed;
      if (!grad) return;
      grad.classList.toggle('locked', !ready);
      if (gradMsg){
        gradMsg.textContent = ready
          ? 'You’ve read all ten discipline summaries and passed the check. You now hold the whole structure — ready for the deep tracks, Book by Book.'
          : 'Read all ten discipline summaries and pass the primer check to complete the foundation. (' + doneCount + '/' + DISC.length + ' read' + (quizPassed?', check passed':'') + '.)';
      }
    }

    refresh();
    updateGrad();
  } catch (e) { console.error('education primer script error', e); }
});
