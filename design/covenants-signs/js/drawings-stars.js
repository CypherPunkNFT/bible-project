// The Count the stars drawing with four different grounds, chosen with the floating A B C D pill: ?drawing=a, b, c or d.
// The sky is the same in all four. Seeded, so they never change between visits.
(() => {
  const { seeded, fixed, starSky } = CovDrawings;
  const fade = `<defs>
    <linearGradient id="cl-fade-x"><stop offset="0" stop-color="#000"/><stop offset=".12" stop-color="#fff"/><stop offset=".88" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
    <linearGradient id="cl-fade-y" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".9" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
    <mask id="cl-fade-sides" maskUnits="userSpaceOnUse" x="0" y="0" width="760" height="630"><rect width="760" height="630" fill="url(#cl-fade-x)"/></mask>
    <mask id="cl-fade-foot" maskUnits="userSpaceOnUse" x="0" y="0" width="760" height="630"><rect width="760" height="630" fill="url(#cl-fade-y)"/></mask></defs>`;
  const picture = (ground) => `<svg viewBox="0 0 760 630" aria-hidden="true">${starSky()}${fade}<g mask="url(#cl-fade-sides)"><g mask="url(#cl-fade-foot)">${ground}</g></g></svg>`;
  const shape = (d) => `<path class="cl-cover" d="${d}"/><path d="${d}"/>`;
  const man = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-34" r="4.500"/><path class="cl-cover" d="M-1-29c-7 3-9 15-11 34h22c-1-18-3-31-11-34Z"/><path d="M-1-29c-7 3-9 15-11 34h22c-1-18-3-31-11-34ZM3-25l11-12"/><path class="cl-faint" d="M18 6l5-42"/></g>`;
  const tent = (x, y, s) => shape(`M${x - 40 * s} ${y}L${x} ${y - 34 * s}L${x + 40 * s} ${y}Z`) + `<path d="M${x} ${y - 34 * s}V${y}M${x - 8 * s} ${y}L${x} ${y - 20 * s}L${x + 8 * s} ${y}"/>`;

  // A. Dunes: great sharp-crested ridges of sand, shaded on the side away from the light, with one small man on the near crest.
  function dunes() {
    const random = seeded(6101);
    const dune = (base, height, width, phase) => (x) => base - height * (1 - Math.abs(Math.sin(x / width + phase))) ** 1.6;
    const ridges = [dune(470, 30, 190, 0.5), dune(530, 62, 250, 2.2), dune(598, 72, 330, 0.9)];
    const body = ridges.map((crest, index) => {
      let line = "", hatch = "";
      for (let x = -40; x <= 800; x += 4) line += `${x === -40 ? "M" : "L"}${x} ${fixed(crest(x))}`;
      for (let x = -40; x <= 800; x += 3 + random() * 3) {
        if (crest(x + 3) - crest(x - 3) <= 0.5) continue; // only the side turned away from the light
        const fall = crest(x + 3) - crest(x - 3);
        hatch += `M${fixed(x)} ${fixed(crest(x) + 2)}l${fixed(-5 - random() * 5)} ${fixed((14 + index * 26) * (0.4 + random() * 0.6) + fall * 6)}`;
      }
      let ripples = "";
      for (let i = 0; i < 4 + index * 4; i++) {
        const x = random() * 700, y = crest(x) + 16 + random() * 30, w = 30 + random() * 80;
        ripples += `M${fixed(x)} ${fixed(y)}c${fixed(w * 0.3)} -4 ${fixed(w * 0.7)} -4 ${fixed(w)} 0`;
      }
      return `<path class="cl-cover" d="${line}V650H-40Z"/><path class="cl-tick" d="${hatch}"/><path class="cl-line-soft" d="${ripples}"/><path class="${index === 0 ? "" : "cl-bold"}" d="${line}"/>`;
    }).join("");
    let peak = 200;
    for (let x = 200; x < 560; x += 2) if (ridges[1](x) < ridges[1](peak)) peak = x;
    return body + man(peak, ridges[1](peak), 0.8);
  }

  // B. The oaks of Mamre: great trees, the tents beneath them, and the altar Abram built.
  function oaks() {
    const random = seeded(2741);
    const tree = (x, y, length, depth) => {
      let limbs = "", bole = "", leaves = "";
      const grow = (ax, ay, angle, size, level) => {
        const bx = ax + Math.cos(angle) * size, by = ay + Math.sin(angle) * size;
        const part = `M${fixed(ax)} ${fixed(ay)}Q${fixed((ax + bx) / 2 + (random() - 0.5) * size * 0.3)} ${fixed((ay + by) / 2 + (random() - 0.5) * size * 0.3)} ${fixed(bx)} ${fixed(by)}`;
        if (level >= depth - 1) bole += part; else limbs += part;
        if (level === 0) {
          for (let i = 0; i < 2; i++) leaves += `<ellipse cx="${fixed(bx + (random() - 0.5) * 8)}" cy="${fixed(by + (random() - 0.5) * 8)}" rx="5" ry="2" transform="rotate(${fixed(random() * 180)} ${fixed(bx)} ${fixed(by)})"/>`;
          return;
        }
        const spread = 0.34 + random() * 0.36;
        grow(bx, by, angle - spread, size * (0.7 + random() * 0.1), level - 1);
        grow(bx, by, angle + spread, size * (0.7 + random() * 0.1), level - 1);
        if (level > depth - 3) grow(bx, by, angle + (random() - 0.5) * 0.3, size * 0.66, level - 1);
      };
      grow(x, y, -Math.PI / 2 + (random() - 0.5) * 0.12, length, depth);
      return `<path class="cl-oak" d="${limbs}"/><path class="cl-oak cl-bole" d="${bole}"/><g class="cl-leaf">${leaves}</g>`;
    };
    const ground = "M-40 476C120 456 280 466 420 480S660 472 800 462V650H-40Z";
    const near = "M-40 566C140 540 300 556 470 576S700 566 800 552V650H-40Z";
    const stones = [[344, 526, 25], [370, 526, 26], [397, 526, 25], [357, 512, 26], [384, 512, 26], [370, 498, 26]]
      .map(([x, y, w]) => `<rect class="cl-cover" x="${x}" y="${y}" width="${w}" height="14" rx="3.500"/><rect x="${x}" y="${y}" width="${w}" height="14" rx="3.500"/>`).join("");
    return shape(ground) + tree(120, 556, 56, 6) + tree(664, 530, 48, 6) + tree(250, 486, 22, 5) + tree(560, 490, 24, 5) +
      tent(182, 528, 1) + tent(70, 548, 1.2) + tent(612, 520, 0.9) + stones +
      `<path class="cl-gold cl-flame" d="M383 472c6 8 9 13 9 18a9 9 0 0 1-18 0c0-5 3-10 9-18Z"/><path class="cl-faint" d="M387 466c-6-8 6-12 0-21M378 464c-4-6 4-10 0-16"/>` +
      shape(near) + `<path class="cl-line-soft" d="M60 596c60-8 120-8 170 0M420 606c70-8 150-10 230-2"/>` + man(476, 566, 1.3);
  }

  // C. The land: "to your offspring I will give this land." Rounded hill country, terraced, range behind range, with a gold road
  // winding down from the horizon to one man.
  function land() {
    const random = seeded(4407);
    const ranges = [[480, 50, 90, 14, 26], [512, 80, 130, 26, 44], [558, 110, 170, 36, 56], [622, 160, 230, 50, 72]];
    const hills = ranges.map(([base, smallest, largest, lowest, highest], index) => {
      let drawn = "";
      for (let x = -80 + random() * 40; x < 860;) {
        const r = smallest + random() * (largest - smallest), tall = lowest + random() * (highest - lowest);
        const arc = (scale) => `M${fixed(x - r * (1 - (1 - scale) * 0.2))} ${base}A${fixed(r * (1 - (1 - scale) * 0.2))} ${fixed(tall * scale)} 0 0 1 ${fixed(x + r * (1 - (1 - scale) * 0.2))} ${base}`;
        let terraces = "";
        for (let row = 1; row <= 1 + index; row++) terraces += arc(1 - row / (2 + index));
        drawn += `<path class="cl-cover" d="${arc(1)}V${base + 90}H${fixed(x - r)}Z"/><path class="cl-tick" d="${terraces}"/><path class="${index < 2 ? "" : "cl-bold"}" d="${arc(1)}"/>`;
        x += r * (0.9 + random() * 0.4);
      }
      return drawn;
    }).join("");
    const road = [[380, 476], [414, 492], [362, 516], [434, 552], [300, 596], [214, 640]];
    const strokes = road.slice(1).map(([bx, by], i) => {
      const [ax, ay] = road[i], before = road[i - 1] ?? road[i], after = road[i + 2] ?? [bx, by];
      return `<path class="cl-gold" style="stroke-width:${fixed(0.8 + i * 0.5)}" d="M${ax} ${ay}C${fixed(ax + (bx - before[0]) / 6)} ${fixed(ay + (by - before[1]) / 6)} ${fixed(bx - (after[0] - ax) / 6)} ${fixed(by - (after[1] - ay) / 6)} ${bx} ${by}"/>`;
    }).join("");
    return hills + strokes + man(300, 594, 0.95);
  }

  // D. The seashore: the sea to the horizon and sand past counting, as many as the stars.
  function seashore() {
    const random = seeded(9091);
    const shore = (x) => 548 + 22 * Math.sin(x / 150 + 0.8) + 7 * Math.sin(x / 53);
    let waves = "", glints = "", sand = "", edge = "";
    for (let y = 476, gap = 5; y < 548; y += gap, gap *= 1.16) {
      for (let x = -40 + random() * 60; x < 800; x += 26 + random() * 70 * (y / 480)) {
        const w = (12 + random() * 46) * (0.5 + (y - 470) / 60);
        if (y < shore(x) - 2 && y < shore(x + w) - 2) {
          const part = `M${fixed(x)} ${fixed(y)}q${fixed(w / 2)} -2 ${fixed(w)} 0`;
          if (Math.abs(x + w / 2 - 380) < 34 + (y - 470) * 0.5 && random() < 0.75) glints += part; else waves += part;
        }
      }
    }
    for (let x = -40; x <= 800; x += 8) edge += `${x === -40 ? "M" : "L"}${x} ${fixed(shore(x))}`;
    let foam = "";
    for (let x = -40; x <= 800; x += 8) foam += `${x === -40 ? "M" : "L"}${x} ${fixed(shore(x) - 7 - 3 * Math.sin(x / 31))}`;
    for (let i = 0; i < 2600; i++) {
      const x = random() * 840 - 40, depth = Math.pow(random(), 1.5) * (650 - shore(x));
      sand += `<circle cx="${fixed(x)}" cy="${fixed(shore(x) + 2 + depth)}" r="${fixed(0.35 + random() * 0.55 + depth * 0.006)}"/>`;
    }
    let steps = "";
    for (let i = 0; i < 9; i++) steps += `<ellipse cx="${fixed(640 - i * 19 + (i % 2) * 6)}" cy="${fixed(628 - i * 6.5 - (i % 2) * 5)}" rx="${fixed(5 - i * 0.28)}" ry="${fixed(2.2 - i * 0.1)}"/>`;
    return `<path class="cl-cover" d="M-40 470H800V650H-40Z"/><path class="cl-bold" d="M-40 470H800"/>
      <path class="cl-trail" d="${waves}"/><path class="cl-gold cl-trail-gold" d="${glints}"/>
      <path class="cl-cover" d="${edge}V650H-40Z"/><path class="cl-faint" d="${foam}"/><path d="${edge}"/>
      <g class="cl-sand">${sand}</g><g class="cl-sand cl-steps">${steps}</g>${man(476, 584, 1.05)}`;
  }

  CovDrawings.stars = { a: picture(dunes()), b: picture(oaks()), c: picture(land()), d: picture(seashore()) };
})();
