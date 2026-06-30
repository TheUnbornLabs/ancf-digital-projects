/* Project 087 · Crisis-Safe Community Policy Page — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var SECS=[
    {id:'purpose',label:'Purpose',body:function(n){return ['This policy describes how moderators of '+n+' respond, with care and good judgement, when a member appears to be in distress. It is a community-conduct guide, not a clinical protocol; '+n+' offers support and signposting, it does not provide treatment.'];}},
    {id:'do',label:'What moderators do',body:function(){return ['• Respond promptly, privately where possible, with warmth and without judgement.','• Acknowledge the person and take them seriously.','• Gently encourage them to reach out to a trusted person and to qualified or emergency support appropriate to their location.','• Share the listed support resources.','• Stay within our role: we care and signpost; we do not counsel or diagnose.','• Log the situation discreetly for the mod team\'s awareness and follow-up.'];}},
    {id:'dont',label:'What moderators don\'t do',body:function(){return ['• We do not attempt to act as therapists, counsellors, or crisis responders.','• We do not promise confidentiality we cannot guarantee, or make assurances about what authorities will or won\'t do.','• We do not make medical or diagnostic statements about anyone.','• We do not minimise, argue with, or publicly call out a person who is struggling.','• We do not take sole responsibility for someone\'s safety — that needs qualified, real-world help.'];}},
    {id:'resources',label:'Support resources',body:function(n,res){return res&&res.trim()?['The following resources are shared as appropriate (members should use those local to them):','',res.trim()]:['[ Add the crisis lines, services, and links appropriate to your members\' regions here. Verify them, and keep them current. ]'];}},
    {id:'mods',label:'Care for the moderators',body:function(){return ['• Moderators may step back from a difficult situation and hand over to another mod.','• After a hard episode, the team checks in with each other.','• No moderator is expected to carry a crisis alone, at any hour.','• We review and update this policy regularly, ideally with qualified input.'];}}
  ];
  var on={}; SECS.forEach(function(s){ on[s.id]=true; });
  function renderSecs(){ var box=$('secs'); if(!box) return; box.innerHTML=SECS.map(function(s){ return '<label class="secrow" data-id="'+s.id+'"><input type="checkbox" '+(on[s.id]?'checked':'')+'><span>'+esc(s.label)+'</span></label>'; }).join('');
    box.querySelectorAll('input').forEach(function(c){ c.addEventListener('change',function(){ on[c.closest('label').getAttribute('data-id')]=c.checked; build(); }); }); }
  function build(){ var n=($('cname').value||'').trim()||'[Community]'; var res=$('resources').value;
    var L=['CRISIS-SAFE COMMUNITY POLICY','For: '+n,'(A community-conduct template — adapt with qualified input. Not a clinical protocol.)',''];
    SECS.forEach(function(s){ if(!on[s.id]) return; L.push(s.label.toUpperCase()); s.body(n,res).forEach(function(line){ L.push(line); }); L.push(''); });
    $('out').textContent=L.join('\n').trim(); }
  $('cname').addEventListener('input',build); $('resources').addEventListener('input',build);
  $('buildBtn').addEventListener('click',build);
  $('copyBtn').addEventListener('click',function(){ if(A.copy) A.copy($('out').textContent,$('copyBtn')); });
  (function(){ var box=$('prinCards'); if(!box) return;
    var C=[['Care within your role','Respond with genuine warmth — and stay a community, not a clinic. Knowing the edge of your role is itself a kindness; overreach can do harm.'],['No false promises','Never assure confidentiality or outcomes you can\'t control. Honesty ("I can\'t promise that, but I\'m here and I\'ll help you find support") protects everyone.'],['Point to qualified help','Your most valuable move is often a warm, firm nudge toward trusted people and professionals. Keep a current, locally-appropriate resource list ready.'],['Protect the moderators','The people holding the space need holding too. Build in handover, check-ins, and the right to step back.']];
    box.innerHTML=C.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  renderSecs(); build();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 087 script error', e); }
});
