// Six designs for section 03's cards, for the owner to compare on lost-cards.html. Each card is twice the width of the cards on
// the page and splits what was lost, drawn in the dark, from Revelation's answer, drawn green and alive. Each design takes a
// different row so its art can be that row's own. The words are the study's data. Nothing here depicts God, Christ or an angel.
(() => {
  const { bookends, passages } = HP;
  const n = (value) => value.toFixed(1);
  const seeded = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const svg = (box, body) => `<svg viewBox="${box}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}</svg>`;
  const sky = (id, stops) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([at, colour]) => `<stop offset="${at}" stop-color="${colour}"/>`).join("")}</linearGradient></defs>`;
  const wave = (y, rise, width, height, seed) => {
    const random = seeded(seed);
    let d = `M0 ${height}V${y}`;
    for (let x = 0; x < width; x += 100) d += `Q${x + 50} ${n(y - rise * random())} ${x + 100} ${n(y + (random() - .5) * rise * .6)}`;
    return `${d}V${height}Z`;
  };

  // ── Pieces ──
  const stars = (random, count, width, height) => Array.from({ length: count }, () => `<circle cx="${n(random() * width)}" cy="${n(random() * height)}" r="${n(.6 + random() * 1.2)}" fill="#e9e3d2" opacity="${n(.25 + random() * .6)}"/>`).join("");
  const headstone = (x, base, wide, tall) => `<path d="M${x} ${base}V${base - tall + wide / 2}a${wide / 2} ${wide / 2} 0 0 1 ${wide} 0V${base}Z" fill="#373c47" stroke="#555c69" stroke-width="1.5"/><path d="M${x + wide * .3} ${base - tall + wide * .75}h${wide * .4}M${x + wide * .3} ${base - tall + wide * 1.05}h${wide * .4}" stroke="#4a505c" stroke-width="2"/>`;
  function branches(x, y, length, angle, depth, random, out) {
    const x2 = x + Math.cos(angle) * length, y2 = y + Math.sin(angle) * length;
    (out[depth] ??= []).push(`M${n(x)} ${n(y)}L${n(x2)} ${n(y2)}`);
    if (depth === 0) return out;
    const count = random() < .45 ? 3 : 2;
    for (let i = 0; i < count; i += 1) branches(x2, y2, length * (.62 + random() * .14), angle - .55 + (1.1 * i) / (count - 1) + (random() - .5) * .35, depth - 1, random, out);
    return out;
  }
  const bareTree = (x, base, length, seed, colour) => branches(x, base, length, -Math.PI / 2, 5, seeded(seed), [])
    .map((paths, depth) => `<path d="${paths.join("")}" stroke="${colour}" stroke-width="${n(1 + depth * 1.3)}" stroke-linecap="round" fill="none"/>`).join("");
  const crownTree = (x, base, size, seed, { fruit = true, leaf = ["#2f6b3a", "#3f8445", "#5a9f4f"] } = {}) => {
    const random = seeded(seed), blobs = [], fruits = [];
    for (let i = 0; i < 26; i += 1) {
      const angle = random() * Math.PI * 2, reach = Math.sqrt(random()) * size;
      blobs.push(`<circle cx="${n(x + Math.cos(angle) * reach * 1.15)}" cy="${n(base - size * 1.9 + Math.sin(angle) * reach * .8)}" r="${n(size * (.28 + random() * .2))}" fill="${leaf[i % leaf.length]}"/>`);
      if (fruit && i % 3 === 0) fruits.push(`<circle cx="${n(x + Math.cos(angle) * reach)}" cy="${n(base - size * 1.9 + Math.sin(angle) * reach * .7)}" r="${n(size * .06)}" fill="#e8b84a"/>`);
    }
    return `<path d="M${x - size * .1} ${base}C${x - size * .08} ${base - size} ${x - size * .05} ${base - size * 1.3} ${x} ${base - size * 1.6}C${x + size * .05} ${base - size * 1.3} ${x + size * .08} ${base - size} ${x + size * .12} ${base}Z" fill="#4a3424"/>${blobs.join("")}${fruits.join("")}`;
  };
  const meadow = (random, y0, y1, width, count) => {
    const out = [];
    for (let i = 0; i < count; i += 1) {
      const x = random() * width, y = y0 + random() * (y1 - y0), tall = 6 + random() * 10;
      out.push(random() < .3
        ? `<circle cx="${n(x)}" cy="${n(y - tall)}" r="${n(2 + random() * 2)}" fill="${random() < .5 ? "#f3d27a" : "#fff6e0"}"/><path d="M${n(x)} ${n(y)}V${n(y - tall)}" stroke="#2f6b3a" stroke-width="1.2"/>`
        : `<path d="M${n(x)} ${n(y)}q${n(-2 + random() * 4)} ${n(-tall / 2)} ${n(-3 + random() * 6)} ${n(-tall)}" stroke="#3d7a3f" stroke-width="1.3" fill="none"/>`);
    }
    return out.join("");
  };
  const sun = (x, y, r, rays = 18, reach = 2.2) => {
    const lines = [];
    for (let i = 0; i < rays; i += 1) {
      const angle = (i / rays) * Math.PI * 2;
      lines.push(`M${n(x + Math.cos(angle) * r * 1.25)} ${n(y + Math.sin(angle) * r * 1.25)}L${n(x + Math.cos(angle) * r * reach)} ${n(y + Math.sin(angle) * r * reach)}`);
    }
    return `<path d="${lines.join("")}" stroke="#e8b84a" stroke-width="1.4" opacity=".7"/><circle cx="${x}" cy="${y}" r="${r * 1.12}" fill="#f6dc8c" opacity=".55"/><circle cx="${x}" cy="${y}" r="${r}" fill="#f1c35a"/>`;
  };
  const thorns = (random, x, base, size) => {
    const spikes = [];
    for (let i = 0; i < 14; i += 1) {
      const angle = -Math.PI + (Math.PI * i) / 13 + (random() - .5) * .2, reach = size * (.6 + random() * .5);
      spikes.push(`M${n(x)} ${n(base)}L${n(x + Math.cos(angle) * reach)} ${n(base + Math.sin(angle) * reach)}`);
      spikes.push(`M${n(x + Math.cos(angle) * reach * .55)} ${n(base + Math.sin(angle) * reach * .55)}l${n(Math.cos(angle + .9) * size * .18)} ${n(Math.sin(angle + .9) * size * .18)}`);
    }
    return `<path d="${spikes.join("")}" stroke="#4d4238" stroke-width="1.6" stroke-linecap="round" fill="none"/><circle cx="${n(x + size * .3)}" cy="${n(base - size * .7)}" r="${size * .09}" fill="#5d4a5a"/>`;
  };

  // ── A. Horizon: the grave above, the meadow below, one horizon between (Death) ──
  const horizonDeath = {
    lost: () => { const random = seeded(3); return svg("0 0 800 300", `${sky("ha", [[0, "#0d1016"], [1, "#22262f"]])}<rect width="800" height="300" fill="url(#ha)"/>${stars(random, 60, 800, 180)}<path d="M672 40a26 26 0 1 0 20 44 22 22 0 1 1-20-44Z" fill="#d8d2c2" opacity=".75"/><path d="${wave(235, 40, 800, 300, 5)}" fill="#171a21"/>${bareTree(705, 262, 46, 9, "#2c3039")}${headstone(455, 266, 30, 56)}${headstone(508, 268, 24, 42)}${headstone(560, 266, 34, 64)}${headstone(615, 270, 22, 36)}<path d="${wave(262, 14, 800, 300, 7)}" fill="#0b0d11"/>`); },
    found: () => { const random = seeded(4); return svg("0 0 800 300", `${sky("hb", [[0, "#fbefc9"], [.55, "#e3efc4"], [1, "#cfe6b1"]])}<rect width="800" height="300" fill="url(#hb)"/>${sun(650, 70, 30)}<path d="${wave(150, 50, 800, 300, 11)}" fill="#a9cf86"/><path d="${wave(195, 40, 800, 300, 13)}" fill="#7db463"/>${crownTree(705, 205, 34, 15)}${crownTree(470, 220, 22, 17)}<path d="${wave(235, 30, 800, 300, 19)}" fill="#5a9a4c"/>${meadow(random, 245, 300, 800, 170)}`); },
  };
  // ── B. Diagonal: thorns on one side of the line, harvest on the other (The curse) ──
  const diagonalCurse = () => {
    const random = seeded(21), dark = [], light = [];
    for (let i = 0; i < 9; i += 1) { const t = .08 + i * .1; dark.push(thorns(random, 800 * t + random() * 30, 520 - 480 * t - 18 + random() * 10, 26 + random() * 22)); }
    for (let i = 0; i < 70; i += 1) { const x = 60 + random() * 740, edge = 520 - (480 * x) / 800, y = edge + 40 + random() * (560 - edge - 40); if (x < 470 && y > 430) continue; light.push(`<path d="M${n(x)} ${n(y)}v-${n(16 + random() * 14)}" stroke="#b8902f" stroke-width="1.3"/><ellipse cx="${n(x)}" cy="${n(y - 22 - random() * 8)}" rx="2.4" ry="6" fill="#d9a93d"/>`); }
    const cracks = Array.from({ length: 16 }, () => { const x = random() * 560, y = random() * (520 - (480 * x) / 800 - 30); return `M${n(x)} ${n(y)}l${n(18 - random() * 36)} ${n(10 + random() * 16)}l${n(14 - random() * 28)} ${n(8 + random() * 12)}`; }).join("");
    return svg("0 0 800 560", `${sky("da", [[0, "#1a1714"], [1, "#2c241d"]])}${sky("db", [[0, "#e9f1c8"], [1, "#9cc77a"]])}<rect width="800" height="560" fill="url(#db)"/>${crownTree(330, 505, 30, 23)}${crownTree(220, 535, 20, 29)}${light.join("")}<path d="M0 0H800V40L0 520Z" fill="url(#da)"/><path d="${cracks}" stroke="#4a3e33" stroke-width="1.3" fill="none"/>${dark.join("")}<path d="M800 40L0 520" stroke="#e2b04a" stroke-width="3"/>`);
  };
  // ── C. Side by side: the guarded way on the left, the tree of life by the river on the right (The tree) ──
  const sideTree = {
    lost: () => { const random = seeded(31); const flame = Array.from({ length: 5 }, (_, i) => `<path d="M${n(200 + Math.sin(i) * 6)} ${n(286 - i * 12)}q${n(-10 + random() * 20)} -10 ${n(-3 + random() * 6)} -20" stroke="${i % 2 ? "#e2783a" : "#f1c35a"}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".9"/>`).join(""); return svg("0 0 400 560", `${sky("sa", [[0, "#0e1015"], [1, "#25211c"]])}<rect width="400" height="560" fill="url(#sa)"/>${stars(random, 30, 400, 200)}<path d="M0 560V430H400V560Z" fill="#191612"/><path d="M0 430H140V350a60 60 0 0 1 120 0V430H400V470H0Z" fill="#2c2620" stroke="#433a30" stroke-width="2"/><path d="M140 430V350a60 60 0 0 1 120 0V430Z" fill="#0b0c0f"/>${bareTree(200, 430, 26, 33, "#1e1b18")}<g opacity=".95"><path d="M200 420V290" stroke="#d8d2c2" stroke-width="4"/><path d="M186 392h28" stroke="#d8d2c2" stroke-width="4"/>${flame}</g><circle cx="200" cy="330" r="70" fill="#e2783a" opacity=".08"/>`); },
    found: () => { const random = seeded(37); return svg("0 0 400 560", `${sky("sb", [[0, "#fbefc9"], [.5, "#e3efc4"], [1, "#9cc77a"]])}<rect width="400" height="560" fill="url(#sb)"/>${sun(330, 70, 22, 16, 2)}<path d="${wave(400, 30, 400, 560, 41)}" fill="#86bb68"/>${crownTree(210, 470, 72, 43)}<path d="M0 500C80 480 150 520 230 500S360 470 400 490V530C330 520 260 550 180 535S60 530 0 545Z" fill="#7fc3cf"/><path d="M0 545C60 530 120 548 200 538S330 524 400 532V560H0Z" fill="#5a9a4c"/>${meadow(random, 545, 560, 400, 40)}`); },
  };
  // ── D. River: a dry bed above, the river of life below, one channel through both (The river) ──
  const riverRiver = {
    lost: () => { const random = seeded(51); const bed = "M560 0C540 60 600 110 575 170S520 260 560 300H600C565 260 618 220 615 170S580 60 600 0Z"; const cracks = Array.from({ length: 14 }, (_, i) => `M${n(560 + random() * 40)} ${n(i * 21 + 4)}l${n(-6 + random() * 12)} ${n(6 + random() * 8)}`).join(""); return svg("0 0 800 300", `${sky("ra", [[0, "#1d1712"], [1, "#3a2d22"]])}<rect width="800" height="300" fill="url(#ra)"/>${stars(random, 25, 800, 110)}<path d="${wave(150, 40, 800, 300, 53)}" fill="#33281f"/><path d="${wave(210, 30, 800, 300, 55)}" fill="#2a211a"/><path d="${bed}" fill="#1a1410" stroke="#4d3d2e" stroke-width="1.5"/><path d="${cracks}" stroke="#4d3d2e" stroke-width="1.2" fill="none"/>${bareTree(700, 250, 22, 57, "#3b2f25")}${bareTree(420, 260, 16, 59, "#3b2f25")}`); },
    found: () => { const random = seeded(61); const water = "M560 0C545 70 610 120 585 180S500 260 520 300H700C640 260 690 210 660 160S600 60 600 0Z"; const glints = Array.from({ length: 22 }, () => { const y = random() * 290, x = 570 + (y / 300) * 40 + random() * 40; return `M${n(x)} ${n(y)}h${n(6 + random() * 10)}`; }).join(""); return svg("0 0 800 300", `${sky("rb", [[0, "#e8f2c9"], [1, "#a6cf84"]])}<rect width="800" height="300" fill="url(#rb)"/>${meadow(random, 40, 300, 800, 160)}<path d="${water}" fill="#6fbccb"/><path d="${glints}" stroke="#e9fbff" stroke-width="1.6" stroke-linecap="round"/>${crownTree(500, 150, 26, 63)}${crownTree(735, 130, 30, 65)}${crownTree(470, 270, 22, 67)}${crownTree(760, 275, 24, 69)}`); },
  };
  // ── E. Gate: shut at night, open in the morning (The way in) ──
  const wall = (fill, edge) => `<path d="M0 300V170H480V150H640V170H800V300Z" fill="${fill}" stroke="${edge}" stroke-width="1.5"/>${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 50}" y="158" width="26" height="14" fill="${fill}" stroke="${edge}" stroke-width="1.2"/>`).join("")}`;
  const gateWay = {
    lost: () => { const random = seeded(71); return svg("0 0 800 300", `${sky("ga", [[0, "#0c0f15"], [1, "#1f232b"]])}<rect width="800" height="300" fill="url(#ga)"/>${stars(random, 50, 800, 150)}${wall("#262a32", "#3a3f49")}<path d="M520 300V215a40 40 0 0 1 80 0V300Z" fill="#3b2e22" stroke="#594632" stroke-width="2"/><path d="M560 178V300M530 230h60M530 262h60" stroke="#594632" stroke-width="2.5"/><rect x="552" y="236" width="16" height="12" rx="2" fill="#7a6a55"/>`); },
    found: () => { const random = seeded(73); const light = Array.from({ length: 9 }, (_, i) => `M560 236L${n(430 + i * 32.5)} 300`).join(""); return svg("0 0 800 300", `${sky("gb", [[0, "#fbefc9"], [1, "#e3efc4"]])}<rect width="800" height="300" fill="url(#gb)"/>${sun(560, 90, 26, 22, 3)}${wall("#e9dcc0", "#c9b48d")}<path d="M520 300V215a40 40 0 0 1 80 0V300Z" fill="#fff4cf"/><path d="M520 215L490 222V300H520ZM600 215L630 222V300H600Z" fill="#c79e5b" stroke="#a37d43" stroke-width="1.5"/><path d="M0 300V250C200 236 400 244 520 250H600C700 244 760 240 800 244V300Z" fill="#7db463"/>${meadow(random, 255, 300, 800, 120)}<path d="M528 300L540 255H580L592 300Z" fill="#f1d58a" opacity=".85"/><path d="${light}" stroke="#f6dc8c" stroke-width="1" opacity=".5"/>`); },
  };
  // ── F. Night to morning: rain over a pool, then the sun rising on green hills (Pain and tears) ──
  const dawnTears = {
    lost: () => { const random = seeded(81); const rain = Array.from({ length: 120 }, () => { const x = random() * 860, y = 60 + random() * 200; return `M${n(x)} ${n(y)}l-6 16`; }).join(""); const ripples = Array.from({ length: 9 }, () => `<ellipse cx="${n(380 + random() * 400)}" cy="${n(262 + random() * 30)}" rx="${n(10 + random() * 20)}" ry="${n(2 + random() * 3)}" fill="none" stroke="#5d6573" stroke-width="1"/>`).join(""); return svg("0 0 800 300", `${sky("ta", [[0, "#151820"], [1, "#2a2f3a"]])}<rect width="800" height="300" fill="url(#ta)"/><path d="M300 70a50 50 0 0 1 90-24 60 60 0 0 1 110 10 40 40 0 0 1 60 44H290a30 30 0 0 1 10-30Z" fill="#3a404d"/><path d="M560 50a40 40 0 0 1 80-10 46 46 0 0 1 90 20 30 30 0 0 1 40 36H560a24 24 0 0 1 0-46Z" fill="#323845"/><path d="${rain}" stroke="#7d8696" stroke-width="1.1" opacity=".75"/><path d="M0 300V250H800V300Z" fill="#1b1f27"/>${ripples}`); },
    found: () => { const random = seeded(83); return svg("0 0 800 300", `${sky("tb", [[0, "#f9e3a4"], [.6, "#fbefc9"], [1, "#d9ebba"]])}<rect width="800" height="300" fill="url(#tb)"/>${sun(600, 190, 70, 30, 2.6)}<path d="${wave(200, 50, 800, 300, 85)}" fill="#9cc77a"/><path d="${wave(240, 40, 800, 300, 87)}" fill="#6fa856"/>${meadow(random, 250, 300, 800, 150)}`); },
  };

  // ── The cards ──
  const row = (name) => bookends.find((entry) => entry.name === name);
  const kindLabel = (entry) => (entry.kind === "shares" ? `Both verses say: ${entry.word}` : "This study's matching, and nothing more");
  const side = (tag, text, id, cls) => `<div class="lc-words ${cls}"><span class="lc-tag">${tag}</span><p class="lc-phrase">${text}</p><a class="lc-ref" href="./?sheet=${id}">${passages[id].label}</a></div>`;
  const middle = (entry) => (entry.middle.length ? `<p class="lc-mid">${entry.middle.map((item) => `<span>${item.t}</span> <a class="lc-ref" href="./?sheet=${item.r}">${item.label}</a>`).join("<i aria-hidden=\"true\">·</i>")}</p>` : `<p class="lc-mid lc-mid-none"><span>No prophet drawn between</span></p>`);
  const head = (entry) => `<h3 class="lc-name">${entry.name}</h3>`;
  const DESIGNS = [
    ["A", "Horizon", "The grave above the line, the meadow below it.", "Death", (entry) => `<article class="lc lc-stack"><div class="lc-half lc-dark"><div class="lc-art">${horizonDeath.lost()}</div>${head(entry)}${side("Lost", entry.startText, entry.start, "")}</div><div class="lc-seam">${middle(entry)}</div><div class="lc-half lc-light"><div class="lc-art">${horizonDeath.found()}</div>${side("Revelation answers", entry.lastText, entry.last, "")}<small class="lc-kind">${kindLabel(entry)}</small></div></article>`],
    ["B", "Diagonal", "Thorns on one side of a gold line, harvest on the other.", "The curse", (entry) => `<article class="lc lc-diag"><div class="lc-art">${diagonalCurse()}</div><div class="lc-diag-top lc-dark">${head(entry)}${side("Lost", entry.startText, entry.start, "")}</div><div class="lc-diag-bottom lc-light">${side("Revelation answers", entry.lastText, entry.last, "")}<small class="lc-kind">${kindLabel(entry)}</small></div></article>`],
    ["C", "Side by side", "The guarded way on the left, the tree of life on the right.", "The tree", (entry) => `<article class="lc lc-side"><div class="lc-half lc-dark"><div class="lc-art">${sideTree.lost()}</div>${head(entry)}${side("Lost", entry.startText, entry.start, "")}</div><div class="lc-seam lc-seam-side">${middle(entry)}</div><div class="lc-half lc-light"><div class="lc-art">${sideTree.found()}</div>${side("Revelation answers", entry.lastText, entry.last, "")}<small class="lc-kind">${kindLabel(entry)}</small></div></article>`],
    ["D", "One river", "A dry bed above, the river of life below, in one channel.", "The river", (entry) => `<article class="lc lc-stack"><div class="lc-half lc-dark"><div class="lc-art">${riverRiver.lost()}</div>${head(entry)}${side("Lost", entry.startText, entry.start, "")}</div><div class="lc-seam">${middle(entry)}</div><div class="lc-half lc-light"><div class="lc-art">${riverRiver.found()}</div>${side("Revelation answers", entry.lastText, entry.last, "")}<small class="lc-kind">${kindLabel(entry)}</small></div></article>`],
    ["E", "The gate", "Shut at night above, standing open in the morning below.", "The way in", (entry) => `<article class="lc lc-stack"><div class="lc-half lc-dark"><div class="lc-art">${gateWay.lost()}</div>${head(entry)}${side("Lost", entry.startText, entry.start, "")}</div><div class="lc-seam">${middle(entry)}</div><div class="lc-half lc-light"><div class="lc-art">${gateWay.found()}</div>${side("Revelation answers", entry.lastText, entry.last, "")}<small class="lc-kind">${kindLabel(entry)}</small></div></article>`],
    ["F", "Night to morning", "Rain on a pool above, the sun rising on green hills below.", "Pain and tears", (entry) => `<article class="lc lc-stack"><div class="lc-half lc-dark"><div class="lc-art">${dawnTears.lost()}</div>${head(entry)}${side("Lost", entry.startText, entry.start, "")}</div><div class="lc-seam">${middle(entry)}</div><div class="lc-half lc-light"><div class="lc-art">${dawnTears.found()}</div>${side("Revelation answers", entry.lastText, entry.last, "")}<small class="lc-kind">${kindLabel(entry)}</small></div></article>`],
  ];
  document.getElementById("cards").innerHTML = DESIGNS.map(([letter, title, line, name, build]) => {
    const entry = row(name);
    if (!entry) { console.error(`The hope to come: no row named "${name}"`); return ""; }
    return `<section class="lc-cell"><header><b>${letter}</b><h2>${title}</h2><p>${line}</p></header>${build(entry)}</section>`;
  }).join("");
})();
