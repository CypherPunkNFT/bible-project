var PreachersArc = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // <stdin>
  var stdin_exports = {};
  __export(stdin_exports, {
    layoutArc: () => layoutArc,
    layoutLandingArc: () => layoutLandingArc
  });

  // src/pages/teachers/shared/people.ts
  var THIS_YEAR = 2026;

  // src/pages/teachers/preachers/landing/arc.ts
  var arcStart = (people) => Math.floor(Math.min(...people.map((p) => p.born)) / 100) * 100;
  function sizesFor(width) {
    const narrow = width < 560;
    const r = narrow ? 11 : width < 960 ? 15 : 18, gap = narrow ? 2 : 4;
    return { narrow, r, d: 2 * r + gap, pad: r + (narrow ? 12 : 26), amp: narrow ? 10 : 22, top: narrow ? 52 : 58, bottom: narrow ? 40 : 44 };
  }
  function stack(people, sx, d) {
    const placed = [];
    for (const p of people) {
      const x = sx(p.born), near = placed.filter((q) => Math.abs(q.x - x) < d), candidates = [0];
      for (const q of near) {
        const h = Math.sqrt(d * d - (q.x - x) ** 2);
        candidates.push(q.off + h, q.off - h);
      }
      candidates.sort((a, b) => Math.abs(a) - Math.abs(b) || b - a);
      const off = candidates.find((c) => near.every((q) => Math.hypot(q.x - x, q.off - c) >= d - 0.01)) ?? 0;
      placed.push({ id: p.id, x, off });
    }
    return placed;
  }
  function layoutArc(people, width, startYear = arcStart(people), extraHeight = 0) {
    const s = sizesFor(width), start = startYear, end = THIS_YEAR;
    const sx = (year) => s.pad + (year - start) / (end - start) * (width - 2 * s.pad);
    const lift = (x) => -s.amp * Math.sin(Math.PI * (x / width));
    const placed = stack(people, sx, s.d);
    const minOff = Math.min(...placed.map((q) => q.off + lift(q.x))) - s.r, maxOff = Math.max(...placed.map((q) => q.off + lift(q.x))) + s.r;
    const base = s.top - minOff + extraHeight / 2, height = Math.ceil(base + maxOff + s.bottom + extraHeight / 2);
    let arcPath = "";
    for (let i = 0; i <= 48; i++) {
      const x = width * i / 48;
      arcPath += `${i ? "L" : "M"}${x.toFixed(1)} ${(base + lift(x)).toFixed(1)}`;
    }
    const centuries = [];
    for (let year = start; year <= end; year += 100) centuries.push({ year, x: sx(year) });
    return {
      width,
      height,
      r: s.r,
      arcPath,
      centuries,
      positions: placed.map((q) => ({ id: q.id, x: q.x, y: base + lift(q.x) + q.off })),
      gridTop: s.top - 22,
      gridBottom: height - 26,
      today: { x: sx(end), y: base + lift(sx(end)) },
      showToday: !s.narrow
    };
  }
  function layoutLandingArc(people, width, reclaimedSpace = 0) {
    const referenceWidth = Math.min(width, 1422);
    const layout = layoutArc(people, referenceWidth, void 0, 56);
    if (width === referenceWidth && !reclaimedSpace) return layout;
    const scale = width / referenceWidth;
    const offset = reclaimedSpace / 2;
    return {
      ...layout,
      width,
      height: layout.height + reclaimedSpace,
      arcPath: layout.arcPath.replace(/([ML])([\d.]+) ([\d.]+)/g, (_, command, x, y) => `${command}${(Number(x) * scale).toFixed(1)} ${(Number(y) + offset).toFixed(1)}`),
      positions: layout.positions.map((position) => ({ ...position, x: position.x * scale, y: position.y + offset })),
      centuries: layout.centuries.map((century) => ({ ...century, x: century.x * scale })),
      gridBottom: layout.gridBottom + reclaimedSpace,
      today: { ...layout.today, x: layout.today.x * scale, y: layout.today.y + offset }
    };
  }
  return __toCommonJS(stdin_exports);
})();
