/* Project 083 · Healthcare Conversation Checklist — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var PHASES=[
    {t:'Before the appointment',items:['Clarify, in one sentence, what you want from this visit','Note any relevant history and current medications','Write your top 2–3 questions and bring them','Decide if you\'d like to bring someone for support','Plan how you\'ll respond if you feel rushed or unheard']},
    {t:'During the appointment',items:['State your goal or decision clearly and calmly','Ask about options, benefits, and risks','Ask for anything you don\'t understand to be explained again','Take notes (or ask to record, with permission)','If a request is declined, ask for the reason and the policy']},
    {t:'After the appointment',items:['Write down what was said and any next steps','Note anything you want to follow up or clarify','Book any follow-ups or referrals discussed','Consider a second opinion if something felt off','Be kind to yourself — these conversations can be a lot']}
  ];
  var done=(A.getJSON?A.getJSON('done',{}):{})||{}; var total=0; PHASES.forEach(function(p){ total+=p.items.length; });
  function render(){ var box=$('phases'); if(!box) return;
    box.innerHTML=PHASES.map(function(p,pi){ var dc=0; p.items.forEach(function(_,ii){ if(done[pi+'-'+ii]) dc++; });
      return '<div class="phase"><div class="ph">'+esc(p.t)+'<span class="pp">'+dc+'/'+p.items.length+'</span></div><div class="items">'+p.items.map(function(it,ii){ var k=pi+'-'+ii; return '<label data-k="'+k+'" class="'+(done[k]?'done':'')+'"><input type="checkbox" '+(done[k]?'checked':'')+'><span>'+esc(it)+'</span></label>'; }).join('')+'</div></div>'; }).join('');
    box.querySelectorAll('input').forEach(function(c){ c.addEventListener('change',function(){ var k=c.closest('label').getAttribute('data-k'); if(c.checked)done[k]=1; else delete done[k]; if(A.setJSON)A.setJSON('done',done); render(); upd(); }); }); }
  function upd(){ var dn=Object.keys(done).length, pct=Math.round(dn/total*100); if(A.meter)A.meter($('meter'),pct); var m=$('prepMsg'); if(m) m.textContent=dn+' of '+total+' prepared ('+pct+'%)'+(dn===total?' — you\'re ready. 🌿':''); }
  var QBANK=['What are all my options here, including doing nothing?','What are the benefits and risks of each?','How permanent or reversible is this?','What does recovery or follow-up involve?','Is this decision mine to make, and is my informed choice respected?','If you can\'t help with this, who can, and can I have a referral?','Can I have the key information in writing?','What happens if I wait, or change my mind later?'];
  var picked=[];
  function renderBank(){ var box=$('qbank'); if(!box) return; box.innerHTML=QBANK.map(function(q,i){ return '<div class="qopt'+(picked.indexOf(i)>=0?' on':'')+'" data-i="'+i+'" role="button" tabindex="0">'+esc(q)+'</div>'; }).join('');
    box.querySelectorAll('.qopt').forEach(function(el){ el.addEventListener('click',function(){ var i=+el.getAttribute('data-i'); var p=picked.indexOf(i); if(p>=0)picked.splice(p,1); else picked.push(i); renderBank(); renderMy(); }); }); }
  function renderMy(){ var box=$('mylist'); if(!box) return; if(!picked.length){ box.textContent='Your selected questions will appear here.'; return; } box.textContent='MY QUESTIONS:\n'+picked.map(function(i,n){ return (n+1)+'. '+QBANK[i]; }).join('\n'); }
  $('copyBtn').addEventListener('click',function(){ if(picked.length&&A.copy) A.copy($('mylist').textContent,$('copyBtn')); });
  (function(){ var box=$('dismissCards'); if(!box) return;
    var D=[['Ask for the reason','"Can you help me understand the reason? I\'d like it noted in my records." Calm, specific, and on the record.'],['Restate your request','"I hear you. I\'m asking you to record that I requested this and that we discussed it." Repetition without escalation.'],['Keep your options open','"Thank you. I\'d like to think about it and may seek a second opinion." You\'re always allowed to.']];
    box.innerHTML=D.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  render(); upd(); renderBank(); renderMy();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 083 script error', e); }
});
