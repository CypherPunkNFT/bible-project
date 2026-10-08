// The journey map: the Atlas's own land outline (world-atlas 1:10m, projected by the extractor), the places from
// data/places.json, and a route that lights stop by stop. One renderer for all four directions.
(() => {
  let uid = 0;
  const R = Math.PI / 180;
  const project = (lon, lat) => [M.map.translate[0] + M.map.scale * lon * R, M.map.translate[1] - M.map.scale * Math.log(Math.tan(Math.PI / 4 + (lat * R) / 2))];
  // Route geometry: one quadratic curve per leg, bowed a little so out-and-back legs do not overlap.
  function legs() {
    const st = M.map.route, out = [];
    for (let i = 0; i < st.length - 1; i++) {
      const [x0, y0] = st[i].xy, [x1, y1] = st[i + 1].xy, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
      const bow = len < 1 ? 0 : (i % 2 ? 1 : -1) * Math.min(.18 * len, 46);
      const c = [(x0 + x1) / 2 - (dy / (len || 1)) * bow, (y0 + y1) / 2 + (dx / (len || 1)) * bow];
      const at = (t) => [(1 - t) ** 2 * x0 + 2 * (1 - t) * t * c[0] + t * t * x1, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * c[1] + t * t * y1];
      let L = 0, prev = [x0, y0]; const table = [0];
      for (let k = 1; k <= 24; k++) { const p = at(k / 24); L += Math.hypot(p[0] - prev[0], p[1] - prev[1]); table.push(L); prev = p; }
      out.push({ i, act: st[i + 1].act, d: `Q${c[0].toFixed(1)},${c[1].toFixed(1)} ${x1},${y1}`, from: [x0, y0], len: L, table, at });
    }
    return out;
  }
  // The point a fraction f along a leg, by arc length.
  const along = (leg, f) => {
    const target = f * leg.len, k = leg.table.findIndex((v) => v >= target);
    if (k <= 0) return leg.at(0);
    const a = leg.table[k - 1], b = leg.table[k], t = (k - 1 + (target - a) / (b - a || 1)) / 24;
    return leg.at(t);
  };

  // Which side of its dot a stop's label sits, so neighbours do not collide.
  const SIDE = { Egypt: "l", Rameses: "l", Rephidim: "l", Horeb: "b", Succoth: "l", Etham: "b", Elim: "b", "Plains of Moab": "l" };
  window.MosesMap = (host, { mini = false, act = 0, labels = true } = {}) => {
    const id = `mm${++uid}`, map = M.map, L = legs();
    const acts = [2, 3].map((a) => {
      const mine = L.filter((l) => l.act === a), start = mine[0].i;
      const d = `M${mine[0].from.join(",")}` + mine.map((l) => l.d).join("");
      return { act: a, first: start, last: start + mine.length, d, len: mine.reduce((s, l) => s + l.len, 0) };
    });
    // One dot per location; stops that share a point share a dot and a label.
    const spots = [];
    map.route.forEach((s, i) => {
      const hit = spots.find((p) => Math.hypot(p.xy[0] - s.xy[0], p.xy[1] - s.xy[1]) < 2);
      if (hit) { hit.idx.push(i); if (!hit.names.includes(s.name)) hit.names.push(s.name); } else spots.push({ xy: s.xy, idx: [i], names: [s.name], act: s.act, minor: !["Egypt", "Midian", "Horeb", "Rameses", "Marah", "Rephidim", "Kadesh-barnea", "Mount Nebo"].includes(s.name) });
    });
    const grat = [];
    for (let lon = 24; lon <= 41; lon++) { const [x] = project(lon, 30); grat.push(`M${x.toFixed(1)},-900V${map.h + 900}`); }
    for (let lat = 24; lat <= 36; lat += 1) { const [, y] = project(32, lat); grat.push(`M-1200,${y.toFixed(1)}H${map.w + 1200}`); }
    host.classList.add("mm-host");
    host.innerHTML = `<svg class="mm ${mini ? "mm-mini" : ""}" viewBox="0 0 ${map.w} ${map.h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Map of Moses' journeys: Egypt, Midian, Sinai and Moab">
      <defs>
        <linearGradient id="${id}-land" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="mm-l1"/><stop offset=".55" class="mm-l2"/><stop offset="1" class="mm-l3"/></linearGradient>
        <radialGradient id="${id}-sea" cx="45%" cy="40%" r="75%"><stop offset="0" class="mm-s1"/><stop offset="1" class="mm-s2"/></radialGradient>
        <pattern id="${id}-dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".75" class="mm-dotfill"/></pattern>
        <filter id="${id}-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="5"/></filter>
        <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        ${acts.map((a) => `<mask id="${id}-m${a.act}" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="5000" height="5000"><path class="mm-mask" data-act="${a.act}" d="${a.d}" pathLength="${a.len.toFixed(1)}" stroke-dasharray="${a.len.toFixed(1)} ${a.len.toFixed(1)}" stroke-dashoffset="${a.len.toFixed(1)}"/></mask>`).join("")}
      </defs>
      <rect x="-1200" y="-900" width="${map.w + 2400}" height="${map.h + 1800}" fill="url(#${id}-sea)"/>
      <path class="mm-grat" d="${grat.join("")}" vector-effect="non-scaling-stroke"/>
      <path class="mm-coast" d="${map.land}" filter="url(#${id}-soft)"/>
      <path class="mm-land" d="${map.land}" fill="url(#${id}-land)" vector-effect="non-scaling-stroke"/>
      <path class="mm-dots" d="${map.land}" fill="url(#${id}-dots)"/>
      ${map.lakes.map((d) => `<path class="mm-lake" d="${d}" vector-effect="non-scaling-stroke"/>`).join("")}
      ${map.rivers.map((d) => `<path class="mm-river" d="${d}" vector-effect="non-scaling-stroke"/>`).join("")}
      ${labels ? map.labels.map((l) => `<text class="mm-region ${l.kind === "sea" ? "is-sea" : ""}" x="${l.xy[0]}" y="${l.xy[1]}">${esc(l.name)}</text>`).join("") : ""}
      ${acts.map((a) => `<path class="mm-ghost" data-act="${a.act}" d="${a.d}" vector-effect="non-scaling-stroke"/>`).join("")}
      ${acts.map((a) => `<path class="mm-lit" data-act="${a.act}" d="${a.d}" mask="url(#${id}-m${a.act})" filter="url(#${id}-glow)" vector-effect="non-scaling-stroke"/>`).join("")}
      ${map.markers.map((m) => `<g class="mm-marker is-${m.kind}" data-place="${m.placeId}" transform="translate(${m.xy[0]} ${m.xy[1]})"><circle class="mm-mk"/>${m.kind === "water" && labels ? `<text class="mm-mk-label" y="-14">${esc(m.name)}</text>` : ""}</g>`).join("")}
      ${spots.map((s, k) => `<g class="mm-stop ${s.minor ? "is-minor" : ""}" data-side="${SIDE[s.names[0]] ?? "r"}" data-spot="${k}" data-idx="${s.idx.join(" ")}" data-act="${s.act}" data-place="${map.route[s.idx[0]].placeId}" transform="translate(${s.xy[0]} ${s.xy[1]})">
        <circle class="mm-halo"/><circle class="mm-dot"/>${labels ? `<text class="mm-label" x="0" y="0">${esc(s.names.join(" · "))}</text>` : ""}</g>`).join("")}
      <g class="mm-walker" transform="translate(${map.route[0].xy.join(" ")})"><circle class="mm-walker-halo"/><circle class="mm-walker-dot"/></g>
    </svg>`;
    const svg = host.querySelector("svg"), walker = svg.querySelector(".mm-walker");
    const masks = acts.map((a) => svg.querySelector(`.mm-mask[data-act="${a.act}"]`));
    const stopsEl = [...svg.querySelectorAll(".mm-stop")];
    let view = [0, 0, map.w, map.h];
    const fit = () => {
      const r = host.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const scale = Math.max(r.width / view[2], r.height / view[3]);
      host.style.setProperty("--mm-k", (1 / scale).toFixed(4));
    };
    const ro = new ResizeObserver(fit); ro.observe(host);

    const api = {
      svg, stops: map.route,
      // t: position along the road in stop units (0 = first stop, n-1 = Nebo).
      setProgress(t) {
        const n = map.route.length - 1; t = Math.max(0, Math.min(n, t));
        acts.forEach((a, k) => {
          let lit = 0;
          for (const l of L.filter((x) => x.act === a.act)) lit += l.len * clamp01(t - l.i);
          masks[k].style.strokeLinecap = "";
          masks[k].setAttribute("stroke-dasharray", `${a.len.toFixed(1)} ${a.len.toFixed(1)}`);
          masks[k].setAttribute("stroke-dashoffset", (a.len - lit).toFixed(2));
        });
        const i = Math.min(n - 1, Math.floor(t)), f = t - i, pt = along(L[i], f);
        walker.setAttribute("transform", `translate(${pt[0].toFixed(1)} ${pt[1].toFixed(1)})`);
        const cur = Math.round(t);
        stopsEl.forEach((el) => {
          const idx = el.dataset.idx.split(" ").map(Number);
          el.classList.toggle("is-reached", idx.some((x) => x <= t + .02));
          el.classList.toggle("is-current", idx.includes(cur) && Math.abs(t - cur) < .35);
        });
        svg.dataset.act = String(map.route[cur].act);
      },
      // Lights only the stretch of road from t0 to t1 (stop units); the walker stands at t1.
      setRange(t0, t1) {
        const n = map.route.length - 1; t0 = Math.max(0, Math.min(n, t0)); t1 = Math.max(t0, Math.min(n, t1));
        acts.forEach((a, k) => {
          const litAt = (t) => L.filter((x) => x.act === a.act).reduce((s, l) => s + l.len * clamp01(t - l.i), 0);
          const s0 = litAt(t0), s1 = litAt(t1);
          // One dash from s0 to s1; square ends, so an empty stretch leaves no round dot behind.
          masks[k].style.strokeLinecap = "butt";
          masks[k].setAttribute("stroke-dasharray", `${Math.max(0, s1 - s0).toFixed(2)} ${(a.len * 2).toFixed(1)}`);
          masks[k].setAttribute("stroke-dashoffset", (-s0).toFixed(2));
        });
        const i = Math.min(n - 1, Math.floor(t1)), pt = along(L[i], t1 - i);
        walker.setAttribute("transform", `translate(${pt[0].toFixed(1)} ${pt[1].toFixed(1)})`);
        const cur = Math.round(t1);
        stopsEl.forEach((el) => {
          const idx = el.dataset.idx.split(" ").map(Number);
          el.classList.toggle("is-reached", idx.some((x) => x >= t0 - .02 && x <= t1 + .02));
          el.classList.toggle("is-current", idx.includes(cur) && Math.abs(t1 - cur) < .35);
        });
        svg.dataset.act = String(map.route[cur].act);
      },
      setView(box) { view = box; svg.setAttribute("viewBox", box.map((v) => v.toFixed(1)).join(" ")); fit(); },
      // The box around one act's stops (0 = everything), with room around it.
      viewFor(a) {
        let x0, y0, w, h;
        if (map.views[a]) [x0, y0, w, h] = map.views[a];
        else {
          const xs = map.route.map((s) => s.xy[0]), ys = map.route.map((s) => s.xy[1]), pad = 80;
          x0 = Math.min(...xs) - pad; y0 = Math.min(...ys) - pad; w = Math.max(...xs) + pad - x0; h = Math.max(...ys) + pad - y0;
        }
        const ratio = map.w / map.h, W = Math.max(w, h * ratio), H = W / ratio;
        return [x0 + w / 2 - W / 2, y0 + h / 2 - H / 2, W, H];
      },
      // A viewBox (with the host's own proportions) that shows box inside region {x, y, w, h} of the host, in pixels.
      fit(box, region) {
        const r = host.getBoundingClientRect(), s = Math.min(region.w / box[2], region.h / box[3]);
        const cx = box[0] + box[2] / 2, cy = box[1] + box[3] / 2;
        return [cx - (region.x + region.w / 2) / s, cy - (region.y + region.h / 2) / s, r.width / s, r.height / s];
      },
      size: () => host.getBoundingClientRect(),
      lerpView: (a, b, t) => a.map((v, i) => v + (b[i] - v) * t),
      get view() { return view; },
      pulse(placeId) { svg.querySelectorAll("[data-place]").forEach((g) => g.classList.toggle("is-pulse", g.dataset.place === placeId)); },
      destroy() { ro.disconnect(); },
    };
    api.setProgress(0);
    requestAnimationFrame(fit);
    return api;
  };
  // The stop index where each scene's place first appears (for scroll-driven drawing).
  window.stopIndexFor = (placeId, after = 0) => {
    const i = M.map.route.findIndex((s, k) => k >= after && s.placeId === placeId);
    return i;
  };
})();
