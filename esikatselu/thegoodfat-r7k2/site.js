/* THE GOODFAT, sivustoehdotus. Kirjoitettu alusta, ei kirjastoja. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const PHONE = matchMedia('(max-width:760px)').matches; // phones open with the scroll story, no hero video/3D
if (PHONE) { const z = document.getElementById('zipIn'); if (z) z.placeholder = 'esim. 00530'; }
const _tv = document.createElement('video');
const vsrc = u => _tv.canPlayType('video/mp4; codecs="avc1.640028"') ? u : u.replace(/\.mp4$/, '.webm');
const eur = n => n.toFixed(2).replace('.', ',') + ' €';
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
};

/* ---------- Data (from thegoodfat.fi, 31.10.2026) ---------- */
const PRODUCTS = [
  { id: 'rookie', name: 'Rookie', bags: 1, price: 9.90, img: 'img/pack-1.webp', tag: 'Ensimmäinen askel hyvän maun puolelle.' },
  { id: 'crew', name: 'Crew', bags: 3, price: 26.90, img: 'img/pack-3.webp', tag: 'Kun pöydässä on pieni porukka.' },
  { id: 'family', name: 'Family', bags: 5, price: 39.90, img: 'img/pack-5.webp', tag: 'Perheen yhteisiin herkkuhetkiin.', feat: 'Koko perheelle' },
  { id: 'don', name: 'Don', bags: 10, price: 72.90, img: 'img/pack-10.webp', tag: 'Kun hyvästä ei halua heti luopua.' }
];
const SHIP = 6.90, FREE_OVER = 50;
// Snapshot of the live availability API. On the real site this comes from /api/availability.
const SLOTS = [
  { date: '2026-11-03', dl: '2026-11-02', cap: 40, left: 0 },
  { date: '2026-11-06', dl: '2026-11-05', cap: 40, left: 21 },
  { date: '2026-11-10', dl: '2026-11-09', cap: 40, left: 40 },
  { date: '2026-11-13', dl: '2026-11-12', cap: 40, left: 40 }
];
const PICKUPS = ['2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-09', '2026-11-10'];
const WEEK = { reserved: 59, cap: 80 };
(function dropPast() {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Helsinki' }).format(new Date());
  const late = hkiNow().h >= 20;
  for (let i = SLOTS.length - 1; i >= 0; i--) if (SLOTS[i].dl < today || (SLOTS[i].dl === today && late)) SLOTS.splice(i, 1);
  for (let i = PICKUPS.length - 1; i >= 0; i--) if (PICKUPS[i] < today) PICKUPS.splice(i, 1);
})();
const SHOPS = [
  { city: 'Helsinki', name: 'Kotitila', addr: 'Haapaniemenkatu 7–9 B<br>00530 Helsinki<br>Merihaan Meritornin kansikerros',
    h: { 4: [10, 18], 5: [10, 18], 6: [10, 16] }, rows: [['Torstai–perjantai', '10–18'], ['Lauantai', '10–16'], ['Ma–ke, sunnuntai', 'Suljettu']],
    map: 'https://www.google.com/maps/search/?api=1&query=Kotitila%2C%20Haapaniemenkatu%207%2C%20Helsinki', web: 'https://www.kotitila.fi/myymala/' },
  { city: 'Helsinki', name: 'K-Market Mansku', addr: 'Mannerheimintie 94<br>00250 Helsinki',
    h: { 1: [7, 23], 2: [7, 23], 3: [7, 23], 4: [7, 23], 5: [7, 23], 6: [8, 23], 0: [9, 23] }, rows: [['Maanantai–perjantai', '7–23'], ['Lauantai', '8–23'], ['Sunnuntai', '9–23']],
    map: 'https://www.google.com/maps/search/?api=1&query=K-Market%20Mansku%2C%20Mannerheimintie%2094%2C%20Helsinki', web: 'https://www.k-ruoka.fi/kauppa/k-market-mansku' },
  { city: 'Salo', name: 'Campas Meats', addr: 'Horninkatu 7<br>Salo',
    h: { 2: [11, 18], 3: [11, 18], 4: [11, 18], 5: [11, 18], 6: [11, 14] }, rows: [['Tiistai–perjantai', '11–18'], ['Lauantai', '11–14'], ['Maanantai, sunnuntai', 'Suljettu']],
    map: 'https://www.google.com/maps/search/?api=1&query=Campas%20Meats%2C%20Horninkatu%207%2C%20Salo', web: 'https://www.campasmeats.fi/' }
];
const DAYS = ['su', 'ma', 'ti', 'ke', 'to', 'pe', 'la'];
const DAYS_L = ['Sunnuntai', 'Maanantai', 'Tiistai', 'Keskiviikko', 'Torstai', 'Perjantai', 'Lauantai'];
const d0 = s => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d, 12)); };
const short = s => { const d = d0(s); return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()}.${d.getUTCMonth() + 1}.`; };

/* ---------- Helsinki time ---------- */
function hkiNow() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const g = t => p.find(x => x.type === t).value;
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday'));
  return { wd, h: +g('hour') % 24, m: +g('minute') };
}

/* ---------- Toast ---------- */
let tt;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600); }

/* ---------- Split text ---------- */
$$('[data-split]').forEach(el => {
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
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  walk(el);
  $$('.w', el).forEach(w => w.setAttribute('aria-hidden', 'true'));
});

/* ---------- Reveal ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
$$('.rv,[data-split]:not(.hero__title)').forEach(el => io.observe(el));

/* counters */
const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; cio.unobserve(e.target);
  const el = e.target, to = +el.dataset.count; if (RM) { el.textContent = to; return; }
  const t0 = performance.now(), dur = 1400;
  const step = t => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
  el.textContent = 0; requestAnimationFrame(step);
}), { threshold: .6 });
$$('[data-count]').forEach(el => cio.observe(el));

/* ---------- Header ---------- */
const hdr = $('#hdr'); let lastY = 0, holdHdr = 0;
function onHdr() {
  const y = scrollY;
  hdr.classList.toggle('is-solid', y > 40);
  hdr.classList.toggle('is-hidden', !PHONE && y > 500 && y > lastY && !document.body.classList.contains('menu-open') && performance.now() > holdHdr);
  lastY = y;
}
const menuBtn = $('#menuBtn');
menuBtn.addEventListener('click', () => {
  const o = document.body.classList.toggle('menu-open');
  menuBtn.setAttribute('aria-expanded', o); menuBtn.setAttribute('aria-label', o ? 'Sulje valikko' : 'Avaa valikko');
});
$$('#mnav a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Avaa valikko'); }));

/* ---------- Hero montage: 3 shots, forward-only hard cuts ---------- */
const hero = $('.hero');
requestAnimationFrame(() => setTimeout(() => { hero.classList.add('is-in'); $('.hero__title').classList.add('is-in'); }, 80));
(function montage() {
  const vids = $$('#heroMedia video'), bars = $$('#heroBar span');
  if (!vids.length || PHONE) return;
  const SHOT = 2.7;
  vids.forEach(v => { if (v.dataset.poster) v.poster = v.dataset.poster; v.src = vsrc(v.dataset.src); });
  if (RM) { vids[0].classList.add('is-on'); return; }
  let cur = -1, timer;
  function go(n) {
    const prev = vids[cur];
    cur = n % vids.length;
    const v = vids[cur];
    if (cur === 0) bars.forEach(b => b.classList.remove('is-done', 'is-run'));
    bars.forEach((b, i) => { if (i < cur) { b.classList.remove('is-run'); b.classList.add('is-done'); } });
    try { v.currentTime = 0; } catch (e) {}
    const p = v.play(); if (p && p.catch) p.catch(() => {});
    v.classList.add('is-on');
    if (prev && prev !== v) { prev.classList.remove('is-on'); prev.pause(); }
    const b = bars[cur]; b.classList.remove('is-done'); void b.offsetWidth; b.style.setProperty('--dur', SHOT + 's'); b.classList.add('is-run');
    clearTimeout(timer); timer = setTimeout(() => go(cur + 1), SHOT * 1000);
  }
  const vis = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (cur < 0) go(0); else { vids[cur].play().catch(() => {}); clearTimeout(timer); timer = setTimeout(() => go(cur + 1), SHOT * 1000); } }
    else { clearTimeout(timer); vids.forEach(v => v.pause()); }
  }, { threshold: .05 });
  vis.observe(hero);
})();

/* ---------- Ember canvas (fryer sparks) ---------- */
(function embers() {
  const c = $('#embers'); if (!c || RM || PHONE) { if (c && PHONE) c.style.display = 'none'; return; }
  const x = c.getContext('2d'); let w, h, dpr, ps = [];
  function size() { dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight; c.width = w * dpr; c.height = h * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size(); addEventListener('resize', size);
  const N = innerWidth < 700 ? 26 : 54;
  const mk = (y) => ({ x: Math.random() * w, y: y ?? h + Math.random() * h, r: .6 + Math.random() * 1.8, v: .25 + Math.random() * .7, s: Math.random() * 6.28, a: .25 + Math.random() * .6 });
  for (let i = 0; i < N; i++) ps.push(mk(Math.random() * h));
  let on = true;
  document.addEventListener('visibilitychange', () => { on = !document.hidden; if (on) requestAnimationFrame(f); });
  function f(t) {
    if (!on) return;
    x.clearRect(0, 0, w, h);
    for (const p of ps) {
      p.y -= p.v; p.s += .015; p.x += Math.sin(p.s) * .35;
      if (p.y < -10) Object.assign(p, mk());
      const g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
      g.addColorStop(0, `rgba(255,196,110,${p.a})`); g.addColorStop(1, 'rgba(255,140,60,0)');
      x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, p.r * 5, 0, 6.283); x.fill();
    }
    requestAnimationFrame(f);
  }
  requestAnimationFrame(f);
})();

/* ---------- Tilt cards ---------- */
if (!RM && matchMedia('(hover:hover)').matches) $$('[data-tilt]').forEach(el => {
  el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5; el.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg)`; });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
});

