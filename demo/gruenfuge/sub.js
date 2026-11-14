/* Grünfuge sub pages (landing, legal, 404): menu, header, progress, reveal, call bar. */
(function () {
  'use strict';
  var d = document, de = d.documentElement;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var rmq = matchMedia('(prefers-reduced-motion: reduce)');

  /* menu */
  var hdr = $('.hdr'), nav = $('#menu'), mbtn = $('.menu-btn');
  function setMenu(open) {
    nav.classList.toggle('open', open); hdr.classList.toggle('menu-open', open);
    mbtn.setAttribute('aria-expanded', open); mbtn.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  }
  if (hdr && nav && mbtn) {
    mbtn.addEventListener('click', function () { var o = mbtn.getAttribute('aria-expanded') !== 'true'; setMenu(o); if (o) $('a', nav).focus(); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mbtn.getAttribute('aria-expanded') === 'true') { setMenu(false); mbtn.focus(); } });
    d.addEventListener('click', function (e) { if (!e.target.closest('.nav')) setMenu(false); });
  }

  /* header + progress */
  var bar = $('.progress span'), hero = $('.lp-hero'), lastY = scrollY;
  function onScroll() {
    var y = scrollY, dy = y - lastY; lastY = y;
    var max = de.scrollHeight - innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (hdr) {
      hdr.classList.toggle('solid', !hero || y > hero.offsetHeight - 90);
      if (!nav.classList.contains('open')) hdr.classList.toggle('hide', dy > 4 && y > 400 ? true : dy < -4 ? false : hdr.classList.contains('hide'));
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  /* reveal */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(function (el, i) { el.style.setProperty('--d', (i % 4) * 70 + 'ms'); io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* call bar: after the hero, hidden while the closing contact block is on screen */
  var cb = $('.callbar'), cta = $('.lp-cta');
  if (cb && hero && 'IntersectionObserver' in window) {
    var past = false, atEnd = false;
    var upd = function () { cb.classList.toggle('show', past && !atEnd); };
    new IntersectionObserver(function (en) { past = !en[0].isIntersecting && en[0].boundingClientRect.top < 0; upd(); }).observe(hero);
    if (cta) new IntersectionObserver(function (en) { atEnd = en[0].isIntersecting; upd(); }).observe(cta);
  }

  /* magnetic header button on desktop */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) $$('.magnet').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      if (rmq.matches) return;
      var r = b.getBoundingClientRect();
      b.style.transform = 'translate(' + ((e.clientX - r.left) / r.width - .5) * 10 + 'px,' + ((e.clientY - r.top) / r.height - .5) * 8 + 'px)';
    });
    b.addEventListener('pointerleave', function () { b.style.transform = ''; });
  });


  /* quick request panel: buttons with data-anfrage open it instead of jumping to the homepage form.
     Demo only, same as the homepage: the request is kept in this browser so anfragen/ can show it. */
  var trig = $$('[data-anfrage]');
  if (trig.length && window.JSON) (function () {
    var KEY = 'gruenfuge-demo-anfragen-v1', AREA = ['Wiesbaden', 'Mainz', 'Taunusstein', 'Hochheim am Main', 'Budenheim', 'Eltville am Rhein', 'Walluf'];
    var job = d.body.getAttribute('data-job') || '', page = d.body.getAttribute('data-page') || 'Grünfuge';
    var X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    var wrap = d.createElement('div');
    wrap.innerHTML = '<div class="ap-scrim" hidden></div>'
      + '<div class="area-panel" role="dialog" aria-modal="true" aria-labelledby="qp-h" hidden>'
      + '<button class="ap-close" type="button" aria-label="Schließen">' + X + '</button>'
      + '<div class="ap-step" data-step="1"><p class="ap-eb">' + page + '</p><h2 id="qp-h" tabindex="-1">Vor-Ort-Termin anfragen.</h2>'
      + '<form id="ap-form" novalidate><div class="ap-grid">'
      + '<div><label for="qp-name">Name</label><input id="qp-name" autocomplete="name" required></div>'
      + '<div><label for="qp-tel">Telefon</label><input id="qp-tel" type="tel" inputmode="tel" autocomplete="tel" pattern="[0-9 +\\(\\)\\-]{6,}" required></div></div>'
      + '<label for="qp-plz">Postleitzahl <span class="opt">(optional)</span></label><input id="qp-plz" inputmode="numeric" autocomplete="postal-code" maxlength="5" pattern="[0-9]{5}">'
      + '<label for="qp-msg">Worum geht es? <span class="opt">(optional)</span></label><textarea id="qp-msg" placeholder="z. B. Größe der Fläche, gewünschter Zeitraum"></textarea>'
      + '<div class="hp" aria-hidden="true"><label for="qp-www">Bitte leer lassen</label><input id="qp-www" tabindex="-1" autocomplete="off"></div>'
      + '<p class="ap-err" role="alert" hidden></p><button class="btn btn-moss ap-send" type="submit">Anfrage senden</button>'
      + '<p class="ap-note">Wir verwenden Ihre Angaben nur zur Beantwortung Ihrer Anfrage.</p></form></div>'
      + '<div class="ap-step ap-done" data-step="2" hidden><span class="ap-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>'
      + '<h2 id="qp-done" tabindex="-1">Danke!</h2><p>Dies ist eine Demo-Seite. Ihre Anfrage wurde nicht versendet und nur in diesem Browser gespeichert.</p>'
      + '<a class="btn btn-lichen" id="qp-crm" href="anfragen/index.html">So sieht der Betrieb Ihre Anfrage</a></div></div>';
    d.body.appendChild(wrap);
    var scrim = $('.ap-scrim', wrap), pnl = $('.area-panel', wrap), form = $('#ap-form', wrap), err = $('.ap-err', wrap), steps = $$('.ap-step', wrap), last = null;
    function show(n) { steps.forEach(function (s) { s.hidden = +s.getAttribute('data-step') !== n; }); }
    function open() {
      last = d.activeElement; show(1); scrim.hidden = false; pnl.hidden = false; de.classList.add('ap-lock');
      requestAnimationFrame(function () { pnl.classList.add('in'); scrim.classList.add('in'); });
      setTimeout(function () { $('#qp-name').focus({ preventScroll: true }); }, 80);
    }
    function close() {
      pnl.classList.remove('in'); scrim.classList.remove('in'); de.classList.remove('ap-lock');
      setTimeout(function () { if (pnl.classList.contains('in')) return; pnl.hidden = true; scrim.hidden = true; }, 220);
      if (last && d.contains(last)) last.focus({ preventScroll: true });
    }
    trig.forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); open(); }); });
    $('.ap-close', wrap).addEventListener('click', close); scrim.addEventListener('click', close);
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pnl.hidden) close(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if ($('#qp-www').value) return;
      var name = $('#qp-name'), tel = $('#qp-tel'), plz = $('#qp-plz');
      var bad = [name, tel].filter(function (el) { return !el.value.trim() || !el.checkValidity(); });
      if (plz.value && !plz.checkValidity()) bad.push(plz);
      [name, tel, plz].forEach(function (el) { el.setAttribute('aria-invalid', bad.indexOf(el) > -1); });
      if (bad.length) { err.hidden = false; err.textContent = bad[0] === plz ? 'Die Postleitzahl hat fünf Ziffern.' : 'Bitte geben Sie Name und Telefonnummer an, damit wir Sie anrufen können.'; bad[0].focus(); return; }
      err.hidden = true;
      var save = function (k) {
        var lead = { id: 'o' + Date.now().toString(36), t: Date.now(), name: name.value.trim(), phone: tel.value.trim(), email: '',
          pn: k ? plz.value : '', kunta: k || '', inArea: k ? AREA.indexOf(k) > -1 : null, jobs: job ? [job] : [], msg: $('#qp-msg').value.trim(),
          src: 'Seite ' + page, status: 'neu', own: true };
        try { var st = JSON.parse(localStorage.getItem(KEY)) || { own: [], edits: {} }; st.own.unshift(lead); localStorage.setItem(KEY, JSON.stringify(st)); } catch (x) {}
        $('#qp-done').textContent = 'Vielen Dank für Ihre Anfrage!';
        $('#qp-crm').href = 'anfragen/index.html?neu=' + lead.id;
        show(2); $('#qp-done').focus({ preventScroll: true });
      };
      if (plz.value.length === 5) fetch('data/postinumerot.json').then(function (r) { return r.json(); }).then(function (pn) { save(pn.p[plz.value] !== undefined ? pn.k[pn.p[plz.value]] : ''); }).catch(function () { save(''); });
      else save('');
    });
  })();

  onScroll();
  requestAnimationFrame(function () { de.classList.add('loaded'); });
  de.classList.add('ready');
})();
