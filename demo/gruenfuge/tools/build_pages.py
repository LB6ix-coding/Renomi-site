#!/usr/bin/env python3
"""Builds the Grünfuge keyword landing pages, legal pages, 404, sitemap, robots and llms.txt
from one shared page() frame, so every page keeps the same header and footer as index.html."""
import json, os, re, html
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://marktic.fi/demo/gruenfuge/'
TODAY = '2026-11-13'
PHONE, PHONE_T, MAIL = '0611 000 0000', '+496110000000', 'info@gruenfuge.example'

LOGO = '<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="currentColor"/><path d="M7 9h8v6H7zM17 9h8v6h-8zM7 17h4v6H7zM13 17h12v6H13z" fill="#c9d77a"/></svg>'
TEL_I = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>'

LANDINGS = [
 ('gartenbau-mainz.html', 'Gartenbau Mainz'),
 ('pflasterarbeiten-wiesbaden.html', 'Pflasterarbeiten Wiesbaden'),
 ('terrassenbau-wiesbaden.html', 'Terrassenbau Wiesbaden'),
 ('gartengestaltung-mainz.html', 'Gartengestaltung Mainz'),
]

def page(file, title, desc, body, graph=None, robots='noindex', preload=None, canonical=True, battrs=''):
    ld = ''
    if graph:
        ld = '<script type="application/ld+json">' + json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False) + '</script>\n'
    canon = f'<link rel="canonical" href="{BASE}{file}">\n' if canonical else ''
    pre = f'<link rel="preload" as="image" href="{preload}" fetchpriority="high">\n' if preload else ''
    areas = ''.join(f'<li><a href="{f}">{n}</a></li>' for f, n in LANDINGS)
    return f'''<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
{canon}<meta property="og:type" content="website">
<meta property="og:url" content="{BASE}{file}">
<meta property="og:locale" content="de_DE">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:image" content="{BASE}img/og-gruenfuge.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="robots" content="{robots}">
<meta name="theme-color" content="#1f2d22">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='9' fill='%231f2d22'/%3E%3Cpath d='M7 9h8v6H7zM17 9h8v6h-8zM7 17h4v6H7zM13 17h12v6H13z' fill='%23c9d77a'/%3E%3C/svg%3E">
<link rel="apple-touch-icon" href="img/apple-touch-icon.png">
<link rel="preload" href="fonts/fraunces-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
{pre}<link rel="stylesheet" href="site.css">
<script>(function(d){{d.classList.add('js');function off(){{if(!d.classList.contains('ready'))d.classList.remove('js')}}addEventListener('error',off);addEventListener('load',function(){{setTimeout(off,1500)}})}})(document.documentElement)</script>
{ld}</head>
<body class="sub"{battrs}>
<a class="skip" href="#main">Zum Inhalt springen</a>
<div class="progress" aria-hidden="true"><span></span></div>
<header class="hdr">
  <nav class="wrap nav" aria-label="Hauptmenü">
    <a href="index.html" class="logo" aria-label="Grünfuge Garten- und Landschaftsbau, zur Startseite">{LOGO}<span>Grünfuge<small>Garten- und Landschaftsbau</small></span></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu" aria-label="Menü öffnen">
      <svg class="bars" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg>
      <svg class="x" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
    </button>
    <ul class="nav-links" id="menu">
      <li><a href="index.html#leistungen">Leistungen</a></li>
      <li><a href="index.html#planer">Garten planen</a></li>
      <li><a href="index.html#abend">Beleuchtung</a></li>
      <li><a href="index.html#ablauf">Ablauf</a></li>
      <li><a href="index.html#kontakt">Kontakt</a></li>
    </ul>
    <a class="btn btn-lichen nav-cta magnet" href="tel:{PHONE_T}">{TEL_I}{PHONE}</a>
  </nav>
</header>
<main id="main">
{body}
</main>
<footer>
  <div class="wrap foot foot-sub">
    <div><a href="index.html" class="logo">{LOGO}<span>Grünfuge<small>Garten- und Landschaftsbau</small></span></a>
      <p>Grünfuge ist ein fiktives Demo-Unternehmen. Die Beispiele auf dieser Website sind typische Auftragsarten, keine Kundenprojekte. Website von <a href="https://marktic.fi">Marktic</a>.</p></div>
    <nav aria-label="Regionen"><b>Regionen</b><ul>{areas}</ul></nav>
    <nav aria-label="Ratgeber und Rechtliches"><b>Ratgeber</b><ul><li><a href="pflaster-kosten.html">Was kostet Pflaster?</a></li></ul><b class="foot-b2">Rechtliches</b><ul><li><a href="impressum.html">Impressum</a></li><li><a href="datenschutz.html">Datenschutz</a></li></ul>
      <p class="upd">Stand: <time datetime="{TODAY}">13.11.2026</time></p></nav>
  </div>
</footer>
<div class="callbar">
  <a class="btn btn-moss" href="index.html#kontakt" data-anfrage>Termin anfragen</a>
  <a class="btn btn-cream" href="tel:{PHONE_T}">{TEL_I}Anrufen</a>
</div>
<script src="sub.js" defer></script>
</body>
</html>
'''

def contact_block(heading, text=None):
    return f'''<section id="kontakt" class="lp-cta">
  <div class="wrap lp-cta-in reveal">
    <div><span class="eyebrow">Kontakt</span><h2>{heading}</h2>
      <p>{text or 'Beschreiben Sie kurz, worum es geht. Sie bekommen eine Antwort per E-Mail.'}</p></div>
    <div class="lp-cta-btns">
      <a class="btn btn-lichen" href="index.html#kontakt" data-anfrage>Anfrage stellen</a>
      <a class="btn btn-glass" href="tel:{PHONE_T}">{TEL_I}{PHONE}</a>
      <a class="btn btn-glass" href="index.html#planer">Garten im Planer skizzieren</a>
    </div>
  </div>
</section>'''

def offer(p):
    o = {'@type': 'Offer', 'name': p[0], 'description': p[1]}
    m = re.match(r'(\d+)–(\d+) € pro (m²|laufendem Meter)', p[1])
    if m:
        o['priceSpecification'] = {'@type': 'UnitPriceSpecification', 'minPrice': int(m.group(1)), 'maxPrice': int(m.group(2)), 'priceCurrency': 'EUR', 'unitText': 'm²' if m.group(3) == 'm²' else 'lfm'}
    return o

