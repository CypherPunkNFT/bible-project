// The copies behind a passage, from the open records: every dated record holding the book, one dot each, on lanes by
// kind from AD 1 to 1700. The study's own witnesses are ringed and named. Pointing at a dot names it on the line below;
// choosing it opens its record sheet. Also a per-century strip and a chapter grid for the same book.
(() => {
  const { byId, mid, yearText } = MSX;
  const FAMILIES = [
    { key: "papyrus", label: "Papyri", kinds: ["papyrus"], h: 40, tone: "--history" },
    { key: "majuscule", label: "Majuscules", kinds: ["majuscule"], h: 64, tone: "--prophets" },
    { key: "minuscule", label: "Minuscules", kinds: ["minuscule"], h: 120, tone: "--gospels" },
    { key: "version", label: "Early translations", kinds: ["latin", "syriac", "coptic", "gothic", "armenian", "georgian", "geez", "slavonic", "arabic"], h: 64, tone: "--poetry" },
  ];
  const familyOf = (k) => FAMILIES.find((f) => f.kinds.includes(k));
  const X0 = 0, X1 = 1700;
  const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };
  const recordsFor = (book) => MS.records.filter((r) => r.b?.includes(book));
  const describe = (r) => `<b>${esc(r.n)}</b>${r.g && !r.n.includes(r.g) ? ` (${esc(r.g)})` : ""} · ${esc(r.d)} · ${esc(KIND[r.k].label.replace(/s$/, ""))}${r.c ? ` · “${esc(r.c)}”` : ""}${MSX.holderText(r) ? ` · ${esc(MSX.holderText(r))}` : ""}`;

  function lane(el, { book, keys = [], note = "" }) {
    const all = recordsFor(book), dated = all.filter((r) => "e" in r);
    const state = { hidden: new Set(), only: null, hover: null };
    el.classList.add("ln");
    el.innerHTML = `<div class="ln-kinds" role="group" aria-label="Show kinds of copy"></div>
      <div class="ln-stage"><svg class="ln-svg" role="img"></svg><div class="ln-labels"></div></div>
      <div class="ln-say ms-say" aria-live="polite"></div>`;
    const svg = el.querySelector(".ln-svg"), labels = el.querySelector(".ln-labels"), say = el.querySelector(".ln-say");
    const base = `Each dot is one of ${formatNumber(dated.length)} dated open records holding ${esc(MS.books[book].name)}${all.length > dated.length ? ` (${all.length - dated.length} more carry no date)` : ""}. Point at one; choose it to open its record.${note ? ` ${note}` : ""}`;
    let dots = [];

    function kinds() {
      el.querySelector(".ln-kinds").innerHTML = FAMILIES.map((f) => {
        const n = all.filter((r) => f.kinds.includes(r.k)).length;
        return `<button type="button" data-fam="${f.key}" aria-pressed="${!state.hidden.has(f.key)}" style="--tone: var(${f.tone})"${n ? "" : " disabled"}><i></i><b>${formatNumber(n)}</b><span>${f.label}</span></button>`;
      }).join("");
    }
    function draw() {
      const W = el.querySelector(".ln-stage").clientWidth || 800, left = W < 560 ? 8 : 112, right = 12, top = 44;
      const fams = FAMILIES.filter((f) => !state.hidden.has(f.key));
      const scale = W < 560 ? 0.7 : 1;
      let y = top; const rowY = {};
      for (const f of fams) { rowY[f.key] = [y, f.h * scale]; y += f.h * scale + 10; }
      const H = y + 24, sx = (yr) => left + ((Math.min(X1, Math.max(X0, yr)) - X0) / (X1 - X0)) * (W - left - right);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("width", W); svg.setAttribute("height", H);
      svg.setAttribute("aria-label", `${dated.length} dated copies of ${MS.books[book].name} from the open records, by kind, AD 1 to 1700.`);
      const [w0, w1] = MS.written[String(book)];
      const out = [`<rect class="ln-written" x="${sx(w0)}" y="${top - 18}" width="${Math.max(3, sx(w1) - sx(w0))}" height="${H - top - 6}"/><text class="ln-wlabel" x="${sx(w1) + 5}" y="${H - 24}">written c. ${w0}–${w1} (approx.)</text>`];
      for (let c = 100; c <= X1; c += 100) out.push(`<path class="ln-grid" d="M${sx(c)} ${top - 4}V${H - 20}"/>${c % (W < 560 ? 400 : 200) === 0 ? `<text class="ln-tick" x="${sx(c)}" y="${H - 6}">${c}</text>` : ""}`);
      for (const f of fams) { const [ry, rh] = rowY[f.key]; out.push(`<path class="ln-row" d="M${left} ${ry + rh}H${W - right}"/>${W >= 560 ? `<text class="ln-rlabel" x="0" y="${ry + rh / 2 + 4}">${f.label}</text>` : `<text class="ln-rlabel is-small" x="${left}" y="${ry + 10}">${f.label}</text>`}`); }
      dots = [];
      for (const r of dated) {
        const f = familyOf(r.k); if (!f || !rowY[f.key]) continue;
        const [ry, rh] = rowY[f.key];
        dots.push({ r, x: sx(mid(r)), y: ry + 5 + hash(r.i) * (rh - 10), f, key: keys.find((k) => k.rec === r.i) });
      }
      out.push(dots.map((d) => `<circle class="ln-dot${d.key ? " is-key" : ""}${state.only && !state.only.has(d.r.i) ? " is-dim" : ""}${state.only?.has(d.r.i) ? " is-picked" : ""}" cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${d.key ? 5 : 2.6}" style="--tone: var(${d.f.tone})"/>`).join(""));
      out.push(`<circle class="ln-hover" r="8" cx="-20" cy="-20"/>`);
      svg.innerHTML = out.join("");
      labels.innerHTML = dots.filter((d) => d.key).map((d, i) => `<button type="button" class="ln-key" data-open="${d.r.i}" style="left:${d.x}px;top:${d.y}px;--lift:${18 + (i % 2) * 16}px"><span>${esc(d.key.label)}</span>${d.key.reading ? `<em${d.key.greek ? ' lang="grc"' : ""}>${esc(d.key.reading)}</em>` : ""}</button>`).join("");
    }
    function nearest(px, py) {
      let best = null, bd = 196;
      for (const d of dots) { const dd = (d.x - px) ** 2 + (d.y - py) ** 2; if (dd < bd) { bd = dd; best = d; } }
      return best;
    }
    svg.addEventListener("pointermove", (e) => {
      const b = svg.getBoundingClientRect(), d = nearest(e.clientX - b.left, e.clientY - b.top), ring = svg.querySelector(".ln-hover");
      state.hover = d;
      ring.classList.toggle("is-on", !!d);
      if (!d) { say.innerHTML = base; svg.style.cursor = ""; return; }
      ring.setAttribute("cx", d.x); ring.setAttribute("cy", d.y); svg.style.cursor = "pointer";
      say.innerHTML = `${describe(d.r)} <span class="ms-say-go">Open the record</span>`;
    });
    svg.addEventListener("pointerleave", () => { svg.querySelector(".ln-hover")?.classList.remove("is-on"); state.hover = null; say.innerHTML = base; });
    svg.addEventListener("click", (e) => { if (state.hover) { e.stopPropagation(); Sheet.open(state.hover.r.i, svg); } });
    labels.addEventListener("pointerover", (e) => { const b = e.target.closest("[data-open]"); if (b) say.innerHTML = `${describe(byId.get(b.dataset.open))} <span class="ms-say-go">Open the record</span>`; });
    el.querySelector(".ln-kinds").addEventListener("click", (e) => {
      const b = e.target.closest("[data-fam]"); if (!b) return;
      const k = b.dataset.fam;
      if (state.hidden.has(k)) state.hidden.delete(k); else if (state.hidden.size < FAMILIES.length - 1) state.hidden.add(k);
      kinds(); draw();
    });
    new ResizeObserver(() => draw()).observe(el.querySelector(".ln-stage"));
    kinds(); draw(); say.innerHTML = base;
    return {
      only(ids, text) { state.only = ids; draw(); say.innerHTML = text ?? base; },
    };
  }

  // A quiet strip: how many dated open records of the book survive from each century; the study's witnesses ticked.
  function strip(el, { book, keys = [] }) {
    const dated = recordsFor(book).filter((r) => "e" in r && r.l - r.e <= 200);
    const buckets = new Map();
    for (const r of dated) { const c = Math.max(0, Math.floor((mid(r) - 1) / 100)); buckets.set(c, (buckets.get(c) ?? 0) + 1); }
    const max = Math.max(...buckets.values()), cents = Array.from({ length: 16 }, (_, i) => i + 1);
    el.classList.add("st");
    el.innerHTML = `<div class="st-bars" role="group" aria-label="Dated copies of ${esc(MS.books[book].name)} per century">${cents.map((c) => {
      const n = buckets.get(c) ?? 0, here = keys.filter((k) => { const r = byId.get(k.rec); return r && Math.floor((mid(r) - 1) / 100) === c; });
      return `<button type="button" class="st-bar" data-c="${c}" data-n="${n}" style="--h:${(Math.sqrt(n / max) * 100).toFixed(1)}%"><i></i>${here.map((k) => `<em data-open="${k.rec}">${esc(k.label)}</em>`).join("")}<span>${c === 1 || c % 4 === 0 ? `${ordinal(c + 1)} c.` : ""}</span></button>`;
    }).join("")}</div><p class="st-say">${formatNumber(dated.length)} dated open records hold ${esc(MS.books[book].name)}. Point at a century.</p>`;
    const sayEl = el.querySelector(".st-say"), base = sayEl.innerHTML;
    el.addEventListener("pointerover", (e) => { const b = e.target.closest(".st-bar"); sayEl.innerHTML = b ? `<b>${ordinal(Number(b.dataset.c) + 1)} century</b> · ${plural(Number(b.dataset.n), "dated copy", "dated copies")}` : base; });
    el.addEventListener("pointerleave", () => { sayEl.innerHTML = base; });
  }

  // One square per chapter, darker where more open records name it; choosing one returns those records.
  function chapters(el, { book, onPick }) {
    const all = recordsFor(book), n = MS.books[book].ch;
    const named = all.filter((r) => r.ch?.[String(book)]);
    const count = (c) => named.filter((r) => r.ch[String(book)].includes(c));
    const max = Math.max(1, ...Array.from({ length: n }, (_, i) => count(i + 1).length));
    el.classList.add("cg");
    el.innerHTML = `<div class="cg-grid" role="group" aria-label="Chapters of ${esc(MS.books[book].name)}">${Array.from({ length: n }, (_, i) => {
      const k = count(i + 1).length;
      return `<button type="button" data-ch="${i + 1}" aria-pressed="false" style="--v:${(k / max).toFixed(2)}"><b>${i + 1}</b><small>${k}</small></button>`;
    }).join("")}</div><p class="cg-note">Only ${named.length} of ${formatNumber(all.length)} records list chapters; the rest name whole books only.</p>`;
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ch]"); if (!b) return;
      const on = b.getAttribute("aria-pressed") !== "true";
      el.querySelectorAll("[data-ch]").forEach((x) => x.setAttribute("aria-pressed", String(on && x === b)));
      const c = Number(b.dataset.ch), rs = count(c);
      onPick(on ? { chapter: c, records: rs } : null);
    });
  }

  window.Lane = { lane, strip, chapters, recordsFor, describe, FAMILIES };
})();
