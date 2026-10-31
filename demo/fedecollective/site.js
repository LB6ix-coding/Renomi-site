/* FedeCollective site script. No libraries, no trackers. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer: fine)').matches;
  if (reduce) doc.classList.add('reduce');

  /* ---------- header, progress, call bar ---------- */
  var header = document.querySelector('header');
  var bar = document.querySelector('.progress');
  var callbar = document.getElementById('callbar');
  var lastY = scrollY;
  function onScrollUI() {
    var y = scrollY, h = doc.scrollHeight - innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    header.classList.toggle('solid', y > 40);
    var menuOpen = doc.classList.contains('menu-open');
    header.classList.toggle('hide', !menuOpen && y > 500 && y > lastY + 4);
    if (y < lastY - 4) header.classList.remove('hide');
    if (callbar) callbar.classList.toggle('on', y > innerHeight * 0.6);
    lastY = y;
  }
  addEventListener('scroll', onScrollUI, { passive: true });
  onScrollUI();

  /* ---------- mobile menu ---------- */
  var mb = document.querySelector('.menu-btn');
  function setMenu(open) {
    doc.classList.toggle('menu-open', open);
    mb.setAttribute('aria-expanded', open);
    mb.setAttribute('aria-label', open ? 'Sulje valikko' : 'Avaa valikko');
  }
  mb.addEventListener('click', function () { setMenu(!doc.classList.contains('menu-open')); });
  document.querySelectorAll('.nav-links a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && doc.classList.contains('menu-open')) { setMenu(false); mb.focus(); } });

  /* ---------- hero headline: words rise in ---------- */
  function splitWords(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.textContent = '';
    words.forEach(function (w, i) {
      var o = document.createElement('span'); o.className = 'w'; o.setAttribute('aria-hidden', 'true');
      var s = document.createElement('span'); s.textContent = w; s.style.transitionDelay = (0.12 + i * 0.12) + 's';
      o.appendChild(s); el.appendChild(o);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }
  document.querySelectorAll('[data-split]').forEach(splitWords);
  requestAnimationFrame(function () { requestAnimationFrame(function () { document.querySelector('.hero').classList.add('go'); document.querySelectorAll('.split').forEach(function (s) { s.classList.add('go'); }); }); });

  /* ---------- open now ---------- */
  function hki() {
    var o = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
    return { d: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday], m: (+o.hour % 24) * 60 + (+o.minute) };
  }
  function status() {
    var t = hki(), el = document.getElementById('status'), open = t.d >= 1 && t.d <= 6 && t.m >= 600 && t.m < 1200;
    el.classList.toggle('open', open);
    el.lastElementChild.textContent = open ? 'Auki nyt · klo 20 asti' :
      (t.d >= 1 && t.d <= 6 && t.m < 600 ? 'Aukeaa tänään klo 10' : (t.d === 6 || t.d === 0 ? 'Aukeaa maanantaina klo 10' : 'Aukeaa huomenna klo 10'));
    document.querySelectorAll('#hours [data-d="' + t.d + '"]').forEach(function (x) { x.classList.add('today'); });
  }
  status(); setInterval(status, 60000);

  /* ---------- reveal on scroll ---------- */
  var rvs = [].slice.call(document.querySelectorAll('.rv'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rvs.forEach(function (el) { io.observe(el); });
  } else rvs.forEach(function (el) { el.classList.add('in'); });

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) document.querySelectorAll('.mag').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.transform = 'translate(' + ((e.clientX - r.left) / r.width - .5) * 12 + 'px,' + ((e.clientY - r.top) / r.height - .5) * 10 + 'px)';
    });
    b.addEventListener('pointerleave', function () { b.style.transform = ''; });
  });

  /* ---------- pinned story ---------- */
  var track = document.getElementById('story');
  var stg = [].slice.call(document.querySelectorAll('.stage-i'));
  var simg = [].slice.call(document.querySelectorAll('.story-media img'));
  var sbar = document.querySelector('.stages .bar'), scount = document.getElementById('storyCount');
  var cur = -1;
  function onStory() {
    if (innerWidth < 980) return;
    var r = track.getBoundingClientRect(), total = r.height - innerHeight;
    var p = Math.min(1, Math.max(0, -r.top / total));
    var i = Math.min(stg.length - 1, Math.floor(p * stg.length));
    if (sbar) sbar.style.height = (p * 100) + '%';
    if (i !== cur) {
      cur = i;
      stg.forEach(function (s, j) { s.classList.toggle('on', j === i); });
      simg.forEach(function (im, j) { im.classList.toggle('on', j === i); });
      if (scount) scount.textContent = '0' + (i + 1);
    }
  }
  addEventListener('scroll', onStory, { passive: true }); addEventListener('resize', onStory); onStory();

  /* ---------- parallax on photo band ---------- */
  var pars = [].slice.call(document.querySelectorAll('.par'));
  function onPar() {
    if (reduce) return;
    pars.forEach(function (im) {
      var r = im.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var k2 = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      im.style.transform = 'translate3d(0,' + (k2 * -6) + '%,0)';
    });
  }
  addEventListener('scroll', onPar, { passive: true }); onPar();

  /* ---------- price builder ---------- */
  var form = document.getElementById('calc');
  function calc(changed) {
    // one haircut at a time: Skin Fade, Fade+Beard, Parturileikkaus, Mallinmuutos, Koneajo are exclusive
    if (changed && changed.checked && changed.dataset.x) {
      form.querySelectorAll('input[data-x="' + changed.dataset.x + '"]').forEach(function (x) { if (x !== changed) x.checked = false; });
    }
    if (changed && changed.checked && changed.dataset.y) {
      form.querySelectorAll('input[data-y="' + changed.dataset.y + '"]').forEach(function (x) {
        if (x !== changed && x.checked && x.dataset.n === 'Skin Fade + Beard') { form.querySelector('input[data-n="Skin Fade"]').checked = true; }
        if (x !== changed) x.checked = false;
      });
    }
    var sel = [].slice.call(form.querySelectorAll('input:checked'));
    var tot = sel.reduce(function (a, x) { return a + (+x.value); }, 0);
    document.getElementById('cTotal').innerHTML = tot + '&nbsp;€';
    var ul = document.getElementById('cList'); ul.innerHTML = '';
    if (!sel.length) { var li0 = document.createElement('li'); li0.textContent = 'Valitse vähintään yksi palvelu.'; ul.appendChild(li0); }
    sel.forEach(function (x) { var li = document.createElement('li'); var a = document.createElement('span'); a.textContent = x.dataset.n; var b = document.createElement('span'); b.innerHTML = x.value + '&nbsp;€'; li.appendChild(a); li.appendChild(b); ul.appendChild(li); });
    document.getElementById('cSum').textContent = 'Yhteensä ' + tot + ' euroa.';
  }
  form.addEventListener('change', function (e) { calc(e.target); });
  calc();

  /* ---------- canvas: cut hair clippings you brush away ---------- */
  var cv = document.getElementById('hair');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, hairs = [], px = -1e4, py = -1e4, pvx = 0, pvy = 0, last = 0, running = false, visible = false, brushed = 0;
    var hint = document.getElementById('hairHint');
    function mk(fall) {
      return { x: Math.random() * W, y: fall ? -20 - Math.random() * H * .3 : Math.random() * H, l: 6 + Math.random() * 14, a: Math.random() * Math.PI, va: (Math.random() - .5) * .02,
        vx: (Math.random() - .5) * .2, vy: .15 + Math.random() * .35, w: .9 + Math.random() * 1.2, s: Math.random() < .5 ? 'rgba(24,22,20,.9)' : 'rgba(58,52,46,.85)', rest: false };
    }
    function size() {
      var r = cv.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(900, W * H / 900)); hairs = []; for (var i = 0; i < n; i++) hairs.push(mk(false));
    }
    function move(x, y) {
      var r = cv.getBoundingClientRect(), nx = x - r.left, ny = y - r.top;
      pvx = nx - px; pvy = ny - py; px = nx; py = ny;
    }
    cv.addEventListener('pointermove', function (e) { move(e.clientX, e.clientY); });
    cv.addEventListener('pointerdown', function (e) { var r = cv.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; pvx = pvy = 0; });
    cv.addEventListener('pointerleave', function () { px = py = -1e4; });
    function draw(dt) {
      ctx.clearRect(0, 0, W, H);
      var sp = Math.min(60, Math.hypot(pvx, pvy));
      for (var i = 0; i < hairs.length; i++) {
        var h = hairs[i], dx = h.x - px, dy = h.y - py, d = Math.hypot(dx, dy), R = 70 + sp * 1.5;
        if (d < R) {
          var f = (1 - d / R) * (0.6 + sp * .06);
          h.vx += (dx / (d || 1)) * f + pvx * .04; h.vy += (dy / (d || 1)) * f + pvy * .04; h.va += (Math.random() - .5) * .08 * f; h.rest = false; brushed++;
        }
        if (!reduce) { h.vy += .006 * dt; }
        h.vx *= .94; h.vy *= .94; h.va *= .96;
        h.x += h.vx * dt; h.y += h.vy * dt; h.a += h.va * dt;
        if (h.y > H + 20 || h.x < -40 || h.x > W + 40) hairs[i] = mk(true);
        ctx.strokeStyle = h.s; ctx.lineWidth = h.w; ctx.lineCap = 'round';
        var cx = Math.cos(h.a) * h.l / 2, cy = Math.sin(h.a) * h.l / 2;
        ctx.beginPath(); ctx.moveTo(h.x - cx, h.y - cy); ctx.quadraticCurveTo(h.x + cy * .25, h.y - cx * .25, h.x + cx, h.y + cy); ctx.stroke();
      }
      pvx *= .8; pvy *= .8;
      if (hint && brushed > 120) { hint.classList.add('gone'); hint = null; }
    }
    function frame(now) {
      if (!visible || document.hidden) { running = false; return; }
      var dt = Math.min(3, (now - last) / 16.7 || 1); last = now; draw(dt); requestAnimationFrame(frame);
    }
    function start() { if (running || reduce) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
    size(); draw(1);
    var lw = innerWidth;
    addEventListener('resize', function () { if (innerWidth === lw) return; lw = innerWidth; size(); draw(1); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }).observe(cv);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && visible) start(); });
  }
})();