def landing(d):
    f = d['file']
    siblings = ''.join(f'<li><a href="{x}">{n}</a></li>' for x, n in LANDINGS if x != f)
    prices = ''.join(f'<li><b>{p[0]}</b><span>{p[1]}</span></li>' for p in d['prices'])
    local = ''.join(f'<div class="lp-local-i reveal"><h3>{h}</h3><p>{t}</p></div>' for h, t in d['local'])
    ex = ''.join(f'<li class="ex reveal"><span class="ex-tag">{a}</span><h3>{h}</h3><p>{t}</p></li>' for a, h, t in d['examples'])
    gal = ''
    if d.get('gallery'):
        figs = []
        for i, (im, cap) in enumerate(d['gallery']):
            gw, gh = Image.open(os.path.join(ROOT, 'img', im)).size
            figs.append(f'<figure class="lp-g-i reveal"><img src="img/{im}" alt="{cap}" width="{gw}" height="{gh}" loading="lazy" decoding="async"><figcaption>{cap}</figcaption></figure>')
        link = f'<a class="lp-g-link" href="{d["gal_link"][0]}">{d["gal_link"][1]}</a>' if d.get('gal_link') else ''
        gal = f'''<section class="lp-sec lp-gal" aria-labelledby="gal-h">
  <div class="wrap">
    <div class="sec-head reveal"><div><span class="eyebrow">Bilder</span><h2 id="gal-h">{d['gal_h']}</h2></div><p>{d['gal_p']} {link}</p></div>
    <div class="lp-g">{''.join(figs)}</div>
  </div>
</section>

'''
    steps = ''.join(f'<li><b>{h}</b><p>{t}</p></li>' for h, t in d['steps'])
    faq = ''.join(f'<details class="reveal"><summary>{q}</summary><div><p>{a}</p></div></details>' for q, a in d['faq'])
    w, h = Image.open(os.path.join(ROOT, 'img', d['img'])).size
    body = f'''<section class="lp-hero lp-hero-img">
  <figure class="lp-bg"><img src="img/{d['img']}" alt="{d['img_alt']}" width="{w}" height="{h}" fetchpriority="high"></figure>
  <div class="wrap lp-hero-in">
    <nav class="crumbs" aria-label="Brotkrumen"><a href="index.html">Startseite</a> <span aria-hidden="true">/</span> <span>{d['kw']}</span></nav>
    <span class="eyebrow">{d['eyebrow']}</span>
    <h1>{d['h1']}</h1>
    <p class="lp-lead">{d['lead']}</p>
    <div class="lp-btns"><a class="btn btn-lichen" href="index.html#kontakt" data-anfrage>Vor-Ort-Termin anfragen</a><a class="btn btn-glass" href="#preise">Preise ansehen</a></div>
  </div>
</section>

<section class="lp-sec" id="preise">
  <div class="wrap lp-two">
    <div class="reveal"><span class="eyebrow">Preise</span><h2>{d['price_h']}</h2><p>{d['price_p']}</p></div>
    <ul class="lp-prices reveal">{prices}</ul>
  </div>
</section>

<section class="lp-sec lp-alt">
  <div class="wrap">
    <div class="sec-head reveal"><div><span class="eyebrow">{d['local_eb']}</span><h2>{d['local_h']}</h2></div><p>{d['local_p']}</p></div>
    <div class="lp-local">{local}</div>
  </div>
</section>

{gal}<section class="lp-sec">
  <div class="wrap">
    <div class="sec-head reveal"><div><span class="eyebrow">Typische Aufträge</span><h2>{d['ex_h']}</h2></div><p>{d['ex_p']}</p></div>
    <ul class="ex-list">{ex}</ul>
  </div>
</section>

<section class="lp-sec lp-alt">
  <div class="wrap lp-two">
    <div class="reveal"><span class="eyebrow">Ablauf</span><h2>{d['steps_h']}</h2><p>{d['steps_p']}</p></div>
    <ol class="lp-steps reveal">{steps}</ol>
  </div>
</section>

<section class="faq lp-sec" aria-labelledby="faq-h">
  <div class="wrap faq-grid">
    <div class="reveal"><span class="eyebrow">Häufige Fragen</span><h2 id="faq-h">{d['faq_h']}</h2></div>
    <div class="faq-list">{faq}</div>
  </div>
</section>

<section class="lp-sec lp-more">
  <div class="wrap"><h2 class="lp-more-h">Weitere Leistungen und Orte</h2><ul class="lp-chips">{siblings}<li><a href="index.html">Gartenbau Wiesbaden</a></li></ul></div>
</section>

{contact_block(d['cta_h'], d['cta_p'])}'''
    url = BASE + f
    graph = [
        {'@type': 'Service', 'name': d['kw'], 'serviceType': d['service'], 'provider': {'@id': BASE + '#firma'},
         'areaServed': {'@type': 'City', 'name': d['city']},
         'offers': [offer(p) for p in d['prices']]},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Startseite', 'item': BASE},
            {'@type': 'ListItem', 'position': 2, 'name': d['kw'], 'item': url}]},
        {'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': re.sub('<[^>]+>', '', a)}} for q, a in d['faq']]},
        {'@type': 'WebPage', '@id': url, 'name': d['title'], 'datePublished': TODAY, 'dateModified': TODAY}
    ]
    return page(f, d['title'], d['desc'], body, graph, preload='img/' + d['img'], battrs=f' data-page="{d["kw"]}" data-job="{d["job"]}"')

STEPS = [
 ('Fotos und Maße', 'Sie schicken Bilder der Fläche und grobe Maße per E-Mail.'),
 ('Ersteinschätzung', 'Innerhalb weniger Werktage bekommen Sie eine Preisspanne und unsere Rückfragen.'),
 ('Vor-Ort-Termin', 'Einmal aufs Grundstück: Boden, Gefälle, Zufahrt für Maschinen. Danach das verbindliche Angebot.'),
 ('Bau und Abnahme', 'Ein fester Ansprechpartner, Fotos vom Baufortschritt, gemeinsame Abnahme.'),
]

