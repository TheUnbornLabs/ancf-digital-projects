/* Project 010 · "No Means No" Family Boundary Tool — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A = window.ANCF || {};
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  function lc(s){ return s.charAt(0).toLowerCase()+s.slice(1); }

  /* 2 · boundary generator */
  (function(){
    var OPEN={parent:['I know you love me, ','I know this matters to you, '],inlaw:['I appreciate you caring about our family, '],sibling:['',"Honestly, "],grandparent:['I know you\'d adore a grandchild, '],relative:['Thanks for thinking of us, '],friend:['','I\'ll be straight with you — ']};
    var CORE={
      when:['having children isn\'t part of our plans.','we\'re not planning to have kids.','kids aren\'t on our path.'],
      why:['it\'s simply not the life we want, and that\'s reason enough.','we\'ve thought about it and it\'s not for us.','the honest answer is that we don\'t want to — and that\'s okay.'],
      regret:['I\'ve thought it through, and I\'m at peace with my choice.','I do know my own mind on this.','I\'d rather choose clearly than have a child to avoid a "maybe."'],
      grand:['I can\'t promise you grandchildren, and I don\'t want you holding out hope.','grandchildren aren\'t something I can give you, and I\'d rather be honest than vague.','I know it\'s a real loss for you, and it still isn\'t going to change.'],
      selfish:['choosing the life that fits me honestly isn\'t selfish to anyone.','there\'s no one being harmed by my choice.','I won\'t accept "selfish" for a decision that hurts no one.'],
      generic:['my answer on this isn\'t going to change.','we\'ve made our decision, and it\'s settled.','this is just how it is for us.']
    };
    var CLOSE={warm:['I\'d love for us to talk about other things.','I hope you can be happy for me.','Thanks for hearing me.'],firm:['I\'m not going to keep discussing it.','I\'d like you to respect that.','Please take this as my real answer.'],final:['Please don\'t raise it again.','This is the last time I\'ll have this conversation.','I need you to let it rest for good.'],light:['Anyway — who\'s hungry?','I\'ll send a card if anything changes!','Now, more importantly: how about that weather?']};
    var GOAL={end:'',boundary:' Going forward, if it comes up again I\'m going to change the subject.',buy:' Can we set this one down for today?'};
    var who=$('gWho'),q=$('gQ'),tone=$('gTone'),goal=$('gGoal'),gen=$('gGen'),an=$('gAnother'),copy=$('gCopy'),out=$('gOut');
    if(!gen) return;
    var last='';
    function make(){
      var core=pick(CORE[q.value]||CORE.generic), text;
      if(tone.value==='light'){ text=core.charAt(0).toUpperCase()+core.slice(1)+' '+pick(CLOSE.light); }
      else { var op=pick(OPEN[who.value]||['']); var cl=pick(CLOSE[tone.value]||CLOSE.firm); text=(op?op+lc(core):core.charAt(0).toUpperCase()+core.slice(1))+' '+cl; }
      text+= (GOAL[goal.value]||'');
      text=text.charAt(0).toUpperCase()+text.slice(1);
      if(text===last) return make(); last=text; return text;
    }
    function show(){ out.textContent=make(); }
    gen.addEventListener('click',show); an.addEventListener('click',show);
    copy.addEventListener('click',function(){ var v=out.textContent; if(v&&v.indexOf('will appear')===-1&&A.copy) A.copy(v,copy); else if(A.copy) A.copy(make(),copy); });
  })();

  /* 3 · blackmail decoder */
  (function(){
    var TAC=[
      {id:'guilt',re:/(after (everything|all)|how could you|breaks? (my|your mother'?s|her|his) heart|repay us|ungrateful|so selfish|killing me|disappointed in you|i sacrificed)/i,name:'Guilt-trip',what:'Uses your love and their sacrifice as leverage, so that holding your ground feels like cruelty.',resp:'I love you, and I\'m sorry this disappoints you. My answer is still the same.'},
      {id:'obligation',re:/(you owe|your duty|duty to|supposed to|expected of you|obligation|it'?s your job|for the family|family comes first)/i,name:'Obligation / "you owe us"',what:'Invokes a debt you never agreed to, treating your body or future as something owed.',resp:'I didn\'t agree to that, and it isn\'t a debt I can pay. This is my decision.'},
      {id:'threat',re:/(if you don'?t|or (i'?ll|we'?ll|else)|out of the will|cut you off|disown|won'?t be welcome|never forgive you|don'?t bother|you'?ll be sorry)/i,name:'Ultimatum / threat',what:'Attaches a punishment to your choice — the core of emotional blackmail.',resp:'If that\'s your choice, I\'ll have to accept it — but threats won\'t change my decision.'},
      {id:'fear',re:/(you'?ll regret|end up alone|die alone|all alone|lonely|who will (look after|care for) you|when you'?re old|miss out)/i,name:'Fear-mongering',what:'Pressures you with worst-case futures rather than addressing your actual choice.',resp:'I\'m planning thoughtfully for my future. I\'m not going to decide out of fear.'},
      {id:'compare',re:/(your (sister|brother|cousin)|everyone else|other people'?s kids|look at|why can'?t you be like)/i,name:'Unfavorable comparison',what:'Measures you against others to make your choice feel like a failure.',resp:'I\'m not them, and my life isn\'t a competition. This is right for me.'},
      {id:'minimize',re:/(overreacting|so dramatic|can'?t even ask|i was only|just asking|no need to be|too sensitive|calm down)/i,name:'Minimizing / DARVO',what:'Recasts their pressure as innocent and your boundary as the problem.',resp:'I\'m calm — and I\'m still asking you to stop bringing it up.'},
      {id:'silent',re:/(won'?t speak to you|dead to me|don'?t call|silent|won'?t talk|cut off contact)/i,name:'Withdrawal / silent treatment',what:'Threatens connection itself to make the cost of your "no" feel unbearable.',resp:'I hope you won\'t, but I can\'t change my decision to keep the peace. The door\'s open when you\'re ready.'}
    ];
    var inEl=$('decIn'),run=$('decRun'),clr=$('decClear'),wrap=$('decResult'),sum=$('decSummary'),find=$('decFindings'),empty=$('decEmpty');
    if(!inEl||!run) return;
    document.querySelectorAll('#samples .sample-btn').forEach(function(b){ b.addEventListener('click',function(){ inEl.value=b.getAttribute('data-s'); decode(); inEl.focus(); }); });
    function decode(){
      var t=(inEl.value||'').trim(); wrap.style.display='none'; empty.style.display='none';
      if(!t){ empty.style.display='block'; empty.textContent='Paste or type what was said, then press Decode.'; return; }
      var hits=TAC.filter(function(x){ return x.re.test(t); });
      if(!hits.length){ sum.textContent='No common manipulation tactics detected.'; find.innerHTML='<p class="dec-empty">That doesn\'t mean it didn\'t feel like pressure — the decoder only knows common phrasings. Trust your read, and the boundary generator above can still help.</p>'; wrap.style.display='block'; return; }
      sum.textContent='Found '+hits.length+' tactic'+(hits.length>1?'s':'')+' — naming them helps you stay steady:';
      find.innerHTML=hits.map(function(h){ return '<div class="finding"><span class="tac">'+esc(h.name)+'</span><p class="what">'+esc(h.what)+'</p><div class="resp"><b>Steady response:</b> "'+esc(h.resp)+'"</div></div>'; }).join('');
      wrap.style.display='block';
    }
    run.addEventListener('click',decode);
    clr.addEventListener('click',function(){ inEl.value=''; wrap.style.display='none'; empty.style.display='none'; inEl.focus(); });
  })();

  /* 4 · escalation ladder */
  (function(){
    var box=$('ladderList'); if(!box) return;
    var R=[
      {ti:'Light redirect',d:'Acknowledge and pivot — no boundary needed yet.',say:'"Ha, good question — anyway, how\'s the garden coming along?"'},
      {ti:'Clear statement',d:'State your position once, plainly and warmly, so they\'ve genuinely heard it.',say:'"We\'re not planning to have children. I wanted you to hear it from me directly."'},
      {ti:'Broken record',d:'They push back; you repeat the same calm line, adding no new reasons to argue with.',say:'"Like I said, it\'s not for us." (…and again, unchanged, as needed.)'},
      {ti:'Name it + request',d:'Name the pattern and make a direct request to stop.',say:'"I\'ve answered this a few times now. I\'m asking you to stop bringing it up."'},
      {ti:'State a consequence',d:'Tell them what you\'ll do if it continues — something you control, and will actually follow through on.',say:'"If it keeps coming up, I\'m going to change the subject or head home early."'},
      {ti:'Follow through / distance',d:'Calmly do exactly what you said — leave the room, end the call, shorten the visit. Kindly, not as punishment.',say:'"I love you, and I\'m going to go now. Let\'s talk soon about something else."'}
    ];
    box.innerHTML=R.map(function(r,i){ return '<div class="rung" tabindex="0"><div class="top"><span class="n">'+(i+1)+'</span><span class="ti">'+esc(r.ti)+'</span></div><div class="more">'+esc(r.d)+'<span class="say">'+esc(r.say)+'</span></div></div>'; }).join('');
    box.querySelectorAll('.rung').forEach(function(el){ function t(){ el.classList.toggle('open'); } el.addEventListener('click',t); el.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); t(); } }); });
  })();

  /* 5 · rehearsal */
  (function(){
    var box=$('reh'); if(!box) return;
    var STEPS=[
      { npc:'"So! Any baby news yet? You two have been married a while now…"',
        choices:[
          {t:'"No news — it\'s not in our plans. How\'s work going for you?"',o:'Clear and warm, with a pivot. Most conversations end right here. If they push, you\'ve already set the line — go to the next step.',good:true},
          {t:'"Ugh, why does everyone keep asking me that?!"',o:'The frustration is fair, but it invites a defensive back-and-forth. Try leading with the calm line instead — you can always escalate later.',good:false}
        ] },
      { npc:'"Not in your plans? Oh, you\'ll change your mind. Everyone says that and then they come around!"',
        choices:[
          {t:'"Like I said, it\'s not for us."  (broken record)',o:'Perfect broken-record move. You repeated the same short line and gave them nothing new to argue with. This is the technique that actually works over time.',good:true},
          {t:'"Well, actually, studies show childfree people are just as happy, and…"',o:'Now you\'re debating, which hands them an opening for every counter-point. You don\'t owe the evidence — the boundary is enough.',good:false}
        ] },
      { npc:'"I just think you\'re being selfish. After everything your mother hoped for…"',
        choices:[
          {t:'"I love you, and my answer is the same. I\'m going to change the subject now."',o:'You named your love, held the line, and stated what YOU will do. That\'s rungs 3–5 in one calm move — exactly right when guilt enters.',good:true},
          {t:'Say nothing and quietly seethe for the rest of the visit.',o:'Sometimes silence is self-protection, and that\'s okay. But a short, kind line tends to cost you less than a whole evening of resentment.',good:false}
        ] }
    ];
    var step=0;
    function render(){
      var s=STEPS[step];
      box.innerHTML='<p class="step-n">Step '+(step+1)+' of '+STEPS.length+'</p><div class="npc">'+esc(s.npc)+'</div><div class="choices">'+s.choices.map(function(c,i){return '<button class="choice" type="button" data-i="'+i+'">'+esc(c.t)+'</button>';}).join('')+'</div><div id="rehOut"></div>';
      box.querySelectorAll('.choice').forEach(function(b){ b.addEventListener('click',function(){
        var c=s.choices[+b.getAttribute('data-i')];
        var nav = step<STEPS.length-1 ? '<button class="btn btn-primary" type="button" id="rehNext">Next push →</button>' : '<button class="btn btn-primary" type="button" id="rehRestart">↺ Replay from the start</button>';
        $('rehOut').innerHTML='<div class="outcome">'+esc(c.o)+'</div><div class="btn-row" style="margin-top:10px">'+nav+'</div>';
        var nx=$('rehNext'); if(nx) nx.addEventListener('click',function(){ step++; render(); });
        var rs=$('rehRestart'); if(rs) rs.addEventListener('click',function(){ step=0; render(); });
      }); });
    }
    render();
  })();

  /* 6 · quiz */
  (function(){
    var Q=[{a:1,e:'A boundary is about what YOU will do, not about controlling the other person.'},
      {a:0,e:'FOG = Fear, Obligation, Guilt — the three levers most pressure pulls.'},
      {a:1,e:'The broken record means calmly repeating the same short line, giving them nothing new to argue with.'},
      {a:1,e:'"It\'s not for us" is a complete sentence — it closes the topic without inviting debate.'},
      {a:1,e:'Climb the ladder one rung at a time and stop as soon as it works; jumping to cut-off is rarely needed.'}];
    var picks={}, total=document.querySelectorAll('#quizbox .quiz-q').length;
    if(A.initOptions) A.initOptions($('quizbox'),function(q,i){ picks[q]=+i; });
    var sB=$('quizScore'), rB=$('quizReset'), res=$('quizResult');
    if(sB) sB.addEventListener('click',function(){ if(Object.keys(picks).length<total){ res.style.display='block'; res.textContent='Pick an answer for all '+total+' questions first.'; return; }
      var sc=0; Q.forEach(function(it,i){ document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){ var j=+x.getAttribute('data-i'); x.classList.remove('ok','no'); if(j===it.a)x.classList.add('ok'); else if(j===picks[i])x.classList.add('no'); }); var ex=document.querySelector('.explain[data-q="'+i+'"]'); if(ex){ ex.style.display='block'; ex.textContent=it.e; } if(picks[i]===it.a)sc++; });
      res.style.display='block'; res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.'; if(rB) rB.style.display='inline-block'; });
    if(rB) rB.addEventListener('click',function(){ picks={}; document.querySelectorAll('#quizbox .opt').forEach(function(x){ x.classList.remove('sel','ok','no'); }); document.querySelectorAll('#quizbox .explain').forEach(function(ex){ ex.style.display='none'; ex.textContent=''; }); res.style.display='none'; rB.style.display='none'; });
  })();

  /* 7 · reflection */
  (function(){
    var fields=['r1','r2'], status=$('saveStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    fields.forEach(function(id){ var ta=$(id); if(!ta||!A.get)return; ta.value=A.get(id,''); ta.addEventListener('input',function(){ A.set(id,ta.value); }); });
    var s=$('saveBtn'),c=$('copyBtn'),cl=$('clearBtn');
    if(s) s.addEventListener('click',function(){ fields.forEach(function(id){ var ta=$(id); if(ta&&A.set)A.set(id,ta.value); }); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(fields.some(function(id){var t=$(id);return t&&t.value.trim();})&&!window.confirm('Clear your reflection?'))return; fields.forEach(function(id){ var ta=$(id); if(ta){ ta.value=''; if(A.remove)A.remove(id); } }); flash('Cleared.'); });
    if(c) c.addEventListener('click',function(){ var L=['My boundary plan — ANCF Project 010','']; var p=['Who I need a boundary with / starting rung:','My broken-record line:']; fields.forEach(function(id,i){ var ta=$(id); L.push(p[i]); L.push('  '+((ta&&ta.value.trim())?ta.value.trim():'(blank)')); L.push(''); }); if(A.copy) A.copy(L.join('\n'),c); });
  })();

} catch(e){ console.error('project 010 script error', e); }
});
