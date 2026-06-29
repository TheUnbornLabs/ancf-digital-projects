/* Project 016 · Personal Peace Checklist — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  /* 2 · phased plan */
  var PLAN=[
    {k:'before',label:'🕯️ Before',ico:'',items:['Decide my limit on how long I\'ll stay','Pick one or two exit-lines (section ③)','Tell an ally I might need a break','Plan my graceful exit in advance','Remind myself: I don\'t owe anyone a justification','Eat and rest beforehand so I\'m not running on empty']},
    {k:'during',label:'🌿 During',items:['Breathe before I respond (section ④)','Use a calm line and change the subject','Step outside or to the bathroom for a reset','Find my ally if I need to','Keep my answers short — no debating','Leave when I said I would, guilt-free']},
    {k:'after',label:'🛁 After',items:['Do my decompression activity','Text my ally or a friend','Note what worked for next time','Be kind to myself about anything that didn\'t','Let go of comments that weren\'t really about me']}
  ];
  (function(){
    var box=$('phases'); if(!box) return;
    var saved=A.getJSON?A.getJSON('peace',{}):{}; saved=saved||{};
    box.innerHTML=PLAN.map(function(p){ return '<div class="phase" data-k="'+p.k+'"><h4>'+esc(p.label)+'<span class="pct" id="pct-'+p.k+'">0%</span></h4>'+p.items.map(function(it,i){ var id=p.k+'-'+i; return '<div class="check"><input type="checkbox" id="'+id+'" data-k="'+p.k+'"'+(saved[id]?' checked':'')+'><label for="'+id+'">'+esc(it)+'</label></div>'; }).join('')+'</div>'; }).join('');
    function pct(k){ var ph=PLAN.filter(function(x){return x.k===k;})[0]; var boxes=document.querySelectorAll('input[data-k="'+k+'"]'); var n=0; boxes.forEach(function(b){ if(b.checked)n++; }); var el=$('pct-'+k); if(el) el.textContent=Math.round(n/ph.items.length*100)+'%'; }
    box.querySelectorAll('input[type=checkbox]').forEach(function(b){ b.addEventListener('change',function(){ saved[b.id]=b.checked; if(A.setJSON) A.setJSON('peace',saved); pct(b.getAttribute('data-k')); }); });
    PLAN.forEach(function(p){ pct(p.k); });
  })();

  /* 3 · exit lines */
  (function(){
    var LINES={
      deflect:['"Ha, the classic question! Anyway — how have you been?"','"You know me, full of surprises. Tell me your news!"','"We\'re keeping our plans to ourselves for now."'],
      redirect:['"Let\'s not do this one today — I\'d love to hear about your trip."','"That\'s a me-question; what\'s new with you?"','"I\'d rather catch up on the good stuff. How\'s the garden?"'],
      boundary:['"It\'s not something I\'m discussing, but thanks for caring."','"My answer\'s the same as last time, and I\'d like to leave it there."','"Please don\'t — it\'s a closed topic for me."'],
      escape:['"Excuse me, I promised to help in the kitchen."','"I\'m going to grab some air — back in a bit."','"I\'ve got an early start, so I\'ll head off soon."']
    };
    var CATS=[['deflect','Deflect lightly'],['redirect','Redirect'],['boundary','Set a boundary'],['escape','Make an exit']];
    var cats=$('exitCats'), list=$('exitList'); if(!cats) return;
    var active='deflect';
    cats.innerHTML=CATS.map(function(c){ return '<span class="exit-cat'+(c[0]===active?' active':'')+'" data-k="'+c[0]+'" role="button" tabindex="0">'+c[1]+'</span>'; }).join('');
    function render(){ list.innerHTML=(LINES[active]||[]).map(function(t){ return '<div class="exit-line"><span class="t">'+esc(t)+'</span><button type="button" class="cpy">Copy</button></div>'; }).join('');
      list.querySelectorAll('.cpy').forEach(function(b){ b.addEventListener('click',function(){ if(A.copy) A.copy(b.parentNode.querySelector('.t').textContent,b); }); }); }
    cats.querySelectorAll('.exit-cat').forEach(function(c){ function sel(){ active=c.getAttribute('data-k'); cats.querySelectorAll('.exit-cat').forEach(function(x){x.classList.remove('active');}); c.classList.add('active'); render(); } c.addEventListener('click',sel); c.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();sel();} }); });
    render();
  })();

  /* 4 · box breathing */
  (function(){
    var circle=$('breathCircle'), lab=$('breathLab'), start=$('breathStart'), stop=$('breathStop');
    if(!start) return;
    var phases=[['Breathe in…',true],['Hold…',true],['Breathe out…',false],['Hold…',false]];
    var idx=0, timer=null;
    function step(){ var p=phases[idx%4]; if(lab) lab.textContent=p[0]; if(circle) circle.classList.toggle('big',p[1]); idx++; }
    start.addEventListener('click',function(){ if(timer) clearInterval(timer); idx=0; step(); timer=setInterval(step,4000); start.textContent='Restart'; });
    stop.addEventListener('click',function(){ if(timer){ clearInterval(timer); timer=null; } if(lab) lab.textContent='Whenever you\'re ready.'; if(circle) circle.classList.remove('big'); start.textContent='Start'; });
  })();

  /* 5 · anchor fields */
  (function(){
    var fields=['aAlly','aExit','aReward'], status=$('saveStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    fields.forEach(function(id){ var ta=$(id); if(!ta||!A.get)return; ta.value=A.get(id,''); ta.addEventListener('input',function(){ A.set(id,ta.value); }); });
    var s=$('saveBtn'),cp=$('copyBtn');
    if(s) s.addEventListener('click',function(){ fields.forEach(function(id){ var ta=$(id); if(ta&&A.set)A.set(id,ta.value); }); flash('Saved ✓'); });
    if(cp) cp.addEventListener('click',function(){ var L=['My peace plan','']; var saved=A.getJSON?A.getJSON('peace',{}):{}; saved=saved||{};
      PLAN.forEach(function(p){ L.push(p.label+':'); p.items.forEach(function(it,i){ if(saved[p.k+'-'+i]) L.push('  ✓ '+it); }); });
      L.push('','Ally: '+(($('aAlly')&&$('aAlly').value.trim())||'—'),'Exit plan: '+(($('aExit')&&$('aExit').value.trim())||'—'),'Reward: '+(($('aReward')&&$('aReward').value.trim())||'—'));
      if(A.copy) A.copy(L.join('\n'),cp); });
  })();

  /* 6 · quiz */
  (function(){
    var Q=[{a:1},{a:0},{a:1}], E=['It\'s deciding in advance how you\'ll care for yourself — not avoidance.','A slow breath buys a pause so you can choose your response instead of reacting.','A good exit-line is short, calm, and ready before you need it.'];
    var picks={}, total=document.querySelectorAll('#quizbox .quiz-q').length;
    if(A.initOptions) A.initOptions($('quizbox'),function(q,i){ picks[q]=+i; });
    var sB=$('quizScore'), rB=$('quizReset'), res=$('quizResult');
    if(sB) sB.addEventListener('click',function(){ if(Object.keys(picks).length<total){ res.style.display='block'; res.textContent='Pick an answer for all '+total+' questions first.'; return; }
      var sc=0; Q.forEach(function(it,i){ document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){ var j=+x.getAttribute('data-i'); x.classList.remove('ok','no'); if(j===it.a)x.classList.add('ok'); else if(j===picks[i])x.classList.add('no'); }); var ex=document.querySelector('.explain[data-q="'+i+'"]'); if(ex){ ex.style.display='block'; ex.textContent=E[i]; } if(picks[i]===it.a)sc++; });
      res.style.display='block'; res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.'; if(rB) rB.style.display='inline-block'; });
    if(rB) rB.addEventListener('click',function(){ picks={}; document.querySelectorAll('#quizbox .opt').forEach(function(x){ x.classList.remove('sel','ok','no'); }); document.querySelectorAll('#quizbox .explain').forEach(function(ex){ ex.style.display='none'; ex.textContent=''; }); res.style.display='none'; rB.style.display='none'; });
  })();

  /* 7 · reflection */
  (function(){
    var ta=$('r1'), status=$('rStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 016 script error', e); }
});
