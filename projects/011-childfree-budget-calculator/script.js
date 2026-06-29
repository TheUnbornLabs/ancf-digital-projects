/* Project 011 · Childfree Budget Calculator — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A = window.ANCF || {};
  function $(id){ return document.getElementById(id); }
  var sym='$';
  function fmt(n){ n=Math.round(n); return sym+n.toLocaleString('en-US'); }

  var CATS=[
    {k:'childcare',label:'Childcare / daycare',low:300,typ:800,high:1600},
    {k:'food',label:'Extra food & groceries',low:120,typ:250,high:400},
    {k:'housing',label:'Extra housing / space',low:150,typ:350,high:700},
    {k:'education',label:'Education & activities',low:60,typ:180,high:500},
    {k:'health',label:'Extra healthcare',low:40,typ:120,high:300},
    {k:'clothing',label:'Clothing & supplies',low:40,typ:90,high:180},
    {k:'transport',label:'Extra transport',low:30,typ:90,high:200},
    {k:'misc',label:'Misc & contingency',low:50,typ:150,high:350}
  ];
  var BUCKETS=[
    {k:'invest',label:'Invest / freedom fund',def:40},
    {k:'travel',label:'Travel & experiences',def:20},
    {k:'home',label:'Home & comfort',def:15},
    {k:'give',label:'Giving / charity',def:10},
    {k:'other',label:'Other priorities',def:15}
  ];
  var vals={}, alloc={};

  function curUpdate(){ var c=$('cur'); if(c) sym=c.value; }

  /* budget rows */
  (function(){
    var box=$('cats'); if(!box) return;
    box.innerHTML=CATS.map(function(c){ return '<div class="catrow"><label for="cat-'+c.k+'">'+c.label+'</label><span class="cur" data-sym="'+sym+'"><input type="number" id="cat-'+c.k+'" min="0" step="10" value="0"></span></div>'; }).join('');
    var saved=A.getJSON?A.getJSON('budget',null):null;
    CATS.forEach(function(c){ var el=$('cat-'+c.k); vals[c.k]= saved&&saved[c.k]!=null? saved[c.k] : c.typ; el.value=vals[c.k]; el.addEventListener('input',function(){ vals[c.k]=+el.value||0; recompute(); }); });
  })();

  function applyPreset(p){
    CATS.forEach(function(c){ var v = p==='zero'?0:(p==='low'?c.low:p==='high'?c.high:c.typ); vals[c.k]=v; var el=$('cat-'+c.k); if(el) el.value=v; });
    recompute();
  }
  document.querySelectorAll('#presets .preset').forEach(function(b){
    function sel(){ document.querySelectorAll('#presets .preset').forEach(function(x){x.classList.remove('active');}); b.classList.add('active'); applyPreset(b.getAttribute('data-p')); }
    b.addEventListener('click',sel);
    b.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); sel(); } });
  });

  /* allocation rows */
  (function(){
    var box=$('allocList'); if(!box) return;
    var saved=A.getJSON?A.getJSON('alloc',null):null;
    box.innerHTML=BUCKETS.map(function(b){ var v= saved&&saved[b.k]!=null? saved[b.k]:b.def; alloc[b.k]=v; return '<div class="slider-row"><div class="lab"><label for="al-'+b.k+'">'+b.label+'</label><output id="o-al-'+b.k+'">'+v+'%</output></div><input type="range" id="al-'+b.k+'" min="0" max="100" step="5" value="'+v+'"></div>'; }).join('');
    BUCKETS.forEach(function(b){ var el=$('al-'+b.k); el.addEventListener('input',function(){ alloc[b.k]=+el.value; var o=$('o-al-'+b.k); if(o)o.textContent=el.value+'%'; recompute(); }); });
  })();

  function monthly(){ var s=0; CATS.forEach(function(c){ s+=vals[c.k]||0; }); return s; }

  /* growth chart */
  function drawGrowth(monthlyInvest, ratePct, years){
    var svg=$('growth'); if(!svg) return {contrib:0,final:0};
    var W=560,H=220,padL=44,padB=26,padT=10,padR=10;
    var r=ratePct/100/12, n=years*12, pts=[], contrib=0, bal=0;
    for(var m=0;m<=n;m++){ if(m>0){ bal=bal*(1+r)+monthlyInvest; contrib+=monthlyInvest; } pts.push({m:m,bal:bal}); }
    var maxBal=pts[pts.length-1].bal||1;
    function X(m){ return padL+(m/n)*(W-padL-padR); }
    function Y(v){ return (H-padB)-(v/maxBal)*(H-padB-padT); }
    var d='', area='M'+padL+' '+(H-padB);
    pts.forEach(function(p,i){ var x=X(p.m),y=Y(p.bal); d+=(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)+' '; area+='L'+x.toFixed(1)+' '+y.toFixed(1)+' '; });
    area+='L'+X(n).toFixed(1)+' '+(H-padB)+' Z';
    var g='<line class="g-axis" x1="'+padL+'" y1="'+(H-padB)+'" x2="'+(W-padR)+'" y2="'+(H-padB)+'"></line>';
    g+='<line class="g-axis" x1="'+padL+'" y1="'+padT+'" x2="'+padL+'" y2="'+(H-padB)+'"></line>';
    g+='<path class="g-area" d="'+area+'"></path><path class="g-line" d="'+d+'"></path>';
    g+='<circle class="g-dot" cx="'+X(n).toFixed(1)+'" cy="'+Y(pts[n].bal).toFixed(1)+'" r="4"></circle>';
    g+='<text class="g-lbl" x="'+padL+'" y="'+(H-8)+'">0</text><text class="g-lbl" x="'+(W-padR)+'" y="'+(H-8)+'" text-anchor="end">'+years+' yrs</text>';
    g+='<text class="g-lbl" x="'+(padL-4)+'" y="'+(padT+10)+'" text-anchor="end">'+fmt(maxBal)+'</text>';
    svg.setAttribute('viewBox','0 0 '+W+' '+H);
    svg.innerHTML=g;
    return {contrib:contrib, final:bal};
  }

  function recompute(){
    curUpdate();
    document.querySelectorAll('.catrow .cur').forEach(function(e){ e.setAttribute('data-sym',sym); });
    var mo=monthly();
    if($('figMonth')) $('figMonth').textContent=fmt(mo);
    if($('figYear')) $('figYear').textContent=fmt(mo*12);
    if($('fig18')) $('fig18').textContent=fmt(mo*12*18);
    var investPct=alloc.invest||0, investMo=mo*investPct/100;
    if($('allocInvest')) $('allocInvest').textContent=fmt(investMo);
    var rate=+($('rate')?$('rate').value:6), years=+($('years')?$('years').value:20);
    if($('o-rate')) $('o-rate').textContent=rate+'%'; if($('o-years')) $('o-years').textContent=years+' yrs';
    var g=drawGrowth(investMo, rate, years);
    if($('figContrib')) $('figContrib').textContent=fmt(g.contrib);
    if($('figGrowth')) $('figGrowth').textContent=fmt(Math.max(0,g.final-g.contrib));
    if($('figFinal')) $('figFinal').textContent=fmt(g.final);
    if(A.setJSON){ A.setJSON('budget',vals); A.setJSON('alloc',alloc); }
    if(A.set){ A.set('cur',sym); A.set('rate',String(rate)); A.set('years',String(years)); }
  }

  ['rate','years'].forEach(function(id){ var el=$(id); if(el) el.addEventListener('input',recompute); });
  var c=$('cur'); if(c){ var sc=A.get?A.get('cur',''):''; if(sc) c.value=sc; c.addEventListener('change',recompute); }
  var sr=A.get?A.get('rate',''):''; if(sr&&$('rate'))$('rate').value=sr;
  var sy=A.get?A.get('years',''):''; if(sy&&$('years'))$('years').value=sy;
  recompute();

  /* quiz */
  (function(){
    var Q=[{a:1},{a:1},{a:0},{a:1}], E=['These are rough, editable estimates that vary enormously by place and lifestyle.','Treat the long-run total as an upper bound — life rarely frees the full amount.','Compound growth means your returns also earn returns over time.','Money is one dimension among many; a bigger number settles nothing about the choice.'];
    var picks={}, total=document.querySelectorAll('#quizbox .quiz-q').length;
    if(A.initOptions) A.initOptions($('quizbox'),function(q,i){ picks[q]=+i; });
    var sB=$('quizScore'), rB=$('quizReset'), res=$('quizResult');
    if(sB) sB.addEventListener('click',function(){ if(Object.keys(picks).length<total){ res.style.display='block'; res.textContent='Pick an answer for all '+total+' questions first.'; return; }
      var sc=0; Q.forEach(function(it,i){ document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){ var j=+x.getAttribute('data-i'); x.classList.remove('ok','no'); if(j===it.a)x.classList.add('ok'); else if(j===picks[i])x.classList.add('no'); }); var ex=document.querySelector('.explain[data-q="'+i+'"]'); if(ex){ ex.style.display='block'; ex.textContent=E[i]; } if(picks[i]===it.a)sc++; });
      res.style.display='block'; res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.'; if(rB) rB.style.display='inline-block'; });
    if(rB) rB.addEventListener('click',function(){ picks={}; document.querySelectorAll('#quizbox .opt').forEach(function(x){ x.classList.remove('sel','ok','no'); }); document.querySelectorAll('#quizbox .explain').forEach(function(ex){ ex.style.display='none'; ex.textContent=''; }); res.style.display='none'; rB.style.display='none'; });
  })();

  /* reflection */
  (function(){
    var ta=$('r1'), status=$('saveStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('saveBtn'),cp=$('copyBtn'),cl=$('clearBtn');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear your reflection?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
    if(cp) cp.addEventListener('click',function(){ var L=['Childfree budget — my numbers ('+sym+')','','Monthly freed: '+($('figMonth')?$('figMonth').textContent:''),'Per year: '+($('figYear')?$('figYear').textContent:''),'Freedom fund / month: '+($('allocInvest')?$('allocInvest').textContent:''),'Projected balance: '+($('figFinal')?$('figFinal').textContent:''),'','What I\'d want it to make possible:','  '+((ta&&ta.value.trim())?ta.value.trim():'(blank)')]; if(A.copy) A.copy(L.join('\n'),cp); });
  })();

} catch(e){ console.error('project 011 script error', e); }
});
