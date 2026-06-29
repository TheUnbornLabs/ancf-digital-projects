/* ============================================================
   Project 005 · "Is This My Choice?" — decision-clarity studio
   Vanilla JS. Uses window.ANCF helpers (../../ancf-ui.js).
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A = window.ANCF || {};
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function fireChange(){ try{ document.dispatchEvent(new window.CustomEvent('p5change')); }catch(e){} }

  var VALUES = [
    {id:'freedom',label:'Freedom & autonomy'},{id:'family',label:'Family & closeness'},
    {id:'security',label:'Security & stability'},{id:'growth',label:'Growth & learning'},
    {id:'adventure',label:'Adventure & novelty'},{id:'contribution',label:'Contribution & meaning'},
    {id:'creativity',label:'Creativity'},{id:'connection',label:'Connection & relationships'},
    {id:'health',label:'Health & wellbeing'},{id:'achievement',label:'Career & achievement'},
    {id:'peace',label:'Peace & calm'},{id:'faith',label:'Spirituality / faith'}
  ];
  function valLabel(id){ for(var i=0;i<VALUES.length;i++){ if(VALUES[i].id===id) return VALUES[i].label; } return id; }

  /* ============================================================
     2 · Desire vs pressure map + autonomy reading
     ============================================================ */
  (function(){
    var desire=$('desire'), pressure=$('pressure'), oD=$('o-desire'), oP=$('o-pressure');
    var svg=$('qmap'), autoBar=$('autoBar'), autoPct=$('autoPct'), verdict=$('qVerdict');
    if(!desire||!pressure) return;
    function draw(d,p){
      var x0=44,y0=24,w=288,h=248; // plot box
      var px=x0 + d/100*w;
      var py=y0 + (100-p)/100*h; // high pressure at top
      var midx=x0+w/2, midy=y0+h/2;
      var zones=[
        {x:x0+w*0.75,y:y0+h*0.25,t:'Yours, but tangled'},
        {x:x0+w*0.25,y:y0+h*0.25,t:'Mostly external'},
        {x:x0+w*0.25,y:y0+h*0.78,t:'A quiet "no" / not now'},
        {x:x0+w*0.75,y:y0+h*0.78,t:'Likely your own'}
      ];
      var g='';
      g+='<rect class="q-bg" x="'+x0+'" y="'+y0+'" width="'+w+'" height="'+h+'" rx="10"></rect>';
      g+='<line class="q-line" x1="'+midx+'" y1="'+y0+'" x2="'+midx+'" y2="'+(y0+h)+'"></line>';
      g+='<line class="q-line" x1="'+x0+'" y1="'+midy+'" x2="'+(x0+w)+'" y2="'+midy+'"></line>';
      zones.forEach(function(z){ g+='<text class="q-zone" x="'+z.x+'" y="'+z.y+'" text-anchor="middle">'+z.t+'</text>'; });
      g+='<text class="q-axis" x="'+(x0+w)+'" y="'+(y0+h+18)+'" text-anchor="end">more desire →</text>';
      g+='<text class="q-axis" x="'+x0+'" y="'+(y0+h+18)+'" text-anchor="start">← less</text>';
      g+='<text class="q-lbl" x="14" y="'+(y0+8)+'" text-anchor="start">more</text>';
      g+='<text class="q-lbl" x="14" y="'+(y0+h)+'" text-anchor="start">less</text>';
      g+='<text class="q-axis" x="14" y="'+midy+'" text-anchor="start" transform="rotate(-90 14 '+midy+')">pressure</text>';
      g+='<circle class="q-dot" cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="9"></circle>';
      svg.innerHTML=g;
    }
    function verdictText(d,p,autonomy){
      var hiD=d>=50, hiP=p>=50, s='';
      if(hiD&&!hiP) s='You land in <b>"likely your own"</b> — strong inner desire with pressure you can manage. This reads as an authentic yes. Worth a gentle double-check in section ④, then trust it.';
      else if(hiD&&hiP) s='You land in <b>"yours, but tangled"</b> — there\'s real desire here, but heavy outside pressure is wound around it. The work isn\'t to doubt the desire, but to separate it from the noise. Sections ④ and ⑥ are built for exactly that.';
      else if(!hiD&&hiP) s='You land in <b>"mostly external"</b> — the pull is coming more from outside than from within. Be gentle with yourself; this is the most important quadrant to slow down in. Try the voice sorter (④) and the "tell no one" tool (⑥).';
      else s='You land in <b>"a quiet no, or not now"</b> — little inner desire and little outside pressure. That can be a calm, clear answer in itself, or simply "not yet." Either is allowed.';
      return s+'<br><br><b>Autonomy reading: '+autonomy+'%</b> — how much this currently feels authored by you rather than by others. It\'s a snapshot, not a sentence; it can shift as you keep looking.';
    }
    function update(){
      var d=+desire.value, p=+pressure.value;
      if(oD) oD.textContent=d+'%'; if(oP) oP.textContent=p+'%';
      draw(d,p);
      var autonomy=Math.round((d+(100-p))/2);
      if(A.meter) A.meter(autoBar,autonomy); if(autoPct) autoPct.textContent=autonomy+'%';
      if(verdict) verdict.innerHTML=verdictText(d,p,autonomy);
      if(A.set){ A.set('desire',String(d)); A.set('pressure',String(p)); }
      fireChange();
    }
    var sd=A.get?A.get('desire',''):''; if(sd!=='') desire.value=sd;
    var sp=A.get?A.get('pressure',''):''; if(sp!=='') pressure.value=sp;
    update();
    desire.addEventListener('input',update); pressure.addEventListener('input',update);
  })();

  /* ============================================================
     3 · Values clarifier
     ============================================================ */
  (function(){
    var grid=$('valGrid'), rows=$('valRows'), sumEl=$('valSum'), hint=$('valHint');
    if(!grid) return;
    var sel = (A.getJSON?A.getJSON('valsel',[]):[]) || [];
    var state = (A.getJSON?A.getJSON('valstate',{}):{}) || {};
    grid.innerHTML = VALUES.map(function(v){ return '<span class="valchip'+(sel.indexOf(v.id)>-1?' sel':'')+'" data-id="'+v.id+'" role="button" tabindex="0">'+esc(v.label)+'</span>'; }).join('');
    function toggleSel(id){
      var i=sel.indexOf(id);
      if(i>-1){ sel.splice(i,1); delete state[id]; } else { sel.push(id); }
      if(A.setJSON){ A.setJSON('valsel',sel); A.setJSON('valstate',state); }
      grid.querySelectorAll('.valchip').forEach(function(c){ c.classList.toggle('sel', sel.indexOf(c.getAttribute('data-id'))>-1); });
      renderRows();
    }
    grid.querySelectorAll('.valchip').forEach(function(c){
      var id=c.getAttribute('data-id');
      c.addEventListener('click',function(){ toggleSel(id); });
      c.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggleSel(id); } });
    });
    function renderRows(){
      if(!sel.length){ rows.innerHTML=''; sumEl.style.display='none'; if(hint) hint.style.display='none'; fireChange(); return; }
      if(hint) hint.style.display='block';
      rows.innerHTML = sel.map(function(id){
        var st=state[id]||'';
        return '<div class="valrow" data-id="'+id+'"><span class="vname">'+esc(valLabel(id))+'</span>'+
          '<div class="seg">'+
            '<button type="button" data-v="h" class="'+(st==='h'?'on-h':'')+'">Honors it</button>'+
            '<button type="button" data-v="n" class="'+(st==='n'?'on-n':'')+'">Neutral</button>'+
            '<button type="button" data-v="c" class="'+(st==='c'?'on-c':'')+'">Costs it</button>'+
          '</div></div>';
      }).join('');
      rows.querySelectorAll('.valrow').forEach(function(r){
        var id=r.getAttribute('data-id');
        r.querySelectorAll('.seg button').forEach(function(b){
          b.addEventListener('click',function(){
            state[id]=b.getAttribute('data-v');
            if(A.setJSON) A.setJSON('valstate',state);
            r.querySelectorAll('.seg button').forEach(function(x){ x.className=''; });
            b.className = b.getAttribute('data-v')==='h'?'on-h':(b.getAttribute('data-v')==='n'?'on-n':'on-c');
            renderSum();
          });
        });
      });
      renderSum();
    }
    function renderSum(){
      var h=0,c=0,rated=0;
      sel.forEach(function(id){ var s=state[id]; if(s){ rated++; if(s==='h') h++; if(s==='c') c++; } });
      if(rated===0){ sumEl.style.display='none'; fireChange(); return; }
      sumEl.style.display='block';
      var msg='Against your core values, this choice <b>honors '+h+'</b> and <b>costs '+c+'</b> of the '+rated+' you\'ve rated. ';
      if(h>c) msg+='On balance it pulls toward what matters most to you — a meaningful sign, though only you can weigh how much each value counts.';
      else if(c>h) msg+='On balance it costs more of your core values than it honors. That\'s worth sitting with — is the cost one you\'d choose with open eyes, or one being asked of you?';
      else msg+='It\'s an even split. The deciding question is usually not how many, but which ones weigh heaviest for you.';
      sumEl.innerHTML=msg;
      fireChange();
    }
    renderRows();
  })();

  /* ============================================================
     4 · Voice sorter
     ============================================================ */
  (function(){
    var input=$('vsInput'), addB=$('vsAdd'), list=$('vsList'), bal=$('vsBal'), note=$('vsBalNote');
    if(!input||!addB) return;
    var items = (A.getJSON?A.getJSON('voices',[]):[]) || [];
    function save(){ if(A.setJSON) A.setJSON('voices', items); }
    function render(){
      list.innerHTML = items.map(function(it){
        var cls = it.tag==='mine'?'mine':(it.tag==='other'?'other':'');
        return '<div class="vs-item '+cls+'" data-id="'+it.id+'"><span class="txt">'+esc(it.text)+'</span>'+
          '<div class="tagbtns"><button type="button" class="mine'+(it.tag==='mine'?' on':'')+'" data-t="mine">Mine</button>'+
          '<button type="button" class="other'+(it.tag==='other'?' on':'')+'" data-t="other">Inherited</button></div>'+
          '<button type="button" class="del" aria-label="Delete">×</button></div>';
      }).join('');
      list.querySelectorAll('.vs-item').forEach(function(el){
        var id=+el.getAttribute('data-id');
        el.querySelectorAll('.tagbtns button').forEach(function(b){
          b.addEventListener('click',function(){
            var it=items.filter(function(x){return x.id===id;})[0]; if(!it) return;
            it.tag = (it.tag===b.getAttribute('data-t')) ? null : b.getAttribute('data-t');
            save(); render();
          });
        });
        el.querySelector('.del').addEventListener('click',function(){ items=items.filter(function(x){return x.id!==id;}); save(); render(); });
      });
      var mine=items.filter(function(x){return x.tag==='mine';}).length;
      var other=items.filter(function(x){return x.tag==='other';}).length;
      var total=items.length||1;
      bal.querySelector('.mine').style.width=(mine/total*100)+'%';
      bal.querySelector('.other').style.width=(other/total*100)+'%';
      bal.querySelector('.untag').style.width=((total-mine-other)/total*100)+'%';
      if(items.length===0){ note.textContent='Add a few statements, then tag each one.'; }
      else { var ut=items.length-mine-other;
        note.innerHTML='<b>'+mine+'</b> your own · <b>'+other+'</b> inherited'+(ut?(' · '+ut+' untagged'):'')+
          (mine||other ? ((mine>other && other>=0 && (mine>0)) ? ' — more of this is sounding like your own voice.' : (other>mine ? ' — a lot of these are borrowed voices; worth asking which truly bind you.' : (mine===other && mine>0 ? ' — an even split between your voice and inherited ones.' : ''))) : ''); }
      fireChange();
    }
    function add(){
      var v=(input.value||'').trim(); if(!v) return;
      items.push({id:Date.now()+Math.floor(Math.random()*1000), text:v, tag:null});
      input.value=''; save(); render(); input.focus();
    }
    addB.addEventListener('click', add);
    input.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); add(); } });
    render();
  })();

  /* ============================================================
     5 · Clarity signals
     ============================================================ */
  (function(){
    var wrap=$('claritybox'); if(!wrap) return;
    var boxes=[].slice.call(wrap.querySelectorAll('input[type=checkbox]'));
    var bar=$('clarBar'), count=$('clarCount');
    var saved=(A.getJSON?A.getJSON('clarity',{}):{})||{};
    function render(){
      var n=boxes.filter(function(b){return b.checked;}).length;
      if(A.meter) A.meter(bar, n/boxes.length*100);
      if(count) count.textContent = n+' of '+boxes.length+' clarity signals present.'+(n>=5?' That\'s a strong, settled reading — though clarity is yours to feel, not to score.':(n>0?' A real start; the tools above can grow the rest.':''));
      fireChange();
    }
    boxes.forEach(function(b){ var k=b.getAttribute('data-key'); b.checked=!!saved[k];
      b.addEventListener('change',function(){ saved[k]=b.checked; if(A.setJSON) A.setJSON('clarity',saved); render(); }); });
    render();
  })();

  /* ============================================================
     6 · Perspective tools
     ============================================================ */
  (function(){
    var TOOLS=[
      { id:'tellnoone', tab:'The "tell no one" test',
        prompt:'Imagine you make this decision — and you tell absolutely no one. No approval, no disapproval, no audience. Just you and the choice, in private, forever.',
        lead:'Notice your body\'s very first reaction before any thinking starts.',
        coach:'Relief usually points toward your own voice; a sinking dread often points toward an external one. The reaction that comes before the reasons is worth trusting.' },
      { id:'futureself', tab:'Your future self',
        prompt:'Picture yourself at 80, looking back on this from the very end of your life. Which choice would that older, gentler version of you be glad you made?',
        lead:'This is the "regret-minimization" view: we rarely regret choosing honestly; we more often regret living someone else\'s script.',
        coach:'Your 80-year-old self tends to care less about what others thought, and more about whether you lived as yourself. Let them weigh in.' },
      { id:'friend', tab:'Advice to a friend',
        prompt:'A dear friend — someone you love — is in your exact situation, feeling exactly what you feel. They ask you, sincerely, what they should do. Write the advice you\'d give them.',
        lead:'We are almost always kinder, clearer, and braver on behalf of people we love than for ourselves.',
        coach:'The advice you just wrote is often the thing you already know but find hard to grant yourself. You deserve the same kindness you\'d offer them.' },
      { id:'tenten', tab:'10–10–10',
        prompt:'How will I feel about this decision in 10 minutes? In 10 months? In 10 years?',
        lead:'A way to tell a passing feeling from a lasting one (the "10-10-10" method).',
        coach:'Fears that loom huge at 10 minutes often shrink by 10 months. Things that matter at 10 years are the ones worth steering by.' },
      { id:'coinflip', tab:'The coin flip',
        prompt:'Assign your two options to heads and tails. Now flip a coin in your mind and let it land. The instant you "see" the result — do you feel relief, or a quiet wish that it had landed the other way?',
        lead:'You don\'t have to obey the coin. Its only job is to surprise your gut into speaking.',
        coach:'That flash of relief or disappointment — not the coin — is the answer your deeper preference just gave away.' }
    ];
    var tabsEl=$('ptabs'), stage=$('pstage'); if(!tabsEl||!stage) return;
    var cur=0;
    var saved=(A.getJSON?A.getJSON('persp',{}):{})||{};
    function renderTabs(){
      tabsEl.innerHTML=TOOLS.map(function(t,i){ return '<button class="ptab'+(i===cur?' active':'')+'" type="button" data-i="'+i+'">'+esc(t.tab)+'</button>'; }).join('');
      tabsEl.querySelectorAll('.ptab').forEach(function(b){ b.addEventListener('click',function(){ cur=+b.getAttribute('data-i'); renderAll(); }); });
    }
    function renderStage(){
      var t=TOOLS[cur];
      stage.innerHTML='<p class="prompt">'+esc(t.prompt)+'</p><p class="lead-in">'+esc(t.lead)+'</p>'+
        '<textarea id="pNote" placeholder="What surfaced for you?"></textarea>'+
        '<div class="coach">'+esc(t.coach)+'</div>';
      var ta=$('pNote'); ta.value=saved[t.id]||'';
      ta.addEventListener('input',function(){ saved[t.id]=ta.value; if(A.setJSON) A.setJSON('persp',saved); fireChange(); });
    }
    function renderAll(){ renderTabs(); renderStage(); }
    renderAll();
  })();

  /* ============================================================
     7 · Quiz
     ============================================================ */
  (function(){
    var Q=[
      {a:1,e:'An autonomous choice flows from your own values and reasons — it can even match what others want and still be fully yours.'},
      {a:1,e:'An "introjected" should is a rule you swallowed whole, long ago, without ever examining it.'},
      {a:0,e:'Clarity is knowing what you want and why; certainty about the future is something no one actually has. You don\'t need the second to act on the first.'},
      {a:1,e:'The "advice to a friend" tool asks what YOU would tell a friend in your exact spot — we\'re usually clearer and kinder for others than for ourselves.'},
      {a:1,e:'The whole aim is to help you reach your OWN answer, on purpose — not a "right" one, and not a fast one.'}
    ];
    var picks={}, total=document.querySelectorAll('#quizbox .quiz-q').length;
    if(A.initOptions) A.initOptions($('quizbox'), function(q,i){ picks[q]=+i; });
    var sB=$('quizScore'), rB=$('quizReset'), res=$('quizResult');
    if(sB) sB.addEventListener('click', function(){
      if(Object.keys(picks).length<total){ res.style.display='block'; res.textContent='Pick an answer for all '+total+' questions first.'; return; }
      var sc=0;
      Q.forEach(function(it,i){
        document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){
          var j=+x.getAttribute('data-i'); x.classList.remove('ok','no');
          if(j===it.a) x.classList.add('ok'); else if(j===picks[i]) x.classList.add('no');
        });
        var ex=document.querySelector('.explain[data-q="'+i+'"]'); if(ex){ ex.style.display='block'; ex.textContent=it.e; }
        if(picks[i]===it.a) sc++;
      });
      res.style.display='block';
      res.textContent='You matched '+sc+' of '+Q.length+' with the explained view. The aim isn\'t the score — it\'s the language for your own clarity.';
      if(rB) rB.style.display='inline-block';
    });
    if(rB) rB.addEventListener('click', function(){
      picks={};
      document.querySelectorAll('#quizbox .opt').forEach(function(x){ x.classList.remove('sel','ok','no'); x.setAttribute('aria-pressed','false'); });
      document.querySelectorAll('#quizbox .explain').forEach(function(ex){ ex.style.display='none'; ex.textContent=''; });
      res.style.display='none'; rB.style.display='none';
    });
  })();

  /* ============================================================
     8 · Clarity report (gather + copy + save + clear)
     ============================================================ */
  (function(){
    var reflect=$('reflect'), box=$('reportBox'), status=$('saveStatus'), timer=null;
    function flash(m){ if(!status) return; status.textContent=m; if(timer) clearTimeout(timer); timer=setTimeout(function(){ status.textContent='Saved only on this device.'; },1600); }
    if(reflect && A.get){ reflect.value=A.get('reflect',''); reflect.addEventListener('input', function(){ A.set('reflect', reflect.value); fireChange(); }); }

    function gather(){
      var d=A.get?+(A.get('desire','50')||50):50, p=A.get?+(A.get('pressure','50')||50):50;
      var autonomy=Math.round((d+(100-p))/2);
      var valsel=(A.getJSON?A.getJSON('valsel',[]):[])||[];
      var valstate=(A.getJSON?A.getJSON('valstate',{}):{})||{};
      var hon=valsel.filter(function(id){return valstate[id]==='h';}).map(valLabel);
      var cost=valsel.filter(function(id){return valstate[id]==='c';}).map(valLabel);
      var voices=(A.getJSON?A.getJSON('voices',[]):[])||[];
      var mine=voices.filter(function(v){return v.tag==='mine';}).length;
      var other=voices.filter(function(v){return v.tag==='other';}).length;
      var clarity=(A.getJSON?A.getJSON('clarity',{}):{})||{};
      var clarN=Object.keys(clarity).filter(function(k){return clarity[k];}).length;
      var persp=(A.getJSON?A.getJSON('persp',{}):{})||{};
      var perspDone=Object.keys(persp).filter(function(k){return (persp[k]||'').trim();}).length;
      return {d:d,p:p,autonomy:autonomy,hon:hon,cost:cost,valsel:valsel,mine:mine,other:other,clarN:clarN,perspDone:perspDone,
              reflect:reflect?reflect.value.trim():''};
    }
    function render(){
      if(!box) return;
      var r=gather();
      var html='<div class="kv">';
      html+='<strong>Desire / pressure</strong><span>'+r.d+'% desire · '+r.p+'% pressure · autonomy '+r.autonomy+'%</span>';
      html+='<strong>Core values chosen</strong><span>'+(r.valsel.length?esc(r.valsel.map(valLabel).join(', ')):'(none yet)')+'</span>';
      html+='<strong>This choice honors</strong><span>'+(r.hon.length?esc(r.hon.join(', ')):'(none rated)')+'</span>';
      html+='<strong>This choice costs</strong><span>'+(r.cost.length?esc(r.cost.join(', ')):'(none rated)')+'</span>';
      html+='<strong>Voice balance</strong><span>'+r.mine+' my own · '+r.other+' inherited</span>';
      html+='<strong>Clarity signals</strong><span>'+r.clarN+' of 7</span>';
      html+='<strong>Perspective tools used</strong><span>'+r.perspDone+' of 5</span>';
      html+='</div>';
      box.innerHTML=html;
    }
    document.addEventListener('p5change', render);
    render();

    function reportText(){
      var r=gather();
      var L=['"Is This My Choice?" — my clarity report','',
        'Desire: '+r.d+'%   Pressure: '+r.p+'%   Autonomy reading: '+r.autonomy+'%',
        'Core values: '+(r.valsel.length?r.valsel.map(valLabel).join(', '):'(none chosen)'),
        'This choice honors: '+(r.hon.length?r.hon.join(', '):'(none rated)'),
        'This choice costs: '+(r.cost.length?r.cost.join(', '):'(none rated)'),
        'Voice balance: '+r.mine+' my own / '+r.other+' inherited',
        'Clarity signals present: '+r.clarN+' of 7',
        'Perspective tools engaged: '+r.perspDone+' of 5'];
      var persp=(A.getJSON?A.getJSON('persp',{}):{})||{};
      var notes=Object.keys(persp).filter(function(k){return (persp[k]||'').trim();});
      if(notes.length){ L.push('',' Perspective notes:'); notes.forEach(function(k){ L.push('  • '+k+': '+persp[k].trim()); }); }
      if(r.reflect){ L.push('','My notes:',r.reflect); }
      return L.join('\n');
    }
    var saveB=$('saveBtn'), copyB=$('copyBtn'), clearB=$('clearBtn');
    if(saveB) saveB.addEventListener('click', function(){ if(reflect&&A.set) A.set('reflect', reflect.value); flash('Saved ✓'); });
    if(copyB) copyB.addEventListener('click', function(){ if(A.copy) A.copy(reportText(), copyB); });
    if(clearB) clearB.addEventListener('click', function(){
      if(!window.confirm('Clear everything on this device? This cannot be undone.')) return;
      ['desire','pressure','reflect','valsel','valstate','voices','clarity','persp'].forEach(function(k){ if(A.remove) A.remove(k); });
      flash('All cleared. Reloading…');
      setTimeout(function(){ try{ window.location.reload(); }catch(e){} }, 600);
    });
  })();

} catch(e){ console.error('project 005 script error', e); }
});
