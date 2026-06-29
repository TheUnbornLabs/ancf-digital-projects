document.addEventListener('DOMContentLoaded',function(){
try{
function build(){var basis=document.getElementById('basis').value;var tone=document.getElementById('tone').value;return ((tone==='Academic'?'I hold a considered antinatalist view grounded in '+basis.toLowerCase()+'. ':'For me, antinatalism comes down to '+basis.toLowerCase()+'. ')+'I argue about the ethics of creating life, never about the worth of anyone already living. I welcome disagreement offered in good faith, and I extend the same respect in return.');}document.getElementById('genBtn').addEventListener('click',function(){document.getElementById('genOut').textContent=build();});document.getElementById('copyBtn').addEventListener('click',function(){var t=document.getElementById('genOut').textContent;navigator.clipboard&&navigator.clipboard.writeText(t);this.textContent='Copied ✓';var b=this;setTimeout(function(){b.textContent='Copy to clipboard';},1500);});
}catch(e){console.error('project script error',e);}
});
