document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var lead={chat:'A caring note for our group chat:',page:'A caring note for this page:',event:'A caring note for our event:'};
function build(){
  var c=document.getElementById('context').value;
  return (lead[c]||lead.chat)+'\n\n'+
    'This is a supportive space for reflection, not a crisis service. If you or someone here is struggling, please reach out to a trusted person or a qualified professional. '+
    'In an emergency, contact local emergency services.\n\n'+
    'Support you can contact: [add a local/national support line]\n\n'+
    'We ask everyone to keep conversations kind, to avoid graphic content, and to look out for one another. You matter, and support exists.';
}
// generator + editable box (reuse pattern)
var out=document.getElementById('genOut');
var custom=document.getElementById('custom');
var status=document.getElementById('saveStatus');
var timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
function generate(){var t=build();out.textContent=t;if(custom){custom.value=t;try{localStorage.setItem(KEY,custom.value);}catch(e){}}}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',generate);
if(custom){try{var saved=localStorage.getItem(KEY);if(saved){custom.value=saved;out.textContent=saved;}}catch(e){}custom.addEventListener('input',function(){try{localStorage.setItem(KEY,custom.value);}catch(e){}flash('Saved ✓');});}
function copyText(text,btn,label){if(!text||!text.trim()||text.indexOf('will appear')>=0){flash('Generate first.');return;}function done(){if(btn){btn.textContent='Copied ✓';setTimeout(function(){btn.textContent=label;},1500);}}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fb(text,done);});}else{fb(text,done);}}
function fb(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){flash('Copy not supported.');}}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){copyText(out.textContent,copyBtn,'Copy to clipboard');});
var copyCustom=document.getElementById('copyCustom');
if(copyCustom)copyCustom.addEventListener('click',function(){copyText(custom?custom.value:'',copyCustom,'Copy my notice');});
}catch(e){console.error('project script error',e);}
});
