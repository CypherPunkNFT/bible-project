// The second set of grounds under the Count the stars sky: ?drawing=e, f, g, h or i. Same sky, seeded, so they never change between visits.
(() => {
  const { seeded, fixed, starSky, starKit } = CovDrawings;
  const { picture, shape, man } = starKit;
  const solid = (d) => `<path fill="currentColor" stroke="none" d="${d}"/>`;
  const skyLine = (top) => {
    let line = "";
    for (let x = -40; x <= 800; x += 6) line += `${x === -40 ? "M" : "L"}${x} ${fixed(top(x))}`;
    return line;
  };

  // E. The flock: sheep scattered up a hillside, small and far to large and near, a stone fold, and the shepherd.
  function flock() {
    const random = seeded(3313);
    const far = (x) => 478 + 10 * Math.sin(x / 210 + 0.4) + 3 * Math.sin(x / 67);
    const near = (x) => 572 - 14 * Math.sin(x / 260 + 2.2);
    const sheep = (x, y, size, facing, grazing) => {
      const head = grazing ? `<ellipse cx="-15" cy="3" rx="4.200" ry="2.700" transform="rotate(-28 -15 3)"/>` : `<ellipse cx="-15" cy="-11" rx="4.200" ry="2.800" transform="rotate(18 -15 -11)"/>`;
      const wool = "M-12 0c-4-1-5-7-1-9c0-5 6-7 9-4c3-4 9-4 11 0c5-2 9 2 7 6c3 2 2 7-2 7Z";
      return `<g transform="translate(${fixed(x)} ${fixed(y)}) scale(${fixed(size * facing)} ${fixed(size)})"><path d="M-7 0v6M-3 0v6M4 0v6M8 0v6"/><path class="cl-cover" d="${wool}"/><path d="${wool}"/><g fill="currentColor">${head}</g></g>`;
    };
    // Spots are thrown at random and rejected when too close, so the flock clusters unevenly and never forms a pattern.
    const spots = [];
    for (let tries = 0; tries < 900 && spots.length < 34; tries++) {
      const x = 40 + random() * 680, y = far(x) + 8 + Math.pow(random(), 0.8) * 136, size = 0.3 + ((y - 480) / 150) * 0.85;
      const clear = spots.every((s) => Math.hypot(s.x - x, (s.y - y) * 1.8) > 22 + size * 26);
      const fold = x > 500 && x < 700 && y > 492 && y < 566;
      if (clear && !fold && (random() < 0.45 || Math.abs(x - 300) < 170)) spots.push({ x, y, size });
    }
    spots.sort((a, b) => a.y - b.y);
    const animals = spots.map((s) => sheep(s.x, s.y, s.size, random() < 0.5 ? 1 : -1, random() < 0.68)).join("");
    let tufts = "";
    for (let i = 0; i < 90; i++) {
      const x = random() * 760, y = far(x) + 6 + random() * 150, s = 1 + (y - 480) / 60;
      tufts += `M${fixed(x)} ${fixed(y)}l${fixed(-1.5 * s)} ${fixed(-3 * s)}M${fixed(x)} ${fixed(y)}l0 ${fixed(-4 * s)}M${fixed(x)} ${fixed(y)}l${fixed(1.5 * s)} ${fixed(-3 * s)}`;
    }
    // The fold: a ring of stones laid one by one, far side first, with a gap where the sheep go in.
    let wall = "";
    for (let pass = 0; pass < 2; pass++) {
      for (let angle = pass ? 0.35 : Math.PI + 0.05; angle < (pass ? Math.PI - 0.1 : 2 * Math.PI); angle += 0.15 + random() * 0.09) {
        for (let course = 0; course < 2; course++) {
          const ring = pass ? 74 : 72, x = 600 + Math.cos(angle) * ring + (random() - 0.5) * 4, y = 528 + Math.sin(angle) * ring * 0.36 - course * 4.5 + random();
          const w = 5 + random() * 8;
          wall += `<rect class="cl-cover" x="${fixed(x - w / 2)}" y="${fixed(y)}" width="${fixed(w)}" height="4.500" rx="2"/><rect class="cl-stone" x="${fixed(x - w / 2)}" y="${fixed(y)}" width="${fixed(w)}" height="4.500" rx="2"/>`;
        }
      }
    }
    const inside = [[590, 526, 0.42], [622, 520, 0.38], [608, 538, 0.46]].map(([x, y, s], i) => sheep(x, y, s, i ? 1 : -1, i !== 1)).join("");
    return `<path class="cl-cover" d="${skyLine(far)}V650H-40Z"/><path d="${skyLine(far)}"/><path class="cl-line-soft" d="${skyLine(near)}"/><path class="cl-tick" d="${tufts}"/>` + wall.slice(0, wall.length / 2) + inside + animals + wall.slice(wall.length / 2) + man(168, 596, 1.15);
  }

  // F. The caravan: camels and riders in one long line along a bare ridge, with stones and thorn in the foreground.
  function caravan() {
    const random = seeded(7717);
    const ridge = (x) => 512 - 20 * Math.sin(x / 300 + 0.4) + 2.5 * Math.sin(x / 41);
    const front = (x) => 590 + 12 * Math.sin(x / 170 + 1.8);
    const camelBody = "M-18-19C-17-27-10-28-6-35C-3-40 2-38 4-31C6-27 10-25 14-26C16-31 16-39 19-43C21-46 26-46 28-44L30-42L24-40C22-36 22-28 20-22C18-17 14-15 12-14L14 0H11L8-13H-6L-9 0H-12L-12-13C-16-14-18-16-18-19Z";
    const rider = "M-4-37C-5-44-3-48 0-49C3-48 5-44 3-37ZM0-54a3 3 0 1 0 .01 0Z";
    const pack = "M-14-29C-11-37 4-39 8-30C4-27-10-26-14-29Z";
    const camels = [];
    for (let x = 650, i = 0; i < 9; i++) {
      const size = 0.62 + random() * 0.1, y = ridge(x);
      const load = i % 3 === 0 ? rider : random() < 0.6 ? pack : "";
      camels.push(`<g transform="translate(${fixed(x)} ${fixed(y)}) scale(${fixed(size)})">${solid(camelBody + load)}</g>`);
      const next = x - (34 + random() * 22);
      if (i < 8) camels.push(`<path class="cl-faint" d="M${fixed(next + 18)} ${fixed(ridge(next) - 26 * size)}Q${fixed(x - 26)} ${fixed(y - 12)} ${fixed(x - 11)} ${fixed(y - 13)}"/>`);
      x = next;
    }
    let tracks = "";
    for (let x = 80; x < 640; x += 9 + random() * 12) tracks += `M${fixed(x)} ${fixed(ridge(x) + 4 + random() * 2)}h${fixed(2 + random() * 3)}`;
    const thorn = (x, y, s) => {
      let d = "";
      for (let i = 0; i < 11; i++) {
        const angle = -Math.PI * (0.12 + (i / 10) * 0.76), length = (12 + random() * 15) * s, bx = x + Math.cos(angle) * length, by = y + Math.sin(angle) * length;
        d += `M${x} ${y}L${fixed(bx)} ${fixed(by)}M${fixed(bx * 0.6 + x * 0.4)} ${fixed(by * 0.6 + y * 0.4)}l${fixed(random() * 7 - 3.5)} ${fixed(-2 - random() * 4)}`;
      }
      return `<path d="${d}"/>`;
    };
    let stones = "";
    for (let i = 0; i < 26; i++) {
      const x = random() * 760, y = front(x) + 4 + random() * 34, w = 6 + random() * 22, tall = 3 + random() * 8;
      const d = `M${fixed(x)} ${fixed(y)}c${fixed(w * 0.1)} ${fixed(-tall)} ${fixed(w * 0.7)} ${fixed(-tall * (0.8 + random() * 0.4))} ${fixed(w)} 0Z`;
      stones += shape(d);
    }
    return `<path class="cl-cover" d="${skyLine(ridge)}V650H-40Z"/><path class="cl-bold" d="${skyLine(ridge)}"/><path class="cl-tick" d="${tracks}"/>` + camels.join("") +
      man(696, ridge(696), 0.62) +
      `<path class="cl-cover" d="${skyLine(front)}V650H-40Z"/><path d="${skyLine(front)}"/>` + stones + thorn(96, front(96) + 8, 1) + thorn(612, front(612) + 18, 1.3) + thorn(330, front(330) + 26, 0.7);
  }

  // G. The harvest: "seedtime and harvest shall never cease." Standing in the wheat, ears close at the sides and the field running away to a low horizon.
  function harvest() {
    const random = seeded(8123);
    const horizon = (x) => 490 + 5 * Math.sin(x / 190 + 1);
    const stalk = (x, height, lean, size) => {
      const baseY = 660, tipX = x + lean, tipY = baseY - height;
      let grains = "", awns = "";
      const angle = Math.atan2(tipY - (baseY - height * 0.5), tipX - (x + lean * 0.25));
      const count = 7 + Math.floor(random() * 4);
      for (let i = 0; i < count; i++) {
        const t = i * 3.6 * size, gx = tipX + Math.cos(angle) * t, gy = tipY + Math.sin(angle) * t;
        for (const side of [-1, 1]) {
          const a = angle + side * 0.42, cx = gx + Math.cos(a) * 3.4 * size, cy = gy + Math.sin(a) * 3.4 * size;
          grains += `<ellipse cx="${fixed(cx)}" cy="${fixed(cy)}" rx="${fixed(3.4 * size)}" ry="${fixed(1.5 * size)}" transform="rotate(${fixed((a * 180) / Math.PI)} ${fixed(cx)} ${fixed(cy)})"/>`;
          awns += `M${fixed(cx)} ${fixed(cy)}l${fixed(Math.cos(a) * (9 + random() * 7) * size)} ${fixed(Math.sin(a) * (9 + random() * 7) * size)}`;
        }
      }
      return `<path class="cl-straw" d="M${fixed(x)} ${baseY}Q${fixed(x + lean * 0.25)} ${fixed(baseY - height * 0.5)} ${fixed(tipX)} ${fixed(tipY)}"/><g class="cl-gold cl-grain">${grains}</g><path class="cl-gold cl-awn" d="${awns}"/>`;
    };
    let field = "";
    for (let y = 498, gap = 4; y < 610; y += gap, gap *= 1.2) {
      for (let x = -40 + random() * 24; x < 800; x += (7 + random() * 12) * (1 + (y - 490) / 26)) {
        const s = 1 + (y - 490) / 16;
        field += `M${fixed(x)} ${fixed(y)}q${fixed(s)} ${fixed(-s)} ${fixed(s * 1.5)} ${fixed(-s * 2.6)}`;
      }
    }
    const sheaf = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path class="cl-cover" d="M-9 0L-3-14L-12-34L12-34L3-14L9 0Z"/><path d="M-9 0L-3-14L-12-34M-5 0L-1-14L-6-36M0 0V-37M5 0L1-14L6-36M9 0L3-14L12-34"/><path class="cl-gold cl-bold" d="M-4-14H4"/></g>`;
    // The tall ears stand at the sides so the eye runs up the open middle to the horizon; widths are uneven so no rows appear.
    let ears = "";
    const places = [];
    for (let i = 0; i < 34; i++) {
      const side = i % 2 ? -1 : 1, reach = Math.pow(random(), 0.75);
      places.push({ x: 380 + side * (70 + reach * 320), reach });
    }
    places.sort((a, b) => a.reach - b.reach);
    for (const { x, reach } of places) ears += stalk(x, 74 + reach * 126 + random() * 30, 9 + random() * 15, 1 + reach * 0.85);
    return `<path class="cl-cover" d="${skyLine(horizon)}V650H-40Z"/><path d="${skyLine(horizon)}"/><path class="cl-tick" d="${field}"/>` +
      sheaf(308, 526, 0.5) + sheaf(342, 530, 0.56) + sheaf(420, 524, 0.48) + man(376, 548, 0.62) + ears;
  }

  // H. The still water: the same sky lies upside down in a lake, broken by ripples, with far shore and reeds.
  function stillWater() {
    const random = seeded(1949);
    const mirrored = starSky().replace(/<defs>.*?<\/defs>/s, "");
    let breaks = "", ripples = "";
    for (let y = 478, gap = 7; y < 650; y += gap, gap *= 1.12) {
      for (let x = -40 + random() * 90; x < 800; x += 70 + random() * 190) {
        const w = (10 + random() * 40) * (0.6 + (y - 470) / 80);
        breaks += `<rect x="${fixed(x)}" y="${fixed(y)}" width="${fixed(w)}" height="${fixed(0.5 + (y - 470) / 100)}"/>`;
        if (random() < 0.5) ripples += `M${fixed(x)} ${fixed(y)}h${fixed(w)}`;
      }
    }
    const shore = "M-40 470C40 462 90 448 170 452S270 468 340 470H460C510 468 590 438 660 446S760 464 800 470";
    const reed = (x, height, lean) => `M${fixed(x)} 650Q${fixed(x + lean * 0.2)} ${fixed(650 - height * 0.6)} ${fixed(x + lean)} ${fixed(650 - height)}`;
    let reeds = "", heads = "";
    for (let i = 0; i < 44; i++) {
      const side = i % 2 ? 1 : -1, reach = Math.pow(random(), 1.6), x = 380 + side * (380 - reach * 200);
      const height = 40 + (1 - reach) * 96 + random() * 40, lean = (random() - 0.4) * 22;
      reeds += reed(x, height, lean);
      if (random() < 0.34) heads += `<rect x="${fixed(x + lean - 2)}" y="${fixed(650 - height - 3)}" width="4" height="${fixed(12 + random() * 6)}" rx="2"/>`;
    }
    return `<g class="cl-mirror" transform="translate(0 728.500) scale(1 -.55)">${mirrored}</g><g class="cl-cover">${breaks}</g><path class="cl-tick" d="${ripples}"/>` +
      `<path class="cl-cover" d="${shore}V470H-40Z"/><path d="${shore}"/><path d="M-40 470H800"/>` + `<path class="cl-line-soft" d="${reeds}"/><g class="cl-reed">${heads}</g>`;
  }

  // I. The ark at rest: the mountain tops of Ararat breaking through the cloud as the waters go down, and the dove coming back.
  function ark() {
    const random = seeded(2288);
    const jag = (ax, ay, bx, by, rough, depth) => {
      if (depth === 0) return [[bx, by]];
      const mx = (ax + bx) / 2 + (random() - 0.5) * rough * 0.5, my = (ay + by) / 2 + (random() - 0.5) * rough;
      return [...jag(ax, ay, mx, my, rough * 0.55, depth - 1), ...jag(mx, my, bx, by, rough * 0.55, depth - 1)];
    };
    const peak = (x, top, base, spread, weight) => {
      const left = jag(x - spread, base, x, top, spread * 0.22, 4), right = jag(x, top, x + spread, base, spread * 0.22, 4);
      const outline = [[x - spread, base], ...left, ...right];
      const d = outline.map(([a, b], i) => `${i ? "L" : "M"}${fixed(a)} ${fixed(b)}`).join("");
      let shade = "";
      right.forEach(([a, b], i) => {
        if (i % 2 || a < x + 6) return;
        shade += `M${fixed(a)} ${fixed(b + 2)}l${fixed(-10 - random() * 16)} ${fixed(10 + random() * (base - b) * 0.55)}`;
      });
      return `<path class="cl-cover" d="${d}Z"/><path class="cl-tick" d="${shade}"/><path class="${weight}" d="${d}"/>`;
    };
    const cloud = (y, seed) => {
      const r = seeded(seed);
      let top = "M-40 650V" + y, x = -40;
      while (x < 800) {
        const w = 26 + r() * 64, h = 6 + r() * 18;
        top += `q${fixed(w / 2)} ${fixed(-h)} ${fixed(w)} 0`;
        x += w;
      }
      return `<path class="cl-cover" d="${top}V650Z"/><path class="cl-line-soft" d="${top.replace("M-40 650V", "M-40 ")}"/>`;
    };
    const hull = "M-72-12C-62 2-44 8-18 8H24C48 8 66 2 76-14L66-11H-62Z";
    const house = "M-46-12V-30H44V-12ZM-52-30L0-42L50-30Z";
    let planks = "";
    for (const y of [-6, -1, 4]) planks += `M${-62 + Math.abs(y) * 1.6} ${y}Q2 ${y + 2.6} ${64 - Math.abs(y) * 1.6} ${y}`;
    let windows = "";
    for (let x = -38; x <= 30; x += 17) windows += `<rect x="${x}" y="-25" width="8" height="6"/>`;
    const vessel = `<g transform="translate(330 438) rotate(-3) scale(.92)"><path class="cl-cover" d="${house}"/><path d="${house}"/><g class="cl-line-soft">${windows}</g><path class="cl-cover" d="${hull}"/><path class="cl-bold" d="${hull}"/><path class="cl-line-soft" d="${planks}"/><path class="cl-gold" d="M-8 3V-7H4V3"/></g>`;
    const dove = `<g transform="translate(508 410)"><path class="cl-cover" d="M-13 1C-6-3 2-3 9 0C11-2 14-2 15 0L19 1L15 2C12 6 3 8-5 5L-16 7Z"/><path d="M-13 1C-6-3 2-3 9 0C11-2 14-2 15 0L19 1L15 2C12 6 3 8-5 5L-16 7Z"/><path d="M-3-1C-8-9-6-15 1-20C4-13 5-7 3-1"/><path class="cl-gold" d="M19 1L28 5M23 3L25 0M25 4L28 2"/></g>`;
    return peak(82, 486, 590, 170, "") + peak(676, 470, 590, 200, "") + peak(520, 498, 590, 130, "") +
      cloud(528, 11) + peak(330, 444, 600, 190, "cl-bold") + vessel + dove + peak(158, 512, 610, 130, "") + peak(610, 522, 620, 150, "") +
      cloud(558, 23) + cloud(596, 37);
  }

  Object.assign(CovDrawings.stars, { e: picture(flock()), f: picture(caravan()), g: picture(harvest()), h: picture(stillWater()), i: picture(ark()) });
})();
