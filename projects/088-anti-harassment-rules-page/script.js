/* Project 088 · Anti-Harassment Rules Page — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var RULES=[
    {id:'noharass',label:'No harassment or intimidation',gentle:'Please don\'t harass, intimidate, or repeatedly target anyone.',strict:'Harassment, intimidation, or targeting of any member is prohibited and acted on immediately.'},
    {id:'noslurs',label:'No slurs or hate speech',gentle:'No slurs or hateful language about anyone\'s identity or background.',strict:'Zero tolerance for slurs or hate speech targeting any group or identity. Immediate removal.'},
    {id:'nothreats',label:'No threats',gentle:'No threats of harm, ever — even in jest.',strict:'Any threat of harm, explicit or veiled, results in immediate removal and may be reported.'},
    {id:'nodox',label:'No doxxing / privacy violations',gentle:'Don\'t share anyone\'s private information without consent.',strict:'Sharing or threatening to share private information (doxxing) is strictly forbidden and removed on sight.'},
    {id:'respectviews',label:'Respect across views & backgrounds',gentle:'Disagree about ideas without attacking people for who they are or what they believe.',strict:'Members must engage ideas, not attack persons. Contempt for someone\'s identity or beliefs is not tolerated.'},
    {id:'nosexual',label:'No unwanted sexual conduct',gentle:'No unwanted sexual messages, advances, or content toward anyone.',strict:'Unwanted sexual advances, messages, or content directed at members are prohibited and removed.'},
    {id:'nopileon',label:'No pile-ons',gentle:'If someone errs, let mods handle it — please don\'t organise group pile-ons.',strict:'Coordinated pile-ons or mass targeting of a member are prohibited; instigators face action.'},
    {id:'bystander',label:'Speak up / report',gentle:'If you see harassment, report it — quietly is fine. We take it seriously.',strict:'Members are expected to report harassment they witness. Reports are handled confidentially and promptly.'}
  ];
  var DEFAULT_ON=['noharass','noslurs','nothreats','respectviews','nodox'];
  var on={}; RULES.forEach(function(r){ on[r.id]=DEFAULT_ON.indexOf(r.id)>=0; });
  function renderToggles(){ var box=$('toggles'); if(!box) return; box.innerHTML=RULES.map(function(r){ return '<label data-id="'+r.id+'" class="'+(on[r.id]?'on':'')+'"><input type="checkbox" '+(on[r.id]?'checked':'')+'><span>'+esc(r.label)+'</span></label>'; }).join('');
    box.querySelectorAll('input').forEach(function(c){ c.addEventListener('change',function(){ var id=c.closest('label').getAttribute('data-id'); on[id]=c.checked; c.closest('label').classList.toggle('on',c.checked); build(); }); }); }
  function build(){ var name=($('cname').value||'').trim()||'this community'; var strict=$('strict').value;
    var L=['🛡️ ANTI-HARASSMENT POLICY — '+name,'','Everyone here deserves to feel safe — members and visitors, of every background and view. By taking part, you agree to the following:',''];
    var n=1;
    L.push(n++ +'. Treat every person with basic dignity, including those you disagree with.');
    RULES.forEach(function(r){ if(!on[r.id]) return; L.push(n++ +'. '+(strict==='strict'?r.strict:r.gentle)); });
    L.push('');
    L.push('REPORTING: If you experience or witness any of the above, contact a moderator privately. Reports are taken seriously and handled discreetly.');
    var cons=(strict==='strict')?'CONSEQUENCES: Breaches lead to warning, removal, or an immediate ban for serious cases. Moderators\' decisions stand.':(strict==='gentle'?'CONSEQUENCES: We\'ll usually talk it through first; repeated or serious breaches may lead to removal.':'CONSEQUENCES: Depending on severity, breaches lead to a warning, temporary mute, or removal. Serious cases (threats, doxxing) may be immediate.');
    L.push(cons);
    $('out').textContent=L.join('\n');
  }
  $('cname').addEventListener('input',build); $('strict').addEventListener('change',build);
  $('genBtn').addEventListener('click',build);
  $('allBtn').addEventListener('click',function(){ RULES.forEach(function(r){ on[r.id]=true; }); renderToggles(); build(); });
  $('copyBtn').addEventListener('click',function(){ if(A.copy) A.copy($('out').textContent,$('copyBtn')); });
  renderToggles(); build();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 088 script error', e); }
});
