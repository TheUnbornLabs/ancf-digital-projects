/* Project 031 · Comic Strip Prompt Generator — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  // characters carry a metaphor; emoji is a sketch cue
  var CHARS=[
    {n:'a small boat',e:'⛵',love:'the calm of its own harbour'},
    {n:'a contented cactus',e:'🌵',love:'its quiet patch of desert'},
    {n:'a teapot',e:'🫖',love:'being full of exactly enough tea'},
    {n:'a house cat',e:'🐈',love:'a sunbeam and a closed door'},
    {n:'a lighthouse',e:'🗼',love:'standing steady and alone'},
    {n:'a snail',e:'🐌',love:'carrying its whole home, slowly'},
    {n:'a single sock',e:'🧦',love:'being perfectly happy unpaired'},
    {n:'a moon',e:'🌙',love:'its own unhurried orbit'}
  ];
  var PRESS={
    pressure:['everyone keeps asking when it will "fill up"','a well-meaning aunt-cloud rains questions','the whole pond insists it should sail somewhere else'],
    autonomy:['a map is handed to it with the route already drawn','a chorus chants "but everyone docks here"','a louder voice tries to steer'],
    boundaries:['a neighbour keeps peering over the fence','a relative reorganises its shelves uninvited','the questions arrive faster than it can answer'],
    peace:['the noise of expectation rises like a tide','a hundred opinions buzz around it','the calendar fills with other people\'s plans']
  };
  var TURN={
    gentle:['takes a slow breath and remembers what it loves','smiles, kindly, and stays exactly where it is','lets the question pass like weather'],
    witty:['raises one eyebrow (somehow) and changes the subject','offers a biscuit instead of an answer','replies, "noted!", and carries on'],
    wholesome:['gently thanks them for caring, and holds its line','remembers that warmth and a boundary can share a sentence','chooses its own calm over their approval'],
    absurd:['produces a tiny umbrella and waits out the storm','politely files the advice in a drawer marked "later, perhaps never"','grows one extra, very serene, leaf']
  };
  var END={
    gentle:['and the harbour is quiet again','content, exactly as it is','at peace, and unhurried'],
    witty:['the end. (no further questions, your honour)','crisis averted, biscuits intact','roll credits, gently'],
    wholesome:['loved, and still itself','sure that its choice is its own','warm, settled, whole'],
    absurd:['the umbrella, it turns out, was the friend all along','and the desert applauded politely','perfectly, absurdly fine']
  };
  var current=null;
  function gen(){
    var theme=$('gTheme').value; if(theme==='random') theme=pick(['pressure','autonomy','boundaries','peace']);
    var tone=$('gTone').value;
    var ch=pick(CHARS), p=pick(PRESS[theme]), t=pick(TURN[tone]), e=pick(END[tone]);
    current={ch:ch,theme:theme,tone:tone,
      p1:'We meet '+ch.n+', who loves '+ch.love+'.',
      p2:'Then '+p+'. '+ch.n.charAt(0).toUpperCase()+ch.n.slice(1)+' '+t+'.',
      p3:'And so, '+e+'.'};
    render();
  }
  function render(){
    if(!current) return;
    $('out').textContent='THREE-PANEL COMIC PREMISE\n\nPanel 1 (setup): '+current.p1+'\nPanel 2 (turn): '+current.p2+'\nPanel 3 (resolution): '+current.p3;
    var sb=$('storyboard');
    if(sb){ sb.innerHTML=[['Setup',current.p1],['Turn',current.p2],['Resolution',current.p3]].map(function(p){ return '<div class="panel-c"><div class="ph">'+p[0]+'</div><div class="frame">'+current.ch.e+'</div><div class="cap">'+esc(p[1])+'</div></div>'; }).join(''); }
  }
  function text(){ return current?('Panel 1: '+current.p1+'\nPanel 2: '+current.p2+'\nPanel 3: '+current.p3):''; }
  $('genBtn').addEventListener('click',gen); $('anotherBtn').addEventListener('click',gen);
  $('copyBtn').addEventListener('click',function(){ if(current&&A.copy) A.copy(text(),$('copyBtn')); });
  /* favourites */
  var favs=(A.getJSON?A.getJSON('favs',[]):[])||[];
  function renderFavs(){ var box=$('favs'); if(!box) return; if(!favs.length){ box.innerHTML='<p class="note">No saved premises yet — tap ☆ Save on one you like.</p>'; return; }
    box.innerHTML=favs.map(function(t,i){ return '<div class="favrow"><span>'+esc(t.replace(/\n/g,' · '))+'</span><button type="button" data-i="'+i+'" aria-label="Remove">×</button></div>'; }).join('');
    box.querySelectorAll('button').forEach(function(b){ b.addEventListener('click',function(){ favs.splice(+b.getAttribute('data-i'),1); if(A.setJSON)A.setJSON('favs',favs); renderFavs(); }); }); }
  $('saveBtn').addEventListener('click',function(){ if(!current) return; var t=text(); if(favs.indexOf(t)<0){ favs.push(t); if(A.setJSON)A.setJSON('favs',favs); renderFavs(); } });
  renderFavs(); gen();

  (function(){
    var Q=[{a:0},{a:0}], E=['Metaphor makes a heavy idea feel friendlier and easier to approach.','A classic three-panel beat is setup, turn, resolution.'];
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
    var s=$('rSave'),cl=$('rClear');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 031 script error', e); }
});
