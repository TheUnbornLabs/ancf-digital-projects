document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var custom=document.getElementById('custom');
var status=document.getElementById('saveStatus');
var timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
function v(id){var e=document.getElementById(id);return e?e.value.trim():'';}
function scaffold(){
  var topic=v('topic')||'[topic]';
  var stance=document.getElementById('stance').value;
  var oppLine=(stance==='argument')?'IV. Strongest opposing view — fairly stated, then answered':'IV. Different perspectives, given a fair hearing';
  var intro=(stance==='personal')?'I. Open with a personal moment that raises the question':'I. Introduction — why this matters now';
  return 'ARTICLE OUTLINE\n'+
    'Working title: '+topic+'\n'+
    'Framing: '+stance+'\n\n'+
    intro+'\n  \n'+
    'II. Background & definitions (pin down the key terms)\n  \n'+
    'III. Main points (2-3, with examples or sources)\n  1. \n  2. \n  3. \n'+
    oppLine+'\n  \n'+
    'V. Practical takeaways for the reader\n  \n'+
    'VI. Conclusion — a respectful close\n  \n\n'+
    'Reminder: cite real sources; add disclaimers for any advice.';
}
if(custom){try{var saved=localStorage.getItem(KEY);if(saved)custom.value=saved;}catch(e){}custom.addEventListener('input',function(){try{localStorage.setItem(KEY,custom.value);}catch(e){}flash('Saved ✓');});}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',function(){if(custom.value.trim()&&!window.confirm('Replace the current text with a fresh outline?'))return;custom.value=scaffold();try{localStorage.setItem(KEY,custom.value);}catch(e){}flash('Outline ready ✓');custom.focus();});
var copyCustom=document.getElementById('copyCustom');
if(copyCustom)copyCustom.addEventListener('click',function(){var text=(custom.value||'').trim();if(!text){flash('Generate an outline first.');return;}function done(){copyCustom.textContent='Copied ✓';setTimeout(function(){copyCustom.textContent='Copy my outline';},1500);}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fb(text,done);});}else{fb(text,done);}});
function fb(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){flash('Copy not supported.');}}
}catch(e){console.error('project script error',e);}
});
