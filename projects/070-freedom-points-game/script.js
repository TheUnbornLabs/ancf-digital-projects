/* Project 070 · Freedom Points Game — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var SCENES=[
    {n:'At a party, a relative beams: "So, when are the little ones coming?"',ch:[
      {t:'"That\'s a bit personal — but thanks for asking! How are you?"',p:2,f:'Warm boundary: keeps your freedom AND the goodwill. Both dials high.'},
      {t:'"Ugh, why does everyone ask me that?!"',p:1,f:'Protects autonomy, spends warmth. Fair to feel, but it costs the room a little.'},
      {t:'"Oh… soon, maybe, I don\'t know…"',p:0,f:'Kind, but you handed over the boundary. Caving keeps the peace and loses the freedom.'} ]},
    {n:'Your parent says, quietly, "I\'ll be heartbroken without grandchildren."',ch:[
      {t:'"I hear that, and I love you. This is still my decision."',p:2,f:'Acknowledges the feeling, holds the line. The "both" response.'},
      {t:'"Stop guilt-tripping me."',p:1,f:'Names it, but sharply. The boundary lands with a bruise.'},
      {t:'"Okay, okay — maybe we\'ll think about it."',p:0,f:'Soothes them by surrendering your answer. Warmth up, freedom down.'} ]},
    {n:'A friend grins: "You\'ll change your mind, you\'ll see."',ch:[
      {t:'"Maybe, maybe not — I\'ve thought it through, and I\'m at peace."',p:2,f:'Calm and self-assured without combat. Keeps both.'},
      {t:'"You don\'t know me at all."',p:1,f:'Defends your autonomy, but pushes the friend away.'},
      {t:'"Yeah… you\'re probably right."',p:0,f:'Easy and agreeable, but it gives your certainty away.'} ]},
    {n:'A colleague remarks: "A real family needs kids, though."',ch:[
      {t:'"We feel complete as we are — thanks, though."',p:2,f:'Light, clear, unbothered. Boundary held, bridge intact.'},
      {t:'"That\'s an offensive thing to say."',p:1,f:'There\'s truth in it, but the heat may end the conversation rather than open it.'},
      {t:'"…I guess so."',p:0,f:'Lets a hurtful claim stand to avoid friction. Costs you something.'} ]},
    {n:'2am, the inner critic whispers: "Maybe something\'s wrong with me."',ch:[
      {t:'"Wanting a different life than the default isn\'t a defect."',p:2,f:'Self-compassion and autonomy together — even with yourself. Both dials high.'},
      {t:'"Whatever, I don\'t care."',p:1,f:'Holds a kind of independence, but dismisses the feeling rather than meeting it.'},
      {t:'"Everyone else manages, so… yeah, maybe."',p:0,f:'Caves to the inner critic. The hardest boundary to hold is the one inside.'} ]}
  ];
  var idx=0, fp=0;
  var best=(A.getJSON?A.getJSON('best',0):0)||0; var be=$('best'); if(be)be.textContent=best;
  function render(){
    var host=$('host'); if(!host) return;
    if(idx>=SCENES.length){ if(fp>best){ best=fp; if(A.setJSON)A.setJSON('best',fp); var b=$('best'); if(b)b.textContent=best; }
      var band=fp>=8?'Autonomy and kindness, together — you protected both.':fp>=5?'Getting there — a few moments leaned toward caving or spiking.':'Worth practising: notice whether you tend to cave or to snap, and aim for the "both" line.';
      host.innerHTML='<div class="endcard"><div class="big">'+fp+' / 10</div><p>'+esc(band)+'</p><button class="btn btn-primary" id="replayBtn" type="button">↺ Play again</button></div>'; if(A.meter)A.meter($('meter'),100);
      var rp=$('replayBtn'); if(rp) rp.addEventListener('click',function(){ idx=0;fp=0; var f=$('fp'); if(f)f.textContent=0; render(); }); return; }
    var sc=SCENES[idx];
    host.innerHTML='<div class="scene"><p class="note">Moment '+(idx+1)+' of '+SCENES.length+'</p><p class="narr">'+esc(sc.n)+'</p><div class="choices2">'+sc.ch.map(function(c,i){ return '<button type="button" data-i="'+i+'">'+esc(c.t)+'</button>'; }).join('')+'</div><div class="fb2" id="fb2"></div></div>';
    if(A.meter)A.meter($('meter'),Math.round(idx/SCENES.length*100));
    host.querySelectorAll('.choices2 button').forEach(function(b){ b.addEventListener('click',function(){ choose(sc.ch[+b.getAttribute('data-i')]); host.querySelectorAll('.choices2 button').forEach(function(x){ x.disabled=true; x.style.opacity=0.6; }); }); });
  }
  function choose(c){ fp+=c.p; var f=$('fp'); if(f)f.textContent=fp;
    var fb=$('fb2'); if(fb){ fb.classList.add('show'); fb.innerHTML='<span class="pts">+'+c.p+' freedom point'+(c.p===1?'':'s')+'</span><p style="margin-top:6px">'+esc(c.f)+'</p><button class="btn btn-primary" id="nextBtn" type="button">'+(idx+1>=SCENES.length?'See result':'Next moment')+'</button>'; }
    var nb=$('nextBtn'); if(nb) nb.addEventListener('click',function(){ idx++; render(); });
  }
  render();
  (function(){ var box=$('aboutCards'); if(!box) return;
    var C=[['The freedom dial','Does your response keep the decision yours? Caving — "okay, maybe" — gives it away, even when it keeps the peace.'],['The warmth dial','Does your response keep the relationship intact? Snapping protects the boundary but spends goodwill you may want later.'],['Aim for both','The top answers turn the dials up together: "I hear you, and this is mine." Warm and clear, at the same time.']];
    box.innerHTML=C.map(function(p){ return '<div class="scard"><h4>'+p[0]+'</h4><span class="tg">Tap to expand</span><div class="more">'+p[1]+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 070 script error', e); }
});
