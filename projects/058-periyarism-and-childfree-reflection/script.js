/* Project 058 · Periyarism & Childfree Reflection — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  $('bio').innerHTML='<h4>Periyar E. V. Ramasamy (1879–1973)</h4><p>A social reformer and rationalist from Tamil Nadu, often called "Thanthai Periyar". He founded the <strong>Self-Respect Movement</strong> (<em>Suya Mariyathai Iyakkam</em>) around 1925 and later the Dravidar Kazhagam (1944), campaigning against caste hierarchy, religious superstition, and the subordination of women.</p><div class="kv"><b>Era</b><span>Twentieth-century Tamil Nadu, South India</span><b>Movement</b><span>Self-Respect Movement; rationalist and anti-caste reform</span><b>On women</b><span>Championed education, the right to divorce and remarry, property rights, birth control, and freedom from compulsory marriage and motherhood</span><b>Method</b><span>"Self-respect marriages" without priests; relentless questioning of custom by reason</span></div><p class="note" style="margin-top:8px">Note: Periyar was a reformer for reason and dignity, not an antinatalist. These notes draw on his ideas about autonomy, not a position on procreation he did not hold.</p>';

  var NOTES=[
    {h:'Rationalism — question every custom',d:'Periyar urged people to accept nothing merely because it was traditional, sacred, or long-standing. A practice had to justify itself by reason and human benefit.',bear:'Applied here: "everyone has children" is a custom, not an argument. Periyar\'s method invites you to ask what reasons, if any, actually support a default — and to weigh them for yourself.'},
    {h:'Self-respect — dignity over deference',d:'The movement\'s core was <em>suya mariyathai</em>: each person\'s inherent dignity, owed to no authority and requiring no one\'s permission.',bear:'A childfree choice made from self-respect needs no external validation. Dignity, in this view, includes the right to define your own life rather than perform an expected one.'},
    {h:'Women\'s autonomy & bodily freedom',d:'Periyar argued forcefully that women were not born to serve, marry, or bear children on command. He supported contraception, women\'s education, and their right to refuse imposed roles.',bear:'This is the closest link to childfree reflection: the insistence that a woman\'s body and life are her own, and that motherhood must be a free choice, never a duty assigned at birth.'},
    {h:'Critique of compulsory marriage',d:'He challenged the idea that marriage and child-rearing were obligatory milestones, and the double standards (especially around "chastity") imposed on women but not men.',bear:'It reframes "when will you marry and have kids?" as a compulsion to be questioned, not a timeline to be met — and exposes who is really being asked to comply.'},
    {h:'Reason as liberation',d:'For Periyar, clear thinking wasn\'t cold — it was the tool that freed people from fear, superstition, and inherited hierarchy.',bear:'Examining the pressure around children by reason isn\'t heartless; in this tradition, it\'s exactly how one reclaims a choice that was being made on your behalf.'}
  ];
  (function(){ var box=$('noteCards'); if(!box) return; box.innerHTML=NOTES.map(function(n){ return '<div class="note-card"><h4>'+esc(n.h)+'</h4><p>'+esc(n.d)+'</p><div class="bear"><b>Bearing on childfree reflection:</b> '+esc(n.bear)+'</div></div>'; }).join(''); })();

  var PROMPTS=[
    'Rationalism: Name one expectation about your life you\'ve never actually questioned. What reasons, if examined, hold it up?',
    'Self-respect: Whose permission have you been waiting for — and what changes if you decide you never needed it?',
    'Women\'s autonomy: Where have you treated a role as a duty rather than a choice? What would reclaiming it as a choice feel like?',
    'Compulsory marriage: When you\'re asked "when?", who benefits from your saying yes — and is that reason enough?',
    'Reason as liberation: What fear has been doing the deciding for you, and what would reason decide instead?'
  ];
  (function(){ var box=$('resonateBox'); if(!box) return; box.innerHTML=NOTES.map(function(n,i){ return '<button type="button" data-i="'+i+'">'+esc(n.h)+'</button>'; }).join('');
    box.querySelectorAll('button').forEach(function(b){ b.addEventListener('click',function(){ box.querySelectorAll('button').forEach(function(x){ x.classList.toggle('sel',x===b); }); var i=+b.getAttribute('data-i'); var p=$('rprompt'); if(p){ p.textContent='Reflection prompt — '+PROMPTS[i]; p.classList.add('show'); } }); }); })();

  (function(){
    var Q=[{a:0},{a:0}], E=['The Self-Respect Movement promoted rationalism, dignity, anti-caste justice, and women\'s autonomy.','The link is Periyar\'s insistence that people shouldn\'t be bound by imposed roles they didn\'t choose.'];
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
} catch(e){ console.error('project 058 script error', e); }
});
