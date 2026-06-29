document.addEventListener('DOMContentLoaded',function(){
try{
var A=window.ANCF||{};

/* ---------- Pressure vs desire + autonomy ---------- */
var desire=document.getElementById('desire'),pressure=document.getElementById('pressure'),
    oD=document.getElementById('o-desire'),oP=document.getElementById('o-pressure'),
    pdChart=document.getElementById('pdChart'),autoBar=document.getElementById('autoBar'),
    autoPct=document.getElementById('autoPct'),autoNote=document.getElementById('autoNote');
function pdUpdate(){
  var d=+desire.value,p=+pressure.value;
  if(oD)oD.textContent=d+'%';if(oP)oP.textContent=p+'%';
  if(A.barChart)A.barChart(pdChart,[{label:'Desire',value:d},{label:'Pressure',value:p}],{max:100,fmt:function(v){return v+'%';},title:'Desire vs pressure'});
  var autonomy=Math.round((d+(100-p))/2);
  if(A.meter)A.meter(autoBar,autonomy);if(autoPct)autoPct.textContent=autonomy+'%';
  if(autoNote){
    if(autonomy>=70)autoNote.textContent='This reads as strongly your own choice — clear desire with manageable pressure.';
    else if(autonomy>=45)autoNote.textContent='Mixed: real desire, but outside pressure is shaping things. Worth separating the voices below.';
    else autoNote.textContent='Pressure is outweighing your own desire here. Be gentle — the voice tool below may help you find your own again.';
  }
  if(A.set){A.set('desire',String(d));A.set('pressure',String(p));}
}
if(desire&&pressure){
  var sd=A.get?A.get('desire',''):'';if(sd!=='')desire.value=sd;
  var sp=A.get?A.get('pressure',''):'';if(sp!=='')pressure.value=sp;
  pdUpdate();desire.addEventListener('input',pdUpdate);pressure.addEventListener('input',pdUpdate);
}

/* ---------- Voices ---------- */
var vIn=document.getElementById('vIn'),vOut=document.getElementById('vOut');
if(vIn&&A.get){vIn.value=A.get('vIn','');vIn.addEventListener('input',function(){A.set('vIn',vIn.value);});}
if(vOut&&A.get){vOut.value=A.get('vOut','');vOut.addEventListener('input',function(){A.set('vOut',vOut.value);});}

/* ---------- Clarity checklist ---------- */
var clarWrap=document.getElementById('clarity');
var boxes=clarWrap?[].slice.call(clarWrap.querySelectorAll('input[type=checkbox]')):[];
var clarBar=document.getElementById('clarBar'),clarCount=document.getElementById('clarCount');
function clarRender(){var n=0;boxes.forEach(function(b){if(b.checked)n++;});if(A.meter)A.meter(clarBar,n/boxes.length*100);if(clarCount)clarCount.textContent=n+' of '+boxes.length+' signs of clarity present.';}
if(boxes.length){
  var cs=A.getJSON?A.getJSON('clarity',{}):{};cs=cs||{};
  boxes.forEach(function(b){var k=b.getAttribute('data-key');b.checked=!!cs[k];b.addEventListener('change',function(){cs[k]=b.checked;if(A.setJSON)A.setJSON('clarity',cs);clarRender();});});
  clarRender();
}

/* ---------- Report: save / copy / clear ---------- */
var ta=document.getElementById('reflect'),status=document.getElementById('saveStatus'),timer=null;
function flash(m){if(!status)return;status.textContent=m;if(timer)clearTimeout(timer);timer=setTimeout(function(){status.textContent='Saved only on this device.';},1500);}
if(ta&&A.get){ta.value=A.get('reflect','');ta.addEventListener('input',function(){A.set('reflect',ta.value);});}
var saveBtn=document.getElementById('saveBtn'),copyBtn=document.getElementById('copyBtn'),clearBtn=document.getElementById('clearBtn');
if(saveBtn)saveBtn.addEventListener('click',function(){if(A.set){A.set('reflect',ta.value);}flash('Saved ✓');});
if(copyBtn)copyBtn.addEventListener('click',function(){
  var d=desire?+desire.value:0,p=pressure?+pressure.value:0,autonomy=Math.round((d+(100-p))/2);
  var lines=['"Is This My Choice?" — my clarity report',''];
  lines.push('Inner desire: '+d+'%   Outside pressure: '+p+'%   Autonomy reading: '+autonomy+'%');
  var n=boxes.filter(function(b){return b.checked;}).length;lines.push('Signs of clarity present: '+n+' of '+boxes.length);
  if(vIn&&vIn.value.trim())lines.push('','My own voice:',vIn.value.trim());
  if(vOut&&vOut.value.trim())lines.push('','External voices:',vOut.value.trim());
  if(ta&&ta.value.trim())lines.push('','My notes:',ta.value.trim());
  if(A.copy)A.copy(lines.join('\n'),copyBtn);
});
if(clearBtn)clearBtn.addEventListener('click',function(){
  if(!window.confirm('Clear everything on this device? This cannot be undone.'))return;
  [ta,vIn,vOut].forEach(function(t){if(t)t.value='';});
  ['reflect','vIn','vOut','desire','pressure'].forEach(function(k){if(A.remove)A.remove(k);});
  if(A.remove)A.remove('clarity');
  boxes.forEach(function(b){b.checked=false;});clarRender();
  if(desire)desire.value=50;if(pressure)pressure.value=50;pdUpdate();
  flash('All cleared.');
});
}catch(e){console.error('project 005 script error',e);}
});
