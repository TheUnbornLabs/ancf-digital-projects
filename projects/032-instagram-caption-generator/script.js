/* Project 032 · Instagram Caption Generator — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  var HOOK={
    childfree:['My life isn\'t missing anything.','Childfree, and fully here.','This is the life I chose — on purpose.'],
    autonomy:['Whether, when, and if — that\'s mine to decide.','My body, my timeline, my call.','Reproductive autonomy is for everyone.'],
    boundaries:['"It\'s not for me" is a full sentence.','I can love you and still hold my line.','Boundaries aren\'t walls — they\'re doors I get to open.'],
    peace:['Quiet mornings are a life I built.','Freedom looks good on me.','Peace, on my own terms.'],
    educate:['A gentle reminder: not everyone\'s path is the same.','Different choices, equal dignity.','Asking the question isn\'t the same as judging the answer.']
  };
  var BODY={
    warm:['I made this choice with care, and I\'m at peace with it. Wishing the same peace for whatever you choose.','There\'s so much to love in a life that\'s fully your own. Here\'s to choosing on purpose.'],
    witty:['No tiny humans, plenty of tiny joys. We\'re thriving over here.','Plot twist: the life I wasn\'t "supposed" to want is the one I love most.'],
    bold:['I won\'t shrink my choice to fit someone else\'s script. Neither should you.','This isn\'t a phase, a problem, or a gap to fill. It\'s a life.'],
    reflective:['It took some untangling to tell my own voice from the borrowed ones. Worth every quiet hour.','The question deserved more than a default answer — so I gave it one of my own.']
  };
  var CLOSE={
    childfree:'However you build your family — or don\'t — I hope it fits you.',
    autonomy:'Every choice, made freely, deserves the same respect.',
    boundaries:'Holding a line gently is still holding it.',
    peace:'Protecting your peace is never selfish.',
    educate:'Curious questions welcome; judgement, not so much.'
  };
  var TAGS={
    childfree:'#childfree #childfreebychoice #childfreelife #dink #livingmybestlife',
    autonomy:'#reproductiveautonomy #mychoice #bodilyautonomy #reproductiverights',
    boundaries:'#boundaries #healthyboundaries #selfrespect #peoplepleaserrecovery',
    peace:'#innerpeace #intentionalliving #freedom #slowliving',
    educate:'#thoughtful #perspective #respectfully #foodforthought'
  };
  var EMO={childfree:'🌿',autonomy:'🤍',boundaries:'🚪',peace:'🌅',educate:'💬'};
  var current='';
  function build(){
    var topic=$('cTopic').value, tone=$('cTone').value, len=$('cLen').value, emo=$('cEmoji').value==='some', tags=$('cTags').value==='yes';
    var hook=pick(HOOK[topic]), body=pick(BODY[tone]), close=CLOSE[topic];
    var cap=hook;
    if(len==='medium') cap+='\n\n'+body;
    cap+='\n\n'+close;
    if(emo) cap=(EMO[topic]||'')+' '+cap;
    if(tags) cap+='\n\n'+TAGS[topic];
    current=cap; return cap;
  }
  function show(){ var c=build(); if(c===$('out').textContent){ c=build(); } $('out').textContent=c; current=c; var cc=$('charCount'); if(cc) cc.textContent=c.length+' characters'; }
  $('genBtn').addEventListener('click',show); $('anotherBtn').addEventListener('click',show);
  $('copyBtn').addEventListener('click',function(){ if(current&&A.copy) A.copy(current,$('copyBtn')); });

  /* tag sets */
  (function(){ var box=$('tagSets'); if(!box) return; box.innerHTML=Object.keys(TAGS).map(function(k){ return '<div class="favrow"><span><b>'+esc(k)+':</b> '+esc(TAGS[k])+'</span><button type="button" class="cpy" data-k="'+k+'" style="color:var(--accent-2);font-weight:700">Copy</button></div>'; }).join('');
    box.querySelectorAll('.cpy').forEach(function(b){ b.addEventListener('click',function(){ if(A.copy) A.copy(TAGS[b.getAttribute('data-k')],b); }); }); })();

  /* favourites */
  var favs=(A.getJSON?A.getJSON('favs',[]):[])||[];
  function renderFavs(){ var box=$('favs'); if(!box) return; if(!favs.length){ box.innerHTML='<p class="note">No saved captions yet — tap ☆ Save on one you like.</p>'; return; }
    box.innerHTML=favs.map(function(t,i){ return '<div class="favrow"><span>'+esc(t.replace(/\n+/g,' / ').slice(0,120))+(t.length>120?'…':'')+'</span><button type="button" class="cp" data-i="'+i+'">Copy</button><button type="button" data-i="'+i+'" aria-label="Remove">×</button></div>'; }).join('');
    box.querySelectorAll('.cp').forEach(function(b){ b.addEventListener('click',function(){ if(A.copy) A.copy(favs[+b.getAttribute('data-i')],b); }); });
    box.querySelectorAll('button:not(.cp)').forEach(function(b){ b.addEventListener('click',function(){ favs.splice(+b.getAttribute('data-i'),1); if(A.setJSON)A.setJSON('favs',favs); renderFavs(); }); }); }
  $('saveBtn').addEventListener('click',function(){ if(current&&favs.indexOf(current)<0){ favs.push(current); if(A.setJSON)A.setJSON('favs',favs); renderFavs(); } });
  renderFavs(); show();

  (function(){
    var Q=[{a:0},{a:1}], E=['A respectful caption shares your view without putting others down.','The best caption is one you edit to sound like you.'];
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
} catch(e){ console.error('project 032 script error', e); }
});
