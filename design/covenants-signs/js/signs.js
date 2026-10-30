// The five drawings, one for each covenant, plus the small signs for the row of worlds and the maps. They are pictures only:
// nothing in them can be clicked, and the five questions live in the buttons beside them. Fixed strings written here, never built from data.
window.CovSigns = (() => {
  const svg = (body) => `<svg viewBox="0 0 640 460" aria-hidden="true">${body}</svg>`;
  // A small repeatable random, so every drawing is the same on every load.
  const seeded = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const fixed = (n) => n.toFixed(1);
  const faded = (id, body) => `<defs>
      <linearGradient id="${id}-x"><stop offset="0" stop-color="#000"/><stop offset=".1" stop-color="#fff"/><stop offset=".9" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
      <linearGradient id="${id}-y" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".07" stop-color="#fff"/><stop offset=".86" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
      <mask id="${id}-mx" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="460"><rect width="640" height="460" fill="url(#${id}-x)"/></mask>
      <mask id="${id}-my" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="460"><rect width="640" height="460" fill="url(#${id}-y)"/></mask></defs>
    <g mask="url(#${id}-mx)"><g mask="url(#${id}-my)">${body}</g></g>`;
  const sparkle = (x, y, r) => `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;

  // ── Noah: a proper ark on a heavy sea, the rain still falling from the cloud bank, the whole bow, and the dove coming back ──
  function ark() {
    const top = "M126 282C148 298 172 307 198 309H442C468 307 492 298 518 276";
    let planks = "";
    for (const [y, inset] of [[326, 8], [342, 18], [358, 32], [372, 54]]) planks += `M${130 + inset} ${y - 16 + inset * 0.3}Q320 ${y + 13} ${514 - inset} ${y - 18 + inset * 0.3}`;
    let boards = "";
    for (let x = 226; x < 424; x += 15) boards += `M${x} 248V309`;
    let shingles = "";
    for (let y = 214; y < 248; y += 10) shingles += `M${236 - (y - 208)} ${y}H${404 + (y - 208)}`;
    const windows = [240, 270, 372, 402].map((x) => `<path class="cn-glow" d="M${x - 8} 284V268a8 8 0 0 1 16 0v16Z"/><path class="cn-frame" d="M${x - 8} 284V268a8 8 0 0 1 16 0v16ZM${x} 260v24"/>`).join("");
    let pegs = "";
    for (let x = 162; x < 490; x += 22) pegs += `<circle cx="${x}" cy="${fixed(321 + 11 * Math.sin(((x - 130) / 384) * Math.PI))}" r="1.600"/>`;
    return `<path class="cn-roof" d="M196 248L236 208H404L444 248Z"/><path class="cn-seam" d="${shingles}"/><path class="cn-rail" d="M236 208H404"/>
      <rect class="cn-house" x="214" y="248" width="212" height="62"/><path class="cn-seam" d="${boards}"/><path class="cn-seam" d="M214 256H426"/>
      ${windows}<path class="cn-door" d="M298 310V276a22 22 0 0 1 44 0v34Z"/><path class="cn-seam" d="M309 256V310M320 254V310M331 256V310"/>
      <path class="cn-hull" d="${top}C512 330 482 376 434 388H206C160 376 132 332 126 282Z"/><path class="cn-seam" d="${planks}"/><g class="cn-pegs">${pegs}</g><path class="cn-rail" d="${top}"/>`;
  }

  function noah() {
    const random = seeded(31);
    const bows = ["#d8503f", "#e8913a", "#f0cf57", "#6fae62", "#4c8fc0", "#7a62ad"].map((colour, i) => `<path d="M${28 + i * 13} 376A${292 - i * 13} ${292 - i * 13} 0 0 1 ${612 - i * 13} 376" stroke="${colour}"/>`).join("");
    const rain = (count, from, length, tilt) => Array.from({ length: count }, () => { const x = random() * 720 - 40, y = from + random() * (350 - from); return `M${fixed(x)} ${fixed(y)}l${tilt} ${length}`; }).join("");
    const clouds = (y, seed, size) => {
      const r = seeded(seed);
      let bumps = "";
      for (let x = -30; x < 680;) { const w = size * (0.6 + r()); bumps += `<circle cx="${fixed(x)}" cy="${fixed(y + r() * 12)}" r="${fixed(w)}"/>`; x += w * 1.05; }
      return bumps;
    };
    const sea = (kind, y, height, length, seed) => {
      const r = seeded(seed);
      let d = `M-40 ${y}`, foam = "", cursor = -40;
      while (cursor < 680) {
        const w = length * (0.7 + 0.6 * r()), h = height * (0.6 + 0.8 * r());
        d += `q${fixed(w * 0.6)} ${fixed(-h * 1.6)} ${fixed(w * 0.85)} ${fixed(-h * 0.2)}q${fixed(w * 0.05)} ${fixed(h * 0.55)} ${fixed(w * 0.15)} ${fixed(h * 0.2)}`;
        foam += `M${fixed(cursor + w * 0.3)} ${fixed(y - h * 0.62)}Q${fixed(cursor + w * 0.6)} ${fixed(y - h * 0.9)} ${fixed(cursor + w * 0.85)} ${fixed(y - h * 0.2)}`;
        cursor += w;
      }
      return `<path class="${kind}" d="${d}V470H-40Z"/><path class="cn-foam" d="${foam}"/>`;
    };
    return svg(`<defs>
        <radialGradient id="cn-sun"><stop offset="0" stop-color="#ffe9b0" stop-opacity=".8"/><stop offset=".55" stop-color="#ffe9b0" stop-opacity=".28"/><stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/></radialGradient>
        <linearGradient id="cn-hull" x2="0" y2="1"><stop offset="0" stop-color="#96622f"/><stop offset="1" stop-color="#46280f"/></linearGradient>
        <linearGradient id="cn-house" x2="0" y2="1"><stop offset="0" stop-color="#b07a3e"/><stop offset="1" stop-color="#7c5026"/></linearGradient>
        <linearGradient id="cn-cloud" x2="0" y2="1"><stop offset="0" stop-color="#1f2d38"/><stop offset="1" stop-color="#40525f"/></linearGradient></defs>
      ${faded("cn-fade", `<ellipse cx="320" cy="372" rx="310" ry="300" fill="url(#cn-sun)"/>
      <g class="cn-bow">${bows}</g>
      <path class="cn-peak" d="M-40 378L60 322L120 352L176 312L262 378ZM400 378L470 336L528 358L596 306L680 378Z"/>
      <path class="cn-rain cn-rain-far" d="${rain(70, 60, 16, -3)}"/>
      <g fill="url(#cn-cloud)">${clouds(30, 7, 20)}${clouds(14, 29, 27)}${clouds(-4, 17, 34)}</g>
      ${sea("cn-sea-far", 378, 7, 46, 5)}
      ${ark()}
      ${sea("cn-sea-mid", 398, 13, 84, 41)}${sea("cn-sea-near", 430, 19, 128, 83)}
      <path class="cn-rain cv-rain" d="${rain(46, 66, 26, -5)}"/>
      <g class="cv-dove" transform="translate(508 142)">
        <path d="M-24-2C-12-10 4-10 15-4C18-9 26-9 28-3L36-1L28 1C24 10 8 14-6 9L-30 14Z"/><path d="M-6-6C-16-22-12-38 2-50C8-36 10-20 6-6Z"/><path class="cn-dove-far" d="M2-6C6-20 16-30 30-36C30-22 24-10 12-4Z"/>
        <path class="cn-twig" d="M36-1L52 7M42 2L44-5M47 4L52-1"/><path class="cn-leaf" d="M44-5c1-4 5-6 8-5-1 4-4 6-8 5ZM52-1c2-3 6-4 8-2-2 3-5 4-8 2ZM52 7c3-2 7-1 8 2-3 2-6 1-8-2Z"/></g>`)}`);
  }

  // ── Abraham: stars past counting, and one man outside his tent looking up ──
  function abraham() {
    const random = seeded(77);
    let field = "";
    for (let i = 0; i < 620; i++) {
      // A third of the stars crowd into a band across the sky; the rest are thrown anywhere.
      const inBand = i % 3 === 0, x = random() * 680 - 20, across = (random() + random() - 1) * 62;
      const y = inBand ? 250 - x * 0.42 + across : random() * 380, r = 0.35 + Math.pow(random(), 3) * 1.9;
      field += `<circle class="${i % 11 === 0 ? "cv-twinkle" : ""}" style="animation-delay:-${fixed(random() * 7)}s" cx="${fixed(x)}" cy="${fixed(y)}" r="${fixed(r)}"/>`;
    }
    const bright = [[96, 92, 13], [212, 44, 9], [352, 120, 17], [468, 54, 11], [566, 150, 9], [150, 214, 7], [420, 246, 8], [292, 228, 6], [596, 40, 7]];
    const tent = (x, y, s) => `<path class="an-tent" d="M${x - 66 * s} ${y}L${x - 40 * s} ${y - 44 * s}L${x} ${y - 58 * s}L${x + 40 * s} ${y - 44 * s}L${x + 66 * s} ${y}Z"/><path class="an-rope" d="M${x - 40 * s} ${y - 44 * s}L${x - 84 * s} ${y + 2}M${x + 40 * s} ${y - 44 * s}L${x + 84 * s} ${y + 2}"/>`;
    return svg(`<defs><radialGradient id="an-band"><stop offset="0" stop-color="#9aa2e6" stop-opacity=".3"/><stop offset=".6" stop-color="#9aa2e6" stop-opacity=".1"/><stop offset="1" stop-color="#9aa2e6" stop-opacity="0"/></radialGradient><radialGradient id="an-lamp"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".62"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient></defs>
      ${faded("an-fade", `<ellipse cx="320" cy="120" rx="430" ry="88" fill="url(#an-band)" transform="rotate(-23 320 120)"/>
      <g class="cv-field">${field}</g>
      <g class="an-bright">${bright.map(([x, y, r]) => `<path d="${sparkle(x, y, r)}"/>`).join("")}</g>
      <path class="an-far" d="M-40 392C40 366 120 362 210 378S360 388 450 366S600 362 680 384V480H-40Z"/>
      ${tent(96, 414, 0.6)}${tent(286, 410, 0.46)}
      <path class="an-near" d="M-40 422C60 404 150 408 250 416S380 392 460 374S600 392 680 410V480H-40Z"/>
      <circle cx="176" cy="412" r="62" fill="url(#an-lamp)"/>
      ${tent(176, 436, 1)}<path class="an-door" d="M162 436L176 396L190 436Z"/>
      <g transform="translate(462 376)">
        <path class="an-staff" d="M26 2L31-80"/><path class="an-man" d="M-17 2C-15-18-13-38-10-52C-8-60 5-62 9-54C14-38 17-16 20 2Z"/>
        <path class="an-man" d="M-6-54L-27-84L-21-88L4-58Z"/><circle class="an-man" cx="-25" cy="-88" r="2.800"/>
        <circle class="an-man" cx="-1" cy="-68" r="8"/><path class="an-man" d="M-9-69C-11-82 8-86 11-71L13-54L5-58C7-65 1-73-9-69Z"/></g>`)}`);
  }

  // ── Sinai: the two tablets, numbered I to X, under the mountain and the cloud ──
  function sinai() {
    const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    const carved = numerals.map((numeral, i) => {
      const x = i < 5 ? 224 : 416, y = 192 + (i % 5) * 47;
      return `<text class="cv-cut" x="${x}" y="${y + 1.5}" text-anchor="middle" dominant-baseline="central">${numeral}</text><text class="cv-numeral" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${numeral}</text>`;
    }).join("");
    return svg(`<path class="cv-mountain" d="M0 410 170 170l72 70 84-156 96 138 54-46 164 234Z"/>
      <path class="cv-cloud" d="M196 124c14-26 46-28 62-10 24-24 64-18 76 8 28-10 56 4 58 26H178c-6-12 4-24 18-24Z"/>
      <ellipse class="cv-ground" cx="320" cy="418" rx="345" ry="34"/>
      <path class="cv-tablet" d="M146 420V160a78 78 0 0 1 156 0v260Z"/><path class="cv-tablet" d="M338 420V160a78 78 0 0 1 156 0v260Z"/>${carved}`);
  }

  // ── David: a royal crown of gold, pearl and stones, on a cushion under the moon ──
  function david() {
    const random = seeded(909);
    let stars = "";
    for (let i = 0; i < 70; i++) stars += `<circle cx="${fixed(random() * 640)}" cy="${fixed(random() * 300)}" r="${fixed(0.4 + random() * 0.9)}"/>`;
    // The band's edge is one curve, so stones and beads can sit on it exactly.
    const curve = (a, control, x) => { const t = (x - 128) / 384; return a * (1 - t) ** 2 + 2 * t * (1 - t) * control + a * t ** 2; };
    const tips = [[118, 150], [216, 128], [320, 104], [424, 128], [522, 150]];
    const body = "M128 296Q120 220 118 150Q142 226 172 268Q200 210 216 128Q240 220 268 282Q300 200 320 104Q340 200 372 282Q400 220 424 128Q440 210 468 268Q498 226 522 150Q520 220 512 296Q320 360 128 296Z";
    let beads = "";
    for (let x = 142; x < 500; x += 15) beads += `<circle cx="${x}" cy="${fixed(curve(296, 360, x) + 5)}" r="2.200"/><circle cx="${x}" cy="${fixed(curve(346, 410, x) - 5)}" r="2.200"/>`;
    const stones = [[182, "cd-sapphire", 13], [252, "cd-emerald", 15], [320, "cd-ruby", 20], [388, "cd-emerald", 15], [458, "cd-sapphire", 13]].map(([x, kind, r]) => {
      const y = curve(321, 385, x);
      return `<ellipse class="cd-setting" cx="${x}" cy="${fixed(y)}" rx="${r + 4}" ry="${fixed(r * 0.8 + 4)}"/><ellipse class="${kind}" cx="${x}" cy="${fixed(y)}" rx="${r}" ry="${fixed(r * 0.8)}"/><path class="cd-shine" d="M${x - r * 0.5} ${fixed(y - r * 0.2)}Q${x - r * 0.2} ${fixed(y - r * 0.6)} ${fixed(x + r * 0.2)} ${fixed(y - r * 0.5)}"/>`;
    }).join("");
    const ribs = "M118 160Q136 226 148 272M216 138Q226 220 222 290M320 116V300M424 138Q414 220 418 290M522 160Q504 226 492 272";
    const drops = [[140, 240], [218, 228], [320, 216], [422, 228], [500, 240]].map(([x, y]) => `<path class="cd-ruby cd-drop" d="M${x} ${y - 13}C${x + 8} ${y - 2} ${x + 8} ${y + 7} ${x} ${y + 9}C${x - 8} ${y + 7} ${x - 8} ${y - 2} ${x} ${y - 13}Z"/>`).join("");
    return svg(`<defs>
        <linearGradient id="cd-gold"><stop offset="0" stop-color="#8a6419"/><stop offset=".18" stop-color="#f0cf6e"/><stop offset=".36" stop-color="#b98a2a"/><stop offset=".52" stop-color="#ffefb2"/><stop offset=".7" stop-color="#c2922e"/><stop offset=".86" stop-color="#ecc964"/><stop offset="1" stop-color="#7a5612"/></linearGradient>
        <linearGradient id="cd-velvet" x2="0" y2="1"><stop offset="0" stop-color="#a51d3c"/><stop offset="1" stop-color="#4c0a1c"/></linearGradient>
        <linearGradient id="cd-cushion" x2="0" y2="1"><stop offset="0" stop-color="#31418f"/><stop offset="1" stop-color="#141c4d"/></linearGradient>
        <radialGradient id="cd-pearl" cx=".36" cy=".32"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#ece4d2"/><stop offset="1" stop-color="#a99f8c"/></radialGradient></defs>
      <g class="cd-stars">${stars}</g><g class="cv-moon"><path d="M576 34a42 42 0 1 0 28 72 34 34 0 0 1-28-72Z"/></g>
      <path class="cd-cushion" d="M84 386C180 352 460 352 556 386C590 398 592 436 556 448C460 468 180 468 84 448C48 436 50 398 84 386Z"/>
      <path class="cd-tassel" d="M62 442l-16 16M62 442l-8 20M62 442l-20 8M578 442l16 16M578 442l8 20M578 442l20 8"/><circle class="cd-knot" cx="62" cy="442" r="6"/><circle class="cd-knot" cx="578" cy="442" r="6"/>
      <path class="cd-velvet" d="M150 310C154 190 246 160 320 160S486 190 490 310Z"/><path class="cd-fold" d="M240 180C226 220 220 260 222 306M320 162V312M400 180C414 220 420 260 418 306"/>
      <path class="cd-gold" d="${body}"/><path class="cd-rib" d="${ribs}"/>${drops}
      ${tips.map(([x, y]) => `<circle class="cd-pearl" cx="${x}" cy="${y}" r="${x === 320 ? 15 : 12}"/>`).join("")}
      <path class="cd-band" d="M128 296Q320 360 512 296L510 346Q320 410 130 346Z"/><g class="cd-beads">${beads}</g>${stones}`);
  }

  // ── The new covenant: the cup, and the bread beside it, wafers standing face-on in a stack ──
  function bread() {
    const random = seeded(4242);
    return [4, 3, 2, 1, 0].map((i) => {
      const cx = 462 + i * 21, cy = 358 - i * 1.5, r = 62;
      let holes = "";
      for (const [ring, count] of [[16, 6], [32, 12], [47, 18]]) {
        for (let k = 0; k < count; k++) {
          const a = (k / count) * Math.PI * 2 + i, x = cx + Math.cos(a) * ring, y = cy + Math.sin(a) * ring;
          holes += `<circle cx="${fixed(x)}" cy="${fixed(y)}" r="${fixed(1 + random() * 0.5)}"/>`;
        }
      }
      return `<circle class="cb-edge" cx="${cx + 3}" cy="${fixed(cy)}" r="${r}"/><circle class="cb-wafer" cx="${cx}" cy="${fixed(cy)}" r="${r}"/><circle class="cb-rim" cx="${cx}" cy="${fixed(cy)}" r="${r - 6}"/><g class="cb-holes">${holes}</g>`;
    }).join("");
  }

  function cup() {
    const bowl = "M178 62h284c6 118-44 212-142 224C222 274 172 180 178 62Z";
    return svg(`<defs><clipPath id="cv-bowl"><path d="${bowl}"/></clipPath></defs>
      <ellipse class="cv-land" cx="320" cy="424" rx="320" ry="26"/>
      <g transform="translate(-6 62) scale(.85)"><g clip-path="url(#cv-bowl)"><rect class="cv-wine" x="150" y="96" width="340" height="224"/></g>
        <path class="cv-cup" d="${bowl}"/><path class="cv-cup" d="M320 286v106M250 420c6-20 34-28 70-28s64 8 70 28Z"/></g>
      ${bread()}`);
  }

  // Small versions, for the row of worlds and the maps. They sit around 0,0 in a box about 44 wide.
  const mini = {
    noah: `<path d="M-20 12a20 20 0 0 1 40 0M-13 12a13 13 0 0 1 26 0M-6 12a6 6 0 0 1 12 0"/>`,
    abraham: `<path d="M0-18l4 12 14 4-14 4-4 12-4-12-14-4 14-4Z"/><path d="M15-16v5M12.500-13.500h5M-15 12v4M-17 14h4"/>`,
    sinai: `<path d="M-19 18V-6a9.500 9.500 0 0 1 19 0v24ZM0 18V-6a9.500 9.500 0 0 1 19 0v24Z"/><path d="M-14-3h9M-14 4h9M5-3h9M5 4h9"/>`,
    david: `<path d="M-20 12-20-10-10 2 0-16 10 2 20-10 20 12Z"/><path d="M-20 17h40"/>`,
    new: `<path d="M-15-18h30c1 15-6 24-15 24s-16-9-15-24ZM0 6v11M-10 18h20"/><path d="M-14-8h28"/>`,
    heirs: `<path d="M0 18V-2M0 4c-5-2-10-6-14-13M0 0c4-3 8-7 13-14M0-4c0-5 0-9 1-14"/><circle cx="-14" cy="-10" r="3"/><circle cx="13" cy="-15" r="3"/><circle cx="1" cy="-18" r="3"/>`,
  };
  return { large: { noah: noah(), abraham: abraham(), sinai: sinai(), david: david(), new: cup() }, mini };
})();
