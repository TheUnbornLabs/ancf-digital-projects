document.addEventListener('DOMContentLoaded',function(){
try{
function build(){var context=document.getElementById('context').value;return ('A caring note for our '+context.toLowerCase()+': This is a supportive space for reflection, not a crisis service. If you or someone here is struggling, please reach out to a trusted person or a qualified professional in your area. We ask everyone to keep conversations kind and to avoid graphic content. You matter, and support exists.');}document.getElementById('genBtn').addEventListener('click',function(){document.getElementById('genOut').textContent=build();});document.getElementById('copyBtn').addEventListener('click',function(){var t=document.getElementById('genOut').textContent;navigator.clipboard&&navigator.clipboard.writeText(t);this.textContent='Copied ✓';var b=this;setTimeout(function(){b.textContent='Copy to clipboard';},1500);});
}catch(e){console.error('project script error',e);}
});
