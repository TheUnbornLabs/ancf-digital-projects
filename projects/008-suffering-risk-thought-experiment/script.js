/* Project 008 · Suffering-Risk Thought Experiment — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A = window.ANCF || {};
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  /* 2 · risk simulator */
  (function(){
    var KEYS=[{k:'flourish',v:3,cls:'d-flourish'},{k:'good',v:1.5,cls:'d-good'},{k:'mixed',v:0,cls:'d-mixed'},{k:'hard',v:-1.5,cls:'d-hard'},{k:'severe',v:-3,cls:'d-severe'}];
    var inputs=KEYS.map(function(o){ return {o:o, el:$('oc-'+o.k)}; }).filter(function(x){return x.el;});
    if(inputs.length<5) return;
    var bar=$('distBar'), evR=$('evRead'), badR=$('badRead'), sevR=$('sevRead'), veil=$('veil');
    function update(){
      var raw=inputs.map(function(x){ return +x.el.value; });
      var sum=raw.reduce(function(a,b){return a+b;},0)||1;
      var norm=raw.map(function(r){ return r/sum*100; });
      var ev=0,bad=0,sev=0;
      inputs.forEach(function(x,i){ ev+=norm[i]/100*x.o.v; if(x.o.k==='hard'||x.o.k==='severe') bad+=norm[i]; if(x.o.k==='severe') sev+=norm[i]; var w=$('w-'+x.o.k); if(w) w.textContent=Math.round(norm[i])+'%'; });
      bar.innerHTML=inputs.map(function(x,i){ var p=norm[i]; return '<span class="'+x.o.cls+'" style="width:'+p+'%">'+(p>=11?Math.round(p)+'%':'')+'</span>'; }).join('');
      evR.textContent=(ev>=0?'+':'')+ev.toFixed(2);
      badR.textContent=Math.round(bad)+'%'; sevR.textContent=Math.round(sev)+'%';
      var msg='<b>Behind the veil of ignorance:</b> imagine you do not know <em>which</em> of these lives you will be born into — you could be any of them, with the odds shown. ';
      if(sev>=15 || bad>=45) msg+='You\'d face a serious chance ('+Math.round(bad)+'%) of a hard or terrible life, including a '+Math.round(sev)+'% chance of real suffering. Many people, choosing for themselves under these odds, would hesitate or decline — which is precisely the antinatalist\'s point about choosing for someone else who cannot.';
      else if(ev>=1.2 && bad<25) msg+='This looks like a bet many would accept for themselves: a positive expected value ('+(ev>=0?'+':'')+ev.toFixed(2)+') and a limited downside ('+Math.round(bad)+'%). The lingering question is that the rare bad outcomes still land on a person who never agreed to the wager.';
      else msg+='It\'s a genuinely close call: expected value '+(ev>=0?'+':'')+ev.toFixed(2)+', with a '+Math.round(bad)+'% chance of a hard-or-worse life. Reasonable people take opposite views of a gamble like this — and notice that your answer may differ depending on whether the stake is your life or someone else\'s.';
      veil.innerHTML=msg;
      if(A.setJSON) A.setJSON('sim',{raw:raw});
    }
    var s=A.getJSON?A.getJSON('sim',null):null;
    if(s&&s.raw) inputs.forEach(function(x,i){ if(s.raw[i]!=null) x.el.value=s.raw[i]; });
    inputs.forEach(function(x){ x.el.addEventListener('input',update); });
    update();
  })();

  /* 3 · frames */
  (function(){
    var box=$('frameCards'); if(!box) return;
    var F=[
      {t:'Expected value',who:'Utilitarian / decision theory',more:'Average the outcomes weighted by probability; if the average is positive, take the bet. Critics: averaging can wash out catastrophic harms to individuals, and it treats a person\'s life like a portfolio.'},
      {t:'Maximin / the veil',who:'Rawls',more:'Choose as if you might end up in the worst outcome (and behind a "veil of ignorance" about who you\'ll be). This weights the floor heavily, and tends to counsel caution when the worst case is severe.'},
      {t:'The precautionary principle',who:'Risk ethics',more:'When a harm is serious and irreversible, avoid it even at some cost to the upside — don\'t gamble big on uncertain catastrophic stakes. Birth\'s worst outcomes are both serious and unundoable.'},
      {t:'Risk as imposition',who:'Rivka Weinberg',more:'Procreation imposes the risk of a life on someone without consent; it may be permissible only under conditions (the risk is reasonable, motives appropriate, etc.). A measured, non-blanket view worth weighing.'},
      {t:'Don\'t gamble with others\' stakes',who:'A common intuition',more:'We allow people to take big risks with their own lives that we forbid them to take with others\'. Creating a person is, uniquely, a maximal risk taken entirely with someone else\'s stake.'}
    ];
    box.innerHTML=F.map(function(f){ return '<div class="fcard" tabindex="0"><h4>'+esc(f.t)+'</h4><p class="who">'+esc(f.who)+'</p><p class="more">'+esc(f.more)+'</p></div>'; }).join('');
    box.querySelectorAll('.fcard').forEach(function(c){ function t(){ c.classList.toggle('open'); } c.addEventListener('click',t); c.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); t(); } }); });
  })();

  /* 4 · thought-experiment cards */
  (function(){
    var box=$('tcDeck'); if(!box) return;
    var C=[
      {q:'The un-pressable button. A button creates a brand-new person whose life follows the odds you set above. Once pressed, it can never be unpressed, and the person can never be asked beforehand. Would you press it on a stranger\'s behalf?',r:'Isolates two features at once: irreversibility and the impossibility of consent. Notice whether your hesitation comes from the odds, or from the structure of deciding-for-someone itself.'},
      {q:'The lottery on someone else\'s life. You\'re handed a ticket: 95% chance of a great prize, 5% chance of losing everything. For yourself, you might buy it. Now you must buy it using someone else\'s entire life as the stake. Does that change your answer?',r:'Probes the gap between risks we take with our own stakes and risks we impose with others\'. Procreation is always the second kind.'},
      {q:'The best-interest standard. A surgeon may operate on an unconscious patient who can\'t consent only when it is clearly in that patient\'s interest. Is creating a life "clearly in the created person\'s interest" — given they have no interests until they exist?',r:'Tests whether the standard we use for other non-consenting subjects can even apply to creation, where there is no prior person with interests to serve.'},
      {q:'The asymmetry. Failing to create a happy person seems to harm no one — there is no one who misses out. But creating a person who suffers does harm someone. Should that asymmetry make us extra cautious about the downside?',r:'Surfaces Benatar\'s asymmetry within the risk frame: if missing goods cost nothing but imposed harms cost a great deal, the math tilts toward caution.'},
      {q:'Where does the number flip? If only 1 life in a million were truly terrible, most would say creating lives is fine. At 1 in 100? At 1 in 10? Find the rough point where your "yes" becomes a "no."',r:'Reveals that almost everyone has a threshold — the disagreement is about where it sits, and how much a rare severe harm should weigh against many good lives.'}
    ];
    box.innerHTML=C.map(function(c,i){ return '<div class="tcard" data-i="'+i+'"><p class="q">'+esc(c.q)+'</p><textarea id="tc-'+i+'" placeholder="Your gut response…"></textarea><div class="btn-row" style="margin-top:8px"><button class="btn" type="button" data-i="'+i+'">Reveal the angle</button></div><div class="reveal">'+esc(c.r)+'</div></div>'; }).join('');
    box.querySelectorAll('.tcard textarea').forEach(function(ta){ var id=ta.id; ta.value=A.get?A.get(id,''):''; ta.addEventListener('input',function(){ if(A.set) A.set(id,ta.value); }); });
    box.querySelectorAll('.btn-row button').forEach(function(b){ b.addEventListener('click',function(){ b.closest('.tcard').classList.toggle('open'); }); });
  })();

  /* 5 · where's your line */
  (function(){
    var sl=$('lineSlider'), bar=$('lineBar'), out=$('lineOut'), note=$('lineNote'); if(!sl) return;
    function update(){
      var v=+sl.value; if(out) out.textContent=v+'%';
      if(A.meter) A.meter(bar,v);
      var msg;
      if(v===0) msg='Your line is at <b>0%</b> — no chance of a seriously hard life is acceptable to impose. Taken strictly, that\'s an antinatalist conclusion, since no real life can be guaranteed risk-free.';
      else if(v<=5) msg='A <b>'+v+'%</b> threshold is quite cautious — you\'d want strong assurance the odds of serious suffering are very low before creating a person who can\'t be asked.';
      else if(v<=20) msg='A <b>'+v+'%</b> threshold is moderate. Worth asking: would you accept that same '+v+'% chance of a seriously hard life if the life on the line were <em>yours</em>, chosen by someone else?';
      else msg='A <b>'+v+'%</b> threshold is relatively risk-tolerant. That can reflect optimism about life\'s worth — just notice it means accepting a roughly '+v+'-in-100 chance of serious hardship for a person who never chose the wager.';
      if(note) note.innerHTML=msg;
      if(A.set) A.set('line',String(v));
    }
    var sv=A.get?A.get('line',''):''; if(sv!=='') sl.value=sv;
    sl.addEventListener('input',update); update();
  })();

  /* 6 · quiz */
  (function(){
    var Q=[{a:0,e:'It\'s made for someone who can\'t be consulted and can\'t be undone — a maximal, irreversible risk borne entirely by another.'},
      {a:1,e:'Expected value averages each outcome weighted by how likely it is.'},
      {a:1,e:'Maximin (and Rawls\'s veil of ignorance) says to choose as if you could land in the worst outcome.'},
      {a:0,e:'The precautionary view says avoid serious, irreversible harms even at some cost to the possible upside.'},
      {a:1,e:'They\'re illustrative aids for thinking — they predict nothing about any real life.'}];
    var picks={}, total=document.querySelectorAll('#quizbox .quiz-q').length;
    if(A.initOptions) A.initOptions($('quizbox'),function(q,i){ picks[q]=+i; });
    var sB=$('quizScore'), rB=$('quizReset'), res=$('quizResult');
    if(sB) sB.addEventListener('click',function(){ if(Object.keys(picks).length<total){ res.style.display='block'; res.textContent='Pick an answer for all '+total+' questions first.'; return; }
      var sc=0; Q.forEach(function(it,i){ document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){ var j=+x.getAttribute('data-i'); x.classList.remove('ok','no'); if(j===it.a)x.classList.add('ok'); else if(j===picks[i])x.classList.add('no'); }); var ex=document.querySelector('.explain[data-q="'+i+'"]'); if(ex){ ex.style.display='block'; ex.textContent=it.e; } if(picks[i]===it.a)sc++; });
      res.style.display='block'; res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.'; if(rB) rB.style.display='inline-block'; });
    if(rB) rB.addEventListener('click',function(){ picks={}; document.querySelectorAll('#quizbox .opt').forEach(function(x){ x.classList.remove('sel','ok','no'); }); document.querySelectorAll('#quizbox .explain').forEach(function(ex){ ex.style.display='none'; ex.textContent=''; }); res.style.display='none'; rB.style.display='none'; });
  })();

  /* 7 · reflection */
  (function(){
    var fields=['r1','r2'], status=$('saveStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    fields.forEach(function(id){ var ta=$(id); if(!ta||!A.get)return; ta.value=A.get(id,''); ta.addEventListener('input',function(){ A.set(id,ta.value); }); });
    var s=$('saveBtn'),c=$('copyBtn'),cl=$('clearBtn');
    if(s) s.addEventListener('click',function(){ fields.forEach(function(id){ var ta=$(id); if(ta&&A.set)A.set(id,ta.value); }); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(fields.some(function(id){var t=$(id);return t&&t.value.trim();})&&!window.confirm('Clear your reflection?'))return; fields.forEach(function(id){ var ta=$(id); if(ta){ ta.value=''; if(A.remove)A.remove(id); } }); flash('Cleared.'); });
    if(c) c.addEventListener('click',function(){ var L=['Suffering-risk — my reflection','']; var ln=A.get?A.get('line',''):''; if(ln!=='') L.push('My acceptable-risk line: '+ln+'% chance of a seriously hard life',''); var p=['Did the veil view change things:','Frame that feels most right:']; fields.forEach(function(id,i){ var ta=$(id); L.push(p[i]); L.push('  '+((ta&&ta.value.trim())?ta.value.trim():'(blank)')); L.push(''); }); if(A.copy) A.copy(L.join('\n'),c); });
  })();

} catch(e){ console.error('project 008 script error', e); }
});
