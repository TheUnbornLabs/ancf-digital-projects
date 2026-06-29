document.addEventListener('DOMContentLoaded',function(){
try{
var T={
  autonomy:{title:'What reproductive autonomy means',s2:'It means YOU decide whether, when, and how to have children — including not to.',s3:'Myth: "it\'s only about not having kids." Reality: it protects parents and the childfree equally.',s4:'Takeaway: defending one person\'s choice defends everyone\'s.'},
  myths:{title:'Childfree: myths vs facts',s2:'Myth: childfree people hate kids. Fact: many adore the kids in their lives.',s3:'Myth: you\'ll definitely regret it. Fact: regret varies for every path, including parenthood.',s4:'Takeaway: a considered choice is what counts, not the choice itself.'},
  boundary:{title:'How to set a kind boundary',s2:'Name it simply: "I\'ve decided, and I\'d like to move on."',s3:'Myth: boundaries are rude. Reality: a calm boundary protects the relationship.',s4:'Takeaway: repeat it warmly; you don\'t owe a five-point essay.'},
  careplan:{title:'"Who\'ll care for you?" — a real answer',s2:'Care comes from planning, friendships, chosen family, and services — not automatically from children.',s3:'Myth: children guarantee elder care. Reality: most elder care is professional, even for parents.',s4:'Takeaway: plan your support directly — wise for everyone.'}
};
var ctas=['Save this, share kindly, and decide for yourself.','Tag someone who needs the reminder — gently.','Keep it, revisit it, make up your own mind.'];
function pick(a,i){return a[((i%a.length)+a.length)%a.length];}
var variant=0;
function build(){
  var t=T[document.getElementById('topic').value]||T.autonomy;
  return 'SLIDE 1 (Hook): '+t.title+'\n'+
    'SLIDE 2 (Point): '+t.s2+'\n'+
    'SLIDE 3 (Gentle myth-bust): '+t.s3+'\n'+
    'SLIDE 4 (Takeaway): '+t.s4+'\n'+
    'SLIDE 5 (CTA): "'+pick(ctas,variant)+'"\n\n'+
    'Caption: keep it respectful; avoid hashtags that target any group.';
}

var out=document.getElementById('genOut');
var custom=document.getElementById('custom');
var status=document.getElementById('saveStatus');
var KEY='ancf-'+location.pathname;
var timer=null;
function flash(msg){if(!status)return;status.textContent=msg;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
function generate(){var text=build();out.textContent=text;if(custom){custom.value=text;try{localStorage.setItem(KEY,custom.value);}catch(e){}}}
var genBtn=document.getElementById('genBtn');
var againBtn=document.getElementById('againBtn');
if(genBtn)genBtn.addEventListener('click',function(){variant=0;generate();});
if(againBtn)againBtn.addEventListener('click',function(){variant++;generate();});
if(custom){try{var saved=localStorage.getItem(KEY);if(saved){custom.value=saved;out.textContent=saved;}}catch(e){}custom.addEventListener('input',function(){try{localStorage.setItem(KEY,custom.value);}catch(e){}flash('Saved ✓');});}
function copyText(text,btn,label){if(!text||!text.trim()||text.indexOf('will appear')>=0){flash('Generate first.');return;}function done(){if(btn){btn.textContent='Copied ✓';setTimeout(function(){btn.textContent=label;},1500);}}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fb(text,done);});}else{fb(text,done);}}
function fb(text,done){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){flash('Copy not supported.');}}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){copyText(out.textContent,copyBtn,'Copy to clipboard');});
var copyCustom=document.getElementById('copyCustom');
if(copyCustom)copyCustom.addEventListener('click',function(){copyText(custom?custom.value:'',copyCustom,'Copy my version');});
}catch(e){console.error('project script error',e);}
});
