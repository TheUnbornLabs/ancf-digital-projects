/* Project 062 · Pong: Choice vs Pressure — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  var headless=/jsdom/i.test((window.navigator&&window.navigator.userAgent)||'');
  var cv=$('cv'), ctx=cv&&cv.getContext?cv.getContext('2d'):null;
  var W=300,H=440, PW=72,PH=12, PY=H-26, R=9;
  var st={running:false,over:false,px:W/2,ball:{x:W/2,y:H/2,vx:2.2,vy:-2.6},score:0,best:0,spd:1};
  st.best=(A.getJSON?A.getJSON('best',0):0)||0; var be=$('best'); if(be)be.textContent=st.best;
  function reset(){ st.running=false;st.over=false;st.px=W/2;st.score=0;st.spd=1; st.ball={x:W/2,y:H/2,vx:2.2,vy:-2.6}; var s=$('score'); if(s)s.textContent=0; }
  function start(){ reset(); st.running=true; var ov=$('overlay'); if(ov)ov.classList.remove('show'); if(!headless) requestAnimationFrame(loop); }
  function end(){ st.running=false; st.over=true; if(st.score>st.best){ st.best=st.score; if(A.setJSON)A.setJSON('best',st.score); var b=$('best'); if(b)b.textContent=st.score; }
    var ov=$('overlay'); if(ov){ ov.classList.add('show'); $('ovTitle').textContent='Dropped!'; $('ovMsg').innerHTML='Rally of <b>'+st.score+'</b>. Steady — go again.'; $('startBtn').textContent='Play again'; } }
  function movePaddle(dx){ st.px=Math.max(PW/2,Math.min(W-PW/2,st.px+dx)); }
  function update(dt){ if(!st.running)return; dt=dt||1; var b=st.ball;
    b.x+=b.vx*st.spd*dt; b.y+=b.vy*st.spd*dt;
    if(b.x<R){ b.x=R; b.vx=Math.abs(b.vx); } if(b.x>W-R){ b.x=W-R; b.vx=-Math.abs(b.vx); }
    if(b.y<R){ b.y=R; b.vy=Math.abs(b.vy); }
    if(b.y+R>=PY && b.y+R<=PY+PH+6 && b.vy>0 && b.x>st.px-PW/2-R && b.x<st.px+PW/2+R){
      b.vy=-Math.abs(b.vy); var off=(b.x-st.px)/(PW/2); b.vx=2.4*off; st.score++; st.spd=1+st.score*0.06; var s=$('score'); if(s)s.textContent=st.score; }
    if(b.y-R>H){ end(); }
  }
  function draw(){ if(!ctx)return; ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#1f7a4d'; ctx.fillRect(st.px-PW/2,PY,PW,PH);
    ctx.fillStyle='#b3122a'; ctx.beginPath(); ctx.arc(st.ball.x,st.ball.y,R,0,7); ctx.fill();
    ctx.fillStyle='rgba(127,127,127,.6)'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.fillText('CHOICE',st.ball.x,st.ball.y-13);
  }
  function loop(){ if(!st.running)return; update(1); draw(); if(!headless) requestAnimationFrame(loop); }
  var sb=$('startBtn'); if(sb) sb.addEventListener('click',start);
  var lb=$('leftBtn'); if(lb) lb.addEventListener('click',function(){ movePaddle(-26); });
  var rb=$('rightBtn'); if(rb) rb.addEventListener('click',function(){ movePaddle(26); });
  window.addEventListener('keydown',function(e){ if(e.key==='ArrowLeft') movePaddle(-26); else if(e.key==='ArrowRight') movePaddle(26); else if((e.key===' '||e.key==='Enter')&&!st.running) start(); });
  if(cv) cv.addEventListener('pointermove',function(e){ if(!st.running)return; var r=cv.getBoundingClientRect(); st.px=Math.max(PW/2,Math.min(W-PW/2,(e.clientX-r.left)/r.width*W)); });
  if(!headless && ctx) draw();
  window.__game={st:st,update:update,start:start,reset:reset,movePaddle:movePaddle,step:function(n){ n=n||1; for(var i=0;i<n;i++) update(1); }};
  (function(){ var box=$('aboutCards'); if(!box) return;
    var C=[['It speeds up','The longer the rally, the faster the ball — pressure can intensify the longer a topic runs. Expect it, and you won\'t be rattled.'],['Position, not power','You win by being under the ball, not by hitting hard. A calm, well-placed "no" beats a forceful one.'],['One return at a time','You don\'t have to end the rally — just make the next return. Handle this moment; the next will come when it comes.']];
    box.innerHTML=C.map(function(p){ return '<div class="scard"><h4>'+p[0]+'</h4><span class="tg">Tap to expand</span><div class="more">'+p[1]+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 062 script error', e); }
});
