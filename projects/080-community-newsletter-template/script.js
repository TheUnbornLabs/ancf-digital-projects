document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var custom=document.getElementById('custom');
var status=document.getElementById('saveStatus');
var timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
var focusLine={learning:'📚 This edition\'s pick: [a reading or tool] — why it\'s worth your time',support:'🤝 Member spotlight & support: [a story or shout-out]',events:'📅 Upcoming gatherings: [what / when / where / RSVP]'};
function scaffold(){
  var cad=document.getElementById('cadence').value;
  var focus=document.getElementById('focus').value;
  return '📰 '+cad.toUpperCase()+' NEWSLETTER — [group name], [date]\n\n'+
    '👋 Welcome & shout-outs: [a warm hello, thank a member]\n\n'+
    (focusLine[focus]||focusLine.learning)+'\n\n'+
    '💬 Reflection prompt: [one short question for the week]\n\n'+
    '🌱 Quick wins / good news: [something uplifting]\n\n'+
    '🤝 Our values reminder: kind, respectful, ideas-not-people; no advice without disclaimers.\n\n'+
    '🔗 Get involved / reply: [link or how to respond]\n\n'+
    'With care,\nThe [group name] team';
}
if(custom){try{var saved=localStorage.getItem(KEY);if(saved)custom.value=saved;}catch(e){}custom.addEventListener('input',function(){try{localStorage.setItem(KEY,custom.value);}catch(e){}flash('Saved ✓');});}
var genBtn=document.getElementById('genBtn');
if(genBtn)genBtn.addEventListener('click',function(){if(custom.value.trim()&&!window.confirm('Replace the current text with a fresh template?'))return;custom.value=scaffold();try{localStorage.setItem(KEY,custom.value);}catch(e){}flash('Template ready ✓');custom.focus();});
var copyCustom=document.getElementById('copyCustom');
if(copyCustom)copyCustom.addEventListener('click',function(){var text=(custom.value||'').trim();if(!text){flash('Generate a template first.');return;}function done(){copyCustom.textContent='Copied ✓';setTimeout(function(){copyCustom.textContent='Copy my newsletter';},1500);}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fb(text,done);});}else{fb(text,done);}});
function fb(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){flash('Copy not supported.');}}
}catch(e){console.error('project script error',e);}
});
