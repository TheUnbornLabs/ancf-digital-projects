/* Project 072 · Childfree Bio Generator — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  var INTERESTS=['travel','books','cooking','fitness','art','music','gaming','gardening','pets','hiking','film','coffee','volunteering','plants','photography','baking'];
  var LIMITS={generic:220,x:160,ig:150,dating:300};
  var OPEN={
    warm:['Building a life I love, on my own terms.','Childfree and fully here for the good stuff.','Living gently and on purpose.'],
    witty:['Plant parent, not the other kind.','Childfree, well-rested, and easily delighted.','My houseplants are thriving and so am I.'],
    minimal:['Childfree. Curious. Calm.','Living simply, choosing freely.','Quiet life, full heart.'],
    adventurous:['Chasing experiences over milestones.','Childfree and always halfway out the door.','Collecting places, not obligations.']
  };
  var MID={
    warm:'Happiest with ',witty:'Currently obsessed with ',minimal:'Into ',adventurous:'Powered by '
  };
  var CLOSE={
    warm:['Say hi — I\'m friendlier than I look.','Here for slow mornings and good company.'],
    witty:['Will travel for a good snack.','Ask me about my unreasonable opinions on coffee.'],
    minimal:['That\'s the whole of it.','Keeping it uncomplicated.'],
    adventurous:['Tell me where to go next.','Let\'s do something worth remembering.']
  };
  var sel=[];
  function renderChips(){ var box=$('chips'); if(!box) return; box.innerHTML=INTERESTS.map(function(it){ return '<button type="button" class="chip-t'+(sel.indexOf(it)>=0?' on':'')+'" data-it="'+it+'">'+esc(it)+'</button>'; }).join('');
    box.querySelectorAll('.chip-t').forEach(function(b){ b.addEventListener('click',function(){ var it=b.getAttribute('data-it'); var i=sel.indexOf(it); if(i>=0) sel.splice(i,1); else { if(sel.length>=4){ return; } sel.push(it); } renderChips(); gen(); }); }); }
  var current='';
  function listPhrase(arr){ if(!arr.length) return 'good books, good food, and good people'; if(arr.length===1) return arr[0]; if(arr.length===2) return arr[0]+' and '+arr[1]; return arr.slice(0,-1).join(', ')+', and '+arr[arr.length-1]; }
  function gen(){
    var vibe=$('vibe').value;
    var bio=pick(OPEN[vibe])+' '+MID[vibe]+listPhrase(sel)+'. '+pick(CLOSE[vibe]);
    if(bio===current){ bio=pick(OPEN[vibe])+' '+MID[vibe]+listPhrase(sel)+'. '+pick(CLOSE[vibe]); }
    current=bio; $('out').textContent=bio; updCC();
  }
  function updCC(){ var lim=LIMITS[$('platform').value], len=current.length; var cc=$('cc'); if(!cc) return;
    cc.textContent=len+' / '+lim+' characters'; cc.className='cc '+(len<=lim?'ok':'over'); if(len>lim) cc.textContent+=' — a little long for this platform'; }
  $('genBtn').addEventListener('click',gen); $('anotherBtn').addEventListener('click',gen);
  $('vibe').addEventListener('change',gen); $('platform').addEventListener('change',updCC);
  $('copyBtn').addEventListener('click',function(){ if(current&&A.copy) A.copy(current,$('copyBtn')); });
  var favs=(A.getJSON?A.getJSON('favs',[]):[])||[];
  function renderFavs(){ var box=$('favs'); if(!box) return; if(!favs.length){ box.innerHTML='<p class="note">No saved bios yet — tap ☆ Save on one you like.</p>'; return; }
    box.innerHTML=favs.map(function(t,i){ return '<div class="favrow"><span>'+esc(t)+'</span><button type="button" class="cp" data-i="'+i+'">Copy</button><button type="button" data-i="'+i+'" aria-label="Remove">×</button></div>'; }).join('');
    box.querySelectorAll('.cp').forEach(function(b){ b.addEventListener('click',function(){ if(A.copy) A.copy(favs[+b.getAttribute('data-i')],b); }); });
    box.querySelectorAll('button:not(.cp)').forEach(function(b){ b.addEventListener('click',function(){ favs.splice(+b.getAttribute('data-i'),1); if(A.setJSON)A.setJSON('favs',favs); renderFavs(); }); }); }
  $('saveBtn').addEventListener('click',function(){ if(current&&favs.indexOf(current)<0){ favs.push(current); if(A.setJSON)A.setJSON('favs',favs); renderFavs(); } });
  sel=['travel','books']; renderChips(); renderFavs(); gen();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 072 script error', e); }
});
