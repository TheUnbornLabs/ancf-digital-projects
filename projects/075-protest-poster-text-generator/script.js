document.addEventListener('DOMContentLoaded',function(){
try{
function build(){var focus=document.getElementById('focus').value;return ((focus==='Autonomy'?'MY BODY, MY DECISION — RESPECT REPRODUCTIVE AUTONOMY':focus==='Respect'?'EVERY CHOICE DESERVES RESPECT — PARENT OR CHILDFREE':'MORE CHOICES, NOT FEWER — FREEDOM TO DECIDE'));}document.getElementById('genBtn').addEventListener('click',function(){document.getElementById('genOut').textContent=build();});document.getElementById('copyBtn').addEventListener('click',function(){var t=document.getElementById('genOut').textContent;navigator.clipboard&&navigator.clipboard.writeText(t);this.textContent='Copied ✓';var b=this;setTimeout(function(){b.textContent='Copy to clipboard';},1500);});
}catch(e){console.error('project script error',e);}
});
