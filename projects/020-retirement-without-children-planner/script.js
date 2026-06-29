/* Project 020 · Retirement Without Children Planner — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  var sym='$'; function fmt(n){ n=Math.round(n); return sym+n.toLocaleString('en-US'); }
  function num(id,def){ var e=$(id); var v=e?parseFloat(e.value):def; return isNaN(v)?def:v; }

  function drawProj(months, P0, c, rMonthly, target){
    var svg=$('growth'); if(!svg) return {final:P0,contrib:P0};
    var W=560,H=220,padL=52,padB=26,padT=10,padR=10;
    var pts=[],bal=P0,contrib=P0;
    for(var m=0;m<=months;m++){ if(m>0){ bal=bal*(1+rMonthly)+c; contrib+=c; } pts.push(bal); }
    var max=Math.max(pts[pts.length-1]||1, target||0)||1;
    function X(m){ return padL+(m/Math.max(1,months))*(W-padL-padR); }
    function Y(v){ return (H-padB)-(v/max)*(H-padB-padT); }
    var d='',area='M'+padL+' '+(H-padB);
    pts.forEach(function(v,i){ var x=X(i),y=Y(v); d+=(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)+' '; area+='L'+x.toFixed(1)+' '+y.toFixed(1)+' '; });
    area+='L'+X(months).toFixed(1)+' '+(H-padB)+' Z';
    var g='<line class="g-axis" x1="'+padL+'" y1="'+(H-padB)+'" x2="'+(W-padR)+'" y2="'+(H-padB)+'"></line><line class="g-axis" x1="'+padL+'" y1="'+padT+'" x2="'+padL+'" y2="'+(H-padB)+'"></line>';
    g+='<path class="g-area" d="'+area+'"></path><path class="g-line" d="'+d+'"></path>';
    if(target>0){ var ty=Y(target); g+='<line class="g-target" x1="'+padL+'" y1="'+ty.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+ty.toFixed(1)+'"></line><text class="g-lbl" x="'+(W-padR)+'" y="'+(ty-4).toFixed(1)+'" text-anchor="end">target</text>'; }
    g+='<text class="g-lbl" x="'+padL+'" y="'+(H-8)+'">now</text><text class="g-lbl" x="'+(W-padR)+'" y="'+(H-8)+'" text-anchor="end">retirement</text>';
    g+='<text class="g-lbl" x="'+(padL-4)+'" y="'+(padT+10)+'" text-anchor="end">'+fmt(max)+'</text>';
    svg.setAttribute('viewBox','0 0 '+W+' '+H); svg.innerHTML=g;
    return {final:bal, contrib:contrib};
  }

  function recompute(){
    var c=$('cur'); if(c) sym=c.value; document.querySelectorAll('.inputs .cur').forEach(function(e){ e.setAttribute('data-sym',sym); });
    var age=num('age',35), ret=num('ret',65), P0=num('now',0), contrib=num('contrib',0), target=num('target',0), rate=num('rate',6);
    if($('o-rate')) $('o-rate').textContent=rate+'%';
    var years=Math.max(0,ret-age), months=years*12, rM=rate/100/12;
    var res=drawProj(months,P0,contrib,rM,target);
    if($('figContrib')) $('figContrib').textContent=fmt(res.contrib);
    if($('figGrowth')) $('figGrowth').textContent=fmt(Math.max(0,res.final-res.contrib));
    if($('figBal')) $('figBal').textContent=fmt(res.final);
    var bb=$('balBox'); if(bb){ bb.classList.remove('good','short'); if(target>0) bb.classList.add(res.final>=target?'good':'short'); }
    var v=$('verdict');
    if(v){
      if(years<=0){ v.innerHTML='<b>Set your retirement age above your current age</b> to see a projection.'; }
      else if(target<=0){ v.innerHTML='In <b>'+years+' years</b>, steady saving could grow to about <b>'+fmt(res.final)+'</b> — of which roughly <b>'+fmt(Math.max(0,res.final-res.contrib))+'</b> is growth you didn\'t have to earn. Add a target above to check it against a goal.'; }
      else if(res.final>=target){ v.innerHTML='On these assumptions you\'d reach about <b>'+fmt(res.final)+'</b> by '+ret+' — <b>clearing your '+fmt(target)+' target</b> with '+fmt(res.final-target)+' to spare. Real life is bumpier, but the trajectory is sound. Keep going.'; }
      else { var gap=target-res.final; var extra=months>0?(gap*(rM)/ (Math.pow(1+rM,months)-1)):0; v.innerHTML='You\'d reach about <b>'+fmt(res.final)+'</b> — roughly <b>'+fmt(gap)+' short</b> of your '+fmt(target)+' target. Closing it could mean saving about <b>'+fmt(contrib+extra)+'/month</b> instead, retiring a little later, or adjusting the target. A gap seen early is a gap you can close.'; }
    }
    if(A.setJSON) A.setJSON('retire',{age:age,ret:ret,now:P0,contrib:contrib,target:target,rate:rate,sym:sym});
  }
  ['age','ret','now','contrib','target'].forEach(function(id){ var e=$(id); if(e) e.addEventListener('input',recompute); });
  var rt=$('rate'); if(rt) rt.addEventListener('input',recompute);
  var cu=$('cur'); if(cu) cu.addEventListener('change',recompute);
  (function(){ var s=A.getJSON?A.getJSON('retire',null):null; if(s){ ['age','ret','now','contrib','target','rate'].forEach(function(k){ if($(k)&&s[k]!=null)$(k).value=s[k]; }); if(s.sym&&$('cur'))$('cur').value=s.sym; } recompute(); })();

  /* 4 · care network */
  (function(){
    var CARE=[
      {h:'People',items:['Close friends across different ages','Chosen family / a few I can truly rely on','Good relationships with neighbors','An active community, club, or faith group']},
      {h:'Legal & medical',items:['A will and named beneficiaries','A healthcare proxy / power of attorney','An advance directive / living will','A trusted person who knows my wishes']},
      {h:'Money & home',items:['Long-term-care provision or insurance considered','A home that can adapt as I age (or a plan to move)','An emergency fund','Located near healthcare and services']}
    ];
    var grid=$('careGrid'), bar=$('careBar'), note=$('careNote'); if(!grid) return;
    var saved=A.getJSON?A.getJSON('care',{}):{}; saved=saved||{};
    var total=0; CARE.forEach(function(c){ total+=c.items.length; });
    grid.innerHTML=CARE.map(function(c,ci){ return '<div class="carecat"><h4>'+c.h+'</h4>'+c.items.map(function(it,i){ var id='care-'+ci+'-'+i; return '<div class="check"><input type="checkbox" id="'+id+'"'+(saved[id]?' checked':'')+'><label for="'+id+'">'+it+'</label></div>'; }).join('')+'</div>'; }).join('');
    function upd(){ var n=0; grid.querySelectorAll('input[type=checkbox]').forEach(function(b){ if(b.checked)n++; }); var pct=Math.round(n/total*100); if(bar) bar.style.width=pct+'%';
      if(note){ if(n===0) note.textContent='Tick what you have or are building. A strong network is built over years, not bought in a crisis.'; else if(pct<40) note.innerHTML='You\'ve got <b>'+n+' of '+total+'</b> supports in place. Plenty of room to build — pick one to start on this month.'; else if(pct<80) note.innerHTML='<b>'+n+' of '+total+'</b> in place — a solid, growing foundation. The legal pieces (proxy, directive) are quick wins if any are unticked.'; else note.innerHTML='<b>'+n+' of '+total+'</b> — that\'s a genuinely well-built care network. Far more reliable than assuming a child would fill every role.'; }
    }
    grid.querySelectorAll('input[type=checkbox]').forEach(function(b){ b.addEventListener('change',function(){ saved[b.id]=b.checked; if(A.setJSON) A.setJSON('care',saved); upd(); }); });
    upd();
  })();

  /* quiz */
  (function(){
    var Q=[{a:1},{a:1},{a:1}], E=['Children are an unreliable route to care; a deliberate plan beats hoping.','It rests on both resources (money) and relationships (people and services).','It\'s a rough illustration, not financial advice — it ignores tax, inflation, and fees.'];
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
    if(cp) cp.addEventListener('click',function(){ var L=['Retirement-without-children plan ('+sym+')','','Projected at retirement: '+($('figBal')?$('figBal').textContent:''),($('verdict')?$('verdict').textContent.replace(/\s+/g,' ').trim():''),'','My next steps:','  '+((ta&&ta.value.trim())?ta.value.trim():'(blank)')]; if(A.copy) A.copy(L.join('\n'),cp); });
  })();
} catch(e){ console.error('project 020 script error', e); }
});
