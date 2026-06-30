/* Project 025 · Benatar Argument Explainer — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  /* 1 · matrix */
  (function(){
    var box=$('mxGrid'); if(!box) return;
    var C=[
      {b:'Scenario A — exists · Presence of pain',v:'Bad',cls:'bad',m:'Real suffering exists. A genuine harm. Almost no one disputes this cell.'},
      {b:'Scenario A — exists · Presence of pleasure',v:'Good',cls:'good',m:'Real enjoyment exists. A genuine benefit. Also widely accepted.'},
      {b:'Scenario B — never exists · Absence of pain',v:'Good',cls:'good',m:'The key move: a harm that never happens is counted as good — even though there is no one there to enjoy that good.'},
      {b:'Scenario B — never exists · Absence of pleasure',v:'Not bad',cls:'good',m:'The mirror move: a missing pleasure is bad only if someone is deprived of it. With no one created, no one is deprived — so it is "not bad", not "bad".'}
    ];
    box.innerHTML=C.map(function(c){ return '<div class="cell" tabindex="0"><b>'+esc(c.b)+'</b><span class="v '+c.cls+'">'+esc(c.v)+'</span><div class="more">'+esc(c.m)+'</div></div>'; }).join('');
    box.querySelectorAll('.cell').forEach(function(el){ function t(){ el.classList.toggle('open'); } el.addEventListener('click',t); el.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();t();} }); });
  })();

  /* 2 · premises */
  (function(){
    var box=$('premises'), concl=$('conclusion'), reset=$('pmReset'); if(!box) return;
    var P=[
      {id:'P1',text:'The presence of pain is bad, and the presence of pleasure is good.',rej:'Almost no one rejects this — it just states that suffering is bad and enjoyment is good.'},
      {id:'P2',text:'The absence of pain is good, even if there is no one to enjoy that good.',rej:'This is the crux. Reject it and you side with the "good for no one" objection — the most common exit from the argument.'},
      {id:'P3',text:'The absence of pleasure is not bad, unless there is someone for whom this absence is a deprivation.',rej:'Reject this and you\'d have to say a never-created person is "missing out" — but there is no one there to miss anything.'},
      {id:'P4',text:'So the absent pains of never existing are a real advantage, while the absent pleasures are no real loss.',rej:'This just combines P2 and P3. Rejecting it usually means you already rejected one of those.'}
    ];
    var state={}; P.forEach(function(p){ state[p.id]='y'; });
    function render(){
      box.innerHTML=P.map(function(p){ var st=state[p.id]; return '<div class="premise'+(st==='n'?' rejected':'')+'" data-id="'+p.id+'"><div class="ptop"><span class="pid">'+p.id+'</span><span class="ptext">'+esc(p.text)+'</span></div><div class="seg"><button type="button" data-v="y" class="'+(st==='y'?'on-y':'')+'">Accept</button><button type="button" data-v="n" class="'+(st==='n'?'on-n':'')+'">Reject</button></div><div class="note-r">'+esc(p.rej)+'</div></div>'; }).join('');
      box.querySelectorAll('.premise').forEach(function(el){ var id=el.getAttribute('data-id'); el.querySelectorAll('.seg button').forEach(function(b){ b.addEventListener('click',function(){ state[id]=b.getAttribute('data-v'); render(); concluder(); }); }); });
    }
    function concluder(){
      var rej=P.filter(function(p){return state[p.id]==='n';}).map(function(p){return p.id;});
      concl.innerHTML = rej.length===0
        ? '<b>Where you land:</b> accepting all four, the conclusion follows — for any possible person, never coming into existence is better than coming into existence, because the harms avoided count as a gain while the pleasures forgone cost no one. That is Benatar\'s asymmetry conclusion. (You can still think other considerations matter.)'
        : '<b>Where you land:</b> you reject '+rej.join(', ')+'. The asymmetry doesn\'t bind you as stated — and you\'ve put your finger on exactly the claim its critics deny. That\'s a respectable place to stand (see the objections below).';
    }
    if(reset) reset.addEventListener('click',function(){ P.forEach(function(p){ state[p.id]='y'; }); render(); concluder(); });
    render(); concluder();
  })();

  /* 3 · objections */
  (function(){
    var box=$('objList'); if(!box) return;
    var O=[
      {t:'"Good for no one"',o:'A good must be good FOR someone. The absence of pain in a world with no people is good for nobody — so calling it "good" (premise P2) is a category mistake. This is the most common and arguably strongest objection.',r:'Benatar replies with an impersonal or comparative reading: we can judge that never existing is better than a life of suffering even without a subject who "enjoys" the absence. Critics remain unconvinced; the debate is genuinely open.'},
      {t:'The asymmetry is not really asymmetric',o:'If a missing pain is good, then by parity a missing pleasure should be bad — and the whole argument collapses into symmetry, where existing and not existing come out even.',r:'Benatar argues the asymmetry is independently supported by everyday intuitions: we have a duty not to create a suffering child but no duty to create a happy one; we regret creating the miserable but not "failing" to create the happy. Whether those intuitions justify the formal claim is the contested point.'},
      {t:'It proves too much',o:'If never existing is always better, the argument implies it would have been better had no one ever existed — a conclusion many find a reductio rather than a result.',r:'Benatar accepts the conclusion is bleak but argues bleakness isn\'t falsehood; an argument isn\'t refuted by being unwelcome. Opponents counter that an intuition this strong is itself evidence something has gone wrong in the premises.'},
      {t:'Lives are worth starting',o:'Most people are glad to exist and rate their lives as good. If the asymmetry says every one of those lives was a net harm to begin, so much the worse for the asymmetry.',r:'Benatar replies via the quality-of-life argument: self-reports are inflated by optimism bias ("Pollyannaism"), so being "glad" is weak evidence about the real balance. Whether that move succeeds is, again, where reasonable people part ways.'}
    ];
    box.innerHTML=O.map(function(o){ return '<details class="obj"><summary>'+esc(o.t)+'<span class="chev" aria-hidden="true">›</span></summary><div class="body"><p>'+esc(o.o)+'</p><div class="reply"><b>Reply:</b> '+esc(o.r)+'</div></div></details>'; }).join('');
  })();

  /* 4 · quiz */
  (function(){
    var Q=[{a:1},{a:1},{a:0},{a:1}], E=['The contested move is between the two "absence" cells (P2 and P3).','Benatar holds the absence of pain is good even with no one to enjoy it.','The "good for no one" objection asks whether a good can exist with no subject it is good for.','The page aims at understanding the argument and its objections.'];
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
} catch(e){ console.error('project 025 script error', e); }
});
