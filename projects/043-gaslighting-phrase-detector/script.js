/* Project 043 · Gaslighting Phrase Detector — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var PAT=[
    {name:'Outright denial',what:'Flatly denies events or words you clearly remember, so reality itself feels up for grabs.',anchor:'You were there. If you remember it, it\'s reasonable to trust that — note it down while it\'s fresh.',re:/\b(that never happened|i never said that|you'?re making (that|it) up|i didn'?t say (that|anything)|that'?s not what happened|no one said that)\b/i},
    {name:'Memory-doubt / countering',what:'Attacks your recollection directly — your memory is faulty, so theirs must win.',anchor:'Memory is imperfect for everyone, including them. "I might be misremembering" cuts both ways — you don\'t have to concede automatically.',re:/\b(you'?re remembering it wrong|your memory('?s| is) (terrible|bad|awful)|you always (get|remember) (it|things) wrong|you'?re confused|you don'?t remember (it )?(right|correctly))\b/i},
    {name:'Trivializing',what:'Shrinks your feelings or the event — "overreacting," "too sensitive," "just a joke."',anchor:'Your reaction is data about your experience, not a flaw. You\'re allowed to be affected by what affected you.',re:/\b(you'?re (over-?reacting|too sensitive|being dramatic|making a big deal)|it was (just|only) a joke|can'?t you take a joke|why are you so emotional|calm down)\b/i},
    {name:'Discrediting / "crazy"',what:'Frames you as irrational, paranoid, or unwell, so your perception can be dismissed.',anchor:'Disagreeing with someone doesn\'t make you unwell. Noticing a pattern isn\'t paranoia — it\'s attention.',re:/\b(you'?re (crazy|insane|paranoid|imagining (things|it)|losing it|unstable)|you need (help|therapy|to see someone)|you sound (crazy|paranoid))\b/i},
    {name:'Blame-shifting',what:'Turns their behaviour into your fault — you "made" them, so the problem is you.',anchor:'You can own your part without owning theirs. Their choices are theirs; "you made me" is rarely literally true.',re:/\b(you made me|this is (all )?your fault|if you hadn'?t|look what you made me do|you brought this on yourself|you'?re the (real )?problem)\b/i},
    {name:'Withholding / diverting',what:'Refuses to engage or changes the subject, so your concern never gets addressed.',anchor:'A concern you can\'t even raise is still valid. You\'re allowed to return to it later, calmly, as many times as needed.',re:/\b(i'?m not (doing|having) this( again)?|i don'?t have to explain|where did you (even )?get that (idea)?|you'?re confusing me|i refuse to (talk|discuss)|drop it)\b/i}
  ];
  var SAMPLES=[
    {t:'Denial + memory-doubt',a:"That never happened — you're remembering it wrong, like always. I never said that. Honestly, your memory is terrible."},
    {t:'Trivializing + discrediting',a:"You're overreacting, it was just a joke. Why are you so emotional? You're being paranoid — you imagine things and you need help."},
    {t:'A genuine disagreement',a:"I remember it a bit differently, but I could be wrong. Can we talk it through? I want to understand how you saw it."}
  ];
  function renderSamples(){ var box=$('samples'); if(!box) return; box.innerHTML=SAMPLES.map(function(s,i){ return '<button type="button" class="sample-btn" data-i="'+i+'">'+esc(s.t)+'</button>'; }).join('');
    box.querySelectorAll('.sample-btn').forEach(function(b){ b.addEventListener('click',function(){ $('msgIn').value=SAMPLES[+b.getAttribute('data-i')].a; scan(); }); }); }
  function scan(){
    var text=$('msgIn').value||''; var box=$('findings'); if(!box) return;
    if(!text.trim()){ box.innerHTML='<p class="note">Paste a message (or pick a sample) and press scan.</p>'; return; }
    var hits=[]; PAT.forEach(function(p){ var m=p.re.exec(text); if(m){ hits.push({p:p,q:m[0]}); } });
    if(!hits.length){ box.innerHTML='<div class="finding" style="border-left-color:var(--info)"><span class="tac">No obvious gaslighting phrasings found.</span><p class="what">Gaslighting is a pattern over time, not a single line — so this doesn\'t rule it in or out. If conversations keep leaving you doubting yourself, that pattern matters more than any one message.</p></div>'; return; }
    box.innerHTML='<p class="outmeta">Found '+hits.length+' possible pattern'+(hits.length>1?'s':'')+'. Remember: a pattern over time matters more than any single phrase.</p>'+
      hits.map(function(h){ return '<div class="finding"><span class="tac">'+esc(h.p.name)+'</span> <span class="gtag">Gaslighting pattern</span><p class="what">'+esc(h.p.what)+'</p><p class="quote">Flagged: "…'+esc(h.q)+'…"</p><p class="anchor"><b>Reality anchor:</b> '+esc(h.p.anchor)+'</p></div>'; }).join('');
  }
  $('scanBtn').addEventListener('click',scan);
  $('clearBtn').addEventListener('click',function(){ $('msgIn').value=''; scan(); });

  (function(){ var box=$('techList'); if(!box) return;
    box.innerHTML=PAT.map(function(p){ return '<details><summary>'+esc(p.name)+'<span class="chev">▾</span></summary><div class="body"><p>'+esc(p.what)+'</p><p class="note"><b>Reality anchor:</b> '+esc(p.anchor)+'</p></div></details>'; }).join(''); })();
  (function(){ var box=$('anchorList'); if(!box) return;
    var ANCH=['Write things down as they happen — a private note dated in the moment is hard to argue away later.',
      'Check with someone you trust. A second perspective you chose, freely, is a powerful corrective.',
      'Separate the event from the spin: "What actually happened?" before "What am I being told happened?"',
      'Notice the feeling. Leaving conversations consistently confused or guilty is itself information.',
      'You can disengage. "We remember this differently, and I\'m confident in mine" is a complete response.'];
    box.innerHTML=ANCH.map(function(t){ return '<div class="a">'+esc(t)+'</div>'; }).join(''); })();

  renderSamples(); scan();

  (function(){
    var Q=[{a:0},{a:0}], E=['Gaslighting works by making someone doubt their own memory or perception.','A single flagged phrase isn\'t proof — gaslighting is about a sustained pattern and context.'];
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
} catch(e){ console.error('project 043 script error', e); }
});
