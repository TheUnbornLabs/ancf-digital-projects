document.addEventListener('DOMContentLoaded',function(){
try{
window.__STEPS__=[{"q": "A friend teases your childfree choice. You\u2026", "opts": [{"t": "Laugh and hold your ground", "p": 2}, {"t": "Snap back unkindly", "p": 0}, {"t": "Explain calmly", "p": 1}]}, {"q": "Online, someone insults parents in your group. You\u2026", "opts": [{"t": "Ask them to critique ideas, not people", "p": 2}, {"t": "Pile on", "p": 0}, {"t": "Report and de-escalate", "p": 2}]}, {"q": "You feel drained by the debate. You\u2026", "opts": [{"t": "Take a real break", "p": 2}, {"t": "Doomscroll", "p": 0}, {"t": "Talk to someone you trust", "p": 2}]}];

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
