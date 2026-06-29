document.addEventListener('DOMContentLoaded',function(){
try{
function build(){var relation=document.getElementById('relation').value;var tone=document.getElementById('tone').value;return ('Thank you, '+relation.toLowerCase()+', I really value your wisdom. '+(tone==='Very warm'?'I’ve thought about this a lot, and I’ve found a path that brings me peace. I hope you can be happy for me. ':'I’ve made my decision with care, and I’d be grateful to have it respected. ')+'Your blessing means a great deal to me.');}document.getElementById('genBtn').addEventListener('click',function(){document.getElementById('genOut').textContent=build();});document.getElementById('copyBtn').addEventListener('click',function(){var t=document.getElementById('genOut').textContent;navigator.clipboard&&navigator.clipboard.writeText(t);this.textContent='Copied ✓';var b=this;setTimeout(function(){b.textContent='Copy to clipboard';},1500);});
}catch(e){console.error('project script error',e);}
});
