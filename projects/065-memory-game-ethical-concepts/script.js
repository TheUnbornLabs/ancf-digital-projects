document.addEventListener('DOMContentLoaded',function(){
try{
window.__PAIRS__=["Autonomy", "Consent", "Asymmetry", "Pronatalism", "Coercion", "Compassion"];

var pairs=window.__PAIRS__,deck=[];pairs.forEach(function(p){deck.push(p,p);});
deck.sort(function(){return Math.random()-0.5;});
var board=document.getElementById('mboard'),first=null,lock=false,found=0,moves=0;
board.innerHTML='';deck.forEach(function(txt,i){var d=document.createElement('div');d.className='flip';d.dataset.t=txt;
d.innerHTML='<div class="inner"><div class="face front">?</div><div class="face back">'+txt+'</div></div>';
d.addEventListener('click',function(){if(lock||d.classList.contains('on'))return;d.classList.add('on');
if(!first){first=d;}else{moves++;if(first.dataset.t===d.dataset.t){found++;first=null;
if(found===pairs.length)document.getElementById('mOut').textContent='Matched all in '+moves+' moves!';}
else{lock=true;var a=first,b=d;setTimeout(function(){a.classList.remove('on');b.classList.remove('on');first=null;lock=false;},700);}}});
board.appendChild(d);});

}catch(e){console.error('project script error',e);}
});
