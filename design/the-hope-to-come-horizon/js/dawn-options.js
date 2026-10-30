// Three more versions of the heading's drawing, for the owner to compare with the first on drawings.html. All are the same line hand
// and the same sun of righteousness rising (Malachi 4:2), with no face or figure of God or of Christ. ?drawing=2, 3 or 4 on the
// study's page shows that version in place. Fixed drawings, seeded, so they never change between visits.
(() => {
  if (!window.HZ) return;
  const { seeded, n, tree } = HZ.DRAW;
  const WIDE = 640, TALL = 440;
  const treeAt = (x, y, seed, scale, lean = 0, bare = false) => `<g transform="translate(${n(x)} ${n(y)}) scale(${scale})">${tree(0, 0, seed, lean, bare)}</g>`;

  // A sun and its rays, cut off wherever the shapes in `blockers` stand in front of them.
  function risingSun(id, cx, cy, radius, blockers) {
    const strong = [], fine = [];
    for (let i = 0; i < 120; i += 1) {
      const angle = (i * Math.PI * 2) / 120, cos = Math.cos(angle), sin = Math.sin(angle), start = radius + 12;
      if (Math.abs(sin) < .11) continue;
      // The longest rays stop just inside the picture, so they end as drawn lines and never run off its edge.
      const edge = 1 / Math.hypot(cos / (Math.min(cx, WIDE - cx) - 6), sin / (cy - 6));
      const end = Math.max(start + 8, edge * (i % 10 === 0 ? 1 : i % 5 === 0 ? .86 : i % 2 === 0 ? .66 : .5));
      (i % 5 === 0 ? strong : fine).push(`M${n(cx + cos * start)} ${n(cy + sin * start)}L${n(cx + cos * end)} ${n(cy + sin * end)}`);
    }
    return `<defs>
        <radialGradient id="${id}-glow"><stop offset="0" class="ln-glow-in"/><stop offset=".3" class="ln-glow-mid"/><stop offset="1" class="ln-glow-out"/></radialGradient>
        <mask id="${id}-cut" maskUnits="userSpaceOnUse" x="-80" y="-80" width="800" height="600"><rect x="-80" y="-80" width="800" height="600" fill="#fff" stroke="none"/><g fill="#000" stroke="#000">${blockers}</g></mask>
      </defs>
      <g mask="url(#${id}-cut)">
        <ellipse cx="${cx}" cy="${cy}" rx="${Math.min(cx, WIDE - cx)}" ry="${cy}" fill="url(#${id}-glow)" stroke="none"/>
        <path class="ln-gold" d="${strong.join("")}"/><path class="ln-gold ln-ray" d="${fine.join("")}"/>
        <circle class="ln-sun" cx="${cx}" cy="${cy}" r="${radius}"/><circle class="ln-gold" cx="${cx}" cy="${cy}" r="${radius}"/><circle class="ln-gold ln-faint" cx="${cx}" cy="${cy}" r="${radius + 8}"/>
        ${[1.35, 1.7, 2.1, 2.6, 3.1].map((times) => radius * times).filter((ring) => ring < Math.min(cy, cx, WIDE - cx) - 6).map((ring) => `<circle class="ln-ring" cx="${cx}" cy="${cy}" r="${n(ring)}"/>`).join("")}
      </g>`;
  }
  const svg = (body) => `<svg viewBox="0 0 ${WIDE} ${TALL}" style="overflow:hidden" aria-hidden="true">${body}</svg>`;

  // ── Over the whole world: the sun on the edge of the planet, its light running out across every land ──
  function wholeWorld() {
    const limb = (x) => 1040 - Math.sqrt(800 ** 2 - (x - 320) ** 2);
    const earth = `<circle cx="320" cy="1040" r="800"/>`;
    const latitudes = [], light = [], lands = [];
    [14, 34, 62, 100, 150].forEach((depth) => {
      const points = [];
      for (let x = -40; x <= 680; x += 20) points.push(`${x} ${n(limb(x) + depth * (1 + Math.abs(x - 320) / 900))}`);
      latitudes.push(`M${points.join("L")}`);
    });
    for (let i = -8; i <= 8; i += 1) {
      const bottomX = 320 + i * 70;
      (i % 2 ? light : lands).push(`M320 240Q${n(320 + i * 22)} 300 ${bottomX} ${TALL + 10}`);
    }
    const trees = [[150, 56, .3, 104], [492, 56, .3, 118], [58, 118, .62, 131], [584, 118, .62, 146]].map(([x, depth, scale, seed]) => ({ x, y: limb(x) + depth, scale, seed }));
    const range = (from, to, height, seed) => {
      const rise = seeded(seed); let d = `M${from} ${n(limb(from) + 2)}`;
      for (let x = from + 12; x < to; x += 12) d += `L${x} ${n(limb(x) - (x / 12 % 2 ? height * (.5 + rise() * .5) : height * .2))}`;
      return `${d}L${to} ${n(limb(to) + 2)}`;
    };
    const ranges = [range(30, 180, 26, 11), range(450, 610, 26, 19)].join("");
    return svg(`${risingSun("hz-world", 320, 240, 118, earth)}
      <path d="M-60 ${n(limb(-60))}${Array.from({ length: 39 }, (_, i) => `L${-60 + (i + 1) * 20} ${n(limb(-60 + (i + 1) * 20))}`).join("")}"/>
      <path class="ln-faint" d="${ranges}"/>
      <path class="ln-gold ln-ray" d="${light.join("")}"/><path class="ln-gold ln-faint" d="${lands.join("")}"/>
      <path class="ln-faint" d="${latitudes.join("")}"/>
      ${trees.map(({ x, y, scale, seed }) => treeAt(x, y, seed, scale, 0)).join("")}`);
  }

  // ── Healing what is wrong: the same land, dead on the far side of the light and alive under it ──
  function healing() {
    const ground = "M-40 352C120 372 300 318 680 300";
    const groundAt = (x) => { const t = (x + 40) / 720; return (1 - t) ** 3 * 352 + 3 * t * (1 - t) ** 2 * 372 + 3 * t * t * (1 - t) * 318 + t ** 3 * 300; };
    const land = `${ground}V${TALL + 20}H-40Z`;
    const random = seeded(733), cracks = [], stems = [], blooms = [];
    for (let i = 0; i < 26; i += 1) {
      let x = random() * 300, y = groundAt(x) + 8 + random() * 76, d = `M${n(x)} ${n(y)}`;
      for (let step = 0; step < 4; step += 1) { x += 5 + random() * 12; y += (random() - .5) * 8; d += `L${n(x)} ${n(y)}`; }
      cracks.push(d);
    }
    for (let i = 0; i < 300; i += 1) {
      const x = random() * WIDE, y = groundAt(x) + 5 + random() * (TALL - groundAt(x) - 8);
      if (random() > ((x - 170) / 300) ** 1.4 || x < 170) continue;
      const tall = 4 + (y - 300) * .05;
      stems.push(`M${n(x)} ${n(y)}v${n(-tall)}`);
      blooms.push(`<circle cx="${n(x)}" cy="${n(y - tall)}" r="${n(.9 + (y - 300) * .012)}"/>`);
    }
    const stones = [[196, 2], [226, -3], [256, 1]].map(([x, tilt]) => {
      const y = groundAt(x) + 22;
      return `<path transform="rotate(${tilt} ${x} ${y})" d="M${x - 9} ${y}V${y - 22}a9 9 0 0 1 18 0V${y}M${x - 14} ${y}h28"/>`;
    }).join("");
    const thorns = [[30, 392], [84, 418], [152, 404]].map(([x, y]) => `<path d="M${x} ${y}l-9 -12 6 3 -4 -14 8 8 3 -15 4 12 8 -9 -3 13 8 -3 -7 11"/>`).join("");
    const stream = "M408 306C424 330 376 346 410 372C442 396 500 402 494 446M430 304C450 328 412 344 442 366C478 390 544 400 548 446";
    const ripples = "M416 322h16M402 346h20M424 372h26M466 396h32M488 420h44";
    return svg(`${risingSun("hz-heal", 400, 268, 98, `<path d="${land}"/>`)}
      <path d="${ground}"/><path class="ln-faint" d="${cracks.join("")}"/>${thorns}${stones}
      ${treeAt(128, 392, 509, 1.25, -.03, true)}
      <path class="ln-gold" d="${stream}"/><path class="ln-gold ln-faint" d="${ripples}"/>
      <path class="ln-faint" d="${stems.join("")}"/><g class="ln-gold ln-fruit">${blooms.join("")}</g>
      ${treeAt(538, 410, 313, 1.25, .03)}`);
  }

  // ── The river from the sun: one point on the horizon, the water and the leaves for healing coming towards the reader ──
  function riverFromTheSun() {
    const HORIZON = 212, FAR = TALL - HORIZON;
    const halfWidth = (t) => 3 + 300 * t ** 1.5;
    const bank = (side) => { const points = []; for (let t = 0; t <= 1.001; t += .05) points.push(`${n(320 + side * halfWidth(t))} ${n(HORIZON + FAR * t)}`); return `M${points.join("L")}`; };
    // A long range rising from the horizon and sinking back to it, with no end wall.
    const ridge = (side) => {
      const rise = seeded(side > 0 ? 61 : 37); let d = `M${320 + side * 50} ${HORIZON}`;
      for (let x = 72; x < 330; x += 22) {
        const envelope = Math.sin(((x - 50) / 280) * Math.PI);
        d += `L${320 + side * x} ${n(HORIZON - envelope * (Math.round(x / 22) % 2 ? 34 + rise() * 22 : 14 + rise() * 8))}`;
      }
      return `${d}L${320 + side * 330} ${HORIZON}`;
    };
    const below = `<rect x="-80" y="${HORIZON}" width="800" height="300"/>`;
    const random = seeded(557), glitter = [], stems = [], blooms = [], furrows = [];
    for (let t = .03; t < 1; t += .018 + t * .05) {
      const wide = halfWidth(t), y = HORIZON + FAR * t;
      for (let i = 0; i < 2 + Math.floor(t * 4); i += 1) {
        const start = 320 + (random() * 1.5 - .75) * wide, length = 3 + (10 + 40 * random()) * t;
        glitter.push(`M${n(start)} ${n(y)}h${n(length)}`);
      }
    }
    for (let i = 1; i <= 5; i += 1) [-1, 1].forEach((side) => furrows.push(`M${320 + side * (10 + i * 44)} ${HORIZON}L${320 + side * (340 + i * 170)} ${TALL + 10}`));
    for (let i = 0; i < 240; i += 1) {
      const t = .06 + Math.pow(random(), .6) * .94, x = random() * WIDE, y = HORIZON + FAR * t;
      if (Math.abs(x - 320) < halfWidth(t) + 5) continue;
      const tall = 2 + t * 9;
      stems.push(`M${n(x)} ${n(y)}v${n(-tall)}`);
      blooms.push(`<circle cx="${n(x)}" cy="${n(y - tall)}" r="${n(.7 + t * 1.8)}"/>`);
    }
    const trees = [.2, .36, .62].flatMap((t, i) => [-1, 1].map((side) => {
      const x = 320 + side * (halfWidth(t) + 26 + t * 90), y = HORIZON + FAR * t;
      return treeAt(x, y, 800 + i * 7 + side, +(.08 + t * 1.25).toFixed(2), side * -.05);
    }));
    return svg(`${risingSun("hz-river", 320, HORIZON, 92, `${below}<path d="${ridge(-1)}"/><path d="${ridge(1)}"/>`)}
      <path d="${ridge(-1)}"/><path d="${ridge(1)}"/><path d="M-40 ${HORIZON}H680"/>
      <path class="ln-faint" d="${furrows.join("")}"/>
      <path class="ln-wash ln-gold" d="${bank(-1)}L${320 + halfWidth(1)} ${TALL}${bank(1).replace("M", "L").split("L").reverse().filter(Boolean).map((point) => `L${point}`).join("")}Z"/>
      <path class="ln-gold" d="${bank(-1)}"/><path class="ln-gold" d="${bank(1)}"/><path class="ln-gold ln-ray" d="${glitter.join("")}"/>
      <path class="ln-faint" d="${stems.join("")}"/><g class="ln-gold ln-fruit">${blooms.join("")}</g>
      ${trees.join("")}`);
  }

  HZ.DRAWINGS.push(wholeWorld(), healing(), riverFromTheSun());
  const chosen = HZ.DRAWINGS[Number(new URLSearchParams(location.search).get("drawing")) - 1];
  if (chosen) HZ.LINE_ART = chosen;
})();
