document.addEventListener('DOMContentLoaded',function(){
try{
var P=[
["caste|jati|clan|gotra","Names a caste/community — make sure you're aiming at a pressure, not the people."],
["religion|religious|hindu|muslim|christian|sikh|jain|buddhis|faith","Mentions a religion — keep any critique on a specific practice or pressure, not believers."],
["ethnic|tribe|tribal|race|racial|nationality|foreigners","Mentions an ethnic/national group — avoid sweeping generalisations."],
["all of them|those people|these people|that lot|their kind","Group-blaming phrasing — rephrase toward specific behaviours or expectations."],
["always|never|every (one of|single)","Sweeping language about a group — soften to 'some' and name the behaviour."]
];
var ta=document.getElementById('det');
var out=document.getElementById('detOut');
var btn=document.getElementById('detBtn');
function analyse(){
  var t=(ta.value||'').toLowerCase();
  if(!t.trim()){out.textContent='No analysis yet — paste a draft above.';return;}
  var hits=[];
  P.forEach(function(p){var re=new RegExp(p[0],'i');if(re.test(t))hits.push('• '+p[1]);});
  if(hits.length){
    out.textContent=hits.length+' thing'+(hits.length>1?'s':'')+' to double-check:\n\n'+hits.join('\n\n')+'\n\nTip: swap "this group of people" for "this expectation/behaviour" and your point usually gets stronger and safer.';
  }else{
    out.textContent='No group-targeting language flagged. Still give it a human read — context matters, and kindness is the goal.';
  }
}
if(btn)btn.addEventListener('click',analyse);
if(ta)ta.addEventListener('input',analyse);
}catch(e){console.error('project script error',e);}
});
