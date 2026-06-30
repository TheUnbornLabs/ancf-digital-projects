/* Project 035 · When Are You Having Kids Reply Tool — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  var V={
    gracious:['"We\'re happy as we are, thank you for asking."','"That\'s not in our plans — but I appreciate you caring."','"No little ones for us, and we\'re content. How are you?"','"We\'ve decided this is our path, and we\'re at peace with it."'],
    breezy:['"Oh, we\'re sticking with plants and naps for now!"','"Never! More cake for us."','"We\'re raising a very demanding houseplant, thanks."','"Ask me again never. 😊"'],
    honest:['"Actually, we\'ve chosen not to have children."','"It\'s a deliberate choice for us, not a wait."','"We\'re childfree by choice, and happy with it."','"This is the life we want — kids aren\'t part of it."'],
    firm:['"That\'s a private matter, but thanks for asking."','"I\'d rather not discuss my reproductive plans."','"That\'s not something I talk about. How about you?"','"I\'m going to leave that one unanswered, kindly."'],
    deflect:['"Why do you ask? Anyway — how\'s your family doing?"','"Big question! Speaking of news, did you hear about…"','"Ha, the classic! Tell me what you\'ve been up to."','"Let\'s save that one. What\'s new with you?"']
  };
  // a couple tuned to who's asking, appended to the pool
  var WHO={
    family:{gracious:['"I know you\'d love grandchildren, and I understand. It\'s not in our plans."'],honest:['"I want to be honest with you: we\'ve chosen not to. I hope you can respect that."'],firm:['"I love you, and I\'m asking you to let this one rest."']},
    stranger:{breezy:['"Bold question from someone I just met! We\'re good, thanks."'],firm:['"That\'s a rather personal one for now — but nice to meet you!"']}
  };
  var current='';
  function poolFor(){ var v=$('vVibe').value, who=$('vWho').value, pool=V[v].slice(); if(who!=='anyone'&&WHO[who]&&WHO[who][v]) pool=pool.concat(WHO[who][v]); return pool; }
  function gen(){ var pool=poolFor(), r=pick(pool); if(r===current&&pool.length>1) r=pick(pool); current=r; $('out').textContent=r; }
  $('genBtn').addEventListener('click',gen); $('anotherBtn').addEventListener('click',gen);
  $('copyBtn').addEventListener('click',function(){ if(current&&A.copy) A.copy(current,$('copyBtn')); });

  /* kit (max 3) */
  var kit=(A.getJSON?A.getJSON('kit',[]):[])||[];
  function renderKit(){ var box=$('kitBox'); if(!box) return;
    if(!kit.length){ box.innerHTML='<p class="empty">No go-to lines yet. Generate a reply you like and tap ★ Add to my three.</p>'; return; }
    box.innerHTML='<ol>'+kit.map(function(t,i){ return '<li>'+esc(t)+' <button type="button" data-i="'+i+'" aria-label="Remove" style="border:none;background:none;cursor:pointer;color:var(--muted)">×</button></li>'; }).join('')+'</ol>';
    box.querySelectorAll('button').forEach(function(b){ b.addEventListener('click',function(){ kit.splice(+b.getAttribute('data-i'),1); if(A.setJSON)A.setJSON('kit',kit); renderKit(); }); }); }
  $('addBtn').addEventListener('click',function(){ if(!current) return; if(kit.indexOf(current)>=0) return; if(kit.length>=3){ var box=$('kitBox'); if(box) box.insertAdjacentHTML('beforeend','<p class="empty" id="kitFull">You already have three — remove one to add another.</p>'); return; } kit.push(current); if(A.setJSON)A.setJSON('kit',kit); renderKit(); });
  $('copyKit').addEventListener('click',function(){ if(kit.length&&A.copy) A.copy(kit.join('\n'),$('copyKit')); });
  $('clearKit').addEventListener('click',function(){ if(kit.length&&!window.confirm('Clear your three go-to lines?'))return; kit=[]; if(A.setJSON)A.setJSON('kit',kit); renderKit(); });
  renderKit(); gen();

  (function(){
    var Q=[{a:0},{a:0}], E=['A good reply is a polite boundary, not an insult.','A few ready lines mean you aren\'t caught flat-footed — you can adapt the words.'];
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
} catch(e){ console.error('project 035 script error', e); }
});
