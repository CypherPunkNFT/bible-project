// The drawing engine. Every stone is one verse from data.js: its width follows the verse's length and its colour the marks the
// study gave it, so each pier's shape is computed and not drawn by eye. Only the loads on top are hand-drawn; they use the
// passages' own phrases as labels and show nothing the study does not say: no storm clears, no load vanishes, no pier grows.
window.Stones = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const GROUND = 330, COURSE = 34, CX = 130, HALF = 88, TAPER = 3;
  const s = (tag, attrs = {}, ...kids) => {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) if (value !== null && value !== undefined) el.setAttribute(key, value);
    el.append(...kids);
    return el;
  };
  const random = (seed) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const f = (n) => n.toFixed(1);
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const wordsIn = (cell) => cell.segs.map((seg) => seg.t).join("").split(/\s+/).length;

  // Lays verses in reading order, top left to bottom right, into courses of about equal length.
  function partition(items, rowCount) {
    const rows = [];
    let at = 0;
    for (let row = 0; row < rowCount; row += 1) {
      const left = rowCount - row - 1;
      const remaining = items.slice(at).reduce((sum, item) => sum + item.weight, 0);
      const target = remaining / (left + 1);
      const course = [];
      let sum = 0;
      while (at < items.length - left && (!course.length || sum + items[at].weight / 2 < target)) { course.push(items[at]); sum += items[at].weight; at += 1; }
      rows.push(course);
    }
    return rows;
  }

  function courses(cells, plan) {
    const items = cells.map((cell) => ({ cell, weight: Math.sqrt(wordsIn(cell)) + 1.6 }));
    items.splice(plan.slot.after, 0, { slot: plan.slot.type, weight: plan.slot.type === "gap" ? 4.6 : 4 });
    if (!plan.rowCounts) return partition(items, plan.rows);
    let at = 0;
    return plan.rowCounts.map((count) => { const row = items.slice(at, at + count); at += count; return row; });
  }

  function layStones(cells, plan) {
    const rnd = random(plan.seed);
    const rows = courses(cells, plan);
    const top = GROUND - rows.length * COURSE;
    const stones = [];
    rows.forEach((row, index) => {
      const half = HALF - (rows.length - 1 - index) * TAPER;
      const y0 = top + index * COURSE, y1 = y0 + COURSE;
      const sum = row.reduce((total, item) => total + item.weight, 0);
      let x = CX - half;
      row.forEach((item) => {
        const width = (item.weight / sum) * half * 2;
        const j = () => (rnd() - 0.5) * 4.6;
        const inset = 3;
        const pts = [[x + inset + j(), y0 + inset + j()], [x + width - inset + j(), y0 + inset + j()], [x + width - inset + j(), y1 - inset + j()], [x + inset + j(), y1 - inset + j()]];
        stones.push({ ...item, pts, tone: 1 + Math.floor(rnd() * 3), grain: [rnd(), rnd(), rnd(), rnd(), rnd()], width });
        x += width;
      });
    });
    return { stones, top };
  }

  const polygon = (pts, cls) => s("polygon", { class: cls, points: pts.map((p) => `${f(p[0])},${f(p[1])}`).join(" ") });
  const mainKind = (kinds) => ["G", "C", "P"].find((k) => kinds.includes(k));

  function stoneNode(stone, big) {
    if (stone.slot) return stone.slot === "gap" ? polygon(stone.pts, "stone-gap") : s("g", {});
    const { cell, pts, grain } = stone;
    const main = mainKind(cell.kinds);
    const group = s("g", {});
    group.append(polygon(pts, `stone tone-${stone.tone}${main ? ` k-${main}` : ""}`));
    const second = cell.kinds.find((k) => k !== main);
    if (second) group.append(polygon([lerp(pts[0], pts[3], 0.68), lerp(pts[1], pts[2], 0.68), pts[2], pts[3]], `stone stripe k-${second}`));
    const lit = [lerp(pts[0], pts[1], 0.06), lerp(pts[0], pts[1], 0.94)];
    group.append(s("path", { class: "lit", d: `M${f(lit[0][0])} ${f(lit[0][1] + 0.5)}L${f(lit[1][0])} ${f(lit[1][1] + 0.5)}` }));
    const low = [lerp(pts[3], pts[2], 0.04), lerp(pts[3], pts[2], 0.96)];
    group.append(s("path", { class: "shade", d: `M${f(low[0][0])} ${f(low[0][1])}L${f(low[1][0])} ${f(low[1][1])}` }));
    const a = lerp(lerp(pts[0], pts[3], 0.35 + grain[0] * 0.4), lerp(pts[1], pts[2], 0.35 + grain[0] * 0.4), 0.14 + grain[1] * 0.35);
    group.append(s("path", { class: "grain", d: `M${f(a[0])} ${f(a[1])}l${f(6 + grain[2] * 12)} ${f((grain[3] - 0.5) * 2)}M${f(a[0] + 8)} ${f(a[1] + 5)}l${f(4 + grain[4] * 9)} ${f((grain[2] - 0.5) * 2)}` }));
    if (!big) return group;
    return s("a", { href: `?sheet=${cell.r}`, "data-sheet": cell.r, tabindex: "-1", class: "stone-link" }, s("title", {}, cell.label), group);
  }

  // ── The hand-drawn parts: fixed strings, never built from data ──
  const flame = (x, y, r = 1) => `<g class="flame" transform="translate(${x} ${y}) scale(${r})"><circle class="flame-glow" cy="-7" r="17"/><path class="flame-out" d="M0-20c5.500 7 8 11.500 8 15.500a8 8 0 0 1-16 0C-8-8.500-5.500-13 0-20Z"/><path class="flame-in" d="M0-11c2.200 3 3.400 5.200 3.400 6.900a3.400 3.400 0 0 1-6.800 0C-3.400-5.800-2.200-8 0-11Z"/></g>`;
  const niche = (x, y) => `<path class="niche" d="M${x - 11} ${y + 13}v-14a11 11 0 0 1 22 0v14Z"/>${flame(x, y + 10, 0.66)}`;
  function arrow(x1, y1, x2, y2, width = 2, cls = "load-line") {
    const angle = Math.atan2(y2 - y1, x2 - x1), size = 4 + width * 1.8;
    const head = [[x2, y2], [x2 - size * Math.cos(angle - 0.48), y2 - size * Math.sin(angle - 0.48)], [x2 - size * Math.cos(angle + 0.48), y2 - size * Math.sin(angle + 0.48)]];
    const stem = lerp([x2, y2], [x1, y1], (size * 0.7) / Math.hypot(x2 - x1, y2 - y1));
    return `<path class="halo" stroke-width="${width + 3}" d="M${x1} ${y1}L${f(stem[0])} ${f(stem[1])}"/><path class="${cls}" stroke-width="${width}" d="M${x1} ${y1}L${f(stem[0])} ${f(stem[1])}"/><polygon class="${cls}-head" points="${head.map((p) => `${f(p[0])},${f(p[1])}`).join(" ")}"/>`;
  }
  const label = (x, y, text, anchor = "middle", cls = "lab") => `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${text}</text>`;

  // Each lamp, door and gap has its own place in the coursing (`slot`, after that many verses), so nothing covers a verse.
  const CASES = {
    // Trials: many arrows of different weights: "of many kinds". Nothing explains which comes when.
    trials: { rows: 4, seed: 41, slot: { after: 8, type: "niche" }, draw: (top) => [[62, 30, 1.4], [88, 58, 2.6], [108, 20, 1], [134, 74, 3.4], [160, 40, 1.8], [190, 52, 2.2]].map(([x, len, w]) => arrow(x, top - 5 - len, x, top - 4, w)).join("") + label(CX, top - 92, "trials of many kinds") },
    // Temptation: the pull starts inside the wall, and the wall has a door in it.
    temptation: { rows: 7, seed: 97, slot: { after: 21, type: "door" }, draw: (top, at) => `${arrow(126, 176, 30, 100, 2.6)}${arrow(at.x, 319, 256, 319, 1.8, "exit-line")}${label(6, 86, "his own evil desires", "start")}<text class="lab lab-gold" text-anchor="end"><tspan x="258" y="298">an</tspan><tspan x="258" dy="11">escape</tspan></text>` },
    // Anxiety: a load thrown up and off, with the lighter arrows left in place: no date is given for the feeling to stop.
    anxiety: { rows: 4, seed: 23, slot: { after: 7, type: "niche" }, draw: (top) => `<path class="load-curve" d="M130 ${top - 6}C130 ${top - 58} 176 ${top - 90} 216 ${top - 124}"/><polygon class="load-line-head" points="226,${top - 132} 211,${top - 127} 219,${top - 117}"/>${arrow(90, top - 28, 90, top - 4, 1.2)}${arrow(170, top - 28, 170, top - 4, 1.2)}<ellipse class="prowl" cx="${CX}" cy="314" rx="122" ry="13"/>${label(112, top - 134, "Cast all your anxiety on Him")}${label(CX, 356, "prowls around")}` },
    // Persecution: words thrown from one side, heat at the foot, and the basket: staying is not the only faithful thing.
    opposition: { rows: 5, seed: 61, slot: { after: 10, type: "niche" }, draw: (top) => `${[[top + 22, 2.4], [top + 58, 1.6], [top + 88, 2.8], [top + 122, 1.8]].map(([y, w]) => arrow(4, y, 45, y, w)).join("")}<path class="heat" d="M12 328c-6-10 6-14 0-26M24 328c-6-8 6-12 0-20M36 328c-5-7 5-10 0-16"/><path class="rope" d="M212 ${top + 40}C222 ${top + 34} 234 ${top + 36} 236 ${top + 52}V278"/><path class="basket" d="M225 278h22l-3 18h-16Z"/>${label(6, top + 8, "insulted", "start")}<text class="lab" text-anchor="end"><tspan x="258" y="308">in a</tspan><tspan x="258" dy="11">basket</tspan></text>` },
    // Grief: no arrows at all. One stone is gone and nothing is put in its place. The light sits in the gap.
    grief: { rowCounts: [2, 3, 2], seed: 13, slot: { after: 3, type: "gap" }, draw: (top) => label(CX, top - 16, "those who sleep in death") },
    // Contentment: a dashed course for plenty, a heavy and a light arrow, and other people's help leaning on the wall, not cut into it.
    contentment: { rows: 5, seed: 83, slot: { after: 9, type: "niche" }, draw: (top) => `<path class="ghost" d="M${CX - 76} ${top - 2}v-30l50-3 52 2 50-1v32"/>${arrow(90, top - 62, 90, top - 36, 3.2)}${arrow(170, top - 62, 170, top - 36, 1.2)}${["220,330 258,330 253,300 220,300", "217,298 251,298 244,268 217,268", "214,266 241,266 231,240 214,240", "211,238 228,238 218,214 211,214"].map((points) => `<polygon class="help" points="${points}"/>`).join("")}${label(CX, top - 68, "having plenty and having need")}<text class="lab" text-anchor="end"><tspan x="256" y="${top + 8}">share</tspan><tspan x="256" dy="11">in my</tspan><tspan x="256" dy="11">affliction</tspan></text>` },
  };

  // One whole pier for a reading. `big` numbers the stones and links each to its verse, and adds the dashed course under the ground.
  function pier(reading, cells, older, { big = false } = {}) {
    const plan = CASES[reading.slug];
    const { stones, top } = layStones(cells, plan);
    const height = big ? 424 : 372;
    const svg = s("svg", { viewBox: `0 0 260 ${height}`, class: `pier-svg pier-${reading.slug}`, "aria-hidden": "true" });
    svg.append(s("rect", { class: "earth", x: 0, y: GROUND, width: 260, height: height - GROUND }), s("rect", { class: "earth-hatch", x: 0, y: GROUND, width: 260, height: height - GROUND }));
    if (older.length) {
      const span = Math.min(236, older.length * 40), each = span / older.length;
      older.forEach((pair, index) => {
        const x = CX - span / 2 + index * each;
        svg.append(s("rect", { class: `older-stone sec-${pair.section}${pair.kind === "retold" ? " is-retold" : ""}`, x: f(x + 1.5), y: GROUND + 14, width: f(each - 3), height: 22, rx: 5 }));
      });
    }
    const wall = s("g", { class: "pier" });
    stones.forEach((stone) => wall.append(stoneNode(stone, big)));
    svg.append(wall);
    svg.append(s("path", { class: "ground-line", d: `M0 ${GROUND}H260` }), s("path", { class: "bearing", d: `M${CX - HALF} ${GROUND}H${CX + HALF}` }));
    const load = s("g", { class: "load" });
    const place = stones.find((stone) => stone.slot);
    const at = { x: Math.round((place.pts[0][0] + place.pts[1][0]) / 2), y: Math.round((place.pts[0][1] + place.pts[3][1]) / 2) };
    load.innerHTML = plan.draw(top, at);
    svg.append(load);
    const light = s("g", { class: "lamp-in-wall" });
    light.innerHTML = { gap: flame(at.x, at.y + 8, 0.82), niche: niche(at.x, at.y), door: `<path class="door" d="M${at.x - 12} 330V309a12 12 0 0 1 24 0v21Z"/>${flame(at.x, 326, 0.62)}` }[place.slot];
    svg.append(light);
    if (big) {
      // The numbers go on last, so no line drawn over the wall can hide which verse a stone is.
      const numbers = s("g", { class: "nums" });
      for (const stone of stones.filter((item) => item.cell && item.width > 18)) {
        const centre = lerp(lerp(stone.pts[0], stone.pts[1], 0.5), lerp(stone.pts[3], stone.pts[2], 0.5), 0.5);
        numbers.append(s("text", { class: `num on-${mainKind(stone.cell.kinds) ?? "plain"}`, x: f(centre[0]), y: f(centre[1] + 3.6), "text-anchor": "middle" }, String(stone.cell.v)));
      }
      svg.append(numbers);
    }
    if (big) {
      const rnd = random(plan.seed + 7);
      let x = CX - HALF;
      while (x < CX + HALF - 8) {
        const width = Math.min(CX + HALF - x, 40 + rnd() * 30);
        svg.append(s("rect", { class: "unpromised", x: f(x + 2), y: 386, width: f(width - 4), height: 28, rx: 5 }));
        x += width;
      }
    }
    return svg;
  }

  // Two curved runs of stone that nearly meet around one small flame: the study's motto, a small light and two hands.
  // The heading's line drawing: the page's wall, its small light and what presses on it. A negative width leaves room for the niche.
  function headArt() {
    const svg = s("svg", { viewBox: "0 0 420 330", class: "head-svg", "aria-hidden": "true" });
    const rnd = random(11);
    const courses = [[[44], [62], [40, "gold"], [54]], [[58], [46, "gold"], [52], [44]], [[30], [44], [-52], [34, "gold"], [40]], [[38, "gold"], [36], [-52], [40], [34]]];
    let stones = "";
    courses.forEach((course, row) => {
      let x = 110;
      const y = 124 + row * 36;
      for (const [width, kind] of course) {
        if (width > 0) {
          const j = () => f((rnd() - 0.5) * 3);
          stones += `<path class="${kind === "gold" ? "art-gold" : ""}" d="M${x + 2} ${y + 2 + +j()}L${x + width - 2} ${y + 2 + +j()}L${x + width - 2} ${y + 33 + +j()}L${x + 2} ${y + 33 + +j()}Z"/>`;
        }
        x += Math.abs(width);
      }
    });
    const arrows = [[132, 34, 1], [164, 66, 1.5], [196, 24, 1], [230, 78, 1.8], [270, 44, 1.2]].map(([x, length, weight]) =>
      `<path class="art-press" stroke-width="${weight}" d="M${x} ${112 - length}V112M${x - 5} 106l5 6 5-6"/>`).join("");
    svg.innerHTML = `<ellipse class="art-ring" cx="210" cy="178" rx="198" ry="146"/><ellipse class="art-ring" cx="210" cy="178" rx="162" ry="118"/>
      <path class="art-faint" d="M34 62h10m-5-5v10M396 300h10m-5-5v10M372 54h8m-4-4v8"/>
      ${stones}${arrows}
      <path d="M186 268V222a24 24 0 0 1 48 0v46"/><path d="M30 268H390"/>
      <path class="art-faint" d="M116 278h60v16h-60ZM184 278h44v16h-44ZM236 278h66v16h-66Z"/>
      ${flame(210, 262, 0.9)}`;
    return svg;
  }

  function lamp() {
    const svg = s("svg", { viewBox: "0 0 240 210", class: "lamp-svg", "aria-hidden": "true" });
    const rnd = random(7);
    const c = [120, 132];
    const deg = (d) => (d * Math.PI) / 180;
    const piece = (a0, a1) => {
      const j = () => (rnd() - 0.5) * 2.4;
      const at = (radius, angle) => [c[0] + radius * Math.cos(angle) + j(), c[1] - radius * Math.sin(angle) + j()];
      return [at(72, a0), at(72, a1), at(106, a1), at(106, a0)];
    };
    [[200, 104], [-20, 76]].forEach(([from, to]) => {
      const count = 6, step = (to - from) / count;
      for (let i = 0; i < count; i += 1) {
        const pts = piece(deg(from + step * i + 0.9 * Math.sign(step)), deg(from + step * (i + 1) - 0.9 * Math.sign(step)));
        svg.append(polygon(pts, `stone tone-${1 + (i % 3)}`));
      }
    });
    svg.append(polygon([[70, 170], [170, 170], [174, 186], [66, 186]], "stone tone-2"));
    const light = s("g", {});
    light.innerHTML = flame(120, 164, 1.9);
    svg.append(light);
    return svg;
  }

  const defs = () => {
    const svg = s("svg", { width: 0, height: 0, class: "stone-defs", "aria-hidden": "true" });
    svg.innerHTML = `<defs><pattern id="earth-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><path d="M0 0V9" class="hatch-line"/></pattern></defs>`;
    return svg;
  };
  return { pier, lamp, headArt, defs };
})();
