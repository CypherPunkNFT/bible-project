// Crystals: the Life helix's eight shapes (one per kind, so colour is never the only signal), as small polyhedra drawn
// with the land table's own perspective. Each shape is a convex solid centred on the origin, z up; faces are oriented
// outward once, here, so drawing only needs a dot product to know which faces look at the camera.
(() => {
  const norm = ([x, y, z]) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // Newell's method: robust for any planar polygon, convex or not.
  function newell(pts) {
    const n = [0, 0, 0];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      n[0] += (a[1] - b[1]) * (a[2] + b[2]); n[1] += (a[2] - b[2]) * (a[0] + b[0]); n[2] += (a[0] - b[0]) * (a[1] + b[1]);
    }
    return norm(n);
  }
  function solid(v, faces) {
    const f = faces.map((idx) => {
      const pts = idx.map((i) => v[i]);
      const c = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]);
      let n = newell(pts);
      if (dot(n, c) < 0) { idx = [...idx].reverse(); n = n.map((x) => -x); }
      return { idx, n };
    });
    const top = Math.max(...v.map((p) => p[2])), bottom = Math.min(...v.map((p) => p[2]));
    return { v, f, top, bottom };
  }
  const scale = (v, sx, sy, sz) => v.map(([x, y, z]) => [x * sx, y * sy, z * sz]);
  const rotY = (v, a) => v.map(([x, y, z]) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]);

  // Octahedron (stretched for the anointing and the shard)
  const OCT_V = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const OCT_F = [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]];
  // Icosahedron, and the dodecahedron as its dual
  const t = (1 + Math.sqrt(5)) / 2;
  const ICO_V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm);
  const ICO_F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  function dodeca() {
    const centres = ICO_F.map((f) => norm(f.reduce((s, i) => [s[0] + ICO_V[i][0], s[1] + ICO_V[i][1], s[2] + ICO_V[i][2]], [0, 0, 0])));
    const faces = ICO_V.map((vert, vi) => {
      const around = ICO_F.map((f, fi) => (f.includes(vi) ? fi : -1)).filter((x) => x >= 0);
      // order the five face centres round the vertex
      const n = vert, ref = norm(sub(centres[around[0]], n.map((x) => x * dot(centres[around[0]], n))));
      const ref2 = [n[1] * ref[2] - n[2] * ref[1], n[2] * ref[0] - n[0] * ref[2], n[0] * ref[1] - n[1] * ref[0]];
      return around.sort((a, b) => Math.atan2(dot(centres[a], ref2), dot(centres[a], ref)) - Math.atan2(dot(centres[b], ref2), dot(centres[b], ref)));
    });
    return solid(centres, faces);
  }
  function prism(n, r, h, rot = 0) {
    const v = [];
    for (let i = 0; i < n; i++) { const a = rot + (i / n) * Math.PI * 2; v.push([r * Math.cos(a), r * Math.sin(a), h / 2]); }
    for (let i = 0; i < n; i++) { const a = rot + (i / n) * Math.PI * 2; v.push([r * Math.cos(a), r * Math.sin(a), -h / 2]); }
    const f = [Array.from({ length: n }, (_, i) => i), Array.from({ length: n }, (_, i) => n + i)];
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; f.push([i, j, n + j, n + i]); }
    return { v, f };
  }
  function star() {
    // a five-point star standing upright (in the x–z plane), extruded a little in y
    const v = [], d = 0.22;
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.42 : 1; v.push([r * Math.cos(a), d, r * Math.sin(a)]); }
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.42 : 1; v.push([r * Math.cos(a), -d, r * Math.sin(a)]); }
    const f = [Array.from({ length: 10 }, (_, i) => i), Array.from({ length: 10 }, (_, i) => 10 + i)];
    for (let i = 0; i < 10; i++) { const j = (i + 1) % 10; f.push([i, j, 10 + j, 10 + i]); }
    // the star is not convex: orient its faces by hand (front and back by y, sides outward from the axis)
    const faces = f.map((idx, k) => {
      const pts = idx.map((i) => v[i]);
      let n = newell(pts);
      const c = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]);
      const out = k === 0 ? [0, 1, 0] : k === 1 ? [0, -1, 0] : [c[0], 0, c[2]];
      if (dot(n, out) < 0) { idx = [...idx].reverse(); n = n.map((x) => -x); }
      return { idx, n };
    });
    return { v, f: faces, top: 1, bottom: -1 };
  }
  const box = () => { const v = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map((p) => p.map((x) => x * 0.62));
    return solid(v, [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]); };
  const spike = () => solid([[0, 0, 1.5], [0.62, 0, -0.55], [-0.31, 0.54, -0.55], [-0.31, -0.54, -0.55]], [[0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]]);
  const hexP = prism(6, 0.66, 1.05);

  const SHAPES = {
    anointing: solid(scale(OCT_V, 0.6, 0.6, 1.35), OCT_F),
    battle: spike(),
    building: box(),
    worship: solid(scale(ICO_V, 0.85, 0.85, 0.85), ICO_F),
    family: (() => { const d = dodeca(); return solid(scale(d.v, 0.86, 0.86, 0.86), d.f.map((x) => x.idx)); })(),
    sin: solid(rotY(scale(OCT_V, 0.42, 0.55, 1.5), 0.22), OCT_F),
    word: star(),
    court: solid(hexP.v, hexP.f),
  };

  const L = norm([-0.45, -0.6, 0.75]); // light from the north-west, above
  const rgb = (hex) => { const h = hex.replace("#", ""); const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

  // Draw one crystal. project(x, y, z) -> [sx, sy, f, depth] in canvas pixels; view = unit vector toward the camera
  // (board coordinates); at = [x, y, z] of its centre; r = radius in board units; spin = turn about the vertical axis.
  function draw(ctx, project, view, kind, at, r, spin, color, opts = {}) {
    const S = SHAPES[kind];
    if (!S) throw new Error(`crystals: unknown kind "${kind}"`);
    const cs = Math.cos(spin), sn = Math.sin(spin);
    const world = S.v.map(([x, y, z]) => [at[0] + (x * cs - y * sn) * r, at[1] + (x * sn + y * cs) * r, at[2] + z * r]);
    const scr = world.map((p) => project(p[0], p[1], p[2]));
    const base = rgb(color), dark = mix(base, [0, 0, 0], opts.light ? 0.45 : 0.62), lit = mix(base, [255, 255, 255], 0.38);
    const faces = [];
    for (const f of S.f) {
      const n = [f.n[0] * cs - f.n[1] * sn, f.n[0] * sn + f.n[1] * cs, f.n[2]];
      if (dot(n, view) <= 0.02) continue;
      const depth = f.idx.reduce((s, i) => s + scr[i][3], 0) / f.idx.length;
      faces.push({ f, n, depth });
    }
    faces.sort((a, b) => a.depth - b.depth);
    const alpha = opts.alpha ?? 1;
    ctx.lineJoin = "round";
    for (const { f, n } of faces) {
      const k = Math.max(0, dot(n, L));
      const c = k > 0.55 ? mix(base, lit, (k - 0.55) / 0.45) : mix(dark, base, k / 0.55);
      ctx.beginPath();
      f.idx.forEach((i, j) => (j ? ctx.lineTo(scr[i][0], scr[i][1]) : ctx.moveTo(scr[i][0], scr[i][1])));
      ctx.closePath();
      ctx.fillStyle = css(c, 0.94 * alpha);
      ctx.fill();
      ctx.strokeStyle = opts.light ? css(mix(base, [0, 0, 0], 0.35), 0.55 * alpha) : css(mix(base, [255, 255, 255], 0.55), 0.5 * alpha);
      ctx.lineWidth = opts.lw ?? 0.8;
      ctx.stroke();
    }
    return { top: project(at[0], at[1], at[2] + S.top * r), bottom: project(at[0], at[1], at[2] + S.bottom * r), centre: project(at[0], at[1], at[2]) };
  }

  // A small flat drawing of the shape for the filter chips and lists (SVG, faces shaded the same way, seen from the side).
  function svg(kind, size = 26) {
    const S = SHAPES[kind];
    const view = norm([0.35, 0.55, 0.45]);
    const spin = 0.5, cs = Math.cos(spin), sn = Math.sin(spin);
    const pr = ([x, y, z]) => { const rx = x * cs - y * sn, ry = x * sn + y * cs; return [rx * 0.86 - ry * 0.32, -(z * 0.9) + ry * 0.28 + rx * 0.12]; };
    const pts = S.v.map(pr);
    const faces = S.f.map((f) => { const n = [f.n[0] * cs - f.n[1] * sn, f.n[0] * sn + f.n[1] * cs, f.n[2]]; return { f, n, d: f.idx.reduce((s, i) => s + dot(S.v[i], view), 0) }; })
      .filter((x) => dot(x.n, view) > 0.02).sort((a, b) => a.d - b.d);
    const poly = faces.map(({ f, n }) => { const k = Math.max(0, dot(n, L)); const o = (0.18 + 0.7 * k).toFixed(2);
      return `<polygon points="${f.idx.map((i) => pts[i].map((v) => (v * 9).toFixed(1)).join(",")).join(" ")}" fill="currentColor" fill-opacity="${o}" stroke="currentColor" stroke-opacity=".9" stroke-width=".7" stroke-linejoin="round"/>`; }).join("");
    return `<svg class="gem" viewBox="-14 -14 28 28" width="${size}" height="${size}" aria-hidden="true">${poly}</svg>`;
  }

  window.Crystals = { draw, svg, SHAPES };
})();