PAGES = [
 dict(file='gartenbau-mainz.html', job='Neuer Garten', kw='Gartenbau Mainz', city='Mainz', service='Garten- und Landschaftsbau',
  title='Gartenbau Mainz: Pflaster, Rasen, Beete | Grünfuge',
  desc='Gartenbau in Mainz: Pflaster, Rollrasen, Beete und Mauern, auch in engen Höfen. Richtpreise auf der Seite, erste Einschätzung per E-Mail.',
  eyebrow='Gartenbau · Mainz', h1='Gartenbau in Mainz, auch wenn kein Bagger in den Hof passt.',
  lead='Unser Betrieb sitzt in Wiesbaden, für Gartenbau in Mainz fahren wir einfach über den Rhein. Wir pflastern, mauern, verlegen Rollrasen und pflanzen, im Reihenhausgarten in Gonsenheim genauso wie auf dem Neubaugrundstück in Ebersheim.',
  img='lp-mainz-hero.webp', img_alt='Gartenbau am Hang: Natursteinmauer, Treppe aus Blockstufen und Plattenbelag vor einem Wohnhaus',
  price_h='Was ein Garten in Mainz kostet.', price_p='Richtwerte inkl. 19 % MwSt., Material und Arbeit. Den genauen Preis bestimmen Boden, Zufahrt für Maschinen und die Menge an Aushub, die abgefahren werden muss.',
  prices=[('Rollrasen', '15–30 € pro m²'), ('Pflaster mit Unterbau', '60–170 € pro m²'), ('Staudenbeet', '40–90 € pro m²'), ('Natursteinmauer bis etwa 80 cm Höhe', '250–450 € pro laufendem Meter')],
  local_eb='Mainz', local_h='Worauf es in Mainzer Gärten ankommt.', local_p='Mainz hat sehr unterschiedliche Grundstücke: enge Höfe in der Neustadt, Reihenhausgärten in Gonsenheim und Bretzenheim, Neubaugrundstücke am Stadtrand.',
  local=[('Wenig Platz, schmaler Zugang', 'In der Neustadt und der Altstadt kommt oft kein großer Bagger in den Garten. Wir planen dann mit Minibagger, Motorschubkarre und Big Bags, damit nicht alles von Hand getragen werden muss.'),
         ('Niederschlagswasser wird getrennt abgerechnet', 'In Mainz rechnet der Wirtschaftsbetrieb Schmutz- und Niederschlagswasser getrennt ab. Ob eine Versickerung vor Ort den Beitrag senkt, klären wir für Ihr Grundstück mit dem Wirtschaftsbetrieb Mainz. Gefälle und Versickerung planen wir in jedem Fall von Anfang an mit.'),
         ('Neubau am Stadtrand', 'In Neubaugebieten am Stadtrand, etwa in Ebersheim oder Hechtsheim, fangen viele Gärten bei null an: Bauschutt raus, Mutterboden rein, dann Wege, Terrasse und Rasen. Wir machen das in einem Zug.')],
  ex_h='Gärten, wie wir sie in Mainz bauen.',
  examples=[('Mainz-Neustadt', 'Innenhof statt Abstellfläche', 'Betonfläche aufgebrochen, Pflanzinseln mit Gräsern, Sitzplatz aus Klinker. Das Material kam in Big Bags durch die Hofeinfahrt.'),
            ('Mainz-Hechtsheim', 'Garten nach dem Einzug', 'Rollrasen auf frischem Mutterboden, ein Pflasterweg zur Garage und eine Hecke als Sichtschutz zum Nachbarn.'),
            ('Mainz-Finthen', 'Böschung mit Trockenmauer', 'Den Hang hinter dem Haus mit einer Trockenmauer abgefangen, oben eine ebene Rasenfläche.'),
            ('Mainz-Mombach', 'Vorgarten neu', 'Pflasterfläche verkleinert, Beet und Hecke statt Kies, neuer Weg zur Haustür.')],
  gallery=[('g-mauersteine.webp','Mauer aus Betonmauersteinen, die Fugen mit Polsterstauden bepflanzt'),('g-pflasterweg-mauer.webp','Pflasterweg zwischen Staudenbeet und Natursteinmauer'),('g-treppe-hang.webp','Treppe am Hang mit Natursteinmauer und Rasen davor')],
  gal_h='Wo das Gelände springt.', gal_p='Am Hang kommt selten eine Arbeit allein: erst die Mauer, dann ein fester Weg und Stufen, auf denen man nicht ins Rutschen kommt.',
  ex_p='Vom Innenhof in der Neustadt bis zur Böschung in Finthen.',
  steps_h='So entsteht ein Garten in Mainz.',
  steps_p='Vom ersten Foto bis zur Abnahme haben Sie einen festen Ansprechpartner. Vor dem Angebot kommen wir einmal aufs Grundstück, Rückfragen klären wir per E-Mail oder Telefon.',
  cta_p='Schreiben Sie uns, was in Ihrem Garten gemacht werden soll und wie groß er ungefähr ist. Ein Foto vom Zugang hilft uns, den Aufwand bei engen Höfen richtig einzuschätzen.',
  steps=[('Kurz beschreiben', 'Über das Formular: was gemacht werden soll, ungefähre Größe, gern ein paar Fotos.'), ('Erste Preisspanne', 'Per E-Mail bekommen Sie eine Spanne und unsere Rückfragen, zum Beispiel zum Zugang.'), ('Grundstück ansehen', 'Wir messen auf, prüfen Boden und Zufahrt und schicken das verbindliche Angebot mit getrennt ausgewiesenem Arbeitsanteil.'), ('Bauen in Abschnitten', 'Erst Erdarbeiten und Wege, dann Pflanzen und Rasen. Zum Schluss gehen wir den Garten gemeinsam ab.')], faq_h='Fragen zum Gartenbau in Mainz.',
  faq=[('Was kostet ein neuer Garten in Mainz?', 'Das hängt vor allem von Fläche und Material ab, dazu kommen Boden und Zugang. Ein kleiner Reihenhausgarten mit Terrasse, Rasen und einem Beet liegt oft im mittleren vierstelligen Bereich, ein ganzer Neubaugarten mit Einfahrt deutlich darüber. Mit dem Gartenplaner auf der Startseite sehen Sie eine Spanne für Ihre eigene Aufteilung.'),
       ('Arbeiten Sie auch in engen Höfen in der Mainzer Neustadt?', 'Ja. Für enge Höfe planen wir mit kleinen Maschinen und Material in Big Bags. Wichtig ist, dass wir vorher wissen, wie breit der Zugang ist. Ein Foto von Tor oder Durchgang hilft uns bei der Einschätzung. Muss Material durch das Haus getragen werden, sagen wir Ihnen das vorher, damit Sie wissen, was es kostet.'),
       ('Gilt der Steuerbonus auch für den Garten am Neubau?', 'Arbeiten am Neubau, die vor der Fertigstellung des Hauses anfallen, zählen nicht. Was danach kommt, kann unter § 35a Abs. 3 EStG fallen: 20 Prozent der Arbeits-, Fahrt- und Maschinenkosten, höchstens 1.200 Euro pro Haushalt und Jahr, wenn Sie den Rechnungsbetrag überweisen. Ob das bei Ihnen gilt, entscheidet Ihr Finanzamt.'),
       ('Wie schnell können Sie anfangen?', 'Im Winter planen wir, gebaut wird meist von März bis November. Frühjahrstermine sind meist schnell vergeben. Wenn Sie jetzt anfragen, können wir den Plan im Winter fertig machen und im Frühjahr direkt loslegen. Kleinere Arbeiten wie ein Beet oder Rollrasen passen oft auch kurzfristig dazwischen.'),
       ('Lässt sich alles per E-Mail klären?', 'Ja. Sie schicken uns über das Formular oder per E-Mail eine kurze Beschreibung und die ungefähren Maße und bekommen eine erste Einschätzung per E-Mail. Für das verbindliche Angebot kommen wir einmal aufs Grundstück. Danach klären wir Rückfragen und Termine gern schriftlich. Zur Abnahme gehen wir den Garten aber gemeinsam ab.')],
  cta_h='Am Anfang reicht eine E-Mail.'),

 dict(file='pflasterarbeiten-wiesbaden.html', job='Pflaster oder Einfahrt', kw='Pflasterarbeiten Wiesbaden', city='Wiesbaden', service='Pflasterarbeiten',
  title='Pflasterarbeiten Wiesbaden: Pflaster ab 60 €/m² | Grünfuge',
  desc='Pflasterarbeiten in Wiesbaden: Einfahrten, Wege und Stellplätze mit tragfähigem Unterbau. Echte Pflasterfotos, Richtpreis, Festpreis nach Vor-Ort-Termin.',
  eyebrow='Pflasterarbeiten · Wiesbaden', h1='Pflasterarbeiten in Wiesbaden, die auch am Hang halten.',
  lead='Wir pflastern Einfahrten, Wege und Stellplätze. Bei Pflasterarbeiten in Wiesbaden kommt oft der Hang dazu: Deshalb legen wir zuerst fest, wohin das Regenwasser läuft, und bauen den Unterbau so tief, wie Ihr Boden es braucht.',
  img='lp-pflaster-hero.webp', img_alt='Pflasterarbeiten in Klinker: roter Pflasterklinker im Fischgrätverband',
  price_h='Was Pflasterarbeiten in Wiesbaden kosten.', price_p='Richtwerte inkl. 19 % MwSt., Material, Unterbau und Verlegung. Befahrbare Flächen brauchen mehr Unterbau und kosten etwa 15 % mehr. Woraus sich der Preis zusammensetzt, zeigt unser <a href="pflaster-kosten.html">Ratgeber zu Pflasterkosten</a>.',
  prices=[('Betonsteinpflaster', '60–95 € pro m²'), ('Pflasterklinker', '80–125 € pro m²'), ('Granitpflaster', '110–170 € pro m²'), ('Altes Pflaster neu verlegen', 'auf Anfrage, oft günstiger als neu')],
  local_eb='Wiesbaden', local_h='Pflastern am Taunushang.', local_p='Viele Wiesbadener Grundstücke liegen am Hang. Das hat Folgen dafür, wie eine Einfahrt gebaut werden muss.',
  local=[('Gefälle und Querrinne am Hang', 'In Sonnenberg, Rambach oder Dotzheim läuft Regenwasser oft direkt auf die Garage zu. Eine Querrinne vor dem Tor und das richtige Gefälle der Fläche halten das Wasser draußen.'),
         ('Gebühr nach versiegelter Fläche', 'In Wiesbaden hängt die Niederschlagswassergebühr von der gebührenrelevanten Fläche ab. Pflaster mit offenen Fugen oder Versickerung auf dem Grundstück kann sich deshalb lohnen. Außerdem verlangt die Hessische Bauordnung in § 8, dass nicht überbaute Flächen wasserdurchlässig bleiben, soweit sie nicht als Zufahrt oder Ähnliches gebraucht werden. Für den Gartenweg heißt das: lieber offene Fugen.'),
         ('Unterbau statt Nacharbeit', 'Wenn eine Einfahrt absackt, war fast immer der Unterbau zu dünn oder schlecht verdichtet. Für befahrene Flächen rechnen wir je nach Boden mit 30 bis 50 cm Frostschutz- und Tragschicht.')],
  ex_h='Was wir oft pflastern.',
  examples=[('Wiesbaden-Rambach', 'Querrinne vor der Garage', 'Abgesacktes Pflaster vor dem Tor aufgenommen, Rinne eingebaut, die Fläche mit Gefälle neu verlegt.'),
            ('Wiesbaden-Schierstein', 'Klinker wiederverwendet', 'Alten Klinker aufgenommen, gereinigt und auf neuem Unterbau im Fischgrätverband verlegt.'),
            ('Wiesbaden-Nordenstadt', 'Stellplätze am Neubau', 'Zwei Stellplätze in Rasenfugenpflaster, Weg zur Haustür in Betonstein.'),
            ('Wiesbaden-Bierstadt', 'Hofeinfahrt in Klinker', 'Klinker im Fischgrätverband, Randsteine in Granit.')],
  gallery=[('g-palisaden.webp','Pflasterweg aus bunten Betonsteinen, Beet mit Palisaden eingefasst'),('g-pflasterkreis.webp','Runde Pflasterfläche mit Sitzstufen aus Mauersteinen'),('pf-granit-bogen.webp','Granitpflaster im Bogenverband')],
  gal_h='Fotos verlegter Flächen.', gal_p='Im Pflaster-Wähler auf der Startseite wechseln Sie Stein und Verband und sehen dazu den Richtpreis für Ihre Fläche.', gal_link=('index.html#pflaster','Zum Pflaster-Wähler'),
  ex_p='Vom Garagenvorplatz am Hang bis zur Hofeinfahrt in Klinker.',
  steps_h='Vom Aufmaß bis zum Einfegen.',
  steps_p='Beim Pflaster entscheidet der Unterbau. Deshalb sehen wir uns jede Fläche an, bevor wir ein verbindliches Angebot schreiben.',
  cta_p='Schreiben Sie uns, wie groß die Fläche ist, ob sie befahren wird und welcher Stein Ihnen gefällt. Stein und Verband können Sie vorher im Pflaster-Wähler auf der Startseite mit echten Fotos vergleichen.',
  steps=[('Fläche beschreiben', 'Größe, befahren oder nicht, gewünschter Stein. Ein Foto der jetzigen Fläche hilft.'), ('Aufmaß und Gefälle', 'Vor Ort messen wir die Höhen, prüfen den Boden und legen fest, wohin das Wasser läuft.'), ('Unterbau', 'Aushub, Frostschutz- und Tragschicht in Lagen verdichtet, darauf das Splittbett.'), ('Verlegen und Einfegen', 'Steine verlegen, Fugen einfegen, abrütteln. Danach ist die Fläche sofort nutzbar.')], faq_h='Was wir zu Einfahrten oft gefragt werden.',
  faq=[('Was kostet eine gepflasterte Einfahrt in Wiesbaden?', 'Für eine befahrbare Einfahrt in Betonstein rechnen Sie bei uns mit etwa 70 bis 110 Euro pro Quadratmeter, in Granit mit 125 bis 195 Euro. Darin sind der tiefere Unterbau, das Material und die Verlegung enthalten. Ein Gartenweg liegt etwa 15 Prozent darunter. Das Aufnehmen und Entsorgen von altem Pflaster weisen wir getrennt aus. Den verbindlichen Preis bekommen Sie nach dem Vor-Ort-Termin.'),
       ('Lohnt sich wasserdurchlässiges Pflaster in Wiesbaden?', 'Oft ja. Die Niederschlagswassergebühr richtet sich nach der gebührenrelevanten Fläche, und durchlässige Beläge oder Versickerung auf dem Grundstück können diese verringern. Wie viel das bei Ihnen ausmacht, zeigt der Gebührenrechner der ELW (Entsorgungsbetriebe der Landeshauptstadt Wiesbaden) für Privathaushalte, auf den auch die <a href="https://www.wiesbaden.de/leben-in-wiesbaden/umwelt-natur-klima/klimaschutz/dachbegruenung">Stadt Wiesbaden</a> verweist. Wir planen Gefälle und Fugen so, dass das Wasser auf Ihrem Grundstück versickern kann, wo der Boden es zulässt.'),
       ('Wie tief muss der Unterbau einer Einfahrt sein?', 'Für eine befahrene Einfahrt rechnen wir je nach Boden mit 30 bis 50 Zentimetern Frostschutz- und Tragschicht plus 3 bis 5 Zentimetern Splittbett. Ein Gartenweg kommt mit deutlich weniger aus. Den Aufbau legen wir nach dem Boden vor Ort fest.'),
       ('Kann man alte Pflastersteine wiederverwenden?', 'Wenn die Steine heil sind, ja. Wir nehmen sie auf, bauen den Unterbau neu und verlegen dieselben Steine wieder. Das spart Material und sieht danach aus wie vorher, nur wieder eben. Ob die Steine noch taugen, sehen wir beim Vor-Ort-Termin, denn Kantenabbrüche und Risse fallen sofort auf.'),
       ('Wie lange dauert der Bau einer Einfahrt?', 'Eine typische Einfahrt mit 40 bis 80 Quadratmetern dauert meist ein bis zwei Wochen, je nach Aushub und Wetter. Während der Arbeiten planen wir mit Ihnen, wo das Auto in der Zeit steht. Nach dem Abrütteln und Einfegen der Fugen ist das Pflaster sofort begehbar und befahrbar.')],
  cta_h='Welche Fläche soll gepflastert werden?'),

 dict(file='terrassenbau-wiesbaden.html', job='Terrasse', kw='Terrassenbau Wiesbaden', city='Wiesbaden', service='Terrassenbau',
  title='Terrassenbau Wiesbaden: Naturstein und Holz | Grünfuge',
  desc='Terrassenbau in Wiesbaden: Naturstein, Feinsteinzeug und Holz, auch am Hang. Richtpreise auf der Seite, erste Einschätzung per E-Mail.',
  eyebrow='Terrassenbau · Wiesbaden', h1='Terrassenbau in Wiesbaden, wenn die Tür höher liegt als der Garten.',
  lead='Bei vielen Häusern am Taunushang liegt die Terrassentür ein ganzes Stück über dem Rasen. Beim Terrassenbau in Wiesbaden geht es deshalb fast immer zuerst um die Höhe. Wir bauen die Fläche in der richtigen Höhe, aus Naturstein, Feinsteinzeug oder Holz.',
  img='lp-terrasse-hero.webp', img_alt='Terrassenbau: Plattenterrasse mit Sonnenschirm und Liegestühlen vor einer Natursteinfassade, Trittplatten im Rasen',
  price_h='Preise pro Quadratmeter.', price_p='Richtwerte inkl. 19 % MwSt., Material und Arbeit. Am Hang kommen Stützmauer oder Stufen dazu, die wir getrennt ausweisen.',
  prices=[('Natursteinplatten', '150–280 € pro m²'), ('Feinsteinzeug auf Stelzlagern', '140–240 € pro m²'), ('Holz- oder WPC-Terrasse', '150–260 € pro m²'), ('Blockstufen aus Granit', 'auf Anfrage, je nach Höhe')],
  local_eb='Wiesbaden', local_h='Am Hang anders als am Rhein.', local_p='Am Taunusrand liegen viele Gärten am Hang, in Biebrich und Schierstein eher flach am Rhein. Beides verlangt jeweils eine eigene Bauweise.',
  local=[('Höhe zur Terrassentür', 'Wenn die Tür einen halben Meter über dem Garten liegt, bauen wir eine aufgeständerte Terrasse oder eine kleine Stützmauer mit Stufen, damit Sie ohne Stolperkante hinaustreten.'),
         ('Stelzlager statt Betonbett', 'Feinsteinzeug und große Natursteinplatten verlegen wir gern auf Stelzlagern. Wasser läuft darunter ab, und Leitungen für Licht und Steckdosen bleiben zugänglich.'),
         ('Licht gleich mitplanen', 'Leerrohre für Stufen- und Wegleuchten verlegen wir beim Bau gleich mit. Später nachzurüsten heißt oft, Platten wieder aufzunehmen.')],
  ex_h='Typische Terrassen am Hang und in der Ebene.',
  examples=[('Wiesbaden-Dotzheim', 'Terrasse am Hang', 'Natursteinterrasse mit Stützmauer und drei Blockstufen in den Garten.'),
            ('Wiesbaden-Schierstein', 'Holzterrasse', 'Terrasse aus Lärche, Unterkonstruktion auf Punktfundamenten.'),
            ('Wiesbaden-Medenbach', 'Feinsteinzeug auf Stelzlagern', 'Große Platten, ebenerdig zur Tür, mit Rinne vor der Fassade.'),
            ('Wiesbaden-Auringen', 'Alte Terrasse erneuern', 'Waschbetonplatten raus, Natursteinplatten rein, Unterbau neu.')],
  gallery=[('g-sitzplatz.webp','Sitzplatz auf großformatigen Platten vor einer Hecke'),('g-strandkorb.webp','Kleine Plattenterrasse am Haus mit Strandkorb und Hortensien'),('g-trittstufen.webp','Natursteinstufen im Rasen am Hang')],
  gal_h='Zur Terrasse gehören meist Stufen.', gal_p='Eine Terrasse ist selten nur eine Fläche: Dazu gehören Stufen in den Garten und oft ein zweiter, kleiner Sitzplatz. Wir planen alles in einem Zug.',
  ex_p='Vier Terrassen, wie wir sie in Wiesbaden oft bauen.',
  steps_h='Von der Türschwelle aus geplant.',
  steps_p='Wir planen jede Terrasse von der Höhe der Terrassentür aus. Daraus ergeben sich Unterbau, Stufen und Gefälle.',
  cta_p='Schicken Sie uns ein Foto von der Terrassentür und dem Garten davor. Daran sehen wir schon viel: Höhe, Gefälle und wie viel Platz für Stufen bleibt.',
  steps=[('Höhe und Größe', 'Sie schicken ein Foto von Tür und Garten und die gewünschte Größe.'), ('Material wählen', 'Naturstein, Feinsteinzeug oder Holz. Muster bringen wir auf Wunsch zum Termin mit.'), ('Unterbau oder Stelzlager', 'Je nach Höhe ein verdichteter Unterbau, Stelzlager oder eine Unterkonstruktion aus Holz.'), ('Belag, Stufen, Licht', 'Belag verlegen, Stufen setzen, Leuchten anschließen, dann die gemeinsame Abnahme.')], faq_h='Bevor Sie eine Terrasse bauen lassen.',
  faq=[('Was kostet eine Terrasse in Wiesbaden?', 'Bei uns meist 150 bis 280 Euro pro Quadratmeter für Natursteinplatten und 140 bis 240 Euro für Feinsteinzeug auf Stelzlagern, jeweils mit Unterbau und Verlegung. Stufen oder eine Stützmauer am Hang berechnen wir gesondert. Den Unterbau passen wir an Boden und Höhe an.'),
       ('Was ist besser: Naturstein, Feinsteinzeug oder Holz?', 'Das hängt vor allem davon ab, wie viel Pflege Sie wollen. Auf Feinsteinzeug lässt sich sogar Rotwein einfach abwischen. Naturstein bekommt mit den Jahren Patina, das muss man mögen. Holz ist barfuß am angenehmsten, will aber regelmäßig gepflegt werden. Für Terrassen mit viel Sonne raten wir eher zu hellen Steinen, weil dunkle Platten im Sommer sehr heiß werden. Muster bringen wir auf Wunsch zum Vor-Ort-Termin mit.'),
       ('Brauche ich für eine Terrasse eine Genehmigung?', 'Eine ebenerdige Terrasse ist in der Regel genehmigungsfrei. Bei hohen Stützmauern, Überdachungen oder wenn der Bebauungsplan besondere Vorgaben macht, kann das anders sein. Das klären wir vor dem Angebot mit Ihnen. Bei einer erhöhten Terrasse nahe der Grundstücksgrenze sprechen wir auch über den Abstand zum Nachbarn.'),
       ('Was passiert mit der alten Terrasse?', 'Alte Platten oder Holzdielen nehmen wir auf und entsorgen sie. Die Entsorgung weisen wir im Angebot gesondert aus, damit Sie sehen, was sie kostet. Ist der alte Unterbau noch tragfähig, kann er manchmal bleiben. Das prüfen wir beim Vor-Ort-Termin, bevor wir den Preis festlegen.'),
       ('Wie lange dauert der Bau?', 'Eine Terrasse mit 20 bis 40 Quadratmetern dauert meist ein bis zwei Wochen. Am Hang mit Mauer und Stufen etwas länger. Wir sagen Ihnen vorher, an welchen Tagen Maschinen und Lieferungen kommen und wann die Terrassentür nicht nutzbar ist.')],
  cta_h='Fangen wir an der Terrassentür an.'),

 dict(file='gartengestaltung-mainz.html', job='Bepflanzung und Rasen', kw='Gartengestaltung Mainz', city='Mainz', service='Gartengestaltung',
  title='Gartengestaltung Mainz: Plan, Pflanzen, Licht | Grünfuge',
  desc='Gartengestaltung in Mainz: Pflanzplan, Beete, Rasen und Licht, passend zu Boden und Sonne. Planung auch ohne Bauauftrag, Umsetzung in Abschnitten möglich.',
  eyebrow='Gartengestaltung · Mainz', h1='Gartengestaltung in Mainz: erst schauen, wo die Sonne steht.',
  lead='Bei der Gartengestaltung in Mainz klären wir zuerst, welche Ecken mittags in der prallen Sonne liegen und welche den ganzen Tag Schatten haben. Erst dann planen wir Beete, Rasen, Wege und Licht.',
  img='lp-gestaltung-hero.webp', img_alt='Gartengestaltung mit trockenheitsverträglichen Pflanzen: Lavendel und Blauschwingel im Kiesbeet',
  price_h='Was Planung und Pflanzen kosten.', price_p='Richtwerte inkl. 19 % MwSt. Was der Plan kostet, hängt von der Größe des Gartens ab.',
  prices=[('Gartenplan mit Pflanzliste', 'auf Anfrage, je nach Größe'), ('Staudenbeet inkl. Pflanzen', '40–90 € pro m²'), ('Rollrasen inkl. Vorbereitung', '15–30 € pro m²'), ('Gartenbeleuchtung', 'auf Anfrage, je nach Anzahl der Leuchten')],
  local_eb='Mainz', local_h='Mainz bekommt wenig Regen.', local_p='Rheinhessen ist eine der niederschlagsärmsten Gegenden Deutschlands. Laut <a href="https://www.klimawandel.rlp.de/fileadmin/website/03_mediathek/01_Veroeffentlichungen/2023_Klimasteckbriefe/Mainz_Factsheet.pdf">Klimasteckbrief des Landes Rheinland-Pfalz</a> fallen in Mainz von Mai bis Oktober im Schnitt nur rund 320 Liter Regen pro Quadratmeter (1993 bis 2022). Danach richtet sich, was wir pflanzen.',
  local=[('Pflanzen für trockene Sommer', 'Wir pflanzen Stauden, Gräser und Gehölze, die Hitze und ein paar Wochen ohne Regen aushalten. Was jeden Abend Wasser braucht, setzen wir nur dorthin, wo der Schlauch gut hinkommt.'),
         ('Kies nur, wo er hingehört', 'Kies bekommt bei uns der Traufstreifen am Haus, sonst planen wir dichte Staudenbeete und Bodendecker. Die machen nach dem Anwachsen weniger Arbeit als Schotter, und die Insekten haben auch etwas davon.'),
         ('Planung auch ohne Bau', 'Viele Mainzer Kunden wollen einen Plan und bauen Teile selbst. Sie bekommen Zeichnung und Pflanzliste so, dass Sie damit weiterarbeiten können.')],
  ex_h='Vom Vorgarten bis zum Plan zum Selbstbauen.',
  examples=[('Mainz-Bretzenheim', 'Vorgarten neu', 'Kiesfläche raus, Staudenbeet mit Gräsern und ein schmaler Weg zur Haustür.'),
            ('Mainz-Laubenheim', 'Garten für Familien', 'Rasen zum Spielen, Beete am Rand, Sichtschutz aus Hecke statt Zaun.'),
            ('Mainz-Drais', 'Plan zum Selbstbauen', 'Gartenplan mit Pflanzliste, umgesetzt vom Eigentümer in zwei Etappen.'),
            ('Mainz-Gonsenheim', 'Abendlicht im Garten', 'Weg- und Baumleuchten, Kabel beim Umbau gleich mitverlegt.')],
  gallery=[('g-trittsteine.webp','Trittsteine durch ein blühendes Staudenbeet'),('g-buchs.webp','Buchskugeln über einer Mauer aus Feldsteinen'),('g-mauersteine.webp','Mauersteine mit Polsterstauden in den Fugen')],
  gal_h='Beete, die wenig Wasser brauchen.', gal_p='Dicht gepflanzte Stauden zwischen Steinen halten den Mainzer Sommer mit wenig Gießwasser aus, weil die Pflanzen den Boden beschatten.',
  ex_p='Manche wollen den ganzen Garten neu, manche nur einen Plan, mit dem sie selbst weitermachen.',
  steps_h='Erst der Plan, dann die Pflanzen.',
  steps_p='Nach jedem Schritt entscheiden Sie, wie es weitergeht.',
  cta_p='Erzählen Sie uns, wie Sie Ihren Garten nutzen wollen. Ein paar Fotos aus verschiedenen Ecken reichen für den Anfang.',
  steps=[('Bestand aufnehmen', 'Fotos, Maße und Ihre Wünsche: spielen, sitzen, ernten, wenig Pflege.'), ('Entwurf', 'Ein Plan mit Wegen, Beeten und Rasen, dazu eine Pflanzliste passend zu Sonne und Boden.'), ('Abstimmen', 'Sie gehen den Entwurf in Ruhe durch, wir ändern, was nicht passt.'), ('Umsetzen', 'Selbst, mit uns oder in Etappen, gepflanzt im Frühjahr oder Herbst.')], faq_h='Fragen zu Plan und Pflanzen.',
  faq=[('Was kostet eine Gartenplanung in Mainz?', 'Das hängt von Größe und Umfang ab, deshalb nennen wir den Preis nach einem kurzen Blick auf Fotos und Maße. Die Planung können Sie auch separat beauftragen und den Garten später selbst oder in Abschnitten umsetzen. Mit dem Gartenplaner auf der Startseite sehen Sie vorab eine Größenordnung für Material und Arbeit.'),
       ('Welche Pflanzen eignen sich für Mainzer Gärten?', 'Pflanzen, die Hitze und trockene Phasen vertragen: viele Stauden aus offenen, sonnigen Lebensräumen, Ziergräser und robuste Gehölze. Bewährt haben sich zum Beispiel Lavendel, Katzenminze, Steppensalbei, Fetthenne und Lampenputzergras. Welche genau, hängt von Sonne, Boden und Ihrem Pflegewunsch ab. Wir stellen die Liste so zusammen, dass vom Frühjahr bis in den Herbst etwas blüht.'),
       ('Ist ein Schottergarten pflegeleichter?', 'Meist nur im ersten Jahr. Danach wächst Unkraut zwischen den Steinen, und die Fläche heizt sich im Sommer stark auf. Ein dicht gepflanztes Staudenbeet braucht nach dem Anwachsen oft weniger Arbeit. Außerdem verlangt die Landesbauordnung Rheinland-Pfalz in § 10 Abs. 4 seit Dezember 2022, dass nicht überbaute Flächen bebauter Grundstücke begrünt werden, soweit sie nicht anders gebraucht werden. Was für Ihr Grundstück gilt, klären wir vor der Planung.'),
       ('Kann ich die Gartengestaltung von der Steuer absetzen?', 'Den Arbeitsanteil oft ja: Nach § 35a Abs. 3 EStG mindern 20 Prozent der Arbeits-, Fahrt- und Maschinenkosten die Einkommensteuer, höchstens 1.200 Euro pro Haushalt und Jahr, wenn Sie den Rechnungsbetrag überweisen. Die Pflanzen selbst zählen als Material und damit nicht. Wir weisen beides auf der Rechnung getrennt aus.'),
       ('Wann ist die beste Pflanzzeit?', 'Für die meisten Stauden und Gehölze das Frühjahr oder der Herbst. Im Herbst ist der Boden noch warm, und es regnet mehr. So wurzeln die Pflanzen vor dem Winter ein und brauchen im ersten Sommer weniger Wasser. Rollrasen verlegen wir bei mildem, feuchtem Wetter. Mit der Planung fangen Sie am besten einige Monate vorher an.')],
  cta_h='Wo steht bei Ihnen nachmittags die Sonne?'),
]

