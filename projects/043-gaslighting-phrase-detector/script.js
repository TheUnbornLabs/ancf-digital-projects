document.addEventListener('DOMContentLoaded',function(){
try{
var P=[["overreact|too sensitive|dramatic", "Minimising your feelings."], ["never (happened|said)|imagining", "Denying events or memory."], ["you\u2019re (crazy|confused|paranoid)", "Undermining your sanity."], ["everyone agrees|no one else", "Isolating your perspective."], ["i was just joking|can\u2019t take a joke", "Reframing harm as humour."]];document.getElementById('detBtn').addEventListener('click',function(){var t=document.getElementById('det').value.toLowerCase(),hits=[];P.forEach(function(p){var re=new RegExp(p[0],'i');if(re.test(t))hits.push('• '+p[1]);});var o=document.getElementById('detOut');o.textContent=hits.length?('Patterns worth noticing:\n'+hits.join('\n')):'No flagged patterns found. That does not mean the message is good or bad — trust your own judgement too.';});
}catch(e){console.error('project script error',e);}
});
