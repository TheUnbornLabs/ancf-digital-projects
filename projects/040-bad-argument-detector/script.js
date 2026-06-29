document.addEventListener('DOMContentLoaded',function(){
try{
// [regex, fallacy name + explanation, fair reply]
var P=[
["everyone (knows|does|has)|most people|nobody|we all","Appeal to popularity (bandwagon) — popularity isn't proof.","“Common isn't the same as correct.”"],
["natural|unnatural|meant to be|the way things are","Appeal to nature — natural and good aren't the same.","“Natural doesn't automatically mean right.”"],
["always|never|everyone|no one|all of them|none of","Over-generalisation — sweeping claims rarely hold.","“Is that true in every single case?”"],
["slippery slope|next thing|end up|lead to the end|humanity ends|die out","Slippery slope — assumes a chain reaction without the links.","“What actually connects one to the other?”"],
["you just|you('| a)re only|selfish|stupid|ignorant|naive|immature","Ad hominem — attacks the person, not the point.","“That's about me, not my argument.”"],
["god|tradition|elders said|the bible|our ancestors|authority","Appeal to authority or tradition — weigh it, don't obey it.","“What's the reasoning behind it?”"],
["real (man|woman)|not a real|incomplete|less of a","Loaded / no-true-Scotsman framing — ties worth to a label.","“Worth doesn't depend on that label.”"]
];
var ta=document.getElementById('det');
var out=document.getElementById('detOut');
var btn=document.getElementById('detBtn');
var examples=document.getElementById('examples');
function analyse(){
  var t=(ta.value||'').toLowerCase();
  if(!t.trim()){out.textContent='No analysis yet — paste or pick an example above.';return;}
  var hits=[];
  P.forEach(function(p){var re=new RegExp(p[0],'i');if(re.test(t))hits.push('• '+p[1]+'\n   Fair reply: '+p[2]);});
  if(hits.length){
    out.textContent=hits.length+' pattern'+(hits.length>1?'s':'')+' worth examining:\n\n'+hits.join('\n\n')+'\n\nReminder: a flagged phrase is a prompt to think, not proof of a fallacy.';
  }else{
    out.textContent='No flagged patterns found. That does not mean the argument is sound or unsound — judge the reasoning yourself.';
  }
}
if(btn)btn.addEventListener('click',analyse);
if(ta)ta.addEventListener('input',analyse);
if(examples)examples.addEventListener('click',function(e){
  var b=e.target.closest('[data-ex]');
  if(!b)return;
  ta.value=b.getAttribute('data-ex');
  analyse();ta.focus();
});
}catch(e){console.error('project script error',e);}
});
