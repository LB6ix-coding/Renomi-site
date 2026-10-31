(() => {
  'use strict';
  const doc = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) doc.classList.add('reduce');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const eur = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') ;
  const hrs = h => (Math.round(h * 2) / 2).toString().replace('.', ',');

  /* split hero words */
  const h1 = $('#h1');
  if (h1) {
    let i = 0;
    $$('span', h1).forEach(line => {
      const words = line.textContent.trim().split(/\s+/);
      line.textContent = '';
      words.forEach((w, k) => {
        const o = document.createElement('span'); o.className = 'w';
        const n = document.createElement('span'); n.textContent = w;
        n.style.transitionDelay = (120 + i++ * 90) + 'ms';
        o.appendChild(n); line.appendChild(o);
        if (k < words.length - 1) line.appendChild(document.createTextNode(' '));
      });
    });
    h1.setAttribute('aria-label', 'Auto kuntoon. Hinta ensin.');
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { h1 && h1.classList.add('go'); $('#heroInner') && $('#heroInner').classList.add('go'); }));
  $$('.hero .fade-up').forEach((el, k) => el.style.transitionDelay = (450 + k * 140) + 'ms');

  /* open status, Helsinki time */
  const open = $('#openNow');
  if (open) {
    try {
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(p => [p.type, p.value]));
      const m = (+parts.hour) * 60 + (+parts.minute);
      const wk = !['Sat', 'Sun'].includes(parts.weekday);
      if (wk && m >= 450 && m < 1020) { open.classList.add('open'); open.lastElementChild.textContent = 'Auki nyt · ma–pe 7.30–17'; }
    } catch (e) { /* keep static text */ }
  }

  /* hero video + reel */
  const vid = $('#heroVid'), reel = $$('#reel i');
  const saveData = navigator.connection && navigator.connection.saveData;
  if (vid && !reduce && !saveData) {
    vid.preload = 'auto';
    vid.addEventListener('playing', () => vid.classList.add('on'), { once: true });
    const p = vid.play(); if (p && p.catch) p.catch(() => {});
    let last = -1;
    const tick = () => {
      const seg = Math.min(2, Math.floor(vid.currentTime / 2.7));
      if (seg !== last) {
        reel.forEach((r, k) => { r.classList.toggle('done', k < seg); r.classList.remove('on'); });
        if (reel[seg]) { void reel[seg].offsetWidth; reel[seg].style.setProperty('--t', (2.7 - (vid.currentTime % 2.7)).toFixed(2) + 's'); reel[seg].classList.add('on'); }
        last = seg;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) vid.play().catch(() => {}); else vid.pause(); })).observe(vid);
  } else if (reel.length) { $('#reel').style.display = 'none'; }

  /* header, progress, callbar */
  const header = $('header'), prog = $('#progress'), callbar = $('#callbar');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY, max = doc.scrollHeight - innerHeight;
    prog.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    header.classList.toggle('solid', y > 30);
    if (!doc.classList.contains('menu-open')) header.classList.toggle('hide', y > innerHeight * 0.9 && y > lastY + 2);
    if (y < lastY - 2) header.classList.remove('hide');
    callbar && callbar.classList.toggle('on', y > innerHeight * 0.7);
    lastY = y; ticking = false;
    story();
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* mobile menu */
  const mb = $('#menuBtn');
  const setMenu = on => { if (on) header.classList.remove('hide'); doc.classList.toggle('menu-open', on); mb.setAttribute('aria-expanded', on); mb.setAttribute('aria-label', on ? 'Sulje valikko' : 'Avaa valikko'); document.body.style.overflow = on ? 'hidden' : ''; };
  mb.addEventListener('click', () => setMenu(!doc.classList.contains('menu-open')));
  $$('#navlinks a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && doc.classList.contains('menu-open')) { setMenu(false); mb.focus(); } });
  addEventListener('resize', () => { if (innerWidth >= 980) setMenu(false); });

  /* reveals */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('.rv').forEach(el => io.observe(el));

  /* magnetic buttons */
  if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    $$('.magnet').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px,${(e.clientY - r.top - r.height / 2) * 0.28}px)`; });
      b.addEventListener('pointerleave', () => b.style.transform = '');
    });
  }

  /* signature tool: where does it sound */
  const Z = {
    moottori: { no: 1, name: 'Moottori', x: 20, s: [
      ['Moottorivalo palaa', 'Vikadiagnoosi', '69 €', 'noin 30 min', 'Vikadiagnoosi'],
      ['Nykii kiihdyttäessä', 'Sytytyksen tarkastus ja korjaus', '120–260 €', '1–2 h', 'Vikadiagnoosi'],
      ['Öljyä tippuu alle', 'Öljyvuodon paikannus ja tiiviste', '150–450 €', '2–4 h', 'Muu']] },
    jarrut: { no: 2, name: 'Jarrut', x: 23.5, s: [
      ['Vinkuu jarruttaessa', 'Jarrupalojen vaihto', '159–219 € / akseli', 'noin 1 h', 'Jarrut'],
      ['Ratti tärisee jarruttaessa', 'Jarrulevyt ja palat', '249–329 € / akseli', 'noin 1,5 h', 'Jarrut'],
      ['Poljin tuntuu pehmeältä', 'Jarrunesteen vaihto ja tarkastus', '79–119 €', 'noin 45 min', 'Jarrut']] },
    mittaristo: { no: 3, name: 'Mittaristo', x: 42, s: [
      ['Huoltomuistutus näkyy', 'Määräaikaishuolto', '189–289 €', 'noin 2 h', 'Määräaikaishuolto'],
      ['Akkuvalo palaa', 'Akun ja laturin testi', '69 € + osat', 'noin 30 min', 'Vikadiagnoosi'],
      ['Ilmastointi ei viilennä', 'Ilmastointihuolto', '119–169 €', 'noin 1 h', 'Ilmastointihuolto']] },
    renkaat: { no: 4, name: 'Renkaat ja alusta', x: 74.5, s: [
      ['Kausivaihto edessä', 'Rengasvaihto ja tasapainotus', '49–69 €', 'noin 30 min', 'Renkaat'],
      ['Auto vetää sivulle', 'Suuntauksen tarkastus', '89–129 €', 'noin 1 h', 'Renkaat'],
      ['Kolahtelee töyssyissä', 'Alustan tarkastus ja korjaus', '180–480 €', '2–3 h', 'Muu']] },
    pakoputki: { no: 5, name: 'Pakoputki', x: 89, s: [
      ['Päräjää tai pärisee', 'Äänenvaimentimen vaihto', '120–260 €', 'noin 1 h', 'Pakoputkisto'],
      ['Kolisee auton alla', 'Kiinnikkeiden vaihto', '60–120 €', 'noin 30 min', 'Pakoputkisto'],
      ['Pakokaasun haju sisällä', 'Tiiviyden tarkastus', '69 € + osat', 'noin 45 min', 'Pakoputkisto']] }
  };
  const bay = $('#bay'), symBox = $('#sym');
  let zone = null, pick = null;
  const setVerdict = () => {
    const z = Z[zone], s = pick != null ? z.s[pick] : null;
    $('#vJob').textContent = s ? s[1] : 'Valitse oire';
    $('#vPrice').textContent = s ? 'Esim. ' + s[2] : 'Esimerkkihinta näkyy tässä';
    $('#vTime').textContent = s ? s[3] : '';
  };
  const setZone = (key, moveScan) => {
    if (!Z[key] || key === zone) { if (moveScan && Z[key]) bay.style.setProperty('--sx', Z[key].x + '%'); return; }
    zone = key; pick = null;
    const z = Z[key];
    $('#zoneNo').textContent = 'Kohta ' + z.no; $('#zoneName').textContent = z.name;
    $$('.hs, #zones button').forEach(b => b.setAttribute('aria-pressed', b.dataset.z === key));
    symBox.querySelectorAll('label').forEach(l => l.remove());
    z.s.forEach((s, k) => {
      const l = document.createElement('label');
      l.innerHTML = '<input type="radio" name="oire"><span></span>';
      l.lastChild.textContent = s[0];
      l.firstChild.addEventListener('change', () => { pick = k; setVerdict(); });
      symBox.appendChild(l);
    });
    setVerdict();
    if (moveScan) bay.style.setProperty('--sx', z.x + '%');
  };
  if (bay) {
    setZone('jarrut', true);
    $$('.hs, #zones button').forEach(b => b.addEventListener('click', () => setZone(b.dataset.z, true)));
    let drag = false;
    const nearest = x => Object.keys(Z).reduce((a, k) => Math.abs(Z[k].x - x) < Math.abs(Z[a].x - x) ? k : a, 'moottori');
    const move = e => {
      const r = bay.getBoundingClientRect();
      const x = clamp((e.clientX - r.left) / r.width * 100, 2, 98);
      bay.style.setProperty('--sx', x.toFixed(2) + '%');
      const k = nearest(x);
      $$('.hs').forEach(h => h.classList.toggle('near', h.dataset.z === k && Math.abs(Z[k].x - x) < 6));
      if (Math.abs(Z[k].x - x) < 6) setZone(k, false);
    };
    bay.addEventListener('dragstart', e => e.preventDefault());
    bay.addEventListener('pointerdown', e => { if (e.target.closest('.hs')) return; drag = true; bay.setPointerCapture(e.pointerId); move(e); $('#bayHint').style.opacity = 0; });
    bay.addEventListener('pointermove', e => { if (drag) move(e); });
    const end = () => { drag = false; $$('.hs').forEach(h => h.classList.remove('near')); };
    bay.addEventListener('pointerup', end); bay.addEventListener('pointercancel', end);
    $('#vBook').addEventListener('click', () => {
      const z = Z[zone], s = pick != null ? z.s[pick] : null;
      if (s) { $('#fTyo').value = s[4]; $('#fMsg').value = z.name + ': ' + s[0].toLowerCase() + '. Arvio: ' + s[1].toLowerCase() + '.'; }
      else $('#fTyo').value = '';
    });
  }

  /* price calculator */
  const calc = () => {
    const f = +($('input[name=size]:checked') || { value: 1 }).value;
    const on = $$('#jobs input:checked');
    let lo = 0, hi = 0, h = 0;
    on.forEach(i => { const m = i.hasAttribute('data-fixed') ? 1 : f; lo += +i.dataset.lo * m; hi += +i.dataset.hi * m; h += +i.dataset.h * (m > 1.1 ? 1.15 : 1); });
    const rp = $('#rPrice');
    if (!on.length) { rp.textContent = 'Valitse työ'; $('#rTime').textContent = '–'; }
    else { rp.textContent = (eur(lo) === eur(hi) ? eur(lo) : eur(lo) + '–' + eur(hi)) + ' €'; $('#rTime').textContent = 'noin ' + hrs(Math.max(0.5, h)) + ' h'; }
    $('#rCount').textContent = on.length;
  };
  $$('#hinta input').forEach(i => i.addEventListener('change', calc)); calc();
  $('#calcBook') && $('#calcBook').addEventListener('click', () => {
    const on = $$('#jobs input:checked').map(i => i.closest('label').querySelector('.t').firstChild.textContent.trim());
    if (on.length) $('#fMsg').value = 'Hinta-arvio: ' + on.join(', ') + ' (' + $('#rPrice').textContent + ').';
    if (on.length === 1) { const map = { huolto: 'Määräaikaishuolto', jarrut: 'Jarrut', renkaat: 'Renkaat', diag: 'Vikadiagnoosi', ilmastointi: 'Ilmastointihuolto' }; $('#fTyo').value = map[$('#jobs input:checked').value]; }
  });

  /* pinned story */
  const track = $('#storyTrack'), stages = $$('#stages li'), imgs = $$('.story-media img'), gauge = $('#gauge');
  let cur = 0;
  function story() {
    if (!track || innerWidth < 980) return;
    const r = track.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight), 0, 0.999);
    const i = Math.floor(p * 4);
    gauge.style.transform = 'scaleX(' + ((i + 1) / 4) + ')';
    if (i === cur) return; cur = i;
    stages.forEach((s, k) => s.classList.toggle('on', k === i));
    imgs.forEach((m, k) => m.classList.toggle('on', k === i));
  }

  /* sparks canvas */
  const cv = $('#sparkCv');
  if (cv) {
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, live = false, parts = [], px = null, py = null, hinted = false;
    const size = () => { const r = cv.getBoundingClientRect(); if (!r.width) return; dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener('resize', size);
    const emit = (x, y, n, vx = 0, vy = 0) => { for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4; const s = 2 + Math.random() * 7; parts.push({ x, y, px: x, py: y, vx: Math.cos(a) * s + vx * 0.25, vy: Math.sin(a) * s + vy * 0.25, life: 1, d: 0.008 + Math.random() * 0.02 }); } if (parts.length > 900) parts.splice(0, parts.length - 900); };
    const draw = () => {
      if (!live) return;
      ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      if (px == null && Math.random() < 0.6) emit(W * 0.5 + Math.sin(performance.now() / 900) * W * 0.18, H * 0.72, 3);
      for (const p of parts) {
        p.px = p.x; p.py = p.y; p.vy += 0.22; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.life -= p.d;
        if (p.y > H - 4 && p.vy > 0) { p.vy *= -0.35; p.vx *= 0.6; p.y = H - 4; }
        const g = Math.max(0, p.life);
        ctx.strokeStyle = `rgba(255,${Math.round(150 + 100 * g)},${Math.round(60 * g)},${g})`;
        ctx.lineWidth = 1 + g * 1.4;
        ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      parts = parts.filter(p => p.life > 0 && p.x > -20 && p.x < W + 20);
      requestAnimationFrame(draw);
    };
    if (!reduce) {
      new IntersectionObserver(es => es.forEach(e => { const was = live; live = e.isIntersecting; if (live && !was) { size(); requestAnimationFrame(draw); } })).observe(cv);
      cv.addEventListener('pointermove', e => {
        const r = cv.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
        const vx = px == null ? 0 : x - px, vy = py == null ? 0 : y - py;
        emit(x, y, 2 + Math.min(12, Math.hypot(vx, vy) / 4 | 0), vx, vy); px = x; py = y;
        if (!hinted) { hinted = true; $('#sparkHint').classList.add('gone'); }
      });
      cv.addEventListener('pointerdown', e => { const r = cv.getBoundingClientRect(); emit(e.clientX - r.left, e.clientY - r.top, 40); if (!hinted) { hinted = true; $('#sparkHint').classList.add('gone'); } });
      cv.addEventListener('pointerleave', () => { px = py = null; });
    } else { $('#sparkHint').hidden = true; }
  }

  /* demo form */
  const form = $('#form');
  form && form.addEventListener('submit', e => {
    e.preventDefault();
    const st = $('#formStatus');
    if (form.sivusto.value) return;
    if (!form.nimi.value.trim() || !form.puhelin.value.trim()) { st.hidden = false; st.textContent = 'Lisää nimi ja puhelinnumero, niin voimme soittaa takaisin.'; (form.nimi.value.trim() ? form.puhelin : form.nimi).focus(); return; }
    st.hidden = false; st.textContent = 'Kiitos! Tämä on demosivu, joten pyyntöä ei lähetetty. Oikealla sivulla korjaamo soittaisi sinulle saman päivän aikana.';
    form.reset();
  });

  onScroll();
})();
