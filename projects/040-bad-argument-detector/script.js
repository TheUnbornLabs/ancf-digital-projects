/* Project 040 · Bad Argument Detector — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var CATS={relevance:'Relevance',presumption:'Presumption',emotion:'Emotional',evidence:'Weak evidence'};
  var FALL=[
    {id:'adhominem',name:'Ad hominem',cat:'relevance',def:'Attacking the person making the argument instead of the argument itself.',ex:'"You only say that because you\'re bitter and selfish."',re:/\b(you'?re (just |an? |so )?(idiot|stupid|naive|selfish|bitter|broken|damaged)|coming from someone like you|that'?s why no one|typical of you)\b/i},
    {id:'strawman',name:'Straw man',cat:'relevance',def:'Misrepresenting someone\'s view as a weaker, easier-to-attack version, then knocking that down.',ex:'"So you\'re saying you hate children and family altogether."',re:/\b(so you'?re saying|so what you'?re saying|what you really mean is|so you (just )?(want|hate)|you basically want)\b/i},
    {id:'tuquoque',name:'Tu quoque / whataboutism',cat:'relevance',def:'Dodging a point by accusing the other person of hypocrisy or pointing elsewhere.',ex:'"What about you? You break rules too."',re:/\b(what about (you|them)|you do it too|you'?re one to talk|look who'?s talking|hypocrite)\b/i},
    {id:'authority',name:'Appeal to (vague) authority',cat:'relevance',def:'Citing an unnamed or irrelevant authority as if that settles the matter.',ex:'"Experts say humans are meant to reproduce, so it\'s settled."',re:/\b((the )?experts? say|scientists say|doctors say|studies show|because (i|we|they) said so|the bible says)\b/i},
    {id:'bandwagon',name:'Bandwagon (appeal to popularity)',cat:'relevance',def:'Claiming something is true or right because most people believe or do it.',ex:'"Everyone has kids eventually — nobody really chooses not to."',re:/\b(everyone (knows|does|else|wants)|most people|nobody (really )?|no one else|all my friends)\b/i},
    {id:'nature',name:'Appeal to nature',cat:'presumption',def:'Assuming that because something is "natural," it is therefore good or obligatory.',ex:'"It\'s only natural to have children, so you should."',re:/\b(only natural|it'?s natural|unnatural|against nature|nature intended|what we'?re made for|meant to (have|reproduce))\b/i},
    {id:'tradition',name:'Appeal to tradition',cat:'presumption',def:'Treating "we\'ve always done it this way" as a reason that it\'s right.',ex:'"People have always had children; it\'s tradition."',re:/\b(always (been|done|had)|we'?ve always|for (centuries|generations)|it'?s tradition|the way it'?s always been)\b/i},
    {id:'dilemma',name:'False dilemma',cat:'presumption',def:'Presenting only two options when more exist.',ex:'"Either you have kids or you\'ll die alone and miserable."',re:/\b(either .{2,40}\bor\b|only two (choices|options)|you'?re either|if you'?re not .{2,30} then you'?re|there'?s no (middle|other way))\b/i},
    {id:'circular',name:'Circular reasoning',cat:'presumption',def:'Using the conclusion as its own support — the claim just restates itself.',ex:'"It\'s wrong because it\'s simply not right."',re:/\b(because it just is|by definition it'?s|it'?s true because it'?s|that'?s just how it is|right is right)\b/i},
    {id:'loaded',name:'Loaded question',cat:'presumption',def:'A question with an unfair assumption built in, so any answer concedes it.',ex:'"Why do you hate the idea of family so much?"',re:/\b(why do you (hate|refuse|insist|always)|when did you stop|don'?t you (even )?care|so you admit)\b/i},
    {id:'emotion',name:'Appeal to emotion',cat:'emotion',def:'Substituting feelings — guilt, fear, pity — for reasons.',ex:'"Think of how heartbroken your poor mother will be."',re:/\b(think of the|how dare you|you should be ashamed|breaks my heart|if you (really )?loved|your poor (mother|parents|family))\b/i},
    {id:'slippery',name:'Slippery slope',cat:'emotion',def:'Claiming one step must inevitably lead to an extreme outcome, without justifying the chain.',ex:'"If people stop having kids, society will simply collapse."',re:/\b(next thing you know|before you know it|slippery slope|will (inevitably )?lead to|where does it end|society will collapse|what'?s next)\b/i},
    {id:'hasty',name:'Hasty generalization',cat:'evidence',def:'Drawing a sweeping conclusion from too few cases.',ex:'"All childfree people end up lonely."',re:/\b(all (men|women|people|of them)|every single|they'?re all|always end up|never happy)\b/i},
    {id:'anecdotal',name:'Anecdotal evidence',cat:'evidence',def:'Treating one personal story as proof of a general rule.',ex:'"My grandma had five kids and was happy, so it works."',re:/\b(my (aunt|uncle|cousin|friend|neighbou?r|grandma|grandmother|mother|sister)|i know someone who|it worked for me)\b/i},
    {id:'ignorance',name:'Appeal to ignorance',cat:'evidence',def:'Arguing something is true simply because it hasn\'t been proven false (or vice versa).',ex:'"You can\'t prove being childfree makes anyone happy."',re:/\b(no (proof|evidence) (that|it|of)|can'?t prove|hasn'?t been (dis)?proven|until you prove)\b/i}
  ];
  var SAMPLES=[
    {t:'Common pushback',a:"You'll regret it — everyone wants kids eventually, and anyone who says otherwise is just selfish and bitter. It's only natural. Think of how heartbroken your poor parents will be."},
    {t:'The "tradition" case',a:"Either you have children or you'll die alone and miserable. People have always had kids; it's tradition. My grandma had five and she was perfectly happy."},
    {t:'The "settled science" case',a:"Experts say humans are meant to reproduce, so it's settled. You can't prove being childfree makes anyone happy, and so what you're really saying is you hate family."}
  ];
  function renderSamples(){ var box=$('samples'); if(!box) return; box.innerHTML=SAMPLES.map(function(s,i){ return '<button type="button" class="sample-btn" data-i="'+i+'">'+esc(s.t)+'</button>'; }).join('');
    box.querySelectorAll('.sample-btn').forEach(function(b){ b.addEventListener('click',function(){ $('argIn').value=SAMPLES[+b.getAttribute('data-i')].a; scan(); }); }); }
  function scan(){
    var text=$('argIn').value||''; var box=$('findings'); if(!box) return;
    if(!text.trim()){ box.innerHTML='<p class="note">Paste an argument (or pick a sample) and press scan.</p>'; return; }
    var hits=[];
    FALL.forEach(function(f){ var m=f.re.exec(text); if(m){ hits.push({f:f,q:m[0]}); } });
    if(!hits.length){ box.innerHTML='<div class="finding" style="border-left-color:var(--info)"><span class="tac">No obvious fallacy patterns found.</span><p class="what">That doesn\'t guarantee the reasoning is sound — the scanner only catches common phrasings. Read it critically yourself, and browse the field guide below.</p></div>'; return; }
    box.innerHTML='<p class="outmeta">Found '+hits.length+' possible pattern'+(hits.length>1?'s':'')+'. Use your judgement — a flag is a prompt to think, not a verdict.</p>'+
      hits.map(function(h){ return '<div class="finding"><span class="tac">'+esc(h.f.name)+'</span> <span class="note">· '+esc(CATS[h.f.cat])+'</span><p class="what">'+esc(h.f.def)+'</p><p class="quote">Flagged: "…'+esc(h.q)+'…"</p></div>'; }).join('');
  }
  $('scanBtn').addEventListener('click',scan);
  $('clearBtn').addEventListener('click',function(){ $('argIn').value=''; scan(); });

  /* field guide */
  var fcat='all', fq='';
  function renderChips(){ var box=$('catChips'); if(!box) return; var cats=['all'].concat(Object.keys(CATS));
    box.innerHTML=cats.map(function(c){ return '<button type="button" class="fchip'+(c===fcat?' active':'')+'" data-c="'+c+'">'+(c==='all'?'All':esc(CATS[c]))+'</button>'; }).join('');
    box.querySelectorAll('.fchip').forEach(function(b){ b.addEventListener('click',function(){ fcat=b.getAttribute('data-c'); renderChips(); renderGuide(); }); }); }
  function renderGuide(){ var box=$('guideList'); if(!box) return;
    var list=FALL.filter(function(f){ if(fcat!=='all'&&f.cat!==fcat) return false; if(fq){ var s=(f.name+' '+f.def+' '+f.ex).toLowerCase(); if(s.indexOf(fq)<0) return false; } return true; });
    box.innerHTML=list.map(function(f){ return '<details><summary>'+esc(f.name)+' <span class="note">· '+esc(CATS[f.cat])+'</span><span class="chev">▾</span></summary><div class="body"><p>'+esc(f.def)+'</p><p class="note"><b>Example:</b> '+esc(f.ex)+'</p></div></details>'; }).join('');
    var c=$('guideCount'); if(c) c.textContent='Showing '+list.length+' of '+FALL.length+' fallacies.'; }
  $('guideSearch').addEventListener('input',function(){ fq=this.value.trim().toLowerCase(); renderGuide(); });

  renderSamples(); scan(); renderChips(); renderGuide();

  (function(){
    var Q=[{a:0},{a:0}], E=['"You only think that because you\'re bitter" attacks the person — that\'s ad hominem.','A fallacy means one step of the reasoning is weak; it doesn\'t make the person bad or the conclusion automatically false.'];
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
} catch(e){ console.error('project 040 script error', e); }
});
