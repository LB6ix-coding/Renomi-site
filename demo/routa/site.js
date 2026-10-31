(() => {
  'use strict';
  const doc = document, html = doc.documentElement;
  const one = (s, r = doc) => r.querySelector(s), all = (s, r = doc) => [...r.querySelectorAll(s)];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) html.classList.add('calm');
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const euro = v => String(Math.round(v / 10) * 10).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
  const fi = v => String(v).replace('.', ',');

  /* hero headline, word by word */
  const h1 = one('#h1'); let k = 0;
  const split = el => [...el.childNodes].forEach(nd => {
    if (nd.nodeType === 1) return split(nd);
    if (nd.nodeType !== 3) return;
    const fr = doc.createDocumentFragment();
    nd.textContent.split(/(\s+)/).forEach(t => {
      if (!t) return;
      if (/^\s+$/.test(t)) return fr.appendChild(doc.createTextNode(' '));
      const o = doc.createElement('span'), i = doc.createElement('span');
      o.className = 'w'; i.textContent = t; i.style.transitionDelay = (120 + k++ * 110) + 'ms';
      o.appendChild(i); fr.appendChild(o);
    });
    nd.replaceWith(fr);
  });
  if (h1) { h1.setAttribute('aria-label', h1.textContent.trim()); split(h1); }
  all('.hero .up').forEach((e, i) => e.style.transitionDelay = (420 + i * 130) + 'ms');
  requestAnimationFrame(() => requestAnimationFrame(() => one('#hero').classList.add('on')));

  /* hero video + shot counter */
  const vid = one('#vid'), shots = all('#shots span');
  if (vid && !still && !(navigator.connection && navigator.connection.saveData)) {
    vid.preload = 'auto';
    vid.addEventListener('playing', () => vid.classList.add('on'), { once: true });
    vid.play().catch(() => {});
    let cur = -1;
    vid.addEventListener('timeupdate', () => { const s = Math.min(2, Math.floor(vid.currentTime / 2.7)); if (s !== cur) { cur = s; shots.forEach((e, i) => e.classList.toggle('on', i === s)); } });
    new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? vid.play().catch(() => {}) : vid.pause())).observe(vid);
  } else { const s = one('#shots'); if (s) s.hidden = true; }

  /* header, meter, dock */
  const top = one('#top'), meter = one('#meter'), dock = one('#dock');
  let lastY = scrollY, queued = 0;
  const onScroll = () => {
    queued = 0;
    const y = scrollY, max = html.scrollHeight - innerHeight;
    meter.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    top.classList.toggle('fill', y > 40);
    if (!html.classList.contains('menu')) { if (y > innerHeight && y > lastY + 3) top.classList.add('gone'); else if (y < lastY - 3) top.classList.remove('gone'); }
    dock.classList.toggle('on', y > innerHeight * .7);
    lastY = y; pinStory();
  };
  addEventListener('scroll', () => { if (!queued) queued = requestAnimationFrame(onScroll); }, { passive: true });

  /* menu */
  const burg = one('#burg');
  const setMenu = on => { if (on) top.classList.remove('gone'); html.classList.toggle('menu', on); burg.setAttribute('aria-expanded', on); burg.setAttribute('aria-label', on ? 'Sulje valikko' : 'Avaa valikko'); doc.body.style.overflow = on ? 'hidden' : ''; };
  burg.addEventListener('click', () => setMenu(!html.classList.contains('menu')));
  all('#links a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && html.classList.contains('menu')) { setMenu(false); burg.focus(); } });
  addEventListener('resize', () => { if (innerWidth >= 980) setMenu(false); });

  /* reveals */
  const seen = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .06 });
  all('.rv').forEach(e => seen.observe(e));

  /* signature: dig down beside the foundation */
  const LAYERS = [
    { to: 12, m: [0, .1], name: 'Nurmi', text: 'Nurmikko kuoritaan talteen tai uusitaan kaivun jälkeen. Juurikerros on ohut, mutta sen alla alkaa työ.', job: 'Nurmikon uusiminen', price: 'Esim. 8–15 €/m²', time: '1–2 päivää', kv: 'Kotitalousvähennys työn osuudesta, kun piha kuuluu olemassa olevaan omakotitaloon', form: 'Pihan kunnostus tai nurmi' },
    { to: 29, m: [.1, .4], name: 'Pintamaa', text: 'Multaa ja kasvualustaa. Kaivun ajaksi se välivarastoidaan pihalle ja levitetään lopuksi takaisin.', job: 'Pihan kunnostus ja kasvualusta', price: 'Esim. 20–40 €/m²', time: '2–4 päivää', kv: 'Kotitalousvähennys työn osuudesta olemassa olevan talon pihalla', form: 'Pihan kunnostus tai nurmi' },
    { to: 50, m: [.4, .8], name: 'Kantava murske', text: 'Routimaton ja kantava kerros. Pihatien ja kivetyksen alla tämä ratkaisee, painuuko pinta muutamassa vuodessa.', job: 'Pihatien pohja', price: 'Esim. 35–60 €/m²', time: '3–5 päivää', kv: 'Kotitalousvähennys työn osuudesta, kun kyse on korjauksesta eikä uudisrakentamisesta', form: 'Pihatie tai kivetyksen pohja' },
    { to: 75, m: [.8, 1.3], name: 'Salaoja', text: 'Salaoja kulkee anturan vierellä pestyssä sepelissä ja vie veden pois sokkelilta. Eristelevy sokkelissa pitää roudan loitolla.', job: 'Salaojien uusiminen ja routaeristys', price: 'Esim. 9 000–16 000 € / talo', time: '1–3 viikkoa', kv: 'Kotitalousvähennys työn osuudesta olemassa olevassa talossa', form: 'Salaojat' },
    { to: 100, m: [1.3, 1.8], name: 'Savi', text: 'Pohjamaa. Savi ei juuri läpäise vettä, joten savimaalla toimiva salaoja on välttämätön. Muuten vesi jää seisomaan sokkelin viereen.', job: 'Salaojat savimaalle', price: 'Esim. 9\u00a0000–16\u00a0000\u00a0€ / talo', time: '1–3 viikkoa', kv: 'Kotitalousvähennys työn osuudesta olemassa olevassa talossa', form: 'Salaojat' }
  ];
  const pit = one('#pit'), grab = one('#grab'), strata = one('#strata');
  if (pit) {
    let dp = 30, li = -1;
    const metres = p => { let a = 0; for (const L of LAYERS) { if (p <= L.to) { const f = (p - a) / (L.to - a); return L.m[0] + f * (L.m[1] - L.m[0]); } a = L.to; } return 1.8; };
    LAYERS.forEach((L, i) => { const b = doc.createElement('button'); b.type = 'button'; b.textContent = L.name; b.setAttribute('aria-pressed', 'false'); b.addEventListener('click', () => { const from = i ? LAYERS[i - 1].to : 0; set(from + (L.to - from) * .6); }); strata.appendChild(b); });
    const show = i => {
      if (i === li) return; li = i; const L = LAYERS[i];
      one('#lDepth').textContent = i === LAYERS.length - 1 ? 'Yli 1,3 m' : fi(L.m[0]) + '–' + fi(L.m[1]) + ' m';
      one('#lName').textContent = L.name; one('#lText').textContent = L.text; one('#lJob').textContent = L.job;
      one('#lPrice').textContent = L.price; one('#lTime').textContent = L.time; one('#lKv').textContent = L.kv;
      all('button', strata).forEach((b, k2) => b.setAttribute('aria-pressed', k2 === i));
      grab.setAttribute('aria-valuenow', i); grab.setAttribute('aria-valuetext', L.name);
    };
    function set(p) {
      dp = cl(p, 3, 97); pit.style.setProperty('--dp', dp + '%');
      one('#depth').textContent = fi(metres(dp).toFixed(1)) + ' m';
      show(LAYERS.findIndex(L => dp <= L.to));
    }
    set(dp);
    let drag = false, hinted = false;
    const at = e => { const r = pit.getBoundingClientRect(); return (e.clientY - r.top) / r.height * 100; };
    grab.addEventListener('pointerdown', e => { drag = true; grab.setPointerCapture(e.pointerId); set(at(e)); if (!hinted) { hinted = true; one('#pitTip').classList.add('off'); } });
    grab.addEventListener('pointermove', e => { if (drag) set(at(e)); });
    const up = () => { drag = false; };
    grab.addEventListener('pointerup', up); grab.addEventListener('pointercancel', up);
    grab.addEventListener('keydown', e => {
      const s = { ArrowDown: 5, ArrowRight: 5, ArrowUp: -5, ArrowLeft: -5, PageDown: 20, PageUp: -20 }[e.key];
      if (s) { e.preventDefault(); set(dp + s); }
      if (e.key === 'Home') { e.preventDefault(); set(3); }
      if (e.key === 'End') { e.preventDefault(); set(97); }
    });
    one('#lBook').addEventListener('click', () => { const L = LAYERS[li]; one('#fTyo').value = L.form; one('#fMsg').value = 'Kiinnostaa: ' + L.job.toLowerCase() + '.'; });
  }

  /* drainage calculator */
  const per = one('#per');
  const calc = () => {
    const P = +per.value, D = +one('input[name=sy]:checked').value, ex = new Set(all('#adds input:checked').map(i => i.value));
    const fresh = one('input[name=ta]:checked').value === 'uusi';
    let labour = P * (42 + 48 * D) + 4 * 120, mach = P * (28 + 32 * D), mat = P * 55 + 4 * 260;
    if (ex.has('eristys')) { labour += P * 12; mat += P * 20; }
    if (ex.has('pato')) { labour += P * 18; mat += P * 28; }
    if (ex.has('sade')) { labour += P * 12; mach += P * 8; mat += P * 15; }
    const one1 = fresh ? 0 : Math.min(2100, Math.max(0, labour * .4 - 150));
    const two = fresh ? 0 : 2 * Math.min(2100, Math.max(0, labour / 2 * .4 - 150));
    one('#perO').textContent = P + ' m';
    per.style.setProperty('--p', ((P - per.min) / (per.max - per.min) * 100) + '%');
    one('#tot').textContent = euro(labour + mach + mat);
    one('#work').textContent = euro(labour); one('#mach').textContent = euro(mach); one('#mat').textContent = euro(mat);
    one('#ded').textContent = euro(one1);
    one('#net').textContent = fresh ? 'Uudisrakennuksessa vähennystä ei saa.' : 'Yhdelle hakijalle. Puolisoille yhteensä noin ' + euro(two) + '.';
  };
  all('#laskuri input').forEach(i => i.addEventListener('input', calc)); calc();
  one('#calcGo').addEventListener('click', () => { one('#fTyo').value = 'Salaojat'; one('#fMsg').value = 'Talon ympärysmitta noin ' + per.value + ' m, kaivusyvyys noin ' + fi(one('input[name=sy]:checked').value) + ' m. Laskurin arvio ' + one('#tot').textContent + '.'; });

  /* pinned story */
  const track = one('#sTrack'), steps = all('#sSteps .s-st'), pics = all('.s-view img');
  let si = 0;
  function pinStory() {
    if (!track || innerWidth < 980) return;
    const r = track.getBoundingClientRect();
    const i = Math.floor(cl(-r.top / (r.height - innerHeight), 0, .999) * 4);
    if (i === si) return; si = i;
    steps.forEach((s, n) => s.classList.toggle('on', n === i));
    pics.forEach((p, n) => { p.classList.toggle('on', n === i); p.classList.toggle('past', n < i); });
    one('#sCt').textContent = (i + 1) + ' / 4';
  }

  /* gravel band: stones pour from the pointer and pile up */
  const gc = one('#gravelCv');
  if (gc && !still) {
    const g = gc.getContext('2d');
    let W = 0, H = 0, live = false, cols = [], stones = [], px = null, told = false, t0 = 0;
    const C = 6, TONES = ['#8d8e88', '#a3a39c', '#6f716c', '#b9b7ae', '#5d5f5a', '#c9a227'];
    const size = () => { const b = gc.getBoundingClientRect(); if (!b.width) return; const r = Math.min(2, devicePixelRatio || 1); W = b.width; H = b.height; gc.width = W * r | 0; gc.height = H * r | 0; g.setTransform(r, 0, 0, r, 0, 0); cols = new Array(Math.ceil(W / C)).fill(0); stones = []; };
    size(); addEventListener('resize', size);
    const drop = (x, y, n) => { for (let i = 0; i < n; i++) stones.push({ x: x + (Math.random() - .5) * 14, y: y - Math.random() * 10, vy: Math.random() * 2, r: 3 + Math.random() * 4, c: TONES[Math.random() * TONES.length | 0], a: Math.random() * 6 }); if (stones.length > 2600) stones.splice(0, stones.length - 2600); };
    const frame = t => {
      if (!live) return;
      g.clearRect(0, 0, W, H);
      if (px == null) drop(W / 2 + Math.sin(t / 1300) * W * .3, -6, 2);
      for (const s of stones) {
        if (s.rest) continue;
        s.vy += .35; s.y += s.vy;
        let ci = cl(s.x / C | 0, 0, cols.length - 1);
        const floor = H - cols[ci] * 4;
        if (s.y >= floor) {
          const l = cols[ci - 1] ?? 1e9, rr = cols[ci + 1] ?? 1e9;
          if (l < cols[ci] - 1 && l <= rr) { s.x -= C; s.y = floor - 2; continue; }
          if (rr < cols[ci] - 1) { s.x += C; s.y = floor - 2; continue; }
          s.y = floor; s.rest = true; cols[ci]++;
        }
      }
      // settle very slowly so the heap never fills the band
      if (t - t0 > 90) { t0 = t; for (let i = 0; i < cols.length; i++) if (cols[i] > 0 && Math.random() < .02) cols[i]--; stones = stones.filter(s => !s.rest || s.y > H - (cols[cl(s.x / C | 0, 0, cols.length - 1)] + 2) * 4); }
      for (const s of stones) { g.fillStyle = s.c; g.beginPath(); g.ellipse(s.x, s.y, s.r, s.r * .8, s.a, 0, 6.283); g.fill(); }
      requestAnimationFrame(frame);
    };
    new IntersectionObserver(es => es.forEach(e => { const was = live; live = e.isIntersecting; if (live && !was) { size(); requestAnimationFrame(frame); } })).observe(gc);
    gc.addEventListener('pointermove', e => { const b = gc.getBoundingClientRect(); px = e.clientX - b.left; drop(px, e.clientY - b.top, 6); if (!told) { told = true; one('#bandHint').classList.add('off'); } });
    gc.addEventListener('pointerleave', () => { px = null; });
  } else if (gc) { one('#bandHint').hidden = true; }

  /* form */
  const f = one('#f');
  f.addEventListener('submit', e => {
    e.preventDefault(); const ok = one('#ok');
    if (f.www.value) return;
    if (!f.nimi.value.trim() || !f.puh.value.trim()) { ok.hidden = false; ok.textContent = 'Lisää nimi ja puhelinnumero, niin soitamme ja sovimme katselmuksen.'; (f.nimi.value.trim() ? f.puh : f.nimi).focus(); return; }
    ok.hidden = false; ok.textContent = 'Kiitos! Tämä on demosivu, joten pyyntöä ei lähetetty. Oikealla sivulla soittaisimme saman arkipäivän aikana.';
    f.reset();
  });

  onScroll();
})();
