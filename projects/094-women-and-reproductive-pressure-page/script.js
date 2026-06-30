/* Project 094 · Women and Reproductive Pressure — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var SHAPES=[
    ['The motherhood mandate','Scholar Nancy Felipe Russo named this in 1976: the cultural rule that a woman must have children — and raise them well — to count as a proper adult woman. It frames motherhood as a duty, not a choice.'],
    ['The "biological clock"','Popularised by a 1978 newspaper column, not biology, the "ticking clock" turns a personal, private matter into a public countdown — and a lever for pressure.'],
    ['The care default','An unspoken assumption that women will do the caregiving — for children, and later for ageing relatives — which quietly narrows the room to choose differently.'],
    ['The "incomplete woman"','The trope that a woman without children is unfulfilled, selfish, or to be pitied. It treats a whole life as a deficiency.'],
    ['Worth measured in motherhood','The idea that a woman\'s value, virtue, or femininity is proven by becoming a mother — and questioned if she doesn\'t.'],
    ['The double standard','Men are rarely asked when they\'ll have children, or judged for waiting. The scrutiny falls unevenly, which is itself a clue that it\'s a script, not a neutral concern.']
  ];
  (function(){ var box=$('shapeCards'); if(!box) return; box.innerHTML=SHAPES.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  var DEC=[
    {line:'"Your clock is ticking."',assume:'That there is one right window for everyone, and your worth depends on beating it.',reframe:'Real fertility facts are personal and belong between you and a doctor — not a public countdown. My timeline is mine to set.'},
    {line:'"You\'ll feel incomplete without a child."',assume:'That a woman is a deficiency until motherhood completes her.',reframe:'I\'m a whole person now. Wholeness isn\'t something a child is required to deliver.'},
    {line:'"It\'s just what women are made for."',assume:'That biology assigns every woman the same single purpose.',reframe:'Capacity isn\'t obligation. What I\'m "made for" is mine to decide.'},
    {line:'"Who\'ll care for everyone if not you?"',assume:'That caregiving is a woman\'s default role, automatically.',reframe:'Care can be shared, planned, and chosen. It isn\'t mine by default of being a woman.'},
    {line:'"You\'re being selfish."',assume:'That a woman choosing her own life is taking something from someone.',reframe:'No one is deprived by my choice. Living honestly isn\'t selfish — it\'s mine to do.'}
  ];
  (function(){ var box=$('decoder'); if(!box) return; box.innerHTML=DEC.map(function(d,i){ return '<button type="button" data-i="'+i+'">'+esc(d.line)+'</button>'; }).join('');
    box.querySelectorAll('button').forEach(function(b){ b.addEventListener('click',function(){ box.querySelectorAll('button').forEach(function(x){ x.classList.toggle('sel',x===b); }); var d=DEC[+b.getAttribute('data-i')]; var o=$('dout'); if(o){ o.innerHTML='<div class="row"><span class="lbl">The assumption</span><div>'+esc(d.assume)+'</div></div><div class="row reframe"><span class="lbl">A grounded reframe</span><div>'+esc(d.reframe)+'</div></div>'; o.classList.add('show'); } }); }); })();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 094 script error', e); }
});
