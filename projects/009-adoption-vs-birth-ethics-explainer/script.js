/* Project 009 · Adoption vs Birth Ethics — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A = window.ANCF || {};
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  var PATHS=[
    {id:'birth',ico:'🌱',name:'Biological birth',is:'Conceiving and raising a child of your own.',serves:'Your own desire for parenthood and lineage; the new person who will exist.',eth:'Creates a wholly new life with all its goods — and a new, non-consenting bearer of needs and risks (see Projects 007–008).',limit:'Answers a question about desire and creation, not about existing need. Carries the full weight of the consent and risk arguments.'},
    {id:'adoption',ico:'🤲',name:'Adoption',is:'Becoming the permanent legal parent of a child who needs a family.',serves:'A specific child who already exists and needs stable, loving care.',eth:'Directs care to existing need and creates no new need-bearer. A profound good when done well and for the child\'s sake.',limit:'Not a moral debt, not always available, often long/costly, and preceded by real loss. It centers the child — not an adult\'s argument.'},
    {id:'fostering',ico:'🏠',name:'Fostering',is:'Providing temporary or longer-term care for children who can\'t live with their birth family right now.',serves:'Children in acute, present need — sometimes briefly, sometimes for years.',eth:'Meets urgent existing need, often with support, and with less finality than adoption. High impact on suffering reduction.',limit:'Emotionally demanding; impermanence can be hard; aims at the child\'s reunification or stability, not your permanence.'},
    {id:'mentorship',ico:'🧭',name:'Mentorship',is:'Being a steady, caring adult in a child\'s life — as a relative, teacher, coach, Big Sibling, or guardian-figure.',serves:'Children who have homes but need more caring adults; your wish to nurture.',eth:'Adds care to the world with a light footprint and no new need-bearer. Widely undervalued and deeply meaningful.',limit:'Not full parenthood; bounded role and influence. Complements rather than replaces a child\'s primary caregivers.'},
    {id:'supporting',ico:'💛',name:'Supporting children broadly',is:'Channeling time, money, or skills toward children\'s welfare — volunteering, donating, advocacy, fostering systems-change.',serves:'Many children at once, often those in the greatest need worldwide.',eth:'Potentially the largest reduction of suffering per unit of effort; scalable and inclusive of anyone, parent or not.',limit:'Less personal and relational; can feel abstract. Best paired with, not a substitute for, direct human connection.'}
  ];
  /* path value profiles 0..3 across the 6 priority dimensions */
  var PROFILE={
    birth:      {existing:0,genetic:3,raise:3,cost:1,flex:0,reduce:0},
    adoption:   {existing:3,genetic:0,raise:2,cost:1,flex:0,reduce:2},
    fostering:  {existing:3,genetic:0,raise:2,cost:2,flex:1,reduce:3},
    mentorship: {existing:2,genetic:0,raise:1,cost:3,flex:3,reduce:2},
    supporting: {existing:2,genetic:0,raise:0,cost:3,flex:3,reduce:3}
  };

  /* 2 · path cards */
  (function(){
    var box=$('pathCards'); if(!box) return;
    box.innerHTML=PATHS.map(function(p){
      return '<details class="pathc"><summary><span class="ico" aria-hidden="true">'+p.ico+'</span>'+esc(p.name)+'<span class="chev" aria-hidden="true">›</span></summary>'+
        '<div class="body"><span class="lbl">What it is</span>'+esc(p.is)+
        '<span class="lbl">Who it serves</span>'+esc(p.serves)+
        '<span class="lbl">Ethical considerations</span>'+esc(p.eth)+
        '<div class="limit"><b>Honest limit:</b> '+esc(p.limit)+'</div></div></details>';
    }).join('');
  })();

  /* 5 · priorities mapper */
  (function(){
    var inputs=[].slice.call(document.querySelectorAll('#priRows input[type=range]'));
    if(!inputs.length) return;
    var bars=$('rankBars'), note=$('priNote');
    function update(){
      var w={}; inputs.forEach(function(i){ var o=$('o-'+i.id); if(o)o.textContent=i.value+'%'; w[i.getAttribute('data-k')]=+i.value; });
      var scores=PATHS.map(function(p){
        var prof=PROFILE[p.id], s=0, max=0;
        Object.keys(w).forEach(function(k){ s+=w[k]*(prof[k]||0); max+=w[k]*3; });
        return {id:p.id, name:p.name, pct: max>0?Math.round(s/max*100):0};
      }).sort(function(a,b){ return b.pct-a.pct; });
      bars.innerHTML=scores.map(function(s){ return '<div class="rankbar"><span class="nm">'+esc(s.name)+'</span><span class="track"><span class="fill" style="width:'+s.pct+'%"></span></span><span class="pct">'+s.pct+'%</span></div>'; }).join('');
      var allZero=Object.keys(w).every(function(k){ return w[k]===0; });
      if(allZero){ note.innerHTML='Move the sliders to reflect what matters to you, and the paths will re-rank to mirror your priorities.'; }
      else { note.innerHTML='Your priorities point most toward <b>'+esc(scores[0].name)+'</b>'+(scores[1].pct>=scores[0].pct-8?(', with <b>'+esc(scores[1].name)+'</b> close behind'):'')+'. Remember: this only reflects the weights you set — it can\'t weigh them <em>for</em> you, and a lower-ranked path may still be exactly right for your life. The number is a mirror, never a verdict.'; }
      var store={}; inputs.forEach(function(i){ store[i.id]=i.value; }); if(A.setJSON) A.setJSON('priorities',store);
    }
    var s=A.getJSON?A.getJSON('priorities',null):null;
    inputs.forEach(function(i){ if(s&&s[i.id]!=null) i.value=s[i.id]; i.addEventListener('input',update); });
    update();
  })();

  /* 6 · quiz */
  (function(){
    var Q=[{a:1,e:'The central contrast is between meeting a need that already exists and creating a new need-bearer.'},
      {a:1,e:'"Just adopt" centers an adult\'s argument or longing, when adoption exists to serve a child who needs a family.'},
      {a:1,e:'Adoption helps real children, but it doesn\'t by itself answer the philosophical question of whether creating new people is right.'},
      {a:1,e:'The mapper reflects the weights you set — it\'s a mirror, not a verdict.'},
      {a:1,e:'The five paths are presented as different, valid ways to care, suited to different people — not ranked.'}];
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
    if(c) c.addEventListener('click',function(){ var L=['Adoption vs birth — my reflection','']; var pr=A.getJSON?A.getJSON('priorities',null):null; if(pr){ L.push('My priority weights:'); document.querySelectorAll('#priRows input').forEach(function(i){ L.push('  - '+i.getAttribute('data-k')+': '+i.value+'%'); }); } var p=['Path that surprised me:','Assumption this changed:']; fields.forEach(function(id,i){ var ta=$(id); L.push(p[i]); L.push('  '+((ta&&ta.value.trim())?ta.value.trim():'(blank)')); L.push(''); }); if(A.copy) A.copy(L.join('\n'),c); });
  })();

} catch(e){ console.error('project 009 script error', e); }
});
