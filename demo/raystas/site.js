(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fmt = n => Math.round(n).toLocaleString('fi-FI').replace(/\s/g, ' ');

  /* hero video */
  /* phone-safe: portrait file on phones, muted+inline set before play(), retry on first tap (iOS Low Power Mode),
     pause when off screen; the poster image stays visible until the video really plays */
  const v = $('#hero-video');
  if (v) {
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    if (!mq.matches) {
      const small = matchMedia('(max-width:760px)').matches;
      v.poster = small ? 'img/hero-poster-mobile.webp' : 'img/hero-poster.webp';
      v.src = small ? 'img/hero-mobile.mp4' : innerWidth >= 900 ? 'img/hero-1080.mp4' : 'img/hero-720.mp4';
      v.addEventListener('playing', () => v.classList.add('on'));
      let seen = true;
      const go = () => { if (!seen || document.hidden || !v.paused) return; v.muted = true; const p = v.play(); if (p && p.catch) p.catch(() => {}); };
      go();
      ['touchend', 'click', 'keydown'].forEach(e => addEventListener(e, go, { passive: true }));
      document.addEventListener('visibilitychange', go);
      if ('IntersectionObserver' in window) new IntersectionObserver(es => { seen = es[0].isIntersecting; if (seen) go(); else v.pause(); }).observe(v);
    }
  }

  /* split headline */
  $$('.split').forEach(h => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(t => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.append(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.textContent = t; w.append(i); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n);
      });
    };
    walk(h);
    $$('.w>span', h).forEach((s, i) => s.style.transitionDelay = (0.15 + i * 0.07) + 's');
    requestAnimationFrame(() => requestAnimationFrame(() => h.classList.add('go')));
  });

  /* menu */
  const nav = $('#menu'), mbtn = $('.menu-btn');
  const setMenu = o => { nav.classList.toggle('open', o); mbtn.setAttribute('aria-expanded', o); mbtn.setAttribute('aria-label', o ? 'Sulje valikko' : 'Avaa valikko'); hdr.classList.toggle('solid', o || scrollY > 40); };
  mbtn.addEventListener('click', () => { const o = mbtn.getAttribute('aria-expanded') !== 'true'; setMenu(o); if (o) nav.querySelector('a').focus(); });
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && mbtn.getAttribute('aria-expanded') === 'true') { setMenu(false); mbtn.focus(); } });
  matchMedia('(min-width:761px)').addEventListener('change', m => { if (m.matches) setMenu(false); });

  /* header + progress */
  const hdr = $('.hdr'), bar = $('.progress span');
  let lastY = scrollY, vel = 0;
  const onScroll = () => {
    const y = scrollY, dy = y - lastY; lastY = y;
    vel = Math.min(vel + Math.abs(dy), 900);
    const open = mbtn.getAttribute('aria-expanded') === 'true';
    hdr.classList.toggle('solid', y > 40 || open);
    if (!open) { if (dy > 4 && y > 300) hdr.classList.add('hide'); else if (dy < -4) hdr.classList.remove('hide'); }
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    layers(); proc(); parallaxFallback();
  };
  addEventListener('scroll', onScroll, {passive: true});
  hdr.addEventListener('focusin', () => hdr.classList.remove('hide'));

  /* reveals */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold: .12, rootMargin: '0px 0px -40px 0px'});
  $$('.reveal').forEach(el => {
    const sib = el.parentElement ? [...el.parentElement.children].filter(c => c.classList.contains('reveal')) : [];
    const idx = sib.indexOf(el); if (idx > 0) el.style.setProperty('--d', Math.min(idx, 6) * 0.08 + 's');
    io.observe(el);
  });

  /* counters */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.to, plain = 'plain' in el.dataset, from = plain ? to - 40 : 0;
    if (mq.matches) return;
    const t0 = performance.now(), d = 1600;
    const step = t => { const k = clamp((t - t0) / d, 0, 1), e2 = 1 - Math.pow(1 - k, 4), val = from + (to - from) * e2; el.textContent = plain ? Math.round(val) : fmt(val); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), {threshold: .6});
  $$('.count').forEach(c => cio.observe(c));

  /* magnetic buttons */
  if (fine.matches && !mq.matches) $$('.mag').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); const x = (e.clientX - r.left - r.width / 2) * .22, y = (e.clientY - r.top - r.height / 2) * .35; b.style.transform = `translate(${clamp(x, -9, 9)}px,${clamp(y, -7, 7)}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transition = 'transform .5s cubic-bezier(.2,.75,.2,1),background .2s'; b.style.transform = ''; setTimeout(() => b.style.transition = '', 500); });
  });

  /* service hover peek */
  const peek = $('.svc-peek'), pimg = peek && $('img', peek);
  if (peek && fine.matches) {
    let px = 0, py = 0, tx = 0, ty = 0, raf = 0, on = false;
    const loop = () => { px += (tx - px) * .18; py += (ty - py) * .18; peek.style.left = px + 'px'; peek.style.top = py + 'px'; if (on || Math.abs(tx - px) > .5) raf = requestAnimationFrame(loop); else raf = 0; };
    $$('.svc-item').forEach(it => {
      it.addEventListener('pointerenter', e => { pimg.src = it.dataset.img; on = true; peek.classList.add('on'); if (!px) { px = tx = e.clientX + 170; py = ty = e.clientY; } if (!raf) raf = requestAnimationFrame(loop); });
      it.addEventListener('pointermove', e => { tx = e.clientX + 170; ty = e.clientY; });
      it.addEventListener('pointerleave', () => { on = false; peek.classList.remove('on'); });
    });
  }

  /* rain canvas */
  class Rain {
    constructor(cv, splashZone) {
      this.cv = cv; this.ctx = cv.getContext('2d'); this.zone = splashZone; this.drops = []; this.spl = []; this.run = false; this.vis = false; this.prev = 0;
      this.size(); addEventListener('resize', () => this.size());
      new IntersectionObserver(([e]) => { this.vis = e.isIntersecting; this.update(); }).observe(cv);
    }
    size() {
      const r = this.cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      this.W = r.width; this.H = r.height; this.cv.width = r.width * dpr; this.cv.height = r.height * dpr; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(this.W * this.H / 5200);
      while (this.drops.length < n) this.drops.push(this.mk(true));
      this.drops.length = n;
    }
    mk(any) { return {x: Math.random() * (this.W + 200) - 100, y: any ? Math.random() * this.H : -Math.random() * 120, l: 10 + Math.random() * 22, s: 700 + Math.random() * 600, a: .08 + Math.random() * .22, z: Math.random()}; }
    update() { const want = this.vis && !mq.matches; if (want && !this.run) { this.run = true; this.prev = 0; requestAnimationFrame(t => this.frame(t)); } else if (!want) this.run = false; }
    frame(t) {
      if (!this.run) { this.ctx.clearRect(0, 0, this.W, this.H); return; }
      const dt = Math.min((t - (this.prev || t)) / 1000, .05); this.prev = t;
      const boost = 1 + vel / 260, dens = clamp(.45 + vel / 900, .45, 1), wind = 90 + vel * .25;
      const c = this.ctx; c.clearRect(0, 0, this.W, this.H); c.lineCap = 'round';
      const n = Math.floor(this.drops.length * dens), floor = this.H * this.zone;
      for (let i = 0; i < n; i++) {
        const d = this.drops[i], sp = d.s * boost * (0.6 + d.z * .6);
        d.y += sp * dt; d.x += wind * dt * (0.5 + d.z);
        if (d.y > floor + d.z * (this.H - floor)) {
          if (Math.random() < .5) this.spl.push({x: d.x, y: d.y, r: 0, a: .35 * d.a / .3, life: 0});
          Object.assign(d, this.mk(false));
        }
        const L = d.l * (1 + vel / 400) * (0.6 + d.z * .8), ang = wind / sp;
        c.strokeStyle = `rgba(205,225,238,${Math.min(d.a * (0.7 + vel / 600), .5)})`; c.lineWidth = .6 + d.z * .9;
        c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x - L * ang, d.y - L); c.stroke();
      }
      for (let i = this.spl.length - 1; i >= 0; i--) {
        const s = this.spl[i]; s.life += dt * 3.2; if (s.life >= 1) { this.spl.splice(i, 1); continue; }
        c.strokeStyle = `rgba(205,225,238,${(1 - s.life) * s.a})`; c.lineWidth = .8;
        c.beginPath(); c.ellipse(s.x, s.y, 2 + s.life * 9, .8 + s.life * 2.4, 0, 0, Math.PI * 2); c.stroke();
      }
      if (this.spl.length > 260) this.spl.splice(0, this.spl.length - 260);
      vel *= Math.pow(.12, dt);
      requestAnimationFrame(tt => this.frame(tt));
    }
  }
  $$('canvas.rain').forEach(cv => new Rain(cv, cv.dataset.rain === 'hero' ? .78 : .7));

  /* exploded roof layers (pinned) */
  const lay = $('.layers'), lys = $$('.ly'), steps = $$('.layer-steps li'), layN = $('#lay-n'), tags = $$('.stack-tags li'), sw2 = $('.stack-wrap');
  let lastActive = -1;
  function layers() {
    if (!lay) return;
    const r = lay.getBoundingClientRect(), span = r.height - innerHeight;
    const p = clamp(-r.top / span, 0, 1);
    const mob = innerWidth < 900, sep = mob ? 36 : 62, drop = mob ? 180 : innerHeight < 800 ? 150 : 280;
    lys.forEach((l, i) => {
      const ap = i === 0 ? 1 : clamp(p * 5.4 - i + .6, 0, 1), e = 1 - Math.pow(1 - ap, 3);
      const spread = mq.matches ? 1 : (0.35 + 0.65 * clamp(p * 1.4, 0, 1));
      l.style.transform = `translateZ(${i * sep * spread + (1 - e) * drop}px)`;
      l.style.opacity = e;
    });
    if (innerWidth >= 900 && tags.length) {
      const wr = sw2.getBoundingClientRect();
      tags.forEach((t, i) => {
        const r = lys[i].getBoundingClientRect();
        // label sits on the right column, level with the layer's centre; a leader line reaches back to the layer's right edge
        const y = r.top + r.height * .42 - wr.top - 12;
        t.style.transform = `translateY(${y.toFixed(1)}px)`;
        t.style.opacity = lys[i].style.opacity;
        t.style.setProperty('--lw', Math.max(0, (wr.right - t.offsetWidth) - r.right - 6).toFixed(0) + 'px');
      });
    }
    const act = clamp(Math.floor(p * 5.4 + .4), 0, 4);
    if (act !== lastActive) {
      lastActive = act;
      steps.forEach((s, i) => { s.classList.toggle('on', i === act); s.classList.toggle('done', i < act); });
      layN.textContent = '0' + (act + 1);
      tags.forEach((t, i) => t.classList.toggle('on', i === act));
    }
  }

  /* process line */
  const pr = $('.process .wrap'), stl = $('.steps'), stepsEls = $$('.step');
  function proc() {
    if (!pr) return;
    pr.style.setProperty('--lt', stl.offsetTop + 'px');
    const r = stl.getBoundingClientRect();
    const pl = mq.matches ? 1 : clamp((innerHeight * .85 - r.top) / (innerHeight * .6), 0, 1);
    pr.style.setProperty('--pl', pl);
    stepsEls.forEach((s, i) => s.classList.toggle('lit', innerWidth < 900 ? s.getBoundingClientRect().top < innerHeight * .75 : pl >= i / 3 - .01));
  }

  /* parallax fallback */
  const noTL = !CSS.supports('animation-timeline: view()');
  const pxs = noTL ? $$('.pimg img, .qimg') : [];
  function parallaxFallback() {
    if (!noTL || mq.matches) return;
    pxs.forEach(img => { const r = img.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; const k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; img.style.transform = `translateY(${-k * 8 - 6}%)`; });
  }

  /* configurator UI state (3D module listens to roof:set) */
  const MATS = {
    sauma: {name: 'Konesaumapelti', paino: 'Kevyt', hinta: [75, 110], info: 'Saumat ovat koholla ja kiinnikkeet jäävät piiloon. Sopii sekä loiville että jyrkille katoille.'},
    tiilikuvio: {name: 'Tiilikuviopelti', paino: 'Kevyt', hinta: [70, 100], info: 'Tiilen näköinen profiili kevyenä peltinä. Perinteinen ilme ja nopea asentaa.'},
    kermi: {name: 'Bitumikermi', paino: 'Kevyt', hinta: [60, 90], info: 'Saumaton kate, joka sopii loiville katoille, autotalleille ja rivitaloihin.'},
    tiili: {name: 'Betonitiili', paino: 'Raskas', hinta: [90, 130], info: 'Painava kate vaimentaa sateen äänen. Kantava rakenne tarkistetaan ennen töitä.'}
  };
  const state = window.roofState = {mat: 'sauma', col: '#1f2124', weather: 'sun'};
  const emit = () => dispatchEvent(new CustomEvent('roof:set', {detail: {...state}}));
  const radio = (group, btn) => { $$('[role=radio]', group).forEach(b => b.setAttribute('aria-checked', b === btn)); };
  const matList = $('.mat-list'), sw = $('.swatches'), wx = $('.cfg-weather'), selMat = $('#c-mat');
  function setMat(m, from) {
    state.mat = m; const d = MATS[m];
    radio(matList, $(`[data-mat="${m}"]`, matList));
    $('#f-paino').textContent = d.paino; $('#f-hinta').textContent = `${d.hinta[0]}–${d.hinta[1]} €/m²`; $('#f-info').textContent = d.info;
    if (from !== 'calc') selMat.value = m;
    emit(); calc();
  }
  matList.addEventListener('click', e => { const b = e.target.closest('[data-mat]'); if (b) setMat(b.dataset.mat); });
  sw.addEventListener('click', e => { const b = e.target.closest('[data-col]'); if (!b) return; radio(sw, b); state.col = b.dataset.col; $('#col-name').textContent = b.dataset.name; emit(); });
  wx.addEventListener('click', e => { const b = e.target.closest('[data-weather]'); if (!b) return; radio(wx, b); state.weather = b.dataset.weather; emit(); });
  // arrow-key navigation inside radiogroups
  $$('[role=radiogroup]').forEach(g => g.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const bs = $$('[role=radio]', g), i = bs.indexOf(document.activeElement); if (i < 0) return;
    e.preventDefault(); const n = bs[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : bs.length - 1)) % bs.length]; n.focus(); n.click();
  }));
  $$('[role=radiogroup]').forEach(g => { const bs = $$('[role=radio]', g); const upd = () => bs.forEach(b => b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1); upd(); new MutationObserver(upd).observe(g, {subtree: true, attributes: true, attributeFilter: ['aria-checked']}); });

  /* calculator */
  const el = id => document.getElementById(id);
  const ala = el('c-ala'), kulma = el('c-kulma'), purku = el('c-purku'), kourut = el('c-kourut'), turva = el('c-turva'), hloSeg = $('.seg');
  let hlo = 2;
  const shown = {};
  function tween(id, val, fn) {
    const node = el(id), from = shown[id] ?? val; shown[id] = val;
    if (mq.matches || from === val) { node.textContent = fn(val); return; }
    const t0 = performance.now(), d = 520;
    const st = t => { const k = clamp((t - t0) / d, 0, 1), e = 1 - Math.pow(1 - k, 3); node.textContent = fn(from + (val - from) * e); if (k < 1 && shown[id] === val) requestAnimationFrame(st); };
    requestAnimationFrame(st);
  }
  const fill = r => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%');
  function calc() {
    const A = +ala.value, deg = +kulma.value, rad = deg * Math.PI / 180;
    el('o-ala').textContent = A + ' m²'; el('o-kulma').textContent = deg + '°';
    fill(ala); fill(kulma);
    const ay = 44 - 40 * Math.tan(rad) * .9; el('pitch-path').setAttribute('d', `M10 44 60 ${ay.toFixed(1)} 110 44`);
    const roof = A / Math.cos(rad) * 1.12;
    const [lo, hi] = MATS[state.mat].hinta;
    let L = roof * lo, H = roof * hi;
    if (purku.checked) { L += roof * 12; H += roof * 20; }
    if (kourut.checked) { const side = Math.sqrt(A * 1.6), len = 2 * (side + 1); L += len * 38; H += len * 58; }
    if (turva.checked) { L += 900; H += 1600; }
    const r100 = x => Math.round(x / 100) * 100;
    L = r100(L); H = r100(H);
    const mid = (L + H) / 2, work = mid * .45;
    const pp = clamp(.4 * work / hlo - 150, 0, 2100), vah = r100(pp * hlo), net = r100(mid - vah);
    tween('r-ala', roof, x => fmt(x) + ' m²');
    const node = el('r-hinta'), fromL = shown.L ?? L, fromH = shown.H ?? H; shown.L = L; shown.H = H;
    if (mq.matches) node.textContent = `${fmt(L)} – ${fmt(H)} €`;
    else { const t0 = performance.now(); const st = t => { const k = clamp((t - t0) / 520, 0, 1), e = 1 - Math.pow(1 - k, 3); node.textContent = `${fmt(r100(fromL + (L - fromL) * e))} – ${fmt(r100(fromH + (H - fromH) * e))} €`; if (k < 1 && shown.L === L && shown.H === H) requestAnimationFrame(st); }; requestAnimationFrame(st); }
    tween('r-vah', vah, x => '−' + fmt(r100(x)) + ' €');
    tween('r-net', net, x => fmt(r100(x)) + ' €');
    el('r-bar-work').style.width = '45%'; el('r-bar-mat').style.width = '55%';
  }
  [ala, kulma].forEach(r => r.addEventListener('input', calc));
  [purku, kourut, turva].forEach(c => c.addEventListener('change', calc));
  selMat.addEventListener('change', () => setMat(selMat.value, 'calc'));
  hloSeg.addEventListener('click', e => { const b = e.target.closest('[data-hlo]'); if (!b) return; radio(hloSeg, b); hlo = +b.dataset.hlo; calc(); });
  calc();

  /* form demo */
  const form = $('#lomake'), status = $('#lomake-tila');
  form.addEventListener('submit', e => { if (!form.dataset.endpoint) { e.preventDefault(); status.hidden = false; status.focus(); } });

  /* mobile callbar */
  const cb = $('.callbar'), ctas = $('.hero-ctas');
  new IntersectionObserver(([en]) => cb.classList.toggle('show', !en.isIntersecting && en.boundingClientRect.top < 0)).observe(ctas);
  // keep the call bar out of the way of the 3D stage and the pinned layer animation
  const busy = new Set();
  const bio = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? busy.add(e.target) : busy.delete(e.target)); cb.classList.toggle('away', busy.size > 0); }, {threshold: 0, rootMargin: '-10% 0px -10% 0px'});
  [$('.cfg-stage'), $('.layers'), $('.result')].forEach(x => x && bio.observe(x));

  /* load the 3D configurator (three.js ~680 kB) only when it approaches the viewport */
  const stageEl = $('.cfg-stage');
  const lio = new IntersectionObserver(([e]) => { if (!e.isIntersecting) return; lio.disconnect(); import('./roof3d.js').catch(() => { ['#roof3d', '.cfg-weather', '.cfg-zoom', '.cfg-hint'].forEach(q => $(q).hidden = true); $('.cfg-fallback').hidden = false; $('.cfg-fallback-note').hidden = false; }); }, {rootMargin: '900px 0px'});
  lio.observe(stageEl);

  addEventListener('resize', () => { layers(); proc(); });
  onScroll();
})();
