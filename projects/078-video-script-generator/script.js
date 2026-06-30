/* Project 078 · Video Script Generator — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function mmss(s){ var m=Math.floor(s/60), ss=s%60; return ('0'+m).slice(-2)+':'+('0'+ss).slice(-2); }
  var TOPICS={
    pronatalism:{name:'What is pronatalism?',hook:{warm:'Ever notice how everyone just assumes you\'ll have kids?',direct:'Pronatalism: the assumption nobody questions.',curious:'Why does "when are you having kids?" feel so normal?'},body:['Pronatalism is the quiet assumption that having children is the default, expected path for everyone.','It reaches us four ways: from people, from culture, from institutions, and from the voice in our own heads.','Naming it isn\'t blaming anyone — it just turns an unexamined default into an actual choice.'],cta:'If this made you think, share it with someone who\'s felt the pressure.'},
    childfree:{name:'Childfree, explained',hook:{warm:'Childfree isn\'t a gap in a life — it is a life.',direct:'Three things people get wrong about being childfree.',curious:'What does "childfree" actually mean?'},body:['Childfree usually means a deliberate choice — different from "childless," which can mean circumstance.','It doesn\'t mean disliking children; many childfree people adore them.','A full, meaningful life simply doesn\'t require them for everyone.'],cta:'Know someone who\'d feel seen by this? Send it their way.'},
    autonomy:{name:'Reproductive autonomy',hook:{warm:'Whether, when, and if — that should be yours to decide.',direct:'Reproductive autonomy runs both ways.',curious:'What does real reproductive freedom include?'},body:['Reproductive autonomy is the freedom to choose: to have children, and equally, to not.','It needs information, access, and freedom from coercion — in either direction.','A choice made freely deserves respect, whatever it is.'],cta:'Let\'s normalise respecting every freely-made choice. Pass it on.'},
    pressure:{name:'Handling the question',hook:{warm:'"So, when are you having kids?" Here\'s a calmer way through.',direct:'How to answer the kids question without a fight.',curious:'What\'s the kindest way to handle that nosy question?'},body:['Remember most people mean well — you can answer the worry, not the words.','A short warm line beats a debate: "I\'m at peace with my choice, thanks."','And you owe no one your reasons. "It\'s not for me" is a full sentence.'],cta:'Save this for the next family gathering — and breathe.'}
  };
  function fillTopics(){ var s=$('topic'); s.innerHTML=Object.keys(TOPICS).map(function(k){ return '<option value="'+k+'">'+esc(TOPICS[k].name)+'</option>'; }).join(''); }
  function gen(){
    var t=TOPICS[$('topic').value], tone=$('tone').value, len=+$('length').value;
    var nBody = len<=30?1 : len<=60?2 : 3;
    var hookT=Math.round(len*0.12), ctaT=Math.round(len*0.15), bodyTotal=len-hookT-ctaT, per=Math.round(bodyTotal/nBody);
    var L=[]; var t0=0;
    L.push('['+mmss(t0)+'] HOOK'); L.push('  '+t.hook[tone]); t0+=hookT;
    for(var i=0;i<nBody;i++){ L.push(''); L.push('['+mmss(t0)+'] POINT '+(i+1)); L.push('  '+t.body[i]); t0+=per; }
    L.push(''); L.push('['+mmss(Math.min(t0,len-ctaT))+'] CALL TO ACTION'); L.push('  '+t.cta);
    L.push(''); L.push('— Total ≈ '+len+'s · '+nBody+' point'+(nBody>1?'s':'')+' —');
    var out=$('out'); out.innerHTML=L.map(function(line){ return line.replace(/^\[(\d\d:\d\d)\]/,'<span class="mark">[$1]</span>'); }).join('\n');
  }
  $('genBtn').addEventListener('click',gen);
  ['topic','length','tone'].forEach(function(id){ var el=$(id); if(el) el.addEventListener('change',gen); });
  $('copyBtn').addEventListener('click',function(){ if(A.copy) A.copy($('out').textContent,$('copyBtn')); });
  (function(){ var box=$('tipCards'); if(!box) return;
    var T=[['Earn the first 5 seconds','Open with the question or the surprise, not a slow intro. If the hook doesn\'t land, the rest won\'t be seen.'],['One idea per beat','Each point should survive on its own. If you\'re cramming, cut — clarity beats completeness in short video.'],['Close with an invite','End by inviting reflection or a share, not by lecturing. Warmth travels further than a wagging finger.']];
    box.innerHTML=T.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  fillTopics(); gen();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 078 script error', e); }
});
