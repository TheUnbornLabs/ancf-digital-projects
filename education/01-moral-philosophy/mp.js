/* Moral Philosophy track — The Asymmetry. Vanilla JS, uses window.ANCF. */
document.addEventListener('DOMContentLoaded', function(){
 try{
  var root=document.documentElement,s=null;try{s=localStorage.getItem('ancf-theme');}catch(e){}
  if(s)root.setAttribute('data-theme',s);else if(window.matchMedia&&matchMedia('(prefers-color-scheme:dark)').matches)root.setAttribute('data-theme','dark');
  var tb=document.getElementById('themeBtn');function lab(){if(tb)tb.textContent=root.getAttribute('data-theme')==='dark'?'☀ Light':'☾ Dark';}lab();
  if(tb)tb.addEventListener('click',function(){var d=root.getAttribute('data-theme')==='dark'?'light':'dark';root.setAttribute('data-theme',d);try{localStorage.setItem('ancf-theme',d);}catch(e){}lab();});

  var explored={}; // tools engaged
  function mark(t){explored[t]=true;ANCF.setJSON('explored',explored);updateMastery();}
  explored=ANCF.getJSON('explored',{})||{};

  /* ---- asymmetry matrix ---- */
  var amxNote=document.getElementById('amxNote');
  document.querySelectorAll('.amx .cell[data-note]').forEach(function(c){
    c.addEventListener('click',function(){
      document.querySelectorAll('.amx .cell').forEach(function(x){x.classList.remove('open');});
      c.classList.add('open'); if(amxNote)amxNote.textContent=c.getAttribute('data-note'); mark('matrix');
    });
  });

  /* ---- premise tester ---- */
  var P={p1:'a',p2:'a',p3:'a',p4:'a'};
  var verdict=document.getElementById('pverdict');
  function premiseVerdict(){
    if(P.p1==='r'||P.p2==='r'){return 'Premises 1 and 2 are the uncontroversial ones — that pain is bad and pleasure is good. Reject either and you have left ordinary moral reasoning behind; almost no critic goes here.';}
    if(P.p3==='r'&&P.p4==='r'){return 'With both 3 and 4 gone, both rows are a wash. Existence and non-existence come out even — full symmetry, and the comparative argument does not even begin.';}
    if(P.p3==='r'){return 'Reject Premise 3 and the missing pain no longer counts as a good. The pain row becomes a wash, the asymmetry collapses into symmetry, and the argument fails — this is close to the strongest objection in the literature.';}
    if(P.p4==='r'){return 'Reject Premise 4 and the missing pleasure now counts as bad — a real loss to no one. Scenario B loses the pleasure row, symmetry is restored, and the comparative conclusion does not follow.';}
    return 'All four accepted: the pain row favours never-existing (a good beats a bad), and the pleasure row is at worst a wash (no one is deprived). Non-existence never loses a category — so coming into existence is a harm relative to never existing. Note this is a comparison, not a claim that any life is not worth continuing.';
  }
  function renderPremises(){
    document.querySelectorAll('.premise').forEach(function(row){
      var k=row.getAttribute('data-p');
      row.querySelectorAll('.toggle-ar button').forEach(function(b){
        var on=b.getAttribute('data-v')===P[k];
        b.classList.toggle('on',on);
        b.classList.toggle('rej',b.getAttribute('data-v')==='r');
      });
    });
    if(verdict)verdict.textContent=premiseVerdict();
  }
  document.querySelectorAll('.premise .toggle-ar button').forEach(function(b){
    b.addEventListener('click',function(){
      var k=b.parentNode.parentNode.getAttribute('data-p');
      P[k]=b.getAttribute('data-v'); renderPremises(); mark('premise');
    });
  });
  var pReset=document.getElementById('pReset');
  if(pReset)pReset.addEventListener('click',function(){P={p1:'a',p2:'a',p3:'a',p4:'a'};renderPremises();});
  renderPremises();

  /* ---- three pillars ---- */
  var pillarsDown={};
  var pv=document.getElementById('pillarVerdict');
  function pillarVerdict(){
    var down=Object.keys(pillarsDown).filter(function(k){return pillarsDown[k];});
    var standing=3-down.length;
    if(standing===3)return 'All three pillars stand. The moral case is at full strength — and note it was built on three legs precisely so it never depends on any one.';
    if(standing===0)return 'Concede all three and the moral case is gone. But that takes three separate refutations, of three independent arguments — the natalist who beats one has beaten only one.';
    var names={asym:'the asymmetry',consent:'the consent argument',prio:'the priority of preventing suffering'};
    var left=['asym','consent','prio'].filter(function(k){return !pillarsDown[k];}).map(function(k){return names[k];});
    return 'Even conceding '+down.map(function(k){return names[k];}).join(' and ')+', the case still stands on '+left.join(' and ')+'. That is the whole point of the three-pillar structure: the position does not rest on one.';
  }
  document.querySelectorAll('.pillar').forEach(function(p){
    p.addEventListener('click',function(){
      var k=p.getAttribute('data-k'); pillarsDown[k]=!pillarsDown[k];
      p.classList.toggle('down',pillarsDown[k]);
      p.querySelector('.pstate').textContent=pillarsDown[k]?'conceded — this pillar fails':'standing';
      if(pv)pv.textContent=pillarVerdict(); mark('pillars');
    });
  });
  if(pv)pv.textContent=pillarVerdict();

  /* ---- non-identity puzzle ---- */
  var niFb=document.getElementById('niFb');
  var NI={
    a:'But “that child” would not exist had they waited — a different child would. There is no one who is worse off than they otherwise would have been. That is the non-identity puzzle: ordinary “harm” needs a victim made worse off, and here there is none.',
    b:'This is the person-affecting reply — and it is exactly why procreation ethics is hard. The child’s only alternative was never existing, so “harm” in the usual sense finds no grip. The asymmetry tries to answer with impersonal value instead.',
    c:'Just so. Person-affecting reasoning stalls, because before the act there is no person to be made better or worse off. Chapter Six works through the three routes the antinatalist can take — each coherent, each contested.'
  };
  document.querySelectorAll('.ni-opt').forEach(function(o){
    o.addEventListener('click',function(){
      document.querySelectorAll('.ni-opt').forEach(function(x){x.classList.remove('sel');});
      o.classList.add('sel');
      if(niFb){niFb.style.display='block';niFb.textContent=NI[o.getAttribute('data-k')];}
      mark('nonidentity');
    });
  });

  /* ---- vulnerabilities accordion ---- */
  var VULN=[
    ['The argument begins in intuitions that can be refused','All three foundational intuitions are widely shared and well-supported by the further judgments they explain — but none is a theorem. Someone who simply does not share them makes no logical error. This is the vulnerability of substantive moral philosophy as such: it cannot be removed, only made costly to refuse.'],
    ['The symmetry objection may simply be right','The charge that Premises Three and Four are not held to one standard gets, in the volume’s own judgment, an answer that is good but not decisive. A serious rival — the wide person-affecting principle — explains the same asymmetries without impersonal value. Contained by the three-pillar structure rather than cured.'],
    ['The no-subject problem is a permanent tax','That absent pain can be “good” with no one to benefit faces the standing objection that value requires a subject. Each reading of the premise answers one form of the objection and inherits another. Not resolved — a tax paid every time the argument is run.'],
    ['Non-identity has no agreed solution','Four decades after Parfit, no response commands general assent. The antinatalist has three coherent routes through it — more than a position in trouble usually has — but each needs a contested metaphysical commitment the natalist can refuse.'],
    ['Whole-life goodness pushes the strong claim off the field','The unconditional “every birth is a harm, full stop” gives ground to the whole-life challenge; the most honest reply retreats to “creating is an unjustified imposition.” The clearest case in the book of altitude traded for solidity.'],
    ['The testimony of the living','Almost everyone who has lived affirms their own existence. The volume argues this speaks to continuing a life, not starting one — but a position that must explain away near-universal self-assessment carries real weight, and the danger there is moral as much as logical.'],
    ['The consent pillar’s borrowed horizon','Offered as independent of the asymmetry, and in its starting point it is — but its deepest premise leans back on the same non-identity ground the other pillars rest on. Independent in premises, convergent in horizon.']
  ];
  var vhost=document.getElementById('vulnList');
  if(vhost)VULN.forEach(function(v,i){
    var d=document.createElement('div');d.className='vuln';
    d.innerHTML='<button type="button"><span class="vnum">'+(i+1)+'</span><span>'+v[0]+'</span></button><div class="vbody">'+v[1]+'</div>';
    d.querySelector('button').addEventListener('click',function(){d.classList.toggle('open');mark('vuln');});
    vhost.appendChild(d);
  });

  /* ---- chapter list ---- */
  var CH=[
    ['ch0','Groundwork: A Short Map of Moral Philosophy','Before the argument',3276],
    ['ch1','Two Intuitions and Four Premises','Ch 1 · Part One',5451],
    ['ch2','Why the Absence of Pain Is Good','Ch 2 · Part One',4341],
    ['ch3','The Symmetry Objection and the Formal Attacks','Ch 3 · Part One',4832],
    ['ch4','The Consent Argument','Ch 4 · Part Two',3530],
    ['ch5','The Priority of Preventing Suffering','Ch 5 · Part Two',2948],
    ['ch6','The Non-Identity Problem','Ch 6 · Part Three',4656],
    ['ch7','The Whole-Life Evaluation Challenge','Ch 7 · Part Three',1980],
    ['ch8','Where Our Arguments Are Vulnerable','Ch 8 · Part Four',3874]
  ];
  var BKEY='ancf:mp-book-read';
  function bookRead(){try{return JSON.parse(localStorage.getItem(BKEY))||{};}catch(e){return {};}}
  var chost=document.getElementById('chList');
  if(chost)CH.forEach(function(c){
    var a=document.createElement('a');a.className='chrow';a.href='book/'+c[0]+'.html';
    a.innerHTML='<span class="cn">'+(c[0]==='ch0'?'0':c[0].slice(2))+'</span><span class="ct"><b>'+c[1]+'</b><span>'+c[2]+'</span></span><span class="cw">'+c[3].toLocaleString()+' words</span>';
    chost.appendChild(a);
  });

  /* ---- mastery quiz ---- */
  var ANS=[0,0,0,0,0,0];
  var EX=[
    'The asymmetry compares existence with never existing — never living with dying.',
    'Premises Three and Four carry the weight and draw the fire; One and Two are barely contested.',
    'If the asymmetry falls, the consent argument and the priority of preventing suffering still stand — three pillars, not one.',
    'The consent argument is an independent pillar; it survives even if Benatar is wrong about everything.',
    'A foundation you have never stress-tested is not one you can build nine books on — so the book ends by naming its own open problems.',
    'What survives every chapter is the modest claim: procreation is a morally serious act, not a weightless default.'
  ];
  var picked={};
  if(window.ANCF&&ANCF.initOptions)ANCF.initOptions(document.getElementById('quizbox'),function(q,i){picked[q]=+i;});
  var sBtn=document.getElementById('quizScore'),rBtn=document.getElementById('quizReset'),res=document.getElementById('quizResult');
  var quizPassed=ANCF.get('quizpass','')==='1';
  if(sBtn)sBtn.addEventListener('click',function(){
    var ok=0;
    for(var q=0;q<ANS.length;q++){var ex=document.querySelector('.explain[data-q="'+q+'"]');
      if(ex){ex.style.display='block';ex.textContent=(picked[q]===ANS[q]?'✓ ':'✗ ')+EX[q];}
      if(picked[q]===ANS[q])ok++;}
    if(res){res.style.display='block';res.textContent='You got '+ok+' of '+ANS.length+'. '+(ok>=4?'That is a pass — you can state the case and its limits.':'Re-read Chapters Two, Four and Eight, then try again.');}
    quizPassed=ok>=4;ANCF.set('quizpass',quizPassed?'1':'0');
    if(rBtn)rBtn.style.display='inline-block';updateMastery();
  });
  if(rBtn)rBtn.addEventListener('click',function(){picked={};
    document.querySelectorAll('#quizbox .opt').forEach(function(o){o.classList.remove('sel');o.setAttribute('aria-pressed','false');});
    document.querySelectorAll('#quizbox .explain').forEach(function(e){e.style.display='none';});
    if(res)res.style.display='none';rBtn.style.display='none';});

  /* ---- mastery badge ---- */
  var TOOLS=['matrix','premise','pillars','nonidentity','vuln'];
  var grad=document.getElementById('grad'),gmsg=document.getElementById('gradMsg'),pfill=document.getElementById('pfill'),pcount=document.getElementById('pcount');
  function updateMastery(){
    var done=TOOLS.filter(function(t){return explored[t];}).length;
    var toolsAll=done>=TOOLS.length;
    var pct=Math.round((done/TOOLS.length)*80 + (quizPassed?20:0));
    if(pfill)ANCF.meter(pfill,pct);
    var br=bookRead(),bc=Object.keys(br).filter(function(k){return br[k];}).length;
    if(pcount)pcount.textContent=done+'/'+TOOLS.length+' tools · '+(quizPassed?'check passed':'check open')+' · '+bc+'/9 chapters read';
    var ready=toolsAll&&quizPassed;
    if(grad){grad.classList.toggle('locked',!ready);
      if(gmsg)gmsg.textContent=ready
        ?'Mastered. You can build the four premises, watch the symmetry objection bite, knock out a pillar and see the case still stand, sit with the non-identity problem, and name the position’s real vulnerabilities. That is the foundation the other nine disciplines borrow their verdict from.'
        :'Engage all five tools and pass the check to master this discipline. ('+done+'/'+TOOLS.length+' tools, '+(quizPassed?'check passed':'check open')+'.)';
    }
  }
  updateMastery();
 }catch(e){console.error('moral philosophy track error',e);}
});
