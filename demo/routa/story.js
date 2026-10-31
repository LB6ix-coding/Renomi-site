(() => {
  'use strict';
  const sec = document.getElementById('hero'), cv = document.getElementById('buildCv'), track = document.getElementById('buildTrack');
  if (!sec || !cv) return;
  const crisp = [...document.querySelectorAll('.crisp')], still = document.getElementById('buildStill'), chaps = [...sec.querySelectorAll('.chap')], rail = [...document.querySelectorAll('#rail li')], load = document.getElementById('buildLoad');
  const N = window.BUILD_FRAMES || 0, SEG = window.BUILD_SEGMENTS || [];   // SEG: frame index where each chapter starts
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEYS = ['k1', 'k2', 'k3', 'k4', 'k5'];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let chap = -1;
  const setChap = i => {
    if (i === chap) return; chap = i;
    chaps.forEach((c, k) => c.classList.toggle('on', k === i));
    rail.forEach((r, k) => r.classList.toggle('on', k === i));
    if (calm || !N) still.src = 'img/build/' + KEYS[i] + '.webp';
  };
  const progress = () => { const r = track.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight), 0, 1); };
  if (calm || !N) {
    sec.classList.add('static');
    const on = () => { const p = progress(); setChap(Math.min(4, Math.floor(p * 5))); };
    addEventListener('scroll', on, { passive: true }); on(); load.classList.add('done');
    return;
  }
  const ctx = cv.getContext('2d');
  const small = Math.min(innerWidth, innerHeight * 16 / 9) < 900;
  const dir = small ? 'img/build/s/' : 'img/build/l/';
  const PER = 10, SH = Math.ceil(N / PER), sheets = new Array(SH), ok = new Array(SH).fill(false);
  let loaded = 0, shown = -1, cur = 0;
  const size = () => { const r = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(cv.clientWidth * r); cv.height = Math.round(cv.clientHeight * r); shown = -1; draw(); };
  const nearest = i => { const s = Math.floor(i / PER); if (ok[s]) return i; for (let d = 1; d < SH; d++) { for (const t of [s - d, s + d]) if (t >= 0 && t < SH && ok[t]) return t < s ? Math.min(N - 1, t * PER + PER - 1) : t * PER; } return -1; };
  function draw() {
    const i = nearest(Math.round(cur)); if (i < 0 || i === shown) return; shown = i;
    const im = sheets[Math.floor(i / PER)], fw = im.naturalWidth, fh = im.naturalWidth * 9 / 16, row = i % PER;
    const W = cv.width, H = cv.height, s = Math.max(W / fw, H / fh), w = fw * s, h = fh * s;
    ctx.drawImage(im, 0, row * fh, fw, fh, (W - w) / 2, (H - h) / 2, w, h);
  }
  // load order: first sheet, the sheets holding each chapter start, then the rest outward
  const order = []; const add = t => { if (t >= 0 && t < SH && !order.includes(t)) order.push(t); };
  add(0); SEG.forEach(f => add(Math.floor(f / PER))); for (let t = 0; t < SH; t++) add(t);
  let q = 0, active = 0;
  const next = () => {
    while (active < 3 && q < order.length) {
      const t = order[q++]; active++;
      const im = new Image(); im.decoding = 'async';
      im.onload = () => { ok[t] = true; done(); };
      im.onerror = done;
      function done() { active--; loaded++; load.firstElementChild.style.transform = 'scaleX(' + loaded / SH + ')'; if (loaded >= SH) load.classList.add('done'); shown = -1; draw(); next(); }
      im.src = dir + String(t).padStart(2, '0') + '.webp'; sheets[t] = im;
    }
  };
  next();
  addEventListener('resize', size); size();
  let target = 0;
  const tick = () => {
    // holds: the story pauses briefly on each finished stage so the text can be read
    const C = (window.BUILD_CLIPS || 4), L = (N - 1) / C, HOLD = .45, total = C + (C + 1) * HOLD;
    let u = progress() * total, f = 0;
    let hold = -1;
    for (let k = 0; k <= C; k++) { if (u <= HOLD) { hold = k; break; } u -= HOLD; if (k === C) { hold = C; break; } if (u <= 1) { f += u * L; u = 0; break; } u -= 1; f += L; }
    target = clamp(f, 0, N - 1);
    cur += (target - cur) * 0.18; if (Math.abs(target - cur) < 0.05) cur = target;
    draw();
    const settled = hold >= 0 && Math.abs(target - cur) < 0.6;
    crisp.forEach((im, k) => im.classList.toggle('on', settled && k === hold));
    let c = 0; for (let k = 0; k < SEG.length; k++) if (cur >= SEG[k] - 2) c = k;
    setChap(c);
    rail.forEach((r, k) => { const a = SEG[k] || 0, b = SEG[k + 1] || N - 1; r.firstElementChild.style.setProperty('--f', clamp((cur - a) / Math.max(1, b - a), 0, 1)); });
    requestAnimationFrame(tick);
  };
  setChap(0); requestAnimationFrame(tick);
})();
