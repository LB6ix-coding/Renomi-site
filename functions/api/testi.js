// marktic.fi free site check: GET /api/testi?url=yritys.fi
// Cloudflare Pages Function. Reads ONE page the visitor names and reports facts seen on it, plus Google's own
// PageSpeed scores (mobile) when the secret PAGESPEED_API_KEY is set in Cloudflare (Settings > Variables and
// Secrets). Without the key the page facts still work and `score` is null. The key never reaches the browser.
// Cost guards for the free plan (10 ms CPU): at most 512 KB of HTML is read, regexes are bounded, results are cached
// (24 h with a score, 10 min without), and one address may run about 6 checks a minute per Cloudflare location.
// Nothing is stored about the visitor, and the fetched page is never passed back raw.

const PSI = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const PSI_FIELDS = [
  'lighthouseResult/finalDisplayedUrl',
  'lighthouseResult/categories/performance/score',
  'lighthouseResult/categories/seo/score',
  'lighthouseResult/audits/largest-contentful-paint/numericValue',
].join(',');
const UA = 'Mozilla/5.0 (compatible; MarkticTesti/1.0; +https://marktic.fi/yritys-ei-nay-googlessa)';
const MAX_BYTES = 512 * 1024;           // HTML read at most (small-firm homepages are usually far smaller)
const MAX_TEXT = 30000;                 // characters of page text kept for the checks
const PER_MINUTE = 6;                   // checks per visitor IP per minute (per Cloudflare location)
const BAD_HOSTS = /(^|\.)(localhost|nip\.io|sslip\.io|localtest\.me|lvh\.me)$/;
// LocalBusiness and its common schema.org subtypes, plus a pattern for the rest (…Store, …Business, …Contractor)
const LOCAL_TYPES = new Set(['localbusiness', 'professionalservice', 'plumber', 'hvacbusiness', 'electrician',
  'homeandconstructionbusiness', 'generalcontractor', 'roofingcontractor', 'housepainter', 'autorepair',
  'accountingservice', 'legalservice', 'attorney', 'notary', 'dentist', 'physician', 'medicalclinic', 'medicalbusiness',
  'optician', 'pharmacy', 'veterinarycare', 'realestateagent', 'housekeepingservice', 'beautysalon', 'hairsalon',
  'nailsalon', 'dayspa', 'tattooparlor', 'healthclub', 'exercisegym', 'sportsactivitylocation', 'restaurant',
  'cafeorcoffeeshop', 'bakery', 'barorpub', 'fastfoodrestaurant', 'foodestablishment', 'hotel', 'lodgingbusiness',
  'bedandbreakfast', 'store', 'florist', 'autodealer', 'autobodyshop', 'autowash', 'autopartsstore', 'tirestore',
  'locksmith', 'movingcompany', 'selfstorage', 'childcare', 'drycleaningorlaundry', 'travelagency',
  'insuranceagency', 'financialservice', 'employmentagency', 'emergencyservice', 'entertainmentbusiness',
  'automotivebusiness', 'healthandbeautybusiness', 'sportsclub', 'golfcourse', 'bowlingalley', 'skiresort']);
const LOCAL_PATTERN = /(store|shop|business|contractor|salon|clinic|agency|service)$/;
// Finnish phone numbers: +358 or a leading 0, then 6 to 10 more digits in groups. Y-tunnus (1234567-8) removed first.
const FI_PHONE = /(?:\+358|\b0)[\s-]?\(?\d{1,3}\)?(?:[\s-]?\d){5,9}(?!\d)/;
const Y_TUNNUS = /\b\d{7}-\d\b/g;
const PRICE = /\d(?:[\d .]{0,10}\d)?(?:,\d{1,2})?\s?(?:€|eur\b|euroa\b)/i;
const FORM_IFRAME = /forms\.gle|docs\.google\.com\/forms|typeform|jotform|tally\.so|hsforms|hubspot|webropol|cognitoforms|zohopublic|formstack|wufoo|calendly|timma|vello/i;

const json = (obj, status = 200, extra = {}) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
});

// Only plain public web addresses: no IP numbers, no local names, no odd ports, no query string.
export function cleanUrl(raw, keepQuery = false) {
  let s = String(raw || '').trim();
  if (!s || s.length > 200) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  let u;
  try { u = new URL(s); } catch { return null; }
  if (!/^https?:$/.test(u.protocol) || u.username || u.password || u.port) return null;
  const h = u.hostname.toLowerCase().replace(/\.$/, '');
  if (!h.includes('.') || h.endsWith('.local') || h.endsWith('.internal') || BAD_HOSTS.test(h)) return null;
  if (/^[\d.]+$/.test(h) || h.includes(':') || h.startsWith('[') || /^0x/i.test(h)) return null;
  if (!/^[a-z0-9.-]+$/.test(h)) return null;   // URL() turns åäö domains into punycode, so they pass
  u.hostname = h;
  u.hash = '';
  if (!keepQuery) u.search = '';
  return u.toString();
}

