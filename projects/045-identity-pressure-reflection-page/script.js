/* Project 045 · Identity Pressure Reflection Page — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var FACETS=[
    {id:'family',nm:'Family role',desc:'Being a daughter, son, eldest, or "the one who settles down" can carry heavy "when will you…?" expectations. The role can feel like a duty long before anyone says a word.'},
    {id:'gender',nm:'Gender',desc:'Gender scripts tie womanhood to motherhood — what scholar Nancy Felipe Russo named the "motherhood mandate" — and manhood to "providing for a family." These are scripts, not facts about you.'},
    {id:'culture',nm:'Culture / community',desc:'Community norms make parenthood feel like the default, expected path, with marriage and children as the obvious next steps. Defaults can be examined rather than simply followed.'},
    {id:'faith',nm:'Faith / religion',desc:'Many traditions prize children as blessings or duties. Yet sincere people of the same faith reach different, thoughtful conclusions — belief and conscience can both be honoured.'},
    {id:'class',nm:'Class / economic',desc:'Expectations about heirs, security, status, or "carrying on" can quietly attach reproduction to money and standing.'},
    {id:'peers',nm:'Friends / peers',desc:'When friends pair off and have children, a timeline can feel contagious — as if you\'re falling behind on a race you never entered.'},
    {id:'inner',nm:'The inner critic',desc:'Often the loudest voice is internalized — pressure you now apply to yourself: "maybe something\'s wrong with me," "maybe I\'ll regret it." Pronatalism\'s deepest reach is when we pressure ourselves.'}
  ];
  var vals=(A.getJSON?A.getJSON('vals',{}):{})||{};
  function renderSliders(){ var box=$('sliders'); if(!box) return;
    box.innerHTML=FACETS.map(function(f){ var v=vals[f.id]||0; return '<div class="srow"><div class="top"><span class="nm">'+esc(f.nm)+'</span><span class="vv" id="v_'+f.id+'">'+v+'</span></div><input type="range" min="0" max="5" step="1" value="'+v+'" data-id="'+f.id+'" aria-label="'+esc(f.nm)+'"></div>'; }).join('');
    box.querySelectorAll('input').forEach(function(inp){ inp.addEventListener('input',function(){ var id=inp.getAttribute('data-id'); vals[id]=+inp.value; var lab=$('v_'+id); if(lab)lab.textContent=inp.value; if(A.setJSON)A.setJSON('vals',vals); render(); }); }); }
  function render(){
    var box=$('bars'); if(!box) return;
    var arr=FACETS.map(function(f){ return {f:f,v:vals[f.id]||0}; }).sort(function(a,b){ return b.v-a.v; });
    box.innerHTML=arr.map(function(o){ var pct=(o.v/5)*100; return '<div class="bar"><span class="lab">'+esc(o.f.nm)+'</span><span class="track"><span class="fill" style="width:'+pct+'%"></span></span><span class="nv">'+o.v+'/5</span></div>'; }).join('');
    var total=arr.reduce(function(s,o){return s+o.v;},0);
    var rd=$('reading'); if(!rd) return;
    if(total===0){ rd.style.display='none'; return; }
    rd.style.display='block';
    var top=arr[0], second=arr[1];
    var note=({
      family:'Family roles carry the most weight for you. It can help to separate the role you were handed from your own wish — they\'re not the same thing.',
      gender:'Gendered expectations pull hardest. Remember the "motherhood mandate" is a cultural script, not a measure of who you are.',
      culture:'Cultural and community norms weigh most. Defaults feel like facts until you look at them directly — and then they become choices.',
      faith:'Faith carries the most for you. Even within a tradition that prizes children, your conscience is yours to follow.',
      class:'Economic and status expectations lead. Naming the money-and-standing story can loosen its grip on a deeply personal choice.',
      peers:'Your peers\' timelines press hardest. Their path is theirs; yours doesn\'t owe anyone the same schedule.',
      inner:'The loudest voice is your own inner critic. That\'s worth tending gently — the pressure you apply to yourself is the one you can most directly soften.'
    })[top.f.id];
    rd.innerHTML='<div class="row"><span class="lbl">Loudest source</span><div class="val">'+esc(top.f.nm)+(top.v===second.v?' (tied)':'')+'</div></div><div class="row"><span class="lbl">What that suggests</span><div class="val">'+esc(note)+'</div></div>';
  }
  $('resetBtn').addEventListener('click',function(){ vals={}; if(A.setJSON)A.setJSON('vals',vals); renderSliders(); render(); });

  (function(){ var box=$('facetCards'); if(!box) return; box.innerHTML=FACETS.map(function(f){ return '<div class="scard"><h4>'+esc(f.nm)+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(f.desc)+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();

  renderSliders(); render();

  (function(){
    var ta=$('r1'),tb=$('r2'), status=$('saveStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(A.get){ if(ta){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); } if(tb){ tb.value=A.get('r2',''); tb.addEventListener('input',function(){ A.set('r2',tb.value); }); } }
    var s=$('rSave'),cl=$('rClear');
    if(s) s.addEventListener('click',function(){ if(A.set){ if(ta)A.set('r1',ta.value); if(tb)A.set('r2',tb.value); } flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(((ta&&ta.value.trim())||(tb&&tb.value.trim()))&&!window.confirm('Clear both?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} if(tb){tb.value='';A.remove&&A.remove('r2');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 045 script error', e); }
});
