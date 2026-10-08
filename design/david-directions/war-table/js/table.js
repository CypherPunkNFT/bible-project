// The war table: a terrain block standing on a table, drawn in perspective on a canvas. The land is the Atlas's own
// outline (world-atlas 1:10m) raised as a slab above the sea; lakes and rivers come from the street atlas's
// OpenStreetMap tiles; peaks stand on the mountains the Atlas names (not to scale). Pieces rise on light beams from
// their places; moves are arcs through the air between places, in the order the text tells them.
// The scene is set from outside (game.js) each frame; the table only draws and keeps the camera.
(() => {
  const TAU = Math.PI * 2;
  const R = Math.PI / 180;
  window.WarTable = (host) => {
    const map = DV.map;
    host.classList.add("tb");
    host.innerHTML = `<canvas class="tb-canvas" aria-hidden="true"></canvas><div class="tb-labels"></div><div class="tb-edges"></div>`;
    const canvas = host.querySelector("canvas"), ctx = canvas.getContext("2d");
    const labelsEl = host.querySelector(".tb-labels"), edgesEl = host.querySelector(".tb-edges");
    const project = (lon, lat) => [map.translate[0] + map.scale * lon * R, map.translate[1] - map.scale * Math.log(Math.tan(Math.PI / 4 + (lat * R) / 2))];
    // Long straight runs (where the land is cut at the table's edge) are split so the smoothing keeps their corners.
    const land = map.land.map((r) => {
      const o = [];
      for (let i = 0; i < r.length; i += 2) {
        const x = r[i], y = r[i + 1], nx = r[(i + 2) % r.length], ny = r[(i + 3) % r.length], d = Math.hypot(nx - x, ny - y), n = Math.ceil(d / 5);
        for (let k = 0; k < n; k++) o.push([x + ((nx - x) * k) / n, y + ((ny - y) * k) / n]);
      }
      return o;
    });
    // A stipple on the land every twentieth of a degree: it foreshortens with the table and gives the slab a surface.
    const inLand = (x, y) => {
      let inside = false;
      for (const r of land) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside; }
      return inside;
    };
    const stipple = [];
    for (let lat = 29.925; lat < 35.6; lat += 0.05) for (let lon = 33.325; lon < 38; lon += 0.05) { const [x, y] = project(lon, lat); if (inLand(x, y)) stipple.push(x, y); }
    const lakes = map.lakes.map((r) => { const o = []; for (let i = 0; i < r.length; i += 2) o.push([r[i], r[i + 1]]); return o; });
    const rivers = map.rivers.map((r) => { const o = []; for (let i = 0; i < r.length; i += 2) o.push([r[i], r[i + 1]]); return o; });
    const grat = { lon: [], lat: [] };
    for (let lon = 33.5; lon <= 38; lon += 0.5) grat.lon.push({ v: lon, x: project(lon, 30)[0] });
    for (let lat = 30; lat <= 35.5; lat += 0.5) grat.lat.push({ v: lat, y: project(35, lat)[1] });
    const minor = { lon: [], lat: [] }; // a fine survey grid every tenth of a degree, drawn when the camera is close
    for (let lon = 33.4; lon < 38; lon += 0.1) if (Math.abs((lon * 2) % 1) > 0.05 && Math.abs((lon * 2) % 1) < 0.95) minor.lon.push(project(lon, 30)[0]);
    for (let lat = 30; lat < 35.6; lat += 0.1) if (Math.abs((lat * 2) % 1) > 0.05 && Math.abs((lat * 2) % 1) < 0.95) minor.lat.push(project(35, lat)[1]);

    let W = 0, H = 0, dpr = 1, pal = {}, raf = 0;
    const cam = { x: map.w / 2, y: map.h / 2, zoom: 1, yaw: -6 * R, pitch: 54 * R, ax: 0, ay: 0 };
    let scene = { pieces: [], moves: [], pins: [], offboard: [], peakLabels: false };
    let K = {}; // per-frame camera constants

    function readPalette() {
      const cs = getComputedStyle(host), v = (n) => cs.getPropertyValue(n).trim();
      pal = {
        sea1: v("--tb-sea1"), sea2: v("--tb-sea2"), grid: v("--tb-grid"), gridLand: v("--tb-grid-land"), halo: v("--tb-halo"),
        landN: v("--tb-land-n"), landS: v("--tb-land-s"), side1: v("--tb-side1"), side2: v("--tb-side2"), coast: v("--tb-coast"),
        lake: v("--tb-lake"), river: v("--tb-river"), block1: v("--tb-block1"), block2: v("--tb-block2"), shadow: v("--tb-shadow"),
        stipple: v("--tb-stipple"), peakL: v("--tb-peak-light"), peakD: v("--tb-peak-dark"), ink: v("--tb-ink"), dim: v("--tb-dim"), beam: v("--tb-beam"),
        role: { david: v("--r-david"), enemy: v("--r-enemy"), ally: v("--r-ally"), prophet: v("--r-prophet"), ark: v("--r-ark"), rival: v("--r-rival"), house: v("--r-house"), power: v("--r-power"), place: v("--r-place") },
        glow: Number(v("--tb-glow") || 0),
      };
    }

    function resize() {
      const r = host.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      api.onResize?.();
      invalidate();
    }

    // ── Camera ──
    function setup() {
      K = { cy: Math.cos(cam.yaw), sy: Math.sin(cam.yaw), cp: Math.cos(cam.pitch), sp: Math.sin(cam.pitch), k: cam.zoom, D: (1.7 * H) / cam.zoom };
    }
    // Board point (x, y, height z) -> screen [x, y, scale]
    function P(x, y, z = 0) {
      const dx = x - cam.x, dy = y - cam.y;
      const rx = dx * K.cy - dy * K.sy, ry = dx * K.sy + dy * K.cy;
      let depth = ry * K.sp + z * K.cp;
      const sy = ry * K.cp - z * K.sp;
      if (depth > K.D * 0.8) depth = K.D * 0.8;
      const f = K.D / (K.D - depth);
      return [cam.ax + rx * f * K.k, cam.ay + sy * f * K.k, f, depth];
    }
    const slab = () => Math.min(18, Math.max(1.2, 15 / cam.zoom)); // land thickness, board units (about 15 px on screen)

    // The camera that frames these board points inside region {x, y, w, h} (CSS px of the stage).
    function viewFor(points, region, { yaw = cam.yaw, pitch = cam.pitch, minSpan = 230, maxZoom = 7 } = {}) {
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch);
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const [x, y] of points) { const rx = x * cy - y * sy, ry = x * sy + y * cy; x0 = Math.min(x0, rx); x1 = Math.max(x1, rx); y0 = Math.min(y0, ry); y1 = Math.max(y1, ry); }
      const w = Math.max(minSpan, x1 - x0), h = Math.max(minSpan * 0.8, y1 - y0);
      const zoom = Math.max(0.35, Math.min(maxZoom, Math.min(region.w / w, region.h / (h * cp)) * 0.78));
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      // rotate the middle back to board coordinates
      const x = mx * cy + my * sy, y = -mx * sy + my * cy;
      return { x, y, zoom, yaw, pitch, ax: region.x + region.w / 2, ay: region.y + region.h * 0.54 };
    }
    const lerp = (a, b, t) => a + (b - a) * t;
    function lerpCam(a, b, t) {
      // zoom eases on a log scale, and the target travels in screen terms so a long hop pulls back a little
      const z = Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), t));
      const dist = Math.hypot(b.x - a.x, b.y - a.y), lift = Math.sin(Math.PI * t) * Math.min(0.45, dist / 900);
      return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), zoom: z * (1 - lift), yaw: lerp(a.yaw, b.yaw, t), pitch: lerp(a.pitch, b.pitch, t), ax: lerp(a.ax, b.ax, t), ay: lerp(a.ay, b.ay, t) };
    }

    // ── Drawing helpers ──
    function smoothPath(pts, closed = true) {
      const n = pts.length;
      if (n < 3) return;
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (closed) {
        const m0 = mid(pts[n - 1], pts[0]);
        ctx.moveTo(m0[0], m0[1]);
        for (let i = 0; i < n; i++) { const m = mid(pts[i], pts[(i + 1) % n]); ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
        ctx.closePath();
      } else {
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < n - 1; i++) { const m = mid(pts[i], pts[i + 1]); ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
        ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
      }
    }
    const projRing = (ring, z) => ring.map(([x, y]) => P(x, y, z));
    const onScreen = (p, m = 80) => p[0] > -m && p[0] < W + m && p[1] > -m && p[1] < H + m;
    const alpha = (c, a) => `color-mix(in srgb, ${c} ${Math.round(a * 100)}%, transparent)`;

    function drawBlock() {
      const B = 26 / cam.zoom, w = map.w, h = map.h;
      const c = [[0, 0], [w, 0], [w, h], [0, h]];
      const top = c.map(([x, y]) => P(x, y, 0)), bot = c.map(([x, y]) => P(x, y, -B));
      // shadow on the table
      ctx.save();
      ctx.shadowColor = pal.shadow; ctx.shadowBlur = 60 * dpr; ctx.shadowOffsetY = 18 * dpr;
      ctx.fillStyle = pal.block2;
      ctx.beginPath(); bot.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
      ctx.restore();
      // the four sides, farthest first
      const faces = [0, 1, 2, 3].map((i) => { const j = (i + 1) % 4; return { i, j, d: (top[i][3] + top[j][3]) / 2 }; }).sort((a, b) => a.d - b.d);
      for (const f of faces) {
        const g = ctx.createLinearGradient(0, Math.min(top[f.i][1], top[f.j][1]), 0, Math.max(bot[f.i][1], bot[f.j][1]));
        g.addColorStop(0, pal.block1); g.addColorStop(1, pal.block2);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(top[f.i][0], top[f.i][1]); ctx.lineTo(top[f.j][0], top[f.j][1]); ctx.lineTo(bot[f.j][0], bot[f.j][1]); ctx.lineTo(bot[f.i][0], bot[f.i][1]); ctx.closePath(); ctx.fill();
      }
      // the sea surface
      const g = ctx.createLinearGradient(0, Math.min(top[0][1], top[1][1]), 0, Math.max(top[2][1], top[3][1]));
      g.addColorStop(0, pal.sea1); g.addColorStop(1, pal.sea2);
      ctx.fillStyle = g;
      ctx.beginPath(); top.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
      // a fine bright edge round the block's top
      ctx.strokeStyle = pal.coast; ctx.globalAlpha = 0.35; ctx.lineWidth = 1 * dpr; ctx.stroke(); ctx.globalAlpha = 1;
      return top;
    }

    function drawGraticule(z, color, labels) {
      if (cam.zoom > 1.4) {
        ctx.strokeStyle = color; ctx.globalAlpha = Math.min(0.55, (cam.zoom - 1.4) * 0.35); ctx.lineWidth = 0.8 * dpr;
        ctx.beginPath();
        for (const x of minor.lon) { const a = P(x, 0, z), b = P(x, map.h, z); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
        for (const y of minor.lat) { const a = P(0, y, z), b = P(map.w, y, z); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
        ctx.stroke(); ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = color; ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      for (const g of grat.lon) { const a = P(g.x, 0, z), b = P(g.x, map.h, z); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
      for (const g of grat.lat) { const a = P(0, g.y, z), b = P(map.w, g.y, z); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
      ctx.stroke();
      if (!labels) return;
      ctx.fillStyle = pal.dim; ctx.font = `${10 * dpr}px ui-monospace, "Cascadia Mono", Menlo, monospace`; ctx.textAlign = "center"; ctx.textBaseline = "top";
      for (const g of grat.lon) { if (Math.abs(g.v % 1) > 0.01) continue; const p = P(g.x, map.h, 0); if (onScreen(p, -10)) ctx.fillText(`${g.v}°E`, p[0], p[1] + 8 * dpr); }
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      for (const g of grat.lat) { if (Math.abs(g.v % 1) > 0.01) continue; const p = P(0, g.y, 0); if (onScreen(p, -10)) ctx.fillText(`${g.v}°N`, p[0] - 8 * dpr, p[1]); }
    }

    function drawLand() {
      const T = slab();
      const tops = land.map((r) => projRing(r, T)), bots = land.map((r) => projRing(r, 0));
      // shallow-water halo round the coast
      ctx.save();
      ctx.lineJoin = "round";
      for (const [wdt, a] of [[34, 0.07], [18, 0.1], [8, 0.16]]) {
        ctx.strokeStyle = alpha(pal.halo, a); ctx.lineWidth = wdt * dpr;
        ctx.beginPath(); bots.forEach((r) => smoothPath(r)); ctx.stroke();
      }
      ctx.restore();
      // the slab's sides: the outline stacked from the sea up to the top
      const sample = P(cam.x, cam.y, 0), sampleTop = P(cam.x, cam.y, T);
      const steps = Math.max(2, Math.min(12, Math.ceil(Math.abs(sample[1] - sampleTop[1]) / (1.4 * dpr))));
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        ctx.fillStyle = s === 0 ? pal.side2 : pal.side1;
        ctx.beginPath();
        tops.forEach((r, i) => smoothPath(r.map((p, k) => [lerp(bots[i][k][0], p[0], t), lerp(bots[i][k][1], p[1], t)])));
        ctx.fill("evenodd");
      }
      // the top face, greener to the north and sandier to the south (the Atlas's own land tones)
      const n = P(map.w / 2, 0, T), so = P(map.w / 2, map.h, T);
      const g = ctx.createLinearGradient(n[0], n[1], so[0], so[1]);
      g.addColorStop(0, pal.landN); g.addColorStop(1, pal.landS);
      ctx.fillStyle = g;
      ctx.beginPath(); tops.forEach((r) => smoothPath(r)); ctx.fill("evenodd");
      // the same outline again, for clipping what is drawn on the land
      const clip = () => { ctx.beginPath(); tops.forEach((r) => smoothPath(r)); ctx.clip("evenodd"); };
      return { T, clip, tops };
    }

    function drawStipple(T) {
      ctx.fillStyle = pal.stipple;
      const s = Math.max(1, Math.min(2.2, 0.6 + cam.zoom * 0.3)) * dpr;
      for (let i = 0; i < stipple.length; i += 2) {
        const p = P(stipple[i], stipple[i + 1], T);
        if (p[0] < -4 || p[1] < -4 || p[0] > W + 4 || p[1] > H + 4) continue;
        const r = s * Math.min(1.6, p[2]);
        ctx.fillRect(p[0] - r / 2, p[1] - r / 2, r, r);
      }
    }
    function drawWater(T) {
      ctx.fillStyle = pal.lake;
      ctx.beginPath();
      for (const r of lakes) { const pr = projRing(r, T); if (!pr.some((p) => onScreen(p, 200))) continue; pr.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); }
      ctx.fill();
      ctx.strokeStyle = pal.river; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.lineWidth = Math.min(2.6, 0.7 + cam.zoom * 0.18) * dpr;
      ctx.beginPath();
      for (const r of rivers) { const pr = projRing(r, T); if (!pr.some((p) => onScreen(p, 100))) continue; smoothPath(pr, false); }
      ctx.stroke();
    }

    // A square peak on the slab, lit from the north-west. Size is constant on screen; heights are not to scale.
    function drawPeak(pk, T) {
      const big = pk.type === "mountain range" ? 1.5 : pk.type === "hill" ? 0.7 : 1;
      const r = (8 * big) / cam.zoom, h = (17 * big) / cam.zoom / Math.max(0.5, K.sp);
      const [x, y] = pk.xy;
      const apex = P(x, y, T + h);
      if (!onScreen(apex, 40)) return;
      const corners = [0, 1, 2, 3].map((i) => { const a = -cam.yaw + Math.PI / 4 + (i * Math.PI) / 2; return [x + r * Math.cos(a), y + r * Math.sin(a)]; });
      const base = corners.map(([cx, cy]) => P(cx, cy, T));
      const faces = [0, 1, 2, 3].map((i) => { const j = (i + 1) % 4; const mx = (corners[i][0] + corners[j][0]) / 2 - x, my = (corners[i][1] + corners[j][1]) / 2 - y; return { i, j, d: (base[i][3] + base[j][3]) / 2, lit: (-mx - my) / (Math.hypot(mx, my) * 1.414) }; }).sort((a, b) => a.d - b.d);
      for (const f of faces) {
        ctx.fillStyle = f.lit > 0.1 ? pal.peakL : pal.peakD;
        ctx.globalAlpha = f.lit > 0.1 ? 0.95 : 0.85;
        ctx.beginPath(); ctx.moveTo(base[f.i][0], base[f.i][1]); ctx.lineTo(base[f.j][0], base[f.j][1]); ctx.lineTo(apex[0], apex[1]); ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;
      return apex;
    }

    // A move: a 3D arc per leg, drawn up to `draw` (0..1 of the whole path by length).
    const ARC = { march: 0.42, enemy: 0.38, pursuit: 0.3, gift: 0.34, flight: 0.16, procession: 0.12, circuit: 0.14 };
    function legSamples(mv, T) {
      const legs = [];
      let total = 0;
      for (let i = 0; i < mv.pts.length - 1; i++) {
        const [x0, y0] = mv.pts[i], [x1, y1] = mv.pts[i + 1], d = Math.hypot(x1 - x0, y1 - y0);
        const hgt = Math.max(10 / cam.zoom, d * (ARC[mv.kind] ?? 0.3));
        const s = [];
        for (let k = 0; k <= 28; k++) {
          const t = k / 28, z = T + 4 * hgt * t * (1 - t);
          s.push({ x: lerp(x0, x1, t), y: lerp(y0, y1, t), z });
        }
        legs.push({ s, len: Math.max(d, 0.001) }); total += Math.max(d, 0.001);
      }
      return { legs, total };
    }
    function drawMove(mv, T) {
      if (mv.draw <= 0) return null;
      const { legs, total } = legSamples(mv, T);
      const color = pal.role[mv.role] ?? pal.role.david;
      const target = mv.draw * total;
      let acc = 0, tip = null, prev = null;
      const air = [], ground = [];
      for (const leg of legs) {
        const take = Math.min(1, Math.max(0, (target - acc) / leg.len));
        acc += leg.len;
        if (take <= 0) break;
        const n = Math.max(1, Math.round(take * 28));
        const seg = [], gseg = [];
        for (let k = 0; k <= n; k++) {
          const t = Math.min(take, k / 28);
          const idx = t * 28, lo = Math.floor(idx), hi = Math.min(28, lo + 1), f = idx - lo;
          const a = leg.s[lo], b = leg.s[hi];
          const pt = { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), z: lerp(a.z, b.z, f) };
          seg.push(P(pt.x, pt.y, pt.z)); gseg.push(P(pt.x, pt.y, T));
        }
        air.push(seg); ground.push(gseg);
        prev = seg.length > 1 ? seg[seg.length - 2] : prev; tip = seg[seg.length - 1];
      }
      // shadow on the ground
      ctx.save();
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.setLineDash(mv.kind === "flight" || mv.kind === "gift" ? [5 * dpr, 6 * dpr] : mv.kind === "procession" || mv.kind === "circuit" ? [1 * dpr, 6 * dpr] : []);
      ctx.strokeStyle = alpha(pal.ink, 0.18); ctx.lineWidth = 2 * dpr;
      ctx.beginPath(); ground.forEach((g) => g.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])))); ctx.stroke();
      // glow, then the bright core
      ctx.strokeStyle = alpha(color, 0.22 + 0.18 * pal.glow); ctx.lineWidth = 8 * dpr;
      ctx.beginPath(); air.forEach((g) => g.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])))); ctx.stroke();
      ctx.strokeStyle = color; ctx.lineWidth = (mv.kind === "gift" ? 1.8 : 2.6) * dpr;
      ctx.stroke();
      ctx.restore();
      if (tip && prev) {
        const ang = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]), s = 11 * dpr;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(tip[0] + Math.cos(ang) * s, tip[1] + Math.sin(ang) * s);
        ctx.lineTo(tip[0] + Math.cos(ang + 2.5) * s, tip[1] + Math.sin(ang + 2.5) * s);
        ctx.lineTo(tip[0] + Math.cos(ang - 2.5) * s, tip[1] + Math.sin(ang - 2.5) * s); ctx.closePath(); ctx.fill();
        if (mv.draw < 1) {
          const g = ctx.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], 18 * dpr);
          g.addColorStop(0, alpha(color, 0.9)); g.addColorStop(1, alpha(color, 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tip[0], tip[1], 18 * dpr, 0, TAU); ctx.fill();
        }
      }
      return tip;
    }

    function hexagon(x, y, z, r) {
      const pts = [];
      for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3 + Math.PI / 6; pts.push(P(x + r * Math.cos(a), y + r * Math.sin(a), z)); }
      return pts;
    }
    // A piece: a glowing ring on the ground and a beam of light up to its token (the token is an HTML button).
    function drawPiece(pc, T) {
      const color = pal.role[pc.role] ?? pal.role.david;
      const ox = (pc.offset?.[0] ?? 0) * (30 / cam.zoom), oy = (pc.offset?.[1] ?? 0) * (30 / cam.zoom);
      const x = pc.x + ox, y = pc.y + oy;
      const ring = hexagon(x, y, T, (10 / cam.zoom) * (0.4 + 0.6 * Math.min(1, pc.rise * 1.6)));
      ctx.fillStyle = alpha(color, pc.fallen ? 0.08 : 0.2);
      ctx.strokeStyle = alpha(color, pc.fallen ? 0.4 : 0.95); ctx.lineWidth = 1.6 * dpr;
      ctx.beginPath(); ring.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill(); ctx.stroke();
      const L = (pc.height ?? 64) / cam.zoom / Math.max(0.45, K.sp);
      const base = P(x, y, T), top = P(x, y, T + L * pc.rise);
      if (pc.rise > 0.02) {
        const g = ctx.createLinearGradient(base[0], base[1], top[0], top[1]);
        g.addColorStop(0, alpha(color, pc.fallen ? 0.15 : 0.95)); g.addColorStop(1, alpha(color, pc.fallen ? 0.05 : 0.35));
        ctx.strokeStyle = alpha(color, 0.18 + 0.2 * pal.glow); ctx.lineWidth = 9 * dpr; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.lineTo(top[0], top[1]); ctx.stroke();
        ctx.strokeStyle = g; ctx.lineWidth = 2.4 * dpr;
        ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.lineTo(top[0], top[1]); ctx.stroke();
      }
      return { top, base };
    }
    function drawPin(pin, T) {
      const p = P(pin.x, pin.y, T);
      if (!onScreen(p)) return p;
      const color = pal.role[pin.role ?? "place"];
      const r = (pin.state === "current" ? 4.5 : pin.state === "all" ? 4 : 2.6) * dpr;
      ctx.fillStyle = pin.state === "visited" ? alpha(color, 0.55) : color;
      ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.fill();
      if (pin.state !== "visited") { ctx.strokeStyle = alpha(color, 0.45); ctx.lineWidth = 1.2 * dpr; ctx.beginPath(); ctx.arc(p[0], p[1], r + 4 * dpr, 0, TAU); ctx.stroke(); }
      return p;
    }

    // ── HTML labels (tokens are real buttons) ──
    const labelEls = new Map();
    function label(key, html, cls) {
      let el = labelEls.get(key);
      if (!el) {
        el = document.createElement(cls.includes("tb-token") ? "button" : "div");
        if (el.tagName === "BUTTON") el.type = "button";
        el.dataset.key = key;
        labelsEl.append(el);
        labelEls.set(key, el);
      }
      if (el._html !== html) { el.innerHTML = html; el._html = html; }
      if (el.className !== cls) el.className = cls;
      el._seen = true;
      return el;
    }
    function place(el, x, y) { el.style.transform = `translate3d(${(x / dpr).toFixed(1)}px, ${(y / dpr).toFixed(1)}px, 0)`; }

    function draw() {
      raf = 0;
      if (!W) return;
      setup();
      const C = cam.ax, A = cam.ay;
      cam.ax *= dpr; cam.ay *= dpr; K.k = cam.zoom * dpr; K.D = (1.7 * H) / cam.zoom;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const Wc = W, Hc = H; W = canvas.width; H = canvas.height;
      for (const el of labelEls.values()) el._seen = false;
      try {
        drawBlock();
        drawGraticule(0, pal.grid, true);
        const { T, clip } = drawLand();
        drawStipple(T);
        drawWater(T);
        ctx.save(); clip(); drawGraticule(T + 0.01, pal.gridLand, false); ctx.restore();
        ctx.strokeStyle = pal.coast; ctx.lineWidth = 1.1 * dpr; ctx.globalAlpha = 0.8;
        ctx.beginPath(); land.forEach((r) => smoothPath(projRing(r, T))); ctx.stroke(); ctx.globalAlpha = 1;
        // depth-sorted things on the slab: peaks, pins and pieces; their labels are placed afterwards, most important first
        const want = [];
        const items = [];
        for (const pk of map.peaks) items.push({ d: P(pk.xy[0], pk.xy[1], T)[3], f: () => { const ap = drawPeak(pk, T); if (ap && scene.peakLabels) want.push({ key: `pk-${pk.id}`, html: esc(pk.name), cls: "tb-peak", x: ap[0], y: ap[1], prio: 10, r: [-48, -26, 48, -8] }); } });
        for (const pin of scene.pins) items.push({ d: P(pin.x, pin.y, T)[3], f: () => { const p = drawPin(pin, T); if (pin.label && onScreen(p)) { const len = pin.label.replace(/<[^>]+>/g, "").length; want.push({ key: `pin-${pin.key}`, html: pin.label, cls: `tb-pin is-${pin.state}${pin.button ? " is-btn" : ""}`, x: p[0], y: p[1], prio: (pin.state === "current" ? 50 : 30) + (pin.stop ?? 0), r: [6, -18, 12 + len * 7, 4] }); } } });
        items.sort((a, b) => a.d - b.d).forEach((it) => it.f());
        const tips = scene.moves.map((mv) => ({ mv, tip: drawMove(mv, T) }));
        for (const { mv, tip } of tips) if (tip && mv.tipLabel) want.push({ key: `tip-${mv.key}`, html: mv.tipLabel, cls: "tb-tip", x: tip[0], y: tip[1], prio: 90, r: [12, 8, 14 + mv.tipLabel.length * 6.5, 34] });
        const pcs = scene.pieces.map((pc) => ({ pc, d: P(pc.x, pc.y, T)[3] })).sort((a, b) => a.d - b.d);
        for (const { pc } of pcs) {
          if (pc.rise <= 0.001) continue;
          const { top } = drawPiece(pc, T);
          if (!onScreen(top, 60)) continue;
          const nameW = 40 + pc.label.length * 7;
          want.push({ key: `pc-${pc.key}`, piece: pc, x: top[0], y: top[1], prio: 100, r: pc.side === "left" ? [-nameW, -24, 24, 24] : [-24, -24, nameW, 24] });
        }
        const taken = (api.reserved?.() ?? []).slice();
        for (const w of want.sort((a, b) => b.prio - a.prio)) {
          const box = [w.x / dpr + w.r[0], w.y / dpr + w.r[1], w.x / dpr + w.r[2], w.y / dpr + w.r[3]];
          if (w.prio < 100 && taken.some((t) => box[0] < t[2] && box[2] > t[0] && box[1] < t[3] && box[3] > t[1])) continue;
          taken.push(box);
          let el;
          if (w.piece) {
            const pc = w.piece;
            el = label(w.key, `<span class="tk-disc">${icon(pc.icon, 20, 1.7)}</span><span class="tk-name">${esc(pc.label)}</span>`, `tb-token r-${pc.role}${pc.fallen ? " is-fallen" : ""}${pc.active ? " is-active" : ""}${pc.side ? ` is-${pc.side}` : ""}`);
            el.style.setProperty("--rise", pc.rise.toFixed(3));
            el.setAttribute("aria-label", `${pc.label}${pc.place ? `, ${pc.place}` : ""}`);
          } else el = label(w.key, w.html, w.cls);
          place(el, w.x, w.y);
        }
      } catch (error) { console.error("war table: draw failed", error); }
      W = Wc; H = Hc; cam.ax = C; cam.ay = A;
      for (const [k, el] of labelEls) if (!el._seen) { el.remove(); labelEls.delete(k); }
      drawEdges();
    }

    // Places that lie off the table (the Euphrates) get a marker on the stage's edge, pointing their way.
    function drawEdges() {
      setup();
      const html = scene.offboard.map((o, i) => {
        const p = P(o.x, o.y, 0);
        const cx = cam.ax, cy = cam.ay, ang = Math.atan2(p[1] - cy, p[0] - cx);
        const half = 34 + o.label.length * 3.4, m = 18, ex = Math.max(m + half, Math.min(W - m - half - (api.rightInset ?? 0), cx + Math.cos(ang) * 4000)), ey = Math.max(150, Math.min(H - (W < 641 ? 250 : 190), cy + Math.sin(ang) * 4000));
        return `<button type="button" class="tb-edge" data-edge="${i}" style="transform: translate(${ex.toFixed(0)}px, ${ey.toFixed(0)}px); --a:${ang}rad; --o:${o.show ?? 1}"><i>${icon("arrowRight", 18)}</i><span>${esc(o.label)}</span></button>`;
      }).join("");
      if (edgesEl._html !== html) { edgesEl.innerHTML = html; edgesEl._html = html; }
    }

    function invalidate() { if (!raf) raf = requestAnimationFrame(draw); }

    // ── Pointer: drag to pan (mouse and pen), double-click to zoom in ──
    let drag = null;
    canvas.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") return; // touch keeps the page scrolling; the buttons move the table
      drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y };
      canvas.setPointerCapture(e.pointerId);
      host.classList.add("is-dragging");
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dsx = e.clientX - drag.x, dsy = e.clientY - drag.y;
      const c = Math.cos(cam.yaw), s = Math.sin(cam.yaw);
      const rdx = dsx / cam.zoom, rdy = dsy / (cam.zoom * Math.cos(cam.pitch));
      cam.x = drag.cx - (rdx * c + rdy * s);
      cam.y = drag.cy - (-rdx * s + rdy * c);
      clampCam();
      api.onUserMove?.();
      invalidate();
    });
    const endDrag = () => { drag = null; host.classList.remove("is-dragging"); };
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    canvas.addEventListener("dblclick", () => { nudge({ zoom: 1.5 }); });
    function clampCam() {
      cam.x = Math.max(-100, Math.min(map.w + 100, cam.x));
      cam.y = Math.max(-100, Math.min(map.h + 100, cam.y));
      cam.zoom = Math.max(0.3, Math.min(16, cam.zoom));
      cam.pitch = Math.max(20 * R, Math.min(68 * R, cam.pitch));
    }
    // Small eased camera changes for the HUD buttons.
    let nudgeRaf = 0;
    function nudge({ zoom = 1, yaw = 0, pitch = 0 }) {
      const from = { ...cam }, to = { ...cam, zoom: cam.zoom * zoom, yaw: cam.yaw + yaw * R, pitch: cam.pitch + pitch * R };
      const t0 = performance.now(), dur = reduced() ? 1 : 420;
      cancelAnimationFrame(nudgeRaf);
      const step = (now) => {
        const t = easeInOut(clamp01((now - t0) / dur));
        Object.assign(cam, lerpCam(from, to, t)); cam.zoom = Math.exp(lerp(Math.log(from.zoom), Math.log(to.zoom), t));
        clampCam(); invalidate();
        if (t < 1) nudgeRaf = requestAnimationFrame(step);
      };
      nudgeRaf = requestAnimationFrame(step);
      api.onUserMove?.();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const mo = new MutationObserver(() => { readPalette(); invalidate(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    readPalette();

    const api = {
      cam, project, viewFor, lerpCam, nudge, invalidate, labelsEl, edgesEl,
      get size() { return { w: W, h: H }; },
      boardOf: (placeId) => DV.atlas[placeId]?.xy,
      setCam(c) { Object.assign(cam, c); clampCam(); invalidate(); },
      setScene(s) { scene = { pieces: [], moves: [], pins: [], offboard: [], peakLabels: false, ...s }; invalidate(); },
      boardCorners: () => [[0, 0], [map.w, 0], [map.w, map.h], [0, map.h]],
      destroy() { ro.disconnect(); mo.disconnect(); cancelAnimationFrame(raf); cancelAnimationFrame(nudgeRaf); },
    };
    resize();
    return api;
  };
})();
