/* Grünfuge: paving chooser. Every combination is a real photo of a laid pavement (Pexels, see BILDNACHWEIS.txt).
   Only combinations that exist as photos are offered. The paving area comes from the garden planner. */
(function () {
  'use strict';
  var root = document.getElementById('pf');
  if (!root) return;
  var STEIN = {
    beton: { name: 'Betonstein grau', min: 60, max: 90 },
    anthrazit: { name: 'Betonstein anthrazit', min: 65, max: 95 },
    klinker: { name: 'Klinker rot', min: 80, max: 120 },
    klinkerbunt: { name: 'Klinker bunt', min: 85, max: 125 },
    granit: { name: 'Granit', min: 110, max: 170 }
  };
  var VERBAND = { fischgraet: 'Fischgrätverband', 'fischgraet-diagonal': 'Fischgrätverband diagonal', laeufer: 'Läuferverband', bogen: 'Bogenpflaster', reihe: 'Reihenpflaster' };
  var FOTOS = {
    beton: ['fischgraet', 'fischgraet-diagonal', 'laeufer'],
    anthrazit: ['fischgraet'],
    klinker: ['fischgraet', 'fischgraet-diagonal'],
    klinkerbunt: ['fischgraet'],
    granit: ['bogen', 'reihe']
  };
  var ALT = {
    'beton-fischgraet': 'Grauer Betonstein im Fischgrätverband, Ansicht von oben',
    'beton-fischgraet-diagonal': 'Grauer Betonstein im diagonalen Fischgrätverband',
    'beton-laeufer': 'Großformatiges graues Betonpflaster im Läuferverband',
    'anthrazit-fischgraet': 'Anthrazitfarbener Betonstein im Fischgrätverband',
    'klinker-fischgraet': 'Roter Pflasterklinker im Fischgrätverband',
    'klinker-fischgraet-diagonal': 'Roter Pflasterklinker im diagonalen Fischgrätverband',
    'klinkerbunt-fischgraet': 'Bunter Pflasterklinker im diagonalen Fischgrätverband',
    'granit-bogen': 'Granitpflaster im Bogenverband',
    'granit-reihe': 'Granitpflaster im Reihenverband'
  };
  var src = function (s, v) { return 'img/pf-' + s + '-' + v + '.webp'; };
  var cur = { s: 'klinker', v: 'fischgraet' };
  var A = document.getElementById('pf-a'), B = document.getElementById('pf-b'), cap = document.getElementById('pf-cap');
  var stBox = document.getElementById('pf-stein'), vbBox = document.getElementById('pf-verband');

  function chip(box, label, pressed, onClick, thumb) {
    var b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    if (thumb) { var i = document.createElement('img'); i.src = thumb; i.alt = ''; i.width = 30; i.height = 30; i.loading = 'lazy'; b.appendChild(i); } else b.className = 'np';
    b.appendChild(document.createTextNode(label));
    b.addEventListener('click', onClick); box.appendChild(b); return b;
  }
  function renderChips() {
    [].slice.call(stBox.querySelectorAll('button')).forEach(function (x) { x.remove(); });
    [].slice.call(vbBox.querySelectorAll('button')).forEach(function (x) { x.remove(); });
    Object.keys(FOTOS).forEach(function (s) {
      chip(stBox, STEIN[s].name, s === cur.s, function () { cur.s = s; if (FOTOS[s].indexOf(cur.v) < 0) cur.v = FOTOS[s][0]; update(); }, 'img/pf-thumb-' + s + '.webp');
    });
    FOTOS[cur.s].forEach(function (v) {
      chip(vbBox, VERBAND[v], v === cur.v, function () { cur.v = v; update(); });
    });
  }
  function swap() {
    var next = src(cur.s, cur.v), shown = A.classList.contains('on') ? A : B, hidden = shown === A ? B : A;
    if ((shown.getAttribute('data-src') || shown.getAttribute('src')) === next) return;
    hidden.onload = function () { hidden.classList.add('on'); shown.classList.remove('on'); hidden.setAttribute('aria-hidden', 'false'); shown.setAttribute('aria-hidden', 'true'); hidden.onload = null; };
    hidden.alt = ALT[cur.s + '-' + cur.v]; hidden.src = next;
    cap.textContent = STEIN[cur.s].name + ' · ' + VERBAND[cur.v];
  }
  var m2 = document.getElementById('pf-m2'), m2o = document.getElementById('pf-m2-out'), auto = document.getElementById('pf-auto'), srcEl = document.getElementById('pf-src');
  var de = function (n) { return (Math.round(n / 50) * 50).toLocaleString('de-DE'); };
  function calc() {
    var st = STEIN[cur.s], a = +m2.value, f = auto.checked ? 1.15 : 1, hi = a * st.max * f;
    m2o.textContent = a + ' m²';
    document.getElementById('pf-preis').textContent = de(a * st.min * f) + ' bis ' + de(hi) + ' €';
    document.getElementById('pf-bonus').textContent = 'bis ' + de(Math.min(1200, hi * .45 * .2)) + ' €';
  }
  function update() { renderChips(); swap(); calc(); }
  m2.addEventListener('input', function () { srcEl.textContent = 'Eigene Angabe'; calc(); });
  auto.addEventListener('change', calc);
  document.addEventListener('gartenplan', function (e) {
    var p = e.detail && e.detail.pflaster; if (!p) return;
    m2.value = Math.max(10, Math.min(250, p)); srcEl.textContent = 'Aus Ihrem Gartenplan übernommen'; calc();
  });
  document.getElementById('pf-cta').addEventListener('click', function () {
    var msg = document.getElementById('f-viesti'), art = document.getElementById('f-tyo');
    var t = 'Pflaster: ' + STEIN[cur.s].name + ', ' + VERBAND[cur.v] + ', ca. ' + m2.value + ' m²' + (auto.checked ? ', befahrbar' : '') + '. Richtpreis ' + document.getElementById('pf-preis').textContent + '.';
    if (msg && (!msg.value.trim() || msg.dataset.auto === '1')) { msg.value = t; msg.dataset.auto = '1'; }
    if (art) art.value = 'Pflaster oder Einfahrt';
    var lf = document.getElementById('lomake'); if (lf) lf.dataset.src = 'Pflaster-Wähler';
  });
  update();
})();
