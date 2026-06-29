document.addEventListener('DOMContentLoaded',function(){
try{
document.querySelectorAll('.copy-q').forEach(function(b){b.addEventListener('click',function(){navigator.clipboard&&navigator.clipboard.writeText(b.dataset.t);var o=b.textContent;b.textContent='Copied ✓';setTimeout(function(){b.textContent=o;},1200);});});
}catch(e){console.error('project script error',e);}
});
