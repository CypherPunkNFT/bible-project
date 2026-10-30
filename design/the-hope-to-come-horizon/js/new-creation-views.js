// Four versions of reading 05's view (Revelation 21:1-22:5), for the owner to compare under ?new-view=a. Without it the page keeps its
// current view. Nothing here depicts God or Christ, and no temple is drawn: John says there is none.
(() => {
  if (!window.HZ || !HZ.viewPill) return;
  const { svg, hill, seeded } = HZ.SCENE_PARTS;
  const n = (value) => value.toFixed(1);
  const arch = (x, base, wide, tall) => `M${n(x)} ${n(base)}V${n(base - tall + wide / 2)}a${n(wide / 2)} ${n(wide / 2)} 0 0 1 ${n(wide)} 0V${n(base)}Z`;
  const fan = (cx, cy, from, rx, ry, count = 40) => {
    const rays = [];
    for (let i = 0; i <= count; i += 1) {
      const angle = Math.PI + (Math.PI * i) / count, edge = 1 / Math.hypot(Math.cos(angle) / rx, Math.sin(angle) / ry), reach = i % 2 ? edge * .72 : edge;
      rays.push(`M${n(cx + Math.cos(angle) * from)} ${n(cy + Math.sin(angle) * from)}L${n(cx + Math.cos(angle) * reach)} ${n(cy + Math.sin(angle) * reach)}`);
    }
    return `<path class="sc-rays" d="${rays.join("")}"/>`;
  };
  // A round-crowned tree hung with fruit: "the tree of life" on each side of the river.
  const fruitTree = (x, base, size, random) => {
    const fruit = [];
    for (let i = 0; i < 16; i += 1) fruit.push(`<circle cx="${n(x + (random() - .5) * size * 2.2)}" cy="${n(base - size * 1.9 + (random() - .5) * size * 1.3)}" r="${n(size * .07 + 1.5)}"/>`);
    return `<g class="sc-tree"><rect x="${n(x - size * .1)}" y="${n(base - size * 1.4)}" width="${n(size * .2)}" height="${n(size * 1.4)}"/><circle cx="${n(x)}" cy="${n(base - size * 2)}" r="${n(size * .85)}"/><circle cx="${n(x - size * .72)}" cy="${n(base - size * 1.55)}" r="${n(size * .6)}"/><circle cx="${n(x + size * .72)}" cy="${n(base - size * 1.55)}" r="${n(size * .6)}"/></g><g class="sc-gold">${fruit.join("")}</g>`;
  };

  // A: the holy city coming down out of heaven, still in the air above the land, its light falling ahead of it.
  function descending() {
    const random = seeded(19), towers = [], gates = [], falling = [];
    for (let x = 560; x < 1030; x += 34 + random() * 18) {
      const wide = 22 + random() * 16;
      towers.push(arch(x, 96, wide, 22 + (1 - Math.abs(x - 790) / 240) * 58 + random() * 10));
    }
    for (let i = 0; i < 12; i += 1) gates.push(arch(556 + i * 41.5, 136, 14, 26));
    for (let i = 0; i <= 26; i += 1) {
      const x = 540 + i * 20;
      falling.push(`M${x} 148L${n(800 + (x - 800) * 1.9)} ${i % 2 ? 250 : 286}`);
    }
    let wall = "M530 142V92";
    for (let x = 530; x < 1070; x += 30) wall += "h15v-8h15v8";
    wall += "V142Z";
    return svg(`<path class="sc-rays" d="${falling.join("")}"/><path class="sc-tower" d="M450 150C560 130 660 148 800 142S1060 130 1150 150C1040 178 920 192 800 192S560 178 450 150Z"/><path class="sc-tower" d="${towers.join("")}"/><path class="sc-near-strong" d="${wall}"/><path class="sc-gold" d="${gates.join("")}"/>${hill(280)}`);
  }
  // B: the river of the water of life coming straight towards the reader, with the tree on both banks.
  function river() {
    const random = seeded(61), left = [], right = [], glints = [];
    const at = (depth) => ({ x: 800 + Math.sin(depth * 3.4) * 26 * (1 - depth), y: 170 + depth * 130, half: 6 + Math.pow(depth, 1.7) * 330 });
    for (let i = 0; i <= 30; i += 1) {
      const { x, y, half } = at(i / 30);
      left.push(`${n(x - half)} ${n(y)}`);
      right.unshift(`${n(x + half)} ${n(y)}`);
    }
    for (let i = 0; i < 46; i += 1) {
      const depth = .08 + random() * .9, { x, y, half } = at(depth), spot = x + (random() - .5) * half * 1.6, long = 4 + depth * 34;
      glints.push(`M${n(spot - long)} ${n(y)}H${n(spot + long)}`);
    }
    const trees = [[300, 298, 56], [470, 262, 36], [596, 226, 22], [1004, 226, 22], [1130, 262, 36], [1300, 298, 56]];
    return svg(`${hill(240)}<path class="sc-gold" d="M${left.join("L")}L${right.join("L")}Z"/><path class="sc-glint" d="${glints.join("")}"/>${trees.map(([x, base, size]) => fruitTree(x, base, size, random)).join("")}`,
      `<circle class="sc-gold" cx="800" cy="150" r="42"/>${fan(800, 150, 56, 520, 150)}`);
  }
  // C: one gate standing open, its light on the road, and the nations walking in: "its gates will never be shut" (21:25).
  function openGate() {
    const random = seeded(83), people = [];
    const walker = (x, base, tall) => { const wide = tall * .3; return `<circle cx="${n(x)}" cy="${n(base - tall - wide * .62)}" r="${n(wide * .62)}"/><path d="${arch(x - wide / 2, base, wide, tall)}"/>`; };
    for (let i = 0; i < 44; i += 1) {
      const depth = random(), side = random() < .5 ? -1 : 1, base = 214 + depth * 86;
      people.push(walker(800 + side * (20 + depth * 620 * random()), base, 6 + depth * 34));
    }
    let wall = "M0 214V128";
    for (let x = 0; x < 1600; x += 40) wall += "h20v-10h20v10";
    wall += "V214Z";
    const light = `<path class="sc-road" d="M752 214H848L1230 300H370Z"/>`;
    return svg(`${fan(800, 110, 90, 620, 190, 36)}<path class="sc-near-strong" d="${wall}"/><path class="sc-white" d="${arch(742, 214, 116, 176)}"/><path class="sc-tower" d="M742 214V96L698 76V226ZM858 214V96L902 76V226Z"/>${hill(208)}${light}<g class="sc-near-strong">${people.join("")}</g>`);
  }
  // D: "no more death": the stones of reading 01 thrown over, flowers where they stood, and the city small on the far hill.
  function noMoreDeath() {
    const random = seeded(29), stones = [], stems = [], blooms = [], towers = [];
    for (let x = 720; x < 900; x += 20 + random() * 8) towers.push(arch(x, 140, 14, 16 + (1 - Math.abs(x - 806) / 96) * 30));
    for (let x = 60; x < 1560; x += 100 + random() * 70) {
      const base = 272 + random() * 22, tall = 34 + random() * 26, wide = 24 + random() * 12, tilt = (random() < .5 ? -1 : 1) * (28 + random() * 44);
      stones.push(`<path d="${arch(x, base, wide, tall)}" transform="rotate(${n(tilt)} ${n(x + wide / 2)} ${n(base)})"/>`);
    }
    for (let x = 10; x < 1600; x += 7 + random() * 9) {
      const tall = 8 + random() * 30, lean = (random() - .5) * 9, topY = 300 - tall;
      stems.push(`M${n(x)} 300Q${n(x)} ${n(300 - tall * .6)} ${n(x + lean)} ${n(topY)}`);
      if (random() < .62) blooms.push(`<circle cx="${n(x + lean)}" cy="${n(topY)}" r="${n(2 + random() * 2.6)}"/>`);
    }
    return svg(`${hill(262)}<g class="sc-near-strong">${stones.join("")}</g><path class="sc-stem" d="${stems.join("")}"/><g class="sc-gold">${blooms.join("")}</g>`,
      `${fan(806, 132, 60, 560, 180)}<path class="sc-gold" d="${towers.join("")}M706 150V132h200V150Z"/>`);
  }

  HZ.viewPill("new-view", "new", { a: descending(), b: river(), c: openGate(), d: noMoreDeath() });
})();
