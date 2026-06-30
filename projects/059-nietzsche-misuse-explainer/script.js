/* Project 059 · Nietzsche Misuse Explainer — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  (function(){ var box=$('howCards'); if(!box) return;
    var H=[['Flattened to slogans','A line is lifted from a dense, ironic, often self-questioning book and printed on a black square. Stripped of context, it can be made to say almost anything.'],
      ['His sister\'s editing','After Nietzsche\'s 1889 collapse, his sister Elisabeth Förster-Nietzsche — wife of an antisemite — controlled his archive and assembled "The Will to Power" from notebook fragments, steering his image toward the nationalism he had attacked.'],
      ['Read backwards from the conclusion','People who already want nihilism, cruelty, or "might makes right" reach for him as cover, hearing endorsement where he often wrote diagnosis or warning.']];
    box.innerHTML=H.map(function(p){ return '<div class="scard"><h4>'+esc(p[0])+'</h4><span class="tg">Tap to expand</span><div class="more">'+esc(p[1])+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();

  var DEC=[
    {line:'"God is dead."',mis:'A triumphant cheer for atheism — religion debunked, party time.',clo:'A sombre diagnosis: the shared framework that gave Europe meaning has collapsed, and we may not grasp the abyss this opens. In the famous passage a "madman" cries it in horror, asking who will clean the blood from our hands.',src:'The Gay Science (1882), §125; also Thus Spoke Zarathustra.'},
    {line:'"What does not kill me makes me stronger."',mis:'A no-pain-no-gain hustle slogan: all suffering is good for you.',clo:'A compressed aphorism about resilience, not a law of nature — plenty of suffering breaks people rather than strengthening them. Nietzsche prized the kind of hardship one can integrate, not pain for its own sake.',src:'Twilight of the Idols (1888), "Maxims and Arrows," §8.'},
    {line:'The Übermensch ("Overman").',mis:'A biological "master race" to rule the "lesser" — later seized by the Nazis.',clo:'An ideal of self-overcoming: a person who creates their own values after the old certainties have fallen. It is ethical and individual, not racial. Nietzsche despised antisemitism and German nationalism.',src:'Thus Spoke Zarathustra (1883–85).'},
    {line:'"Will to power."',mis:'A glorification of domination, tyranny, and cruelty.',clo:'Primarily a psychological idea: a drive toward growth, mastery, and self-overcoming that Nietzsche saw running through life. Channeled into self-command, not least over oneself — not a political licence to crush others.',src:'Developed across his later works; the book "The Will to Power" was assembled posthumously by editors.'},
    {line:'Nietzsche the nihilist.',mis:'He taught that nothing matters and life is worthless.',clo:'He diagnosed nihilism as a looming danger to be overcome, not a creed to adopt. His answer was radical life-affirmation — amor fati and the thought of eternal recurrence: could you will your life to repeat forever?',src:'The Gay Science §276 (amor fati), §341 (eternal recurrence).'},
    {line:'Using Nietzsche to say "life is not worth living."',mis:'A patron saint for despair and against existence.',clo:'Among the least Nietzschean readings possible. His central project was to affirm life — including its suffering — without the comforts he thought had been lost. Conscripting him for life-denial inverts his aim.',src:'Throughout his mature works; esp. the doctrine of amor fati.'}
  ];
  (function(){ var box=$('decoder'); if(!box) return; box.innerHTML=DEC.map(function(d,i){ return '<button type="button" data-i="'+i+'">'+esc(d.line)+'</button>'; }).join('');
    box.querySelectorAll('button').forEach(function(b){ b.addEventListener('click',function(){ box.querySelectorAll('button').forEach(function(x){ x.classList.toggle('sel',x===b); }); var d=DEC[+b.getAttribute('data-i')]; var o=$('dout'); if(o){ o.innerHTML='<div class="row mis"><span class="lbl">Popular misreading</span><div>'+esc(d.mis)+'</div></div><div class="row clo"><span class="lbl">A closer reading</span><div>'+esc(d.clo)+'</div></div><div class="src">Source: '+esc(d.src)+'</div>'; o.classList.add('show'); } }); }); })();

  var ATTR=[
    {s:'"What is done out of love always takes place beyond good and evil."',a:'real',why:'Genuine Nietzsche — Beyond Good and Evil (1886), §153.'},
    {s:'"Sometimes people don\'t want to hear the truth because they don\'t want their illusions destroyed."',a:'fake',why:'Widely attributed to Nietzsche online, but with no reliable source in his works. Treat as very likely misattributed.'},
    {s:'"God is dead, and we have killed him — therefore atheism is obviously correct and comforting."',a:'distort',why:'The first clause echoes Nietzsche, but the added gloss inverts his foreboding tone into a cheerful conclusion he did not draw.'},
    {s:'"He who has a why to live can bear almost any how."',a:'real',why:'Genuine — Twilight of the Idols (1888), "Maxims and Arrows," §12. (Later quoted by Viktor Frankl.)'},
    {s:'"The strong should rule the weak; cruelty is the highest virtue."',a:'distort',why:'A caricature assembled from decontextualized fragments; it ignores his irony and his critique of mere domination. Not a faithful statement of his view.'}
  ];
  var done=0;
  (function(){ var box=$('attribBox'); if(!box) return; box.innerHTML=ATTR.map(function(it,i){ return '<div class="aitem" data-i="'+i+'"><div class="stmt">'+esc(it.s)+'</div><div class="opts2"><button type="button" data-v="real">Genuine</button><button type="button" data-v="distort">Distorted</button><button type="button" data-v="fake">Misattributed</button></div><div class="exp"></div></div>'; }).join('');
    box.querySelectorAll('.aitem').forEach(function(el){ var i=+el.getAttribute('data-i'), it=ATTR[i];
      el.querySelectorAll('button').forEach(function(b){ b.addEventListener('click',function(){ if(el.classList.contains('done'))return; var v=b.getAttribute('data-v'),correct=v===it.a;
        el.querySelectorAll('button').forEach(function(x){ if(x.getAttribute('data-v')===it.a)x.classList.add('ok'); else if(x===b)x.classList.add('no'); });
        var label={real:'Genuine',distort:'Distorted',fake:'Misattributed'}[it.a];
        el.querySelector('.exp').innerHTML=(correct?'<b>Correct — </b>':'<b>Actually: '+label+'. </b>')+esc(it.why); el.classList.add('done'); done++;
        var sc=$('attribScore'); if(sc) sc.textContent=done+' of '+ATTR.length+' classified.'; }); }); }); })();

  (function(){
    var Q=[{a:0},{a:0}], E=['For Nietzsche, "God is dead" was a diagnosis of a cultural crisis of meaning, voiced with foreboding (the "madman" passage).','The "master race" reading is a distortion, spread partly through his sister\'s edits and later Nazi appropriation; Nietzsche opposed antisemitism.'];
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
} catch(e){ console.error('project 059 script error', e); }
});
