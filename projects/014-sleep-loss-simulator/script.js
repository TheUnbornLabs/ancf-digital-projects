document.addEventListener('DOMContentLoaded',function(){
try{
document.getElementById('calcBtn').addEventListener('click',function(){var need=parseFloat(document.getElementById('need').value)||0;var actual=parseFloat(document.getElementById('actual').value)||0;var days=parseFloat(document.getElementById('days').value)||0;var out=(function(){var d=(need-actual)*days;if(d<=0)return 'No sleep debt in this model — you meet or exceed your need.';return 'Cumulative sleep debt: '+d.toFixed(1)+' hours over '+days+' nights\n≈ '+(d/need).toFixed(1)+' full nights of sleep missed.';})();document.getElementById('calcOut').textContent=out;});
}catch(e){console.error('project script error',e);}
});
