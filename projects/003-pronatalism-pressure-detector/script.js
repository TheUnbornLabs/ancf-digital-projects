/* ============================================================
   Project 003 · Pronatalism Pressure Detector — interactive logic
   Vanilla JS. Uses window.ANCF helpers (../../ancf-ui.js).
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A = window.ANCF || {};
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function lc(s){ return s.charAt(0).toLowerCase()+s.slice(1); }

  var CATS = {
    timing:   'Timing & the clock',
    legacy:   'Grandchildren & legacy',
    selfish:  'The "selfish" charge',
    regret:   '"You\'ll regret it"',
    natural:  '"Natural" & "your own"',
    duty:     'Duty & faith',
    fear:     '"Who\'ll care for you?"',
    gender:   'Gender roles',
    norm:     '"When are you…?"',
    economic: 'Money & practicality'
  };

  var TROPES = [
    { id:'clock', cat:'timing', phrase:'"Your biological clock is ticking" / "You\'re not getting any younger"',
      re:/(biological clock|clock is ticking|tick(ing)?\b|not getting any younger|running out of time|before it'?s too late|while you (still )?can)/i,
      assumes:'That there is a single right window for everyone, and that your worth or happiness depends on beating it.',
      reframe:'The "biological clock" was popularized by a 1978 newspaper column, not biology. Real fertility facts are personal and belong between you and a doctor, not a dinner-table warning.',
      replies:{ gentle:'I\'m comfortable with my own timing, thank you.', firm:'My timeline is mine to set.', boundary:'I\'m not going to make a life decision to beat a clock that isn\'t yours to wind.' } },

    { id:'grandkids', cat:'legacy', phrase:'"When will you give me grandchildren?"',
      re:/(grandchild|grandkid|grand-?bab|grandbab)/i,
      assumes:'That your body and life plans exist to fulfil someone else\'s wish to be a grandparent.',
      reframe:'A longing for grandchildren is real and worth acknowledging, but it is their feeling to manage, not a debt you owe.',
      replies:{ gentle:'I know you\'d love that, and I understand. It isn\'t in my plans.', firm:'Grandchildren aren\'t something I can promise, and I\'d rather not be asked.', boundary:'I love you, but my body and my life aren\'t a route to grandchildren.' } },

    { id:'familyname', cat:'legacy', phrase:'"Who will carry on the family name / legacy?"',
      re:/(carry on the family|family name|family line|continue the (family|bloodline)|pass on the name|who will you leave|leave (it )?(all )?to|your legacy)/i,
      assumes:'That a life only counts if it is biologically continued, and that a name matters more than the person.',
      reframe:'Plenty of meaningful lives leave nothing genetic behind and everything else: ideas, care, work, kindness. Legacy is broader than DNA.',
      replies:{ gentle:'I\'ll leave my mark in other ways that matter to me.', firm:'My legacy isn\'t measured in surnames.', boundary:'A name isn\'t a reason to create a person.' } },

    { id:'selfish', cat:'selfish', phrase:'"Isn\'t it a bit selfish not to have kids?"',
      re:/(selfish|self-?centred|self-?centered|all about you|think of someone else)/i,
      assumes:'That not having children is taking something from someone, when there is no one being deprived.',
      reframe:'Choosing the life that genuinely fits you, rather than performing one for approval, is honest, not selfish. Ironically, having a child to satisfy others would be the less selfless act.',
      replies:{ gentle:'Choosing the life that fits me honestly isn\'t selfish to anyone.', firm:'There\'s no one being deprived by my choice.', boundary:'I won\'t accept "selfish" for a decision that harms no one.' } },

    { id:'changemind', cat:'regret', phrase:'"You\'ll change your mind" / "You\'ll regret it"',
      re:/(change your mind|you'?ll regret|you will regret|regret it|you'?ll feel different|when you'?re older you'?ll|come around|too late to change)/i,
      assumes:'That you don\'t really know yourself, and that your clear answer is just a phase.',
      reframe:'People say this to certainty of every kind. You\'re allowed to know your own mind, and "I might feel differently someday" is a reason to choose carefully, not to hand the decision to someone else.',
      replies:{ gentle:'I\'ve thought about it carefully, and I\'m at peace with it.', firm:'I do know my own mind.', boundary:'Telling me I\'ll change my mind isn\'t a conversation. Please stop.' } },

    { id:'yourown', cat:'natural', phrase:'"It\'s different when it\'s your own"',
      re:/(different when (it'?s|they'?re) your own|when it'?s your own|your own (kid|child)|once you have your own)/i,
      assumes:'That you can\'t possibly know your feelings in advance, so your "no" doesn\'t count.',
      reframe:'It may well be different, and that\'s exactly why it deserves to be a deliberate choice, not a leap taken because someone insisted the magic would kick in.',
      replies:{ gentle:'It might be, which is just why I want to choose it deliberately.', firm:'"You\'ll feel differently" isn\'t a reason to decide for me.', boundary:'I won\'t bet a whole life on a feeling I\'m told I\'ll have.' } },

    { id:'natural', cat:'natural', phrase:'"It\'s only natural" / "It\'s what we\'re made for"',
      re:/(only natural|it'?s natural|unnatural|what (we'?re|you'?re|women are|men are) made for|nature intended|against nature|meant to (have|be)|born to)/i,
      assumes:'That whatever feels natural is therefore a duty everyone owes.',
      reframe:'Lots of things are "natural" without being obligatory. What evolution made common doesn\'t settle what any individual should do with their one life.',
      replies:{ gentle:'There are many natural, full ways to live a life.', firm:'"Natural" doesn\'t mean required.', boundary:'My life isn\'t a duty I owe to nature.' } },

    { id:'completefamily', cat:'natural', phrase:'"A family isn\'t complete without children" / "Start a family"',
      re:/(complete (a |your |the )?family|a real family|not a (real |complete )?family|start(ing|ed)? a family|start your family|when are you starting)/i,
      assumes:'That a couple or a person is incomplete, not yet a real family, until a child arrives.',
      reframe:'Two people who love each other are already a family. Wholeness isn\'t something a child is required to deliver.',
      replies:{ gentle:'We already feel like a complete family, just the two of us.', firm:'My family is complete as it is.', boundary:'Please don\'t describe my family as unfinished.' } },

    { id:'godplan', cat:'duty', phrase:'"It\'s God\'s plan" / "Children are a blessing / duty"',
      re:/(god'?s plan|gods plan|be fruitful|a blessing|god wants|the lord|your duty to|duty to (god|family|have)|it'?s a commandment|sin not to)/i,
      assumes:'That a shared faith or duty obliges you specifically to reproduce.',
      reframe:'Even within traditions that prize children, people of faith reach different, sincere conclusions. Respecting belief doesn\'t require surrendering your own conscience.',
      replies:{ gentle:'I respect what this means to you, and I\'ve made my own decision.', firm:'I take my values seriously, and this is part of them.', boundary:'I can honor our faith and still choose my own path on this.' } },

    { id:'careforyou', cat:'fear', phrase:'"Who will look after you when you\'re old?"',
      re:/(who('?s| is| will)?( going to)? (look after|take care of|care for) you|when you'?re old|in your old age|die alone|dying alone|end up alone|lonely when|all alone)/i,
      assumes:'That children are an insurance policy for old age, and that the childfree face a lonely end.',
      reframe:'Children are not guaranteed caregivers, and many elders are cared for by friends, partners, community, and planning. Having a child as insurance is neither a safe bet nor a kind reason.',
      replies:{ gentle:'I\'m planning thoughtfully for my future, honestly.', firm:'A child isn\'t an insurance policy, and I\'m building real support.', boundary:'I won\'t create a person to avoid being alone.' } },

    { id:'womanhood', cat:'gender', phrase:'"Every woman wants this" / "You\'re not a real woman/man until…"',
      re:/(every woman|all women want|what women (want|are|do)|maternal instinct|not a real (woman|man)|be a mother|become a mother|a woman'?s (job|role|purpose)|man up and)/i,
      assumes:'That womanhood (or manhood) is defined by becoming a parent, the "motherhood mandate."',
      reframe:'Scholar Nancy Felipe Russo named this the "motherhood mandate": the false idea that a woman isn\'t complete without children. Your gender doesn\'t come with a reproductive quota.',
      replies:{ gentle:'My worth isn\'t defined by parenthood.', firm:'There\'s more than one way to be a whole woman or man.', boundary:'I won\'t measure myself by whether I reproduce.' } },

    { id:'whenkids', cat:'norm', phrase:'"So when are you having kids?" / "It\'s the next step"',
      re:/(when are you (having|going to have|gonna have)|when'?s the baby|when will you have|next step|tick(ing)? the boxes|after the wedding|now that you'?re married|that'?s what (people|you) do|everyone (has|does)|it'?s just what)/i,
      assumes:'That having children is an inevitable checkpoint everyone passes, and the only question is when.',
      reframe:'The question skips the real one ("do you want children?") and assumes the answer. You\'re allowed to opt out of the script entirely.',
      replies:{ gentle:'Actually, that\'s not part of our plan, but thank you for asking.', firm:'That\'s not on the cards for us.', boundary:'It\'s a personal question, and I\'d rather not field it.' } },

    { id:'afford', cat:'economic', phrase:'"You can afford it" / "It\'ll all work out"',
      re:/(you can afford|afford (it|kids|them)|it'?ll (all )?work out|you'?ll find a way|people (manage|cope)|money isn'?t everything|no one'?s ever ready|there'?s never a (right|perfect) time)/i,
      assumes:'That the only thing standing between you and parenthood is money or readiness, not desire.',
      reframe:'Whether you could afford or manage it was never the question. "I don\'t want to" is a complete answer that money advice can\'t address.',
      replies:{ gentle:'It isn\'t about whether I could, I\'ve chosen not to.', firm:'Affording something isn\'t the same as wanting it.', boundary:'The decision isn\'t financial, so let\'s not relitigate it.' } },

    { id:'happiness', cat:'regret', phrase:'"Children are the only real happiness / meaning"',
      re:/(real happiness|true happiness|greatest joy|only real (joy|meaning)|nothing (compares|like it)|you'?ll never know love|incomplete without|empty life|meaning of life)/i,
      assumes:'That deep happiness and meaning are only available through parenthood.',
      reframe:'Meaning and love come through many doors: work, relationships, creativity, service, community. A child is one path to a good life, not the only one.',
      replies:{ gentle:'I find deep meaning in lots of places already.', firm:'There are many roads to a meaningful life.', boundary:'I don\'t accept that my life is empty, and I\'d rather not be told it is.' } },

    { id:'forthem', cat:'fear', phrase:'"You\'d be such a great parent, it would be a waste"',
      re:/(such a (great|good|wonderful) (parent|mother|father|mom|dad)|be a waste|waste(d)? (if you don'?t|not to)|shame (not |if )|too good not to)/i,
      assumes:'That an aptitude for something creates an obligation to do it.',
      reframe:'Being capable of parenting doesn\'t mean you must. This is benevolent pronatalism, praise that quietly applies pressure. Plenty of capable people choose other paths.',
      replies:{ gentle:'That\'s kind of you to say. It\'s still not the path for me.', firm:'Being able to doesn\'t mean I will.', boundary:'I\'ll take the compliment, but not the expectation.' } }
  ];

  var COERCION_RE = /(if you (don'?t|won'?t|refuse)|or (i'?ll|we'?re|i will)|i'?ll leave|divorce you|cut you off|disown|won'?t speak to you|won'?t talk to you|kick you out|throw you out|you have no choice|you (have to|must) have|make you|threaten|out of the will|cut (you )?out of)/i;

  /* 1 · Accordions */
  (function(){
    document.querySelectorAll('#levels .level').forEach(function(el){
      function t(){ el.classList.toggle('open'); }
      el.addEventListener('click', t);
      el.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); t(); } });
    });
    document.querySelectorAll('#bh .cell').forEach(function(el){
      function t(){ el.classList.toggle('open'); }
      el.addEventListener('click', t);
      el.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); t(); } });
    });
  })();

  /* 2 · Detector */
  (function(){
    var inEl=$('detIn'), runB=$('detRun'), clrB=$('detClear');
    var resWrap=$('detResult'), hiEl=$('detHi'), findEl=$('detFindings'),
        emptyEl=$('detEmpty'), tempLab=$('tempLab'), tempNeedle=$('tempNeedle'), tempNote=$('tempNote');
    if(!inEl||!runB) return;

    document.querySelectorAll('#samples .sample-btn').forEach(function(b){
      b.addEventListener('click', function(){ inEl.value=b.getAttribute('data-s'); analyze(); inEl.focus(); });
    });

    function findMatches(text){
      var ranges=[], byTrope={};
      TROPES.forEach(function(t){
        var re=new RegExp(t.re.source, 'gi'), m;
        while((m=re.exec(text))!==null){
          if(m.index===re.lastIndex) re.lastIndex++;
          ranges.push({start:m.index, end:m.index+m[0].length, cat:t.cat, trope:t});
          byTrope[t.id]=byTrope[t.id]||{trope:t, samples:[]};
          if(byTrope[t.id].samples.length<1) byTrope[t.id].samples.push(m[0]);
          if(!m[0].length) break;
        }
      });
      var cre=new RegExp(COERCION_RE.source,'gi'), cm, coercion=[];
      while((cm=cre.exec(text))!==null){
        if(cm.index===cre.lastIndex) cre.lastIndex++;
        ranges.push({start:cm.index, end:cm.index+cm[0].length, cat:'coercion', trope:null});
        coercion.push(cm[0]);
        if(!cm[0].length) break;
      }
      return {ranges:ranges, byTrope:byTrope, coercion:coercion};
    }

    function buildHighlight(text, ranges){
      ranges.sort(function(a,b){ return a.start-b.start || (b.end-b.start)-(a.end-a.start); });
      var accepted=[], lastEnd=-1;
      ranges.forEach(function(r){ if(r.start>=lastEnd){ accepted.push(r); lastEnd=r.end; } });
      var out='', cur=0;
      accepted.forEach(function(r){
        out+=esc(text.slice(cur, r.start));
        var title = r.cat==='coercion' ? 'Possible coercion marker' : (r.trope?('Pattern: '+CATS[r.cat]):'');
        out+='<span class="hl cat-'+r.cat+'" title="'+esc(title)+'">'+esc(text.slice(r.start, r.end))+'</span>';
        cur=r.end;
      });
      out+=esc(text.slice(cur));
      return out;
    }

    function analyze(){
      var text=(inEl.value||'').trim();
      resWrap.style.display='none'; emptyEl.style.display='none';
      if(!text){ emptyEl.style.display='block'; emptyEl.textContent='Paste or type a message above, then press Analyze.'; return; }
      var f=findMatches(text);
      var tropeIds=Object.keys(f.byTrope), nTropes=tropeIds.length, nCoerce=f.coercion.length;
      var temp, label, note;
      var hostile = /(selfish|unnatural|waste|empty|never know|shame|real (woman|man)|die alone)/i.test(text);
      if(nCoerce>0){
        temp=90; label='Coercion'; note='This contains language that reads as control or threat, not ordinary pressure. That crosses a line. See the safety check in section ⑤; you deserve support, and stepping back is valid.';
      } else if(nTropes>=3 || (nTropes>=2 && hostile)){
        temp=70; label='Strong pressure'; note='Several pressure patterns at once, some with a sharp edge. A clear, repeatable boundary helps here; you don\'t owe a justification.';
      } else if(nTropes>=1){
        temp=42; label='Pressure'; note='There\'s a pressure pattern here, probably well-meant. A calm one-liner and a change of subject is usually enough.';
      } else if(/\?/.test(text)){
        temp=16; label='Likely curiosity'; note='No strong pronatalist pattern detected; this reads more like an open question than pressure. If it accepts your answer, it\'s just curiosity.';
      } else {
        temp=8; label='No clear pattern'; note='No common pronatalist pattern detected. Not every comment is pressure; trust your read of the moment.';
      }
      tempLab.textContent=label;
      tempNeedle.style.left='calc('+temp+'% - 2px)';
      tempNote.textContent=note;
      hiEl.innerHTML = buildHighlight(text, f.ranges);
      var html='';
      if(nCoerce>0){
        html+='<div class="finding" style="border-left:4px solid var(--accent)"><div class="head"><span class="tagpill cat-selfish">⚠ Possible coercion</span></div>'+
          '<p class="mini">The message includes phrases like <em>“'+esc(f.coercion.slice(0,3).join('”, “'))+'”</em>. Threats, ultimatums, or controlling someone\'s reproductive choices are <b>reproductive coercion</b>, not persuasion. Please see section ⑤ and consider reaching out to someone you trust.</p></div>';
      }
      if(nTropes===0 && nCoerce===0){
        html+='<p class="note">No catalogued pressure patterns were found. That doesn\'t mean the moment didn\'t feel like pressure; the detector only knows common phrasings. Trust your experience.</p>';
      }
      tropeIds.forEach(function(id){
        var t=f.byTrope[id].trope, q=f.byTrope[id].samples[0]||'';
        html+='<div class="finding"><div class="head"><span class="tagpill cat-'+t.cat+'">'+esc(CATS[t.cat])+'</span> <span class="quote">“'+esc(q)+'”</span></div>'+
          '<p class="mini"><b>What it assumes:</b> '+esc(t.assumes)+'</p>'+
          '<p class="mini"><b>A clearer view:</b> '+esc(t.reframe)+'</p>'+
          '<div class="resp"><b>You could say:</b> “'+esc(t.replies.firm)+'”</div></div>';
      });
      findEl.innerHTML=html;
      resWrap.style.display='block';
    }

    runB.addEventListener('click', analyze);
    clrB.addEventListener('click', function(){ inEl.value=''; resWrap.style.display='none'; emptyEl.style.display='none'; inEl.focus(); });
  })();

  /* 3 · Field guide */
  (function(){
    var listEl=$('tropeList'), filtEl=$('guideFilters'), searchEl=$('guideSearch'), countEl=$('guideCount');
    if(!listEl) return;
    var activeCat='all', term='';
    var chips=[{k:'all',label:'All'}].concat(Object.keys(CATS).map(function(k){ return {k:k,label:CATS[k]}; }));
    filtEl.innerHTML = chips.map(function(c){ return '<span class="fchip'+(c.k==='all'?' active':'')+'" data-k="'+c.k+'" role="button" tabindex="0">'+esc(c.label)+'</span>'; }).join('');
    filtEl.querySelectorAll('.fchip').forEach(function(ch){
      function sel(){ activeCat=ch.getAttribute('data-k'); filtEl.querySelectorAll('.fchip').forEach(function(x){ x.classList.remove('active'); }); ch.classList.add('active'); render(); }
      ch.addEventListener('click', sel);
      ch.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); sel(); } });
    });
    if(searchEl) searchEl.addEventListener('input', function(){ term=searchEl.value.toLowerCase().trim(); render(); });
    function matches(t){
      if(activeCat!=='all' && t.cat!==activeCat) return false;
      if(!term) return true;
      var hay=(t.phrase+' '+t.assumes+' '+t.reframe+' '+t.replies.gentle+' '+t.replies.firm+' '+t.replies.boundary+' '+CATS[t.cat]).toLowerCase();
      return hay.indexOf(term)>-1;
    }
    function render(){
      var shown=TROPES.filter(matches);
      countEl.textContent = shown.length+' of '+TROPES.length+' lines shown'+(activeCat!=='all'?(' · '+CATS[activeCat]):'')+(term?(' · "'+term+'"'):'');
      if(!shown.length){ listEl.innerHTML='<p class="guide-empty">No lines match that search. Try a different word or clear the filter.</p>'; return; }
      listEl.innerHTML = shown.map(function(t){
        return '<details class="trope"><summary><span class="tagpill cat-'+t.cat+'">'+esc(CATS[t.cat])+'</span> <span class="phrase">'+esc(t.phrase)+'</span> <span class="chev" aria-hidden="true">›</span></summary>'+
          '<div class="body">'+
          '<p><span class="lbl">What it assumes</span><br>'+esc(t.assumes)+'</p>'+
          '<p><span class="lbl">A clearer view</span><br>'+esc(t.reframe)+'</p>'+
          '<div class="replies">'+
            '<div class="r"><b>Gentle:</b> “'+esc(t.replies.gentle)+'”</div>'+
            '<div class="r"><b>Firm:</b> “'+esc(t.replies.firm)+'”</div>'+
            '<div class="r"><b>Boundary:</b> “'+esc(t.replies.boundary)+'”</div>'+
          '</div></div></details>';
      }).join('');
    }
    render();
  })();

  var WORDS=['none','mild','moderate','strong','severe'];
  /* 4 · Pressure profile */
  (function(){
    var inputs=[].slice.call(document.querySelectorAll('#sources input[type=range]'));
    if(!inputs.length) return;
    var sevBar=$('sevBar'), sevPct=$('sevPct'), radar=$('radar'), note=$('profileNote');
    function guidance(items, pct, top){
      if(pct===0) return 'No notable pressure recorded right now, a calm place to be. Come back whenever the weather changes.';
      var topNames=top.map(function(t){return t.label;});
      var s='';
      if(pct<25) s='Your overall pressure is low. The strongest source is <b>'+esc(topNames[0])+'</b>. A light touch, a calm one-liner and a subject change, is usually all this needs.';
      else if(pct<55) s='You\'re carrying a moderate, real load, weighing most from <b>'+esc(topNames.slice(0,2).join('</b> and <b>'))+'</b>. A clear, repeatable boundary for those sources will save you energy. The Field Guide (③) and Composer (⑥) are built for exactly this.';
      else s='This is a heavy load, concentrated in <b>'+esc(topNames.slice(0,2).join('</b> and <b>'))+'</b>. Be gentle with yourself. Firm, repeated boundaries help, and if any of it involves threats or control, see the safety check in ⑤.';
      var selfItem=items.filter(function(i){return i.label==='Internalized';})[0];
      if(selfItem && selfItem.raw>=3) s+=' <br><br>Your <b>internalized</b> pressure is high, the voice in your own head. That one isn\'t answered with a boundary line but with self-compassion: notice it, name it as pronatalism, and ask whose voice it really is.';
      return s;
    }
    function update(){
      var total=0, items=[];
      inputs.forEach(function(inp){
        var v=+inp.value; total+=v;
        items.push({label:inp.getAttribute('data-axis'), value:Math.round(v/4*100), raw:v});
        var out=$(inp.id.replace('s-','o-')); if(out) out.textContent=WORDS[v];
      });
      var pct=Math.round(total/(inputs.length*4)*100);
      if(A.meter) A.meter(sevBar,pct); if(sevPct) sevPct.textContent=pct+'%';
      if(A.radar) A.radar(radar, items);
      var top=items.slice().sort(function(a,b){return b.raw-a.raw;});
      if(note) note.innerHTML = guidance(items, pct, top);
      var store={}; inputs.forEach(function(inp){ store[inp.id]=inp.value; });
      if(A.setJSON) A.setJSON('profile', store);
    }
    var saved=A.getJSON?A.getJSON('profile',null):null;
    inputs.forEach(function(inp){ if(saved&&saved[inp.id]!=null) inp.value=saved[inp.id]; inp.addEventListener('input', update); });
    update();
    var copyB=$('profCopy'), clearB=$('profClear');
    if(copyB) copyB.addEventListener('click', function(){
      var lines=['My pronatalism pressure profile',''];
      inputs.forEach(function(inp){ lines.push('  • '+inp.getAttribute('data-axis')+': '+WORDS[+inp.value]); });
      if(A.copy) A.copy(lines.join('\n'), copyB);
    });
    if(clearB) clearB.addEventListener('click', function(){
      if(!window.confirm('Reset all sliders to none on this device?')) return;
      inputs.forEach(function(inp){ inp.value=0; }); update();
    });
  })();

  /* 5 · Coercion check */
  (function(){
    var boxes=[].slice.call(document.querySelectorAll('#flags input[type=checkbox]'));
    var out=$('coercionOut');
    if(!boxes.length||!out) return;
    function update(){
      var n=boxes.filter(function(b){return b.checked;}).length;
      if(n===0){ out.innerHTML=''; return; }
      out.innerHTML='<div class="safebox"><h4>This sounds like more than pressure</h4>'+
        '<p>You\'ve checked '+n+' item'+(n>1?'s':'')+' that point toward <b>reproductive coercion</b>: using threats, control, or sabotage to force a reproductive outcome. That is recognized as a form of abuse, and it is not your fault.</p>'+
        '<p>You deserve to make this decision freely. Consider talking with someone you trust, or a qualified professional or local support service. If you ever feel unsafe, prioritize your immediate safety. Stepping back from the relationship or the conversation is a valid, self-respecting choice.</p>'+
        '<p class="note">This tool can\'t assess your situation and isn\'t a substitute for real support; it\'s only a prompt to take what you\'re feeling seriously.</p></div>';
    }
    boxes.forEach(function(b){ b.addEventListener('change', update); });
  })();

  /* 6 · Boundary & response composer */
  (function(){
    var OPEN={
      parent:['I know this comes from love, ','I know you want the best for me, '],
      inlaw:['I appreciate that you care about our family, '],
      relative:['Thanks for thinking of me, '],
      friend:['I value you, so I\'ll be honest, '],
      coworker:['', 'I\'d rather keep things light at work, but '],
      stranger:['', 'It\'s a personal one, but '],
      partner:['I love you, and I want to be honest with you, '],
      doctor:['I want to be clear for my own care, ']
    };
    var CORE={
      Timing:['I\'m comfortable with my own timing.','My timeline is mine to set.','I\'m not in a race against any clock.'],
      Legacy:['I\'ll leave my mark in other ways.','My legacy isn\'t measured in grandchildren.','A meaningful life doesn\'t have to be passed on by blood.'],
      Selfish:['Choosing the life that genuinely fits me isn\'t selfish.','Deciding honestly is the responsible thing to do.','There\'s no one being deprived by my choice.'],
      Regret:['I\'ve thought about it carefully and I\'m at peace with my choice.','I do know my own mind on this.','I\'d rather choose clearly than have a child to avoid a maybe.'],
      Natural:['There are many natural, full ways to live a life.','What\'s right for one person isn\'t right for everyone.','A complete life looks different for different people.'],
      Duty:['I respect what this means to you, and I\'ve made my own decision.','I take my values seriously, and this is part of them.','I can honor our family and still choose my own path.'],
      Fear:['I\'m planning thoughtfully for my future.','A child isn\'t an insurance policy, and I\'m building real support.','I\'d rather plan well than have a child as a safety net.'],
      Gender:['My worth isn\'t defined by parenthood.','There\'s more than one way to be a whole person.','I get to define what kind of adult I am.'],
      Norm:['This is simply the path that\'s right for me.','Not everyone\'s life follows the same script, and that\'s okay.','I\'m genuinely happy with where I am.'],
      Economic:['It isn\'t about whether I could, I\'ve chosen not to.','Affording something isn\'t the same as wanting it.','The decision isn\'t a financial one for me.']
    };
    var CLOSE={
      gentle:['I\'d be grateful if we could let it rest.','I hope you can be happy for me.','I\'d love to talk about something else now.'],
      firm:['My decision is made.','I\'m not looking to debate it.','I\'d like you to respect that.'],
      final:['This is settled, please don\'t raise it again.','I won\'t be discussing it further.','I need this to be the last time we have this conversation.']
    };
    var HUMOR_SHORT=['I\'ll add it to the list of things everyone asks me!','We\'re focusing on being the world\'s best aunt and uncle for now.','Still working on keeping my plants alive, but thanks!','If I change my mind, you\'ll be the very first to know.'];
    var HUMOR_CLOSE=['but I appreciate you keeping my life so interesting!','though I promise the species will manage without my help.','but my houseplants are quite enough to keep alive, thank you.'];
    var who=$('cWho'), src=$('cSource'), tone=$('cTone'), len=$('cLen'), gen=$('cGen'), another=$('cAnother'), copy=$('cCopy'), outEl=$('cOut');
    if(!gen) return;
    var last='';
    function compose(){
      var w=who.value, s=src.value, t=tone.value, l=len.value;
      var core=pick(CORE[s]||CORE.Norm), text;
      if(t==='humor'){
        text = (l==='short') ? pick(HUMOR_SHORT) : (core+' — '+pick(HUMOR_CLOSE));
      } else if(l==='short'){
        text = core;
        if(t==='final') text = core+' Please don\'t raise it again.';
      } else {
        var op=pick(OPEN[w]||['']);
        var cl=pick(CLOSE[t]||CLOSE.firm);
        text = op ? (op+lc(core)+' '+cl) : (core+' '+cl);
      }
      text = text.charAt(0).toUpperCase()+text.slice(1);
      if(text===last) return compose();
      last=text; return text;
    }
    function show(){ outEl.textContent=compose(); }
    gen.addEventListener('click', show);
    another.addEventListener('click', show);
    copy.addEventListener('click', function(){ var v=outEl.textContent; if(v && v.indexOf('appear here')===-1 && A.copy) A.copy(v, copy); else if(A.copy) A.copy(compose(), copy); });
  })();

  /* 7 · Scenario simulator */
  (function(){
    var SCENES=[
      { id:'dinner', tab:'Sunday dinner', open:'Your mother sets down the dish and says, "So… any news for us yet? Your sister already has two. We\'re not getting any younger, you know."',
        choices:[
          { t:'"We\'re really happy as we are, Mum. How\'s your garden coming along?"', o:'She looks a little disappointed but lets it go, and the conversation moves on warmly.', c:'A calm boundary plus a genuine subject change. You acknowledged nothing you don\'t mean, claimed your contentment, and gave her an easy off-ramp. This protects the relationship and the boundary at once.' },
          { t:'"Why does everyone keep asking? It\'s so annoying."', o:'She gets defensive: "I\'m only asking because I care!" and the table goes tense.', c:'Understandable, it IS annoying. But leading with frustration invites defensiveness. The feeling is valid; aiming it at the boundary instead of the person usually lands better.' },
          { t:'"Maybe one day, we\'ll see."', o:'She brightens and starts sending you nursery photos next week.', c:'A soft deflection buys peace now but plants hope, which tends to grow into more pressure later. Fine as a one-off; risky as a pattern if your real answer is no.' },
          { t:'Say nothing and change the subject yourself.', o:'It works for tonight, though the question will almost certainly return.', c:'Avoidance is a legitimate tool, especially when you\'re tired. Just know the unanswered question usually comes back; a short clear line now can save many deflections later.' }
        ] },
      { id:'coworker', tab:'The coworker', open:'A colleague leans over your desk: "No kids yet? Tick tock! You\'d better hurry up, and honestly, isn\'t it a bit selfish to leave it so late?"',
        choices:[
          { t:'"That\'s a pretty personal question for the office. Let\'s get back to the report."', o:'They look briefly surprised, then drop it. A small awkwardness, quickly gone.', c:'Naming it as personal plus redirecting to work is perfect for professional settings. You don\'t owe a coworker your reproductive plans, and "let\'s get back to work" is unimpeachable.' },
          { t:'"It\'s not selfish, there\'s no one being deprived by my choice."', o:'They shrug, a little chastened, and the point quietly lands.', c:'A clean, calm rebuttal to the selfish charge. You corrected the assumption without heat. Great if you want to engage; you\'re also free not to.' },
          { t:'"Ha, tick tock yourself!" and laugh it off.', o:'The tension breaks and you both move on, though nothing was really said.', c:'Humor is a brilliant pressure valve and totally valid. Just keep a firmer line in your back pocket in case the comments keep coming.' }
        ] },
      { id:'doctor', tab:'The doctor', open:'At an appointment, the doctor glances at your chart: "Still no children? You shouldn\'t leave it too long. Most women your age want to get started."',
        choices:[
          { t:'"I\'m not planning to have children. I\'d like that noted, please."', o:'They note it, and the visit gets back on track. You\'ve set the record for next time.', c:'Excellent. Stating it plainly and asking for it to be recorded reduces repeat conversations and keeps your care focused on what you actually came for.' },
          { t:'"Can we focus on what I came in for today?"', o:'They refocus, if a touch stiffly. Your actual concern gets addressed.', c:'A clean redirect. You\'re entitled to direct your own medical visit; a doctor\'s job is your health, not your family plan.' },
          { t:'"Are you saying that as my doctor, or just personally?"', o:'It gives them pause, and prompts a more clinical, less presumptuous tone.', c:'A sharp, fair question. It separates medical advice from social assumption and gently holds a professional to their role. Use when you have the energy for it.' }
        ] }
    ];
    var tabsEl=$('sceneTabs'), stage=$('sceneStage');
    if(!tabsEl||!stage) return;
    var cur=0;
    function renderTabs(){
      tabsEl.innerHTML=SCENES.map(function(s,i){ return '<button class="scene-tab'+(i===cur?' active':'')+'" type="button" data-i="'+i+'">'+esc(s.tab)+'</button>'; }).join('');
      tabsEl.querySelectorAll('.scene-tab').forEach(function(b){ b.addEventListener('click', function(){ cur=+b.getAttribute('data-i'); renderAll(); }); });
    }
    function renderScene(){
      var s=SCENES[cur];
      var html='<div class="scene"><div class="npc">'+esc(s.open)+'</div><p class="note">How do you respond?</p><div class="choices">';
      s.choices.forEach(function(c,i){ html+='<button class="choice" type="button" data-i="'+i+'">'+esc(c.t)+'</button>'; });
      html+='</div><div id="sceneOut"></div></div>';
      stage.innerHTML=html;
      stage.querySelectorAll('.choice').forEach(function(b){
        b.addEventListener('click', function(){
          var c=s.choices[+b.getAttribute('data-i')];
          $('sceneOut').innerHTML='<div class="outcome"><b>Likely reaction:</b> '+esc(c.o)+'</div><div class="coach"><b>Coach:</b> '+esc(c.c)+'</div>'+
            '<div class="btn-row" style="margin-top:10px"><button class="btn" type="button" id="sceneAgain">↺ Try a different reply</button></div>';
          $('sceneAgain').addEventListener('click', renderScene);
        });
      });
    }
    function renderAll(){ renderTabs(); renderScene(); }
    renderAll();
  })();

  /* 8 · Quiz */
  (function(){
    var Q=[
      {a:1,e:'An open question that genuinely accepts your answer is curiosity, not pressure.'},
      {a:0,e:'Praise like "you\'d be a great parent" pushes toward parenthood through warmth: benevolent pronatalism. It\'s still pressure, just gift-wrapped.'},
      {a:1,e:'Threats, ultimatums, and tampering with contraception are reproductive coercion: a recognized form of abuse, not a conversation.'},
      {a:1,e:'The motherhood mandate (Nancy Felipe Russo, 1976) is the false idea that a woman isn\'t complete without children.'},
      {a:1,e:'Tax codes, benefits, and workplace norms are the institutional level: pronatalism built into systems.'},
      {a:0,e:'That self-doubt is internalized pronatalism, the cultural assumption echoing inside your own head. It isn\'t evidence about what you should do.'},
      {a:1,e:'Naming a pattern is for your own clarity, so you can choose your response, not to blame the speaker or win.'}
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
      res.textContent='You matched '+sc+' of '+Q.length+' with the explained view. The point isn\'t the score, it\'s seeing the patterns clearly.';
      if(rB) rB.style.display='inline-block';
    });
    if(rB) rB.addEventListener('click', function(){
      picks={};
      document.querySelectorAll('#quizbox .opt').forEach(function(x){ x.classList.remove('sel','ok','no'); x.setAttribute('aria-pressed','false'); });
      document.querySelectorAll('#quizbox .explain').forEach(function(ex){ ex.style.display='none'; ex.textContent=''; });
      res.style.display='none'; rB.style.display='none';
    });
  })();

  /* 9 · Reflection */
  (function(){
    var fields=['r1','r2','r3'], status=$('saveStatus'), timer=null;
    function flash(m){ if(!status) return; status.textContent=m; if(timer) clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    fields.forEach(function(id){
      var ta=$(id); if(!ta||!A.get) return;
      ta.value=A.get(id,''); ta.addEventListener('input', function(){ A.set(id, ta.value); });
    });
    var saveB=$('saveBtn'), copyB=$('copyBtn'), clearB=$('clearBtn');
    if(saveB) saveB.addEventListener('click', function(){ fields.forEach(function(id){ var ta=$(id); if(ta&&A.set) A.set(id, ta.value); }); flash('Saved ✓'); });
    if(clearB) clearB.addEventListener('click', function(){
      var any=fields.some(function(id){ var ta=$(id); return ta&&ta.value.trim(); });
      if(any && !window.confirm('Clear your reflection on this device?')) return;
      fields.forEach(function(id){ var ta=$(id); if(ta){ ta.value=''; if(A.remove) A.remove(id); } }); flash('Cleared.');
    });
    if(copyB) copyB.addEventListener('click', function(){
      var lines=['My pronatalism reflection — ANCF Project 003',''];
      var prof=A.getJSON?A.getJSON('profile',null):null;
      if(prof){
        lines.push('Pressure profile:');
        document.querySelectorAll('#sources input[type=range]').forEach(function(inp){
          lines.push('  • '+inp.getAttribute('data-axis')+': '+WORDS[+inp.value]);
        });
        lines.push('');
      }
      var prompts=['Which source or line surprised you most:','One small boundary to set this week:','To remember when the inner voice gets loud:'];
      fields.forEach(function(id,i){ var ta=$(id); lines.push(prompts[i]); lines.push('  '+((ta&&ta.value.trim())?ta.value.trim():'(left blank)')); lines.push(''); });
      if(A.copy) A.copy(lines.join('\n'), copyB);
    });
  })();

} catch(e){ console.error('project 003 script error', e); }
});
