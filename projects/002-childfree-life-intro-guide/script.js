document.addEventListener('DOMContentLoaded',function(){
try{
var base='ancf-'+location.pathname;

// Reflection textarea
var t=document.getElementById('reflect');
var status=document.getElementById('saveStatus');
var clearBtn=document.getElementById('clearBtn');
if(t){
  var k=base;
  function setStatus(msg){if(status)status.textContent=msg;}
  try{t.value=localStorage.getItem(k)||'';}catch(e){}
  var timer=null;
  t.addEventListener('input',function(){
    try{localStorage.setItem(k,t.value);}catch(e){}
    setStatus('Saved ✓');
    if(timer)clearTimeout(timer);
    timer=setTimeout(function(){setStatus('Saved only on this device.');},1200);
  });
  if(clearBtn){clearBtn.addEventListener('click',function(){
    t.value='';try{localStorage.removeItem(k);}catch(e){}
    setStatus('Cleared.');t.focus();
  });}
}

// Sources-of-meaning self-inventory
var list=document.getElementById('meaningList');
if(list){
  var boxes=list.querySelectorAll('input[type=checkbox]');
  var bar=document.getElementById('meaningBar');
  var count=document.getElementById('meaningCount');
  var store={};
  try{store=JSON.parse(localStorage.getItem(base+':meaning')||'{}')||{};}catch(e){store={};}
  function render(){
    var n=0;
    boxes.forEach(function(b){if(b.checked)n++;});
    if(bar)bar.style.width=Math.round(n/boxes.length*100)+'%';
    if(count)count.textContent=n+' of '+boxes.length+' selected.';
  }
  boxes.forEach(function(b){
    var key=b.getAttribute('data-key');
    b.checked=!!store[key];
    b.addEventListener('change',function(){
      store[key]=b.checked;
      try{localStorage.setItem(base+':meaning',JSON.stringify(store));}catch(e){}
      render();
    });
  });
  render();
}
}catch(e){console.error('project script error',e);}
});
