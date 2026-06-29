document.addEventListener('DOMContentLoaded',function(){
try{
var notes={
  easia:"East Asia: public conversations often touch on cost of living, demanding work cultures, and shifting social norms — with wide variation between countries and individuals.",
  sasia:"South Asia: family and community expectations are frequently discussed alongside growing personal autonomy. Diversity within and between communities is enormous.",
  europe:"Europe: policy, environment, and personal freedom are common themes, but experiences differ greatly from one country to the next.",
  africa:"Africa: an enormously diverse set of contexts. Discussions vary by country, community, and individual — no single story fits the continent.",
  americas:"Americas: cost of living, autonomy, and identity recur across very different cultures, histories, and circumstances.",
  meast:"Middle East: family and faith often feature, alongside private, individual reflection — and, as everywhere, a great deal of variation."
};
var wrap=document.getElementById('regions');
var out=document.getElementById('regionOut');
if(wrap){
  var chips=[].slice.call(wrap.querySelectorAll('.chip'));
  chips.forEach(function(c){
    c.addEventListener('click',function(){
      chips.forEach(function(z){z.classList.remove('active');});
      c.classList.add('active');
      if(out)out.textContent=notes[c.getAttribute('data-k')]||'';
    });
  });
}
}catch(e){console.error('project script error',e);}
});
