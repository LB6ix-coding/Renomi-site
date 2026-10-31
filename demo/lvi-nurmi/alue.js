/* LVI Nurmi: "Tuletko alueelleni?" postcode check in the hero (index) + lead capture (index dialog and the
   booking form on yhteys.html). Demo only: a lead is kept in this browser (localStorage) so the visitor can open
   liidit/ and see how the business owner would receive it. Nothing is sent anywhere by this script.
   On a real client site the store.add() call is replaced by a POST to the client's lead backend. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const KEY = 'lvi-nurmi-demo-liidit-v1', NB = ' ';
  /* service area exactly as the site states it: Vantaa 0 €, the seven listed municipalities 39 €
     (JSON-LD areaServed, #alue, FAQ, footer). Kauniainen is added only because the site says
     "koko pääkaupunkiseudulle"; it has no travel cost on the price list, so none is quoted for it. */
  const TRAVEL = {Vantaa: 0, Helsinki: 39, Espoo: 39, Kerava: 39, Tuusula: 39, 'Järvenpää': 39, Sipoo: 39, 'Nurmijärvi': 39};
  const AREA = [...Object.keys(TRAVEL), 'Kauniainen'];
  const store = {
    read() { try { return JSON.parse(localStorage.getItem(KEY)) || {own: [], edits: {}}; } catch (e) { return {own: [], edits: {}}; } },
    add(lead) { const s = store.read(); s.own = s.own || []; s.own.unshift(lead); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  };
  let pn = null, pnLoading = null;
  const loadPn = () => pnLoading || (pnLoading = fetch('data/postinumerot.json').then(r => r.json()).then(d => (pn = d)).catch(() => { pnLoading = null; return null; }));
  const kunta = code => pn && pn.p[code] !== undefined ? pn.k[pn.p[code]] : null;
  const newId = () => 'o' + Date.now().toString(36);

  /* ---------- hero check + dialog (index only) ---------- */
  const panel = $('#area-panel'), scrim = $('#ap-scrim'), check = $('#area-check');
  if (panel && scrim && check) {
    const inp = $('#ap-pn'), res = $('#ap-res'), form = $('#ap-form'), err = $('#ap-err');
    const steps = [...panel.querySelectorAll('.ap-step')];
    let cur = {code: '', kunta: '', inArea: false}, lastFocus = null;

    const show = n => steps.forEach(s => { s.hidden = +s.dataset.step !== n; });
    const isOpen = () => !panel.hidden;
    const open = step => {
      lastFocus = document.activeElement;
      show(step); scrim.hidden = false; panel.hidden = false; document.documentElement.classList.add('ap-lock');
      requestAnimationFrame(() => { panel.classList.add('in'); scrim.classList.add('in'); });
      setTimeout(() => (step === 2 ? $('#ap-nimi') : $('#ap-h3'))?.focus({preventScroll: true}), 80);
    };
    const close = () => {
      panel.classList.remove('in'); scrim.classList.remove('in'); document.documentElement.classList.remove('ap-lock');
      const done = !steps[1].hidden;
      setTimeout(() => { if (panel.classList.contains('in')) return; panel.hidden = true; scrim.hidden = true;
        if (done) { inp.value = ''; res.className = 'ap-res'; res.textContent = ''; } }, 220);
      (lastFocus && document.contains(lastFocus) ? lastFocus : inp).focus({preventScroll: true});
    };
    $('.ap-close', panel).addEventListener('click', close);
    scrim.addEventListener('click', close);
    addEventListener('keydown', e => {
      if (!isOpen()) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { // keep focus inside the dialog
        const f = [...panel.querySelectorAll('button, input, textarea, a[href]')].filter(x => !x.closest('[hidden]') && !x.closest('.hp'));
        if (!f.length) return; const a = f[0], z = f[f.length - 1];
        if (!panel.contains(document.activeElement)) { e.preventDefault(); (e.shiftKey ? z : a).focus(); }
        else if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });

    const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    const result = (msg, cls, action) => { // msg is built only from digits and names from the data file
      res.className = 'ap-res ' + (cls || '');
      res.innerHTML = msg + (action ? `<button type="button" class="btn ${cls === 'ok' ? 'btn-w' : 'btn-ghost'} ap-go">${action}${ARROW}</button>` : '');
      const go = $('.ap-go', res); if (go) go.addEventListener('click', toForm);
    };
    const travelText = k => k === 'Vantaa' ? `Vantaalla ei ole matkakulua.`
      : TRAVEL[k] ? `Matkakulu ${TRAVEL[k]}${NB}€, ja yli 30${NB}km:n päähän Tikkurilasta lisäksi 1,20${NB}€/km.`
      : 'Kerromme matkakulun puhelimessa.';
    async function doCheck() {
      const v = inp.value.replace(/\D/g, '').slice(0, 5);
      if (v !== inp.value) inp.value = v;
      if (v.length < 5) { res.className = 'ap-res'; res.textContent = ''; return; }
      if (!pn) { result('Haetaan…', 'wait'); await loadPn(); if (!pn) { result(`Postinumeroita ei saatu ladattua. Soita 040${NB}123${NB}4567, niin kerromme suoraan.`, 'no'); return; } }
      if (inp.value !== v) return; // the visitor kept typing while the list loaded
      const k = kunta(v);
      if (!k) { result(`Postinumeroa ${v} ei löytynyt. Tarkista numero.`, 'no'); return; }
      cur = {code: v, kunta: k, inArea: AREA.includes(k)};
      if (cur.inArea) result(`<b>${v} · ${k}</b><span>Kuuluu toimialueeseemme. ${travelText(k)}</span>`, 'ok', 'Tilaa aika');
      else result(`<b>${v} · ${k}</b><span>Tämä on toimialueemme ulkopuolella. Jätä silti yhteystiedot, niin kerromme, onnistuuko työ.</span>`, 'out', 'Jätä yhteystiedot');
    }
    inp.addEventListener('input', doCheck);
    inp.addEventListener('focus', loadPn, {once: true});
    check.addEventListener('submit', async e => {
      e.preventDefault();
      if (inp.value.replace(/\D/g, '').length < 5) { result('Kirjoita viisinumeroinen postinumero.', 'no'); inp.focus(); return; }
      await doCheck(); const go = $('.ap-go', res); if (go) go.focus();
    });

    function toForm() {
      const w = $('#ap-where');
      w.textContent = `${cur.code} · ${cur.kunta}`; w.classList.toggle('out', !cur.inArea);
      $('#ap-h2').textContent = cur.inArea ? 'Tilaa aika.' : 'Jätä yhteystiedot.';
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
      const lead = {id: newId(), t: Date.now(), name: nimi.value.trim(), phone: puh.value.trim(), email: '',
        pn: cur.code, kunta: cur.kunta, inArea: cur.inArea, jobs, msg: $('#ap-viesti').value.trim(), src: 'Alueen tarkistus', status: 'uusi', own: true};
      store.add(lead);
      $('#ap-h3').textContent = `Kiitos, ${lead.name.split(/\s+/)[0]}!`;
      $('#ap-crm').href = 'liidit/index.html?uusi=' + lead.id;
      show(3); setTimeout(() => $('#ap-h3').focus({preventScroll: true}), 30);
      form.reset();
    });
  }

  /* ---------- booking form on yhteys.html feeds the same lead list ----------
     The page's own inline script validates first and opens the mail draft; this runs after it and only
     when that validation passed (#f-ok visible). */
  const book = $('#bookform'), ok = $('#f-ok');
  if (book && ok) book.addEventListener('submit', async () => {
    if (book.dataset.endpoint) return;
    if (ok.hidden) { const n = $('#f-demo'); if (n) n.hidden = true; return; }
    const v = n => (book.elements[n]?.value || '').trim();
    const addr = v('osoite'), m = addr.match(/\b(\d{5})\b/), code = m ? m[1] : '';
    await loadPn();
    let k = code ? kunta(code) : null;
    if (!k && !code && pn) { // no postcode: look for a municipality name written in the address ("Kaivokselantie 5, Vantaa")
      const low = addr.toLowerCase();
      k = pn.k.find(n => new RegExp('(^|[\\s,])' + n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[\\s,.])').test(low)) || null;
    }
    const when = [v('milloin'), v('aika').toLowerCase()].filter(Boolean).join(', ');
    const lead = {id: newId(), t: Date.now(), name: v('nimi'), phone: v('puhelin'), email: '', addr,
      pn: k && code ? code : '', kunta: k || '', inArea: k ? AREA.includes(k) : null, jobs: [],
      msg: v('vika') + (when ? `\nToivottu aika: ${when}.` : ''), src: book.dataset.src || 'Yhteydenottolomake', status: 'uusi', own: true};
    store.add(lead);
    let note = $('#f-demo');
    if (!note) { note = document.createElement('p'); note.id = 'f-demo'; note.className = 'ok'; note.setAttribute('role', 'status'); ok.after(note); }
    note.hidden = false; note.textContent = 'Demosivu: pyyntösi tallentui myös tähän selaimeen. ';
    const a = document.createElement('a'); a.href = 'liidit/index.html?uusi=' + lead.id; a.textContent = 'Katso, miten yrittäjä näkee sen';
    note.append(a, '.');
  });
})();
