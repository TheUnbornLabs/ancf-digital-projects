/* Project 013 · Time-Freedom Calculator — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  var CATS=[
    {k:'sleep',label:'Sleep',def:56,color:'#2f6b73'},
    {k:'work',label:'Paid work',def:40,color:'#b3122a'},
    {k:'commute',label:'Commute',def:5,color:'#c0612a'},
    {k:'chores',label:'Chores & errands',def:14,color:'#7a52b4'},
    {k:'care_self',label:'Personal care',def:10,color:'#5ab07a'},
    {k:'eat',label:'Eating & cooking',def:12,color:'#b4a000'},
    {k:'other',label:'Other commitments',def:7,color:'#5a5a66'}
  ];
  var vals={};
  (function(){
    var box=$('sliders'); if(!box) return;
    var saved=A.getJSON?A.getJSON('week',null):null;
    box.innerHTML=CATS.map(function(c){ var v=saved&&saved[c.k]!=null?saved[c.k]:c.def; vals[c.k]=v; return '<div class="slider-row"><div class="lab"><label for="t-'+c.k+'">'+c.label+'</label><output id="o-t-'+c.k+'">'+v+' h</output></div><input type="range" id="t-'+c.k+'" min="0" max="80" step="1" value="'+v+'"></div>'; }).join('');
    CATS.forEach(function(c){ var el=$('t-'+c.k); el.addEventListener('input',function(){ vals[c.k]=+el.value; var o=$('o-t-'+c.k); if(o)o.textContent=el.value+' h'; recompute(); }); });
    var lg=$('legend'); if(lg) lg.innerHTML=CATS.map(function(c){ return '<span><i style="background:'+c.color+'"></i>'+c.label+'</span>'; }).join('')+'<span><i style="background:#1c7a3e"></i>Discretionary</span>';
  })();
  function committed(){ var s=0; CATS.forEach(function(c){ s+=vals[c.k]||0; }); return s; }
  function ideasFor(hours){
    var list=[];
    if(hours>=10) list.push('Read ~'+Math.round(hours/8)+' books');
    if(hours>=120) list.push('Learn a language to conversational level');
    if(hours>=40) list.push(Math.round(hours/3)+' fitness sessions');
    if(hours>=500) list.push('Build real skill at an instrument or craft');
    if(hours>=2000) list.push('The rough equivalent of a part-time degree');
    list.push('Countless unhurried hours with people you love');
    return list;
  }
  function recompute(){
    var com=committed(), disc=Math.max(0,168-com);
    var bar=$('weekbar');
    if(bar){ var total=Math.max(168,com); var seg=CATS.map(function(c){ return '<span style="width:'+((vals[c.k]||0)/total*100)+'%;background:'+c.color+'">'+((vals[c.k]||0)>=8?(vals[c.k]):'')+'</span>'; }).join(''); seg+='<span style="width:'+(disc/total*100)+'%;background:#1c7a3e">'+(disc>=8?disc:'')+'</span>'; bar.innerHTML=seg; }
    if($('figCommitted')) $('figCommitted').textContent=com+' h';
    if($('figDisc')) $('figDisc').textContent=disc+' h';
    if($('figDay')) $('figDay').textContent=(disc/7).toFixed(1)+' h';
    var db=$('discBox'); if(db) db.classList.toggle('warn',disc<14);
    if($('weekNote')) $('weekNote').textContent = com>168 ? 'Your committed hours exceed 168 — that\'s the overcommitment so many people feel. Something has to give.' : (disc<14? 'Under ~2 discretionary hours a day. That\'s a tight week; protecting even a little can change how it feels.' : 'You have about '+(disc/7).toFixed(1)+' free hours a day to direct as you choose.');
    // caregiving compare
    var care=+($('care')?$('care').value:0); if($('o-care')) $('o-care').textContent=care+' h';
    var discCare=Math.max(0,disc-care);
    if($('cmpNow')) $('cmpNow').textContent=disc+' h'; if($('cmpCare')) $('cmpCare').textContent=discCare+' h';
    if($('careNote')) $('careNote').textContent = care>0 ? 'Adding '+care+' caregiving hours/week leaves '+discCare+' discretionary hours — a drop of '+(disc>0?Math.round((care/disc)*100):0)+'% from your free time. Many find it worth every hour; the point here is only to see the trade honestly.' : '';
    // projection (use discCare as the realistic discretionary going forward)
    var years=+($('years')?$('years').value:10); if($('o-years')) $('o-years').textContent=years+' yrs';
    var perYear=discCare*52, totalH=perYear*years;
    if($('figYearH')) $('figYearH').textContent=Math.round(perYear).toLocaleString('en-US')+' h';
    if($('figTotalH')) $('figTotalH').textContent=Math.round(totalH).toLocaleString('en-US')+' h';
    if($('figDays')) $('figDays').textContent=Math.round(totalH/24).toLocaleString('en-US');
    var id=$('ideas'); if(id) id.innerHTML=ideasFor(totalH).map(function(x){ return '<span class="idea">'+x+'</span>'; }).join('');
    if(A.setJSON) A.setJSON('week',vals); if(A.set){ A.set('care',String(care)); A.set('years',String(years)); }
  }
  ['care','years'].forEach(function(id){ var el=$(id); if(el){ var s=A.get?A.get(id,''):''; if(s)el.value=s; el.addEventListener('input',recompute); } });
  recompute();

  (function(){
    var Q=[{a:1},{a:1},{a:1}], E=['A week is 168 hours (24×7).','Discretionary time is what remains after every non-negotiable, caregiving included.','Small weekly differences compound into very large totals over years.'];
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
    if(cp) cp.addEventListener('click',function(){ var L=['My week (168 h)','','Committed: '+($('figCommitted')?$('figCommitted').textContent:''),'Discretionary: '+($('figDisc')?$('figDisc').textContent:''),'With caregiving added: '+($('cmpCare')?$('cmpCare').textContent:''),'','I\'d spend protected hours on:','  '+((ta&&ta.value.trim())?ta.value.trim():'(blank)')]; if(A.copy) A.copy(L.join('\n'),cp); });
  })();
} catch(e){ console.error('project 013 script error', e); }
});
