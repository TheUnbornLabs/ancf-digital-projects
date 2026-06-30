/* Project 039 · Respectful Debate Guide — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var PRIN=[
    ['Aim at ideas','Disagree with the argument, never the arguer. "That claim has a gap," not "you\'re wrong/foolish." The moment it becomes personal, learning stops.'],
    ['Steelman first','Before you reply, restate their view in its strongest, fairest form — strong enough that they\'d say "yes, exactly." Then respond to that, not a caricature.'],
    ['Stay curious','Ask real questions: "What leads you there?" Curiosity lowers defences and often reveals you were arguing past each other.'],
    ['Hold your uncertainty','Notice the parts you\'re less sure of, and say so. Admitting "I might be wrong about X" makes the other person freer to do the same.'],
    ['Separate person from position','Someone can hold a view you find mistaken and still be decent, smart, and worth your respect. Keep the two apart.'],
    ['Concede the good points','When they\'re right about something, say so plainly. It costs nothing, builds trust, and makes your own points land harder.']
  ];
  (function(){ var box=$('principleCards'); if(!box) return; box.innerHTML=PRIN.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();

  var AUDIT=[
    'I attack the idea, not the person',
    'I can restate the other view fairly before replying',
    'I ask questions instead of assuming what they mean',
    'I admit the parts I\'m unsure about',
    'I stay calm even when I feel provoked',
    'I concede points the other person gets right'
  ];
  var ascore={};
  (function(){ var box=$('auditBox'); if(!box) return;
    box.innerHTML=AUDIT.map(function(t,i){ var scale=[1,2,3,4,5].map(function(n){ return '<button type="button" data-q="'+i+'" data-v="'+n+'">'+n+'</button>'; }).join('');
      return '<div class="row"><p>'+esc(t)+'</p><div class="scale" data-q="'+i+'">'+scale+'</div></div>'; }).join('');
    box.querySelectorAll('.scale button').forEach(function(b){ b.addEventListener('click',function(){ var q=b.getAttribute('data-q'); ascore[q]=+b.getAttribute('data-v');
      box.querySelectorAll('.scale[data-q="'+q+'"] button').forEach(function(x){ x.classList.toggle('sel',x===b); }); }); }); })();
  $('auditBtn').addEventListener('click',function(){ var res=$('auditResult');
    if(Object.keys(ascore).length<AUDIT.length){ res.style.display='block'; res.textContent='Rate all '+AUDIT.length+' statements first.'; return; }
    var sum=0; for(var k in ascore) sum+=ascore[k]; var avg=sum/AUDIT.length;
    var msg; if(avg>=4.3) msg='You\'re a careful, generous debater. Your edge: keep modelling it — others soften when you do.';
    else if(avg>=3.3) msg='Solid habits with room to grow. Pick the one statement you scored lowest and practise just that next time.';
    else if(avg>=2.3) msg='You care about getting it right, and heat sometimes gets the better of you. Steelmanning and asking one real question will move you furthest.';
    else msg='Hard conversations probably feel like battles right now. Start small: before replying, restate their point fairly. That one move changes everything.';
    res.style.display='block'; res.innerHTML='<strong>Your average: '+avg.toFixed(1)+'/5.</strong> '+msg; });
  $('auditReset').addEventListener('click',function(){ ascore={}; $('auditBox').querySelectorAll('.scale button').forEach(function(x){ x.classList.remove('sel'); }); $('auditResult').style.display='none'; });

  var SWAPS=[
    ['"You\'re wrong."','"I see it differently — here\'s why."'],
    ['"That\'s ridiculous."','"That part doesn\'t sit right with me. Can you walk me through it?"'],
    ['"You always say that."','"It sounds like this matters a lot to you."'],
    ['"Everyone knows that\'s false."','"My understanding is different — can we compare sources?"'],
    ['"You just don\'t get it."','"I don\'t think I\'ve explained this well. Let me try again."'],
    ['"So you\'re saying [absurd thing]."','"Am I right that you mean…? I want to be fair to your view."'],
    ['"Calm down."','"Can we slow down for a second? I want to follow you."'],
    ['"That\'s a stupid reason."','"I weigh that differently. Here\'s what matters more to me."']
  ];
  (function(){ var box=$('swapBox'); if(!box) return; box.innerHTML=SWAPS.map(function(s,i){ return '<div class="s" data-i="'+i+'" role="button" tabindex="0"><span class="lbl">Instead of</span><div class="bad">'+esc(s[0])+'</div><span class="lbl">Try</span><div class="good">'+esc(s[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.s').forEach(function(el){ el.addEventListener('click',function(){ if(A.copy) A.copy(SWAPS[+el.getAttribute('data-i')][1],el); }); }); })();

  (function(){
    var Q=[{a:0},{a:0}], E=['Steelmanning means restating an argument in its strongest, fairest form before replying.','The goal is to understand and be understood — not merely to win.'];
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
} catch(e){ console.error('project 039 script error', e); }
});
