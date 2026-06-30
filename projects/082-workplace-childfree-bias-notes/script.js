/* Project 082 · Workplace Childfree Bias Notes — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  var BIAS=[
    ['"You have more time"','The assumption that without children you have empty hours to absorb extra work. But rest, relationships, health, and a life outside the office are real commitments — not spare capacity owed to the team.'],
    ['Holiday default','Being expected to always cover Christmas, school holidays, or weekends so parents can be with family. Fair rotation matters; "you don\'t have kids" isn\'t a scheduling policy.'],
    ['Commitment doubt','The quiet idea that parents are more "serious" or "grounded," and the childfree are somehow less invested. Your work speaks for your commitment; your family status doesn\'t.'],
    ['Flexibility blind spot','Flexible hours and leave framed as "for parents," overlooking that everyone has lives, caregiving, health, and needs worth accommodating.'],
    ['The guilt lever','Requests wrapped in "but you understand, they have children" — using guilt to make declining feel heartless. Compassion for colleagues is good; it isn\'t a duty to always say yes.']
  ];
  (function(){ var box=$('biasCards'); if(!box) return; box.innerHTML=BIAS.map(function(b){ return '<div class="scard"><h4>'+esc(b[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(b[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  var SITS=[
    {id:'holiday',label:'Asked (again) to cover a holiday shift',r:{
      warm:['"I\'m happy to take my fair share, but I\'ve covered the last couple — can we rotate this one so it\'s even across the team?"','"I\'d like to be fair to everyone, myself included. Could we set up a rotation rather than defaulting to me each time?"'],
      neutral:['"I\'ve covered the recent holidays. To keep it equitable, I\'d suggest we rotate coverage this time."','"Let\'s look at the rota — I\'d like holiday cover shared evenly across the team."'],
      firm:['"I won\'t be able to cover this one. I\'ve done the last few, and it needs to rotate."','"That doesn\'t work for me this time. Please include everyone in the holiday rotation."']}},
    {id:'time',label:'Told "you\'ve got more time" for extra work',r:{
      warm:['"I do value my time outside work, even if it looks different to others\'. I can help with X, but I can\'t take all of this on."','"My evenings are committed too — just not in ways that show on a calendar. Let\'s find a realistic split."'],
      neutral:['"My time outside work is fully spoken for. I can take part of this, not all of it."','"I\'d rather we allocate this by capacity than by assumptions about who\'s busy."'],
      firm:['"My time off is mine, and it\'s not extra capacity. I can\'t take this on."','"Please don\'t assume I\'m available because I don\'t have children. I\'m not free for this."']}},
    {id:'flex',label:'Flexibility framed as "for parents only"',r:{
      warm:['"I love that we support parents. Could we extend the same flexibility to everyone? I\'d benefit from it too."','"Could we frame flexible hours as available to all of us? Lots of us have lives that need it."'],
      neutral:['"I\'d suggest making flexible arrangements available to all staff, not only parents."','"Can we review the policy so flexibility isn\'t tied to family status?"'],
      firm:['"Flexibility shouldn\'t depend on having children. I\'d like the same access."','"I expect the same flexible options that are offered to colleagues with kids."']}},
    {id:'guilt',label:'Guilted with "but they have children"',r:{
      warm:['"I really do sympathise. I still need to protect my own time on this one — can we find another solution together?"','"I get that it\'s hard for them, and I want to help where I can — but I can\'t be the automatic answer every time."'],
      neutral:['"I understand the situation. I\'m still not able to take this on, so let\'s look at other options."','"I\'m sympathetic, but I need to decline. Could we share it across the team?"'],
      firm:['"I won\'t be guilted into this. The answer is no, kindly but clearly."','"Their situation isn\'t a claim on my time. I\'m declining."']}}
  ];
  var current='';
  function fillSits(){ var s=$('sit'); s.innerHTML=SITS.map(function(it,i){ return '<option value="'+i+'">'+esc(it.label)+'</option>'; }).join(''); }
  function gen(){ var it=SITS[+$('sit').value], tone=$('tone').value; var r=pick(it.r[tone]); if(r===current&&it.r[tone].length>1) r=pick(it.r[tone]); current=r; $('out').textContent=r; }
  $('genBtn').addEventListener('click',gen); $('anotherBtn').addEventListener('click',gen);
  $('sit').addEventListener('change',gen); $('tone').addEventListener('change',gen);
  $('copyBtn').addEventListener('click',function(){ if(current&&A.copy) A.copy(current,$('copyBtn')); });
  (function(){ var box=$('prinCards'); if(!box) return;
    var P=[['Time is time','Everyone\'s hours outside work are theirs to value. Rest and a personal life aren\'t spare capacity to be reallocated.'],['Fair, not equal-to-zero','Being a good colleague means doing your fair share — not absorbing everyone else\'s. You can be generous and bounded.'],['Policy, not status','Push for flexibility and fairness as policies for all, framed around needs, not family status. It helps everyone, parents included.']];
    box.innerHTML=P.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  fillSits(); gen();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 082 script error', e); }
});
