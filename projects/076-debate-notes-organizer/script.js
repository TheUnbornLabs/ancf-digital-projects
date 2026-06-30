/* Project 076 · Debate Notes Organizer — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var BOXES=[
    {id:'claims',cls:'b1',title:'Your claims',hint:'What you actually want to argue.'},
    {id:'theirs',cls:'b2',title:'Their strongest points',hint:'Steelman it — the best version of the other side.'},
    {id:'evidence',cls:'b3',title:'Evidence & sources',hint:'Facts, studies, examples you can point to.'},
    {id:'common',cls:'b4',title:'Common ground',hint:'Where you and they genuinely agree.'}
  ];
  var st=(A.getJSON?A.getJSON('notes',null):null)||{topic:'',claims:[],theirs:[],evidence:[],common:[]};
  function save(){ if(A.setJSON)A.setJSON('notes',st); }
  function renderBoxes(){ var box=$('boxes'); if(!box) return;
    box.innerHTML=BOXES.map(function(b){ var items=st[b.id]||[];
      return '<div class="box '+b.cls+'"><h4>'+esc(b.title)+'</h4><p class="hint">'+esc(b.hint)+'</p><div class="list" data-list="'+b.id+'">'+
        (items.length?items.map(function(t,i){ return '<div class="li"><span>'+esc(t)+'</span><button type="button" data-id="'+b.id+'" data-i="'+i+'" aria-label="Remove">×</button></div>'; }).join(''):'<p class="note" style="margin:0">Nothing yet.</p>')+
        '</div><div class="add"><input type="text" data-add="'+b.id+'" placeholder="Add…"><button type="button" class="btn" data-addbtn="'+b.id+'">+</button></div></div>'; }).join('');
    box.querySelectorAll('[data-addbtn]').forEach(function(btn){ btn.addEventListener('click',function(){ addItem(btn.getAttribute('data-addbtn')); }); });
    box.querySelectorAll('[data-add]').forEach(function(inp){ inp.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); addItem(inp.getAttribute('data-add')); } }); });
    box.querySelectorAll('.li button').forEach(function(b){ b.addEventListener('click',function(){ st[b.getAttribute('data-id')].splice(+b.getAttribute('data-i'),1); save(); renderBoxes(); build(); }); });
  }
  function addItem(id){ var inp=document.querySelector('[data-add="'+id+'"]'); var v=(inp.value||'').trim(); if(!v) return; st[id].push(v); inp.value=''; save(); renderBoxes(); build();
    var ni=document.querySelector('[data-add="'+id+'"]'); if(ni) ni.focus(); }
  function build(){
    var L=['DEBATE PREP — '+(st.topic||'(topic)'),'================',''];
    BOXES.forEach(function(b){ L.push(b.title.toUpperCase()+':'); var items=st[b.id]||[]; if(!items.length) L.push('  (none yet)'); else items.forEach(function(t,i){ L.push('  '+(i+1)+'. '+t); }); L.push(''); });
    $('out').textContent=L.join('\n');
    var bal=$('balance'); if(bal){ var theirs=(st.theirs||[]).length, common=(st.common||[]).length;
      bal.textContent= theirs===0?'Tip: the "their strongest points" box is empty — fill it. You\'re not ready until you can argue their side.': common===0?'Good start. Try adding at least one piece of common ground — it changes the whole tone.':'Well balanced: you\'ve got your case, their best case, and shared ground. That\'s ready.'; }
  }
  var tp=$('topic'); if(tp){ tp.value=st.topic||''; tp.addEventListener('input',function(){ st.topic=tp.value; save(); build(); }); }
  $('exportBtn').addEventListener('click',build);
  $('copyBtn').addEventListener('click',function(){ if(A.copy) A.copy($('out').textContent,$('copyBtn')); });
  $('resetBtn').addEventListener('click',function(){ if(!window.confirm('Reset all notes?'))return; st={topic:'',claims:[],theirs:[],evidence:[],common:[]}; save(); if(tp)tp.value=''; renderBoxes(); build(); });
  renderBoxes(); build();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 076 script error', e); }
});
