/* Project 092 · Tamil Childfree Voices — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var HER=[
    ['The Self-Respect tradition','The Self-Respect Movement, led by Periyar in the twentieth century, placed individual dignity and reason above inherited hierarchy and custom — and championed women\'s autonomy, including over marriage and motherhood. Choosing your own life by reason sits squarely within it.'],
    ['Reason over ritual','A strong rationalist current in Tamil thought invites people to ask why a custom exists and whether it serves human dignity — rather than following it simply because it is old. The same question applies, gently, to the assumption that everyone must have children.'],
    ['Women\'s dignity','Tamil reform movements insisted that a woman is not born to serve, marry, or bear children on command, but to be educated, free, and self-respecting. That insistence underwrites every modern conversation about reproductive choice.'],
    ['Learning and language','A civilisation that has prized poetry, learning, and debate for two millennia has deep room for thoughtful disagreement — including about how to live a meaningful life, with or without children.']
  ];
  (function(){ var box=$('heritageCards'); if(!box) return; box.innerHTML=HER.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  var TERMS=[
    {ta:'Suya mariyathai',tr:'self-respect',d:'The core idea of the Self-Respect Movement: each person\'s inherent dignity, owed to no authority and requiring no one\'s permission.'},
    {ta:'Pakuttarivu',tr:'reason / rational discernment',d:'The capacity and habit of examining claims and customs by reason — a value held in high esteem in Tamil rationalist thought.'},
    {ta:'Suthanthiram',tr:'freedom',d:'Freedom not only political but personal — the room to choose one\'s own path with dignity.'}
  ];
  (function(){ var box=$('termsBox'); if(!box) return; box.innerHTML=TERMS.map(function(t){ return '<div class="term"><b>'+esc(t.ta)+'</b> <span class="tr">('+esc(t.tr)+')</span> — '+esc(t.d)+'</div>'; }).join(''); })();
  var PROMPTS=[
    'Self-respect: Whose approval have you been waiting for — and what changes if you decide your dignity was never theirs to grant?',
    'Reason over ritual: Name one expectation you\'ve followed without asking why. What does reason actually say about it?',
    'Women\'s dignity: Where has a role been treated as a duty rather than a choice? What would reclaiming it as a choice feel like?',
    'Learning & language: If you could add your own voice to a centuries-old debate about how to live well, what would you say?'
  ];
  (function(){ var box=$('resonateBox'); if(!box) return; box.innerHTML=HER.map(function(h,i){ return '<button type="button" data-i="'+i+'">'+esc(h[0])+'</button>'; }).join('');
    box.querySelectorAll('button').forEach(function(b){ b.addEventListener('click',function(){ box.querySelectorAll('button').forEach(function(x){ x.classList.toggle('sel',x===b); }); var i=+b.getAttribute('data-i'); var p=$('rprompt'); if(p){ p.textContent='Reflection prompt — '+PROMPTS[i]; p.classList.add('show'); } }); }); })();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 092 script error', e); }
});
