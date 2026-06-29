document.addEventListener('DOMContentLoaded',function(){
try{
var items=[].slice.call(document.querySelectorAll('.faq-item'));
var search=document.getElementById('search');
var empty=document.getElementById('empty');
var status=document.getElementById('status');
var timer=null;
function flash(msg){if(!status)return;status.textContent=msg;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1400);}

function applyFilter(){
  var q=(search.value||'').toLowerCase().trim();
  var shown=0;
  items.forEach(function(it){
    var text=(it.textContent||'').toLowerCase();
    var match=!q||text.indexOf(q)>=0;
    it.style.display=match?'':'none';
    if(match&&q)it.open=true;
    if(match)shown++;
  });
  if(empty)empty.style.display=shown?'none':'';
}
if(search)search.addEventListener('input',applyFilter);

function answerText(it){
  var p=it.querySelector('p');
  var q=it.querySelector('summary');
  return (q?q.textContent.trim()+'\n':'')+(p?p.textContent.trim():'');
}
items.forEach(function(it){
  var btn=it.querySelector('.copy-a');
  if(!btn)return;
  btn.addEventListener('click',function(){
    var text=answerText(it);
    function done(){var o=btn.textContent;btn.textContent='Copied ✓';setTimeout(function(){btn.textContent=o;},1200);}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fb(text,done);});}else{fb(text,done);}
  });
});
function fb(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){flash('Copy not supported.');}}
}catch(e){console.error('project script error',e);}
});
