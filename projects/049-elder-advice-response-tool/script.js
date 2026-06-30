/* Project 049 · Elder Advice Response Tool — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  var WHO={grandparent:'Thank you, Grandma/Grandpa.',parent:'Thank you, Mum/Dad.',relative:'Thank you.',elder:'Thank you, and I mean it.'};
  var CONCERNS=[
    {id:'legacy',label:'Carrying on the family / legacy',
      honor:['I know how much our family and its continuity mean to you, and I don\'t take that lightly.','I understand the family line matters deeply to you — that comes from love, and I honour it.'],
      mean:'They fear the family — and everything they built — ending. Underneath is a wish to feel that their life continues and mattered.',
      honorWay:'Reassure them their legacy lives in you: the values, stories, and care they passed on, which you carry whether or not you have children.'},
    {id:'happy',label:'Worry about your happiness',
      honor:['I can hear that you just want me to be happy, and that means the world to me.','It\'s clear this comes from wanting the best for me — thank you for caring so much.'],
      mean:'They equate the life they know with happiness, and can\'t yet picture a different one being just as full. The worry is love, wearing the clothes of advice.',
      honorWay:'Let them see your contentment directly — share what genuinely makes your life full, so they can update their picture of "a happy life".'},
    {id:'care',label:'Who will care for you when old',
      honor:['I know you worry about me being looked after one day, and that tenderness means a lot.','I hear the love in worrying about my old age — thank you for thinking of me.'],
      mean:'They imagine a lonely future for you and want to protect you from it. The fear is real even if the logic — that children guarantee care — isn\'t.',
      honorWay:'Show them you\'re planning thoughtfully: friendships, savings, community. Their worry eases when they see you\'re not leaving it to chance.'},
    {id:'duty',label:'Tradition, faith, or duty',
      honor:['I deeply respect the traditions you\'ve passed to me — they\'re part of who I am.','I value our traditions and what they mean to you, truly.'],
      mean:'They feel responsible for handing down a way of life, and a different choice can feel like that thread breaking in their hands.',
      honorWay:'Affirm what you\'re keeping of the tradition, and note that sincere people within it have always reached their own conclusions in good conscience.'},
    {id:'grandkids',label:'Longing for grandchildren',
      honor:['I know you\'d love grandchildren, and I understand how real that longing is.','I can feel how much you\'d treasure grandchildren — and I don\'t dismiss that at all.'],
      mean:'A specific, heartfelt hope to hold and love a new generation. It\'s a beautiful wish — and still theirs to hold, not a debt you owe.',
      honorWay:'Acknowledge the wish warmly without promising to fill it, and offer the closeness you can give: your time, your presence, your love.'},
    {id:'regret',label:'"You\'ll regret it one day"',
      honor:['I know that warning comes from not wanting me to be hurt, and I\'m grateful for that care.','I hear that you\'re trying to protect me from regret — thank you.'],
      mean:'They\'re trying to spare you a pain they can imagine. The protective instinct is loving, even when the prediction isn\'t theirs to make.',
      honorWay:'Thank them for the protectiveness, and reassure them you\'ve weighed it carefully — that you\'re choosing with open eyes, not avoiding the question.'}
  ];
  var HOLD={
    gentle:['Still, after a lot of thought, this is the path that\'s right for me.','And gently, I\'ve come to my own decision about this, with a lot of care.','At the same time, this is something I\'ve settled in my own heart.'],
    firm:['And this is my decision to make, which I\'ve made with care.','And I need you to trust that I know my own mind on this.','That said, this is mine to choose, and I have.']
  };
  var CLOSE={
    warm:['I hope you can hold both: my respect for you, and my choice. I love you.','None of this changes how much you mean to me. Thank you for loving me.','I\'d love for us to be close through this, whatever you make of my choice.'],
    direct:['I\'m telling you because I respect you enough to be honest.','I\'d ask you to respect it, as I respect you.','I hope you\'ll meet me with the same love I\'m bringing to you.']
  };
  var current='';
  function fillConcerns(){ var s=$('eConcern'); s.innerHTML=CONCERNS.map(function(c,i){ return '<option value="'+i+'">'+esc(c.label)+'</option>'; }).join(''); }
  function warmLabel(v){ return v<=25?'Very gentle':(v<=50?'Warm':(v<=75?'Balanced':'Direct')); }
  function gen(){
    var c=CONCERNS[+$('eConcern').value], w=+$('eWarm').value;
    var holdBand=w>=75?'firm':(w>=50&&Math.random()<0.5?'firm':'gentle');
    var closeBand=w>=75?'direct':'warm';
    var thanks=WHO[$('eWho').value];
    var reply=pick(c.honor)+' '+thanks+' '+pick(HOLD[holdBand])+' '+pick(CLOSE[closeBand]);
    if(reply===current){ reply=pick(c.honor)+' '+thanks+' '+pick(HOLD[holdBand])+' '+pick(CLOSE[closeBand]); }
    current=reply; $('out').textContent=reply;
  }
  $('eWarm').addEventListener('input',function(){ var n=$('warmNow'); if(n)n.textContent=warmLabel(+this.value); gen(); });
  $('eConcern').addEventListener('change',gen); $('eWho').addEventListener('change',gen);
  $('genBtn').addEventListener('click',gen); $('anotherBtn').addEventListener('click',gen);
  $('copyBtn').addEventListener('click',function(){ if(current&&A.copy) A.copy(current,$('copyBtn')); });

  (function(){ var box=$('decodeCards'); if(!box) return; box.innerHTML=CONCERNS.map(function(c){ return '<div class="scard"><h4>'+esc(c.label)+'</h4><span class="tg">Tap to expand</span><div class="more"><b>What\'s underneath:</b> '+esc(c.mean)+'<br><br><b>How to honour it:</b> '+esc(c.honorWay)+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(card){ card.addEventListener('click',function(){ card.classList.toggle('open'); }); }); })();

  fillConcerns(); var n=$('warmNow'); if(n)n.textContent=warmLabel(+$('eWarm').value); gen();

  (function(){
    var Q=[{a:0},{a:0}], E=['These replies aim to honour the elder\'s care and keep your boundary — both at once.','Naming the worry underneath lets you respond to the feeling, not just the words.'];
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
} catch(e){ console.error('project 049 script error', e); }
});
