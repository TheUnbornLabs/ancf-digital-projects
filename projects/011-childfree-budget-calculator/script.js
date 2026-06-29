/* Project 011 · Childfree Budget Calculator — interactive logic (country-aware) */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; var CC=window.ANCFCountries; function $(id){return document.getElementById(id);}
  var country = CC ? CC.get(A.get?A.get('country','IN'):'IN') : {cur:'$',locale:'en-US',b011:1900,note:''};
  function fmt(n){ return CC?CC.fmt(country,n):('$'+Math.round(n)); }
  // category weights of the monthly total + preset multipliers
  var CATS=[
    {k:'childcare',label:'Childcare / daycare',w:0.34},
    {k:'food',label:'Extra food & groceries',w:0.12},
    {k:'housing',label:'Extra housing / space',w:0.17},
    {k:'education',label:'Education & activities',w:0.10},
    {k:'health',label:'Extra healthcare',w:0.06},
    {k:'clothing',label:'Clothing & supplies',w:0.05},
    {k:'transport',label:'Extra transport',w:0.05},
    {k:'misc',label:'Misc & contingency',w:0.11}
  ];
  var MULT={low:0.6,typ:1,high:1.7};
  var BUCKETS=[{k:'invest',label:'Invest / freedom fund',def:40},{k:'travel',label:'Travel & experiences',def:20},{k:'home',label:'Home & comfort',def:15},{k:'give',label:'Giving / charity',def:10},{k:'other',label:'Other priorities',def:15}];
  var vals={}, alloc={};

  function presetVal(c,mult){ return Math.round(country.b011*c.w*mult/10)*10; }

  /* country select */
  (function(){
    var sel=$('country'); if(!sel||!CC) return;
    sel.innerHTML=CC.list.map(function(c){ return '<option value="'+c.code+'"'+(c.code===country.code?' selected':'')+'>'+c.name+' ('+c.cur.trim()+')</option>'; }).join('');
    sel.addEventListener('change',function(){ country=CC.get(sel.value); if(A.set)A.set('country',country.code); applyPreset(activePreset()); updateNote(); });
  })();
  function updateNote(){ var n=$('ctxNote'); if(n) n.innerHTML='<b>'+country.name+':</b> '+(country.note||'')+' All figures below are rough '+country.cur.trim()+' starting points — replace them with your own.'; }

  /* budget rows */
  (function(){
    var box=$('cats'); if(!box) return;
    box.innerHTML=CATS.map(function(c){ return '<div class="catrow"><label for="cat-'+c.k+'">'+c.label+'</label><span class="cur" data-sym="'+country.cur+'"><input type="number" id="cat-'+c.k+'" min="0" step="10" value="0"></span></div>'; }).join('');
    var saved=A.getJSON?A.getJSON('budget',null):null;
    CATS.forEach(function(c){ var el=$('cat-'+c.k); vals[c.k]= saved&&saved[c.k]!=null? saved[c.k] : presetVal(c,1); el.value=vals[c.k]; el.addEventListener('input',function(){ vals[c.k]=+el.value||0; recompute(); }); });
  })();

  function activePreset(){ var a=document.querySelector('#presets .preset.active'); return a?a.getAttribute('data-p'):'typ'; }
  function applyPreset(p){
    CATS.forEach(function(c){ var v = p==='zero'?0:presetVal(c,MULT[p]||1); vals[c.k]=v; var el=$('cat-'+c.k); if(el) el.value=v; });
    recompute();
  }
  document.querySelectorAll('#presets .preset').forEach(function(b){
    function sel(){ document.querySelectorAll('#presets .preset').forEach(function(x){x.classList.remove('active');}); b.classList.add('active'); applyPreset(b.getAttribute('data-p')); }
    b.addEventListener('click',sel); b.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); sel(); } });
  });

  /* allocation rows */
  (function(){
    var box=$('allocList'); if(!box) return;
    var saved=A.getJSON?A.getJSON('alloc',null):null;
    box.innerHTML=BUCKETS.map(function(b){ var v= saved&&saved[b.k]!=null? saved[b.k]:b.def; alloc[b.k]=v; return '<div class="slider-row"><div class="lab"><label for="al-'+b.k+'">'+b.label+'</label><output id="o-al-'+b.k+'">'+v+'%</output></div><input type="range" id="al-'+b.k+'" min="0" max="100" step="5" value="'+v+'"></div>'; }).join('');
    BUCKETS.forEach(function(b){ var el=$('al-'+b.k); el.addEventListener('input',function(){ alloc[b.k]=+el.value; var o=$('o-al-'+b.k); if(o)o.textContent=el.value+'%'; recompute(); }); });
  })();

  function monthly(){ var s=0; CATS.forEach(function(c){ s+=vals[c.k]||0; }); return s; }

  function drawGrowth(monthlyInvest, ratePct, years){
    var svg=$('growth'); if(!svg) return {contrib:0,final:0};
    var W=560,H=220,padL=58,padB=26,padT=10,padR=10;
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
    svg.setAttribute('viewBox','0 0 '+W+' '+H); svg.innerHTML=g;
    return {contrib:contrib, final:bal};
  }

  function recompute(){
    document.querySelectorAll('.catrow .cur').forEach(function(e){ e.setAttribute('data-sym',country.cur); });
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
    if(A.set){ A.set('country',country.code); A.set('rate',String(rate)); A.set('years',String(years)); }
  }
  ['rate','years'].forEach(function(id){ var el=$(id); if(el) el.addEventListener('input',recompute); });
  var sr=A.get?A.get('rate',''):''; if(sr&&$('rate'))$('rate').value=sr;
  var sy=A.get?A.get('years',''):''; if(sy&&$('years'))$('years').value=sy;
  updateNote(); recompute();

  (function(){
    var Q=[{a:1},{a:1},{a:0},{a:1}], E=['These are rough, editable estimates that vary enormously by country and lifestyle.','Treat the long-run total as an upper bound — life rarely frees the full amount.','Compound growth means your returns also earn returns over time.','Money is one dimension among many; a bigger number settles nothing about the choice.'];
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
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear your reflection?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
    if(cp) cp.addEventListener('click',function(){ var L=['Childfree budget — my numbers ('+country.name+', '+country.cur.trim()+')','','Monthly freed: '+($('figMonth')?$('figMonth').textContent:''),'Per year: '+($('figYear')?$('figYear').textContent:''),'Freedom fund / month: '+($('allocInvest')?$('allocInvest').textContent:''),'Projected balance: '+($('figFinal')?$('figFinal').textContent:''),'','What I\'d want it to make possible:','  '+((ta&&ta.value.trim())?ta.value.trim():'(blank)')]; if(A.copy) A.copy(L.join('\n'),cp); });
  })();
} catch(e){ console.error('project 011 script error', e); }
});
