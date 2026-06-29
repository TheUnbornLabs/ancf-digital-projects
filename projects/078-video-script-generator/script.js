document.addEventListener('DOMContentLoaded',function(){
try{
function build(){var topic=document.getElementById('topic').value;var length=document.getElementById('length').value;return ('VIDEO SCRIPT ('+length+')\nHOOK (0-5s): A relatable question about '+topic.toLowerCase()+'.\nBODY: '+(length==='60 seconds'?'Three clear points with a real-life example each.':'One clear point with a single example.')+'\nTONE: Calm, kind, never mocking anyone.\nCTA: "Decide for yourself — and be gentle with others doing the same."');}document.getElementById('genBtn').addEventListener('click',function(){document.getElementById('genOut').textContent=build();});document.getElementById('copyBtn').addEventListener('click',function(){var t=document.getElementById('genOut').textContent;navigator.clipboard&&navigator.clipboard.writeText(t);this.textContent='Copied ✓';var b=this;setTimeout(function(){b.textContent='Copy to clipboard';},1500);});
}catch(e){console.error('project script error',e);}
});
