/* Project 081 · Legal Rights Awareness Page — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var AREAS=[
    ['Reproductive autonomy & contraception','In many places, adults have recognised rights to make their own decisions about contraception and their bodies — but the details, age rules, and access vary widely. If you ever feel a provider is overriding your informed choice, you can ask for the policy in writing and seek a second opinion.'],
    ['Advance healthcare directive','A document stating your wishes for medical care if you can\'t speak for yourself (sometimes called a living will). It matters especially if you don\'t have a child who would otherwise be assumed to speak for you.'],
    ['Durable / lasting power of attorney','Lets you name someone you trust to make decisions (health and/or financial) on your behalf if you\'re unable to. Without children as a default, choosing and naming this person deliberately is worth doing.'],
    ['Will & estate','A will directs what happens to your belongings and affairs. Where there is no will, the law decides — often by default family hierarchies that may not reflect your wishes or your chosen family.'],
    ['Beneficiary / nominee designations','Pensions, insurance, and accounts often pass by named beneficiary, separately from a will. Keeping these up to date ensures the right people — not a default relative — are provided for.'],
    ['Emergency contacts & care preferences','Who should be called, and what you\'d want, in a crisis. A simple, shared, written note can spare the people you trust a lot of guesswork.']
  ];
  (function(){ var box=$('areaCards'); if(!box) return; box.innerHTML=AREAS.map(function(a){ return '<div class="scard"><h4>'+esc(a[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(a[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  var DOCS=['I understand my contraception/healthcare rights where I live','I have (or have looked into) an advance healthcare directive','I have named a power of attorney I trust','I have a will, or have started one','My beneficiary/nominee designations are up to date','I\'ve written down emergency contacts & care preferences','I know which professional to ask for the specifics'];
  (function(){ var box=$('chkBox'); if(!box) return; var saved=(A.getJSON?A.getJSON('docs',[]):[])||[];
    box.innerHTML=DOCS.map(function(t,i){ return '<label data-i="'+i+'" class="'+(saved.indexOf(i)>=0?'done':'')+'"><input type="checkbox" '+(saved.indexOf(i)>=0?'checked':'')+'><span>'+esc(t)+'</span></label>'; }).join('');
    function upd(){ var on=[]; box.querySelectorAll('label').forEach(function(l){ var c=l.querySelector('input'); if(c.checked){ on.push(+l.getAttribute('data-i')); l.classList.add('done'); } else l.classList.remove('done'); });
      if(A.setJSON)A.setJSON('docs',on); var pct=Math.round(on.length/DOCS.length*100); if(A.meter)A.meter($('meter'),pct); var m=$('chkMsg'); if(m) m.textContent=on.length+' of '+DOCS.length+' looked into'+(on.length===DOCS.length?' — well organised. 🗂️':'.'); }
    box.querySelectorAll('input').forEach(function(c){ c.addEventListener('change',upd); }); upd(); })();
  (function(){ var box=$('stepsBox'); if(!box) return;
    var S=[['Pick one','Choose the single document that matters most to you right now. One is enough to start.'],['Ask a qualified professional','A lawyer, notary, or relevant advisor in your jurisdiction can tell you what actually applies and how to do it properly.'],['Tell your people','Once something is in place, let the person you\'ve named know — and where to find it. A document no one knows about helps no one.'],['Revisit yearly','Lives and laws change. A quick annual check keeps everything current.']];
    box.innerHTML=S.map(function(p){ return '<div class="st"><b>'+esc(p[0])+'.</b> '+esc(p[1])+'</div>'; }).join(''); })();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 081 script error', e); }
});
