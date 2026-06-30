/* Project 060 · Rationalism Toolkit — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var TOOLS=[
    {h:'Steelman first',d:'Before replying, restate the view in its strongest, fairest form — one its holder would endorse. Then engage that, not a caricature.',
      q:function(c){ return ['What is the most charitable, strongest version of "'+c+'"?','Which true thing is this claim probably pointing at?','Could a thoughtful, informed person hold it? Why?']; }},
    {h:'Separate fact, value & definition',d:'Untangle empirical claims (testable), value claims (about what matters), and definitional ones (about word meaning). They need different kinds of evidence.',
      q:function(c){ return ['In "'+c+'", which part is a testable fact?','Which part is a value judgement?','Is any disagreement actually about how a word is defined?']; }},
    {h:'Ask "what would change my mind?"',d:'Name in advance the evidence or argument that would move you. If nothing could, you\'re holding a belief, not a conclusion.',
      q:function(c){ return ['What specific evidence would make me abandon "'+c+'"?','Is that evidence even possible to obtain?','If nothing could change my mind, why do I believe it?']; }},
    {h:'Seek disconfirming evidence',d:'Actively look for the best case against your view, not just support for it. Confirmation comes easily; disconfirmation is where learning lives.',
      q:function(c){ return ['What is the strongest evidence against "'+c+'"?','Who disagrees, and what is their best reason?','Have I sought that out as hard as I sought support?']; }},
    {h:'Taboo the word',d:'Ban a loaded term and force yourself to say exactly what you mean. "Natural", "selfish", "happy" often hide the real disagreement.',
      q:function(c){ return ['Which word in "'+c+'" is doing heavy, vague work?','State the claim again without that word, in plain description.','Does the disagreement survive the rewrite?']; }},
    {h:'Check the base rate',d:'Before trusting a vivid story, ask how common the thing actually is. One striking anecdote rarely overturns the broad pattern.',
      q:function(c){ return ['What\'s the general pattern behind "'+c+'", not just memorable cases?','Am I generalising from a small or biased sample?','What would good data, not anecdotes, show?']; }},
    {h:'Notice motivated reasoning',d:'Ask whether you\'re reasoning toward a conclusion you already want. The feeling of obviousness is often where bias hides.',
      q:function(c){ return ['Do I want "'+c+'" to be true (or false)? Why?','Would I accept this quality of argument for the opposite conclusion?','Am I judging the claim, or defending my side?']; }}
  ];
  (function(){ var box=$('toolCards'); if(!box) return; box.innerHTML=TOOLS.map(function(t){ return '<div class="scard"><h4>'+esc(t.h)+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(t.d)+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  (function(){ var s=$('toolSel'); s.innerHTML=TOOLS.map(function(t,i){ return '<option value="'+i+'">'+esc(t.h)+'</option>'; }).join(''); })();
  var SAMPLES=['Everyone is happier once they have kids','It\'s only natural to want children','Not having children is selfish','Humanity will end if people stop having kids'];
  function apply(){ var c=($('claimIn').value||'').trim()||'(your claim)'; var t=TOOLS[+$('toolSel').value];
    var out=$('applyOut'); out.style.display='block';
    out.innerHTML='<h4>'+esc(t.h)+'</h4><p class="claimq">Applied to: "'+esc(c)+'"</p><ul>'+t.q(c).map(function(q){ return '<li>'+esc(q)+'</li>'; }).join('')+'</ul>'; }
  $('applyBtn').addEventListener('click',apply);
  $('sampleBtn').addEventListener('click',function(){ $('claimIn').value=SAMPLES[Math.floor(Math.random()*SAMPLES.length)]; apply(); });
  $('toolSel').addEventListener('change',function(){ if($('applyOut').style.display==='block') apply(); });

  var ascore={};
  (function(){ var box=$('auditBox'); if(!box) return;
    box.innerHTML=TOOLS.map(function(t,i){ var scale=[1,2,3,4,5].map(function(n){ return '<button type="button" data-q="'+i+'" data-v="'+n+'">'+n+'</button>'; }).join('');
      return '<div class="row"><p>'+esc(t.h)+'</p><div class="scale" data-q="'+i+'">'+scale+'</div></div>'; }).join('');
    box.querySelectorAll('.scale button').forEach(function(b){ b.addEventListener('click',function(){ var q=b.getAttribute('data-q'); ascore[q]=+b.getAttribute('data-v');
      box.querySelectorAll('.scale[data-q="'+q+'"] button').forEach(function(x){ x.classList.toggle('sel',x===b); }); }); }); })();
  $('auditBtn').addEventListener('click',function(){ var res=$('auditResult');
    if(Object.keys(ascore).length<TOOLS.length){ res.style.display='block'; res.textContent='Rate all '+TOOLS.length+' tools first.'; return; }
    var sum=0; for(var k in ascore) sum+=ascore[k]; var avg=sum/TOOLS.length;
    var low=0,lowi=0; TOOLS.forEach(function(_,i){ if(ascore[i]<ascore[lowi]) lowi=i; });
    var msg=avg>=4?'Strong habits. Your growth edge: keep aiming them at your own side, not just opponents.':(avg>=3?'A solid base. ':'Lots of room to grow — and that\'s the fun part. ');
    res.style.display='block'; res.innerHTML='<strong>Average: '+avg.toFixed(1)+'/5.</strong> '+msg+' Your least-used tool is "<b>'+esc(TOOLS[lowi].h)+'</b>" — a good one to practise next.'; });
  $('auditReset').addEventListener('click',function(){ ascore={}; $('auditBox').querySelectorAll('.scale button').forEach(function(x){ x.classList.remove('sel'); }); $('auditResult').style.display='none'; });

  (function(){
    var Q=[{a:0},{a:0}], E=['Tabooing the word means replacing a loaded term with a precise description so people stop talking past each other.','The hardest place to use these tools is on your own beliefs.'];
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
} catch(e){ console.error('project 060 script error', e); }
});