function schemaTypes(blocks) {
  const types = new Set();
  const walk = (n, depth) => {
    if (depth > 12) return;
    if (Array.isArray(n)) { n.forEach((x) => walk(x, depth + 1)); return; }
    if (n && typeof n === 'object') {
      const t = n['@type'];
      (Array.isArray(t) ? t : [t]).forEach((x) => { if (typeof x === 'string') types.add(x.toLowerCase().replace(/^.*[/:]/, '')); });
      Object.values(n).forEach((x) => walk(x, depth + 1));
    }
  };
  for (const b of blocks) { try { walk(JSON.parse(b), 0); } catch { /* broken JSON-LD counts as none */ } }
  return types;
}

const decode = (t) => t.replace(/&euro;|&#8364;|&#x20ac;/gi, '€').replace(/&nbsp;|&#160;|&#xa0;/gi, ' ').replace(/&amp;/g, '&');

async function fetchPage(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 12000);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctl.signal,
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml', 'accept-language': 'fi,en;q=0.5' } });
    return { res, timer };
  } catch {
    clearTimeout(timer);
    return { res: null, timer: null };
  }
}

async function readPage(url, httpFallback) {
  let { res, timer } = await fetchPage(url);
  if (!res && httpFallback) ({ res, timer } = await fetchPage(url.replace(/^https:/, 'http:')));
  if (!res) return { reachable: false };
  const finalUrl = res.url || url;
  const type = res.headers.get('content-type') || '';
  // a redirect may lead anywhere: the final address must pass the same rules
  if (!res.ok || !/html/i.test(type) || !cleanUrl(finalUrl, true)) {
    clearTimeout(timer);
    return { reachable: false, status: res.status };
  }

  const st = { title: '', desc: null, viewport: false, noindex: /noindex/i.test(res.headers.get('x-robots-tag') || ''),
    lang: '', h1: [], contactForm: false, formIframe: false, tel: false, ld: [], text: '' };
  let inTitle = false, h1 = null, skip = 0, ldBuf = null;
  const rw = new HTMLRewriter()
    .on('html', { element(e) { st.lang = (e.getAttribute('lang') || '').toLowerCase(); } })
    .on('head > title', { element(e) { inTitle = !st.title; e.onEndTag(() => { inTitle = false; }); },
      text(t) { if (inTitle && st.title.length < 300) st.title += t.text; } })
    .on('meta', { element(e) {
      const k = (e.getAttribute('name') || e.getAttribute('property') || '').toLowerCase();
      const c = e.getAttribute('content') || '';
      if (k === 'description') st.desc = c;
      if (k === 'viewport') st.viewport = true;
      if ((k === 'robots' || k === 'googlebot') && /noindex/i.test(c)) st.noindex = true;
    } })
    .on('h1', { element(e) { h1 = ''; e.onEndTag(() => { st.h1.push(decode(h1).replace(/\s+/g, ' ').trim()); h1 = null; }); },
      text(t) { if (h1 !== null && h1.length < 300) h1 += t.text; } })
    // a contact form has a message box or an email / phone field; a search box alone is not one
    .on('form textarea, form input[type="email"], form input[type="tel"]', { element() { st.contactForm = true; } })
    .on('iframe', { element(e) { if (FORM_IFRAME.test(e.getAttribute('src') || '')) st.formIframe = true; } })
    .on('a[href^="tel:"]', { element() { st.tel = true; } })
    // one handler per element: a second onEndTag on the same element would replace the first
    .on('script', { element(e) {
      skip++;
      const ld = (e.getAttribute('type') || '').toLowerCase() === 'application/ld+json';
      if (ld) ldBuf = '';
      e.onEndTag(() => { skip--; if (ld) { if (st.ld.length < 20) st.ld.push(ldBuf); ldBuf = null; } });
    }, text(t) { if (ldBuf !== null && ldBuf.length < 100000) ldBuf += t.text; } })
    .on('style, noscript, template, svg', { element(e) { skip++; e.onEndTag(() => { skip--; }); } })
    .on('body', { text(t) {
      if (skip || st.text.length >= MAX_TEXT) return;
      st.text += t.text;
      if (t.lastInTextNode) st.text += ' ';    // minified HTML: keep words in neighbouring tags apart
    } });

  // read at most MAX_BYTES; a bigger page is checked on its first 512 KB
  let n = 0;
  const capped = res.body.pipeThrough(new TransformStream({ transform(chunk, c) {
    if (n >= MAX_BYTES) return;
    n += chunk.byteLength;
    c.enqueue(chunk);
    if (n >= MAX_BYTES) c.terminate();
  } }));
  try {
    await rw.transform(new Response(capped, { headers: { 'content-type': type } })).body.pipeTo(new WritableStream());
  } catch {
    if (!n) { clearTimeout(timer); return { reachable: false }; }
  }
  clearTimeout(timer);

  const text = decode(st.text).replace(/\s+/g, ' ').trim();
  const forPhone = text.replace(Y_TUNNUS, ' ');
  const types = schemaTypes(st.ld);
  const years = [...text.slice(-4000).matchAll(/(?:©|copyright)\s*(?:\d{4}\s*[-–]\s*)?(20\d{2})/gi)].map((m) => +m[1]);
  return {
    reachable: true,
    finalUrl,
    https: finalUrl.startsWith('https://'),
    title: decode(st.title).replace(/\s+/g, ' ').trim().slice(0, 160),
    metaDescription: !!(st.desc && st.desc.trim()),
    viewport: st.viewport,
    noindex: st.noindex,
    finnish: st.lang.startsWith('fi'),
    h1: st.h1.filter(Boolean).slice(0, 5).map((h) => h.slice(0, 120)),
    form: st.contactForm,
    iframe: st.formIframe,
    phone: st.tel || FI_PHONE.test(forPhone),
    price: PRICE.test(text),
    words: text ? text.split(' ').length : 0,
    localSchema: [...types].some((t) => LOCAL_TYPES.has(t) || LOCAL_PATTERN.test(t)),
    faq: types.has('faqpage'),
    copyrightYear: years.length ? Math.max(...years) : null,
    truncated: n >= MAX_BYTES,
  };
}

