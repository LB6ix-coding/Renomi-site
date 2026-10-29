(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => RM.matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fmt = (n, d = 0) => n.toLocaleString('fi-FI', {minimumFractionDigits: d, maximumFractionDigits: d});

  /* ---------- menu ---------- */
  const nav = $('#menu'), mbtn = $('.menu-btn');
  const setMenu = o => { nav.classList.toggle('open', o); mbtn.setAttribute('aria-expanded', o); mbtn.setAttribute('aria-label', o ? 'Sulje valikko' : 'Avaa valikko'); if (o) hdr.classList.add('solid'); };
  mbtn.addEventListener('click', () => { const o = mbtn.getAttribute('aria-expanded') !== 'true'; setMenu(o); if (o) nav.querySelector('a').focus(); });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && mbtn.getAttribute('aria-expanded') === 'true') { setMenu(false); mbtn.focus(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.nav')) setMenu(false); });
  matchMedia('(min-width:761px)').addEventListener('change', m => { if (m.matches) setMenu(false); });

  /* ---------- header hide/show + progress ---------- */
  const hdr = $('.hdr'), prog = $('.progress span');
  let lastY = scrollY, vel = 0;
  function onScroll() {
    const y = scrollY, dy = y - lastY; lastY = y;
    vel = clamp(vel + Math.abs(dy) * .4, 0, 80);
    hdr.classList.toggle('solid', y > 40 || nav.classList.contains('open'));
    if (y > 300 && dy > 4 && !nav.classList.contains('open')) hdr.classList.add('hide');
    else if (dy < -4 || y < 300) hdr.classList.remove('hide');
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    heroLift(); flow(); bandPar();
  }
  addEventListener('scroll', onScroll, {passive: true});
  $$('a[href^="#"]').forEach(a => a.addEventListener('focus', () => hdr.classList.remove('hide')));

  /* ---------- split headline ---------- */
  const h1 = $('.split');
  (function split(el) {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(t => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
            const i = document.createElement('span'); i.textContent = t; w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    $$('.w>span', el).forEach((s, k) => s.style.transitionDelay = (0.12 + k * 0.08) + 's');
  })(h1);
  const hero = $('.hero');
  requestAnimationFrame(() => requestAnimationFrame(() => { h1.classList.add('in'); hero.classList.add('ready'); }));

  /* ---------- hero lift on scroll ---------- */
  const heroCopy = $('.hero-copy');
  function heroLift() {
    if (reduced()) return;
    const h = hero.offsetHeight, p = clamp(scrollY / (h * .8), 0, 1);
    if (p >= 1 && heroCopy._p === 1) return; heroCopy._p = p;
    heroCopy.style.transform = p ? `translate3d(0,${-p * 70}px,0)` : '';
    heroCopy.style.opacity = p ? 1 - p * .8 : '';
  }

  /* ---------- reveals + counters ---------- */
  $$('.svc-grid,.job-list,.steps,.band-grid,.faq-list').forEach(g => $$('.reveal', g).forEach((el, i) => el.style.setProperty('--d', (i % 6) * 0.08 + 's')));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold: .14, rootMargin: '0px 0px -40px 0px'});
  $$('.reveal').forEach(el => io.observe(el));
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, from = +(el.dataset.from || 0);
    if (reduced()) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1600;
    const step = now => { const k = clamp((now - t0) / dur, 0, 1), ease = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(from + (to - from) * ease); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), {threshold: .6});
  $$('[data-count]').forEach(el => { if (!reduced()) el.textContent = el.dataset.from || 0; cio.observe(el); });

  /* ---------- magnetic buttons + card glow ---------- */
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  $$('.mag').forEach(b => {
    b.addEventListener('pointermove', e => { if (!fine.matches || reduced()) return; const r = b.getBoundingClientRect(); const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2; b.style.transform = `translate(${x * .18}px,${y * .28}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
  $$('.glow').forEach(c => c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--x', e.clientX - r.left + 'px'); c.style.setProperty('--y', e.clientY - r.top + 'px'); }));

  /* ---------- marquee (speeds up with scroll velocity) ---------- */
  const track = $('.marquee-track');
  let mx = 0, mPrev = 0, mRun = false;
  function marquee(now) {
    if (!mRun) return;
    const dt = Math.min((now - (mPrev || now)) / 1000, .05); mPrev = now;
    vel *= Math.pow(.04, dt);
    mx -= (60 + vel * 9) * dt;
    const half = track.scrollWidth / 2; if (-mx >= half) mx += half;
    track.style.transform = `translate3d(${mx}px,0,0)`;
    requestAnimationFrame(marquee);
  }
  new IntersectionObserver(([e]) => { const want = e.isIntersecting && !reduced(); if (want && !mRun) { mRun = true; mPrev = 0; requestAnimationFrame(marquee); } else if (!want) mRun = false; }).observe($('.marquee'));

  /* ---------- canvas helper ---------- */
  function fitCanvas(cv, ctx) { const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); cv.width = Math.max(1, r.width * d); cv.height = Math.max(1, r.height * d); ctx.setTransform(d, 0, 0, d, 0, 0); return [r.width, r.height]; }
  function loopWhenVisible(el, frame) {
    let run = false, vis = false, raf = 0, prev = 0;
    const tick = now => { if (!run) return; const dt = Math.min((now - (prev || now)) / 1000, .05); prev = now; frame(dt, now); raf = requestAnimationFrame(tick); };
    const upd = () => { const want = vis && !reduced() && !document.hidden; if (want && !run) { run = true; prev = 0; raf = requestAnimationFrame(tick); } if (!want && run) { run = false; cancelAnimationFrame(raf); } };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; upd(); }).observe(el);
    document.addEventListener('visibilitychange', upd); RM.addEventListener('change', upd);
  }

  /* ---------- hero: warm light motes drifting toward the pointer ---------- */
  (() => {
    const cv = $('#sparks'), ctx = cv.getContext('2d');
    let W = 0, H = 0, pts = [], px = -999, py = -999;
    const make = () => ({x: Math.random() * W, y: H * (.2 + Math.random() * .8), r: .6 + Math.random() * 1.8, vy: 6 + Math.random() * 16, a: .2 + Math.random() * .5, ph: Math.random() * 6.3});
    const size = () => { [W, H] = fitCanvas(cv, ctx); pts = Array.from({length: Math.round(W * H / 16000)}, make); };
    size(); addEventListener('resize', size);
    hero.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; });
    hero.addEventListener('pointerleave', () => { px = py = -999; });
    loopWhenVisible(hero, (dt) => {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.ph += dt; p.y -= p.vy * dt * (1 + vel / 40); p.x += Math.sin(p.ph) * 6 * dt;
        const dx = p.x - px, dy = p.y - py, d2 = dx * dx + dy * dy;
        let boost = 0; if (d2 < 22000) { boost = 1 - d2 / 22000; p.x += dx * .9 * dt; p.y += dy * .9 * dt; }
        if (p.y < -10) Object.assign(p, make(), {y: H + 10});
        const a = Math.min(1, p.a * (0.6 + .4 * Math.sin(p.ph * 2)) + boost * .6);
        ctx.beginPath(); ctx.fillStyle = `rgba(255,${200 + boost * 40 | 0},${120 + boost * 60 | 0},${a})`;
        ctx.shadowColor = 'rgba(255,190,100,.9)'; ctx.shadowBlur = 8 + boost * 10;
        ctx.arc(p.x, p.y, p.r + boost * 1.4, 0, 6.283); ctx.fill();
      }
      ctx.shadowBlur = 0;
    });
  })();

  /* ---------- services: circuit traces with travelling current pulses ---------- */
  (() => {
    const sec = $('.services'), cv = $('#circuit'), ctx = cv.getContext('2d');
    let W = 0, H = 0, traces = [], pulses = [], px = -9999, py = -9999;
    function build() {
      [W, H] = fitCanvas(cv, ctx);
      traces = []; pulses = [];
      const G = 28, n = Math.round(W * H / 52000);
      for (let i = 0; i < n; i++) {
        let x = Math.round(Math.random() * W / G) * G, y = Math.round(Math.random() * H / G) * G;
        const pts = [[x, y]], segs = 3 + (Math.random() * 4 | 0);
        let dir = Math.random() < .5 ? 0 : 1;
        for (let s = 0; s < segs; s++) {
          const len = G * (2 + (Math.random() * 6 | 0)), sg = Math.random() < .5 ? -1 : 1;
          if (dir === 0) x += len * sg; else y += len * sg;
          pts.push([x, y]);
          if (Math.random() < .45) { const j = Math.random() < .5 ? -1 : 1; x += G * (dir === 0 ? sg : j); y += G * (dir === 0 ? j : sg); pts.push([x, y]); }
          dir = 1 - dir;
        }
        let L = 0; const acc = [0]; for (let k = 1; k < pts.length; k++) { L += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); acc.push(L); }
        traces.push({pts, L, acc});
      }
      traces.forEach((t, i) => { if (i % 2 === 0) pulses.push({t, s: Math.random() * t.L, v: 90 + Math.random() * 140}); });
    }
    const at = (t, s) => { for (let k = 1; k < t.pts.length; k++) if (s <= t.acc[k]) { const f = (s - t.acc[k - 1]) / (t.acc[k] - t.acc[k - 1] || 1), a = t.pts[k - 1], b = t.pts[k]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; } return t.pts[t.pts.length - 1]; };
    build(); let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
    sec.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; });
    sec.addEventListener('pointerleave', () => { px = py = -9999; });
    loopWhenVisible(sec, dt => {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(120,132,150,.16)';
      for (const t of traces) { ctx.beginPath(); t.pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); const e = t.pts[t.pts.length - 1]; ctx.fillStyle = 'rgba(120,132,150,.28)'; ctx.fillRect(e[0] - 2, e[1] - 2, 4, 4); }
      for (const p of pulses) {
        p.s += p.v * dt * (1 + vel / 30); if (p.s > p.t.L) p.s = 0;
        const [x, y] = at(p.t, p.s), d = Math.hypot(x - px, y - py), boost = d < 220 ? 1 - d / 220 : 0;
        const tailN = 10;
        for (let k = 0; k < tailN; k++) {
          const [tx, ty] = at(p.t, Math.max(0, p.s - k * 5)), a = (1 - k / tailN) * (.35 + boost * .65);
          ctx.fillStyle = `rgba(255,${207 + boost * 48 | 0},${122 - boost * 40 | 0},${a})`;
          ctx.beginPath(); ctx.arc(tx, ty, 1.6 + boost * 1.6 - k * .1, 0, 6.283); ctx.fill();
        }
      }
    });
  })();

  /* ---------- range fill helper ---------- */
  const paint = r => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%');
  $$('input[type=range]').forEach(r => { paint(r); r.addEventListener('input', () => paint(r)); });

  /* ---------- light switch tool ---------- */
  (() => {
    const sw = $('#lightSwitch'), dim = $('#dimmer'), kel = $('#kelvin'), lit = $('#roomLit'), tint = $('#roomTint');
    const darkImg = $('.room-dark'), sec = $('#valaistus'), room = $('.room'), state = $('#switchState'), cap = $('#roomCap'), live = $('#lightLive');
    const dOut = $('#dimOut'), kOut = $('#kOut');
    let on = false, liveT;
    const warmCol = [255, 150, 60], coolCol = [150, 190, 255];
    function render(announce) {
      const d = dim.value / 100, k = (kel.value - 2700) / 1300;
      const op = on ? (0.12 + 0.88 * d) : 0;
      lit.style.opacity = op; room.style.setProperty('--op', op);
      const c = warmCol.map((v, i) => Math.round(v + (coolCol[i] - v) * k));
      tint.style.background = `rgb(${c.join(',')})`;
      tint.style.opacity = on ? ((.36 + k * .14) * (0.5 + d * .5)) : 0;
      lit.style.filter = `saturate(${1.08 - k * .3}) hue-rotate(${-6 + k * 16}deg) brightness(${0.92 + d * .12})`;
      sec.style.setProperty('--lux', on ? (0.25 + d * .75) * (1 - k * .35) : 0);
      dOut.textContent = dim.value + ' %'; kOut.textContent = kel.value + ' K';
      $$('.lights .ctrl').forEach(c => c.classList.toggle('off', !on));
      const txt = on ? `Valot päällä, ${dim.value} %, ${kel.value} K` : 'Valot pois';
      state.textContent = on ? 'Valot päällä' : 'Valot pois'; cap.textContent = txt;
      darkImg.alt = on ? `Olohuone illalla, valot päällä ${dim.value} %, värilämpötila ${kel.value} K (kuvituskuva)` : 'Olohuone illalla valot sammutettuina (kuvituskuva)';
      sw.setAttribute('aria-label', 'Valokatkaisija, ' + (on ? 'valot päällä' : 'valot pois'));
      if (announce) { clearTimeout(liveT); liveT = setTimeout(() => live.textContent = txt, 250); }
    }
    sw.addEventListener('click', () => {
      on = !on; sw.setAttribute('aria-pressed', on);
      if (on && !reduced()) { room.classList.remove('flick'); void room.offsetWidth; room.classList.add('flick'); }
      if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) {}
      render(true);
    });
    room.addEventListener('animationend', () => room.classList.remove('flick'));
    [dim, kel].forEach(r => r.addEventListener('input', () => { if (!on) { on = true; sw.setAttribute('aria-pressed', 'true'); } render(true); }));
    render(false);
    // hint: the switch pulses gently until the visitor first uses the tool
    let used = false;
    const stopHint = () => { used = true; sw.classList.remove('hint'); };
    [sw, dim, kel].forEach(el => el.addEventListener('pointerdown', stopHint, {once: true}));
    sw.addEventListener('click', stopHint); [dim, kel].forEach(el => el.addEventListener('input', stopHint));
    new IntersectionObserver(([e]) => { if (!used) sw.classList.toggle('hint', e.isIntersecting); }, {threshold: .4}).observe(room);
  })();

  /* ---------- pinned circuit flow ---------- */
  const flowSec = $('.flow'), wires = $$('.fs-wire'), steps = $$('.flow-steps li'), pct = $('#flowPct');
  const nodes = [$('.n0'), $('.n1'), $('.n2'), $('.n3')];
  wires.forEach(w => { const L = w.getTotalLength(); w.style.setProperty('--len', L); w._L = L; });
  function flow() {
    { const r = flowSec.getBoundingClientRect(); document.body.classList.toggle('pinned', r.top <= 0 && r.bottom >= innerHeight); }
    let p;
    if (reduced()) p = 1;
    else { const r = flowSec.getBoundingClientRect(), span = flowSec.offsetHeight - innerHeight; p = clamp(-r.top / (span || 1), 0, 1); }
    if (flowSec._p === p) return; flowSec._p = p;
    const wp = clamp((p - .1) / .78, 0, 1);
    // one wire at a time: w2 pistorasiat (step Johdotus), w1 valaistus, w3 latausasema
    const seq = [[1, 0, 1 / 3], [0, 1 / 3, 2 / 3], [2, 2 / 3, 1]];
    seq.forEach(([i, a, b]) => { const k = clamp((wp - a) / (b - a), 0, 1); wires[i].style.strokeDashoffset = wires[i]._L * (1 - k); });
    const stage = p < .1 ? 0 : Math.min(3, 1 + Math.floor(wp * 3 - 1e-9));
    nodes[0].classList.toggle('lit', p > .04);
    nodes[1].classList.toggle('lit', wp >= 1 / 3);
    nodes[2].classList.toggle('lit', wp >= 2 / 3);
    nodes[3].classList.toggle('lit', wp >= 1);
    steps.forEach((s, i) => { s.classList.toggle('on', i === stage); s.classList.toggle('done', i < stage); });
    pct.textContent = Math.round(wp * 100);
  }

  /* ---------- parallax fallback for photo band ---------- */
  const noTL = !CSS.supports('animation-timeline: view()');
  const pimgs = $$('.pimg img'), qimg = $('.qband img');
  function bandPar() {
    if (!noTL || reduced()) return;
    { const r = qimg.parentElement.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) { const k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; qimg.style.transform = `translateY(${-k * 9}%) scale(1.06)`; } }
    pimgs.forEach(img => { const r = img.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; const k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; img.style.transform = `translateY(${-k * 30}px)`; });
  }

  /* ---------- charging calculator ---------- */
  (() => {
    const f = $('#chargeForm'), cap = $('#cap'), s0 = $('#soc0'), s1 = $('#soc1'), cents = $('#cents');
    const out = {cap: $('#capOut'), s0: $('#soc0Out'), s1: $('#soc1Out'), t: $('#rTime'), c: $('#rCost'), k: $('#rKwh'), km: $('#rKm'), note: $('#rNote')};
    const fill = $('#batFill'), start = $('#batStart'), liveEl = $('#chargeLive'), priceBox = cents.closest('.price'), hint = $('#centsHint'), hintTxt = hint.textContent;
    let liveT;
    const anim = new Map();
    function tween(el, to, render) {
      const prev = anim.get(el) || {v: to, raf: 0}; cancelAnimationFrame(prev.raf);
      if (reduced()) { el.textContent = render(to); anim.set(el, {v: to}); return; }
      const from = prev.v, t0 = performance.now(), dur = 550, st = {v: from, raf: 0}; anim.set(el, st);
      const step = now => { const k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3); st.v = from + (to - from) * e; el.textContent = render(st.v); if (k < 1) st.raf = requestAnimationFrame(step); };
      st.raf = requestAnimationFrame(step);
    }
    function calc(e) {
      if (e && e.target === s0 && +s0.value >= +s1.value) { s1.value = Math.min(100, +s0.value + 5); paint(s1); }
      if (e && e.target === s1 && +s1.value <= +s0.value) { s0.value = Math.max(0, +s1.value - 5); paint(s0); }
      const C = +cap.value, a = +s0.value, b = +s1.value;
      const kw = +f.querySelector('[name=kw]:checked').value, car = +f.querySelector('[name=car]:checked').value;
      const raw = String(cents.value).trim().replace(/\s/g, '').replace(',', '.');
      let price = /^\d+(\.\d+)?$/.test(raw) ? parseFloat(raw) : NaN;
      const bad = !isFinite(price) || price > 100;
      priceBox.classList.toggle('bad', bad); cents.setAttribute('aria-invalid', bad);
      hint.textContent = bad ? 'Tarkista hinta: anna luku väliltä 0–100 c/kWh, esim. 12,5. Laskelmassa käytetään nyt ' + (isFinite(price) && price > 100 ? '100' : '15') + ' c/kWh.' : hintTxt;
      if (bad) price = isFinite(price) && price > 100 ? 100 : 15;
      const eff = Math.min(kw, car), batt = C * (b - a) / 100, grid = batt / 0.9;
      const hours = grid / eff, cost = grid * price / 100, km = batt / 0.17;
      out.cap.textContent = C + ' kWh'; out.s0.textContent = a + ' %'; out.s1.textContent = b + ' %';
      tween(out.t, hours, v => { const m = Math.round(v * 60); return Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') + ' min'; });
      tween(out.c, cost, v => fmt(v, 2) + ' €');
      tween(out.k, batt, v => fmt(v, 1) + ' kWh');
      tween(out.km, km, v => fmt(Math.round(v / 5) * 5) + ' km');
      start.style.width = `calc(${a}% - ${a ? 12 * a / 100 : 0}px)`;
      fill.style.left = `calc(6px + ${a}% - ${12 * a / 100}px)`; fill.style.width = `calc(${b - a}% - ${12 * (b - a) / 100}px)`;
      let note = '';
      if (kw > car) note = `Auto rajoittaa tehon ${fmt(car, car % 1 ? 1 : 0)} kW:iin, joten ${fmt(kw, kw % 1 ? 1 : 0)} kW:n asema ei nopeuta latausta tällä autolla.`;
      else if (eff >= 11) note = 'Yön aikana ehtii hyvin, kun lataus alkaa illalla.';
      else if (hours > 10) note = 'Tällä teholla täyteen lataus vie yön yli. 11 kW:n asema nopeuttaa, jos auto tukee sitä.';
      out.note.textContent = note;
      clearTimeout(liveT);
      liveT = setTimeout(() => { const m = Math.round(hours * 60); liveEl.textContent = `Latausaika noin ${Math.floor(m / 60)} h ${m % 60} min, hinta ${fmt(cost, 2)} €, akkuun ${fmt(batt, 1)} kWh. ${note}`; }, 700);
    }
    f.addEventListener('input', calc); f.addEventListener('change', calc); calc();
  })();

  /* ---------- FAQ smooth open ---------- */
  $$('.faq-list details').forEach(d => {
    const sum = d.querySelector('summary'), body = d.querySelector('.faq-a');
    sum.addEventListener('click', e => {
      if (reduced()) return; e.preventDefault();
      if (d.open) { const h = body.scrollHeight; body.animate([{height: h + 'px', opacity: 1}, {height: '0px', opacity: 0}], {duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)'}).onfinish = () => d.open = false; }
      else { d.open = true; const h = body.scrollHeight; body.animate([{height: '0px', opacity: 0}, {height: h + 'px', opacity: 1}], {duration: 380, easing: 'cubic-bezier(.2,.7,.2,1)'}); }
    });
  });

  /* ---------- callbar + form ---------- */
  const bar = $('.callbar');
  new IntersectionObserver(([e]) => bar.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top < 0)).observe($('.hero-ctas'));
  const form = $('#lomake'), status = $('#lomake-tila');
  form.addEventListener('submit', e => { if (!form.dataset.endpoint) { e.preventDefault(); status.hidden = false; status.focus(); } });

  onScroll();
})();