LEGAL_NOTE = '<p class="lp-note">Grünfuge ist ein fiktives Demo-Unternehmen. Alle Angaben auf dieser Seite sind Platzhalter und zeigen nur, wie {doc} aufgebaut ist. Für ein echtes Unternehmen müssen sie durch die tatsächlichen Daten ersetzt und rechtlich geprüft werden.</p>'

def legal(file, title, h1, inner, doc, meta=None):
    body = f'''<section class="lp-hero lp-legal"><div class="wrap"><nav class="crumbs" aria-label="Brotkrumen"><a href="index.html">Startseite</a> <span aria-hidden="true">/</span> <span>{h1}</span></nav><h1>{h1}</h1>{LEGAL_NOTE.format(doc=doc)}</div></section>
<section class="lp-sec"><div class="wrap lp-prose">{inner}</div></section>
{contact_block('Fragen? Schreiben Sie uns.')}'''
    return page(file, title, f'{meta or h1} von Grünfuge Garten- und Landschaftsbau (fiktives Demo-Unternehmen).', body)

IMPRESSUM = f'''<h2>Angaben gemäß § 5 DDG</h2>
<p>Grünfuge Garten- und Landschaftsbau (fiktiv)<br>Inhaber: Max Mustermann<br>Musterstraße 1<br>65185 Wiesbaden</p>
<h2>Kontakt</h2><p>Telefon: {PHONE}<br>E-Mail: {MAIL}</p>
<h2>Umsatzsteuer-ID</h2><p>Umsatzsteuer-Identifikationsnummer nach § 27a UStG: DE000000000 (Platzhalter)</p>
<h2>Kammer und Berufsbezeichnung</h2><p>Platzhalter: Falls der Betrieb einer Kammer angehört oder eine geschützte Berufsbezeichnung führt, stehen hier Kammer, Berufsbezeichnung und der Staat, in dem sie verliehen wurde.</p>
<h2>Verbraucherstreitbeilegung</h2><p>Platzhalter: Bei einem echten Betrieb steht hier, ob er bereit oder verpflichtet ist, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
<h2>Website</h2><p>Gestaltung und Umsetzung: <a href="https://marktic.fi">Marktic</a>, Finnland.</p>'''

