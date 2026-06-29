document.addEventListener('DOMContentLoaded',function(){
try{
var P=[
["after all (we|i)|sacrific|everything (we|i) did|repay","Guilt over past sacrifices — care reframed as a debt."],
["you'?ll regret|you'?ll be sorry|one day you'?ll","Fear-of-the-future framing."],
["if you (really )?(loved|cared)","Love made conditional on compliance."],
["what will people (say|think)|what would .* think|shame","Shame and social-image pressure."],
["break my heart|kill me|the death of me|put me in (my|an early) grave","Emotional escalation."],
["only happy if|owe (us|me)|after we|ungrateful","Framing your choice as a debt or betrayal."]
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
    out.textContent=hits.length+' pattern'+(hits.length>1?'s':'')+' worth noticing:\n\n'+hits.join('\n')+'\n\nYou can acknowledge the feeling without giving up your boundary: "I hear that you\'re upset, and my decision stands."';
  }else{
    out.textContent='No flagged patterns found. That does not mean the message is fine or not — trust your own read of it.';
  }
}
if(btn)btn.addEventListener('click',analyse);
if(ta)ta.addEventListener('input',analyse);
if(examples)examples.addEventListener('click',function(e){var b=e.target.closest('[data-ex]');if(!b)return;ta.value=b.getAttribute('data-ex');analyse();ta.focus();});
}catch(e){console.error('project script error',e);}
});
