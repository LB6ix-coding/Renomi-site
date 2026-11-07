// marktic.fi free site check: GET /api/testi?url=yritys.fi
// Cloudflare Pages Function. Reads ONE page the visitor names and reports facts seen on it, plus Google's own
// PageSpeed scores (mobile) when the secret PAGESPEED_API_KEY is set in Cloudflare (Settings > Variables and
// Secrets). Without the key the page facts still work and `score` is null. The key never reaches the browser.
// Results are cached 24 h per address, so repeated tests do not use the Google quota.
// Nothing is stored about the visitor, and the fetched page is never passed back raw.

const PSI = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const PSI_FIELDS = [
  'lighthouseResult/finalDisplayedUrl',
  'lighthouseResult/categories/performance/score',
  'lighthouseResult/categories/seo/score',
  'lighthouseResult/audits/largest-contentful-paint/numericValue',
].join(',');
const UA = 'Mozilla/5.0 (compatible; MarkticTesti/1.0; +https://marktic.fi/yritys-ei-nay-googlessa)';
const MAX_TEXT = 60000;                 // characters of page text kept for the checks
const LOCAL_TYPES = new Set(['localbusiness', 'professionalservice', 'plumber', 'hvacbusiness', 'electrician',
  'homeandconstructionbusiness', 'generalcontractor', 'roofingcontractor', 'housepainter', 'autorepair',
  'accountingservice', 'legalservice', 'dentist', 'medicalbusiness', 'realestateagent', 'housekeepingservice',
  'beautysalon', 'hairsalon', 'nailsalon', 'dayspa', 'restaurant', 'cafeorcoffeeshop', 'store', 'locksmith',
  'movingcompany', 'landscaping', 'gardenstore', 'healthandbeautybusiness', 'automotivebusiness', 'foodestablishment']);
const FI_PHONE = /(?:\+358[\s-]?\(?0?\)?|\(?\b0)\d{1,3}\)?[\s-]?\d{3}[\s-]?\d{2,4}/;
const PRICE = /\d[\d\s .]*(?:,\d+)?\s?(?:€|eur\b|euroa\b)/i;

const json = (obj, status = 200, extra = {}) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
});

