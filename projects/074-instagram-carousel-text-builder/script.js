document.addEventListener('DOMContentLoaded',function(){
try{
function build(){var topic=document.getElementById('topic').value;return ('SLIDE 1 (Hook): '+topic+'\nSLIDE 2: A clear, friendly definition or first point.\nSLIDE 3: A common misconception, gently corrected.\nSLIDE 4: A practical takeaway readers can use today.\nSLIDE 5 (CTA): "Save this, share kindly, and decide for yourself."\nCaption: Respectful, no hashtags that target any group.');}document.getElementById('genBtn').addEventListener('click',function(){document.getElementById('genOut').textContent=build();});document.getElementById('copyBtn').addEventListener('click',function(){var t=document.getElementById('genOut').textContent;navigator.clipboard&&navigator.clipboard.writeText(t);this.textContent='Copied ✓';var b=this;setTimeout(function(){b.textContent='Copy to clipboard';},1500);});
}catch(e){console.error('project script error',e);}
});
