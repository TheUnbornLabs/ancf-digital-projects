document.addEventListener('DOMContentLoaded',function(){
try{
var k='ancf-'+location.pathname;for(var i=0;i<3;i++){(function(i){var t=document.getElementById('rf'+i);try{t.value=localStorage.getItem(k+i)||'';}catch(e){}t.addEventListener('input',function(){try{localStorage.setItem(k+i,t.value);}catch(e){}});})(i);}
}catch(e){console.error('project script error',e);}
});
