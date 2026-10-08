// The five arrangements of the 47 people. Each layout takes the stage size and returns a box for every person
// ({x, y, w, h, sub}), the labels drawn behind the tiles (layer), and one plain line explaining what you see.
window.LAYOUTS = (() => {
  const P = R.people;
  const size = (W) => (W >= 900 ? "wide" : W >= 600 ? "mid" : "narrow");
  const stageHeight = (W) => ({ wide: 660, mid: 800, narrow: 900 })[size(W)];
  const yearsOf = (p) => lifeLabel(p);
  const label = (x, y, html, extra = "") => `<div class="lab" style="left:${x}px;top:${y}px;${extra}">${html}</div>`;

  // Lay items out in a grid starting at (x, y); returns the y just below the last row.
  function grid(items, boxes, { x, y, width, cols, h, gap = 6, sub = yearsOf }) {
    const w = (width - gap * (cols - 1)) / cols;
    items.forEach((p, i) => boxes.set(p.id, { x: x + (i % cols) * (w + gap), y: y + Math.floor(i / cols) * (h + gap), w, h, sub: sub(p) }));
    return y + Math.ceil(items.length / cols) * (h + gap) - gap;
  }

  // Groups stacked as horizontal bands (narrow screens): a label row, then a grid of tiles.
  function bands(groups, W, minTile, h, boxes) {
    const cols = Math.max(2, Math.floor((W + 6) / (minTile + 6)));
    let y = 0, layer = "";
    for (const g of groups) {
      layer += label(0, y, `<span class="kicker" style="--tone:${g.tone ?? "var(--accent)"}">${g.label}</span><b>${g.people.length}</b>${g.hint ? `<small>${g.hint}</small>` : ""}`, "display:flex;gap:.5rem;align-items:baseline");
      y = grid(g.people, boxes, { x: 0, y: y + 24, width: W, cols, h }) + 18;
    }
    return layer;
  }

  function century(W) {
    const boxes = new Map();
    const groups = [16, 17, 18, 19, 20].map((c) => ({ label: `${R.ordinal(c)} century`, hint: `born ${(c - 1) * 100 + 1}–${c * 100}`,
      people: P.filter((p) => Math.ceil(p.born / 100) === c) }));
    let layer = "";
    if (size(W) === "wide") {
      const gap = 16, colW = (W - gap * 4) / 5;
      groups.forEach((g, i) => {
        const x = i * (colW + gap);
        layer += label(x, 0, `<span class="kicker">${g.label}</span><span class="big">${g.people.length}</span><small>${g.hint}</small>`, `width:${colW}px`);
        layer += `<div class="rule-v" style="left:${x + colW + gap / 2}px"></div>`;
        grid(g.people, boxes, { x, y: 92, width: colW, cols: 1, h: 32, gap: 4 });
      });
    } else layer = bands(groups, W, size(W) === "mid" ? 150 : 108, 32, boxes);
    return { boxes, layer, note: "Grouped by the century each person was born in, oldest first." };
  }

  function tradition(W, H) {
    const boxes = new Map();
    const groups = FAMILIES.map((f) => ({ label: f.label, tone: `var(${f.tone})`, people: P.filter((p) => familyOf(p).key === f.key) }))
      .sort((a, b) => b.people.length - a.people.length);
    let layer = "";
    if (size(W) === "wide") {
      const gap = 16, cols = 4, boxW = (W - gap * (cols - 1)) / cols, pad = 12;
      const tileRows = [groups.slice(0, 4), groups.slice(4)].reduce((n, row) => n + Math.max(...row.map((g) => Math.ceil(g.people.length / 2))), 0);
      const tileH = Math.min(56, (H - gap - 2 * 58 - tileRows * 6) / tileRows);
      const rows = [groups.slice(0, 4), groups.slice(4)];
      let y = 0;
      rows.forEach((row) => {
        const tall = Math.max(...row.map((g) => Math.ceil(g.people.length / 2))) * (tileH + 6) + 58;
        row.forEach((g, i) => {
          const x = i * (boxW + gap);
          layer += `<div class="cluster" style="left:${x}px;top:${y}px;width:${boxW}px;height:${tall}px;--tone:${g.tone}">
            <span class="kicker">${g.label}</span><b>${g.people.length}</b></div>`;
          grid(g.people, boxes, { x: x + pad, y: y + 44, width: boxW - pad * 2, cols: 2, h: tileH });
        });
        if (row.length < cols) {
          const x = row.length * (boxW + gap);
          layer += `<div class="cluster note" style="left:${x}px;top:${y}px;width:${boxW}px;height:${tall}px">
            <p>Each person sits in one family, taken from the traditions recorded for them in the library's list of authors.</p></div>`;
        }
        y += tall + gap;
      });
    } else layer = bands(groups, W, size(W) === "mid" ? 150 : 108, 32, boxes);
    return { boxes, layer, note: "Grouped by family of churches. Largest families first." };
  }

  // Squarified treemap: rectangles close to square, biggest first.
  function squarify(items, x, y, w, h) {
    const total = items.reduce((s, i) => s + i.v, 0), scale = (w * h) / total, out = [];
    let rest = items.map((i) => ({ id: i.id, a: i.v * scale }));
    while (rest.length) {
      const side = Math.min(w, h);
      const worst = (row) => { const s = row.reduce((a, r) => a + r.a, 0), mx = Math.max(...row.map((r) => r.a)), mn = Math.min(...row.map((r) => r.a));
        return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn)); };
      const row = [rest[0]];
      let i = 1;
      while (i < rest.length && worst([...row, rest[i]]) <= worst(row)) row.push(rest[i++]);
      rest = rest.slice(i);
      const s = row.reduce((a, r) => a + r.a, 0);
      if (w >= h) { const cw = s / h; let cy = y; for (const r of row) { out.push({ id: r.id, x, y: cy, w: cw, h: r.a / cw }); cy += r.a / cw; } x += cw; w -= cw; }
      else { const ch = s / w; let cx = x; for (const r of row) { out.push({ id: r.id, x: cx, y, w: r.a / ch, h: ch }); cx += r.a / ch; } y += ch; h -= ch; }
    }
    return out;
  }

  // People with nothing catalogued are parked in a strip along the bottom.
  function park(people, boxes, W, H, text, sub = () => "") {
    const w = Math.min(150, W / 2);
    people.forEach((p, i) => boxes.set(p.id, { x: i * (w + 6), y: H - 34, w, h: 32, sub: sub(p) }));
    return label(people.length * (w + 6) + 6, H - 26, `<small>${text}</small>`, `right:0`);
  }

  function legacy(W, H) {
    const boxes = new Map();
    const none = P.filter((p) => !p.works), some = P.filter((p) => p.works).sort((a, b) => b.works - a.works);
    for (const r of squarify(some.map((p) => ({ id: p.id, v: Math.sqrt(p.works) })), 0, 0, W, H - 46)) {
      const p = personById(r.id);
      boxes.set(r.id, { x: r.x + 2, y: r.y + 2, w: r.w - 4, h: r.h - 4, sub: R.plural(p.works, "work") });
    }
    const layer = park(none, boxes, W, H, "Nothing catalogued yet, so no area here.", () => "0 works");
    return { boxes, layer, note: "Area follows the square root of each person's works in the library, so the largest collections don't hide everyone else." };
  }

  function preacher(W, H) {
    const boxes = new Map(), wide = size(W) === "wide";
    const none = P.filter((p) => !p.works), writers = P.filter((p) => p.works && !p.genres.sermon).sort((a, b) => b.works - a.works);
    const preachers = P.filter((p) => p.genres.sermon).sort((a, b) => sermonShare(a) - sermonShare(b));
    const pct = (p) => `${Math.max(1, Math.round(sermonShare(p) * 100))}%${size(W) === "narrow" ? "" : " sermons"}`;
    const leftW = wide ? Math.round(W * 0.38) : W;
    let layer = label(0, 0, `<span class="kicker">Writings only</span><b>${writers.length}</b>${wide ? "<small>no sermons among their works in the library</small>" : ""}`, "display:flex;gap:.5rem;align-items:baseline");
    const blockEnd = grid(writers, boxes, { x: 0, y: 34, width: leftW, cols: wide ? 3 : Math.max(3, Math.floor(W / 150)), h: 32, sub: () => "" });
    layer += park(none, boxes, W, H, "Nothing catalogued yet.", () => "");
    const x0 = wide ? leftW + 64 : 8, x1 = W - 8, axisY = H - 92;
    const tileW = wide ? 128 : Math.min(112, W / 3.4), tileH = 42, rows = [];
    let stems = "";
    for (const p of preachers) {
      const cx = x0 + sermonShare(p) * (x1 - x0), x = Math.max(wide ? x0 - 24 : 0, Math.min(cx - tileW / 2, W - tileW));
      let row = 0;
      while ((rows[row] ?? []).some(([a, b]) => x < b + 6 && x + tileW > a - 6)) row++;
      (rows[row] ??= []).push([x, x + tileW]);
      const y = axisY - 26 - (row + 1) * (tileH + 10);
      boxes.set(p.id, { x, y, w: tileW, h: tileH, sub: pct(p) });
      stems += `<line x1="${cx}" y1="${y + tileH}" x2="${cx}" y2="${axisY}" style="stroke:${R.tone(p)};stroke-width:1.5"/><circle cx="${cx}" cy="${axisY}" r="3.5" style="fill:${R.tone(p)}"/>`;
    }
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => { const x = x0 + t * (x1 - x0);
      return `<line x1="${x}" y1="${axisY - 4}" x2="${x}" y2="${axisY + 4}" style="stroke:var(--muted)"/><text x="${x}" y="${axisY + 20}" text-anchor="${t === 0 ? "start" : t === 1 ? "end" : "middle"}">${t * 100}%</text>`; }).join("");
    layer += `<svg class="lines" width="${W}" height="${H}"><line x1="${x0}" y1="${axisY}" x2="${x1}" y2="${axisY}" style="stroke:var(--line);stroke-width:2"/>${ticks}${stems}</svg>`;
    layer += label(x0, axisY + 30, `<small>Share of each person's works in the library that are sermons →</small>`);
    if (!wide) layer += `<div class="rule-h" style="top:${blockEnd + 18}px"></div>`;
    return { boxes, layer, note: "Left: people whose works in the library are all writings. Right: the rest, placed by how much of their work is sermons." };
  }

  // Who knew whom: time runs left to right (top to bottom on phones); linked people are lined up in lanes, the rest parked.
  function network(W, H) {
    const boxes = new Map(), vertical = size(W) === "narrow";
    const ids = new Set(R.links.flatMap((l) => [l.from, l.to]));
    const linked = P.filter((p) => ids.has(p.id)), loose = P.filter((p) => !ids.has(p.id));
    const parkCols = { wide: 7, mid: 5, narrow: 3 }[size(W)], nodeH = 30;
    const parkW = (W - 6 * (parkCols - 1)) / parkCols, parkTop = H - Math.ceil(loose.length / parkCols) * (nodeH + 6);
    grid(loose, boxes, { x: 0, y: parkTop, width: W, cols: parkCols, h: nodeH, sub: () => "" });
    let layer = label(0, parkTop - 24, `<span class="kicker">No documented link yet</span> <b>${loose.length}</b>`, "display:flex;gap:.5rem;align-items:baseline");
    const gutter = vertical ? 38 : 0, nodeW = vertical ? (W - gutter - 8 * 2) / 3 : 122, top = 30, bottom = parkTop - 40;
    const lanes = vertical ? 3 : Math.floor((bottom - top + 10) / (nodeH + 10));
    const t0 = 1500, t1 = 1960, tMax = vertical ? bottom - nodeH : W - nodeW, tMin = vertical ? top : 0;
    const tOf = (year) => tMin + ((year - t0) / (t1 - t0)) * (tMax - tMin), span = vertical ? nodeH + 6 : nodeW + 8;
    // Components get a home lane so each family of links stays together.
    const parent = new Map(linked.map((p) => [p.id, p.id]));
    const find = (id) => (parent.get(id) === id ? id : find(parent.get(id)));
    R.links.forEach((l) => parent.set(find(l.from), find(l.to)));
    const roots = [...new Set(linked.map((p) => find(p.id)))];
    const home = new Map(roots.map((r, i) => [r, Math.round(((i + 0.5) / roots.length) * (lanes - 1))]));
    // S-shaped link curves; sampled points let the lane choice avoid running a line behind someone else's tile.
    const curve = ([ax, ay], [bx, by]) => (vertical ? [[ax, ay], [ax, (ay + by) / 2], [bx, (ay + by) / 2], [bx, by]] : [[ax, ay], [(ax + bx) / 2, ay], [(ax + bx) / 2, by], [bx, by]]);
    const sample = (c) => Array.from({ length: 24 }, (_, k) => { const s = (k + 0.5) / 24, u = 1 - s;
      return [0, 1].map((j) => u * u * u * c[0][j] + 3 * u * u * s * c[1][j] + 3 * u * s * s * c[2][j] + s * s * s * c[3][j]); });
    const centreOf = (b) => [b.x + b.w / 2, b.y + b.h / 2];
    const inside = ([x, y], b) => x > b.x - 3 && x < b.x + b.w + 3 && y > b.y - 3 && y < b.y + b.h + 3;
    const laneEnd = Array(lanes).fill(-Infinity), laneOf = new Map(), placedBoxes = new Map();
    for (const p of [...linked].sort((a, b) => a.born - b.born)) {
      const neighbours = R.linksOf(p.id).map((l) => l.other.id).filter((id) => placedBoxes.has(id));
      const want = neighbours.length ? neighbours.reduce((a, id) => a + laneOf.get(id), 0) / neighbours.length : home.get(find(p.id));
      let best = null;
      for (let lane = 0; lane < lanes; lane++) {
        const born = tOf(p.born), t = Math.max(born, laneEnd[lane]), across = vertical ? gutter + lane * (nodeW + 8) : top + lane * (nodeH + 10);
        const box = vertical ? { x: across, y: t, w: nodeW, h: nodeH, sub: "" } : { x: t, y: across, w: nodeW, h: nodeH, sub: "" };
        const overflow = (vertical ? box.y + box.h : box.x + box.w) > (vertical ? bottom : W) + 1;
        let crossed = overflow ? 20 : 0;
        for (const id of neighbours) {
          const pts = sample(curve(centreOf(box), centreOf(placedBoxes.get(id))));
          for (const [other, ob] of placedBoxes) if (other !== id && pts.some((pt) => inside(pt, ob))) crossed++;
        }
        // Keep clear of the way out of anyone who still has a later link to draw.
        for (const [other, ob] of placedBoxes) {
          if (!R.linksOf(other).some((l) => l.other.id !== p.id && !placedBoxes.has(l.other.id))) continue;
          const lane2 = vertical ? { x: ob.x, y: ob.y + ob.h, w: ob.w, h: 90 } : { x: ob.x + ob.w, y: ob.y, w: 170, h: ob.h };
          if (box.x < lane2.x + lane2.w && box.x + box.w > lane2.x && box.y < lane2.y + lane2.h && box.y + box.h > lane2.y) crossed++;
        }
        const cost = Math.abs(lane - want) + crossed * 5 + ((t - born) / span) * 4;
        if (!best || cost < best.cost) best = { cost, lane, t, box };
      }
      laneEnd[best.lane] = best.t + span;
      laneOf.set(p.id, best.lane);
      placedBoxes.set(p.id, best.box);
      boxes.set(p.id, best.box);
    }
    const centre = (id) => centreOf(boxes.get(id));
    const lines = R.links.map((l, i) => {
      const [a, c1, c2, z] = curve(centre(l.from), centre(l.to)).map((q) => q.map((n) => n.toFixed(1)).join(" "));
      const d = `M${a}C${c1} ${c2} ${z}`;
      return `<path class="link" data-link="${i}" data-a="${l.from}" data-b="${l.to}" d="${d}"/><path class="hit" data-link="${i}" d="${d}"/>`;
    }).join("");
    const years = [1500, 1600, 1700, 1800, 1900].map((y) => { const t = tOf(y);
      return vertical ? `<line class="grid" x1="0" y1="${t}" x2="${W}" y2="${t}"/><text x="0" y="${t - 4}">${y}</text>`
        : `<line class="grid" x1="${t}" y1="18" x2="${t}" y2="${bottom + 6}"/><text x="${t + 4}" y="12">${y}</text>`; }).join("");
    layer += `<svg class="lines net" width="${W}" height="${H}">${years}${lines}</svg>`;
    return { boxes, layer, node: true, note: vertical ? "Time runs down the page by year of birth. Each line is a documented link: a teacher, a colleague or an influence. Tap a line to read it."
      : "Time runs left to right by year of birth. Each line is a documented link: a teacher, a colleague or an influence. Point at a line to read it." };
  }

  const LIST = [
    { key: "century", label: "By century", run: century },
    { key: "tradition", label: "By tradition", run: tradition },
    { key: "legacy", label: "By what they left", run: legacy },
    { key: "preacher", label: "Preacher or writer", run: preacher },
    { key: "network", label: "Who knew whom", run: network },
  ];
  return { LIST, stageHeight, size };
})();
