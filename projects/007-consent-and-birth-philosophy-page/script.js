/* Project 007 · Consent & Birth Philosophy — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A = window.ANCF || {};
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  /* 2 · premise builder */
  (function(){
    var box=$('premises'), concl=$('conclusion'), reset=$('pmReset'); if(!box) return;
    var P=[
      {id:'P1',text:'For serious, avoidable impositions on a person, we normally need their consent.',rej:'Rejecting this means you think serious impositions can be justified without consent — perhaps by the benefit alone. That weakens the consent worry from the start.'},
      {id:'P2',text:'Being born imposes serious, unavoidable conditions on the person (risk of suffering, certain mortality).',rej:'Rejecting this means you see existence as not a serious imposition — perhaps a pure gift. Then there is little for consent to attach to.'},
      {id:'P3',text:'A future person cannot give prior consent, because they do not yet exist.',rej:'This one is hard to reject — it is close to a plain fact. Most debate happens around the other premises.'},
      {id:'P4',text:'Hypothetical or later consent does not justify the imposition (it is constructed after the fact).',rej:'Rejecting this means you accept that "they\'d agree later" or "a rational person would agree" can do the justifying work. Many defenders of procreation take exactly this route.'}
    ];
    var state={}; P.forEach(function(p){ state[p.id]='y'; });
    function render(){
      box.innerHTML=P.map(function(p){
        var st=state[p.id];
        return '<div class="premise'+(st==='n'?' rejected':'')+'" data-id="'+p.id+'"><div class="ptop"><span class="pid">'+p.id+'</span><span class="ptext">'+esc(p.text)+'</span></div>'+
          '<div class="seg"><button type="button" data-v="y" class="'+(st==='y'?'on-y':'')+'">Accept</button><button type="button" data-v="n" class="'+(st==='n'?'on-n':'')+'">Reject</button></div>'+
          '<div class="note-r">'+esc(p.rej)+'</div></div>';
      }).join('');
      box.querySelectorAll('.premise').forEach(function(el){
        var id=el.getAttribute('data-id');
        el.querySelectorAll('.seg button').forEach(function(b){ b.addEventListener('click',function(){ state[id]=b.getAttribute('data-v'); render(); concluder(); }); });
      });
    }
    function concluder(){
      var rejected=P.filter(function(p){ return state[p.id]==='n'; }).map(function(p){return p.id;});
      var s;
      if(rejected.length===0) s='<b>Where you land:</b> accepting all four premises, the consent worry follows for you — creating a person without their consent, for an existence that imposes serious unavoidable conditions, stands in need of a justification it cannot straightforwardly get. That is the antinatalist conclusion in its consent form. (You can still think other considerations outweigh it.)';
      else s='<b>Where you land:</b> you reject '+rejected.join(', ')+'. The consent argument doesn\'t bind you as stated — you\'ve identified exactly the premise you\'d defend procreation by denying. That\'s a respectable place to stand, and it\'s precisely the move its critics make (see the objection explorer below).';
      concl.innerHTML=s;
    }
    if(reset) reset.addEventListener('click',function(){ P.forEach(function(p){ state[p.id]='y'; }); render(); concluder(); });
    render(); concluder();
  })();

  /* 3 · three senses */
  (function(){
    var box=$('sensesCards'); if(!box) return;
    var S=[
      {t:'Prior (actual) consent',tg:'Agreement given in advance.',more:'The gold standard for impositions — but flatly impossible before someone exists. This is the gap the whole argument turns on.'},
      {t:'Hypothetical consent',tg:'What a rational person would agree to.',more:'Defenders say a reasonable person would consent to a decent life, so the imposition is justified. Critics reply it is constructed by us, after the fact, and cannot bind a person who never existed to be reasonable.'},
      {t:'Dispositional / later consent',tg:'They\'ll be glad they were born.',more:'Most people are glad to exist — doesn\'t that settle it? Critics note this is retroactive and survivorship-biased: it can\'t justify the original gamble, and it ignores those who are not glad.'}
    ];
    box.innerHTML=S.map(function(s){ return '<div class="scard" tabindex="0"><h4>'+esc(s.t)+'</h4><p class="tg">'+esc(s.tg)+'</p><p class="more">'+esc(s.more)+'</p></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ function t(){ c.classList.toggle('open'); } c.addEventListener('click',t); c.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); t(); } }); });
  })();

  /* 5 · objection explorer */
  (function(){
    var box=$('objList'); if(!box) return;
    var O=[
      {t:'The non-identity problem',o:'You can\'t harm someone by creating them: if the alternative for that very person is never existing, there is no one who is "made worse off." A flawed existence may be the only existence they could have.',r:'Antinatalists answer with impersonal or asymmetry-based reasoning: the badness of imposed suffering can count even without a comparative "worse for." The puzzle is real and unresolved — see Chapter 25 of The Antinatalism Reader.'},
      {t:'The "no subject" objection',o:'Consent is a relation between persons. Before conception there is no person, so there is no one whose consent is missing and no one to be wronged. Consent simply doesn\'t apply.',r:'Reply: we routinely make moral judgments about how our acts will affect future people (e.g., leaving a habitable planet). If their interests count once they exist, the consentless imposition that created them is still on the table.'},
      {t:'Hypothetical consent is enough',o:'We constantly make un-consented decisions for future people that benefit them — vaccinating a population, conceiving a child who will enjoy life. A rational person would agree, so the imposition is justified.',r:'Shiffrin\'s reply: birth differs because it imposes serious, unavoidable burdens for a noncomparative benefit. "They\'d agree" is weakest exactly where the burdens are gravest and irreversible.'},
      {t:'Life is a benefit, not a harm',o:'Existence is the precondition of every good thing. To frame it as an imposition needing consent is to ignore that it is the greatest gift one can give.',r:'The gold-coins analogy targets exactly this: a benefit can be real and still be wrongly imposed if it comes bundled with serious, un-consented harm. "It\'s a gift" doesn\'t dissolve the worry.'},
      {t:'Consent is the wrong framework',o:'Procreation isn\'t like medical treatment or contracts; importing "consent" smuggles in a model that doesn\'t fit creating a person at all.',r:'Fair challenge — and antinatalists often agree the model is imperfect, then reframe via risk or the asymmetry. That the consent frame strains is a reason to examine the others, not to dismiss the underlying unease.'}
    ];
    box.innerHTML=O.map(function(o){ return '<details class="obj"><summary>'+esc(o.t)+'<span class="chev" aria-hidden="true">›</span></summary><div class="body"><p>'+esc(o.o)+'</p><div class="reply"><b>Antinatalist reply:</b> '+esc(o.r)+'</div></div></details>'; }).join('');
  })();

  /* 6 · position finder */
  (function(){
    var inputs=[].slice.call(document.querySelectorAll('#posRows input[type=range]'));
    if(!inputs.length) return;
    var out=$('posOut');
    function val(id){ var e=$(id); return e?+e.value:50; }
    function update(){
      inputs.forEach(function(i){ var o=$('o-'+i.id); if(o) o.textContent=i.value+'%'; });
      var impose=val('p-impose'), consent=val('p-consent'), benefit=val('p-benefit'), noone=val('p-noone');
      var s;
      if(consent>=60 && impose>=60 && benefit<50 && noone<50) s='Your answers lean toward <b>finding the consent worry compelling</b>: birth imposes a lot, consent still matters across the gap, and you\'re not satisfied that "it\'s a gift" or "no subject yet" closes it. That\'s the antinatalist consent position.';
      else if(noone>=60 || benefit>=60) s='Your answers lean toward <b>resisting the consent argument</b>: either you think consent doesn\'t apply where no one yet exists, or that the benefit of existence outweighs the lack of consent. That aligns with the main critics — a well-populated, respectable position.';
      else if(impose>=60 && consent>=60 && benefit>=50) s='You hold the tension <b>genuinely open</b>: you feel the force of the imposition and of consent, but also that life\'s benefit pulls the other way. Many thoughtful people live exactly here — taking the question seriously without a settled verdict.';
      else s='Your view is <b>mixed and still forming</b> — which is honest for a question this hard. Notice which single slider, if it moved, would tip you. That\'s the premise your real position depends on.';
      if(out) out.innerHTML=s;
      var store={}; inputs.forEach(function(i){ store[i.id]=i.value; }); if(A.setJSON) A.setJSON('position',store);
    }
    var s=A.getJSON?A.getJSON('position',null):null;
    inputs.forEach(function(i){ if(s&&s[i.id]!=null) i.value=s[i.id]; i.addEventListener('input',update); });
    update();
  })();

  /* 7 · quiz */
  (function(){
    var Q=[{a:1,e:'The argument starts from the plain fact that a future person can\'t agree to being born in advance.'},
      {a:0,e:'Hypothetical consent is what a rational person would supposedly agree to — a constructed, not actual, agreement.'},
      {a:1,e:'It captures our unease at imposing serious un-consented burdens for a benefit no one asked for.'},
      {a:0,e:'The "no subject" objection says there\'s no one yet to be wronged by missing consent before they exist.'},
      {a:1,e:'The page aims at understanding the argument and its objections — it argues for no conclusion.'}];
    var picks={}, total=document.querySelectorAll('#quizbox .quiz-q').length;
    if(A.initOptions) A.initOptions($('quizbox'),function(q,i){ picks[q]=+i; });
    var sB=$('quizScore'), rB=$('quizReset'), res=$('quizResult');
    if(sB) sB.addEventListener('click',function(){ if(Object.keys(picks).length<total){ res.style.display='block'; res.textContent='Pick an answer for all '+total+' questions first.'; return; }
      var sc=0; Q.forEach(function(it,i){ document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){ var j=+x.getAttribute('data-i'); x.classList.remove('ok','no'); if(j===it.a)x.classList.add('ok'); else if(j===picks[i])x.classList.add('no'); }); var ex=document.querySelector('.explain[data-q="'+i+'"]'); if(ex){ ex.style.display='block'; ex.textContent=it.e; } if(picks[i]===it.a)sc++; });
      res.style.display='block'; res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.'; if(rB) rB.style.display='inline-block'; });
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
    if(c) c.addEventListener('click',function(){ var L=['Consent & birth — my reflection','']; var p=['Hardest premise/objection:','Where I currently land:']; fields.forEach(function(id,i){ var ta=$(id); L.push(p[i]); L.push('  '+((ta&&ta.value.trim())?ta.value.trim():'(blank)')); L.push(''); }); if(A.copy) A.copy(L.join('\n'),c); });
  })();

} catch(e){ console.error('project 007 script error', e); }
});
