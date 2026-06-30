/* Project 028 · Environmental Argument Explainer — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  /* 1 · considerations */
  (function(){
    var C=[{k:'resources',l:'Finite resources & land'},{k:'climate',l:'Climate & emissions'},{k:'biodiversity',l:'Biodiversity & other species'},{k:'future',l:'Welfare of future generations'},{k:'justice',l:'Fairness to those least responsible'}];
    var box=$('considers'); if(!box) return;
    var saved=A.getJSON?A.getJSON('consid',null):null; var vals={};
    box.innerHTML=C.map(function(c){ var v=saved&&saved[c.k]!=null?saved[c.k]:50; vals[c.k]=v; return '<div class="slider-row"><div class="lab"><label for="cn-'+c.k+'">'+c.l+'</label><output id="o-cn-'+c.k+'">'+v+'%</output></div><input type="range" id="cn-'+c.k+'" min="0" max="100" step="10" value="'+v+'"></div>'; }).join('');
    function update(){
      C.forEach(function(c){ var el=$('cn-'+c.k); vals[c.k]=+el.value; var o=$('o-cn-'+c.k); if(o)o.textContent=el.value+'%'; });
      var top=C.slice().sort(function(a,b){return vals[b.k]-vals[a.k];})[0];
      var avg=Math.round(C.reduce(function(s,c){return s+vals[c.k];},0)/C.length);
      var r=$('considerReading');
      if(r){ if(avg===0) r.innerHTML='Move the sliders to reflect what weighs on you. There are no right answers.'; else r.innerHTML='Ecology weighs <b>'+(avg<35?'lightly':avg<65?'moderately':'heavily')+'</b> in your thinking, most of all <b>'+esc(top.l.toLowerCase())+'</b>. That\'s a legitimate emphasis to hold — just keep section ② in view, so the weight you give it stays proportionate to where the harm actually comes from.'; }
      if(A.setJSON) A.setJSON('consid',vals);
    }
    C.forEach(function(c){ $('cn-'+c.k).addEventListener('input',update); });
    update();
  })();

  /* 2 · what moves the needle */
  (function(){
    var box=$('needleCards'); if(!box) return;
    var N=[
      {t:'Energy & policy systems',tg:'The dominant lever',more:'How societies generate energy, build cities, and regulate industry shapes emissions on a scale no individual choice approaches. This is where the biggest reductions live.'},
      {t:'Consumption inequality',tg:'Who emits matters',more:'The wealthiest fraction of humanity emits vastly more than the poorest billions. A high-consumption lifestyle dwarfs the effect of family size for most people who worry about this.'},
      {t:'Individual family size',tg:'Real but modest, and contested',more:'A new person is a lifetime of consumption — but the headline "carbon cost of a child" figures are contested, assume the status quo persists for generations, and vary enormously by country. Real, but easily overstated.'},
      {t:'Framing risks',tg:'Handle with care',more:'"Fewer people" rhetoric has historically been aimed at the poor and marginalized, who contribute least. Any honest ecological case must refuse that move.'}
    ];
    box.innerHTML=N.map(function(f){ return '<div class="scard" tabindex="0"><h4>'+esc(f.t)+'</h4><p class="tg">'+esc(f.tg)+'</p><p class="more">'+esc(f.more)+'</p></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ function t(){ c.classList.toggle('open'); } c.addEventListener('click',t); c.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();t();} }); });
  })();

  /* 3 · objections */
  (function(){
    var box=$('objList'); if(!box) return;
    var O=[
      {t:'It blames the wrong people',o:'Framing births as the problem points the finger at ordinary families — often in poorer countries with tiny footprints — while the high-consuming and the fossil-fuel industry escape scrutiny.',r:'A vital objection, and one any careful version must concede: the ecological case can only honestly apply as a personal consideration, never as a policy aimed at others, and never at those least responsible.'},
      {t:'A missing person also can\'t help',o:'People don\'t only consume — they invent, organise, vote, and solve. A future person might be exactly who helps fix the problem. Subtracting people subtracts solutions too.',r:'Fair: humans are both emitters and problem-solvers. This is a real reason for humility about treating "fewer people" as straightforwardly good for the planet.'},
      {t:'Consumption, not number, is the lever',o:'A handful of high-consumption lives outweighs many low-consumption ones. Targeting birth rates is aiming at the wrong variable.',r:'Largely correct, and a reason the ecological argument is weakest as a general rule and strongest, if at all, only for the highest-consuming lifestyles — and even then it competes with simply consuming less.'},
      {t:'It risks coercion',o:'History\'s population-control programs slid into coercion and abuse. Any "for the planet" reasoning about births must be watched closely.',r:'Agreed without reservation: the only legitimate form is a free personal consideration. Coercion of any kind is a violation of reproductive autonomy (see Project 006).'}
    ];
    box.innerHTML=O.map(function(o){ return '<details class="obj"><summary>'+esc(o.t)+'<span class="chev" aria-hidden="true">›</span></summary><div class="body"><p>'+esc(o.o)+'</p><div class="reply"><b>A fair response:</b> '+esc(o.r)+'</div></div></details>'; }).join('');
  })();

  (function(){
    var Q=[{a:1},{a:0},{a:1}], E=['The biggest drivers are systems, energy, and the consumption of the wealthiest — not individual family size.','"Fewer people" framing can shade into blaming the poor, who contribute least.','The page treats ecology as one personal consideration among many — never a duty.'];
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
    var s=$('saveBtn'),cl=$('clearBtn');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 028 script error', e); }
});
