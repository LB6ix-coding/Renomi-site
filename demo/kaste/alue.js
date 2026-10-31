/* Kaste: "Tuletteko alueelleni?" postcode check in the hero + lead capture.
   Demo only: a lead is kept in this browser (localStorage) so the visitor can open
   liidit/ and see how the business owner would receive it. Nothing is sent anywhere.
   On a real client site the save() call is replaced by a POST to the client's lead backend. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const KEY = 'kaste-demo-liidit-v1';
  const AREA = ['Helsinki', 'Espoo', 'Vantaa', 'Kauniainen']; // "pääkaupunkiseutu", as the site states
  const store = {
    read() { try { return JSON.parse(localStorage.getItem(KEY)) || {own: [], edits: {}}; } catch (e) { return {own: [], edits: {}}; } },
    add(lead) { const s = store.read(); s.own = s.own || []; s.own.unshift(lead); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  };
  let pn = null, pnLoading = null;
  const loadPn = () => pnLoading || (pnLoading = fetch('data/postinumerot.json').then(r => r.json()).then(d => (pn = d)).catch(() => { pnLoading = null; return null; }));
  const kunta = code => pn && pn.p[code] !== undefined ? pn.k[pn.p[code]] : null;
  const ARR = ' <span class="arr" aria-hidden="true">→</span>';

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
      if (!panel.contains(document.activeElement)) { e.preventDefault(); a.focus(); }
      else if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });

  function result(msg, cls, action) {
    res.className = 'ap-res ' + (cls || '');
    res.innerHTML = msg + (action ? `<button type="button" class="btn ${cls === 'ok' ? 'btn-brass' : 'btn-line'} ap-go">${action}${ARR}</button>` : '');
    const go = $('.ap-go', res); if (go) go.addEventListener('click', toForm);
  }
  async function doCheck() {
    const v = inp.value.replace(/\D/g, '').slice(0, 5);
    if (v !== inp.value) inp.value = v;
    if (v.length < 5) { res.className = 'ap-res'; res.textContent = ''; return; }
    if (!pn) { result('Haetaan…', 'wait'); await loadPn(); if (!pn) { result('Postinumeroita ei saatu ladattua. Soittakaa 050 412 7730, niin kerromme suoraan.', 'no'); return; } }
    if (inp.value !== v) return; // typed on while loading
    const k = kunta(v);
    if (!k) { result(`Postinumeroa ${v} ei löytynyt. Tarkistakaa numero.`, 'no'); return; }
    cur = {code: v, kunta: k, inArea: AREA.includes(k)};
    if (cur.inArea) result(`<b>${v} · ${k}</b><span>Kuuluu toimialueeseemme. Kartoitus on maksuton.</span>`, 'ok', 'Varaa kartoitus');
    else result(`<b>${v} · ${k}</b><span>Tämä on toimialueemme ulkopuolella. Jättäkää silti yhteystiedot, niin kerromme, onnistuuko työ.</span>`, 'out', 'Jätä yhteystiedot');
  }
  inp.addEventListener('input', doCheck);
  inp.addEventListener('focus', loadPn, {once: true});
  check.addEventListener('submit', async e => { e.preventDefault(); if (inp.value.replace(/\D/g, '').length < 5) { result('Kirjoittakaa viisinumeroinen postinumero.', 'no'); inp.focus(); return; } await doCheck(); const go = $('.ap-go', res); if (go) go.focus(); });

  function toForm() {
    $('#ap-where').textContent = `${cur.code} · ${cur.kunta}`;
    $('#ap-h2').textContent = cur.inArea ? 'Varataan kartoitus.' : 'Katsotaan, onnistuuko työ.';
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
    if (bad.length) { err.hidden = false; err.textContent = 'Kirjoittakaa nimi ja puhelinnumero, niin voimme soittaa.'; bad[0].focus(); return; }
    const jobs = [...form.querySelectorAll('input[name=tyo]:checked')].map(x => x.value);
    const lead = {id: 'o' + Date.now().toString(36), t: Date.now(), name: nimi.value.trim(), phone: puh.value.trim(), email: '',
      pn: cur.code, kunta: cur.kunta, inArea: cur.inArea, jobs, msg: $('#ap-viesti').value.trim(), src: 'Alueen tarkistus', status: 'uusi', own: true};
    store.add(lead);
    $('#ap-h3').textContent = `Kiitos, ${lead.name.split(' ')[0]}!`;
    $('#ap-crm').href = 'liidit/index.html?uusi=' + lead.id;
    show(3); setTimeout(() => $('#ap-h3').focus({preventScroll: true}), 30);
    form.reset();
  });

  /* the main contact form at the bottom of the page feeds the same lead list
     (the price calculator has no button to the form, so nothing is carried over from it) */
  const main = $('#lomake'), fst = $('#lomake-tila');
  if (main && fst) main.addEventListener('submit', async () => {
    if (main.dataset.endpoint) return;
    const v = id => ($('#' + id)?.value || '').trim();
    if ($('#f-www')?.value) return;
    const code = v('f-pn').replace(/\D/g, '');
    if (code.length === 5) await loadPn();
    const k = code.length === 5 ? kunta(code) : null;
    const koko = v('f-koko').replace('.', ',');
    const job = [v('f-kohde'), koko ? `${koko} m²` : ''].filter(Boolean).join(', ');
    const lead = {id: 'o' + Date.now().toString(36), t: Date.now(), name: v('f-nimi'), phone: v('f-puh'), email: v('f-email'),
      pn: k ? code : '', kunta: k || '', inArea: k ? AREA.includes(k) : null, jobs: job ? [job] : [], msg: v('f-viesti'),
      src: main.dataset.src || 'Yhteydenottolomake', status: 'uusi', own: true};
    store.add(lead);
    fst.innerHTML = `Tämä on demosivu, joten viesti ei lähtenyt kenellekään. <a href="liidit/index.html?uusi=${lead.id}">Katsokaa, miten yrittäjä näkee sen</a>.`;
  });
})();
