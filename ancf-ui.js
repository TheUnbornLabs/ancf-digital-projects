/* ANCF shared UI toolkit — vanilla, no dependencies. Exposes window.ANCF. */
(function(){
  var ANCF={};

  /* ---- namespaced localStorage (per project path) ---- */
  ANCF.key=function(suffix){return 'ancf-'+location.pathname+(suffix?(':'+suffix):'');};
  ANCF.get=function(suffix,def){try{var v=localStorage.getItem(ANCF.key(suffix));return v===null?(def||''):v;}catch(e){return def||'';}};
  ANCF.set=function(suffix,val){try{localStorage.setItem(ANCF.key(suffix),val);}catch(e){}};
  ANCF.getJSON=function(suffix,def){try{var v=JSON.parse(localStorage.getItem(ANCF.key(suffix)));return v||def;}catch(e){return def;}};
  ANCF.setJSON=function(suffix,obj){try{localStorage.setItem(ANCF.key(suffix),JSON.stringify(obj));}catch(e){}};
  ANCF.remove=function(suffix){try{localStorage.removeItem(ANCF.key(suffix));}catch(e){}};

  /* ---- clipboard with fallback + transient button label ---- */
  ANCF.copy=function(text,btn){
    var label=btn?btn.textContent:null;
    function flash(msg){if(btn){btn.textContent=msg;setTimeout(function(){btn.textContent=label;},1500);}}
    function done(){flash('Copied ✓');}
    function fb(){try{var t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.focus();t.select();document.execCommand('copy');document.body.removeChild(t);done();}catch(e){flash('Copy failed');}}
    if(!text||!String(text).trim()){flash('Nothing to copy');return;}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,fb);}else{fb();}
  };

  /* ---- meter / score bar: set fill width 0..100 ---- */
  ANCF.meter=function(fillEl,pct){pct=Math.max(0,Math.min(100,Math.round(pct)));if(fillEl)fillEl.style.width=pct+'%';return pct;};

  /* ---- horizontal SVG bar chart into an <svg>. items=[{label,value}] ---- */
  ANCF.barChart=function(svg,items,opts){
    if(!svg||!items)return;opts=opts||{};
    var vals=items.map(function(i){return +i.value||0;});
    var max=opts.max||Math.max.apply(null,vals.concat([1]));
    var rowH=30,gap=12,w=opts.width||340,labelW=opts.labelW||118,barW=w-labelW-46;
    var h=items.length*(rowH+gap);
    svg.setAttribute('viewBox','0 0 '+w+' '+h);
    if(opts.title)svg.setAttribute('aria-label',opts.title);
    var out='';
    items.forEach(function(it,i){
      var y=i*(rowH+gap),v=Math.max(0,+it.value||0),bw=Math.max(2,Math.round(v/max*barW));
      out+='<text x="0" y="'+(y+rowH/2+4)+'" class="bc-lbl">'+it.label+'</text>';
      out+='<rect x="'+labelW+'" y="'+y+'" width="'+barW+'" height="'+rowH+'" rx="6" class="bc-track"></rect>';
      out+='<rect x="'+labelW+'" y="'+y+'" width="'+bw+'" height="'+rowH+'" rx="6" class="bc-bar"></rect>';
      out+='<text x="'+(labelW+bw+6)+'" y="'+(y+rowH/2+4)+'" class="bc-val">'+(opts.fmt?opts.fmt(v):v)+'</text>';
    });
    svg.innerHTML=out;
  };

  /* ---- radar / spider chart. items=[{label,value(0..100)}] ---- */
  ANCF.radar=function(svg,items){
    if(!svg||!items||!items.length)return;
    var n=items.length,cx=160,cy=150,R=104,W=320,H=300;
    svg.setAttribute('viewBox','0 0 '+W+' '+H);
    function pt(i,r){var a=-Math.PI/2+i/n*2*Math.PI;return[cx+r*Math.cos(a),cy+r*Math.sin(a)];}
    var g='';
    [0.25,0.5,0.75,1].forEach(function(f){var d='';for(var i=0;i<n;i++){var p=pt(i,R*f);d+=(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)+' ';}g+='<path d="'+d+'Z" class="rd-ring"></path>';});
    for(var i=0;i<n;i++){var p=pt(i,R);g+='<line x1="'+cx+'" y1="'+cy+'" x2="'+p[0].toFixed(1)+'" y2="'+p[1].toFixed(1)+'" class="rd-spoke"></line>';
      var lp=pt(i,R+15),anc=(lp[0]<cx-5?'end':(lp[0]>cx+5?'start':'middle'));
      g+='<text x="'+lp[0].toFixed(1)+'" y="'+(lp[1]+3).toFixed(1)+'" text-anchor="'+anc+'" class="rd-lbl">'+items[i].label+'</text>';}
    var d='';for(var i=0;i<n;i++){var v=Math.max(0,Math.min(100,+items[i].value||0))/100;var p=pt(i,R*v);d+=(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)+' ';}
    g+='<path d="'+d+'Z" class="rd-area"></path>';
    svg.innerHTML=g;
  };

  /* ---- simple quiz scorer. Pass a container; .opt[data-q][data-i], answers[], explains[] ---- */
  ANCF.initOptions=function(scope,onPick){
    var opts=(scope||document).querySelectorAll('.opt');
    opts.forEach(function(o){
      o.setAttribute('role','button');o.setAttribute('tabindex','0');o.setAttribute('aria-pressed','false');
      function pick(){var q=o.getAttribute('data-q');
        (scope||document).querySelectorAll('.opt[data-q="'+q+'"]').forEach(function(x){x.classList.remove('sel');x.setAttribute('aria-pressed','false');});
        o.classList.add('sel');o.setAttribute('aria-pressed','true');if(onPick)onPick(q,o.getAttribute('data-i'),o);}
      o.addEventListener('click',pick);
      o.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick();}});
    });
  };

  window.ANCF=ANCF;
})();
