document.addEventListener('DOMContentLoaded',function(){
try{
// pattern: [regex, what it does, a calm reframe you could use]
var P=[
["change your mind|too young to (know|decide)|just a phase","Assumes your decision isn't real or final.","“I've thought about this carefully — it's not a phase.”"],
["who will (look after|care for) you|when you('| a)re old","Frames children as retirement insurance.","“I'd rather build friendships and savings I can count on.”"],
["selfish|self-?cent(er|re)d","Moralises a personal choice.","“Choosing what's right for my life isn't selfish.”"],
["god|nature|natural|meant to|supposed to","Appeals to destiny rather than your reasons.","“People build meaningful lives in many different ways.”"],
["everyone (does|has)|normal|what people do","Appeals to majority pressure.","“Common isn't the same as right for me.”"],
["body clock|running out of time|tick(ing)?","Time-pressure framing.","“My timeline is mine to manage.”"],
["incomplete|not a real (woman|man|family)|fulfilled","Ties your worth to parenthood.","“My worth doesn't depend on having children.”"],
["regret|you'll be lonely|who('| wi)ll visit","Predicts future regret to create fear.","“I'm comfortable with my choice and its trade-offs.”"]
];

var ta=document.getElementById('det');
var out=document.getElementById('detOut');
var btn=document.getElementById('detBtn');
var examples=document.getElementById('examples');

var lastReplies=[];
function analyse(){
  var t=(ta.value||'').toLowerCase();
  lastReplies=[];
  if(!t.trim()){out.textContent='No analysis yet — paste or pick an example above.';return;}
  var hits=[];
  P.forEach(function(p){
    var re=new RegExp(p[0],'i');
    if(re.test(t)){hits.push('• '+p[1]+'\n   You could say: '+p[2]);lastReplies.push(p[2]);}
  });
  if(hits.length){
    out.textContent=hits.length+' pattern'+(hits.length>1?'s':'')+' worth noticing:\n\n'+hits.join('\n\n')+'\n\nRemember: naming a pattern is for your clarity, not for blaming the speaker.';
  }else{
    out.textContent='No flagged patterns found. That does not mean the message is good or bad — trust your own judgement too.';
  }
}

if(btn)btn.addEventListener('click',analyse);
if(ta)ta.addEventListener('input',analyse);

var copyBtn=document.getElementById('detCopy');
var clearBtn=document.getElementById('detClear');
var status=document.getElementById('detStatus');
var sTimer=null;
function flash(msg){if(!status)return;status.textContent=msg;if(sTimer)clearTimeout(sTimer);sTimer=setTimeout(function(){status.textContent='';},1600);}
function fallbackCopy(text,done){try{var x=document.createElement('textarea');x.value=text;x.style.position='fixed';x.style.opacity='0';document.body.appendChild(x);x.focus();x.select();document.execCommand('copy');document.body.removeChild(x);done();}catch(e){flash('Copy not supported — select manually.');}}
if(copyBtn)copyBtn.addEventListener('click',function(){
  if(!lastReplies.length){flash('Nothing to copy yet.');return;}
  var text=lastReplies.join('\n');
  function done(){flash('Copied ✓');}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fallbackCopy(text,done);});}
  else{fallbackCopy(text,done);}
});
if(clearBtn)clearBtn.addEventListener('click',function(){if(ta){ta.value='';}lastReplies=[];out.textContent='No analysis yet — paste or pick an example above.';flash('Cleared.');if(ta)ta.focus();});
if(examples)examples.addEventListener('click',function(e){
  var b=e.target.closest('[data-ex]');
  if(!b)return;
  ta.value=b.getAttribute('data-ex');
  analyse();
  ta.focus();
});
}catch(e){console.error('project script error',e);}
});
