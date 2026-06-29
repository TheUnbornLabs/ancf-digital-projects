/* Project 017 · Pressure-from-Parents Response Generator — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }

  /* 2 · generator */
  var ACK=['I know this comes from love','I know you only want me to be happy','I can hear how much you care about this','I know you worry about my future'];
  var CORE={
    when:['children aren\'t part of my plans','I\'m not going to be having kids'],
    regret:['I\'ve thought about it carefully and I\'m at peace with my choice','I really do know my own mind on this'],
    alone:['I\'m planning thoughtfully for my future, and I\'ll be okay','I\'m building the support I\'ll need — a child was never a guarantee of that anyway'],
    selfish:['choosing the life that genuinely fits me isn\'t selfish to anyone','there\'s no one being harmed by my choice'],
    normal:['this is simply the path that\'s right for me','my life doesn\'t have to follow the same script'],
    generic:['my decision is made, and it\'s settled']
  };
  var CLOSE_WARM=['I\'d love for us to enjoy our time together and talk about other things.','I hope, in time, you can be happy for me.','Thank you for caring — it means a lot, even when we see this differently.'];
  var CLOSE_MID=['I\'d really appreciate it if we could let this rest.','I\'m not looking to debate it, but I\'m always glad to talk about other things.','I hope you can respect that, even if it\'s not what you\'d have chosen.'];
  var CLOSE_FIRM=['I need you to respect my decision and stop raising it.','This is settled, and I won\'t be discussing it again.','Please take this as my final word on it.'];

  var sit=$('situation'), goal=$('goal'), dial=$('dial'), gen=$('gen'), an=$('another'), copy=$('copy'), out=$('out');
  var last='';
  function make(){
    var d=+dial.value, core=pick(CORE[sit.value]||CORE.generic);
    // goal nudges firmness
    if(goal.value==='final') d=Math.min(100,d+25); if(goal.value==='soften') d=Math.max(0,d-20);
    var ack=pick(ACK), close = d<=33?pick(CLOSE_WARM): d<=66?pick(CLOSE_MID):pick(CLOSE_FIRM);
    var text;
    if(d<=33) text=ack+', '+core+'. '+close;
    else if(d<=66) text=ack+', and '+core+'. '+close;
    else text=core.charAt(0).toUpperCase()+core.slice(1)+'. '+close;
    if(text===last) return make(); last=text; return text;
  }
  function show(){ out.textContent=make(); }
  if(gen) gen.addEventListener('click',show);
  if(an) an.addEventListener('click',show);
  if(copy) copy.addEventListener('click',function(){ var v=out.textContent; if(v&&v.indexOf('will appear')===-1&&A.copy) A.copy(v,copy); else if(A.copy) A.copy(make(),copy); });

  /* 3 · underlying worry mapper */
  (function(){
    var box=$('worries'); if(!box) return;
    var W=[
      {line:'"You\'ll regret it"',fear:'They\'re afraid you\'ll feel a pain they can\'t protect you from — and that you can\'t see it coming the way they think they can.',ack:'"I know you\'re scared I\'ll be sad one day. I\'ve really thought about that, and I\'m at peace."'},
      {line:'"Who will look after you?"',fear:'Underneath is their own mortality: they won\'t always be here to care for you, and they want to know someone will.',ack:'"I hear that you won\'t always be here to look out for me — and I promise I\'m building a life and people who will."'},
      {line:'"We want grandchildren"',fear:'A real grief for a future they pictured — holidays, a continuing family, a role they longed for.',ack:'"I know this is a loss for you, and I\'m sorry it\'s not the future you hoped for. Your love still matters hugely to me."'},
      {line:'"It\'s selfish"',fear:'Often a fear that you\'ll miss out on the joy they found in you — projected as judgment.',ack:'"I think you\'re worried I\'ll miss something wonderful. I\'ve weighed that honestly, and this is right for me."'},
      {line:'"Everyone does it"',fear:'A fear of you being an outsider, judged or lonely for being different.',ack:'"I know you don\'t want me to feel like the odd one out. I\'m genuinely happy with my path."'}
    ];
    box.innerHTML=W.map(function(w){ return '<details class="worry"><summary>'+esc(w.line)+'<span class="chev" aria-hidden="true">›</span></summary><div class="body"><span class="lbl">The fear underneath</span>'+esc(w.fear)+'<div class="ack"><b>You could say:</b> '+esc(w.ack)+'</div></div></details>'; }).join('');
  })();

  /* 4 · quiz */
  (function(){
    var Q=[{a:1},{a:1},{a:1}], E=['It means honoring their feeling first, then keeping your boundary — both, not either.','It almost always comes from love and worry, not malice.','Naming the fear underneath usually lowers the temperature of the whole exchange.'];
    var picks={}, total=document.querySelectorAll('#quizbox .quiz-q').length;
    if(A.initOptions) A.initOptions($('quizbox'),function(q,i){ picks[q]=+i; });
    var sB=$('quizScore'), rB=$('quizReset'), res=$('quizResult');
    if(sB) sB.addEventListener('click',function(){ if(Object.keys(picks).length<total){ res.style.display='block'; res.textContent='Pick an answer for all '+total+' questions first.'; return; }
      var sc=0; Q.forEach(function(it,i){ document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){ var j=+x.getAttribute('data-i'); x.classList.remove('ok','no'); if(j===it.a)x.classList.add('ok'); else if(j===picks[i])x.classList.add('no'); }); var ex=document.querySelector('.explain[data-q="'+i+'"]'); if(ex){ ex.style.display='block'; ex.textContent=E[i]; } if(picks[i]===it.a)sc++; });
      res.style.display='block'; res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.'; if(rB) rB.style.display='inline-block'; });
    if(rB) rB.addEventListener('click',function(){ picks={}; document.querySelectorAll('#quizbox .opt').forEach(function(x){ x.classList.remove('sel','ok','no'); }); document.querySelectorAll('#quizbox .explain').forEach(function(ex){ ex.style.display='none'; ex.textContent=''; }); res.style.display='none'; rB.style.display='none'; });
  })();

  /* 5 · reflection */
  (function(){
    var ta=$('r1'), status=$('saveStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('saveBtn'),cl=$('clearBtn');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 017 script error', e); }
});
