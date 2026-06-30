/* Project 099 · Future Vision Board — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var SPARKS=['Every choice freely made, never coerced','No shame for any reproductive decision','Real support for those who parent','Real support for those who don\'t','Reproductive healthcare for all','Honest education, not pressure','Workplaces fair to everyone\'s life','Strong safety nets, so choice is real','"When?" is never assumed','Many ways to build a family — all respected','Elders cared for, regardless of children','Dignity for every path'];
  var board=(A.getJSON?A.getJSON('board',null):null); if(!board) board=['Every choice freely made, never coerced','No shame for any reproductive decision'];
  function save(){ if(A.setJSON)A.setJSON('board',board); }
  function renderSparks(){ var box=$('sparks'); if(!box) return; box.innerHTML=SPARKS.map(function(s,i){ return '<button type="button" class="spark" data-i="'+i+'">+ '+esc(s)+'</button>'; }).join('');
    box.querySelectorAll('.spark').forEach(function(b){ b.addEventListener('click',function(){ var t=SPARKS[+b.getAttribute('data-i')]; if(board.indexOf(t)<0){ board.push(t); save(); renderBoard(); } }); }); }
  function renderBoard(){ var box=$('boardBox'); if(!box) return; if(!board.length){ box.innerHTML='<p class="board-empty">Your board is empty — add a spark above, or write your own vision.</p>'; return; }
    box.innerHTML=board.map(function(t,i){ return '<div class="tile">'+esc(t)+'<button type="button" data-i="'+i+'" aria-label="Remove">×</button></div>'; }).join('');
    box.querySelectorAll('button').forEach(function(b){ b.addEventListener('click',function(){ board.splice(+b.getAttribute('data-i'),1); save(); renderBoard(); }); }); }
  $('addBtn').addEventListener('click',function(){ var inp=$('visionIn'); var v=(inp.value||'').trim(); if(!v) return; if(board.indexOf(v)<0){ board.push(v); save(); renderBoard(); } inp.value=''; inp.focus(); });
  $('visionIn').addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); $('addBtn').click(); } });
  $('copyBtn').addEventListener('click',function(){ if(board.length&&A.copy) A.copy('MY VISION FOR A FREER FUTURE:\n\n'+board.map(function(t){ return '• '+t; }).join('\n'),$('copyBtn')); });
  $('clearBtn').addEventListener('click',function(){ if(board.length&&!window.confirm('Clear the whole board?'))return; board=[]; save(); renderBoard(); });
  renderSparks(); renderBoard();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 099 script error', e); }
});
