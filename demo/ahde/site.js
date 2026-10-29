(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const rmq = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const fmt = n => Math.round(n).toLocaleString('fi-FI').replace(/ /g, ' ');

  /* ---------- menu ---------- */
  const hdr = $('.hdr'), nav = $('#menu'), mbtn = $('.menu-btn');
  const setMenu = open => { nav.classList.toggle('open', open); hdr.classList.toggle('menu-open', open); mbtn.setAttribute('aria-expanded', open); mbtn.setAttribute('aria-label', open ? 'Sulje valikko' : 'Avaa valikko'); };
  mbtn.addEventListener('click', () => { const o = mbtn.getAttribute('aria-expanded') !== 'true'; setMenu(o); if (o) nav.querySelector('a').focus(); });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && mbtn.getAttribute('aria-expanded') === 'true') { setMenu(false); mbtn.focus(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.nav')) setMenu(false); });
  matchMedia('(min-width:761px)').addEventListener('change', m => { if (m.matches) setMenu(false); });

  /* ---------- split headline ---------- */
  $$('.split').forEach(h => {
    let i = 0;
    const wrap = (txt, em) => txt.split(/(\s+)/).map(w => {
      if (!w.trim()) return w;
      const inner = `<span style="--i:${i++}">${w}</span>`;
      return `<span class="w" aria-hidden="true">${em ? `<em>${inner}</em>` : inner}</span>`;
    }).join('');
    h.innerHTML = [...h.childNodes].map(n => n.nodeType === 3 ? wrap(n.textContent) : wrap(n.textContent, true)).join('');
  });
  const go = () => requestAnimationFrame(() => document.documentElement.classList.add('loaded'));
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 900))]) : Promise.resolve()).then(go);

  /* ---------- scroll: header, progress ---------- */
  const bar = $('.progress span'), hero = $('.hero');
  let lastY = scrollY, vel = 0;
  function onScroll() {
    const y = scrollY, dy = y - lastY; lastY = y; vel = dy;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    hdr.classList.toggle('solid', y > hero.offsetHeight - 90);
    if (!nav.classList.contains('open')) hdr.classList.toggle('hide', dy > 4 && y > 400 ? true : dy < -4 ? false : hdr.classList.contains('hide'));
    story(); band();
  }
  addEventListener('scroll', onScroll, {passive: true});

  /* ---------- reveal + counters ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold: .14, rootMargin: '0px 0px -40px 0px'});
  $$('.reveal').forEach(el => io.observe(el));
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.to, from = to > 1900 ? to - 30 : 0;
    if (rmq.matches) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1600;
    const step = now => { const p = clamp((now - t0) / dur), k = 1 - Math.pow(1 - p, 4); el.textContent = Math.round(from + (to - from) * k); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), {threshold: .6});
  $$('.count').forEach(c => cio.observe(c));

  /* ---------- magnetic buttons ---------- */
  if (fine.matches) $$('.magnet').forEach(b => {
    b.addEventListener('pointermove', e => { if (rmq.matches) return; const r = b.getBoundingClientRect(); const x = (e.clientX - r.left - r.width / 2) / r.width, y = (e.clientY - r.top - r.height / 2) / r.height; b.style.transform = `translate(${x * 10}px,${y * 8}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transition = 'transform .5s cubic-bezier(.2,.7,.2,1),background .2s'; b.style.transform = ''; setTimeout(() => b.style.transition = '', 500); });
  });

  /* ---------- callbar + form ---------- */
  const cb = $('.callbar'), ctas = $('.hero-ctas');
  new IntersectionObserver(([en]) => cb.classList.toggle('show', !en.isIntersecting && en.boundingClientRect.top < 0)).observe(ctas);
  const form = $('#lomake'), fst = $('#lomake-tila');
  form.addEventListener('submit', e => { if (!form.dataset.endpoint) { e.preventDefault(); fst.hidden = false; fst.focus(); } });

  /* ---------- leaves canvas (hero) ---------- */
  (() => {
    const cv = $('#leaves'), ctx = cv.getContext('2d');
    let W = 0, H = 0, ps = [], run = false, vis = true, raf = 0, prev = 0, wind = 14, windT = 14, px = -999, py = -999, pvx = 0;
    const R = (a, b) => a + Math.random() * (b - a);
    const cols = ['#c9d77a', '#a9b95a', '#b8754a', '#d9a35a', '#7fa35a', '#e2c36b'];
    const mk = top => {
      const fluff = Math.random() < .35;
      return {x: top ? R(-60, W) : R(0, W), y: top ? R(-80, -10) : R(0, H), s: fluff ? R(1.4, 3) : R(6, 13), fluff, c: cols[(Math.random() * cols.length) | 0],
        vy: fluff ? R(-6, 10) : R(16, 38), vx: 0, rot: R(0, 6.28), vr: R(-1.6, 1.6), ph: R(0, 6.28), sw: R(.6, 1.6), a: fluff ? R(.4, .8) : R(.55, .9), flip: R(0, 6.28)};
    };
    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(70, Math.max(18, Math.round(W * H / 24000)));
      while (ps.length < n) ps.push(mk(false)); ps.length = n;
    }
    function leaf(p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      const fx = Math.cos(p.flip); ctx.scale(fx, 1); ctx.globalAlpha = p.a;
      if (p.fluff) {
        ctx.fillStyle = 'rgba(255,255,250,.9)'; ctx.beginPath(); ctx.arc(0, 0, p.s, 0, 6.28); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,250,.35)'; ctx.lineWidth = .6; ctx.beginPath();
        for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * p.s * 3, Math.sin(a) * p.s * 3); }
        ctx.stroke();
      } else {
        const s = p.s; ctx.fillStyle = p.c; ctx.beginPath(); ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(s * .75, -s * .2, 0, s); ctx.quadraticCurveTo(-s * .75, -s * .2, 0, -s); ctx.fill();
        ctx.strokeStyle = 'rgba(31,45,34,.35)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(0, -s * .9); ctx.lineTo(0, s * 1.25); ctx.stroke();
      }
      ctx.restore();
    }
    function frame(now) {
      if (!run) return;
      const dt = Math.min((now - (prev || now)) / 1000, .05); prev = now;
      windT += (14 - windT) * dt * .6; wind += (windT - wind) * dt * 2.2; pvx *= Math.pow(.02, dt);
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.ph += dt * p.sw;
        const sway = Math.sin(p.ph) * (p.fluff ? 8 : 22);
        let ax = wind * (p.fluff ? 1.6 : 1) + sway;
        const dx = p.x - px, dy = p.y - py, d2 = dx * dx + dy * dy;
        if (d2 < 140 * 140) { const d = Math.sqrt(d2) || 1, f = (1 - d / 140) * 520; p.vx += (dx / d) * f * dt + pvx * dt * .4; p.vy += (dy / d) * f * dt * .5; }
        p.vx *= Math.pow(.25, dt);
        p.x += (ax + p.vx) * dt; p.y += (p.vy + (vel < 0 ? vel * 2 : 0)) * dt;
        p.vy += ((p.fluff ? 4 : 26) - p.vy) * dt * .4;
        p.rot += p.vr * dt; p.flip += dt * (p.fluff ? .3 : 2.2);
        if (p.y > H + 30 || p.x > W + 60 || p.x < -80 || p.y < -120) Object.assign(p, mk(true), Math.random() < .4 ? {x: -30, y: R(0, H * .7)} : {});
        leaf(p);
      }
      vel *= .9;
      raf = requestAnimationFrame(frame);
    }
    const upd = () => { const want = vis && !rmq.matches && !document.hidden; if (want && !run) { run = true; prev = 0; raf = requestAnimationFrame(frame); } if (!want && run) { run = false; cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); } };
    addEventListener('resize', size); size();
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; upd(); }).observe(hero);
    document.addEventListener('visibilitychange', upd); rmq.addEventListener('change', upd);
    hero.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); const nx = e.clientX - r.left; pvx = (nx - px) * 20; if (px > -999) windT = clamp(14 + (nx - px) * 6, -60, 90); px = nx; py = e.clientY - r.top; }, {passive: true});
    hero.addEventListener('pointerleave', () => { px = py = -999; });
    addEventListener('scroll', () => { windT = clamp(windT + Math.abs(vel) * .8, -60, 120); }, {passive: true});
  })();

  /* ---------- pihasuunnittelija ---------- */
  (() => {
    const COLS = 14, ROWS = 9, grid = $('#pl-grid');
    const P = {nurmi: [15, 30, 'Nurmikko', 'm²'], kiveys: [90, 150, 'Kiveys', 'm²'], istutus: [40, 80, 'Istutus', 'm²'], terassi: [180, 300, 'Terassi', 'm²'], muuri: [250, 450, 'Kivimuuri', 'jm']};
    const isHouse = (r, c) => r < 3 && c < 5;
    const state = new Array(COLS * ROWS).fill('tyhja'), cells = [];
    const house = document.createElement('div'); house.className = 'cell house'; house.style.gridArea = '1 / 1 / 4 / 6';
    house.innerHTML = '<span class="house-label" style="inset:0">Talo</span>'; grid.appendChild(house);
    for (let i = 0; i < COLS * ROWS; i++) {
      const r = (i / COLS) | 0, c = i % COLS;
      if (isHouse(r, c)) { state[i] = 'house'; continue; }
      const d = document.createElement('div'); d.className = 'cell'; d.dataset.i = i; grid.appendChild(d); cells[i] = d;
    }
    let brush = 'nurmi', down = false, touched = false;
    $$('.brush').forEach(b => b.addEventListener('click', () => { brush = b.dataset.b; $$('.brush').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); }));
    const paint = (i, t = brush, anim = true) => {
      if (state[i] === 'house' || state[i] === t) return;
      state[i] = t; const el = cells[i];
      el.className = 'cell' + (t !== 'tyhja' ? ' c-' + t : '') + (i === cur ? ' cur' : '');
      if (anim && !rmq.matches) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
    };
    const cellAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.closest ? el.closest('.cell:not(.house)') : null; };
    grid.addEventListener('pointerdown', e => {
      const el = cellAt(e.clientX, e.clientY); if (!el) return;
      e.preventDefault(); down = true; touched = true; try { grid.setPointerCapture(e.pointerId); } catch (_) {} paint(+el.dataset.i); sum();
    });
    grid.addEventListener('pointermove', e => { if (!down) return; const el = cellAt(e.clientX, e.clientY); if (el) { paint(+el.dataset.i); sum(); } });
    const end = () => { down = false; };
    grid.addEventListener('pointerup', end); grid.addEventListener('pointercancel', end);
    // keyboard
    let cur = 3 * COLS;
    const mark = () => { cells.forEach(c => c && c.classList.remove('cur')); if (cells[cur]) cells[cur].classList.add('cur'); };
    grid.addEventListener('focus', mark); grid.addEventListener('blur', () => cells.forEach(c => c && c.classList.remove('cur')));
    grid.addEventListener('keydown', e => {
      const map = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLS, ArrowDown: COLS};
      if (map[e.key] !== undefined) {
        e.preventDefault(); let n = cur;
        do { const r = (n / COLS) | 0, c = n % COLS;
          if (e.key === 'ArrowLeft' && c === 0 || e.key === 'ArrowRight' && c === COLS - 1 || e.key === 'ArrowUp' && r === 0 || e.key === 'ArrowDown' && r === ROWS - 1) { n = cur; break; }
          n += map[e.key]; } while (state[n] === 'house');
        cur = n; mark();
      } else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); touched = true; paint(cur); sum(); }
      else if (/^[1-6]$/.test(e.key)) { $$('.brush')[+e.key - 1].click(); }
    });
    // summary
    const list = $('#pl-list'), totEl = $('#pl-total'), areaEl = $('#pl-area');
    let shownLo = 0, shownHi = 0, tw = 0;
    function sum() {
      const cnt = {}; state.forEach(t => { if (P[t]) cnt[t] = (cnt[t] || 0) + 1; });
      const keys = Object.keys(P).filter(k => cnt[k]); const mx = Math.max(1, ...keys.map(k => cnt[k]));
      let lo = 0, hi = 0, area = 0;
      list.innerHTML = keys.map(k => { lo += cnt[k] * P[k][0]; hi += cnt[k] * P[k][1]; if (k !== 'muuri') area += cnt[k];
        return `<li><i class="c-${k}"></i><span>${P[k][2]}</span><b>${cnt[k]} ${P[k][3]}</b><span class="bar"><span style="transform:scaleX(${cnt[k] / mx})"></span></span></li>`; }).join('') || '<li><span></span><span>Valitse materiaali ja maalaa ruudukkoon.</span></li>';
      lo = Math.round(lo / 100) * 100; hi = Math.round(hi / 100) * 100;
      areaEl.textContent = `${area} m² suunniteltu${cnt.muuri ? `, muuria ${cnt.muuri} m` : ''}`;
      const a0 = shownLo, b0 = shownHi, t0 = performance.now(); cancelAnimationFrame(tw);
      const step = now => { const p = rmq.matches ? 1 : clamp((now - t0) / 500), k = 1 - Math.pow(1 - p, 3);
        shownLo = a0 + (lo - a0) * k; shownHi = b0 + (hi - b0) * k;
        totEl.textContent = hi ? `${fmt(shownLo)} – ${fmt(shownHi)} €` : '0 €'; if (p < 1) tw = requestAnimationFrame(step); };
      tw = requestAnimationFrame(step);
    }
    // presets
    const presets = {
      perhe: (r, c) => (r >= 3 && r <= 4 && c <= 4) ? 'terassi' : (c === 5 && r <= 4) || (r === 5 && c <= 9) || (c === 9 && r >= 5) ? 'kiveys' : (r === 8 && c >= 10) ? 'muuri' : (c === 13 && r <= 7) || (r === 0 && c >= 6) || (r >= 6 && c <= 2) ? 'istutus' : 'nurmi',
      etupiha: (r, c) => (c >= 1 && c <= 2 && r >= 3) || (r === 3 && c <= 4) ? 'kiveys' : (c === 0 && r >= 3) || (r === 8 && c >= 3 && c <= 13) || (c === 13 && r <= 7) ? 'istutus' : (r <= 2 && c >= 5 && c <= 7) ? 'kiveys' : 'nurmi',
      clear: () => 'tyhja'
    };
    let animT = [];
    function apply(name, stagger) {
      animT.forEach(clearTimeout); animT = [];
      const f = presets[name];
      for (let i = 0; i < state.length; i++) {
        if (state[i] === 'house') continue;
        const r = (i / COLS) | 0, c = i % COLS, t = f(r, c);
        if (stagger && !rmq.matches) animT.push(setTimeout(() => { paint(i, t); if ((i & 7) === 0) sum(); }, (r + c) * 45));
        else paint(i, t, !rmq.matches);
      }
      if (stagger && !rmq.matches) animT.push(setTimeout(sum, (ROWS + COLS) * 45 + 60)); else sum();
    }
    $$('.pl-presets button').forEach(b => b.addEventListener('click', () => { touched = true; apply(b.dataset.p, b.dataset.p !== 'clear'); }));
    sum();
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); if (!touched) apply('perhe', true); } }, {threshold: .35}).observe(grid);
    // view toggle
    const vbtn = document.createElement('button'); vbtn.type = 'button'; vbtn.className = 'pl-view'; vbtn.textContent = 'Näkymä ylhäältä';
    vbtn.setAttribute('aria-pressed', 'false');
    vbtn.addEventListener('click', () => { const f = grid.classList.toggle('flat'); vbtn.setAttribute('aria-pressed', f); vbtn.textContent = f ? 'Näkymä viistosta' : 'Näkymä ylhäältä'; });
    $('.pl-board').appendChild(vbtn);
  })();

  /* ---------- pinned story ---------- */
  const st = $('.story'), line = $('#branch-line'), buds = $$('.buds circle'), steps = $$('.step'), figs = $$('.sm'), sn = $('#story-n');
  const L = line.getTotalLength(); line.style.strokeDasharray = L; line.style.strokeDashoffset = L;
  let stage = -1;
  function story() {
    if (rmq.matches) { line.style.strokeDashoffset = 0; buds.forEach(b => b.classList.add('on')); return; }
    const r = st.getBoundingClientRect(), span = r.height - innerHeight;
    const p = clamp(-r.top / span);
    line.style.strokeDashoffset = L * (1 - p);
    const s = Math.min(3, Math.floor(p * 4 * .999 + .0001));
    buds.forEach((b, i) => b.classList.toggle('on', p >= [0, .27, .55, .9][i] && p > 0.005 || (i === 0 && p >= 0)));
    if (s !== stage) { stage = s; steps.forEach((x, i) => x.classList.toggle('on', i === s)); figs.forEach((x, i) => x.classList.toggle('on', i === s)); sn.textContent = '0' + (s + 1); }
  }

  /* ---------- parallax fallback ---------- */
  const bandEl = $('.band'), bandImg = bandEl && $('img', bandEl);
  const noTL = !CSS.supports('animation-timeline: view()');
  function band() {
    if (!noTL || !bandImg || rmq.matches) return;
    const r = bandEl.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const p = (r.top + r.height) / (innerHeight + r.height); bandImg.style.transform = `translateY(${(p - .5) * 12}%) scale(1.04)`;
  }

  /* ---------- päivästä iltaan ---------- */
  (() => {
    const dn = $('#dn'), dial = $('.dn-dial'), svg = $('.dn-arc'), path = $('#arc-fill'), knob = $('#dn-knob');
    const night = $('.dn-night'), tint = $('.dn-tint'), glow = $('.dn-glow'), timeEl = $('#dn-time'), labEl = $('#dn-label'), sec = $('.dusk');
    const sun = $('.sun', knob), moon = $('.moon', knob);
    const PL = path.getTotalLength();
    let t = 0, user = false;
    const pt = u => { const p = path.getPointAtLength(u * PL), m = svg.getScreenCTM(), d = dial.getBoundingClientRect(); return {x: p.x * m.a + m.e - d.left, y: p.y * m.d + m.f - d.top}; };
    const lab = u => u < .25 ? 'Keskipäivä' : u < .5 ? 'Iltapäivä' : u < .72 ? 'Auringonlasku' : u < .88 ? 'Hämärä' : 'Ilta, valot päällä';
    function set(u) {
      t = clamp(u);
      const p = pt(t); knob.style.transform = `translate(${p.x}px,${p.y}px)`;
      path.style.strokeDasharray = PL; path.style.strokeDashoffset = PL * (1 - t);
      night.style.opacity = smooth(.42, .92, t);
      const warm = smooth(.15, .62, t) * (1 - smooth(.7, 1, t));
      tint.style.opacity = Math.max(warm, smooth(.75, 1, t) * .6);
      tint.style.background = t < .72 ? 'linear-gradient(180deg,#ff9a4d,#ffcf7a 60%,#ffd9a0)' : 'linear-gradient(180deg,#2b3d8a,#4a5fb0 50%,#ffb36b)';
      glow.style.opacity = smooth(.78, 1, t);
      sun.style.opacity = 1 - smooth(.7, .82, t); moon.style.opacity = smooth(.7, .82, t);
      const mins = Math.round((780 + t * 570) / 15) * 15, hh = (mins / 60) | 0, mm = String(mins % 60).padStart(2, '0');
      timeEl.textContent = `klo ${hh}.${mm}`; labEl.textContent = lab(t);
      knob.setAttribute('aria-valuenow', Math.round(t * 100)); knob.setAttribute('aria-valuetext', `klo ${hh}.${mm}, ${lab(t).toLowerCase()}`);
      sec.style.background = `rgb(${Math.round(24 - 10 * t)},${Math.round(36 - 14 * t)},${Math.round(27 - 9 * t)})`;
    }
    const nearest = (x, y) => { let best = 0, bd = 1e9; for (let k = 0; k <= 120; k++) { const u = k / 120, p = pt(u), d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = u; } } return best; };
    let drag = false;
    dial.addEventListener('pointerdown', e => { user = true; stopPeek(); drag = true; try { dial.setPointerCapture(e.pointerId); } catch (_) {} const d = dial.getBoundingClientRect(); set(nearest(e.clientX - d.left, e.clientY - d.top)); e.preventDefault(); });
    dial.addEventListener('pointermove', e => { if (!drag) return; const d = dial.getBoundingClientRect(); set(nearest(e.clientX - d.left, e.clientY - d.top)); });
    dial.addEventListener('pointerup', () => drag = false); dial.addEventListener('pointercancel', () => drag = false);
    knob.addEventListener('keydown', e => {
      const k = {ArrowRight: .05, ArrowUp: .05, ArrowLeft: -.05, ArrowDown: -.05, PageUp: .2, PageDown: -.2}[e.key];
      if (k !== undefined) { e.preventDefault(); user = true; stopPeek(); set(t + k); }
      else if (e.key === 'Home') { e.preventDefault(); set(0); } else if (e.key === 'End') { e.preventDefault(); set(1); }
    });
    addEventListener('resize', () => set(t));
    set(0);
    // auto peek
    let praf = 0;
    const stopPeek = () => cancelAnimationFrame(praf);
    const tween = (a, b, dur, done) => { const t0 = performance.now(); const f = now => { const p = clamp((now - t0) / dur), k = p < .5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2; set(a + (b - a) * k); if (p < 1) praf = requestAnimationFrame(f); else if (done) done(); }; praf = requestAnimationFrame(f); };
    new IntersectionObserver(([e], o) => { if (!e.isIntersecting || user || rmq.matches) return; o.disconnect();
      tween(0, 1, 3200, () => setTimeout(() => { if (!user) tween(1, .5, 1400); }, 1300)); }, {threshold: .55}).observe(dn);
  })();

  onScroll();
})();
