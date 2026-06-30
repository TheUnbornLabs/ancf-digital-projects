/* Project 030 · Economic Pressure Explainer — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  (function(){
    var box=$('forceCards'); if(!box) return;
    var F=[
      {t:'Housing',tg:'Roof and room',more:'High prices and small homes push some to delay or forgo children; secure, affordable housing can make a family feel possible. Same market, opposite effects.'},
      {t:'Childcare & education',tg:'The cost of raising',more:'Expensive childcare and schooling weigh heavily against having children for many — while subsidised systems lift that weight elsewhere.'},
      {t:'Work & income',tg:'Stability and careers',more:'Precarious or low pay pushes some away from parenthood; for others, family is a response to insecurity, or culturally tied to "settling down".'},
      {t:'Old-age security',tg:'Who provides later',more:'Where pensions and care are weak, children can feel like a retirement plan — a real pull toward parenthood, and a heavy thing to ask of a child.'},
      {t:'Debt & the cost of living',tg:'The squeeze',more:'Student loans and rising prices delay milestones for many; for some, that pressure hardens a "not now" into a settled "no".'}
    ];
    box.innerHTML=F.map(function(f){ return '<div class="scard" tabindex="0"><h4>'+esc(f.t)+'</h4><p class="tg">'+esc(f.tg)+'</p><p class="more">'+esc(f.more)+'</p></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ function t(){ c.classList.toggle('open'); } c.addEventListener('click',t); c.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();t();} }); });
  })();

  (function(){
    var TOWARD=[{k:'tfam',l:'Family help with childcare available'},{k:'texp',l:'Cultural / family expectation'},{k:'tsec',l:'Children seen as old-age security'},{k:'thome',l:'A stable home already in place'},{k:'tsupp',l:'Partner / community support'}];
    var AWAY=[{k:'ahouse',l:'High housing costs'},{k:'acare',l:'High childcare / education costs'},{k:'awork',l:'Job or income precarity'},{k:'adebt',l:'Existing debt / cost of living'},{k:'acareer',l:'Fear of falling behind at work'}];
    var tBox=$('towardRows'), aBox=$('awayRows'); if(!tBox||!aBox) return;
    var saved=A.getJSON?A.getJSON('econ',null):null; var vals={};
    function rows(arr){ return arr.map(function(f){ var v=saved&&saved[f.k]!=null?saved[f.k]:30; vals[f.k]=v; return '<div class="slider-row"><div class="lab"><label for="ec-'+f.k+'">'+f.l+'</label><output id="o-ec-'+f.k+'">'+v+'%</output></div><input type="range" id="ec-'+f.k+'" min="0" max="100" step="10" value="'+v+'"></div>'; }).join(''); }
    tBox.innerHTML=rows(TOWARD); aBox.innerHTML=rows(AWAY);
    function update(){
      TOWARD.concat(AWAY).forEach(function(f){ var el=$('ec-'+f.k); vals[f.k]=+el.value; var o=$('o-ec-'+f.k); if(o)o.textContent=el.value+'%'; });
      var tAvg=TOWARD.reduce(function(s,f){return s+vals[f.k];},0)/TOWARD.length;
      var aAvg=AWAY.reduce(function(s,f){return s+vals[f.k];},0)/AWAY.length;
      var net=tAvg-aAvg; // -100..100
      var pos=Math.max(0,Math.min(100,50+net/2));
      var nd=$('needle'); if(nd) nd.style.left='calc('+pos+'% - 2px)';
      var r=$('mapReading');
      if(r){ var dir, msg;
        if(Math.abs(net)<8){ msg='Your economic pressures are roughly <b>balanced</b> — pushing toward and away with similar force. The decision is less likely to be settled by money alone, which can be freeing: it leaves room for what you actually want.'; }
        else if(net>0){ msg='On balance, your economic forces lean <b>toward children</b> (by about '+Math.round(net)+' points). Worth asking gently: how much of any "yes" is desire, and how much is security or expectation talking?'; }
        else { msg='On balance, your economic forces lean <b>away from children</b> (by about '+Math.round(-net)+' points). Worth asking: is this a true "no", or a "not under these conditions"? Naming that difference matters.'; }
        r.innerHTML=msg+' <span class="note">This maps pressure, not what you should do — the choice stays yours.</span>'; }
      if(A.setJSON) A.setJSON('econ',vals);
    }
    TOWARD.concat(AWAY).forEach(function(f){ $('ec-'+f.k).addEventListener('input',update); });
    update();
  })();

  (function(){
    var Q=[{a:1},{a:1},{a:1}], E=['Economic pressure pushes in both directions, depending on circumstance.','Feeling unable to afford a child reflects structural conditions like housing and wages, not a personal failing.','Naming the pressures makes invisible forces visible so you can choose clearly — it doesn\'t decide for you.'];
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
} catch(e){ console.error('project 030 script error', e); }
});
