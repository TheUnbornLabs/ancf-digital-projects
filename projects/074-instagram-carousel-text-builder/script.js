/* Project 074 · Instagram Carousel Text Builder — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var TOPICS={
    pronatalism:{name:'Understanding pronatalism',hook:'Why does everyone assume you\'ll have kids?',points:['Pronatalism is the quiet assumption that parenthood is the default, expected path — so common it\'s invisible.','It works on four levels: the people around you, the culture, institutions, and the voice in your own head.','Naming it isn\'t blaming anyone. It just turns a choice that was being made *for* you into one you make yourself.'],close:'However you build your life, may it be on purpose. 💛'},
    childfree:{name:'Childfree, on purpose',hook:'"Childfree" isn\'t a gap. It\'s a life.',points:['Childfree usually means a deliberate choice — distinct from "childless," which can mean circumstance.','A life can be completely full without children: love, work, friendship, creativity, rest.','Choosing the life that fits you isn\'t selfish to anyone — there\'s no one being deprived.'],close:'Different paths, equal dignity. 🌿'},
    autonomy:{name:'Reproductive autonomy',hook:'Whether, when, and if — that\'s yours to decide.',points:['Reproductive autonomy means the freedom to choose: to have children, and equally, to not.','It includes access, information, and freedom from coercion — in both directions.','A choice made freely, by you, deserves respect — full stop.'],close:'Your body, your timeline, your call. 🤍'},
    pressure:{name:'Handling the pressure',hook:'"So, when are you having kids?" — here\'s a calmer way through.',points:['Most pressure is well-meant, which is what makes it hard. You can answer the worry, not the words.','A short, warm line works better than a debate: "I\'m at peace with my choice, thanks."','You owe no one the reasons for your own life. "It\'s not for me" is a complete sentence.'],close:'Boundaries can be kind. Hold yours gently. 🕊️'},
    basics:{name:'Antinatalism, briefly',hook:'What antinatalism actually is (and isn\'t).',points:['It\'s a philosophical view that assigns a negative value to coming into existence — a claim about procreation.','It is NOT wanting existing people harmed, and it isn\'t the same as being childfree.','Like any view in ethics, it has careful arguments and reasonable objections worth understanding.'],close:'Understand it on its merits — then make up your own mind. 📚'}
  };
  var HOOKWRAP={warm:function(h){return h;},punchy:function(h){return h.toUpperCase().replace(/[💛🌿🤍🕊️📚]/g,'');},thoughtful:function(h){return 'A thought:\n\n'+h;}};
  var slides=[];
  function fillTopics(){ var s=$('topic'); s.innerHTML=Object.keys(TOPICS).map(function(k){ return '<option value="'+k+'">'+esc(TOPICS[k].name)+'</option>'; }).join(''); }
  function build(){
    var t=TOPICS[$('topic').value], tone=$('tone').value;
    slides=[]; slides.push({type:'hook',label:'Slide 1 · Hook',text:HOOKWRAP[tone](t.hook)});
    t.points.forEach(function(p,i){ slides.push({type:'point',label:'Slide '+(i+2)+' · Point '+(i+1),text:p}); });
    slides.push({type:'close',label:'Slide 5 · Close',text:t.close});
    render();
  }
  function render(){ var box=$('slidesBox'); if(!box) return;
    box.innerHTML=slides.map(function(s,i){ return '<div class="slide '+s.type+'"><div class="sh">'+esc(s.label)+'<button type="button" class="cps" data-i="'+i+'">Copy</button></div><div class="sb">'+esc(s.text)+'</div></div>'; }).join('');
    box.querySelectorAll('.cps').forEach(function(b){ b.addEventListener('click',function(){ if(A.copy) A.copy(slides[+b.getAttribute('data-i')].text,b); }); });
  }
  function allText(){ return slides.map(function(s,i){ return '— '+s.label+' —\n'+s.text; }).join('\n\n'); }
  $('buildBtn').addEventListener('click',build);
  $('topic').addEventListener('change',build); $('tone').addEventListener('change',build);
  $('copyAllBtn').addEventListener('click',function(){ if(A.copy) A.copy(allText(),$('copyAllBtn')); });
  fillTopics(); build();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 074 script error', e); }
});
