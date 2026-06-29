document.addEventListener('DOMContentLoaded',function(){
try{
var P=[["after all (we|i)|sacrific", "Guilt over past sacrifices."], ["you\u2019ll regret|you\u2019ll be sorry", "Fear-of-future framing."], ["if you (loved|cared)", "Love made conditional on compliance."], ["what will people (say|think)", "Shame and social image pressure."], ["break my heart|kill me|the death of me", "Emotional escalation."], ["only happy if|owe (us|me)", "Framing your choice as a debt."]];document.getElementById('detBtn').addEventListener('click',function(){var t=document.getElementById('det').value.toLowerCase(),hits=[];P.forEach(function(p){var re=new RegExp(p[0],'i');if(re.test(t))hits.push('• '+p[1]);});var o=document.getElementById('detOut');o.textContent=hits.length?('Patterns worth noticing:\n'+hits.join('\n')):'No flagged patterns found. That does not mean the message is good or bad — trust your own judgement too.';});
}catch(e){console.error('project script error',e);}
});
