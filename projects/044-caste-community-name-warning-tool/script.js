/* Project 044 · Caste & Community Name Warning Tool — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  // detect CONSTRUCTIONS that target groups, not specific group names
  var PAT=[
    {name:'Sweeping generalization',why:'Treats a whole group as one mind. Even if some members apply pressure, "all / every / those" erases the many who don\'t.',fix:'Name the behaviour and who actually does it: "relatives who pressure people" rather than "all of group X".',re:/\b(all|every|those|these|most) (\w+ )?(people|communities|community|castes?|families|members|folks|of them|of those)\b/i},
    {name:'Essentializing ("it\'s in their…")',why:'Claims pressure is built into a group\'s nature, culture, or blood — which is a stereotype, not an explanation.',fix:'Point to the changeable practice instead: "this custom" or "this expectation," which individuals can and do question.',re:/\b(it'?s in their (culture|blood|nature|dna)|that'?s (just )?how (they|those people) are|people like (that|them|us)|what do you expect from|their kind|your kind)\b/i},
    {name:'Group blame',why:'Pins responsibility on an entire caste, community, religion, or ethnicity — collective blame that\'s both unfair and inaccurate.',fix:'Aim at the structure: "the norm that treats parenthood as compulsory," not the group that happens to hold it.',re:/\b(the \w+ (community|caste|religion|sect|tribe|people) (is|are) (to blame|the problem|backward|responsible)|blame the \w+ (community|caste|religion)|\w+s are (to blame|the problem|responsible for))\b/i},
    {name:'Dehumanizing / derogatory framing',why:'Words like "backward," "primitive," or "breeding" demean people and turn a critique of pressure into an attack on dignity.',fix:'Drop the loaded label entirely. Describe the practice plainly and let the reader judge it.',re:/\b(backward|primitive|savage|uncivilised|uncivilized|breed(ing)? like|those types|inferior|these savages)\b/i},
    {name:'Othering ("those people")',why:'Splits the world into "us" and "those people," which builds contempt rather than understanding.',fix:'Speak about specific actions and individuals, not a faceless "them": "some family members," "this particular comment".',re:/\b(those people|these people|them lot|that lot|their sort|people of that (kind|sort|type))\b/i}
  ];
  var SAMPLES=[
    {t:'A group-targeting draft',a:"Honestly, all those people from that community are backward — it's in their culture to force everyone to have kids. The whole caste is the problem."},
    {t:'Subtle othering',a:"You know how those people are. What do you expect from that sort? They all think the same way about marriage and babies."},
    {t:'A well-aimed draft (clean)',a:"The expectation that every couple must have children is a harmful norm. Let's challenge the practice of pressuring people, wherever it shows up."}
  ];
  function renderSamples(){ var box=$('samples'); if(!box) return; box.innerHTML=SAMPLES.map(function(s,i){ return '<button type="button" class="sample-btn" data-i="'+i+'">'+esc(s.t)+'</button>'; }).join('');
    box.querySelectorAll('.sample-btn').forEach(function(b){ b.addEventListener('click',function(){ $('msgIn').value=SAMPLES[+b.getAttribute('data-i')].a; scan(); }); }); }
  function scan(){
    var text=$('msgIn').value||''; var box=$('findings'); if(!box) return;
    if(!text.trim()){ box.innerHTML='<p class="note">Paste a draft (or pick a sample) and press screen.</p>'; return; }
    var hits=[]; PAT.forEach(function(p){ var m=p.re.exec(text); if(m){ hits.push({p:p,q:m[0]}); } });
    if(!hits.length){ box.innerHTML='<div class="clean"><b>No group-targeting language flagged. ✓</b><br>This draft seems to aim at the behaviour rather than a group — that\'s exactly the goal. Still give it a careful read: the screener catches common phrasings, not every case.</div>'; return; }
    box.innerHTML='<p class="outmeta">Flagged '+hits.length+' phrase'+(hits.length>1?'s':'')+' that may target a group rather than a behaviour. Consider rewriting each.</p>'+
      hits.map(function(h){ return '<div class="finding"><span class="tac">'+esc(h.p.name)+'</span><p class="quote">Flagged: "…'+esc(h.q)+'…"</p><p class="what"><b>Why it backfires:</b> '+esc(h.p.why)+'</p><p class="fix"><b>Refocus:</b> '+esc(h.p.fix)+'</p></div>'; }).join('');
  }
  $('scanBtn').addEventListener('click',scan);
  $('clearBtn').addEventListener('click',function(){ $('msgIn').value=''; scan(); });

  (function(){ var box=$('principleCards'); if(!box) return;
    var P=[['Behaviour, not identity','Criticise what people do — pressuring, shaming, coercing — never who they are by birth or belief.'],
      ['No collective blame','A pushy relative isn\'t evidence about their whole community. Resist "they all" — it\'s a stereotype, and it\'s usually false.'],
      ['Aim up at structures','The real target is the system that treats parenthood as compulsory. Structures can be criticised without demeaning any group.'],
      ['It spans every culture','Pronatal pressure appears in nearly every society and faith. Singling out one group is both inaccurate and unjust.']];
    box.innerHTML=P.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();

  (function(){ var box=$('baBox'); if(!box) return;
    var BA=[
      ['"That community always forces marriage and kids on people."','"The expectation that everyone must marry and have children causes real harm — let\'s name and challenge that expectation."'],
      ['"It\'s their religion that makes them breed so much."','"Some interpretations of duty treat childbearing as compulsory. People of every faith are questioning that, and so can we."'],
      ['"Those backward families don\'t respect a woman\'s choice."','"When a family overrides a woman\'s reproductive choice, that\'s the behaviour to challenge — clearly, and by name."']];
    box.innerHTML=BA.map(function(b){ return '<div class="ba"><div class="col before"><span class="lbl">Targets a group ✗</span>'+esc(b[0])+'</div><div class="col after"><span class="lbl">Targets the behaviour ✓</span>'+esc(b[1])+'</div></div>'; }).join(''); })();

  renderSamples(); scan();

  (function(){
    var Q=[{a:0},{a:0}], E=['Critique should aim at the behaviour and the system — never a caste, community, or faith.','Pronatal pressure spans nearly every culture, so blaming one group is unfair and inaccurate.'];
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
} catch(e){ console.error('project 044 script error', e); }
});
