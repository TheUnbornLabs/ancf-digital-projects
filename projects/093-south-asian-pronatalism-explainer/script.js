/* Project 093 · South Asian Pronatalism Explainer — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var PAT=[
    {h:'The fixed life sequence',ph:'"First marriage, then a baby — that\'s the order."',under:'A wish for your life to follow a known, safe, legible path that the family understands and can be proud of.',practice:'The assumption that every adult life must move through the same milestones on the same timeline.'},
    {h:'"Log kya kahenge" — what will people say',ph:'"But what will the relatives think?"',under:'Real anxiety about family reputation and belonging in a tightly networked community.',practice:'Letting an imagined audience of others decide a deeply personal choice.'},
    {h:'Grandchildren as the family\'s due',ph:'"We did everything for you — now give us grandchildren."',under:'A heartfelt longing to hold the next generation, and a sense of completion in becoming grandparents.',practice:'Treating a longing, however genuine, as a debt the next generation must repay with their bodies.'},
    {h:'Continuity of name and line',ph:'"Who will carry forward the family?"',under:'A desire for the family\'s story, name, and values to continue.',practice:'Equating a meaningful legacy with biological continuation, when ideas, care, and values continue too.'},
    {h:'Children as old-age security',ph:'"Who will look after you in old age?"',under:'Genuine fear about care and dignity in later life, where formal support can be limited.',practice:'Treating children as an insurance policy, rather than planning for later life directly.'},
    {h:'Marriage and fertility as proof of adulthood',ph:'"You\'re not really settled until you have kids."',under:'A cultural script in which marriage and children mark full, respectable adulthood.',practice:'Measuring a person\'s maturity or worth by their reproductive status.'}
  ];
  (function(){ var box=$('patBox'); if(!box) return; box.innerHTML=PAT.map(function(p){ return '<div class="pat"><h4>'+esc(p.h)+'</h4><div class="ph">'+esc(p.ph)+'</div><div class="row"><b>The worry underneath:</b> '+esc(p.under)+'</div><div class="row"><b>The practice to question:</b> '+esc(p.practice)+'</div></div>'; }).join(''); })();
  var RESP=[
    ['To a parent','"I know you want the best for me, and I love you for it. I\'ve thought about this carefully, and this is the life that\'s right for me."'],
    ['To "what will people say"','"People will talk about something no matter what we do. I\'d rather they talk about a life I actually chose."'],
    ['To the old-age worry','"I hear that worry, and it\'s a real one. I\'m planning for my later years properly — that\'s a kinder answer than having a child to rely on."'],
    ['To the timeline','"There isn\'t one correct order for a life. Mine is going to look a little different, and I\'m at peace with that."']
  ];
  (function(){ var box=$('respCards'); if(!box) return; box.innerHTML=RESP.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 093 script error', e); }
});