/* ---------- CART ---------- */
let cart = store.get('gf_cart', {});
let fulfil = store.get('gf_fulfil', { type: 'delivery', date: null });
if (typeof cart !== 'object' || !cart) cart = {};
const bagsIn = () => Object.entries(cart).reduce((n, [id, q]) => n + (PRODUCTS.find(p => p.id === id)?.bags || 0) * q, 0);
const subtotal = () => Object.entries(cart).reduce((s, [id, q]) => s + (PRODUCTS.find(p => p.id === id)?.price || 0) * q, 0);
const shipCost = sub => fulfil.type === 'pickup' ? 0 : (sub > FREE_OVER ? 0 : SHIP);

function renderPacks() {
  const base = PRODUCTS[0].price / (PRODUCTS[0].bags * .5);
  $('#packs').innerHTML = PRODUCTS.map((p, i) => {
    const kg = p.price / (p.bags * .5), save = Math.round((1 - kg / base) * 100);
    return `<article class="pack rv ${p.feat ? 'pack--feat' : ''}" style="--d:${i * .08}">
      ${p.feat ? `<span class="pack__badge">${p.feat}</span>` : ''}
      <div class="pack__img"><img src="${p.img}" alt="${p.bags} THE GOODFAT -pussia" loading="lazy" width="800" height="800"></div>
      <div class="pack__b">
        <div class="pack__name"><h3>${p.name}</h3><span>${p.bags} × 500 g</span></div>
        <p class="pack__tag">${p.tag}</p>
        <div class="pack__price"><b>${eur(p.price)}</b><span class="pack__kg">${eur(kg)} / kg</span>${save > 0 ? `<span class="pack__save">−${save} %/kg</span>` : ''}</div>
        <button class="btn pack__add" data-add="${p.id}" type="button">Lisää koriin</button>
      </div></article>`;
  }).join('');
  $$('#packs .rv').forEach(el => io.observe(el));
}
renderPacks();

