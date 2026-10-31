(() => {
  'use strict';
  const d = document, root = d.documentElement;
  const q = (s, r = d) => r.querySelector(s), qa = (s, r = d) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) root.classList.add('reduce');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const r5 = n => Math.round(n / 5) * 5;

  /* hero: word reveal that keeps the italic part */
  const h1 = q('#h1'); let wi = 0;
  const wrapWords = el => {
    [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = d.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(d.createTextNode(' ')); return; }
          const o = d.createElement('span'); o.className = 'wd';
          const s = d.createElement('span'); s.textContent = t; s.style.transitionDelay = (150 + wi++ * 85) + 'ms';
          o.appendChild(s); frag.appendChild(o);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) wrapWords(n);
    });
  };
  if (h1) { h1.setAttribute('aria-label', h1.textContent.trim()); wrapWords(h1); }
  qa('.hero .up').forEach((e, k) => e.style.transitionDelay = (480 + k * 130) + 'ms');
  requestAnimationFrame(() => requestAnimationFrame(() => q('#hero').classList.add('go')));

  /* open now (Helsinki) */
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
    const m = +p.hour * 60 + +p.minute;
    if (!['Sat', 'Sun'].includes(p.weekday) && m >= 510 && m < 990) q('#tag').lastChild.textContent = 'Paikalla nyt · ma–pe 8.30–16.30';
  } catch (e) { /* static text stays */ }

  /* hero video */
  const vid = q('#vid'), ticks = qa('#ticks i');
  if (vid && !reduce && !(navigator.connection && navigator.connection.saveData)) {
    vid.preload = 'auto';
    vid.addEventListener('playing', () => vid.classList.add('on'), { once: true });
    vid.play().catch(() => {});
    let seg = -1;
    const loop = () => {
      const s = Math.min(2, Math.floor(vid.currentTime / 2.7));
      if (s !== seg) {
        seg = s;
        ticks.forEach((t, k) => { t.classList.toggle('done', k < s); t.classList.remove('on'); });
        const t = ticks[s]; if (t) { void t.offsetWidth; t.style.setProperty('--t', Math.max(.2, 2.7 - vid.currentTime % 2.7).toFixed(2) + 's'); t.classList.add('on'); }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? vid.play().catch(() => {}) : vid.pause())).observe(vid);
  } else { const t = q('#ticks'); if (t) t.hidden = true; }

  /* header, progress bar, dock */
  const hd = q('header'), bar = q('#bar'), dock = q('#dock');
  let ly = scrollY, busy = false;
  const onScroll = () => {
    const y = scrollY, mx = root.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (mx > 0 ? y / mx : 0) + ')';
    hd.classList.toggle('solid', y > innerHeight * 0.75);
    if (!root.classList.contains('menu-open')) { if (y > innerHeight && y > ly + 3) hd.classList.add('away'); else if (y < ly - 3) hd.classList.remove('away'); }
    dock && dock.classList.toggle('on', y > innerHeight * 0.7);
    ly = y; busy = false;
    story();
  };
  addEventListener('scroll', () => { if (!busy) { busy = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* menu */
  const bg = q('#burger');
  const menu = on => { if (on) hd.classList.remove('away'); root.classList.toggle('menu-open', on); bg.setAttribute('aria-expanded', on); bg.setAttribute('aria-label', on ? 'Sulje valikko' : 'Avaa valikko'); d.body.style.overflow = on ? 'hidden' : ''; };
  bg.addEventListener('click', () => menu(!root.classList.contains('menu-open')));
  qa('#links a').forEach(a => a.addEventListener('click', () => menu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('menu-open')) { menu(false); bg.focus(); } });
  addEventListener('resize', () => { if (innerWidth >= 980) menu(false); });

  /* reveals */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .06 });
  qa('.rv').forEach(e => io.observe(e));

  /* signature: year dial */
  const M = ['Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu', 'Heinäkuu', 'Elokuu', 'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'];
  const MS = ['Tammi', 'Helmi', 'Maalis', 'Huhti', 'Touko', 'Kesä', 'Heinä', 'Elo', 'Syys', 'Loka', 'Marras', 'Joulu'];
  const gen = M.map(() => []);
  // every month: VAT for the month before last, employer payments for last month, payroll data within 5 days of pay day
  M.forEach((m, i) => {
    const vatOf = M[(i + 10) % 12].toLowerCase(), prev = M[(i + 11) % 12].toLowerCase();
    gen[i].push(['12.', 'pv', 'ALV-ilmoitus ja maksu', M[(i + 10) % 12] + 'n arvonlisävero. Eräpäivä on toisen kuukauden 12. päivä verokauden jälkeen.', 1]);
    gen[i].push(['12.', 'pv', 'Työnantajan suoritukset', 'Edellisen kuun (' + prev + ') palkoista pidätetyt verot ja työnantajan sairausvakuutusmaksu.', 1]);
    gen[i].push(['+5', 'pv', 'Palkkatiedot tulorekisteriin', 'Viimeistään viidentenä päivänä palkanmaksusta.', 1]);
  });
  gen[0].unshift(['', '', 'Tilinpäätöstyö alkaa', 'Edellisen vuoden saldot täsmäytetään ja puuttuvat tositteet kerätään.', 1]);
  gen[2].push(['', 'esim.', 'Ennakkoveron 1. erä', 'Jos yhtiön ennakkovero maksetaan kahdessa erässä, ensimmäinen on tilikauden 3. kuukaudella.', 0]);
  gen[3].unshift(['30.4.', '', 'Tilinpäätös ja veroilmoitus', 'Tilinpäätös laaditaan ja veroilmoitus annetaan neljän kuukauden kuluessa tilikauden päättymisestä.', 1]);
  gen[5].unshift(['30.6.', '', 'Varsinainen yhtiökokous', 'Pidettävä kuuden kuukauden kuluessa tilikauden päättymisestä. Laadimme pöytäkirjapohjan.', 1]);
  gen[8].push(['', 'esim.', 'Ennakkoveron 2. erä', 'Kahdessa erässä maksettaessa toinen erä on tilikauden 9. kuukaudella.', 0]);
  gen[11].unshift(['31.12.', '', 'Tilikausi päättyy', 'Käymme ennen vuodenvaihdetta läpi palkan ja osingon suhteen ja isot hankinnat.', 1]);
  const svg = q('#dialSvg'), dial = q('#dial'), mBox = q('#months');
  let cur = -1;
  if (svg) {
    const NS = 'http://www.w3.org/2000/svg', R0 = 128, R1 = 228;
    const pt = (r, a) => [r * Math.sin(a), -r * Math.cos(a)];
    const segs = [], labels = [];
    for (let i = 0; i < 12; i++) {
      const a0 = i * Math.PI / 6 + .012, a1 = (i + 1) * Math.PI / 6 - .012;
      const [x0, y0] = pt(R1, a0), [x1, y1] = pt(R1, a1), [x2, y2] = pt(R0, a1), [x3, y3] = pt(R0, a0);
      const p = d.createElementNS(NS, 'path');
      p.setAttribute('d', `M${x0} ${y0}A${R1} ${R1} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${R0} ${R0} 0 0 0 ${x3} ${y3}Z`);
      p.setAttribute('class', 'seg' + (gen[i].length > 3 ? ' hot' : ''));
      svg.appendChild(p); segs.push(p);
      const [tx, ty] = pt((R0 + R1) / 2, (i + .5) * Math.PI / 6);
      const t = d.createElementNS(NS, 'text'); t.setAttribute('x', tx.toFixed(1)); t.setAttribute('y', ty.toFixed(1)); t.textContent = MS[i].toUpperCase();
      svg.appendChild(t); labels.push(t);
      const b = d.createElement('button'); b.type = 'button'; b.textContent = MS[i]; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => { setM(i); turnTo(i); }); mBox.appendChild(b);
    }
    const hand = d.createElementNS(NS, 'line'); hand.setAttribute('class', 'hand'); hand.setAttribute('x1', 0); hand.setAttribute('y1', -R1 - 2); hand.setAttribute('x2', 0); hand.setAttribute('y2', -R1 - 14);
    const knob = d.createElementNS(NS, 'circle'); knob.setAttribute('class', 'knob'); knob.setAttribute('cx', 0); knob.setAttribute('cy', -R1 - 20); knob.setAttribute('r', 10);
    const g = d.createElementNS(NS, 'g'); g.appendChild(hand); g.appendChild(knob); svg.appendChild(g);
    let ang = 0, target = 0, anim = 0;
    const draw = () => g.setAttribute('transform', `rotate(${ang})`);
    const ease = () => { ang += (target - ang) * .18; draw(); if (Math.abs(target - ang) > .1) anim = requestAnimationFrame(ease); else { ang = target; draw(); anim = 0; } };
    const turnTo = i => { let t = i * 30 + 15; while (t - ang > 180) t -= 360; while (ang - t > 180) t += 360; target = t; if (reduce) { ang = t; draw(); } else if (!anim) anim = requestAnimationFrame(ease); };
    function setM(i) {
      i = (i + 12) % 12; if (i === cur) return; cur = i;
      segs.forEach((s, k) => s.classList.toggle('cur', k === i)); labels.forEach((s, k) => s.classList.toggle('cur', k === i));
      qa('button', mBox).forEach((b, k) => b.setAttribute('aria-pressed', k === i));
      const L = gen[i];
      q('#coreM').textContent = MS[i]; q('#coreN').textContent = L.length + ' määräpäivää';
      q('#dueM').textContent = M[i]; q('#dueC').textContent = L.filter(x => x[4]).length + ' hoidamme puolestasi';
      const ul = q('#dueL'); ul.textContent = '';
      L.forEach((x, k) => {
        const li = d.createElement('li'); li.style.setProperty('--i', k);
        li.innerHTML = '<span class="dt"></span><div><b></b><p></p></div>';
        li.firstChild.textContent = x[0] || '·'; if (x[1]) { const s = d.createElement('small'); s.textContent = x[1]; li.firstChild.appendChild(s); }
        li.querySelector('b').textContent = x[2]; li.querySelector('p').textContent = x[3];
        if (x[4]) { const w = d.createElement('span'); w.className = 'we'; w.textContent = '✓ Hoidamme'; li.lastChild.appendChild(w); }
        ul.appendChild(li);
      });
      dial.setAttribute('aria-valuenow', i + 1); dial.setAttribute('aria-valuetext', M[i]);
    }
    const now = new Date().getMonth();
    setM(now); ang = target = now * 30 + 15; draw();
    let drag = false;
    const angAt = e => { const r = dial.getBoundingClientRect(); const a = Math.atan2(e.clientX - r.left - r.width / 2, -(e.clientY - r.top - r.height / 2)) * 180 / Math.PI; return (a + 360) % 360; };
    dial.addEventListener('pointerdown', e => { const rb = dial.getBoundingClientRect(); if (Math.hypot(e.clientX - rb.left - rb.width / 2, e.clientY - rb.top - rb.height / 2) < rb.width / 2 * (R0 / 260)) return; drag = true; dial.setPointerCapture(e.pointerId); const a = angAt(e); let t = a; while (t - ang > 180) t -= 360; while (ang - t > 180) t += 360; target = t; if (!anim) anim = requestAnimationFrame(ease); setM(Math.floor(a / 30)); });
    dial.addEventListener('pointermove', e => { if (!drag) return; const a = angAt(e); let t = a; while (t - ang > 180) t -= 360; while (ang - t > 180) t += 360; target = t; if (!anim) anim = requestAnimationFrame(ease); setM(Math.floor(a / 30)); });
    const up = () => { if (!drag) return; drag = false; turnTo(cur); };
    dial.addEventListener('pointerup', up); dial.addEventListener('pointercancel', up);
    dial.addEventListener('keydown', e => {
      const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
      if (k) { e.preventDefault(); setM(cur + k); turnTo(cur); }
      if (e.key === 'Home') { e.preventDefault(); setM(0); turnTo(0); }
      if (e.key === 'End') { e.preventDefault(); setM(11); turnTo(11); }
    });
  }

  /* price calculator */
  const tos = q('#tos'), pal = q('#pal');
  const fill = i => i.style.setProperty('--p', ((i.value - i.min) / (i.max - i.min) * 100) + '%');
  const calc = () => {
    const oy = q('input[name=ym]:checked').value === 'oy', lk = q('input[name=lk]:checked').value === '1';
    const T = +tos.value, P = +pal.value;
    const K = r5((oy ? 119 : 99) + T * .9), PL = P * 25, LL = lk ? 39 : 0, TP = oy ? 490 : 290, mo = K + PL + LL;
    q('#tosO').textContent = T; q('#palO').textContent = P;
    q('#pM').textContent = fmt(mo);
    q('#lK').textContent = fmt(K) + ' €'; q('#lP').textContent = fmt(PL) + ' €'; q('#lL').textContent = fmt(LL) + ' €';
    q('#lT').textContent = fmt(TP) + ' €'; q('#lY').textContent = fmt(mo * 12 + TP) + ' €';
    fill(tos); fill(pal);
  };
  qa('#hinta input').forEach(i => i.addEventListener('input', calc)); calc();
  q('#calcGo').addEventListener('click', () => {
    const oy = q('input[name=ym]:checked').value === 'oy';
    q('#fMuoto').value = oy ? 'Osakeyhtiö' : 'Toiminimi';
    q('#fMsg').value = `Hinta-arvio: noin ${tos.value} tositetta kuussa, ${pal.value} palkansaajaa, esimerkkihinta ${q('#pM').textContent}\u00a0€/kk.`;
  });

  /* pinned story */
  const tr = q('#sTrack'), items = qa('#sList li'), pics = qa('.s-frame img'), cnt = q('#sCount');
  let si = 0;
  function story() {
    if (!tr || innerWidth < 980) return;
    const r = tr.getBoundingClientRect();
    const i = Math.floor(clamp(-r.top / (r.height - innerHeight), 0, .999) * 4);
    if (i === si) return; si = i;
    items.forEach((e, k) => e.classList.toggle('on', k === i));
    pics.forEach((e, k) => { e.classList.toggle('on', k === i); e.classList.toggle('past', k < i); });
    cnt.textContent = (i + 1) + ' / 4';
  }

  /* balance band: digits that line up under the pointer */
  const cv = q('#grid');
  if (cv && !reduce) {
    const c = cv.getContext('2d');
    let W, H, cols, rows, cells = [], live = false, mx = -999, my = -999, sweep = -200, tipped = false, t0 = 0;
    const CW = 30, CH = 38;
    const size = () => {
      const b = cv.getBoundingClientRect(); if (!b.width) return;
      const pr = Math.min(2, devicePixelRatio || 1); W = b.width; H = b.height;
      cv.width = W * pr | 0; cv.height = H * pr | 0; c.setTransform(pr, 0, 0, pr, 0, 0);
      cols = Math.ceil(W / CW); rows = Math.ceil(H / CH); cells = [];
      for (let i = 0; i < cols * rows; i++) cells.push({ v: Math.random() * 10 | 0, l: 0, j: Math.random() * 6 });
      c.font = '500 17px Fraunces, Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    };
    size(); addEventListener('resize', size);
    const frame = t => {
      if (!live) return;
      c.clearRect(0, 0, W, H);
      if (mx < -900) sweep = (sweep + 2.2) % (W + 400);
      const sx = mx < -900 ? sweep - 200 : mx;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const k = cells[y * cols + x], cx = x * CW + CW / 2, cy = y * CH + CH / 2;
        const dist = mx < -900 ? Math.abs(cx - sx) * 1.6 : Math.hypot(cx - mx, cy - my);
        const target = dist < 170 ? 1 - dist / 170 : 0;
        k.l += (target - k.l) * (target > k.l ? .2 : .03);
        if (k.l < .2 && Math.random() < .015) k.v = Math.random() * 10 | 0;
        const jit = (1 - k.l) * Math.sin(t / 600 + k.j) * 4;
        const a = .08 + k.l * .75;
        c.fillStyle = k.l > .5 ? `rgba(227,195,90,${a})` : `rgba(167,216,187,${a})`;
        c.fillText(k.l > .6 ? '0' : k.v, cx + jit, cy - jit * .5);
      }
      requestAnimationFrame(frame);
    };
    new IntersectionObserver(es => es.forEach(e => { const was = live; live = e.isIntersecting; if (live && !was) { size(); requestAnimationFrame(frame); } })).observe(cv);
    const tip = q('#tip');
    cv.addEventListener('pointermove', e => { const b = cv.getBoundingClientRect(); mx = e.clientX - b.left; my = e.clientY - b.top; if (!tipped) { tipped = true; tip.classList.add('gone'); } });
    cv.addEventListener('pointerdown', e => { const b = cv.getBoundingClientRect(); mx = e.clientX - b.left; my = e.clientY - b.top; if (!tipped) { tipped = true; tip.classList.add('gone'); } });
    cv.addEventListener('pointerleave', () => { mx = my = -999; });
  } else if (cv) { q('#tip').hidden = true; }

  /* form */
  const f = q('#form');
  f.addEventListener('submit', e => {
    e.preventDefault(); const ok = q('#ok');
    if (f.kotisivu.value) return;
    const em = f.email.value.trim();
    if (!f.nimi.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { ok.hidden = false; ok.textContent = 'Lisää nimi ja toimiva sähköpostiosoite, niin otamme yhteyttä.'; (f.nimi.value.trim() ? f.email : f.nimi).focus(); return; }
    ok.hidden = false; ok.textContent = 'Kiitos! Tämä on demosivu, joten viestiä ei lähetetty. Oikealla sivulla vastaisimme saman arkipäivän aikana.';
    f.reset();
  });

  onScroll();
})();
