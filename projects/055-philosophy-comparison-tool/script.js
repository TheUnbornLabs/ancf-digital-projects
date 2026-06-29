document.addEventListener('DOMContentLoaded',function(){
try{
var views=[
  {name:'Antinatalism',core:'Creating new life is ethically worth questioning.',children:'Leans against.',value:'Preventing suffering; consent.',objection:'"Lives can be net positive."'},
  {name:'Childfree (personal)',core:'My own choice; no universal claim.',children:'A personal no.',value:'Autonomy; fit with my life.',objection:'"You may regret it."'},
  {name:'Pronatalism',core:'People generally should have children.',children:'Yes.',value:'Continuity; family; society.',objection:'"It can pressure and coerce."'},
  {name:'Reproductive autonomy',core:'Each person decides freely, in either direction.',children:'Either — freely chosen.',value:'Freedom; bodily self-determination.',objection:'"Choices are shaped by society."'}
];
var fields=[['core','Core claim'],['children','On having children'],['value','Key value'],['objection','Common objection']];

// Reference table
var body=document.getElementById('cmpBody');
if(body){
  views.forEach(function(v){
    var tr=document.createElement('tr');
    var cells=['<th scope="row">'+v.name+'</th>','<td>'+v.core+'</td>','<td>'+v.children+'</td>','<td>'+v.value+'</td>','<td>'+v.objection+'</td>'];
    tr.innerHTML=cells.join('');
    body.appendChild(tr);
  });
}

// Compare two
var selA=document.getElementById('viewA');
var selB=document.getElementById('viewB');
var out=document.getElementById('compareOut');
function fill(sel,idx){views.forEach(function(v,i){var o=document.createElement('option');o.value=i;o.textContent=v.name;if(i===idx)o.selected=true;sel.appendChild(o);});}
if(selA&&selB&&out){
  fill(selA,0);fill(selB,3);
  function card(v){
    var rows=fields.map(function(f){return '<strong>'+f[1]+'</strong><span>'+v[f[0]]+'</span>';}).join('');
    return '<div class="card cmp-card"><h3>'+v.name+'</h3><div class="kv">'+rows+'</div></div>';
  }
  function render(){
    var a=views[+selA.value],b=views[+selB.value];
    out.innerHTML=card(a)+card(b);
  }
  selA.addEventListener('change',render);
  selB.addEventListener('change',render);
  render();
}
}catch(e){console.error('project script error',e);}
});
