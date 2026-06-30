/* Project 034 · Family Function Survival Script — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var L={
    warm:{open:['So good to see everyone — how have you been?','I\'ve been looking forward to this. Tell me your news!','It\'s lovely to all be together.'],
      deflect:['Oh, lots going on — but enough about me, how\'s your garden coming along?','Ha, the usual questions! Anyway, did you try that recipe you mentioned?','We\'re happy and busy — what about you, what\'s new?'],
      firm:['I know you mean well, and it\'s just not something I\'m discussing today.','I love you, and this one\'s settled for me. Let\'s leave it there.','I\'d really rather not get into that — thanks for understanding.'],
      exit:['I\'m going to go help in the kitchen — back in a bit!','Let me grab a drink — can I get you anything?','I think I\'ll go say hi to Grandma. Catch you later!']},
    breezy:{open:['Hey hey! Good to see you all.','Made it! What did I miss?','Hi everyone — point me to the snacks.'],
      deflect:['Same old, same old! Ooh, is that the good cake?','Living the dream! So who\'s winning the card game?','You know me — busy and fine. What\'s the gossip?'],
      firm:['Nope, not on today\'s menu! How about that weather though.','That\'s a no from me, thanks — moving on!','We\'ll skip that one. So, plans for summer?'],
      exit:['Right, I\'m off to mingle — talk soon!','Going to do a lap of the room. Back shortly!','Refill time! Be right back.']},
    firm:{open:['Hello everyone. Good to be here.','Hi — glad we could all make it.','Evening, all. Hope everyone\'s well.'],
      deflect:['Things are good, thank you. How are you keeping?','All\'s well on my end. Let\'s catch up on your news.','Nothing to report — tell me about you.'],
      firm:['That\'s not up for discussion, but thank you.','I\'ve made my decision, and I won\'t be debating it.','Please don\'t ask me that again. I mean it kindly.'],
      exit:['I\'m going to step away for a moment. Excuse me.','I\'ll leave you to it — going to find some air.','That\'s me for now. I\'ll be over there if you need me.']}
  };
  var EVENT={dinner:'family dinner',wedding:'wedding',holiday:'holiday gathering',reunion:'reunion'};
  function fill(sel,arr,keep){ var s=$(sel); var prev=keep?s.value:''; s.innerHTML=arr.map(function(t,i){return '<option value="'+i+'">'+esc(t)+'</option>';}).join(''); if(keep&&prev!=='')s.value=Math.min(+prev,arr.length-1); }
  function refillStyle(){ var st=$('bStyle').value, d=L[st]; fill('sOpen',d.open); fill('sDeflect',d.deflect); fill('sFirm',d.firm); fill('sExit',d.exit); render(); }
  function get(sel,arr){ var i=+$(sel).value; return arr[i]||arr[0]; }
  function render(){
    var st=$('bStyle').value, d=L[st], ev=EVENT[$('bEvent').value];
    var card='POCKET SCRIPT · '+ev.toUpperCase()+'\n\n'+
      '① Opener:   '+get('sOpen',d.open)+'\n'+
      '② Deflect:  '+get('sDeflect',d.deflect)+'\n'+
      '③ Firm line: '+get('sFirm',d.firm)+'\n'+
      '④ Exit:     '+get('sExit',d.exit);
    $('card').textContent=card;
  }
  $('bStyle').addEventListener('change',refillStyle);
  $('bEvent').addEventListener('change',render);
  ['sOpen','sDeflect','sFirm','sExit'].forEach(function(id){ $(id).addEventListener('change',render); });
  $('shuffleBtn').addEventListener('click',function(){ var st=$('bStyle').value,d=L[st];
    [['sOpen',d.open],['sDeflect',d.deflect],['sFirm',d.firm],['sExit',d.exit]].forEach(function(p){ $(p[0]).value=Math.floor(Math.random()*p[1].length); }); render(); });
  $('copyBtn').addEventListener('click',function(){ if(A.copy) A.copy($('card').textContent,$('copyBtn')); });

  var LINES=[
    {q:'"So… any baby news yet?"',a:'"No news on that front — but plenty of other good news! How are the kids/your work?"'},
    {q:'"You\'re not getting any younger, you know."',a:'"None of us are! I\'m comfortable with my own timing, thanks."'},
    {q:'"When will you give your parents grandchildren?"',a:'"That\'s not something I can promise. I\'d rather not be put on the spot about it."'},
    {q:'"You\'ll change your mind one day."',a:'"Maybe, maybe not — either way, I\'ve thought it through. Let\'s talk about something fun."'},
    {q:'"It\'s different when it\'s your own."',a:'"It might be — which is exactly why I want to choose deliberately. Anyway, tell me about your trip!"'},
    {q:'"Isn\'t it a bit selfish?"',a:'"There\'s no one being deprived by my choice. I\'m at peace with it. More cake?"'}
  ];
  (function(){ var box=$('lineCards'); if(!box) return; box.innerHTML=LINES.map(function(l){ return '<div class="scard"><h4>'+esc(l.q)+'</h4><span class="tg">Tap for a ready response</span><div class="more">'+esc(l.a)+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();

  var CHECK=['I\'ve picked one calm line I can fall back on','I know who in the room is a safe, friendly face','I\'ve decided in advance what I won\'t discuss','I have a graceful exit ready (drink, kitchen, fresh air)','I\'ve reminded myself: their reaction is theirs to manage, not mine','I have a plan to decompress afterwards'];
  (function(){ var box=$('checklist'); if(!box) return;
    var saved=(A.getJSON?A.getJSON('check',[]):[])||[];
    box.innerHTML=CHECK.map(function(t,i){ return '<label data-i="'+i+'"><input type="checkbox" '+(saved.indexOf(i)>=0?'checked':'')+'><span>'+esc(t)+'</span></label>'; }).join('');
    function upd(){ var on=[]; box.querySelectorAll('label').forEach(function(l){ var c=l.querySelector('input'); if(c.checked){ on.push(+l.getAttribute('data-i')); l.classList.add('done'); } else l.classList.remove('done'); }); if(A.setJSON)A.setJSON('check',on);
      var pct=Math.round(on.length/CHECK.length*100); if(A.meter)A.meter($('readyMeter'),pct); var m=$('readyMsg'); if(m) m.textContent=on.length+' of '+CHECK.length+' ready'+(on.length===CHECK.length?' — you\'re set. 🌿':''); }
    box.querySelectorAll('input').forEach(function(c){ c.addEventListener('change',upd); }); upd(); })();

  refillStyle();

  (function(){
    var Q=[{a:1},{a:0}], E=['A graceful exit is for calmly changing the scene when you\'ve had enough — no drama needed.','Rehearsing a few lines helps you feel calmer and less caught off guard.'];
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
} catch(e){ console.error('project 034 script error', e); }
});
