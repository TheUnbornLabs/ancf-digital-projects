/* Project 012 · Parenthood Cost Estimator — interactive logic (country-aware) */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; var CC=window.ANCFCountries; function $(id){return document.getElementById(id);}
  var country = CC ? CC.get(A.get?A.get('country','IN'):'IN') : {cur:'$',locale:'en-US',b012:18000,note:'',name:'India'};
  function fmt(n){ return CC?CC.fmt(country,n):('$'+Math.round(n)); }
  // phase: key,label,years, factor (typical ANNUAL = country.b012 * factor; preg is one-time over 1y)
  var PH=[
    {k:'preg',label:'Pregnancy & birth',sub:'one-time',years:1,f:0.40},
    {k:'baby',label:'Baby (0–1)',sub:'1 year',years:1,f:0.90},
    {k:'tod',label:'Toddler (1–4)',sub:'3 years',years:3,f:0.95},
    {k:'child',label:'Child (5–11)',sub:'7 years',years:7,f:1.00},
    {k:'teen',label:'Teen (12–17)',sub:'6 years',years:6,f:1.20},
    {k:'ya',label:'Young adult (18–22)',sub:'optional support',years:5,f:0.80}
  ];
  var MULT={lean:0.6,typ:1,gen:1.8};
  var vals={};
  function presetVal(p,mult){ return Math.round(country.b012*p.f*mult/100)*100; }

  (function(){ var sel=$('country'); if(!sel||!CC) return;
    sel.innerHTML=CC.list.map(function(c){ return '<option value="'+c.code+'"'+(c.code===country.code?' selected':'')+'>'+c.name+' ('+c.cur.trim()+')</option>'; }).join('');
    sel.addEventListener('change',function(){ country=CC.get(sel.value); if(A.set)A.set('country',country.code); applyPreset(activePreset()); updateNote(); });
  })();
  function updateNote(){ var n=$('ctxNote'); if(n) n.innerHTML='<b>'+country.name+':</b> '+(country.note||'')+' Figures are rough '+country.cur.trim()+' starting points — enter your own.'; }

  (function(){
    var box=$('phaseRows'); if(!box) return;
    box.innerHTML=PH.map(function(p){ return '<div class="phaserow"><span class="meta">'+p.label+'<small>'+p.sub+'</small></span><span class="cur" data-sym="'+country.cur+'"><input type="number" id="ph-'+p.k+'" min="0" step="100" value="0"></span></div>'; }).join('');
    var saved=A.getJSON?A.getJSON('phases',null):null;
    PH.forEach(function(p){ var el=$('ph-'+p.k); vals[p.k]= saved&&saved[p.k]!=null? saved[p.k]:presetVal(p,1); el.value=vals[p.k]; el.addEventListener('input',function(){ vals[p.k]=+el.value||0; recompute(); }); });
  })();

  function activePreset(){ var a=document.querySelector('#presets .preset.active'); return a?a.getAttribute('data-p'):'typ'; }
  function applyPreset(p){ PH.forEach(function(ph){ var v=p==='zero'?0:presetVal(ph,MULT[p]||1); vals[ph.k]=v; var el=$('ph-'+ph.k); if(el)el.value=v; }); recompute(); }
  document.querySelectorAll('#presets .preset').forEach(function(b){ function sel(){ document.querySelectorAll('#presets .preset').forEach(function(x){x.classList.remove('active');}); b.classList.add('active'); applyPreset(b.getAttribute('data-p')); } b.addEventListener('click',sel); b.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();sel();} }); });

  function phaseTotal(p){ return (vals[p.k]||0)*p.years; }

  function drawCumulative(){
    var svg=$('growth'); if(!svg) return;
    var W=560,H=220,padL=58,padB=26,padT=10,padR=10;
    var pts=[]; var cum=0;
    for(var age=0;age<=22;age++){ PH.forEach(function(p){ if(p.k==='preg'){ if(age===0) cum+=phaseTotal(p); } else { var rng={baby:[0,1],tod:[1,4],child:[4,11],teen:[11,17],ya:[17,22]}[p.k]; if(rng && age>rng[0] && age<=rng[1]) cum+=(vals[p.k]||0); } }); pts.push({age:age,cum:cum}); }
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
    document.querySelectorAll('.phaserow .cur').forEach(function(e){ e.setAttribute('data-sym',country.cur); });
    var to18=0,to22=0; PH.forEach(function(p){ var t=phaseTotal(p); to22+=t; if(p.k!=='ya') to18+=t; });
    if($('figTotal')) $('figTotal').textContent=fmt(to18);
    if($('figTo22')) $('figTo22').textContent=fmt(to22);
    if($('figPerYr')) $('figPerYr').textContent=fmt(to18/18);
    drawCumulative(); drawBreakdown();
    if(A.setJSON) A.setJSON('phases',vals); if(A.set) A.set('country',country.code);
  }
  updateNote(); recompute();

  (function(){
    var Q=[{a:1},{a:1},{a:0},{a:0}], E=['Editable estimates that vary enormously by country, system, and choices.','Money is one factor among many; a total settles nothing about the choice.','Childcare and education are usually the heaviest, and the most location-dependent.','Use it to plan with your own numbers — not to judge, and not as a precise forecast.'];
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
    if(cp) cp.addEventListener('click',function(){ var L=['Parenthood cost estimate ('+country.name+', '+country.cur.trim()+')','','To age 18: '+($('figTotal')?$('figTotal').textContent:''),'To ~22: '+($('figTo22')?$('figTo22').textContent:''),'Avg/year: '+($('figPerYr')?$('figPerYr').textContent:''),'','Note: '+((ta&&ta.value.trim())?ta.value.trim():'(blank)')]; if(A.copy) A.copy(L.join('\n'),cp); });
  })();
} catch(e){ console.error('project 012 script error', e); }
});
