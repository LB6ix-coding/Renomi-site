/* Routa: "Tuletko alueelleni?" postcode check in the hero + lead capture.
   Demo only: a lead is kept in this browser (localStorage) so the visitor can open
   liidit/ and see how the business owner would receive it. Nothing is sent anywhere.
   On a real client site the save() call is replaced by a POST to the client's lead backend. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const KEY = 'routa-demo-liidit-v1';
  const AREA = ['Tuusula', 'Kerava', 'Järvenpää', 'Vantaa', 'Nurmijärvi']; // = JSON-LD areaServed and "Toimialue" in the contact box
  const store = {
    read() { try { return JSON.parse(localStorage.getItem(KEY)) || {own: [], edits: {}}; } catch (e) { return {own: [], edits: {}}; } },
    add(lead) { const s = store.read(); s.own = s.own || []; s.own.unshift(lead); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  };
  let pn = null, pnLoading = null;
  const loadPn = () => pnLoading || (pnLoading = fetch('data/postinumerot.json').then(r => r.json()).then(d => (pn = d)).catch(() => { pnLoading = null; return null; }));
  const kunta = code => pn && pn.p[code] !== undefined ? pn.k[pn.p[code]] : null;
  const ARROW = ' <b aria-hidden="true">→</b>';

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
      if (done) { inp.value = ''; res.className = 'ap-res'; res.textContent = ''; } }, 220);
    (lastFocus && document.contains(lastFocus) ? lastFocus : inp).focus({preventScroll: true});
  }
  $('.ap-close', panel).addEventListener('click', close);
  scrim.addEventListener('click', close);
  addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { // keep focus inside the dialog
      const f = [...panel.querySelectorAll('button, input, textarea, a[href]')].filter(x => !x.closest('[hidden]') && !x.closest('.hp'));
      if (!f.length) return; const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });

  /* the hero chapter is anchored to the bottom and grows upwards; while an answer is shown the lead
     paragraph steps aside so the headline never slides under the fixed header */
  const chap = check.closest('.chap');
  const mark = on => chap && chap.classList.toggle('ah-open', on);
  new MutationObserver(() => mark(!!res.textContent.trim())).observe(res, {childList: true, characterData: true, subtree: true});
  function result(msg, cls, action) {
    res.className = 'ap-res ' + (cls || '');
    res.innerHTML = msg + (action ? `<button type="button" class="btn ${cls === 'ok' ? 'btn-y' : 'btn-o'} ap-go">${action}${ARROW}</button>` : '');
    const go = $('.ap-go', res); if (go) go.addEventListener('click', toForm);
  }
  async function doCheck() {
    const v = inp.value.replace(/\D/g, '').slice(0, 5);
    if (v !== inp.value) inp.value = v;
    if (v.length < 5) { res.className = 'ap-res'; res.textContent = ''; return; }
    if (!pn) { result('Haetaan…', 'wait'); await loadPn(); if (!pn) { result('Postinumeroita ei saatu ladattua. Soita 045 000 0000, niin kerromme suoraan.', 'no'); return; } }
    if (inp.value !== v) return; // the visitor kept typing while the list loaded
    const k = kunta(v);
    if (!k) { result(`Postinumeroa ${v} ei löytynyt. Tarkista numero.`, 'no'); return; }
    cur = {code: v, kunta: k, inArea: AREA.includes(k)};
    if (cur.inArea) result(`<b>${v} · ${k}</b><span>Kuuluu toimialueeseemme. Kerro, mikä huolettaa, niin sovitaan katselmus.</span>`, 'ok', 'Pyydä katselmus');
    else result(`<b>${v} · ${k}</b><span>Tämä on toimialueemme ulkopuolella. Jätä silti yhteystiedot, niin kerromme, onnistuuko työ.</span>`, 'out', 'Jätä yhteystiedot');
  }
  inp.addEventListener('input', doCheck);
  inp.addEventListener('focus', loadPn, {once: true});
  check.addEventListener('submit', async e => { e.preventDefault(); if (inp.value.replace(/\D/g, '').length < 5) { result('Kirjoita viisinumeroinen postinumero.', 'no'); inp.focus(); return; } await doCheck(); const go = $('.ap-go', res); if (go) go.focus(); });

  function toForm() {
    $('#ap-where').textContent = `${cur.code} · ${cur.kunta}`;
    $('#ap-h2').textContent = cur.inArea ? 'Pyydä katselmus.' : 'Jätä yhteystiedot.';
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

  /* the contact form at the bottom feeds the same lead list.
     site.js validates, shows its own message and resets the form in its submit handler,
     so the values are read here first (capture phase on document runs before it). */
  const main = $('#f'), ok = $('#ok');
  if (!main || !ok) return;
  /* the drainage calculator and the dig-down layer already copy their result into the form (site.js); remember which tool it came from */
  const tool = (sel, name) => { const a = $(sel); if (a) a.addEventListener('click', () => { main.dataset.src = name; }); };
  tool('#calcGo', 'Salaojalaskuri');
  tool('#lBook', 'Kaiva esiin');
  document.addEventListener('submit', async e => {
    if (e.target !== main || main.dataset.endpoint) return;
    const v = n => (main.elements[n]?.value || '').trim();
    if (v('www') || !v('nimi') || !v('puh')) return; // site.js shows the error
    const addr = v('osoite'), m = addr.match(/\b(\d{5})\b/), code = m ? m[1] : '';
    const lead = {id: 'o' + Date.now().toString(36), t: Date.now(), name: v('nimi'), phone: v('puh'), email: '',
      pn: '', kunta: '', addr, inArea: null, jobs: v('tyo') ? [v('tyo')] : [], msg: v('viesti'),
      src: main.dataset.src || 'Yhteydenottolomake', status: 'uusi', own: true};
    delete main.dataset.src;
    const msg = () => { ok.hidden = false; ok.innerHTML = `Kiitos! Tämä on demosivu, joten pyyntöä ei lähetetty kenellekään. <a href="liidit/index.html?uusi=${lead.id}">Katso, miten yrittäjä näkee sen</a>.`; };
    if (code) { await loadPn(); const k = kunta(code); if (k) { lead.pn = code; lead.kunta = k; lead.inArea = AREA.includes(k); } }
    store.add(lead);
    setTimeout(msg, 0); // after site.js has written its own text
  }, true);
})();
