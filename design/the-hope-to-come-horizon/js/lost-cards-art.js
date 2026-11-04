// The drawings for lost-cards.html: one pair per row of section 03, what was lost (dark) above and Revelation's answer (green
// and alive) below. Each scene keeps its busy part to the right, because the words sit on the left. Nothing here depicts God,
// Christ or an angel: the sword of Genesis 3:24 stands alone. The last four cards are not in the study (HP.lostAdded).
window.LOST_ART = (() => {
  const n = (value) => (+value).toFixed(1);
  const seeded = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const svg = (box, body) => `<svg viewBox="${box}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}</svg>`;
  const grad = (id, stops) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([at, colour]) => `<stop offset="${at}" stop-color="${colour}"/>`).join("")}</linearGradient></defs>`;
  const glow = (id, stops) => `<defs><radialGradient id="${id}">${stops.map(([at, colour, opacity = 1]) => `<stop offset="${at}" stop-color="${colour}" stop-opacity="${opacity}"/>`).join("")}</radialGradient></defs>`;
  const back = (id, stops, width = 800) => `${grad(id, stops)}<rect width="${width}" height="300" fill="url(#${id})"/>`;
  const wave = (y, rise, width, seed) => {
    const random = seeded(seed);
    let d = `M0 300V${y}`;
    for (let x = 0; x < width; x += 100) d += `Q${x + 50} ${n(y - rise * random())} ${x + 100} ${n(y + (random() - .5) * rise * .6)}`;
    return `${d}V300Z`;
  };
  const repeat = (count, draw) => Array.from({ length: count }, (_, i) => draw(i)).join("");

  // ── Pieces ──
  const stars = (random, count, width, height) => repeat(count, () => `<circle cx="${n(random() * width)}" cy="${n(random() * height)}" r="${n(.6 + random() * 1.2)}" fill="#e9e3d2" opacity="${n(.25 + random() * .6)}"/>`);
  const moon = (x, y, r, opacity = .75) => `<path d="M${x} ${y - r}a${r} ${r} 0 1 0 ${n(r * .77)} ${n(r * 1.7)} ${n(r * .85)} ${n(r * .85)} 0 1 1 ${n(-r * .77)} ${n(-r * 1.7)}Z" fill="#d8d2c2" opacity="${opacity}"/>`;
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
  const LEAF = ["#2f6b3a", "#3f8445", "#5a9f4f"], DARK_LEAF = ["#16211b", "#1c2a22", "#23332a"];
  const crownTree = (x, base, size, seed, { fruit = ["#e8b84a"], leaf = LEAF, bark = "#4a3424" } = {}) => {
    const random = seeded(seed), blobs = [], fruits = [];
    for (let i = 0; i < 26; i += 1) {
      const angle = random() * Math.PI * 2, reach = Math.sqrt(random()) * size;
      blobs.push(`<circle cx="${n(x + Math.cos(angle) * reach * 1.15)}" cy="${n(base - size * 1.9 + Math.sin(angle) * reach * .8)}" r="${n(size * (.28 + random() * .2))}" fill="${leaf[i % leaf.length]}"/>`);
      if (fruit.length && i % 3 === 0) fruits.push(`<circle cx="${n(x + Math.cos(angle) * reach)}" cy="${n(base - size * 1.9 + Math.sin(angle) * reach * .7)}" r="${n(size * .065)}" fill="${fruit[(i / 3) % fruit.length]}"/>`);
    }
    return `<path d="M${n(x - size * .1)} ${base}C${n(x - size * .08)} ${n(base - size)} ${n(x - size * .05)} ${n(base - size * 1.3)} ${x} ${n(base - size * 1.6)}C${n(x + size * .05)} ${n(base - size * 1.3)} ${n(x + size * .08)} ${n(base - size)} ${n(x + size * .12)} ${base}Z" fill="${bark}"/>${blobs.join("")}${fruits.join("")}`;
  };
  const meadow = (random, y0, y1, width, count, x0 = 0) => repeat(count, () => {
    const x = x0 + random() * (width - x0), y = y0 + random() * (y1 - y0), tall = 6 + random() * 10;
    return random() < .3
      ? `<circle cx="${n(x)}" cy="${n(y - tall)}" r="${n(2 + random() * 2)}" fill="${random() < .5 ? "#f3d27a" : "#fff6e0"}"/><path d="M${n(x)} ${n(y)}V${n(y - tall)}" stroke="#2f6b3a" stroke-width="1.2"/>`
      : `<path d="M${n(x)} ${n(y)}q${n(-2 + random() * 4)} ${n(-tall / 2)} ${n(-3 + random() * 6)} ${n(-tall)}" stroke="#3d7a3f" stroke-width="1.3" fill="none"/>`;
  });
  const sun = (x, y, r, rays = 18, reach = 2.2) => {
    const lines = repeat(rays, (i) => { const angle = (i / rays) * Math.PI * 2; return `M${n(x + Math.cos(angle) * r * 1.25)} ${n(y + Math.sin(angle) * r * 1.25)}L${n(x + Math.cos(angle) * r * reach)} ${n(y + Math.sin(angle) * r * reach)}`; });
    return `<path d="${lines}" stroke="#e8b84a" stroke-width="1.4" opacity=".7"/><circle cx="${x}" cy="${y}" r="${n(r * 1.12)}" fill="#f6dc8c" opacity=".55"/><circle cx="${x}" cy="${y}" r="${r}" fill="#f1c35a"/>`;
  };
  const thorns = (random, x, base, size) => {
    const spikes = repeat(14, (i) => {
      const angle = -Math.PI + (Math.PI * i) / 13 + (random() - .5) * .2, reach = size * (.6 + random() * .5);
      return `M${n(x)} ${n(base)}L${n(x + Math.cos(angle) * reach)} ${n(base + Math.sin(angle) * reach)}M${n(x + Math.cos(angle) * reach * .55)} ${n(base + Math.sin(angle) * reach * .55)}l${n(Math.cos(angle + .9) * size * .18)} ${n(Math.sin(angle + .9) * size * .18)}`;
    });
    return `<path d="${spikes}" stroke="#4d4238" stroke-width="1.6" stroke-linecap="round" fill="none"/>`;
  };
  const thistle = (x, base, tall) => `<path d="M${x} ${base}V${base - tall}M${x} ${n(base - tall * .5)}l-8 -6M${x} ${n(base - tall * .7)}l8 -5" stroke="#4a4436" stroke-width="1.6"/><path d="M${x - 6} ${base - tall}l6 6 6-6Z" fill="#4a4436"/><path d="M${x - 6} ${base - tall - 1}l2 -9M${x - 2} ${base - tall - 1}l0 -11M${x + 2} ${base - tall - 1}l1 -11M${x + 6} ${base - tall - 1}l-1 -9" stroke="#6d4f6e" stroke-width="2.2" stroke-linecap="round"/>`;
  const cracks = (random, count, x0, x1, y0, y1, colour) => `<path d="${repeat(count, () => `M${n(x0 + random() * (x1 - x0))} ${n(y0 + random() * (y1 - y0))}l${n(16 - random() * 32)} ${n(3 + random() * 6)}l${n(14 - random() * 28)} ${n(2 + random() * 5)}`)}" stroke="${colour}" stroke-width="1.2" fill="none"/>`;
  const wheat = (random, y0, y1, width, count) => repeat(count, () => {
    const y = y0 + random() * (y1 - y0), scale = .5 + ((y - y0) / (y1 - y0)) * .9, x = random() * width, tall = 22 * scale, lean = (random() - .5) * 4;
    return `<path d="M${n(x)} ${n(y)}q${n(lean)} ${n(-tall / 2)} ${n(lean * 1.5)} ${n(-tall)}" stroke="#b8902f" stroke-width="${n(1.1 * scale)}" fill="none"/><ellipse cx="${n(x + lean * 1.5)}" cy="${n(y - tall - 5 * scale)}" rx="${n(2.4 * scale)}" ry="${n(6.5 * scale)}" fill="${random() < .5 ? "#d9a93d" : "#e4b84e"}"/>`;
  });
  const birds = (random, count, x0, x1, y0, y1) => `<path d="${repeat(count, () => { const x = x0 + random() * (x1 - x0), y = y0 + random() * (y1 - y0), s = 4 + random() * 4; return `M${n(x - s)} ${n(y - s * .4)}q${n(s / 2)} ${n(-s * .3)} ${n(s)} ${n(s * .4)}q${n(s / 2)} ${n(-s * .7)} ${n(s)} ${n(-s * .4)}`; })}" stroke="#4a5a3a" stroke-width="1.3" fill="none"/>`;
  const leafShape = (x, y, size, angle, colour) => `<path d="M0 0C${size * .4} ${-size * .35} ${size * .8} ${-size * .3} ${size} 0C${size * .8} ${size * .3} ${size * .4} ${size * .35} 0 0Z" transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)})" fill="${colour}"/>`;

  const person = (x, base, s, colour, raised) => `<path d="M${n(x - 14 * s)} ${base}C${n(x - 14 * s)} ${n(base - 22 * s)} ${n(x - 10 * s)} ${n(base - 30 * s)} ${n(x)} ${n(base - 30 * s)}C${n(x + 10 * s)} ${n(base - 30 * s)} ${n(x + 14 * s)} ${n(base - 22 * s)} ${n(x + 14 * s)} ${base}Z" fill="${colour}"/><circle cx="${n(x)}" cy="${n(base - 38 * s)}" r="${n(8 * s)}" fill="${colour}"/>${raised ? `<path d="M${n(x - 10 * s)} ${n(base - 26 * s)}L${n(x - 19 * s)} ${n(base - 54 * s)}M${n(x + 10 * s)} ${n(base - 26 * s)}L${n(x + 19 * s)} ${n(base - 54 * s)}" stroke="${colour}" stroke-width="${n(4.5 * s)}" stroke-linecap="round"/>` : ""}`;
  const deadBush = (random, x, y, r) => `<path d="${repeat(9, (i) => { const a = (i / 9) * Math.PI * 2 + random() * .4; return `M${x} ${y}L${n(x + Math.cos(a) * r)} ${n(y + Math.sin(a) * r)}M${n(x + Math.cos(a) * r * .6)} ${n(y + Math.sin(a) * r * .6)}l${n(Math.cos(a + .7) * r * .3)} ${n(Math.sin(a + .7) * r * .3)}`; })}" stroke="#55432f" stroke-width="1.8" stroke-linecap="round"/>`;
  const bone = (x, y, length, angle, colour) => `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)})" fill="${colour}"><rect x="${n(-length / 2)}" y="-2.4" width="${n(length)}" height="4.8" rx="2.4"/>${[-1, 1].map((end) => `<circle cx="${n(end * length / 2)}" cy="-2.4" r="3.2"/><circle cx="${n(end * length / 2)}" cy="2.4" r="3.2"/>`).join("")}</g>`;
  const skull = (x, y, s, colour, hollow) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-11 2C-13 -10 -6 -16 0 -16C6 -16 13 -10 11 2L8 4V9H-8V4Z" fill="${colour}"/><circle cx="-4.5" cy="-3" r="3" fill="${hollow}"/><circle cx="4.5" cy="-3" r="3" fill="${hollow}"/><path d="M-1 3L0 0L1 3Z" fill="${hollow}"/><path d="M-5 9V6M-2 9V6M1 9V6M4 9V6" stroke="${hollow}" stroke-width=".9"/></g>`;
  const TONES = ["#5a4134", "#3f3a4e", "#34465a", "#6b5236", "#4a3a3a", "#3c4a3c"], BLOOMS = ["#f3d27a", "#fff6e0", "#f2b8c6"];
  const shining = (x, base, s, raised, edge) => `<g stroke="${edge}" stroke-width="1.2">${person(x, base, s, "#fffaf0", raised)}</g>`;
  const RAINBOW = ["#e46a5a", "#f0a24a", "#f3d25a", "#7cc06a", "#5aa6d6", "#8a74c8"];

  // ── The rows, in the study's order ──
  return {
    "The deceiver": {
      line: "The serpent in the tree with its fruit, and the bitten fruit below; then the serpent chained on the sealed pit, and flowers everywhere.",
      lost: () => {
        const random = seeded(101), coil = [], front = [];
        for (let t = 0; t <= 6; t += .2) { const x = 622 + 16 * Math.sin(t * 1.6), y = 292 - t * 12; coil.push(`${coil.length ? "L" : "M"}${n(x)} ${n(y)}`); if (Math.cos(t * 1.6) > 0) front.push(`M${n(x)} ${n(y)}L${n(622 + 16 * Math.sin((t + .2) * 1.6))} ${n(292 - (t + .2) * 12)}`); }
        return svg("0 0 800 300", `${back("dva", [[0, "#0b0e12"], [1, "#1d2127"]])}${stars(random, 40, 800, 120)}<path d="${wave(258, 18, 800, 103)}" fill="#14171c"/><path d="M610 300C612 260 614 230 616 196H628C630 230 632 260 636 300Z" fill="#2a2520"/>${crownTree(622, 228, 44, 105, { fruit: ["#e0412f"], leaf: DARK_LEAF, bark: "#2a2520" })}<path d="${coil.join("")}" stroke="#3b4d2a" stroke-width="10" fill="none" stroke-linecap="round"/><path d="${front.join("")}" stroke="#86a83e" stroke-width="10" stroke-linecap="round"/><path d="M619 220C600 214 588 200 574 196" stroke="#86a83e" stroke-width="9" fill="none" stroke-linecap="round"/><ellipse cx="564" cy="194" rx="13" ry="8" fill="#86a83e" transform="rotate(-10 564 194)"/><circle cx="560" cy="190" r="2.2" fill="#f1d24a"/><path d="M552 197l-13 3M539 200l-6-4M539 200l-5 5" stroke="#e0412f" stroke-width="1.6" stroke-linecap="round"/><circle cx="690" cy="266" r="10" fill="#e0412f"/><circle cx="699" cy="260" r="5.5" fill="#14171c"/><path d="M690 256l2-7" stroke="#2a2520" stroke-width="1.5"/>`);
      },
      found: () => {
        const random = seeded(107), spiral = [];
        for (let t = 0; t <= 4.2 * Math.PI; t += .25) { const r = 9 + t * 4; spiral.push([620 + Math.cos(t) * r * 1.8, 236 + Math.sin(t) * r * .42]); }
        const [hx, hy] = spiral.at(-1);
        const chain = (x1, y1, x2, y2) => repeat(15, (i) => { const f = i / 14, x = x1 + (x2 - x1) * f, y = y1 + (y2 - y1) * f, a = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI; return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="8.5" ry="${i % 2 ? 4.6 : 2}" transform="rotate(${n(a)} ${n(x)} ${n(y)})" fill="none" stroke="#2f2d29" stroke-width="3.2"/>`; });
        return svg("0 0 800 300", `${back("dvb", [[0, "#fbefc9"], [.6, "#e3efc4"], [1, "#cfe6b1"]])}${sun(740, 50, 22)}<path d="${wave(160, 40, 800, 109)}" fill="#a9cf86"/><path d="${wave(195, 22, 800, 111)}" fill="#7db463"/>${crownTree(440, 200, 20, 113)}<ellipse cx="620" cy="250" rx="160" ry="38" fill="#8a826f"/><ellipse cx="620" cy="243" rx="156" ry="34" fill="#d6cfbd" stroke="#a49b86" stroke-width="2"/><path d="M${spiral.map(([x, y]) => `${n(x)} ${n(y)}`).join("L")}" stroke="#55603f" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M${spiral.map(([x, y]) => `${n(x)} ${n(y - 2)}`).join("L")}" stroke="#7d8a5a" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="${n(hx + 10)}" cy="${n(hy)}" rx="15" ry="8" fill="#6a7650"/><path d="M${n(hx + 13)} ${n(hy - 2)}h7" stroke="#3a4030" stroke-width="1.8"/>${chain(490, 216, 750, 262)}${chain(490, 262, 750, 216)}<path d="M609 236v-10a11 11 0 0 1 22 0v10" stroke="#2f2e2b" stroke-width="4.5" fill="none"/><rect x="602" y="233" width="36" height="26" rx="4" fill="#3a3936"/><circle cx="620" cy="243" r="3.2" fill="#c9a65a"/><path d="M620 245v6" stroke="#c9a65a" stroke-width="2"/>${meadow(random, 200, 300, 800, 260)}`);
      },
    },
    "The sky": {
      line: "The first heaven and earth passing away: a blood-red moon, stars falling, barren ground and a dark sea; then a new earth at a new sunrise, with no sea.",
      lost: () => {
        const random = seeded(121);
        const falling = repeat(11, () => { const x = 380 + random() * 400, y = 20 + random() * 150, len = 30 + random() * 40; return `<path d="M${n(x)} ${n(y)}l${n(len * .6)} ${n(-len * .5)}" stroke="#e9c79a" stroke-width="1.3" opacity=".55"/><circle cx="${n(x)}" cy="${n(y)}" r="2.2" fill="#fff1d6"/>`; });
        const waves = repeat(26, () => `M${n(360 + random() * 440)} ${n(226 + random() * 70)}l10 -7l10 7`);
        return svg("0 0 800 300", `${back("ska", [[0, "#090607"], [.7, "#22110f"], [1, "#3a1a14"]])}${stars(random, 50, 800, 160)}<circle cx="690" cy="70" r="44" fill="#8e2a1e" opacity=".25"/><circle cx="690" cy="70" r="30" fill="#8e2a1e"/><circle cx="682" cy="64" r="6" fill="#7a2218"/>${falling}<path d="M340 220H800V300H340Z" fill="#0c121b"/><path d="${waves}" stroke="#34465c" stroke-width="1.6" fill="none"/><path d="M0 300V222C120 216 240 228 350 214L380 300Z" fill="#1e1a17"/>${cracks(random, 18, 0, 360, 228, 296, "#0f0c0a")}${bareTree(300, 226, 18, 125, "#2a2420")}`);
      },
      found: () => {
        const random = seeded(127), blossom = { fruit: [], leaf: ["#f2b8c6", "#f7d0da", "#fff6f8"] };
        const bow = RAINBOW.map((colour, i) => `<path d="M${410 + i * 6} 236A${230 - i * 6} ${230 - i * 6} 0 0 1 ${870 - i * 6} 236" stroke="${colour}" stroke-width="6" fill="none" opacity=".55"/>`).join("");
        return svg("0 0 800 300", `${back("skb", [[0, "#fdf3d2"], [.6, "#f6f4dc"], [1, "#d9ebba"]])}${bow}${sun(640, 196, 32, 30, 3.4)}${birds(random, 7, 470, 780, 60, 130)}<path d="${wave(218, 26, 800, 131)}" fill="#b8d98f"/>${crownTree(470, 240, 20, 135, blossom)}${crownTree(780, 236, 24, 139, blossom)}<path d="${wave(242, 18, 800, 133)}" fill="#86c066"/><path d="M560 300C590 280 540 262 600 248S660 236 640 226" stroke="#7fc8d6" stroke-width="7" fill="none" stroke-linecap="round"/>${crownTree(720, 300, 26, 141)}${meadow(random, 250, 300, 800, 220)}`);
      },
    },
    "The light": {
      line: "The greater light setting and the moon rising; then the city shining, with no sun or moon in its sky.",
      lost: () => {
        const random = seeded(141);
        return svg("0 0 800 300", `${back("lta", [[0, "#16131a"], [.6, "#4a2a24"], [1, "#7a3e26"]])}${stars(random, 30, 800, 90)}${moon(420, 60, 15, .6)}<circle cx="630" cy="236" r="48" fill="#d96b32"/><circle cx="630" cy="236" r="64" fill="#d96b32" opacity=".25"/><path d="M0 300V236C200 232 400 240 800 234V300Z" fill="#1c1513"/>${bareTree(520, 238, 18, 143, "#1c1513")}${bareTree(740, 236, 22, 145, "#1c1513")}`);
      },
      found: () => {
        const random = seeded(147);
        const rays = repeat(30, (i) => { const a = Math.PI + (i / 29) * Math.PI; return `M${n(615 + Math.cos(a) * 120)} ${n(190 + Math.sin(a) * 120)}L${n(615 + Math.cos(a) * 700)} ${n(190 + Math.sin(a) * 700)}`; });
        const crenel = (x0, x1, top) => repeat(Math.floor((x1 - x0) / 16), (i) => `<rect x="${x0 + i * 16 + 3}" y="${top - 8}" width="10" height="9" fill="url(#ltw)"/>`);
        const towers = [[440, 62], [525, 84], [600, 118], [690, 84], [770, 62]].map(([x, tall]) => `<rect x="${x}" y="${222 - tall}" width="32" height="${tall}" fill="url(#ltw)" stroke="#e3bc5c" stroke-width="1.2"/>${crenel(x - 3, x + 37, 222 - tall)}`).join("");
        const gates = [565, 615, 665].map((x) => `<circle cx="${x}" cy="206" r="16" fill="#ffffff" opacity=".55"/><path d="M${x - 10} 222V206a10 10 0 0 1 20 0V222Z" fill="#ffffff"/>`).join("");
        return svg("0 0 800 300", `${glow("ltg", [[0, "#ffffff"], [.3, "#fff4cc"], [1, "#f8ecc0", 0]])}${grad("ltw", [[0, "#fffaf0"], [1, "#f1cf72"]])}${back("ltb", [[0, "#fdf6dc"], [1, "#f3f3d0"]])}<ellipse cx="615" cy="190" rx="560" ry="300" fill="url(#ltg)"/><path d="${rays}" stroke="#f1d58a" stroke-width="2" opacity=".5"/><circle cx="615" cy="180" r="120" fill="#ffffff" opacity=".45"/><rect x="436" y="172" width="366" height="50" fill="url(#ltw)" stroke="#e3bc5c" stroke-width="1.2"/>${crenel(436, 802, 172)}${towers}${gates}<path d="M0 300V226C200 222 400 224 436 220H802V300Z" fill="#c6e3a0"/><path d="M605 220H625L690 300H540Z" fill="#fff4cf" opacity=".95"/>${crownTree(400, 266, 22, 151)}${meadow(random, 232, 300, 800, 160)}`);
      },
    },
    "The river": {
      line: "A dry bed seen from above; then the same channel full, the river of life.",
      lost: () => {
        const random = seeded(51), bed = "M560 0C545 70 610 120 585 180S500 260 520 300H700C640 260 690 210 660 160S600 60 600 0Z";
        const blotches = repeat(40, () => `<ellipse cx="${n(random() * 800)}" cy="${n(random() * 300)}" rx="${n(10 + random() * 30)}" ry="${n(5 + random() * 12)}" fill="#271e17" opacity=".7"/>`);
        const stones = repeat(16, () => { const y = random() * 290; return `<ellipse cx="${n(575 + (y / 300) * 30 + random() * 40)}" cy="${n(y)}" rx="${n(3 + random() * 5)}" ry="${n(2 + random() * 3)}" fill="#5a4c3e"/>`; });
        return svg("0 0 800 300", `<defs><clipPath id="rvc"><path d="${bed}"/></clipPath></defs><rect width="800" height="300" fill="#2f251c"/>${blotches}${cracks(random, 50, 0, 800, 0, 300, "#1f1812")}<path d="${bed}" fill="#1d1610" stroke="#4d3d2e" stroke-width="2"/><g clip-path="url(#rvc)">${cracks(random, 40, 520, 700, 0, 300, "#3e3024")}${stones}</g>${deadBush(random, 470, 70, 22)}${deadBush(random, 750, 80, 26)}${deadBush(random, 455, 235, 18)}${deadBush(random, 770, 245, 24)}${deadBush(random, 700, 165, 16)}`);
      },
      found: () => {
        const random = seeded(61), water = "M560 0C545 70 610 120 585 180S500 260 520 300H700C640 260 690 210 660 160S600 60 600 0Z";
        const glints = repeat(22, () => { const y = random() * 290, x = 570 + (y / 300) * 40 + random() * 40; return `M${n(x)} ${n(y)}h${n(6 + random() * 10)}`; });
        return svg("0 0 800 300", `${back("rb", [[0, "#e8f2c9"], [1, "#a6cf84"]])}${meadow(random, 40, 300, 800, 130, 520)}${meadow(random, 262, 300, 520, 30)}<path d="${water}" fill="#6fbccb"/><path d="${glints}" stroke="#e9fbff" stroke-width="1.6" stroke-linecap="round"/>${crownTree(548, 140, 24, 63)}${crownTree(735, 130, 30, 65)}${crownTree(470, 270, 22, 67)}${crownTree(760, 275, 24, 69)}`);
      },
    },
    "The tree": {
      line: "The tree of life glowing far off, the flaming sword barring the way; then the same tree, near and shining, over the river.",
      lost: () => {
        const random = seeded(161), fruit = ["#f1c35a", "#f6dc8c"];
        const flames = repeat(16, (i) => { const y = 128 + i * 8, side = i % 2 ? 1 : -1; return `<path d="M${540 + side * 3} ${y}q${n(side * (8 + random() * 8))} -4 ${n(side * (4 + random() * 4))} -14" stroke="${i % 3 ? "#e2783a" : "#f1c35a"}" stroke-width="2" fill="none" stroke-linecap="round"/>`; });
        return svg("0 0 800 300", `${glow("tra", [[0, "#e2783a", .45], [1, "#e2783a", 0]])}${glow("trc", [[0, "#f1c35a", .5], [1, "#f1c35a", 0]])}${back("trb", [[0, "#0c0e13"], [1, "#221d18"]])}${stars(random, 40, 800, 120)}<path d="${wave(205, 26, 800, 163)}" fill="#14140f"/><ellipse cx="710" cy="150" rx="90" ry="80" fill="url(#trc)"/>${crownTree(710, 210, 30, 175, { fruit })}<path d="M0 300V244C200 240 500 248 800 242V300Z" fill="#0f0d0b"/><path d="M380 300C440 280 500 268 540 262H556C540 274 480 290 460 300Z" fill="#2b2620"/><ellipse cx="540" cy="195" rx="90" ry="100" fill="url(#tra)"/><ellipse cx="540" cy="200" rx="44" ry="12" fill="none" stroke="#e2783a" stroke-width="1.2" stroke-dasharray="6 6" opacity=".6"/><path d="M540 110L544 122V260H536V122Z" fill="#e7e1d1"/><path d="M524 242H556" stroke="#c9a65a" stroke-width="5" stroke-linecap="round"/><path d="M540 246V272" stroke="#6b4d2c" stroke-width="5"/>${flames}`);
      },
      found: () => {
        const random = seeded(171), river = "M0 236C120 226 240 248 380 240S620 226 800 236V264C640 256 520 272 380 266S140 258 0 268Z";
        const glints = repeat(20, () => `M${n(random() * 800)} ${n(244 + random() * 16)}h${n(6 + random() * 10)}`);
        const falling = repeat(14, () => leafShape(470 + random() * 300, 110 + random() * 120, 7, random() * 360, "#5a9f4f"));
        const fruit = ["#e8b84a", "#d9603b", "#9b3d6b", "#e98a3a", "#c94a4a", "#6b8f3a"];
        return svg("0 0 800 300", `${glow("tfg", [[0, "#fff6d6"], [.5, "#f6e3a0", .6], [1, "#f6e3a0", 0]])}${back("tfb", [[0, "#fbefc9"], [.6, "#e8f0c8"], [1, "#b9db97"]])}<path d="${wave(195, 24, 800, 173)}" fill="#a9cf86"/><ellipse cx="610" cy="140" rx="170" ry="130" fill="url(#tfg)"/>${crownTree(610, 238, 50, 175, { fruit })}<path d="${river}" fill="#6fbccb"/><path d="${glints}" stroke="#e9fbff" stroke-width="1.6" stroke-linecap="round"/><path d="M0 300V266C140 258 380 272 520 266S700 258 800 262V300Z" fill="#6fa856"/>${falling}${meadow(random, 270, 300, 800, 110)}`);
      },
    },
    "The curse": {
      line: "Thorns and thistles in cracked ground; then a field ripe for harvest.",
      lost: () => {
        const random = seeded(181);
        const growth = repeat(9, (i) => (i % 2 ? thistle(440 + i * 40 + random() * 16, 262 + random() * 20, 24 + random() * 18) : thorns(random, 430 + i * 40 + random() * 20, 268 + random() * 16, 22 + random() * 16)));
        return svg("0 0 800 300", `${back("cua", [[0, "#17120f"], [.7, "#3a2a20"], [1, "#55392a"]])}${stars(random, 18, 800, 80)}<path d="${wave(214, 24, 800, 183)}" fill="#2a211b"/><path d="M0 300V238C240 232 520 244 800 236V300Z" fill="#3a2e24"/>${cracks(random, 26, 0, 800, 244, 296, "#21190f")}${growth}`);
      },
      found: () => {
        const random = seeded(191);
        return svg("0 0 800 300", `${back("cub", [[0, "#fbefc9"], [.6, "#eef2c6"], [1, "#e6d79a"]])}${sun(700, 62, 24)}<path d="${wave(170, 30, 800, 193)}" fill="#a9cf86"/>${crownTree(470, 182, 18, 195)}${crownTree(520, 186, 16, 197)}${crownTree(570, 182, 18, 199)}<path d="M0 300V190C260 184 520 192 800 186V300Z" fill="#e2c46b"/>${wheat(random, 196, 300, 800, 420)}`);
      },
    },
    "Death": {
      line: "The grave above the line, the meadow below it.",
      lost: () => {
        const random = seeded(3);
        return svg("0 0 800 300", `${back("ha", [[0, "#0d1016"], [1, "#22262f"]])}${stars(random, 60, 800, 180)}${moon(680, 44, 24)}<path d="${wave(235, 40, 800, 5)}" fill="#171a21"/>${bareTree(705, 262, 46, 9, "#2c3039")}${headstone(455, 266, 30, 56)}${headstone(508, 268, 24, 42)}${headstone(560, 266, 34, 64)}${headstone(615, 270, 22, 36)}<path d="${wave(262, 14, 800, 7)}" fill="#0b0d11"/>`);
      },
      found: () => {
        const random = seeded(4);
        return svg("0 0 800 300", `${back("hb", [[0, "#fbefc9"], [.55, "#e3efc4"], [1, "#cfe6b1"]])}${sun(650, 70, 30)}<path d="${wave(150, 50, 800, 11)}" fill="#a9cf86"/><path d="${wave(195, 40, 800, 13)}" fill="#7db463"/>${crownTree(705, 205, 34, 15)}${crownTree(470, 220, 22, 17)}<path d="${wave(235, 30, 800, 19)}" fill="#5a9a4c"/>${meadow(random, 245, 300, 800, 170)}`);
      },
    },
    "Pain and tears": {
      line: "Rain on a pool above, the sun rising on green hills below.",
      lost: () => {
        const random = seeded(81), rain = repeat(120, () => `M${n(random() * 860)} ${n(60 + random() * 200)}l-6 16`);
        const ripples = repeat(9, () => `<ellipse cx="${n(380 + random() * 400)}" cy="${n(262 + random() * 30)}" rx="${n(10 + random() * 20)}" ry="${n(2 + random() * 3)}" fill="none" stroke="#5d6573" stroke-width="1"/>`);
        return svg("0 0 800 300", `${back("ta", [[0, "#151820"], [1, "#2a2f3a"]])}<path d="M300 70a50 50 0 0 1 90-24 60 60 0 0 1 110 10 40 40 0 0 1 60 44H290a30 30 0 0 1 10-30Z" fill="#3a404d"/><path d="M560 50a40 40 0 0 1 80-10 46 46 0 0 1 90 20 30 30 0 0 1 40 36H560a24 24 0 0 1 0-46Z" fill="#323845"/><path d="${rain}" stroke="#7d8696" stroke-width="1.1" opacity=".75"/><path d="M0 300V250H800V300Z" fill="#1b1f27"/>${ripples}`);
      },
      found: () => {
        const random = seeded(83);
        return svg("0 0 800 300", `${back("tb", [[0, "#f9e3a4"], [.6, "#fbefc9"], [1, "#d9ebba"]])}${sun(600, 190, 70, 30, 2.6)}<path d="${wave(200, 50, 800, 85)}" fill="#9cc77a"/><path d="${wave(240, 40, 800, 87)}" fill="#6fa856"/>${meadow(random, 250, 300, 800, 150)}`);
      },
    },
    "The presence": {
      line: "A dark grove in the evening wind, fig leaves on the ground; then a tent pitched among homes.",
      lost: () => {
        const random = seeded(201), wind = repeat(9, () => { const x = 380 + random() * 380, y = 40 + random() * 130; return `M${n(x)} ${n(y)}q30 -10 60 0t60 0`; });
        const leaves = repeat(5, () => leafShape(430 + random() * 340, 266 + random() * 24, 26, random() * 360, "#24352a"));
        return svg("0 0 800 300", `${back("pra", [[0, "#10141a"], [1, "#262c33"]])}${stars(random, 20, 800, 70)}<path d="${wind}" stroke="#4a5562" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/><path d="${wave(215, 20, 800, 203)}" fill="#151a1f"/>${crownTree(500, 240, 30, 205, { fruit: [], leaf: DARK_LEAF, bark: "#14110e" })}${crownTree(610, 250, 40, 207, { fruit: [], leaf: DARK_LEAF, bark: "#14110e" })}${crownTree(730, 244, 34, 209, { fruit: [], leaf: DARK_LEAF, bark: "#14110e" })}<path d="M0 300V256H800V300Z" fill="#0f1215"/>${leaves}`);
      },
      found: () => {
        const random = seeded(211);
        const home = (x, base, wide) => `<path d="M${x} ${base}V${base - wide * .6}L${x + wide / 2} ${base - wide}L${x + wide} ${base - wide * .6}V${base}Z" fill="#efe3c6" stroke="#c9b48d" stroke-width="1.2"/><rect x="${n(x + wide * .38)}" y="${n(base - wide * .38)}" width="${n(wide * .24)}" height="${n(wide * .38)}" fill="#b98d52"/>`;
        return svg("0 0 800 300", `${back("prb", [[0, "#fbefc9"], [.6, "#e3efc4"], [1, "#cfe6b1"]])}${sun(760, 50, 20, 16, 2)}<path d="${wave(190, 30, 800, 213)}" fill="#a9cf86"/>${home(420, 228, 34)}${home(470, 222, 26)}${home(740, 226, 36)}<path d="M0 300V230C200 224 500 234 800 226V300Z" fill="#7db463"/><path d="M520 262L612 168L704 262Z" fill="#f4ead2" stroke="#c9b48d" stroke-width="2"/><path d="M548 262L612 196L676 262M576 262L612 226L648 262" stroke="#e1d1ab" stroke-width="1.5" fill="none"/><path d="M590 262L612 214L634 262Z" fill="#fff4cf"/><path d="M612 168V160M520 262L490 272M704 262L734 272" stroke="#a37d43" stroke-width="1.5"/>${meadow(random, 262, 300, 800, 130)}`);
      },
    },
    "The way in": {
      line: "Shut at night above, standing open in the morning below.",
      lost: () => {
        const random = seeded(71);
        return svg("0 0 800 300", `${back("ga", [[0, "#0c0f15"], [1, "#1f232b"]])}${stars(random, 50, 800, 150)}${wall("#262a32", "#3a3f49")}<path d="M520 300V215a40 40 0 0 1 80 0V300Z" fill="#3b2e22" stroke="#594632" stroke-width="2"/><path d="M560 178V300M530 230h60M530 262h60" stroke="#594632" stroke-width="2.5"/><rect x="552" y="236" width="16" height="12" rx="2" fill="#7a6a55"/>`);
      },
      found: () => {
        const random = seeded(73), light = repeat(9, (i) => `M560 236L${n(430 + i * 32.5)} 300`);
        return svg("0 0 800 300", `${back("gb", [[0, "#fbefc9"], [1, "#e3efc4"]])}${sun(560, 90, 26, 22, 3)}${wall("#e9dcc0", "#c9b48d")}<path d="M520 300V215a40 40 0 0 1 80 0V300Z" fill="#fff4cf"/><path d="M520 215L490 222V300H520ZM600 215L630 222V300H600Z" fill="#c79e5b" stroke="#a37d43" stroke-width="1.5"/><path d="M0 300V250C200 236 400 244 520 250H600C700 244 760 240 800 244V300Z" fill="#7db463"/>${meadow(random, 255, 300, 800, 120)}<path d="M528 300L540 255H580L592 300Z" fill="#f1d58a" opacity=".85"/><path d="${light}" stroke="#f6dc8c" stroke-width="1" opacity=".5"/>`);
      },
    },
    "Dry bones": {
      line: "A valley full of dry bones at night; then the same valley green at sunrise, and a great crowd standing on its feet.",
      lost: () => {
        const random = seeded(301);
        const bones = repeat(46, () => bone(430 + random() * 360, 250 + random() * 46, 12 + random() * 18, random() * 180, random() < .5 ? "#b9ae98" : "#a39883"));
        const skulls = [[520, 264, 1], [655, 284, 1.15], [748, 258, .85]].map(([x, y, s]) => skull(x, y, s, "#c4b9a2", "#1d1914")).join("");
        return svg("0 0 800 300", `${back("dba", [[0, "#0a0c11"], [.7, "#1c1a18"], [1, "#2c261e"]])}${stars(random, 50, 800, 150)}${moon(700, 50, 20, .6)}<path d="${wave(170, 60, 800, 303)}" fill="#14130f"/><path d="M0 300V236C200 232 500 240 800 234V300Z" fill="#2a241c"/>${cracks(random, 14, 380, 800, 240, 296, "#1a160f")}${bones}${skulls}${deadBush(random, 440, 236, 14)}`);
      },
      found: () => {
        const random = seeded(311);
        const breath = repeat(7, (i) => `M${n(380 + random() * 60)} ${n(70 + i * 18 + random() * 10)}q60 -16 120 0t120 0t120 0`);
        const row = (count, x0, x1, base, s) => repeat(count, (i) => person(x0 + (i + random() * .6) * (x1 - x0) / count, base, s, TONES[Math.floor(random() * TONES.length)], random() < .3));
        return svg("0 0 800 300", `${back("dbb", [[0, "#fdf0c8"], [.6, "#f3f1d2"], [1, "#d6eab4"]])}${sun(640, 150, 30, 26, 3)}<path d="${breath}" stroke="#e8c46a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/><path d="${wave(170, 60, 800, 303)}" fill="#a9cf86"/><path d="M0 300V236C200 232 500 240 800 234V300Z" fill="#86c066"/>${meadow(random, 240, 300, 430, 60)}${row(16, 430, 800, 246, .5)}${row(12, 420, 800, 272, .75)}${row(8, 420, 800, 302, 1.05)}`);
      },
    },
    "Dust to glory": {
      line: "Dust blowing off a grave at dusk; then the same ground in flower, and the risen standing in the light.",
      lost: () => {
        const random = seeded(321);
        const dust = repeat(90, () => { const x = 540 + random() * 260, y = 150 + random() * 100 - (x - 540) * .25; return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(.8 + random() * 1.8)}" fill="#a88a68" opacity="${n(.2 + random() * .45)}"/>`; });
        const gusts = repeat(8, () => `M${n(520 + random() * 200)} ${n(170 + random() * 70)}q40 -14 80 -10t80 -22`);
        const cairn = [[590, 226], [618, 226], [646, 226], [604, 212], [632, 212], [618, 199]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="14" ry="8" fill="#5a4a3a" stroke="#2a2119" stroke-width="1.4"/>`).join("");
        return svg("0 0 800 300", `${back("dua", [[0, "#15100e"], [.6, "#3a2519"], [1, "#6a3f24"]])}${stars(random, 16, 800, 70)}<circle cx="720" cy="230" r="40" fill="#b8562a" opacity=".55"/><path d="M0 300V238C200 234 450 244 800 236V300Z" fill="#241a14"/><path d="M470 262C520 222 720 218 770 262Z" fill="#45352a" stroke="#5c4836" stroke-width="2"/>${cairn}<path d="${gusts}" stroke="#8d7254" stroke-width="1.3" fill="none" opacity=".4" stroke-linecap="round"/>${dust}${cracks(random, 14, 0, 800, 262, 296, "#16100c")}`);
      },
      found: () => {
        const random = seeded(331);
        const rays = repeat(28, (i) => { const a = Math.PI + (i / 27) * Math.PI; return `M${n(640 + Math.cos(a) * 90)} ${n(170 + Math.sin(a) * 90)}L${n(640 + Math.cos(a) * 700)} ${n(170 + Math.sin(a) * 700)}`; });
        const risen = [[540, 250, .95, false], [592, 238, .8, true], [640, 252, 1.05, true], [690, 240, .82, false], [742, 254, .98, true]].map(([x, base, s, raised]) => `<ellipse cx="${x}" cy="${n(base - 26 * s)}" rx="${n(36 * s)}" ry="${n(48 * s)}" fill="url(#dug)"/>${shining(x, base, s, raised, "#d9a640")}`).join("");
        const flowers = repeat(60, () => `<circle cx="${n(490 + random() * 280)}" cy="${n(250 + random() * 40)}" r="${n(2 + random() * 2.4)}" fill="${BLOOMS[Math.floor(random() * 3)]}"/>`);
        return svg("0 0 800 300", `${glow("dug", [[0, "#ffffff"], [.5, "#fff2c4", .8], [1, "#f6dc8c", 0]])}${back("dub", [[0, "#fdf3d6"], [.6, "#f6f4dc"], [1, "#d9ebba"]])}<path d="${rays}" stroke="#f1d58a" stroke-width="2" opacity=".45"/><path d="${wave(200, 30, 800, 333)}" fill="#b8d98f"/><path d="M0 300V238C200 234 450 244 800 236V300Z" fill="#86c066"/><path d="M500 262C540 240 680 236 740 262Z" fill="#6fa856"/>${meadow(random, 244, 300, 800, 150)}${flowers}${risen}`);
      },
    },
    "Scarlet to white": {
      line: "A scarlet garment caught on a thorn tree in the dark, fig leaves fallen below; then robes white as snow under white peaks, palm branches raised.",
      lost: () => {
        const random = seeded(341);
        const leaves = repeat(6, () => leafShape(470 + random() * 300, 272 + random() * 22, 24, random() * 360, "#24352a"));
        const robe = `<g transform="translate(640 176) rotate(-12) scale(.78)"><path d="M-46 -40L-16 -48C-10 -40 10 -40 16 -48L46 -40L58 -8L34 -2L32 70L22 62L12 74L0 64L-12 76L-22 64L-32 72L-34 -2L-58 -8Z" fill="#9a1f24"/><path d="M-16 -48C-10 -36 10 -36 16 -48M-18 -30C-20 10 -18 40 -16 66M4 -34C4 10 6 40 6 66M22 -30C24 10 24 40 22 62" stroke="#6e1418" stroke-width="2.5" fill="none"/></g>`;
        return svg("0 0 800 300", `${glow("scg", [[0, "#9a1f24", .35], [1, "#9a1f24", 0]])}${back("sca", [[0, "#0b0a0d"], [1, "#1d171a"]])}${stars(random, 30, 800, 110)}<path d="${wave(226, 22, 800, 343)}" fill="#131114"/><ellipse cx="636" cy="190" rx="140" ry="110" fill="url(#scg)"/>${bareTree(640, 272, 56, 345, "#4a3a3c")}${robe}${thorns(random, 720, 268, 34)}${thorns(random, 470, 270, 26)}${thorns(random, 600, 270, 30)}<path d="M0 300V266H800V300Z" fill="#100d0f"/>${leaves}`);
      },
      found: () => {
        const random = seeded(351);
        const peaks = `<path d="M360 220L470 92L560 200L640 70L760 210L800 180V230H360Z" fill="#c9d3dc"/><path d="M445 121L470 92L497 124L482 118L470 130L458 118ZM620 103L640 70L672 108L654 100L640 114L628 100Z" fill="#ffffff"/>`;
        const frond = (x, y, angle) => `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)})"><path d="M0 0V-34" stroke="#3f8445" stroke-width="1.6"/>${repeat(8, (i) => leafShape(0, -8 - i * 3.4, 10 - i * .7, -150, "#4f9a4a") + leafShape(0, -8 - i * 3.4, 10 - i * .7, -30, "#3f8445"))}</g>`;
        const robed = [[480, 296, 1.05], [540, 278, .85], [600, 298, 1.1], [655, 276, .82], [712, 296, 1.05], [765, 280, .85]].map(([x, base, s], i) => `${shining(x, base, s, i % 2 === 0, "#cfc6b0")}${i % 2 === 0 ? frond(x + 19 * s, base - 54 * s, 10) : ""}`).join("");
        return svg("0 0 800 300", `${back("scb", [[0, "#eef4fb"], [.6, "#f6f6ea"], [1, "#d9ebba"]])}${sun(720, 50, 20, 16, 2)}${peaks}<path d="${wave(226, 18, 800, 353)}" fill="#a9cf86"/><path d="M0 300V250C200 246 500 254 800 248V300Z" fill="#86c066"/>${meadow(random, 252, 300, 800, 120)}${robed}`);
      },
    },
    "Ashes to a crown": {
      line: "Torn sackcloth on a heap of ashes, the last embers smoking; then a crown of gold set on green ground in the morning light.",
      lost: () => {
        const random = seeded(361);
        const smoke = repeat(5, () => { const x = 570 + random() * 130, rise = 60 + random() * 80, sway = 8 + random() * 12; return `M${n(x)} 234c${n(-sway)} ${n(-rise * .25)} ${n(sway)} ${n(-rise * .45)} ${n(sway * .3)} ${n(-rise * .6)}s${n(-sway * 1.4)} ${n(-rise * .3)} ${n(sway)} ${n(-rise * .4)}`; });
        const embers = repeat(18, () => `<circle cx="${n(530 + random() * 200)}" cy="${n(240 + random() * 26)}" r="${n(1.2 + random() * 1.8)}" fill="${random() < .5 ? "#d9603b" : "#f0a24a"}" opacity="${n(.5 + random() * .5)}"/>`);
        const specks = repeat(80, () => `<circle cx="${n(500 + random() * 260)}" cy="${n(240 + random() * 36)}" r="${n(.8 + random() * 1.4)}" fill="#7a746c" opacity=".7"/>`);
        const cloth = "M540 274C556 250 596 236 636 236C664 236 688 244 702 254L698 262L706 268L696 274L702 282L540 282Z";
        const fray = repeat(9, (i) => `M${n(698 + (i % 3) * 2)} ${254 + i * 3}l${n(5 + random() * 6)} ${n(random() * 3)}`);
        const weave = repeat(32, (i) => `M${540 + i * 5} 220V290M540 ${222 + i * 5}H710`);
        return svg("0 0 800 300", `${back("asa", [[0, "#0e0d0e"], [.7, "#1f1c1b"], [1, "#2e2a27"]])}${stars(random, 14, 800, 60)}<path d="${smoke}" stroke="#7a746c" stroke-width="3" fill="none" opacity=".3" stroke-linecap="round"/><path d="M0 300V262C200 258 500 266 800 260V300Z" fill="#191716"/><path d="M480 280C520 236 600 222 650 224C700 226 760 246 790 280Z" fill="#4a4642"/>${specks}${embers}<defs><clipPath id="asc"><path d="${cloth}"/></clipPath></defs><path d="${cloth}" fill="#6b5a40"/><path d="${weave}" stroke="#54462f" stroke-width="1" opacity=".45" clip-path="url(#asc)"/><path d="M570 266C590 252 610 246 632 246M600 276C620 262 650 256 676 260" stroke="#4a3d2a" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="${fray}" stroke="#6b5a40" stroke-width="1.4" stroke-linecap="round"/>`);
      },
      found: () => {
        const random = seeded(371);
        const rays = repeat(30, (i) => { const a = (i / 30) * Math.PI * 2; return `M${n(630 + Math.cos(a) * 80)} ${n(190 + Math.sin(a) * 80)}L${n(630 + Math.cos(a) * 600)} ${n(190 + Math.sin(a) * 600)}`; });
        const pearls = (points) => points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff4cf" stroke="#b8862a" stroke-width="1.5"/>`).join("");
        const crown = `<path d="M572 232L564 168L596 196L614 152L630 190L646 152L664 196L696 168L688 232Z" fill="url(#asw)" stroke="#b8862a" stroke-width="2"/><rect x="568" y="222" width="124" height="18" rx="3" fill="url(#asw)" stroke="#b8862a" stroke-width="2"/>${pearls([[564, 168], [614, 152], [646, 152], [696, 168], [594, 231], [630, 231], [666, 231]])}`;
        const garland = repeat(26, (i) => `<circle cx="${n(546 + i * 6.6)}" cy="${n(244 + Math.sin(i * .9) * 3)}" r="3.4" fill="${BLOOMS[i % 3]}"/>`);
        return svg("0 0 800 300", `${glow("asg", [[0, "#ffffff"], [.4, "#fff4cc"], [1, "#f8ecc0", 0]])}${grad("asw", [[0, "#fff1b8"], [1, "#e0a93a"]])}${back("asb", [[0, "#fdf3d6"], [.6, "#f3f1d2"], [1, "#d6eab4"]])}<path d="${rays}" stroke="#f1d58a" stroke-width="2" opacity=".45"/><ellipse cx="630" cy="190" rx="260" ry="170" fill="url(#asg)"/><path d="${wave(210, 26, 800, 373)}" fill="#a9cf86"/><path d="M0 300V250C200 246 500 254 800 248V300Z" fill="#86c066"/><path d="M500 262C540 236 720 236 760 262Z" fill="#7db463"/>${crown}${garland}${meadow(random, 256, 300, 800, 150)}`);
      },
    },
  };
  function wall(fill, edge) {
    return `<path d="M0 300V170H480V150H640V170H800V300Z" fill="${fill}" stroke="${edge}" stroke-width="1.5"/>${repeat(16, (i) => `<rect x="${i * 50}" y="158" width="26" height="14" fill="${fill}" stroke="${edge}" stroke-width="1.2"/>`)}`;
  }
})();
