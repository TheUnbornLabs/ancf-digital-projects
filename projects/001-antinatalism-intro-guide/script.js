document.addEventListener('DOMContentLoaded',function(){
try{
var t=document.getElementById('reflect');
var status=document.getElementById('saveStatus');
var clearBtn=document.getElementById('clearBtn');
if(t){
  var k='ancf-'+location.pathname;
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
    t.value='';
    try{localStorage.removeItem(k);}catch(e){}
    setStatus('Cleared.');
    t.focus();
  });}
}
}catch(e){console.error('project script error',e);}
});
