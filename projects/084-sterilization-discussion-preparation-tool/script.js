/* Project 084 · Sterilization Discussion Preparation Tool — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var CATS=[
    {id:'options',label:'Options & suitability',qs:['What options are available to someone in my situation?','Which might suit me, and why?','How effective is each, in plain terms?']},
    {id:'permanence',label:'Permanence & reversibility',qs:['How permanent should I consider this?','What is known about reversibility, and how reliable is that?','How should I weigh permanence in my decision?']},
    {id:'risks',label:'Risks & side effects',qs:['What are the possible risks and side effects?','How common are they, and which are serious?','What should I watch for afterwards?']},
    {id:'recovery',label:'Procedure & recovery',qs:['What does the process involve, at a high level?','What is recovery typically like, and how long?','What support or time off might I need?']},
    {id:'alternatives',label:'Alternatives',qs:['What non-permanent alternatives exist?','How do they compare for someone who is sure they don\'t want children?','Is there any reason to try those first?']},
    {id:'consent',label:'Consent & autonomy',qs:['Is this decision mine to make, and will my informed choice be respected?','If you\'re not able to help, can you refer me to someone who can?','Can I have the key information and any decision noted in writing?']},
    {id:'access',label:'Access & cost',qs:['Is there a waiting period, age rule, or approval process here?','What are the costs, and what is covered?','How do I book the next step if I decide to proceed?']}
  ];
  var on={}; CATS.forEach(function(c){ on[c.id]=['options','consent'].indexOf(c.id)>=0; });
  function renderCats(){ var box=$('cats'); if(!box) return; box.innerHTML=CATS.map(function(c){ return '<label data-id="'+c.id+'" class="'+(on[c.id]?'on':'')+'"><input type="checkbox" '+(on[c.id]?'checked':'')+'><span>'+esc(c.label)+'</span></label>'; }).join('');
    box.querySelectorAll('input').forEach(function(ch){ ch.addEventListener('change',function(){ var id=ch.closest('label').getAttribute('data-id'); on[id]=ch.checked; ch.closest('label').classList.toggle('on',ch.checked); build(); }); }); }
  function build(){ var L=['QUESTIONS FOR MY PROVIDER','========================','']; var n=1; var any=false;
    CATS.forEach(function(c){ if(!on[c.id]) return; any=true; L.push(c.label.toUpperCase()); c.qs.forEach(function(q){ L.push('  '+(n++)+'. '+q); }); L.push(''); });
    $('out').textContent=any?L.join('\n').trim():'Pick one or more topics above to build your question list.'; }
  $('allBtn').addEventListener('click',function(){ CATS.forEach(function(c){ on[c.id]=true; }); renderCats(); build(); });
  $('copyBtn').addEventListener('click',function(){ if(A.copy) A.copy($('out').textContent,$('copyBtn')); });
  (function(){ var box=$('thinkCards'); if(!box) return;
    var T=[['Your own certainty','It\'s worth being honest with yourself about how settled you feel. Confidence helps you advocate clearly — and a good provider will explore it with you, not against you.'],['Conversations with a partner','If you have a partner, talking it through together first can help, even though the decision about your body is ultimately yours.'],['Attitudes vary','Some providers are more supportive than others. If you feel dismissed, you\'re allowed to seek another opinion — that\'s not difficult, it\'s thorough.'],['Informed choice is your right','You deserve full information and to have your decision respected. Asking for things in writing and taking your time are completely reasonable.']];
    box.innerHTML=T.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  renderCats(); build();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 084 script error', e); }
});