function save() { store.set('gf_cart', cart); store.set('gf_fulfil', fulfil); }
function add(id, from) {
  cart[id] = (cart[id] || 0) + 1; save(); renderCart();
  holdHdr = performance.now() + 3500; hdr.classList.remove('is-hidden');
  const btn = $('#cartBtn'); btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
  if (from && !RM) fly(from);
  maybeOffer();
}
function fly(btn) {
  const card = btn.closest('.pack'), img = card && $('img', card); if (!img) return;
  const a = img.getBoundingClientRect(), b = $('#cartBtn').getBoundingClientRect();
  const f = document.createElement('div'); f.className = 'fly'; f.innerHTML = `<img src="${img.src}" alt="">`;
  f.style.left = (a.left + a.width / 2 - 35) + 'px'; f.style.top = (a.top + a.height / 2 - 35) + 'px';
  document.body.appendChild(f);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  f.animate([{ transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 }, { transform: `translate(${dx * .5}px,${dy * .5 - 80}px) scale(.8) rotate(-12deg)`, opacity: 1, offset: .55 }, { transform: `translate(${dx}px,${dy}px) scale(.2) rotate(8deg)`, opacity: .2 }], { duration: 800, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => f.remove();
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-add]');
  if (a) {
    add(a.dataset.add, a);
    const t = a.textContent; a.classList.add('added'); a.textContent = 'Lisätty ✓';
    setTimeout(() => { a.classList.remove('added'); a.textContent = t; }, 1300);
  }
  const q = e.target.closest('[data-q]');
  if (q) { const id = q.dataset.id; cart[id] = Math.max(0, (cart[id] || 0) + (+q.dataset.q)); if (!cart[id]) delete cart[id]; save(); renderCart(); }
  const fs = e.target.closest('[data-ful]');
  if (fs) { fulfil = { type: fs.dataset.ful, date: fs.dataset.date }; save(); renderCart(); renderSlots(); }
});

function renderCart() {
  const n = bagsIn(), sub = subtotal(), sh = shipCost(sub);
  $('#cartN').textContent = n;
  $('#cartBtn').setAttribute('aria-label', `Ostoskori, ${n} pussia`);
  // shop free-shipping bar
  const p = Math.min(1, sub / FREE_OVER);
  $('#shipBar').style.setProperty('--p', p);
  $('#shipTxt').innerHTML = sub === 0
    ? `Kotiinkuljetus <b>6,90 €</b>. Ilmainen, kun tuotteiden summa on yli 50 €.`
    : sub > FREE_OVER ? `<b>Kotiinkuljetus on ilmainen.</b> Korissa ${n} pussia, ${eur(sub)}.`
    : `Korissa ${eur(sub)}. Lisää vielä <b>${eur(Math.max(0.01, FREE_OVER - sub + 0.01))}</b>, niin kuljetus on ilmainen.`;
  const body = $('#dBody'), foot = $('#dFoot');
  if (!n) {
    body.innerHTML = `<div class="empty"><b>Kori on vielä tyhjä.</b>Valitse paketti, niin ranskalaiset ovat matkalla.<br><br><a class="btn btn--dark" href="#kauppa" data-close>Katso paketit</a></div>`;
    foot.innerHTML = ''; return;
  }
  body.innerHTML = Object.entries(cart).map(([id, q]) => {
    const pr = PRODUCTS.find(p => p.id === id); if (!pr) return '';
    return `<div class="line"><img src="${pr.img}" alt=""><div><h4>${pr.name}</h4><small>${pr.bags} × 500 g · ${eur(pr.price)}</small><br>
      <div class="qty"><button type="button" data-q="-1" data-id="${id}" aria-label="Vähennä ${pr.name}">−</button><span>${q}</span><button type="button" data-q="1" data-id="${id}" aria-label="Lisää ${pr.name}">+</button></div></div>
      <div class="line__p">${eur(pr.price * q)}</div></div>`;
  }).join('') + `
    <div class="dsel"><h3>Toimitustapa</h3><div class="dsel__opts">
      <button type="button" data-ful="delivery" data-date="${fulfil.type === 'delivery' && fulfil.date ? fulfil.date : ''}" aria-pressed="${fulfil.type === 'delivery'}">Kotiinkuljetus</button>
      <button type="button" data-ful="pickup" data-date="" aria-pressed="${fulfil.type === 'pickup'}">Nouto Vantaalta, maksuton</button></div></div>
    <div class="dsel"><h3>${fulfil.type === 'pickup' ? 'Noutopäivä' : 'Kuljetuspäivä, klo 18–21'}</h3><div class="dsel__opts">
      ${fulfil.type === 'pickup'
        ? PICKUPS.map(d => `<button type="button" data-ful="pickup" data-date="${d}" aria-pressed="${fulfil.date === d}">${short(d)}</button>`).join('')
        : SLOTS.map(s => `<button type="button" data-ful="delivery" data-date="${s.date}" aria-pressed="${fulfil.date === s.date}" ${s.left < n ? 'disabled' : ''}>${short(s.date)}</button>`).join('')}
    </div>${fulfil.type === 'pickup' ? '<p class="mini-ship">Sovi noutoaika numerossa 045 206 3966.</p>' : ''}</div>`;
  const left = FREE_OVER - sub;
  foot.innerHTML = `${fulfil.type === 'delivery' ? `<div class="mini-ship">${sub > FREE_OVER ? 'Kotiinkuljetus on ilmainen.' : `Ilmaiseen kuljetukseen puuttuu ${eur(Math.max(0.01, left + 0.01))}.`}<i style="--p:${p}"></i></div>` : ''}
    <dl class="sum"><dt>Tuotteet</dt><dd>${eur(sub)}</dd><dt>${fulfil.type === 'pickup' ? 'Nouto' : 'Kotiinkuljetus'}</dt><dd>${sh ? eur(sh) : 'Maksuton'}</dd><dt class="tot">Yhteensä</dt><dd class="tot">${eur(sub + sh)}</dd></dl>
    <button class="btn" id="checkout" type="button" ${fulfil.date ? '' : 'aria-disabled="true"'}>${fulfil.date ? 'Siirry maksamaan' : 'Valitse ensin päivä'}</button>
    <p class="paynote">Maksu Stripen suojatulla maksusivulla. Tuotteet varataan maksun ajaksi noin 35 minuutiksi.</p>`;
  if (PHONE) foot.querySelectorAll('.mini-ship,.paynote').forEach(el => body.appendChild(el));
}
renderCart();

