/* Project 036 · WhatsApp Group Rules Generator — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var FOCUS={support:'Support & Community',childfree:'Childfree Social',local:'Local Meetups',discussion:'Discussion Group'};
  var FOCUSRULE={
    support:'Lead with kindness — this is a support space first. No unsolicited advice; ask before offering it.',
    childfree:'Respect every path: childfree, childless, and parents are all welcome here. No judging anyone\'s choices.',
    local:'Keep meetup details (addresses, plans) inside the group. Confirm attendance so hosts can plan.',
    discussion:'Debate ideas, never people. A strong disagreement is fine; contempt is not.'
  };
  // toggle rules: id -> {label, gentle, strict}
  var RULES=[
    {id:'intros',label:'Introductions welcome',gentle:'New here? Say a quick hello when you join — no pressure.',strict:'New members must post a short intro within 48 hours.'},
    {id:'spam',label:'No spam or promotions',gentle:'Please keep ads, links, and promotions to a minimum.',strict:'No promotions, ads, affiliate links, or selling. Removal on sight.'},
    {id:'advice',label:'No medical / legal advice',gentle:'Share experiences, but please don\'t give medical or legal advice — point to professionals.',strict:'No medical, legal, or financial advice. Direct members to qualified professionals.'},
    {id:'cw',label:'Content warnings',gentle:'Add a brief heads-up before heavy or sensitive topics.',strict:'Sensitive content (loss, trauma, graphic material) requires a clear CW label.'},
    {id:'privacy',label:'Privacy & screenshots',gentle:'What\'s shared here stays here — please don\'t screenshot or forward.',strict:'No screenshots, forwarding, or sharing members\' messages outside the group.'},
    {id:'offtopic',label:'Stay roughly on-topic',gentle:'Off-topic chat is fine in moderation; keep the main thread on track.',strict:'Keep posts on-topic. Off-topic chatter goes in the designated thread only.'},
    {id:'language',label:'Keep language respectful',gentle:'Mind your language — no slurs or personal attacks.',strict:'Zero tolerance for slurs, harassment, or personal attacks. Immediate action.'},
    {id:'conflict',label:'Conflict resolution',gentle:'Disagreements happen — take heated ones to DMs or tag an admin.',strict:'Disputes are settled by admins. Repeated conflict leads to removal.'}
  ];
  var DEFAULT_ON={support:['advice','privacy','language'],childfree:['intros','language','offtopic'],local:['intros','privacy','language'],discussion:['language','conflict','offtopic']};

  function renderToggles(){ var box=$('toggles'); if(!box) return; var on=DEFAULT_ON[$('gFocus').value]||[];
    box.innerHTML=RULES.map(function(r){ var checked=on.indexOf(r.id)>=0; return '<label data-i="'+r.id+'" class="'+(checked?'on':'')+'"><input type="checkbox" '+(checked?'checked':'')+'><span>'+esc(r.label)+'</span></label>'; }).join('');
    box.querySelectorAll('input').forEach(function(c){ c.addEventListener('change',function(){ c.closest('label').classList.toggle('on',c.checked); build(); }); }); }
  function selected(){ var out=[]; $('toggles').querySelectorAll('label').forEach(function(l){ if(l.querySelector('input').checked) out.push(l.getAttribute('data-i')); }); return out; }
  function build(){
    var focus=$('gFocus').value, strict=$('gStrict').value, sel=selected();
    var title='📌 '+FOCUS[focus]+' — Group Rules';
    var lines=[title,'','Welcome! A few simple rules keep this group warm and useful for everyone.',''];
    var n=1;
    lines.push(n++ +'. Be kind and assume good faith. We\'re all here in good will.');
    lines.push(n++ +'. '+FOCUSRULE[focus]);
    RULES.forEach(function(r){ if(sel.indexOf(r.id)<0) return; var txt=(strict==='strict')?r.strict:(strict==='gentle'?r.gentle:r.gentle); if(strict==='balanced'){ txt=r.gentle; } if(strict==='strict') txt=r.strict; lines.push(n++ +'. '+txt); });
    var foot=(strict==='strict')?'Breaking these rules may mean removal. Admins\' decisions are final.':(strict==='gentle'?'Thanks for helping keep this a good place to be. 💛':'Repeated issues may lead to a warning, then removal. Questions? Tag an admin.');
    lines.push(''); lines.push(foot);
    $('out').textContent=lines.join('\n');
  }
  $('gFocus').addEventListener('change',function(){ renderToggles(); build(); });
  $('gStrict').addEventListener('change',build);
  $('genBtn').addEventListener('click',build);
  $('copyBtn').addEventListener('click',function(){ if(A.copy) A.copy($('out').textContent,$('copyBtn')); });
  $('allBtn').addEventListener('click',function(){ $('toggles').querySelectorAll('input').forEach(function(c){ c.checked=true; c.closest('label').classList.add('on'); }); build(); });
  $('noneBtn').addEventListener('click',function(){ $('toggles').querySelectorAll('input').forEach(function(c){ c.checked=false; c.closest('label').classList.remove('on'); }); build(); });
  renderToggles(); build();

  (function(){
    var Q=[{a:0},{a:0}], E=['Pinned rules set shared expectations so moderation feels fair and predictable.','A "no medical or legal advice" rule protects members from acting on unqualified guidance.'];
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
} catch(e){ console.error('project 036 script error', e); }
});
