/* Project 055 · Philosophy Comparison Tool — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var DIMS=[['summary','In one line'],['procreation','On creating new lives'],['suffering','On suffering'],['meaning','On meaning'],['figures','Key figures'],['strength','Strongest point'],['objection','Main objection']];
  var POS=[
    {id:'antinatalism',name:'Antinatalism',summary:'Coming into existence carries a negative value.',procreation:'Generally ethically problematic to create new sentient beings.',suffering:'Central — preventing it is a primary concern.',meaning:'A life, once started, can still hold meaning; the question is about starting it.',figures:'David Benatar; echoes of Schopenhauer.',strength:'Takes the non-consenting party\'s interests seriously.',objection:'Contested asymmetry; many are glad to exist.'},
    {id:'pronatalism',name:'Pronatalism',summary:'Having children is good, expected, and to be encouraged.',procreation:'A positive good, often a duty or blessing.',suffering:'Part of life, outweighed by its goods and joys.',meaning:'Children and family are a central source of meaning.',figures:'Many religious and cultural traditions; natalist policy thinkers.',strength:'Matches most people\'s lived sense that life is worth giving.',objection:'Can slide into pressure and ignore the unconsenting child\'s risk.'},
    {id:'childfree',name:'Childfree by choice',summary:'A personal decision not to have children — no general claim.',procreation:'Neutral in principle; a private matter for each person.',suffering:'Not a defining concern of the stance.',meaning:'Found in many places; children simply aren\'t required.',figures:'A social movement more than a philosophy (1970s onward).',strength:'Respects autonomy without judging anyone else\'s choice.',objection:'Says little about the ethics of procreation in general.'},
    {id:'suffering-focused',name:'Suffering-focused ethics',summary:'Reducing suffering matters more than creating happiness.',procreation:'Cautious — new lives risk adding more suffering.',suffering:'The core moral priority.',meaning:'Compatible with meaning; the emphasis is on harm prevention.',figures:'Negative utilitarians; some effective-altruism thinkers.',strength:'Captures the intuition that severe suffering is specially urgent.',objection:'May undervalue real, positive goods and happiness.'},
    {id:'classical-util',name:'Classical utilitarianism',summary:'Maximise overall wellbeing (pleasure minus pain).',procreation:'Good if it adds net wellbeing to the world.',suffering:'Bad, but offset by sufficient happiness.',meaning:'Wellbeing is what ultimately matters.',figures:'Bentham; Mill; Sidgwick.',strength:'Clear, impartial, and counts everyone\'s interests.',objection:'Can demand creating people merely to add happiness ("repugnant conclusion").'},
    {id:'stoicism',name:'Stoicism',summary:'Live by reason and virtue; accept what you cannot control.',procreation:'Generally affirmed — family and society are natural goods. (Not antinatalist.)',suffering:'Reframed: judgements, not events, disturb us.',meaning:'Virtue and a life lived in accordance with nature.',figures:'Epictetus; Seneca; Marcus Aurelius.',strength:'Powerful tools for equanimity amid hardship.',objection:'Acceptance can look like resignation to some critics.'},
    {id:'buddhism',name:'Buddhism',summary:'Life involves dukkha; liberation comes from releasing craving.',procreation:'Not antinatalist; lay life and family are common, monasticism is one path.',suffering:'Dukkha is the first Noble Truth; its end is the goal.',meaning:'Awakening and compassion for all beings.',figures:'The Buddha; a vast living tradition.',strength:'Deep, practical analysis of suffering and the mind.',objection:'Doctrines like rebirth are metaphysically contested.'},
    {id:'existentialism',name:'Existentialism',summary:'Existence precedes essence; we create our own meaning.',procreation:'No single line; emphasis is on authentic, free choice.',suffering:'The absurd is faced honestly, not denied.',meaning:'Self-authored through freedom and responsibility.',figures:'Kierkegaard; Sartre; de Beauvoir; Camus.',strength:'Centres freedom and honest confrontation with life.',objection:'Can feel under-determined about what one should actually do.'},
    {id:'longtermism',name:'Longtermism',summary:'Positively shaping the long-run future is a key priority.',procreation:'Often favourable — future people\'s potential wellbeing matters greatly.',suffering:'Future suffering counts; so does future flourishing.',meaning:'Found partly in contributing to a vast future.',figures:'Some effective-altruism thinkers.',strength:'Takes the scale of the future morally seriously.',objection:'Risks discounting present people and is highly uncertain.'}
  ];
  function fill(sel,def){ var s=$(sel); s.innerHTML=POS.map(function(p,i){ return '<option value="'+i+'"'+(i===def?' selected':'')+'>'+esc(p.name)+'</option>'; }).join(''); }
  function render(){
    var a=POS[+$('selA').value], b=POS[+$('selB').value];
    var head='<thead><tr><th class="dimlab">Dimension</th><th class="colA">'+esc(a.name)+'</th><th>'+esc(b.name)+'</th></tr></thead>';
    var body='<tbody>'+DIMS.map(function(d){ return '<tr><td class="dimlab">'+esc(d[1])+'</td><td class="colA">'+esc(a[d[0]])+'</td><td>'+esc(b[d[0]])+'</td></tr>'; }).join('')+'</tbody>';
    $('cmpTable').innerHTML=head+body;
  }
  $('selA').addEventListener('change',render); $('selB').addEventListener('change',render);
  $('swapBtn').addEventListener('click',function(){ var a=$('selA').value; $('selA').value=$('selB').value; $('selB').value=a; render(); });
  (function(){ var box=$('glossList'); if(!box) return; box.innerHTML=POS.map(function(p,i){ return '<details><summary><b>'+esc(p.name)+'</b><span class="chev">▾</span></summary><div class="body"><p>'+esc(p.summary)+'</p><button type="button" class="btn" data-i="'+i+'" style="font-size:.8rem;padding:4px 11px">Compare as B ↑</button></div></details>'; }).join('');
    box.querySelectorAll('button').forEach(function(b){ b.addEventListener('click',function(){ $('selB').value=b.getAttribute('data-i'); render(); var c=$('compare'); if(c&&c.scrollIntoView)c.scrollIntoView({behavior:'smooth'}); }); }); })();
  fill('selA',0); fill('selB',1); render();

  (function(){
    var ta=$('r1'), status=$('saveStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 055 script error', e); }
});
