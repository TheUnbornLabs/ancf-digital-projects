document.addEventListener('DOMContentLoaded',function(){
try{
function build(){var vibe=document.getElementById('vibe').value;var interest=document.getElementById('interest').value;return ((vibe==='Adventurous'?'Childfree and chasing horizons. ':vibe==='Cozy'?'Childfree, tea-loving, and content. ':'Childfree and endlessly curious. ')+'Big on '+interest+'. Living life on my own thoughtful terms — kindness over convention.');}document.getElementById('genBtn').addEventListener('click',function(){document.getElementById('genOut').textContent=build();});document.getElementById('copyBtn').addEventListener('click',function(){var t=document.getElementById('genOut').textContent;navigator.clipboard&&navigator.clipboard.writeText(t);this.textContent='Copied ✓';var b=this;setTimeout(function(){b.textContent='Copy to clipboard';},1500);});
}catch(e){console.error('project script error',e);}
});
