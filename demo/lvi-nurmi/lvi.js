/* LVI Nurmi Oy demo site: reveal, menu, current page, open status, hero pipe, gutter pipe, rate gauge,
   area map, card pipes, steps pipe, emergency band, in-page nav spy.
   Every block runs inside its own try/catch and checks for its elements first, so any page can load this file. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, win = window;
  var reduce = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var hasIO = 'IntersectionObserver' in win;
  var raf = win.requestAnimationFrame ? win.requestAnimationFrame.bind(win) : function (f) { return setTimeout(f, 16); };
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function mq(q) { return !!(win.matchMedia && win.matchMedia(q).matches); }
  function block(name, fn) {
    try { fn(); } catch (err) { if (win.console && console.warn) console.warn('lvi.js: ' + name + ' skipped', err); }
  }
  function cssTimeline() {
    return !!(win.CSS && CSS.supports && CSS.supports('animation-timeline: view()') && CSS.supports('view-timeline-name: --a'));
  }
  function focusable(el) {
    if (el.matches('a[href],button,input,select,textarea,[tabindex]')) return;
    el.setAttribute('tabindex', '0');
  }

  /* 1. reveal on scroll. html.js (which hides .rv) is added only once the observer exists;
        if anything fails before that, the CSS failsafe shows .rv after 2.5 s. */
  block('reveal', function () {
    var els = $$('.rv');
    if (reduce || !hasIO) { els.forEach(function (el) { el.classList.add('on'); }); root.classList.add('js'); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('on');
        io.unobserve(e.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
    root.classList.add('js');
  });

  /* 2. mobile menu: full panel, inert background, focus first link, restore on close */
  block('menu', function () {
    var btn = $('.menu-btn'), nav = $('#nav'), top = $('.top');
    if (!btn || !nav) return;
    var bg = ['#main', 'footer', '.callbar', '.tb'];
    function place() {
      var b = top ? top.getBoundingClientRect().bottom : 0;
      root.style.setProperty('--nav-top', Math.max(0, Math.round(b)) + 'px');
    }
    function setInert(on) {
      bg.forEach(function (s) {
        $$(s).forEach(function (el) {
          if (on) { el.setAttribute('inert', ''); el.inert = true; } else { el.removeAttribute('inert'); el.inert = false; }
        });
      });
    }
    function isOpen() { return nav.classList.contains('open'); }
    function set(open, focusBtn) {
      if (open === isOpen()) return;
      if (open) place();
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      doc.body.classList.toggle('nav-open', open);
      setInert(open);
      if (open) { var first = nav.querySelector('a'); if (first) first.focus(); }
      else if (focusBtn) btn.focus();
    }
    btn.addEventListener('click', function () { set(!isOpen(), true); });
    doc.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && isOpen()) set(false, true);
    });
    nav.addEventListener('click', function (e) { if (isOpen() && e.target.closest && e.target.closest('a')) set(false); });
    win.addEventListener('resize', function () {
      if (!isOpen()) return;
      if (win.innerWidth > 960) set(false); else place();
    });
    win.addEventListener('scroll', function () { if (isOpen()) place(); }, { passive: true });
  });

  /* 3. aria-current from <body data-page> */
  block('current', function () {
    var page = doc.body && doc.body.getAttribute('data-page');
    if (!page) return;
    var href = page + '.html';
    $$('#nav a').forEach(function (a) {
      if (a.classList.contains('call')) return;
      if ((a.getAttribute('href') || '').split('#')[0] === href) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  });

  /* 4. open status (D11): Europe/Helsinki, ma-pe 7-17, Finnish public holidays closed.
        Text changes only when the state changes; no live region. HTML default stays "Päivystys 24/7". */
  block('status', function () {
    var labels = $$('[data-status]'), box = $('.tb .open');
    if (!labels.length) return;
    var OPEN = 'Avoinna nyt, toimisto vastaa klo 17 asti', CLOSED = 'Toimisto kiinni, päivystys vastaa';
    function easter(y) {
      var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
          f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
          i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
      return [Math.floor((h + l - 7 * m + 114) / 31), ((h + l - 7 * m + 114) % 31) + 1];
    }
    function isHoliday(y, mo, d) {
      if (['1-1', '1-6', '5-1', '12-6', '12-24', '12-25', '12-26'].indexOf(mo + '-' + d) > -1) return true;
      if (mo === 6 && d >= 19 && d <= 25 && new Date(Date.UTC(y, 5, d)).getUTCDay() === 5) return true; // juhannusaatto
      var e = easter(y), base = Date.UTC(y, e[0] - 1, e[1]), day = 864e5, t = Date.UTC(y, mo - 1, d);
      return t === base - 2 * day || t === base + day || t === base + 39 * day;
    }
    function now() {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Helsinki', year: 'numeric', month: 'numeric', day: 'numeric',
        weekday: 'short', hour: 'numeric', hourCycle: 'h23'
      }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      return { y: +o.year, mo: +o.month, d: +o.day, wd: o.weekday, h: +o.hour % 24 };
    }
    var last = null;
    function update() {
      var n = now();
      var open = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(n.wd) > -1 && n.h >= 7 && n.h < 17 && !isHoliday(n.y, n.mo, n.d);
      if (open === last) return;
      last = open;
      labels.forEach(function (l) { l.textContent = open ? OPEN : CLOSED; });
      if (box) { box.classList.toggle('is-open', open); box.classList.toggle('is-closed', !open); }
    }
    update();
    setInterval(update, 60000);
  });

  /* 5. hero pipe: from the CTA row, across the gap, one elbow up (or down), into the photo; then water slugs */
  block('hero-pipe', function () {
    var svg = $('.hero-pipe');
    if (!svg) return;
    var fig = svg.closest('.hero-photo') || svg.parentNode, hero = svg.closest('.hero') || doc;
    var cta = $('.cta', hero), text = fig.previousElementSibling;
    var paths = $$('.hp-p', svg), start = $('.hp-start', svg), collar = $('.hp-collar', svg), nut = $('.hp-nut', svg);
    var entry = parseFloat(svg.getAttribute('data-entry')) || 0.29, endF = parseFloat(svg.getAttribute('data-end')) || 0.19;
    var img = $('img', fig), tap = (svg.getAttribute('data-tap') || '').split(/[\s,]+/).map(parseFloat).filter(function (n) { return !isNaN(n); });
    var R = 28, drawn = false;
    function rect(el, x, y, w, h) { el.setAttribute('x', x); el.setAttribute('y', y); if (w) el.setAttribute('width', w); if (h) el.setAttribute('height', h); }
    function layout() {
      if (!mq('(min-width: 961px)')) return false;
      var F = fig.getBoundingClientRect(), W = F.width, H = F.height;
      if (!W || !H) return false;
      var gap = text ? Math.max(24, F.left - text.getBoundingClientRect().right) : 64;
      var gx = Math.round(-gap / 2), ey = Math.round(H * entry), ex = Math.round(W * endF);
      if (img && tap.length === 2) {
        // tap point is given in image pixels; map it through object-fit: cover and object-position
        var iw = +img.getAttribute('width') || img.naturalWidth, ih = +img.getAttribute('height') || img.naturalHeight;
        if (iw && ih) {
          var k = Math.max(W / iw, H / ih), pos = (getComputedStyle(img).objectPosition || '50% 50%').split(' ');
          var px = parseFloat(pos[0]) / 100, py = parseFloat(pos[1] || pos[0]) / 100;
          if (isNaN(px)) px = 0.5; if (isNaN(py)) py = 0.5;
          ex = Math.round((W - iw * k) * px + tap[0] * k);
          ey = Math.round((H - ih * k) * py + tap[1] * k);
        }
      }
      var sx = gx - 150, sy = Math.round(H * 0.72);
      if (cta) {
        var C = cta.getBoundingClientRect(), right = C.left;
        $$(':scope > *', cta).forEach(function (b) { var r = b.getBoundingClientRect(); if (r.width && r.right > right) right = r.right; });
        sx = Math.round(right - F.left + 22);
        sy = Math.round(C.top + C.height / 2 - F.top);
      }
      sx = Math.min(sx, gx - R - 18);
      var d, dir = ey < sy ? -1 : 1;
      if (Math.abs(sy - ey) < 2 * R + 4) {
        d = 'M' + sx + ' ' + ey + ' H' + ex;
        sy = ey;
      } else {
        d = 'M' + sx + ' ' + sy + ' H' + (gx - R) +
          ' A' + R + ' ' + R + ' 0 0 ' + (dir < 0 ? 0 : 1) + ' ' + gx + ' ' + (sy + dir * R) +
          ' V' + (ey - dir * R) +
          ' A' + R + ' ' + R + ' 0 0 ' + (dir < 0 ? 1 : 0) + ' ' + (gx + R) + ' ' + ey +
          ' H' + ex;
      }
      svg.setAttribute('viewBox', '0 0 ' + Math.round(W) + ' ' + Math.round(H));
      svg.setAttribute('width', Math.round(W));
      svg.setAttribute('height', Math.round(H));
      paths.forEach(function (p) { p.setAttribute('d', d); });
      if (start) rect(start, sx - 5, sy - 13);
      if (collar) rect(collar, -4, ey - 11);
      if (nut) rect(nut, ex - 3, ey - 12);
      svg.classList.add('is-ready');
      return true;
    }
    var stopT, parkT;
    function flow() {
      if (reduce) { svg.classList.add('flow'); return; }
      clearTimeout(stopT); clearTimeout(parkT);
      svg.classList.add('flow');
      svg.classList.remove('idle', 'parked');
      stopT = setTimeout(function () {
        svg.classList.add('idle');
        parkT = setTimeout(function () { svg.classList.add('parked'); }, 700);
      }, 8000);
    }
    function run() {
      if (drawn || !layout()) return;
      drawn = true;
      if (reduce) { flow(); return; }
      svg.classList.add('armed');
      void svg.getBoundingClientRect();
      raf(function () { raf(function () { svg.classList.add('run'); }); });
      setTimeout(flow, 1450);
    }
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { block('hero-pipe run', run); }); else run();
    setTimeout(function () { block('hero-pipe run', run); }, 400);
    var rt;
    win.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { block('hero-pipe layout', function () { if (drawn) layout(); else run(); }); }, 120);
    });
    [fig, cta].forEach(function (el) {
      if (el) el.addEventListener('mouseenter', function () { if (drawn && svg.classList.contains('idle')) flow(); });
    });
  });

  /* 6. gutter pipe (index desktop): from the hero bottom to the emergency band, tee at each section's eyebrow */
  block('gutter-pipe', function () {
    var gp = $('.gutter-pipe');
    if (!gp) return;
    var main = gp.parentNode, hero = $('.hero', main), em = $('.em', main);
    var useCss = cssTimeline() && !reduce, tees = [];
    function offTop(el) { var y = 0; while (el && el !== main) { y += el.offsetTop; el = el.offsetParent; } return y; }
    function layout() {
      if (win.innerWidth < 1100) return;
      var top = hero ? offTop(hero) + hero.offsetHeight : 0;
      var end = em ? offTop(em) : main.offsetHeight;
      if (end - top < 100) return;
      gp.style.setProperty('--gp-top', top + 'px');
      gp.style.setProperty('--gp-h', (end - top) + 'px');
      tees.forEach(function (t) { t.remove(); });
      tees = [];
      $$(':scope > section', main).forEach(function (sec) {
        var y = offTop(sec);
        if (y <= top + 20 || y >= end - 20) return;
        var mark = $('.eyebrow', sec) || $('h2', sec);
        var ty = mark ? offTop(mark) + mark.offsetHeight / 2 : y + 80;
        var t = doc.createElement('i');
        t.className = 'gp-tee';
        t.style.top = Math.round(ty - top) + 'px';
        gp.appendChild(t);
        tees.push(t);
      });
      if (!$('.gp-end', gp)) { var e = doc.createElement('i'); e.className = 'gp-end'; gp.appendChild(e); }
      scrollFill();
    }
    function scrollFill() {
      if (useCss) return;
      if (reduce) { gp.style.setProperty('--gp', 1); tees.forEach(function (t) { t.classList.add('on'); }); return; }
      var r = gp.getBoundingClientRect(), line = win.innerHeight * 0.6;
      var p = r.height ? Math.max(0, Math.min(1, (line - r.top) / r.height)) : 1;
      gp.style.setProperty('--gp', p.toFixed(4));
      tees.forEach(function (t) { t.classList.toggle('on', t.getBoundingClientRect().top <= line); });
    }
    if (useCss) gp.classList.add('css-tl');
    else gp.style.setProperty('--gp', reduce ? 1 : 0);
    var ticking = false;
    win.addEventListener('scroll', function () { if (useCss || ticking) return; ticking = true; raf(function () { ticking = false; scrollFill(); }); }, { passive: true });
    var lt;
    function later() { clearTimeout(lt); lt = setTimeout(function () { block('gutter layout', layout); }, 150); }
    win.addEventListener('resize', later);
    win.addEventListener('load', later);
    if ('ResizeObserver' in win) new ResizeObserver(later).observe(main);
    layout();
  });

  /* 7. rate gauge: rows with data-rate swing the needle; rest = data-rest (74) */
  block('gauge', function () {
    var gauges = $$('.rate-gauge');
    if (!gauges.length) return;
    var stops = [74, 118, 138, 168, 178], angles = [-120, -60, 0, 60, 120];
    var subs = { 74: 'arki 7–17', 118: 'arki-ilta', 138: 'lauantai', 168: 'yö 22–7', 178: 'su ja pyhät' };
    function angleFor(v) {
      if (v <= stops[0]) return angles[0] - Math.min(15, (stops[0] - v) / 4);
      for (var i = 1; i < stops.length; i++) {
        if (v <= stops[i]) return angles[i - 1] + (angles[i] - angles[i - 1]) * (v - stops[i - 1]) / (stops[i] - stops[i - 1]);
      }
      return angles[angles.length - 1];
    }
    function fmt(v) { return String(v).replace('.', ',') + ' €/h'; }
    function setRate(g, v) {
      var a = angleFor(v), frac = Math.max(0, Math.min(1, (a + 120) / 240));
      var svg = $('svg', g);
      svg.style.setProperty('--a', a.toFixed(1) + 'deg');
      svg.style.setProperty('--g-off', (100 - Math.max(2, frac * 100)).toFixed(2));
      var val = $('.g-val', g), sub = $('.g-sub', g);
      if (val && val.textContent !== fmt(v)) val.textContent = fmt(v);
      if (sub) sub.textContent = subs[v] || '';
      $$('.g-lbl text', g).forEach(function (t, i) { t.classList.toggle('on', stops[i] === v); });
    }
    gauges.forEach(function (g) {
      var rest = parseFloat(g.getAttribute('data-rest')) || 74;
      g._rest = rest;
      setRate(g, rest);
      if (reduce || !hasIO) return;
      // a short "pressure test" the first time the gauge is seen: needle from the peg up to the rest rate
      var svg = $('svg', g);
      svg.style.setProperty('--a', '-138deg');
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.disconnect();
          setTimeout(function () { setRate(g, rest); }, 200);
        });
      }, { threshold: 0.6 });
      io.observe(g);
    });
    function gaugeFor(el) {
      var sec = el.closest('section, .pt-gauge, .split, main');
      while (sec) {
        var g = $('.rate-gauge', sec);
        if (g) return g;
        sec = sec.parentElement && sec.parentElement.closest('section, main');
      }
      return gauges[0];
    }
    $$('[data-rate]').forEach(function (row) {
      var v = parseFloat(String(row.getAttribute('data-rate')).replace(',', '.'));
      if (isNaN(v)) return;
      var g = gaugeFor(row);
      if (!g) return;
      focusable(row);
      function on() { clearTimeout(g._t); $$('.is-rate').forEach(function (r) { r.classList.remove('is-rate'); }); row.classList.add('is-rate'); setRate(g, v); }
      function off() { row.classList.remove('is-rate'); clearTimeout(g._t); g._t = setTimeout(function () { setRate(g, g._rest); }, 260); }
      row.addEventListener('mouseenter', on);
      row.addEventListener('focus', on);
      row.addEventListener('click', on);
      row.addEventListener('mouseleave', off);
      row.addEventListener('blur', off);
    });
  });

  /* 8. area map: water fills every pipe once when the map is seen; [data-city] hover/focus sends flow to one tap */
  block('area-map', function () {
    var map = $('svg.am');
    if (!map) return;
    var lines = $$('[data-am]', map), items = $$('[data-city]');
    if (!reduce && hasIO) {
      map.classList.add('armed');
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.disconnect();
          setTimeout(function () { map.classList.add('filled'); }, 150);
        });
      }, { threshold: 0.4 });
      io.observe(map);
    }
    function norm(s) { return String(s || '').trim().toLowerCase(); }
    function set(name) {
      var n = norm(name), any = false;
      lines.forEach(function (l) { var hit = norm(l.getAttribute('data-am')) === n; l.classList.toggle('on', hit); any = any || hit; });
      map.classList.toggle('focus', any);
      if (any) map.classList.add('filled');
      items.forEach(function (it) { it.classList.toggle('is-city', any && norm(it.getAttribute('data-city')) === n); });
    }
    var t;
    function clear() { clearTimeout(t); t = setTimeout(function () { set(''); }, 120); }
    function enter(name) { clearTimeout(t); set(name); }
    items.forEach(function (it) {
      focusable(it);
      var name = it.getAttribute('data-city');
      it.addEventListener('mouseenter', function () { enter(name); });
      it.addEventListener('focus', function () { enter(name); });
      it.addEventListener('mouseleave', clear);
      it.addEventListener('blur', clear);
    });
    lines.forEach(function (l) {
      l.addEventListener('mouseenter', function () { enter(l.getAttribute('data-am')); });
      l.addEventListener('mouseleave', clear);
    });
  });

  /* 9. card / row pipes on touch screens: fill once at 60 % visibility, 80 ms stagger */
  block('fills', function () {
    var fills = $$('.fill');
    if (!fills.length || !mq('(hover: none)')) return;
    if (reduce || !hasIO) { fills.forEach(function (f) { f.classList.add('is-on'); }); return; }
    var io = new IntersectionObserver(function (es) {
      var batch = es.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      batch.sort(function (a, b) { return fills.indexOf(a) - fills.indexOf(b); });
      batch.forEach(function (f, i) { io.unobserve(f); setTimeout(function () { f.classList.add('is-on'); }, i * 80); });
    }, { threshold: 0.6 });
    fills.forEach(function (f) { io.observe(f); });
  });

  /* 10. steps pipe: CSS scroll timeline where supported, otherwise scroll + rAF writes --fill and li.on */
  block('steps', function () {
    var lists = $$('.steps');
    if (!lists.length) return;
    if (reduce) { lists.forEach(function (l) { l.classList.add('is-static'); }); return; }
    if (cssTimeline()) { lists.forEach(function (l) { l.classList.add('has-css-timeline'); }); return; }
    lists.forEach(function (l) { l.classList.add('js-timeline'); l.style.setProperty('--fill', 0); });
    var ticking = false;
    function update() {
      ticking = false;
      var line = win.innerHeight * 0.6;
      lists.forEach(function (l) {
        var r = l.getBoundingClientRect();
        var p = r.height ? Math.max(0, Math.min(1, (line - r.top) / r.height)) : 1;
        l.style.setProperty('--fill', p.toFixed(4));
        $$(':scope > li', l).forEach(function (li) { li.classList.toggle('on', li.getBoundingClientRect().top + 14 <= line); });
      });
    }
    function onScroll() { if (!ticking) { ticking = true; raf(update); } }
    win.addEventListener('scroll', onScroll, { passive: true });
    win.addEventListener('resize', onScroll);
    update();
  });

  /* 11. emergency band: a hairline crack runs across from where the gutter pipe ends (or the left edge),
         drops spray out of the crack, then the big phone number is underlined once */
  block('em', function () {
    var bands = $$('.em');
    if (!bands.length || reduce || !hasIO) return;
    var NS = 'http://www.w3.org/2000/svg';
    function crack(w, ox) {
      // deterministic jagged line + three short forks; coordinates in px, y around 14
      var seed = 7, x = ox, y = 14, d = 'M' + ox + ' 14', forks = [];
      function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
      var n = 0;
      while (x < w) {
        x += 14 + rnd() * 34;
        y = 14 + (rnd() - 0.5) * 7;
        d += ' L' + Math.round(Math.min(x, w)) + ' ' + y.toFixed(1);
        n++;
        if (n === 3 || n === 9 || n === 16) {
          var fx = Math.round(x), fy = y, len = 16 + rnd() * 22, up = n % 2 ? -1 : 1;
          forks.push('M' + fx + ' ' + fy.toFixed(1) + ' l' + Math.round(len * 0.6) + ' ' + (up * (5 + rnd() * 6)).toFixed(1) + ' l' + Math.round(len * 0.5) + ' ' + (up * (2 + rnd() * 4)).toFixed(1));
        }
      }
      return { main: d, forks: forks.join(' ') };
    }
    bands.forEach(function (em) {
      var fx = doc.createElement('div');
      fx.className = 'em-fx';
      fx.setAttribute('aria-hidden', 'true');
      em.insertBefore(fx, em.firstChild);
      function build() {
        fx.innerHTML = '';
        var er = em.getBoundingClientRect(), w = Math.round(er.width);
        var gp = $('.gutter-pipe'), ox = 0;
        if (gp && gp.offsetWidth) ox = Math.round(gp.getBoundingClientRect().left - er.left + 3);
        var svg = doc.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'em-crack');
        svg.setAttribute('viewBox', '0 0 ' + w + ' 28');
        svg.setAttribute('width', w);
        svg.setAttribute('height', 28);
        var c = crack(Math.round(ox + (w - ox) * 0.72), ox);
        var gid = 'em-crack-g' + bands.indexOf(em);
        svg.innerHTML = '<defs><linearGradient id="' + gid + '" gradientUnits="userSpaceOnUse" x1="' + ox + '" y1="0" x2="' + Math.round(ox + (w - ox) * 0.72) + '" y2="0">' +
          '<stop offset="0" stop-color="#d6e6ff" stop-opacity=".75"/><stop offset=".6" stop-color="#d6e6ff" stop-opacity=".35"/><stop offset="1" stop-color="#d6e6ff" stop-opacity="0"/></linearGradient></defs>';
        svg.style.setProperty('--crack', 'url(#' + gid + ')');
        [['em-c-main', c.main], ['em-c-fork', c.forks]].forEach(function (p) {
          if (!p[1]) return;
          var path = doc.createElementNS(NS, 'path');
          path.setAttribute('class', p[0]);
          path.setAttribute('pathLength', '1');
          path.setAttribute('d', p[1]);
          svg.appendChild(path);
        });
        fx.appendChild(svg);
        // drops burst out of the crack at its start, falling into the band
        var sx = ox ? ox : Math.round(Math.max(24, (w - 1180) / 2 + 24)), sy = 8;
        var spray = [[-30, 34], [-14, 58], [2, 70], [16, 62], [30, 44], [46, 24], [-22, 12], [60, 8]];
        spray.forEach(function (s, i) {
          var dr = doc.createElement('i');
          dr.className = 'em-drop';
          dr.style.left = (sx + (ox ? 0 : 0)) + 'px';
          dr.style.top = sy + 'px';
          dr.style.setProperty('--dx', (ox ? Math.abs(s[0]) + 4 : s[0]) + 'px');
          dr.style.setProperty('--dy', s[1] + 'px');
          dr.style.setProperty('--i', i);
          fx.appendChild(dr);
        });
      }
      build();
      em.classList.add('fx-armed');
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.disconnect();
          // wait for the section's own reveal fade to finish
          setTimeout(function () { em.classList.add('fx-run'); }, em.classList.contains('rv') ? 520 : 60);
        });
      }, { threshold: 0.4 });
      io.observe(em);
      var rt;
      win.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { block('em build', build); }, 200); });
    });
  });

  /* 12. in-page nav spy: <nav data-spy> with links to #ids on the page */
  block('spy', function () {
    $$('[data-spy]').forEach(function (nav) {
      if (!hasIO) return;
      var links = $$('a[href^="#"]', nav), map = {};
      links.forEach(function (a) { var t = doc.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); if (t) map[t.id] = a; });
      var ids = Object.keys(map);
      if (!ids.length) return;
      function mark(id) {
        links.forEach(function (a) { var on = map[id] === a; a.classList.toggle('is-current', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      }
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); });
      }, { rootMargin: '-40% 0px -55% 0px' });
      ids.forEach(function (id) { io.observe(doc.getElementById(id)); });
    });
  });

  /* 13. pause infinite loops while offscreen (hero pipe slugs, open dot is tiny and stays) */
  block('offscreen', function () {
    if (!hasIO) return;
    var els = $$('.hero-pipe, svg.am');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('is-offscreen', !e.isIntersecting); });
    });
    els.forEach(function (el) { io.observe(el); });
  });
})();
