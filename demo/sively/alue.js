/* Sively Maalaus: "Tuletko alueelleni?" postcode check in the hero + lead capture.
   Demo only: a lead is kept in this browser (localStorage) so the visitor can open
   liidit/ and see how the business owner would receive it. Nothing is sent anywhere.
   On a real client site the save() call is replaced by a POST to the client's lead backend. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const KEY = 'sively-demo-liidit-v1';
  const AREA = ['Espoo', 'Helsinki', 'Vantaa', 'Kauniainen']; // areaServed on this site
  const store = {
    read() { try { return JSON.parse(localStorage.getItem(KEY)) || {own: [], edits: {}}; } catch (e) { return {own: [], edits: {}}; } },
    add(lead) { const s = store.read(); s.own = s.own || []; s.own.unshift(lead); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  };
  let pn = null, pnLoading = null;
  const loadPn = () => pnLoading || (pnLoading = fetch('data/postinumerot.json').then(r => r.json()).then(d => (pn = d)).catch(() => { pnLoading = null; return null; }));
  const kunta = code => pn && pn.p[code] !== undefined ? pn.k[pn.p[code]] : null;

  const panel = $('#area-panel'), scrim = $('#ap-scrim'), check = $('#area-check');
  if (!panel || !check) return;
  const inp = $('#ap-pn'), res = $('#ap-res'), form = $('#ap-form'), err = $('#ap-err');
  const steps = [...panel.querySelectorAll('.ap-step')];
  let cur = {code: '', kunta: '', inArea: false}, lastFocus = null;

  const show = n => steps.forEach(s => { s.hidden = +s.dataset.step !== n; });
  const isOpen = () => !panel.hidden;
  function open(step) {
    lastFocus = document.activeElement;
    show(step); scrim.hidden = false; panel.hidden = false; document.documentElement.classList.add('ap-lock');
    requestAnimationFrame(() => { panel.classList.add('in'); scrim.classList.add('in'); });
    setTimeout(() => (step === 2 ? $('#ap-nimi') : $('#ap-h3'))?.focus({preventScroll: true}), 80);
  }
  function close() {
    panel.classList.remove('in'); scrim.classList.remove('in'); document.documentElement.classList.remove('ap-lock');
    const done = !steps[1].hidden;
    setTimeout(() => { if (panel.classList.contains('in')) return; panel.hidden = true; scrim.hidden = true;
      if (done) { inp.value = ''; res.className = 'ap-res'; res.textContent = ''; } }, 260);
    (lastFocus && document.contains(lastFocus) ? lastFocus : inp).focus({preventScroll: true});
  }
  $('.ap-close', panel).addEventListener('click', close);
  scrim.addEventListener('click', close);
  addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { // keep focus inside the dialog
      const f = [...panel.querySelectorAll('button, input, textarea, a[href]')].filter(x => !x.closest('[hidden]') && !x.closest('.pot'));
      if (!f.length) return; const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });

  function result(msg, cls, action) {
    res.className = 'ap-res ' + (cls || '');
    res.innerHTML = msg + (action ? `<button type="button" class="b ${cls === 'ok' ? 'b-terra' : 'b-line'} ap-go">${action} <i aria-hidden="true">→</i></button>` : '');
    const go = $('.ap-go', res); if (go) go.addEventListener('click', toForm);
    reveal();
  }
  /* the answer can land below the fold (tall hero, or the phone keyboard): scroll just enough to show it */
  function reveal() {
    requestAnimationFrame(() => {
      const r = res.getBoundingClientRect(), vv = window.visualViewport, vh = vv ? vv.height : innerHeight, pad = innerWidth <= 760 ? 96 : 24;
      if (r.height && r.bottom > vh - pad) scrollBy({top: Math.min(r.bottom - vh + pad, r.top - 90), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    });
  }
  async function doCheck() {
    const v = inp.value.replace(/\D/g, '').slice(0, 5);
    if (v !== inp.value) inp.value = v;
    if (v.length < 5) { res.className = 'ap-res'; res.textContent = ''; return; }
    if (!pn) { result('Haetaan…', 'wait'); await loadPn(); if (!pn) { result('Postinumeroita ei saatu ladattua. Soita 044 000 0000, niin kerromme suoraan.', 'no'); return; } }
    const k = kunta(v);
    if (!k) { result(`Postinumeroa ${v} ei löytynyt. Tarkista numero.`, 'no'); return; }
    cur = {code: v, kunta: k, inArea: AREA.includes(k)};
    if (cur.inArea) result(`<b>${v} · ${k}</b><span>Kuuluu toimialueeseemme. Sovitaan arviokäynti, niin saat kiinteän tarjouksen.</span>`, 'ok', 'Pyydä arviokäynti');
    else result(`<b>${v} · ${k}</b><span>Tämä on toimialueemme ulkopuolella. Jätä silti yhteystietosi, niin kerromme, onnistuuko työ.</span>`, 'out', 'Jätä yhteystiedot');
  }
  inp.addEventListener('input', doCheck);
  inp.addEventListener('focus', loadPn, {once: true});
  check.addEventListener('submit', async e => { e.preventDefault(); if (inp.value.replace(/\D/g, '').length < 5) { result('Kirjoita viisinumeroinen postinumero.', 'no'); inp.focus(); return; } await doCheck(); const go = $('.ap-go', res); if (go) go.focus(); });

  function toForm() {
    $('#ap-where').textContent = `${cur.code} · ${cur.kunta}`;
    $('#ap-h2').textContent = cur.inArea ? 'Pyydä arviokäynti.' : 'Jätä yhteystiedot.';
    err.hidden = true; open(2);
  }
  $('.ap-back', panel).addEventListener('click', () => { lastFocus = inp; close(); setTimeout(() => inp.select(), 50); });
  ['#ap-nimi', '#ap-puh'].forEach(s => $(s).addEventListener('input', e => { const el = e.target; if (el.value.trim() && el.checkValidity()) el.setAttribute('aria-invalid', 'false'); if (!form.querySelector('[aria-invalid="true"]')) err.hidden = true; }));

  form.addEventListener('submit', e => {
    e.preventDefault();
    if ($('#ap-www').value) return;
    const nimi = $('#ap-nimi'), puh = $('#ap-puh');
    const bad = [nimi, puh].filter(el => !el.value.trim() || !el.checkValidity());
    [nimi, puh].forEach(el => el.setAttribute('aria-invalid', bad.includes(el)));
    if (bad.length) { err.hidden = false; err.textContent = 'Kirjoita nimi ja puhelinnumero, niin voimme soittaa.'; bad[0].focus(); return; }
    const jobs = [...form.querySelectorAll('input[name=tyo]:checked')].map(x => x.value);
    const lead = {id: 'o' + Date.now().toString(36), t: Date.now(), name: nimi.value.trim(), phone: puh.value.trim(), email: '',
      pn: cur.code, kunta: cur.kunta, inArea: cur.inArea, jobs, msg: $('#ap-viesti').value.trim(), src: 'Alueen tarkistus', status: 'uusi', own: true};
    store.add(lead);
    $('#ap-h3').textContent = `Kiitos, ${lead.name.split(' ')[0]}!`;
    $('#ap-crm').href = 'liidit/index.html?uusi=' + lead.id;
    show(3); setTimeout(() => $('#ap-h3').focus({preventScroll: true}), 30);
    form.reset();
  });

  /* the contact form at the bottom of the page feeds the same lead list.
     site.js validates it and then resets it, so the values are read in the capture phase, before that. */
  const main = $('#fm'), fst = $('#done');
  /* the colour tool and the price estimate both prefill the form (site.js); remember which one was used */
  [['#useTone', 'Sävykokeilu'], ['#estGo', 'Hinta-arvio']].forEach(([s, name]) => $(s)?.addEventListener('click', () => { if (main) main.dataset.src = name; }));
  if (main && fst) document.addEventListener('submit', e => {
    if (e.target !== main || main.dataset.endpoint) return;
    const v = n => (main.elements[n]?.value || '').trim();
    if (v('www') || !v('nimi') || !v('puh')) return; // site.js shows its own message
    const code = v('pnro').replace(/\D/g, '');
    const lead = {id: 'o' + Date.now().toString(36), t: Date.now(), name: v('nimi'), phone: v('puh'), email: '',
      pn: '', kunta: '', inArea: null, jobs: v('kohde') ? [v('kohde')] : [], msg: v('viesti'),
      src: main.dataset.src || 'Yhteydenottolomake', status: 'uusi', own: true};
    delete main.dataset.src;
    (code.length === 5 ? loadPn() : Promise.resolve()).then(() => {
      const k = code.length === 5 ? kunta(code) : null;
      if (k) Object.assign(lead, {pn: code, kunta: k, inArea: AREA.includes(k)});
      store.add(lead);
      setTimeout(() => { // after site.js has written its own thank-you text
        fst.hidden = false;
        fst.innerHTML = `Kiitos! Tämä on demosivu, joten pyyntöä ei lähetetty kenellekään. <a href="liidit/index.html?uusi=${lead.id}">Katso, miten yrittäjä näkee sen</a>.`;
      }, 0);
    });
  }, true);
})();
