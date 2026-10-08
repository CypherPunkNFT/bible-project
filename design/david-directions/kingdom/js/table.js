// The land table: the Atlas's outline raised as a slab above a dark sea, drawn in perspective on a canvas, started from
// the War table and quietened: no grid, fine lines, no glow except one focal point. Lakes and rivers come from the
// street atlas's OpenStreetMap tiles; peaks stand on mountains the Atlas names (not to scale). On the land stand the
// moments as crystals, the turn's people as small tokens, and moves as arcs between places in the order the text tells.
// The land itself is cached (it only changes when the camera does), so the crystals can turn slowly at little cost.
// Controls (table-controls.js): wheel zooms over the table, left-drag moves, right-drag turns, double-click recentres.
(() => {
  const TAU = Math.PI * 2;
  const R = Math.PI / 180;
  window.LandTable = (host, { compact = false } = {}) => {
    const map = DV.map;
    host.classList.add("tb");
    host.innerHTML = `<canvas class="tb-canvas" aria-hidden="true"></canvas><div class="tb-labels"></div>`;
    const canvas = host.querySelector("canvas"), ctx = canvas.getContext("2d");
    const baseCanvas = document.createElement("canvas"), bctx = baseCanvas.getContext("2d");
    const labelsEl = host.querySelector(".tb-labels");
    const land = map.land.map((r) => {
      const o = [];
      for (let i = 0; i < r.length; i += 2) {
        const x = r[i], y = r[i + 1], nx = r[(i + 2) % r.length], ny = r[(i + 3) % r.length], d = Math.hypot(nx - x, ny - y), n = Math.ceil(d / 5);
        for (let k = 0; k < n; k++) o.push([x + ((nx - x) * k) / n, y + ((ny - y) * k) / n]);
      }
      return o;
    });
    const inLand = (x, y) => {
      let inside = false;
      for (const r of land) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside; }
      return inside;
    };
    // A fine grain on the land (jittered, so it never reads as a grid).
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const grain = [];
    for (let y = 2; y < map.h; y += 7) for (let x = 2; x < map.w; x += 7) { const gx = x + (rnd() - 0.5) * 6, gy = y + (rnd() - 0.5) * 6; if (inLand(gx, gy)) grain.push(gx, gy, rnd()); }
    const lakes = map.lakes.map((r) => { const o = []; for (let i = 0; i < r.length; i += 2) o.push([r[i], r[i + 1]]); return o; });
    const rivers = map.rivers.map((r) => { const o = []; for (let i = 0; i < r.length; i += 2) o.push([r[i], r[i + 1]]); return o; });

    let W = 0, H = 0, dpr = 1, pal = {}, raf = 0, baseKey = "", visible = true, spinT = 0, lastSpin = 0, dead = false;
    const cam = { x: map.w / 2, y: map.h / 2, zoom: 1, yaw: -6 * R, pitch: 50 * R, ax: 0, ay: 0 };
    let scene = { pieces: [], moves: [], pins: [], crystals: [], peakLabels: false, focus: null };
    let K = {};
    const PITCH = [8 * R, 62 * R]; // near the top, to a moderate tilt; never at or below the table

    function readPalette() {
      const cs = getComputedStyle(host), v = (n) => cs.getPropertyValue(n).trim();
      pal = {
        sea1: v("--tb-sea1"), sea2: v("--tb-sea2"), halo: v("--tb-halo"), landN: v("--tb-land-n"), landS: v("--tb-land-s"), side1: v("--tb-side1"), side2: v("--tb-side2"),
        coast: v("--tb-coast"), lake: v("--tb-lake"), river: v("--tb-river"), block1: v("--tb-block1"), block2: v("--tb-block2"), shadow: v("--tb-shadow"), grain: v("--tb-grain"),
        peakL: v("--tb-peak-light"), peakD: v("--tb-peak-dark"), ink: v("--tb-ink"), stem: v("--tb-stem"), light: v("--tb-is-light") === "1",
        role: Object.fromEntries(["david", "enemy", "ally", "prophet", "ark", "rival", "house", "power", "place"].map((k) => [k, v(`--r-${k}`)])),
        kind: Object.fromEntries(DV.kinds.map((k) => [k.id, v(`--k-${k.id}`)])),
      };
      baseKey = "";
    }
    function resize() {
      const r = host.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = baseCanvas.width = Math.round(W * dpr); canvas.height = baseCanvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      api.onResize?.();
      baseKey = ""; invalidate();
    }

    // ── Camera (CSS pixels): P projects a board point to the screen; unproject finds the ground point under the pointer ──
    function setup(scale = 1) {
      K = { cy: Math.cos(cam.yaw), sy: Math.sin(cam.yaw), cp: Math.cos(cam.pitch), sp: Math.sin(cam.pitch), k: cam.zoom * scale, D: (1.7 * H * scale) / cam.zoom, s: scale };
      K.view = [K.sy * K.sp, K.cy * K.sp, K.cp];
    }
    function P(x, y, z = 0) {
      const dx = x - cam.x, dy = y - cam.y;
      const rx = dx * K.cy - dy * K.sy, ry = dx * K.sy + dy * K.cy;
      let depth = ry * K.sp + z * K.cp;
      const sy = ry * K.cp - z * K.sp;
      if (depth > K.D * 0.8) depth = K.D * 0.8;
      const f = K.D / (K.D - depth);
      return [cam.ax * K.s + rx * f * K.k, cam.ay * K.s + sy * f * K.k, f, depth];
    }
    function unproject(sx, sy) {
      setup(1);
      const u = (sy - cam.ay) / K.k, ry = (u * K.D) / (K.cp * K.D + u * K.sp), f = K.D / (K.D - ry * K.sp), rx = (sx - cam.ax) / (K.k * f);
      return [cam.x + rx * K.cy + ry * K.sy, cam.y - rx * K.sy + ry * K.cy];
    }
    const slab = () => Math.min(18, Math.max(1.2, 15 / cam.zoom));
    function viewFor(points, region, { yaw = cam.yaw, pitch = cam.pitch, minSpan = 230, maxZoom = 7 } = {}) {
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch);
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const [x, y] of points) { const rx = x * cy - y * sy, ry = x * sy + y * cy; x0 = Math.min(x0, rx); x1 = Math.max(x1, rx); y0 = Math.min(y0, ry); y1 = Math.max(y1, ry); }
      const w = Math.max(minSpan, x1 - x0), h = Math.max(minSpan * 0.8, y1 - y0);
      const zoom = Math.max(0.35, Math.min(maxZoom, Math.min(region.w / w, region.h / (h * cp)) * 0.78));
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      return { x: mx * cy + my * sy, y: -mx * sy + my * cy, zoom, yaw, pitch: Math.max(PITCH[0], Math.min(PITCH[1], pitch)), ax: region.x + region.w / 2, ay: region.y + region.h * 0.54 };
    }
    const lerp = (a, b, t) => a + (b - a) * t;
    function lerpCam(a, b, t) {
      const z = Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), t));
      const dist = Math.hypot(b.x - a.x, b.y - a.y), lift = Math.sin(Math.PI * t) * Math.min(0.4, dist / 900);
      let dyaw = b.yaw - a.yaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
      return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), zoom: z * (1 - lift), yaw: a.yaw + dyaw * t, pitch: lerp(a.pitch, b.pitch, t), ax: lerp(a.ax, b.ax, t), ay: lerp(a.ay, b.ay, t) };
    }
    function clampCam() {
      cam.x = Math.max(-100, Math.min(map.w + 100, cam.x)); cam.y = Math.max(-100, Math.min(map.h + 100, cam.y));
      cam.zoom = Math.max(0.3, Math.min(16, cam.zoom)); cam.pitch = Math.max(PITCH[0], Math.min(PITCH[1], cam.pitch));
    }

    // ── Drawing helpers ──
    function smoothPath(c, pts, closed = true) {
      const n = pts.length;
      if (n < 3) return;
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (closed) {
        const m0 = mid(pts[n - 1], pts[0]); c.moveTo(m0[0], m0[1]);
        for (let i = 0; i < n; i++) { const m = mid(pts[i], pts[(i + 1) % n]); c.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
        c.closePath();
      } else {
        c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < n - 1; i++) { const m = mid(pts[i], pts[i + 1]); c.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
        c.lineTo(pts[n - 1][0], pts[n - 1][1]);
      }
    }
    const projRing = (ring, z) => ring.map(([x, y]) => P(x, y, z));
    const onScreen = (p, m = 80) => p[0] > -m && p[1] > -m && p[0] < W * dpr + m && p[1] < H * dpr + m;
    const alpha = (c, a) => `color-mix(in srgb, ${c} ${Math.round(a * 100)}%, transparent)`;

    // ── The base: block, sea, land, water, peaks (re-drawn only when the camera, size or theme changes) ──
    let peakTops = [];
    function drawBase(c) {
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
      const B = 22 / cam.zoom, w = map.w, h = map.h, corners = [[0, 0], [w, 0], [w, h], [0, h]];
      const top = corners.map(([x, y]) => P(x, y, 0)), bot = corners.map(([x, y]) => P(x, y, -B));
      c.save(); c.shadowColor = pal.shadow; c.shadowBlur = 70 * dpr; c.shadowOffsetY = 26 * dpr; c.fillStyle = pal.block2;
      c.beginPath(); bot.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); c.restore();
      const faces = [0, 1, 2, 3].map((i) => { const j = (i + 1) % 4; return { i, j, d: (top[i][3] + top[j][3]) / 2 }; }).sort((a, b) => a.d - b.d);
      for (const f of faces) {
        const g = c.createLinearGradient(0, Math.min(top[f.i][1], top[f.j][1]), 0, Math.max(bot[f.i][1], bot[f.j][1]));
        g.addColorStop(0, pal.block1); g.addColorStop(1, pal.block2); c.fillStyle = g;
        c.beginPath(); c.moveTo(top[f.i][0], top[f.i][1]); c.lineTo(top[f.j][0], top[f.j][1]); c.lineTo(bot[f.j][0], bot[f.j][1]); c.lineTo(bot[f.i][0], bot[f.i][1]); c.closePath(); c.fill();
      }
      const g = c.createLinearGradient(0, Math.min(top[0][1], top[1][1]), 0, Math.max(top[2][1], top[3][1]));
      g.addColorStop(0, pal.sea1); g.addColorStop(1, pal.sea2); c.fillStyle = g;
      c.beginPath(); top.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill();
      c.strokeStyle = alpha(pal.coast, 0.22); c.lineWidth = dpr; c.stroke();
      // land: a soft shallow-water edge, the slab's sides, the top face
      const T = slab(), tops = land.map((r) => projRing(r, T)), bots = land.map((r) => projRing(r, 0));
      c.save(); c.lineJoin = "round";
      for (const [wdt, a] of [[26, 0.05], [10, 0.08]]) { c.strokeStyle = alpha(pal.halo, a); c.lineWidth = wdt * dpr; c.beginPath(); bots.forEach((r) => smoothPath(c, r)); c.stroke(); }
      c.restore();
      const sample = P(cam.x, cam.y, 0), sampleTop = P(cam.x, cam.y, T);
      const steps = Math.max(2, Math.min(12, Math.ceil(Math.abs(sample[1] - sampleTop[1]) / (1.4 * dpr))));
      for (let s = 0; s < steps; s++) {
        const t = s / steps; c.fillStyle = s === 0 ? pal.side2 : pal.side1; c.beginPath();
        tops.forEach((r, i) => smoothPath(c, r.map((p, k) => [lerp(bots[i][k][0], p[0], t), lerp(bots[i][k][1], p[1], t)]))); c.fill("evenodd");
      }
      const n = P(map.w / 2, 0, T), so = P(map.w / 2, map.h, T), lg = c.createLinearGradient(n[0], n[1], so[0], so[1]);
      lg.addColorStop(0, pal.landN); lg.addColorStop(1, pal.landS); c.fillStyle = lg;
      c.beginPath(); tops.forEach((r) => smoothPath(c, r)); c.fill("evenodd");
      // grain, water, coast
      c.fillStyle = pal.grain;
      const gs = Math.max(0.8, Math.min(2, 0.5 + cam.zoom * 0.28)) * dpr;
      for (let i = 0; i < grain.length; i += 3) { const p = P(grain[i], grain[i + 1], T); if (p[0] < -4 || p[1] < -4 || p[0] > W * dpr + 4 || p[1] > H * dpr + 4) continue; const r = gs * (0.5 + grain[i + 2]) * Math.min(1.5, p[2]); c.fillRect(p[0] - r / 2, p[1] - r / 2, r, r); }
      c.fillStyle = pal.lake; c.beginPath();
      for (const r of lakes) { const pr = projRing(r, T); if (!pr.some((p) => onScreen(p, 200))) continue; pr.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); }
      c.fill();
      c.strokeStyle = pal.river; c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = Math.min(2.2, 0.6 + cam.zoom * 0.16) * dpr; c.beginPath();
      for (const r of rivers) { const pr = projRing(r, T); if (!pr.some((p) => onScreen(p, 100))) continue; smoothPath(c, pr, false); }
      c.stroke();
      c.strokeStyle = pal.coast; c.lineWidth = 0.9 * dpr; c.globalAlpha = 0.7; c.beginPath(); land.forEach((r) => smoothPath(c, projRing(r, T))); c.stroke(); c.globalAlpha = 1;
      peakTops = [];
      for (const pk of [...map.peaks].sort((a, b) => P(a.xy[0], a.xy[1], T)[3] - P(b.xy[0], b.xy[1], T)[3])) { const ap = drawPeak(c, pk, T); if (ap) peakTops.push({ pk, ap }); }
    }
    function drawPeak(c, pk, T) {
      const big = pk.type === "mountain range" ? 1.4 : pk.type === "hill" ? 0.7 : 1;
      const r = (7 * big) / cam.zoom, h = (14 * big) / cam.zoom / Math.max(0.5, K.sp);
      const [x, y] = pk.xy, apex = P(x, y, T + h);
      if (!onScreen(apex, 40)) return null;
      const corners = [0, 1, 2, 3].map((i) => { const a = -cam.yaw + Math.PI / 4 + (i * Math.PI) / 2; return [x + r * Math.cos(a), y + r * Math.sin(a)]; });
      const base = corners.map(([cx, cy]) => P(cx, cy, T));
      const faces = [0, 1, 2, 3].map((i) => { const j = (i + 1) % 4; const mx = (corners[i][0] + corners[j][0]) / 2 - x, my = (corners[i][1] + corners[j][1]) / 2 - y; return { i, j, d: (base[i][3] + base[j][3]) / 2, lit: (-mx - my) / (Math.hypot(mx, my) * 1.414) }; }).sort((a, b) => a.d - b.d);
      for (const f of faces) { c.fillStyle = f.lit > 0.1 ? pal.peakL : pal.peakD; c.globalAlpha = 0.9; c.beginPath(); c.moveTo(base[f.i][0], base[f.i][1]); c.lineTo(base[f.j][0], base[f.j][1]); c.lineTo(apex[0], apex[1]); c.closePath(); c.fill(); }
      c.globalAlpha = 1;
      return apex;
    }

    // ── What stands on the land ──
    const ARC = { march: 0.42, enemy: 0.38, pursuit: 0.3, gift: 0.34, flight: 0.16, procession: 0.12, circuit: 0.14 };
    function drawMove(mv, T) {
      if (mv.draw <= 0) return null;
      const color = pal.role[mv.role] ?? pal.role.david, legs = [];
      let total = 0;
      for (let i = 0; i < mv.pts.length - 1; i++) { const [x0, y0] = mv.pts[i], [x1, y1] = mv.pts[i + 1], d = Math.max(0.001, Math.hypot(x1 - x0, y1 - y0)); legs.push({ x0, y0, x1, y1, d, hgt: Math.max(10 / cam.zoom, d * (ARC[mv.kind] ?? 0.3)) }); total += d; }
      const target = mv.draw * total, air = [], ground = [];
      let acc = 0, tip = null, prev = null;
      for (const L of legs) {
        const take = Math.min(1, Math.max(0, (target - acc) / L.d)); acc += L.d;
        if (take <= 0) break;
        const n = Math.max(2, Math.round(take * 28)), seg = [], gseg = [];
        for (let k = 0; k <= n; k++) { const t = (k / n) * take, x = lerp(L.x0, L.x1, t), y = lerp(L.y0, L.y1, t); seg.push(P(x, y, T + 4 * L.hgt * t * (1 - t))); gseg.push(P(x, y, T)); }
        air.push(seg); ground.push(gseg); prev = seg[seg.length - 2]; tip = seg[seg.length - 1];
      }
      ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.setLineDash(mv.kind === "flight" || mv.kind === "gift" ? [5 * dpr, 6 * dpr] : mv.kind === "procession" || mv.kind === "circuit" ? [1 * dpr, 6 * dpr] : []);
      ctx.strokeStyle = alpha(pal.ink, 0.16); ctx.lineWidth = 1.6 * dpr; ctx.beginPath(); ground.forEach((g) => g.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])))); ctx.stroke();
      ctx.strokeStyle = color; ctx.lineWidth = (mv.kind === "gift" ? 1.4 : 1.9) * dpr; ctx.beginPath(); air.forEach((g) => g.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])))); ctx.stroke();
      ctx.restore();
      if (tip && prev) {
        const ang = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]), s = 8 * dpr;
        ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(tip[0] + Math.cos(ang) * s, tip[1] + Math.sin(ang) * s);
        ctx.lineTo(tip[0] + Math.cos(ang + 2.55) * s, tip[1] + Math.sin(ang + 2.55) * s); ctx.lineTo(tip[0] + Math.cos(ang - 2.55) * s, tip[1] + Math.sin(ang - 2.55) * s); ctx.closePath(); ctx.fill();
      }
      return tip;
    }
    function drawPiece(pc, T) {
      const color = pal.role[pc.role] ?? pal.role.david;
      const ox = (pc.offset?.[0] ?? 0) * (28 / cam.zoom), oy = (pc.offset?.[1] ?? 0) * (28 / cam.zoom), x = pc.x + ox, y = pc.y + oy;
      const L = (pc.height ?? 58) / cam.zoom / Math.max(0.45, K.sp), base = P(x, y, T), top = P(x, y, T + L * pc.rise);
      ctx.fillStyle = alpha(color, pc.fallen ? 0.25 : 0.85); ctx.beginPath(); ctx.ellipse(base[0], base[1], 3.2 * dpr, 3.2 * dpr * Math.max(0.35, K.cp), 0, 0, TAU); ctx.fill();
      if (pc.rise > 0.02) { ctx.strokeStyle = alpha(color, pc.fallen ? 0.25 : 0.7); ctx.lineWidth = 1.1 * dpr; ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.lineTo(top[0], top[1]); ctx.stroke(); }
      return { top, base };
    }
    function drawPin(pin, T) {
      const p = P(pin.x, pin.y, T);
      if (!onScreen(p)) return p;
      const color = pal.role[pin.role ?? "place"], r = (pin.state === "current" ? 4 : pin.state === "all" ? 3.4 : 2.4) * dpr;
      ctx.fillStyle = pin.state === "visited" ? alpha(color, 0.5) : color; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.fill();
      if (pin.state === "current") { ctx.strokeStyle = alpha(color, 0.5); ctx.lineWidth = dpr; ctx.beginPath(); ctx.arc(p[0], p[1], r + 4 * dpr, 0, TAU); ctx.stroke(); }
      return p;
    }
    // Crystals that share a place stand in a small ring round it.
    function crystalSpots(list) {
      // places closer than a few board units (Jerusalem, Zion, Gihon, the city of David) share one ring
      const groups = [];
      for (const c of list) { if (c.rise <= 0.001) continue; const g = groups.find((x) => Math.hypot(x.x - c.x, x.y - c.y) < 5); if (g) g.items.push(c); else groups.push({ x: c.x, y: c.y, items: [c] }); }
      for (const g of groups) {
        const n = g.items.length;
        g.items.forEach((c, i) => {
          const ring = n <= 7 ? 0 : i < 7 ? 0 : 1, inRing = ring ? n - 7 : Math.min(n, 7), k = ring ? i - 7 : i;
          const rr = n === 1 ? 0 : (ring ? 36 : 15 + Math.min(n, 7) * 1.4) / cam.zoom, a = (k / inRing) * TAU - cam.yaw + ring * 0.4;
          c.sx = g.x + rr * Math.cos(a); c.sy = g.y + rr * Math.sin(a);
        });
      }
    }
    const hits = [];
    function drawCrystal(c, T) {
      const size = (c.selected ? 16 : c.active ? (c.quiet ? 8.5 : 10.5) : 6) * (0.35 + 0.65 * c.rise), r = size / cam.zoom;
      const lift = ((c.active || c.selected ? 30 : 12) * c.rise + Math.sin(spinT * 1.1 + c.seed) * 2 * c.rise) / cam.zoom / Math.max(0.45, K.sp);
      const ground = P(c.sx, c.sy, T), color = pal.kind[c.kind] ?? "#c9a24a";
      const a = c.dim ? 0.32 : 1;
      ctx.fillStyle = alpha(pal.ink, (pal.light ? 0.1 : 0.22) * a); ctx.beginPath(); ctx.ellipse(ground[0], ground[1], r * cam.zoom * 0.6 * dpr, r * cam.zoom * 0.6 * dpr * Math.max(0.3, K.cp), 0, 0, TAU); ctx.fill();
      const S = Crystals.SHAPES[c.kind], zc = T + lift - S.bottom * r;
      if (c.rise > 0.05) { const b = P(c.sx, c.sy, zc + S.bottom * r); ctx.strokeStyle = alpha(color, 0.45 * a); ctx.lineWidth = 0.8 * dpr; ctx.setLineDash([1.5 * dpr, 2.5 * dpr]); ctx.beginPath(); ctx.moveTo(ground[0], ground[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]); }
      if (c.selected) { const m = P(c.sx, c.sy, zc), g = ctx.createRadialGradient(m[0], m[1], 0, m[0], m[1], 34 * dpr); g.addColorStop(0, alpha(color, 0.38)); g.addColorStop(1, alpha(color, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m[0], m[1], 34 * dpr, 0, TAU); ctx.fill(); }
      const out = Crystals.draw(ctx, P, K.view, c.kind, [c.sx, c.sy, zc], r, spinT * 0.5 + c.seed, color, { alpha: a, light: pal.light, lw: 0.8 * dpr });
      hits.push({ key: c.key, x: out.centre[0] / dpr, y: out.centre[1] / dpr, r: Math.max(12, size + 6) });
      return out;
    }

    // ── HTML labels (tokens are real buttons) ──
    const labelEls = new Map();
    function label(key, html, cls) {
      let el = labelEls.get(key);
      if (!el) { el = document.createElement(cls.includes("tb-token") ? "button" : "div"); if (el.tagName === "BUTTON") el.type = "button"; el.dataset.key = key; labelsEl.append(el); labelEls.set(key, el); }
      if (el._html !== html) { el.innerHTML = html; el._html = html; }
      if (el.className !== cls) el.className = cls;
      el._seen = true;
      return el;
    }
    const place = (el, x, y) => { el.style.transform = `translate3d(${(x / dpr).toFixed(1)}px, ${(y / dpr).toFixed(1)}px, 0)`; };

    function draw() {
      raf = 0;
      if (!W) return;
      setup(dpr);
      const key = `${cam.x.toFixed(3)},${cam.y.toFixed(3)},${cam.zoom.toFixed(4)},${cam.yaw.toFixed(4)},${cam.pitch.toFixed(4)},${cam.ax.toFixed(1)},${cam.ay.toFixed(1)},${W},${H}`;
      try {
        if (key !== baseKey) { drawBase(bctx); baseKey = key; }
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(baseCanvas, 0, 0);
        for (const el of labelEls.values()) el._seen = false;
        const T = slab(), want = [];
        hits.length = 0;
        if (scene.peakLabels) for (const { pk, ap } of peakTops) want.push({ key: `pk-${pk.id}`, html: esc(pk.name), cls: "tb-peak", x: ap[0], y: ap[1], prio: 10, r: [-48, -26, 48, -8] });
        for (const pin of [...scene.pins].sort((a, b) => P(a.x, a.y, T)[3] - P(b.x, b.y, T)[3])) {
          const p = drawPin(pin, T);
          if (pin.label && onScreen(p)) { const len = pin.label.replace(/<[^>]+>/g, "").length; want.push({ key: `pin-${pin.key}`, html: pin.label, cls: `tb-pin is-${pin.state}${pin.button ? " is-btn" : ""}`, x: p[0], y: p[1], prio: (pin.state === "current" ? 50 : 30) + (pin.stop ?? 0), r: [6, -18, 12 + len * 7, 4] }); }
        }
        for (const mv of scene.moves) { const tip = drawMove(mv, T); if (tip && mv.tipLabel) want.push({ key: `tip-${mv.key}`, html: mv.tipLabel, cls: "tb-tip", x: tip[0], y: tip[1], prio: 90, r: [12, 8, 14 + mv.tipLabel.length * 6.5, 34] }); }
        crystalSpots(scene.crystals);
        const items = [
          ...scene.crystals.filter((c) => c.rise > 0.001).map((c) => ({ c, d: P(c.sx, c.sy, T)[3] })),
          ...scene.pieces.filter((pc) => pc.rise > 0.001).map((pc) => ({ pc, d: P(pc.x, pc.y, T)[3] })),
        ].sort((a, b) => a.d - b.d);
        for (const it of items) {
          if (it.c) {
            const out = drawCrystal(it.c, T);
            if (it.c.label && !it.c.quiet && (it.c.active || it.c.selected) && onScreen(out.top, 40)) want.push({ key: `cr-${it.c.key}`, html: esc(it.c.label), cls: `tb-cr${it.c.selected ? " is-sel" : ""}`, x: out.top[0], y: out.top[1], prio: it.c.selected ? 95 : 60, r: [-60, -30, 60, -10] });
          } else {
            const pc = it.pc, { top } = drawPiece(pc, T);
            if (!onScreen(top, 60)) continue;
            const nameW = 34 + pc.label.length * 6.6;
            want.push({ key: `pc-${pc.key}`, piece: pc, x: top[0], y: top[1], prio: 100, r: pc.side === "left" ? [-nameW, -18, 18, 18] : [-18, -18, nameW, 18] });
          }
        }
        const taken = (api.reserved?.() ?? []).slice();
        for (const w of want.sort((a, b) => b.prio - a.prio)) {
          const box = [w.x / dpr + w.r[0], w.y / dpr + w.r[1], w.x / dpr + w.r[2], w.y / dpr + w.r[3]];
          if (w.prio < 100 && taken.some((t) => box[0] < t[2] && box[2] > t[0] && box[1] < t[3] && box[3] > t[1])) continue;
          taken.push(box);
          let el;
          if (w.piece) {
            const pc = w.piece;
            el = label(w.key, `<span class="tk-disc">${icon(pc.icon, 15, 1.7)}</span><span class="tk-name">${esc(pc.label)}</span>`, `tb-token r-${pc.role}${pc.fallen ? " is-fallen" : ""}${pc.side ? ` is-${pc.side}` : ""}`);
            el.style.setProperty("--rise", pc.rise.toFixed(3));
            el.setAttribute("aria-label", `${pc.label}${pc.place ? `, ${pc.place}` : ""}`);
          } else el = label(w.key, w.html, w.cls);
          place(el, w.x, w.y);
        }
      } catch (error) { console.error("land table: draw failed", error); }
      for (const [k, el] of labelEls) if (!el._seen) { el.remove(); labelEls.delete(k); }
    }
    function invalidate() { if (!raf) raf = requestAnimationFrame(draw); }

    // The crystals turn slowly while the table is on screen (about 30 frames a second; only the crystals redraw).
    function spinLoop(now) {
      if (dead) return;
      requestAnimationFrame(spinLoop);
      if (!visible || document.hidden || !scene.crystals.length || reduced()) return;
      if (now - lastSpin < 33) return;
      spinT += Math.min(0.1, (now - (lastSpin || now)) / 1000); lastSpin = now;
      invalidate();
    }
    requestAnimationFrame(spinLoop);
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; lastSpin = 0; });
    io.observe(host);

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const mo = new MutationObserver(() => { readPalette(); invalidate(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    readPalette();

    const api = {
      cam, viewFor, lerpCam, invalidate, labelsEl, canvas, host, unproject, clampCam, PITCH, compact,
      get size() { return { w: W, h: H }; },
      setCam(c) { Object.assign(cam, c); clampCam(); invalidate(); },
      setScene(s) { scene = { pieces: [], moves: [], pins: [], crystals: [], peakLabels: false, ...s }; invalidate(); },
      hitCrystal(x, y) { let best = null, bd = Infinity; for (const h of hits) { const d = Math.hypot(h.x - x, h.y - y); if (d < h.r && d < bd) { bd = d; best = h; } } return best?.key ?? null; },
      boardCorners: () => [[0, 0], [map.w, 0], [map.w, map.h], [0, map.h]],
      destroy() { dead = true; ro.disconnect(); mo.disconnect(); io.disconnect(); cancelAnimationFrame(raf); api.controls?.destroy(); },
    };
    resize();
    api.controls = TableControls(api);
    return api;
  };
})();
