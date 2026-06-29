document.addEventListener('DOMContentLoaded',function(){
try{
document.getElementById('calcBtn').addEventListener('click',function(){var monthly=parseFloat(document.getElementById('monthly').value)||0;var years=parseFloat(document.getElementById('years').value)||0;var other=parseFloat(document.getElementById('other').value)||0;var out=(function(){var gap=monthly-other;if(gap<=0)return 'Your other income already covers the target in this model.';return 'Monthly gap to self-fund: '+gap.toLocaleString()+'\nApprox. fund needed: '+(gap*12*years).toLocaleString()+'\n(Before investment growth and inflation — a professional can refine this.)';})();document.getElementById('calcOut').textContent=out;});
}catch(e){console.error('project script error',e);}
});
