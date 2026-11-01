/* Marktic: small contact panel that opens from the header button ("Ottakaa yhteyttä").
   Without JavaScript the button is a normal link to the contact form.
   Sends to the same CRM function as yhteys.html: it only accepts new requests, the key can't read anything. */
(function(){
  var EP = 'https://ocvargozhsgegbrfyiki.supabase.co/rest/v1/rpc/submit_website_lead';
  var KEY = 'sb_publishable_nfdBMh1ufBL3uApkcU6cbw_x-7EpgdB';
  var trig = document.querySelector('[data-pika]');
  if (!trig || !window.fetch) return;

  var css = ''
  + '.pk-scrim{position:fixed;inset:0;z-index:90;background:rgba(10,12,11,.32);opacity:0;transition:opacity .2s}'
  + '.pk-scrim.on{opacity:1}'
  + '.pk{position:fixed;z-index:91;top:80px;right:20px;width:min(390px,calc(100vw - 32px));max-height:calc(100vh - 100px);overflow:auto;'
  +   'background:#fbfaf6;color:#141615;border-radius:18px;box-shadow:0 0 0 1px rgba(20,22,21,.12),0 24px 60px rgba(10,12,11,.22);'
  +   'padding:22px 22px 18px;font-size:16px;line-height:1.45;opacity:0;transform:translateY(-8px);transition:opacity .2s,transform .2s}'
  + '.pk.on{opacity:1;transform:none}'
  + '.pk[hidden],.pk-scrim[hidden],.pk [hidden]{display:none!important}'
  + '.pk .pk-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}'
  + '.pk h2{margin:0;font-weight:400;font-size:1.45rem;line-height:1.15;letter-spacing:-.02em}'
  + '.pk .pk-sub{margin:6px 0 16px;color:rgba(20,22,21,.72);font-size:.9rem}'
  + '.pk .pk-x{flex:none;width:40px;height:40px;margin:-8px -8px 0 0;border:0;border-radius:999px;background:transparent;color:inherit;font:inherit;font-size:1.4rem;line-height:1;cursor:pointer}'
  + '.pk .pk-x:hover{background:rgba(20,22,21,.07)}'
  + '.pk form{display:flex;flex-direction:column;gap:10px;margin:0}'
  + '.pk label{display:flex;flex-direction:column;gap:5px;font-size:.86rem}'
  + '.pk label small{color:rgba(20,22,21,.62)}'
  + '.pk input{font:inherit;font-size:1rem;color:#141615;background:#f1eee7;border:1px solid rgba(20,22,21,.24);border-radius:10px;padding:10px 12px;min-height:46px;width:100%;box-sizing:border-box}'
  + '.pk input::placeholder{color:rgba(20,22,21,.55)}'
  + '.pk input:focus{outline:2px solid #141615;outline-offset:1px}'
  + '.pk .pk-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}'
  + '.pk .pk-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}'
  + '.pk .pk-err{margin:0;color:#9b2c1f;font-size:.86rem}.pk .pk-err a{color:inherit;text-decoration:underline}'
  + '.pk .pk-send{margin-top:4px;display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 20px;border:0;border-radius:999px;background:#141615;color:#f1eee7;font:inherit;font-size:.95rem;font-weight:500;cursor:pointer}'
  + '.pk .pk-send:disabled{opacity:.6;cursor:default}'
  + '.pk .pk-fine{margin:12px 0 0;font-size:.8rem;color:rgba(20,22,21,.66)}'
  + '.pk .pk-fine a{color:inherit;text-decoration:underline;text-underline-offset:2px}'
  + '.pk .pk-done p{margin:6px 0 16px;color:rgba(20,22,21,.72);font-size:.92rem}'
  + '@media (max-width:600px){.pk{top:auto!important;right:0!important;left:0;bottom:0;width:100%;max-height:92vh;border-radius:20px 20px 0 0;padding:20px 16px calc(18px + env(safe-area-inset-bottom,0px));transform:translateY(24px)}'
  +   '.pk .pk-two{grid-template-columns:minmax(0,1fr)}}'
  + '.pk-fab{position:fixed;z-index:80;right:20px;bottom:calc(20px + env(safe-area-inset-bottom,0px));display:inline-flex;align-items:center;gap:10px;min-height:52px;padding:0 20px 0 16px;'
  +   'border:0;border-radius:999px;background:#141615;color:#f1eee7;font:inherit;font-size:.95rem;font-weight:500;cursor:pointer;'
  +   'box-shadow:0 0 0 1px rgba(241,238,231,.14),0 14px 34px rgba(10,12,11,.32);opacity:0;transform:translateY(16px) scale(.96);transition:opacity .35s,transform .35s cubic-bezier(.2,.7,.2,1)}'
  + '.pk-fab.on{opacity:1;transform:none}'
  + '.pk-fab:hover{background:#2a2d2b}'
  + '.pk-fab:focus-visible{outline:2px solid #141615;outline-offset:3px}'
  + '.pk-fab[hidden]{display:none}'
  + '.pk-fab .pk-dot{position:relative;width:10px;height:10px;border-radius:50%;background:#cfe0a6;flex:none}'
  + '.pk-fab .pk-dot::after{content:"";position:absolute;inset:-5px;border-radius:50%;border:2px solid #cfe0a6;opacity:0;animation:pkPing 2.4s ease-out infinite}'
  + '@keyframes pkPing{0%{transform:scale(.5);opacity:.8}70%,100%{transform:scale(1.5);opacity:0}}'
  + '@media (max-width:600px){.pk-fab{right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));min-height:50px;font-size:.92rem}}'
  + '@media (prefers-reduced-motion:reduce){.pk,.pk-scrim,.pk-fab{transition:none}.pk-fab .pk-dot::after{animation:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var scrim = document.createElement('div'); scrim.className = 'pk-scrim'; scrim.hidden = true;
  var box = document.createElement('div');
  box.className = 'pk'; box.hidden = true;
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'pk-h');
  box.innerHTML = ''
  + '<div class="pk-top"><h2 id="pk-h">Ottakaa yhteyttä</h2><button class="pk-x" type="button" aria-label="Sulje">×</button></div>'
  + '<div class="pk-body">'
  +   '<p class="pk-sub">Yrityksen nimi, paikkakunta ja yhteystieto riittävät. Vastaamme kahden arkipäivän kuluessa.</p>'
  +   '<form novalidate>'
  +     '<div class="pk-two">'
  +       '<label for="pk-y">Yrityksen nimi<input id="pk-y" name="y" autocomplete="organization" required aria-describedby="pk-err"></label>'
  +       '<label for="pk-p">Paikkakunta<input id="pk-p" name="p" autocomplete="address-level2" required aria-describedby="pk-err"></label>'
  +     '</div>'
  +     '<label for="pk-c">Sähköposti tai puhelin<input id="pk-c" name="c" autocomplete="email" required aria-describedby="pk-err" placeholder="nimi@yritys.fi tai 040 123 4567"></label>'
  +     '<label for="pk-m"><span>Mitä tarvitsette? <small>valinnainen</small></span><input id="pk-m" name="m" placeholder="Esim. kotisivut, Google-profiili"></label>'
  +     '<div class="pk-hp" aria-hidden="true"><label for="pk-www">Jättäkää tyhjäksi<input id="pk-www" name="www" tabindex="-1" autocomplete="off"></label></div>'
  +     '<p class="pk-err" id="pk-err" role="alert" hidden></p>'
  +     '<div><button class="pk-send" type="submit">Lähettäkää pyyntö</button></div>'
  +   '</form>'
  +   '<p class="pk-fine">Tai soittakaa <a href="tel:+358406759882">040 675 9882</a>. Käytämme tietoja vain vastaamiseen. <a href="tietosuoja.html">Tietosuojaseloste</a></p>'
  + '</div>'
  + '<div class="pk-done" hidden tabindex="-1"><p>Kiitos, pyyntö on perillä. Vastaamme kahden arkipäivän kuluessa.</p><button class="pk-send pk-close2" type="button">Sulje</button></div>';
  var fab = document.createElement('button');
  fab.type = 'button'; fab.className = 'pk-fab'; fab.hidden = true;
  fab.setAttribute('aria-haspopup', 'dialog');
  fab.innerHTML = '<span class="pk-dot" aria-hidden="true"></span>Pyytäkää tarjous';
  document.body.appendChild(scrim); document.body.appendChild(box); document.body.appendChild(fab);

  var f = box.querySelector('form'), err = box.querySelector('#pk-err'), btn = box.querySelector('.pk-send');
  var body = box.querySelector('.pk-body'), done = box.querySelector('.pk-done');
  var lastFocus = null, open = false;
  var small = window.matchMedia('(max-width:600px)');

  var from = trig;
  function place(){
    if (small.matches) return;
    var r = from.getBoundingClientRect(), vw = document.documentElement.clientWidth;
    box.style.right = Math.round(Math.max(16, vw - r.right)) + 'px';
    if (from === fab){ box.style.top = 'auto'; box.style.bottom = Math.round(innerHeight - r.top + 12) + 'px'; }
    else { box.style.bottom = 'auto'; box.style.top = Math.round(Math.max(r.bottom, 56) + 10) + 'px'; }
  }
  function show(src){
    if (open) return; open = true; lastFocus = document.activeElement; from = src || trig;
    place(); scrim.hidden = false; box.hidden = false; fabState();
    if (small.matches) document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(function(){ scrim.classList.add('on'); box.classList.add('on'); });
    trig.setAttribute('aria-expanded', 'true');
    setTimeout(function(){ (done.hidden ? box.querySelector('#pk-y') : done).focus(); }, 30);
  }
  function hide(){
    if (!open) return; open = false;
    scrim.classList.remove('on'); box.classList.remove('on');
    document.documentElement.style.overflow = '';
    trig.setAttribute('aria-expanded', 'false');
    setTimeout(function(){ if (!open){ scrim.hidden = true; box.hidden = true; } }, 200);
    fabState();
    if (lastFocus && lastFocus.focus) lastFocus.focus({preventScroll: true});
  }

  trig.setAttribute('aria-haspopup', 'dialog'); trig.setAttribute('aria-expanded', 'false');
  trig.addEventListener('click', function(e){
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button > 0) return;
    e.preventDefault(); e.stopPropagation(); open ? hide() : show(trig);
  });
  fab.addEventListener('click', function(e){ e.stopPropagation(); open ? hide() : show(fab); });

  // Floating button: always within reach, but out of the way when a full contact form
  // or the services-page selection bar is on screen, or when the panel is open.
  var formInView = false, sent = false;
  var page = document.getElementById('yhteys') || document.getElementById('cform');
  if (page && 'IntersectionObserver' in window){
    new IntersectionObserver(function(en){ formInView = en[0].isIntersecting; fabState(); }, {threshold: 0.15}).observe(page);
  }
  var bar = document.querySelector('.selbar');
  if (bar && 'MutationObserver' in window) new MutationObserver(fabState).observe(bar, {attributes: true, attributeFilter: ['class']});
  function fabState(){
    var off = open || sent || formInView || (bar && bar.classList.contains('on'));
    if (off){ fab.classList.remove('on'); clearTimeout(fab._t); fab._t = setTimeout(function(){ if (!fab.classList.contains('on')) fab.hidden = true; }, 350); }
    else if (fab.hidden || !fab.classList.contains('on')){ fab.hidden = false; requestAnimationFrame(function(){ requestAnimationFrame(function(){ fab.classList.add('on'); }); }); }
  }
  setTimeout(fabState, 600);
  scrim.addEventListener('click', hide);
  box.querySelector('.pk-x').addEventListener('click', hide);
  box.querySelector('.pk-close2').addEventListener('click', hide);
  addEventListener('resize', function(){ if (open) place(); });
  document.addEventListener('keydown', function(e){
    if (!open) return;
    if (e.key === 'Escape'){ e.preventDefault(); hide(); return; }
    if (e.key !== 'Tab') return;
    var els = [].filter.call(box.querySelectorAll('button,input,a[href]'), function(el){ return el.offsetParent !== null && el.tabIndex !== -1; });
    if (!els.length) return;
    var a = els[0], z = els[els.length - 1];
    if (e.shiftKey && document.activeElement === a){ e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus(); }
  });

  function mailto(y, p, c, m){
    var b = 'Hei,\n\nottaisimme yhteyttä.\n\nYritys: ' + y + '\nPaikkakunta: ' + p + (c ? '\nYhteystieto: ' + c : '') + (m ? '\n\n' + m : '') + '\n';
    return 'mailto:info@marktic.fi?subject=' + encodeURIComponent('Yhteydenotto: ' + y) + '&body=' + encodeURIComponent(b);
  }
  f.addEventListener('submit', function(ev){
    ev.preventDefault();
    var y = f.y.value.trim(), p = f.p.value.trim(), c = f.c.value.trim(), m = f.m.value.trim();
    var cOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c) || /^[0-9 +()\-]{6,}$/.test(c);
    f.y.setAttribute('aria-invalid', y ? 'false' : 'true'); f.p.setAttribute('aria-invalid', p ? 'false' : 'true'); f.c.setAttribute('aria-invalid', cOk ? 'false' : 'true');
    if (!y || !p || !cOk){
      err.textContent = 'Kirjoittakaa yrityksen nimi, paikkakunta ja sähköposti tai puhelinnumero.'; err.hidden = false;
      (!y ? f.y : !p ? f.p : f.c).focus(); return;
    }
    err.hidden = true; btn.disabled = true; btn.textContent = 'Lähetetään…';
    var isMail = c.indexOf('@') > -1;
    fetch(EP, {method: 'POST', headers: {'Content-Type': 'application/json', 'apikey': KEY, 'Authorization': 'Bearer ' + KEY},
      body: JSON.stringify({p: {company: y, city: p, email: isMail ? c : '', phone: isMail ? '' : c, message: m, page: location.pathname + '#ylapalkki', www: f.www.value}})})
      .then(function(r){ return r.json().then(function(j){ if (!r.ok || !j || !j.ok) throw new Error((j && j.error) || r.status); }); })
      .then(function(){ body.hidden = true; done.hidden = false; done.focus(); sent = true; })
      .catch(function(){
        btn.disabled = false; btn.textContent = 'Lähettäkää pyyntö';
        err.innerHTML = 'Lähetys ei onnistunut. <a href="' + mailto(y, p, c, m).replace(/"/g, '&quot;') + '">Lähettäkää sama viesti sähköpostilla</a> tai soittakaa 040 675 9882.';
        err.hidden = false;
      });
  });
})();
