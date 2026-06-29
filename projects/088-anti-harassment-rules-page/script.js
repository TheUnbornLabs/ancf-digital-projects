document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var RULES=[
'COMMUNITY RULES (template — adapt for your group)',
'',
'1. Zero tolerance for harassment: no personal attacks, stalking, threats, doxxing, or targeted pile-ons. Critique ideas, never people.',
'2. Protected respect for all groups: no hate or slurs toward parents, children, women, men, castes, religions, ethnicities, disabled people, or LGBTQ+ people.',
'3. Disagree well: debate the claim, not the person; steelman before replying; keep your tone kind.',
'4. No graphic or unsafe content: nothing encouraging self-harm or violence; share support and resources, not detail.',
'5. Privacy: don\'t share others\' personal information or screenshots without consent.',
'6. Reporting & enforcement: report concerns privately to a moderator; mods act promptly and fairly (warning, then removal for repeat or serious harm).',
'',
'REPORTING & RESPONSE:',
'  - Report privately to [moderator/channel].',
'  - We acknowledge reports quickly and review fairly.',
'  - We act proportionately and protect reporters from retaliation.'
].join('\n');
var copyRules=document.getElementById('copyRules');
var copyStatus=document.getElementById('copyStatus');
function pflash(m){if(copyStatus){copyStatus.textContent=m;setTimeout(function(){copyStatus.textContent='';},1800);}}
if(copyRules)copyRules.addEventListener('click',function(){function done(){pflash('Rules copied ✓');}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(RULES).then(done,function(){pfb(RULES,done);});}else{pfb(RULES,done);}});
function pfb(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){pflash('Copy not supported.');}}
// Reflection
var ta=document.getElementById('reflect');
var status=document.getElementById('saveStatus');
var saveBtn=document.getElementById('saveBtn');
var copyBtn=document.getElementById('copyBtn');
var clearBtn=document.getElementById('clearBtn');
var timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
if(ta){try{ta.value=localStorage.getItem(KEY)||'';}catch(e){}ta.addEventListener('input',function(){try{localStorage.setItem(KEY,ta.value);}catch(e){}});}
if(saveBtn)saveBtn.addEventListener('click',function(){try{localStorage.setItem(KEY,ta.value);}catch(e){}flash('Saved ✓');});
if(clearBtn)clearBtn.addEventListener('click',function(){if(ta.value.trim()&&!window.confirm('Clear your reflection on this device?'))return;ta.value='';try{localStorage.removeItem(KEY);}catch(e){}flash('Cleared.');ta.focus();});
if(copyBtn)copyBtn.addEventListener('click',function(){var text=(ta.value||'').trim();if(!text){flash('Nothing to copy yet.');return;}function done(){flash('Copied ✓');}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fb(text,done);});}else{fb(text,done);}});
function fb(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){flash('Copy not supported.');}}
}catch(e){console.error('project script error',e);}
});
