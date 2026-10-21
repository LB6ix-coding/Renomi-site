// Header e-mail popover: opens the visitor's mail app with a prefilled message. No data is sent anywhere else.
(function(){
const A='info@marktic.fi';
const d=document.createElement('dialog');d.className='maild';d.setAttribute('aria-labelledby','maild-t');
d.innerHTML=`<form class="maild-f" novalidate>
  <div class="maild-h"><span class="maild-logo" aria-hidden="true">Markt<span class="i">ı</span>c</span><button type="button" class="maild-x" aria-label="Sulje" data-close>✕</button></div>
  <h2 id="maild-t">Maksuton kartoitus</h2>
  <p class="maild-p">Kertokaa yrityksen nimi ja paikkakunta, niin avaamme valmiin viestin sähköpostiohjelmaanne. Saatte kahden arkipäivän kuluessa kirjallisesti, miten yrityksenne löytyy Googlesta, kartalta ja ChatGPT:stä ja mitä korjaisimme ensin. Maksuton, ei sido mihinkään, ei myyntipuheluita.</p>
  <div class="maild-g">
    <label><span>Yrityksen nimi</span><input name="y" autocomplete="organization" required placeholder="Esim. LVI Virtanen Oy"></label>
    <label><span>Paikkakunta</span><input name="p" autocomplete="address-level2" required placeholder="Esim. Vantaa"></label>
  </div>
  <label><span>Viesti <small>valinnainen</small></span><textarea name="m" rows="3" placeholder="Kotisivujen osoite tai Google-profiili, jos on. Tai mitä haluaisitte, että katsomme ensin?"></textarea></label>
  <div class="maild-b"><button type="button" class="btn btn-brand" data-send>Avatkaa sähköposti</button></div>
  <p class="maild-a">Suoraan: <a href="mailto:${A}">${A}</a> <button type="button" class="maild-copy" data-copy>Kopioikaa osoite</button><br>Ei lomakepalvelinta, viesti lähtee omasta sähköpostistanne.</p>
</form>`;
document.body.appendChild(d);
const f=d.querySelector('form');
function build(){const y=f.y.value.trim(),p=f.p.value.trim(),m=f.m.value.trim();
  const s='Maksuton kartoitus: '+(y||'[yritys]')+', '+(p||'[paikkakunta]');
  const b='Hei,\n\nhaluaisin maksuttoman kartoituksen.\n\nYritys: '+y+'\nPaikkakunta: '+p+(m?'\n\n'+m:'')+'\n';
  return 'mailto:'+A+'?subject='+encodeURIComponent(s)+'&body='+encodeURIComponent(b);}
d.querySelector('[data-send]').addEventListener('click',()=>{if(!f.y.value.trim()||!f.p.value.trim()){f.reportValidity();return}location.href=build();d.close();});
d.querySelector('[data-copy]').addEventListener('click',async e=>{try{await navigator.clipboard.writeText(A);e.target.textContent='Kopioitu';setTimeout(()=>e.target.textContent='Kopioikaa osoite',1500)}catch(_){location.href='mailto:'+A}});
d.addEventListener('click',e=>{if(e.target===d)d.close()});
d.querySelector('[data-close]').addEventListener('click',()=>d.close());
d.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation()});
f.addEventListener('submit',e=>e.preventDefault());
document.querySelectorAll('[data-mail]').forEach(a=>a.addEventListener('click',e=>{if(typeof d.showModal!=='function')return;e.preventDefault();d.showModal();f.y.focus()}));
})();
