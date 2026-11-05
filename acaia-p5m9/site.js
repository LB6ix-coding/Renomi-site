/* AÇAÏA · sivustoehdotus (Marktic). Plain ES2017, no optional chaining (Samsung Internet). */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };

  /* ---------- split headline into words ---------- */
  $$('.split').forEach(function (el) {
    var i = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var s = document.createElement('span'); s.textContent = part;
            s.style.setProperty('--d', (0.08 + i++ * 0.07).toFixed(2) + 's');
            w.appendChild(s); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) { walk(n); }
      });
    }
    walk(el);
  });

  /* ---------- header ---------- */
  var hdr = $('.hdr'), hint = $('.scrollhint');
  function onScrollHeader() {
    var y = window.pageYOffset;
    hdr.classList.toggle('solid', y > 40);
    if (hint && y > 40) hint.classList.add('gone');
  }
  var burger = $('.burger'), nav = $('#nav');
  burger.addEventListener('click', function () {
    var open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Sulje valikko' : 'Avaa valikko');
    nav.classList.toggle('open', open);
    hdr.classList.add('solid');
  });
  $$('#nav a').forEach(function (a) {
    a.addEventListener('click', function () { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); });
  });

  /* ---------- reveal on scroll ---------- */
  var revealEls = $$('.reveal, .split, .sign');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- open now (Europe/Helsinki) ---------- */
  function helsinkiNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { d: days[o.weekday], h: parseInt(o.hour, 10) % 24, m: parseInt(o.minute, 10) };
    } catch (err) { var n = new Date(); return { d: n.getDay(), h: n.getHours(), m: n.getMinutes() }; }
  }
  /* opening hours per weekday (0 = Sun), minutes from midnight. Counter sign, confirmed 5.11.2026 */
  var HRS = { 0: [600, 1320], 1: [420, 1320], 2: [420, 1320], 3: [420, 1320], 4: [420, 1320], 5: [420, 1440], 6: [600, 1440] };
  var hh = function (m) { return String(m / 60); };
  function updateStatus() {
    var n = helsinkiNow(), mins = n.h * 60 + n.m, t = HRS[n.d], open = mins >= t[0] && mins < t[1];
    var nextOpen = mins < t[0] ? 'tänään klo ' + hh(t[0]) : 'huomenna klo ' + hh(HRS[(n.d + 1) % 7][0]);
    var short = open ? 'Auki nyt · klo ' + hh(t[1]) + ' asti' : 'Suljettu · avataan ' + nextOpen;
    var long = open ? 'Auki nyt. Tänään klo ' + hh(t[0]) + '–' + hh(t[1]) + '.' : 'Avataan ' + nextOpen + '.';
    $$('[data-status]').forEach(function (el) { el.classList.toggle('closed', !open); el.querySelector('b').textContent = el.classList.contains('dock-open') ? (open ? 'Auki nyt\nklo ' + hh(t[1]) + ' asti' : 'Kiinni\navataan klo ' + (mins < t[0] ? hh(t[0]) : hh(HRS[(n.d + 1) % 7][0]))) : short; });
    $$('[data-status-long]').forEach(function (el) { el.textContent = long; });
    $$('[data-hours] li').forEach(function (li) { li.classList.toggle('today', parseInt(li.getAttribute('data-d'), 10) === n.d); });
  }
  updateStatus(); setInterval(updateStatus, 60000);

  /* ---------- pinned story: cup builds while scrolling ---------- */
  var story = $('.story'), sc = $('.story-cup'), steps = $$('.steps li'), bar = $('.progress');
  var price = $('.story-price');
  if (story && sc) {
    var frames = $$('.frame', sc);
    var lastIdx = -1, ticking = false, sTop = 0, sLen = 1;
    function measure() {
      var r = story.getBoundingClientRect();
      sTop = r.top + window.pageYOffset; sLen = Math.max(1, story.offsetHeight - window.innerHeight);
    }
    function render() {
      ticking = false;
      var p = reduce ? 1 : clamp((window.pageYOffset - sTop) / sLen, 0, 1), u = p * 6.15;
      var v = clamp(u - 0.35, 0, 5);
      for (var f = 1; f < frames.length; f++) frames[f].style.opacity = clamp(v - f + 1, 0, 1).toFixed(3);
      var idx = Math.min(5, Math.floor(u));
      if (idx !== lastIdx) {
        steps.forEach(function (li, j) { li.classList.toggle('on', j <= idx); li.classList.toggle('now', j === idx); });
        if (price) {
          price.querySelector('span').textContent = idx >= 5 ? 'Kuvan kuppi: S, 5 täytettä + lisätäyte' : 'Oma bowl alkaen';
          price.querySelector('strong').textContent = idx >= 5 ? '13,90\u00a0€' : '10,90\u00a0€';
        }
        lastIdx = idx;
      }
      if (bar) bar.style.setProperty('--p', p.toFixed(3));
    }
    function req() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }
    measure(); render();
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', function () { measure(); req(); });
    window.addEventListener('load', function () { measure(); req(); });
  }

  /* ---------- menu tabs (phones only) ---------- */
  var tabsBar = $('.menu-tabs'), cards = $$('.menu-grid > .card');
  if (tabsBar && cards.length) {
    tabsBar.hidden = false;
    var mq = window.matchMedia('(max-width: 760px)');
    var showTab = function (n) {
      $$('button', tabsBar).forEach(function (bt, j) { bt.setAttribute('aria-selected', j === n ? 'true' : 'false'); });
      cards.forEach(function (c, j) { c.classList.toggle('tab-off', mq.matches && j !== n); });
    };
    var cur = 0;
    $$('button', tabsBar).forEach(function (bt, j) {
      bt.addEventListener('click', function () { cur = j; showTab(j); bt.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' }); });
    });
    if (mq.addEventListener) mq.addEventListener('change', function () { showTab(cur); }); else if (mq.addListener) mq.addListener(function () { showTab(cur); });
    showTab(0);
  }

  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();
  doc.classList.add('ready');
})();
