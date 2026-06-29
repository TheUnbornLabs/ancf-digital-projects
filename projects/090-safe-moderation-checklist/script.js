document.addEventListener('DOMContentLoaded',function(){
try{
var k='ancf-'+location.pathname,boxes=[].slice.call(document.querySelectorAll('#list input'));var saved=[];try{saved=JSON.parse(localStorage.getItem(k)||'[]');}catch(e){}boxes.forEach(function(b,i){b.checked=!!saved[i];});function upd(){var n=boxes.filter(function(b){return b.checked;}).length;var p=Math.round(100*n/boxes.length);document.getElementById('bar').style.width=p+'%';document.getElementById('pct').textContent=p+'% complete — progress is saved on this device.';try{localStorage.setItem(k,JSON.stringify(boxes.map(function(b){return b.checked;})));}catch(e){}}boxes.forEach(function(b){b.addEventListener('change',upd);});upd();
}catch(e){console.error('project script error',e);}
});