export async function readScore(url, key) {
  if (!key) return null;
  const q = new URLSearchParams({ url, strategy: 'mobile', key, fields: PSI_FIELDS });
  q.append('category', 'performance');
  q.append('category', 'seo');
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 75000);
  try {
    const r = await fetch(PSI + '?' + q, { signal: ctl.signal });
    if (!r.ok) return null;
    const lh = (await r.json()).lighthouseResult || {};
    const c = lh.categories || {};
    const perf = c.performance && c.performance.score, seo = c.seo && c.seo.score;
    if (typeof perf !== 'number' || typeof seo !== 'number') return null;
    const lcp = ((lh.audits || {})['largest-contentful-paint'] || {}).numericValue;
    return { performance: Math.round(perf * 100), seo: Math.round(seo * 100),
      lcp_s: typeof lcp === 'number' ? Math.round(lcp / 100) / 10 : null };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function tooMany(request, cache) {
  const ip = request.headers.get('cf-connecting-ip') || 'x';
  const key = new Request('https://marktic.fi/api/testi-rate?ip=' + encodeURIComponent(ip) + '&m=' + Math.floor(Date.now() / 60000));
  const hit = await cache.match(key);
  const count = hit ? +(await hit.text()) || 0 : 0;
  if (count >= PER_MINUTE) return true;
  await cache.put(key, new Response(String(count + 1), { headers: { 'cache-control': 'public, max-age=120' } }));
  return false;
}

export async function onRequestGet({ request, env, waitUntil }) {
  // The page's own script sends this header. A script on another site would need a CORS preflight,
  // which this endpoint never answers, so other sites cannot use the check from their visitors' browsers.
  if (request.headers.get('x-marktic') !== '1') return json({ ok: false, error: 'forbidden' }, 403);
  const raw = new URL(request.url).searchParams.get('url') || '';
  const target = cleanUrl(raw);
  if (!target) return json({ ok: false, error: 'bad_url' }, 400);

  const cache = caches.default;
  // the key's presence is part of the cache key: adding the Google key must not serve old results without scores
  const cacheKey = new Request('https://marktic.fi/api/testi-cache?k=' + (env.PAGESPEED_API_KEY ? 1 : 0) + '&u=' + encodeURIComponent(target.replace(/\/$/, '')));
  const hit = await cache.match(cacheKey);
  if (hit) return new Response(hit.body, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-cache': 'hit' } });
  if (await tooMany(request, cache)) return json({ ok: false, error: 'busy' }, 429);

  const httpFallback = !/^https:\/\//i.test(raw.trim());     // the visitor typed no scheme: try http if https fails
  const [page, score] = await Promise.all([readPage(target, httpFallback), readScore(target, env.PAGESPEED_API_KEY)]);
  const body = { ok: true, url: target, checked: new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Helsinki' }),   // YYYY-MM-DD, Finnish date page, score,
    scoreAvailable: !!env.PAGESPEED_API_KEY };
  if (page.reachable) {
    const ttl = score || !env.PAGESPEED_API_KEY ? 86400 : 600;   // a failed Google measurement is retried sooner
    waitUntil(cache.put(cacheKey, new Response(JSON.stringify(body), {
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=' + ttl } })));
  }
  return json(body);
}

export const onRequest = () => json({ ok: false, error: 'method' }, 405, { allow: 'GET' });
