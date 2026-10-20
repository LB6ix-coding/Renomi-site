// Header e-mail popover: opens the visitor's mail app with a prefilled message. No data is sent anywhere else.
(function(){
const A='info@marktic.fi';
const d=document.createElement('dialog');d.className='maild';d.setAttribute('aria-labelledby','maild-t');
d.innerHTML=`<form method="dialog" class="maild-f">
  <button type="submit" class="maild-x" aria-label="Sulje" value="close">✕</button>
  <h2 id="maild-t">Lähettäkää viesti</h2>
  <p>Täyttäkää nimi ja paikkakunta, niin avaamme valmiin viestin sähköpostiohjelmaanne. Vastaamme kahden arkipäivän kuluessa.</p>
  <label>Yrityksen nimi<input name="y" autocomplete="organization" required></label>
  <label>Paikkakunta<input name="p" autocomplete="address-level2" required></label>
  <label><span>Viesti <small>(valinnainen)</small></span><textarea name="m" rows="3"></textarea></label>
  <div class="maild-b"><button type="button" class="btn btn-brand" data-send>Avaa sähköposti</button><button type="button" class="btn btn-ghost" data-copy>Kopioi osoite</button></div>
  <p class="maild-a">Tai kirjoittakaa suoraan: <a href="mailto:${A}">${A}</a></p>
</form>`;
document.body.appendChild(d);
const f=d.querySelector('form');
function build(){const y=f.y.value.trim(),p=f.p.value.trim(),m=f.m.value.trim();
  const s='Maksuton kartoitus: '+(y||'[yritys]')+', '+(p||'[paikkakunta]');
  const b='Hei,\n\nhaluaisin maksuttoman kartoituksen.\n\nYritys: '+y+'\nPaikkakunta: '+p+(m?'\n\n'+m:'')+'\n';
  return 'mailto:'+A+'?subject='+encodeURIComponent(s)+'&body='+encodeURIComponent(b);}
d.querySelector('[data-send]').addEventListener('click',()=>{if(!f.reportValidity())return;location.href=build();});
d.querySelector('[data-copy]').addEventListener('click',async e=>{try{await navigator.clipboard.writeText(A);e.target.textContent='Kopioitu';setTimeout(()=>e.target.textContent='Kopioi osoite',1500)}catch(_){location.href='mailto:'+A}});
d.addEventListener('click',e=>{if(e.target===d)d.close()});
document.querySelectorAll('[data-mail]').forEach(a=>a.addEventListener('click',e=>{if(typeof d.showModal!=='function')return;e.preventDefault();d.showModal();f.y.focus()}));
})();
