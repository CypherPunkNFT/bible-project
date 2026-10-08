// Shared pieces for the three apostle directions: data loading, verse references, evidence labels, the tooltip, the
// reading sheet, section heads, and small canvas/resize helpers. Every direction reads the current apostle from D.
(() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  window.esc = esc;
  window.REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.WHO = ["peter", "paul", "thaddaeus"];
  window.WHO_NAME = { peter: "Peter", paul: "Paul", thaddaeus: "Thaddaeus" };

  // ── Data: one JSON per apostle, cached; books for references ──
  const cache = {};
  let BOOKS = {};
  const getJSON = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(`${url}: expected 200, got ${r.status}`); return r.json(); };
  window.loadBooks = async () => { const b = await getJSON("data/books.json"); BOOKS = Object.fromEntries(b.map(([num, code, name]) => [num, { code, name }])); };
  window.loadApostle = (who) => (cache[who] ??= getJSON(`data/${who}.json`).then(prepare));
  function prepare(d) {
    d.byKey = Object.fromEntries(d.entries.map((e) => [e.key, e]));
    d.rowByKey = Object.fromEntries(d.rows.map((r) => [r.key, r]));
    d.scripture = d.entries.filter((e) => e.type !== "trad");
    d.trad = d.entries.filter((e) => e.type === "trad");
    return d;
  }

  // ── References ──
  const parts = (id) => ({ book: Math.floor(id / 1e6), ch: Math.floor((id % 1e6) / 1e3), v: id % 1e3 });
  window.bookName = (num) => BOOKS[num]?.name ?? `Book ${num}`;
  window.bookCode = (num) => BOOKS[num]?.code ?? "";
  window.refText = ([a, b = a]) => {
    const x = parts(a), y = parts(b), name = bookName(x.book);
    if (a === b) return `${name} ${x.ch}:${x.v}`;
    if (x.book !== y.book) return `${name} ${x.ch}:${x.v} – ${bookName(y.book)} ${y.ch}:${y.v}`;
    return x.ch === y.ch ? `${name} ${x.ch}:${x.v}–${y.v}` : `${name} ${x.ch}:${x.v}–${y.ch}:${y.v}`;
  };
  window.verseRef = (id) => refText([id, id]);
  window.refHref = ([a]) => { const x = parts(a); return `/read/kjv/${bookCode(x.book)}/${x.ch}?v=${x.v}`; };
  window.refLink = (r) => `<a class="ref" href="${refHref(r)}">${esc(refText(r))}</a>`;
  window.refList = (refs = [], max = 4) => refs.slice(0, max).map(refLink).join('<span class="ref-sep">·</span>') + (refs.length > max ? `<span class="ref-sep">·</span><span class="muted">+${refs.length - max}</span>` : "");
  window.vtext = (id) => D.verses[id] ?? "";
  window.personHref = (id) => (id ? `/people/${id}` : "#");
  window.chapterOf = (id) => parts(id);

  // ── Evidence labels ──
  window.LAYER = { scripture: "Scripture", text: "From the text", "early-church": "Early church", tradition: "Later tradition", scholars: "Scholars", story: "This site, from Scripture" };
  window.layerChip = (layer) => `<span class="layer" data-layer="${esc(layer)}">${esc(LAYER[layer] ?? layer)}</span>`;
  window.citeText = (ids = []) => ids.map((id) => D.citations.find((c) => c.id === id)).filter(Boolean)
    .map((c) => `<a class="cite" href="${esc(c.url ?? "#")}" title="${esc(c.title)}">${esc(c.author.split(",")[0])}${c.year ? `, ${esc(c.year)}` : ""}</a>`).join('<span class="ref-sep">·</span>');
  window.claimFoot = (c) => `<p class="foot">${layerChip(c.layer ?? "scripture")}${c.who ? `<span class="who">${esc(c.who)}${c.when ? `, ${esc(c.when)}` : ""}</span>` : ""}${c.refs?.length ? `<span>${refList(c.refs)}</span>` : ""}${c.cites?.length ? `<span>${citeText(c.cites)}</span>` : ""}</p>`;
  // A short year label from a tradition record's "when" ("about AD 170, writing to…" → "c. 170").
  window.whenShort = (when = "") => {
    const m = when.match(/(about|early|first half of the|latter half of the)?\s*(?:AD\s*)?(\d{2,4})(?:[–-]\d+)?(?:(?:st|nd|rd|th) century)?/i);
    if (/(\d)(st|nd|rd|th) century/.test(when)) { const c = when.match(/(\w+ )?(\d)(st|nd|rd|th) century/); return `${c[1] && /early|late/i.test(c[1]) ? c[1].trim() + " " : ""}${c[2]}${c[3]} c.`; }
    return m ? `${m[1] ? "c. " : ""}${m[2]}` : "date unknown";
  };
  window.whoShort = (who = "") => who.split(/,|\(/)[0].replace(/^The /, "").trim();

  // ── Highlighting his names inside a verse ──
  // Other men who share the name are left unmarked (Judas Iscariot, Simon Zelotes, Simon the tanner and the like).
  const OTHERS = "(?![ ,]+(?:Iscariot|Zelotes|the Canaanite|a tanner|the tanner|the leper|of Cyrene|the sorcerer|which also betrayed))";
  window.markNames = (text, names = D.names) => esc(text).replace(new RegExp(`\\b(${names.map((n) => n.replace(/[-]/g, "\\-")).join("|")})\\b${OTHERS}`, "g"), "<mark>$1</mark>");

  // ── Section head: number, kicker, title with one italic word, one plain line ──
  window.secHead = (num, kicker, title, sub) => `<header class="sec-head"><span class="sec-num">${num}</span><div>
    <p class="kicker">${kicker}</p><h2>${title}</h2>${sub ? `<p class="sub">${sub}</p>` : ""}</div></header>`;

  // ── Tooltip ──
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.setAttribute("role", "status");
  let tipW = 0, tipH = 0;
  window.Tip = {
    show(html, x, y) {
      if (!tip.isConnected) document.body.append(tip);
      if (tip.dataset.html !== html) { tip.innerHTML = html; tip.dataset.html = html; tipW = tip.offsetWidth; tipH = tip.offsetHeight; }
      const left = x + 16 + tipW > innerWidth - 8 ? x - 16 - tipW : x + 16;
      const top = Math.min(innerHeight - tipH - 8, Math.max(8, y + 14));
      tip.style.transform = `translate(${Math.max(8, left)}px, ${top}px)`;
      tip.classList.add("show");
    },
    hide() { tip.classList.remove("show"); },
  };

  // ── Reading sheet: slides up from the bottom with the full detail of anything ──
  let sheet;
  window.Sheet = {
    open(html, tone = "var(--accent)") {
      if (!sheet) {
        sheet = document.createElement("div");
        sheet.className = "sheet";
        sheet.innerHTML = `<div class="sheet-scrim" data-close></div><div class="sheet-card" role="dialog" aria-modal="true"><button type="button" class="round sheet-x" data-close aria-label="Close">${icon("x", 16)}</button><div class="sheet-body"></div></div>`;
        document.body.append(sheet);
        sheet.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) Sheet.close(); });
        addEventListener("keydown", (e) => { if (e.key === "Escape") Sheet.close(); });
      }
      const body = sheet.querySelector(".sheet-body");
      body.innerHTML = html; body.scrollTop = 0;
      sheet.style.setProperty("--tone", tone);
      Tip.hide();
      requestAnimationFrame(() => sheet.classList.add("open"));
    },
    close() { sheet?.classList.remove("open"); },
  };

  // The full detail of one entry (moment, act, fact or tradition), for the sheet.
  window.entrySheet = (e) => {
    const P = D.periods[e.period - 1];
    const verses = e.refs.flatMap(([a, b = a]) => Object.keys(D.verses).map(Number).filter((v) => v >= a && v <= b).sort((x, y) => x - y)).slice(0, 14);
    const named = Object.entries(e.with ?? {}).map(([k, vs]) => `<li><b>${esc(D.rowByKey[k]?.name ?? k)}</b> ${e.writer === k ? "<span class=\"muted\">writes it himself</span> " : ""}${vs.map((v) => refLink([v, v])).join(" ")}</li>`).join("");
    return `<p class="kicker">${P.n} · ${esc(P.title)}${e.h ? ` · harmony §${esc(e.h.n)}` : ""}</p><h3 class="sheet-title">${esc(e.title)}</h3>
      ${e.text && e.text !== e.title ? `<p class="sheet-lede">${esc(e.text)}</p>` : ""}
      ${verses.length ? `<div class="kjv">${verses.map((v) => `<p><sup>${chapterOf(v).ch}:${chapterOf(v).v}</sup> ${markNames(vtext(v))}</p>`).join("")}</div>` : ""}
      ${claimFoot(e)}
      ${named ? `<h4 class="sheet-h">Also named in these verses</h4><ul class="named">${named}</ul>` : ""}`;
  };

  // ── Small helpers ──
  window.sizeCanvas = (canvas, width, height) => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return ctx;
  };
  window.onResize = (el, fn) => {
    let lastWidth = 0, pending = 0;
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width);
      if (w === lastWidth) return;
      lastWidth = w; cancelAnimationFrame(pending); pending = requestAnimationFrame(() => fn(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  };
  window.plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
  window.ROMAN = ["", "I", "II", "III", "IV"];
  window.PERIOD_TONE = ["", "var(--history)", "var(--gospels)", "var(--acts)", "var(--muted)"];
  window.DIRECTIONS = {};
})();
