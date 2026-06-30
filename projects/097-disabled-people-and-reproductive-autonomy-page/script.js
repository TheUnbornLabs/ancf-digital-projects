/* Project 097 · Disabled People and Reproductive Autonomy — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var PRIN=[
    ['Autonomy belongs to everyone','Reproductive autonomy is not conditional on ability, diagnosis, or anyone else\'s comfort. Disabled people hold it as fully as anyone, without exception.'],
    ['Presumption of capacity','Start from the assumption that a person can make their own decisions, with whatever support and accessible information they need — not from doubt that must be "earned" away.'],
    ['Support, don\'t override','The role of family, carers, and professionals is to inform and support a person\'s choice, never to make it for them. Help is not the same as control.'],
    ['Coercion-free in both directions','No one should be pushed toward not having children, and no one should be denied the support or respect to have them. Pressure either way is a violation of autonomy.'],
    ['Learn from the history','Disabled people have faced grave reproductive injustices, including coerced sterilisation under eugenic ideas. We name that history so it is never repeated, and so autonomy is protected.'],
    ['Nothing about us without us','Disabled people lead the conversation about their own lives. Policies, supports, and even pages like this should be shaped by, not merely about, disabled people.']
  ];
  (function(){ var box=$('prinCards'); if(!box) return; box.innerHTML=PRIN.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  $('dirBox').innerHTML=
    '<div class="col a"><span class="lbl">Coercion away from parenthood ✗</span><ul>'+
    ['Being pressured or coerced into sterilisation or contraception','Being told one "shouldn\'t" or "couldn\'t" be a parent','Having a pregnancy decision made by others','Being denied the support, adaptations, or respect needed to parent'].map(function(t){ return '<li>'+esc(t)+'</li>'; }).join('')+'</ul></div>'+
    '<div class="col b"><span class="lbl">Coercion toward parenthood ✗</span><ul>'+
    ['Being pressured to have children to seem "normal" or to please family','Being denied access to contraception, information, or the childfree choice','Having one\'s clear "no" dismissed or overruled','Being told what one "owes" a family or partner'].map(function(t){ return '<li>'+esc(t)+'</li>'; }).join('')+'</ul></div>';
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 097 script error', e); }
});
