/* Project 037 · Community Notice Generator — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function or(v,d){ v=(v||'').trim(); return v?v:d; }
  // each type: fields [{k,label,ph,full,area}], build(v,tone)
  var TYPES={
    event:{ fields:[
        {k:'title',label:'Event name',ph:'Childfree Brunch'},
        {k:'date',label:'Date & time',ph:'Sat 12 July, 11am'},
        {k:'place',label:'Place',ph:'The Garden Café'},
        {k:'rsvp',label:'RSVP / contact',ph:'React 👍 by Friday'},
        {k:'details',label:'Details',ph:'Casual meetup, all welcome',full:true,area:true}],
      build:function(v,t){ var head=t==='formal'?'NOTICE: '+or(v.title,'Upcoming Event'):'📅 '+or(v.title,'Upcoming Event')+'!';
        return [head,'','🕓 When: '+or(v.date,'TBC'),'📍 Where: '+or(v.place,'TBC'),(v.details?'\n'+v.details:''),'',(t==='formal'?'Please RSVP: ':'Let us know if you\'re coming — ')+or(v.rsvp,'reply here'),'',t==='formal'?'Thank you.':'Hope to see you there! 💛'].join('\n'); } },
    change:{ fields:[
        {k:'what',label:'What\'s changing',ph:'Weekly call moved'},
        {k:'from',label:'From',ph:'Wednesday 7pm'},
        {k:'to',label:'To',ph:'Thursday 8pm'},
        {k:'reason',label:'Reason (optional)',ph:'to suit more time zones',full:true}],
      build:function(v,t){ var head=t==='formal'?'SCHEDULE CHANGE':'🔔 Heads-up — a change!';
        return [head,'',or(v.what,'A schedule change')+':','• From: '+or(v.from,'—'),'• To: '+or(v.to,'—'),(v.reason?'\nWhy: '+v.reason:''),'',t==='formal'?'Please update your calendars.':'Please update your calendars — thanks for rolling with it! 🙏'].join('\n'); } },
    welcome:{ fields:[
        {k:'names',label:'New member(s)',ph:'Priya & Sam'},
        {k:'group',label:'Group name',ph:'the Childfree Collective'},
        {k:'start',label:'Suggested first step',ph:'introduce yourself in the chat',full:true}],
      build:function(v,t){ var head=t==='formal'?'WELCOME':'👋 Welcome aboard!';
        return [head,'','A warm welcome to '+or(v.names,'our new members')+', joining '+or(v.group,'the group')+'!',(v.start?'\nTo get started, feel free to '+v.start+'.':''),'',t==='formal'?'We\'re glad to have you.':'So happy you\'re here. 💛'].join('\n'); } },
    fundraiser:{ fields:[
        {k:'cause',label:'Cause',ph:'our local shelter'},
        {k:'goal',label:'Goal',ph:'₹50,000'},
        {k:'deadline',label:'Deadline',ph:'31 July'},
        {k:'how',label:'How to give',ph:'link in the next message',full:true}],
      build:function(v,t){ var head=t==='formal'?'FUNDRAISER':'🌱 We\'re fundraising!';
        return [head,'','We\'re raising support for '+or(v.cause,'a good cause')+'.','🎯 Goal: '+or(v.goal,'—'),'⏳ By: '+or(v.deadline,'—'),(v.how?'\nHow to help: '+v.how:''),'',t==='formal'?'Every contribution is appreciated. No pressure to give.':'Every little bit helps — and no pressure at all. 💛'].join('\n'); } },
    poll:{ fields:[
        {k:'question',label:'The question',ph:'Which night suits the next call?'},
        {k:'options',label:'Options (comma-separated)',ph:'Tuesday, Thursday, Sunday',full:true},
        {k:'close',label:'Voting closes',ph:'this Sunday'}],
      build:function(v,t){ var head=t==='formal'?'POLL':'🗳️ Quick poll!';
        var opts=or(v.options,'').split(',').map(function(s){return s.trim();}).filter(Boolean);
        var lines=opts.length?opts.map(function(o,i){ return String.fromCharCode(65+i)+') '+o; }):['A) —','B) —'];
        return [head,'',or(v.question,'Please vote:'),'',lines.join('\n'),'','Reply with your choice'+(v.close?' before '+v.close:'')+'.',t==='formal'?'':'Thanks for weighing in! 🙌'].join('\n'); } },
    general:{ fields:[
        {k:'headline',label:'Headline',ph:'A small update'},
        {k:'body',label:'Message',ph:'Write your announcement here…',full:true,area:true},
        {k:'next',label:'What to do next (optional)',ph:'no action needed',full:true}],
      build:function(v,t){ var head=t==='formal'?'ANNOUNCEMENT: '+or(v.headline,''):'📣 '+or(v.headline,'Announcement');
        return [head,'',or(v.body,'(your message)'),(v.next?'\n👉 '+v.next:''),'',t==='formal'?'Thank you.':'Thanks, everyone! 💛'].join('\n'); } }
  };
  function curType(){ return TYPES[$('nType').value]; }
  function renderFields(){ var box=$('fields'); if(!box) return; var def=curType();
    box.innerHTML=def.fields.map(function(f){ var input=f.area?('<textarea id="f_'+f.k+'" rows="2" placeholder="'+esc(f.ph)+'"></textarea>'):('<input id="f_'+f.k+'" type="text" placeholder="'+esc(f.ph)+'">');
      return '<div class="'+(f.full?'full':'')+'"><label for="f_'+f.k+'">'+esc(f.label)+'</label>'+input+'</div>'; }).join('');
    box.querySelectorAll('input,textarea').forEach(function(el){ el.addEventListener('input',build); }); }
  function vals(){ var def=curType(), v={}; def.fields.forEach(function(f){ var el=$('f_'+f.k); v[f.k]=el?el.value:''; }); return v; }
  function build(){ var def=curType(); $('out').textContent=def.build(vals(),$('nTone').value); }
  $('nType').addEventListener('change',function(){ renderFields(); build(); });
  $('nTone').addEventListener('change',build);
  $('genBtn').addEventListener('click',build);
  $('copyBtn').addEventListener('click',function(){ if(A.copy) A.copy($('out').textContent,$('copyBtn')); });
  renderFields(); build();

  (function(){
    var Q=[{a:0},{a:0}], E=['A good notice leads with the key information, clearly.','A clear "what to do next" tells people exactly how to respond.'];
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
} catch(e){ console.error('project 037 script error', e); }
});