DATENSCHUTZ = f'''<h2>Wer ist verantwortlich?</h2><p>Verantwortlich ist Grünfuge Garten- und Landschaftsbau (fiktiv), Inhaber Max Mustermann, Musterstraße 1, 65185 Wiesbaden, {MAIL}.</p>
<h2>Welche Daten diese Demo verarbeitet</h2><p>Diese Demo-Seite verwendet keine Cookies, kein Tracking und keine Analysewerkzeuge. Schriften und Bilder liegen auf demselben Server, es werden keine Inhalte von Drittanbietern nachgeladen.</p>
<h2>Kontaktformular und Postleitzahl-Check</h2><p>Was Sie in Formulare eintragen, wird auf dieser Demo-Seite nicht versendet. Es bleibt nur im lokalen Speicher Ihres Browsers, damit Sie sehen können, wie der Betrieb eine Anfrage erhält. Über „Eigene Anfragen löschen“ in der Beispielansicht entfernen Sie diese Daten wieder.</p>
<h2>Auf einer echten Website</h2><p>Bei einem echten Betrieb steht hier, wie Anfragen gespeichert werden, wie lange, auf welcher Rechtsgrundlage (in der Regel Art. 6 Abs. 1 lit. b DSGVO), welcher Hoster genutzt wird und welche Rechte Sie haben: Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Widerspruch, Datenübertragbarkeit und Beschwerde bei einer Aufsichtsbehörde.</p>'''

