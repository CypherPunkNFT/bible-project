// The landing: the face of the Scholars side. The headline from "The index" ("The greats, catalogued."), a warm intro,
// a search that offers matching scholars and opens their profile, the message from "Foundations" (the site itself is
// built on several of these scholars' books), the four figures, jump links to the sections below, and a large
// constellation of all 35 field-shaped marks (circle = history, rounded square = languages & texts, hexagon =
// archaeology & places, tall card = reference works, arch = theology), grouped by field with a thin line joining each
// field's scholars in order of birth. Hover a mark for name, years, faith and key work; click to open the profile.
// Motion: the marks ease in once and then drift very slowly (CSS only, paused off-screen and for reduced motion).
window.Sections = window.Sections || {};
(() => {
  const S = window.SCHOLARS;
  const TONE = { history: "--history", texts: "--prophets", places: "--poetry", reference: "--epistles", theology: "--gospels" };
  const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const tone = (s) => `var(${TONE[s.field]})`;
  const years = (s) => (s.circa ? `c. ${s.born}–c. ${s.died}` : `${s.born}–${s.died}`);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const initials = (s) => {
    const words = s.name.split(/ (?:of|the) /)[0].split(" ").filter((w) => !/^(von|van|de)$/i.test(w));
    return words.length === 1 ? words[0][0] : words[0][0] + words.at(-1)[0];
  };
  const SHAPES = {
    history: (k) => `<circle cx="24" cy="24" r="${22 * k}"/>`,
    texts: (k) => { const r = 21 * k; return `<rect x="${24 - r}" y="${24 - r}" width="${2 * r}" height="${2 * r}" rx="${11 * k}"/>`; },
    places: (k) => `<path d="${[0, 1, 2, 3, 4, 5].map((i) => { const a = Math.PI / 3 * i - Math.PI / 2; return `${i ? "L" : "M"}${(24 + 23 * k * Math.cos(a)).toFixed(2)} ${(24 + 23 * k * Math.sin(a)).toFixed(2)}`; }).join("")}Z" stroke-linejoin="round"/>`,
    reference: (k) => `<rect x="${24 - 16 * k}" y="${24 - 22 * k}" width="${32 * k}" height="${44 * k}" rx="${7 * k}"/>`,
    theology: (k) => { const w = 19 * k, top = 24 - 21 * k, bot = 24 + 21 * k; return `<path d="M${24 - w} ${bot}V${top + w}A${w} ${w} 0 0 1 ${24 + w} ${top + w}V${bot}Z"/>`; },
  };
  // The mark's inside, in its 48 × 48 box (used both in the constellation and as a small inline svg).
  const markInner = (s) => {
    const t = tone(s), ini = initials(s);
    return `<g style="fill: color-mix(in srgb, ${t} 15%, var(--surface)); stroke: color-mix(in srgb, ${t} 50%, transparent)" stroke-width="1.1">${SHAPES[s.field](1)}</g>
      <g fill="none" style="stroke: color-mix(in srgb, ${t} 22%, transparent)" stroke-width=".8">${SHAPES[s.field](.82)}</g>
      <text x="24" y="25" text-anchor="middle" dominant-baseline="central" style="fill: ${t}; font: ${ini.length > 1 ? 500 : 400} ${ini.length > 1 ? 15.5 : 21}px var(--serif); letter-spacing: -.02em">${esc(ini)}</text>`;
  };
  const mark = (s, size) => `<svg class="lnd-mark" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true">${markInner(s)}</svg>`;
  const shapeIcon = (field, size) => `<svg width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true" style="fill: color-mix(in srgb, var(${TONE[field]}) 22%, transparent); stroke: var(${TONE[field]})" stroke-width="4">${SHAPES[field](.9)}</svg>`;

  const byBirth = [...S.scholars].sort((a, b) => a.born - b.born);
  const live = byBirth.filter((s) => s.site?.status === "in-use");
  const held = byBirth.filter((s) => s.site?.status === "held");
  const JUMPS = [["catalogue", "01", "The catalogue"], ["built", "02", "Built on their work"], ["discoveries", "03", "Discoveries"], ["fields", "04", "Five ways to study"], ["directory", "07", "Everyone"]];

  // ── Constellation layout ────────────────────────────────────────────────────────────────
  // Two compositions: a wide one beside the copy, and a tall one for phones. Each field gathers round its own centre;
  // a few hundred rounds of gentle pushing keep marks from touching (deterministic, done once per layout).
  const LAYOUTS = {
    wide: { w: 780, h: 640, size: 58, gap: 76, centres: { texts: [190, 250], history: [470, 150], theology: [680, 160], reference: [600, 420], places: [340, 510] } },
    tall: { w: 400, h: 760, size: 50, gap: 58, centres: { texts: [118, 215], history: [300, 140], theology: [318, 352], reference: [268, 560], places: [100, 560] } },
  };
  // Each field's scholars start on a small spiral in order of birth (so the line through them reads as a gentle
  // curl), then a few hundred rounds of pushing keep marks from touching. Finally the picture is cropped to its own
  // bounds so it fills the stage.
  function place(layout) {
    const { gap, centres, size } = layout;
    const nodes = [];
    for (const field of Object.keys(S.fields)) {
      const [cx, cy] = centres[field], b = gap / (2 * Math.PI);
      let theta = Math.PI * 1.25;
      byBirth.filter((s) => s.field === field).forEach((s, i) => {
        const r = i ? b * theta : 0;
        const a = theta + cx * 0.013;
        const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
        nodes.push({ s, hx: x, hy: y, x, y });
        if (i) theta += gap / Math.max(r, gap * 0.7);
      });
    }
    for (let round = 0; round < 300; round++) {
      for (const n of nodes) { n.x += (n.hx - n.x) * 0.03; n.y += (n.hy - n.y) * 0.03; }
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j], min = a.s.field === b.s.field ? gap : gap + 30;
        let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d >= min) continue;
        if (d < 0.01) { dx = 1; dy = 0; d = 1; }
        const push = (min - d) / 2;
        a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push;
      }
    }
    const pad = 14, half = size / 2 + 6, labelRoom = 40;
    const minX = Math.min(...nodes.map((n) => n.x)) - half - pad, maxX = Math.max(...nodes.map((n) => n.x)) + half + pad;
    const minY = Math.min(...nodes.map((n) => n.y)) - half - pad, maxY = Math.max(...nodes.map((n) => n.y)) + half + labelRoom;
    for (const n of nodes) { n.x -= minX; n.y -= minY; }
    return { nodes, w: Math.round(maxX - minX), h: Math.round(maxY - minY) };
  }

  function skyHtml(layoutName) {
    const base = LAYOUTS[layoutName], { nodes, w, h } = place(base), layout = { ...base, w, h }, k = layout.size / 48;
    const pctX = (x) => `${(x / w * 100).toFixed(3)}%`, pctY = (y) => `${(y / h * 100).toFixed(3)}%`;
    const fields = Object.keys(S.fields).map((field) => {
      const own = nodes.filter((n) => n.s.field === field);
      const mx = own.reduce((a, n) => a + n.x, 0) / own.length, my = own.reduce((a, n) => a + n.y, 0) / own.length;
      const bottom = Math.max(...own.map((n) => n.y));
      return { field, own, mx, my, bottom, r: Math.max(...own.map((n) => Math.hypot(n.x - mx, n.y - my))) + layout.size };
    });
    const glows = fields.map((f) => `<circle cx="${f.mx.toFixed(1)}" cy="${f.my.toFixed(1)}" r="${(f.r * 1.15).toFixed(1)}" fill="url(#lnd-glow-${f.field})"/>`).join("");
    const grads = fields.map((f) => `<radialGradient id="lnd-glow-${f.field}"><stop offset="0" style="stop-color: var(${TONE[f.field]}); stop-opacity: .13"/><stop offset="1" style="stop-color: var(${TONE[f.field]}); stop-opacity: 0"/></radialGradient>`).join("");
    const lines = fields.map((f) => f.own.length > 1
      ? `<polyline class="lnd-line" data-field="${f.field}" pathLength="1" style="stroke: var(${TONE[f.field]}); --d: ${f.own[0].s.born / 2026 * 900 + 350}ms" points="${f.own.map((n) => `${n.x.toFixed(1)},${n.y.toFixed(1)}`).join(" ")}"/>` : "").join("");
    // Birth order sets the entrance: earliest first. Each mark drifts on its own slow loop.
    const order = new Map(byBirth.map((s, i) => [s.id, i]));
    const marks = nodes.map((n, i) => {
      const s = n.s, used = s.site?.status === "in-use";
      const drift = `--fx: ${((i * 37) % 7 - 3) * 0.9}px; --fy: ${((i * 53) % 7 - 3) * 0.9}px; --dur: ${9 + (i * 13) % 7}s; --fd: -${(i * 1.7) % 9}s`;
      return `<g class="lnd-node" data-id="${s.id}" data-field="${s.field}" transform="translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})"
          tabindex="0" role="button" aria-label="${esc(s.name)}, ${esc(years(s))}, ${esc(S.faiths[s.faith])}. Open the profile">
        <g class="lnd-pop" style="--d: ${order.get(s.id) * 34}ms"><g class="lnd-float" style="${drift}"><g class="lnd-hov">
          <circle class="lnd-hit" r="${layout.size / 2 + 4}"/>
          <g transform="translate(${-layout.size / 2} ${-layout.size / 2}) scale(${k})">${markInner(s)}</g>
          ${used ? `<circle class="lnd-used-dot" cx="${layout.size / 2 - 5}" cy="${-layout.size / 2 + 5}" r="4.5"/>` : ""}
        </g></g></g></g>`;
    }).join("");
    const labels = fields.map((f) => `<span class="lnd-flabel" style="left: ${pctX(f.mx)}; top: ${pctY(Math.min(h - 12, f.bottom + layout.size / 2 + 18))}; --tone: var(${TONE[f.field]})">
        ${shapeIcon(f.field, 12)}<span>${esc(S.fields[f.field])}</span><b>${f.own.length}</b></span>`).join("");
    return { html: `<div class="lnd-sky" data-layout="${layoutName}" style="aspect-ratio: ${layout.w} / ${layout.h}">
        <svg viewBox="0 0 ${layout.w} ${layout.h}" aria-label="All ${S.scholars.length} scholars, grouped by field">
          <defs>${grads}</defs><g class="lnd-glows">${glows}</g><g class="lnd-lines">${lines}</g><g class="lnd-nodes">${marks}</g></svg>
        <div class="lnd-flabels">${labels}</div>
        <div class="lnd-tip" hidden></div></div>`, layout };
  }

  const tipHtml = (s) => {
    const [title, year] = s.works[0];
    const badge = s.site ? (s.site.status === "in-use" ? `<span class="lnd-badge lnd-badge-used"><i></i>Used on this site</span>` : `<span class="lnd-badge lnd-badge-held">In the library</span>`) : "";
    return `<p class="lnd-tip-k" style="color: ${tone(s)}">${esc(S.fields[s.field])}</p>
      <p class="lnd-tip-n">${esc(s.name)}</p>
      <p class="lnd-tip-y">${esc(years(s))} · ${esc(s.place[0])}</p>
      <p class="lnd-tip-tags"><span class="lnd-faith">${esc(S.faiths[s.faith])}</span>${badge}</p>
      <p class="lnd-tip-w"><span>Key work</span><b>${esc(title)}</b> <em style="color: ${tone(s)}">${year}</em></p>`;
  };

  // ── Search: scholars by name, book, field, faith or place ───────────────────────────────
  const fieldWords = (s) => `${S.fields[s.field]} ${{ history: "historian", texts: "translator languages greek hebrew latin", places: "archaeologist archaeology dig", reference: "dictionary concordance", theology: "theologian philosopher" }[s.field]}`;
  function matches(query) {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const out = [];
    for (const s of byBirth) {
      const name = `${s.name} ${s.short}`.toLowerCase(), works = s.works.map((w) => w[0].toLowerCase());
      const field = fieldWords(s).toLowerCase(), place = s.place[0].toLowerCase(), faith = S.faiths[s.faith].toLowerCase();
      const all = [name, ...works, field, place, faith].join(" ");
      if (!words.every((w) => all.includes(w))) continue;
      let score = 0, why = "";
      if (words.every((w) => name.includes(w))) score = name.split(/\s+/).some((part) => part.startsWith(words[0])) ? 4 : 3;
      else {
        const work = s.works.find(([t]) => words.some((w) => t.toLowerCase().includes(w)));
        if (work) { score = 2; why = `<i>${esc(work[0])}</i>, ${work[1]}`; }
        else if (words.some((w) => field.includes(w))) { score = 1; why = esc(S.fields[s.field]); }
        else if (words.some((w) => place.includes(w))) { score = 1; why = `Worked in ${esc(s.place[0])}`; }
        else { score = 1; why = esc(S.faiths[s.faith]); }
      }
      out.push({ s, score, why: why || esc(S.fields[s.field]) });
    }
    return out.sort((a, b) => b.score - a.score || a.s.born - b.s.born);
  }

  function mount(section) {
    const first = byBirth[0], last = byBirth.at(-1);
    section.innerHTML = `<div class="lnd">
      <div class="lnd-hero">
        <div class="lnd-copy">
          <p class="kicker lnd-kicker">Scholars in the library</p>
          <h1 class="lnd-title">The greats, <em>catalogued.</em></h1>
          <p class="lnd-lead">Historians, translators, archaeologists, theologians and the makers of reference books: ${S.scholars.length} scholars across two thousand years,
            Christian or not, each labelled for what they were. Look someone up, or wander the marks and meet someone new.</p>
          <div class="lnd-find">
            <label class="lnd-search">${icon("search", 18)}<input type="search" placeholder="Find a scholar, a book or a field" autocomplete="off" spellcheck="false"
              role="combobox" aria-expanded="false" aria-controls="lnd-results" aria-autocomplete="list" aria-label="Find a scholar, a book or a field"></label>
            <div class="lnd-results" id="lnd-results" role="listbox" aria-label="Matching scholars" hidden></div>
          </div>
          <aside class="lnd-built" aria-label="Built on their work">
            <h2>You have been reading <em>their work</em> all&nbsp;along.</h2>
            <p>This site stands on books by ${live.length} of them. Their dictionaries, concordance and harmony power the Topics pages, the Gospel harmony, the miracles and the Letters study.</p>
            <ul class="lnd-used">${live.map((s) => `<li><button type="button" data-open="${s.id}" style="--tone: ${tone(s)}">${mark(s, 26)}<span>${esc(s.short)}</span></button></li>`).join("")}</ul>
            <a class="lnd-more" href="#built">Follow each feature back to its book${icon("arrowRight", 14)}</a>
          </aside>
        </div>
        <figure class="lnd-stage">
          <figcaption class="lnd-cap"><span>Each mark is one scholar, shaped by field. A thin line joins each field's scholars in the order they were born.</span>
            <span class="lnd-cap-key"><i></i>Used on this site</span></figcaption>
          <div class="lnd-skyhold"></div>
        </figure>
      </div>
      <div class="lnd-foot">
        <dl class="lnd-figs">
          <div><dt>Scholars</dt><dd>${S.scholars.length}</dd><p>from ${esc(first.short)} to ${esc(last.short)}</p></div>
          <div><dt>Fields</dt><dd>${Object.keys(S.fields).length}</dd><p>history to reference books</p></div>
          <div><dt>Used on this site</dt><dd>${live.length}</dd><p>${held.length} more in the library</p></div>
          <div><dt>Since</dt><dd>${first.circa ? "<small>c.</small> " : ""}${first.born}</dd><p>${esc(first.short)}, the earliest</p></div>
        </dl>
        <nav class="lnd-jump" aria-label="On this page"><span class="lnd-jump-l">On this page</span>
          ${JUMPS.map(([id, n, label]) => `<a href="#${id}"><b>${n}</b>${esc(label)}</a>`).join("")}</nav>
      </div></div>`;

    const stage = section.querySelector(".lnd-stage"), hold = section.querySelector(".lnd-skyhold");
    let sky, layout, tip, current = null;

    // Draw the layout that suits the width; redraw only when crossing the phone breakpoint.
    const narrow = matchMedia("(max-width: 640px)");
    function draw() {
      const built = skyHtml(narrow.matches ? "tall" : "wide");
      current = null;
      hold.innerHTML = built.html;
      layout = built.layout;
      sky = hold.firstElementChild;
      tip = sky.querySelector(".lnd-tip");
      if (reduced()) sky.classList.add("lnd-in");
      else requestAnimationFrame(() => requestAnimationFrame(() => sky.classList.add("lnd-in")));
      paintHits();
    }
    narrow.addEventListener("change", draw);

    // ── Hover / focus card ───────────────────────────────────────────────
    function showTip(node) {
      const s = S.scholars.find((x) => x.id === node.dataset.id);
      current = node;
      sky.dataset.hover = s.field;
      node.classList.add("lnd-on");
      tip.innerHTML = tipHtml(s);
      tip.hidden = false;
      const box = sky.getBoundingClientRect(), r = node.querySelector(".lnd-hov").getBoundingClientRect();
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      const cx = r.left + r.width / 2 - box.left;
      const above = r.top - box.top - th - 12;
      const top = above >= 4 ? above : r.bottom - box.top + 12;
      tip.style.left = `${Math.max(4, Math.min(box.width - tw - 4, cx - tw / 2))}px`;
      tip.style.top = `${Math.min(top, box.height - th - 4)}px`;
      tip.classList.toggle("lnd-tip-below", above < 4);
    }
    function hideTip() {
      if (!current) return;
      current.classList.remove("lnd-on");
      current = null;
      delete sky.dataset.hover;
      tip.hidden = true;
    }
    hold.addEventListener("pointerover", (event) => {
      const node = event.target.closest(".lnd-node");
      if (node && node !== current) { hideTip(); showTip(node); }
    });
    hold.addEventListener("pointerout", (event) => {
      const node = event.target.closest(".lnd-node");
      if (node && !node.contains(event.relatedTarget)) hideTip();
    });
    // Keyboard focus shows the card too; focus put back after the profile closes from a click does not.
    hold.addEventListener("focusin", (event) => { const node = event.target.closest(".lnd-node"); if (node?.matches(":focus-visible")) { hideTip(); showTip(node); } });
    hold.addEventListener("pointerleave", hideTip);
    hold.addEventListener("focusout", hideTip);
    const openFrom = (node) => { hideTip(); window.Scholars?.openProfile?.(node.dataset.id, node.querySelector(".lnd-hov")); };
    hold.addEventListener("click", (event) => { const node = event.target.closest(".lnd-node"); if (node) openFrom(node); });
    hold.addEventListener("keydown", (event) => {
      const node = event.target.closest(".lnd-node");
      if (node && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); openFrom(node); }
    });

    // Drift only while the constellation is on screen.
    new IntersectionObserver(([entry]) => stage.classList.toggle("lnd-paused", !entry.isIntersecting)).observe(stage);

    // ── Search ────────────────────────────────────────────────────────────
    const input = section.querySelector(".lnd-search input"), results = section.querySelector(".lnd-results");
    let found = [], active = -1;
    function paintHits() {
      if (!sky) return;
      const hits = new Set(found.map((m) => m.s.id));
      sky.classList.toggle("lnd-searching", input.value.trim().length > 0);
      for (const node of sky.querySelectorAll(".lnd-node")) node.classList.toggle("lnd-match", hits.has(node.dataset.id));
    }
    function renderResults() {
      const q = input.value.trim();
      found = matches(q);
      active = found.length ? 0 : -1;
      results.innerHTML = found.length
        ? found.map((m, i) => `<button type="button" role="option" id="lnd-opt-${i}" class="lnd-opt" data-open="${m.s.id}" aria-selected="${i === active}" style="--tone: ${tone(m.s)}">
            ${mark(m.s, 34)}<span class="lnd-opt-t"><b>${esc(m.s.name)}</b><small>${esc(years(m.s))} · ${m.why}</small></span><span class="lnd-opt-go">${icon("arrowRight", 14)}</span></button>`).join("")
          + `<p class="lnd-res-n">${found.length} ${found.length === 1 ? "match" : "matches"}</p>`
        : `<p class="lnd-none">Nothing matches “${esc(q)}”. Try a name like Jerome, a book like the Vulgate, or a field like archaeology.</p>`;
      results.hidden = !q;
      input.setAttribute("aria-expanded", String(Boolean(q)));
      input.setAttribute("aria-activedescendant", active >= 0 ? `lnd-opt-${active}` : "");
      paintHits();
    }
    function setActive(i) {
      const opts = results.querySelectorAll(".lnd-opt");
      if (!opts.length) return;
      active = (i + opts.length) % opts.length;
      opts.forEach((o, j) => o.setAttribute("aria-selected", String(j === active)));
      opts[active].scrollIntoView({ block: "nearest" });
      input.setAttribute("aria-activedescendant", `lnd-opt-${active}`);
    }
    const closeResults = () => { results.hidden = true; input.setAttribute("aria-expanded", "false"); };
    input.addEventListener("input", () => { hideTip(); renderResults(); });
    input.addEventListener("focus", () => { hideTip(); if (input.value.trim()) renderResults(); });
    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") { event.preventDefault(); setActive(active + 1); }
      else if (event.key === "ArrowUp") { event.preventDefault(); setActive(active - 1); }
      else if (event.key === "Enter") {
        const opt = results.querySelectorAll(".lnd-opt")[Math.max(0, active)];
        if (opt) { event.preventDefault(); closeResults(); window.Scholars?.openProfile?.(opt.dataset.open, opt); }
      } else if (event.key === "Escape") { input.value = ""; renderResults(); closeResults(); }
    });
    document.addEventListener("pointerdown", (event) => { if (!event.target.closest(".lnd-find")) closeResults(); });

    // ── Everything else that opens a profile, and the jump links ───────────
    section.addEventListener("click", (event) => {
      const opener = event.target.closest("[data-open]");
      if (opener) { if (opener.classList.contains("lnd-opt")) closeResults(); window.Scholars?.openProfile?.(opener.dataset.open, opener); return; }
      const jump = event.target.closest('a[href^="#"]');
      if (!jump) return;
      const target = document.getElementById(jump.getAttribute("href").slice(1));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", jump.getAttribute("href"));
    });

    draw();
  }

  Sections.landing = { mount };
})();
