/* LVI Nurmi lead view (demo). Example leads are fictional; the visitor's own requests come from
   localStorage written by ../alue.js. Status, estimate and notes are saved in the same place. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const KEY = 'lvi-nurmi-demo-liidit-v1', NB = ' ', H = 3600e3;
  const ST = [['uusi', 'Uusi'], ['soitettu', 'Soitettu'], ['tarjous', 'Tarjous'], ['kauppa', 'Kauppa'], ['ei', 'Ei kauppaa']];
  const SN = Object.fromEntries(ST);
  /* travel cost as the site's price list states it: Vantaa 0 €, these seven 39 € */
  const TRAVEL = {Vantaa: 0, Helsinki: 39, Espoo: 39, Kerava: 39, Tuusula: 39, 'Järvenpää': 39, Sipoo: 39, 'Nurmijärvi': 39};
  const now = Date.now();
  // fictional example leads; times are relative to the moment the page opens
  const SEED = [
    {id: 's1', t: now - 2 * H, name: 'Mikko R.', phone: '040 000 0021', pn: '01600', kunta: 'Vantaa', inArea: true, jobs: ['Hanat'], msg: 'Keittiön hana tippuu ja vipu on jäykkä. Kerrostalo, hana noin 12 vuotta vanha.', src: 'Alueen tarkistus', status: 'uusi'},
    {id: 's2', t: now - 6 * H, name: 'Sari L.', phone: '040 000 0022', pn: '00550', kunta: 'Helsinki', inArea: true, jobs: ['Viemärit'], msg: 'Kylpyhuoneen lattiakaivo vetää hitaasti ja haisee.', src: 'Alueen tarkistus', status: 'uusi'},
    {id: 's3', t: now - 27 * H, name: 'Timo K.', phone: '040 000 0023', email: 'timo@example.com', pn: '04400', kunta: 'Järvenpää', inArea: true, jobs: [], msg: 'Lämminvesivaraaja 300 l vuodelta 2006 vuotaa alaliitoksesta. Omakotitalo.\nToivottu aika: Tällä viikolla, aamupäivä 7–12.', src: 'Yhteydenottolomake', status: 'soitettu', note: 'Käynti torstaina klo 8. Varaajan koko tarkistetaan paikan päällä.'},
    {id: 's4', t: now - 50 * H, name: 'Jenni A.', phone: '040 000 0024', pn: '04600', kunta: 'Mäntsälä', inArea: false, jobs: ['WC-istuimet'], msg: 'WC-istuimen vaihto rivitaloon, vanha istuin vuotaa juuresta.', src: 'Alueen tarkistus', status: 'ei', note: 'Toimialueen ulkopuolella, kerrottu puhelimessa.'},
    {id: 's5', t: now - 98 * H, name: 'Kari H.', phone: '040 000 0025', email: 'kari@example.com', pn: '02650', kunta: 'Espoo', inArea: true, jobs: ['Kylpyhuoneremontin LVI-työt'], msg: 'Kerrostalon kylpyhuoneremontti: uudet vesijohdot, lattiakaivo ja kalusteiden kytkennät. Laatoittaja on jo sovittu.', src: 'Alueen tarkistus', status: 'tarjous', est: 3400},
    {id: 's6', t: now - 146 * H, name: 'Paula M.', phone: '040 000 0026', pn: '01350', kunta: 'Vantaa', inArea: true, jobs: ['Kodinkoneet'], msg: 'Uusi astianpesukone, vanhassa kytkennässä ei ole sulkuventtiiliä.', src: 'Alueen tarkistus', status: 'kauppa', est: 149, note: 'Kytketty ja sulkuventtiili lisätty.'},
    {id: 's7', t: now - 220 * H, name: 'Olli V.', phone: '040 000 0027', pn: '04300', kunta: 'Tuusula', inArea: true, jobs: [], msg: 'Lämminvesivaraajan vaihto, 200 l, omakotitalo.\nToivottu aika: Ensi viikolla, kumpi tahansa.', src: 'Yhteydenottolomake', status: 'kauppa', est: 1890, note: 'Vaihto ensi tiistaina, laite tilattu.'}
  ];
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {own: [], edits: {}}; } catch (e) { return {own: [], edits: {}}; } };
  const write = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  let S = read(); S.own = S.own || []; S.edits = S.edits || {};
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const eur = n => n ? Math.round(n).toLocaleString('fi-FI').replace(/\s/g, NB) + NB + '€' : '0' + NB + '€';
  const pad = n => String(n).padStart(2, '0');
  const clock = d => `${d.getHours()}.${pad(d.getMinutes())}`;
  const when = t => { const d = new Date(t), diff = Date.now() - t, today = new Date(); today.setHours(0, 0, 0, 0);
    if (diff < 60e3) return 'juuri nyt'; if (diff < H) return `${Math.floor(diff / 60e3)}${NB}min sitten`;
    if (t >= today.getTime()) return `${Math.floor(diff / H)}${NB}t sitten`;
    if (t >= today.getTime() - 864e5) return `eilen klo ${clock(d)}`;
    return `${d.getDate()}.${d.getMonth() + 1}.`; };
  const stamp = t => { const d = new Date(t); return `${d.getDate()}.${d.getMonth() + 1}. klo ${clock(d)}`; };
  const all = () => [...S.own, ...SEED].map(l => ({...l, ...(S.edits[l.id] || {})})).sort((a, b) => b.t - a.t);
  const fresh = new URLSearchParams(location.search).get('uusi');
  const place = l => l.pn ? `${l.pn} ${l.kunta}` : (l.kunta || l.addr || '');
  const travel = l => !l.kunta ? '' : TRAVEL[l.kunta] === 0 ? `0${NB}€<small>Vantaa, ei matkakulua</small>`
    : TRAVEL[l.kunta] ? `39${NB}€<small>yli 30${NB}km:n päähän Tikkurilasta lisäksi 1,20${NB}€/km</small>` : 'Sovitaan erikseen<small>ei hinnastossa</small>';

  let filter = 'kaikki', q = '', sel = fresh || null;
  const list = $('#lista'), det = $('#detail'), fl = $('#filters'), toast = $('#toast');
  let tt = 0; const say = m => { toast.textContent = m; toast.hidden = false; clearTimeout(tt); tt = setTimeout(() => (toast.hidden = true), 2600); };

  function kpis(L) {
    const wk = Date.now() - 7 * 24 * H, known = L.filter(l => l.inArea !== null && l.inArea !== undefined);
    $('#k-new').textContent = L.filter(l => l.status === 'uusi').length;
    $('#k-week').textContent = L.filter(l => l.t >= wk).length;
    $('#k-area').textContent = (known.length ? Math.round(100 * known.filter(l => l.inArea).length / known.length) : 0) + NB + '%';
    $('#k-open').textContent = eur(L.filter(l => l.status === 'tarjous').reduce((a, l) => a + (+l.est || 0), 0));
    $('#k-won').textContent = 'kauppoja ' + eur(L.filter(l => l.status === 'kauppa').reduce((a, l) => a + (+l.est || 0), 0));
  }
  function filters(L) {
    const n = k => (k === 'kaikki' ? L.length : L.filter(l => l.status === k).length);
    fl.innerHTML = [['kaikki', 'Kaikki'], ...ST].map(([k, v]) => `<button type="button" role="tab" data-f="${k}" aria-selected="${k === filter}">${v}<i>${n(k)}</i></button>`).join('');
  }
  function row(l) {
    const sub = [place(l), l.jobs && l.jobs.join(', ')].filter(Boolean).join(' · ') || l.src;
    const b = [l.own ? '<span class="b own">Sinun pyyntösi</span>' : '', l.status === 'uusi' ? '<span class="b new">Uusi</span>' : '',
      l.inArea === false ? '<span class="b out">Alueen ulkopuolelta</span>' : '', `<span class="b">${esc(l.src)}</span>`].join('');
    return `<li><button type="button" class="lead${l.id === fresh ? ' fresh' : ''}" data-id="${esc(l.id)}" style="--s:var(--s-${SN[l.status] ? l.status : 'uusi'})" aria-current="${l.id === sel}">
      <span class="dot" aria-hidden="true"></span><span class="nm">${esc(l.name)}</span><span class="tm">${when(l.t)}</span>
      <span class="sub">${esc(sub)}</span><span class="badges">${b}</span><span class="sr-only">, tila ${SN[l.status] || ''}</span></button></li>`;
  }
  function render() {
    const L = all(); kpis(L); filters(L);
    const qq = q.trim().toLowerCase();
    const shown = L.filter(l => (filter === 'kaikki' || l.status === filter) && (!qq || [l.name, l.pn, l.kunta, l.addr, (l.jobs || []).join(' '), l.msg].join(' ').toLowerCase().includes(qq)));
    list.innerHTML = shown.map(row).join('') || '<li class="empty">Ei liidejä tällä rajauksella.</li>';
    if (!sel || !L.find(l => l.id === sel)) sel = (shown[0] || L[0] || {}).id;
    detail(L.find(l => l.id === sel));
  }
  const ICON = {
    tel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h3l2 5-2.5 1.6a11 11 0 0 0 6.9 6.9L16 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
    sms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.8 7l8.2 6 8.2-6"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21.5s-7-6.1-7-11.7A7 7 0 0 1 19 9.8c0 5.6-7 11.7-7 11.7z"/><circle cx="12" cy="9.8" r="2.5"/></svg>'};
  function detail(l) {
    if (!l) { det.innerHTML = '<p class="d-empty">Valitse liidi listasta.</p>'; return; }
    const tel = String(l.phone || '').replace(/[^\d+]/g, '');
    const where = place(l), mapQ = l.addr || (l.pn ? `${l.pn} ${l.kunta}` : l.kunta);
    const log = [`<li><time>${stamp(l.t)}</time>Saapui sivujen kautta: ${esc(l.src)}</li>`, ...(l.log || []).map(x => `<li><time>${stamp(x[0])}</time>${esc(x[1])}</li>`)];
    const tr = travel(l);
    det.innerHTML = `
      <div class="d-head"><div><h2 id="d-h" tabindex="-1">${esc(l.name)}</h2>
        <p class="d-where">${where ? esc(where) : 'Postinumero puuttuu'} ${l.inArea === false ? '<span class="b out">Alueen ulkopuolelta</span>' : l.inArea ? '<span class="b">Toimialueella</span>' : ''} ${l.own ? '<span class="b own">Sinun pyyntösi</span>' : ''}</p></div>
        <button type="button" class="d-close" aria-label="Takaisin listaan"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      <div class="status" role="group" aria-label="Tila">${ST.map(([k, v]) => `<button type="button" data-s="${k}" style="--s:var(--s-${k})" aria-pressed="${l.status === k}">${v}</button>`).join('')}</div>
      <div class="actions">
        <a class="act main" data-act="tel" href="tel:${esc(tel)}">${ICON.tel}Soita ${esc(l.phone)}</a>
        <a class="act" data-act="sms" href="sms:${esc(tel)}">${ICON.sms}Tekstiviesti</a>
        ${l.email ? `<a class="act" data-act="mail" href="mailto:${esc(l.email)}">${ICON.mail}Sähköposti</a>` : ''}
        ${mapQ ? `<a class="act" data-act="map" href="https://www.google.com/maps/search/${encodeURIComponent(mapQ)}" target="_blank" rel="noopener">${ICON.map}Kartalla</a>` : ''}
      </div>
      <dl class="facts">
        <div><dt>Työ</dt><dd>${esc((l.jobs || []).join(', ') || (l.src === 'Yhteydenottolomake' ? 'Kuvattu viestissä' : 'Ei valittu'))}</dd></div>
        <div><dt>Saapui</dt><dd>${stamp(l.t)}</dd></div>
        ${l.addr ? `<div class="wide"><dt>Osoite</dt><dd>${esc(l.addr)}</dd></div>` : ''}
        ${tr ? `<div><dt>Matkakulu</dt><dd>${tr}</dd></div>` : ''}
        <div class="wide"><dt>Viesti</dt><dd class="msg">${esc(l.msg) || 'Ei viestiä.'}</dd></div>
      </dl>
      <div class="d-row">
        <div><label for="d-est">Arvio</label><div class="eur"><input id="d-est" inputmode="numeric" value="${l.est ? Math.round(l.est) : ''}" placeholder="0"></div></div>
        <div><label for="d-note">Muistiinpanot <span class="saved" id="d-saved">Tallennettu</span></label><textarea id="d-note" placeholder="Esim. käynti torstaina klo 8">${esc(l.note || '')}</textarea></div>
      </div>
      <ol class="log" aria-label="Tapahtumat">${log.join('')}</ol>`;
  }
  function edit(id, patch, logText) {
    const e = S.edits[id] = {...(S.edits[id] || {}), ...patch};
    if (logText) e.log = [...(e.log || []), [Date.now(), logText]];
    write(S);
  }

  fl.addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; filter = b.dataset.f; render(); });
  $('#q').addEventListener('input', e => { q = e.target.value; render(); });
  const mobile = matchMedia('(max-width:1000px)');
  list.addEventListener('click', e => { const b = e.target.closest('.lead'); if (!b) return; sel = b.dataset.id; render();
    if (mobile.matches) { det.classList.add('open'); document.body.classList.add('sheet'); setTimeout(() => $('#d-h')?.focus({preventScroll: true}), 320); }
    else $('#d-h')?.focus({preventScroll: true}); });
  det.addEventListener('click', e => {
    if (e.target.closest('.d-close')) { det.classList.remove('open'); document.body.classList.remove('sheet'); list.querySelector(`[data-id="${CSS.escape(sel)}"]`)?.focus(); return; }
    const s = e.target.closest('[data-s]');
    if (s) { const l = all().find(x => x.id === sel); if (l && l.status !== s.dataset.s) { edit(sel, {status: s.dataset.s}, `Tila: ${SN[l.status]} → ${SN[s.dataset.s]}`); render(); } return; }
    const a = e.target.closest('[data-act]');
    if (a && a.dataset.act !== 'map' && sel && sel[0] === 's') { e.preventDefault(); say('Esimerkkiliidi: numero ja sähköposti ovat keksittyjä.'); }
  });
  let nt = 0;
  det.addEventListener('input', e => {
    if (e.target.id === 'd-note') { clearTimeout(nt); nt = setTimeout(() => { edit(sel, {note: e.target.value}); const s = $('#d-saved'); s.classList.add('on'); setTimeout(() => s.classList.remove('on'), 1200); }, 400); }
    if (e.target.id === 'd-est') { const v = e.target.value.replace(/\D/g, ''); e.target.value = v; edit(sel, {est: v ? +v : null}); kpis(all()); }
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && det.classList.contains('open')) det.querySelector('.d-close').click(); });
  $('#reset').addEventListener('click', () => { S = {own: [], edits: {}}; write(S); sel = null; render(); say('Omat pyynnöt ja muutokset poistettu tästä selaimesta.'); });
  render();
  if (fresh && mobile.matches && all().find(l => l.id === fresh)) { det.classList.add('open'); document.body.classList.add('sheet'); }
})();
