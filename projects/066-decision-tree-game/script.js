document.addEventListener('DOMContentLoaded',function(){
try{
window.__STEPS__=[{"q": "A relative pushes hard about kids at dinner. You\u2026", "opts": [{"t": "Calmly restate your boundary", "p": 2}, {"t": "Argue heatedly", "p": 0}, {"t": "Change the subject kindly", "p": 1}]}, {"q": "They escalate with guilt. You\u2026", "opts": [{"t": "Name the guilt gently", "p": 2}, {"t": "Give in to keep peace", "p": 0}, {"t": "Step away for a breather", "p": 1}]}, {"q": "Afterward you\u2026", "opts": [{"t": "Debrief with a friend", "p": 2}, {"t": "Ruminate alone all night", "p": 0}, {"t": "Do something kind for yourself", "p": 2}]}];

var pts=0,step=0,out=document.getElementById('fOut'),box=document.getElementById('choices');
var S=window.__STEPS__;
function render(){if(step>=S.length){box.innerHTML='';out.textContent='Reflection complete. Freedom points: '+pts+
'. Points are just a playful mirror of choices that protect your autonomy — your real life is yours to weigh.';return;}
var s=S[step];out.textContent=s.q;box.innerHTML='';
s.opts.forEach(function(o){var b=document.createElement('button');b.className='btn';b.style.margin='6px';b.textContent=o.t;
b.addEventListener('click',function(){pts+=o.p;step++;render();});box.appendChild(b);});}
render();

}catch(e){console.error('project script error',e);}
});
