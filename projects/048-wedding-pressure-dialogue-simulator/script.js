/* Project 048 · Wedding Pressure Dialogue Simulator — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var AUNT='Aunt Meera';
  // each round: aunt line keyed by previous tone; choices [{label,tone}]
  var ROUNDS=[
    { line:function(){ return 'So — you two are married now! When are the little ones coming? You\'re next, you know!'; },
      choices:[
        {tone:'deflect',label:'"Ha! One big day at a time, Auntie. Have you tried the cake?"'},
        {tone:'honest',label:'"Actually, we\'ve decided children aren\'t part of our plans."'},
        {tone:'firm',label:'"That\'s a bit personal for a wedding — but thank you for thinking of us."'}
      ] },
    { line:function(prev){ return ({
        deflect:'Oh, you can\'t distract me that easily! You\'d make such wonderful parents though.',
        honest:'Not having children? But why ever not? You\'ll change your mind, dear — everyone does.',
        firm:'Well! No need to be so touchy. I\'m only taking an interest.'
      })[prev]; },
      choices:[
        {tone:'deflect',label:'"You\'re too kind! Honestly, we\'re just enjoying being us for now."'},
        {tone:'honest',label:'"We\'ve thought about it carefully, and we\'re genuinely at peace with it."'},
        {tone:'firm',label:'"I know you mean well, and it\'s settled for us. Let\'s leave it there."'}
      ] },
    { line:function(prev){ return ({
        deflect:'You young people! Well, don\'t leave it too long, that\'s all I\'ll say.',
        honest:'Hmm. I suppose it\'s your life. I just don\'t want you to be lonely one day.',
        firm:'Alright, alright. I won\'t mention it again. (For today, anyway!)'
      })[prev]; },
      choices:[
        {tone:'deflect',label:'"Noted with love, Auntie! Now — dance floor?"'},
        {tone:'honest',label:'"I appreciate the care. There are many ways to have a full, connected life."'},
        {tone:'firm',label:'"Thank you. I\'d really like to just enjoy the wedding now."'}
      ] }
  ];
  var STYLES=[
    ['Deflect','Light, warm, and topic-changing. Keeps the mood pleasant and avoids a scene — but the question may simply return another day. Great when you don\'t want a deep talk right now.'],
    ['Honest','Open and matter-of-fact about your choice. It won\'t convince everyone, but it plants a calm, dignified seed and models that this is a settled, normal decision.'],
    ['Firm','Names the boundary directly. May feel a touch cool, and that\'s alright — it\'s clearest with people who don\'t take gentler hints. The goal is respect, not victory.']
  ];
  var state={round:0,prev:null,tally:{deflect:0,honest:0,firm:0}};
  function addMsg(who,cls,text){ var c=$('chat'); if(!c) return; var d=document.createElement('div'); d.className='msg '+cls; d.innerHTML='<span class="who">'+esc(who)+'</span>'+esc(text); c.appendChild(d); }
  function renderChoices(){
    var box=$('choices'); if(!box) return;
    if(state.round>=ROUNDS.length){ box.innerHTML=''; finish(); return; }
    var r=ROUNDS[state.round];
    addMsg(AUNT,'them', r.line(state.prev));
    box.innerHTML=r.choices.map(function(c,i){ return '<button type="button" data-i="'+i+'"><span class="tag">'+esc(c.tone)+'</span>'+esc(c.label)+'</button>'; }).join('');
    box.querySelectorAll('button').forEach(function(b){ b.addEventListener('click',function(){ var c=r.choices[+b.getAttribute('data-i')];
      addMsg('You','you', c.label.replace(/^"|"$/g,''));
      state.tally[c.tone]++; state.prev=c.tone; state.round++; box.innerHTML=''; renderChoices(); }); });
  }
  function finish(){
    var t=state.tally, total=t.deflect+t.honest+t.firm;
    var verdict, advice;
    if(t.firm>=2){ verdict='Boundary clearly set.'; advice='She may go a little quiet for a bit — and that\'s okay. She now knows exactly where you stand, which often means fewer repeats.'; }
    else if(t.honest>=2){ verdict='Calm and open.'; advice='You won\'t have convinced her, and you didn\'t need to. You modelled that this is a settled, ordinary choice — a seed that often grows over time.'; }
    else if(t.deflect>=2){ verdict='Peace kept — for today.'; advice='You stayed warm and avoided a scene. The trade-off: the question may well return next time, since nothing was settled out loud.'; }
    else { verdict='A balanced mix.'; advice='Warm where you could be, firm where you needed to be. For many people this blend is the most sustainable: kind, clear, and repeatable.'; }
    var box=$('debriefBox'); if(box){
      function bar(lbl,n){ return '<div class="bar"><span class="lab">'+lbl+'</span><span class="track"><span class="fill" style="width:'+(n/total*100)+'%"></span></span></div>'; }
      box.innerHTML='<div class="debrief"><h4>How it landed: '+esc(verdict)+'</h4><p>'+esc(advice)+'</p><div class="tonebars">'+bar('Deflect',t.deflect)+bar('Honest',t.honest)+bar('Firm',t.firm)+'</div><p class="note">There\'s no single right blend — only what feels true to you. Try again to explore another path.</p></div>';
    }
    var sb=$('simBtns'); if(sb) sb.style.display='flex';
  }
  function start(){ state={round:0,prev:null,tally:{deflect:0,honest:0,firm:0}}; var c=$('chat'); if(c)c.innerHTML=''; var d=$('debriefBox'); if(d)d.innerHTML=''; var sb=$('simBtns'); if(sb)sb.style.display='none'; renderChoices(); }
  var rp=$('replayBtn'); if(rp) rp.addEventListener('click',start);

  (function(){ var box=$('styleCards'); if(!box) return; box.innerHTML=STYLES.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();

  start();

  (function(){
    var Q=[{a:0},{a:0}], E=['Rehearsing helps you feel calmer and more prepared, in your own voice — not memorise one comeback.','A purely deflecting reply keeps the peace now, but the question may return since nothing was settled.'];
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
} catch(e){ console.error('project 048 script error', e); }
});
