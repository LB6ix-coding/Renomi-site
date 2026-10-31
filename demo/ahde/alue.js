/* Ahde: "Tuletteko alueelleni?" postcode check in the header + lead capture.
   Demo only: a lead is kept in this browser (localStorage) so the visitor can open
   liidit/ and see how the business owner would receive it. Nothing is sent anywhere.
   On a real client site the save() call is replaced by a POST to the client's lead backend. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const KEY = 'ahde-demo-liidit-v1';
  const AREA = ['Vantaa', 'Espoo'];
  const store = {
    read() { try { return JSON.parse(localStorage.getItem(KEY)) || {own: [], edits: {}}; } catch (e) { return {own: [], edits: {}}; } },
    add(lead) { const s = store.read(); s.own.unshift(lead); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  };
  let pn = null, pnLoading = null;
  const loadPn = () => pnLoading || (pnLoading = fetch('data/postinumerot.json').then(r => r.json()).then(d => (pn = d)).catch(() => null));
  const kunta = code => pn && pn.p[code] !== undefined ? pn.k[pn.p[code]] : null;

  const hdr = $('.hdr'), btn = $('.area-btn'), panel = $('#area-panel');
  if (!hdr || !btn || !panel) return;
  const inp = $('#ap-pn'), res = $('#ap-res'), form = $('#ap-form'), err = $('#ap-err');
  const steps = [...panel.querySelectorAll('.ap-step')];
  let cur = {code: '', kunta: '', inArea: false};

  const show = n => steps.forEach(s => { s.hidden = +s.dataset.step !== n; });
  const isOpen = () => !panel.hidden;
  function open() {
    loadPn();
    const mb = $('.menu-btn'); if (mb && mb.getAttribute('aria-expanded') === 'true') mb.click();
    panel.hidden = false; hdr.classList.add('area-open'); hdr.classList.remove('hide');
    btn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => panel.classList.add('in'));
    if (!panel.querySelector('.ap-step:not([hidden])')) show(1);
    const s1 = !steps[0].hidden; setTimeout(() => (s1 ? inp : panel.querySelector('.ap-step:not([hidden]) input, .ap-step:not([hidden]) h2[tabindex]'))?.focus({preventScroll: true}), 60);
  }
  function close(focusBtn) {
    panel.classList.remove('in'); btn.setAttribute('aria-expanded', 'false'); hdr.classList.remove('area-open');
    setTimeout(() => { if (panel.classList.contains('in')) return; panel.hidden = true; if (!steps[2].hidden) { show(1); inp.value = ''; res.className = 'ap-res'; res.textContent = ''; } }, 220);
    if (focusBtn) btn.focus();
  }
  btn.addEventListener('click', () => (isOpen() ? close() : open()));
  $('.ap-close', panel).addEventListener('click', () => close(true));
  addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) close(true); });
  addEventListener('pointerdown', e => { if (isOpen() && !hdr.contains(e.target)) close(); }, {passive: true});
  // the page script hides the header on scroll; keep it while the panel is open
  new MutationObserver(() => { if (isOpen() && hdr.classList.contains('hide')) hdr.classList.remove('hide'); }).observe(hdr, {attributes: true, attributeFilter: ['class']});

  function result(msg, cls, action) {
    res.className = 'ap-res ' + (cls || '');
    res.innerHTML = msg + (action ? `<button type="button" class="btn ${cls === 'ok' ? 'btn-moss' : 'btn-line'} ap-go">${action}<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>` : '');
    const go = $('.ap-go', res); if (go) go.addEventListener('click', toForm);
  }
  async function check() {
    const v = inp.value.replace(/\D/g, '').slice(0, 5);
    if (v !== inp.value) inp.value = v;
    if (v.length < 5) { res.className = 'ap-res'; res.textContent = ''; return; }
    if (!pn) { result('Haetaan…', 'wait'); await loadPn(); if (!pn) { result('Postinumeroita ei saatu ladattua. Soittakaa 050 418 2736, niin kerromme suoraan.', 'no'); return; } }
    const k = kunta(v);
    if (!k) { result(`Postinumeroa ${v} ei löytynyt. Tarkistakaa numero.`, 'no'); return; }
    cur = {code: v, kunta: k, inArea: AREA.includes(k)};
    if (cur.inArea) result(`<b>${v} · ${k}</b><span>Kuuluu toimialueeseemme. Arviokäynti on maksuton.</span>`, 'ok', 'Pyytäkää arviokäynti');
    else result(`<b>${v} · ${k}</b><span>Tämä on toimialueemme ulkopuolella. Jättäkää silti yhteystiedot, niin kerromme, onnistuuko työ.</span>`, 'out', 'Jättäkää yhteystiedot');
  }
  inp.addEventListener('input', check);
  inp.addEventListener('focus', loadPn, {once: true});
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const go = $('.ap-go', res); if (go) go.click(); } });

  function toForm() {
    $('#ap-where').textContent = `${cur.code} · ${cur.kunta}`;
    $('#ap-h2').textContent = cur.inArea ? 'Pyytäkää arviokäynti.' : 'Jättäkää yhteystiedot.';
    err.hidden = true; show(2); setTimeout(() => $('#ap-nimi').focus(), 30);
  }
  $('.ap-back', panel).addEventListener('click', () => { show(1); inp.focus(); });
  ['#ap-nimi', '#ap-puh'].forEach(s => $(s).addEventListener('input', e => { const el = e.target; if (el.value.trim() && el.checkValidity()) el.setAttribute('aria-invalid', 'false'); if (!form.querySelector('[aria-invalid="true"]')) err.hidden = true; }));

  form.addEventListener('submit', e => {
    e.preventDefault();
    if ($('#ap-www').value) return;
    const nimi = $('#ap-nimi'), puh = $('#ap-puh');
    const bad = [nimi, puh].filter(el => !el.value.trim() || !el.checkValidity());
    [nimi, puh].forEach(el => el.setAttribute('aria-invalid', bad.includes(el)));
    if (bad.length) { err.hidden = false; err.textContent = 'Kirjoittakaa nimi ja puhelinnumero, niin voimme soittaa.'; bad[0].focus(); return; }
    const jobs = [...form.querySelectorAll('input[name=tyo]:checked')].map(x => x.value);
    const lead = {id: 'o' + Date.now().toString(36), t: Date.now(), name: nimi.value.trim(), phone: puh.value.trim(), email: '',
      pn: cur.code, kunta: cur.kunta, inArea: cur.inArea, jobs, msg: $('#ap-viesti').value.trim(), src: 'Alueen tarkistus', status: 'uusi', own: true};
    store.add(lead);
    $('#ap-h3').textContent = `Kiitos, ${lead.name.split(' ')[0]}!`;
    $('#ap-crm').href = 'liidit/index.html?uusi=' + lead.id;
    show(3); $('#ap-h3').focus({preventScroll: true});
    form.reset();
  });

  /* the main contact form at the bottom of the page feeds the same lead list */
  const main = $('#lomake'), fst = $('#lomake-tila');
  /* "Lähettäkää suunnitelma arvioon": carry the garden plan into the contact form */
  const plCta = $('#pl-cta');
  if (plCta && main) plCta.addEventListener('click', () => setTimeout(() => {
    const items = [...document.querySelectorAll('#pl-list li')].map(li => { const s = li.querySelector('span:not(.bar)'), b = li.querySelector('b'); return s && b ? `${s.textContent} ${b.textContent}` : ''; }).filter(Boolean);
    if (!items.length) return;
    const tot = ($('#pl-total')?.textContent || '').trim();
    const ta = $('#f-viesti');
    if (ta && (!ta.value.trim() || ta.dataset.auto === '1')) { ta.value = `Pihasuunnittelijan luonnos: ${items.join(', ')}. Hinta-arvio ${tot}.`; ta.dataset.auto = '1'; }
    main.dataset.src = 'Pihasuunnittelija';
  }, 650)); // after the price counter has settled
  if (main && fst) main.addEventListener('submit', async () => {
    if (main.dataset.endpoint) return;
    const v = id => ($('#' + id)?.value || '').trim();
    if ($('#f-www')?.value) return;
    const code = v('f-pn').replace(/\D/g, '');
    if (code.length === 5) await loadPn();
    const k = code.length === 5 ? kunta(code) : null;
    const lead = {id: 'o' + Date.now().toString(36), t: Date.now(), name: v('f-nimi'), phone: v('f-puh'), email: v('f-email'),
      pn: k ? code : '', kunta: k || '', inArea: k ? AREA.includes(k) : null, jobs: v('f-tyo') ? [v('f-tyo')] : [], msg: v('f-viesti'),
      src: main.dataset.src || 'Yhteydenottolomake', status: 'uusi', own: true};
    store.add(lead);
    fst.innerHTML = `Tämä on demosivu, joten viesti ei lähtenyt kenellekään. <a href="liidit/index.html?uusi=${lead.id}">Katsokaa, miten yrittäjä näkee sen</a>.`;
  });
})();
