/* The Antinatalism Reader — reading progress + keyboard navigation */
(function(){
  // progress bar reflects scroll position through the chapter body
  var bar = document.getElementById('readbarFill');
  function onScroll(){
    if(!bar) return;
    var h = document.documentElement;
    var max = (h.scrollHeight - h.clientHeight);
    var pct = max > 0 ? (h.scrollTop || document.body.scrollTop) / max * 100 : 0;
    bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
  }
  document.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);
  onScroll();

  // left / right arrow keys move between chapters (skips when typing)
  document.addEventListener('keydown', function(e){
    var t = e.target && e.target.tagName;
    if(t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
    if(e.metaKey || e.ctrlKey || e.altKey) return;
    if(e.key === 'ArrowLeft'){
      var p = document.querySelector('a[data-nav="prev"]:not(.disabled)');
      if(p){ window.location.href = p.getAttribute('href'); }
    } else if(e.key === 'ArrowRight'){
      var n = document.querySelector('a[data-nav="next"]:not(.disabled)');
      if(n){ window.location.href = n.getAttribute('href'); }
    }
  });
})();