/* drawer */
const drawer = $('#drawer');
let lastFocus;
function openCart() { if (offer.classList.contains('on')) hideOffer(); lastFocus = document.activeElement; document.body.classList.add('cart-open'); drawer.setAttribute('aria-hidden', 'false'); $('#cartBtn').setAttribute('aria-expanded', 'true'); setTimeout(() => $('#dClose').focus(), 50); }
function closeCart() { document.body.classList.remove('cart-open'); drawer.setAttribute('aria-hidden', 'true'); $('#cartBtn').setAttribute('aria-expanded', 'false'); lastFocus && lastFocus.focus && lastFocus.focus(); }
$('#cartBtn').addEventListener('click', openCart);
$('#dClose').addEventListener('click', closeCart);
$('#scrim').addEventListener('click', closeCart);
document.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeCart(); const co = e.target.closest('#checkout'); if (co) { if (co.getAttribute('aria-disabled') === 'true') { const d = $('#dBody [data-ful]'); if (d) d.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); toast('Valitse ensin kuljetus- tai noutopäivä.'); } else toast('Esikatselu: tästä siirrytään Stripen maksusivulle.'); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (document.body.classList.contains('cart-open')) closeCart(); if (document.body.classList.contains('menu-open')) menuBtn.click(); hideOffer(); }
  if (e.key === 'Tab' && document.body.classList.contains('cart-open')) {
    const f = $$('button:not([disabled]),a[href],input', drawer).filter(x => x.offsetParent);
    if (!f.length) return; const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ---------- Offer: only after the first item lands in the cart ---------- */
const offer = $('#offer');
function maybeOffer() {
  if (store.sget('gf_offer_seen') || store.get('gf_nl', false)) return;
  store.sset('gf_offer_seen', '1');
  setTimeout(() => { if (document.body.classList.contains('cart-open')) return; offer.classList.add('on'); offer.setAttribute('aria-hidden', 'false'); }, 1100);
}
function hideOffer() { offer.classList.remove('on'); offer.setAttribute('aria-hidden', 'true'); }
$('#ofX').addEventListener('click', hideOffer);
$('#ofForm').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target;
  if (!f.checkValidity()) { f.reportValidity(); return; }
  store.set('gf_nl', true); hideOffer(); toast('Kiitos! −10 % koodi lähtee sähköpostiisi.');
});

/* ---------- Capacity ring ---------- */
$('#capRing').style.setProperty('--p', (WEEK.reserved / WEEK.cap).toFixed(2));
$('#capTxt').textContent = `Tämän viikon erästä varattu ${WEEK.reserved} / ${WEEK.cap} pussia.`;

/* ---------- Slots ---------- */
function renderSlots() {
  const first = SLOTS.find(s => s.left > 0);
  if (first) $('#chipSlot').textContent = short(first.date);
  $('#slots').innerHTML = SLOTS.map((s, i) => {
    const d = d0(s.date), dl = d0(s.dl);
    const st = s.left === 0 ? ['out', 'Loppuunmyyty'] : s.left <= 24 ? ['low', `${s.left} pussia jäljellä`] : ['', `${s.left} pussia jäljellä`];
    return `<button type="button" class="slot rv" style="--d:${i * .07}" ${s.left === 0 ? 'disabled' : ''} data-ful="delivery" data-date="${s.date}" aria-pressed="${fulfil.type === 'delivery' && fulfil.date === s.date}">
      <span class="slot__d"><b>${d.getUTCDate()}.${d.getUTCMonth() + 1}.</b><small>${DAYS[d.getUTCDay()]}</small></span>
      <span class="slot__m"><strong>${DAYS_L[d.getUTCDay()]} klo 18–21</strong><span>Tilaa ${DAYS[dl.getUTCDay()]} ${dl.getUTCDate()}.${dl.getUTCMonth() + 1}. klo 20.00 mennessä</span><span class="slot__bar" aria-hidden="true"><i style="--left:${s.left / s.cap}"></i></span></span>
      <span class="slot__s ${st[0]}">${st[1]}</span></button>`;
  }).join('');
  $$('#slots .rv').forEach(el => { if (el.dataset.seen) el.classList.add('is-in'); else io.observe(el); el.dataset.seen = 1; });
}
renderSlots();
document.addEventListener('click', e => { const s = e.target.closest('.slot'); if (s && !s.disabled) { toast(`Kuljetus ${short(s.dataset.date)} valittu. Valitse vielä paketti.`); } });