// Only plain public web addresses: no IP numbers, no local names, no odd ports.
export function cleanUrl(raw) {
  let s = String(raw || '').trim();
  if (!s || s.length > 200) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  let u;
  try { u = new URL(s); } catch { return null; }
  if (!/^https?:$/.test(u.protocol) || u.username || u.password || u.port) return null;
  const h = u.hostname.toLowerCase();
  if (!h.includes('.') || h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.localhost')) return null;
  if (/^[\d.]+$/.test(h) || h.includes(':') || h.startsWith('[')) return null;
  if (!/^[a-z0-9.-]+$/.test(h)) return null;   // URL() turns åäö domains into punycode, so they pass
  u.hash = '';
  return u.toString();
}

function schemaTypes(blocks) {
  const types = new Set();
  const walk = (n) => {
    if (Array.isArray(n)) { n.forEach(walk); return; }
    if (n && typeof n === 'object') {
      const t = n['@type'];
      (Array.isArray(t) ? t : [t]).forEach((x) => { if (typeof x === 'string') types.add(x.toLowerCase()); });
      Object.values(n).forEach(walk);
    }
  };
  for (const b of blocks) { try { walk(JSON.parse(b)); } catch { /* broken JSON-LD counts as none */ } }
  return types;
}

async function readPage(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 12000);
  let res;
  try {
    res = await fetch(url, { redirect: 'follow', signal: ctl.signal,
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml', 'accept-language': 'fi,en;q=0.5' } });
  } catch {
    clearTimeout(timer);
    return { reachable: false };
  }
  const finalUrl = res.url || url;
  const type = res.headers.get('content-type') || '';
  if (!res.ok || !/html/i.test(type)) { clearTimeout(timer); return { reachable: false, status: res.status }; }

  const st = { title: '', desc: null, viewport: false, noindex: /noindex/i.test(res.headers.get('x-robots-tag') || ''),
    lang: '', h1: [], forms: 0, iframes: 0, tel: false, ld: [], text: '' };
  let inTitle = false, h1 = null, skip = 0, ldBuf = null;
  const rw = new HTMLRewriter()
    .on('html', { element(e) { st.lang = (e.getAttribute('lang') || '').toLowerCase(); } })
    .on('title', { element(e) { inTitle = true; e.onEndTag(() => { inTitle = false; }); },
      text(t) { if (inTitle && st.title.length < 300) st.title += t.text; } })
    .on('meta', { element(e) {
      const k = (e.getAttribute('name') || e.getAttribute('property') || '').toLowerCase();
      const c = e.getAttribute('content') || '';
      if (k === 'description') st.desc = c;
      if (k === 'viewport') st.viewport = true;
      if ((k === 'robots' || k === 'googlebot') && /noindex/i.test(c)) st.noindex = true;
    } })
    .on('h1', { element(e) { h1 = ''; e.onEndTag(() => { st.h1.push(h1.replace(/\s+/g, ' ').trim()); h1 = null; }); },
      text(t) { if (h1 !== null && h1.length < 300) h1 += t.text; } })
    .on('form', { element() { st.forms++; } })
    .on('iframe', { element() { st.iframes++; } })
    .on('a[href^="tel:"]', { element() { st.tel = true; } })
    // one handler per element: a second onEndTag on the same element would replace the first
    .on('script', { element(e) {
      skip++;
      const ld = (e.getAttribute('type') || '').toLowerCase() === 'application/ld+json';
      if (ld) ldBuf = '';
      e.onEndTag(() => { skip--; if (ld) { if (st.ld.length < 20) st.ld.push(ldBuf); ldBuf = null; } });
    }, text(t) { if (ldBuf !== null && ldBuf.length < 100000) ldBuf += t.text; } })
    .on('style, noscript, template, svg', { element(e) { skip++; e.onEndTag(() => { skip--; }); } })
    .on('body', { text(t) { if (!skip && st.text.length < MAX_TEXT) st.text += t.text; } });
  try {
    await rw.transform(res).arrayBuffer();
  } catch {
    clearTimeout(timer);
    return { reachable: false };
  }
  clearTimeout(timer);

  const text = st.text.replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim();
  const types = schemaTypes(st.ld);
  const years = [...text.matchAll(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(20\d{2})/gi)].map((m) => +m[1]);
  return {
    reachable: true,
    finalUrl,
    https: finalUrl.startsWith('https://'),
    title: st.title.replace(/\s+/g, ' ').trim().slice(0, 160),
    metaDescription: !!(st.desc && st.desc.trim()),
    viewport: st.viewport,
    noindex: st.noindex,
    finnish: st.lang.startsWith('fi'),
    h1: st.h1.filter(Boolean).slice(0, 5).map((h) => h.slice(0, 120)),
    form: st.forms > 0,
    iframe: st.iframes > 0,
    phone: st.tel || FI_PHONE.test(text),
    price: PRICE.test(text),
    words: text ? text.split(' ').length : 0,
    localSchema: [...types].some((t) => LOCAL_TYPES.has(t)),
    faq: types.has('faqpage'),
    copyrightYear: years.length ? Math.max(...years) : null,
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

export async function onRequestGet({ request, env, waitUntil }) {
  // The page's own script sends this header. A script on another site would need a CORS preflight,
  // which this endpoint never answers, so other sites cannot use the check from their visitors' browsers.
  if (request.headers.get('x-marktic') !== '1') return json({ ok: false, error: 'forbidden' }, 403);
  const target = cleanUrl(new URL(request.url).searchParams.get('url'));
  if (!target) return json({ ok: false, error: 'bad_url' }, 400);

  const cache = caches.default;
  const cacheKey = new Request('https://marktic.fi/api/testi-cache?u=' + encodeURIComponent(target));
  const hit = await cache.match(cacheKey);
  if (hit) return new Response(hit.body, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-cache': 'hit' } });

  const [page, score] = await Promise.all([readPage(target), readScore(target, env.PAGESPEED_API_KEY)]);
  const body = { ok: true, url: target, checked: new Date().toISOString().slice(0, 10), page, score,
    scoreAvailable: !!env.PAGESPEED_API_KEY };
  if (page.reachable) {
    waitUntil(cache.put(cacheKey, new Response(JSON.stringify(body), {
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=86400' } })));
  }
  return json(body);
}

export const onRequest = () => json({ ok: false, error: 'method' }, 405, { allow: 'GET' });
