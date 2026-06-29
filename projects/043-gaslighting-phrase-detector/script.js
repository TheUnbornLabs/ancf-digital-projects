document.addEventListener('DOMContentLoaded',function(){
try{
var P=[
["overreact|too sensitive|dramatic|making a big deal","Minimising your feelings."],
["never (happened|said (that|it))|didn'?t happen|imagining|made (that|it) up","Denying events or memory."],
["you'?re (crazy|confused|paranoid|losing it|insane|unstable)","Undermining your judgement."],
["everyone agrees|no one else|nobody else|we all think","Isolating your perspective."],
["just joking|can'?t take a joke|too serious|lighten up","Reframing harm as humour."],
["that'?s not what (i|you) (said|meant)|twisting my words","Rewriting the conversation."]
];
var ta=document.getElementById('det');
var out=document.getElementById('detOut');
var btn=document.getElementById('detBtn');
var examples=document.getElementById('examples');
function analyse(){
  var t=(ta.value||'').toLowerCase();
  if(!t.trim()){out.textContent='No analysis yet — paste or pick an example above.';return;}
  var hits=[];
  P.forEach(function(p){var re=new RegExp(p[0],'i');if(re.test(t))hits.push('• '+p[1]);});
  if(hits.length){
    out.textContent=hits.length+' pattern'+(hits.length>1?'s':'')+' worth noticing:\n\n'+hits.join('\n')+'\n\nYour memory and feelings are valid data. You\'re allowed to say: "That\'s not how I experienced it."';
  }else{
    out.textContent='No flagged patterns found. That does not settle anything either way — trust your own read of the situation.';
  }
}
if(btn)btn.addEventListener('click',analyse);
if(ta)ta.addEventListener('input',analyse);
if(examples)examples.addEventListener('click',function(e){var b=e.target.closest('[data-ex]');if(!b)return;ta.value=b.getAttribute('data-ex');analyse();ta.focus();});
}catch(e){console.error('project script error',e);}
});
