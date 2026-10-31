/* Sävy Sähkö: "Tuletteko alueelleni?" postcode check in the hero + lead capture.
   Demo only: a lead is kept in this browser (localStorage) so the visitor can open
   liidit/ and see how the business owner would receive it. Nothing is sent anywhere.
   On a real client site the save() call is replaced by a POST to the client's lead backend. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const KEY = 'savy-demo-liidit-v1', NB = ' ';
  // the site states "Vantaa ja pääkaupunkiseutu": the four capital-region municipalities
  const AREA = ['Vantaa', 'Helsinki', 'Espoo', 'Kauniainen'];
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
      if (done) { inp.value = ''; res.className = 'ap-res'; res.textContent = ''; } }, 240);
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

  function result(msg, cls, action) {
    res.className = 'ap-res ' + (cls || '');
    res.innerHTML = msg + (action ? `<button type="button" class="btn ${cls === 'ok' ? 'btn-volt' : 'btn-line'} ap-go">${action}<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>` : '');
    const go = $('.ap-go', res); if (go) go.addEventListener('click', toForm);
  }
  async function doCheck() {
    const v = inp.value.replace(/\D/g, '').slice(0, 5);
    if (v !== inp.value) inp.value = v;
    if (v.length < 5) { res.className = 'ap-res'; res.textContent = ''; return; }
    if (!pn) { result('Haetaan…', 'wait'); await loadPn(); if (!pn) { result('Postinumeroita ei saatu ladattua. Soita 050 314 2270, niin kerromme suoraan.', 'no'); return; } }
    const k = kunta(v);
    if (!k) { result(`Postinumeroa ${v} ei löytynyt. Tarkista numero.`, 'no'); return; }
    cur = {code: v, kunta: k, inArea: AREA.includes(k)};
    if (cur.inArea) result(`<b>${v} · ${k}</b><span>Kuuluu toimialueeseemme. Hinta sovitaan aina ennen kuin työ alkaa.</span>`, 'ok', 'Pyydä tarjous');
    else result(`<b>${v} · ${k}</b><span>Tämä on toimialueemme ulkopuolella. Jätä silti yhteystietosi, niin kerromme, onnistuuko työ.</span>`, 'out', 'Jätä yhteystiedot');
  }
  inp.addEventListener('input', doCheck);
  inp.addEventListener('focus', loadPn, {once: true});
  check.addEventListener('submit', async e => { e.preventDefault(); if (inp.value.replace(/\D/g, '').length < 5) { result('Kirjoita viisinumeroinen postinumero.', 'no'); inp.focus(); return; } await doCheck(); const go = $('.ap-go', res); if (go) go.focus(); });

  function toForm() {
    $('#ap-where').textContent = `${cur.code} · ${cur.kunta}`;
    $('#ap-h2').textContent = cur.inArea ? 'Pyydä tarjous.' : 'Jätä yhteystiedot.';
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

  /* the main contact form at the bottom of the page feeds the same lead list */
  const main = $('#lomake'), fst = $('#lomake-tila');
  /* "Pyydä tarjous latausasemasta" under the charging calculator: carry the estimate into the contact form */
  const calcCta = $('#lataus a[href="#yhteys"]');
  if (calcCta && main) calcCta.addEventListener('click', () => setTimeout(() => {
    const t = id => ($('#' + id)?.textContent || '').trim().replace(/\s+(€|%)/g, NB + '$1');
    const val = id => ($('#' + id)?.value || '');
    const kw = ($('#chargeForm [name=kw]:checked')?.value || '').replace('.', ','), car = ($('#chargeForm [name=car]:checked')?.value || '').replace('.', ',');
    const ta = $('#f-viesti');
    if (ta && (!ta.value.trim() || ta.dataset.auto === '1')) {
      ta.value = `Latauslaskurin arvio: akku ${val('cap')} kWh, varaus ${val('soc0')}${NB}% → ${val('soc1')}${NB}%, latausasema ${kw} kW, auton AC-teho ${car} kW. Latausaika ${t('rTime')}, hinta ${t('rCost')}.`;
      ta.dataset.auto = '1';
    }
    const tyo = $('#f-tyo'); if (tyo && !tyo.value) tyo.value = 'Latausasema';
    main.dataset.src = 'Latauslaskuri';
  }, 650)); // after the result counters have settled
  if (main && fst) main.addEventListener('submit', async () => {
    if (main.dataset.endpoint) return;
    const v = id => ($('#' + id)?.value || '').trim();
    if ($('#f-www')?.value) return;
    let code = v('f-pn').replace(/\D/g, '');
    if (code.length !== 5) { const m = v('f-viesti').match(/\b(\d{5})\b/); code = m ? m[1] : ''; }
    if (code) await loadPn();
    const k = code ? kunta(code) : null;
    const lead = {id: 'o' + Date.now().toString(36), t: Date.now(), name: v('f-nimi'), phone: v('f-puh'), email: v('f-email'),
      pn: k ? code : '', kunta: k || '', inArea: k ? AREA.includes(k) : null, jobs: v('f-tyo') ? [v('f-tyo')] : [], msg: v('f-viesti'),
      src: main.dataset.src || 'Yhteydenottolomake', status: 'uusi', own: true};
    store.add(lead);
    fst.innerHTML = `Tämä on demosivu, joten viesti ei lähtenyt kenellekään. <a href="liidit/index.html?uusi=${lead.id}">Katso, miten yrittäjä näkee sen</a>.`;
  });
})();
