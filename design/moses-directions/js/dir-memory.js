// G · The long memory. Every verse that names Moses (STEP Bible's TIPNR list, data/memory.json) as light across the whole
// Bible: the 66 books in order, sized by chapters; each verse a point. Tags and speakers only where the verse's own words
// (or a named speaker nearby) support them.
(() => {
  let G = null;
  const load = async () => { if (G) return G; const res = await fetch("data/memory.json"); if (!res.ok) throw new Error(`memory.json: expected 200, got ${res.status}`); G = await res.json(); prep(); return G; };
  const TAG_TONE = { law: "var(--prophets)", servant: "var(--poetry)", prophet: "var(--gospels)", pleads: "var(--revelation)", led: "var(--history)", spoke: "var(--gm-gold)" };
  const WHO_TONE = { jesus: "var(--revelation)", narrator: "var(--gm-dim)", god: "var(--gm-gold)", people: "var(--history)", joshua: "var(--history)", caleb: "var(--history)", samuel: "var(--history)",
    kings: "var(--epistles)", psalmist: "var(--poetry)", moses: "var(--gm-gold)", prophets: "var(--prophets)", peter: "var(--poetry)", opponents: "var(--gm-dim2)", stephen: "var(--acts)",
    apostles: "var(--acts)", paul: "var(--gospels)", hebrews: "var(--prophets)", writers: "var(--gm-ink2)" };
  const SECTION_TONE = { history: "var(--strip-history)", poetry: "var(--strip-poetry)", prophets: "var(--strip-prophets)", gospels: "var(--strip-gospels)", epistles: "var(--strip-epistles)", revelation: "var(--strip-revelation)" };
  let OFF = {}, TOTAL = 0, NUMS = [];
  function prep() {
    NUMS = Object.keys(G.books).map(Number).sort((a, b) => a - b);
    let g = 0; for (const n of NUMS) { OFF[n] = g; g += G.books[n].chapters; } TOTAL = g;
    G.points.forEach((p, i) => { p.i = i; p.g = OFF[p.b] + p.c - 1; p.f = (p.v - 1) / Math.max(1, p.n - 1); });
    G.byBook = {}; for (const p of G.points) G.byBook[p.b] = (G.byBook[p.b] ?? 0) + 1;
  }
  const ref = (p) => `${G.books[p.b].name} ${p.c}:${p.v}`;
  const shortRef = (p) => `${G.books[p.b].code.replace(/^(\d?)([A-Z])([A-Z]+)$/, (m, d, a, b) => d + a + b.toLowerCase())} ${p.c}:${p.v}`;
  const whoLabel = (id) => G.who.find((w) => w.id === id)?.label ?? id;
  const tagLabel = (id) => G.tags.find((t) => t.id === id)?.label ?? id;

  // Layout for a given width: rows of chapters (same scale on every row), each verse at its height within its chapter.
  function layout(W) {
    const rows = W >= 1050 ? 3 : W >= 700 ? 5 : 8, per = Math.ceil(TOTAL / rows), cw = W / per;
    const rowH = W >= 700 ? 118 : 84, callH = W >= 700 ? 96 : 0, labH = 24, band = callH + rowH + labH;
    const at = (g) => { const r = Math.floor(g / per); return { r, x: (g - r * per) * cw, top: r * band + callH }; };
    return { rows, per, cw, rowH, callH, labH, band, H: rows * band, at };
  }
  function field(W) {
    const L = layout(W), { cw, rowH, labH } = L;
    const blocks = [], labels = [];
    NUMS.forEach((n, k) => {
      const b = G.books[n]; let g = OFF[n]; const end = OFF[n] + b.chapters;
      while (g < end) {
        const a = L.at(g), rowEnd = (a.r + 1) * L.per, stop = Math.min(end, rowEnd), w = (stop - g) * cw;
        blocks.push(`<rect class="gm-book ${k % 2 ? "is-odd" : ""}" data-book="${n}" x="${a.x.toFixed(2)}" y="${a.top}" width="${w.toFixed(2)}" height="${rowH}" style="--sec:${SECTION_TONE[b.section] ?? "var(--line)"}"><title>${esc(b.name)} · ${b.chapters} chapters${G.byBook[n] ? ` · ${G.byBook[n]} verses name Moses` : ""}</title></rect>`);
        blocks.push(`<rect class="gm-sec" x="${a.x.toFixed(2)}" y="${a.top + rowH + 2}" width="${Math.max(w - 1, .5).toFixed(2)}" height="3" style="--sec:${SECTION_TONE[b.section] ?? "var(--line)"}"/>`);
        if (w > 21) labels.push(`<text class="gm-blabel ${G.byBook[n] ? "has" : ""}" x="${(a.x + 2).toFixed(1)}" y="${a.top + rowH + 17}">${esc(b.name.length * 6.1 + 4 < w ? b.name : b.code.replace(/^(\d?)([A-Z])([A-Z]+)$/, (m, d, x, y) => d + x + y.toLowerCase()))}</text>`);
        g = stop;
      }
    });
    const pts = G.points.map((p) => { const a = L.at(p.g); p.x = a.x + cw / 2; p.y = a.top + 8 + p.f * (rowH - 16); return `<circle class="gm-pt ${p.tags.map((t) => `t-${t[0]}`).join(" ")} ${p.who ? `w-${p.who}` : "w-none"}" data-i="${p.i}" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${W >= 700 ? 2.6 : 2.1}"/>`; }).join("");
    // Echo call-outs above their row, stacked on up to three levels so they do not collide.
    const calls = [];
    if (L.callH) {
      const lastRight = {};
      G.echoes.map((e) => ({ e, p: G.points.find((p) => p.id === e.id) })).sort((a, b) => (L.at(a.p.g).r - L.at(b.p.g).r) || a.p.x - b.p.x).forEach(({ e, p }) => {
        const r = L.at(p.g).r, w = Math.max(e.phrase.length * 5.6, shortRef(p).length * 6.2) + 12;
        const tx = Math.max(0, Math.min(p.x - 3, W - w));
        let lvl = 0; while (lvl < 3 && (lastRight[`${r}-${lvl}`] ?? -1e9) > tx - 8) lvl++;
        lastRight[`${r}-${lvl}`] = tx + w;
        const ty = r * L.band + 4 + lvl * 23;
        calls.push(`<g class="gm-call" data-i="${p.i}"><line x1="${p.x.toFixed(1)}" y1="${ty + 16}" x2="${p.x.toFixed(1)}" y2="${(p.y - 4).toFixed(1)}"/><text x="${tx.toFixed(1)}" y="${ty + 6}"><tspan class="gm-call-ref">${esc(shortRef(p))}</tspan><tspan class="gm-call-q" x="${tx.toFixed(1)}" dy="11">“${esc(e.phrase)}”</tspan></text></g>`);
      });
    }
    return { L, svg: `<svg class="gm-svg" viewBox="0 0 ${W.toFixed(0)} ${L.H}" width="${W.toFixed(0)}" height="${L.H}" role="img" aria-label="Every verse that names Moses, across the 66 books of the Bible">
      <defs><filter id="gm-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter></defs>
      <g class="gm-blocks">${blocks.join("")}</g><g class="gm-labels">${labels.join("")}</g><g class="gm-calls">${calls.join("")}</g>
      <rect class="gm-beam" x="0" y="0" width="3" height="${rowH}"/>
      <g class="gm-glow" filter="url(#gm-glow)">${pts}</g><g class="gm-pts">${pts}</g>
      <circle class="gm-ring" r="8" cx="-20" cy="-20"/><circle class="gm-sel" r="10" cx="-20" cy="-20"/></svg>` };
  }

  const reading = (p) => {
    const tags = p.tags.length ? p.tags.map(([t, m]) => `<li style="--tone:${TAG_TONE[t]}"><b>${esc(tagLabel(t))}</b><span>the verse says “${esc(m)}”</span></li>`).join("") : '<li class="is-none"><span>Not tagged: none of the six phrases appears in this verse.</span></li>';
    const echo = G.echoes.find((e) => e.id === p.id);
    return `<span class="gm-k">${esc(G.books[p.b].name)} · verse ${G.points.filter((x) => x.b === p.b && x.i <= p.i).length} of ${G.byBook[p.b]} naming him in this book</span>
      <h3>${esc(ref(p))}</h3><p class="gm-verse">${esc(p.text)}</p>
      ${echo?.src ? `<p class="gm-also">“${esc(echo.phrase)}” · ${esc(echo.src)}.</p>` : ""}
      <div class="gm-facts"><div><h4>Remembered as</h4><ul class="gm-tags">${tags}</ul></div>
        <div><h4>Who speaks of him</h4><p class="gm-who" style="--tone:${p.who ? WHO_TONE[p.who] : "var(--muted)"}"><b>${p.who ? esc(whoLabel(p.who)) : "Not sorted"}</b><span>${p.basis ? esc(p.basis) : "The speaker is not settled from the verse alone, so it is left unsorted."}</span></p></div></div>
      <footer><a class="read" href="/read/kjv/${G.books[p.b].code}/${p.c}?v=${p.v}">${icon("open", 14)}Read the passage</a><span class="gm-steps"><button type="button" data-stepv="-1" aria-label="Previous verse">${icon("chevronLeft", 16)}</button><button type="button" data-stepv="1" aria-label="Next verse">${icon("chevronRight", 16)}</button></span></footer>`;
  };

  DIRECTIONS.memory = {
    name: "The long memory", swatch: "#e0b25c",
    mount(main) {
      main.innerHTML = `<div class="wrap gm-wait">${topline()}<p>Gathering every verse…</p></div>`;
      let alive = true, ro = null, timer = 0;
      const off = [];
      load().then(() => { if (alive) draw(); }).catch((error) => { console.error("memory: could not load data/memory.json", error); main.innerHTML = `<p class="wrap">Could not load the verses: ${esc(error.message)}</p>`; });
      function draw() {
        const books = NUMS.filter((n) => G.byBook[n]), max = Math.max(...Object.values(G.byBook));
        const pent = G.points.filter((p) => p.b >= 2 && p.b <= 5).length;
        main.innerHTML = `
          <section class="gm-hero"><div class="wrap">${topline()}
            <div class="gm-head"><div><span class="gm-kick">How the rest of Scripture remembers Moses</span><h1>The long memory</h1>
              <p class="gm-lede">Every verse in the Bible that names him, as a point of light: the 66 books in order, each as wide as its chapters, each verse at its place in its chapter. Exodus to Deuteronomy blaze; then come the echoes.</p></div>
              <div class="gm-counter"><b data-lit>${G.points.length}</b><span>verses name Moses</span><small><span data-books>${books.length}</span> of 66 books · ${pent} in Exodus–Deuteronomy, ${G.points.length - pent} after</small><em data-passing>From STEP Bible's names data</em></div></div>
          </div></section>
          <section class="wrap gm-main">
            <div class="gm-bar">
              <div class="gm-seg" role="group" aria-label="Colour the points by"><button type="button" data-mode="tag" aria-pressed="true">Remembered as</button><button type="button" data-mode="who" aria-pressed="false">Who speaks of him</button></div>
              <div class="gm-chips" data-chips></div>
              <label class="gm-toggle"><input type="checkbox" data-echo><span></span>Only the echoes (after Deuteronomy)</label>
            </div>
            <div class="gm-field-wrap"><div class="gm-field" data-field></div></div>
            <div class="gm-under">
              <article class="gm-read" data-read></article>
              <div class="gm-counts"><h3>Count per book <small>${books.length} books</small></h3><ol>${books.map((n) => `<li><button type="button" data-book="${n}"><span>${esc(G.books[n].name)}</span><i style="--w:${((G.byBook[n] / max) * 100).toFixed(1)}%;--sec:${SECTION_TONE[G.books[n].section]}"></i><b>${G.byBook[n]}</b></button></li>`).join("")}</ol></div>
            </div>
            <div class="gm-echoes"><h3>The echoes, from Joshua to Revelation</h3><div class="gm-echo-row">${G.echoes.map((e) => { const p = G.points.find((x) => x.id === e.id); return `<button type="button" class="gm-echo" data-pick="${p.i}" style="--sec:${SECTION_TONE[G.books[p.b].section]}"><span>${esc(ref(p))}</span><b>“${esc(e.phrase)}”</b><small>${p.who ? esc(whoLabel(p.who)) : "Speaker not sorted"}</small></button>`; }).join("")}</div></div>
            <div class="gm-method"><span class="gm-kick">How this is made</span>
              <p>The verse list comes from STEP Bible's names data (TIPNR), which lists every verse naming Moses: ${G.points.length} verses. The text is the King James Version the site reads from.</p>
              <p><b>Remembered as:</b> a verse gets a label only when its own words contain one of six phrases, and the phrase is shown beside it; otherwise it is untagged. <b>Who speaks of him:</b> Jesus where the KJV text prints the words as his; a named speaker where a verse nearby names them (shown with that verse); the narrator where the verse opens as narrative ("And Moses went…"); the rest are left unsorted.</p>
              <p class="gm-credit">${chip("scripture")}<span>${esc(G.credit)}</span></p></div>
          </section>`;
        wire();
      }
      function wire() {
        const host = main.querySelector("[data-field]"), chipsEl = main.querySelector("[data-chips]"), readEl = main.querySelector("[data-read]");
        const litEl = main.querySelector("[data-lit]"), passEl = main.querySelector("[data-passing]");
        let mode = "tag", pick = null, book = null, echoOnly = false, sel = G.points.find((p) => p.id === 66015003), F = null, lit = 0, circles = [], glows = [];
        const visible = (p) => (!echoOnly || p.b > 5) && (!book || p.b === book) && (!pick || (mode === "tag" ? (pick === "none" ? !p.tags.length : p.tags.some((t) => t[0] === pick)) : (pick === "none" ? !p.who : p.who === pick)));
        const render = () => {
          const W = Math.max(280, host.clientWidth);
          F = field(W); host.innerHTML = F.svg;
          circles = [...host.querySelectorAll(".gm-pts .gm-pt")]; glows = [...host.querySelectorAll(".gm-glow .gm-pt")];
          host.querySelector(".gm-svg").addEventListener("pointermove", onMove); host.querySelector(".gm-svg").addEventListener("pointerleave", () => moveRing(null)); host.querySelector(".gm-svg").addEventListener("click", onPick);
          applyLit(lit); apply(); select(sel, false);
        };
        const chips = () => {
          const list = mode === "tag" ? G.tags.map((t) => ({ id: t.id, label: t.label, count: t.count, tone: TAG_TONE[t.id] })) : G.who.map((w) => ({ id: w.id, label: w.label, count: w.count, tone: WHO_TONE[w.id] }));
          const none = G.points.filter((p) => (mode === "tag" ? !p.tags.length : !p.who)).length;
          chipsEl.innerHTML = [...list, { id: "none", label: mode === "tag" ? "Untagged" : "Not sorted", count: none, tone: "var(--muted)" }].map((c) => `<button type="button" class="gm-chip" data-pick="${c.id}" style="--tone:${c.tone}" aria-pressed="${pick === c.id}"><i></i>${esc(c.label)}<em>${c.count}</em></button>`).join("");
        };
        const apply = () => {
          const svg = host.querySelector(".gm-svg"); svg.dataset.gmode = mode; svg.dataset.gpick = pick ?? "";
          G.points.forEach((p, i) => { const v = visible(p); circles[i].classList.toggle("is-dim", !v); glows[i].classList.toggle("is-dim", !v); circles[i].classList.toggle("is-hi", !!pick && v); });
          svg.querySelectorAll(".gm-book").forEach((r) => r.classList.toggle("is-on", Number(r.dataset.book) === book));
          main.querySelectorAll(".gm-counts [data-book]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.book) === book)));
          chipsEl.querySelectorAll("[data-pick]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.pick === pick)));
          main.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
        };
        const moveRing = (p) => { const r = host.querySelector(".gm-ring"); if (!r) return; r.style.display = p ? "inline" : "none"; r.setAttribute("cx", p ? p.x : -20); r.setAttribute("cy", p ? p.y : -20); host.querySelector(".gm-svg").style.cursor = p ? "pointer" : "default"; };
        const nearest = (e) => {
          const svg = host.querySelector(".gm-svg"), box = svg.getBoundingClientRect(), x = (e.clientX - box.left) * (F.L.H / box.height), y = (e.clientY - box.top) * (F.L.H / box.height);
          let best = null, bd = 14 * 14;
          for (const p of G.points) { if (!visible(p)) continue; const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = p; } }
          return best;
        };
        const onMove = (e) => moveRing(nearest(e));
        const onPick = (e) => { const p = nearest(e); if (p) select(p, true); };
        const select = (p, scroll) => {
          if (!p) return; sel = p;
          const s = host.querySelector(".gm-sel"); s.style.display = "inline"; s.setAttribute("cx", p.x); s.setAttribute("cy", p.y);
          readEl.innerHTML = reading(p); readEl.style.setProperty("--tone", p.who ? WHO_TONE[p.who] : "var(--gm-gold)");
          if (scroll && innerWidth < 900) readEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        };
        // Light travels through the canon: a beam sweeps the books in order and each verse lights as it passes.
        const applyLit = (g) => {
          lit = g;
          G.points.forEach((p, i) => { const on = p.g < g; circles[i]?.classList.toggle("is-lit", on); glows[i]?.classList.toggle("is-lit", on); });
        };
        const sweep = () => Clock.run({ label: "Light travels through the canon, Genesis to Revelation", duration: 6400,
          frame: (q) => {
            const g = q * TOTAL, n = G.points.filter((p) => p.g < g).length;
            applyLit(g); litEl.textContent = String(n);
            const beam = host.querySelector(".gm-beam");
            if (beam) { const gg = Math.min(g, TOTAL - .001), a = F.L.at(Math.floor(gg)); beam.setAttribute("x", (a.x + (gg % 1) * F.L.cw).toFixed(1)); beam.setAttribute("y", a.top); beam.style.opacity = q > 0 && q < 1 ? "1" : "0"; }
            const bn = NUMS.find((b) => OFF[b] <= g && g < OFF[b] + G.books[b].chapters) ?? 66;
            passEl.textContent = q >= 1 ? "From STEP Bible's names data" : `Now passing: ${G.books[bn].name}`;
          },
          moving: (q) => (q < 1 ? ["light beam", "verses lighting", "counter"] : []) });
        const onClick = (e) => {
          const m = e.target.closest("[data-mode]");
          if (m) { mode = m.dataset.mode; pick = null; chips(); apply(); return; }
          const c = e.target.closest(".gm-chip");
          if (c) { pick = pick === c.dataset.pick ? null : c.dataset.pick; apply(); const first = G.points.find(visible); if (first && !visible(sel)) select(first); return; }
          const b = e.target.closest(".gm-counts [data-book]");
          if (b) { book = book === Number(b.dataset.book) ? null : Number(b.dataset.book); apply(); const first = G.points.find(visible); if (first && book) select(first); host.scrollIntoView({ behavior: "smooth", block: "nearest" }); return; }
          const ec = e.target.closest(".gm-echo");
          if (ec) { const p = G.points[Number(ec.dataset.pick)]; if (!visible(p)) { pick = null; book = null; echoOnly = false; main.querySelector("[data-echo]").checked = false; apply(); } select(p); host.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
          const st = e.target.closest("[data-stepv]");
          if (st) { const list = G.points.filter(visible); const k = list.indexOf(sel); const next = list[(Math.max(0, k) + Number(st.dataset.stepv) + list.length) % list.length]; select(next); }
        };
        const onChange = (e) => { if (e.target.matches("[data-echo]")) { echoOnly = e.target.checked; apply(); if (!visible(sel)) select(G.points.find(visible)); } };
        main.addEventListener("click", onClick); main.addEventListener("change", onChange);
        ro = new ResizeObserver(() => { clearTimeout(timer); timer = setTimeout(() => { if (F && Math.abs(host.clientWidth - F.L.cw * F.L.per) > 2) render(); }, 150); });
        ro.observe(host);
        off.push(() => { main.removeEventListener("click", onClick); main.removeEventListener("change", onChange); });
        chips(); render(); sweep();
      }
      return () => { alive = false; ro?.disconnect(); clearTimeout(timer); off.forEach((f) => f()); };
    },
  };
})();
