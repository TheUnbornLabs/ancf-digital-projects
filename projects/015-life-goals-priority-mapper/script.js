/* Project 015 · Life-Goals Priority Mapper — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var goals = (A.getJSON?A.getJSON('goals',[]):[]) || [];
  function save(){ if(A.setJSON) A.setJSON('goals',goals); }
  var inp=$('goalInput'), addB=$('goalAdd'), list=$('goalList');

  function renderList(){
    if(!goals.length){ list.innerHTML='<p class="empty">No goals yet — add a few above to build your map.</p>'; return; }
    list.innerHTML=goals.map(function(g){
      return '<div class="gitem" data-id="'+g.id+'"><span class="gt">'+esc(g.text)+'</span>'+
        '<select class="h"><option value="now"'+(g.horizon==='now'?' selected':'')+'>Now</option><option value="soon"'+(g.horizon==='soon'?' selected':'')+'>Soon</option><option value="someday"'+(g.horizon==='someday'?' selected':'')+'>Someday</option></select>'+
        '<select class="i"><option value="1"'+(g.imp===1?' selected':'')+'>Imp: low</option><option value="2"'+(g.imp===2?' selected':'')+'>Imp: med</option><option value="3"'+(g.imp===3?' selected':'')+'>Imp: high</option></select>'+
        '<select class="e"><option value="1"'+(g.eff===1?' selected':'')+'>Eff: low</option><option value="2"'+(g.eff===2?' selected':'')+'>Eff: med</option><option value="3"'+(g.eff===3?' selected':'')+'>Eff: high</option></select>'+
        '<button class="del" type="button" aria-label="Delete">×</button></div>';
    }).join('');
    list.querySelectorAll('.gitem').forEach(function(el){
      var id=+el.getAttribute('data-id'), g=goals.filter(function(x){return x.id===id;})[0];
      el.querySelector('.h').addEventListener('change',function(){ g.horizon=this.value; save(); renderMap(); });
      el.querySelector('.i').addEventListener('change',function(){ g.imp=+this.value; save(); renderMap(); });
      el.querySelector('.e').addEventListener('change',function(){ g.eff=+this.value; save(); renderMap(); });
      el.querySelector('.del').addEventListener('click',function(){ goals=goals.filter(function(x){return x.id!==id;}); save(); renderList(); renderMap(); });
    });
  }

  function renderMap(){
    var H={now:[],soon:[],someday:[]};
    goals.forEach(function(g){ (H[g.horizon]||H.someday).push(g); });
    var hbox=$('horizons');
    if(hbox){ var cols=[['now','Now'],['soon','Soon'],['someday','Someday']];
      hbox.innerHTML=cols.map(function(c){ var items=H[c[0]]; return '<div class="hcol"><h4>'+c[1]+' ('+items.length+')</h4>'+(items.length?items.map(function(g){return '<span class="chip">'+esc(g.text)+'</span>';}).join(''):'<p class="empty">—</p>')+'</div>'; }).join('');
    }
    // matrix quadrants
    var q={q1:[],q2:[],q3:[],q4:[]};
    goals.forEach(function(g){ var hi=g.imp>=2, he=g.eff>=2; if(hi&&!he)q.q1.push(g); else if(hi&&he)q.q2.push(g); else if(!hi&&!he)q.q3.push(g); else q.q4.push(g); });
    var mbox=$('matrix');
    if(mbox){
      function cell(cls,title,sub,arr){ return '<div class="qcell '+cls+'"><h4>'+title+'</h4><p class="sub">'+sub+'</p>'+(arr.length?arr.map(function(g){return '<span class="chip">'+esc(g.text)+'</span>';}).join(''):'<span class="empty">—</span>')+'</div>'; }
      mbox.innerHTML= cell('q1','Quick wins','High value, low effort — do first',q.q1)+cell('q2','Big bets','High value, high effort — plan &amp; protect',q.q2)+cell('q3','Nice-to-haves','Low value, low effort — fit in spare moments',q.q3)+cell('q4','Reconsider','Low value, high effort — question before committing',q.q4);
    }
    renderFocus(q,H);
  }

  function renderFocus(q,H){
    var box=$('focusBox'); if(!box) return;
    if(!goals.length){ box.innerHTML='Add some goals and set their importance, effort, and horizon — a suggested starting order will appear here.'; return; }
    // priority: Now + quick wins first, then Now big bets, then quick wins anywhere
    var ranked=goals.slice().sort(function(a,b){
      var sa=(a.horizon==='now'?3:a.horizon==='soon'?1:0)+a.imp*2-(a.eff-1);
      var sb=(b.horizon==='now'?3:b.horizon==='soon'?1:0)+b.imp*2-(b.eff-1);
      return sb-sa;
    });
    var top=ranked.slice(0,3);
    var html='<b>Where to start:</b> based on your weights, these earn your attention first — high value, soon, and not blocked by huge effort.<ol>';
    top.forEach(function(g){ html+='<li>'+esc(g.text)+'</li>'; });
    html+='</ol>';
    if(q.q4.length) html+='<p class="note" style="margin:8px 0 0">Worth a second look before you invest: <b>'+q.q4.map(function(g){return esc(g.text);}).join(', ')+'</b> — high effort for the value you gave them.</p>';
    box.innerHTML=html;
  }

  function add(){ var v=(inp.value||'').trim(); if(!v) return; goals.push({id:Date.now()+Math.floor(Math.random()*999),text:v,horizon:'soon',imp:2,eff:2}); inp.value=''; save(); renderList(); renderMap(); inp.focus(); }
  if(addB) addB.addEventListener('click',add);
  if(inp) inp.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); add(); } });
  renderList(); renderMap();

  (function(){
    var Q=[{a:0},{a:1},{a:1}], E=['A quick win is high importance and low effort — the best place to start.','Horizons separate what deserves energy now from what can wait.','High effort for low value is worth reconsidering before you commit.'];
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
    if(cl) cl.addEventListener('click',function(){ if(goals.length&&!window.confirm('Clear all goals on this device?'))return; goals=[]; save(); renderList(); renderMap(); flash('Cleared.'); });
    if(cp) cp.addEventListener('click',function(){ var L=['My goals map','']; ['now','soon','someday'].forEach(function(h){ var items=goals.filter(function(g){return g.horizon===h;}); L.push(h.toUpperCase()+':'); items.forEach(function(g){ L.push('  • '+g.text+' (imp '+g.imp+', eff '+g.eff+')'); }); if(!items.length)L.push('  (none)'); L.push(''); }); if(ta&&ta.value.trim()){ L.push('Reflection:',ta.value.trim()); } if(A.copy) A.copy(L.join('\n'),cp); });
  })();
} catch(e){ console.error('project 015 script error', e); }
});
