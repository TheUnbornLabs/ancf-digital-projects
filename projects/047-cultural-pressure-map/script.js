/* Project 047 · Cultural Pressure Map — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var SRC=[
    {id:'family',nm:'Immediate family',how:'Parents and siblings, through direct questions, hints, and comparisons. Usually the loudest because it\'s the closest.',move:'A calm, repeatable line and a clear boundary go furthest here. They love you — answer the worry, not the words.',cope:'For immediate family: pick one warm, firm line ("I\'m at peace with this") and repeat it without escalating. Consider one honest sit-down to set the topic aside for good.'},
    {id:'inlaws',nm:'In-laws / extended',how:'Relatives and in-laws who feel entitled to weigh in on "the next step," often via your partner.',move:'Present a united front with your partner, and let each of you field your own side of the family.',cope:'For in-laws and extended family: agree a shared script with your partner first, and have each person handle their own relatives. A united "we" is hard to argue with.'},
    {id:'peers',nm:'Friends / peers',how:'As friends pair off and have kids, a "you\'re falling behind" timeline can feel contagious.',move:'Remember their path is theirs. Seek out or stay close to friends who respect your choice.',cope:'For peers: invest in friendships that don\'t hinge on matching life stages, and let the comparison-y ones cool. Your timeline isn\'t a race you entered.'},
    {id:'work',nm:'Workplace / colleagues',how:'Coworkers\' assumptions, intrusive questions, and "when\'s it your turn?" at every baby shower.',move:'You owe a workplace nothing personal. A friendly deflection keeps it professional.',cope:'For work: a light, closed deflection works ("no plans there — anyway, about that deadline…"). Your reproductive life is not a performance review.'},
    {id:'faith',nm:'Faith community',how:'Religious settings and leaders that frame children as blessing, duty, or expectation.',move:'Sincere people of the same faith reach different conclusions. Your conscience is yours.',cope:'For a faith community: seek out voices within your tradition who hold space for different choices, and remember conscience has always been part of belief.'},
    {id:'media',nm:'Media / advertising',how:'Films, ads, and feeds where the happy ending is always a baby, quietly equating fulfilment with parenthood.',move:'This one you can mostly let pass — and curate. It\'s a story being sold, not a verdict on you.',cope:'For media: notice the script when it appears, then curate your feed toward lives that look like yours. An advert\'s ending isn\'t a prescription.'},
    {id:'policy',nm:'Government / policy',how:'Tax codes, benefits, and natalist messaging that assume and reward parenthood.',move:'Name it as structural, not personal. It\'s a system\'s preference, not a comment on your worth.',cope:'For policy: see it as a structural bias, not a personal judgement. Knowing the pressure is systemic can stop you taking an impersonal nudge to heart.'},
    {id:'society',nm:'Society at large',how:'Strangers, neighbours, and "common sense" that treats the childfree as incomplete or odd.',move:'You owe strangers no explanation. Their opinions cost you nothing unless you spend on them.',cope:'For society at large: practise the art of letting it pass. A stranger\'s assumption is theirs to hold, and needs nothing from you.'}
  ];
  var vals=(A.getJSON?A.getJSON('vals',{}):{})||{};
  function renderSliders(){ var box=$('sliders'); if(!box) return;
    box.innerHTML=SRC.map(function(s){ var v=vals[s.id]||0; return '<div class="srow"><div class="top"><span class="nm">'+esc(s.nm)+'</span><span class="vv" id="v_'+s.id+'">'+v+'</span></div><input type="range" min="0" max="5" step="1" value="'+v+'" data-id="'+s.id+'" aria-label="'+esc(s.nm)+'"></div>'; }).join('');
    box.querySelectorAll('input').forEach(function(inp){ inp.addEventListener('input',function(){ var id=inp.getAttribute('data-id'); vals[id]=+inp.value; var lab=$('v_'+id); if(lab)lab.textContent=inp.value; if(A.setJSON)A.setJSON('vals',vals); render(); }); }); }
  function render(){
    var box=$('bars'); if(!box) return;
    var arr=SRC.map(function(s){ return {s:s,v:vals[s.id]||0}; }).sort(function(a,b){ return b.v-a.v; });
    box.innerHTML=arr.map(function(o){ return '<div class="bar"><span class="lab">'+esc(o.s.nm)+'</span><span class="track"><span class="fill" style="width:'+(o.v/5*100)+'%"></span></span><span class="nv">'+o.v+'/5</span></div>'; }).join('');
    var total=arr.reduce(function(s,o){return s+o.v;},0), max=SRC.length*5;
    var lm=$('loadMsg'), cb=$('copingBox');
    if(total===0){ if(lm)lm.textContent=''; if(cb)cb.innerHTML='<p class="note">Rate a few sources above to see your map and targeted moves.</p>'; return; }
    var pct=Math.round(total/max*100);
    var band=pct>=66?'a heavy overall load — be gentle with yourself, and tackle the top one or two sources first':(pct>=33?'a moderate overall load — focused on a few sources you can address directly':'a light overall load — most of the weight is concentrated, not everywhere');
    if(lm) lm.textContent='Overall pressure load: '+pct+'% — '+band+'.';
    var top=arr.filter(function(o){return o.v>0;}).slice(0,2);
    if(cb) cb.innerHTML='<h4>Targeted moves</h4>'+top.map(function(o){ return '<div class="coping">'+esc(o.s.cope)+'</div>'; }).join('');
  }
  $('resetBtn').addEventListener('click',function(){ vals={}; if(A.setJSON)A.setJSON('vals',vals); renderSliders(); render(); });

  (function(){ var box=$('sourceCards'); if(!box) return; box.innerHTML=SRC.map(function(s){ return '<div class="scard"><h4>'+esc(s.nm)+'</h4><span class="tg">Tap to expand</span><div class="more"><b>How it shows up:</b> '+esc(s.how)+'<br><br><b>One counter-move:</b> '+esc(s.move)+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();

  renderSliders(); render();

  (function(){
    var ta=$('r1'), status=$('saveStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 047 script error', e); }
});
