(() => {
  'use strict';
  const D = document, H = D.documentElement;
  const $ = (s, r = D) => r.querySelector(s), $$ = (s, r = D) => [...r.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm) H.classList.add('reduce');
  const lim = (v, a, b) => Math.max(a, Math.min(b, v));
  const eur = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';

  /* hero words (keeps the coloured span) */
  const h1 = $('#h1'); let n = 0;
  const words = el => [...el.childNodes].forEach(node => {
    if (node.nodeType === 1) return words(node);
    if (node.nodeType !== 3) return;
    const f = D.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(t => {
      if (!t) return;
      if (/^\s+$/.test(t)) return f.appendChild(D.createTextNode(' '));
      const o = D.createElement('span'), i = D.createElement('span');
      o.className = 'wd'; i.textContent = t; i.style.transitionDelay = (140 + n++ * 95) + 'ms';
      o.appendChild(i); f.appendChild(o);
    });
    node.replaceWith(f);
  });
  if (h1) { h1.setAttribute('aria-label', h1.textContent.trim()); words(h1); }
  $$('.hero .fx').forEach((e, k) => e.style.transitionDelay = (420 + k * 140) + 'ms');
  requestAnimationFrame(() => requestAnimationFrame(() => $('#hero').classList.add('go')));

  /* hero video with shot dots */
  const vid = $('#vid'), dots = $$('#dots i');
  if (vid && !calm && !(navigator.connection && navigator.connection.saveData)) {
    /* phone-safe: muted+inline set before play(), retry on first tap (iOS Low Power Mode), pause when off screen */
    vid.muted = true; vid.defaultMuted = true; vid.playsInline = true; vid.setAttribute('muted', ''); vid.setAttribute('playsinline', '');
    vid.addEventListener('playing', () => vid.classList.add('on'), { once: true });
    let seen = true;
    const go = () => { if (!seen || document.hidden || !vid.paused) return; vid.muted = true; vid.play().catch(() => {}); };
    go();
    ['touchend', 'click', 'keydown'].forEach(e => addEventListener(e, go, { passive: true }));
    document.addEventListener('visibilitychange', go);
    let s0 = -1;
    vid.addEventListener('timeupdate', () => { const s = Math.min(2, Math.floor(vid.currentTime / 2.7)); if (s !== s0) { s0 = s; dots.forEach((d, k) => d.classList.toggle('on', k === s)); } });
    new IntersectionObserver(es => es.forEach(e => { seen = e.isIntersecting; if (seen) go(); else vid.pause(); })).observe(vid);
  } else { const d = $('#dots'); if (d) d.hidden = true; }

  /* header, progress, mobile bar */
  const hdr = $('#hdr'), prog = $('#prog'), mbar = $('#mbar');
  let py = scrollY, raf = 0;
  const scrolled = () => {
    raf = 0;
    const y = scrollY, mx = H.scrollHeight - innerHeight;
    prog.style.transform = 'scaleX(' + (mx > 0 ? y / mx : 0) + ')';
    hdr.classList.toggle('on', y > innerHeight * 0.75);
    if (!H.classList.contains('open-menu')) { if (y > innerHeight && y > py + 3) hdr.classList.add('up'); else if (y < py - 3) hdr.classList.remove('up'); }
    mbar.classList.toggle('on', y > innerHeight * 0.7);
    py = y; pin();
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(scrolled); }, { passive: true });

  /* menu */
  const mt = $('#mt');
  const menu = on => { if (on) hdr.classList.remove('up'); H.classList.toggle('open-menu', on); mt.setAttribute('aria-expanded', on); mt.setAttribute('aria-label', on ? 'Sulje valikko' : 'Avaa valikko'); D.body.style.overflow = on ? 'hidden' : ''; };
  mt.addEventListener('click', () => menu(!H.classList.contains('open-menu')));
  $$('#nav a').forEach(a => a.addEventListener('click', () => menu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && H.classList.contains('open-menu')) { menu(false); mt.focus(); } });
  addEventListener('resize', () => { if (innerWidth >= 980) menu(false); });

  /* reveals */
  const ob = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); ob.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .06 });
  $$('.rv').forEach(e => ob.observe(e));

  /* signature tool: roll a colour onto the wall */
  const TONES = [
    ['Salvia', '#8a9a83', 'Rauhallinen harmaanvihreä. Sopii olohuoneeseen ja makuuhuoneeseen.'],
    ['Savi', '#c46a4a', 'Lämmin terrakotta. Tuo pohjoisen valon huoneeseen lämpöä.'],
    ['Yö', '#2f3a4c', 'Syvä sininen. Tekee makuuhuoneesta rauhallisen ja luolamaisen.'],
    ['Kaura', '#e3d6bd', 'Pehmeä vaalea beige. Turvallinen valinta isoihin tiloihin.'],
    ['Metsä', '#3f5745', 'Tumma vihreä. Toimii yhdellä seinällä tehosteena.'],
    ['Usva', '#b7c2c7', 'Viileä vaaleanharmaa. Raikas eteiseen ja työhuoneeseen.']
  ];
  const cv = $('#wallCv'), stage = $('#stage');
  if (cv) {
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    const W = cv.width, Ht = cv.height, N = W * Ht;
    let src = null, mask = null, base = null, cov = new Float32Array(N), out = null, ready = false, dirty = false, tone = 0, rgb = [0, 0, 0];
    const hex = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
    const load = s => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = s; });
    Promise.all([load('img/wall.webp'), load('img/wall-mask.png')]).then(([im, mk]) => {
      ctx.drawImage(im, 0, 0, W, Ht); src = ctx.getImageData(0, 0, W, Ht);
      const t = D.createElement('canvas'); t.width = W; t.height = Ht; const tc = t.getContext('2d'); tc.drawImage(mk, 0, 0, W, Ht);
      const md = tc.getImageData(0, 0, W, Ht).data;
      mask = new Float32Array(N); base = new Float32Array(N);
      let sum = 0, cnt = 0;
      for (let i = 0; i < N; i++) {
        const m = md[i * 4] / 255, p = i * 4, d = src.data;
        mask[i] = m;
        const l = (d[p] * .299 + d[p + 1] * .587 + d[p + 2] * .114) / 255; base[i] = l;
        if (m > .9) { sum += l; cnt++; }
      }
      const avg = cnt ? sum / cnt : .8;
      for (let i = 0; i < N; i++) base[i] = base[i] / avg;
      out = ctx.createImageData(W, Ht); ready = true; dirty = true; requestAnimationFrame(render);
    }).catch(() => { $('#wallHint').textContent = 'Kuvaa ei voitu ladata'; });
    function render() {
      if (!ready || !dirty) return; dirty = false;
      const s = src.data, o = out.data, [r, g, b] = rgb;
      for (let i = 0, p = 0; i < N; i++, p += 4) {
        const a = mask[i] * cov[i];
        if (a < .004) { o[p] = s[p]; o[p + 1] = s[p + 1]; o[p + 2] = s[p + 2]; o[p + 3] = 255; continue; }
        const k = base[i];
        o[p] = s[p] + (Math.min(255, r * k) - s[p]) * a;
        o[p + 1] = s[p + 1] + (Math.min(255, g * k) - s[p + 1]) * a;
        o[p + 2] = s[p + 2] + (Math.min(255, b * k) - s[p + 2]) * a;
        o[p + 3] = 255;
      }
      ctx.putImageData(out, 0, 0);
    }
    const queue = () => { if (!dirty) { dirty = true; requestAnimationFrame(render); } };
    const coverage = () => {
      if (!ready) return 0; let a = 0, t = 0;
      for (let i = 0; i < N; i += 7) { a += mask[i] * cov[i]; t += mask[i]; }
      return t ? Math.round(a / t * 100) : 0;
    };
    const showCov = () => { $('#cov').textContent = coverage() + ' % maalattu'; };
    // roller stamp: a soft-edged band, like a 18 cm roller seen from across the room
    const RW = 120, RH = 46;
    const stamp = (cx, cy) => {
      const x0 = Math.max(0, cx - RW / 2 | 0), x1 = Math.min(W - 1, cx + RW / 2 | 0), y0 = Math.max(0, cy - RH / 2 | 0), y1 = Math.min(Ht - 1, cy + RH / 2 | 0);
      for (let y = y0; y <= y1; y++) {
        const fy = 1 - Math.pow(Math.abs(y - cy) / (RH / 2), 4);
        for (let x = x0; x <= x1; x++) {
          const fx = 1 - Math.pow(Math.abs(x - cx) / (RW / 2), 6);
          const s = Math.max(0, fx * fy) * (.55 + .1 * Math.sin(x * .9 + y * .3));
          const i = y * W + x; cov[i] = cov[i] + (1 - cov[i]) * s;
        }
      }
    };
    let last = null, painting = false, hinted = false, covT = 0;
    const toImg = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) / b.width * W, (e.clientY - b.top) / b.height * Ht]; };
    const roller = $('#roller');
    const moveRoller = e => { const b = stage.getBoundingClientRect(); roller.style.transform = `translate(${e.clientX - b.left}px,${e.clientY - b.top}px)`; };
    const strokeTo = e => {
      const p = toImg(e);
      if (last) { const dx = p[0] - last[0], dy = p[1] - last[1], dist = Math.hypot(dx, dy), steps = Math.max(1, dist / 10 | 0); for (let k = 1; k <= steps; k++) stamp(last[0] + dx * k / steps, last[1] + dy * k / steps); }
      else stamp(p[0], p[1]);
      last = p; queue();
      clearTimeout(covT); covT = setTimeout(showCov, 120);
    };
    cv.addEventListener('pointerdown', e => {
      if (!ready) return; painting = true; last = null; cv.setPointerCapture(e.pointerId);
      stage.classList.toggle('touch', e.pointerType !== 'mouse'); moveRoller(e); strokeTo(e);
      if (!hinted) { hinted = true; $('#wallHint').classList.add('gone'); }
    });
    cv.addEventListener('pointermove', e => { moveRoller(e); if (painting) strokeTo(e); });
    const stop = () => { painting = false; last = null; showCov(); stage.classList.remove('touch'); };
    cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop);
    // palette
    const pal = $('#pal');
    const pick = i => {
      tone = i; rgb = hex(TONES[i][1]);
      $('#pickName').textContent = TONES[i][0]; $('#pickMeta').textContent = TONES[i][2];
      $('#rollerHead').setAttribute('fill', TONES[i][1]);
      $$('button', pal).forEach((b, k) => b.setAttribute('aria-pressed', k === i));
      queue();
    };
    TONES.forEach((t, i) => { const b = D.createElement('button'); b.type = 'button'; b.innerHTML = '<span></span>'; b.firstChild.style.setProperty('--sw', t[1]); b.appendChild(D.createTextNode(t[0])); b.addEventListener('click', () => pick(i)); pal.appendChild(b); });
    pick(0);
    $('#fillAll').addEventListener('click', () => {
      if (!ready) return; $('#wallHint').classList.add('gone'); hinted = true;
      if (calm) { cov.fill(1); queue(); showCov(); return; }
      const t0 = performance.now();
      const sweep = t => {
        const f = lim((t - t0) / 700, 0, 1), xe = f * W | 0;
        for (let y = 0; y < Ht; y++) { const row = y * W; for (let x = 0; x < xe; x++) cov[row + x] = 1; }
        queue(); if (f < 1) requestAnimationFrame(sweep); else showCov();
      };
      requestAnimationFrame(sweep);
    });
    $('#clearAll').addEventListener('click', () => { cov.fill(0); queue(); showCov(); });
    $('#useTone').addEventListener('click', () => { $('#fKohde').value = 'Sisämaalaus'; $('#fMsg').value = 'Sävytoive: ' + TONES[tone][0] + '. Haluaisin arviokäynnin.'; });
  }

  /* estimate */
  const area = $('#area');
  const est = () => {
    const A = +area.value, prep = +$('input[name=pohja]:checked').value, k = +$('input[name=krs]:checked').value, ppl = +$('input[name=hl]:checked').value;
    const work = A * (9 * k + prep), mat = A * 2.5 * k, per = work / ppl;
    const ded = ppl * Math.min(2100, Math.max(0, per * .4 - 150));
    $('#areaO').textContent = A + ' m²';
    area.style.setProperty('--p', ((A - area.min) / (area.max - area.min) * 100) + '%');
    $('#tot').textContent = eur(work + mat); $('#work').textContent = eur(work); $('#mat').textContent = eur(mat);
    $('#ded').textContent = eur(ded); $('#net').textContent = 'Maksat lopulta noin ' + eur(work + mat - ded);
  };
  $$('#hinta input').forEach(i => i.addEventListener('input', est)); est();
  $('#estGo').addEventListener('click', () => { $('#fKohde').value = 'Sisämaalaus'; $('#fMsg').value = (k => 'Noin ' + area.value + '\u00a0m² seiniä, ' + (k === '1' ? '1 maalikerros' : k + ' maalikerrosta') + '. Hinta-arvio ' + $('#tot').textContent + '.')($('input[name=krs]:checked').value); });

  /* pinned story */
  const tr = $('#stTrack'), steps = $$('#stList .st-i'), pics = $$('.st-pics img');
  let at = 0;
  function pin() {
    if (!tr || innerWidth < 980) return;
    const b = tr.getBoundingClientRect();
    const i = Math.floor(lim(-b.top / (b.height - innerHeight), 0, .999) * 4);
    if (i === at) return; at = i;
    steps.forEach((s, k) => s.classList.toggle('on', k === i));
    pics.forEach((p, k) => p.classList.toggle('on', k === i));
  }

  /* paint band: a brush that follows the pointer and dries slowly */
  const pc = $('#paintCv');
  if (pc && !calm) {
    const c = pc.getContext('2d');
    let w = 0, h = 0, on = false, prev = null, idle = true, told = false, hue = 0;
    const COLS = ['196,85,45', '138,154,131', '227,214,189', '47,58,76'];
    const size = () => { const b = pc.getBoundingClientRect(); if (!b.width) return; const r = Math.min(2, devicePixelRatio || 1); w = b.width; h = b.height; pc.width = w * r | 0; pc.height = h * r | 0; c.setTransform(r, 0, 0, r, 0, 0); };
    size(); addEventListener('resize', size);
    const bristles = Array.from({ length: 14 }, (_, i) => ({ o: (i - 6.5) * 2.6, a: .35 + Math.random() * .5, w: 1.5 + Math.random() * 2.5 }));
    const brush = (a, b, col) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
      c.lineCap = 'round';
      for (const s of bristles) {
        c.strokeStyle = `rgba(${col},${s.a})`; c.lineWidth = s.w;
        c.beginPath(); c.moveTo(a[0] + nx * s.o, a[1] + ny * s.o); c.lineTo(b[0] + nx * s.o, b[1] + ny * s.o); c.stroke();
      }
    };
    let auto = 0, ap = null;
    const tick = t => {
      if (!on) return;
      c.globalCompositeOperation = 'destination-out'; c.fillStyle = 'rgba(0,0,0,.012)'; c.fillRect(0, 0, w, h);
      c.globalCompositeOperation = 'source-over';
      if (idle) {
        auto += .012;
        const p = [((auto * 160) % (w + 200)) - 100, h * .5 + Math.sin(auto * 2.2) * h * .28];
        if (ap && p[0] > ap[0]) brush(ap, p, COLS[(auto / 6 | 0) % COLS.length]);
        ap = p;
      }
      requestAnimationFrame(tick);
    };
    new IntersectionObserver(es => es.forEach(e => { const was = on; on = e.isIntersecting; if (on && !was) { size(); requestAnimationFrame(tick); } })).observe(pc);
    const at = e => { const b = pc.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    pc.addEventListener('pointerenter', () => { hue = (hue + 1) % COLS.length; });
    pc.addEventListener('pointermove', e => {
      idle = false; const p = at(e);
      if (prev) brush(prev, p, COLS[hue]);
      prev = p;
      if (!told) { told = true; $('#bandHint').classList.add('gone'); }
    });
    pc.addEventListener('pointerleave', () => { prev = null; idle = true; ap = null; });
  } else if (pc) { $('#bandHint').hidden = true; }

  /* form */
  const fm = $('#fm');
  fm.addEventListener('submit', e => {
    e.preventDefault(); const st = $('#done');
    if (fm.www.value) return;
    if (!fm.nimi.value.trim() || !fm.puh.value.trim()) { st.hidden = false; st.textContent = 'Lisää nimi ja puhelinnumero, niin soitamme ja sovimme arviokäynnin.'; (fm.nimi.value.trim() ? fm.puh : fm.nimi).focus(); return; }
    st.hidden = false; st.textContent = 'Kiitos! Tämä on demosivu, joten pyyntöä ei lähetetty. Oikealla sivulla soittaisimme saman arkipäivän aikana.';
    fm.reset();
  });

  scrolled();
})();
