// The drawings for Every life in God's image, in one hand: a thin stroke, round caps, a faint wash, Poetry teal as the
// study's colour. The hero is a set table with one chair drawn back and a place laid, its cloth edged in knitted
// stitches, a candle burning: "Knit in secret. / Seated at the table." The five rooms are floor plans seen from above,
// walls drawn as an architect draws them, with the door's swing. People are placed on them by rooms.js as plain rings;
// no one is drawn, and no face or figure of God, of Christ or of the Father. Fixed strings, never built from data.
window.ELArt = (() => {
  const stitches = (x0, x1, y) => {
    let d = "";
    for (let x = x0; x < x1; x += 10) d += `M${x} ${y}l5 7 5-7`;
    return `<path class="el-stitch" d="${d}"/>`;
  };
  const plate = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="15" ry="5"/><ellipse class="el-faint" cx="${x}" cy="${y}" rx="9" ry="3"/>`;
  // A wall with a door gap: walls(x, y, w, h, side, from, to) leaves the gap on one side and draws the door's swing.
  const walls = (x, y, w, h, gap) => {
    const [side, a, b] = gap;
    const r = b - a;
    const outer = `<rect class="el-wall" x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/>`;
    const inner = `<rect class="el-wall-in" x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="1"/>`;
    const cut = side === "left" ? `<rect class="el-gap" x="${x - 2}" y="${a}" width="10" height="${r}"/><path class="el-door" d="M${x + 6} ${a}v${r}M${x + 6} ${a}a${r} ${r} 0 0 1 ${r} ${r}"/>`
      : side === "bottom" ? `<rect class="el-gap" x="${a}" y="${y + h - 8}" width="${r}" height="10"/><path class="el-door" d="M${a} ${y + h - 6}h${r}M${a} ${y + h - 6}a${r} ${r} 0 0 1 ${r} -${r}"/>`
        : `<rect class="el-gap" x="${x + w - 8}" y="${a}" width="10" height="${r}"/><path class="el-door" d="M${x + w - 6} ${a}v${r}M${x + w - 6} ${a}a${r} ${r} 0 0 0 -${r} ${r}"/>`;
    return outer + inner + cut;
  };
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <circle class="el-disc" cx="210" cy="168" r="150"/>
      <ellipse class="el-orbit" cx="210" cy="168" rx="198" ry="132"/>
      <path class="el-faint" d="M30 290h360"/>
      <path class="el-cloth" d="M92 196l34-52h168l34 52Z"/>
      <path d="M92 196l34-52h168l34 52Z"/>
      <path d="M92 196v14h236v-14"/>
      ${stitches(96, 324, 201)}
      <path d="M112 210v72M308 210v72M140 196v-4M280 196v-4"/>
      <path class="el-faint" d="M150 210v58M270 210v58"/>
      ${plate(150, 170)}${plate(270, 170)}${plate(178, 152)}${plate(242, 152)}
      <g class="el-tone">${plate(210, 186)}</g>
      <path class="el-faint" d="M188 186h-8M232 186h8"/>
      <path d="M206 160v-16h8v16"/>
      <path class="el-flame" d="M210 142c-5-6-3-12 0-17 3 5 5 11 0 17Z"/>
      <path class="el-glow el-faint" d="M210 136m-14 0a14 14 0 1 0 28 0a14 14 0 1 0-28 0"/>
      <path class="el-tone" d="M338 296v-40h36v40M338 256v-52M338 222h-4M374 296v-4"/>
      <path class="el-faint" d="M338 238h-6M330 268h52"/>
      <path class="el-thread" d="M40 70c40 30 90-24 128 10s66 30 94-4 70-30 118 6"/>
      <path class="el-faint" d="M52 92c30 20 70-10 104 10M268 92c30-16 64-14 96 6"/>
    </svg>`,
    rooms: {
      womb: `<svg viewBox="0 0 640 320" aria-hidden="true">
        <path class="el-ground" d="M0 300c120-14 240-18 320-18s200 4 320 18"/>
        <path class="el-faint" d="M40 312c90-8 180-10 280-10s190 2 280 10"/>
        <ellipse class="el-wash" cx="320" cy="168" rx="150" ry="96"/>
        <ellipse class="el-weave" cx="320" cy="168" rx="150" ry="96"/>
        <ellipse class="el-weave is-2" cx="320" cy="168" rx="120" ry="76"/>
        <ellipse class="el-weave is-3" cx="320" cy="168" rx="88" ry="56"/>
        <ellipse class="el-weave is-4" cx="320" cy="168" rx="54" ry="34"/>
        <path class="el-faint" d="M170 168h-30M470 168h30M320 72v-12"/>
        <text class="el-plan-note" x="320" y="296" text-anchor="middle">the depths of the earth</text>
        <text class="el-plan-note" x="476" y="96">in secret</text>
      </svg>`,
      table: `<svg viewBox="0 0 640 320" aria-hidden="true">
        ${walls(160, 74, 460, 236, ["left", 96, 140])}
        <rect class="el-cloth" x="230" y="140" width="270" height="40" rx="3"/>
        <rect x="230" y="140" width="270" height="40" rx="3"/>
        ${[256, 400, 448].map((x) => `<circle class="el-faint" cx="${x}" cy="130" r="7"/>`).join("")}${[256, 304, 400, 448].map((x) => `<circle class="el-faint" cx="${x}" cy="190" r="7"/>`).join("")}
        <path class="el-path" d="M78 66C120 80 132 112 168 118S300 150 352 190"/>
        <text class="el-plan-note" x="30" y="104">from Lo-debar</text>
        <text class="el-plan-note" x="566" y="104" text-anchor="end">Jerusalem</text>
      </svg>`,
      meeting: `<svg viewBox="0 0 640 320" aria-hidden="true">
        ${walls(30, 36, 590, 270, ["bottom", 80, 128])}
        ${[100, 140].map((y) => `<path class="el-faint" d="M240 ${y}h160M240 ${y + 8}h160"/>`).join("")}
        <path class="el-path" d="M104 300C110 250 120 220 140 196"/>
        <text class="el-plan-note" x="600" y="290" text-anchor="end">your meeting</text>
      </svg>`,
      gate: `<svg viewBox="0 0 640 320" aria-hidden="true">
        <path class="el-wall" d="M0 40h272M368 40h272M0 78h272M368 78h272"/>
        <path class="el-cloth" d="M0 40h272v38H0ZM368 40h272v38H368Z"/>
        <path d="M252 30h24v58h-24ZM364 30h24v58h-24Z"/>
        <path class="el-door" d="M276 78a44 44 0 0 1 88 0"/>
        <path class="el-faint" d="M240 124h160M240 132h160"/>
        <path class="el-faint" d="M40 210c80 12 200 16 280 16s200-4 280-16"/>
        <text class="el-plan-note" x="320" y="24" text-anchor="middle">the gate</text>
        <text class="el-plan-note" x="40" y="66">the town wall</text>
      </svg>`,
      bedside: `<svg viewBox="0 0 640 320" aria-hidden="true">
        ${walls(70, 50, 500, 250, ["right", 200, 248])}
        <path class="el-window" d="M260 50h120M260 56h120"/>
        <rect class="el-cloth" x="258" y="118" width="124" height="88" rx="6"/>
        <rect x="258" y="118" width="124" height="88" rx="6"/>
        <rect class="el-faint" x="282" y="124" width="76" height="18" rx="6"/>
        <path class="el-faint" d="M258 170h124"/>
        <path class="el-faint" d="M200 164v-18a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v18M414 154v-18a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v18"/>
        <text class="el-plan-note" x="320" y="44" text-anchor="middle">a window</text>
      </svg>`,
    },
  };
})();
