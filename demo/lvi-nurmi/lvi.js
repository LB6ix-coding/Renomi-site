/* LVI Nurmi Oy demo site: menu, current page, open-now status, hero pipes, scroll pipe, counters, reveal.
   Every block checks for its elements first, so any page can load this file. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }

  /* 1. mobile menu */
  (function () {
    var btn = $('.menu-btn'), nav = $('#nav'), top = $('.top');
    if (!btn || !nav) return;
    function place() {
      var b = top ? top.getBoundingClientRect().bottom : 0;
      root.style.setProperty('--nav-top', Math.max(0, Math.round(b)) + 'px');
    }
    function set(open, focusBtn) {
      if (open) place();
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      doc.body.classList.toggle('nav-open', open);
      if (!open && focusBtn) btn.focus();
    }
    btn.addEventListener('click', function () { set(!nav.classList.contains('open')); });
    doc.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && nav.classList.contains('open')) set(false, true);
    });
    nav.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) set(false); });
    window.addEventListener('resize', function () {
      if (!nav.classList.contains('open')) return;
      if (window.innerWidth > 960) set(false); else place();
    });
    window.addEventListener('scroll', function () { if (nav.classList.contains('open')) place(); }, { passive: true });
  })();

  /* 2. aria-current from <body data-page> */
  (function () {
    var page = doc.body && doc.body.getAttribute('data-page');
    if (!page) return;
    var href = page + '.html';
    $$('#nav a').forEach(function (a) {
      if (a.classList.contains('call')) return;
      if ((a.getAttribute('href') || '').split('#')[0] === href) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  })();

  /* 3. open-now status, Europe/Helsinki time, ma-pe 7-17 (Finnish public holidays count as closed) */
  (function () {
    var box = $('.tb .open');
    if (!box) return;
    var label = box.querySelector('span') || box;
    function easter(y) { // anonymous Gregorian algorithm, returns [month(1-12), day]
      var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
          f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
          i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
      return [Math.floor((h + l - 7 * m + 114) / 31), ((h + l - 7 * m + 114) % 31) + 1];
    }
    function isHoliday(y, mo, d) {
      var fixed = ['1-1', '1-6', '5-1', '12-6', '12-24', '12-25', '12-26'];
      if (fixed.indexOf(mo + '-' + d) > -1) return true;
      if (mo === 6 && d >= 19 && d <= 25 && new Date(Date.UTC(y, 5, d)).getUTCDay() === 5) return true; // juhannusaatto
      var e = easter(y), base = Date.UTC(y, e[0] - 1, e[1]), day = 864e5, t = Date.UTC(y, mo - 1, d);
      return t === base - 2 * day || t === base + day || t === base + 39 * day; // pitkäperjantai, 2. pääsiäispäivä, helatorstai
    }
    function nowHelsinki() {
      try {
        var parts = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Helsinki', year: 'numeric', month: 'numeric', day: 'numeric',
          weekday: 'short', hour: 'numeric', hourCycle: 'h23'
        }).formatToParts(new Date());
        var o = {};
        parts.forEach(function (p) { o[p.type] = p.value; });
        return { y: +o.year, mo: +o.month, d: +o.day, wd: o.weekday, h: +o.hour % 24 };
      } catch (err) { return null; }
    }
    function update() {
      var n = nowHelsinki();
      var open = !!n && ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(n.wd) > -1 && n.h >= 7 && n.h < 17 && !isHoliday(n.y, n.mo, n.d);
      box.classList.toggle('closed', !open);
      label.textContent = open ? 'Avoinna nyt, klo 17 asti' : 'Päivystys auki 24/7';
    }
    update();
    setInterval(update, 60000);
  })();

  /* 4. hero pipes: measure, set --len, draw; pause while offscreen */
  (function () {
    $$('.pipes').forEach(function (box) {
      var svg = box.querySelector('svg');
      if (!svg) return;
      $$('.pipe, .pipe-in', svg).forEach(function (p) {
        if (typeof p.getTotalLength === 'function') {
          try { p.style.setProperty('--len', Math.ceil(p.getTotalLength())); } catch (err) {}
        }
      });
      void svg.getBoundingClientRect();
      function start() {
        if (box.classList.contains('draw')) return;
        requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add('draw'); }); });
      }
      if (!hasIO) { start(); return; }
      // start drawing when the network first scrolls into view (on phones it sits below the text), pause loops offscreen
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          box.classList.toggle('is-offscreen', !e.isIntersecting);
          if (e.isIntersecting) start();
        });
      }, { threshold: 0.15 }).observe(box);
    });
  })();

  /* 5. steps scroll pipe: CSS scroll timeline where supported, otherwise scroll + rAF writes --fill and li.on */
  (function () {
    var lists = $$('.steps');
    if (!lists.length) return;
    var css = window.CSS && CSS.supports && CSS.supports('animation-timeline: view()') && CSS.supports('view-timeline-name: --a');
    if (reduce) { lists.forEach(function (l) { l.classList.add('is-static'); }); return; }
    if (css) { lists.forEach(function (l) { l.classList.add('has-css-timeline'); }); return; }
    lists.forEach(function (l) { l.classList.add('js-timeline'); l.style.setProperty('--fill', 0); });
    var ticking = false;
    function update() {
      ticking = false;
      var line = window.innerHeight * 0.6;
      lists.forEach(function (l) {
        var r = l.getBoundingClientRect();
        var p = r.height ? Math.max(0, Math.min(1, (line - r.top) / r.height)) : 1;
        l.style.setProperty('--fill', p.toFixed(4));
        $$('li', l).forEach(function (li) {
          if (li.parentNode !== l) return;
          li.classList.toggle('on', li.getBoundingClientRect().top + 16 <= line);
        });
      });
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  })();

  /* 6. counters for [data-count]: fi-FI format, decimals from data-decimals or from the value itself */
  (function () {
    var nums = $$('[data-count]');
    if (!nums.length) return;
    function info(el) {
      var raw = String(el.getAttribute('data-count')).replace(',', '.').trim();
      var target = parseFloat(raw);
      var dec = el.hasAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) || 0
        : (raw.split('.')[1] || '').length;
      var fmt;
      try { fmt = new Intl.NumberFormat('fi-FI', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
      catch (err) { fmt = { format: function (v) { return v.toFixed(dec).replace('.', ','); } }; }
      return { target: target, fmt: fmt, pre: el.getAttribute('data-prefix') || '', suf: el.getAttribute('data-suffix') || '' };
    }
    function render(el, i, v) { el.textContent = i.pre + i.fmt.format(v) + i.suf; }
    function finish(el) {
      var i = info(el);
      if (!isNaN(i.target)) render(el, i, i.target);
      var stat = el.closest && el.closest('.stat');
      if (stat) { stat.style.setProperty('--lvl', 1); stat.classList.add('is-done'); }
    }
    if (reduce || !hasIO || !window.requestAnimationFrame) { nums.forEach(finish); return; }
    function countUp(el) {
      var i = info(el);
      if (isNaN(i.target)) return;
      var dur = 1400, start = null, stat = el.closest && el.closest('.stat');
      var decPow = Math.pow(10, (i.fmt.resolvedOptions ? i.fmt.resolvedOptions().maximumFractionDigits : 0));
      function frame(ts) {
        if (start === null) start = ts;
        var t = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - t, 3);
        render(el, i, Math.round(i.target * e * decPow) / decPow);
        if (stat) stat.style.setProperty('--lvl', e.toFixed(3));
        if (t < 1) requestAnimationFrame(frame); else finish(el);
      }
      requestAnimationFrame(frame);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        countUp(e.target);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) {
      var stat = el.closest && el.closest('.stat');
      if (stat) stat.style.setProperty('--lvl', 0);
      io.observe(el);
    });
  })();

  /* 7. reveal on scroll */
  (function () {
    var els = $$('.rv');
    if (!els.length) return;
    if (reduce || !hasIO) { els.forEach(function (el) { el.classList.add('on'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('on');
        io.unobserve(e.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();
})();
