(function(){
  var root=document.documentElement;
  var saved=null;try{saved=localStorage.getItem('ancf-theme');}catch(e){}
  if(saved){root.setAttribute('data-theme',saved);}
  else if(window.matchMedia&&matchMedia('(prefers-color-scheme:dark)').matches){root.setAttribute('data-theme','dark');}
  var tg=document.getElementById('themeBtn');
  function lab(){tg.textContent=(root.getAttribute('data-theme')==='dark')?'☀ Light':'☾ Dark';}
  if(tg){lab();tg.addEventListener('click',function(){
    var d=root.getAttribute('data-theme')==='dark'?'light':'dark';
    root.setAttribute('data-theme',d);try{localStorage.setItem('ancf-theme',d);}catch(e){}lab();});}

  var grid=document.getElementById('grid'),search=document.getElementById('search'),
      count=document.getElementById('count'),chips=[].slice.call(document.querySelectorAll('.chip'));
  var DATA=window.__PROJECTS__||[];var active='All',q='';
  var statsEl=document.getElementById('stats');
  if(statsEl){
    var cats={};DATA.forEach(function(p){cats[p.category]=1;});
    var nCats=Object.keys(cats).length;
    statsEl.innerHTML=
      '<div class="stat"><b>'+DATA.length+'</b><span>Projects</span></div>'+
      '<div class="stat"><b>'+nCats+'</b><span>Categories</span></div>'+
      '<div class="stat"><b>100%</b><span>Static &amp; offline</span></div>'+
      '<div class="stat"><b>0</b><span>Ads &amp; trackers</span></div>';
  }
  function render(){
    var list=DATA.filter(function(p){
      var mc=(active==='All'||p.category===active);
      var s=(p.number+' '+p.title+' '+p.category+' '+p.description).toLowerCase();
      var mq=(q===''||s.indexOf(q)>-1);return mc&&mq;});
    grid.innerHTML='';
    if(!list.length){grid.innerHTML='<div class="empty">No projects match your search.</div>';}
    list.forEach(function(p){
      var a=document.createElement('a');a.className='card';a.href=p.path;
      a.innerHTML='<span class="num">PROJECT '+String(p.number).padStart(3,'0')+'</span>'+
        '<span class="cat">'+p.category+'</span>'+
        '<h3>'+p.title+'</h3>'+
        '<p class="desc">'+p.description+'</p>'+
        '<div class="meta"><span class="diff">Difficulty: '+p.difficulty+'</span>'+
        '<span class="btn btn-primary">Open project →</span></div>';
      grid.appendChild(a);});
    count.textContent=list.length+' of '+DATA.length+' projects';
  }
  if(search){search.addEventListener('input',function(){q=this.value.trim().toLowerCase();render();});}
  chips.forEach(function(c){c.addEventListener('click',function(){
    chips.forEach(function(x){x.classList.remove('active');});c.classList.add('active');
    active=c.dataset.cat;render();});});
  render();
})();