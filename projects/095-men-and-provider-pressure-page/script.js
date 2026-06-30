/* Project 095 · Men and Provider Pressure — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var SHAPES=[
    ['The provider mandate','The expectation that a man\'s purpose is to provide for a family — so a life without children can be read as aimless, even by himself. It ties manhood to a single role.'],
    ['Carrying the name','Pressure to "continue the line" and pass on a surname, framing biological continuation as a man\'s special duty to his ancestors and descendants.'],
    ['Fatherhood as proof of maturity','The idea that a man isn\'t fully grown up — not "settled," not "serious" — until he has children. It treats reproduction as a coming-of-age test.'],
    ['The "real man" trope','Virility and fatherhood quietly equated with manhood itself, so opting out can be cast as a failure of masculinity.'],
    ['The silent assumption','Men are asked far less directly than women — but the assumption that they\'ll "of course" have kids someday runs underneath, rarely examined.'],
    ['Legacy and immortality','The hope of living on through descendants, framed as a man\'s natural ambition — when a meaningful legacy can take many other forms.']
  ];
  (function(){ var box=$('shapeCards'); if(!box) return; box.innerHTML=SHAPES.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  var DEC=[
    {line:'"A man needs a son to carry on the name."',assume:'That a man\'s worth and continuity depend on biological, preferably male, descendants.',reframe:'A name isn\'t a reason to create a person. What I pass on — values, care, work — is far bigger than a surname.'},
    {line:'"You\'ll never really grow up until you\'re a father."',assume:'That maturity is unlocked by reproduction, not by character.',reframe:'Maturity is how I treat people and meet life — not a box I tick by having a child.'},
    {line:'"It\'s a man\'s job to provide for a family."',assume:'That a man\'s purpose is fixed to one role: breadwinner-for-children.',reframe:'I can be responsible, generous, and useful in many ways. My purpose isn\'t assigned by a script.'},
    {line:'"Don\'t you want a legacy?"',assume:'That legacy means descendants, and a man should want that above all.',reframe:'Plenty of meaningful lives leave ideas, kindness, and work behind. Legacy is broader than DNA.'},
    {line:'"What kind of man doesn\'t want kids?"',assume:'That wanting children is part of being a "real man."',reframe:'There\'s no one way to be a man. Choosing my own life honestly is about as grown-up as it gets.'}
  ];
  (function(){ var box=$('decoder'); if(!box) return; box.innerHTML=DEC.map(function(d,i){ return '<button type="button" data-i="'+i+'">'+esc(d.line)+'</button>'; }).join('');
    box.querySelectorAll('button').forEach(function(b){ b.addEventListener('click',function(){ box.querySelectorAll('button').forEach(function(x){ x.classList.toggle('sel',x===b); }); var d=DEC[+b.getAttribute('data-i')]; var o=$('dout'); if(o){ o.innerHTML='<div class="row"><span class="lbl">The assumption</span><div>'+esc(d.assume)+'</div></div><div class="row reframe"><span class="lbl">A grounded reframe</span><div>'+esc(d.reframe)+'</div></div>'; o.classList.add('show'); } }); }); })();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 095 script error', e); }
});
