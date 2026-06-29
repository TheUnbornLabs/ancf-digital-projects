document.addEventListener('DOMContentLoaded',function(){
try{
function build(){var mood=document.getElementById('mood').value;var topic=document.getElementById('topic').value;return ((mood==='Lighthearted'?'Plot twist: ':'')+topic+'. '+(mood==='Reflective'?'Still learning, still choosing, still me. ':mood==='Empowered'?'My life, my terms. ':'No regrets, lots of naps. ')+'#Childfree #ReproductiveAutonomy #MyChoice');}document.getElementById('genBtn').addEventListener('click',function(){document.getElementById('genOut').textContent=build();});document.getElementById('copyBtn').addEventListener('click',function(){var t=document.getElementById('genOut').textContent;navigator.clipboard&&navigator.clipboard.writeText(t);this.textContent='Copied ✓';var b=this;setTimeout(function(){b.textContent='Copy to clipboard';},1500);});
}catch(e){console.error('project script error',e);}
});
