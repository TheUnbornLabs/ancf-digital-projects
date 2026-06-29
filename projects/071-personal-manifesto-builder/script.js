document.addEventListener('DOMContentLoaded',function(){
try{
function build(){var value=document.getElementById('value').value;var tone=document.getElementById('tone').value;return ('MY MANIFESTO\nI choose my life with '+value.toLowerCase()+' at its centre. '+(tone==='Quietly resolute'?'I make my decisions thoughtfully, and I hold them with calm conviction. ':'I make my decisions thoughtfully, and I welcome honest conversation about them. ')+'I respect others’ paths, and I ask the same respect for mine.');}document.getElementById('genBtn').addEventListener('click',function(){document.getElementById('genOut').textContent=build();});document.getElementById('copyBtn').addEventListener('click',function(){var t=document.getElementById('genOut').textContent;navigator.clipboard&&navigator.clipboard.writeText(t);this.textContent='Copied ✓';var b=this;setTimeout(function(){b.textContent='Copy to clipboard';},1500);});
}catch(e){console.error('project script error',e);}
});
