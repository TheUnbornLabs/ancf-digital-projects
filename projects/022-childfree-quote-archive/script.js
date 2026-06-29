document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var lines=[].slice.call(document.querySelectorAll('.qline'));
var search=document.getElementById('search');
var empty=document.getElementById('empty');
var status=document.getElementById('status');
var timer=null;
function flash(msg){if(!status)return;status.textContent=msg;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1400);}

function quoteText(line){
  var span=line.querySelector('span');
  var pill=span.querySelector('.pill');
  var full=span.textContent||'';
  if(pill)full=full.replace(pill.textContent,'');
  return full.trim();
}

var favs={};
try{favs=JSON.parse(localStorage.getItem(KEY+':favs')||'{}')||{};}catch(e){favs={};}
lines.forEach(function(line,i){
  var btn=line.querySelector('.fav');
  function paint(){btn.textContent=favs[i]?'★':'☆';btn.setAttribute('aria-pressed',favs[i]?'true':'false');}
  paint();
  btn.addEventListener('click',function(){
    favs[i]=!favs[i];
    try{localStorage.setItem(KEY+':favs',JSON.stringify(favs));}catch(e){}
    paint();
    flash(favs[i]?'Saved to favourites ★':'Removed from favourites');
  });
});

lines.forEach(function(line){
  var btn=line.querySelector('.copy-q');
  btn.addEventListener('click',function(){
    copy(quoteText(line),function(){
      var o=btn.textContent;btn.textContent='Copied ✓';
      setTimeout(function(){btn.textContent=o;},1200);
    });
  });
});

function copy(text,done){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done,function(){fallback(text,done);});
  }else{fallback(text,done);}
}
function fallback(text,done){
  try{
    var t=document.createElement('textarea');
    t.value=text;t.style.position='fixed';t.style.opacity='0';
    document.body.appendChild(t);t.focus();t.select();
    document.execCommand('copy');document.body.removeChild(t);done();
  }catch(e){flash('Copy not supported — select the text manually.');}
}

function applyFilter(){
  var q=(search.value||'').toLowerCase().trim();
  var shown=0;
  lines.forEach(function(line){
    var match=!q||quoteText(line).toLowerCase().indexOf(q)>=0||(line.getAttribute('data-theme')||'').indexOf(q)>=0;
    line.style.display=match?'':'none';
    if(match)shown++;
  });
  if(empty)empty.style.display=shown?'none':'';
}
if(search)search.addEventListener('input',applyFilter);

var randomBtn=document.getElementById('randomBtn');
if(randomBtn)randomBtn.addEventListener('click',function(){
  if(search)search.value='';
  applyFilter();
  var idx=Math.floor(Math.random()*lines.length);
  lines.forEach(function(line,i){line.style.outline=(i===idx)?'2px solid var(--accent)':'';});
  lines[idx].scrollIntoView({behavior:'smooth',block:'center'});
  flash('Here’s one for today.');
});

var copyAllBtn=document.getElementById('copyAllBtn');
if(copyAllBtn)copyAllBtn.addEventListener('click',function(){
  var text=lines.map(function(l){return '• '+quoteText(l);}).join('\n');
  copy(text,function(){flash('All copied ✓');});
});
}catch(e){console.error('project script error',e);}
});
