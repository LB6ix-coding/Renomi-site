(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const FINE = matchMedia('(hover:hover) and (pointer:fine)');
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fmt = n => Math.round(n).toLocaleString('fi-FI').replace(/ /g, ' ');

  /* ---------- menu ---------- */
  const nav = $('#menu'), mbtn = $('.menu-btn');
  const setMenu = open => { nav.classList.toggle('open', open); mbtn.setAttribute('aria-expanded', open); mbtn.setAttribute('aria-label', open ? 'Sulje valikko' : 'Avaa valikko'); };
  mbtn.addEventListener('click', () => { const o = mbtn.getAttribute('aria-expanded') !== 'true'; setMenu(o); if (o) nav.querySelector('a').focus(); });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && mbtn.getAttribute('aria-expanded') === 'true') { setMenu(false); mbtn.focus(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.nav')) setMenu(false); });

  /* ---------- split headline ---------- */
  $$('.split').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    el.setAttribute('aria-label', el.textContent.trim());
    walk(el);
    $$('.w', el).forEach(w => w.setAttribute('aria-hidden', 'true'));
  });

  /* ---------- header hide/show + progress ---------- */
  const hdr = $('.hdr'), bar = $('.progress span');
  let lastY = scrollY, vel = 0;
  const onScroll = () => {
    const y = scrollY, dy = y - lastY; lastY = y;
    vel = vel * .8 + dy * .2;
    hdr.classList.toggle('solid', y > 20);
    if (y > 400 && dy > 4 && !nav.classList.contains('open')) hdr.classList.add('hide');
    else if (dy < -4 || y < 200) hdr.classList.remove('hide');
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- reveal + stagger ---------- */
  $$('.svc-grid, .steps, .ex-grid, .stats-grid, .faq-list').forEach(g => $$('.reveal', g).forEach((el, i) => el.style.setProperty('--d', (i * 90) + 'ms')));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .14, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- counters ---------- */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.to, plain = el.hasAttribute('data-plain');
    if (RM.matches) { el.textContent = plain ? to : fmt(to); return; }
    const from = plain ? to - 40 : 0, t0 = performance.now(), dur = 1500;
    const tick = now => { const p = clamp((now - t0) / dur, 0, 1), k = 1 - Math.pow(1 - p, 4), v = from + (to - from) * k; el.textContent = plain ? Math.round(v) : fmt(v); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$('.count').forEach(el => cio.observe(el));

  /* ---------- magnetic buttons + tilt cards ---------- */
  if (FINE.matches) {
    $$('.magnetic').forEach(b => {
      b.addEventListener('pointermove', e => { if (RM.matches) return; const r = b.getBoundingClientRect(); const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2; b.style.transform = `translate(${x * .18}px,${y * .3}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)'; b.style.transform = ''; setTimeout(() => b.style.transition = '', 500); });
    });
    $$('.tilt').forEach(c => {
      c.addEventListener('pointermove', e => { if (RM.matches) return; const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.setProperty('--ry', (x * 7) + 'deg'); c.style.setProperty('--rx', (-y * 7) + 'deg'); });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--ry', '0deg'); c.style.setProperty('--rx', '0deg'); });
    });
  }

  /* ---------- marquee skew with scroll velocity ---------- */
  const mq = $('.marquee');
  let mqRaf = 0;
  const mqLoop = () => { const s = clamp(-vel * .25, -8, 8); mq.style.setProperty('--skew', s.toFixed(2) + 'deg'); vel *= .9; mqRaf = Math.abs(vel) > .05 ? requestAnimationFrame(mqLoop) : 0; if (!mqRaf) mq.style.setProperty('--skew', '0deg'); };
  addEventListener('scroll', () => { if (!RM.matches && !mqRaf) mqRaf = requestAnimationFrame(mqLoop); }, { passive: true });

  /* ---------- parallax fallback ---------- */
  if (!CSS.supports('animation-timeline: view()')) {
    const pars = $$('.par img');
    const upd = () => { if (RM.matches) return; pars.forEach(img => { const r = img.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; const p = (r.top + r.height / 2) / innerHeight - .5; img.style.transform = `translateY(${(-p * 14).toFixed(2)}%)`; }); };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  /* ---------- FAQ smooth open ---------- */
  $$('.faq details').forEach(d => {
    const s = $('summary', d), a = $('.ans', d);
    s.addEventListener('click', e => {
      if (RM.matches) return;
      e.preventDefault();
      if (d.open) {
        const h = a.offsetHeight;
        a.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => { d.open = false; };
      } else {
        d.open = true; const h = a.offsetHeight;
        a.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    });
  });

  /* ---------- callbar ---------- */
  const callbar = $('.callbar'), ctas = $('.hero-ctas');
  new IntersectionObserver(([en]) => callbar.classList.toggle('show', !en.isIntersecting && en.boundingClientRect.top < 0)).observe(ctas);

  /* ---------- form (demo) ---------- */
  const form = $('#lomake'), fstat = $('#lomake-tila');
  form.addEventListener('submit', e => { if (!form.dataset.endpoint) { e.preventDefault(); fstat.hidden = false; fstat.focus(); } });

  /* ---------- soap bubbles ---------- */
  class Bubbles {
    constructor(cv, opts) {
      this.cv = cv; this.ctx = cv.getContext('2d'); this.host = cv.parentElement; this.o = opts;
      this.list = []; this.pops = []; this.run = false; this.vis = false; this.prev = 0; this.mx = -1e4; this.my = -1e4;
      this.size(); addEventListener('resize', () => this.size());
      new IntersectionObserver(([e]) => { this.vis = e.isIntersecting; this.upd(); }).observe(this.host);
      RM.addEventListener('change', () => this.upd());
      const area = opts.area || this.host;
      area.addEventListener('pointermove', e => { const r = this.cv.getBoundingClientRect(); this.mx = e.clientX - r.left; this.my = e.clientY - r.top; if (FINE.matches) this.hit(this.mx, this.my, 0); }, { passive: true });
      area.addEventListener('pointerleave', () => { this.mx = this.my = -1e4; });
      area.addEventListener('pointerdown', e => { if (e.target.closest('a,button,input,label,select,textarea')) return; const r = this.cv.getBoundingClientRect(); this.hit(e.clientX - r.left, e.clientY - r.top, 18); }, { passive: true });
    }
    size() {
      const dpr = Math.min(devicePixelRatio || 1, 2), r = this.cv.getBoundingClientRect();
      this.W = r.width; this.H = r.height; this.cv.width = Math.max(1, r.width * dpr); this.cv.height = Math.max(1, r.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(clamp(this.W * this.H / this.o.density, 6, this.o.max));
      while (this.list.length < n) this.list.push(this.make(true));
      this.list.length = n;
    }
    make(any) {
      const r = this.o.rmin + Math.random() ** 1.8 * (this.o.rmax - this.o.rmin);
      const minX = this.o.minX ? this.W * this.o.minX : 0;
      return { x: minX + Math.random() * (this.W - minX), y: any ? Math.random() * this.H : this.H + r + Math.random() * 60, r, sp: 14 + Math.random() * 26 * (24 / (r + 8)), ph: Math.random() * 6.28, hue: Math.random() * 360, wob: .6 + Math.random() * 1.2 };
    }
    hit(x, y, extra) {
      for (const b of this.list) {
        const dx = b.x - x, dy = b.y - y;
        if (dx * dx + dy * dy < (b.r + extra) * (b.r + extra)) { this.pop(b); Object.assign(b, this.make(false)); }
      }
    }
    pop(b) {
      const n = 10 + Math.round(b.r / 3);
      for (let i = 0; i < n; i++) { const a = i / n * 6.28 + Math.random() * .4, s = 60 + Math.random() * 120; this.pops.push({ x: b.x + Math.cos(a) * b.r * .8, y: b.y + Math.sin(a) * b.r * .8, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, hue: b.hue + i * 20 }); }
    }
    upd() { const want = this.vis && !RM.matches; if (want && !this.run) { this.run = true; this.prev = 0; requestAnimationFrame(t => this.frame(t)); } if (!want) this.run = false; if (!want) this.ctx.clearRect(0, 0, this.W, this.H); }
    frame(now) {
      if (!this.run) return;
      const dt = Math.min((now - (this.prev || now)) / 1000, .05); this.prev = now;
      const c = this.ctx; c.clearRect(0, 0, this.W, this.H);
      const boost = 1 + Math.min(Math.abs(vel) / 12, 2.5);
      for (const b of this.list) {
        b.y -= b.sp * dt * boost; b.ph += dt * b.wob; b.hue = (b.hue + dt * 30) % 360;
        b.x += Math.sin(b.ph) * .35;
        const dx = b.x - this.mx, dy = b.y - this.my, d2 = dx * dx + dy * dy;
        if (d2 < 22000 && !FINE.matches) { const f = 1 - d2 / 22000; b.x += dx * f * .03; b.y += dy * f * .03; }
        if (b.y < -b.r - 10) Object.assign(b, this.make(false));
        this.draw(b);
      }
      for (let i = this.pops.length - 1; i >= 0; i--) {
        const p = this.pops[i]; p.life -= dt * 2.6; if (p.life <= 0) { this.pops.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .92; p.vy *= .92;
        c.fillStyle = `hsla(${p.hue},90%,70%,${p.life * .9})`; c.beginPath(); c.arc(p.x, p.y, 1.6 + p.life * 1.4, 0, 6.28); c.fill();
      }
      requestAnimationFrame(t => this.frame(t));
    }
    draw(b) {
      const c = this.ctx, { x, y, r } = b;
      const g = c.createRadialGradient(x - r * .3, y - r * .35, r * .1, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.04)'); g.addColorStop(.72, `hsla(${b.hue},85%,78%,0.08)`); g.addColorStop(.9, `hsla(${(b.hue + 60) % 360},90%,72%,0.32)`); g.addColorStop(1, 'rgba(255,255,255,0.55)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 6.28); c.fill();
      c.strokeStyle = `hsla(${(b.hue + 160) % 360},80%,70%,.35)`; c.lineWidth = 1; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(x - r * .38, y - r * .42, r * .2, r * .11, -.7, 0, 6.28); c.fill();
    }
  }
  const hb = $('[data-bubbles="hero"]'), cb = $('[data-bubbles="calc"]');
  if (hb) new Bubbles(hb, { density: 26000, max: 34, rmin: 6, rmax: 34, minX: innerWidth > 760 ? .45 : 0, area: $('.hero') });
  if (cb) new Bubbles(cb, { density: 52000, max: 18, rmin: 5, rmax: 26 });

  /* ---------- wipe the window ---------- */
  (() => {
    const stage = $('#wipe-stage'), cv = $('#wipe-canvas'), fx = $('#wipe-fx'), ctx = cv.getContext('2d'), fctx = fx.getContext('2d');
    const pctEl = $('.wipe-pct'), barEl = $('.wipe-bar i'), status = $('#wipe-status'), hint = $('#wipe-hint'), autoBtn = $('#wipe-auto'), resetBtn = $('#wipe-reset');
    const dirty = new Image(); dirty.src = 'img/s-likainen.webp';
    const GW = 48, GH = 27; let grid = new Uint8Array(GW * GH), cleaned = 0, done = false, W = 0, H = 0, dpr = 1, last = null, touched = false, autoRun = 0, lastAnnounce = -1;
    const parts = [];
    function size() {
      const r = stage.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height;
      for (const c of [cv, fx]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintDirty();
    }
    function paintDirty() {
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
      if (done) return;
      if (dirty.complete && dirty.naturalWidth) ctx.drawImage(dirty, 0, 0, W, H); else { ctx.fillStyle = '#b9b7a8'; ctx.fillRect(0, 0, W, H); }
      // redraw erased cells so a resize keeps progress
      ctx.globalCompositeOperation = 'destination-out';
      const cw = W / GW, ch = H / GH;
      for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) if (grid[j * GW + i]) { ctx.beginPath(); ctx.arc((i + .5) * cw, (j + .5) * ch, Math.max(cw, ch) * .95, 0, 6.28); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
    }
    function brushR() { return clamp(W * .065, 22, 70); }
    function stamp(x, y) {
      const R = brushR();
      const g = ctx.createRadialGradient(x, y, R * .35, x, y, R);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.7, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, 6.28); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
      // mark grid
      const cw = W / GW, ch = H / GH, rr = R * .78;
      const i0 = Math.max(0, Math.floor((x - rr) / cw)), i1 = Math.min(GW - 1, Math.floor((x + rr) / cw));
      const j0 = Math.max(0, Math.floor((y - rr) / ch)), j1 = Math.min(GH - 1, Math.floor((y + rr) / ch));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const cx = (i + .5) * cw - x, cy = (j + .5) * ch - y;
        if (cx * cx + cy * cy <= rr * rr && !grid[j * GW + i]) { grid[j * GW + i] = 1; cleaned++; }
      }
      if (!RM.matches && Math.random() < .5) parts.push({ x: x + (Math.random() - .5) * R, y: y + (Math.random() - .5) * R, life: 1, s: 2 + Math.random() * 4 });
    }
    function line(a, b) {
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), step = brushR() * .3, n = Math.max(1, Math.ceil(d / step));
      for (let k = 1; k <= n; k++) stamp(a.x + dx * k / n, a.y + dy * k / n);
      update();
    }
    function update() {
      const p = cleaned / (GW * GH), pct = Math.round(p * 100);
      pctEl.textContent = pct + ' %'; barEl.style.transform = `scaleX(${p})`;
      const step = pct < 5 ? 0 : 1 + Math.floor(pct / 10);
      if (step !== lastAnnounce && !done) { lastAnnounce = step; status.textContent = pct < 5 ? 'Ikkuna odottaa pesua.' : pct < 50 ? `Puhdasta ${pct} %. Jatkakaa vain.` : `Puhdasta ${pct} %. Kohta valmista.`; }
      if (p >= .8 && !done) finish();
      if (!fxRun && parts.length) { fxRun = true; requestAnimationFrame(fxLoop); }
    }
    function finish() {
      done = true; cancelAnimationFrame(autoRun); autoRun = 0;
      pctEl.textContent = '100 %'; barEl.style.transform = 'scaleX(1)';
      status.textContent = 'Valmista! Ikkuna on puhdas ja raidaton.';
      resetBtn.hidden = false; autoBtn.disabled = true;
      cv.animate([{ opacity: 1 }, { opacity: 0 }], { duration: RM.matches ? 1 : 700, easing: 'ease-out', fill: 'forwards' }).onfinish = () => { ctx.clearRect(0, 0, W, H); };
      if (!RM.matches) {
        for (let i = 0; i < 46; i++) { const a = Math.random() * 6.28, s = 40 + Math.random() * 260; parts.push({ x: W * (.3 + Math.random() * .4), y: H * (.3 + Math.random() * .4), vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1.4, s: 3 + Math.random() * 6, star: true }); }
        if (!fxRun) { fxRun = true; requestAnimationFrame(fxLoop); }
      }
    }
    let fxRun = false, fxPrev = 0;
    function fxLoop(now) {
      const dt = Math.min((now - (fxPrev || now)) / 1000, .05); fxPrev = now;
      fctx.clearRect(0, 0, W, H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.life -= dt * (p.star ? 1 : 2.2); if (p.life <= 0) { parts.splice(i, 1); continue; }
        if (p.vx) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .94; p.vy *= .94; }
        const a = Math.min(1, p.life);
        if (p.star) { fctx.fillStyle = `rgba(255,${227 + Math.round(28 * a)},${110 + Math.round(140 * (1 - a))},${a})`; sparkle(p.x, p.y, p.s * (0.6 + a * .6)); }
        else { fctx.fillStyle = `rgba(255,255,255,${a * .8})`; sparkle(p.x, p.y, p.s); }
      }
      if (parts.length) requestAnimationFrame(fxLoop); else { fxRun = false; fxPrev = 0; fctx.clearRect(0, 0, W, H); }
    }
    function sparkle(x, y, s) { fctx.beginPath(); fctx.moveTo(x, y - s); fctx.quadraticCurveTo(x, y, x + s, y); fctx.quadraticCurveTo(x, y, x, y + s); fctx.quadraticCurveTo(x, y, x - s, y); fctx.quadraticCurveTo(x, y, x, y - s); fctx.fill(); }
    const pt = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    function firstTouch() { if (!touched) { touched = true; hint.classList.add('gone'); } }
    stage.addEventListener('pointerdown', e => { if (done) return; firstTouch(); try { stage.setPointerCapture(e.pointerId); } catch (_) {} stage.classList.add('dragging'); last = pt(e); stamp(last.x, last.y); update(); });
    stage.addEventListener('pointermove', e => { if (!last || done) return; const p = pt(e); line(last, p); last = p; });
    const end = () => { last = null; stage.classList.remove('dragging'); };
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    // automatic squeegee path (keyboard / reduced motion alternative)
    autoBtn.addEventListener('click', () => {
      if (done) return; firstTouch();
      if (RM.matches) { grid.fill(1); cleaned = GW * GH; update(); return; }
      const rows = 6, R = brushR(); let t0 = performance.now(), prev = null; const dur = 2600;
      const path = t => { const row = Math.min(rows - 1, Math.floor(t * rows)), f = t * rows - row, y = R * .6 + row * (H - R * 1.2) / (rows - 1), x = row % 2 ? W * (1 - f) : W * f; return { x, y }; };
      const go = now => { const t = clamp((now - t0) / dur, 0, 1), p = path(t); if (prev) { if (Math.abs(p.y - prev.y) > 2) prev = { x: p.x, y: p.y }; line(prev, p); } prev = p; if (t < 1 && !done) autoRun = requestAnimationFrame(go); else if (!done) finish(); };
      autoRun = requestAnimationFrame(go);
    });
    resetBtn.addEventListener('click', () => {
      done = false; grid = new Uint8Array(GW * GH); cleaned = 0; lastAnnounce = -1;
      cv.getAnimations().forEach(a => a.cancel()); cv.style.opacity = 1;
      paintDirty(); update(); resetBtn.hidden = true; autoBtn.disabled = false; status.textContent = 'Ikkuna on taas likainen. Uusi yritys!';
      autoBtn.focus();
    });
    dirty.onload = size; if (dirty.complete) size();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 120); });
    // expose for tests
    window.__wipe = { get pct() { return Math.round(cleaned / (GW * GH) * 100); }, get done() { return done; } };
  })();

  /* ---------- pinned sweep ---------- */
  (() => {
    const sec = $('.sweep'), stage = $('.sweep-stage'), steps = $$('.sweep-steps li'), prog = $('.sweep-progress');
    // procedural grime texture: grease blotches, dust haze, crumbs and water marks
    (() => {
      const g = document.createElement('canvas'), W = 448, H = 560; g.width = W; g.height = H; const c = g.getContext('2d');
      let s = 7; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
      c.fillStyle = 'rgba(150,128,86,.22)'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 46; i++) { const x = R() * W, y = R() * H, r = 18 + R() * 70, gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(88,66,34,${.18 + R() * .22})`); gr.addColorStop(1, 'rgba(88,66,34,0)'); c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, 6.28); c.fill(); }
      c.lineCap = 'round';
      for (let i = 0; i < 26; i++) { const x = R() * W, y = R() * H * .9, l = 30 + R() * 90; c.strokeStyle = `rgba(70,56,34,${.12 + R() * .14})`; c.lineWidth = 3 + R() * 7; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + R() * 20 - 10, y + l / 2, x + R() * 16 - 8, y + l); c.stroke(); }
      for (let i = 0; i < 14; i++) { const x = R() * W, y = H * .35 + R() * H * .6, r = 6 + R() * 16; c.strokeStyle = `rgba(110,92,60,${.25 + R() * .2})`; c.lineWidth = 1.4; c.beginPath(); c.ellipse(x, y, r, r * .7, R() * 3, 0, 6.28); c.stroke(); }
      for (let i = 0; i < 900; i++) { const x = R() * W, y = H * .4 + R() * H * .6, r = .5 + R() * 1.6; c.fillStyle = `rgba(${50 + R() * 40},${40 + R() * 30},${24 + R() * 20},${.35 + R() * .5})`; c.beginPath(); c.arc(x, y, r, 0, 6.28); c.fill(); }
      for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(255,248,230,${R() * .18})`; c.fillRect(R() * W, R() * H, 1, 1); }
      const gm = $('.grime', stage); if (gm) gm.style.backgroundImage = `url(${g.toDataURL('image/png')})`;
    })();
    let ticking = false;
    const upd = () => {
      ticking = false;
      if (RM.matches) { steps.forEach(s => s.classList.add('on', 'cur')); return; }
      const r = sec.getBoundingClientRect(), total = r.height - innerHeight;
      const p = clamp(-r.top / total, 0, 1);
      document.body.classList.toggle('pinning', r.top <= 1 && r.bottom >= innerHeight - 1);
      const sweepP = clamp((p - .08) / .8, 0, 1);
      stage.style.setProperty('--p', (sweepP * 100).toFixed(2) + '%');
      prog.style.setProperty('--pp', p.toFixed(4));
      let cur = null; steps.forEach(s => { const on = sweepP >= +s.dataset.at - .001; s.classList.toggle('on', on); if (on) cur = s; }); steps.forEach(s => s.classList.toggle('cur', s === cur));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd); upd();
  })();

  /* ---------- calculator ---------- */
  (() => {
    const f = $('#calc'), m2 = $('#c-m2'), m2o = $('#c-m2-out');
    const out = { visit: $('#o-visit'), hours: $('#o-hours'), extra: $('#o-extra'), year: $('#o-year'), ded: $('#o-ded'), net: $('#o-net') };
    const extraRow = out.extra.closest('div');
    const fill = $('#o-barfill'), big = $('.out-big');
    const RATE = { 1: 58, 26: 52, 52: 48 };
    const cur = { visit: 0, extra: 0, year: 0, ded: 0, net: 0, hours: 0 };
    let anim = 0;
    function calc() {
      const a = +m2.value, freq = +f.querySelector('[name=freq]:checked').value, persons = +f.querySelector('[name=persons]:checked').value;
      let hours = 0.9 + a * 0.03; if (freq === 1) hours *= 1.3;
      hours = Math.round(hours * 4) / 4;
      // lisäpalvelut: kertasiivouksessa kerran, säännöllisessä data-times kertaa vuodessa
      let extraH = 0;
      $$('[name=extra]:checked', f).forEach(x => { extraH += +x.value * (freq === 1 ? 1 : +x.dataset.times); });
      if (freq === 1) hours += extraH;
      const visit = hours * RATE[freq], extra = freq === 1 ? 0 : extraH * RATE[freq], year = visit * freq + extra;
      const share = year / persons, dedP = clamp(share * .4 - 150, 0, 2100), ded = dedP * persons;
      const net = (year - ded) / freq;
      return { visit, extra, year, ded, net, hours, a };
    }
    function render() {
      const r = calc();
      m2o.textContent = r.a + ' m²';
      extraRow.hidden = !r.extra;
      m2.style.setProperty('--fill', ((r.a - +m2.min) / (+m2.max - +m2.min) * 100) + '%');
      out.hours.textContent = r.hours.toLocaleString('fi-FI', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      fill.style.transform = `scaleX(${r.year ? clamp(r.ded / r.year, 0, 1) : 0})`;
      big.classList.remove('bump'); void big.offsetWidth; big.classList.add('bump');
      cancelAnimationFrame(anim);
      const from = { ...cur }, t0 = performance.now(), dur = RM.matches ? 1 : 550;
      const tick = now => {
        const p = clamp((now - t0) / dur, 0, 1), k = 1 - Math.pow(1 - p, 3);
        for (const key of ['visit', 'extra', 'year', 'ded', 'net']) { cur[key] = from[key] + (r[key] - from[key]) * k; out[key].textContent = fmt(cur[key]); }
        if (p < 1) anim = requestAnimationFrame(tick);
      };
      anim = requestAnimationFrame(tick);
    }
    f.addEventListener('input', render); f.addEventListener('change', render);
    render();
    window.__calc = calc;
  })();

  /* ---------- process steps light up ---------- */
  // handled by .reveal.in -> .step.in styles

})();
