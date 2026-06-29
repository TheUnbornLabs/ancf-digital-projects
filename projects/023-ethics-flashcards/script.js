document.addEventListener('DOMContentLoaded',function(){
try{
document.querySelectorAll('.flip').forEach(function(c){c.addEventListener('click',function(){c.classList.toggle('on');});});
}catch(e){console.error('project script error',e);}
});