def clean(t):
    t = re.sub(r'(\d) ?[–—] ?(\d)', r'\1 bis \2', t)
    return re.sub(r'(\d) (€|%)', '\\1\u00a0\\2', t)

def write(name, t):
    t = clean(t)
    assert '—' not in t and '–' not in t, name
    open(os.path.join(ROOT, name), 'w', encoding='utf-8').write(t)


GUIDE_FAQ = [
 ('Was kostet ein Quadratmeter Pflaster mit Unterbau?', 'Bei uns 60 bis 170 Euro pro Quadratmeter inklusive Aushub, Unterbau, Material, Verlegung und 19 Prozent Mehrwertsteuer. Betonstein liegt meist bei 60 bis 95 Euro, Klinker bei 80 bis 125 Euro und Granit bei 110 bis 170 Euro. Für befahrbare Flächen kommen etwa 15 Prozent dazu, weil der Unterbau dicker wird.'),
 ('Warum ist eine Einfahrt teurer als ein Gartenweg?', 'Weil ein Auto den Boden ganz anders belastet als Fußgänger. Für eine Einfahrt heben wir je nach Boden 30 bis 50 Zentimeter aus und bauen eine Frostschutz- und Tragschicht in Lagen ein. Ein Gartenweg kommt mit deutlich weniger aus. Mehr Aushub, mehr Schotter und mehr Verdichten machen den Quadratmeter teurer.'),
 ('Was steht in vielen Angeboten nicht drin?', 'Häufig fehlen das Aufnehmen und Entsorgen von altem Pflaster oder Asphalt, eine Rinne vor der Garage, Randsteine oder ein Bodenaustausch, wenn der Untergrund nicht trägt. Fragen Sie auch nach der Aushubtiefe und der Dicke der Tragschicht. Zwei Angebote lassen sich nur vergleichen, wenn diese Punkte in beiden stehen.'),
 ('Kann ich Pflasterarbeiten von der Steuer absetzen?', 'Den Arbeitsanteil ja. Nach § 35a Abs. 3 EStG mindern 20 Prozent der Arbeits-, Fahrt- und Maschinenkosten die Einkommensteuer, höchstens 1.200 Euro pro Haushalt und Jahr für alle Handwerkerleistungen zusammen. Material zählt nicht, der Rechnungsbetrag muss überwiesen werden, und Arbeiten an einem Neubau bis zur Fertigstellung sind ausgeschlossen. Im Einzelfall entscheidet Ihr Finanzamt.'),
 ('Lohnt es sich, einen Teil selbst zu machen?', 'Manchmal. Wer alte Platten selbst aufnimmt oder Aushub auf dem eigenen Grundstück unterbringen kann, spart Arbeitsstunden und Entsorgung. Unterbau, Gefälle und Randsteine sollten aber aus einer Hand kommen, sonst ist bei Setzungen später niemand verantwortlich. Was Sie selbst machen, fällt außerdem aus dem Steuerbonus heraus.'),
]

