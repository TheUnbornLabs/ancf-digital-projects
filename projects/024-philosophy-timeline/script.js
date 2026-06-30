/* Project 024 · Philosophy Timeline — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var STR={phil:'Philosophy',rel:'Religion',fem:'Feminism & childfree',eco:'Ecology',eth:'Ethics & rights',cult:'Culture'};
  var SDESC={phil:'Pessimism and the formal arguments about coming into existence.',rel:'World-rejecting and liberation-seeking currents, East and West.',fem:'The defence of women\'s right to decide — including to decline.',eco:'Weighing new life against shared planetary limits.',eth:'Population ethics and the law of reproductive rights.',cult:'Where these ideas surface in literature and the wider culture.'};
  // ord = sort key; yr = display
  var T=[
    {ord:-500,yr:'c. 5th c. BCE',str:'phil',ti:'The "wisdom of Silenus"',d:'Greek thought (Theognis; Sophocles\' Oedipus at Colonus) voices the dark maxim that it is best never to be born, and next best to die soon — an ancient seed of philosophical pessimism.'},
    {ord:-480,yr:'c. 5th c. BCE',str:'rel',ti:'The Buddha & the First Noble Truth',d:'Dukkha (suffering/unsatisfactoriness), samsara (rebirth driven by craving), and liberation as cessation — a profound, distinct tradition that resonates with later antinatalist themes.'},
    {ord:-450,yr:'ancient',str:'rel',ti:'Jain asceticism',d:'Radical non-harm (ahimsa) and severe asceticism aimed at ending the soul\'s bondage in matter and the cycle of rebirth.'},
    {ord:200,yr:'early CE',str:'rel',ti:'Gnostic & Manichaean world-rejection',d:'Currents that viewed the material world and its creation as flawed — a recurring strand of cosmic pessimism.'},
    {ord:1818,yr:'1818',str:'phil',ti:'Schopenhauer, "The World as Will and Representation"',d:'Reality as blind "Will": life oscillates between the pain of unmet desire and the boredom of satisfied desire. The foundation of modern pessimism.'},
    {ord:1876,yr:'1876',str:'phil',ti:'Mainländer, "The Philosophy of Redemption"',d:'An extreme pessimism positing a "will to die" at the heart of things — a stark, much-discussed footnote in the tradition.'},
    {ord:1895,yr:'1895',str:'cult',ti:'Hardy, "Jude the Obscure"',d:'A novel whose famous, harrowing "Father Time" episode gives literary voice to the thought that some should never have been born.'},
    {ord:1916,yr:'1916',str:'fem',ti:'Hollingworth, "Social Devices..."',d:'Leta Hollingworth names the social machinery — law, religion, art, opinion — that manufactures the "maternal instinct" as a duty.'},
    {ord:1933,yr:'1933',str:'phil',ti:'Zapffe, "The Last Messiah"',d:'Human consciousness "overshot," producing existential dread we manage through four defence mechanisms: isolation, anchoring, distraction, sublimation.'},
    {ord:1968,yr:'1968',str:'eth',ti:'UN Tehran Conference',d:'Affirms that parents have a basic right to decide freely the number and spacing of their children — an early milestone for reproductive rights.'},
    {ord:1971,yr:'1971',str:'fem',ti:'Peck, "The Baby Trap"',d:'An early, prominent book of the modern childfree movement, challenging the assumption that everyone should parent.'},
    {ord:1972,yr:'1972',str:'fem',ti:'National Organization for Non-Parents',d:'Founded by Ellen Peck and Shirley Radl to make childfree life respectable and to fight pronatalist discrimination.'},
    {ord:1973,yr:'1973',str:'phil',ti:'Cioran, "The Trouble with Being Born"',d:'The Romanian-French aphorist\'s lucid, literary meditation on the "inconvenience" of having been born.'},
    {ord:1976,yr:'1976',str:'fem',ti:'Russo, "The Motherhood Mandate"',d:'Nancy Felipe Russo names the false idea that a woman must have (and raise) children to count as a proper adult woman.'},
    {ord:1979,yr:'1979',str:'eth',ti:'CEDAW adopted',d:'The UN women\'s-rights treaty enshrines equal rights to decide on children and access to the means to do so.'},
    {ord:1984,yr:'1984',str:'eth',ti:'Parfit, "Reasons and Persons"',d:'Introduces the non-identity problem and the repugnant conclusion — central puzzles of population ethics.'},
    {ord:1991,yr:'1991',str:'eco',ti:'VHEMT founded',d:'Les U. Knight launches the Voluntary Human Extinction Movement: voluntary, non-coercive non-reproduction for the biosphere\'s sake.'},
    {ord:1994,yr:'1994',str:'eth',ti:'Cairo ICPD & "reproductive justice"',d:'The UN conference reframes reproduction around individual rights; the same year, a group of Black women in the US coin the reproductive-justice framework.'},
    {ord:2006,yr:'2006',str:'phil',ti:'Benatar, "Better Never to Have Been"; the term "antinatalism"',d:'Benatar\'s asymmetry argument gives antinatalism its modern analytic form. The same year, Théophile de Giraud\'s manifesto popularizes the word "antinatalism".'},
    {ord:2010,yr:'2010',str:'cult',ti:'Ligotti, "The Conspiracy Against the Human Race"',d:'A work of literary pessimism; consciousness as "malignantly useless." Later echoed in the TV series True Detective (2014).'},
    {ord:2014,yr:'2014',str:'phil',ti:'Perry, "Every Cradle Is a Grave"',d:'A contemporary, accessible case engaging both antinatalism and the ethics of suffering.'},
    {ord:2017,yr:'2017',str:'phil',ti:'Benatar, "The Human Predicament"',d:'Benatar on meaning, death, and the case for a measured pessimism about the human condition.'},
    {ord:2019,yr:'2019',str:'fem',ti:'Blackstone, "Childfree by Choice"',d:'A sociologist\'s synthesis of decades of research on the childfree movement and choice.'}
  ];
  var activeStr='all', term='';
  (function(){ var chips=$('strandChips'); if(!chips) return;
    var arr=[{k:'all',l:'All'}].concat(Object.keys(STR).map(function(k){ return {k:k,l:STR[k]}; }));
    chips.innerHTML=arr.map(function(c){ return '<span class="chip2'+(c.k==='all'?' active':'')+'" data-k="'+c.k+'" role="button" tabindex="0">'+esc(c.l)+'</span>'; }).join('');
    chips.querySelectorAll('.chip2').forEach(function(c){ function sel(){ activeStr=c.getAttribute('data-k'); chips.querySelectorAll('.chip2').forEach(function(x){x.classList.remove('active');}); c.classList.add('active'); render(); } c.addEventListener('click',sel); c.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();sel();} }); });
    var se=$('tlSearch'); if(se) se.addEventListener('input',function(){ term=se.value.toLowerCase().trim(); render(); });
  })();
  function matches(e){ if(activeStr!=='all'&&e.str!==activeStr) return false; if(!term) return true; return (e.ti+' '+e.d+' '+e.yr+' '+STR[e.str]).toLowerCase().indexOf(term)>-1; }
  function render(){
    var box=$('tlList'); if(!box) return;
    var shown=T.filter(matches).sort(function(a,b){return a.ord-b.ord;});
    if($('tlCount')) $('tlCount').textContent=shown.length+' of '+T.length+' entries'+(activeStr!=='all'?(' · '+STR[activeStr]):'')+(term?(' · "'+term+'"'):'');
    if(!shown.length){ box.innerHTML='<li><p class="note">No entries match that search.</p></li>'; return; }
    box.innerHTML=shown.map(function(e){ return '<li><details class="ent"><summary><span class="yr">'+esc(e.yr)+'</span><span class="ti">'+esc(e.ti)+'</span><span class="strand s-'+e.str+'">'+esc(STR[e.str])+'</span></summary><div class="body">'+esc(e.d)+'</div></details></li>'; }).join('');
  }
  render();
  (function(){ var kv=$('strandKv'); if(!kv) return; kv.innerHTML=Object.keys(STR).map(function(k){ return '<strong>'+esc(STR[k])+'</strong><span>'+esc(SDESC[k])+'</span>'; }).join(''); })();

  (function(){
    var Q=[{a:1},{a:0},{a:1}], E=['Benatar\'s "Better Never to Have Been" was published in 2006.','The word "antinatalism" entered common use around 2006 (de Giraud\'s manifesto; Benatar\'s book).','The 1994 Cairo ICPD reframed reproduction around individual rights, away from population quotas.'];
    var picks={}, total=document.querySelectorAll('#quizbox .quiz-q').length;
    if(A.initOptions) A.initOptions($('quizbox'),function(q,i){ picks[q]=+i; });
    var sB=$('quizScore'), rB=$('quizReset'), res=$('quizResult');
    if(sB) sB.addEventListener('click',function(){ if(Object.keys(picks).length<total){ res.style.display='block'; res.textContent='Pick an answer for all '+total+' questions first.'; return; }
      var sc=0; Q.forEach(function(it,i){ document.querySelectorAll('.opt[data-q="'+i+'"]').forEach(function(x){ var j=+x.getAttribute('data-i'); x.classList.remove('ok','no'); if(j===it.a)x.classList.add('ok'); else if(j===picks[i])x.classList.add('no'); }); var ex=document.querySelector('.explain[data-q="'+i+'"]'); if(ex){ ex.style.display='block'; ex.textContent=E[i]; } if(picks[i]===it.a)sc++; });
      res.style.display='block'; res.textContent='You matched '+sc+' of '+Q.length+' with the explained view.'; if(rB) rB.style.display='inline-block'; });
    if(rB) rB.addEventListener('click',function(){ picks={}; document.querySelectorAll('#quizbox .opt').forEach(function(x){ x.classList.remove('sel','ok','no'); }); document.querySelectorAll('#quizbox .explain').forEach(function(ex){ ex.style.display='none'; ex.textContent=''; }); res.style.display='none'; rB.style.display='none'; });
  })();
  (function(){
    var ta=$('r1'), status=$('saveStatus'), timer=null;
    function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('saveBtn'),cl=$('clearBtn');
    if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); });
  })();
} catch(e){ console.error('project 024 script error', e); }
});
