/* Project 098 · Poverty and Parenthood Pressure — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  $('dirBox').innerHTML=
    '<div class="col a"><span class="lbl">Pressures toward having children</span><ul>'+
    ['Children as future labour or household help where work is scarce','Children as old-age security where pensions and safety nets are thin','Social standing and belonging tied to having a family','Limited access to contraception, information, or reproductive healthcare'].map(function(t){ return '<li>'+esc(t)+'</li>'; }).join('')+'</ul></div>'+
    '<div class="col b"><span class="lbl">Pressures away from having children</span><ul>'+
    ['The sheer cost of raising a child on a low or unstable income','Housing, time, and job insecurity that make parenting feel impossible','Stigma and judgement aimed at people who have children while poor','Wanting to give a child more than current conditions allow'].map(function(t){ return '<li>'+esc(t)+'</li>'; }).join('')+'</ul></div>';
  var SYS=[
    ['Wages & work','When wages don\'t cover the cost of a child — or of not having one — the "choice" is really being made by the labour market. Better pay widens real options.'],
    ['The cost of children','Childcare, housing, healthcare, and education costs shape decisions far more than personal "responsibility" does. These are policy choices, not facts of nature.'],
    ['Safety nets','Where pensions, healthcare, and support are strong, children stop being an old-age insurance policy — and people get to choose more freely.'],
    ['Access & information','Real reproductive freedom needs access to contraception, healthcare, and clear information. Where these are scarce, "choice" is constrained from the start.']
  ];
  (function(){ var box=$('sysCards'); if(!box) return; box.innerHTML=SYS.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 098 script error', e); }
});
