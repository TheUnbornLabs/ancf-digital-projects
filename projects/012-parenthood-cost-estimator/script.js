document.addEventListener('DOMContentLoaded',function(){
try{
document.getElementById('calcBtn').addEventListener('click',function(){var yearly=parseFloat(document.getElementById('yearly').value)||0;var years=parseFloat(document.getElementById('years').value)||0;var kids=parseFloat(document.getElementById('kids').value)||0;var out=(function(){var total=yearly*years*kids;return 'Estimated cumulative cost: '+total.toLocaleString()+'\n(Per child: '+(yearly*years).toLocaleString()+')\nUse your own local figures for accuracy.';})();document.getElementById('calcOut').textContent=out;});
}catch(e){console.error('project script error',e);}
});