def guide():
    rows = [('Aushub ca. 40 cm und Abfuhr', 18), ('Frostschutz- und Tragschicht, verdichtet', 24), ('Splittbett und Fugenmaterial', 5), ('Betonsteinpflaster (Material)', 22), ('Verlegen, Schneiden, Abrütteln', 22), ('Randsteine, auf die Fläche umgelegt', 6)]
    tot = sum(v for _, v in rows)
    de = lambda n: f'{n:,}'.replace(',', '.')
    trs = ''.join(f'<tr><td>{n}</td><td>{v} €</td><td>{de(v*40)} €</td></tr>' for n, v in rows)
    faq = ''.join(f'<details class="reveal"><summary>{q}</summary><div><p>{a}</p></div></details>' for q, a in GUIDE_FAQ)
    arb = round(tot * 40 * 0.45)
    body = f"""<section class="lp-hero lp-legal"><div class="wrap lp-hero-in">
  <nav class="crumbs" aria-label="Brotkrumen"><a href="index.html">Startseite</a> <span aria-hidden="true">/</span> <span>Was kostet Pflaster?</span></nav>
  <span class="eyebrow">Ratgeber · Pflaster</span>
  <h1>Was kostet Pflaster pro Quadratmeter?</h1>
  <p class="lp-lead">Mit Unterbau und Verlegung kostet Pflaster bei uns 60 bis 170 € pro m², je nach Stein und Belastung. Hier sehen Sie, woraus sich der Preis zusammensetzt, was eine Einfahrt teurer macht und worauf Sie beim Vergleichen von Angeboten achten sollten.</p>
  <p class="lp-meta">Grünfuge Garten- und Landschaftsbau · aktualisiert am <time datetime="{TODAY}">13.11.2026</time></p>
</div></section>

<section class="lp-sec"><div class="wrap lp-prose lp-article">
  <h2>Die Preise nach Stein.</h2>
  <p>Die Zahlen gelten für eine fertige Fläche, also mit Aushub, Unterbau, Material, Verlegung und 19 % MwSt. Befahrbare Flächen brauchen mehr Unterbau und kosten etwa 15 % mehr.</p>
  <div class="lp-table"><table>
    <thead><tr><th scope="col">Pflaster</th><th scope="col">Weg, Terrasse</th><th scope="col">Einfahrt, befahrbar</th></tr></thead>
    <tbody><tr><td>Betonstein</td><td>60 bis 95 € pro m²</td><td>70 bis 110 € pro m²</td></tr>
    <tr><td>Pflasterklinker</td><td>80 bis 125 € pro m²</td><td>90 bis 145 € pro m²</td></tr>
    <tr><td>Granit</td><td>110 bis 170 € pro m²</td><td>125 bis 195 € pro m²</td></tr></tbody>
  </table></div>
  <p>Zum Vergleich: Der <a href="https://www.commerzbank.de/portal/de/ratgeber/haus-wohnung/was-kosten-pflasterarbeiten.html">Ratgeber der Commerzbank</a> nennt für Pflasterarbeiten mit Vorarbeiten, Material und Arbeit 70 bis 210 € pro m² (Stand Januar 2025). Wie die Steine aussehen, zeigt der <a href="index.html#pflaster">Pflaster-Wähler</a> auf unserer Startseite mit echten Fotos.</p>

  <h2>Woraus sich der Preis zusammensetzt.</h2>
  <p>Ein Rechenbeispiel aus unserer Kalkulation: eine Einfahrt mit 40 m² aus grauem Betonstein, befahrbar, auf normal tragfähigem Boden und gut erreichbar für den Minibagger.</p>
  <div class="lp-table"><table>
    <thead><tr><th scope="col">Position</th><th scope="col">pro m²</th><th scope="col">40 m²</th></tr></thead>
    <tbody>{trs}</tbody>
    <tfoot><tr><th scope="row">Summe inkl. MwSt.</th><td>{tot} €</td><td>{tot*40:,} €</td></tr></tfoot>
  </table></div>
  <p>Der Stein selbst kostet hier nur 22 € pro m². Aushub, Tragschicht und Verdichten machen fast die Hälfte aus. Genau dort wird bei billigen Angeboten gespart, deshalb sacken manche Einfahrten nach ein paar Wintern ab.</p>

  <h2>Was den Preis nach oben treibt.</h2>
  <ul class="lp-list">
    <li><b>Hanglage.</b> Am Hang brauchen Einfahrten oft eine Rinne vor der Garage und manchmal eine kleine Stützmauer. Beides berechnen wir gesondert.</li>
    <li><b>Enger Zugang.</b> Passt kein Minibagger durch, wird mehr von Hand bewegt. Das kostet Stunden.</li>
    <li><b>Altbelag.</b> Altes Pflaster, Platten oder Asphalt müssen aufgenommen und entsorgt werden. Das steht als eigene Position im Angebot.</li>
    <li><b>Schlechter Boden.</b> Lehmiger oder aufgefüllter Boden trägt weniger. Dann wird tiefer ausgehoben oder Boden ausgetauscht.</li>
    <li><b>Kleine Flächen und viele Schnitte.</b> Rundungen, Diagonalverbände und viele Einbauten wie Schächte erhöhen den Aufwand pro m².</li>
  </ul>

  <h2>So vergleichen Sie zwei Angebote.</h2>
  <p>Legen Sie die Angebote nebeneinander und prüfen Sie, ob in beiden dieselben Punkte stehen:</p>
  <ul class="lp-list">
    <li>Wie tief wird ausgehoben, und wie dick ist die Frostschutz- und Tragschicht?</li>
    <li>Ist die Entsorgung von Aushub und Altbelag enthalten, und zu welchem Preis pro Kubikmeter?</li>
    <li>Sind Randsteine, Rinnen und Anschlüsse an Haus und Garage eingerechnet?</li>
    <li>Wohin läuft das Regenwasser, und mit wie viel Gefälle?</li>
    <li>Steht der Arbeitsanteil getrennt auf der Rechnung, damit Sie ihn bei der Steuer angeben können?</li>
  </ul>

  <h2>Was Sie von der Steuer zurückbekommen.</h2>
  <p>Für das Rechenbeispiel oben mit {tot*40:,} € nehmen wir einen Anteil von 45 % für Arbeit, Fahrt und Maschinen an. Das sind {arb:,} €. Davon mindern 20 % die Einkommensteuer, also rund {round(arb*0.2, -1):.0f} €. Der Bonus ist auf 1.200 € pro Haushalt und Jahr für alle Handwerkerleistungen zusammen begrenzt, und der Rechnungsbetrag muss überwiesen werden.</p>
</div></section>

<section class="faq lp-sec" aria-labelledby="faq-h">
  <div class="wrap faq-grid">
    <div class="reveal"><span class="eyebrow">Häufige Fragen</span><h2 id="faq-h">Fragen zu Pflasterkosten.</h2></div>
    <div class="faq-list">{faq}</div>
  </div>
</section>

<section class="lp-sec lp-more">
  <div class="wrap"><h2 class="lp-more-h">Passend dazu</h2><ul class="lp-chips"><li><a href="pflasterarbeiten-wiesbaden.html">Pflasterarbeiten Wiesbaden</a></li><li><a href="gartenbau-mainz.html">Gartenbau Mainz</a></li><li><a href="index.html#pflaster">Pflaster-Wähler</a></li></ul></div>
</section>

{contact_block('Was soll bei Ihnen gepflastert werden?', 'Schreiben Sie uns, wie groß die Fläche ist, ob sie befahren wird und welcher Stein Ihnen gefällt. Sie bekommen eine Preisspanne für Ihre Fläche und unsere Rückfragen per E-Mail.')}"""
    body = body.replace(',', '§C§')  # protect thousands formatting below
    body = re.sub(r'(\d)§C§(\d{3})', r'\1.\2', body).replace('§C§', ',')
    url = BASE + 'pflaster-kosten.html'
    graph = [
        {'@type': 'Article', '@id': url + '#artikel', 'headline': 'Was kostet Pflaster pro Quadratmeter?', 'datePublished': TODAY, 'dateModified': TODAY, 'inLanguage': 'de-DE',
         'author': {'@id': BASE + '#firma'}, 'publisher': {'@id': BASE + '#firma'}, 'image': BASE + 'img/og-gruenfuge.jpg', 'mainEntityOfPage': url},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Startseite', 'item': BASE},
            {'@type': 'ListItem', 'position': 2, 'name': 'Was kostet Pflaster?', 'item': url}]},
        {'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in GUIDE_FAQ]},
    ]
    return page('pflaster-kosten.html', 'Was kostet Pflaster pro m²? Preise 2026 | Grünfuge',
                'Pflaster kostet mit Unterbau 60 bis 170 € pro m². Rechenbeispiel für eine Einfahrt, was den Preis treibt und wie Sie Angebote vergleichen.',
                body, graph, battrs=' data-page="Ratgeber Pflasterkosten" data-job="Pflaster oder Einfahrt"')

