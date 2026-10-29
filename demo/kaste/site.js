(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const FINE = matchMedia('(hover:hover) and (pointer:fine)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const nf = new Intl.NumberFormat('fi-FI');

  /* ---------- menu ---------- */
  const menu = $('#menu'), mbtn = $('.menu-btn');
  const setMenu = o => { menu.classList.toggle('open', o); mbtn.setAttribute('aria-expanded', o); mbtn.setAttribute('aria-label', o ? 'Sulje valikko' : 'Avaa valikko'); if (o) hdr.classList.add('solid'); };
  mbtn.addEventListener('click', () => { const o = mbtn.getAttribute('aria-expanded') !== 'true'; setMenu(o); if (o) menu.querySelector('a').focus(); });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && mbtn.getAttribute('aria-expanded') === 'true') { setMenu(false); mbtn.focus(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.nav')) setMenu(false); });

  /* ---------- header + progress ---------- */
  const hdr = $('header'), bar = $('.progress');
  let lastY = scrollY;
  function onScrollUI() {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    hdr.classList.toggle('solid', y > 40 || menu.classList.contains('open'));
    if (!menu.classList.contains('open')) {
      if (y > lastY + 6 && y > 160) hdr.classList.add('hide');
      else if (y < lastY - 6 || y < 160) hdr.classList.remove('hide');
    }
    lastY = y;
  }

  /* ---------- split headline ---------- */
  function splitWords(el) {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(t => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.textContent = t; w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    $$('.w>span', el).forEach((s, k) => s.style.transitionDelay = (0.12 + k * 0.075) + 's');
  }
  $$('[data-split]').forEach(splitWords);
  requestAnimationFrame(() => requestAnimationFrame(() => { $$('[data-split]').forEach(e => e.classList.add('go')); $('.hero').classList.add('go'); }));

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold: .14, rootMargin: '0px 0px -6% 0px'});
  $$('.rv').forEach(el => io.observe(el));

  /* ---------- counters ---------- */
  function tween(from, to, dur, cb, done) {
    if (RM.matches) { cb(to); done && done(); return; }
    const t0 = performance.now();
    const step = now => { const p = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3); cb(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); else done && done(); };
    requestAnimationFrame(step);
  }
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count;
    tween(0, to, 1700, v => el.textContent = nf.format(Math.round(v)));
  }), {threshold: .6});
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- magnetic buttons ---------- */
  $$('.mag').forEach(b => {
    b.addEventListener('pointermove', e => {
      if (!FINE.matches || RM.matches) return;
      const r = b.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      b.style.transform = `translate(${x * .18}px,${y * .28}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transition = 'transform .5s cubic-bezier(.2,.7,.15,1),background .25s'; b.style.transform = ''; setTimeout(() => b.style.transition = '', 500); });
  });

  /* ---------- before / after ---------- */
  const ba = $('#ba');
  if (ba) {
    let pos = 50, drag = false, touched = false;
    const set = (p, user) => {
      pos = clamp(p, 0, 100); ba.style.setProperty('--p', pos + '%');
      ba.setAttribute('aria-valuenow', Math.round(pos));
      ba.setAttribute('aria-valuetext', `${100 - Math.round(pos)} prosenttia remontin jälkeen`);
      if (user) touched = true;
    };
    const fromEvent = e => { const r = ba.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100, true); };
    ba.addEventListener('pointerdown', e => { drag = true; ba.setPointerCapture(e.pointerId); fromEvent(e); });
    ba.addEventListener('pointermove', e => { if (drag) fromEvent(e); });
    const up = () => drag = false;
    ba.addEventListener('pointerup', up); ba.addEventListener('pointercancel', up);
    ba.addEventListener('keydown', e => {
      const k = e.key, s = e.shiftKey ? 10 : 4;
      if (k === 'ArrowLeft' || k === 'ArrowDown') { set(pos - s, true); e.preventDefault(); }
      else if (k === 'ArrowRight' || k === 'ArrowUp') { set(pos + s, true); e.preventDefault(); }
      else if (k === 'Home') { set(0, true); e.preventDefault(); } else if (k === 'End') { set(100, true); e.preventDefault(); }
    });
    set(50);
    // automatic peek when it first comes into view
    const pio = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting || RM.matches) return; pio.disconnect();
      const seq = [[50, 18, 900], [18, 82, 1300], [82, 50, 900]];
      let i = 0;
      const run = () => { if (touched || i >= seq.length) return; const [a, b, d] = seq[i++]; tween(a, b, d, v => { if (!touched) set(v); }, () => setTimeout(run, 120)); };
      setTimeout(run, 500);
    }, {threshold: .55});
    pio.observe(ba);
  }

  /* ---------- pinned story ---------- */
  const story = $('#story');
  const stages = story ? $$('.stage', story) : [], simgs = story ? $$('.story-media img', story) : [];
  const scount = story && $('.story-count', story), scap = story && $('.cap', story), sol = story && $('.stages', story);
  let sIdx = 0;
  function onStory() {
    if (!story) return;
    const r = story.getBoundingClientRect(), span = r.height - innerHeight;
    const p = clamp(-r.top / span, 0, 1);
    document.body.classList.toggle('story-on', r.top < 1 && r.bottom > innerHeight - 1);
    sol.style.setProperty('--sp', p.toFixed(4));
    const i = Math.min(stages.length - 1, Math.floor(p * stages.length * 0.999));
    if (i !== sIdx) {
      sIdx = i;
      stages.forEach((s, k) => s.classList.toggle('on', k === i));
      simgs.forEach((m, k) => m.classList.toggle('on', k === i));
      scount.textContent = '0' + (i + 1);
      scap.innerHTML = `<b>Vaihe ${i + 1}</b><span>${stages[i].querySelector('h3').lastChild.textContent}</span>`;
    }
  }

  /* ---------- parallax fallback ---------- */
  const noTimeline = !(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()'));
  const pars = $$('.par');
  function onPar() {
    if (!noTimeline || RM.matches) return;
    pars.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > innerHeight + 100) return;
      const p = clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1);
      img.style.transform = `translateY(${(p - .5) * 12}%)`;
    });
  }

  /* ---------- callbar ---------- */
  const cb = $('.callbar'), ctas = $('.hero-ctas');
  new IntersectionObserver(([en]) => cb.classList.toggle('show', !en.isIntersecting && en.boundingClientRect.top < 0)).observe(ctas);

  /* ---------- scroll loop ---------- */
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScrollUI(); onStory(); onPar(); }); } }, {passive: true});
  addEventListener('resize', () => { onStory(); onPar(); fogSize && fogSize(); });
  onScrollUI(); onStory(); onPar();

  /* ---------- form (demo) ---------- */
  const form = $('#lomake'), st = $('#lomake-tila');
  form.addEventListener('submit', e => { if (!form.dataset.endpoint) { e.preventDefault(); st.hidden = false; st.focus(); } });

  /* ---------- calculator ---------- */
  const m2 = $('#c-m2'), om2 = $('#o-m2'), heat = $('#c-heat'), sauna = $('#c-sauna');
  const rP = $('#r-price'), rT = $('#r-time'), rD = $('#r-ded'), rSum = $('#r-sum');
  const cur = {lo: 0, hi: 0, ded: 0};
  const r100 = v => Math.round(v / 100) * 100;
  function calc() {
    const a = +m2.value, prem = $('input[name=lvl]:checked').value === 'premium', pers = +$('input[name=pers]:checked').value;
    om2.textContent = nf.format(a) + ' m²';
    m2.style.setProperty('--v', ((a - m2.min) / (m2.max - m2.min) * 100) + '%');
    let lo = 6000 + a * 1400, hi = 8000 + a * 2000;
    if (prem) { lo = lo * 1.15 + a * 350; hi = hi * 1.15 + a * 500; }
    if (heat.checked) { lo += 500 + a * 70; hi += 800 + a * 110; }
    if (sauna.checked) { lo += 4500; hi += 7500; }
    lo = r100(lo); hi = r100(hi);
    const wk = 3 + a * .12 + (sauna.checked ? 1 : 0) + (prem ? .5 : 0);
    rT.textContent = `${Math.floor(wk)}–${Math.ceil(wk + 1)} vk`;
    const dedOf = total => r100(pers * clamp(.4 * (total * .5 / pers) - 150, 0, 2100));
    const dLo = dedOf(lo), dHi = dedOf(hi);
    const f = {lo: cur.lo, hi: cur.hi, dLo: cur.dLo || 0, dHi: cur.dHi || 0};
    Object.assign(cur, {lo, hi, dLo, dHi});
    const rng = (a, b) => a === b ? `${nf.format(a)} €` : `${nf.format(a)}–${nf.format(b)} €`;
    tween(0, 1, 650, k => {
      const L = (a, b) => r100(a + (b - a) * k);
      rP.textContent = rng(L(f.lo, lo), L(f.hi, hi));
      rD.textContent = rng(L(f.dLo, dLo), L(f.dHi, dHi));
    }, () => {
      clearTimeout(calc.t);
      calc.t = setTimeout(() => { rSum.textContent = `Arvio: ${rng(lo, hi)}, kesto ${rT.textContent}, kotitalousvähennys arviolta ${rng(dLo, dHi)}.`; }, 250);
    });
  }
  $('#calc').addEventListener('input', calc);
  $$('input[name=pers]').forEach(r => r.addEventListener('change', calc));
  const calcIo = new IntersectionObserver(([en]) => { if (en.isIntersecting) { calcIo.disconnect(); calc(); } }, {threshold: .3});
  calcIo.observe($('.calc'));
  // set initial text without animation for no-JS-observer case
  window.__kasteCalc = calc;

  /* ---------- hero video vs reduced motion ---------- */
  const hv = $('#hero-video');
  const rmVideo = () => { if (!hv) return; if (RM.matches) { hv.pause(); hv.classList.remove('on'); } else { const pp = hv.play(); pp && pp.catch && pp.catch(() => {}); } };
  RM.addEventListener('change', rmVideo); rmVideo();
  if (hv) hv.addEventListener('playing', () => { if (RM.matches) rmVideo(); });

  /* ---------- fog / condensation canvas ---------- */
  const fogSec = $('.fog'), cv = $('#fog');
  let fogSize = null;
  if (fogSec && cv && cv.getContext) {
    const ctx = cv.getContext('2d');
    const src = $('.bgimg', fogSec);
    const blurC = document.createElement('canvas'), bctx = blurC.getContext('2d');
    const maskC = document.createElement('canvas'), mctx = maskC.getContext('2d');
    const tiny = document.createElement('canvas'), tctx = tiny.getContext('2d');
    let W = 0, H = 0, dpr = 1, drops = [], running = false, visible = false, raf = 0, last = 0, ptr = null, ready = false;
    const rnd = (a, b) => a + Math.random() * (b - a);
    function cover(w, h, iw, ih) { const s = Math.max(w / iw, h / ih); return [ (w - iw * s) / 2, (h - ih * s) / 2, iw * s, ih * s ]; }
    function bake() {
      if (!src.naturalWidth) return;
      blurC.width = cv.width; blurC.height = cv.height;
      // cheap cross-browser blur: downscale then upscale
      tiny.width = Math.max(8, Math.round(cv.width / 18)); tiny.height = Math.max(8, Math.round(cv.height / 18));
      tctx.imageSmoothingQuality = 'high';
      const [x, y, w, h] = cover(tiny.width, tiny.height, src.naturalWidth, src.naturalHeight);
      tctx.drawImage(src, x, y, w, h);
      bctx.imageSmoothingEnabled = true; bctx.imageSmoothingQuality = 'high';
      bctx.drawImage(tiny, 0, 0, blurC.width, blurC.height);
      bctx.fillStyle = 'rgba(178,192,196,.30)'; bctx.fillRect(0, 0, blurC.width, blurC.height);
      // micro condensation speckle
      const n = Math.round(blurC.width * blurC.height / 900);
      for (let i = 0; i < n; i++) {
        const px = Math.random() * blurC.width, py = Math.random() * blurC.height, r = Math.random() * 1.6 * dpr + .3;
        bctx.fillStyle = `rgba(255,255,255,${rnd(.05, .22)})`; bctx.beginPath(); bctx.arc(px, py, r, 0, 6.283); bctx.fill();
      }
      ready = true;
    }
    fogSize = function () {
      const w = fogSec.clientWidth, h = fogSec.clientHeight; dpr = Math.min(devicePixelRatio || 1, 1.5);
      if (w === W && h === H) return; W = w; H = h;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      maskC.width = Math.round(w / 2); maskC.height = Math.round(h / 2);
      mctx.fillStyle = '#000'; mctx.fillRect(0, 0, maskC.width, maskC.height);
      drops = Array.from({length: Math.max(10, Math.round(w / 64))}, () => mkDrop(true));
      bake(); draw(0);
    };
    function mkDrop(init) { const y = init ? rnd(-H * .2, H * .9) : rnd(-60, -10); return {x: rnd(0, W), y, r: rnd(2.4, 5.2), v: 0, hold: rnd(0, 2.5), tail: []}; }
    function trail(x0, y0, x1, y1, w) { // soft partial clear: water film, not a dry stripe
      mctx.globalCompositeOperation = 'destination-out';
      mctx.lineCap = 'round'; mctx.lineWidth = w / 2; mctx.strokeStyle = 'rgba(0,0,0,.42)';
      mctx.beginPath(); mctx.moveTo(x0 / 2, y0 / 2); mctx.lineTo(x1 / 2, y1 / 2); mctx.stroke();
      mctx.globalCompositeOperation = 'source-over';
    }
    function clearAt(x, y, r) { // in CSS px, mask is half-res
      mctx.globalCompositeOperation = 'destination-out';
      const g = mctx.createRadialGradient(x / 2, y / 2, 0, x / 2, y / 2, r / 2);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.65, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      mctx.fillStyle = g; mctx.beginPath(); mctx.arc(x / 2, y / 2, r / 2, 0, 6.283); mctx.fill();
      mctx.globalCompositeOperation = 'source-over';
    }
    function draw(dt) {
      if (!ready) return;
      // fog slowly creeps back
      mctx.globalCompositeOperation = 'source-over';
      mctx.fillStyle = `rgba(0,0,0,${Math.min(.012, dt * .18)})`; mctx.fillRect(0, 0, maskC.width, maskC.height);
      // droplets: stick-slip sliding, clearing a trail
      for (const d of drops) {
        if (d.hold > 0) { d.hold -= dt; continue; }
        d.v = Math.min(d.v + dt * rnd(60, 160), 140 + d.r * 18);
        if (Math.random() < dt * 1.4) { d.hold = rnd(.3, 1.8); d.v = 0; }
        const px = d.x, py = d.y;
        d.y += d.v * dt; d.x += Math.sin(d.y * .05) * .15;
        trail(px, py - d.r * .6, d.x, d.y - d.r * .6, d.r * 1.05);
        d.tail.push(d.x, d.y); if (d.tail.length > 64) d.tail.splice(0, 2);
        if (d.y > H + 20) Object.assign(d, mkDrop(false));
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(blurC, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(maskC, 0, 0, cv.width, cv.height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineCap = 'round';
      for (const d of drops) {
        const x = d.x * dpr, y = d.y * dpr, r = d.r * dpr, t = d.tail;
        // thin glinting edge along the wet trail (light catching the water film)
        if (t.length > 4) {
          ctx.lineWidth = Math.max(1, r * .22);
          const g0 = ctx.createLinearGradient(0, t[1] * dpr, 0, y);
          g0.addColorStop(0, 'rgba(235,245,246,0)'); g0.addColorStop(1, 'rgba(235,245,246,.28)');
          ctx.strokeStyle = g0; ctx.beginPath(); ctx.moveTo((t[0] + d.r * .35) * dpr, t[1] * dpr);
          for (let i = 2; i < t.length; i += 2) ctx.lineTo((t[i] + d.r * .35) * dpr, t[i + 1] * dpr);
          ctx.stroke();
        }
        // the drop: clear lens, bright specular top-left, soft caustic bottom
        const body = ctx.createRadialGradient(x, y + r * .25, r * .2, x, y, r * 1.05);
        body.addColorStop(0, 'rgba(255,255,255,.05)'); body.addColorStop(.7, 'rgba(255,255,255,.10)'); body.addColorStop(1, 'rgba(235,245,246,.55)');
        ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(x, y, r * .88, r, 0, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(x - r * .32, y - r * .38, r * .22, r * .16, -.6, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(255,250,235,.35)'; ctx.beginPath(); ctx.ellipse(x + r * .1, y + r * .55, r * .4, r * .14, 0, 0, 6.283); ctx.fill();
      }
    }
    function frame(now) {
      if (!running) return;
      const dt = Math.min((now - (last || now)) / 1000, .05); last = now;
      draw(dt); raf = requestAnimationFrame(frame);
    }
    function upd() {
      const want = visible && !RM.matches && ready;
      if (want && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); }
      if (!want && running) { running = false; cancelAnimationFrame(raf); }
    }
    function wipe(e) {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const rad = e.pointerType === 'touch' ? 70 : 62;
      if (ptr) { const dx = x - ptr.x, dy = y - ptr.y, n = Math.ceil(Math.hypot(dx, dy) / 10); for (let i = 1; i <= n; i++) clearAt(ptr.x + dx * i / n, ptr.y + dy * i / n, rad); }
      else clearAt(x, y, rad);
      ptr = {x, y};
    }
    cv.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) wipe(e); });
    cv.addEventListener('pointerdown', e => { ptr = null; wipe(e); });
    cv.addEventListener('pointerleave', () => ptr = null);
    cv.addEventListener('pointerup', () => ptr = null);
    const start = () => { fogSize(); bake(); upd(); };
    if (src.complete && src.naturalWidth) start(); else { src.loading = 'eager'; src.addEventListener('load', start, {once: true}); }
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !ready) start(); upd(); }, {rootMargin: '200px'}).observe(fogSec);
    RM.addEventListener('change', upd);
  }
})();