/* ---------- Postcode check ---------- */
const PC = {"00100":[["Helsinki"],0],"00120":[["Helsinki"],0],"00130":[["Helsinki"],0],"00140":[["Helsinki"],0],"00150":[["Helsinki"],0],"00160":[["Helsinki"],0],"00170":[["Helsinki"],0],"00180":[["Helsinki"],0],"00190":[["Helsinki"],0],"00200":[["Helsinki"],0],"00210":[["Helsinki"],0],"00220":[["Helsinki"],0],"00230":[["Helsinki"],0],"00240":[["Helsinki"],0],"00250":[["Helsinki"],0],"00260":[["Helsinki"],0],"00270":[["Helsinki"],0],"00280":[["Helsinki"],0],"00290":[["Helsinki"],0],"00300":[["Helsinki"],0],"00310":[["Helsinki"],0],"00320":[["Helsinki"],0],"00330":[["Helsinki"],0],"00340":[["Helsinki"],0],"00350":[["Helsinki"],0],"00360":[["Helsinki"],0],"00370":[["Espoo","Helsinki"],0],"00380":[["Helsinki"],0],"00390":[["Helsinki"],0],"00400":[["Helsinki"],0],"00410":[["Helsinki"],0],"00420":[["Helsinki","Vantaa"],0],"00430":[["Helsinki"],0],"00440":[["Helsinki"],0],"00500":[["Helsinki"],0],"00510":[["Helsinki"],0],"00520":[["Helsinki"],0],"00530":[["Helsinki"],0],"00540":[["Helsinki"],0],"00550":[["Helsinki"],0],"00560":[["Helsinki"],0],"00570":[["Helsinki"],0],"00580":[["Helsinki"],0],"00590":[["Helsinki"],0],"00600":[["Helsinki"],0],"00610":[["Helsinki"],0],"00620":[["Helsinki"],0],"00630":[["Helsinki"],0],"00640":[["Helsinki"],0],"00650":[["Helsinki"],0],"00660":[["Helsinki"],0],"00670":[["Helsinki"],0],"00680":[["Helsinki"],0],"00690":[["Helsinki"],0],"00700":[["Helsinki"],0],"00710":[["Helsinki"],0],"00720":[["Helsinki"],0],"00730":[["Helsinki"],0],"00740":[["Helsinki"],0],"00750":[["Helsinki","Vantaa"],0],"00760":[["Helsinki","Vantaa"],0],"00770":[["Helsinki"],0],"00780":[["Helsinki"],0],"00790":[["Helsinki"],0],"00800":[["Helsinki"],0],"00810":[["Helsinki"],0],"00820":[["Helsinki"],0],"00830":[["Helsinki"],0],"00840":[["Helsinki"],0],"00850":[["Helsinki"],0],"00860":[["Helsinki"],0],"00870":[["Helsinki"],0],"00880":[["Helsinki"],0],"00890":[["Helsinki"],0],"00900":[["Helsinki"],0],"00910":[["Helsinki"],0],"00920":[["Helsinki"],0],"00930":[["Helsinki"],0],"00940":[["Helsinki"],0],"00950":[["Helsinki"],0],"00960":[["Helsinki"],0],"00970":[["Helsinki"],0],"00980":[["Helsinki"],0],"00990":[["Helsinki"],0],"01200":[["Vantaa"],1],"01230":[["Vantaa"],0],"01260":[["Vantaa"],0],"01280":[["Vantaa"],0],"01300":[["Vantaa"],0],"01340":[["Vantaa"],0],"01350":[["Vantaa"],0],"01360":[["Vantaa"],0],"01370":[["Vantaa"],0],"01380":[["Vantaa"],0],"01390":[["Vantaa"],0],"01400":[["Vantaa"],1],"01420":[["Vantaa"],0],"01450":[["Vantaa"],1],"01480":[["Vantaa"],0],"01490":[["Vantaa"],1],"01510":[["Vantaa"],0],"01520":[["Vantaa"],0],"01530":[["Vantaa"],0],"01600":[["Vantaa"],0],"01610":[["Vantaa"],0],"01620":[["Vantaa"],0],"01630":[["Vantaa"],0],"01640":[["Espoo","Vantaa"],0],"01650":[["Vantaa"],0],"01660":[["Vantaa"],0],"01670":[["Vantaa"],0],"01680":[["Vantaa"],0],"01690":[["Vantaa"],0],"01700":[["Vantaa"],0],"01710":[["Vantaa"],0],"01720":[["Vantaa"],0],"01730":[["Vantaa"],0],"01740":[["Vantaa"],0],"01750":[["Espoo","Vantaa"],0],"01760":[["Vantaa"],1],"01770":[["Vantaa"],0],"01800":[["Espoo","Vantaa"],1],"02100":[["Espoo"],0],"02110":[["Espoo"],0],"02120":[["Espoo"],0],"02130":[["Espoo"],0],"02140":[["Espoo"],0],"02150":[["Espoo"],0],"02160":[["Espoo"],0],"02170":[["Espoo"],0],"02180":[["Espoo"],0],"02200":[["Espoo"],0],"02210":[["Espoo"],0],"02230":[["Espoo"],0],"02240":[["Espoo"],0],"02250":[["Espoo"],0],"02260":[["Espoo"],0],"02270":[["Espoo"],0],"02280":[["Espoo"],0],"02300":[["Espoo"],0],"02320":[["Espoo"],0],"02330":[["Espoo"],0],"02340":[["Espoo"],0],"02360":[["Espoo"],0],"02380":[["Espoo"],0],"02390":[["Kirkkonummi"],0],"02400":[["Kirkkonummi"],1],"02410":[["Kirkkonummi"],0],"02420":[["Kirkkonummi"],0],"02430":[["Kirkkonummi"],0],"02440":[["Espoo","Kirkkonummi"],0],"02450":[["Kirkkonummi"],0],"02460":[["Kirkkonummi"],0],"02470":[["Kirkkonummi"],0],"02480":[["Kirkkonummi"],0],"02490":[["Kirkkonummi"],1],"02510":[["Espoo","Kirkkonummi"],0],"02520":[["Kirkkonummi"],0],"02540":[["Kirkkonummi"],0],"02550":[["Kirkkonummi"],1],"02600":[["Espoo"],0],"02610":[["Espoo"],0],"02620":[["Espoo"],0],"02630":[["Espoo"],0],"02650":[["Espoo"],0],"02660":[["Espoo"],0],"02680":[["Espoo","Helsinki"],0],"02700":[["Espoo","Kauniainen"],0],"02710":[["Espoo"],0],"02720":[["Espoo"],0],"02730":[["Espoo"],0],"02740":[["Espoo"],0],"02750":[["Espoo","Kauniainen"],0],"02760":[["Espoo","Kauniainen"],0],"02770":[["Espoo"],0],"02780":[["Espoo"],0],"02810":[["Espoo"],0],"02820":[["Espoo","Kirkkonummi"],1],"02860":[["Espoo","Kirkkonummi"],0],"02880":[["Kirkkonummi"],1],"02920":[["Espoo"],0],"02940":[["Espoo"],0],"02970":[["Espoo","Vantaa"],1],"02980":[["Espoo"],1],"04130":[["Vantaa"],1],"04260":[["Vantaa"],1],"04320":[["Vantaa"],1],"04360":[["Vantaa"],1]};
(function zip() {
  const form = $('#zipForm'), inp = $('#zipIn'), res = $('#zipRes'), cityBox = $('#zipCityBox'), sel = $('#zipCity');
  const ok = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
  const no = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  function hit(cities) {
    $$('#route span').forEach(a => { a.classList.toggle('hit', cities.includes(a.textContent)); a.classList.toggle('dim', cities.length > 0 && !cities.includes(a.textContent)); });
  }
  function show(s, html) { res.dataset.s = s; res.innerHTML = html; }
  inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 5); });
  sel.addEventListener('change', () => { if (sel.value) { hit([sel.value]); show('ok', `${ok} Toimitamme osoitteeseesi: ${sel.value}.`); } });
  form.addEventListener('submit', e => {
    e.preventDefault(); cityBox.classList.remove('on'); const v = inp.value.trim();
    if (!/^\d{5}$/.test(v)) { hit([]); show('no', `${no} Anna viisinumeroinen postinumero.`); return; }
    const a = PC[v];
    if (!a) { hit([]); show('no', `${no} Emme vielä kuljeta alueelle ${v}. Katso jälleenmyyjät tai nouto Vantaalta.`); return; }
    const [cities, mixed] = a;
    hit(cities);
    if (mixed) {
      sel.innerHTML = '<option value="">Valitse kunta</option>' + cities.map(c => `<option>${c}</option>`).join('') + '<option value="-">Jokin muu kunta</option>';
      cityBox.classList.add('on');
      show('ask', `Postinumero ${v} kattaa useita kuntia. Valitse toimitusosoitteesi kunta.`);
      sel.onchange = () => { if (sel.value === '-') { hit([]); show('no', `${no} Emme kuljeta tähän kuntaan.`); } else if (sel.value) { hit([sel.value]); show('ok', `${ok} Toimitamme alueellesi: ${sel.value}.`); } };
      return;
    }
    show('ok', `${ok} Toimitamme alueellesi: ${cities[0]}, ${v}.`);
  });
})();

