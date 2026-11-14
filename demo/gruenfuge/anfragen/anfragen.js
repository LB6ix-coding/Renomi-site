(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const KEY = "gruenfuge-demo-anfragen-v1", NB = "\u00a0", H = 36e5;
  const ST = [["neu", "Neu"], ["angerufen", "Angerufen"], ["angebot", "Angebot verschickt"], ["auftrag", "Beauftragt"], ["nein", "Kein Auftrag"]];
  const SN = Object.fromEntries(ST);
  const now = Date.now();
  const SEED = [
    { id: "s1", t: now - 3 * H, name: "Jens M.", phone: "0151 0000001", pn: "65193", kunta: "Wiesbaden", inArea: true, jobs: ["Pflaster oder Einfahrt"], msg: "Einfahrt ca. 55 m², der alte Asphalt ist gerissen. Am liebsten vor dem Frühjahr.", src: "PLZ-Check", status: "neu" },
    { id: "s2", t: now - 7 * H, name: "Claudia B.", phone: "0151 0000002", pn: "55124", kunta: "Mainz", inArea: true, jobs: ["Gartenbeleuchtung"], msg: "", src: "PLZ-Check", status: "neu" },
    { id: "s3", t: now - 26 * H, name: "Stefan K.", phone: "0151 0000003", email: "stefan@example.com", pn: "65191", kunta: "Wiesbaden", inArea: true, jobs: ["Pflaster oder Einfahrt"], msg: "Pflaster: Klinker rot, Fischgrätverband diagonal, ca. 40 m², befahrbar. Richtpreis 3.700 bis 5.500 €.", src: "Pflaster-Wähler", status: "angerufen", note: "Vor-Ort-Termin Donnerstag 16 Uhr." },
    { id: "s4", t: now - 50 * H, name: "Andrea W.", phone: "0151 0000004", pn: "60311", kunta: "Frankfurt am Main", inArea: false, jobs: ["Neuer Garten"], msg: "Neubau, im Garten ist noch gar nichts gemacht.", src: "PLZ-Check", status: "nein", note: "Außerhalb des Einsatzgebiets, telefonisch abgesagt." },
    { id: "s5", t: now - 98 * H, name: "Markus F.", phone: "0151 0000005", email: "markus@example.com", pn: "55129", kunta: "Mainz", inArea: true, jobs: ["Pflaster oder Einfahrt"], msg: "Hof und Stellplätze einer Wohnanlage neu pflastern. Die Eigentümerversammlung entscheidet im Frühjahr.", src: "Kontaktformular", status: "angebot", est: 14800 },
    { id: "s6", t: now - 146 * H, name: "Petra S.", phone: "0151 0000006", pn: "65232", kunta: "Taunusstein", inArea: true, jobs: ["Neuer Garten"], msg: "Entwurf aus dem Gartenplaner: Rollrasen 42 m², Pflaster 18 m², Beet 14 m². Richtpreis 2.300 bis 5.600 €.", src: "Gartenplaner", status: "angebot", est: 4800 },
    { id: "s7", t: now - 220 * H, name: "Thomas L.", phone: "0151 0000007", pn: "65189", kunta: "Wiesbaden", inArea: true, jobs: ["Mauer oder Treppe"], msg: "Natursteinmauer und Blockstufen am Hang.", src: "Kontaktformular", status: "auftrag", est: 9600, note: "Baubeginn im Mai." }
  ];
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || { own: [], edits: {} };
    } catch (e) {
      return { own: [], edits: {} };
    }
  };
  const write = (s) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) {
    }
  };
  let S = read();
  S.own = S.own || [];
  S.edits = S.edits || {};
  const esc = (v) => String(v != null ? v : "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const eur = (n) => n ? Math.round(n).toLocaleString("de-DE") + NB + "€" : "0" + NB + "€";
  const pad = (n) => String(n).padStart(2, "0");
  const clock = (d) => `${d.getHours()}:${pad(d.getMinutes())}`;
  const when = (t) => {
    const d = new Date(t), diff = Date.now() - t, today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    if (diff < 6e4) return "gerade eben";
    if (diff < H) return `vor ${Math.floor(diff / 6e4)}${NB}Min.`;
    if (t >= today.getTime()) return `vor ${Math.floor(diff / H)}${NB}Std.`;
    if (t >= today.getTime() - 864e5) return `gestern ${clock(d)} Uhr`;
    return `${d.getDate()}.${d.getMonth() + 1}.`;
  };
  const stamp = (t) => {
    const d = new Date(t);
    return `${d.getDate()}.${d.getMonth() + 1}., ${clock(d)} Uhr`;
  };
  const all = () => [...S.own, ...SEED].map((l) => ({ ...l, ...S.edits[l.id] || {} })).sort((a, b) => b.t - a.t);
  const fresh = new URLSearchParams(location.search).get("neu");
  let filter = "alle", q = "", sel = fresh || null;
  const list = $("#lista"), det = $("#detail"), fl = $("#filters"), toast = $("#toast");
  let tt = 0;
  const say = (m) => {
    toast.textContent = m;
    toast.hidden = false;
    clearTimeout(tt);
    tt = setTimeout(() => toast.hidden = true, 2600);
  };
  function kpis(L) {
    const wk = Date.now() - 7 * 24 * H, known = L.filter((l) => l.inArea !== null && l.inArea !== void 0);
    $("#k-new").textContent = L.filter((l) => l.status === "neu").length;
    $("#k-week").textContent = L.filter((l) => l.t >= wk).length;
    $("#k-area").textContent = (known.length ? Math.round(100 * known.filter((l) => l.inArea).length / known.length) : 0) + NB + "%";
    $("#k-open").textContent = eur(L.filter((l) => l.status === "angebot").reduce((a, l) => a + (+l.est || 0), 0));
    $("#k-won").textContent = "Beauftragt: " + eur(L.filter((l) => l.status === "auftrag").reduce((a, l) => a + (+l.est || 0), 0));
  }
  function filters(L) {
    const n = (k) => k === "alle" ? L.length : L.filter((l) => l.status === k).length;
    fl.innerHTML = [["alle", "Alle"], ...ST].map(([k, v]) => `<button type="button" role="tab" data-f="${k}" aria-selected="${k === filter}">${v}<i>${n(k)}</i></button>`).join("");
  }
  function row(l) {
    const sub = [l.pn && `${l.pn} ${l.kunta}`, l.jobs && l.jobs.join(", ")].filter(Boolean).join(" · ") || l.src;
    const b = [
      l.own ? '<span class="b own">Ihre Anfrage</span>' : "",
      l.status === "neu" ? '<span class="b new">Neu</span>' : "",
      l.inArea === false ? '<span class="b out">Außerhalb</span>' : "",
      `<span class="b">${esc(l.src)}</span>`
    ].join("");
    return `<li><button type="button" class="lead${l.id === fresh ? " fresh" : ""}" data-id="${l.id}" style="--s:var(--s-${l.status})" aria-current="${l.id === sel}">
      <span class="dot" aria-hidden="true"></span><span class="nm">${esc(l.name)}</span><span class="tm">${when(l.t)}</span>
      <span class="sub">${esc(sub)}</span><span class="badges">${b}</span><span class="sr-only">, Status ${SN[l.status]}</span></button></li>`;
  }
  function render() {
    const L = all();
    kpis(L);
    filters(L);
    const qq = q.trim().toLowerCase();
    const shown = L.filter((l) => (filter === "alle" || l.status === filter) && (!qq || [l.name, l.pn, l.kunta, (l.jobs || []).join(" "), l.msg].join(" ").toLowerCase().includes(qq)));
    list.innerHTML = shown.map(row).join("") || '<li class="empty">Keine Anfragen mit diesem Filter.</li>';
    if (!sel || !L.find((l) => l.id === sel)) sel = (shown[0] || L[0] || {}).id;
    detail(L.find((l) => l.id === sel));
  }
  const ICON = {
    tel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    sms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>'
  };
  function detail(l) {
    if (!l) {
      det.innerHTML = '<p class="d-empty">Wählen Sie eine Anfrage aus der Liste.</p>';
      return;
    }
    const tel = String(l.phone || "").replace(/[^\d+]/g, "");
    const log = [`<li><time>${stamp(l.t)}</time>Über die Website: ${esc(l.src)}</li>`, ...(l.log || []).map((x) => `<li><time>${stamp(x[0])}</time>${esc(x[1])}</li>`)];
    det.innerHTML = `
      <div class="d-head"><div><h2 id="d-h" tabindex="-1">${esc(l.name)}</h2>
        <p class="d-where">${l.pn ? `${esc(l.pn)} ${esc(l.kunta)}` : "Keine PLZ"} ${l.inArea === false ? '<span class="b out">Außerhalb</span>' : l.inArea ? '<span class="b">Im Einsatzgebiet</span>' : ""} ${l.own ? '<span class="b own">Ihre Anfrage</span>' : ""}</p></div>
        <button type="button" class="d-close" aria-label="Zurück zur Liste"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      <div class="status" role="group" aria-label="Status">${ST.map(([k, v]) => `<button type="button" data-s="${k}" style="--s:var(--s-${k})" aria-pressed="${l.status === k}">${v}</button>`).join("")}</div>
      <div class="actions">
        <a class="act main" data-act="tel" href="tel:${tel}">${ICON.tel}Anrufen ${esc(l.phone)}</a>
        <a class="act" data-act="sms" href="sms:${tel}">${ICON.sms}SMS</a>
        ${l.email ? `<a class="act" data-act="mail" href="mailto:${esc(l.email)}">${ICON.mail}E-Mail</a>` : ""}
        ${l.pn ? `<a class="act" href="https://www.google.com/maps/search/${encodeURIComponent(l.pn + " " + l.kunta)}" target="_blank" rel="noopener">${ICON.map}Karte</a>` : ""}
      </div>
      <dl class="facts">
        <div><dt>Leistung</dt><dd>${esc((l.jobs || []).join(", ") || "Nicht gewählt")}</dd></div>
        <div><dt>Eingang</dt><dd>${stamp(l.t)}</dd></div>
        <div class="wide"><dt>Nachricht</dt><dd class="msg">${esc(l.msg) || "Keine Nachricht."}</dd></div>
      </dl>
      <div class="d-row">
        <div><label for="d-est">Auftragswert</label><div class="eur"><input id="d-est" inputmode="numeric" value="${l.est ? Math.round(l.est) : ""}" placeholder="0"></div></div>
        <div><label for="d-note">Notizen <span class="saved" id="d-saved">Gespeichert</span></label><textarea id="d-note" placeholder="z. B. Vor-Ort-Termin vereinbart">${esc(l.note || "")}</textarea></div>
      </div>
      <ol class="log" aria-label="Verlauf">${log.join("")}</ol>`;
  }
  function edit(id, patch, logText) {
    const e = S.edits[id] = { ...S.edits[id] || {}, ...patch };
    if (logText) e.log = [...e.log || [], [Date.now(), logText]];
    write(S);
  }
  fl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]");
    if (!b) return;
    filter = b.dataset.f;
    render();
  });
  $("#q").addEventListener("input", (e) => {
    q = e.target.value;
    render();
  });
  const mobile = matchMedia("(max-width:1000px)");
  list.addEventListener("click", (e) => {
    const b = e.target.closest(".lead");
    if (!b) return;
    sel = b.dataset.id;
    render();
    if (mobile.matches) {
      det.classList.add("open");
      document.body.classList.add("sheet");
      setTimeout(() => {
        const h = $("#d-h");
        if (h) h.focus({ preventScroll: true });
      }, 320);
    } else {
      const h = $("#d-h");
      if (h) h.focus({ preventScroll: true });
    }
  });
  det.addEventListener("click", (e) => {
    if (e.target.closest(".d-close")) {
      det.classList.remove("open");
      document.body.classList.remove("sheet");
      {
        const it = list.querySelector(`[data-id="${sel}"]`);
        if (it) it.focus();
      }
      return;
    }
    const s = e.target.closest("[data-s]");
    if (s) {
      const l = all().find((x) => x.id === sel);
      if (l && l.status !== s.dataset.s) {
        edit(sel, { status: s.dataset.s }, `Status: ${SN[l.status]} → ${SN[s.dataset.s]}`);
        render();
      }
      return;
    }
    const a = e.target.closest("[data-act]");
    if (a && sel && sel[0] === "s") {
      e.preventDefault();
      say("Beispielanfrage: Nummer und Adresse sind erfunden.");
    }
  });
  let nt = 0;
  det.addEventListener("input", (e) => {
    if (e.target.id === "d-note") {
      clearTimeout(nt);
      nt = setTimeout(() => {
        edit(sel, { note: e.target.value });
        const s = $("#d-saved");
        s.classList.add("on");
        setTimeout(() => s.classList.remove("on"), 1200);
      }, 400);
    }
    if (e.target.id === "d-est") {
      const v = e.target.value.replace(/\D/g, "");
      e.target.value = v;
      edit(sel, { est: v ? +v : null });
      kpis(all());
    }
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && det.classList.contains("open")) det.querySelector(".d-close").click();
  });
  $("#reset").addEventListener("click", () => {
    S = { own: [], edits: {} };
    write(S);
    sel = null;
    render();
    say("Eigene Anfragen und Änderungen in diesem Browser gelöscht.");
  });
  render();
  if (fresh && mobile.matches && all().find((l) => l.id === fresh)) {
    det.classList.add("open");
    document.body.classList.add("sheet");
  }
})();
