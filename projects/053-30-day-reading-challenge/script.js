/* Project 053 · 30-Day Reading Challenge — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var PROMPTS=[
    'What first drew you to think about this subject? Write the honest reason.',
    'Define "antinatalism" in your own words, without looking anything up. Refine it later.',
    'List three assumptions you hold about having children. Where did each come from?',
    'Whose voice do you hear when you imagine being asked "when are you having kids?"',
    'What would a good life without children look like, in concrete detail?',
    'Read about the asymmetry argument. State it back in one sentence.',
    'What is the single strongest objection to antinatalism, in your view?',
    'Can someone value their own life and still question the ethics of creating new ones? Why or why not?',
    'Distinguish "childfree" from "antinatalist". Which (if either) describes you today?',
    'Recall a time you felt pressure about children. What was the person really worried about?',
    'Write the kindest possible version of a view you disagree with here.',
    'What role does consent play in your thinking about birth?',
    'Is reducing suffering more urgent than creating happiness? Argue both sides briefly.',
    'What do you owe — if anything — to family, tradition, or society on this question?',
    'Notice one place pronatalism shows up in media you consumed today.',
    'How would you explain your current view to a curious, respectful friend?',
    'What evidence or argument would change your mind? Be specific.',
    'Separate a fact, a value, and a feeling in your thinking about this.',
    'Where does "natural" appear in arguments you hear? Does it do real work?',
    'Write a boundary you might need, and a calm sentence to hold it.',
    'What is one thing antinatalists and pronatalists could honestly agree on?',
    'Reflect on regret: how should the possibility of future regret weigh on a present choice?',
    'Who benefits from the assumption that everyone should have children?',
    'What would change in your life if this pressure simply lifted tomorrow?',
    'Read one objection you find persuasive. Sit with it for ten minutes.',
    'How do you tell your own voice apart from the voices you\'ve absorbed?',
    'What does a meaningful life require, for you, at minimum?',
    'Draft, in two sentences, how you\'d answer a nosy stranger with warmth.',
    'Has anything shifted since Day 1? Compare your Day 2 definition with today\'s.',
    'Write a short letter to yourself about where you stand now — and what\'s still open.'
  ];
  var done=(A.getJSON?A.getJSON('done',{}):{})||{};
  var notes=(A.getJSON?A.getJSON('notes',{}):{})||{};
  var cur=0;
  // start at first undone
  (function(){ for(var i=0;i<PROMPTS.length;i++){ if(!done[i]){ cur=i; break; } if(i===PROMPTS.length-1) cur=PROMPTS.length-1; } })();
  function renderToday(){
    var box=$('todayBox'); if(!box) return;
    box.innerHTML='<span class="dn">Day '+(cur+1)+' of 30'+(done[cur]?' · done ✓':'')+'</span><p class="pr">'+esc(PROMPTS[cur])+'</p>';
    var nt=$('note'); if(nt) nt.value=notes[cur]||'';
  }
  function renderGrid(){
    var g=$('daygrid'); if(!g) return;
    g.innerHTML=PROMPTS.map(function(_,i){ return '<div class="daycell'+(done[i]?' done':'')+(i===cur?' cur':'')+'" data-i="'+i+'">'+(i+1)+'</div>'; }).join('');
    g.querySelectorAll('.daycell').forEach(function(c){ c.addEventListener('click',function(){ cur=+c.getAttribute('data-i'); renderToday(); renderGrid(); }); });
  }
  function prog(){ var dn=Object.keys(done).length, pct=Math.round(dn/PROMPTS.length*100); if(A.meter)A.meter($('meter'),pct); var m=$('progMsg'); if(m) m.textContent=dn+' of 30 days done ('+pct+'%)'+(dn===30?' — challenge complete! 🌱':''); }
  $('doneBtn').addEventListener('click',function(){ done[cur]=1; var nt=$('note'); if(nt&&nt.value.trim()){ notes[cur]=nt.value; if(A.setJSON)A.setJSON('notes',notes); } if(A.setJSON)A.setJSON('done',done);
    // advance to next undone
    var nxt=cur; for(var i=0;i<PROMPTS.length;i++){ if(!done[i]){ nxt=i; break; } }
    cur=nxt; renderToday(); renderGrid(); prog(); });
  $('undoBtn').addEventListener('click',function(){ delete done[cur]; if(A.setJSON)A.setJSON('done',done); renderToday(); renderGrid(); prog(); });
  $('saveNote').addEventListener('click',function(){ var nt=$('note'); if(nt){ notes[cur]=nt.value; if(A.setJSON)A.setJSON('notes',notes); } var st=$('saveStatus'); });
  $('resetBtn').addEventListener('click',function(){ if(Object.keys(done).length&&!window.confirm('Reset all days and notes?'))return; done={}; notes={}; if(A.setJSON){A.setJSON('done',done);A.setJSON('notes',notes);} cur=0; renderToday(); renderGrid(); prog(); });

  renderToday(); renderGrid(); prog();

  (function(){
    var ta=$('r1'), status=$('saveStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 053 script error', e); }
});
