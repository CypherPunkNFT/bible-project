// The land map: the Atlas's own land outline (map/canaan.json), each tribe drawn as a constellation of the towns
// Joshua gives it (data/tribes.json → land.towns, points from the Atlas with their confidence), joined by fine
// lines (our drawing: the shortest web through the points, not a road or a border), and an optional dashed outline
// labelled approximate. One renderer for every direction.
(() => {
  let uid = 0;
  const R = Math.PI / 180;
  window.project = (lon, lat) => [G.translate[0] + G.scale * lon * R, G.translate[1] - G.scale * Math.log(Math.tan(Math.PI / 4 + (lat * R) / 2))];

  // Towns of a tribe that are points (not regions, rivers or seas), deduplicated, projected. kind: "town" | "border" | "note".
  const POINT = new Set(["settlement", "spring", "hill", "mountain", "mountain pass", "tree", "well", "structure", "gate", "campsite", "ford", "pool", "rock", "altar", "fortification", "stone heap", "cliff"]);
  window.townsOf = (t) => {
    const seen = new Set();
    return (t?.land?.towns ?? []).filter((w) => typeof w.lon === "number" && typeof w.lat === "number" && (!w.type || POINT.has(w.type))).filter((w) => {
      const k = w.placeId ?? `${w.lon},${w.lat}`;
      if (seen.has(k)) return false; seen.add(k); return true;
    }).map((w) => ({ ...w, xy: project(w.lon, w.lat) }));
  };
  // The shortest web joining the points (Prim). Our drawing only.
  const web = (pts) => {
    if (pts.length < 2) return [];
    const inT = new Array(pts.length).fill(false), best = new Array(pts.length).fill(Infinity), from = new Array(pts.length).fill(-1), edges = [];
    best[0] = 0;
    for (let k = 0; k < pts.length; k++) {
      let u = -1;
      for (let i = 0; i < pts.length; i++) if (!inT[i] && (u < 0 || best[i] < best[u])) u = i;
      inT[u] = true;
      if (from[u] >= 0) edges.push([from[u], u]);
      for (let i = 0; i < pts.length; i++) {
        if (inT[i]) continue;
        const d = Math.hypot(pts[i][0] - pts[u][0], pts[i][1] - pts[u][1]);
        if (d < best[i]) { best[i] = d; from[i] = u; }
      }
    }
    return edges;
  };
  const hull = (pts) => {
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (p.length < 3) return p;
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (const q of p.slice().reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  };
  // A smooth closed curve around the points, pushed out by pad (approximate: a drawing aid, never a border).
  const outline = (pts, pad = 9) => {
    if (!pts.length) return "";
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    let h = hull(pts);
    if (h.length < 3) h = [[cx - pad, cy - pad], [cx + pad, cy - pad], [cx + pad, cy + pad], [cx - pad, cy + pad]];
    const o = h.map(([x, y]) => { const d = Math.hypot(x - cx, y - cy) || 1; return [x + ((x - cx) / d) * pad, y + ((y - cy) / d) * pad]; });
    const n = o.length; let d = `M${o[0][0].toFixed(1)},${o[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const p0 = o[(i - 1 + n) % n], p1 = o[i], p2 = o[(i + 1) % n], p3 = o[(i + 2) % n];
      d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d + "Z";
  };
  // The middle of a constellation (median, so one far town does not drag the label away).
  const middle = (pts) => {
    const xs = pts.map((p) => p[0]).sort((a, b) => a - b), ys = pts.map((p) => p[1]).sort((a, b) => a - b);
    return [xs[Math.floor(xs.length / 2)], ys[Math.floor(ys.length / 2)]];
  };
  // The points without far outliers (beyond 2.2 × the median distance from the middle): used to frame and outline.
  const coreOf = (pts) => {
    if (pts.length < 5) return pts;
    const m = middle(pts), d = pts.map((p) => Math.hypot(p[0] - m[0], p[1] - m[1])), med = d.slice().sort((a, b) => a - b)[Math.floor(d.length / 2)];
    return pts.filter((p, i) => d[i] <= Math.max(med * 2.6, 20));
  };
  window.constellation = (t) => {
    const towns = townsOf(t), pts = towns.map((w) => w.xy);
    const edges = web(pts), lens = edges.map(([a, b]) => Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1])).sort((x, y) => x - y);
    const cut = Math.max(24, (lens[Math.floor(lens.length / 2)] ?? 0) * 2.6);
    const core = coreOf(pts);
    return { towns, pts, edges: edges.filter(([a, b]) => Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]) <= cut), outline: outline(core), mid: pts.length ? middle(pts) : null, box: core.length ? boxOf(core, 16) : null };
  };
  window.boxOf = (pts, pad = 30) => {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad;
    return [x0, y0, Math.max(...xs) + pad - x0, Math.max(...ys) + pad - y0];
  };

  // The base map. opts.tribes: which tribes to draw as constellations (ids); opts.labels; opts.mini.
  window.landTribes = () => tribeList().map((t) => t.id).filter((id) => id !== "joseph" && id !== "levi");
  window.LandMap = (host, { tribes = landTribes(), labels = true, mini = false, outlines = false, townLabels = null } = {}) => {
    const id = `cm${++uid}`;
    const grat = [];
    for (let lon = 33; lon <= 38; lon += .5) { const [x] = project(lon, 31); grat.push(`M${x.toFixed(1)},-700V${G.h + 700}`); }
    for (let lat = 29.5; lat <= 34; lat += .5) { const [, y] = project(35, lat); grat.push(`M-700,${y.toFixed(1)}H${G.w + 700}`); }
    const cons = Object.fromEntries(tribes.map((tid) => [tid, constellation(tribeOf(tid))]));
    host.classList.add("cm-host");
    host.innerHTML = `<svg class="cm ${mini ? "cm-mini" : ""}" viewBox="0 0 ${G.w} ${G.h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Map of the land: the towns Joshua gives each tribe">
      <defs>
        <linearGradient id="${id}-land" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="cm-l1"/><stop offset=".55" class="cm-l2"/><stop offset="1" class="cm-l3"/></linearGradient>
        <radialGradient id="${id}-sea" cx="30%" cy="40%" r="80%"><stop offset="0" class="cm-s1"/><stop offset="1" class="cm-s2"/></radialGradient>
        <pattern id="${id}-dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".75" class="cm-dotfill"/></pattern>
        <filter id="${id}-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="5"/></filter>
        <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect x="-700" y="-700" width="${G.w + 1400}" height="${G.h + 1400}" fill="url(#${id}-sea)"/>
      <path class="cm-grat" d="${grat.join("")}" vector-effect="non-scaling-stroke"/>
      <path class="cm-coast" d="${G.land}" filter="url(#${id}-soft)"/>
      <path class="cm-land" d="${G.land}" fill="url(#${id}-land)" vector-effect="non-scaling-stroke"/>
      <path class="cm-dots" d="${G.land}" fill="url(#${id}-dots)"/>
      ${G.lakes.map((d) => `<path class="cm-lake" d="${d}" vector-effect="non-scaling-stroke"/>`).join("")}
      ${G.rivers.map((d) => `<path class="cm-river" d="${d}" vector-effect="non-scaling-stroke"/>`).join("")}
      ${labels ? G.labels.map((l) => `<text class="cm-region is-${l.kind}" x="${l.xy[0]}" y="${l.xy[1]}">${esc(l.name)}</text>`).join("") : ""}
      <g class="cm-under"></g>
      <g class="cm-tribes">${tribes.map((tid) => {
        const c = cons[tid];
        if (!c.pts.length) return "";
        return `<g class="cm-tribe" data-tribe="${esc(tid)}" style="--tone:${tone(tid)}">
          <path class="cm-outline" d="${c.outline}" vector-effect="non-scaling-stroke" ${outlines ? "" : 'data-off="1"'}/>
          <path class="cm-web" d="${c.edges.map(([a, b]) => `M${c.pts[a][0].toFixed(1)},${c.pts[a][1].toFixed(1)}L${c.pts[b][0].toFixed(1)},${c.pts[b][1].toFixed(1)}`).join("")}" vector-effect="non-scaling-stroke"/>
          ${c.towns.map((w, i) => `<g class="cm-town is-${esc(w.kind ?? "town")} ${(w.confidence ?? 0) < .5 ? "is-faint" : ""}" data-i="${i}" transform="translate(${w.xy[0].toFixed(1)} ${w.xy[1].toFixed(1)})"><title>${esc(w.name)}${w.kind === "border" ? " (border point)" : ""}${typeof w.confidence === "number" ? ` · Atlas confidence ${Math.round(w.confidence * 100)}%` : ""}${w.span ? ` · ${refText(w.span)}` : ""}</title><circle class="cm-star"/>${townLabels?.includes(tid) ? `<text class="cm-tlabel" data-c="${w.confidence ?? 0}">${esc(w.name)}</text>` : ""}</g>`).join("")}
          ${labels && c.mid ? `<text class="cm-name" x="${c.mid[0].toFixed(1)}" y="${c.mid[1].toFixed(1)}">${esc(tribeName(tid))}</text>` : ""}
        </g>`;
      }).join("")}</g>
      <g class="cm-over"></g>
    </svg>`;
    const svg = host.querySelector("svg");
    let view = [0, 0, G.w, G.h];
    // Labels never overlap: tribe names are nudged up or down; town labels that would collide are hidden
    // (higher Atlas confidence first). Runs after every settled view.
    let dq = 0;
    const declutter = () => {
      cancelAnimationFrame(dq);
      dq = requestAnimationFrame(() => {
        const k = parseFloat(host.style.getPropertyValue("--cm-k")) || 1, placed = [], pad = 2;
        const hit = (r) => placed.some((q) => r.left < q.right + pad && r.right > q.left - pad && r.top < q.bottom + pad && r.bottom > q.top - pad);
        for (const el of svg.querySelectorAll(".cm-tribe:not(.is-dim) .cm-name")) {
          let best = [0, 0];
          for (const off of [[0, 0], [0, -15], [0, 15], [-40, 0], [40, 0], [0, -30], [0, 30], [-40, -15], [40, 15], [-40, 15], [40, -15], [0, -45], [0, 45]]) {
            el.setAttribute("dx", (off[0] * k).toFixed(2)); el.setAttribute("dy", (off[1] * k).toFixed(2));
            if (!hit(el.getBoundingClientRect())) { best = off; break; }
          }
          el.setAttribute("dx", (best[0] * k).toFixed(2)); el.setAttribute("dy", (best[1] * k).toFixed(2));
          placed.push(el.getBoundingClientRect());
        }
        const towns = [...svg.querySelectorAll(".cm-tlabel")].sort((a, b) => Number(b.dataset.c) - Number(a.dataset.c));
        towns.forEach((el) => el.classList.remove("is-off"));
        for (const el of towns) { const r = el.getBoundingClientRect(); if (hit(r)) el.classList.add("is-off"); else placed.push(r); }
        // Other tribes' names, when one tribe is in focus: shown only where they fit.
        for (const el of svg.querySelectorAll(".cm-tribe.is-dim .cm-name")) { el.removeAttribute("dy"); el.removeAttribute("dx"); el.classList.remove("is-off"); const r = el.getBoundingClientRect(); if (hit(r)) el.classList.add("is-off"); else placed.push(r); }
      });
    };
    const fit = () => {
      const r = host.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const scale = Math.max(r.width / view[2], r.height / view[3]);
      host.style.setProperty("--cm-k", (1 / scale).toFixed(4));
      if (!flying) declutter();
    };
    let flying = false;
    const ro = new ResizeObserver(fit); ro.observe(host);
    let raf = 0;
    const api = {
      svg, cons,
      under: svg.querySelector(".cm-under"), over: svg.querySelector(".cm-over"),
      setView(box) { view = box.slice(); svg.setAttribute("viewBox", view.map((v) => v.toFixed(1)).join(" ")); fit(); },
      get view() { return view; },
      // A viewBox with the host's proportions that shows box inside region {x, y, w, h} (pixels) of the host.
      fit(box, region) {
        const r = host.getBoundingClientRect();
        region = region ?? { x: 0, y: 0, w: r.width, h: r.height };
        const s = Math.min(region.w / box[2], region.h / box[3]), cx = box[0] + box[2] / 2, cy = box[1] + box[3] / 2;
        return [cx - (region.x + region.w / 2) / s, cy - (region.y + region.h / 2) / s, r.width / s, r.height / s];
      },
      // Fly the view to a box over ms (a camera move, no fade).
      fly(to, ms = 900) {
        cancelAnimationFrame(raf);
        const from = view.slice(), t0 = performance.now();
        flying = true;
        const step = (now) => { const k = easeInOut(clamp01((now - t0) / ms)); api.setView(from.map((v, i) => v + (to[i] - v) * k)); if (k < 1) raf = requestAnimationFrame(step); else { flying = false; declutter(); } };
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) { flying = false; api.setView(to); } else raf = requestAnimationFrame(step);
      },
      focus(tid) { svg.querySelectorAll(".cm-tribe").forEach((g) => { g.classList.toggle("is-focus", g.dataset.tribe === tid); g.classList.toggle("is-dim", !!tid && g.dataset.tribe !== tid); }); declutter(); },
      declutter,
      showOutlines(on) { svg.querySelectorAll(".cm-outline").forEach((p) => (on ? p.removeAttribute("data-off") : p.setAttribute("data-off", "1"))); },
      size: () => host.getBoundingClientRect(),
      destroy() { ro.disconnect(); cancelAnimationFrame(raf); },
    };
    requestAnimationFrame(fit);
    return api;
  };
  // The whole land the towns cover (all tribes), used as the guide's opening view.
  window.landBox = () => {
    const pts = landTribes().flatMap((id) => { const c = constellation(tribeOf(id)); return c.box ? [[c.box[0], c.box[1]], [c.box[0] + c.box[2], c.box[1] + c.box[3]]] : []; });
    return pts.length ? boxOf(pts, 10) : [G.w * .3, G.h * .15, G.w * .45, G.h * .7];
  };
})();
