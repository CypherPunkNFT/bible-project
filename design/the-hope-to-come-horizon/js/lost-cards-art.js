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

  // ── The rows, in the study's order ──
  return {
    "The deceiver": {
      line: "The serpent coiled in the tree, then a sealed pit under a green field.",
      lost: () => {
        const random = seeded(101), coil = [], front = [];
        for (let t = 0; t < 9; t += .25) { const x = 640 + 15 * Math.sin(t * 1.4), y = 268 - t * 11; coil.push(`${coil.length ? "L" : "M"}${n(x)} ${n(y)}`); if (Math.cos(t * 1.4) > 0) front.push(`M${n(x)} ${n(y)}L${n(640 + 15 * Math.sin((t + .25) * 1.4))} ${n(268 - (t + .25) * 11)}`); }
        return svg("0 0 800 300", `${back("dva", [[0, "#0b0e12"], [1, "#1d2127"]])}${stars(random, 45, 800, 150)}${moon(480, 60, 18, .6)}<path d="${wave(255, 22, 800, 103)}" fill="#14171c"/><path d="${coil.join("")}" stroke="#2c3a2b" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M632 300C634 240 636 180 640 120C642 90 650 70 660 60L656 58C640 80 632 110 628 140C624 200 622 250 620 300Z" fill="#2a2520"/><path d="M640 150C670 140 700 138 740 128M650 110C630 90 610 84 590 82M700 138C712 124 726 118 740 116" stroke="#2a2520" stroke-width="6" stroke-linecap="round" fill="none"/><path d="${front.join("")}" stroke="#4d6a45" stroke-width="7" stroke-linecap="round"/><path d="M641 169C660 160 680 150 700 146S716 152 716 160" stroke="#4d6a45" stroke-width="6" fill="none" stroke-linecap="round"/><ellipse cx="717" cy="164" rx="8" ry="5.5" fill="#4d6a45"/><circle cx="720" cy="162" r="1.6" fill="#e8c27a"/><path d="M724 167l7 3M731 170l3-3M731 170l3 2" stroke="#a8483a" stroke-width="1.2"/><path d="M688 140v14" stroke="#2a2520" stroke-width="1.5"/><circle cx="688" cy="160" r="7" fill="#7d3a30"/>`);
      },
      found: () => {
        const random = seeded(107), links = repeat(14, (i) => `<ellipse cx="${n(510 + i * 16)}" cy="${n(236 + (i - 6.5) * 1.4)}" rx="7" ry="4" fill="none" stroke="#6b6458" stroke-width="2.4"/>`);
        return svg("0 0 800 300", `${back("dvb", [[0, "#fbefc9"], [.6, "#e3efc4"], [1, "#cfe6b1"]])}${sun(710, 60, 24)}<path d="${wave(170, 40, 800, 109)}" fill="#a9cf86"/><path d="${wave(205, 22, 800, 111)}" fill="#7db463"/><ellipse cx="620" cy="246" rx="128" ry="30" fill="#8a826f"/><ellipse cx="620" cy="240" rx="124" ry="27" fill="#d6cfbd" stroke="#a49b86" stroke-width="2"/><ellipse cx="620" cy="238" rx="96" ry="18" fill="none" stroke="#bdb5a1" stroke-width="1.5"/>${links}<circle cx="620" cy="238" r="15" fill="#a8322a"/><circle cx="620" cy="238" r="9" fill="none" stroke="#7c231d" stroke-width="2"/>${crownTree(470, 205, 22, 113)}${meadow(random, 250, 300, 800, 150)}`);
      },
    },
    "The sky": {
      line: "The first heaven and earth at night, with its sea; then a new earth with no sea.",
      lost: () => {
        const random = seeded(121), streaks = repeat(7, () => { const x = 420 + random() * 360, y = 20 + random() * 110; return `M${n(x)} ${n(y)}l${n(-30 - random() * 30)} ${n(16 + random() * 12)}`; });
        const swell = repeat(18, () => { const x = 360 + random() * 440, y = 222 + random() * 70; return `M${n(x)} ${n(y)}q8 -4 16 0t16 0`; });
        return svg("0 0 800 300", `${back("ska", [[0, "#07090d"], [1, "#1b2029"]])}${stars(random, 90, 800, 200)}<path d="${streaks}" stroke="#e9e3d2" stroke-width="1.2" stroke-linecap="round" opacity=".55"/>${moon(700, 60, 22, .6)}<path d="M0 300V230C120 226 260 236 340 222V300Z" fill="#14171d"/><path d="M340 222H800V300H340Z" fill="#111722"/><path d="${swell}" stroke="#3d4a5e" stroke-width="1.4" fill="none"/><path d="M700 232v6M694 246h12M700 256v5M692 270h16M700 282v6" stroke="#b8b2a3" stroke-width="2" opacity=".5"/>`);
      },
      found: () => {
        const random = seeded(127);
        return svg("0 0 800 300", `${back("skb", [[0, "#cfe6f1"], [.55, "#f3f1d8"], [1, "#d9ebba"]])}<path d="M470 60a20 20 0 0 1 36-8 24 24 0 0 1 42 6 16 16 0 0 1 10 22H462a14 14 0 0 1 8-20Z" fill="#fffdf4" opacity=".9"/><path d="M640 92a16 16 0 0 1 30-6 20 20 0 0 1 34 6 12 12 0 0 1 6 16H632a12 12 0 0 1 8-16Z" fill="#fffdf4" opacity=".85"/>${birds(random, 6, 520, 760, 110, 150)}<path d="${wave(185, 36, 800, 131)}" fill="#b8d98f"/><path d="${wave(215, 30, 800, 133)}" fill="#8cc06c"/>${crownTree(720, 225, 24, 135)}<path d="${wave(245, 22, 800, 137)}" fill="#64a452"/>${meadow(random, 250, 300, 800, 150)}`);
      },
    },
    "The light": {
      line: "The greater light setting and the moon rising; then a city lit with no sun at all.",
      lost: () => {
        const random = seeded(141);
        return svg("0 0 800 300", `${back("lta", [[0, "#16131a"], [.6, "#4a2a24"], [1, "#7a3e26"]])}${stars(random, 30, 800, 90)}${moon(420, 60, 15, .6)}<circle cx="630" cy="236" r="48" fill="#d96b32"/><circle cx="630" cy="236" r="64" fill="#d96b32" opacity=".25"/><path d="M0 300V236C200 232 400 240 800 234V300Z" fill="#1c1513"/>${bareTree(520, 238, 18, 143, "#1c1513")}${bareTree(740, 236, 22, 145, "#1c1513")}`);
      },
      found: () => {
        const random = seeded(147);
        const towers = repeat(9, (i) => { const x = 470 + i * 34, tall = 26 + ((i * 7) % 5) * 9; return `<rect x="${x}" y="${222 - tall}" width="20" height="${tall}" fill="#fbe3a0" stroke="#d4ac52" stroke-width="1.4"/>`; });
        return svg("0 0 800 300", `${glow("ltg", [[0, "#ffffff"], [.35, "#fff2c4"], [1, "#f5e6b4", 0]])}${back("ltb", [[0, "#fbf3d6"], [1, "#eef3cf"]])}<ellipse cx="620" cy="210" rx="420" ry="230" fill="url(#ltg)"/>${towers}<path d="M450 222H800" stroke="#e6c873" stroke-width="2"/><path d="${wave(232, 20, 800, 149)}" fill="#a6d184"/>${crownTree(430, 262, 22, 151)}<path d="${wave(258, 16, 800, 153)}" fill="#7db463"/>${meadow(random, 262, 300, 800, 120)}`);
      },
    },
    "The river": {
      line: "A dry bed above, the river of life below, in one channel.",
      lost: () => {
        const random = seeded(51), bed = "M560 0C540 60 600 110 575 170S520 260 560 300H600C565 260 618 220 615 170S580 60 600 0Z";
        return svg("0 0 800 300", `${back("ra", [[0, "#1d1712"], [1, "#3a2d22"]])}${stars(random, 25, 800, 110)}<path d="${wave(150, 40, 800, 53)}" fill="#33281f"/><path d="${wave(210, 30, 800, 55)}" fill="#2a211a"/><path d="${bed}" fill="#1a1410" stroke="#4d3d2e" stroke-width="1.5"/>${cracks(random, 14, 560, 600, 0, 290, "#4d3d2e")}${bareTree(700, 250, 22, 57, "#3b2f25")}${bareTree(420, 260, 16, 59, "#3b2f25")}`);
      },
      found: () => {
        const random = seeded(61), water = "M560 0C545 70 610 120 585 180S500 260 520 300H700C640 260 690 210 660 160S600 60 600 0Z";
        const glints = repeat(22, () => { const y = random() * 290, x = 570 + (y / 300) * 40 + random() * 40; return `M${n(x)} ${n(y)}h${n(6 + random() * 10)}`; });
        return svg("0 0 800 300", `${back("rb", [[0, "#e8f2c9"], [1, "#a6cf84"]])}${meadow(random, 40, 300, 800, 160)}<path d="${water}" fill="#6fbccb"/><path d="${glints}" stroke="#e9fbff" stroke-width="1.6" stroke-linecap="round"/>${crownTree(500, 150, 26, 63)}${crownTree(735, 130, 30, 65)}${crownTree(470, 270, 22, 67)}${crownTree(760, 275, 24, 69)}`);
      },
    },
    "The tree": {
      line: "The flaming sword turning before the garden; then the tree of life on both banks of the river.",
      lost: () => {
        const random = seeded(161);
        const flames = repeat(16, (i) => { const y = 118 + i * 8, side = i % 2 ? 1 : -1; return `<path d="M${600 + side * 3} ${y}q${side * (8 + random() * 8)} -4 ${side * (4 + random() * 4)} -14" stroke="${i % 3 ? "#e2783a" : "#f1c35a"}" stroke-width="2" fill="none" stroke-linecap="round"/>`; });
        return svg("0 0 800 300", `${glow("tra", [[0, "#e2783a", .45], [1, "#e2783a", 0]])}${back("trb", [[0, "#0c0e13"], [1, "#221d18"]])}${stars(random, 40, 800, 120)}<path d="${wave(205, 26, 800, 163)}" fill="#14140f"/>${crownTree(720, 210, 30, 165, { fruit: ["#8a6a2e"], leaf: DARK_LEAF, bark: "#14110e" })}${crownTree(470, 214, 22, 167, { fruit: [], leaf: DARK_LEAF, bark: "#14110e" })}${crownTree(790, 220, 24, 169, { fruit: [], leaf: DARK_LEAF, bark: "#14110e" })}<path d="M0 300V250H800V300Z" fill="#0f0d0b"/><ellipse cx="600" cy="185" rx="90" ry="100" fill="url(#tra)"/><ellipse cx="600" cy="190" rx="44" ry="12" fill="none" stroke="#e2783a" stroke-width="1.2" stroke-dasharray="6 6" opacity=".6"/><path d="M600 100L604 112V250H596V112Z" fill="#e7e1d1"/><path d="M584 232H616" stroke="#c9a65a" stroke-width="5" stroke-linecap="round"/><path d="M600 236V262" stroke="#6b4d2c" stroke-width="5"/>${flames}`);
      },
      found: () => {
        const random = seeded(171), river = "M0 222C120 210 240 232 380 222S620 206 800 220V254C640 244 520 262 380 256S140 246 0 258Z";
        const glints = repeat(20, () => { const x = random() * 800, y = 228 + random() * 20; return `M${n(x)} ${n(y)}h${n(6 + random() * 10)}`; });
        const falling = repeat(10, () => leafShape(480 + random() * 300, 120 + random() * 110, 7, random() * 360, "#5a9f4f"));
        const fruit = ["#e8b84a", "#d9603b", "#9b3d6b", "#e98a3a", "#c94a4a"];
        return svg("0 0 800 300", `${back("tfb", [[0, "#fbefc9"], [.6, "#e3efc4"], [1, "#b9db97"]])}${sun(720, 50, 20, 16, 2)}<path d="${wave(185, 30, 800, 173)}" fill="#a9cf86"/><path d="M0 230V205C200 196 500 210 800 200V230Z" fill="#86bb68"/>${crownTree(560, 222, 36, 175, { fruit })}<path d="${river}" fill="#6fbccb"/><path d="${glints}" stroke="#e9fbff" stroke-width="1.6" stroke-linecap="round"/><path d="M0 300V256C140 246 380 262 520 256S700 246 800 252V300Z" fill="#6fa856"/>${crownTree(730, 296, 32, 177, { fruit })}${falling}${meadow(random, 262, 300, 640, 90)}`);
      },
    },
    "The curse": {
      line: "Thorns, thistles and a plough left in cracked ground; then a field ripe for harvest.",
      lost: () => {
        const random = seeded(181);
        const growth = repeat(9, (i) => (i % 2 ? thistle(440 + i * 40 + random() * 16, 262 + random() * 20, 24 + random() * 18) : thorns(random, 430 + i * 40 + random() * 20, 268 + random() * 16, 22 + random() * 16)));
        return svg("0 0 800 300", `${back("cua", [[0, "#17120f"], [.7, "#3a2a20"], [1, "#55392a"]])}${stars(random, 18, 800, 80)}<path d="${wave(214, 24, 800, 183)}" fill="#2a211b"/><path d="M0 300V238C240 232 520 244 800 236V300Z" fill="#3a2e24"/>${cracks(random, 26, 0, 800, 244, 296, "#21190f")}<path d="M552 278L668 222M660 226L700 186M660 226L676 196" stroke="#8a6a4a" stroke-width="6" stroke-linecap="round"/><path d="M552 278L534 294L568 285Z" fill="#6b6b70"/>${growth}`);
      },
      found: () => {
        const random = seeded(191);
        return svg("0 0 800 300", `${back("cub", [[0, "#fbefc9"], [.6, "#eef2c6"], [1, "#e6d79a"]])}${sun(700, 62, 24)}<path d="${wave(170, 30, 800, 193)}" fill="#a9cf86"/>${crownTree(470, 182, 18, 195)}${crownTree(520, 186, 16, 197)}${crownTree(570, 182, 18, 199)}<path d="M0 300V190C260 184 520 192 800 186V300Z" fill="#e2c46b"/>${wheat(random, 196, 300, 800, 420)}`);
      },
    },
    "Death": {
      line: "The grave above the line, the meadow below it. This card tries the gold banner.",
      gold: true,
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
      line: "A cleft in the rock, with the light passing beyond the ridge; then the curtain drawn back on light.",
      wide: true,
      lost: () => {
        const random = seeded(221);
        return svg("0 0 1400 300", `${glow("fca", [[0, "#f1c35a", .5], [1, "#f1c35a", 0]])}${back("fcb", [[0, "#07080b"], [1, "#1a1c22"]], 1400)}${stars(random, 70, 1400, 160)}<ellipse cx="1080" cy="60" rx="260" ry="120" fill="url(#fca)"/><path d="M640 300L760 170L860 130L960 80L1040 60L1120 80L1220 120L1320 180L1400 200V300Z" fill="#1b1d22"/><path d="M860 130L960 80L1040 60L1120 80L1220 120" stroke="#c9a65a" stroke-width="2" fill="none" opacity=".75"/><path d="M1010 300L1022 210L1030 150L1040 120L1046 160L1052 220L1060 300Z" fill="#050507"/><path d="M700 300L820 210L900 230L980 200V300ZM1120 300L1180 230L1280 250L1400 230V300Z" fill="#121318"/>`);
      },
      found: () => {
        const random = seeded(231);
        const folds = (x0, x1, colour, edge) => `<path d="M${x0} 0H${x1}C${x1 - 30} 100 ${x1 - 10} 200 ${x1 - 40} 300H${x0}Z" fill="${colour}"/><path d="${repeat(5, (i) => `M${n(x0 + ((x1 - x0) * (i + 1)) / 6)} 0C${n(x0 + ((x1 - x0) * (i + 1)) / 6 - 14)} 120 ${n(x0 + ((x1 - x0) * (i + 1)) / 6 + 4)} 220 ${n(x0 + ((x1 - x0) * (i + 1)) / 6 - 18)} 300`)}" stroke="${edge}" stroke-width="2" fill="none"/>`;
        return svg("0 0 1400 300", `${glow("fcc", [[0, "#ffffff"], [.4, "#fff2c4"], [1, "#f5e6b4", 0]])}${back("fcd", [[0, "#fbf3d6"], [1, "#eef3cf"]], 1400)}<ellipse cx="980" cy="170" rx="380" ry="220" fill="url(#fcc)"/><path d="${wave(236, 20, 1400, 233)}" fill="#a6d184"/><path d="M940 300L970 236H990L1020 300Z" fill="#fff4cf"/>${meadow(random, 250, 300, 1400, 200)}<g transform="translate(560 0)">${folds(0, 120, "#6e2b46", "#55203a")}</g><g transform="translate(1400 0) scale(-1 1)">${folds(0, 120, "#4a2a62", "#3a1f4f")}</g>`);
      },
    },
  };
  function wall(fill, edge) {
    return `<path d="M0 300V170H480V150H640V170H800V300Z" fill="${fill}" stroke="${edge}" stroke-width="1.5"/>${repeat(16, (i) => `<rect x="${i * 50}" y="158" width="26" height="14" fill="${fill}" stroke="${edge}" stroke-width="1.2"/>`)}`;
  }
})();
