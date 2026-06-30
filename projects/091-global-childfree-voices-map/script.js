/* Project 091 · Global Childfree Voices Map — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var R=[
    {id:'sa',name:'South Asia',tone:'Family and marriage milestones are often closely held social expectations, and the childfree conversation is growing, especially online and among younger generations.',press:'Strong family and community expectation, marriage-then-children timelines, and "what will people say" social pressure.',hope:'Rich rationalist and reformist traditions (and a vibrant online discourse) give the choice deep roots and growing community.'},
    {id:'ea',name:'East Asia',tone:'Rapid social change and falling birth rates sit alongside lasting filial expectations; many openly weigh career, cost, and freedom.',press:'Filial duty, "carry on the family," and state and family concern about low birth rates.',hope:'Large, visible cohorts choosing differently are normalising the conversation quickly.'},
    {id:'mena',name:'Middle East & N. Africa',tone:'Family is often central and the topic can be sensitive, though private conversations and online spaces are expanding.',press:'Religious and family expectation, marriage norms, and limited public space for the topic in some places.',hope:'Quiet, growing communities and a long history of valuing learning and dialogue.'},
    {id:'ssa',name:'Sub-Saharan Africa',tone:'Enormous diversity across cultures; children often carry deep family and economic meaning, while urban, educated voices increasingly discuss choice.',press:'Strong kinship expectation, economic roles of children, and community standing.',hope:'Urbanisation, education, and women\'s movements are widening the room to choose.'},
    {id:'eu',name:'Europe',tone:'Being childfree is widely visible and broadly accepted in many countries, though pressure persists in subtler, individual forms.',press:'Quieter, personal pressure — family hopes, "you\'ll regret it," and assumptions at work.',hope:'Strong norms of personal autonomy and supportive later-life systems in many states.'},
    {id:'na',name:'North America',tone:'A long, vocal childfree movement and lots of public discourse, alongside persistent cultural pronatalism.',press:'Media pronatalism, "selfish" framing, and old-age-care worries.',hope:'Established communities, research, and a robust language for the choice.'},
    {id:'la',name:'Latin America',tone:'Family and faith often loom large, while feminist movements and urban youth are actively reshaping the conversation.',press:'Religious and family expectation, gendered "motherhood mandate," and machismo-adjacent norms.',hope:'Powerful feminist organising and a growing, outspoken childfree presence.'},
    {id:'oce',name:'Oceania',tone:'Broadly individualistic norms in many areas sit beside diverse Indigenous and immigrant family traditions.',press:'Family hopes and the usual "when?" questions, varying widely by community.',hope:'Generally high personal autonomy and open public conversation.'}
  ];
  var fr='all';
  function renderChips(){ var box=$('chips'); if(!box) return; var ids=['all'].concat(R.map(function(r){return r.id;}));
    box.innerHTML=ids.map(function(id){ var nm=id==='all'?'All regions':R.filter(function(r){return r.id===id;})[0].name; return '<button type="button" class="fchip'+(id===fr?' active':'')+'" data-id="'+id+'">'+esc(nm)+'</button>'; }).join('');
    box.querySelectorAll('.fchip').forEach(function(b){ b.addEventListener('click',function(){ fr=b.getAttribute('data-id'); renderChips(); render(); }); }); }
  function render(){ var box=$('regionBox'); if(!box) return; var list=R.filter(function(r){ return fr==='all'||r.id===fr; });
    box.innerHTML=list.map(function(r){ return '<div class="region"><h4>'+esc(r.name)+'</h4><div class="row">'+esc(r.tone)+'</div><div class="row"><b>Common pressures:</b> '+esc(r.press)+'</div><div class="row"><b>A hopeful thread:</b> '+esc(r.hope)+'</div></div>'; }).join(''); }
  (function(){ var box=$('sharedCards'); if(!box) return;
    var C=[['The assumed default','Almost everywhere, having children is the unspoken expected path — the water everyone swims in. Naming it is the first universal step.'],['The "when?" question','In nearly every culture, the timeline question arrives uninvited. Only the wording changes; the pressure rhymes.'],['Growing community','Wherever you are, you\'re less alone than it feels. Online and off, communities of people choosing thoughtfully are growing everywhere.']];
    box.innerHTML=C.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  renderChips(); render();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 091 script error', e); }
});
