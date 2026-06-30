/* Project 069 · Resource Allocation Simulator — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  var RES={
    money:{name:'Monthly budget (₹)',unit:'₹',min:10000,max:300000,step:1000,def:60000,ico:'💰',per:'per person / month'},
    time:{name:'Free hours / week',unit:'',suffix:' hrs',min:0,max:80,step:1,def:40,ico:'⏳',per:'attention hours each / week'},
    space:{name:'Living space (sq ft)',unit:'',suffix:' sq ft',min:200,max:3000,step:50,def:900,ico:'🏠',per:'per person'}
  };
  function fmt(v,r){ var n=Math.round(v); var s; try{ s=n.toLocaleString('en-IN'); }catch(e){ s=''+n; } return (r.unit||'')+s+(r.suffix||''); }
  (function(){ var s=$('resType'); s.innerHTML=Object.keys(RES).map(function(k){ return '<option value="'+k+'">'+RES[k].name+'</option>'; }).join(''); })();
  function setupPool(){ var r=RES[$('resType').value]; var sp=$('sPool'); sp.min=r.min; sp.max=r.max; sp.step=r.step; sp.value=r.def; }
  function render(){
    var r=RES[$('resType').value], pool=+$('sPool').value, n=+$('sPeople').value;
    $('vPool').textContent=fmt(pool,r); $('vPeople').textContent=n;
    var share=pool/n;
    $('bigshare').innerHTML='<div class="v">'+fmt(share,r)+'</div><div class="k">'+r.per+'</div>';
    var ppl=''; for(var i=0;i<n;i++){ ppl+='<div class="person"><div class="ico">'+r.ico+'</div><div class="amt">'+fmt(share,r)+'</div></div>'; }
    $('people').innerHTML=ppl;
  }
  $('resType').addEventListener('change',function(){ setupPool(); render(); });
  $('sPool').addEventListener('input',render); $('sPeople').addEventListener('input',render);
  setupPool(); render();
  (function(){ var box=$('aboutCards'); if(!box) return;
    var C=[['What it shows','The simple truth that a fixed pool, split more ways, leaves a smaller slice each. A clear first picture of one kind of trade-off.'],['What it ignores','Real households share rooms, pool incomes, hand things down, and benefit from economies of scale. Per-person division overstates the squeeze.'],['What it isn\'t','It is not a verdict on family size or anyone\'s worth. People are not costs, and a smaller slice of money can sit beside a larger share of other goods.']];
    box.innerHTML=C.map(function(p){ return '<div class="scard"><h4>'+p[0]+'</h4><span class="tg">Tap to expand</span><div class="more">'+p[1]+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 069 script error', e); }
});
