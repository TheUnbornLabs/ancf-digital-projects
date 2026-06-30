/* Project 063 · Boundary Runner — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  var headless=/jsdom/i.test((window.navigator&&window.navigator.userAgent)||'');
  var cv=$('cv'), ctx=cv&&cv.getContext?cv.getContext('2d'):null;
  var W=340,H=240, GND=H-40, PX=46, PW=22,PH=30, G=0.7, JUMP=-11;
  var st={running:false,over:false,py:GND-PH,vy:0,onGround:true,obs:[],score:0,best:0,speed:3.2,spawn:0};
  st.best=(A.getJSON?A.getJSON('best',0):0)||0; var be=$('best'); if(be)be.textContent=st.best;
  function reset(){ st.running=false;st.over=false;st.py=GND-PH;st.vy=0;st.onGround=true;st.obs=[];st.score=0;st.speed=3.2;st.spawn=40; var s=$('score'); if(s)s.textContent=0; }
  function start(){ reset(); st.running=true; var ov=$('overlay'); if(ov)ov.classList.remove('show'); if(!headless) requestAnimationFrame(loop); }
  function end(){ st.running=false; st.over=true; if(st.score>st.best){ st.best=st.score; if(A.setJSON)A.setJSON('best',st.score); var b=$('best'); if(b)b.textContent=st.score; }
    var ov=$('overlay'); if(ov){ ov.classList.add('show'); $('ovTitle').textContent='Tripped!'; $('ovMsg').innerHTML='You cleared <b>'+st.score+'</b>. Dust off — run again.'; $('startBtn').textContent='Run again'; } }
  function jump(){ if(!st.running)return; if(st.onGround){ st.vy=JUMP; st.onGround=false; } }
  function update(dt){ if(!st.running)return; dt=dt||1;
    st.vy+=G*dt; st.py+=st.vy*dt; if(st.py>=GND-PH){ st.py=GND-PH; st.vy=0; st.onGround=true; }
    st.speed=3.2+st.score*0.05;
    st.spawn-=dt; if(st.spawn<=0){ var hh=18+Math.floor(Math.random()*16); st.obs.push({x:W+10,h:hh,passed:false}); st.spawn=(70+Math.random()*40)/(1+st.score/40); }
    for(var i=st.obs.length-1;i>=0;i--){ var o=st.obs[i]; o.x-=st.speed*dt;
      if(!o.passed && o.x+16<PX){ o.passed=true; st.score++; var s=$('score'); if(s)s.textContent=st.score; }
      var pr={x:PX,y:st.py,w:PW,h:PH}, orr={x:o.x,y:GND-o.h,w:16,h:o.h};
      if(pr.x<orr.x+orr.w && pr.x+pr.w>orr.x && pr.y+pr.h>orr.y){ end(); return; }
      if(o.x<-20) st.obs.splice(i,1); }
  }
  function draw(){ if(!ctx)return; ctx.clearRect(0,0,W,H);
    ctx.strokeStyle='rgba(127,127,127,.5)'; ctx.beginPath(); ctx.moveTo(0,GND);ctx.lineTo(W,GND); ctx.stroke();
    ctx.fillStyle='#b3122a'; st.obs.forEach(function(o){ ctx.fillRect(o.x,GND-o.h,16,o.h); });
    ctx.fillStyle='#1f7a4d'; ctx.fillRect(PX,st.py,PW,PH);
  }
  function loop(){ if(!st.running)return; update(1); draw(); if(!headless) requestAnimationFrame(loop); }
  var sb=$('startBtn'); if(sb) sb.addEventListener('click',start);
  var jb=$('jumpBtn'); if(jb) jb.addEventListener('click',jump);
  window.addEventListener('keydown',function(e){ if(e.key===' '||e.key==='ArrowUp'){ e.preventDefault&&e.preventDefault(); if(!st.running) start(); else jump(); } });
  if(cv) cv.addEventListener('pointerdown',function(){ if(!st.running) start(); else jump(); });
  if(!headless && ctx) draw();
  window.__game={st:st,update:update,start:start,reset:reset,jump:jump,step:function(n){ n=n||1; for(var i=0;i<n;i++) update(1); }};
  (function(){ var box=$('aboutCards'); if(!box) return;
    var C=[['Hurdles, not walls','Most of what comes at you is clearable. Naming something a "hurdle" instead of a "wall" already changes how you meet it.'],['Time the jump','Hop too early or too late and you clip it. A well-timed, brief lift — a calm pause, a ready line — clears most things.'],['Then keep running','After a hurdle you land and carry on. You don\'t have to relive it; the track keeps going, and so do you.']];
    box.innerHTML=C.map(function(p){ return '<div class="scard"><h4>'+p[0]+'</h4><span class="tg">Tap to expand</span><div class="more">'+p[1]+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 063 script error', e); }
});
