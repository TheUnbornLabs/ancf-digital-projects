/* Project 029 · Feminist Childfree Explainer — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  (function(){
    var box=$('threadCards'); if(!box) return;
    var T=[
      {t:'Bodily autonomy',tg:'My body, my decision',more:'The foundational thread: decisions about pregnancy and one\'s own body belong first to the person living in it. The right to refuse is as real as the right to choose.'},
      {t:'Beyond "destiny"',tg:'Womanhood ≠ motherhood',more:'A long feminist critique of the idea that a woman is incomplete without children — what Nancy Felipe Russo named the "motherhood mandate". Identity and purpose are authored, not assigned.'},
      {t:'Equality at work & in public life',tg:'The opportunity cost',more:'Mandatory motherhood has historically constrained women\'s education, careers, and public roles. The freedom not to parent is bound up with the freedom to participate fully elsewhere.'},
      {t:'The unequal load',tg:'Who actually does the work',more:'Childrearing labour has fallen disproportionately on women (the "second shift"). Naming that imbalance is part of why the choice is so weighty, and so gendered.'},
      {t:'Solidarity across choices',tg:'Mothers and the childfree, together',more:'The mature feminist position isn\'t anti-motherhood; it defends every reproductive choice equally — supporting mothers AND the childfree, against the pressure that polices both.'}
    ];
    box.innerHTML=T.map(function(f){ return '<div class="scard" tabindex="0"><h4>'+esc(f.t)+'</h4><p class="tg">'+esc(f.tg)+'</p><p class="more">'+esc(f.more)+'</p></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ function t(){ c.classList.toggle('open'); } c.addEventListener('click',t); c.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();t();} }); });
  })();

  (function(){
    var box=$('voiceList'); if(!box) return;
    var V=[
      {t:'Simone de Beauvoir — "The Second Sex" (1949)',d:'Argued that "one is not born, but rather becomes, a woman" — that womanhood, including motherhood as destiny, is socially constructed, not biologically fixed.'},
      {t:'Betty Friedan — "The Feminine Mystique" (1963)',d:'Named the quiet dissatisfaction of women confined to the housewife-and-mother role, helping spark second-wave feminism.'},
      {t:'Shulamith Firestone — "The Dialectic of Sex" (1970)',d:'A radical analysis tying women\'s oppression to the biology and social organisation of reproduction.'},
      {t:'Adrienne Rich — "Of Woman Born" (1976)',d:'Distinguished the experience of mothering from motherhood as a patriarchal institution — a landmark in the feminist study of parenthood.'},
      {t:'Nancy Felipe Russo — "The Motherhood Mandate" (1976)',d:'Named the social rule that a woman must have and raise children to count as a proper adult woman.'},
      {t:'Arlie Hochschild — "The Second Shift" (1989)',d:'Documented how working women carried a disproportionate share of housework and childcare — the unequal load.'},
      {t:'Reproductive justice (coined 1994)',d:'A framework from women of colour widening the lens: the right to have a child, to not have one, and to raise children in safe and dignified conditions.'},
      {t:'Orna Donath — "Regretting Motherhood" (2017)',d:'Broke a taboo by studying women who love their children yet regret becoming mothers — underlining that parenthood should be a real, informed choice.'}
    ];
    box.innerHTML=V.map(function(v){ return '<details class="obj"><summary>'+esc(v.t)+'<span class="chev" aria-hidden="true">›</span></summary><div class="body">'+esc(v.d)+'</div></details>'; }).join('');
  })();

  (function(){
    var box=$('objList'); if(!box) return;
    var O=[
      {t:'Is it "choice feminism" or structural critique?',o:'Some argue that celebrating individual "choice" can obscure the structures — unequal pay, scarce childcare, the second shift — that shape those choices in the first place.',r:'Both can be true: defend the individual\'s freedom to decide AND fight the conditions that constrain it. A choice made under pressure is exactly what the structural critique aims to free.'},
      {t:'Does it devalue motherhood?',o:'A worry that emphasising the childfree path implies motherhood is lesser, or that "liberated" women shouldn\'t want children.',r:'The strongest feminist position explicitly rejects this: it defends mothers and the childfree equally, and treats chosen, supported motherhood as a feminist outcome too.'},
      {t:'Whose feminism?',o:'Mainstream childfree discourse has at times centred relatively privileged women, while others face coercion in the opposite direction — pressure or force NOT to reproduce.',r:'Reproductive justice answers this directly: autonomy means freedom from coercion in BOTH directions, and attention to those, historically, denied the right to parent.'}
    ];
    box.innerHTML=O.map(function(o){ return '<details class="obj"><summary>'+esc(o.t)+'<span class="chev" aria-hidden="true">›</span></summary><div class="body"><p>'+esc(o.o)+'</p><div class="reply"><b>A fair response:</b> '+esc(o.r)+'</div></div></details>'; }).join('');
  })();

  (function(){
    var Q=[{a:0},{a:1},{a:1}], E=['Russo\'s "motherhood mandate" is the idea that a woman must mother to count as a proper adult woman.','The feminist case rests centrally on bodily autonomy and self-determination.','Feminism on this is a conversation with real internal debate, not a single line.'];
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
} catch(e){ console.error('project 029 script error', e); }
});
