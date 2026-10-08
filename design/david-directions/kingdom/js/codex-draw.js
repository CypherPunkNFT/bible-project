// The three drawn entries of the codex: the powers placed round Israel, the open questions as floating words joined by
// lines, and the long memory (every verse naming David as a point of light across the books).
(() => {
  const toRad = (d) => (d * Math.PI) / 180;
  function bearing(a, b) {
    const R = 6371, dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
    const km = 2 * R * Math.asin(Math.sqrt(h));
    const y = Math.sin(dLon) * Math.cos(toRad(b.lat)), x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLon);
    return { km, deg: (Math.atan2(y, x) * 180 / Math.PI + 360) % 360 };
  }

  // ── The world stage: Israel at the centre, each power at the bearing of its first city, distance on a root scale ──
  function world() {
    const J = DV.atlas[DV.person.capital.placeId], W = 640, H = 540, cx = W / 2, cy = H / 2 + 6;
    const rad = (km) => 30 + Math.sqrt(km) * 9.4;
    const nodes = DV.powers.map((pw, i) => {
      const a = DV.atlas[pw.places[0]], b = bearing(J, a), r = Math.min(226, rad(b.km)), t = toRad(b.deg);
      return { i, pw, km: Math.round(b.km), deg: b.deg, x: cx + r * Math.sin(t), y: cy - r * Math.cos(t), place: a.name };
    });
    // The names float in two columns, each joined to its true point by a fine leader; several powers lie almost due
    // north, so on that line they alternate sides. Labels on one side keep at least 40 units apart.
    nodes.forEach((n) => { n.left = n.x < cx - 4; });
    nodes.filter((n) => Math.abs(n.x - cx) < 70).sort((p, q) => p.y - q.y).forEach((n, k) => { n.left = k % 2 === 0; });
    for (const left of [true, false]) {
      let last = -Infinity;
      nodes.filter((n) => n.left === left).sort((p, q) => p.y - q.y).forEach((n) => { n.ly = Math.max(n.y, last + 40); last = n.ly; n.lx = left ? cx - 196 : cx + 196; });
    }
    const rings = [100, 300].map((km) => `<circle class="ws-ring" cx="${cx}" cy="${cy}" r="${rad(km)}"/><text class="ws-ringl" x="${(cx + rad(km) * 0.72 + 4).toFixed(1)}" y="${(cy + rad(km) * 0.72 + 12).toFixed(1)}">${km} km</text>`).join("");
    const lines = nodes.map((n) => `<line class="ws-line" x1="${cx}" y1="${cy}" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}"/>`).join("");
    const dots = nodes.map((n) => { const tx = n.lx.toFixed(1), end = n.lx + (n.left ? 6 : -6); return `<g class="ws-node" data-ws="${n.i}" tabindex="0" role="button" aria-label="${esc(n.pw.power)}">
      <path class="ws-lead" d="M${n.x.toFixed(1)},${n.y.toFixed(1)} L${((n.x + end) / 2).toFixed(1)},${n.ly.toFixed(1)} L${end.toFixed(1)},${n.ly.toFixed(1)}"/><circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="6"/>
      <text x="${tx}" y="${(n.ly + 4).toFixed(1)}" text-anchor="${n.left ? "end" : "start"}"><tspan class="ws-name">${esc(n.pw.power.split(" (")[0])}</tspan><tspan class="ws-meta" x="${tx}" dy="16">${esc(n.place)} · ${n.km} km</tspan></text></g>`; }).join("");
    return `<div class="ws"><div class="ws-fig"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="The powers of David's day placed round Israel">${rings}${lines}
        <g class="ws-centre"><circle cx="${cx}" cy="${cy}" r="10"/><text x="${cx}" y="${cy + 32}" text-anchor="middle">Israel</text><text class="ws-meta" x="${cx}" y="${cy + 49}" text-anchor="middle">Jerusalem</text></g>${dots}
        <text class="ws-n" x="${cx}" y="12" text-anchor="middle">N</text><line class="ws-nl" x1="${cx}" y1="18" x2="${cx}" y2="28"/></svg></div>
      <div class="ws-read" id="ws-read"></div></div>`;
  }
  function worldRead(panel, i) {
    const pw = DV.powers[i], el = panel.querySelector("#ws-read");
    panel.querySelectorAll(".ws-node").forEach((g) => g.classList.toggle("is-on", Number(g.dataset.ws) === i));
    el.innerHTML = `<p class="kicker">${icon("globe", 14)}${esc(pw.places.map((id) => DV.atlas[id].name).join(" · "))}</p><h4>${esc(pw.power)}</h4>${pw.rulers.length ? `<p class="ws-rulers">${pw.rulers.map((r) => esc(r.name)).join(" · ")}</p>` : ""}
      ${claim(pw.claim)}${pw.rulers.filter((r) => r.note).map((r) => `<p class="cx-small">${esc(r.name)}: ${esc(r.note)}</p>`).join("")}
      <button type="button" class="on-map" data-go-power="${i}">${icon("map", 15)}Raise it on the land</button>`;
  }

  // ── Open questions: each question with its views floating round it, joined by fine lines ──
  function questions() {
    return `<div class="qs">${DV.questions.map((q, qi) => `<div class="qc" data-q="${qi}"><svg class="qc-lines" aria-hidden="true"></svg>
      <p class="qc-q">${esc(q.question)}</p>
      <div class="qc-views">${q.views.map((v, vi) => `<button type="button" class="qc-v" data-q="${qi}" data-v="${vi}"><b>${esc(v.label)}</b><small>${esc(v.holders)}</small></button>`).join("")}</div>
      <div class="qc-arg" hidden></div></div>`).join("")}</div>`;
  }
  function drawLines(panel) {
    panel.querySelectorAll(".qc").forEach((c) => {
      const svg = c.querySelector(".qc-lines"), box = c.getBoundingClientRect(), q = c.querySelector(".qc-q").getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      const sx = q.left - box.left + q.width / 2, sy = q.bottom - box.top + 4;
      svg.innerHTML = [...c.querySelectorAll(".qc-v")].map((v) => {
        const r = v.getBoundingClientRect(), ex = r.left - box.left + r.width / 2, ey = r.top - box.top - 3;
        return `<path d="M${sx.toFixed(1)},${sy.toFixed(1)} C${sx.toFixed(1)},${((sy + ey) / 2).toFixed(1)} ${ex.toFixed(1)},${((sy + ey) / 2).toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}" class="${v.classList.contains("is-on") ? "is-on" : ""}"/><circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="2.2"/>`;
      }).join("") + `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="2.6" class="qc-root"/>`;
    });
  }
  function questionRead(panel, qi, vi) {
    const c = panel.querySelector(`.qc[data-q="${qi}"]`), v = DV.questions[qi].views[vi], arg = c.querySelector(".qc-arg");
    const same = c.querySelector(`.qc-v[data-v="${vi}"]`).classList.contains("is-on");
    c.querySelectorAll(".qc-v").forEach((b) => b.classList.toggle("is-on", !same && Number(b.dataset.v) === vi));
    arg.hidden = same;
    arg.innerHTML = same ? "" : `<p class="qc-who"><b>${esc(v.label)}</b> · held by ${esc(v.holders)}</p>${claim(v.argument)}`;
    drawLines(panel);
  }

  // ── The long memory ──
  let G = null;
  async function loadMemory() {
    if (G) return G;
    const res = await fetch("data/memory.json");
    if (!res.ok) throw new Error(`memory.json: expected 200, got ${res.status}`);
    G = await res.json();
    G.nums = Object.keys(G.books).map(Number).sort((a, b) => a - b);
    let off = 0; G.off = {};
    for (const n of G.nums) { G.off[n] = off; off += G.books[n].chapters; }
    G.total = off;
    G.byBook = {}; G.points.forEach((p, i) => { p.i = i; p.g = G.off[p.b] + p.c - 1; p.f = (p.v - 1) / Math.max(1, p.n - 1); G.byBook[p.b] = (G.byBook[p.b] ?? 0) + 1; });
    return G;
  }
  const SEC = { history: "var(--strip-history)", poetry: "var(--strip-poetry)", prophets: "var(--strip-prophets)", gospels: "var(--strip-gospels)", epistles: "var(--strip-epistles)", revelation: "var(--strip-revelation)" };
  const ref = (p) => `${G.books[p.b].name} ${p.c}:${p.v}`;
  function memorySvg(Wd) {
    const rows = Wd >= 980 ? 3 : Wd >= 640 ? 5 : 8, per = Math.ceil(G.total / rows), cw = Wd / per, rowH = Wd >= 640 ? 96 : 70, callH = Wd >= 640 ? 38 : 0, labH = 22, band = callH + rowH + labH;
    const at = (g) => { const r = Math.floor(g / per); return { r, x: (g - r * per) * cw, top: r * band + callH }; };
    const blocks = [], labels = [];
    G.nums.forEach((n, k) => {
      const b = G.books[n]; let g = G.off[n]; const end = g + b.chapters;
      while (g < end) {
        const a = at(g), stop = Math.min(end, (a.r + 1) * per), w = (stop - g) * cw;
        blocks.push(`<rect class="gm-book ${k % 2 ? "is-odd" : ""} ${G.byBook[n] ? "has" : ""}" data-book="${n}" x="${a.x.toFixed(2)}" y="${a.top}" width="${w.toFixed(2)}" height="${rowH}"><title>${esc(b.name)}${G.byBook[n] ? ` · ${G.byBook[n]} verses name David` : ""}</title></rect><rect class="gm-sec" x="${a.x.toFixed(2)}" y="${a.top + rowH + 2}" width="${Math.max(w - 1, 0.5).toFixed(2)}" height="2" style="fill:${SEC[b.section] ?? "var(--line)"}"/>`);
        if (w > 26 && G.byBook[n]) labels.push(`<text class="gm-bl" x="${(a.x + 2).toFixed(1)}" y="${a.top + rowH + 16}">${esc(b.name.length * 6 + 4 < w ? b.name : b.code)}</text>`);
        g = stop;
      }
    });
    const pts = G.points.map((p) => { const a = at(p.g); p.x = a.x + cw / 2; p.y = a.top + 6 + p.f * (rowH - 12); return `<circle class="gm-pt" data-i="${p.i}" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${Wd >= 640 ? 1.8 : 1.5}"/>`; }).join("");
    const calls = callH ? G.echoes.map((e) => { const p = G.points.find((x) => x.id === e.id), r = at(p.g).r, ty = r * band + 12, left = p.x > Wd - 200; return `<g class="gm-call"><line x1="${p.x.toFixed(1)}" y1="${ty + 6}" x2="${p.x.toFixed(1)}" y2="${(p.y - 4).toFixed(1)}"/><text x="${(p.x + (left ? -4 : 4)).toFixed(1)}" y="${ty}" text-anchor="${left ? "end" : "start"}">“${esc(e.phrase)}”</text></g>`; }).join("") : "";
    return `<svg class="gm-svg" viewBox="0 0 ${Wd.toFixed(0)} ${rows * band}" width="${Wd.toFixed(0)}" height="${rows * band}" role="img" aria-label="Every verse that names David across the books of the Bible">${blocks.join("")}${labels.join("")}${calls}<g class="gm-pts">${pts}</g><circle class="gm-ring" r="7" cx="0" cy="0" visibility="hidden"/></svg>`;
  }
  function memoryRead(host, p) {
    const b = G.books[p.b], chs = {};
    G.points.filter((x) => x.b === p.b).forEach((x) => { chs[x.c] = (chs[x.c] ?? 0) + 1; });
    host.querySelector(".gm-read").innerHTML = `<p class="kicker">${esc(b.name)} · ${G.byBook[p.b]} verse${G.byBook[p.b] > 1 ? "s" : ""} name him</p>
      <h4>${esc(ref(p))}</h4><p class="gm-verse">${esc(p.text)}</p><a class="read" href="/read/kjv/${b.code}/${p.c}?v=${p.v}">${icon("open", 13)}Read the passage</a>
      <p class="cx-sub">Chapters of ${esc(b.name)} that name him</p><div class="gm-chs">${Object.entries(chs).map(([c, n]) => `<a href="/read/kjv/${b.code}/${c}" class="${Number(c) === p.c ? "is-on" : ""}">${c}<small>${n}</small></a>`).join("")}</div>`;
  }
  async function mountMemory(panel) {
    const host = panel.querySelector("#gm");
    try { await loadMemory(); } catch (error) { console.error("kingdom: could not load data/memory.json", error); host.innerHTML = `<p class="cx-small">Could not load the verses: ${esc(error.message)}</p>`; return; }
    if (!host.isConnected) return;
    const books = G.nums.filter((n) => G.byBook[n]).length;
    host.innerHTML = `<p class="gm-sum"><b>${G.points.length}</b> verses in <b>${books}</b> books name David.</p><div class="gm-field"></div><p class="gm-tip" hidden></p><div class="gm-read"></div><p class="cx-small">${esc(G.credit)}</p>`;
    const field = host.querySelector(".gm-field"), tip = host.querySelector(".gm-tip");
    const draw = () => { field.innerHTML = memorySvg(field.clientWidth || 600); };
    draw();
    new ResizeObserver(() => { if (host.isConnected) draw(); }).observe(field);
    field.addEventListener("pointermove", (e) => {
      const c = e.target.closest(".gm-pt"), ring = field.querySelector(".gm-ring");
      if (!c) { tip.hidden = true; ring.setAttribute("visibility", "hidden"); return; }
      const p = G.points[Number(c.dataset.i)], fr = field.getBoundingClientRect();
      ring.setAttribute("cx", p.x); ring.setAttribute("cy", p.y); ring.setAttribute("visibility", "visible");
      tip.hidden = false; tip.textContent = ref(p);
      tip.style.transform = `translate(${Math.min(fr.width - 120, e.clientX - fr.left + 12)}px, ${e.clientY - fr.top - 30}px)`;
    });
    field.addEventListener("pointerleave", () => { tip.hidden = true; });
    field.addEventListener("click", (e) => { const c = e.target.closest(".gm-pt"); if (c) memoryRead(host, G.points[Number(c.dataset.i)]); });
    memoryRead(host, G.points.find((x) => x.id === 10005004) ?? G.points[0]);
  }

  window.CodexDraw = {
    world, questions,
    after(id, panel) {
      if (id === "world") worldRead(panel, 1);
      if (id === "questions") {
        requestAnimationFrame(() => drawLines(panel));
        const ro = new ResizeObserver(() => { if (panel.querySelector(".qs")) drawLines(panel); else ro.disconnect(); });
        ro.observe(panel);
      }
      if (id === "memory") mountMemory(panel);
    },
    // One delegated listener for the codex panel (set once by codex.js).
    onClick(e, panel) {
      const g = e.target.closest(".ws-node"); if (g) { worldRead(panel, Number(g.dataset.ws)); return; }
      const b = e.target.closest("[data-go-power]"); if (b) { Land.showPowers(Number(b.dataset.goPower)); return; }
      const v = e.target.closest(".qc-v"); if (v) questionRead(panel, Number(v.dataset.q), Number(v.dataset.v));
    },
    onKey(e, panel) { const g = e.target.closest(".ws-node"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); worldRead(panel, Number(g.dataset.ws)); } },
  };
})();
