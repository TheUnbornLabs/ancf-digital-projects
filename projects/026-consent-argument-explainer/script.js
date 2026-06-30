/* Project 026 · Consent Argument Explainer — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  /* 2 · consent sorter */
  (function(){
    var box=$('sorterList'), reading=$('sortReading'); if(!box) return;
    var S=[
      {q:'You read a contract carefully, understand it, and sign it freely.',valid:true,why:'Valid consent: free, informed, and given in advance by the person affected. The gold standard.'},
      {q:'A surgeon explains the risks of an operation, and you agree to go ahead.',valid:true,why:'Valid: informed, voluntary, prior agreement by the patient.'},
      {q:'A surgeon operates on an unconscious crash victim with no time to ask.',valid:false,why:'Not actual consent — it\'s "presumed" emergency consent, justified by clear benefit and necessity, not by the person\'s real agreement.'},
      {q:'Someone agrees only because they were threatened.',valid:false,why:'Not valid: consent extracted by coercion isn\'t consent at all.'},
      {q:'"You\'ll probably be glad later," so we proceed without asking.',valid:false,why:'Not consent: it\'s a guess about future feelings, made after the fact, on the person\'s behalf.'},
      {q:'We create a brand-new person, whose existence begins only after the decision is made.',valid:false,why:'The key case: there is no one to ask, because the person does not yet exist. Consent is not merely missing — it is structurally impossible.'}
    ];
    var done=0;
    box.innerHTML=S.map(function(s,i){ return '<div class="scn" data-i="'+i+'" data-v="'+(s.valid?1:0)+'"><p class="q">'+esc(s.q)+'</p><div class="opts"><button type="button" data-a="1">Valid consent</button><button type="button" data-a="0">Not valid</button></div><div class="rev">'+esc(s.why)+'</div></div>'; }).join('');
    box.querySelectorAll('.scn').forEach(function(el){
      var correct=el.getAttribute('data-v');
      el.querySelectorAll('.opts button').forEach(function(b){ b.addEventListener('click',function(){
        if(el.classList.contains('done')) return;
        el.querySelectorAll('.opts button').forEach(function(x){ if(x.getAttribute('data-a')===correct) x.classList.add('ok'); else if(x===b) x.classList.add('no'); x.disabled=true; });
        el.classList.add('done'); done++;
        if(done===S.length && reading){ reading.style.display='block'; reading.innerHTML='<b>The pattern:</b> valid consent needs a person who can freely and knowingly agree, in advance. Emergencies, coercion, and "they\'ll be glad later" all fall short in familiar ways. Birth is different in kind from all of them: there is literally no one there to ask. The consent argument turns on whether that unique impossibility excuses the imposition — or makes it especially hard to justify.'; }
      }); });
    });
  })();

  /* 3 · premises */
  (function(){
    var box=$('premises'), concl=$('conclusion'), reset=$('pmReset'); if(!box) return;
    var P=[
      {id:'P1',text:'Imposing serious, unavoidable burdens on a person normally requires their consent.',rej:'Reject this and you accept that big impositions can be justified by benefit alone — weakening the argument at the root.'},
      {id:'P2',text:'Being born imposes serious, unavoidable burdens (risk of suffering, certain mortality).',rej:'Reject this and you treat existence as a pure gift with nothing for consent to attach to.'},
      {id:'P3',text:'A future person cannot give prior consent, because they do not yet exist.',rej:'This is close to a plain fact; most of the debate happens elsewhere.'},
      {id:'P4',text:'Later or hypothetical consent does not justify the original imposition.',rej:'Reject this and you let "they\'d agree" do the justifying work — the move most defenders of procreation make.'}
    ];
    var state={}; P.forEach(function(p){ state[p.id]='y'; });
    function render(){ box.innerHTML=P.map(function(p){ var st=state[p.id]; return '<div class="premise'+(st==='n'?' rejected':'')+'" data-id="'+p.id+'"><div class="ptop"><span class="pid">'+p.id+'</span><span class="ptext">'+esc(p.text)+'</span></div><div class="seg"><button type="button" data-v="y" class="'+(st==='y'?'on-y':'')+'">Accept</button><button type="button" data-v="n" class="'+(st==='n'?'on-n':'')+'">Reject</button></div><div class="note-r">'+esc(p.rej)+'</div></div>'; }).join('');
      box.querySelectorAll('.premise').forEach(function(el){ var id=el.getAttribute('data-id'); el.querySelectorAll('.seg button').forEach(function(b){ b.addEventListener('click',function(){ state[id]=b.getAttribute('data-v'); render(); concluder(); }); }); }); }
    function concluder(){ var rej=P.filter(function(p){return state[p.id]==='n';}).map(function(p){return p.id;}); concl.innerHTML = rej.length===0 ? '<b>Where you land:</b> accepting all four, the consent worry follows — creating a person without their (impossible) consent, for an existence that imposes serious unavoidable burdens, needs a justification it cannot straightforwardly get.' : '<b>Where you land:</b> you reject '+rej.join(', ')+'. The argument doesn\'t bind you as stated — you\'ve named exactly the premise you\'d defend procreation by denying (see the replies below).'; }
    if(reset) reset.addEventListener('click',function(){ P.forEach(function(p){ state[p.id]='y'; }); render(); concluder(); });
    render(); concluder();
  })();

  /* 4 · replies */
  (function(){
    var box=$('objList'); if(!box) return;
    var O=[
      {t:'No subject, no wrong',o:'Consent is a relation between persons. Before conception there is no person, so there is no one whose consent is missing and no one to be wronged. The framework simply doesn\'t apply.',r:'Reply: we already judge how our acts affect future people (e.g., leaving a habitable planet). If their interests count once they exist, the consentless act that created them is still on the table.'},
      {t:'Hypothetical consent suffices',o:'We constantly make un-consented choices that benefit future people — vaccinating a population, conceiving a child who will enjoy life. A rational person would agree, so the imposition is justified.',r:'Reply (after Shiffrin): birth differs because it imposes grave, irreversible burdens for a noncomparative benefit. "They\'d agree" is weakest exactly where the stakes are highest.'},
      {t:'Life is a benefit, not an imposition',o:'Existence is the precondition of every good. Framing it as a burden needing consent ignores that it is the greatest gift one can give.',r:'Reply: the gold-coins case targets this — a benefit can be real and still wrongly imposed if it comes bundled with serious, un-consented harm.'},
      {t:'Consent is the wrong tool',o:'Procreation isn\'t like surgery or contracts; importing "consent" smuggles in a model that doesn\'t fit creating a person at all.',r:'Reply: a fair challenge — and many antinatalists agree the model strains, then reframe via risk or the asymmetry. That the tool fits imperfectly is a reason to examine the others, not to dismiss the unease.'}
    ];
    box.innerHTML=O.map(function(o){ return '<details class="obj"><summary>'+esc(o.t)+'<span class="chev" aria-hidden="true">›</span></summary><div class="body"><p>'+esc(o.o)+'</p><div class="reply"><b>Reply:</b> '+esc(o.r)+'</div></div></details>'; }).join('');
  })();

  (function(){
    var Q=[{a:1},{a:0},{a:1}], E=['Birth is unique because the person does not yet exist to be asked at all.','The gold-coins case challenges the idea that a benefit simply cancels an un-consented burden.','"They\'ll be glad later" is after-the-fact and on the person\'s behalf — not consent to the original act.'];
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
    var s=$('saveBtn'),cl=$('clearBtn');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 026 script error', e); }
});
