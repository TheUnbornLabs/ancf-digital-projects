/* Project 068 · Population Growth Visual Toy — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function fmt(n){ try{ return Math.round(n).toLocaleString('en-IN'); }catch(e){ return Math.round(n); } }
  function series(start,rate,years){ var a=[],v=start; for(var y=0;y<=years;y++){ a.push(start*Math.pow(1+rate/100,y)); } return a; }
  var W=360,Hh=200,PAD=8;
  function render(){
    var start=+$('sStart').value, rate=+$('sRate').value, years=+$('sYears').value, comp=+$('sCompare').value;
    $('vStart').textContent=fmt(start); $('vRate').textContent=rate+'%'; $('vYears').textContent=years; $('vCompare').textContent=comp+'%';
    var main=series(start,rate,years), low=series(start,comp,years);
    var max=Math.max(main[main.length-1],low[low.length-1],1);
    function pts(arr){ return arr.map(function(v,i){ var x=PAD+(i/years)*(W-2*PAD); var y=Hh-PAD-(v/max)*(Hh-2*PAD); return x.toFixed(1)+','+y.toFixed(1); }).join(' '); }
    var area=PAD+','+(Hh-PAD)+' '+pts(main)+' '+(W-PAD)+','+(Hh-PAD);
    var svg='<polygon points="'+area+'" fill="var(--accent-soft)" stroke="none"/>'+
      '<polyline points="'+pts(low)+'" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 4"/>'+
      '<polyline points="'+pts(main)+'" fill="none" stroke="var(--accent)" stroke-width="2.5"/>';
    $('chart').innerHTML=svg;
    var finalV=main[main.length-1], doublings=rate>0?Math.log(finalV/start)/Math.log(2):0, dtime=rate>0?(Math.log(2)/Math.log(1+rate/100)):Infinity;
    $('readouts').innerHTML=[
      ['Final size',fmt(finalV)],
      ['Multiplied by',(start>0?(finalV/start).toFixed(1)+'×':'—')],
      ['Doublings',rate>0?doublings.toFixed(1):'0'],
      ['Doubling time',rate>0?dtime.toFixed(0)+' yrs':'never (0%)']
    ].map(function(r){ return '<div class="ro"><div class="v">'+r[1]+'</div><div class="k">'+r[0]+'</div></div>'; }).join('');
  }
  ['sStart','sRate','sYears','sCompare'].forEach(function(id){ var el=$(id); if(el) el.addEventListener('input',render); });
  render();
  (function(){ var box=$('aboutCards'); if(!box) return;
    var C=[['Small rates, big totals','Even a 2–3% yearly rate multiplies a population many times over a century. Our minds expect straight lines; compounding curves up.'],['The rate is everything','Nudging the rate a little — compare the dashed line — changes the final size dramatically. Tiny differences compound into huge ones.'],['Maths, not morality','This is just the arithmetic of compounding. It models bank interest and bacteria alike, and says nothing about what anyone ought to do.']];
    box.innerHTML=C.map(function(p){ return '<div class="scard"><h4>'+p[0]+'</h4><span class="tg">Tap to expand</span><div class="more">'+p[1]+'</div></div>'; }).join('');
    box.querySelectorAll('.scard').forEach(function(c){ c.addEventListener('click',function(){ c.classList.toggle('open'); }); }); })();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 068 script error', e); }
});
