document.addEventListener('DOMContentLoaded',function(){
try{
var btns=[].slice.call(document.querySelectorAll('.copy-q'));
btns.forEach(function(b){b.addEventListener('click',function(){var txt=b.getAttribute('data-t');function done(){var o=b.textContent;b.textContent='Copied ✓';setTimeout(function(){b.textContent=o;},1200);}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done,function(){fb(txt,done);});}else{fb(txt,done);}});});
var all=btns.map(function(b){return b.getAttribute('data-t');}).join('\n\n');
var copyAll=document.getElementById('copyAll');
var status=document.getElementById('copyStatus');
function flash(m){if(status){status.textContent=m;setTimeout(function(){status.textContent='';},1800);}}
if(copyAll)copyAll.addEventListener('click',function(){function done(){flash('Whole message copied ✓');}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(all).then(done,function(){fb(all,done);});}else{fb(all,done);}});
function fb(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){flash('Copy not supported.');}}
}catch(e){console.error('project script error',e);}
});
