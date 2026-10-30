// The heading's line drawing: the sun of righteousness rising over the curve of a renewed earth (Malachi 4:2). The city stands
// before it with its gates open, the river runs out of the city, the tree of life stands on each bank (Revelation 22:1-2), and a
// shoot rises from a cut stump (Isaiah 11:1). Illustrative only: no face or
// figure of God or of Christ, no wings on the sun. Fixed drawing built here and seeded, so it never changes between visits.
(() => {
  if (!window.HZ) return;
  const WIDE = 640, TALL = 440, SUN = [320, 215];
  const seeded = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const n = (value) => value.toFixed(1);

  // What stands in front of the sun and its rays: these shapes also cut them out, so no ray runs through a tower or a tree.
  const TOWERS = [[250, 20, 204], [274, 16, 182], [296, 18, 168], [320, 22, 150], [344, 18, 168], [366, 16, 182], [390, 20, 204]];
  const towerPaths = TOWERS.map(([x, wide, top]) => `M${x - wide / 2} 226V${top + wide / 2}a${wide / 2} ${wide / 2} 0 0 1 ${wide} 0V226`);
  const MOUNTAINS = "M112 280 146 238 160 250 186 196 204 226 214 216 226 266M528 280 494 238 480 250 454 196 436 226 426 216 414 266";
  const WALL = (() => { let d = "M214 274V226"; for (let i = 0; i < 13; i += 1) d += "h8v-6h8v6"; return `${d}h4V274`; })();
  const LAND = `M-40 300Q320 216 680 300V${TALL + 20}H-40Z`;

  function sun() {
    const [cx, cy] = SUN, rays = [[], []];
    for (let i = 0; i < 96; i += 1) {
      const angle = (i * Math.PI * 2) / 96, cos = Math.cos(angle), sin = Math.sin(angle);
      const edge = 1 / Math.hypot(cos / 318, sin / 214), reach = Math.min(edge, i % 8 === 0 ? 340 : i % 4 === 0 ? 270 : i % 2 === 0 ? 190 : 138);
      rays[i % 4 === 0 ? 0 : 1].push(`M${n(cx + cos * 88)} ${n(cy + sin * 88)}L${n(cx + cos * reach)} ${n(cy + sin * reach)}`);
    }
    return `<circle cx="${cx}" cy="${cy}" r="300" fill="url(#hz-dawn-glow)" stroke="none"/>
      <path class="ln-gold" d="${rays[0].join("")}"/><path class="ln-gold ln-ray" d="${rays[1].join("")}"/>
      <circle class="ln-sun" cx="${cx}" cy="${cy}" r="74"/><circle class="ln-gold" cx="${cx}" cy="${cy}" r="74"/><circle class="ln-gold ln-faint" cx="${cx}" cy="${cy}" r="82"/>
      <circle class="ln-ring" cx="${cx}" cy="${cy}" r="118"/><circle class="ln-ring" cx="${cx}" cy="${cy}" r="164"/><circle class="ln-ring" cx="${cx}" cy="${cy}" r="212"/>`;
  }
  // The tree of life: branching lines, leaves at the tips and fruit among them.
  function tree(x, y, seed, lean, bare = false) {
    const random = seeded(seed), limbs = [], leaves = [], fruit = [];
    (function grow(fromX, fromY, angle, length, width) {
      const toX = fromX + Math.cos(angle) * length, toY = fromY + Math.sin(angle) * length;
      limbs.push(`<path d="M${n(fromX)} ${n(fromY)}L${n(toX)} ${n(toY)}" stroke-width="${n(width)}"/>`);
      if (length < 9) {
        const turn = (angle * 180) / Math.PI + (random() - .5) * 70;
        if (bare) { if (toX > x + 20 && random() < .4) fruit.push(`<circle cx="${n(toX)}" cy="${n(toY)}" r="2.2"/>`); return; }
        leaves.push(`<path d="M${n(toX)} ${n(toY)}q4 -4.5 9 0q-5 4.5 -9 0" transform="rotate(${n(turn)} ${n(toX)} ${n(toY)})"/>`);
        if (random() < .13) fruit.push(`<circle cx="${n(toX)}" cy="${n(toY)}" r="2.6"/>`);
        return;
      }
      const fork = .32 + random() * .3;
      grow(toX, toY, angle - fork, length * (.74 + random() * .1), Math.max(.8, width * .72));
      grow(toX, toY, angle + fork * (.8 + random() * .4), length * (.72 + random() * .1), Math.max(.8, width * .72));
    })(x, y, -Math.PI / 2 + lean, 40, 3.2);
    return `<g class="ln-limbs">${limbs.join("")}</g><g class="ln-leaves">${leaves.join("")}</g><g class="ln-gold ln-fruit">${fruit.join("")}</g>`;
  }
  function river() {
    const left = "M309 274C314 284 330 284 328 292C322 306 288 312 290 328C294 350 330 356 320 380C312 402 268 418 230 440";
    const right = "M331 274C336 282 348 284 346 296C342 310 322 318 326 332C332 352 386 360 384 386C382 410 360 426 350 440";
    const reversed = "L350 440C360 426 382 410 384 386C386 360 332 352 326 332C322 318 342 310 346 296C348 284 336 282 331 274Z";
    const ripples = "M322 296h14M302 322h14M304 344h20M328 366h26M312 392h40M284 416h48";
    return `<path class="ln-wash ln-gold" d="${left}${reversed}"/><path class="ln-gold" d="${left}"/><path class="ln-gold" d="${right}"/><path class="ln-gold ln-faint" d="${ripples}"/>`;
  }
  function city() {
    const gate = (x, wide, tall) => `M${x} 274V${262 - tall + wide / 2}a${wide / 2} ${wide / 2} 0 0 1 ${wide} 0V274`;
    const gates = [gate(248, 18, 26), gate(308, 24, 32), gate(374, 18, 26)];
    return `<path class="ln-city-wash" d="${WALL}Z"/><path class="ln-city-wash" d="${towerPaths.join("")}Z"/><path d="${towerPaths.join("")}"/>
      <path d="${WALL}"/><path class="ln-faint" d="${[268, 263].map((y) => `M214 ${y}H248M266 ${y}H308M332 ${y}H374M392 ${y}H426`).join("")}"/>
      <path class="ln-wash ln-gold" d="${gates.join("")}"/><path class="ln-gold" d="${gates.join("")}"/>`;
  }
  function meadow() {
    const random = seeded(97), stems = [], blooms = [];
    for (let i = 0; i < 90; i += 1) {
      const y = 300 + Math.pow(random(), .7) * 134, x = random() * WIDE, scale = (y - 270) / 120;
      const inRiver = x > 225 && x < 395 && y > 262, onTrunk = (x < 96 || x > 544) && y < 410;
      if (inRiver || onTrunk) continue;
      const tall = 7 * scale;
      stems.push(`M${n(x)} ${n(y)}v${n(-tall)}`);
      blooms.push(`<circle cx="${n(x)}" cy="${n(y - tall)}" r="${n(1 + scale * .9)}"/>`);
    }
    // Raised clear of the hill that crosses the foot of the drawing on the page.
    const stump = `<g transform="translate(0 -32)"><path d="M196 424V402M222 424V402M190 426c10 -3 26 -3 38 0"/><ellipse cx="209" cy="402" rx="13" ry="4"/><path class="ln-faint" d="M203 402a6 2 0 0 1 12 0"/><path class="ln-gold" d="M209 400C208 388 212 382 208 372"/><path class="ln-gold" d="M208 386c-6 -1 -9 -5 -9 -9c5 0 9 3 9 7M209 380c5 -1 8 -5 8 -9c-5 0 -8 3 -8 7"/></g>`;
    return `<path class="ln-faint" d="${stems.join("")}"/><g class="ln-gold ln-fruit">${blooms.join("")}</g>${stump}`;
  }
  const CONTOURS = "M-20 322Q140 298 270 306M370 306Q500 298 660 322M-20 354Q120 330 268 346M392 346Q520 330 660 354";
  const BIRDS = "M92 96c5 -5 9 -5 12 0c3 -5 7 -5 12 0M128 74c4 -4 7 -4 10 0c3 -4 6 -4 10 0M514 84c5 -5 9 -5 12 0c3 -5 7 -5 12 0M548 112c4 -4 7 -4 10 0c3 -4 6 -4 10 0";
  const blockers = `<path d="${LAND}"/><path d="${MOUNTAINS}"/><path d="${WALL}Z"/><path d="${towerPaths.join("")}Z"/>`;

  HZ.DRAW = { seeded, n, tree };
  HZ.DRAWINGS = [`<svg viewBox="0 0 ${WIDE} ${TALL}" aria-hidden="true">
    <defs>
      <radialGradient id="hz-dawn-glow"><stop offset="0" class="ln-glow-in"/><stop offset=".3" class="ln-glow-mid"/><stop offset="1" class="ln-glow-out"/></radialGradient>
      <mask id="hz-dawn-cut" maskUnits="userSpaceOnUse" x="-60" y="-60" width="760" height="560"><rect x="-60" y="-60" width="760" height="560" fill="#fff" stroke="none"/><g fill="#000" stroke="#000">${blockers}</g></mask>
    </defs>
    <g mask="url(#hz-dawn-cut)">${sun()}<path d="M-20 300Q320 216 660 300"/></g>
    <path class="ln-faint" d="${BIRDS}"/>
    <path d="${MOUNTAINS}"/><path class="ln-faint" d="M186 196 178 232M186 196 194 228M146 238 140 262M454 196 462 232M454 196 446 228M494 238 500 262"/>
    <path class="ln-faint" d="${CONTOURS}"/>
    ${river()}${city()}${meadow()}
    ${tree(66, 410, 211, -.04)}${tree(574, 410, 307, .04)}
    <path class="ln-mark" d="M34 44h10m-5-5v10M596 34h10m-5-5v10M566 62h7m-3.500 -3.500v7"/>
  </svg>`];
  HZ.LINE_ART = HZ.DRAWINGS[0];
})();
