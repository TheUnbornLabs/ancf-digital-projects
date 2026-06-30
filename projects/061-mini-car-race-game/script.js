/* Project 061 · Mini Car Race Game — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  var headless=/jsdom/i.test((window.navigator&&window.navigator.userAgent)||'');
  var cv=$('cv'), ctx=cv&&cv.getContext?cv.getContext('2d'):null;
  var W=300,H=440, LANES=[60,150,240], CARW=44,CARH=64, OBW=54,OBH=40;
  var st={running:false,over:false,lane:1,y:H-90,obs:[],speed:3,score:0,spawn:0,best:0};
  st.best=(A.getJSON?A.getJSON('best',0):0)||0;
  var bestEl=$('best'); if(bestEl) bestEl.textContent=st.best;

  function reset(){ st.running=false;st.over=false;st.lane=1;st.obs=[];st.speed=3;st.score=0;st.spawn=0; var s=$('score'); if(s)s.textContent=0; }
  function start(){ reset(); st.running=true; var ov=$('overlay'); if(ov)ov.classList.remove('show'); if(!headless) requestAnimationFrame(loop); }
  function end(){ st.running=false; st.over=true; var sc=Math.floor(st.score);
    if(sc>st.best){ st.best=sc; if(A.setJSON)A.setJSON('best',sc); var b=$('best'); if(b)b.textContent=sc; }
    var ov=$('overlay'); if(ov){ ov.classList.add('show'); $('ovTitle').textContent='Crash!'; $('ovMsg').innerHTML='You scored <b>'+sc+'</b>. Steady on — try again.'; $('startBtn').textContent='Play again'; } }
  function move(dir){ if(!st.running)return; st.lane=Math.max(0,Math.min(2,st.lane+dir)); }
  function update(dt){ if(!st.running)return; dt=dt||1;
    st.score+=0.25*dt; var s=$('score'); if(s)s.textContent=Math.floor(st.score);
    st.speed=3+st.score/120;
    st.spawn-=dt; if(st.spawn<=0){ st.obs.push({lane:Math.floor(Math.random()*3),y:-OBH}); st.spawn=70/(1+st.score/300); }
    for(var i=st.obs.length-1;i>=0;i--){ var o=st.obs[i]; o.y+=st.speed*dt;
      if(o.lane===st.lane && o.y+OBH>st.y && o.y<st.y+CARH){ end(); return; }
      if(o.y>H) st.obs.splice(i,1); }
  }
  function draw(){ if(!ctx)return; ctx.clearRect(0,0,W,H);
    ctx.strokeStyle='rgba(127,127,127,.35)'; ctx.setLineDash([14,16]); ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(105,0);ctx.lineTo(105,H); ctx.moveTo(195,0);ctx.lineTo(195,H); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='#b3122a'; st.obs.forEach(function(o){ ctx.fillRect(LANES[o.lane]-OBW/2,o.y,OBW,OBH); });
    var x=LANES[st.lane]-CARW/2; ctx.fillStyle='#1f7a4d'; ctx.fillRect(x,st.y,CARW,CARH);
    ctx.fillStyle='#cde7da'; ctx.fillRect(x+8,st.y+12,CARW-16,16);
  }
  function loop(){ if(!st.running)return; update(1); draw(); if(!headless) requestAnimationFrame(loop); }

  var sb=$('startBtn'); if(sb) sb.addEventListener('click',start);
  var lb=$('leftBtn'); if(lb) lb.addEventListener('click',function(){ move(-1); });
  var rb=$('rightBtn'); if(rb) rb.addEventListener('click',function(){ move(1); });
  window.addEventListener('keydown',function(e){ if(e.key==='ArrowLeft'){ move(-1); } else if(e.key==='ArrowRight'){ move(1); } else if((e.key===' '||e.key==='Enter')&&!st.running){ start(); } });
  if(cv) cv.addEventListener('pointerdown',function(e){ var r=cv.getBoundingClientRect(); var rx=(e.clientX-r.left)/r.width; move(rx<0.5?-1:1); });
  if(!headless && ctx) draw();
  window.__game={st:st,update:update,draw:draw,start:start,reset:reset,move:move,step:function(n){ n=n||1; for(var i=0;i<n;i++) update(1); }};

  (function(){ var box=$('aboutCards'); if(!box) return;
    var C=[['It keeps coming','In the game and in life, the pressure blocks keep falling. That\'s not failure — it\'s just the terrain. The skill is steering, not stopping the road.'],
      ['Small moves win','You don\'t need dramatic swerves, just timely little adjustments. A calm "not for me," repeated, is a lane change.'],
      ['Eyes ahead','Looking up the track beats reacting at the last second. Knowing your line in advance makes the dodges almost easy.']];
    box.innerHTML=C.map(function(p){ return '<div class="scard"><h4>'+p[0]+'</h4><span class="tg">Tap to expand</span><div class="more">'+p[1]+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();

  (function(){
    var ta=$('r1'), status=$('saveStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 061 script error', e); }
});
