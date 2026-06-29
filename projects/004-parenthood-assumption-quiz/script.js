/* ============================================================
   Project 004 · Parenthood Assumption Quiz — interactive logic
   Vanilla JS. Uses window.ANCF helpers (../../ancf-ui.js).
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A = window.ANCF || {};
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  var FAM = {
    tradition:'Tradition', fear:'Fear & loneliness', status:'Status & identity', duty:'Duty',
    legacy:'Legacy', gender:'Gender role', economic:'Economics', natural:'Naturalness',
    fulfillment:'Fulfillment & meaning', normalcy:'Normalcy & default'
  };

  var ASSUMPTIONS = [
    { id:'whenkids', fam:'normalcy', saying:'"So, when are you having kids?"',
      premise:'That having children is the default next step everyone takes — only the timing is in question.',
      truth:'Most people do have children, and thinking ahead about timing is sensible.',
      doubt:'"Common" is not "compulsory." A default that is never chosen is not really a decision.',
      question:'If literally no one ever asked me this, would I still want it for myself?' },
    { id:'justwhat', fam:'tradition', saying:'"It\'s just what people do."',
      premise:'That a practice is justified simply because it is customary.',
      truth:'Traditions carry accumulated wisdom, belonging, and continuity.',
      doubt:'Habit is not a reason. Many long-held customs were later, rightly, rethought.',
      question:'Would I still choose this if it were not the custom?' },
    { id:'careold', fam:'fear', saying:'"Who will look after you when you\'re old?"',
      premise:'That children are an insurance policy against a lonely old age.',
      truth:'Family can be a genuine source of late-life support and connection.',
      doubt:'Children are not guaranteed caregivers, and support can be planned, chosen, and built.',
      question:'Am I considering a whole person, or buying insurance?' },
    { id:'realadult', fam:'status', saying:'"A real adult settles down and has a family."',
      premise:'That adulthood and maturity are proven by becoming a parent.',
      truth:'Raising a child genuinely demands — and grows — maturity.',
      doubt:'Plenty of deeply mature, responsible adults never parent. Worth is not a checklist.',
      question:'What actually makes someone a grown-up?' },
    { id:'familyline', fam:'duty', saying:'"It\'s your duty to continue the family line."',
      premise:'That you owe reproduction to your ancestors or your family.',
      truth:'Honoring where we come from is a real and meaningful impulse.',
      doubt:'A person cannot owe a debt simply by existing; no one signed that contract.',
      question:'Can a duty bind me if I never agreed to it?' },
    { id:'remember', fam:'legacy', saying:'"Who will carry on your name and remember you?"',
      premise:'That a life only echoes forward through descendants.',
      truth:'The wish to matter beyond our own lifespan is deeply human.',
      doubt:'Legacy runs through work, love, ideas, mentorship, and kindness — not only DNA.',
      question:'How do the people I admire actually live on?' },
    { id:'womancomplete', fam:'gender', saying:'"A woman isn\'t complete without children."',
      premise:'That gender identity is fulfilled only by parenthood — the "motherhood mandate."',
      truth:'Parenthood is a profound, identity-shaping experience for many people.',
      doubt:'Wholeness is not issued by reproduction; this premise has a long history of constraining women.',
      question:'Whose definition of "complete" is this, and do I share it?' },
    { id:'investment', fam:'economic', saying:'"Children are an investment — they\'ll pay off."',
      premise:'That children are partly a financial or practical return.',
      truth:'Families really do share resources, labor, and care across a life.',
      doubt:'Treating a person as a return is shaky ethics, and shakier economics.',
      question:'Is this about a life, or a ledger?' },
    { id:'onlynatural', fam:'natural', saying:'"It\'s only natural — it\'s what we\'re made for."',
      premise:'That because reproduction is biologically common, it is a duty.',
      truth:'The drive to nurture and connect is a deep part of being human.',
      doubt:'"Natural" describes; it does not prescribe — that leap is the naturalistic fallacy.',
      question:'Does "natural" really mean "required"?' },
    { id:'reallove', fam:'fulfillment', saying:'"You\'ll never know real love or meaning until you have kids."',
      premise:'That the deepest meaning and love are available only through parenthood.',
      truth:'Many parents describe it as the central meaning of their lives.',
      doubt:'Meaning and love arrive through many doors; the slippery word is "only."',
      question:'Where has my life already held deep love and meaning?' },
    { id:'changemind', fam:'fear', saying:'"You\'ll change your mind — you\'ll regret it."',
      premise:'That a clear "no" is just an immature phase that will pass.',
      truth:'People do sometimes change, and a little humility about the future is wise.',
      doubt:'"You\'ll regret it" is said to certainty of every kind; a possible future feeling doesn\'t void present judgment.',
      question:'Am I being allowed to decide, or just told I can\'t?' },
    { id:'nextstep', fam:'normalcy', saying:'"It\'s the obvious next step after marriage."',
      premise:'That marriage is a staging post on a fixed track toward children.',
      truth:'Many couples do want exactly this sequence, and that is wonderful for them.',
      doubt:'A relationship is not a conveyor belt; each step can be considered on its own.',
      question:'Who wrote this script, and did I ever sign it?' },
    { id:'completefamily', fam:'fulfillment', saying:'"A family isn\'t complete without children."',
      premise:'That a couple is unfinished until a child arrives.',
      truth:'Many people deeply long for the family they picture.',
      doubt:'Two people who love each other are already a family.',
      question:'What, to me, makes a family "complete"?' },
    { id:'mostimportant', fam:'status', saying:'"Having kids is the most important thing you\'ll ever do."',
      premise:'That parenthood is the single highest human achievement, ranking other lives below it.',
      truth:'Raising a person well is genuinely significant work.',
      doubt:'There are many ways to live a consequential, generous, important life.',
      question:'Important to whom, and measured how?' },
    { id:'depriving', fam:'duty', saying:'"You\'d be depriving your parents of grandchildren."',
      premise:'That you owe your parents grandchildren.',
      truth:'A parent\'s hope for grandchildren is real and tender.',
      doubt:'Their wish is theirs to hold; it is not a claim on your body or your life.',
      question:'Whose life is this decision actually about?' },
    { id:'purpose', fam:'gender', saying:'"Motherhood is a woman\'s true purpose."',
      premise:'That a woman\'s central purpose is biologically assigned.',
      truth:'Parenting matters enormously to the people who choose it.',
      doubt:'Purpose is authored, not assigned; this idea has long been used to limit options.',
      question:'Who decided my purpose for me?' },
    { id:'clock', fam:'natural', saying:'"Your biological clock is ticking."',
      premise:'That there is one narrow "right time," and you are failing it.',
      truth:'Fertility does change with age — that part is a real medical fact.',
      doubt:'Medical facts belong with your doctor, not as a social countdown; "the clock" is a 1970s media phrase.',
      question:'Is this medical guidance, or social pressure wearing a lab coat?' },
    { id:'affordit', fam:'economic', saying:'"You can afford it — there\'s never a perfect time."',
      premise:'That the only barrier is money or readiness, never desire.',
      truth:'It is true that no one ever feels completely "ready."',
      doubt:'Whether I could afford it was never the question; whether I want it is.',
      question:'Am I answering the question that was actually asked?' }
  ];

  /* decoder cards: assumption id + 3 family options (correct first, shuffled at render) */
  var DECK = [
    { id:'justwhat', opts:['tradition','economic','status'] },
    { id:'careold', opts:['fear','duty','normalcy'] },
    { id:'realadult', opts:['status','legacy','natural'] },
    { id:'familyline', opts:['duty','fear','economic'] },
    { id:'womancomplete', opts:['gender','tradition','fulfillment'] },
    { id:'onlynatural', opts:['natural','duty','normalcy'] },
    { id:'reallove', opts:['fulfillment','status','fear'] },
    { id:'affordit', opts:['economic','normalcy','tradition'] }
  ];
  function byId(id){ for(var i=0;i<ASSUMPTIONS.length;i++){ if(ASSUMPTIONS[i].id===id) return ASSUMPTIONS[i]; } return null; }
  function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a; }

  /* ============================================================
     2 · Spot-the-assumption decoder
     ============================================================ */
  (function(){
    var deck=$('deck'), prog=$('deckProgress'), resetB=$('deckReset');
    if(!deck) return;
    var answered={};
    function render(){
      deck.innerHTML = DECK.map(function(card, idx){
        var a=byId(card.id); if(!a) return '';
        var opts=shuffle(card.opts);
        var btns=opts.map(function(f){ return '<button class="pickbtn" type="button" data-card="'+idx+'" data-fam="'+f+'">'+esc(FAM[f])+'</button>'; }).join('');
        return '<div class="dcard" data-card="'+idx+'" data-correct="'+a.fam+'"><p class="saying">'+esc(a.saying)+'</p>'+
          '<div class="opts">'+btns+'</div>'+
          '<div class="reveal"><p><span class="lbl">Hidden premise</span><br>'+esc(a.premise)+'</p>'+
          '<p><span class="lbl">Examine it</span><br>'+esc(a.doubt)+' <em>'+esc(a.question)+'</em></p></div></div>';
      }).join('');
      deck.querySelectorAll('.pickbtn').forEach(function(b){
        b.addEventListener('click', function(){
          var ci=+b.getAttribute('data-card'), card=deck.querySelector('.dcard[data-card="'+ci+'"]');
          if(card.classList.contains('done')) return;
          var correct=card.getAttribute('data-correct'), chosen=b.getAttribute('data-fam');
          card.querySelectorAll('.pickbtn').forEach(function(x){
            var xf=x.getAttribute('data-fam');
            if(xf===correct) x.classList.add('ok'); else if(x===b) x.classList.add('no');
            x.disabled=true;
          });
          card.classList.add('done');
          answered[ci]=(chosen===correct);
          updateProg();
        });
      });
      updateProg();
    }
    function updateProg(){
      var done=Object.keys(answered).length, right=0;
      Object.keys(answered).forEach(function(k){ if(answered[k]) right++; });
      if(!prog) return;
      if(done===0){ prog.textContent='Pick the assumption each saying leans on most. '+DECK.length+' cards.'; }
      else if(done<DECK.length){ prog.textContent=done+' of '+DECK.length+' answered.'; }
      else { prog.textContent='All '+DECK.length+' done — you matched '+right+' with the primary family. Many sayings carry several at once; noticing them is the whole point.'; }
    }
    resetB && resetB.addEventListener('click', function(){ answered={}; render(); });
    render();
  })();

  /* ============================================================
     3 · Assumption library (filter + search)
     ============================================================ */
  (function(){
    var listEl=$('assumList'), chipsEl=$('libChips'), searchEl=$('libSearch'), countEl=$('libCount');
    if(!listEl) return;
    var activeFam='all', term='';
    var fams=Object.keys(FAM).filter(function(f){ return ASSUMPTIONS.some(function(a){return a.fam===f;}); });
    var chips=[{k:'all',label:'All'}].concat(fams.map(function(k){ return {k:k,label:FAM[k]}; }));
    chipsEl.innerHTML = chips.map(function(c){ return '<span class="libchip'+(c.k==='all'?' active':'')+'" data-k="'+c.k+'" role="button" tabindex="0">'+esc(c.label)+'</span>'; }).join('');
    chipsEl.querySelectorAll('.libchip').forEach(function(ch){
      function sel(){ activeFam=ch.getAttribute('data-k'); chipsEl.querySelectorAll('.libchip').forEach(function(x){ x.classList.remove('active'); }); ch.classList.add('active'); render(); }
      ch.addEventListener('click', sel);
      ch.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); sel(); } });
    });
    if(searchEl) searchEl.addEventListener('input', function(){ term=searchEl.value.toLowerCase().trim(); render(); });
    function matches(a){
      if(activeFam!=='all' && a.fam!==activeFam) return false;
      if(!term) return true;
      var hay=(a.saying+' '+a.premise+' '+a.truth+' '+a.doubt+' '+a.question+' '+FAM[a.fam]).toLowerCase();
      return hay.indexOf(term)>-1;
    }
    function render(){
      var shown=ASSUMPTIONS.filter(matches);
      countEl.textContent = shown.length+' of '+ASSUMPTIONS.length+' assumptions'+(activeFam!=='all'?(' · '+FAM[activeFam]):'')+(term?(' · "'+term+'"'):'');
      if(!shown.length){ listEl.innerHTML='<p class="lib-empty">No assumptions match that search. Try another word or clear the filter.</p>'; return; }
      listEl.innerHTML = shown.map(function(a){
        return '<details class="assum"><summary><span class="fam f-'+a.fam+'">'+esc(FAM[a.fam])+'</span> <span class="ph">'+esc(a.saying)+'</span> <span class="chev" aria-hidden="true">›</span></summary>'+
          '<div class="body">'+
          '<p><span class="lbl">The hidden premise</span><br>'+esc(a.premise)+'</p>'+
          '<div class="examine"><div class="side truth"><b>The kernel of sense</b><br>'+esc(a.truth)+'</div>'+
            '<div class="side doubt"><b>What it overstates</b><br>'+esc(a.doubt)+'</div></div>'+
          '<div class="qn">'+esc(a.question)+'</div>'+
          '</div></details>';
      }).join('');
    }
    render();
  })();

  var WORDS=['none','a little','somewhat','strongly','very strongly'];
  /* ============================================================
     4 · Assumption profile (sliders -> radar + meter + insight)
     ============================================================ */
  (function(){
    var inputs=[].slice.call(document.querySelectorAll('#families input[type=range]'));
    if(!inputs.length) return;
    var sevBar=$('sevBar'), sevPct=$('sevPct'), radar=$('radar'), note=$('profileNote');
    function insight(items, pct, top){
      if(pct===0) return 'Nothing rated yet. As you move the sliders, this note will point you toward the assumption worth examining first.';
      var names=top.map(function(t){return t.label;});
      var s='Your strongest inherited assumption is <b>'+esc(names[0])+'</b>'+(top[1] && top[1].raw>=top[0].raw-1?(', closely followed by <b>'+esc(names[1])+'</b>'):'')+'. ';
      if(pct<25) s+='Overall the pull is light — these ideas are present but not running the show. A good place to examine one or two by choice.';
      else if(pct<55) s+='That is a real, moderate pull. Try taking your top family through the Belief Examiner (⑤) — naming it is most of the work.';
      else s+='That is a strong pull, which is completely normal given how early these are taught. Be gentle with yourself: a strong assumption isn\'t a flaw, just the loudest thing to examine first.';
      var fearItem=items.filter(function(i){return i.label==='Fear';})[0];
      if(fearItem && fearItem.raw>=3) s+=' <br><br>Your <b>fear</b>-based assumptions are high — the "you\'ll regret it / be alone" family. Those respond less to argument than to honest planning and self-compassion; the Examiner can help separate the fear from the fact.';
      return s;
    }
    function update(){
      var total=0, items=[];
      inputs.forEach(function(inp){
        var v=+inp.value; total+=v;
        items.push({label:inp.getAttribute('data-axis'), value:Math.round(v/4*100), raw:v});
        var out=$(inp.id.replace('f-','o-')); if(out) out.textContent=WORDS[v];
      });
      var pct=Math.round(total/(inputs.length*4)*100);
      if(A.meter) A.meter(sevBar,pct); if(sevPct) sevPct.textContent=pct+'%';
      if(A.radar) A.radar(radar, items);
      var top=items.slice().sort(function(a,b){return b.raw-a.raw;});
      if(note) note.innerHTML = insight(items, pct, top);
      var store={}; inputs.forEach(function(inp){ store[inp.id]=inp.value; });
      if(A.setJSON) A.setJSON('families', store);
    }
    var saved=A.getJSON?A.getJSON('families',null):null;
    inputs.forEach(function(inp){ if(saved&&saved[inp.id]!=null) inp.value=saved[inp.id]; inp.addEventListener('input', update); });
    update();
    var copyB=$('profCopy'), clearB=$('profClear');
    if(copyB) copyB.addEventListener('click', function(){
      var lines=['My parenthood-assumption profile',''];
      inputs.forEach(function(inp){ lines.push('  • '+inp.getAttribute('data-axis')+': '+WORDS[+inp.value]); });
      if(A.copy) A.copy(lines.join('\n'), copyB);
    });
    if(clearB) clearB.addEventListener('click', function(){
      if(!window.confirm('Reset all sliders to none on this device?')) return;
      inputs.forEach(function(inp){ inp.value=0; }); update();
    });
    // expose strongest family for trace + reflection
    window.__p4_strongest = function(){
      var top=null,mv=-1;
      inputs.forEach(function(inp){ if(+inp.value>mv){ mv=+inp.value; top=inp.getAttribute('data-axis'); } });
      return mv>0?top:null;
    };
  })();

  /* ============================================================
     5 · Belief examiner (Socratic stepper)
     ============================================================ */
  (function(){
    var box=$('examinerBox');
    if(!box) return;
    var QS=[
      { id:'voice', q:'1. Whose voice is this, really? Where did you first absorb it?',
        choices:[ {v:'family',t:'It came from family — worth asking if you still agree with them here.'},
                  {v:'culture',t:'It came from religion or the wider culture — a powerful source, and one you\'re allowed to weigh.'},
                  {v:'society',t:'It came from friends and society at large — "everyone knows" is social proof, not proof.'},
                  {v:'unsure',t:'You\'re not sure where it came from — which is itself a clue it was absorbed by default.'} ] },
      { id:'type', q:'2. Is it a description or a prescription?',
        choices:[ {v:'desc',t:'You read it as a description of what\'s common — fair, but "common" doesn\'t tell you what to do.'},
                  {v:'pres',t:'You can see it\'s really a rule about what you should do — now it\'s open to question, not just observation.'},
                  {v:'both',t:'It tangles both together — which is exactly how an "is" quietly becomes an "ought."'} ] },
      { id:'evidence', q:'3. Treated as a claim about the world, does the evidence hold?',
        choices:[ {v:'holds',t:'You think it mostly holds — good; a belief that survives scrutiny is one you can keep with confidence.'},
                  {v:'shaky',t:'It looks shaky, full of exceptions — a sign the rule is narrower than it sounds.'},
                  {v:'nonfactual',t:'It isn\'t really a factual claim at all — it\'s a value dressed as a fact, which you get to evaluate by your own values.'} ] },
      { id:'imagine', q:'4. Can you imagine a genuinely good, full life that breaks this rule?',
        choices:[ {v:'easily',t:'You can picture it easily — strong evidence the rule isn\'t a law of nature.'},
                  {v:'hard',t:'You can, but it feels hard — worth asking whether that difficulty is reality or just unfamiliarity.'},
                  {v:'no',t:'Honestly, not yet — a sign this belief runs deep, and may be worth sitting with longer before deciding.'} ] },
      { id:'benefit', q:'5. Who benefits most from your believing it?',
        choices:[ {v:'me',t:'You feel it genuinely serves you — then it may be worth keeping, now as a real choice.'},
                  {v:'others',t:'Mostly it serves someone else\'s expectations — that\'s worth weighing honestly against your own life.'},
                  {v:'unclear',t:'It\'s unclear who it serves — a good reason to slow down before letting it steer a major decision.'} ] }
    ];
    var state={ beliefId:null, step:0, answers:{} };

    function chooseScreen(){
      var optsHtml = ASSUMPTIONS.map(function(a){ return '<option value="'+a.id+'">'+esc(a.saying)+'</option>'; }).join('');
      box.innerHTML = '<div class="examiner"><p class="ex-q">Choose a belief you\'d like to examine</p>'+
        '<select id="exSelect" style="margin-bottom:12px">'+optsHtml+'</select>'+
        '<div class="ex-nav"><button class="btn btn-primary" id="exStart" type="button">Begin examining →</button></div></div>';
      $('exStart').addEventListener('click', function(){ state.beliefId=$('exSelect').value; state.step=1; state.answers={}; render(); });
    }
    function questionScreen(){
      var q=QS[state.step-1];
      var pct=Math.round((state.step-1)/QS.length*100);
      var chosen=state.answers[q.id];
      var choices=q.choices.map(function(c){ return '<button class="ex-choice'+(chosen===c.v?' sel':'')+'" type="button" data-v="'+c.v+'">'+esc(c.choices||c.label||labelFor(q.id,c.v))+'</button>'; }).join('');
      box.innerHTML='<div class="examiner"><div class="ex-progress"><span style="width:'+pct+'%"></span></div>'+
        '<p class="ex-q">'+esc(q.q)+'</p><div class="ex-choices">'+choices+'</div>'+
        '<div class="ex-nav"><button class="btn" id="exPrev" type="button">← Back</button><button class="btn btn-primary" id="exNext" type="button">'+(state.step===QS.length?'See summary →':'Next →')+'</button></div></div>';
      box.querySelectorAll('.ex-choice').forEach(function(b){ b.addEventListener('click', function(){ state.answers[q.id]=b.getAttribute('data-v'); box.querySelectorAll('.ex-choice').forEach(function(x){x.classList.remove('sel');}); b.classList.add('sel'); }); });
      $('exPrev').addEventListener('click', function(){ state.step--; if(state.step<1){ state.step=0; chooseScreen(); } else render(); });
      $('exNext').addEventListener('click', function(){
        if(!state.answers[q.id]){ var n=$('exNext'); var o=n.textContent; n.textContent='Pick one first'; setTimeout(function(){ n.textContent=o; },1200); return; }
        if(state.step===QS.length){ state.step=QS.length+1; render(); } else { state.step++; render(); }
      });
    }
    function labelFor(qid,v){ // human labels for choice buttons
      var M={ voice:{family:'A parent or family',culture:'Religion or culture',society:'Friends / "everyone"',unsure:'I\'m honestly not sure'},
              type:{desc:'A description of what\'s common',pres:'A rule about what I should do',both:'Both, tangled together'},
              evidence:{holds:'It mostly holds up',shaky:'It\'s shaky — lots of exceptions',nonfactual:'It\'s a value, not a fact'},
              imagine:{easily:'Yes, easily',hard:'Yes, but it feels hard',no:'Honestly, not yet'},
              benefit:{me:'Me',others:'Someone else\'s expectations',unclear:'Unclear / no one in particular'} };
      return (M[qid]&&M[qid][v])||v;
    }
    function summaryScreen(){
      var a=byId(state.beliefId);
      var lines='';
      QS.forEach(function(q){ var v=state.answers[q.id]; var c=q.choices.filter(function(x){return x.v===v;})[0]; if(c) lines+='<div class="line"><b>'+esc(q.q.replace(/^[0-9]+\.\s*/,''))+'</b>'+esc(c.t)+'</div>'; });
      // synthesized verdict
      var verdict='';
      var ans=state.answers;
      if(ans.type==='pres'||ans.type==='both'){ verdict+='You\'ve spotted that this is at least partly a <b>prescription</b> — a "should," not just an "is." '; }
      if(ans.imagine==='easily'){ verdict+='You can already picture a good life that breaks the rule, which is strong evidence it isn\'t a law of nature. '; }
      else if(ans.imagine==='no'){ verdict+='You can\'t yet picture living otherwise — worth sitting with this one longer rather than rushing a verdict. '; }
      if(ans.benefit==='others'){ verdict+='And it seems to serve others\' expectations more than your own life. '; }
      if(!verdict) verdict='You\'ve looked at this belief from several sides — which is the whole point. ';
      verdict+='Now the honest question is yours: <b>keep it</b> (as a real choice), <b>adjust it</b>, or <b>set it down</b>?';
      box.innerHTML='<div class="ex-summary"><h4>Examining: '+esc(a.saying)+'</h4>'+
        '<div class="line"><b>The hidden premise</b>'+esc(a.premise)+'</div>'+
        lines+
        '<div class="line"><b>What it tends to overstate</b>'+esc(a.doubt)+'</div>'+
        '<div class="line"><b>Where this leaves you</b>'+verdict+'</div>'+
        '</div><div class="ex-nav"><button class="btn" id="exRestart" type="button">↺ Examine another belief</button><button class="btn" id="exCopy" type="button">Copy this examination</button></div>';
      A.setJSON && A.setJSON('exam', {belief:a.saying, premise:a.premise, answers:ans});
      $('exRestart').addEventListener('click', function(){ state={beliefId:null,step:0,answers:{}}; chooseScreen(); });
      $('exCopy').addEventListener('click', function(){
        var txt=['Examining: '+a.saying,'','Hidden premise: '+a.premise,''];
        QS.forEach(function(q){ var v=ans[q.id]; var c=q.choices.filter(function(x){return x.v===v;})[0]; if(c) txt.push('• '+q.q.replace(/^[0-9]+\.\s*/,'')+' '+c.t); });
        txt.push('', 'Keep it, adjust it, or set it down — my call.');
        if(A.copy) A.copy(txt.join('\n'), $('exCopy'));
      });
    }
    function render(){ if(state.step===0) chooseScreen(); else if(state.step>=1 && state.step<=QS.length) questionScreen(); else summaryScreen(); }
    render();
  })();

  /* ============================================================
     6 · Trace the roots
     ============================================================ */
  (function(){
    var wrap=$('traceBoxes'), note=$('traceNote');
    if(!wrap) return;
    var boxes=[].slice.call(wrap.querySelectorAll('input[type=checkbox]'));
    var saved=A.getJSON?A.getJSON('origins',{}):{}; saved=saved||{};
    function update(){
      var picked=boxes.filter(function(b){return b.checked;});
      var store={}; boxes.forEach(function(b){ store[b.getAttribute('data-key')]=b.checked; });
      if(A.setJSON) A.setJSON('origins', store);
      var strong=window.__p4_strongest?window.__p4_strongest():null;
      if(!note) return;
      if(picked.length===0){ note.innerHTML = strong?('You marked <b>'+esc(strong)+'</b> as your strongest assumption (from section ④). Tick where it likely took root.'):'Tick the places your strongest assumption likely came from.'; return; }
      var labels=picked.map(function(b){ return b.parentNode.textContent.trim(); });
      var msg='You traced it to: <b>'+esc(labels.join(', '))+'</b>. ';
      if(store.never) msg+='Noticing you\'d "never questioned it" is the single most useful thing here — that\'s a belief running on default. ';
      msg+='None of these sources is wrong to have; the point is simply that now you can see the belief came from somewhere, which means you can decide whether to keep carrying it.';
      note.innerHTML=msg;
    }
    boxes.forEach(function(b){ var k=b.getAttribute('data-key'); b.checked=!!saved[k]; b.addEventListener('change', update); });
    update();
  })();

  /* ============================================================
     7 · Quiz
     ============================================================ */
  (function(){
    var Q=[
      {a:0,e:'"It\'s just what people do" appeals to tradition — habit standing in for a reason.'},
      {a:0,e:'Going from "most people do X" to "so you should do X" slides a description into a prescription. The second doesn\'t follow from the first.'},
      {a:1,e:'Examining a belief is meant to let you hold it on purpose — keep it, adjust it, or set it down. It is not about proving anyone wrong.'},
      {a:1,e:'It ties a person\'s completeness to gender — an assumption about gender and identity (the "motherhood mandate").'},
      {a:0,e:'Status-quo bias is our tendency to give the familiar, default option a free pass while the alternative has to justify itself.'},
      {a:0,e:'Keeping a belief after examining it — now as a deliberate choice — is a completely good outcome. Examining isn\'t the same as rejecting.'}
    ];
    var picks={}, total=document.querySelectorAll('#quizbox .quiz-q').length;
    if(A.initOptions) A.initOptions($('quizbox'), function(q,i){ picks[q]=+i; });
    var sB=$('quizScore'), rB=$('quizReset'), res=$('quizResult');
    if(sB) sB.addEventListener('click', function(){
      if(Object.keys(picks).length<total){ res.style.display='block'; res.textContent='Pick an answer for all '+total+' questions first.'; return; }
      var sc=0;
      Q.forEach(function(it,i){
        document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){
          var j=+x.getAttribute('data-i'); x.classList.remove('ok','no');
          if(j===it.a) x.classList.add('ok'); else if(j===picks[i]) x.classList.add('no');
        });
        var ex=document.querySelector('.explain[data-q="'+i+'"]'); if(ex){ ex.style.display='block'; ex.textContent=it.e; }
        if(picks[i]===it.a) sc++;
      });
      res.style.display='block';
      res.textContent='You matched '+sc+' of '+Q.length+' with the explained view. The aim isn\'t the score — it\'s the habit of noticing.';
      if(rB) rB.style.display='inline-block';
    });
    if(rB) rB.addEventListener('click', function(){
      picks={};
      document.querySelectorAll('#quizbox .opt').forEach(function(x){ x.classList.remove('sel','ok','no'); x.setAttribute('aria-pressed','false'); });
      document.querySelectorAll('#quizbox .explain').forEach(function(ex){ ex.style.display='none'; ex.textContent=''; });
      res.style.display='none'; rB.style.display='none';
    });
  })();

  /* ============================================================
     8 · Reflection + full summary
     ============================================================ */
  (function(){
    var fields=['r1','r2','r3'], status=$('saveStatus'), timer=null;
    function flash(m){ if(!status) return; status.textContent=m; if(timer) clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    fields.forEach(function(id){ var ta=$(id); if(!ta||!A.get) return; ta.value=A.get(id,''); ta.addEventListener('input', function(){ A.set(id, ta.value); }); });
    var saveB=$('saveBtn'), copyB=$('copyBtn'), clearB=$('clearBtn');
    if(saveB) saveB.addEventListener('click', function(){ fields.forEach(function(id){ var ta=$(id); if(ta&&A.set) A.set(id, ta.value); }); flash('Saved ✓'); });
    if(clearB) clearB.addEventListener('click', function(){
      var any=fields.some(function(id){ var ta=$(id); return ta&&ta.value.trim(); });
      if(any && !window.confirm('Clear your reflection on this device?')) return;
      fields.forEach(function(id){ var ta=$(id); if(ta){ ta.value=''; if(A.remove) A.remove(id); } }); flash('Cleared.');
    });
    if(copyB) copyB.addEventListener('click', function(){
      var lines=['My parenthood-assumption reflection — ANCF Project 004',''];
      var fam=A.getJSON?A.getJSON('families',null):null;
      if(fam){ lines.push('Assumption profile:'); document.querySelectorAll('#families input[type=range]').forEach(function(inp){ lines.push('  • '+inp.getAttribute('data-axis')+': '+WORDS[+inp.value]); }); lines.push(''); }
      var ex=A.getJSON?A.getJSON('exam',null):null;
      if(ex && ex.belief){ lines.push('Belief I examined: '+ex.belief); lines.push('Its hidden premise: '+ex.premise); lines.push(''); }
      var prompts=['An assumption I was surprised to find in myself:','One assumption — keep, adjust, or set down, and why:','What holding my choice on purpose would feel like:'];
      fields.forEach(function(id,i){ var ta=$(id); lines.push(prompts[i]); lines.push('  '+((ta&&ta.value.trim())?ta.value.trim():'(left blank)')); lines.push(''); });
      if(A.copy) A.copy(lines.join('\n'), copyB);
    });
  })();

} catch(e){ console.error('project 004 script error', e); }
});
