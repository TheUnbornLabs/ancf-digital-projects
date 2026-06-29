document.addEventListener('DOMContentLoaded',function(){
try{
var TREE={
  start:{q:'A friend teases your childfree choice. You…',opts:[
    {t:'Laugh and hold your ground',p:2,to:'online'},
    {t:'Snap back unkindly',p:0,to:'snap'},
    {t:'Explain calmly',p:1,to:'online'}]},
  snap:{q:'It got heated and now you feel a bit bad. You…',opts:[
    {t:'Apologise for the tone, keep the boundary',p:2,to:'online'},
    {t:'Double down',p:0,to:'end_mean'}]},
  online:{q:'Online, someone insults parents in your group. You…',opts:[
    {t:'Ask them to critique ideas, not people',p:2,to:'drained'},
    {t:'Pile on',p:0,to:'end_mean'},
    {t:'Report it and de-escalate',p:2,to:'drained'}]},
  drained:{q:'You feel drained by all the debate. You…',opts:[
    {t:'Take a real break',p:2,to:'end_good'},
    {t:'Doomscroll for an hour',p:0,to:'end_tired'},
    {t:'Talk to someone you trust',p:2,to:'end_good'}]},
  end_good:{end:true,msg:'You stayed kind and kept your autonomy. That balance — firm and warm — is the real win this game is about.'},
  end_tired:{end:true,msg:'Doomscrolling quietly drains the very freedom you were defending. A real break protects it better than any comeback.'},
  end_mean:{end:true,msg:'Piling on felt good for a second, but it made the space meaner — including for you. Critiquing ideas, not people, keeps your own peace too.'}
};
var pts=0,node='start';
var label=document.getElementById('freedomLabel');
var out=document.getElementById('fOut');
var box=document.getElementById('choices');
function setLabel(){if(label)label.textContent='Freedom points: '+pts;}
function render(){
  var n=TREE[node];setLabel();
  if(n.end){out.textContent=n.msg+' (Freedom points: '+pts+')';box.innerHTML='';
    var again=document.createElement('button');again.className='btn btn-primary';again.textContent='Play again';
    again.addEventListener('click',function(){pts=0;node='start';render();});box.appendChild(again);return;}
  out.textContent=n.q;box.innerHTML='';
  n.opts.forEach(function(o){var b=document.createElement('button');b.className='btn';b.style.margin='6px 6px 0 0';b.textContent=o.t;
    b.addEventListener('click',function(){pts+=o.p;node=o.to;render();});box.appendChild(b);});
}
render();
}catch(e){console.error('project script error',e);}
});
