/* Project 006 · Reproductive Autonomy Explainer — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A = window.ANCF || {};
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }

  /* 2 · principle cards */
  (function(){
    var box=$('princ'); if(!box) return;
    var P=[
      {ico:'🤝',t:'Consent',tag:'A real, free, ongoing yes.',more:'Consent must be informed, uncoerced, and revocable. A "yes" extracted by pressure, deception, or fear isn\'t consent at all.'},
      {ico:'🧍',t:'Bodily autonomy',tag:'Your body, your call.',more:'Decisions that act on a person\'s own body — pregnancy, contraception, sterilization — belong first to that person. This is the deepest root of the principle.'},
      {ico:'💡',t:'Informed choice',tag:'Real facts, not myths.',more:'A free choice needs accurate information about options, risks, and consequences — and freedom from manipulation dressed up as advice.'},
      {ico:'🛡️',t:'Freedom from coercion',tag:'No threats, no force.',more:'No state, partner, family, or institution gets to force the outcome through threats, violence, financial control, or relentless pressure.'},
      {ico:'🔑',t:'Access',tag:'A right you can actually use.',more:'Healthcare, contraception, and information must be reachable. A right with no access is a right in name only.'},
      {ico:'🌿',t:'Respect for disagreement',tag:'Different choices, equal dignity.',more:'Autonomy means honoring choices you wouldn\'t make. Disagreement is fine; overriding someone\'s decision is not.'}
    ];
    box.innerHTML=P.map(function(p){ return '<div class="pcard" tabindex="0"><span class="ico" aria-hidden="true">'+p.ico+'</span><h4>'+esc(p.t)+'</h4><p class="tag">'+esc(p.tag)+'</p><p class="more">'+esc(p.more)+'</p></div>'; }).join('');
    box.querySelectorAll('.pcard').forEach(function(c){
      function t(){ c.classList.toggle('open'); }
      c.addEventListener('click',t);
      c.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); t(); } });
    });
  })();

  /* 3 · coercion example expanders */
  document.querySelectorAll('.coerce .ex').forEach(function(el){ el.addEventListener('click', function(){ el.classList.toggle('open'); }); });

  /* 4 · autonomy self-check */
  (function(){
    var inputs=[].slice.call(document.querySelectorAll('#scInputs input[type=range]'));
    if(!inputs.length) return;
    var bar=$('scBar'), pct=$('scPct'), reading=$('scReading');
    function update(){
      var total=0; inputs.forEach(function(i){ total+=+i.value; var o=$('o-'+i.id); if(o)o.textContent=i.value+'%'; });
      var avg=Math.round(total/inputs.length);
      if(A.meter) A.meter(bar,avg); if(pct) pct.textContent=avg+'%';
      var low=inputs.slice().sort(function(a,b){return +a.value-+b.value;})[0];
      var msg;
      if(avg>=70) msg='Your situation looks strongly autonomy-supporting — you have the conditions to choose freely. The weakest link right now is <b>'+esc(low.getAttribute('data-axis'))+'</b>; worth keeping an eye on, but you\'re on solid ground.';
      else if(avg>=45) msg='Mixed conditions. Some supports are in place, but <b>'+esc(low.getAttribute('data-axis'))+'</b> is thin. Autonomy is easier to exercise when you can shore up the weakest condition first.';
      else msg='Several conditions are strained, especially <b>'+esc(low.getAttribute('data-axis'))+'</b>. That doesn\'t mean your choice isn\'t yours — it means the surrounding conditions deserve attention and, where it involves control by others, possibly support. Be gentle with yourself.';
      if(reading) reading.innerHTML=msg;
      var store={}; inputs.forEach(function(i){ store[i.id]=i.value; }); if(A.setJSON) A.setJSON('selfcheck',store);
    }
    var s=A.getJSON?A.getJSON('selfcheck',null):null;
    inputs.forEach(function(i){ if(s&&s[i.id]!=null) i.value=s[i.id]; i.addEventListener('input',update); });
    update();
  })();

  /* 5 · scenarios */
  (function(){
    var SC=[
      { tab:'The doctor', npc:'A patient, 26, with no children, asks a doctor for sterilization. The doctor says, "You\'re too young — you\'ll change your mind. I won\'t do it."',
        choices:[
          {t:'The doctor should share risks and reversibility facts, then respect the patient\'s informed decision.', o:'This is the autonomy-protecting answer. A clinician\'s role is informed consent — facts and options — not vetoing a competent adult\'s choice. Refusing on "you\'ll change your mind" substitutes the doctor\'s judgment for the patient\'s.'},
          {t:'The doctor is right to refuse — the patient is too young to know.', o:'This overrides a competent adult\'s bodily autonomy based on assumption. Age alone doesn\'t remove decision-making capacity; many people face exactly this gatekeeping. Information yes; veto no.'},
          {t:'The patient should just lie about already having kids.', o:'Understandable as a survival tactic, but it shows the system failing. The fix is respect for informed consent, not patients having to deceive their own doctors.'}
        ] },
      { tab:'The partner', npc:'One partner secretly stops using agreed contraception, hoping a pregnancy will "settle" the relationship.',
        choices:[
          {t:'This is reproductive coercion and a serious violation of autonomy.', o:'Correct. Tampering with contraception to force a reproductive outcome removes the other person\'s consent entirely. It is recognized as a form of abuse — see Project 003\'s safety check.'},
          {t:'It\'s a private matter between partners.', o:'It involves two people\'s bodies and futures, and one has removed the other\'s consent. "Private" doesn\'t make deception about reproduction acceptable.'},
          {t:'It\'s fine if they love each other.', o:'Love doesn\'t create consent. A decision this large made for someone, without them, is a violation no matter the feeling behind it.'}
        ] },
      { tab:'The state', npc:'A government worried about low birth rates proposes large bonuses for having children and new limits on access to contraception.',
        choices:[
          {t:'Incentives can be fine; restricting access to contraception crosses into coercion.', o:'A careful answer. Offering support to parents is one thing; removing the means to choose otherwise strips autonomy. The line is whether the policy expands choices or forecloses them.'},
          {t:'Anything that raises birth rates is good policy.', o:'This treats people as means to a demographic target — exactly the population-control logic (in reverse) that the 1994 Cairo conference moved away from.'},
          {t:'The state should set the right number of children.', o:'That is the core autonomy violation: the decision belongs to individuals, not to the state, in either direction.'}
        ] }
    ];
    var tabs=$('stabs'), stage=$('sstage'); if(!tabs||!stage) return;
    var cur=0;
    function rt(){ tabs.innerHTML=SC.map(function(s,i){return '<button class="stab'+(i===cur?' active':'')+'" type="button" data-i="'+i+'">'+esc(s.tab)+'</button>';}).join('');
      tabs.querySelectorAll('.stab').forEach(function(b){ b.addEventListener('click',function(){ cur=+b.getAttribute('data-i'); ra(); }); }); }
    function rs(){ var s=SC[cur];
      stage.innerHTML='<div class="npc">'+esc(s.npc)+'</div><div class="choices">'+s.choices.map(function(c,i){return '<button class="choice" type="button" data-i="'+i+'">'+esc(c.t)+'</button>';}).join('')+'</div><div id="scOut"></div>';
      stage.querySelectorAll('.choice').forEach(function(b){ b.addEventListener('click',function(){ $('scOut').innerHTML='<div class="outcome">'+esc(s.choices[+b.getAttribute('data-i')].o)+'</div>'; }); }); }
    function ra(){ rt(); rs(); }
    ra();
  })();

  /* 6 · respond without coercing */
  (function(){
    var L={
      want:['That\'s wonderful — I hope it brings you everything you\'re hoping for.','Congratulations on knowing what you want. I\'m happy for you.','I love that for you. How are you feeling about it all?'],
      dont:['That sounds right for you, and I respect it completely.','Makes sense — you know your own life best. I\'m glad you\'re clear.','Good for you for knowing your mind. I\'m in your corner either way.'],
      unsure:['That\'s a big question, and it\'s okay not to have the answer yet.','Take all the time you need — there\'s no prize for deciding fast.','Whatever you land on, I\'ll support it. Want to talk it through?'],
      struggling:['I\'m so sorry — that\'s a heavy thing to carry. I\'m here if you want to talk, or if you\'d rather not.','That sounds really hard. However it unfolds, you don\'t have to go through it alone.','I won\'t pretend to have words for it, but I\'m thinking of you and I\'m here.'],
      pressured:['You don\'t owe anyone that decision — it\'s yours. I\'ve got your back.','That pressure sounds exhausting. Whatever you choose, I\'ll back you.','It\'s your call and no one else\'s. Want help thinking through how to hold the line?']
    };
    var tone={ warm:'', brief:'', curious:'' };
    var who=$('rWho'), tn=$('rTone'), gen=$('rGen'), an=$('rAnother'), copy=$('rCopy'), out=$('rOut');
    if(!gen) return;
    var last='';
    function make(){
      var arr=L[who.value]||L.unsure, line=pick(arr);
      if(tn.value==='brief') line=line.split('.')[0]+'.';
      if(tn.value==='curious' && who.value!=='struggling') line=line.replace(/\.$/,'') + ' — want to tell me more?';
      if(line===last) return make();
      last=line; return line;
    }
    function show(){ out.textContent=make(); }
    gen.addEventListener('click',show); an.addEventListener('click',show);
    copy.addEventListener('click',function(){ var v=out.textContent; if(v&&v.indexOf('will appear')===-1&&A.copy) A.copy(v,copy); else if(A.copy) A.copy(make(),copy); });
  })();

  /* 7 · quiz */
  (function(){
    var Q=[{a:1,e:'It governs WHO decides, not WHAT they decide — it protects the chooser, whatever they choose.'},
      {a:1,e:'Both force a reproductive outcome on someone against their will. Autonomy opposes coercion in both directions.'},
      {a:0,e:'A right needs the real conditions — information, access, safety, freedom from pressure — to be exercised at all.'},
      {a:1,e:'The 1994 Cairo ICPD shifted the global frame from population-control targets to individual reproductive rights.'},
      {a:1,e:'Respecting autonomy means supporting a person\'s freedom to decide, even when their choice differs from yours.'}];
    var picks={}, total=document.querySelectorAll('#quizbox .quiz-q').length;
    if(A.initOptions) A.initOptions($('quizbox'),function(q,i){ picks[q]=+i; });
    var sB=$('quizScore'), rB=$('quizReset'), res=$('quizResult');
    if(sB) sB.addEventListener('click',function(){
      if(Object.keys(picks).length<total){ res.style.display='block'; res.textContent='Pick an answer for all '+total+' questions first.'; return; }
      var sc=0; Q.forEach(function(it,i){ document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){ var j=+x.getAttribute('data-i'); x.classList.remove('ok','no'); if(j===it.a)x.classList.add('ok'); else if(j===picks[i])x.classList.add('no'); }); var ex=document.querySelector('.explain[data-q="'+i+'"]'); if(ex){ ex.style.display='block'; ex.textContent=it.e; } if(picks[i]===it.a)sc++; });
      res.style.display='block'; res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.'; if(rB) rB.style.display='inline-block';
    });
    if(rB) rB.addEventListener('click',function(){ picks={}; document.querySelectorAll('#quizbox .opt').forEach(function(x){ x.classList.remove('sel','ok','no'); }); document.querySelectorAll('#quizbox .explain').forEach(function(ex){ ex.style.display='none'; ex.textContent=''; }); res.style.display='none'; rB.style.display='none'; });
  })();

  /* 8 · reflection */
  (function(){
    var fields=['r1','r2'], status=$('saveStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    fields.forEach(function(id){ var ta=$(id); if(!ta||!A.get)return; ta.value=A.get(id,''); ta.addEventListener('input',function(){ A.set(id,ta.value); }); });
    var s=$('saveBtn'),c=$('copyBtn'),cl=$('clearBtn');
    if(s) s.addEventListener('click',function(){ fields.forEach(function(id){ var ta=$(id); if(ta&&A.set)A.set(id,ta.value); }); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(fields.some(function(id){var t=$(id);return t&&t.value.trim();})&&!window.confirm('Clear your reflection?'))return; fields.forEach(function(id){ var ta=$(id); if(ta){ ta.value=''; if(A.remove)A.remove(id); } }); flash('Cleared.'); });
    if(c) c.addEventListener('click',function(){ var L=['Reproductive autonomy — my reflection','']; var sc=A.getJSON?A.getJSON('selfcheck',null):null; if(sc){ L.push('Autonomy self-check:'); document.querySelectorAll('#scInputs input').forEach(function(i){ L.push('  • '+i.getAttribute('data-axis')+': '+(sc[i.id]||i.value)+'%'); }); L.push(''); } var p=['Where I feel most/least free:','How I can protect others\' autonomy:']; fields.forEach(function(id,i){ var ta=$(id); L.push(p[i]); L.push('  '+((ta&&ta.value.trim())?ta.value.trim():'(blank)')); L.push(''); }); if(A.copy) A.copy(L.join('\n'),c); });
  })();

} catch(e){ console.error('project 006 script error', e); }
});
