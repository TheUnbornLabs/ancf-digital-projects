document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;

// Copy the full policy
var POLICY=[
'CRISIS-SAFE COMMUNITY POLICY (template — adapt for your group)',
'',
'OUR STANCE',
'We never encourage self-harm or harm to others, and we never shame anyone for struggling. We respond to distress with care and signposting. This community is not a crisis service.',
'',
'IF A MEMBER IS STRUGGLING — RESPONSE STEPS',
'1. Notice and stay calm; take it seriously.',
'2. Respond with warmth, privately where possible: "I\'m glad you said something. You\'re not alone."',
'3. Share general support resources (see below).',
'4. If there is immediate danger, encourage contacting local emergency services right away.',
'5. Do not amplify graphic content; gently limit detailed descriptions.',
'6. Never discipline the distress — no warnings or removals for reaching out.',
'7. Debrief the moderator team and check on each other.',
'',
'WHAT WE DO: respond kindly and promptly; share resources; keep the space calm; support each other.',
'WHAT WE DON\'T: diagnose; promise confidentiality we can\'t guarantee; replace professional help; punish someone for being in pain.',
'',
'SUPPORT RESOURCES (insert real, region-appropriate lines):',
'  - [local/national support line]',
'  - [emergency services number]',
'',
'This policy is guidance, not professional or legal advice.'
].join('\n');

var copyPolicy=document.getElementById('copyPolicy');
var copyStatus=document.getElementById('copyStatus');
function pflash(m){if(copyStatus){copyStatus.textContent=m;setTimeout(function(){copyStatus.textContent='';},1800);}}
if(copyPolicy)copyPolicy.addEventListener('click',function(){
  function done(){pflash('Policy copied ✓');}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(POLICY).then(done,function(){pfb(POLICY,done);});}else{pfb(POLICY,done);}
});
function pfb(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){pflash('Copy not supported.');}}

// Reflection tool
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
