(function(){var r=document.documentElement,s=null;try{s=localStorage.getItem('ancf-theme');}catch(e){}
if(s){r.setAttribute('data-theme',s);}else if(window.matchMedia&&matchMedia('(prefers-color-scheme:dark)').matches){r.setAttribute('data-theme','dark');}
var b=document.getElementById('themeBtn');function l(){if(b)b.textContent=(r.getAttribute('data-theme')==='dark')?'☀ Light':'☾ Dark';}l();
if(b)b.addEventListener('click',function(){var d=r.getAttribute('data-theme')==='dark'?'light':'dark';r.setAttribute('data-theme',d);try{localStorage.setItem('ancf-theme',d);}catch(e){}l();});})();