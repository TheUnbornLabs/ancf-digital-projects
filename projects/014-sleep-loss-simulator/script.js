/* Project 014 · Sleep-Loss Simulator — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function fnum(n){ return Math.round(n).toLocaleString('en-US'); }
  // phases: month range + default nightly loss (hours)
  var PH=[
    {k:'newborn',label:'Newborn (0–3 mo)',m0:0,m1:3,def:2.5,desc:'Frequent night feeds; the steepest stretch.'},
    {k:'infant',label:'Infant (4–12 mo)',m0:3,m1:12,def:1.2,desc:'Longer sleeps, but still interrupted.'},
    {k:'toddler',label:'Toddler (1–3 yr)',m0:12,m1:36,def:0.5,desc:'Mostly through the night, with setbacks.'},
    {k:'beyond',label:'Beyond (3 yr+)',m0:36,m1:60,def:0.15,desc:'Occasional disruptions only.'}
  ];
  var loss={};
  (function(){
    var pi=$('phaseinfo'); if(pi) pi.innerHTML=PH.map(function(p){ return '<div class="pi"><h4>'+p.label+'</h4><p>'+p.desc+'</p></div>'; }).join('');
    var box=$('sliders'); if(!box) return;
    var saved=A.getJSON?A.getJSON('loss',null):null;
    box.innerHTML=PH.map(function(p){ var v=saved&&saved[p.k]!=null?saved[p.k]:p.def; loss[p.k]=v; return '<div class="slider-row"><div class="lab"><label for="l-'+p.k+'">'+p.label+' — nightly loss</label><output id="o-l-'+p.k+'">'+v+' h</output></div><input type="range" id="l-'+p.k+'" min="0" max="4" step="0.1" value="'+v+'"></div>'; }).join('');
    PH.forEach(function(p){ var el=$('l-'+p.k); el.addEventListener('input',function(){ loss[p.k]=+el.value; var o=$('o-l-'+p.k); if(o)o.textContent=(+el.value).toFixed(1)+' h'; recompute(); }); });
  })();

  function lossAtMonth(m){ for(var i=0;i<PH.length;i++){ if(m>=PH[i].m0 && m<PH[i].m1) return loss[PH[i].k]||0; } return 0; }

  function drawDebt(months){
    var svg=$('growth'); if(!svg) return 0;
    var W=560,H=220,padL=50,padB=26,padT=10,padR=10;
    var pts=[],cum=0;
    for(var m=0;m<=months;m++){ if(m>0){ cum+= lossAtMonth(m-1)*30.4; } pts.push({m:m,cum:cum}); }
    var max=pts[pts.length-1].cum||1;
    function X(m){ return padL+(m/months)*(W-padL-padR); }
    function Y(v){ return (H-padB)-(v/max)*(H-padB-padT); }
    var d='',area='M'+padL+' '+(H-padB);
    pts.forEach(function(p,i){ var x=X(p.m),y=Y(p.cum); d+=(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)+' '; area+='L'+x.toFixed(1)+' '+y.toFixed(1)+' '; });
    area+='L'+X(months).toFixed(1)+' '+(H-padB)+' Z';
    var g='<line class="g-axis" x1="'+padL+'" y1="'+(H-padB)+'" x2="'+(W-padR)+'" y2="'+(H-padB)+'"></line><line class="g-axis" x1="'+padL+'" y1="'+padT+'" x2="'+padL+'" y2="'+(H-padB)+'"></line>';
    g+='<path class="g-area" d="'+area+'"></path><path class="g-line" d="'+d+'"></path>';
    g+='<text class="g-lbl" x="'+padL+'" y="'+(H-8)+'">month 0</text><text class="g-lbl" x="'+(W-padR)+'" y="'+(H-8)+'" text-anchor="end">'+months+'</text>';
    g+='<text class="g-lbl" x="'+(padL-4)+'" y="'+(padT+10)+'" text-anchor="end">'+fnum(max)+' h</text>';
    svg.setAttribute('viewBox','0 0 '+W+' '+H); svg.innerHTML=g;
    return max;
  }

  function recompute(){
    var months=+($('months')?$('months').value:24); if($('o-months')) $('o-months').textContent=months+' months';
    var debt=drawDebt(months);
    if($('figDebt')) $('figDebt').textContent=fnum(debt)+' h';
    if($('figNights')) $('figNights').textContent=fnum(debt/8);
    if($('figAvg')) $('figAvg').textContent=lossAtMonth(months-1).toFixed(1)+' h';
    var box=$('equivBox');
    if(box){
      var nights=Math.round(debt/8), days=Math.round(debt/24), workweeks=Math.round(debt/40);
      box.innerHTML='Over these '+months+' months, the model totals about <b>'+fnum(debt)+' hours</b> of lost sleep — roughly <b>'+fnum(nights)+' full nights</b>, or about <b>'+fnum(days)+' full 24-hour days</b>, or the awake-hours of around <b>'+fnum(workweeks)+' working weeks</b>. Spread across many months, and softened by naps and shared nights, it is very survivable — but it is real.';
    }
    if(A.setJSON) A.setJSON('loss',loss); if(A.set) A.set('months',String(months));
  }
  var mo=$('months'); if(mo){ var sm=A.get?A.get('months',''):''; if(sm)mo.value=sm; mo.addEventListener('input',recompute); }
  recompute();

  (function(){
    var Q=[{a:1},{a:1},{a:1}], E=['Sleep debt builds fastest in the newborn months, when night-waking is most frequent.','This is an illustrative ballpark, not a medical prediction for any real family.','It\'s a temporary peak that eases as children sleep longer; bodies recover.'];
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
    var s=$('saveBtn'),cp=$('copyBtn'),cl=$('clearBtn');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
    if(cp) cp.addEventListener('click',function(){ var L=['Sleep-loss model','','Cumulative lost sleep: '+($('figDebt')?$('figDebt').textContent:''),'Equivalent full nights: '+($('figNights')?$('figNights').textContent:''),'','How much it weighs for me:','  '+((ta&&ta.value.trim())?ta.value.trim():'(blank)')]; if(A.copy) A.copy(L.join('\n'),cp); });
  })();
} catch(e){ console.error('project 014 script error', e); }
});
