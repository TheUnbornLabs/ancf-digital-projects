/* Project 027 · Risk Argument Explainer — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  /* 1 · factor cards */
  (function(){
    var box=$('factorCards'); if(!box) return;
    var F=[
      {t:'Consent',tg:'Did the risk-bearer agree?',more:'Risks we take on ourselves are easy to justify. Risks imposed on others without consent need far more.'},
      {t:'Reversibility',tg:'Can it be undone?',more:'A reversible risk is forgiving — try, and reverse if it goes wrong. An irreversible one offers no second chance.'},
      {t:'Severity ceiling',tg:'How bad is the worst case?',more:'A capped downside is easier to accept than one whose worst outcomes are catastrophic and uncompensable.'},
      {t:'Who bears it',tg:'Who pays if it goes wrong?',more:'We allow people to gamble with their own stakes far more readily than with someone else\'s.'},
      {t:'Who chose',tg:'Who made the decision?',more:'A risk chosen by the one who bears it differs morally from one chosen for them by another.'},
      {t:'For whose benefit',tg:'Is it in the risk-bearer\'s interest?',more:'Imposing a risk on someone for THEIR clear benefit is one thing; for someone else\'s ends is another.'}
    ];
    box.innerHTML=F.map(function(f){ return '<div class="scard" tabindex="0"><h4>'+esc(f.t)+'</h4><p class="tg">'+esc(f.tg)+'</p><p class="more">'+esc(f.more)+'</p></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ function t(){ c.classList.toggle('open'); } c.addEventListener('click',t); c.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();t();} }); });
  })();

  /* 2 · comparator */
  (function(){
    var sel=$('cmpSel'), table=$('cmpTable'), reading=$('cmpReading'); if(!sel) return;
    var FACTORS=['Consent obtained','Reversible','Severity ceiling','Who bears the harm','Who chose','For their benefit'];
    // g=ok(green), b=concern(red)
    var EVERYDAY={
      drive:{name:'Teaching your teen to drive',cells:[['Yes','g'],['n/a — ongoing','g'],['Moderate, capped','g'],['The teen (and others)','b'],['The teen agrees','g'],['Yes — for them','g']]},
      vax:{name:'Vaccinating your child',cells:[['Proxy (best interest)','b'],['No (medical)','b'],['Low','g'],['The child','b'],['Parent, for the child','b'],['Yes — clearly for them','g']]},
      sky:{name:'A friend trying skydiving',cells:[['Yes','g'],['No (per jump)','b'],['High, but rare','b'],['The jumper','g'],['The jumper chooses','g'],['Yes — they want it','g']]},
      surg:{name:'Elective surgery on yourself',cells:[['Yes','g'],['Often no','b'],['Variable','b'],['You','g'],['You choose','g'],['Yes — for you','g']]}
    };
    var PROC=[['Impossible — no one to ask','b'],['No — cannot be undone','b'],['Unbounded — could be a life of severe suffering','b'],['The created person, entirely','b'],['Someone else, before they exist','b'],['Not for an existing person — there was none','b']];
    sel.innerHTML=Object.keys(EVERYDAY).map(function(k){ return '<option value="'+k+'">'+esc(EVERYDAY[k].name)+'</option>'; }).join('');
    function render(){
      var ev=EVERYDAY[sel.value];
      var rows='<tr><th>Factor</th><th>'+esc(ev.name)+'</th><th>Creating a life</th></tr>';
      for(var i=0;i<FACTORS.length;i++){ rows+='<tr><td><b>'+esc(FACTORS[i])+'</b></td><td><span class="'+ev.cells[i][1]+'">'+esc(ev.cells[i][0])+'</span></td><td><span class="'+PROC[i][1]+'">'+esc(PROC[i][0])+'</span></td></tr>'; }
      table.innerHTML=rows;
      var evConcern=ev.cells.filter(function(c){return c[1]==='b';}).length;
      reading.innerHTML='Across these six factors, <b>'+ev.name.toLowerCase()+'</b> raises a concern on <b>'+evConcern+'</b> of them, while <b>creating a life raises a concern on all six at once</b>. That convergence — no consent, irreversible, unbounded severity, borne by the one who didn\'t choose and gains no prior benefit — is what the risk argument says makes procreation uniquely hard to justify. A critic will press whichever cell they find too quick.';
    }
    sel.addEventListener('change',render); render();
  })();

  /* 3 · lenses */
  (function(){
    var box=$('lensCards'); if(!box) return;
    var L=[
      {t:'Expected value',tg:'Utilitarian',more:'Average the outcomes by probability; if positive, take the bet. Critics: averaging can hide catastrophic harms to individuals.'},
      {t:'The precautionary principle',tg:'Risk ethics',more:'When a harm is serious and irreversible, avoid it even at some cost to the upside. Birth\'s worst outcomes are both.'},
      {t:'Maximin / the veil',tg:'Rawls',more:'Choose as if you might land in the worst outcome. It weights the floor heavily — and counsels caution when the floor is severe.'}
    ];
    box.innerHTML=L.map(function(f){ return '<div class="scard" tabindex="0"><h4>'+esc(f.t)+'</h4><p class="tg">'+esc(f.tg)+'</p><p class="more">'+esc(f.more)+'</p></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ function t(){ c.classList.toggle('open'); } c.addEventListener('click',t); c.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();t();} }); });
  })();

  /* 4 · replies */
  (function(){
    var box=$('objList'); if(!box) return;
    var O=[
      {t:'Most people are glad to exist',o:'The vast majority rate their lives as good and would not undo their birth. If the gamble almost always pays off, imposing it looks justified.',r:'Reply: self-reports are shaped by optimism bias and survivorship — we don\'t hear from lives that went very badly, and adaptation inflates the rest. "Usually fine" is also cold comfort to the minority for whom it isn\'t.'},
      {t:'Refusing all risk forbids everything',o:'By this logic we could never act, since every action risks harm to someone. The argument proves too much.',r:'Reply: the argument isn\'t "avoid all risk" but "this specific convergence is special" — maximal, irreversible, unconsented, borne by another. Few everyday acts share all of that.'},
      {t:'The non-identity problem',o:'You can\'t wrong a person by creating them if their only alternative is never existing — there\'s no better state for THEM to be denied.',r:'Reply: antinatalists answer with impersonal or asymmetry-based reasoning; the imposed harm can count even without a comparative "worse for". The puzzle is real and unresolved (see Reader Ch. 25).'},
      {t:'Risk can be permissible under conditions',o:'(After Rivka Weinberg.) Procreation imposes risk, but may be permissible when the risk is reasonable and the motives appropriate — not blanket-wrong.',r:'A measured middle view. It concedes the risk is real and morally loaded, while denying it is always decisive. Whether the conditions are usually met is the live question.'}
    ];
    box.innerHTML=O.map(function(o){ return '<details class="obj"><summary>'+esc(o.t)+'<span class="chev" aria-hidden="true">›</span></summary><div class="body"><p>'+esc(o.o)+'</p><div class="reply"><b>Reply:</b> '+esc(o.r)+'</div></div></details>'; }).join('');
  })();

  (function(){
    var Q=[{a:1},{a:0},{a:0}], E=['It scores "hard to justify" on nearly every factor at once — a rare convergence.','The precautionary lens says avoid serious, irreversible harms even at some cost to the upside.','A key reply is that most people are glad to exist (a revealed-preference argument).'];
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
    var s=$('saveBtn'),cl=$('clearBtn');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 027 script error', e); }
});
