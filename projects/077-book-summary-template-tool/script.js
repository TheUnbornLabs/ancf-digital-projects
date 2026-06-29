document.addEventListener('DOMContentLoaded',function(){
try{
function build(){var title=document.getElementById('title').value;var takeaway=document.getElementById('takeaway').value;return ('BOOK SUMMARY\nTitle: '+(title||'[title]')+'\n\nThesis: \nThree key ideas:\n  1.\n  2.\n  3.\nStrongest objection I noticed:\nMy takeaway: '+(takeaway||'[your takeaway]')+'\nRating /5: ');}document.getElementById('genBtn').addEventListener('click',function(){document.getElementById('genOut').textContent=build();});document.getElementById('copyBtn').addEventListener('click',function(){var t=document.getElementById('genOut').textContent;navigator.clipboard&&navigator.clipboard.writeText(t);this.textContent='Copied ✓';var b=this;setTimeout(function(){b.textContent='Copy to clipboard';},1500);});
}catch(e){console.error('project script error',e);}
});
