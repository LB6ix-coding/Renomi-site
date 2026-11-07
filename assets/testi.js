/* Marktic: free site check on /yritys-ei-nay-googlessa (#testi).
   Asks /api/testi (a Cloudflare Pages Function) to read the page the visitor names, then lists what we found,
   what it costs now and what changes once fixed, in the same order as our emails. Facts only: every finding
   comes from the page itself or from Google's PageSpeed measurement. The result can be sent to us as a lead
   through the same CRM function as the contact form. */
(function(){
  var form = document.getElementById('testi-form');
  var out = document.getElementById('testi-tulos');
  if (!form || !out || !window.fetch) return;
  var EP = 'https://ocvargozhsgegbrfyiki.supabase.co/rest/v1/rpc/submit_website_lead';
  var KEY = 'sb_publishable_nfdBMh1ufBL3uApkcU6cbw_x-7EpgdB';
  var MIN_WORDS = 80;           // below this the page text was too thin to judge content (same rule as our emails)
  var btn = form.querySelector('button');
  var input = form.querySelector('input[name=url]');
  var err = form.querySelector('.err');
  var last = null;

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function q(s, n){ s = String(s || '').trim(); n = n || 70; return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; }
  function fiDate(iso){ var p = String(iso).split('-'); return (+p[2]) + '.' + (+p[1]) + '.' + p[0]; }
  function num(x){ return String(x).replace('.', ','); }

  function weakTitle(t){ return t.length < 20 || /^(etusivu|koti|kotisivu|home|front page|welcome|tervetuloa)$/i.test(t); }
  // (fault, now, after) in formal Finnish, most harmful first
  function findings(d){
    var p = d.page, s = d.score, f = [], content = p.words >= MIN_WORDS, y = new Date().getFullYear();
    if (p.noindex) f.push(['Sivu on estetty hakukoneilta (noindex-merkintä).', 'Google ei näytä sitä hakutuloksissa lainkaan.', 'näkyy hakukoneille']);
    if (!p.viewport) f.push(['Sivua ei ole merkitty puhelimelle sopivaksi (viewport-merkintä puuttuu).', 'Puhelimella sivu näkyy pienennettynä tietokoneversiona, ja tekstiä pitää suurentaa sormilla.', 'toimii puhelimella']);
    if (!p.https) f.push(['Sivu ei käytä suojattua https-yhteyttä.', 'Chrome-selain näyttää osoiterivillä merkinnän "Ei turvallinen".', 'on suojattu']);
    if (s && s.performance < 50) f.push(['Googlen PageSpeed-mittari antaa sivulle puhelimella tehokkuudeksi ' + s.performance + '/100.',
      (s.lcp_s && s.lcp_s >= 4 ? 'Sivun pääsisältö näkyy puhelimella vasta noin ' + num(s.lcp_s) + ' sekunnin kohdalla. Google pitää hyvänä alle 2,5 sekuntia.' : 'Sivu latautuu puhelimella hitaasti, ja asiakas joutuu odottamaan ennen kuin näkee sisällön.'),
      'aukeaa puhelimella nopeasti']);
    if (!p.title) f.push(['Sivulla ei ole otsikkoa, jonka Google näyttäisi hakutuloksissa.', 'Google ei näe otsikosta, mitä teette ja missä.', 'kertoo jo hakutuloksessa, mitä teette ja missä']);
    else if (weakTitle(p.title)) f.push(['Sivun otsikko hakutuloksissa on vain "' + q(p.title) + '".', 'Otsikosta ei näe, mitä teette ja millä paikkakunnalla, joten Google ei yhdistä sivua sellaisiin hakuihin.', 'kertoo jo hakutuloksessa, mitä teette ja missä']);
    if (content && !p.price) f.push(['Sivulla ei näy yhtään hintaa tai hintahaarukkaa.', 'Asiakas, joka haluaa hintaluokan ennen yhteydenottoa, ei löydä sitä sivultanne.', 'näyttää hintaluokan']);
    if (content && !p.form && !p.iframe) f.push(['Sivulla ei ole yhteydenotto- tai tarjouspyyntölomaketta.', 'Illalla tai viikonloppuna selaava asiakas ei voi jättää pyyntöä suoraan sivulta, vaan hänen pitää muistaa soittaa tai kirjoittaa myöhemmin.', 'ottaa pyynnön vastaan suoraan']);
    if (content && !p.phone) f.push(['Sivulla ei näy puhelinnumeroa.', 'Puhelimella selaava asiakas ei voi soittaa teille yhdellä painalluksella.', 'näyttää numeron, johon voi soittaa suoraan']);
    if (content && !p.h1.length) f.push(['Sivulla ei ole pääotsikkoa (H1).', 'Pääotsikko on yksi tärkeimmistä kohdista, joista Google päättelee, mitä sivu tarjoaa.', 'kertoo pääotsikossa, mitä teette']);
    else if (content && p.h1.length > 1) f.push(['Sivulla on ' + p.h1.length + ' pääotsikkoa (H1), kun niitä pitäisi olla yksi.', 'Google ei näe, mikä niistä kertoo sivun aiheen.', 'kertoo pääotsikossa, mitä teette']);
    if (!p.metaDescription) f.push(['Sivulta puuttuu hakutulosten kuvausteksti (meta description).', 'Google poimii hakutulokseen jonkin kohdan sivulta itse, eikä se aina kerro, miksi juuri teille kannattaa soittaa.', 'näyttää hakutuloksessa oman kuvauksenne']);
    if (s && s.seo < 80) f.push(['Googlen PageSpeed-mittari antaa hakukoneoptimoinnille ' + s.seo + '/100.', 'Mittari löysi sivulta perusasioita, jotka haittaavat hakukoneita.', 'täyttää Googlen perusvaatimukset']);
    if (!p.localSchema) f.push(['Sivulla ei ole rakenteista yritystietoa (LocalBusiness-merkintä).', 'Google ja tekoälyhaut eivät saa yrityksenne alaa, aluetta ja yhteystietoja sivulta valmiissa, koneluettavassa muodossa.', 'kertoo yritystiedot koneluettavasti']);
    if (content && p.words < 200) f.push(['Sivulla on vain noin ' + p.words + ' sanaa tekstiä.', 'Google ei saa sivulta tarpeeksi tietoa siitä, mitä palveluita tarjoatte ja millä alueella.', 'kertoo palvelunne ja alueenne']);
    if (p.copyrightYear && p.copyrightYear <= y - 3) f.push(['Sivun alareunassa lukee © ' + p.copyrightYear + '.', 'Asiakkaalle se antaa kuvan, ettei sivuja ole päivitetty sen jälkeen.', 'on ajan tasalla']);
    return f;
  }
  function good(d){
    var p = d.page, s = d.score, g = [];
    if (p.https) g.push('Suojattu https-yhteys');
    if (p.viewport) g.push('Merkitty puhelimelle sopivaksi');
    if (p.title && !weakTitle(p.title)) g.push('Otsikko hakutuloksiin: "' + q(p.title) + '"');
    if (p.metaDescription) g.push('Kuvausteksti hakutuloksiin');
    if (p.h1.length === 1) g.push('Yksi pääotsikko: "' + q(p.h1[0], 60) + '"');
    if (p.phone) g.push('Puhelinnumero näkyy');
    if (p.form || p.iframe) g.push('Yhteydenottolomake');
    if (p.price) g.push('Hintoja näkyvillä');
    if (p.localSchema) g.push('Rakenteinen yritystieto');
    if (p.faq) g.push('Usein kysytyt kysymykset rakenteisena tietona');
    if (s && s.performance >= 50) g.push('Googlen tehokkuus puhelimella ' + s.performance + '/100');
    if (s && s.seo >= 80) g.push('Googlen hakukoneoptimointi ' + s.seo + '/100');
    return g;
  }

  function render(d){
    var host = d.url.split('://')[1].split('/')[0].replace(/^www\./, '');
    if (!d.page.reachable){
      out.innerHTML = '<div class="report" role="status"><p><b>Sivua ' + esc(host) + ' ei saatu auki.</b></p><p class="dim">Tarkistakaa osoite. Jos sivu aukeaa teillä selaimessa, se voi estää automaattiset tarkistukset. Lähettäkää osoite meille, niin katsomme sen käsin.</p></div>';
      out.hidden = false; return;
    }
    var f = findings(d), g = good(d), s = d.score, h = '';
    h += '<div class="report" role="status" aria-live="polite">';
    h += '<div class="rh"><b>' + esc(host) + '</b><span class="dim">Tarkistettu ' + fiDate(d.checked) + '</span></div>';
    h += '<div class="stats">';
    h += '<div><b>' + (s ? s.performance + '/100' : 'ei mitattu') + '</b><small>Tehokkuus puhelimella (Google)</small></div>';
    h += '<div><b>' + (s ? s.seo + '/100' : 'ei mitattu') + '</b><small>Hakukoneoptimointi (Google)</small></div>';
    h += '<div><b>' + f.length + '</b><small>Korjattavaa asiaa</small></div>';
    h += '</div>';
    if (f.length){
      h += '<h3>Mitä löysimme</h3><ol class="tl">';
      f.forEach(function(x){ h += '<li><b>' + esc(x[0]) + '</b><span><i>Nyt:</i> ' + esc(x[1]) + '</span><span><i>Korjattuna</i> sivu ' + esc(x[2]) + '.</span></li>'; });
      h += '</ol>';
    } else {
      h += '<p>Emme löytäneet tarkistamistamme kohdista korjattavaa. Hyvä!</p>';
    }
    if (g.length){ h += '<h3>Kunnossa</h3><ul class="ticks">'; g.forEach(function(x){ h += '<li>' + esc(x) + '</li>'; }); h += '</ul>'; }
    if (!s) h += '<p class="fine">' + (d.scoreAvailable ? 'Googlen mittaus ei onnistunut tällä kertaa.' : 'Googlen mittaus ei ole juuri nyt käytössä.') + ' Voitte ajaa sen itse osoitteessa <a href="https://pagespeed.web.dev/" rel="noopener" target="_blank">pagespeed.web.dev</a>.</p>';
    else h += '<p class="fine">Pisteet ovat Googlen PageSpeed Insights -mittauksesta puhelimella, ja ne vaihtelevat hieman mittauskerrasta toiseen. Voitte ajaa saman mittauksen itse osoitteessa <a href="https://pagespeed.web.dev/" rel="noopener" target="_blank">pagespeed.web.dev</a>.</p>';
    h += '<p class="fine">Testi lukee vain sivun, jonka osoitteen annoitte. Se ei näe Google-yritysprofiilianne eikä sitä, miltä sijalta yrityksenne löytyy.</p>';
    h += '</div>';
    h += '<form class="form" id="testi-lead" novalidate><h3 style="margin:0">Haluatteko korjausehdotuksen?</h3>'
      + '<p class="dim" style="margin:0">Lähetämme kirjallisen ehdotuksen siitä, mitä korjaisimme ensin ja mitä se maksaa. Maksuton, ei sido mihinkään.</p>'
      + '<div class="two"><label>Yrityksen nimi<input name="y" autocomplete="organization" required></label><label>Paikkakunta<input name="p" autocomplete="address-level2" required></label></div>'
      + '<label>Sähköposti tai puhelinnumero<input name="c" autocomplete="email" required></label>'
      + '<label class="hp" aria-hidden="true">Jätä tyhjäksi<input name="www" tabindex="-1" autocomplete="off"></label>'
      + '<p class="err" hidden></p><button class="pill pill-solid" type="submit">Pyydän korjausehdotuksen</button>'
      + '<p class="fine" style="margin:0">Käytämme tietoja vain tähän pyyntöön vastaamiseen. <a href="/tietosuoja">Tietosuojaseloste</a></p></form>';
    out.innerHTML = h; out.hidden = false;
    last = { host: host, faults: f.map(function(x){ return x[0]; }), score: s };
    var lf = document.getElementById('testi-lead');
    lf.addEventListener('submit', sendLead);
  }

  function sendLead(ev){
    ev.preventDefault();
    var f = ev.target, e = f.querySelector('.err'), b = f.querySelector('button');
    var y = f.y.value.trim(), p = f.p.value.trim(), c = f.c.value.trim();
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c) || /^[0-9 +()\-]{6,}$/.test(c);
    if (!y || !p || !ok){ e.textContent = 'Kirjoittakaa yrityksen nimi, paikkakunta ja sähköposti tai puhelinnumero.'; e.hidden = false; return; }
    e.hidden = true; b.disabled = true; b.textContent = 'Lähetetään…';
    var mail = c.indexOf('@') > -1;
    var msg = 'Sivutesti: ' + last.host + (last.score ? ' (Google ' + last.score.performance + '/' + last.score.seo + ')' : '') + '\n'
      + (last.faults.length ? last.faults.map(function(x){ return '- ' + x; }).join('\n') : 'Ei korjattavaa testin kohdissa.');
    fetch(EP, {method: 'POST', headers: {'Content-Type': 'application/json', 'apikey': KEY, 'Authorization': 'Bearer ' + KEY},
      body: JSON.stringify({p: {company: y, city: p, email: mail ? c : '', phone: mail ? '' : c, message: msg.slice(0, 2900), page: location.pathname + '#testi', www: f.www.value}})})
      .then(function(r){ return r.json().then(function(j){ if (!r.ok || !j || !j.ok) throw new Error(); }); })
      .then(function(){ f.outerHTML = '<div class="form sent" tabindex="-1" id="testi-kiitos"><h2>Kiitos, pyyntö on perillä.</h2><p class="dim">Lähetämme ehdotuksen kahden arkipäivän kuluessa.</p></div>'; var k = document.getElementById('testi-kiitos'); if (k) k.focus(); })
      .catch(function(){ b.disabled = false; b.textContent = 'Pyydän korjausehdotuksen'; e.innerHTML = 'Lähetys ei onnistunut. Lähettäkää viesti osoitteeseen <a href="mailto:info@marktic.fi">info@marktic.fi</a> tai soittakaa 040 675 9882.'; e.hidden = false; });
  }

  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    var v = input.value.trim();
    if (!v || v.indexOf('.') < 0){ err.textContent = 'Kirjoittakaa sivunne osoite, esimerkiksi yrityksenne.fi.'; err.hidden = false; input.focus(); return; }
    err.hidden = true; btn.disabled = true; btn.textContent = 'Tarkistetaan…';
    out.innerHTML = '<div class="report" role="status"><p><b>Luemme sivua ja pyydämme Googlen mittauksen.</b></p><p class="dim">Tämä voi kestää noin minuutin. Pitäkää sivu auki.</p></div>'; out.hidden = false;
    fetch('/api/testi?url=' + encodeURIComponent(v), {headers: {'x-marktic': '1'}})
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (!d || !d.ok){ throw new Error(d && d.error === 'bad_url' ? 'bad_url' : 'x'); }
        render(d);
        if (window.matchMedia('(max-width: 760px)').matches) out.scrollIntoView({behavior: 'smooth', block: 'start'});
      })
      .catch(function(x){
        out.hidden = true;
        err.textContent = x && x.message === 'bad_url' ? 'Osoite ei kelpaa. Kirjoittakaa se muodossa yrityksenne.fi.' : 'Tarkistus ei onnistunut juuri nyt. Yrittäkää hetken päästä uudelleen.';
        err.hidden = false;
      })
      .then(function(){ btn.disabled = false; btn.textContent = 'Testaa sivu'; });
  });
})();
