document.addEventListener('DOMContentLoaded',function(){
try{
var TREE={
  start:{q:'A relative pushes hard about kids at dinner. You…',opts:[
    {t:'Calmly restate your boundary',p:2,to:'guilt'},
    {t:'Argue heatedly',p:0,to:'argue'},
    {t:'Change the subject kindly',p:1,to:'subject'}]},
  guilt:{q:'They escalate with guilt — "after all we did for you". You…',opts:[
    {t:'Name the guilt gently',p:2,to:'end_good'},
    {t:'Give in to keep the peace',p:0,to:'end_giveup'},
    {t:'Step away for a breather',p:2,to:'end_good'}]},
  argue:{q:'It tips into a shouting match. You…',opts:[
    {t:'Pause and lower your voice',p:1,to:'guilt'},
    {t:'Storm off',p:0,to:'end_rough'}]},
  subject:{q:'They circle straight back to the topic. You…',opts:[
    {t:'Restate your boundary once, warmly',p:2,to:'guilt'},
    {t:'Keep deflecting all night',p:1,to:'end_tired'}]},
  end_good:{end:true,msg:'You held your boundary with warmth. Freedom intact — and so is the relationship. This is the move that works best over time.'},
  end_giveup:{end:true,msg:'You kept the peace tonight, but the question will return. Boundaries usually need repeating — that\'s normal, not failure.'},
  end_rough:{end:true,msg:'Heat rarely persuades anyone. Next time, the very same boundary said calmly will travel much further.'},
  end_tired:{end:true,msg:'Deflecting works in a pinch, but a clear, kind "no" tires you out far less than a whole evening of dodging.'}
};
var pts=0,node='start';
var label=document.getElementById('freedomLabel');
var out=document.getElementById('fOut');
var box=document.getElementById('choices');
function setLabel(){if(label)label.textContent='Freedom points: '+pts;}
function render(){
  var n=TREE[node];
  setLabel();
  if(n.end){
    out.textContent=n.msg+' (Freedom points: '+pts+')';
    box.innerHTML='';
    var again=document.createElement('button');again.className='btn btn-primary';again.textContent='Play again';
    again.addEventListener('click',function(){pts=0;node='start';render();});
    box.appendChild(again);
    return;
  }
  out.textContent=n.q;box.innerHTML='';
  n.opts.forEach(function(o){
    var b=document.createElement('button');b.className='btn';b.style.margin='6px 6px 0 0';b.textContent=o.t;
    b.addEventListener('click',function(){pts+=o.p;node=o.to;render();});
    box.appendChild(b);
  });
}
render();
}catch(e){console.error('project script error',e);}
});
