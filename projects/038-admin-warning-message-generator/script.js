/* Project 038 · Admin Warning Message Generator — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var ISSUES=[
    {id:'spam',label:'Spam / promotions',behaviour:'posting promotional or spam content',ask:'please keep ads, links, and promotions out of the group'},
    {id:'incivility',label:'Personal attacks / incivility',behaviour:'directing personal attacks at another member',ask:'we critique ideas here, never people — please keep it respectful'},
    {id:'flooding',label:'Off-topic flooding',behaviour:'posting a high volume of off-topic messages',ask:'please keep off-topic chat to the side thread so the main channel stays usable'},
    {id:'privacy',label:'Sharing private content',behaviour:'sharing another member\'s private messages or details',ask:'what\'s shared here stays here — please don\'t screenshot or forward'},
    {id:'misinfo',label:'Harmful misinformation',behaviour:'sharing medical or legal claims that could mislead members',ask:'please don\'t present unverified medical or legal claims as advice'},
    {id:'repeat',label:'Repeated rule-breaking',behaviour:'repeatedly breaking a group rule after earlier reminders',ask:'we need you to follow the pinned rules from here on'}
  ];
  var TIER={
    '1':{name:'Gentle nudge',open:function(n){return 'Hi'+(n?' '+n:'')+', a quick friendly note from the mod team.';},
      mid:function(b,ask){return 'We noticed some '+b+'. No big deal — '+ask+'. Easy to miss, so just flagging it.';},
      close:'Thanks for understanding, and thanks for being part of the group! 💛',label:'first, informal'},
    '2':{name:'Formal warning',open:function(n){return 'Hi'+(n?' '+n:'')+' — this is a formal note from the moderation team.';},
      mid:function(b,ask){return 'This is a warning regarding '+b+'. As per our group rules, '+ask+'. Please consider this an official heads-up.';},
      close:'We\'d genuinely like you to stay — continuing as before just means this needs to stop. Happy to talk if anything\'s unclear.',label:'on the record'},
    '3':{name:'Final notice',open:function(n){return 'Hi'+(n?' '+n:'')+' — this is a final notice from the moderation team.';},
      mid:function(b,ask){return 'Despite earlier reminders, the '+b+' has continued. This is your final warning: '+ask+'. Any further instance will result in removal from the group.';},
      close:'This isn\'t about you as a person — it\'s about behaviour the group can\'t continue with. The choice to stay, by following the rules, is yours.',label:'last chance before removal'}
  };
  function fillIssues(){ var s=$('wIssue'); s.innerHTML=ISSUES.map(function(it,i){ return '<option value="'+i+'">'+esc(it.label)+'</option>'; }).join(''); }
  function build(){
    var it=ISSUES[+$('wIssue').value], tier=TIER[$('wTier').value];
    var name=($('wName').value||'').trim(), detail=($('wDetail').value||'').trim();
    var b=detail?detail:it.behaviour;
    var msg=[tier.open(name),'',tier.mid(b,it.ask),'',tier.close].join('\n');
    $('out').textContent=msg;
  }
  $('wIssue').addEventListener('change',build); $('wTier').addEventListener('change',build);
  $('wName').addEventListener('input',build); $('wDetail').addEventListener('input',build);
  $('genBtn').addEventListener('click',build);
  $('copyBtn').addEventListener('click',function(){ if(A.copy) A.copy($('out').textContent,$('copyBtn')); });

  (function(){ var box=$('ladderBox'); if(!box) return;
    var rungs=[['1','①','Gentle nudge','A friendly, private heads-up. Assumes good faith and a simple mistake. Most issues stop here.'],
      ['2','②','Formal warning','On the record. Names the rule, states it clearly, and signals this is now official.'],
      ['3','③','Final notice','Last chance before removal. Firm, still respectful, and explicit about consequences.']];
    box.innerHTML=rungs.map(function(r){ return '<div class="rung t'+r[0]+'"><h4>'+r[1]+' '+esc(r[2])+'</h4><p>'+esc(r[3])+'</p></div>'; }).join(''); })();
  (function(){ var box=$('principles'); if(!box) return;
    var P=[['Behaviour, not worth','Describe what was done, never who they are. "This post broke a rule," not "you\'re a problem."'],
      ['Private, not public','Warn in a DM. Public call-outs shame; private notes correct.'],
      ['Specific & rule-linked','Point to the exact behaviour and the rule it touches, so it feels fair, not arbitrary.'],
      ['A door left open','Always offer a path back: what to do, and that they\'re welcome to stay if they do it.']];
    box.innerHTML=P.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to read</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  fillIssues(); build();

  (function(){
    var Q=[{a:0},{a:0}], E=['A fair warning targets the specific behaviour, not the person\'s character or worth.','Warnings work best delivered privately, with a clear path back.'];
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
} catch(e){ console.error('project 038 script error', e); }
});
