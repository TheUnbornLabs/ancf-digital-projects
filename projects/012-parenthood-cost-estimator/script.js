/* Project 012 · Parenthood Cost Estimator — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  var sym='$'; function fmt(n){n=Math.round(n);return sym+n.toLocaleString('en-US');}
  // phase: key,label,age range,years,lean/typ/gen ANNUAL (pregnancy is one-time over 1 "year")
  var PH=[
    {k:'preg',label:'Pregnancy & birth',sub:'one-time',y0:-1,y1:0,years:1,lean:2000,typ:5000,gen:12000},
    {k:'baby',label:'Baby (0–1)',sub:'1 year',y0:0,y1:1,years:1,lean:6000,typ:11000,gen:20000},
    {k:'tod',label:'Toddler (1–4)',sub:'3 years',y0:1,y1:4,years:3,lean:7000,typ:12000,gen:22000},
    {k:'child',label:'Child (5–11)',sub:'7 years',y0:4,y1:11,years:7,lean:7000,typ:12000,gen:24000},
    {k:'teen',label:'Teen (12–17)',sub:'6 years',y0:11,y1:17,years:6,lean:8000,typ:14000,gen:28000},
    {k:'ya',label:'Young adult (18–22)',sub:'optional support',y0:17,y1:22,years:5,lean:4000,typ:10000,gen:25000}
  ];
  var vals={};
  function curUpd(){ var c=$('cur'); if(c) sym=c.value; }

  (function(){
    var box=$('phaseRows'); if(!box) return;
    box.innerHTML=PH.map(function(p){ return '<div class="phaserow"><span class="meta">'+p.label+'<small>'+p.sub+'</small></span><span class="cur" data-sym="'+sym+'"><input type="number" id="ph-'+p.k+'" min="0" step="100" value="0"></span></div>'; }).join('');
    var saved=A.getJSON?A.getJSON('phases',null):null;
    PH.forEach(function(p){ var el=$('ph-'+p.k); vals[p.k]= saved&&saved[p.k]!=null? saved[p.k]:p.typ; el.value=vals[p.k]; el.addEventListener('input',function(){ vals[p.k]=+el.value||0; recompute(); }); });
  })();

  function preset(p){ PH.forEach(function(ph){ var v=p==='zero'?0:ph[p]; vals[ph.k]=v; var el=$('ph-'+ph.k); if(el)el.value=v; }); recompute(); }
  document.querySelectorAll('#presets .preset').forEach(function(b){ function sel(){ document.querySelectorAll('#presets .preset').forEach(function(x){x.classList.remove('active');}); b.classList.add('active'); preset(b.getAttribute('data-p')); } b.addEventListener('click',sel); b.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();sel();} }); });

  function phaseTotal(p){ return (vals[p.k]||0)*p.years; }

  function drawCumulative(){
    var svg=$('growth'); if(!svg) return;
    // cumulative by age 0..22 (pregnancy added at age 0)
    var W=560,H=220,padL=46,padB=26,padT=10,padR=10;
    var pts=[]; var cum=0;
    // age -1 = pregnancy lump at start
    for(var age=0;age<=22;age++){
      // add costs for the year ending at this age
      PH.forEach(function(p){ if(p.k==='preg'){ if(age===0) cum+=phaseTotal(p); } else { if(age>p.y0 && age<=p.y1) cum+=(vals[p.k]||0); } });
      pts.push({age:age,cum:cum});
    }
    var max=pts[pts.length-1].cum||1;
    function X(a){ return padL+(a/22)*(W-padL-padR); }
    function Y(v){ return (H-padB)-(v/max)*(H-padB-padT); }
    var d='',area='M'+padL+' '+(H-padB);
    pts.forEach(function(p,i){ var x=X(p.age),y=Y(p.cum); d+=(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)+' '; area+='L'+x.toFixed(1)+' '+y.toFixed(1)+' '; });
    area+='L'+X(22).toFixed(1)+' '+(H-padB)+' Z';
    var g='<line class="g-axis" x1="'+padL+'" y1="'+(H-padB)+'" x2="'+(W-padR)+'" y2="'+(H-padB)+'"></line><line class="g-axis" x1="'+padL+'" y1="'+padT+'" x2="'+padL+'" y2="'+(H-padB)+'"></line>';
    g+='<path class="g-area" d="'+area+'"></path><path class="g-line" d="'+d+'"></path>';
    g+='<text class="g-lbl" x="'+padL+'" y="'+(H-8)+'">age 0</text><text class="g-lbl" x="'+(W-padR)+'" y="'+(H-8)+'" text-anchor="end">22</text>';
    g+='<text class="g-lbl" x="'+(padL-4)+'" y="'+(padT+10)+'" text-anchor="end">'+fmt(max)+'</text>';
    svg.setAttribute('viewBox','0 0 '+W+' '+H); svg.innerHTML=g;
  }

  function drawBreakdown(){
    var box=$('pbreak'); if(!box) return;
    var totals=PH.map(function(p){ return {nm:p.label,v:phaseTotal(p)}; });
    var max=Math.max.apply(null,totals.map(function(t){return t.v;}).concat([1]));
    box.innerHTML=totals.map(function(t){ return '<div class="pbar"><span class="nm">'+t.nm+'</span><span class="track"><span class="fill" style="width:'+(t.v/max*100)+'%"></span></span><span class="v">'+fmt(t.v)+'</span></div>'; }).join('');
  }

  function recompute(){
    curUpd(); document.querySelectorAll('.phaserow .cur').forEach(function(e){ e.setAttribute('data-sym',sym); });
    var to18=0,to22=0;
    PH.forEach(function(p){ var t=phaseTotal(p); to22+=t; if(p.k!=='ya') to18+=t; });
    if($('figTotal')) $('figTotal').textContent=fmt(to18);
    if($('figTo22')) $('figTo22').textContent=fmt(to22);
    if($('figPerYr')) $('figPerYr').textContent=fmt(to18/18);
    drawCumulative(); drawBreakdown();
    if(A.setJSON) A.setJSON('phases',vals); if(A.set) A.set('cur',sym);
  }
  var c=$('cur'); if(c){ var sc=A.get?A.get('cur',''):''; if(sc)c.value=sc; c.addEventListener('change',recompute); }
  recompute();

  (function(){
    var Q=[{a:1},{a:1},{a:0},{a:0}], E=['Editable estimates that vary enormously by place, system, and choices.','Money is one factor among many; a total settles nothing about the choice.','Childcare and education are usually the heaviest, and the most location-dependent.','Use it to plan with your own numbers — not to judge, and not as a precise forecast.'];
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
    if(cp) cp.addEventListener('click',function(){ var L=['Parenthood cost estimate ('+sym+')','','To age 18: '+($('figTotal')?$('figTotal').textContent:''),'To ~22: '+($('figTo22')?$('figTo22').textContent:''),'Avg/year: '+($('figPerYr')?$('figPerYr').textContent:''),'','Note: '+((ta&&ta.value.trim())?ta.value.trim():'(blank)')]; if(A.copy) A.copy(L.join('\n'),cp); });
  })();

} catch(e){ console.error('project 012 script error', e); }
});
