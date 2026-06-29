/* Project 018 · Marriage & Children Conversation Tool — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var QS=[
    {k:'want',short:'Wanting kids',q:'Do you want to have children?',opts:['Strongly no','Lean no','Unsure','Lean yes','Strongly yes']},
    {k:'timing',short:'Timing',q:'If yes, when?',opts:['Never','Far off / maybe','Someday, unsure','Within a few years','Soon']},
    {k:'number',short:'How many',q:'Ideally, how many children?',opts:['None','One, maybe','One or two','Two','Three or more']},
    {k:'care',short:'Caregiving',q:'How should caregiving be shared?',opts:['I\'d do little','Mostly partner','50/50','Mostly me','I\'d do most']},
    {k:'career',short:'Careers',q:'Whose career flexes around a child?',opts:['Mine fully','Mine mostly','Both equally','Partner\'s mostly','Partner\'s fully']},
    {k:'fertility',short:'If it\'s hard',q:'If conceiving were difficult, how far would you go?',opts:['Not at all','Adopt only','Some treatment','Most options','Whatever it takes']},
    {k:'firmness',short:'How settled',q:'How settled is your view right now?',opts:['Completely settled','Mostly settled','Genuinely open','Mostly settled (other way)','Completely settled (other way)']}
  ];
  var st = (A.getJSON?A.getJSON('couple',{}):{}) || {};
  (function(){
    var box=$('questions'); if(!box) return;
    box.innerHTML=QS.map(function(q){
      function sel(side){ var v=st[q.k]&&st[q.k][side]!=null?st[q.k][side]:2; return '<select data-k="'+q.k+'" data-s="'+side+'">'+q.opts.map(function(o,i){ return '<option value="'+i+'"'+(i===v?' selected':'')+'>'+esc(o)+'</option>'; }).join('')+'</select>'; }
      return '<div class="qblock" data-k="'+q.k+'"><p class="q">'+esc(q.q)+'</p><div class="pair"><div><div class="who" id="whoA-'+q.k+'">Partner A</div>'+sel('a')+'</div><div><div class="who" id="whoB-'+q.k+'">Partner B</div>'+sel('b')+'</div></div><div class="gap" id="gap-'+q.k+'"></div></div>';
    }).join('');
    box.querySelectorAll('select').forEach(function(s){ s.addEventListener('change',function(){ var k=s.getAttribute('data-k'); st[k]=st[k]||{}; st[k][s.getAttribute('data-s')]=+s.value; if(A.setJSON) A.setJSON('couple',st); recompute(); }); });
  })();

  function names(){ var a=($('nameA')&&$('nameA').value.trim())||'Partner A'; var b=($('nameB')&&$('nameB').value.trim())||'Partner B'; return [a,b]; }

  function recompute(){
    var nm=names();
    QS.forEach(function(q){ var wa=$('whoA-'+q.k), wb=$('whoB-'+q.k); if(wa)wa.textContent=nm[0]; if(wb)wb.textContent=nm[1]; });
    var items=[], gaps=[];
    QS.forEach(function(q){
      var a=st[q.k]&&st[q.k].a!=null?st[q.k].a:2, b=st[q.k]&&st[q.k].b!=null?st[q.k].b:2;
      var gap=Math.abs(a-b), agree=Math.round((1-gap/4)*100);
      items.push({label:q.short,value:agree});
      var g=$('gap-'+q.k);
      if(g){ if(gap===0){ g.className='gap agree'; g.textContent='✓ You\'re aligned here.'; } else { g.className='gap diff'; g.textContent='△ Gap of '+gap+': '+nm[0]+' says "'+q.opts[a]+'", '+nm[1]+' says "'+q.opts[b]+'".'; } }
      if(gap>=2) gaps.push({q:q,a:a,b:b,gap:gap});
    });
    var overall=Math.round(items.reduce(function(s,i){return s+i.value;},0)/items.length);
    if($('alignPct')) $('alignPct').textContent=overall+'%';
    if(A.radar) A.radar($('radar'),items);
    var db=$('diffs');
    if(db){
      gaps.sort(function(x,y){return y.gap-x.gap;});
      if(!gaps.length){ db.innerHTML='<p class="note">No major gaps right now — you\'re closely aligned across the board. Use the agenda below to confirm and plan together.</p>'; }
      else { db.innerHTML='<p class="note">Your biggest differences, worth gentle conversation:</p>'+gaps.map(function(x){ return '<div class="diffrow"><b>'+esc(x.q.short)+':</b> '+nm[0]+' leans "'+esc(x.q.opts[x.a])+'", '+nm[1]+' leans "'+esc(x.q.opts[x.b])+'". Treat this as a shared puzzle, not a contest — and if it\'s the "wanting kids" or "how settled" question, take section ⑤ seriously.</div>'; }).join(''); }
    }
  }
  ['nameA','nameB'].forEach(function(id){ var el=$(id); if(el){ var s=A.get?A.get(id,''):''; if(s)el.value=s; el.addEventListener('input',function(){ A.set&&A.set(id,el.value); recompute(); }); } });
  recompute();

  /* agenda notes + reflection */
  (function(){
    var notes=$('notes'), status=$('saveStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(notes&&A.get){ notes.value=A.get('notes',''); notes.addEventListener('input',function(){ A.set('notes',notes.value); }); }
    var s=$('saveBtn'),cp=$('copyBtn');
    if(s) s.addEventListener('click',function(){ if(notes&&A.set)A.set('notes',notes.value); flash('Saved ✓'); });
    if(cp) cp.addEventListener('click',function(){ var nm=names(); var L=['Children conversation — our map','','Overall alignment: '+($('alignPct')?$('alignPct').textContent:''),'']; QS.forEach(function(q){ var a=st[q.k]&&st[q.k].a!=null?st[q.k].a:2,b=st[q.k]&&st[q.k].b!=null?st[q.k].b:2; L.push(q.short+': '+nm[0]+'="'+q.opts[a]+'", '+nm[1]+'="'+q.opts[b]+'"'+(a===b?' ✓':' △')); }); if(notes&&notes.value.trim()){ L.push('','Notes:',notes.value.trim()); } if(A.copy) A.copy(L.join('\n'),cp); });
  })();
  (function(){
    var ta=$('r1'), status=$('rStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 018 script error', e); }
});
