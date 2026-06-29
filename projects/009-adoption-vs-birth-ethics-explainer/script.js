document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};

/* ---------- Existing-need bar chart (illustrative, static) ---------- */
var needChart=document.getElementById('needChart');
if(needChart&&A.barChart)A.barChart(needChart,[
  {label:'Biological birth',value:0},{label:'Adoption',value:90},{label:'Fostering',value:85},{label:'Mentorship',value:60},{label:'Supporting',value:70}
],{max:100,fmt:function(v){return v+'%';},title:'Responds to existing need'});

/* ---------- Care-priority reflection tree ---------- */
var questions=[
 {q:"Right now, are you more drawn to caring for someone who already exists, or to creating a new life?",opts:[{t:"Someone who exists",k:"existing"},{t:"Creating a new life",k:"new"}]},
 {q:"Would you want a full-time parenting role, or to support without parenting?",opts:[{t:"Full parenting role",k:"parent"},{t:"Support without parenting",k:"support"}]},
 {q:"How much complexity could you take on right now?",opts:[{t:"Quite a lot",k:"high"},{t:"Only a little",k:"low"}]}
];
var step=0,ans=[];
var treeQ=document.getElementById('treeQ'),treeBtns=document.getElementById('treeBtns'),treeOut=document.getElementById('treeOut'),treeReset=document.getElementById('treeReset');
function renderTree(){
  if(step<questions.length){
    var qq=questions[step];treeQ.textContent=qq.q;treeBtns.innerHTML='';
    qq.opts.forEach(function(o){var b=document.createElement('button');b.className='btn';b.type='button';b.textContent=o.t;b.addEventListener('click',function(){ans[step]=o.k;step++;renderTree();});treeBtns.appendChild(b);});
    treeOut.style.display='none';treeReset.style.display=ans.length?'inline-block':'none';
  }else{
    treeQ.textContent='Where your priorities lean today:';treeBtns.innerHTML='';
    var msg;
    if(ans[1]==='support')msg='Supporting without parenting — mentorship, volunteering, or caring for family already here. Accessible and genuinely meaningful.';
    else if(ans[0]==='new')msg='A full parenting role with a child you bring into the world (biological birth) — worth holding alongside the consent and suffering-risk questions this collection explores.';
    else if(ans[2]==='high')msg='Parenting a child who already exists (adoption or fostering) — paths that meet a real need and ask real complexity in return.';
    else msg='You lean toward parenting an existing child but are wary of complexity — it may help to learn, at your own pace, what support adoption and fostering systems actually offer.';
    treeOut.textContent=msg+' This reflects only today’s leaning — not a recommendation, and not a duty.';
    treeOut.style.display='block';treeReset.style.display='inline-block';
  }
}
if(treeReset)treeReset.addEventListener('click',function(){step=0;ans=[];renderTree();});
if(treeQ)renderTree();

/* ---------- Resource allocation ---------- */
var inputs=[].slice.call(document.querySelectorAll('#alloc input[type=range]'));
var allocChart=document.getElementById('allocChart');
function drawAlloc(){
  var items=inputs.map(function(inp){return {label:inp.getAttribute('data-axis'),value:+inp.value};});
  if(A.barChart)A.barChart(allocChart,items,{max:10,title:'Care allocation'});
  var store={};inputs.forEach(function(inp){store[inp.id]=inp.value;});if(A.setJSON)A.setJSON('alloc',store);
}
if(inputs.length){var s=A.getJSON?A.getJSON('alloc',null):null;inputs.forEach(function(inp){if(s&&s[inp.id]!=null)inp.value=s[inp.id];var out=document.getElementById(inp.id.replace('a-','o-'));if(out)out.textContent=inp.value;inp.addEventListener('input',function(){if(out)out.textContent=inp.value;drawAlloc();});});drawAlloc();}

/* ---------- Reflection + summary ---------- */
var ta=document.getElementById('reflect'),status=document.getElementById('saveStatus'),timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='';},1600);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyBtn=document.getElementById('copyBtn'),clearBtn=document.getElementById('clearBtn');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set)A.set('reflect',ta.value);flash('Saved ✓');});
if(clearBtn)clearBtn.addEventListener('click',function(){if(ta.value.trim()&&!window.confirm('Clear your reflection on this device?'))return;ta.value='';if(A.remove)A.remove('reflect');flash('Cleared.');ta.focus();});
if(copyBtn)copyBtn.addEventListener('click',function(){
  var lines=['Adoption vs birth — my summary',''];
  if(inputs.length){lines.push('My care allocation:');inputs.forEach(function(inp){lines.push('  • '+inp.getAttribute('data-axis')+': '+inp.value+'/10');});}
  lines.push('','My reflection:',(ta&&ta.value.trim())?ta.value.trim():'(left blank)');
  if(A.copy)A.copy(lines.join('\n'),copyBtn);
});
}catch(e){console.error('project 009 script error',e);}
});
