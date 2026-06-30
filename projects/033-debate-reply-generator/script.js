/* Project 033 · Debate Reply Generator — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  var CLAIMS=[
    {id:'regret',label:'"You\'ll regret it / change your mind."',
      assume:'Assumes you don\'t really know your own mind, and treats a clear decision as a passing phase.',
      r:{calm:['I\'ve thought this through carefully, and I\'m at peace with it. People can be just as sure of wanting children, and we don\'t doubt them.','Maybe I will feel differently one day — and that\'s exactly why I want to choose deliberately rather than by default.'],
         curious:['What makes regret the thing we warn about here, but never the other way round?','If I said I was sure I wanted kids, would you also tell me I might change my mind?'],
         firm:['I do know my own mind. Predicting my future feelings for me isn\'t something I\'m looking for.','My decision isn\'t up for a second opinion. I\'m settled on it.'],
         witty:['I might also regret skipping dessert tonight, but I\'m brave enough to risk it.','Plot twist: the thing I was told I\'d regret is the choice I\'m happiest about.']}},
    {id:'selfish',label:'"Isn\'t it a bit selfish?"',
      assume:'Assumes someone is being deprived — yet there is no existing person who is missing out on being born.',
      r:{calm:['Choosing a life that honestly fits me doesn\'t take anything from anyone who exists.','If anything, having a child to satisfy other people\'s expectations would be the less thoughtful choice.'],
         curious:['Who exactly is being harmed by this choice? I\'d genuinely like to understand the worry.','Is a decision selfish if no one is actually deprived by it?'],
         firm:['There\'s no one being shortchanged here, so "selfish" doesn\'t fit.','I won\'t accept that label for a choice that hurts no one.'],
         witty:['Selfish would be having a kid as a retirement plan. I\'m playing it more honestly than that.','I\'m depriving a non-existent person of nothing. Tough crowd.']}},
    {id:'natural',label:'"It\'s only natural / what we\'re made for."',
      assume:'Assumes that whatever is common in nature is therefore a duty every individual owes.',
      r:{calm:['Plenty of things are natural without being required of everyone. What\'s common isn\'t the same as what I must do.','Being capable of something doesn\'t make it an obligation — for any of us.'],
         curious:['Lots of things are "natural" — which ones do we treat as compulsory, and why this one?','Does "natural" settle what any single person should do with one life?'],
         firm:['"Natural" describes a tendency, not a command. I\'m not bound by it.','My life isn\'t a debt I owe to nature.'],
         witty:['Lots of things are natural. So are thunderstorms, and I don\'t schedule my week around those either.','By that logic I\'m also "made for" napping in the sun. I\'ll start there.']}},
    {id:'careforyou',label:'"Who will look after you when you\'re old?"',
      assume:'Assumes children are an old-age insurance policy, and that the childfree face a lonely end.',
      r:{calm:['Having children is no guarantee of care, and many people build strong support without them.','I\'d rather plan my later years thoughtfully than have a person to insure against loneliness.'],
         curious:['Is "they\'ll care for me" really a fair reason to bring someone into existence?','Plenty of parents are lonely later, and plenty of childfree people aren\'t — so what\'s really doing the work here?'],
         firm:['A child isn\'t a care plan, and I won\'t create one to be mine.','My old age is something I\'ll plan for directly, thanks.'],
         witty:['I\'m told the going rate for built-in caregivers is eighteen years and a college fund. I\'ll arrange other options.','If the plan is "raise your own nurse," I think I\'ll just save for a good one.']}},
    {id:'meaning',label:'"Children are the meaning of life."',
      assume:'Assumes a single source of meaning that is the same for everyone.',
      r:{calm:['Meaning comes from many places — work, love, friendship, creativity, care. Children are one path, not the only one.','I\'m glad parenthood gives you that. I find mine elsewhere, and it\'s just as real.'],
         curious:['If children were the only meaning, what would that say about every childless life that felt full?','Is there really just one source of meaning for everyone?'],
         firm:['My life already has meaning. I don\'t need to manufacture a person to prove it.','I get to decide what makes my life meaningful.'],
         witty:['If meaning were only available via offspring, philosophers would\'ve had a much busier maternity ward.','I found the meaning of life. It was hobbies and sleep all along.']}},
    {id:'duty',label:'"It\'s your duty — to family, faith, or the species."',
      assume:'Assumes you specifically owe a reproductive debt to a group, tradition, or humanity.',
      r:{calm:['Even within traditions that prize children, sincere people reach different conclusions. I\'ve reached mine with care.','The species is in no danger from one person\'s choice, and my conscience is my own to follow.'],
         curious:['If it\'s a duty, is it one everyone must perform — or only some of us?','Whose debt is this, exactly, and when did I sign for it?'],
         firm:['I can honour my family and my values and still choose my own path here.','My body isn\'t a duty I owe to anyone\'s plan.'],
         witty:['I checked, and humanity is not currently short on people. I think we\'re covered.','I\'ll take "duties I didn\'t agree to" for zero, please.']}}
  ];
  var STRUCT=[
    {h:'1 · Acknowledge',tg:'Meet them, briefly.',more:'Open by recognising the care or the point behind the claim — "I know you mean well," "that\'s a fair worry." It lowers the temperature and shows you\'re listening, not bracing for a fight.'},
    {h:'2 · Reframe',tg:'Answer the idea.',more:'Gently name what the claim assumes and offer a truer picture. This is the heart of the reply — aimed at the idea, not the person. No mockery needed; clarity does the work.'},
    {h:'3 · Redirect',tg:'Close the loop.',more:'End by setting the boundary or returning warmth: "my timeline is mine," or "I\'d love to talk about something else." It signals the topic is settled without slamming a door.'}
  ];
  var current='';
  function fillClaims(){ var s=$('dClaim'); if(!s) return; s.innerHTML=CLAIMS.map(function(c,i){ return '<option value="'+i+'">'+esc(c.label)+'</option>'; }).join(''); }
  function gen(){
    var c=CLAIMS[+$('dClaim').value], style=$('dStyle').value;
    var reply=pick(c.r[style]);
    // avoid identical repeat
    if(reply===current && c.r[style].length>1){ reply=pick(c.r[style]); }
    current=reply;
    $('assume').innerHTML='<b>What it assumes:</b> '+esc(c.assume);
    $('out').textContent=reply;
  }
  $('genBtn').addEventListener('click',gen); $('anotherBtn').addEventListener('click',gen);
  $('dClaim').addEventListener('change',function(){ var c=CLAIMS[+$('dClaim').value]; $('assume').innerHTML='<b>What it assumes:</b> '+esc(c.assume); });
  $('copyBtn').addEventListener('click',function(){ if(current&&A.copy) A.copy(current,$('copyBtn')); });

  var favs=(A.getJSON?A.getJSON('favs',[]):[])||[];
  function renderFavs(){ var box=$('favs'); if(!box) return; if(!favs.length){ box.innerHTML='<p class="note">No saved replies yet — tap ☆ Save on one you like.</p>'; return; }
    box.innerHTML=favs.map(function(t,i){ return '<div class="favrow"><span>'+esc(t)+'</span><button type="button" class="cp" data-i="'+i+'">Copy</button><button type="button" data-i="'+i+'" aria-label="Remove">×</button></div>'; }).join('');
    box.querySelectorAll('.cp').forEach(function(b){ b.addEventListener('click',function(){ if(A.copy) A.copy(favs[+b.getAttribute('data-i')],b); }); });
    box.querySelectorAll('button:not(.cp)').forEach(function(b){ b.addEventListener('click',function(){ favs.splice(+b.getAttribute('data-i'),1); if(A.setJSON)A.setJSON('favs',favs); renderFavs(); }); }); }
  $('saveBtn').addEventListener('click',function(){ if(current&&favs.indexOf(current)<0){ favs.push(current); if(A.setJSON)A.setJSON('favs',favs); renderFavs(); } });

  (function(){ var box=$('structCards'); if(!box) return; box.innerHTML=STRUCT.map(function(s){ return '<div class="scard"><h4>'+esc(s.h)+'</h4><span class="tg">'+esc(s.tg)+'</span><div class="more">'+esc(s.more)+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();

  fillClaims(); renderFavs(); gen();

  (function(){
    var Q=[{a:1},{a:0}], E=['A good reply aims at the idea, not the person.','Naming the hidden assumption exposes what the claim quietly takes for granted.'];
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
} catch(e){ console.error('project 033 script error', e); }
});
