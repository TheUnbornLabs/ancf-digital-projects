document.addEventListener('DOMContentLoaded',function(){
try{
var P=[["everyone (knows|does)|most people", "Bandwagon / appeal to popularity."], ["always|never|everyone|no one", "Possible over-generalisation."], ["natural|unnatural", "Appeal to nature."], ["slippery slope|next thing|end up", "Possible slippery-slope reasoning."], ["you just|you\u2019re only|selfish|stupid", "Ad hominem \u2014 attacking the person."], ["god|tradition|elders said", "Appeal to authority or tradition."]];document.getElementById('detBtn').addEventListener('click',function(){var t=document.getElementById('det').value.toLowerCase(),hits=[];P.forEach(function(p){var re=new RegExp(p[0],'i');if(re.test(t))hits.push('• '+p[1]);});var o=document.getElementById('detOut');o.textContent=hits.length?('Patterns worth noticing:\n'+hits.join('\n')):'No flagged patterns found. That does not mean the message is good or bad — trust your own judgement too.';});
}catch(e){console.error('project script error',e);}
});
