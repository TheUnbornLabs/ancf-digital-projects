document.addEventListener('DOMContentLoaded',function(){
try{

var ids=['food','time','money'],out=document.getElementById('rOut');
function draw(){var total=0,vals={};ids.forEach(function(i){vals[i]=+document.getElementById(i).value;total+=vals[i];});
var msg='Per person share of a fixed pool of 100 units:\n';
[1,2,4,8].forEach(function(pp){msg+='• Household of '+pp+': '+(100/pp).toFixed(1)+' units each\n';});
out.textContent=msg+'\nThis is a neutral illustration of how any fixed resource divides as a group grows — nothing more.';}
ids.forEach(function(i){document.getElementById(i).addEventListener('input',draw);});draw();

}catch(e){console.error('project script error',e);}
});
