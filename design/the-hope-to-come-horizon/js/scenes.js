// One drawn view for each reading, all on the same far hills, so walking the six readings is walking one horizon. Fixed drawings
// built here, seeded so they never change between visits. Nothing here depicts God or Christ: the throne has no figure on it.
(() => {
  if (!window.HZ) return;
  const WIDE = 1600, TALL = 300;
  const seeded = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const FAR = `<path class="sc-far" d="M0 300V168C90 150 170 176 270 150S430 112 540 146 700 182 820 150 1010 104 1140 140 1330 182 1440 152 1560 138 1600 150V300Z"/>`;
  const MID = `<path class="sc-mid" d="M0 300V232C120 214 240 244 380 226S620 198 780 228 1040 256 1180 228 1460 206 1600 230V300Z"/>`;
  const svg = (body) => `<svg viewBox="0 0 ${WIDE} ${TALL}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${FAR}${MID}${body}</svg>`;
  const hill = (top) => `<path class="sc-near" d="M0 300V${top + 26}C260 ${top + 6} 520 ${top + 2} 800 ${top}S1340 ${top + 8} 1600 ${top + 24}V300Z"/>`;

  // 01: the people they have buried, and the cloud of Acts 1:9 lifting.
  function graves() {
    const random = seeded(11), rows = [];
    const stone = (x, base, tall, wide) => `<path d="M${x} ${base}v${-tall}a${wide / 2} ${wide / 2} 0 0 1 ${wide} 0v${tall}z"/>`;
    for (let x = 300; x < 1320; x += 46 + random() * 30) rows.push(stone(x, 262, 16 + random() * 10, 12 + random() * 5));
    const back = `<g class="sc-mid-strong">${rows.join("")}</g>`;
    const front = [];
    for (let x = 240; x < 1380; x += 92 + random() * 66) front.push(stone(x, 300, 34 + random() * 22, 24 + random() * 10));
    const clouds = `<g class="sc-cloud"><path d="M380 62C470 40 560 54 650 44S860 22 980 44 1160 40 1230 62C1110 72 980 66 860 72S510 82 380 62Z"/><path d="M560 104C660 92 740 100 840 94S1010 96 1080 106C980 114 880 110 790 114S640 116 560 104Z"/></g>`;
    return svg(`${clouds}${back}${hill(268)}<g class="sc-near-strong">${front.join("")}</g>`);
  }
  // 02: what is sown small comes up tall, rising along the field.
  function grain() {
    const random = seeded(23), stalks = [];
    for (let x = 180; x < 1440; x += 15 + random() * 7) {
      const progress = (x - 180) / 1260, tall = 14 + Math.pow(progress, 1.5) * 196 + random() * 12, lean = (random() - .5) * 18;
      const topX = x + lean, topY = 300 - tall;
      let ear = "";
      if (tall > 46) for (let k = 0; k < 6; k += 1) {
        const y = topY + k * 7;
        ear += `<ellipse cx="${(topX - 4).toFixed(1)}" cy="${y.toFixed(1)}" rx="2.6" ry="5.4" transform="rotate(-24 ${(topX - 4).toFixed(1)} ${y.toFixed(1)})"/><ellipse cx="${(topX + 4).toFixed(1)}" cy="${y.toFixed(1)}" rx="2.6" ry="5.4" transform="rotate(24 ${(topX + 4).toFixed(1)} ${y.toFixed(1)})"/>`;
      }
      stalks.push(`<path class="sc-stem" d="M${x.toFixed(1)} 300Q${(x + lean * .2).toFixed(1)} ${(300 - tall * .6).toFixed(1)} ${topX.toFixed(1)} ${topY.toFixed(1)}"/><g class="sc-gold">${ear}</g>`);
    }
    return svg(`${hill(282)}${stalks.join("")}`);
  }
  // 03: the throne with no figure drawn on it, the books open, and the dead standing, great and small.
  function throne() {
    const random = seeded(37), crowd = [];
    for (let x = 90; x < 1520; x += 13 + random() * 9) {
      if (x > 590 && x < 1010) continue;
      const tall = 18 + random() * 32, base = 300, wide = tall * .3;
      crowd.push(`<circle cx="${x.toFixed(1)}" cy="${(base - tall - wide * .62).toFixed(1)}" r="${(wide * .62).toFixed(1)}"/><path d="M${(x - wide / 2).toFixed(1)} ${base}V${(base - tall + wide / 2).toFixed(1)}a${(wide / 2).toFixed(1)} ${(wide / 2).toFixed(1)} 0 0 1 ${wide.toFixed(1)} 0V${base}z"/>`);
    }
    const book = (x, y) => `<path class="sc-gold" d="M${x - 46} ${y}Q${x - 22} ${y - 10} ${x} ${y}Q${x + 22} ${y - 10} ${x + 46} ${y}V${y + 8}Q${x + 22} ${y - 2} ${x} ${y + 8}Q${x - 22} ${y - 2} ${x - 46} ${y + 8}Z"/>`;
    const rays = [];
    for (let i = 0; i <= 40; i += 1) {
      const angle = Math.PI + (Math.PI * i) / 40, reach = i % 2 ? 300 : 430;
      rays.push(`M${(800 + Math.cos(angle) * 96).toFixed(1)} ${(190 + Math.sin(angle) * 96).toFixed(1)}L${(800 + Math.cos(angle) * reach).toFixed(1)} ${(190 + Math.sin(angle) * reach).toFixed(1)}`);
    }
    const seat = `<path class="sc-rays" d="${rays.join("")}"/><g class="sc-white"><path d="M756 170V56H768V38H784V22H816V38H832V56H844V170Z"/><rect x="726" y="140" width="18" height="76"/><rect x="718" y="130" width="38" height="10"/><rect x="856" y="140" width="18" height="76"/><rect x="844" y="130" width="38" height="10"/><rect x="744" y="170" width="112" height="16"/><rect x="752" y="186" width="96" height="30"/></g>`;
    const steps = `<g class="sc-near-strong"><rect x="680" y="216" width="240" height="22"/><rect x="630" y="238" width="340" height="26"/><rect x="570" y="264" width="460" height="36"/></g>`;
    return svg(`${seat}${hill(286)}${steps}${book(690, 256)}${book(910, 256)}<g class="sc-near-strong">${crowd.join("")}</g>`);
  }
  // 04: a bare tree, still in bondage to decay, with the first buds on it.
  function tree() {
    const random = seeded(53), limbs = [], buds = [];
    (function grow(x, y, angle, length, width) {
      const endX = x + Math.cos(angle) * length, endY = y + Math.sin(angle) * length;
      limbs.push(`<path d="M${x.toFixed(1)} ${y.toFixed(1)}L${endX.toFixed(1)} ${endY.toFixed(1)}" stroke-width="${width.toFixed(1)}"/>`);
      if (width < 1.3) { if (random() < .42) buds.push(`<circle cx="${endX.toFixed(1)}" cy="${endY.toFixed(1)}" r="${(1.8 + random() * 1.8).toFixed(1)}"/>`); return; }
      const fork = .3 + random() * .32;
      grow(endX, endY, angle - fork, length * (.72 + random() * .12), width * .68);
      grow(endX, endY, angle + fork * (.8 + random() * .5), length * (.68 + random() * .14), width * .68);
    })(800, 300, -Math.PI / 2 + .04, 70, 20);
    return svg(`${hill(280)}<g class="sc-limbs">${limbs.join("")}</g><g class="sc-gold">${buds.join("")}</g>`);
  }
  // 05: the wall and its open gates, the river out of the city, and a tree on each bank. No temple is drawn: John says there is none.
  function city() {
    const random = seeded(71), towers = [];
    for (let x = 340; x < 1230; x += 44 + random() * 30) {
      const wide = 30 + random() * 26, tall = 22 + (1 - Math.abs(x - 800) / 470) * 92 + random() * 18;
      towers.push(`<path d="M${x.toFixed(1)} 182V${(182 - tall).toFixed(1)}a${(wide / 2).toFixed(1)} ${(wide / 2).toFixed(1)} 0 0 1 ${wide.toFixed(1)} 0V182Z"/>`);
    }
    let wall = "M260 262V172";
    for (let x = 260; x < 1340; x += 36) wall += `h18v-10h18v10`;
    wall += "V262Z";
    const gate = (x, wide, tall) => `<path class="sc-gold" d="M${x} 262V${262 - tall + wide / 2}a${wide / 2} ${wide / 2} 0 0 1 ${wide} 0V262Z"/>`;
    const crown = (x) => `<g class="sc-tree"><rect x="${x - 4}" y="236" width="8" height="58"/><circle cx="${x}" cy="208" r="30"/><circle cx="${x - 26}" cy="228" r="22"/><circle cx="${x + 26}" cy="228" r="22"/></g>`;
    const river = `<path class="sc-gold" d="M782 262H818C826 278 860 292 930 300H670C740 292 774 278 782 262Z"/>`;
    return svg(`<g class="sc-tower">${towers.join("")}</g><path class="sc-near-strong" d="${wall}"/>${hill(260)}${gate(500, 40, 72)}${gate(776, 48, 96)}${gate(1060, 40, 72)}${river}${crown(650)}${crown(950)}`);
  }
  // 06: a road to the horizon, with the milestones going on ahead.
  function road() {
    const stones = [];
    for (let i = 0; i < 7; i += 1) {
      const depth = Math.pow(i / 6, 1.7), y = 196 + depth * 104, half = 10 + depth * 300, tall = 3 + depth * 22, wide = 2 + depth * 11;
      [800 - half - wide * 2, 800 + half + wide].forEach((x) => stones.push(`<path d="M${x.toFixed(1)} ${y.toFixed(1)}v${(-tall).toFixed(1)}a${(wide / 2).toFixed(1)} ${(wide / 2).toFixed(1)} 0 0 1 ${wide.toFixed(1)} 0v${tall.toFixed(1)}z"/>`));
    }
    return svg(`<path class="sc-near" d="M0 300V216C300 200 560 196 800 194S1300 200 1600 216V300Z"/><path class="sc-road" d="M794 194H806L1110 300H490Z"/><path class="sc-gold" d="M799 196H801L806 300H794Z"/><g class="sc-near-strong">${stones.join("")}</g>`);
  }
  HZ.SCENES = { return: graves(), raised: grain(), judgment: throne(), creation: tree(), new: city(), waiting: road() };
  // The heading's last arch: lower and flatter than the readings' own hill.
  HZ.HILLS = svg(`<path class="sc-near" d="M0 300V298C260 290 520 286 800 284S1340 288 1600 297V300Z"/>`);

})();
