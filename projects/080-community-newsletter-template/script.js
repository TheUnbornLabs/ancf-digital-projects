/* Project 080 · Community Newsletter Template — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var SECTIONS=[
    {id:'greeting',title:'👋 Warm greeting',label:'A friendly hello to open',ph:'Hello everyone, and welcome to this issue…',area:true},
    {id:'highlight',title:'✨ Highlight',label:'Something to celebrate since last time',ph:'This month we…',area:true},
    {id:'next',title:'🗓️ What\'s next',label:'Upcoming events or plans',ph:'Coming up: our next meetup on…',area:true},
    {id:'spotlight',title:'🌟 Member spotlight',label:'A member to celebrate (with their consent)',ph:'This issue we\'re shining a light on…',area:true},
    {id:'resource',title:'🔗 Useful resource',label:'A link, tool, or read worth sharing',ph:'Worth a look: …',area:false},
    {id:'signoff',title:'💛 Sign-off',label:'A kind closing line',ph:'Until next time — take care of yourselves.',area:false}
  ];
  var st=(A.getJSON?A.getJSON('news',null):null)||{name:'',issue:'',on:{},text:{}};
  if(!Object.keys(st.on).length){ SECTIONS.forEach(function(s){ st.on[s.id]=true; }); }
  function save(){ if(A.setJSON)A.setJSON('news',st); }
  function renderSections(){ var box=$('sections'); if(!box) return;
    box.innerHTML=SECTIONS.map(function(s){ var on=st.on[s.id]!==false; var v=st.text[s.id]||'';
      var field=s.area?('<textarea data-t="'+s.id+'" rows="2" placeholder="'+esc(s.ph)+'">'+esc(v)+'</textarea>'):('<input type="text" data-t="'+s.id+'" placeholder="'+esc(s.ph)+'" value="'+esc(v)+'">');
      return '<div class="sec'+(on?'':' disabled')+'" data-sec="'+s.id+'"><div class="sechead"><input type="checkbox" data-on="'+s.id+'" '+(on?'checked':'')+'><label>'+esc(s.title)+'</label><span class="off">'+(on?'included':'hidden')+'</span></div><span class="lab">'+esc(s.label)+'</span>'+field+'</div>'; }).join('');
    box.querySelectorAll('[data-on]').forEach(function(c){ c.addEventListener('change',function(){ st.on[c.getAttribute('data-on')]=c.checked; save(); renderSections(); build(); }); });
    box.querySelectorAll('[data-t]').forEach(function(el){ el.addEventListener('input',function(){ st.text[el.getAttribute('data-t')]=el.value; save(); build(); }); });
  }
  function build(){
    var L=[]; var name=st.name||'Community Newsletter';
    L.push('═══ '+name.toUpperCase()+' ═══'); if(st.issue) L.push(st.issue); L.push('');
    SECTIONS.forEach(function(s){ if(st.on[s.id]===false) return; var v=(st.text[s.id]||'').trim(); if(!v) return; L.push(s.title); L.push(v); L.push(''); });
    var t=L.join('\n').trim(); $('out').textContent=t|| 'Fill in a few sections to see your newsletter here.';
  }
  var nn=$('nName'); if(nn){ nn.value=st.name||''; nn.addEventListener('input',function(){ st.name=nn.value; save(); build(); }); }
  var ni=$('nIssue'); if(ni){ ni.value=st.issue||''; ni.addEventListener('input',function(){ st.issue=ni.value; save(); build(); }); }
  $('buildBtn').addEventListener('click',build);
  $('copyBtn').addEventListener('click',function(){ if(A.copy) A.copy($('out').textContent,$('copyBtn')); });
  renderSections(); build();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 080 script error', e); }
});
