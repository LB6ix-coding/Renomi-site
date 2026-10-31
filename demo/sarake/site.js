(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const rmq = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const NB = ' ';
  const eur2 = n => n.toLocaleString('fi-FI', {minimumFractionDigits: 2, maximumFractionDigits: 2}).replace(/\s/g, NB).replace('−', '-') + NB + '€';
  const eur0 = n => Math.round(n).toLocaleString('fi-FI').replace(/\s/g, NB) + NB + '€';
  const html = document.documentElement;

  /* ---------- menu ---------- */
  const hdr = $('.hdr'), menu = $('#menu'), mbtn = $('.menu-btn');
  const setMenu = open => { menu.classList.toggle('open', open); hdr.classList.toggle('menu-open', open); mbtn.setAttribute('aria-expanded', open); mbtn.setAttribute('aria-label', open ? 'Sulje valikko' : 'Avaa valikko'); };
  mbtn.addEventListener('click', () => { const o = mbtn.getAttribute('aria-expanded') !== 'true'; setMenu(o); if (o) menu.querySelector('a').focus(); });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && mbtn.getAttribute('aria-expanded') === 'true') { setMenu(false); mbtn.focus(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.nav')) setMenu(false); });
  matchMedia('(min-width:761px)').addEventListener('change', m => { if (m.matches) setMenu(false); });

  /* ---------- split headline ---------- */
  $$('.split').forEach(h => {
    let i = 0;
    const wrap = txt => txt.split(/(\s+)/).map(w => w.trim() ? `<span class="w"><span style="--i:${i++}">${w}</span></span>` : w).join('');
    h.innerHTML = [...h.childNodes].map(n => n.nodeType === 3 ? wrap(n.textContent) : `<${n.nodeName.toLowerCase()}>${wrap(n.textContent)}</${n.nodeName.toLowerCase()}>`).join('');
  });
  const go = () => requestAnimationFrame(() => html.classList.add('loaded'));
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 900))]) : Promise.resolve()).then(go);

  /* ---------- reveal + counters ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold: .12, rootMargin: '0px 0px -40px 0px'});
  $$('.rv, .statement').forEach(el => { if (el.id !== 'slip') io.observe(el); });
  // the receipt slip prints itself with clip-path, which hides it from IntersectionObserver: watch its column instead
  const slipEl = $('#slip');
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { slipEl.classList.add('in'); o.disconnect(); } }, {threshold: .2}).observe(slipEl.parentNode);
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0);
    const show = v => { el.textContent = v.toLocaleString('fi-FI', {minimumFractionDigits: dec, maximumFractionDigits: dec}); };
    if (rmq.matches) return show(to);
    const t0 = performance.now(), dur = 1500;
    const step = now => { const p = clamp((now - t0) / dur), k = 1 - Math.pow(1 - p, 4); show(to * k); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), {threshold: .6});
  $$('.cnt').forEach(c => cio.observe(c));

  /* ---------- magnetic buttons ---------- */
  if (fine.matches) $$('.mag').forEach(b => {
    b.addEventListener('pointermove', e => { if (rmq.matches) return; const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) / r.width * 10}px,${(e.clientY - r.top - r.height / 2) / r.height * 8}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transition = 'transform .5s cubic-bezier(.2,.7,.2,1),background .2s,box-shadow .25s'; b.style.transform = ''; setTimeout(() => { b.style.transition = ''; }, 500); });
  });

  /* ---------- scroll: header, progress, story ---------- */
  const bar = $('.progress span'), hero = $('.hero');
  let lastY = scrollY, ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY, dy = y - lastY; lastY = y;
    const max = html.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    hdr.classList.toggle('solid', y > hero.offsetHeight - 90);
    if (!menu.classList.contains('open')) hdr.classList.toggle('hide', dy > 4 && y > 500 ? true : dy < -4 ? false : hdr.classList.contains('hide'));
    story();
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, {passive: true});

  /* ---------- callbar + form ---------- */
  const cb = $('.callbar');
  let pastHero = false, inTool = false, inContact = false;
  const cbUpd = () => cb.classList.toggle('show', pastHero && !inTool && !inContact);
  new IntersectionObserver(([en]) => { pastHero = !en.isIntersecting && en.boundingClientRect.top < 0; cbUpd(); }).observe($('.hero-ctas'));
  new IntersectionObserver(([en]) => { inTool = en.isIntersecting; cbUpd(); }, {rootMargin: '-20% 0px -20% 0px'}).observe($('#kuittipino'));
  new IntersectionObserver(([en]) => { inContact = en.isIntersecting; cbUpd(); }).observe($('#yhteys'));
  const form = $('#lomake'), fst = $('#lomake-tila');
  form.addEventListener('submit', e => {
    if (form.dataset.endpoint) return;
    e.preventDefault();
    let ok = true;
    let badId = '';
    ['f-nimi', 'f-puh', 'f-email'].forEach(id => { const el = $('#' + id); if (!el) return; const bad = (id !== 'f-email' && !el.value.trim()) || !el.checkValidity(); el.setAttribute('aria-invalid', bad); if (bad && ok) { el.focus(); ok = false; badId = id; } });
    if (!ok) { fst.hidden = false; fst.textContent = badId === 'f-email' ? 'Tarkista sähköpostiosoite tai jätä kenttä tyhjäksi.' : 'Täytä nimi ja puhelinnumero, niin voimme soittaa takaisin.'; return; }
    fst.hidden = false; fst.textContent = 'Kiitos! Tämä on demosivu, joten viestiä ei lähetetty. Oikealla sivulla viesti menee suoraan kirjanpitäjälle.'; fst.focus();
  });

  /* =====================================================================
     HERO: desk scene canvas (ledger, receipts, stamp, pencil) lit by
     low window light, with dust in the beam. Video slots cover it later.
     ===================================================================== */
  const desk = (() => {
    const cv = $('#desk-canvas'), ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, base = null, light = null, motes = [], run = false, vis = true, raf = 0, prev = 0, t = 0;
    let px = .5, py = .5, ppx = .5, ppy = .5, mx = -999, my = -999, videoOn = false, lightGeo = null;
    const R = (a, b) => a + Math.random() * (b - a);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const PAD = 24;

    function receipt(g, x, y, w, h, rot, shop, lines, total) {
      g.save(); g.translate(x, y); g.rotate(rot);
      g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 18; g.shadowOffsetX = 6; g.shadowOffsetY = 10;
      g.fillStyle = '#f7f4ec'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, h);
      const n = Math.max(6, Math.round(w / 9));
      for (let i = n; i >= 0; i--) g.lineTo(i * w / n, h - (i % 2 ? 6 : 0));
      g.closePath(); g.fill(); g.shadowColor = 'transparent';
      g.fillStyle = '#2b3038'; g.textAlign = 'center'; g.font = `700 ${w * .085}px ui-monospace,Menlo,Consolas,monospace`;
      g.fillText(shop, w / 2, w * .16);
      g.font = `400 ${w * .062}px ui-monospace,Menlo,Consolas,monospace`; g.fillStyle = '#6b7079'; g.fillText('TAMPERE', w / 2, w * .25);
      g.strokeStyle = '#c4c0b6'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(w * .08, w * .3); g.lineTo(w * .92, w * .3); g.stroke();
      g.textAlign = 'left'; g.fillStyle = '#2b3038'; g.font = `400 ${w * .066}px ui-monospace,Menlo,Consolas,monospace`;
      let yy = w * .4;
      lines.forEach(([a, b]) => { g.textAlign = 'left'; g.fillText(a, w * .08, yy); g.textAlign = 'right'; g.fillText(b, w * .92, yy); yy += w * .095; });
      g.beginPath(); g.moveTo(w * .08, yy - w * .04); g.lineTo(w * .92, yy - w * .04); g.stroke(); g.setLineDash([]);
      g.font = `700 ${w * .075}px ui-monospace,Menlo,Consolas,monospace`; g.textAlign = 'left'; g.fillText('YHTEENSÄ', w * .08, yy + w * .06); g.textAlign = 'right'; g.fillText(total, w * .92, yy + w * .06);
      for (let i = 0; i < 9; i++) { g.fillStyle = '#2b3038'; const bw = rnd() * 2.4 + .6; g.fillRect(w * .2 + i * w * .065, yy + w * .13, bw, w * .09); }
      g.restore();
    }
    function stamp(g, x, y, r, rot, a) {
      g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = a; g.strokeStyle = '#c8402a'; g.fillStyle = '#c8402a';
      g.lineWidth = r * .07; g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.stroke(); g.lineWidth = r * .03; g.beginPath(); g.arc(0, 0, r * .72, 0, 6.283); g.stroke();
      g.font = `800 ${r * .26}px "Schibsted Grotesk",system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('KIRJATTU', 0, 0);
      g.font = `700 ${r * .15}px "Schibsted Grotesk",system-ui,sans-serif`;
      const word = 'TAMPERE · SARAKE · ';
      for (let i = 0; i < word.length; i++) { const ang = -Math.PI / 2 + i / word.length * 6.283; g.save(); g.rotate(ang); g.translate(0, -r * .86); g.rotate(Math.PI / 2 * 0); g.fillText(word[i], 0, 0); g.restore(); }
      // ink wear
      g.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 60; i++) { g.globalAlpha = rnd() * .5; g.beginPath(); g.arc((rnd() - .5) * r * 2, (rnd() - .5) * r * 2, rnd() * r * .08, 0, 6.283); g.fill(); }
      g.restore();
    }
    function ledgerBook(g, cx, cy, pw, rot) {
      const ph = pw * 1.32;
      g.save(); g.translate(cx, cy); g.rotate(rot);
      // cover under pages
      g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 50; g.shadowOffsetX = 18; g.shadowOffsetY = 26;
      g.fillStyle = '#2e5446'; g.fillRect(-pw - 14, -ph / 2 - 12, pw * 2 + 28, ph + 24);
      g.shadowColor = 'transparent';
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? -pw : 0;
        const grd = g.createLinearGradient(x0, 0, x0 + pw, 0);
        if (side < 0) { grd.addColorStop(0, '#efe8d6'); grd.addColorStop(.85, '#e9e1cd'); grd.addColorStop(1, '#cdc3ab'); }
        else { grd.addColorStop(0, '#cbc1a9'); grd.addColorStop(.12, '#e9e1cd'); grd.addColorStop(1, '#f1ebdb'); }
        g.fillStyle = grd; g.fillRect(x0, -ph / 2, pw, ph);
        // ruling
        const rows = 24, rh = ph / (rows + 2);
        g.strokeStyle = 'rgba(120,165,150,.55)'; g.lineWidth = 1;
        for (let i = 2; i <= rows + 1; i++) { g.beginPath(); g.moveTo(x0 + pw * .04, -ph / 2 + i * rh); g.lineTo(x0 + pw * .96, -ph / 2 + i * rh); g.stroke(); }
        g.strokeStyle = 'rgba(200,64,42,.55)';
        const mxs = side < 0 ? [x0 + pw * .14, x0 + pw * .155] : [x0 + pw * .12, x0 + pw * .135];
        mxs.forEach(m => { g.beginPath(); g.moveTo(m, -ph / 2 + rh * .6); g.lineTo(m, ph / 2 - rh * .3); g.stroke(); });
        g.strokeStyle = 'rgba(120,165,150,.4)';
        [.58, .78].forEach(f => { g.beginPath(); g.moveTo(x0 + pw * f, -ph / 2 + rh * 2); g.lineTo(x0 + pw * f, ph / 2 - rh); g.stroke(); });
        // header
        g.fillStyle = 'rgba(30,40,70,.75)'; g.font = `700 ${rh * .42}px "Schibsted Grotesk",system-ui,sans-serif`; g.textAlign = 'left';
        g.fillText(side < 0 ? 'TILI' : 'TOSITE', x0 + pw * .19, -ph / 2 + rh * 1.6);
        g.textAlign = 'right'; g.fillText('DEBET', x0 + pw * .76, -ph / 2 + rh * 1.6); g.fillText('KREDIT', x0 + pw * .95, -ph / 2 + rh * 1.6);
        // handwritten rows
        const labels = side < 0 ? ['Myynti', 'Ostot', 'ALV-saaminen', 'Pankki', 'Vuokra', 'Matkat', 'Tarvikkeet', 'Puhelin', 'Ostot', 'ALV-velka', 'Kassa', 'Pankki', 'Vakuutus', 'Ohjelmistot', 'Myynti', 'Pankki']
          : ['14.3.', '14.3.', '15.3.', '17.3.', '18.3.', '18.3.', '21.3.', '22.3.', '24.3.', '25.3.', '27.3.', '28.3.', '29.3.', '31.3.'];
        g.font = `italic 400 ${rh * .7}px Newsreader,Georgia,serif`;
        labels.forEach((lb, i) => {
          const yy = -ph / 2 + (i + 3) * rh - rh * .22;
          if (yy > ph / 2 - rh * 2.4) return;
          g.fillStyle = 'rgba(28,42,86,.86)'; g.textAlign = 'left'; g.fillText(lb, x0 + pw * .19, yy);
          const v = (rnd() * 1800 + 12).toFixed(2).replace('.', ',');
          g.textAlign = 'right'; g.fillText(v, x0 + pw * (rnd() < .5 ? .755 : .945), yy);
        });
        // total with double rule
        const ty = ph / 2 - rh * 1.4;
        g.strokeStyle = 'rgba(28,42,86,.8)'; g.lineWidth = 1.2;
        [[.6, .76], [.8, .95]].forEach(([a, b]) => { g.beginPath(); g.moveTo(x0 + pw * a, ty - rh * .9); g.lineTo(x0 + pw * b, ty - rh * .9); g.stroke(); g.beginPath(); g.moveTo(x0 + pw * a, ty + rh * .25); g.lineTo(x0 + pw * b, ty + rh * .25); g.moveTo(x0 + pw * a, ty + rh * .42); g.lineTo(x0 + pw * b, ty + rh * .42); g.stroke(); });
        g.fillStyle = 'rgba(28,42,86,.9)'; g.font = `italic 600 ${rh * .74}px Newsreader,Georgia,serif`; g.textAlign = 'right';
        g.fillText(side < 0 ? '9 418,62' : '1 204,10', x0 + pw * .755, ty); g.fillText(side < 0 ? '9 418,62' : '1 204,10', x0 + pw * .945, ty);
      }
      // spine shade
      const sg = g.createLinearGradient(-pw * .08, 0, pw * .08, 0);
      sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(.5, 'rgba(0,0,0,.22)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = sg; g.fillRect(-pw * .08, -ph / 2, pw * .16, ph);
      // ribbon
      g.fillStyle = '#b23a26'; g.beginPath(); g.moveTo(pw * .05, -ph / 2); g.lineTo(pw * .09, -ph / 2); g.lineTo(pw * .095, ph / 2 + ph * .12); g.lineTo(pw * .072, ph / 2 + ph * .1); g.lineTo(pw * .05, ph / 2 + ph * .125); g.closePath(); g.fill();
      g.restore();
    }
    function pencil(g, x, y, len, rot) {
      const w = len * .055;
      g.save(); g.translate(x, y); g.rotate(rot);
      g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 12; g.shadowOffsetX = 5; g.shadowOffsetY = 8;
      const gr = g.createLinearGradient(0, -w / 2, 0, w / 2); gr.addColorStop(0, '#2a4a3e'); gr.addColorStop(.45, '#3d6a59'); gr.addColorStop(1, '#1d352c');
      g.fillStyle = gr; g.fillRect(0, -w / 2, len * .82, w); g.shadowColor = 'transparent';
      g.fillStyle = '#d9c39b'; g.beginPath(); g.moveTo(len * .82, -w / 2); g.lineTo(len * .97, -w * .08); g.lineTo(len * .97, w * .08); g.lineTo(len * .82, w / 2); g.closePath(); g.fill();
      g.fillStyle = '#2b2b2b'; g.beginPath(); g.moveTo(len * .945, -w * .15); g.lineTo(len, 0); g.lineTo(len * .945, w * .15); g.closePath(); g.fill();
      g.fillStyle = '#b9a77c'; g.fillRect(-len * .06, -w / 2, len * .06, w);
      g.fillStyle = '#c8402a'; g.fillRect(-len * .12, -w / 2, len * .06, w);
      g.restore();
    }
    function buildBase() {
      seed = 11;
      base = document.createElement('canvas');
      const bw = W + PAD * 2, bh = H + PAD * 2;
      base.width = Math.round(bw * dpr); base.height = Math.round(bh * dpr);
      const g = base.getContext('2d'); g.scale(dpr, dpr);
      const bg = g.createLinearGradient(0, 0, bw, bh); bg.addColorStop(0, '#131a29'); bg.addColorStop(.6, '#1a2336'); bg.addColorStop(1, '#151c2c');
      g.fillStyle = bg; g.fillRect(0, 0, bw, bh);
      // felt grain
      for (let i = 0; i < bw * bh / 900; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * .025})`; g.fillRect(rnd() * bw, rnd() * bh, 1, 1); }
      const wide = W >= 900, mid = W >= 600;
      const pw = wide ? Math.min(W * .24, 400) : mid ? Math.min(W * .3, 300) : Math.min(W * .4, 210);
      const cx = PAD + (wide ? W * .735 : mid ? W * .68 : W * .64), cy = PAD + (wide ? H * .37 : mid ? H * .25 : H * .18);
      const rot = wide ? -.16 : -.2;
      ledgerBook(g, cx, cy, pw, rot);
      pencil(g, cx + pw * .9, cy - pw * .95, pw * 1.0, 2.3);
      const rw = pw * (wide ? .5 : .56);
      if (wide || mid) {
        if (wide) receipt(g, cx - pw * 1.02, cy + pw * .5, rw, rw * 1.55, -.22, 'HUOLTOASEMA', [['Polttoaine', '74,60'], ['ALV 25,5 %', '15,16']], '74,60');
        receipt(g, cx - pw * .4, cy + pw * .74, rw, rw * 1.45, .1, 'RAUTAKAUPPA', [['Ruuvit', '48,90'], ['ALV 25,5 %', '9,94']], '48,90');
        receipt(g, cx + pw * .44, cy + pw * .64, rw * .95, rw * 1.4, -.06, 'KAHVILA', [['Lounas 2 hlö', '41,20'], ['ALV 13,5 %', '4,90']], '41,20');
        stamp(g, cx - pw * .12, cy + pw * 1.28, rw * .3, -.4, .82);
      } else {
        receipt(g, PAD + W * .03, PAD + H * .09, rw, rw * 1.5, -.18, 'HUOLTOASEMA', [['Polttoaine', '74,60'], ['ALV 25,5 %', '15,16']], '74,60');
        receipt(g, cx - pw * .5, cy + pw * .45, rw, rw * 1.45, .14, 'RAUTAKAUPPA', [['Ruuvit', '48,90'], ['ALV 25,5 %', '9,94']], '48,90');
        stamp(g, cx - pw * .2, cy + pw * .95, rw * .3, -.4, .8);
      }
      stamp(g, cx + pw * .6, cy - pw * .5, rw * .26, .3, .45);
      // vignette
      const vg = g.createRadialGradient(bw * .7, bh * .4, Math.min(bw, bh) * .2, bw * .6, bh * .5, Math.max(bw, bh) * .75);
      vg.addColorStop(0, 'rgba(10,14,22,0)'); vg.addColorStop(1, 'rgba(10,14,22,.65)');
      g.fillStyle = vg; g.fillRect(0, 0, bw, bh);
      lightGeo = wide ? {x: W * .6, y: -H * .04, w: W * .46, h: H * .74, sk: -.42} : {x: W * .42, y: -H * .03, w: W * .8, h: H * .36, sk: -.5};
    }
    function buildLight() {
      // 4 x 3 factory window panes, blurred once, then drawn every frame with a slow drift
      const lw = 512, lh = 384;
      light = document.createElement('canvas'); light.width = lw; light.height = lh;
      const g = light.getContext('2d');
      const blur = 'filter' in g;
      if (blur) g.filter = 'blur(10px)';
      const cols = 4, rows = 3, gx = 16, gy = 16, pwid = (lw - 80 - gx * (cols - 1)) / cols, phei = (lh - 80 - gy * (rows - 1)) / rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = 40 + c * (pwid + gx), y = 40 + r * (phei + gy);
        const gr = g.createLinearGradient(x, y, x + pwid, y + phei);
        gr.addColorStop(0, 'rgba(255,214,150,.95)'); gr.addColorStop(1, 'rgba(240,160,90,.75)');
        g.fillStyle = gr; g.fillRect(x, y, pwid, phei);
      }
      if (blur) g.filter = 'none';
    }
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight;
      if (!W || !H) return;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      buildBase(); if (!light) buildLight();
      const n = Math.round(clamp(W * H / 16000, 28, 80));
      while (motes.length < n) motes.push({x: R(0, W), y: R(0, H), r: R(.5, 1.8), vx: R(-4, 4), vy: R(-9, -2), ph: R(0, 6.28)});
      motes.length = n;
      draw(0);
    }
    function lightMatrix(time) {
      const L = lightGeo, drift = Math.sin(time * .045) * W * .035, lift = Math.cos(time * .03) * H * .02;
      return {a: L.w / light.width, b: 0, c: L.sk * L.h / light.height, d: L.h / light.height, e: L.x + drift + (ppx - .5) * -14, f: L.y + lift + (ppy - .5) * -10};
    }
    function inBeam(m, x, y) {
      const det = m.a * m.d - m.b * m.c, X = x - m.e, Y = y - m.f;
      const u = (m.d * X - m.c * Y) / det, v = (-m.b * X + m.a * Y) / det;
      if (u < 40 || v < 40 || u > light.width - 40 || v > light.height - 40) return 0;
      const fu = (u - 40) % ((light.width - 80 - 48) / 4 + 16), fv = (v - 40) % ((light.height - 80 - 32) / 3 + 16);
      return fu > (light.width - 80 - 48) / 4 || fv > (light.height - 80 - 32) / 3 ? .25 : 1;
    }
    function draw(dt) {
      t += dt; ppx += (px - ppx) * Math.min(1, dt * 3); ppy += (py - ppy) * Math.min(1, dt * 3);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      if (!base || !light) return;
      const m = lightMatrix(t);
      if (!videoOn) {
        ctx.drawImage(base, (-PAD + (ppx - .5) * 16) * dpr, (-PAD + (ppy - .5) * 12) * dpr);
        const breathe = .62 + Math.sin(t * .5) * .05 + Math.sin(t * .13) * .06;
        ctx.setTransform(m.a * dpr, m.b * dpr, m.c * dpr, m.d * dpr, m.e * dpr, m.f * dpr);
        ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 1; ctx.drawImage(light, 0, 0);
        ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = breathe * .5; ctx.drawImage(light, 0, 0);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      // dust motes, bright inside the beam
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const p of motes) {
        p.ph += dt * .8;
        let ax = Math.sin(p.ph) * 3, ay = 0;
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 120 * 120) { const d = Math.sqrt(d2) || 1, f = (1 - d / 120) * 160; ax += dx / d * f; ay += dy / d * f; }
        p.vx += (ax - p.vx * .6) * dt; p.vy += (ay + (-5 - p.vy) * .6) * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y < -10 || p.x < -20 || p.x > W + 20) { p.y = H + 5; p.x = R(0, W); }
        if (p.y > H + 10) p.y = -5;
        const b = videoOn ? .35 : inBeam(m, p.x, p.y);
        ctx.globalAlpha = .08 + b * .7;
        ctx.fillStyle = b > .5 ? '#ffe6bd' : '#c9d2e8';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (b > .5 ? 1.2 : 1), 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function frame(now) {
      if (!run) return;
      const dt = Math.min((now - (prev || now)) / 1000, .05); prev = now;
      draw(dt); raf = requestAnimationFrame(frame);
    }
    const upd = () => { const want = vis && !rmq.matches && !document.hidden; if (want && !run) { run = true; prev = 0; raf = requestAnimationFrame(frame); } if (!want && run) { run = false; cancelAnimationFrame(raf); } };
    let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 120); });
    size();
    if (document.fonts) document.fonts.load('italic 400 20px Newsreader').then(() => document.fonts.load('700 20px "Schibsted Grotesk"')).then(size).catch(() => {});
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; upd(); }).observe(hero);
    document.addEventListener('visibilitychange', upd); rmq.addEventListener('change', () => { upd(); draw(0); });
    hero.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); px = (e.clientX - r.left) / r.width; py = (e.clientY - r.top) / r.height; mx = e.clientX - r.left; my = e.clientY - r.top; }, {passive: true});
    hero.addEventListener('pointerleave', () => { px = py = .5; mx = my = -999; });
    upd();
    return {setVideo(on) { videoOn = on; draw(0); }};
  })();

  /* ---------- hero video: 3 slots, forward-only hard cuts, portrait sources, max 2 loaded ---------- */
  (() => {
    if (hero.dataset.media !== 'on' || rmq.matches) return;
    const media = $('.hero-media'), tpl = $('#hero-poster-tpl');
    const portrait = matchMedia('(max-width:760px)').matches;
    const vids = $$('.hero-v'), CUT = 2700;
    media.insertBefore(tpl.content.cloneNode(true), vids[0]);
    const src = v => portrait ? v.dataset.srcP : v.dataset.src;
    vids.forEach((v, k) => { v.muted = true; v.defaultMuted = true; if (k === 0) v.poster = portrait ? v.dataset.posterP : v.dataset.poster; });
    const load = i => { const v = vids[i]; if (!v.getAttribute('src')) { v.preload = 'auto'; v.src = src(v); v.load(); } };
    const release = i => { const v = vids[i]; if (v.getAttribute('src')) { v.pause(); v.removeAttribute('src'); v.load(); } };
    let cur = -1, timer = 0, started = false, inView = true;
    const play = v => { const p = v.play(); return p && p.catch ? p : Promise.resolve(); };
    function show(i) {
      const v = vids[i]; v.currentTime = 0;
      play(v).then(() => {
        vids.forEach((x, k) => x.classList.toggle('on', k === i));
        if (cur >= 0 && cur !== i) vids[cur].pause();
        const old = cur; cur = i;
        if (old >= 0 && old !== i) release(old);
        load((i + 1) % vids.length);
        if (!started) { started = true; hero.classList.add('vid-on'); desk.setVideo(true); }
        clearTimeout(timer); timer = setTimeout(next, CUT);
      }).catch(() => { const retry = () => show(i); ['pointerdown', 'touchstart', 'scroll', 'keydown'].forEach(ev => addEventListener(ev, retry, {once: true, passive: true})); });
    }
    function next() { if (!inView || document.hidden) return; show((cur + 1) % vids.length); }
    const begin = () => { load(0); vids[0].addEventListener('loadeddata', () => show(0), {once: true}); };
    if (document.readyState === 'complete') setTimeout(begin, 200); else addEventListener('load', () => setTimeout(begin, 200), {once: true});
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (cur < 0) return; if (inView) { play(vids[cur]); clearTimeout(timer); timer = setTimeout(next, CUT); } else { vids[cur].pause(); clearTimeout(timer); } }).observe(hero);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && cur >= 0 && inView) { play(vids[cur]); clearTimeout(timer); timer = setTimeout(next, CUT); } });
  })();

  /* =====================================================================
     KUITTIPINO: drag receipts into folders, the ledger sums VAT by rate,
     deductible VAT, net total and minutes saved.
     ===================================================================== */
  (() => {
    const TRAYS = {tarvikkeet: 'Tarvikkeet', matkat: 'Matkat', ohjelmistot: 'Ohjelmistot ja lehdet', edustus: 'Edustus'};
    const DATA = [
      {shop: 'RAUTAKAUPPA', d: '2.10.', item: 'Ruuvit ja kiinnikkeet', g: 48.90, r: 25.5, t: 'tarvikkeet', hint: 'Ruuvit ovat työssä kuluvia tarvikkeita.'},
      {shop: 'HUOLTOASEMA', d: '3.10.', item: 'Polttoaine 41,2 l', g: 74.60, r: 25.5, t: 'matkat', hint: 'Työajojen polttoaine kuuluu matkakuluihin.'},
      {shop: 'JUNALIPPU', d: '6.10.', item: 'Tampere-Helsinki', g: 31.90, r: 13.5, t: 'matkat', hint: 'Junalippu on matkakulu, ja sen ALV on 13,5 %.'},
      {shop: 'TOIMISTOTARVIKE', d: '7.10.', item: 'Paperi ja kansiot', g: 32.40, r: 25.5, t: 'tarvikkeet', hint: 'Paperi ja kansiot ovat tarvikkeita.'},
      {shop: 'RAVINTOLA', d: '9.10.', item: 'Lounas asiakkaan kanssa, 2 hlö', g: 41.20, r: 13.5, t: 'edustus', hint: 'Asiakkaan lounas on edustusta. Sen ALV:tä ei saa vähentää.'},
      {shop: 'OHJELMISTO', d: '10.10.', item: 'Kuvankäsittely, kk-tilaus', g: 24.99, r: 25.5, t: 'ohjelmistot', hint: 'Kuukausitilaus on ohjelmistokulu.'},
      {shop: 'TAKSI', d: '13.10.', item: 'Asiakaskäynti', g: 18.40, r: 13.5, t: 'matkat', hint: 'Taksi on matkakulu, ja sen ALV on 13,5 %.'},
      {shop: 'LEHTITALO', d: '14.10.', item: 'Ammattilehti, vuosi', g: 89.00, r: 10, t: 'ohjelmistot', hint: 'Ammattilehti kuuluu lehtiin, ja sen ALV on 10 %.'},
      {shop: 'ELEKTRONIIKKA', d: '16.10.', item: 'USB-C-laturi', g: 39.90, r: 25.5, t: 'tarvikkeet', hint: 'Pieni laite kirjataan tarvikkeisiin.'},
      {shop: 'PYSÄKÖINTI', d: '20.10.', item: 'Keskusta, 3 h', g: 6.00, r: 25.5, t: 'matkat', hint: 'Pysäköinti asiakaskäynnillä on matkakulu.'},
      {shop: 'KIRJAKAUPPA', d: '22.10.', item: 'Alan käsikirja', g: 45.00, r: 13.5, t: 'ohjelmistot', hint: 'Ammattikirja kuuluu samaan kansioon kuin lehdet.'},
      {shop: 'BISTRO', d: '27.10.', item: 'Lounas asiakkaalle, 1 hlö', g: 12.60, r: 13.5, t: 'edustus', hint: 'Asiakkaalle tarjottu lounas on edustusta. Sen ALV:tä ei saa vähentää.'}
    ];
    const vatOf = (g, r) => Math.round(g * r / (100 + r) * 100) / 100;
    const fmtN = n => n.toLocaleString('fi-FI', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    const board = $('#deskboard'), pile = $('#pile'), note = $('#note'), trays = $$('.tray'), trayWrap = $('.trays'), ledger = $('.ledger');
    const autoBtn = $('#auto-sort'), shufBtn = $('#reshuffle');
    let items = [], selected = null, busy = false, dealt = false, layoutSeed = 3;
    const rng = s => () => (s = (s * 48271) % 2147483647) / 2147483647;

    function build() {
      pile.innerHTML = '';
      items = DATA.map((d, i) => {
        const el = document.createElement('button');
        el.type = 'button'; el.className = 'rc';
        el.setAttribute('aria-label', `Kuitti: ${d.shop.toLowerCase()}, ${d.item}, ${fmtN(d.g)} euroa, ALV ${String(d.r).replace('.', ',')} prosenttia. Valitse, sitten valitse kansio.`);
        el.innerHTML = `<span class="rc-p"><b>${d.shop}</b><span class="d">Tampere ${d.d}</span><span class="rl"><i>${d.item}</i><i>${fmtN(d.g)}</i></span><span class="rl vat"><i>ALV ${String(d.r).replace('.', ',')}${NB}%</i><i>${fmtN(vatOf(d.g, d.r))}</i></span><span class="rl tot"><i>YHTEENSÄ</i><i>${fmtN(d.g)}${NB}€</i></span></span>`;
        pile.appendChild(el);
        const it = {d, el, i, u: 0, v: 0, rot: 0, x: 0, y: 0, r: 0, sorted: false};
        bind(it); return it;
      });
      layout(false);
    }
    function layout(animate) {
      const R = rng(layoutSeed * 977 + 13);
      const pw = pile.clientWidth, ph = pile.clientHeight;
      const cols = pw > 560 ? 4 : 3;
      items.forEach((it, k) => {
        const c = k % cols, row = (k / cols) | 0;
        it.u = clamp((c + .5) / cols + (R() - .5) * .16, .02, .98);
        it.v = clamp((row + .5) / Math.ceil(items.length / cols) + (R() - .5) * .2, .05, .95);
        it.rot = (R() - .5) * 26;
      });
      // shuffle z order
      const order = items.map((_, k) => k).sort(() => R() - .5);
      order.forEach((k, z) => { items[k].el.style.zIndex = z + 1; });
      place(animate);
    }
    function home(it) {
      const pw = pile.clientWidth, ph = pile.clientHeight, w = it.el.offsetWidth, h = it.el.offsetHeight;
      return {x: it.u * Math.max(0, pw - w), y: 26 + it.v * Math.max(0, ph - h - 26)};
    }
    const put = it => { it.el.style.transform = `translate3d(${it.x}px,${it.y}px,0) rotate(${it.r}deg)`; };
    function place(animate) {
      items.forEach((it, k) => {
        if (it.sorted) return;
        const p = home(it); it.x = p.x; it.y = p.y; it.r = it.rot; put(it);
        if (animate && !rmq.matches) it.el.animate([{transform: `translate3d(${p.x}px,${p.y - 140}px,0) rotate(${it.rot * 2}deg)`, opacity: 0}, {transform: `translate3d(${p.x}px,${p.y}px,0) rotate(${it.rot}deg)`, opacity: 1}], {duration: 650, delay: k * 55, easing: 'cubic-bezier(.2,.8,.25,1.15)', fill: 'backwards'});
      });
    }
    let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => place(false), 120); });

    /* springs for return-to-pile */
    function springTo(it, tx, ty, tr) {
      const fx = it.x, fy = it.y, fr = it.r, t0 = performance.now(), dur = rmq.matches ? 1 : 520;
      const step = now => { const p = clamp((now - t0) / dur), k = 1 - Math.pow(1 - p, 3) * Math.cos(p * 5.2) ; it.x = fx + (tx - fx) * k; it.y = fy + (ty - fy) * k; it.r = fr + (tr - fr) * k; put(it); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
    const trayAt = (x, y) => trays.find(t => { const r = t.getBoundingClientRect(); return x >= r.left - 8 && x <= r.right + 8 && y >= r.top - 26 && y <= r.bottom + 8; });

    let drag = null, suppress = false;
    function bind(it) {
      const el = it.el;
      el.addEventListener('pointerdown', e => {
        if (it.sorted || busy || (e.pointerType === 'mouse' && e.button !== 0)) return;
        drag = {it, id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: it.x, oy: it.y, moved: false, lx: e.clientX, lt: performance.now(), vx: 0, hot: null, tx: it.x, ty: it.y, raf: 0};
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
      });
      el.addEventListener('pointermove', e => {
        if (!drag || drag.it !== it || e.pointerId !== drag.id) return;
        const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
        if (!drag.moved && Math.hypot(dx, dy) < 6) return;
        if (!drag.moved) { drag.moved = true; el.classList.add('drag'); board.classList.add('used'); deselect(); }
        const now = performance.now(), dt = Math.max(1, now - drag.lt);
        drag.vx = drag.vx * .7 + ((e.clientX - drag.lx) / dt * 16) * .3; drag.lx = e.clientX; drag.lt = now;
        drag.tx = drag.ox + dx; drag.ty = drag.oy + dy;
        const hot = trayAt(e.clientX, e.clientY);
        if (hot !== drag.hot) { if (drag.hot) drag.hot.classList.remove('hot'); if (hot) hot.classList.add('hot'); drag.hot = hot; }
        if (!drag.raf) drag.raf = requestAnimationFrame(() => { if (!drag) return; drag.raf = 0; it.x = drag.tx; it.y = drag.ty; it.r = clamp(drag.vx * 1.6, -22, 22) * .6 + it.rot * .25; put(it); });
      });
      const end = e => {
        if (!drag || drag.it !== it || e.pointerId !== drag.id) return;
        const d = drag; drag = null; cancelAnimationFrame(d.raf);
        el.classList.remove('drag');
        if (d.hot) d.hot.classList.remove('hot');
        if (!d.moved) return; // a tap: handled by click
        suppress = true; setTimeout(() => { suppress = false; }, 60);
        if (e.type === 'pointerup' && d.hot) drop(it, d.hot);
        else { const p = home(it); springTo(it, p.x, p.y, it.rot); }
      };
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
      el.addEventListener('click', () => {
        if (suppress || it.sorted || busy) return;
        if (selected === it) { deselect(); say(''); return; }
        deselect(); selected = it; el.classList.add('sel'); trayWrap.classList.add('pick'); board.classList.add('used');
        say(`Valitse kansio kuitille: ${it.d.shop.toLowerCase()}, ${fmtN(it.d.g)}${NB}€.`);
      });
    }
    function deselect() { if (selected) selected.el.classList.remove('sel'); selected = null; trayWrap.classList.remove('pick'); }
    function say(t, warn) { note.textContent = t; note.classList.toggle('warn', !!warn); }
    trays.forEach(t => t.addEventListener('click', () => {
      if (busy) return;
      if (!selected) { say('Valitse ensin kuitti pöydältä, sitten kansio.'); return; }
      const it = selected; deselect(); drop(it, t);
    }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && selected) { deselect(); say(''); } });

    function drop(it, tray) {
      if (tray.dataset.tray === it.d.t) accept(it, tray, false);
      else {
        tray.classList.remove('bump'); void tray.offsetWidth; tray.classList.add('bump');
        say(`Ei ihan. ${it.d.hint} Kokeile kansiota ${TRAYS[it.d.t]}.`, true);
        if (!rmq.matches) it.el.animate([{transform: `translate3d(${it.x}px,${it.y}px,0) rotate(${it.r}deg)`}, {transform: `translate3d(${it.x - 10}px,${it.y}px,0) rotate(${it.r - 4}deg)`}, {transform: `translate3d(${it.x + 8}px,${it.y}px,0) rotate(${it.r + 3}deg)`}, {transform: `translate3d(${it.x}px,${it.y}px,0) rotate(${it.r}deg)`}], {duration: 320});
        const p = home(it); setTimeout(() => springTo(it, p.x, p.y, it.rot), rmq.matches ? 0 : 330);
      }
    }
    function accept(it, tray, auto) {
      it.sorted = true; it.el.disabled = true;
      const pr = pile.getBoundingClientRect(), tr = tray.getBoundingClientRect();
      const w = it.el.offsetWidth, h = it.el.offsetHeight;
      const tx = tr.left + tr.width / 2 - pr.left - w / 2, ty = tr.top + tr.height * .35 - pr.top - h / 2;
      const finish = () => {
        it.el.classList.add('gone'); it.x = tx; it.y = ty; put(it);
        tray.classList.remove('bump'); void tray.offsetWidth; tray.classList.add('bump');
        const st = document.createElement('span'); st.className = 'tray-stamp'; st.textContent = 'Kirjattu';
        tray.querySelectorAll('.tray-stamp').forEach(s => s.remove()); tray.appendChild(st);
        tally();
        if (!auto) say(`Kirjattu: ${it.d.shop.toLowerCase()} ${fmtN(it.d.g)}${NB}€, josta ALV ${fmtN(vatOf(it.d.g, it.d.r))}${NB}€${it.d.t === 'edustus' ? ' (ei vähennettävissä)' : ''}.`);
      };
      if (rmq.matches) return finish();
      const a = it.el.animate([{transform: `translate3d(${it.x}px,${it.y}px,0) rotate(${it.r}deg) scale(1)`, opacity: 1}, {transform: `translate3d(${(it.x + tx) / 2}px,${Math.min(it.y, ty) - 40}px,0) rotate(${it.r / 2}deg) scale(.8)`, opacity: 1, offset: .45}, {transform: `translate3d(${tx}px,${ty}px,0) rotate(0deg) scale(.32)`, opacity: 0}], {duration: auto ? 480 : 430, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards'});
      a.onfinish = () => { finish(); a.cancel(); };
    }

    /* ledger */
    const out = {n: $('#lg-n'), bar: $('#lg-bar'), gross: $('#lg-gross'), ded: $('#lg-ded'), nod: $('#lg-nod'), net: $('#lg-net'), min: $('#lg-min')};
    let shownGross = 0, tw = 0;
    function tally() {
      const done = items.filter(i => i.sorted);
      const by = {25.5: 0, 13.5: 0, 10: 0};
      let gross = 0, ded = 0, nod = 0;
      done.forEach(({d}) => { const v = vatOf(d.g, d.r); gross += d.g; by[d.r] += v; if (d.t === 'edustus') nod += v; else ded += v; });
      const vat = by[25.5] + by[13.5] + by[10];
      out.n.textContent = done.length; out.bar.style.transform = `scaleX(${done.length / items.length})`;
      const mx = Math.max(.01, by[25.5], by[13.5], by[10]);
      $$('.lg-vat').forEach(row => { const v = by[row.dataset.rate]; row.querySelector('.vb i').style.transform = `scaleX(${v / mx})`; row.querySelector('span').textContent = eur2(v); });
      out.ded.textContent = eur2(ded); out.nod.textContent = eur2(nod); out.net.textContent = eur2(gross - vat);
      out.min.textContent = Math.round(done.length * 110 / 60) + NB + 'min';
      const a0 = shownGross, t0 = performance.now(); cancelAnimationFrame(tw);
      const step = now => { const p = rmq.matches ? 1 : clamp((now - t0) / 500), k = 1 - Math.pow(1 - p, 3); shownGross = a0 + (gross - a0) * k; out.gross.textContent = eur2(shownGross); if (p < 1) tw = requestAnimationFrame(step); };
      tw = requestAnimationFrame(step);
      trays.forEach(t => {
        const its = done.filter(i => i.d.t === t.dataset.tray), s = its.reduce((a, i) => a + i.d.g, 0);
        t.querySelector('.t-sum').textContent = eur2(s);
        t.querySelector('.t-n').textContent = its.length + (its.length === 1 ? ' kuitti' : ' kuittia');
        const stack = t.querySelector('.t-stack');
        while (stack.children.length < its.length) { const i = document.createElement('i'); i.style.top = (stack.children.length * 5) + 'px'; i.style.transform = `rotate(${(Math.random() - .5) * 6}deg)`; stack.appendChild(i); }
        while (stack.children.length > its.length) stack.lastChild.remove();
      });
      const all = done.length === items.length;
      ledger.classList.toggle('done', all); board.classList.toggle('empty', all);
      autoBtn.disabled = all; autoBtn.hidden = all;
      if (all) say(`Valmis. Kuluja ${eur2(gross)}, josta vähennettävää arvonlisäveroa ${eur2(ded)}. Tämän me teemme joka kuukausi puolestasi.`);
    }
    autoBtn.addEventListener('click', () => {
      if (busy) return; deselect(); busy = true; autoBtn.disabled = true; board.classList.add('used');
      const left = items.filter(i => !i.sorted);
      say('Lajittelemme loput kuitit kansioihin.');
      left.forEach((it, k) => setTimeout(() => { accept(it, trays.find(t => t.dataset.tray === it.d.t), true); if (k === left.length - 1) setTimeout(() => { busy = false; }, 520); }, rmq.matches ? 0 : k * 230));
      if (!left.length) busy = false;
    });
    shufBtn.addEventListener('click', () => {
      if (busy) return; deselect(); layoutSeed++;
      items.forEach(it => { it.sorted = false; it.el.disabled = false; it.el.classList.remove('gone'); it.el.getAnimations().forEach(a => a.cancel()); });
      trays.forEach(t => t.querySelectorAll('.tray-stamp').forEach(s => s.remove()));
      board.classList.remove('empty', 'used'); say(''); shownGross = 0;
      layout(true); tally();
    });
    build(); tally();
    say('');
    new IntersectionObserver(([e], o) => { if (e.isIntersecting && !dealt) { dealt = true; o.disconnect(); place(true); } }, {threshold: .3}).observe(pile);
  })();

  /* =====================================================================
     PRICE CALCULATOR
     ===================================================================== */
  const calc = (() => {
    const f = $('#calc'), tos = $('#c-tos'), pal = $('#c-pal'), lask = $('#c-lask');
    const oTos = $('#o-tos'), oPal = $('#o-pal'), rows = $('#inv-rows'), rKk = $('#r-kk'), rV = $('#r-v'), rAlv = $('#r-alv'), rTime = $('#r-time'), live = $('#r-live');
    const P = {tmi: {base: 89, inc: 20, name: 'toiminimi'}, oy: {base: 169, inc: 30, name: 'osakeyhtiö'}}, EXTRA = 9, PAY = 25, INV = 19, VAT = .255;
    let shown = {kk: 98, v: 1176, alv: 122.99}, raf = 0, liveT = 0, lastRows = '';
    const muoto = () => f.querySelector('input[name=muoto]:checked').value;
    const fill = r => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%');
    function compute() {
      const m = P[muoto()], n = +tos.value, p = +pal.value, inv = lask.checked;
      const extra = Math.max(0, n - m.inc), batches = Math.ceil(extra / 10);
      const lines = [[`Kirjanpito, ${m.name}`, m.base]];
      if (batches) lines.push([`Lisätositteet, ${batches} × 10 kpl`, batches * EXTRA]);
      if (p) lines.push([`Palkanlaskenta, ${p} ${p === 1 ? 'palkansaaja' : 'palkansaajaa'}`, p * PAY]);
      if (inv) lines.push(['Laskutus ja reskontra', INV]);
      const kk = lines.reduce((a, l) => a + l[1], 0);
      return {lines, kk, v: kk * 12, alv: Math.round(kk * (1 + VAT) * 100) / 100, n};
    }
    function update() {
      [tos, pal].forEach(fill);
      oTos.textContent = tos.value; oPal.textContent = pal.value;
      const c = compute();
      const key = c.lines.map(l => l.join(':')).join('|');
      if (key !== lastRows) { rows.innerHTML = c.lines.map(([a, b]) => `<li><span>${a}</span><b>${eur2(b)}</b></li>`).join(''); lastRows = key; }
      const mins = Math.round(c.n * 110 / 60);
      rTime.textContent = c.n ? `Kuittien kirjaamisesta säästyy arviolta ${mins >= 60 ? Math.floor(mins / 60) + NB + 'h ' + (mins % 60) + NB + 'min' : mins + NB + 'min'} kuukaudessa.` : 'Ei kuitteja, ei kirjattavaa. Tilinpäätös ja ilmoitukset tehdään silti.';
      const from = {...shown}, t0 = performance.now(); cancelAnimationFrame(raf);
      const step = now => {
        const p = rmq.matches ? 1 : clamp((now - t0) / 450), k = 1 - Math.pow(1 - p, 3);
        shown = {kk: from.kk + (c.kk - from.kk) * k, v: from.v + (c.v - from.v) * k, alv: from.alv + (c.alv - from.alv) * k};
        rKk.textContent = eur0(shown.kk); rV.textContent = eur0(shown.v); rAlv.textContent = eur2(shown.alv);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      clearTimeout(liveT); liveT = setTimeout(() => { live.textContent = `Esimerkkihinta ${c.kk} euroa kuukaudessa ja ${c.v} euroa vuodessa, ilman arvonlisäveroa.`; }, 600);
      return c;
    }
    f.addEventListener('input', update); f.addEventListener('change', update);
    f.addEventListener('submit', e => e.preventDefault());
    $('#calc-cta').addEventListener('click', () => {
      const c = compute();
      $('#f-viesti').value = `Esimerkkihinta sivun laskurista: ${P[muoto()].name}, ${c.n} tositetta kuukaudessa, ${pal.value} ${+pal.value === 1 ? 'palkansaaja' : 'palkansaajaa'}${lask.checked ? ', myyntilaskutus' : ''}. Kuukaudessa ${c.kk} € + alv.`;
      $('#f-muoto').value = muoto() === 'oy' ? 'Osakeyhtiö' : 'Toiminimi';
    });
    update();
    return {
      set(m, n, p, inv) { f.querySelector(`input[name=muoto][value=${m}]`).checked = true; tos.value = n; pal.value = p; lask.checked = !!inv; update(); }
    };
  })();
  $$('.folder').forEach(b => b.addEventListener('click', () => {
    const [m, n, p, inv] = b.dataset.preset.split(',');
    calc.set(m, +n, +p, inv === '1');
    $('#hinnat').scrollIntoView({behavior: rmq.matches ? 'auto' : 'smooth', block: 'start'});
    const inv2 = $('.invoice');
    if (!rmq.matches) inv2.animate([{transform: 'rotate(0)'}, {transform: 'rotate(-1.2deg) scale(1.02)'}, {transform: 'rotate(0)'}], {duration: 700, delay: 500, easing: 'cubic-bezier(.2,.7,.2,1)'});
  }));

  /* =====================================================================
     PINNED STORY
     ===================================================================== */
  const cal = $('.cal-g');
  if (cal) {
    // May 2026 starts on a Friday; weeks start on Monday
    cal.innerHTML = ['ma', 'ti', 'ke', 'to', 'pe', 'la', 'su'].map(d => `<span class="h">${d}</span>`).join('') + '<span></span>'.repeat(4) + Array.from({length: 31}, (_, i) => `<span${i + 1 === 12 ? ' class="due"' : ''}>${i + 1}</span>`).join('');
  }
  const st = $('#story'), stages = $$('.stage'), svs = $$('.sv'), svn = $('#sv-n'), ink = $('#ink-fill');
  let stIdx = -1;
  function story() {
    if (rmq.matches) return;
    const r = st.getBoundingClientRect(), span = r.height - innerHeight;
    if (r.bottom < -50 || r.top > innerHeight + 50) return;
    const p = clamp(-r.top / span);
    ink.style.transform = `scaleY(${p})`;
    const s = Math.min(4, Math.floor(p * 5 * .999 + .0001));
    if (s !== stIdx) { stIdx = s; stages.forEach((x, i) => x.classList.toggle('on', i === s)); svs.forEach((x, i) => x.classList.toggle('on', i === s)); svn.textContent = s + 1; }
  }
  if (rmq.matches) { stages.forEach(x => x.classList.add('on')); ink.style.transform = 'scaleY(1)'; }

  /* =====================================================================
     STATEMENT BAND: a ledger of figures drifting upward in brick light
     ===================================================================== */
  (() => {
    const sec = $('.statement'), cv = $('#st-canvas'), ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, run = false, vis = false, raf = 0, prev = 0, off = 0, cells = [], hl = 0;
    const num = () => { const v = Math.random() * 4800 + 3; return v.toLocaleString('fi-FI', {minimumFractionDigits: 2, maximumFractionDigits: 2}).replace(/\s/g, ' '); };
    const ROW = 44;
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      const colW = W > 760 ? 190 : 140, cols = Math.ceil(W / colW) + 1, rows = Math.ceil(H / ROW) + 2;
      cells = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({c, r, t: num(), a: .05 + Math.random() * .1, colW});
      draw(0);
    }
    function draw(dt) {
      off = (off + dt * 14) % ROW; hl = (hl + dt * .35) % 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      ctx.font = `italic 400 ${W > 760 ? 22 : 17}px Newsreader,Georgia,serif`; ctx.textAlign = 'right';
      const rows = Math.ceil(H / ROW) + 2, hr = Math.floor(hl * rows);
      ctx.strokeStyle = 'rgba(255,226,184,.08)'; ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) { const y = r * ROW - off + .5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      for (const k of cells) {
        const y = k.r * ROW - off - 12;
        ctx.fillStyle = `rgba(255,226,184,${k.r === hr ? k.a + .18 : k.a})`;
        ctx.fillText(k.t, (k.c + 1) * k.colW - 24, y);
      }
      if (Math.random() < dt * 6) { const k = cells[(Math.random() * cells.length) | 0]; k.t = num(); }
    }
    function frame(now) { if (!run) return; const dt = Math.min((now - (prev || now)) / 1000, .05); prev = now; draw(dt); raf = requestAnimationFrame(frame); }
    const upd = () => { const want = vis && !rmq.matches && !document.hidden; if (want && !run) { run = true; prev = 0; raf = requestAnimationFrame(frame); } if (!want && run) { run = false; cancelAnimationFrame(raf); } };
    let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 150); });
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !W) size(); upd(); }, {rootMargin: '100px'}).observe(sec);
    document.addEventListener('visibilitychange', upd);
    if (rmq.matches) { size(); }
  })();

  onScroll();
})();
