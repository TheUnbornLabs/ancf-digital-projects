document.addEventListener('DOMContentLoaded',function(){
try{
var chips=[].slice.call(document.querySelectorAll('#filters .chip'));
var items=[].slice.call(document.querySelectorAll('#timeline > li'));
var empty=document.getElementById('empty');

function filter(era){
  var shown=0;
  items.forEach(function(li){
    var match=(era==='all')||li.getAttribute('data-era')===era;
    li.style.display=match?'':'none';
    if(match)shown++;
  });
  if(empty)empty.style.display=shown?'none':'';
}

chips.forEach(function(chip){
  chip.addEventListener('click',function(){
    chips.forEach(function(c){c.classList.remove('active');});
    chip.classList.add('active');
    filter(chip.getAttribute('data-era'));
  });
});
filter('all');
}catch(e){console.error('project script error',e);}
});
