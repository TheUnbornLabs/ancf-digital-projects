document.addEventListener('DOMContentLoaded',function(){
try{
var KEY='ancf-'+location.pathname;
var N=4;

/* ---------- Risk slider ---------- */
var slider=document.getElementById('riskSlider');
var out=document.getElementById('riskOut');
if(slider&&out){
  function describe(v){
    v=+v;
    var head='You would accept up to about a '+v+'% chance of a seriously hard life.';
    var note;
    if(v===0)note='You accept no real risk at all — a strongly precautionary stance. Ask yourself: is a zero-risk life even possible to offer?';
    else if(v<=15)note='A low tolerance: the possibility of severe suffering weighs heavily for you, even against a likely good life.';
    else if(v<=40)note='A cautious middle: you accept some risk, but the chance of serious harm clearly gives you pause.';
    else if(v<=70)note='You lean toward the expected-value view: a good life is likely enough to justify a real chance of a hard one.';
    else if(v<100)note='A high tolerance: you trust that meaning and agency can outweigh substantial risk.';
    else note='You accept even a near-certain hard life. Worth asking what, for you, would ever be too much risk to impose on another.';
    return head+' '+note;
  }
  try{var saved=localStorage.getItem(KEY+':risk');if(saved!==null)slider.value=saved;}catch(e){}
  function update(){out.textContent=describe(slider.value);try{localStorage.setItem(KEY+':risk',slider.value);}catch(e){}}
  slider.addEventListener('input',update);
  update();
}

/* ---------- Guided prompts (multi-textarea) ---------- */
var fields=[];
var prompts=[];
var status=document.getElementById('saveStatus');
var timer=null;
function flash(msg){
  if(!status)return;status.textContent=msg;
  if(timer)clearTimeout(timer);
  timer=setTimeout(function(){status.textContent='Saved only on this device.';},1400);
}
for(var i=0;i<N;i++){
  var lbl=document.querySelector('label[for="rf'+i+'"]');
  prompts.push(lbl?lbl.textContent:('Prompt '+(i+1)));
  (function(i){
    var t=document.getElementById('rf'+i);
    if(!t)return;
    fields.push(t);
    try{t.value=localStorage.getItem(KEY+i)||'';}catch(e){}
    t.addEventListener('input',function(){try{localStorage.setItem(KEY+i,t.value);}catch(e){}flash('Saved ✓');});
  })(i);
}
var copyBtn=document.getElementById('copyBtn');
if(copyBtn)copyBtn.addEventListener('click',function(){
  var lines=['Suffering-Risk Thought Experiment — my reflections',''];
  if(slider)lines.push('Risk tolerance set to: '+slider.value+'%','');
  fields.forEach(function(t,i){lines.push(prompts[i],(t.value||'').trim()||'(left blank)','');});
  var text=lines.join('\n');
  function done(){flash('Copied ✓');}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done,function(){fallback(text,done);});
  }else{fallback(text,done);}
});
function fallback(text,done){
  try{
    var ta=document.createElement('textarea');
    ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.focus();ta.select();
    document.execCommand('copy');document.body.removeChild(ta);done();
  }catch(e){flash('Copy not supported — select the text manually.');}
}
var clearAllBtn=document.getElementById('clearAllBtn');
if(clearAllBtn)clearAllBtn.addEventListener('click',function(){
  if(!window.confirm('Clear all four reflections on this device? This cannot be undone.'))return;
  fields.forEach(function(t,i){t.value='';try{localStorage.removeItem(KEY+i);}catch(e){}});
  flash('All cleared.');
  if(fields[0])fields[0].focus();
});
}catch(e){console.error('project script error',e);}
});
