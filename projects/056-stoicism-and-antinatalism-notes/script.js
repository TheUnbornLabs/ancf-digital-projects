document.addEventListener('DOMContentLoaded',function(){
try{
var t=document.getElementById('reflect');if(t){var k='ancf-'+location.pathname;try{t.value=localStorage.getItem(k)||'';}catch(e){}t.addEventListener('input',function(){try{localStorage.setItem(k,t.value);}catch(e){}});}
}catch(e){console.error('project script error',e);}
});
