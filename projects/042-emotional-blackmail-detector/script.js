/* Project 042 · Emotional Blackmail Detector — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var LEV={fear:'Fear',obligation:'Obligation',guilt:'Guilt'};
  // patterns: {lever, name, what, reframe, re}
  var PAT=[
    {lev:'fear',name:'Threat of withdrawal',what:'Hints that love, contact, or support will be taken away if you don\'t comply.',reframe:'Care that\'s conditional on obedience isn\'t a fair trade. You can hold your decision and still hope they stay close.',re:/\b(i (won'?t|will not) be around|you'?ll lose (me|us)|don'?t come (crying|running) to me|you'?ll be on your own|i'?ll cut you off|then we'?re done|lose the family)\b/i},
    {lev:'fear',name:'Catastrophic prediction',what:'Paints a frightening future to make the choice feel dangerous.',reframe:'A scary forecast isn\'t evidence. Your future is uncertain either way — and that\'s a reason to choose carefully, not fearfully.',re:/\b(you'?ll (die|end up) alone|you'?ll regret this forever|you'?ll be miserable|ruin your life|you'?ll be sorry|no one will want you)\b/i},
    {lev:'obligation',name:'Debt-calling',what:'Frames your compliance as repayment for what they\'ve given or sacrificed.',reframe:'Love freely given isn\'t a loan. Gratitude is fair; using your own life to "repay" it is not something you owe.',re:/\b(after (all|everything) (i'?ve|we'?ve) done|i sacrificed|you owe (me|us)|we gave you everything|repay us|how i raised you)\b/i},
    {lev:'obligation',name:'Role / duty appeal',what:'Invokes what a "good" daughter, son, or family member is supposed to do.',reframe:'Being a good person doesn\'t require one fixed life script. You can honour the relationship and still decide this for yourself.',re:/\b(a good (daughter|son|child|wife|husband) would|it'?s your duty|that'?s what family (is for|means)|family comes first|your responsibility to)\b/i},
    {lev:'guilt',name:'Heartbreak framing',what:'Makes you the cause of their pain to pull you back into line.',reframe:'Their feelings are real and deserve compassion — and they belong to them. You can be sorry they hurt without being to blame for it.',re:/\b(you'?re breaking my heart|how could you do this to (me|us)|you'?re killing me|you'?ll put me in an early grave|i can'?t bear it|you'?re tearing this family apart)\b/i},
    {lev:'guilt',name:'Disappointment / shame',what:'Leans on letting people down or on what others will think.',reframe:'You can\'t live a whole life to prevent someone\'s disappointment. Their reaction is information, not instruction.',re:/\b(so disappointed|what will people (say|think)|you'?re an embarrassment|shame on (you|the family)|everyone will (talk|judge)|let us down)\b/i},
    {lev:'guilt',name:'Self-blame bait',what:'Speaker turns their distress into your fault, inviting you to rescue them by complying.',reframe:'Comforting someone is kind; surrendering your decision to soothe them is not the same thing. Both your needs matter.',re:/\b(it'?s (all )?my fault (then|isn'?t it)|i must have failed (you|as a parent)|where did i go wrong|after i tried so hard)\b/i}
  ];
  var SAMPLES=[
    {t:'A guilt-heavy message',a:"After everything we've done for you, this is how you repay us? You're breaking my heart. What will people say? I must have failed as a parent."},
    {t:'A fear-heavy message',a:"If you go through with this, don't come crying to me. You'll end up alone and miserable, and you'll be sorry. A good daughter would think of her family first."},
    {t:'A gentler, mixed message',a:"I only want what's best for you. I just worry you'll regret it one day, and I'd be so disappointed if you missed out."}
  ];
  function renderSamples(){ var box=$('samples'); if(!box) return; box.innerHTML=SAMPLES.map(function(s,i){ return '<button type="button" class="sample-btn" data-i="'+i+'">'+esc(s.t)+'</button>'; }).join('');
    box.querySelectorAll('.sample-btn').forEach(function(b){ b.addEventListener('click',function(){ $('msgIn').value=SAMPLES[+b.getAttribute('data-i')].a; scan(); }); }); }
  function scan(){
    var text=$('msgIn').value||''; var box=$('findings'); if(!box) return;
    if(!text.trim()){ box.innerHTML='<p class="note">Paste a message (or pick a sample) and press scan.</p>'; return; }
    var hits=[]; PAT.forEach(function(p){ var m=p.re.exec(text); if(m){ hits.push({p:p,q:m[0]}); } });
    if(!hits.length){ box.innerHTML='<div class="finding" style="border-left-color:var(--info)"><span class="tac">No obvious FOG patterns found.</span><p class="what">That doesn\'t mean a message is fine or unfine — the scanner only catches common phrasings, and tone and history matter more than any single line. Trust how it actually felt to you.</p></div>'; return; }
    var byLev={}; hits.forEach(function(h){ byLev[h.p.lev]=(byLev[h.p.lev]||0)+1; });
    var legend=Object.keys(byLev).map(function(k){ return '<span class="fog-tag fog-'+k+'">'+LEV[k]+': '+byLev[k]+'</span>'; }).join(' ');
    box.innerHTML='<p class="outmeta">Found '+hits.length+' possible pattern'+(hits.length>1?'s':'')+'. A flag is a prompt to reflect, not a verdict.</p><div class="fog-legend">'+legend+'</div>'+
      hits.map(function(h){ return '<div class="finding lev-'+h.p.lev+'"><span class="tac">'+esc(h.p.name)+'</span> <span class="fog-tag fog-'+h.p.lev+'">'+LEV[h.p.lev]+'</span><p class="what">'+esc(h.p.what)+'</p><p class="quote">Flagged: "…'+esc(h.q)+'…"</p><p class="reframe"><b>Reframe:</b> '+esc(h.p.reframe)+'</p></div>'; }).join('');
  }
  $('scanBtn').addEventListener('click',scan);
  $('clearBtn').addEventListener('click',function(){ $('msgIn').value=''; scan(); });

  (function(){ var box=$('leverCards'); if(!box) return;
    var L=[['Fear','The sense that something bad — loss, abandonment, danger — will follow if you don\'t comply. It narrows your view to the threat.'],
      ['Obligation','The feeling that you owe this, because of what they\'ve given, who they are, or what a "good" family member does.'],
      ['Guilt','The belief that your choice is harming them, and that you must put it right by giving in. It makes their pain your responsibility.']];
    box.innerHTML=L.map(function(p,i){ var cls=['fog-fear','fog-obligation','fog-guilt'][i]; return '<div class="scard"><h4>'+esc(p[0])+' <span class="fog-tag '+cls+'">'+esc(p[0])+'</span></h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  (function(){ var box=$('tacticList'); if(!box) return;
    box.innerHTML=PAT.map(function(p){ return '<details><summary>'+esc(p.name)+' <span class="fog-tag fog-'+p.lev+'">'+LEV[p.lev]+'</span><span class="chev">▾</span></summary><div class="body"><p>'+esc(p.what)+'</p><p class="note"><b>A grounding reframe:</b> '+esc(p.reframe)+'</p></div></details>'; }).join(''); })();

  renderSamples(); scan();

  (function(){
    var Q=[{a:0},{a:0}], E=['FOG stands for Fear, Obligation, and Guilt — the three levers of emotional blackmail.','A flag is a possible pattern worth reflecting on, not proof of abuse or a command to act.'];
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
    var s=$('rSave'),cl=$('rClear');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 042 script error', e); }
});
