document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var PAIRS=["Autonomy","Consent","Asymmetry","Pronatalism","Coercion","Compassion"];
var board=document.getElementById('mboard');
var stats=document.getElementById('mStats');
var out=document.getElementById('mOut');
var first=null,lock=false,found=0,moves=0;
var best=0;try{best=parseInt(localStorage.getItem(KEY+':best')||'0',10)||0;}catch(e){}

function setStats(){if(stats)stats.textContent='Moves: '+moves+' · Matched: '+found+'/'+PAIRS.length+(best?(' · Best: '+best):'');}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}

function flip(d){
  if(lock||d.classList.contains('on')||d.classList.contains('done'))return;
  d.classList.add('on');d.setAttribute('aria-pressed','true');
  if(!first){first=d;return;}
  moves++;setStats();
  if(first.dataset.t===d.dataset.t){
    first.classList.add('done');d.classList.add('done');
    found++;first=null;setStats();
    if(found===PAIRS.length){
      if(best===0||moves<best){best=moves;try{localStorage.setItem(KEY+':best',String(best));}catch(e){}}
      setStats();
      out.textContent='Matched all pairs in '+moves+' moves! '+(moves<=best?'New best!':'Best: '+best+'.');
    }
  }else{
    lock=true;var a=first,b=d;
    setTimeout(function(){a.classList.remove('on');b.classList.remove('on');a.setAttribute('aria-pressed','false');b.setAttribute('aria-pressed','false');first=null;lock=false;},750);
  }
}

function build(){
  first=null;lock=false;found=0;moves=0;
  if(out)out.textContent='';
  var deck=[];PAIRS.forEach(function(p){deck.push(p,p);});shuffle(deck);
  board.innerHTML='';
  deck.forEach(function(txt){
    var d=document.createElement('div');d.className='flip';d.dataset.t=txt;
    d.setAttribute('role','button');d.setAttribute('tabindex','0');d.setAttribute('aria-pressed','false');
    d.setAttribute('aria-label','memory card');
    d.innerHTML='<div class="inner"><div class="face front">?</div><div class="face back">'+txt+'</div></div>';
    d.addEventListener('click',function(){flip(d);});
    d.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();flip(d);}});
    board.appendChild(d);
  });
  setStats();
}
var ng=document.getElementById('newGame');
if(ng)ng.addEventListener('click',build);
build();
}catch(e){console.error('project script error',e);}
});
