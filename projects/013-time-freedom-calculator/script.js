document.addEventListener('DOMContentLoaded',function(){
try{
document.getElementById('calcBtn').addEventListener('click',function(){var sleep=parseFloat(document.getElementById('sleep').value)||0;var work=parseFloat(document.getElementById('work').value)||0;var care=parseFloat(document.getElementById('care').value)||0;var out=(function(){var fd=24-sleep-work-care;if(fd<0)return 'The hours entered exceed 24 — adjust the inputs.';return 'Free hours per day: '+fd.toFixed(1)+'\nFree hours per week: '+(fd*7).toFixed(1)+'\nThat is roughly '+((fd*7)/8).toFixed(1)+' full days of waking free time weekly.';})();document.getElementById('calcOut').textContent=out;});
}catch(e){console.error('project script error',e);}
});
