/* Project 067 · Auntie-Uncle Chase Arcade — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  var headless=/jsdom/i.test((window.navigator&&window.navigator.userAgent)||'');
  var cv=$('cv'), ctx=cv&&cv.getContext?cv.getContext('2d'):null;
  var W=320,H=320, PR=11, TR=8, CR=12, PSPD=3.2;
  var st={running:false,over:false,p:{x:W/2,y:H/2},vx:0,vy:0,tokens:[],chasers:[],score:0,best:0,t:0};
  st.best=(A.getJSON?A.getJSON('best',0):0)||0; var be=$('best'); if(be)be.textContent=st.best;
  function rnd(m){ return Math.random()*m; }
  function spawnToken(){ st.tokens.push({x:20+rnd(W-40),y:20+rnd(H-40)}); }
  function spawnChaser(){ var edge=Math.floor(rnd(4)); var x= edge===0?0:edge===1?W:rnd(W); var y= edge===2?0:edge===3?H:rnd(H); st.chasers.push({x:x,y:y,spd:0.9+rnd(0.5)}); }
  function reset(){ st.running=false;st.over=false;st.p={x:W/2,y:H/2};st.vx=0;st.vy=0;st.tokens=[];st.chasers=[];st.score=0;st.t=0; spawnToken(); spawnChaser(); var s=$('score'); if(s)s.textContent=0; }
  function start(){ reset(); st.running=true; var ov=$('overlay'); if(ov)ov.classList.remove('show'); if(!headless) requestAnimationFrame(loop); }
  function end(){ st.running=false; st.over=true; if(st.score>st.best){ st.best=st.score; if(A.setJSON)A.setJSON('best',st.score); var b=$('best'); if(b)b.textContent=st.score; }
    var ov=$('overlay'); if(ov){ ov.classList.add('show'); $('ovTitle').textContent='Cornered!'; $('ovMsg').innerHTML='You gathered <b>'+st.score+'</b> tokens. Nicely done — go again.'; $('startBtn').textContent='Play again'; } }
  function setDir(x,y){ st.vx=x*PSPD; st.vy=y*PSPD; }
  function update(dt){ if(!st.running)return; dt=dt||1; st.t+=dt;
    st.p.x=Math.max(PR,Math.min(W-PR,st.p.x+st.vx*dt)); st.p.y=Math.max(PR,Math.min(H-PR,st.p.y+st.vy*dt));
    for(var i=st.tokens.length-1;i>=0;i--){ var tk=st.tokens[i]; if(Math.hypot(tk.x-st.p.x,tk.y-st.p.y)<PR+TR){ st.tokens.splice(i,1); st.score++; var s=$('score'); if(s)s.textContent=st.score; spawnToken(); if(st.score%4===0) spawnChaser(); } }
    st.chasers.forEach(function(c){ var dx=st.p.x-c.x, dy=st.p.y-c.y, d=Math.hypot(dx,dy)||1; var sp=c.spd*(1+st.t/2400); c.x+=dx/d*sp*dt; c.y+=dy/d*sp*dt;
      if(d<PR+CR){ end(); } });
  }
  function draw(){ if(!ctx)return; ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#d4a017'; st.tokens.forEach(function(t){ ctx.beginPath(); ctx.arc(t.x,t.y,TR,0,7); ctx.fill(); });
    ctx.fillStyle='#b3122a'; st.chasers.forEach(function(c){ ctx.beginPath(); ctx.arc(c.x,c.y,CR,0,7); ctx.fill(); });
    ctx.fillStyle='#1f7a4d'; ctx.beginPath(); ctx.arc(st.p.x,st.p.y,PR,0,7); ctx.fill();
  }
  function loop(){ if(!st.running)return; update(1); draw(); if(!headless) requestAnimationFrame(loop); }
  var keys={};
  window.addEventListener('keydown',function(e){ var k=e.key.toLowerCase();
    if(['arrowup','w'].indexOf(k)>=0){ setDir(st.vx/PSPD,-1); } else if(['arrowdown','s'].indexOf(k)>=0){ setDir(st.vx/PSPD,1); }
    else if(['arrowleft','a'].indexOf(k)>=0){ setDir(-1,st.vy/PSPD); } else if(['arrowright','d'].indexOf(k)>=0){ setDir(1,st.vy/PSPD); }
    else if((k===' '||k==='enter')&&!st.running){ start(); } });
  window.addEventListener('keyup',function(e){ var k=e.key.toLowerCase(); if(['arrowup','arrowdown','w','s'].indexOf(k)>=0) st.vy=0; if(['arrowleft','arrowright','a','d'].indexOf(k)>=0) st.vx=0; });
  function hold(btn,fx,fy){ var el=$(btn); if(!el)return; el.addEventListener('pointerdown',function(){ setDir(fx,fy); }); el.addEventListener('pointerup',function(){ if(fx)st.vx=0; if(fy)st.vy=0; }); el.addEventListener('click',function(){ setDir(fx,fy); }); }
  hold('upBtn',0,-1); hold('downBtn',0,1); hold('leftBtn',-1,0); hold('rightBtn',1,0);
  var sb=$('startBtn'); if(sb) sb.addEventListener('click',start);
  if(!headless && ctx) draw();
  window.__game={st:st,update:update,start:start,reset:reset,setDir:setDir,step:function(n){ n=n||1; for(var i=0;i<n;i++) update(1); }};
  (function(){ var box=$('aboutCards'); if(!box) return;
    var C=[['Nobody\'s the villain','The chasers mean well — that\'s the whole point. You\'re not battling anyone, just keeping room to move.'],['Distance is allowed','Keeping space from well-meaning pressure isn\'t rejection. A little room is how you gather what\'s yours.'],['Keep moving','Standing still gets you cornered. Gentle, continuous motion — small choices over time — keeps you free.']];
    box.innerHTML=C.map(function(p){ return '<div class="scard"><h4>'+p[0]+'</h4><span class="tg">Tap to expand</span><div class="more">'+p[1]+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 067 script error', e); }
});
