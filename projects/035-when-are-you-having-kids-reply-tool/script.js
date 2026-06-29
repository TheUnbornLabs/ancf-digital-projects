document.addEventListener('DOMContentLoaded',function(){
try{
function build(){var vibe=document.getElementById('vibe').value;return ((vibe==='Gracious'?'"That’s not in our plans, but thank you for thinking of us."':vibe==='Deflecting'?'"Who knows what life holds! How are you doing?"':'"We’ve chosen not to have children, and we’re really content with that."'));}document.getElementById('genBtn').addEventListener('click',function(){document.getElementById('genOut').textContent=build();});document.getElementById('copyBtn').addEventListener('click',function(){var t=document.getElementById('genOut').textContent;navigator.clipboard&&navigator.clipboard.writeText(t);this.textContent='Copied ✓';var b=this;setTimeout(function(){b.textContent='Copy to clipboard';},1500);});
}catch(e){console.error('project script error',e);}
});