/* ---------- Scroll-scrubbed story ---------- */
const scrub = (() => {
  const sec = $('#tarina'), v = $('#scrubVid'), steps = $$('.sstep'), rail = $$('#scrubRail i'), proofs = $$('#scrubProof img'), lbl = $('#proofLbl'), num = $('#scrubN');
  let loaded = false, target = 0, shown = 0, active = -1;
  function load() {
    if (loaded) return; loaded = true;
    const url = vsrc(PHONE && v.dataset.srcM ? v.dataset.srcM : v.dataset.src);
    v.preload = 'auto'; v.src = url; v.load();
    // Hosts without range requests silently reset seeks to 0: then load the clip as a blob instead.
    v.addEventListener('loadedmetadata', () => {
      const t = Math.min(1, v.duration / 4);
      v.addEventListener('seeked', function chk() { v.removeEventListener('seeked', chk);
        if (Math.abs(v.currentTime - t) > 0.3) fetch(url).then(r => r.ok ? r.blob() : Promise.reject(r.status)).then(b => { v.src = URL.createObjectURL(b); v.load(); }).catch(() => {});
      });
      try { v.currentTime = t; } catch (e) {}
    }, { once: true });
  }
  if (PHONE) sec.classList.add('no-vid');
  v.addEventListener('canplay', () => sec.classList.remove('no-vid'));
  if (PHONE) {
    // First screen on phones is the poster; fetch the clip on first touch/scroll, or soon after load on a fast connection.
    const once = () => { load(); ['touchstart', 'scroll', 'pointerdown'].forEach(t => removeEventListener(t, once)); };
    ['touchstart', 'scroll', 'pointerdown'].forEach(t => addEventListener(t, once, { passive: true }));
    const cn = navigator.connection;
    if (!(cn && (cn.saveData || /2g|3g/.test(cn.effectiveType || '')))) addEventListener('load', () => setTimeout(load, 2500));
  } else {
    const lio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { load(); lio.disconnect(); } }, { rootMargin: '150% 0px' });
    lio.observe(sec);
  }
  let near = true;
  new IntersectionObserver(([e]) => { const was = near; near = e.isIntersecting; if (near && !was) requestAnimationFrame(tick); }, { rootMargin: '50% 0px' }).observe(sec);
  function setStep(i) {
    if (i === active) return; active = i;
    steps.forEach((s, k) => s.classList.toggle('on', k === i));
    proofs.forEach((p, k) => p.classList.toggle('on', k === i));
    lbl.textContent = 'Vaihe 0' + (i + 1); num.textContent = '0' + (i + 1);
  }
  setStep(0);
  function update() {
    const r = sec.getBoundingClientRect(), total = sec.offsetHeight - innerHeight;
    const intro = PHONE ? innerHeight * 0.7 : 0;
    sec.classList.toggle('is-intro', PHONE && -r.top < intro);
    const p = Math.min(1, Math.max(0, (-r.top - intro) / (total - intro)));
    const i = Math.min(6, Math.floor(p * 7)); setStep(i);
    rail.forEach((el, k) => el.style.setProperty('--f', Math.min(1, Math.max(0, p * 7 - k))));
    if (v.duration) target = p * (v.duration - 0.05);
  }
  function tick() {
    if (v.duration && !RM) {
      shown += (target - shown) * 0.18;
      if (Math.abs(v.currentTime - shown) > 0.012 && !v.seeking) { try { v.currentTime = shown; } catch (e) {} }
    }
    if (near) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  return update;
})();

