// The heading's line drawing: the whole wall in the weather, cut through the ground. Arrows of different weights fall on it and rain
// keeps coming, because the study names no day the pressure stops. The arch is two curved runs of stone meeting at one gold stone
// around a small light: the study's "two hands". Its footings stand below the ground line. No figure of God is drawn.
// A fixed drawing built here and seeded, so it never changes between visits.
window.Dusk = (() => {
  const { s, random, f, flame } = Stones;
  const GROUND = 356, ARCH = [320, 286], INNER = 46, OUTER = 78, FLAME_Y = 346;
  // Each course from the ground up: left end, right end, height. The ends step in, as a wall does where it has stood a long time.
  const COURSES = [[92, 560, 30], [100, 550, 28], [110, 540, 30], [122, 528, 26], [136, 512, 28], [156, 492, 26], [178, 466, 26]];
  const TOP = GROUND - COURSES.reduce((sum, course) => sum + course[2], 0);
  const polar = (radius, degrees) => [ARCH[0] + radius * Math.cos((degrees * Math.PI) / 180), ARCH[1] - radius * Math.sin((degrees * Math.PI) / 180)];
  const outline = (points, kind = "") => `<path class="${kind}" d="M${points.map((point) => point.map(f).join(" ")).join("L")}Z"/>`;

  function laid() {
    const rnd = random(23);
    let out = "", bottom = GROUND;
    for (const [left, right, height] of COURSES) {
      let x = left + (rnd() - 0.5) * 6;
      while (x < right - 8) {
        const width = Math.min(right - x, 24 + rnd() * 44), top = bottom - height;
        const j = () => (rnd() - 0.5) * 3;
        out += outline([[x + 1.5 + j(), top + 1.5 + j()], [x + width - 1.5 + j(), top + 1.5 + j()], [x + width - 1.5 + j(), bottom - 1.5 + j()], [x + 1.5 + j(), bottom - 1.5 + j()]], rnd() < 0.16 ? "art-gold" : "art-stone");
        if (rnd() < 0.45) out += `<path class="art-faint" d="M${f(x + 6 + rnd() * Math.max(1, width - 16))} ${f(bottom - height * (0.3 + rnd() * 0.4))}h${f(4 + rnd() * 8)}"/>`;
        x += width;
      }
      bottom -= height;
    }
    return out;
  }
  // Upright stones along the top, as a dry-stone wall is finished.
  function coping() {
    const rnd = random(61);
    let out = "", x = COURSES.at(-1)[0];
    while (x < COURSES.at(-1)[1] - 6) {
      const width = 8 + rnd() * 7, tall = 13 + rnd() * 6, lean = (rnd() - 0.5) * 3;
      out += outline([[x + lean, TOP - tall], [x + width + lean, TOP - tall + rnd() * 2], [x + width, TOP - 1], [x, TOP - 1]], "art-stone");
      x += width + 1;
    }
    return out;
  }
  function archway() {
    const run = (from, to) => Array.from({ length: 6 }, (_, i) => {
      const a0 = from + ((to - from) * i) / 6 + 1, a1 = from + ((to - from) * (i + 1)) / 6 - 1;
      return outline([polar(INNER, a0), polar(OUTER, a0), polar(OUTER, a1), polar(INNER, a1)], "art-stone");
    }).join("");
    const jamb = (x) => [[286, 310], [310, 334], [334, 356]].map(([top, bottom]) => outline([[x, top + 1], [x + 30, top + 1], [x + 30, bottom - 1], [x, bottom - 1]], "art-stone")).join("");
    const opening = `M${ARCH[0] - INNER} ${GROUND}V${ARCH[1]}a${INNER} ${INNER} 0 0 1 ${INNER * 2} 0V${GROUND}Z`;
    const rays = Array.from({ length: 25 }, (_, i) => {
      const angle = (i * Math.PI) / 24, cos = Math.cos(angle), sin = Math.sin(angle);
      return `M${f(ARCH[0] + cos * 30)} ${f(FLAME_Y - 10 - sin * 30)}L${f(ARCH[0] + cos * 120)} ${f(FLAME_Y - 10 - sin * 120)}`;
    }).join("");
    return `<clipPath id="head-opening"><path d="${opening}"/></clipPath>
      <path class="art-niche" d="${opening}"/><path class="art-ray" clip-path="url(#head-opening)" d="${rays}"/>
      ${run(180, 96)}${run(0, 84)}${outline([polar(INNER, 95), polar(OUTER, 95), polar(OUTER, 85), polar(INNER, 85)], "art-gold")}
      ${jamb(242)}${jamb(368)}
      <path class="art-gold" d="M298 ${GROUND}l4-9h36l4 9Z"/>${flame(ARCH[0], FLAME_Y, 1.3)}`;
  }
  function weather() {
    const rnd = random(5);
    const cloud = (y, from, to) => {
      let d = `M${from} ${y}`, x = from;
      while (x < to) { const r = 12 + rnd() * 22; d += `a${f(r)} ${f(r * 0.72)} 0 0 1 ${f(r * 2)} 0`; x += r * 2; }
      return d;
    };
    const rain = Array.from({ length: 96 }, () => {
      const length = 16 + rnd() * 56;
      return `M${f(-60 + rnd() * 700)} ${f(84 + rnd() * 260)}l${f(length * 0.3)} ${f(length)}`;
    }).join("");
    const arrows = [[124, 214, 62, 1.4], [176, 146, 44, 1.1], [222, 134, 86, 2], [264, 134, 34, 1], [318, 134, 104, 2.7], [368, 134, 54, 1.4], [416, 134, 80, 2.1], [460, 146, 32, 1], [520, 226, 76, 1.8]]
      .map(([x, end, length, weight]) => `<path class="art-press" stroke-width="${weight}" d="M${x} ${end - length}V${end}M${x - 4 - weight} ${end - 5 - weight}L${x} ${end}L${x + 4 + weight} ${end - 5 - weight}"/>`).join("");
    return { sky: `<path class="art-cloud" d="${cloud(36, -40, 700)}"/><path class="art-cloud" d="${cloud(56, -20, 300)}${cloud(58, 360, 680)}"/><path class="art-cloud art-cloud-far" d="${cloud(76, 90, 250)}${cloud(78, 410, 590)}"/><path class="art-rain" d="${rain}"/>`, arrows };
  }
  // A thorn bent by the same weather, with no leaves or fruit to promise anything.
  function thorn(x, y) {
    const rnd = random(211), limbs = [];
    (function grow(fromX, fromY, angle, length, width) {
      const toX = fromX + Math.cos(angle) * length, toY = fromY + Math.sin(angle) * length;
      limbs.push(`<path d="M${f(fromX)} ${f(fromY)}L${f(toX)} ${f(toY)}" stroke-width="${f(width)}"/>`);
      if (length < 7) return;
      const fork = 0.3 + rnd() * 0.32, bend = 0.06;
      grow(toX, toY, angle - fork * 0.8 + bend, length * (0.72 + rnd() * 0.1), Math.max(0.8, width * 0.72));
      grow(toX, toY, angle + fork + bend, length * (0.68 + rnd() * 0.1), Math.max(0.8, width * 0.72));
    })(x, y, -Math.PI / 2 + 0.16, 28, 2.8);
    return limbs.join("");
  }
  function footings() {
    const rnd = random(83);
    let out = "";
    for (const [left, right, top, bottom] of [[170, 470, 362, 390], [198, 442, 394, 422]]) {
      let x = left;
      while (x < right - 6) {
        const width = Math.min(right - x, 40 + rnd() * 50);
        out += outline([[x + 2, top], [x + width - 2, top + rnd() * 2], [x + width - 2, bottom], [x + 2, bottom - rnd() * 2]], rnd() < 0.24 ? "art-gold" : "art-under");
        x += width;
      }
    }
    return out;
  }

  function draw() {
    const svg = s("svg", { viewBox: "0 0 640 440", class: "head-svg", "aria-hidden": "true" });
    const rnd = random(37);
    const silhouette = COURSES.reduce(({ bottom, out }, [left, right, height]) => ({ bottom: bottom - height, out: `${out}<rect x="${left}" y="${bottom - height - (height === COURSES.at(-1)[2] ? 18 : 0)}" width="${right - left}" height="${height + 18}"/>` }), { bottom: GROUND, out: "" }).out;
    const tufts = Array.from({ length: 40 }, () => {
      const x = rnd() < 0.5 ? -20 + rnd() * 110 : 566 + rnd() * 90;
      return `M${f(x)} ${GROUND}l${f(-2 + rnd() * 2)} ${f(-3 - rnd() * 7)}M${f(x + 2)} ${GROUND}l${f(rnd() * 3)} ${f(-3 - rnd() * 6)}`;
    }).join("");
    const { sky, arrows } = weather();
    const rings = [150, 204, 262].map((radius) => `<circle class="art-ring" cx="${ARCH[0]}" cy="${ARCH[1]}" r="${radius}"/>`).join("");
    svg.innerHTML = `<defs>
        <mask id="head-behind" maskUnits="userSpaceOnUse" x="-80" y="-40" width="800" height="520"><rect x="-80" y="-40" width="800" height="520" fill="#fff" stroke="none"/><g fill="#000" stroke="none">${silhouette}<rect x="-80" y="${GROUND}" width="800" height="200"/></g></mask>
        <mask id="head-arch-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="440"><rect width="640" height="440" fill="#fff" stroke="none"/><g fill="#000" stroke="none"><circle cx="${ARCH[0]}" cy="${ARCH[1]}" r="${OUTER + 1}"/><rect x="${ARCH[0] - OUTER - 1}" y="${ARCH[1]}" width="${(OUTER + 1) * 2}" height="${GROUND - ARCH[1]}"/></g></mask>
      </defs>
      <g mask="url(#head-behind)">${rings}<path class="art-faint" d="M-40 316Q70 286 180 312M460 312Q570 284 680 318"/>${sky}</g>
      <g mask="url(#head-arch-cut)">${laid()}</g>${coping()}${archway()}${arrows}
      <g class="art-limbs">${thorn(44, GROUND)}</g>
      <path d="M612 ${GROUND}L540 260M600 ${GROUND}L532 272M556 282l-16 6M580 322l-14 7"/>
      ${outline([[62, 356], [65, 345], [82, 344], [86, 356]], "art-stone")}${outline([[72, 344], [76, 335], [88, 336], [90, 345]], "art-stone")}${outline([[596, 356], [600, 348], [626, 349], [630, 356]], "art-stone")}
      <path class="art-faint" d="${tufts}M34 40h10m-5-5v10M606 112h8m-4-4v8"/>
      <path class="art-ground" d="M-30 ${GROUND}H670"/>${footings()}`;
    return svg;
  }
  // The layers of ground under the wall, as wide as the page. The ground line above them stays level: this is a cut, not a view.
  function strata() {
    const svg = s("svg", { viewBox: "0 0 1600 300", preserveAspectRatio: "none", class: "head-strata", "aria-hidden": "true" });
    svg.innerHTML = `<path class="st-3" d="M0 0H1600V258C1280 276 1000 222 760 244S240 268 0 236Z"/><path class="st-2" d="M0 0H1600V170C1300 210 1060 130 780 158S260 186 0 150Z"/><path class="st-1" d="M0 0H1600V78C1320 112 1100 58 800 72S280 108 0 66Z"/>`;
    return svg;
  }
  return { draw, strata };
})();
