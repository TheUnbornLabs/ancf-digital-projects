document.addEventListener('DOMContentLoaded',function(){
try{
document.getElementById('calcBtn').addEventListener('click',function(){var income=parseFloat(document.getElementById('income').value)||0;var essentials=parseFloat(document.getElementById('essentials').value)||0;var saverate=parseFloat(document.getElementById('saverate').value)||0;var out=(function(){var leftover=income-essentials;var sav=leftover*12*saverate/100;var flex=leftover*12-sav;if(leftover<0)return 'Essentials exceed income — the model needs positive leftover to estimate.';return 'Monthly leftover: '+leftover.toFixed(0)+'\nEstimated annual savings: '+sav.toFixed(0)+'\nEstimated annual flexible spending: '+flex.toFixed(0);})();document.getElementById('calcOut').textContent=out;});
}catch(e){console.error('project script error',e);}
});
