// The drawings for lost-cards.html: one pair per row of section 03, what was lost (dark) above and Revelation's answer (green
// and alive) below. Each scene keeps its busy part to the right, because the words sit on the left. Nothing here depicts God,
// Christ or an angel: the sword of Genesis 3:24 stands alone, and the face card draws only light.
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
  const meadow = (random, y0, y1, width, count) => repeat(count, () => {
    const x = random() * width, y = y0 + random() * (y1 - y0), tall = 6 + random() * 10;
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
        const random = seeded(147), STONES = ["#7fae8f", "#3d6fb5", "#b9c7d6", "#3f9a6a", "#c8735a", "#b8433a", "#d8c95a", "#6bb5b0", "#e3b54a", "#8fbf6a", "#d9783a", "#8a5bb0"];
        const rays = repeat(30, (i) => { const a = Math.PI + (i / 29) * Math.PI; return `M${n(615 + Math.cos(a) * 120)} ${n(190 + Math.sin(a) * 120)}L${n(615 + Math.cos(a) * 700)} ${n(190 + Math.sin(a) * 700)}`; });
        const crenel = (x0, x1, top) => repeat(Math.floor((x1 - x0) / 16), (i) => `<rect x="${x0 + i * 16 + 3}" y="${top - 8}" width="10" height="9" fill="url(#ltw)"/>`);
        const towers = [[440, 62], [525, 84], [600, 118], [690, 84], [770, 62]].map(([x, tall]) => `<rect x="${x}" y="${222 - tall}" width="32" height="${tall}" fill="url(#ltw)" stroke="#e3bc5c" stroke-width="1.2"/>${crenel(x - 3, x + 37, 222 - tall)}`).join("");
        const gates = [565, 615, 665].map((x) => `<circle cx="${x}" cy="206" r="16" fill="#ffffff" opacity=".55"/><path d="M${x - 10} 222V206a10 10 0 0 1 20 0V222Z" fill="#ffffff"/>`).join("");
        const bands = STONES.map((colour, i) => `<rect x="${n(436 + i * 30.5)}" y="222" width="30.5" height="12" fill="${colour}"/>`).join("");
        return svg("0 0 800 300", `${glow("ltg", [[0, "#ffffff"], [.3, "#fff4cc"], [1, "#f8ecc0", 0]])}${grad("ltw", [[0, "#fffaf0"], [1, "#f1cf72"]])}${back("ltb", [[0, "#fdf6dc"], [1, "#f3f3d0"]])}<ellipse cx="615" cy="190" rx="560" ry="300" fill="url(#ltg)"/><path d="${rays}" stroke="#f1d58a" stroke-width="2" opacity=".5"/><circle cx="615" cy="180" r="120" fill="#ffffff" opacity=".45"/><rect x="436" y="172" width="366" height="50" fill="url(#ltw)" stroke="#e3bc5c" stroke-width="1.2"/>${crenel(436, 802, 172)}${towers}${gates}${bands}<path d="M0 300V234C200 228 400 238 800 232V300Z" fill="#c6e3a0"/><path d="M606 234H624L690 300H540Z" fill="#fff4cf" opacity=".95"/>${crownTree(400, 266, 22, 151)}${meadow(random, 240, 300, 800, 160)}`);
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
        return svg("0 0 800 300", `${back("rb", [[0, "#e8f2c9"], [1, "#a6cf84"]])}${meadow(random, 40, 300, 800, 160)}<path d="${water}" fill="#6fbccb"/><path d="${glints}" stroke="#e9fbff" stroke-width="1.6" stroke-linecap="round"/>${crownTree(500, 150, 26, 63)}${crownTree(735, 130, 30, 65)}${crownTree(470, 270, 22, 67)}${crownTree(760, 275, 24, 69)}`);
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
    "The face": {
      line: "A cleft in the rock, with the light passing beyond the ridge; then a crowd looking up into the light, the emerald rainbow round it. No figure is drawn in the light.",
      wide: true,
      lost: () => {
        const random = seeded(221);
        return svg("0 0 1400 300", `${glow("fca", [[0, "#f1c35a", .5], [1, "#f1c35a", 0]])}${back("fcb", [[0, "#07080b"], [1, "#1a1c22"]], 1400)}${stars(random, 70, 1400, 160)}<ellipse cx="1080" cy="60" rx="260" ry="120" fill="url(#fca)"/><path d="M640 300L760 170L860 130L960 80L1040 60L1120 80L1220 120L1320 180L1400 200V300Z" fill="#1b1d22"/><path d="M860 130L960 80L1040 60L1120 80L1220 120" stroke="#c9a65a" stroke-width="2" fill="none" opacity=".75"/><path d="M1010 300L1022 210L1030 150L1040 120L1046 160L1052 220L1060 300Z" fill="#050507"/><path d="M700 300L820 210L900 230L980 200V300ZM1120 300L1180 230L1280 250L1400 230V300Z" fill="#121318"/>`);
      },
      found: () => {
        const random = seeded(231), cx = 1000, cy = 130, TONES = ["#5a4134", "#3f3a4e", "#34465a", "#6b5236", "#4a3a3a", "#3c4a3c"];
        const rays = repeat(44, (i) => { const a = (i / 44) * Math.PI * 2; return `M${n(cx + Math.cos(a) * 90)} ${n(cy + Math.sin(a) * 90)}L${n(cx + Math.cos(a) * 800)} ${n(cy + Math.sin(a) * 800)}`; });
        const bow = ["#2f8a5c", "#4fae7c", "#7fcf9e", "#b9ebcb"].map((colour, i) => `<path d="M${cx - 170 + i * 9} ${cy + 70}A${170 - i * 9} ${170 - i * 9} 0 0 1 ${cx + 170 - i * 9} ${cy + 70}" stroke="${colour}" stroke-width="9" fill="none" opacity=".7"/>`).join("");
        const backRow = repeat(22, (i) => person(560 + i * 40 + random() * 10, 270, 1.15, TONES[i % TONES.length], random() < .35));
        const frontRow = repeat(13, (i) => person(530 + i * 70 + random() * 12, 318, 1.8, TONES[(i + 3) % TONES.length], random() < .3));
        return svg("0 0 1400 300", `${glow("fcc", [[0, "#ffffff"], [.22, "#fff8e2"], [.6, "#f8e8b8", .6], [1, "#f5e6b4", 0]])}${back("fcd", [[0, "#fdf3d6"], [1, "#f3efcf"]], 1400)}<path d="${rays}" stroke="#f1d58a" stroke-width="2.2" opacity=".5"/><ellipse cx="${cx}" cy="${cy}" rx="560" ry="300" fill="url(#fcc)"/>${bow}<circle cx="${cx}" cy="${cy}" r="110" fill="#ffffff" opacity=".35"/><circle cx="${cx}" cy="${cy}" r="70" fill="#ffffff" opacity=".7"/><circle cx="${cx}" cy="${cy}" r="40" fill="#ffffff"/><path d="${wave(256, 12, 1400, 235)}" fill="#bcdc98"/>${backRow}${frontRow}`);
      },
    },
  };
  function wall(fill, edge) {
    return `<path d="M0 300V170H480V150H640V170H800V300Z" fill="${fill}" stroke="${edge}" stroke-width="1.5"/>${repeat(16, (i) => `<rect x="${i * 50}" y="158" width="26" height="14" fill="${fill}" stroke="${edge}" stroke-width="1.2"/>`)}`;
  }
})();
