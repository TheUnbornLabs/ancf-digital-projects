document.addEventListener('DOMContentLoaded',function(){
try{
function build(){var hero=document.getElementById('hero').value;var theme=document.getElementById('theme').value;return ('COMIC PREMISE\nPanel 1: '+hero+' faces a familiar question about the future.\nPanel 2: A swirl of well-meaning but heavy expectations appears.\nPanel 3: '+hero+' takes a breath — theme: '+theme.toLowerCase()+'.\nPanel 4: A warm, respectful resolution where everyone keeps their dignity.\nTone: gentle, metaphorical, never mocking real people.');}document.getElementById('genBtn').addEventListener('click',function(){document.getElementById('genOut').textContent=build();});document.getElementById('copyBtn').addEventListener('click',function(){var t=document.getElementById('genOut').textContent;navigator.clipboard&&navigator.clipboard.writeText(t);this.textContent='Copied ✓';var b=this;setTimeout(function(){b.textContent='Copy to clipboard';},1500);});
}catch(e){console.error('project script error',e);}
});
