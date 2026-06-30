/* Project 085 · Couple Compatibility Questions — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var QS=[
    'Do we each want children — and if so, how sure are we?',
    'If one of us is unsure, how do we honour that without pressure?',
    'What would it mean for us if we ultimately disagreed on this?',
    'How do we each picture our daily life in ten years?',
    'What role do we want extended family to play in that life?',
    'How do we feel about the financial shape of a childfree, or child-raising, life?',
    'How important is location and freedom to move to each of us?',
    'How do we each find meaning and fulfilment outside a partner?',
    'How would we want to handle pressure from family about children?',
    'If our feelings changed in future, how would we want to talk about it?',
    'What does "a complete family" mean to each of us?',
    'What are we each most afraid of getting wrong here?'
  ];
  var state=(A.getJSON?A.getJSON('state',{}):{})||{};
  function render(){ var box=$('deckBox'); if(!box) return;
    box.innerHTML=QS.map(function(q,i){ var v=state[i]; return '<div class="qc" data-i="'+i+'"><div class="qq">'+esc(q)+'</div><div class="opts3">'+
      ['aligned','unsure','talk'].map(function(o){ var lab={aligned:'Aligned',unsure:'Unsure',talk:'Need to talk'}[o]; return '<button type="button" data-v="'+o+'" class="'+(v===o?'sel':'')+'">'+lab+'</button>'; }).join('')+'</div></div>'; }).join('');
    box.querySelectorAll('.qc').forEach(function(card){ var i=+card.getAttribute('data-i'); card.querySelectorAll('button').forEach(function(b){ b.addEventListener('click',function(){ state[i]=b.getAttribute('data-v'); if(A.setJSON)A.setJSON('state',state); render(); upd(); }); }); });
  }
  function upd(){ var done=0,talk=0,unsure=0; QS.forEach(function(_,i){ if(state[i]){ done++; if(state[i]==='talk')talk++; if(state[i]==='unsure')unsure++; } });
    var m=$('deckMsg'); if(m) m.textContent=done+' of '+QS.length+' answered'+(done===QS.length?' — done!':'')+(talk?' · '+talk+' to talk about':'');
    var fb=$('focusBox'); if(fb){ var items=[]; QS.forEach(function(q,i){ if(state[i]==='talk') items.push(q); }); QS.forEach(function(q,i){ if(state[i]==='unsure') items.push(q+' (unsure)'); });
      if(!items.length){ fb.innerHTML='<p class="note">Mark anything "unsure" or "need to talk" and it\'ll gather here as your conversation agenda.</p>'; }
      else fb.innerHTML='<p class="note" style="margin-top:0">Your conversation agenda — start here, together:</p>'+items.map(function(t){ return '<div class="f">'+esc(t)+'</div>'; }).join(''); }
  }
  (function(){ var box=$('howCards'); if(!box) return;
    var C=[['Pick a calm moment','Not at midnight after a row. Choose a relaxed time when neither of you is rushed or defensive.'],['One question at a time','Let each person fully answer before responding. Curiosity first — "tell me more" beats "but what about".'],['Differences aren\'t failures','Finding a gap early is a gift, not a disaster. It\'s far kinder than discovering it after years of assuming.']];
    box.innerHTML=C.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  render(); upd();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 085 script error', e); }
});