/* ---------- Statement drift + parallax ---------- */
const drifts = $$('[data-drift]'), pars = $$('[data-par]');
function onScrollFx() {
  if (RM) return;
  drifts.forEach(el => { const r = el.getBoundingClientRect(); const k = Math.max(-1.2, Math.min(1.2, (r.top + r.height / 2 - innerHeight / 2) / innerHeight)); el.style.transform = `translate3d(${(+el.dataset.drift) * k * 22 - 6}vw,0,0)`; });
  pars.forEach(el => { const r = el.parentElement.getBoundingClientRect(); const k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; el.style.transform = `translate3d(0,${k * -6}%,0)`; });
}

let ticking = false;
addEventListener('scroll', () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { onHdr(); scrub(); onScrollFx(); ticking = false; }); }, { passive: true });
addEventListener('resize', () => { scrub(); onScrollFx(); });
onHdr(); scrub(); onScrollFx();

/* ---------- Cook timer ---------- */
(function cook() {
  const cv = $('#cookCv'), x = cv.getContext('2d');
  const MODES = { uuni: { t: 200, m: 30 }, airfryer: { t: 180, m: 18 } };
  let mode = 'uuni', dur = 30 * 60, left = dur, running = false, demo = false, tEnd = 0, raf;
  const fries = [];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 40; i++) { const a = rnd() * Math.PI * 2, r = .24 + rnd() * .1; fries.push({ x: .5 + Math.cos(a) * r, y: .5 + Math.sin(a) * r, ang: a + Math.PI / 2 + (rnd() - .5) * .9, len: .09 + rnd() * .05, w: .02 + rnd() * .007, sh: rnd() }); }
  function size() { const d = Math.min(devicePixelRatio || 1, 2), b = cv.getBoundingClientRect(); cv.width = b.width * d; cv.height = b.height * d; draw(); }
  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  function col(k, sh) {
    const pale = [236, 220, 170], gold = [233, 168, 70], deep = [176, 104, 38];
    const c = k < .7 ? mix(pale, gold, k / .7) : mix(gold, deep, (k - .7) / .3);
    return mix(c, [255, 255, 255], sh * .08);
  }
  function rr(cx, cy, w, h, r) { x.beginPath(); x.moveTo(cx - w / 2 + r, cy - h / 2); x.arcTo(cx + w / 2, cy - h / 2, cx + w / 2, cy + h / 2, r); x.arcTo(cx + w / 2, cy + h / 2, cx - w / 2, cy + h / 2, r); x.arcTo(cx - w / 2, cy + h / 2, cx - w / 2, cy - h / 2, r); x.arcTo(cx - w / 2, cy - h / 2, cx + w / 2, cy - h / 2, r); x.closePath(); }
  function draw(now = performance.now()) {
    const W = cv.width, H = cv.height, S = Math.min(W, H); x.clearRect(0, 0, W, H);
    const k = 1 - left / dur;
    // tray glow
    const g = x.createRadialGradient(W / 2, H / 2, S * .05, W / 2, H / 2, S * .5);
    g.addColorStop(0, `rgba(255,${150 + k * 40},70,${.10 + k * .22})`); g.addColorStop(1, 'rgba(255,120,40,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // plate
    x.fillStyle = '#16130f'; x.beginPath(); x.arc(W / 2, H / 2, S * .4, 0, 6.283); x.fill();
    x.strokeStyle = 'rgba(239,230,212,.08)'; x.lineWidth = S * .004; x.stroke();
    // progress ring
    x.lineCap = 'round'; x.lineWidth = S * .018;
    x.strokeStyle = 'rgba(239,230,212,.08)'; x.beginPath(); x.arc(W / 2, H / 2, S * .46, 0, 6.283); x.stroke();
    const rg = x.createLinearGradient(0, 0, W, H); rg.addColorStop(0, '#b9822f'); rg.addColorStop(1, '#f6c56b');
    x.strokeStyle = rg; x.beginPath(); x.arc(W / 2, H / 2, S * .46, -Math.PI / 2, -Math.PI / 2 + k * 6.283); x.stroke();
    // fries
    const jig = running && !RM ? 1 : 0;
    fries.forEach((f, i) => {
      const c = col(Math.min(1, k * 1.02 + f.sh * .05 * k), f.sh);
      const cx = W / 2 + (f.x - .5) * S + Math.sin(now / 300 + i) * jig * S * .0015;
      const cy = H / 2 + (f.y - .5) * S + Math.cos(now / 340 + i) * jig * S * .0015;
      x.save(); x.translate(cx, cy); x.rotate(f.ang);
      x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = S * .012; x.shadowOffsetY = S * .006;
      const fg = x.createLinearGradient(0, -f.w * S / 2, 0, f.w * S / 2);
      fg.addColorStop(0, `rgb(${mix(c, [255, 240, 200], .25)})`); fg.addColorStop(1, `rgb(${mix(c, [60, 30, 10], .25)})`);
      x.fillStyle = fg; rr(0, 0, f.len * S, f.w * S, f.w * S * .3); x.fill();
      x.restore();
    });
    // steam when hot
    if (k > .15 && !RM) {
      for (let i = 0; i < 6; i++) {
        const t = (now / 2400 + i / 6) % 1, sx = W / 2 + Math.sin(i * 2.3 + now / 900) * S * .16, sy = H / 2 + S * .12 - t * S * .45;
        x.fillStyle = `rgba(255,240,220,${(1 - t) * .07 * k})`; x.beginPath(); x.arc(sx, sy, S * (.04 + t * .06), 0, 6.283); x.fill();
      }
    }
  }
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function setMode(m) {
    mode = m; stop(); dur = MODES[m].m * 60; left = dur;
    $('#cTemp').innerHTML = MODES[m].t + ' °C'; $('#cTime').innerHTML = MODES[m].m + ' min';
    $('#cClock').textContent = fmt(left); $('#cState').textContent = 'Valmiina'; $('#cMsg').textContent = '';
    $$('.seg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m));
    draw();
  }
  function loop(now) {
    if (!running) return;
    const realLeft = Math.max(0, (tEnd - now) / 1000);
    left = demo ? realLeft * (dur / 10) : realLeft;
    $('#cClock').textContent = fmt(Math.ceil(left));
    const k = 1 - left / dur;
    $('#cState').textContent = k < .35 ? 'Lämpenee' : k < .75 ? 'Rapeutuu' : k < 1 ? 'Melkein valmis' : 'Valmis';
    draw(now);
    if (realLeft <= 0) { running = false; $('#cStart').textContent = 'Aloita alusta'; $('#cMsg').textContent = 'Valmista! Mausta oman makusi mukaan ja tarjoa heti.'; $('#cState').textContent = 'Valmis'; try { navigator.vibrate && navigator.vibrate([120, 80, 120]); } catch (e) {} return; }
    raf = requestAnimationFrame(loop);
  }
  function start(isDemo) {
    stop(); demo = isDemo; left = dur;
    tEnd = performance.now() + (demo ? 10000 : dur * 1000); running = true;
    $('#cStart').textContent = 'Pysäytä';
    $('#cMsg').textContent = demo ? 'Pikaesikatselu: koko paistoaika kymmenessä sekunnissa.' : `Ajastin käynnissä. ${MODES[mode].t} °C, ${MODES[mode].m} min.`;
    raf = requestAnimationFrame(loop);
    if (PHONE) $('.cook__stage').scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
  }
  function stop() { running = false; cancelAnimationFrame(raf); $('#cStart').textContent = 'Käynnistä ajastin'; }
  $$('.seg button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  $('#cStart').addEventListener('click', () => { if (running) { stop(); $('#cMsg').textContent = 'Ajastin pysäytetty.'; } else start(false); });
  $('#cDemo').addEventListener('click', () => start(true));
  addEventListener('resize', size); size();
  // idle shimmer
  if (!RM) { let last = 0; (function idle(t) { if (!running && t - last > 60) { draw(t); last = t; } requestAnimationFrame(idle); })(0); }
})();

/* ---------- Retailers ---------- */
(function shops() {
  const now = hkiNow(), hm = now.h + now.m / 60;
  $('#rgrid').innerHTML = SHOPS.map((s, i) => {
    const t = s.h[now.wd], open = t && hm >= t[0] && hm < t[1];
    return `<article class="rcard rv" style="--d:${i * .08}"><span class="rcard__city">${s.city}</span><h3>${s.name}</h3><address>${s.addr}</address>
      <span class="opennow ${open ? 'is-open' : ''}"><i></i>${open ? `Auki nyt, klo ${t[1]} asti` : 'Suljettu nyt'}</span>
      <dl class="hours">${s.rows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl>
      <div class="rcard__links"><a class="btn btn--sm btn--dark" href="${s.map}" target="_blank" rel="noopener">Avaa kartalla</a><a class="btn btn--sm btn--ghost" href="${s.web}" target="_blank" rel="noopener">Liikkeen sivuille</a></div></article>`;
  }).join('');
  $$('#rgrid .rv').forEach(el => io.observe(el));
})();

/* ---------- FAQ ---------- */
$$('.qa button').forEach(b => b.addEventListener('click', () => {
  const q = b.closest('.qa'), o = !q.classList.contains('open');
  $$('.qa').forEach(x => { x.classList.remove('open'); $('button', x).setAttribute('aria-expanded', 'false'); });
  if (o) { q.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
}));

/* ---------- Forms (preview) ---------- */
$$('#stars button').forEach((b, i, all) => b.addEventListener('click', () => all.forEach((x, k) => { x.classList.toggle('on', k <= i); x.setAttribute('aria-pressed', k <= i); })));
$('#fbForm').addEventListener('submit', e => { e.preventDefault(); const f = e.target; if (!f.checkValidity()) { f.reportValidity(); return; } $('#fbOk').classList.add('on'); f.reset(); $$('#stars button').forEach(x => x.classList.remove('on')); });
$('#nlForm').addEventListener('submit', e => { e.preventDefault(); const f = e.target; if (!f.checkValidity()) { f.reportValidity(); return; } $('#nlOk').classList.add('on'); store.set('gf_nl', true); f.reset(); });
})();
