/* Leipomokahvila Kaarna demo site (fictional company, built by Marktic).
   Blocks: reveal, header state, mobile menu, aria-current, exception hours (+ expiry), open-now status,
   hours "today", bake strip labels, clock, lunch week today, steam rig, in-page spy, pre-order mailto form.
   Every block runs inside its own try/catch and checks for its elements first, so any page can load this file.
   All content is in the HTML; this file only enhances it. Time is always Europe/Helsinki.
   Demo override for testing: ?now=2026-10-21T09:40 (Helsinki local time). */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, win = window;
  var reduce = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var hasIO = 'IntersectionObserver' in win;
  var raf = win.requestAnimationFrame ? win.requestAnimationFrame.bind(win) : function (f) { return setTimeout(f, 16); };
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function block(name, fn) {
    try { fn(); } catch (err) { if (win.console && console.warn) console.warn('kaarna.js: ' + name + ' skipped', err); }
  }
  function setText(el, txt) { if (el && el.textContent !== txt) el.textContent = txt; }

  /* ---------- time model (shared) ---------- */
  var DAY = 864e5;
  var ADESS = ['', 'maanantaina', 'tiistaina', 'keskiviikkona', 'torstaina', 'perjantaina', 'lauantaina', 'sunnuntaina'];
  var SHORT = ['', 'ma', 'ti', 'ke', 'to', 'pe', 'la', 'su'];
  // regular opening hours in minutes from midnight, ISO weekday 1 = ma ... 7 = su; null = closed
  var REG = { 1: [420, 960], 2: [420, 960], 3: [420, 960], 4: [420, 960], 5: [420, 960], 6: [540, 900], 7: null };
  // exceptions (poikkeusaukioloajat); [data-exception][data-hours] elements on the page add to / override these
  var EXC = { '2026-10-31': [600, 840], '2026-12-06': null };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function key(d) { return d.y + '-' + pad(d.mo) + '-' + pad(d.d); }
  function fromUTC(t) { var x = new Date(t); return { y: x.getUTCFullYear(), mo: x.getUTCMonth() + 1, d: x.getUTCDate(), wd: x.getUTCDay() || 7 }; }
  function addDays(d, k) { return fromUTC(Date.UTC(d.y, d.mo - 1, d.d) + k * DAY); }
  function parseKey(s) { var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? fromUTC(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; }
  function fmtTime(m) { var h = Math.floor(m / 60), mm = m % 60; return h + (mm ? '.' + pad(mm) : ''); }
  function fmtClock(m) { return Math.floor(m / 60) + '.' + pad(m % 60); }
  function fmtDate(d) { return SHORT[d.wd] + ' ' + d.d + '.' + d.mo + '.' + d.y; }
  function toMin(s) { var m = String(s).trim().match(/^(\d{1,2})(?:[.:](\d{2}))?$/); return m ? +m[1] * 60 + (+m[2] || 0) : NaN; }
  function parseRange(s) {
    s = String(s || '').trim().toLowerCase();
    if (!s || s === 'closed' || s === 'suljettu') return null;
    var p = s.split(/\s*[-–]\s*/);
    var a = toMin(p[0]), b = toMin(p[1]);
    return isNaN(a) || isNaN(b) ? undefined : [a, b];
  }
  function now() {
    var q = (win.location.search || '').match(/[?&]now=(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2})[:.](\d{2})/);
    if (q) { var d = fromUTC(Date.UTC(+q[1], +q[2] - 1, +q[3])); d.m = +q[4] * 60 + +q[5]; return d; }
    var o = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
      .formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
    var t = fromUTC(Date.UTC(+o.year, +o.month - 1, +o.day));
    t.m = (+o.hour % 24) * 60 + +o.minute;
    return t;
  }
  function hoursOn(d) { var k = key(d); return Object.prototype.hasOwnProperty.call(EXC, k) ? EXC[k] : REG[d.wd]; }
  // next day (k >= 1) the café is open: { d, k, h }
  function nextOpen(d) {
    for (var k = 1; k <= 21; k++) { var x = addDays(d, k), h = hoursOn(x); if (h) return { d: x, k: k, h: h }; }
    return null;
  }
  function whenWord(k, d) { return k === 1 ? 'huomenna' : ADESS[d.wd]; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* 1. reveal on scroll. html.js (which hides .rv) is added only once the observer exists; CSS failsafe after 2.5 s */
  block('reveal', function () {
    var els = $$('.rv');
    if (reduce || !hasIO) { els.forEach(function (el) { el.classList.add('on'); }); root.classList.add('js'); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
    root.classList.add('js');
  });

  /* 2. header hairline once the page has scrolled */
  block('header', function () {
    var top = $('.top');
    if (!top) return;
    var on = null;
    function check() { var s = (win.scrollY || 0) > 4; if (s !== on) { on = s; top.classList.toggle('is-scrolled', s); } }
    win.addEventListener('scroll', check, { passive: true });
    check();
  });

  /* 3. mobile menu: full panel under the header, background inert, focus first link, Esc closes */
  block('menu', function () {
    var btn = $('.menu-btn'), nav = $('#nav'), top = $('.top');
    if (!btn || !nav) return;
    var bg = ['main', 'footer', '.callbar', '.cats', '.skip'];
    function place() { root.style.setProperty('--nav-top', Math.max(0, Math.round(top ? top.getBoundingClientRect().bottom : 0)) + 'px'); }
    function setInert(on) {
      bg.forEach(function (s) {
        $$(s).forEach(function (el) {
          if (nav.contains(el) || el.contains(nav)) return;
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
      setText($('.menu-lbl', btn), open ? 'Sulje' : 'Valikko');
      doc.body.classList.toggle('nav-open', open);
      setInert(open);
      if (open) { var first = $('a', nav); if (first) first.focus(); }
      else if (focusBtn) btn.focus();
    }
    btn.addEventListener('click', function () { set(!isOpen(), true); });
    doc.addEventListener('keydown', function (e) { if ((e.key === 'Escape' || e.key === 'Esc') && isOpen()) set(false, true); });
    nav.addEventListener('click', function (e) { if (isOpen() && e.target.closest && e.target.closest('a')) set(false); });
    win.addEventListener('resize', function () { if (!isOpen()) return; if (win.innerWidth > 1100) set(false); else place(); });
  });

  /* 4. aria-current from <body data-page> */
  block('current', function () {
    var page = doc.body && doc.body.getAttribute('data-page');
    if (!page) return;
    var href = page + '.html';
    $$('.nav-list a').forEach(function (a) {
      if ((a.getAttribute('href') || '').split('#')[0] === href) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  });

  /* 5. exception hours: read [data-exception="YYYY-MM-DD"][data-hours="10-14"|"suljettu"] into the model,
        hide [data-exception] / [data-expires] entries whose date has passed, empty lists show [data-exceptions-empty] */
  block('exceptions', function () {
    var today = key(now());
    $$('[data-exception]').forEach(function (el) {
      var k = el.getAttribute('data-exception'), h = el.getAttribute('data-hours');
      if (h !== null && parseKey(k)) { var r = parseRange(h); if (r !== undefined) EXC[k] = r; }
    });
    $$('[data-exception],[data-expires]').forEach(function (el) {
      var k = el.getAttribute('data-expires') || el.getAttribute('data-exception');
      if (parseKey(k) && k < today) el.hidden = true;
    });
    $$('[data-exceptions]').forEach(function (box) {
      var left = $$('[data-exception]', box).filter(function (el) { return !el.hidden; }).length;
      box.classList.toggle('is-empty', !left);
      var empty = $('[data-exceptions-empty]', box) || (box.nextElementSibling && box.nextElementSibling.hasAttribute('data-exceptions-empty') ? box.nextElementSibling : null);
      if (empty) empty.hidden = !!left;
    });
  });

  /* 6. open-now status chips [data-status]: text changes only when it changes (no live region), checked every 60 s */
  block('status', function () {
    var chips = $$('[data-status]');
    if (!chips.length) return;
    function info() {
      var n = now(), h = hoursOn(n);
      if (h && n.m >= h[0] && n.m < h[1]) return { open: true, txt: 'Avoinna nyt · suljemme klo ' + fmtTime(h[1]) };
      if (h && n.m < h[0]) return { open: false, txt: 'Suljettu · avaamme tänään klo ' + fmtTime(h[0]) };
      var nx = nextOpen(n);
      return { open: false, txt: nx ? 'Suljettu · avaamme ' + whenWord(nx.k, nx.d) + ' klo ' + fmtTime(nx.h[0]) : 'Suljettu' };
    }
    var last = '';
    function update() {
      var s = info(), sig = s.open + s.txt;
      if (sig === last) return;
      last = sig;
      chips.forEach(function (c) {
        setText($('.status-txt', c) || c, s.txt);
        c.classList.toggle('is-open', s.open);
        c.classList.toggle('is-closed', !s.open);
      });
    }
    update();
    setInterval(function () { block('status tick', update); }, 60000);
  });

  /* 7. hours lists: <div data-days="1-5"> (ISO weekdays, ranges or commas) gets .is-today */
  block('hours-today', function () {
    var rows = $$('[data-days]').filter(function (el) { return !el.hasAttribute('data-time'); });
    if (!rows.length) return;
    var wd = now().wd;
    rows.forEach(function (r) { r.classList.toggle('is-today', daysOf(r.getAttribute('data-days')).indexOf(wd) > -1); });
  });
  function daysOf(s) {
    var out = [];
    String(s || '').split(',').forEach(function (part) {
      var p = part.split(/[-–]/).map(function (x) { return parseInt(x, 10); });
      if (p.length === 2 && !isNaN(p[0]) && !isNaN(p[1])) { for (var i = p[0]; i <= p[1]; i++) out.push(i); }
      else if (!isNaN(p[0])) out.push(p[0]);
    });
    return out;
  }

  /* 8. clock: [data-clock] shows Helsinki time "9.40" */
  block('clock', function () {
    var els = $$('[data-clock]');
    if (!els.length) return;
    function tick() { var t = fmtClock(now().m); els.forEach(function (e) { setText(e, t); }); }
    tick();
    setInterval(function () { block('clock tick', tick); }, 15000);
  });

  /* 9. bake strip <ol class="bake" data-bake><li data-time="06:30"> ...: labels from the real clock.
        fresh (0-90 min): steam glyph + "Uunista n min sitten"; next one: "Uunista klo 11.00" + progress bar;
        older: "Tiskissä, kunnes loppuu"; closed: "Huomenna uunista klo 6.30" / "Maanantaina ...".
        Optional li[data-days="2,5"] (ISO weekdays) + data-days-label="ti ja pe" for day-specific items. */
  block('bake', function () {
    var lists = $$('[data-bake]');
    if (!lists.length) return;
    var GLYPH = '<svg class="bake-glyph" viewBox="0 0 22 28" aria-hidden="true" focusable="false">' +
      '<path pathLength="1" d="M5 26 C1 20 9 16 5 9 C3 5 6 3 5 1"/><path pathLength="1" d="M11 26 C15 20 7 15 11 9 C13 5 10 3 11 1"/>' +
      '<path pathLength="1" d="M17 26 C13 20 21 16 17 9 C15 5 18 3 17 1"/></svg>';
    var rows = [];
    lists.forEach(function (ol) {
      $$(':scope > li[data-time]', ol).forEach(function (li) {
        var t = toMin(li.getAttribute('data-time'));
        if (isNaN(t)) return;
        var st = $('.bake-state', li);
        if (!st) {
          st = doc.createElement('p');
          st.className = 'bake-state';
          st.innerHTML = GLYPH + '<span class="bake-label"></span><span class="bake-bar" aria-hidden="true"><i></i></span>';
          li.appendChild(st);
        }
        rows.push({ li: li, t: t, ol: ol, label: $('.bake-label', st), bar: $('.bake-bar i', st), days: li.hasAttribute('data-days') ? daysOf(li.getAttribute('data-days')) : null, daysLabel: li.getAttribute('data-days-label') || '' });
      });
      ol.classList.add('is-live');
    });
    function set(r, cls, txt, p) {
      ['is-fresh', 'is-next', 'is-past', 'is-off', 'is-later'].forEach(function (c) { r.li.classList.toggle(c, c === cls); });
      setText(r.label, txt);
      if (r.bar) r.bar.style.setProperty('--p', (p || 0).toFixed(3));
    }
    function update() {
      var n = now(), h = hoursOn(n);
      if (!h || n.m >= h[1]) {
        var nx = nextOpen(n), word = nx ? cap(whenWord(nx.k, nx.d)) : 'Seuraavaksi';
        rows.forEach(function (r) {
          if (r.days && nx && r.days.indexOf(nx.d.wd) < 0) set(r, 'is-off', 'Paistetaan ' + (r.daysLabel || 'tiettyinä päivinä'));
          else set(r, 'is-later', word + ' uunista klo ' + fmtTime(r.t));
        });
        return;
      }
      var before = n.m < h[0], nextDone = false;
      lists.forEach(function (ol) {
        var prev = h[0];
        rows.filter(function (r) { return r.ol === ol; }).forEach(function (r) {
          if (r.days && r.days.indexOf(n.wd) < 0) { set(r, 'is-off', 'Paistetaan ' + (r.daysLabel || 'tiettyinä päivinä')); return; }
          var d = n.m - r.t;
          if (before) {
            set(r, 'is-later', r.t < h[0] ? 'Tiskissä klo ' + fmtTime(h[0]) + ' alkaen' : 'Tänään uunista klo ' + fmtTime(r.t));
          } else if (d >= 0 && d < 90) {
            set(r, 'is-fresh', d < 2 ? 'Uunista juuri nyt' : 'Uunista ' + d + ' min sitten');
          } else if (d >= 90) {
            set(r, 'is-past', 'Tiskissä, kunnes loppuu');
          } else if (!nextDone) {
            nextDone = true;
            var span = Math.max(1, r.t - prev);
            set(r, 'is-next', 'Uunista klo ' + fmtTime(r.t), Math.max(0, Math.min(1, (n.m - prev) / span)));
          } else {
            set(r, 'is-later', 'Uunista klo ' + fmtTime(r.t));
          }
          if (r.t <= n.m) prev = Math.max(prev, r.t);
        });
        nextDone = false;
      });
    }
    update();
    setInterval(function () { block('bake tick', update); }, 30000);
  });

  /* 10. lunch week <ol class="week" data-week><li class="day" data-day="1..5">: today gets .is-today + aria-current="date";
         <details class="day"> opens for today; [data-scroll-today] scrolls today into view on phones if it is below the fold */
  block('week', function () {
    var weeks = $$('[data-week]');
    if (!weeks.length) return;
    var wd = now().wd;
    weeks.forEach(function (w) {
      var hit = null;
      $$('[data-day]', w).forEach(function (day) {
        var on = +day.getAttribute('data-day') === wd;
        day.classList.toggle('is-today', on);
        if (on) { day.setAttribute('aria-current', 'date'); hit = day; } else day.removeAttribute('aria-current');
        var name = $('.day-name', day);
        if (name && !$('.day-today', name)) {
          var tag = doc.createElement('span');
          tag.className = 'day-today';
          tag.textContent = 'Tänään';
          name.appendChild(tag);
        }
        if (day.tagName === 'DETAILS' && on) day.open = true;
      });
      w.classList.toggle('has-today', !!hit);
      $$('[data-weekend-note]').forEach(function (note) { note.hidden = !!hit; });
      if (hit && w.hasAttribute('data-scroll-today') && win.innerWidth <= 760) {
        var r = hit.getBoundingClientRect();
        if (r.top > win.innerHeight - 80) {
          var y = r.top + (win.scrollY || 0) - (parseInt(getComputedStyle(root).scrollPaddingTop, 10) || 90);
          win.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
        }
      }
    });
  });

  /* 11. hero steam: CSS scroll timeline lifts and thins it (JS fallback writes --lift);
         a damped spring on scroll velocity squashes/stretches it; paused while off-screen */
  block('steam', function () {
    var fig = $('[data-steam]');
    if (!fig) return;
    var rig = $('.steam-rig', fig);
    if (!rig || reduce) return;
    var cssScroll = !!(win.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'));
    if (cssScroll) rig.classList.add('css-tl');
    var lastY = win.scrollY || 0, lastT = 0, v = 0, sy = 1, vel = 0, running = false, visible = true;
    function lift() { if (!cssScroll) rig.style.setProperty('--lift', Math.min(1, (win.scrollY || 0) / (win.innerHeight * 0.9)).toFixed(4)); }
    function tick(t) {
      var dt = Math.max(1, t - lastT), y = win.scrollY || 0;
      var inst = (y - lastY) / dt;
      lastY = y; lastT = t;
      v += (inst - v) * 0.25;
      var target = 1 - Math.max(-0.3, Math.min(0.3, v * 0.16));
      vel = (vel + (target - sy) * 0.08) * 0.82;
      sy += vel;
      rig.style.setProperty('--sy', sy.toFixed(4));
      rig.style.setProperty('--sk', (vel * -36).toFixed(2) + 'deg');
      lift();
      if (Math.abs(sy - 1) < 0.001 && Math.abs(v) < 0.001 && Math.abs(vel) < 0.0005) {
        running = false; rig.style.setProperty('--sy', 1); rig.style.setProperty('--sk', '0deg'); return;
      }
      raf(tick);
    }
    win.addEventListener('scroll', function () {
      if (!visible) { lift(); return; }
      if (!running) { running = true; lastT = win.performance ? performance.now() : Date.now(); raf(tick); }
    }, { passive: true });
    lift();
    if (hasIO) new IntersectionObserver(function (es) {
      es.forEach(function (e) { visible = e.isIntersecting; fig.classList.toggle('is-off', !visible); });
    }, { threshold: 0 }).observe(fig);
  });

  /* 12. in-page category nav spy: <nav class="cats" data-spy> with links to #ids */
  block('spy', function () {
    if (!hasIO) return;
    $$('[data-spy]').forEach(function (nav) {
      var links = $$('a[href^="#"]', nav), map = {};
      links.forEach(function (a) { var t = doc.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); if (t) map[t.id] = a; });
      var ids = Object.keys(map);
      if (!ids.length) return;
      var scroller = $('ul', nav) || nav;
      function mark(id) {
        links.forEach(function (a) {
          var on = map[id] === a;
          a.classList.toggle('is-current', on);
          if (on) {
            a.setAttribute('aria-current', 'true');
            var l = a.offsetLeft - 16, r = a.offsetLeft + a.offsetWidth + 16;
            if (l < scroller.scrollLeft || r > scroller.scrollLeft + scroller.clientWidth) scroller.scrollLeft = Math.max(0, l);
          } else a.removeAttribute('aria-current');
        });
      }
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); });
      }, { rootMargin: '-30% 0px -60% 0px' });
      ids.forEach(function (id) { io.observe(doc.getElementById(id)); });
    });
  });

  /* 13. pre-order form <form class="form" data-mailto="moi@kaarna.example" data-subject="Ennakkotilaus" novalidate>:
         validates, then opens the mail app with a prefilled CRLF body (no backend).
         input[type=date][data-pickup]: min = tomorrow (order by 14 the previous day), closed days refused;
         input[data-lead-min="20"][data-lead-days="2"]: that many or more needs 2 days;
         radio[data-slot="07:00-09:00"]: disabled when outside the chosen day's opening hours. */
  block('order-form', function () {
    $$('form[data-mailto]').forEach(function (form) {
      var status = $('[data-form-status]', form) || $('[data-form-status]');
      var date = $('input[type=date][data-pickup]', form);
      var slots = $$('input[type=radio][data-slot]', form);
      function leadDays() {
        var lead = 1;
        $$('[data-lead-min]', form).forEach(function (i) {
          var v = parseFloat(String(i.value).replace(',', '.')), min = parseFloat(i.getAttribute('data-lead-min'));
          if (!isNaN(v) && v >= min) lead = Math.max(lead, parseInt(i.getAttribute('data-lead-days'), 10) || 2);
        });
        return lead;
      }
      function minDate() { var n = now(); return addDays(n, leadDays() + (n.m >= 14 * 60 ? 1 : 0)); }
      function chosen() { return date ? parseKey(date.value) : null; }
      function updateSlots() {
        var d = chosen(), h = d ? hoursOn(d) : null;
        slots.forEach(function (r) {
          var p = parseRange(r.getAttribute('data-slot'));
          var ok = !d || (h && p && p[0] < h[1] && p[1] > h[0]);
          r.disabled = !ok;
          if (!ok && r.checked) r.checked = false;
        });
      }
      if (date) {
        date.min = key(minDate());
        date.addEventListener('change', updateSlots);
        $$('[data-lead-min]', form).forEach(function (i) { i.addEventListener('input', function () { date.min = key(minDate()); }); });
      }
      function fieldOf(el) { return el.closest('.field, .choices') || el.parentNode; }
      function errEl(box, el) {
        var e = $('.field-err', box);
        if (!e) {
          e = doc.createElement('p');
          e.className = 'field-err';
          e.id = (el.id || el.name || 'f') + '-err';
          box.appendChild(e);
        }
        if (!e.id) e.id = (el.id || el.name || 'f') + '-err';
        return e;
      }
      function mark(el, msg) {
        var box = fieldOf(el), e = errEl(box, el);
        e.textContent = msg;
        box.classList.add('is-invalid');
        var targets = el.type === 'radio' ? $$('input[name="' + el.name + '"]', form) : [el];
        targets.forEach(function (t) {
          t.setAttribute('aria-invalid', 'true');
          var ids = (t.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
          if (ids.indexOf(e.id) < 0) ids.push(e.id);
          t.setAttribute('aria-describedby', ids.join(' '));
        });
      }
      function clear(el) {
        var box = fieldOf(el);
        box.classList.remove('is-invalid');
        var targets = el.type === 'radio' ? $$('input[name="' + el.name + '"]', form) : [el];
        targets.forEach(function (t) { t.removeAttribute('aria-invalid'); });
      }
      form.addEventListener('input', function (e) { if (e.target.name) clear(e.target); if (status) { status.textContent = ''; status.className = status.className.replace(/\s*is-(ok|err)/g, ''); } });
      form.addEventListener('change', function (e) { if (e.target.name) clear(e.target); });
      function validate() {
        var bad = [], seen = {};
        $$('input, select, textarea', form).forEach(function (el) {
          if (el.disabled && el.type !== 'radio') return;
          if (!el.name || el.type === 'submit' || el.type === 'button' || el.type === 'hidden') return;
          if (el.type === 'radio') {
            if (seen[el.name]) return;
            seen[el.name] = 1;
            var group = $$('input[name="' + el.name + '"]', form);
            var req = group.some(function (g) { return g.required; }) || (el.closest('[data-required]') !== null);
            if (req && !group.some(function (g) { return g.checked; })) { mark(group[0], el.getAttribute('data-err') || 'Valitse yksi vaihtoehto.'); bad.push(group[0]); }
            return;
          }
          var v = (el.type === 'checkbox') ? (el.checked ? 'x' : '') : String(el.value || '').trim();
          if (el.required && !v) { mark(el, el.getAttribute('data-err') || (el.type === 'checkbox' ? 'Rastita tämä kohta.' : 'Täytä tämä kenttä.')); bad.push(el); return; }
          if (!v) return;
          if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { mark(el, 'Tarkista sähköpostiosoite.'); bad.push(el); return; }
          if (el.type === 'tel' && v.replace(/[^\d]/g, '').length < 6) { mark(el, 'Tarkista puhelinnumero.'); bad.push(el); return; }
          if (el.type === 'number') {
            var num = parseFloat(v.replace(',', '.')), mn = parseFloat(el.min), mx = parseFloat(el.max);
            if (isNaN(num) || (!isNaN(mn) && num < mn) || (!isNaN(mx) && num > mx)) { mark(el, 'Tarkista määrä.'); bad.push(el); return; }
          }
          if (el === date) {
            var d = parseKey(v), md = minDate(), lead = leadDays();
            if (!d) { mark(el, 'Valitse päivä.'); bad.push(el); return; }
            if (key(d) < key(md)) {
              mark(el, lead > 1 ? 'Näin iso tilaus tarvitsee ' + lead + ' päivää aikaa. Aikaisin nouto ' + fmtDate(md) + '.' : 'Tilaa viimeistään klo 14 edellisenä päivänä. Aikaisin nouto ' + fmtDate(md) + '.');
              bad.push(el); return;
            }
            if (!hoursOn(d)) { mark(el, 'Olemme silloin suljettu. Valitse toinen päivä.'); bad.push(el); return; }
          }
        });
        return bad;
      }
      function labelFor(el) {
        if (el.type === 'radio' || el.type === 'checkbox') {
          var fs = el.closest('fieldset'), lg = fs && $('legend', fs);
          if (el.type === 'radio' && lg) return clean(lg);
          var l = el.closest('label') || (el.id && $('label[for="' + el.id + '"]', form));
          return l ? clean(l) : el.name;
        }
        var lb = el.id && $('label[for="' + el.id + '"]', form);
        return lb ? clean(lb) : (el.getAttribute('aria-label') || el.name);
      }
      function clean(node) {
        var c = node.cloneNode(true);
        $$('.opt, .field-hint, .sr-skip', c).forEach(function (x) { x.remove(); });
        return c.textContent.replace(/\s+/g, ' ').replace(/[\s:]+$/, '').trim();
      }
      function valueOf(el) {
        if (el.tagName === 'SELECT') { var o = el.options[el.selectedIndex]; return o ? o.text.trim() : ''; }
        if (el.type === 'date') { var d = parseKey(el.value); return d ? fmtDate(d) : el.value; }
        if (el.type === 'radio') { var l = el.closest('label'); return l ? clean(l) : el.value; }
        if (el.type === 'checkbox') return 'kyllä';
        return String(el.value).trim().replace(/\r?\n/g, '\r\n');
      }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var bad = validate();
        if (bad.length) {
          if (status) { status.textContent = 'Tarkista merkityt kentät.'; status.classList.add('is-err'); status.classList.remove('is-ok'); }
          bad[0].focus();
          return;
        }
        var lines = [], pickup = '';
        $$('input, select, textarea', form).forEach(function (el) {
          if (!el.name || el.disabled || el.type === 'submit' || el.type === 'button' || el.type === 'hidden') return;
          if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) return;
          var v = valueOf(el);
          if (!v) return;
          if (el === date) pickup = v;
          lines.push(labelFor(el) + ': ' + (v.indexOf('\r\n') > -1 ? '\r\n' + v : v));
        });
        var intro = form.getAttribute('data-intro') || 'Hei Kaarna, haluaisin tilata ennakkoon:';
        var outro = form.getAttribute('data-outro') || 'Odotan vahvistusta. Kiitos!';
        var body = intro + '\r\n\r\n' + lines.join('\r\n') + '\r\n\r\n' + outro;
        var subject = (form.getAttribute('data-subject') || 'Ennakkotilaus') + (pickup ? ', nouto ' + pickup : '');
        var url = 'mailto:' + form.getAttribute('data-mailto') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        form.setAttribute('data-last-mailto', url);
        if (status) {
          status.textContent = 'Sähköpostiohjelmasi avautuu valmiin viestin kanssa. Lähetä viesti, niin vahvistamme tilauksen vastaamalla.';
          status.classList.add('is-ok'); status.classList.remove('is-err');
        }
        if (!form.hasAttribute('data-no-open')) win.location.href = url;
      });
    });
  });
})();