def main():
    for d in PAGES:
        write(d['file'], landing(d))
    write('impressum.html', legal('impressum.html', 'Impressum | Grünfuge Garten- und Landschaftsbau', 'Impressum', IMPRESSUM, 'ein Impressum'))
    write('datenschutz.html', legal('datenschutz.html', 'Datenschutz | Grünfuge Garten- und Landschaftsbau', 'Datenschutz', DATENSCHUTZ, 'eine Datenschutzerklärung', meta='Datenschutzerklärung'))
    nf = '''<section class="lp-hero lp-legal"><div class="wrap"><span class="eyebrow">Fehler 404</span><h1>Diese Seite gibt es nicht.</h1><p class="lp-lead">Vielleicht hilft einer dieser Wege weiter.</p><div class="lp-btns"><a class="btn btn-moss" href="index.html">Zur Startseite</a><a class="btn btn-ghost" href="index.html#planer">Gartenplaner</a></div></div></section>'''
    write('pflaster-kosten.html', guide())
    write('404.html', page('404.html', 'Seite nicht gefunden | Grünfuge', 'Diese Seite gibt es nicht.', nf, canonical=False))
    urls = ['', *[f for f, _ in LANDINGS], 'pflaster-kosten.html', 'impressum.html', 'datenschutz.html']
    write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{BASE}{u}</loc><lastmod>{TODAY}</lastmod></url>\n' for u in urls) + '</urlset>\n')
    bots = ['OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'PerplexityBot', 'ClaudeBot', 'Claude-SearchBot', 'Google-Extended', 'Applebot-Extended']
    write('robots.txt', 'User-agent: *\nAllow: /\n\n' + ''.join(f'User-agent: {b}\nAllow: /\n\n' for b in bots) + f'Sitemap: {BASE}sitemap.xml\n')
    llms = f'''# Grünfuge Garten- und Landschaftsbau (fiktives Demo-Unternehmen)

> Garten- und Landschaftsbau in Wiesbaden, Mainz und Umgebung: Pflasterarbeiten, Terrassen, Mauern, Bepflanzung und Gartenbeleuchtung. Demo-Website von Marktic.

## Leistungen und Richtpreise (inkl. 19 % MwSt.)
- Pflaster mit Unterbau: 60–170 € pro m² (Betonstein 60–95, Klinker 80–125, Granit 110–170), befahrbare Flächen etwa 15 % mehr
- Terrassen: 150–280 € pro m²
- Rollrasen: 15–30 € pro m²
- Staudenbeete: 40–90 € pro m²
- Natursteinmauern bis etwa 80 cm Höhe: 250–450 € pro laufendem Meter

## Seiten
- [Gartenbau Wiesbaden]({BASE})
''' + ''.join(f'- [{n}]({BASE}{f})\n' for f, n in LANDINGS) + f'''
## Ratgeber
- [Was kostet Pflaster pro Quadratmeter?]({BASE}pflaster-kosten.html)

## Kontakt
- Telefon: {PHONE}
- E-Mail: {MAIL}
'''
    write('llms.txt', llms)
    print('ok')

if __name__ == '__main__':
    main()
