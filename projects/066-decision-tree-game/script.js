/* Project 066 · Decision Tree Game — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var NODES={
    start:{ narr:'At dinner, your mother sighs: "I\'m not getting any younger — I\'d so love grandchildren." Every eye turns to you. What do you do?',
      ch:[{t:'Acknowledge her feeling, then gently hold your line',p:2,go:'warm'},{t:'Wave it off with a joke',p:1,go:'deflect'},{t:'Snap: "Can you please stop pressuring me?"',p:0,go:'snap'}] },
    warm:{ narr:'She softens at being heard, but presses on: "But who will look after you when you\'re old?"',
      ch:[{t:'Share your actual plans for later life, calmly',p:2,go:'best'},{t:'Reassure her, and kindly close the topic',p:2,go:'good'},{t:'Get defensive about being questioned',p:0,go:'snap'}] },
    deflect:{ narr:'She laughs, then circles right back: "Seriously though — when?"',
      ch:[{t:'Answer honestly and warmly now',p:2,go:'good'},{t:'Deflect again with another quip',p:1,go:'ok'},{t:'Shut it down sharply',p:0,go:'snap'}] },
    snap:{ narr:'The table goes quiet; your mother looks hurt. What now?',
      ch:[{t:'Apologise for the tone, restate your boundary calmly',p:2,go:'recover'},{t:'Double down — you\'re tired of this',p:0,go:'tense'},{t:'Step away to cool off, kindly',p:1,go:'ok'}] },
    best:{ end:true,msg:'You honoured her worry and showed you\'ve thought it through. She may not love your choice, but she trusts your judgement — and the table stays warm.' },
    good:{ end:true,msg:'Kind, clear, and closed without drama. The topic rests, and your relationship is intact.' },
    recover:{ end:true,msg:'A wobble, repaired with grace. Repair is a skill of its own, and you used it — that counts for a lot.' },
    ok:{ end:true,msg:'You kept the peace for now. Nothing was settled, so it may return — but no harm done, and you stayed civil.' },
    tense:{ end:true,msg:'The boundary landed, but with a bruise. Sometimes that happens; a gentle follow-up later can mend it.' }
  };
  var cur='start', fp=0, path=[];
  var best=(A.getJSON?A.getJSON('best',0):0)||0; var be=$('best'); if(be)be.textContent=best;
  function render(){
    var n=NODES[cur], host=$('host'); if(!host) return;
    if(n.end){ if(fp>best){ best=fp; if(A.setJSON)A.setJSON('best',fp); var b=$('best'); if(b)b.textContent=best; }
      var band=fp>=6?'A calm, self-respecting run.':fp>=4?'A steady run with a few bumps.':fp>=2?'You got through it.':'A rough round — replay and try a gentler path.';
      host.innerHTML='<div class="endcard"><div class="big">'+fp+' pts</div><p>'+esc(band)+'</p><p>'+esc(n.msg)+'</p><div class="path"><b>Your path:</b> '+path.map(esc).join(' → ')+'</div><button class="btn btn-primary" id="replayBtn" type="button">↺ Try again</button></div>';
      var rp=$('replayBtn'); if(rp) rp.addEventListener('click',function(){ cur='start';fp=0;path=[]; var f=$('fp'); if(f)f.textContent=0; render(); }); return; }
    host.innerHTML='<div class="scene"><p class="narr">'+esc(n.narr)+'</p><div class="choices2">'+n.ch.map(function(c,i){ return '<button type="button" data-i="'+i+'">'+esc(c.t)+'</button>'; }).join('')+'</div></div>';
    host.querySelectorAll('.choices2 button').forEach(function(b){ b.addEventListener('click',function(){ var c=n.ch[+b.getAttribute('data-i')]; fp+=c.p; path.push(c.t.length>26?c.t.slice(0,24)+'…':c.t); var f=$('fp'); if(f)f.textContent=fp; cur=c.go; render(); }); });
  }
  render();
  (function(){ var box=$('aboutCards'); if(!box) return;
    var C=[['Calm scores','Responses that stay warm and unflustered earn the most. Heat feels powerful but usually costs you points — and goodwill.'],['Clarity scores','Naming your boundary plainly beats dodging forever. A clear "no" handled kindly tends to end the loop.'],['Repair counts','Snapped? You can still recover well. Owning the tone and restarting calmly earns back much of what a flare-up costs.']];
    box.innerHTML=C.map(function(p){ return '<div class="scard"><h4>'+p[0]+'</h4><span class="tg">Tap to expand</span><div class="more">'+p[1]+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 066 script error', e); }
});
