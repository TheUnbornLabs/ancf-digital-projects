/* Project 073 · Antinatalist Statement Builder — interactive logic */
document.addEventListener('DOMContentLoaded', function () {
try {
  var A=window.ANCF||{}; function $(id){return document.getElementById(id);}
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  var BASIS={
    asymmetry:{claim:'I hold that coming into existence carries a net harm, and that this gives us strong moral reason not to procreate.',
      reason:'This rests on an asymmetry argued by David Benatar: the absence of pain is good even when no one exists to enjoy that absence, whereas the absence of pleasure is only bad when there is someone for whom it is a deprivation. If that asymmetry holds, then never coming to exist spares a person all harm at the cost of no real loss.'},
    consent:{claim:'I hold that procreation is ethically fraught because it imposes serious, unavoidable risks on someone who cannot consent.',
      reason:'We normally require consent before exposing a person to significant risk. A being who does not yet exist cannot agree to be born, yet birth guarantees exposure to pain, loss, and eventual death. That a future person also cannot refuse does not, I think, dissolve the difficulty of acting on their behalf in so consequential a way.'},
    risk:{claim:'I hold that procreation is a grave gamble with another\'s wellbeing, and that this counsels caution rather than confidence.',
      reason:'No parent can guarantee a life free of severe suffering, and the possible downsides — chronic illness, trauma, despair — are irreversible once a life begins. Imposing that non-consensual risk on someone else, when the alternative harms no one, is at least worth taking far more seriously than we usually do.'},
    suffering:{claim:'I hold that reducing suffering takes moral priority, and that this weighs against creating new beings who will inevitably suffer.',
      reason:'On a suffering-focused view, preventing severe suffering matters more than, or before, creating new happiness. Since a new life reliably contains real suffering and only possible goods, the prevention of that suffering can carry decisive weight. I grant that how one balances this against life\'s genuine goods is exactly where reasonable people differ.'},
    environmental:{claim:'I hold that, given finite ecological limits, the decision to procreate deserves honest moral scrutiny.',
      reason:'Each new life draws on shared and strained resources, and on a damaged climate that the new person did not choose to inherit. I do not claim this settles the matter — systems and policy dwarf any individual choice — but I think it belongs in an honest accounting rather than being treated as taboo.'}
  };
  var FRAME={
    plain:{open:'My view, stated plainly:',close:''},
    academic:{open:'A statement of position:',close:''},
    personal:{open:'Speaking for myself:',close:''}
  };
  var CAVEAT='To be clear: this is a claim about the ethics of creating new lives, not a judgement of anyone who has children. Parenthood is a near-universal, deeply human, and socially encouraged choice, and I hold the people who make it in full respect. I also recognise this view faces serious objections, and I hold it provisionally, open to argument.';
  function build(){
    var b=BASIS[$('basis').value], f=FRAME[$('tone').value], full=$('length').value==='full';
    var parts=[f.open,'',b.claim];
    parts.push(''); parts.push(b.reason);
    parts.push(''); parts.push(CAVEAT);
    var txt=parts.join('\n');
    if(!full){ txt=f.open+'\n\n'+b.claim+'\n\n'+CAVEAT; }
    $('out').textContent=txt; check(txt); return txt;
  }
  function check(txt){ // confirm no demeaning language slipped in
    var bad=/\b(idiot|stupid|selfish breeders?|breeders?|inferior|subhuman|deserve|losers?)\b/i;
    var w=$('warn'); if(!w) return;
    if(bad.test(txt)){ w.classList.add('show'); w.innerHTML='<b>Heads up:</b> this draft contains language that could read as demeaning. A statement is strongest when it targets the idea, not people.'; }
    else { w.classList.remove('show'); w.textContent=''; }
  }
  ['basis','tone','length'].forEach(function(id){ var el=$(id); if(el) el.addEventListener('change',build); });
  $('buildBtn').addEventListener('click',build);
  $('copyBtn').addEventListener('click',function(){ if(A.copy) A.copy($('out').textContent,$('copyBtn')); });
  (function(){ var box=$('respectList'); if(!box) return;
    var R=['Argues the idea, never attacks people','States the claim, then the reasoning behind it','Explicitly declines to judge those who choose differently','Concedes the view faces serious objections','Holds the position provisionally, open to argument'];
    box.innerHTML=R.map(function(t){ return '<div class="r"><span class="ok">✓</span><span>'+esc(t)+'</span></div>'; }).join(''); })();
  build();
  (function(){ var ta=$('r1'), status=$('saveStatus'), timer=null; function flash(m){ if(!status)return; status.textContent=m; if(timer)clearTimeout(timer); timer=setTimeout(function(){ status.textContent=''; },1600); }
    if(ta&&A.get){ ta.value=A.get('r1',''); ta.addEventListener('input',function(){ A.set('r1',ta.value); }); }
    var s=$('rSave'),cl=$('rClear'); if(s) s.addEventListener('click',function(){ if(ta&&A.set)A.set('r1',ta.value); flash('Saved ✓'); });
    if(cl) cl.addEventListener('click',function(){ if(ta&&ta.value.trim()&&!window.confirm('Clear?'))return; if(ta){ta.value='';A.remove&&A.remove('r1');} flash('Cleared.'); }); })();
} catch(e){ console.error('project 073 script error', e); }
});
