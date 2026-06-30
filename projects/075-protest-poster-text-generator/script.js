/* Project 075 · Protest Poster Text Generator — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  var S={
    autonomy:{plain:['MY BODY, MY DECISION','BODILY AUTONOMY FOR ALL','MY LIFE, MY CHOICE TO MAKE'],rhyme:['MY BODY, MY SAY — TODAY AND EVERY DAY','MY CHOICE, MY VOICE'],gentle:['This body is mine to steward','My choices, made with care, are mine to make']},
    choice:{plain:['EVERY CHOICE DESERVES RESPECT','FREE TO CHOOSE — WHETHER, WHEN, OR IF','TO HAVE OR NOT: BOTH ARE VALID'],rhyme:['WHETHER, WHEN, OR IF — THE CHOICE IS A GIFT','CHOOSE WITH PRIDE, NOT PUSHED ASIDE'],gentle:['Whatever you choose, may it be freely chosen','Room for every path, respect for each']},
    dignity:{plain:['DIGNITY IS NOT CONDITIONAL','RESPECT EVERY REPRODUCTIVE CHOICE','NO ONE OWES A REASON FOR THEIR LIFE'],rhyme:['DIGNITY STANDS, IN EVERYONE\'S HANDS','LIVE AND LET LIVE, RESPECT TO GIVE'],gentle:['Every life path holds equal worth','Kindness for choices unlike your own']},
    education:{plain:['ASK, DON\'T ASSUME','CURIOSITY OVER JUDGEMENT','DIFFERENT CHOICES, EQUAL DIGNITY'],rhyme:['LEARN BEFORE YOU JUDGE THE TURN','QUESTIONS OPEN, JUDGEMENT CLOSED'],gentle:['Understanding before opinion','A question is kinder than a verdict']},
    solidarity:{plain:['YOUR CHOICE, MY SUPPORT','TOGETHER FOR EVERYONE\'S FREEDOM','WE STAND FOR ALL CHOICES'],rhyme:['YOUR PATH, MY RESPECT — WE PROTECT','SIDE BY SIDE, EACH CHOICE OUR PRIDE'],gentle:['Beside you, whatever you choose','Freedom is something we hold together']}
  };
  var current='';
  function gen(){ var pool=S[$('focus').value][$('style').value]; var s=pick(pool); if(s===current&&pool.length>1) s=pick(pool); current=s; $('out').textContent=s; }
  $('genBtn').addEventListener('click',gen); $('anotherBtn').addEventListener('click',gen);
  $('focus').addEventListener('change',gen); $('style').addEventListener('change',gen);
  $('copyBtn').addEventListener('click',function(){ if(current&&A.copy) A.copy(current,$('copyBtn')); });
  var favs=(A.getJSON?A.getJSON('favs',[]):[])||[];
  function renderFavs(){ var box=$('favs'); if(!box) return; if(!favs.length){ box.innerHTML='<p class="note">No saved slogans yet — tap ☆ Save on one you like.</p>'; return; }
    box.innerHTML=favs.map(function(t,i){ return '<div class="favrow"><span>'+esc(t)+'</span><button type="button" class="cp" data-i="'+i+'">Copy</button><button type="button" data-i="'+i+'" aria-label="Remove">×</button></div>'; }).join('');
    box.querySelectorAll('.cp').forEach(function(b){ b.addEventListener('click',function(){ if(A.copy) A.copy(favs[+b.getAttribute('data-i')],b); }); });
    box.querySelectorAll('button:not(.cp)').forEach(function(b){ b.addEventListener('click',function(){ favs.splice(+b.getAttribute('data-i'),1); if(A.setJSON)A.setJSON('favs',favs); renderFavs(); }); }); }
  $('saveBtn').addEventListener('click',function(){ if(current&&favs.indexOf(current)<0){ favs.push(current); if(A.setJSON)A.setJSON('favs',favs); renderFavs(); } });
  renderFavs(); gen();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 075 script error', e); }
});
