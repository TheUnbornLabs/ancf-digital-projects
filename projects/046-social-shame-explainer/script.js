/* Project 046 · Social Shame Explainer — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  (function(){ var box=$('howCards'); if(!box) return;
    var H=[['Targets the whole self','Shame doesn\'t say "that choice was wrong" — it whispers "you are wrong." By attacking identity rather than action, it leaves no clear thing to fix, only a person to hide.'],
      ['Enforces the norm','Societies use shame to mark who\'s "in" and who\'s "out." Around reproduction, it casts the childfree as selfish, incomplete, or unnatural — a warning to everyone watching.'],
      ['Works in the dark','Shame thrives on secrecy and silence. The less it\'s spoken about, the more total it feels — which is exactly why naming it out loud weakens it.'],
      ['Becomes internalized','Repeated often enough, the outside voice moves inside. Eventually no one needs to shame you; you do it to yourself, automatically.']];
    box.innerHTML=H.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();

  var ITEMS=[
    {s:'"I am a failure as a woman for not wanting children."',a:'shame',why:'Global judgement of your whole self — classic shame. There\'s no action to repair, only an identity under attack.'},
    {s:'"I snapped at my mum; I should apologise and explain calmly."',a:'guilt',why:'About a specific action, and it points toward repair. That\'s healthy guilt doing its proper job.'},
    {s:'"There\'s something fundamentally broken in me."',a:'shame',why:'"I am broken" targets your worth, not a behaviour. Shame, not guilt.'},
    {s:'"I broke a promise to call; I\'ll make it right."',a:'guilt',why:'Specific, repairable, action-focused — healthy guilt.'},
    {s:'"Everyone can see how defective I am."',a:'shame',why:'Imagined exposure of a flawed self is a hallmark of shame.'},
    {s:'"I value honesty, so I want to be upfront about my decision."',a:'guilt',why:'Values-driven and constructive — closer to healthy conscience than shame.'}
  ];
  var done=0;
  (function(){ var box=$('sorterBox'); if(!box) return;
    box.innerHTML=ITEMS.map(function(it,i){ return '<div class="sitem" data-i="'+i+'"><div class="stmt">'+esc(it.s)+'</div><div class="opts2"><button type="button" data-v="shame">Shame</button><button type="button" data-v="guilt">Healthy guilt</button></div><div class="exp"></div></div>'; }).join('');
    box.querySelectorAll('.sitem').forEach(function(el){ var i=+el.getAttribute('data-i'), it=ITEMS[i];
      el.querySelectorAll('button').forEach(function(b){ b.addEventListener('click',function(){ if(el.classList.contains('done')) return;
        var v=b.getAttribute('data-v'), correct=v===it.a;
        el.querySelectorAll('button').forEach(function(x){ if(x.getAttribute('data-v')===it.a) x.classList.add('ok'); else if(x===b) x.classList.add('no'); });
        el.querySelector('.exp').innerHTML=(correct?'<b>Yes — </b>':'<b>Actually, this is '+(it.a==='shame'?'shame':'healthy guilt')+'. </b>')+esc(it.why);
        el.classList.add('done'); done++; var sc=$('sorterScore'); if(sc) sc.textContent=done+' of '+ITEMS.length+' classified.'; }); }); }); })();

  (function(){ var box=$('decodeCards'); if(!box) return;
    var D=[['"You\'re selfish."','This recasts a private choice as a moral defect. The reframe: choosing the life that honestly fits you deprives no one — and isn\'t a character flaw.'],
      ['"There must be something wrong with you."','It locates a "problem" in your very being. The reframe: wanting a different life than the default is variation, not malfunction.'],
      ['"What will people say?"','It outsources your worth to an imagined audience. The reframe: your life isn\'t a performance for spectators, and their comfort isn\'t your responsibility.'],
      ['"You\'ll be a sad, lonely person."','It predicts a shameful future to make the present choice feel dangerous. The reframe: a forecast isn\'t a fact, and connection has many sources beyond children.']];
    box.innerHTML=D.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap for the reframe</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();

  (function(){ var box=$('stepsBox'); if(!box) return;
    var S=[['Name it','Say to yourself, "this is shame." Naming the feeling separates you from it — you are the one noticing it, not the thing itself.'],
      ['Reality-check the story','Ask: "What did I actually do that harmed someone?" If the honest answer is "nothing," then this is a difference of values being dressed up as a defect.'],
      ['Reach toward connection','Shame can\'t survive being spoken to someone who responds with empathy. Tell one safe person; let their warmth contradict the lie.'],
      ['Speak to yourself as a friend','Offer yourself the words you\'d give someone you love in the same spot. Self-compassion is not indulgence — it\'s the direct antidote to shame.']];
    box.innerHTML=S.map(function(p){ return '<div class="st"><b>'+esc(p[0])+'.</b> '+esc(p[1])+'</div>'; }).join(''); })();

  (function(){
    var Q=[{a:0},{a:0}], E=['Shame is about who you are; guilt is about what you did.','Shame loses power when you name it and share it with someone safe — it can\'t survive empathy.'];
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
} catch(e){ console.error('project 046 script error', e); }
});
