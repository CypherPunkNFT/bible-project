// 02 · Built on their work (ported from A "Foundations"). Ribbons run from each part of this site to the book it draws
// on and on to the scholar who wrote it. Live features come from each in-use scholar's own site note; books held in the
// library (planned) gather under one dashed group. Desktop: one SVG for ribbons plus HTML nodes laid out from the stage
// width. Phone: the same links stacked as one list per feature. Every book and name opens the shared profile.
window.Sections = window.Sections || {};
(() => {
  const D = window.SCHOLARS;
  if (!D || !Array.isArray(D.scholars)) throw new Error("Built on their work: window.SCHOLARS is missing (expected ../shared/scholars-data.js to load first)");
  const FIELD_TONE = { history: "--history", texts: "--prophets", places: "--poetry", reference: "--epistles", theology: "--gospels" };
  // The live features, read from each in-use scholar's own site note (no hand-made mapping).
  const FEATURES = [
    { id: "topics", name: "Topics", tone: "--poetry", test: /Topics/ },
    { id: "miracles", name: "Miracles", tone: "--acts", test: /miracles/i },
    { id: "harmony", name: "Gospel harmony", tone: "--gospels", test: /Gospel harmony/ },
    { id: "letters", name: "Letters study", tone: "--epistles", test: /Letters study/ },
  ];
  const featuresOf = (s) => (s.site?.status === "in-use" ? FEATURES.filter((f) => f.test.test(s.site.note)) : []);
  for (const s of D.scholars) {
    if (s.site?.status === "in-use" && featuresOf(s).length === 0) console.error(`Built on their work: ${s.id} is in use but its note names no known feature: "${s.site.note}"`);
  }
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const years = (s) => `${s.circa ? "c. " : ""}${s.born}–${s.died}`;
  const faith = (s) => D.faiths[s.faith] || D.faiths.unrecorded;
  const tone = (s) => FIELD_TONE[s.field] || "--accent";
  // Initials from the name before any "of …"/"the …": Flavius Josephus → FJ, Origen of Alexandria → O, A. T. Robertson → AR.
  const monogram = (s) => {
    const words = s.name.split(/ (?:of|the) /)[0].split(/\s+/).filter((w) => /^[A-Z]/.test(w));
    return words.length > 1 ? words[0][0] + words.at(-1)[0] : words[0][0];
  };
  const mono = (s) => `<span class="blt-mono" style="--tone: var(${tone(s)})" aria-hidden="true">${esc(monogram(s))}</span>`;
  const listWords = (items) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ROW = 34, GAP = 4, GROUP_GAP = 30, TOP = 34, RIB = 11;
  const LIBRARY = { id: "library", name: "In the library", sub: "Planned", tone: "--muted", planned: true };
  const features = [...FEATURES.map((f) => ({ ...f, sub: "Live today" })), LIBRARY];
  const fIndex = (f) => features.indexOf(f);
  const used = D.scholars.filter((s) => s.site?.status === "in-use")
    .map((s) => ({ s, fs: featuresOf(s).map((f) => features.find((x) => x.id === f.id)) }))
    .sort((a, b) => fIndex(a.fs[0]) - fIndex(b.fs[0]) || fIndex(a.fs.at(-1)) - fIndex(b.fs.at(-1)) || a.s.born - b.s.born);
  const held = D.scholars.filter((s) => s.site?.status === "held").map((s) => ({ s, fs: [LIBRARY] }));
  const rows = [...used, ...held];
  const links = rows.flatMap(({ s, fs }) => fs.map((f) => ({ f, s })));
  const workOf = (s) => s.works[0];

  function nodesHtml() {
    const feat = features.map((f) => {
      const n = links.filter((l) => l.f === f).length;
      return `<button type="button" class="blt-feat${f.planned ? " blt-planned" : ""}" data-f="${f.id}" style="--tone: var(${f.tone})">
        <b>${esc(f.name)}</b><small>${n} book${n === 1 ? "" : "s"} · ${f.sub}</small><i aria-hidden="true"></i></button>`;
    }).join("");
    const works = rows.map(({ s }) => {
      const w = workOf(s), more = s.works.length - 1;
      return `<button type="button" class="blt-work${s.site.status === "held" ? " blt-planned" : ""}" data-s="${s.id}" data-scholar="${s.id}">
        <i aria-hidden="true"></i><span>${esc(w[0])}</span><small>${esc(w[1])}${more ? ` · and ${more} more` : ""}</small></button>`;
    }).join("");
    const people = rows.map(({ s }, i) => `<button type="button" class="blt-sch" data-s="${s.id}" data-scholar="${s.id}" style="--i: ${i}">
        ${mono(s)}<span><b>${esc(s.name)}</b><small>${esc(years(s))} · ${esc(faith(s))}</small></span></button>`).join("");
    return `<span class="blt-col">On this site</span><span class="blt-col">The book</span><span class="blt-col">The scholar</span>${feat}${works}${people}`;
  }

  function stackHtml() {
    return features.map((f) => {
      const items = links.filter((l) => l.f === f).map(({ s }) => {
        const w = workOf(s);
        return `<li><button type="button" data-scholar="${s.id}"><span class="blt-st-work">${esc(w[0])} <em>${esc(w[1])}</em></span>
          <span class="blt-st-who">${mono(s)}<span><b>${esc(s.name)}</b><small>${esc(years(s))} · ${esc(faith(s))}</small></span></span></button></li>`;
      }).join("");
      return `<div class="blt-st-group${f.planned ? " blt-planned" : ""}" style="--tone: var(${f.tone})"><h3><i></i>${esc(f.name)}<small>${f.sub}</small></h3><ul>${items}</ul></div>`;
    }).join("");
  }

  // Positions every node and ribbon for the current stage width. Called on mount and on resize only.
  function layout(stage, svg) {
    const W = stage.clientWidth;
    const LW = Math.min(210, Math.max(150, W * .17));
    const MX = LW + Math.max(140, W * .22), MW = Math.max(220, W * .33), RX = MX + MW + Math.max(40, W * .05);
    const rowY = (i) => TOP + i * (ROW + GAP) + (i >= used.length ? GROUP_GAP : 0);
    const H = rowY(rows.length - 1) + ROW + 8;
    stage.style.height = `${H}px`;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const center = new Map(rows.map(({ s }, i) => [s.id, rowY(i) + ROW / 2]));

    // Feature nodes: centred on their books, then pushed apart so none overlap.
    const boxes = features.map((f) => {
      const targets = links.filter((l) => l.f === f).map((l) => center.get(l.s.id));
      const h = Math.max(48, targets.length * (RIB + 1) + 18);
      return { f, h, y: targets.reduce((a, b) => a + b, 0) / targets.length - h / 2 };
    });
    let floor = TOP;
    for (const b of boxes) { b.y = Math.max(b.y, floor); floor = b.y + b.h + 16; }
    const over = floor - 16 - H;
    if (over > 0) boxes.forEach((b) => { b.y -= over; });

    const el = (sel) => [...stage.querySelectorAll(sel)];
    const cols = el(".blt-col");
    [[0, LW], [MX, MW], [RX, W - RX]].forEach(([x, w], i) => Object.assign(cols[i].style, { left: `${x}px`, width: `${w}px` }));
    cols[0].style.textAlign = "right"; cols[0].style.left = "0px"; cols[0].style.width = `${LW - 14}px`;
    el(".blt-feat").forEach((node, i) => Object.assign(node.style, { left: "0px", width: `${LW}px`, top: `${boxes[i].y}px`, height: `${boxes[i].h}px` }));
    el(".blt-work").forEach((node, i) => Object.assign(node.style, { left: `${MX}px`, width: `${MW}px`, top: `${rowY(i)}px`, height: `${ROW}px` }));
    el(".blt-sch").forEach((node, i) => Object.assign(node.style, { left: `${RX}px`, width: `${W - RX}px`, top: `${rowY(i)}px`, height: `${ROW}px` }));

    // Ribbon ends: stacked inside each feature node (by target height) and inside each book (by source height).
    const slot = (mid, k, n) => mid - (n * RIB + (n - 1)) / 2 + k * (RIB + 1) + RIB / 2;
    const ribbonPaths = links.map((l) => {
      const box = boxes.find((b) => b.f === l.f);
      const mine = links.filter((x) => x.f === l.f).sort((a, b) => center.get(a.s.id) - center.get(b.s.id));
      const into = links.filter((x) => x.s === l.s).sort((a, b) => fIndex(a.f) - fIndex(b.f));
      const y1 = slot(box.y + box.h / 2, mine.indexOf(l), mine.length), y2 = slot(center.get(l.s.id), into.indexOf(l), into.length);
      const x1 = LW, x2 = MX, xm = (x1 + x2) / 2;
      return `M${x1} ${y1.toFixed(1)}C${xm} ${y1.toFixed(1)} ${xm} ${y2.toFixed(1)} ${x2} ${y2.toFixed(1)}`;
    });
    el(".blt-rib").forEach((p, i) => p.setAttribute("d", ribbonPaths[i]));
    el(".blt-con").forEach((p, i) => {
      const y = center.get(rows[i].s.id);
      p.setAttribute("d", `M${MX + MW - 8} ${y}H${RX - 6}`);
    });
  }

  function caption(state) {
    if (!state) return `<span class="blt-cap-hint">Hover a ribbon, a feature or a name to follow it. Click a scholar to meet them.</span>`;
    if (state.f && state.s) {
      const w = workOf(state.s);
      return `<b>${esc(w[0])}</b> (${esc(w[1])}) <span class="blt-arrow">→</span> <b>${esc(state.f.name)}</b><span class="blt-cap-note">${esc(state.s.name)}: ${esc(state.s.site.note)}</span>`;
    }
    if (state.f) {
      const books = links.filter((l) => l.f === state.f).map((l) => esc(workOf(l.s)[0]));
      return state.f.planned
        ? `<b>${books.length} books in the library</b>, planned for features<span class="blt-cap-note">${listWords(books)}.</span>`
        : `<b>${esc(state.f.name)}</b> draws on ${books.length === 1 ? "one book" : `${books.length} books`}<span class="blt-cap-note">${listWords(books)}.</span>`;
    }
    const s = state.s;
    return `<b>${esc(s.name)}</b> · ${esc(years(s))} · ${esc(faith(s))}<span class="blt-cap-note">${esc(s.site.note)}</span>`;
  }

  // Hover lights a path through the diagram; clicking a feature pins it (click again to unpin).
  function wireHover(card) {
    const stage = card.querySelector(".blt-stage"), cap = card.querySelector(".blt-cap-text");
    const items = [...stage.querySelectorAll("[data-f], [data-s]")];
    let pinned = null, shown;
    const show = (state) => {
      if (state === shown) return;
      shown = state;
      const lit = state ? links.filter((l) => (!state.f || l.f === state.f) && (!state.s || l.s === state.s)) : [];
      const fs = new Set(lit.map((l) => l.f.id)), ss = new Set(lit.map((l) => l.s.id));
      stage.classList.toggle("blt-dim", !!state);
      for (const node of items) {
        const f = node.dataset.f, s = node.dataset.s;
        const on = f && s ? lit.some((l) => l.f.id === f && l.s.id === s) : f ? fs.has(f) : ss.has(s);
        node.classList.toggle("blt-on", !!state && on);
      }
      card.style.setProperty("--cap-tone", `var(${state?.f?.tone || (state?.s && rows.find((r) => r.s === state.s).fs[0].tone) || "--accent"})`);
      cap.innerHTML = caption(state);
    };
    const states = new Map();
    const remembered = (node) => {
      const key = `${node.dataset.f || ""}|${node.dataset.s || ""}`;
      if (!states.has(key)) {
        const f = features.find((x) => x.id === node.dataset.f), s = node.dataset.s ? D.scholars.find((x) => x.id === node.dataset.s) : null;
        states.set(key, { f, s });
      }
      return states.get(key);
    };
    stage.addEventListener("pointerover", (e) => {
      const node = e.target.closest("[data-f], [data-s]");
      show(node ? remembered(node) : pinned);
    });
    stage.addEventListener("pointerleave", () => show(pinned));
    stage.addEventListener("focusin", (e) => { const node = e.target.closest("[data-f], [data-s]"); if (node) show(remembered(node)); });
    stage.addEventListener("focusout", () => show(pinned));
    stage.addEventListener("click", (e) => {
      const node = e.target.closest(".blt-feat");
      if (!node) return;
      const state = remembered(node);
      pinned = pinned === state ? null : state;
      stage.querySelectorAll(".blt-feat").forEach((b) => b.setAttribute("aria-pressed", String(b === node && pinned === state)));
      shown = undefined;
      show(pinned || state);
    });
    show(null);
  }

  // Books, names and ribbons open the shared profile; a ribbon grows the profile out of its book.
  function wireProfile(section) {
    section.addEventListener("click", (event) => {
      const hit = event.target.closest("[data-scholar]");
      if (!hit) return;
      const origin = hit.matches(".blt-rib") ? section.querySelector(`.blt-work[data-s="${hit.dataset.scholar}"]`) : hit;
      window.Scholars?.openProfile?.(hit.dataset.scholar, origin);
    });
  }

  function mount(section) {
    section.innerHTML = `<header class="s-head"><p class="kicker"><span class="s-num">02</span>Behind the features</p>
        <h2>Built on <em>their work</em></h2>
        <p>Each ribbon joins a part of this site to the book it draws on, and that book to the scholar who wrote it. Solid ribbons are live today; dashed ones are books in the library, planned for features.</p></header>
      <div class="blt-card">
        <div class="blt-cap" aria-live="polite"><span class="blt-cap-dot" aria-hidden="true"></span><p class="blt-cap-text"></p></div>
        <div class="blt-stage">
          <svg class="blt-art" aria-hidden="true">
            <g>${rows.map(({ s }) => `<path class="blt-con" data-s="${s.id}"/>`).join("")}</g>
            <g>${links.map(({ f, s }) => `<path class="blt-rib${f.planned ? " blt-planned" : ""}" data-f="${f.id}" data-s="${s.id}" data-scholar="${s.id}" style="--tone: var(${f.tone})"/>`).join("")}</g>
          </svg>
          ${nodesHtml()}
        </div>
        <div class="blt-stack">${stackHtml()}</div>
        <ul class="blt-legend"><li><i class="blt-key-live"></i>Live on the site today</li><li><i class="blt-key-planned"></i>In the library, planned</li><li>Click a book or a name to open the scholar's profile</li></ul>
      </div>`;
    const card = section.querySelector(".blt-card"), stage = card.querySelector(".blt-stage"), svg = stage.querySelector("svg");
    let frame = 0, lastWidth = 0;
    const relayout = () => {
      if (!stage.offsetParent || stage.clientWidth === lastWidth) return;
      lastWidth = stage.clientWidth;
      layout(stage, svg);
    };
    new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(relayout); }).observe(card);
    relayout();
    wireHover(card);
    wireProfile(section);
    // The ribbons sweep in once, the first time the card comes into view.
    if (reduced() || !("IntersectionObserver" in window)) { card.classList.add("blt-in", "blt-settled"); return; }
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      card.classList.add("blt-in");
      setTimeout(() => card.classList.add("blt-settled"), 2200);
      io.disconnect();
    }, { threshold: .2 });
    io.observe(card);
  }

  window.Sections.built = { mount };
})();
