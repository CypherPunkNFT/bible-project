// The six signs. Each large drawing is the control for its covenant: every part marked data-q answers one of the five
// questions. Fixed strings written here, never built from data. Illustrative only.
window.CovSigns = (() => {
  const LABEL = { speaks: "Who speaks", whom: "To whom", promised: "What is promised", asked: "What is asked", sign: "What sign" };
  const svg = (body) => `<svg viewBox="0 0 640 460" aria-hidden="true">${body}</svg>`;
  // A small repeatable random, so the sky is the same on every load.
  const seeded = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  function noah() {
    const bands = [["speaks", 276, "#c75f47"], ["whom", 236, "#d99a3a"], ["promised", 196, "#86a356"], ["asked", 156, "#4b8ca6"], ["sign", 116, "#7767a8"]];
    const random = seeded(31);
    const rain = Array.from({ length: 46 }, () => { const x = random() * 640, y = random() * 240; return `<path d="M${x.toFixed(0)} ${y.toFixed(0)}l-5 22"/>`; }).join("");
    return svg(`<g class="cv-rain">${rain}</g>
      ${bands.map(([q, r, colour], i) => `<g class="cv-hot cv-band" data-q="${q}">
        <path id="cv-bow-${q}" d="M${320 - r} 404A${r} ${r} 0 0 1 ${320 + r} 404" fill="none" stroke="${colour}" stroke-width="35"/>
        <text class="cv-bow-text" dominant-baseline="central"><textPath href="#cv-bow-${q}" startOffset="${50 - i * 0.2}%" text-anchor="middle">${LABEL[q]}</textPath></text></g>`).join("")}
      <ellipse class="cv-land" cx="320" cy="420" rx="345" ry="38"/>
      <path class="cv-ink-line" d="M272 402h96l-14 18h-68ZM294 402v-14h52v14M320 388v-12"/>
      <path class="cv-ink-line" d="M120 416c3-6 9-6 12 0M150 424c3-6 9-6 12 0M470 418c3-6 9-6 12 0M506 426c3-6 9-6 12 0"/>
      <path class="cv-dove" d="M452 96c12-10 22-10 30-2 8-8 18-8 30 2-12-3-22-1-30 8-8-9-18-11-30-8Z"/>`);
  }

  function abraham() {
    const random = seeded(77);
    const field = Array.from({ length: 300 }, (_, i) => {
      const x = random() * 640, y = random() * 362, r = 0.5 + random() * 1.3;
      return `<circle class="${i % 9 === 0 ? "cv-twinkle" : ""}" style="animation-delay:-${(random() * 7).toFixed(1)}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}"/>`;
    }).join("");
    const points = [["speaks", 108, 118], ["whom", 244, 58], ["promised", 384, 128], ["asked", 520, 66], ["sign", 476, 244]];
    const star = (x, y) => `M${x} ${y - 15}L${x + 4} ${y - 4}L${x + 15} ${y}L${x + 4} ${y + 4}L${x} ${y + 15}L${x - 4} ${y + 4}L${x - 15} ${y}L${x - 4} ${y - 4}Z`;
    return svg(`<g class="cv-field">${field}</g>
      <path class="cv-figure-line" d="${points.map(([, x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join("")}"/>
      ${points.map(([q, x, y]) => `<g class="cv-hot cv-star" data-q="${q}"><circle cx="${x}" cy="${y}" r="38" fill="transparent"/>
        <circle class="cv-star-halo" cx="${x}" cy="${y}" r="24"/><path d="${star(x, y)}"/><text x="${x}" y="${y + 36}" text-anchor="middle">${LABEL[q]}</text></g>`).join("")}
      <ellipse class="cv-land" cx="320" cy="416" rx="340" ry="52"/>
      <g class="cv-pieces"><path d="M92 392c12-11 42-11 54 0-12 9-42 9-54 0ZM232 386c12-11 42-11 54 0-12 9-42 9-54 0ZM368 392c12-11 42-11 54 0-12 9-42 9-54 0ZM498 386c12-11 42-11 54 0-12 9-42 9-54 0Z"/>
        <path d="M112 444c12-11 42-11 54 0-12 9-42 9-54 0ZM256 448c12-11 42-11 54 0-12 9-42 9-54 0ZM394 444c12-11 42-11 54 0-12 9-42 9-54 0ZM520 448c12-11 42-11 54 0-12 9-42 9-54 0Z"/></g>
      <g class="cv-fire"><path d="M0 -20c9 11 12 17 12 23a12 12 0 0 1-24 0c0-6 3-12 12-23Z" transform="translate(60 418)"/></g>`);
  }

  function sinai() {
    const row = (q, x, y) => `<g class="cv-hot cv-carve" data-q="${q}"><rect x="${x}" y="${y}" width="146" height="52" rx="3" fill="transparent"/>
      <text x="${x + 73}" y="${y + 26}" text-anchor="middle" dominant-baseline="central">${LABEL[q]}</text>
      <path d="M${x + 14} ${y + 47}h118"/></g>`;
    return svg(`<path class="cv-mountain" d="M0 410 170 170l72 70 84-156 96 138 54-46 164 234Z"/>
      <path class="cv-cloud" d="M196 124c14-26 46-28 62-10 24-24 64-18 76 8 28-10 56 4 58 26H178c-6-12 4-24 18-24Z"/>
      <ellipse class="cv-ground" cx="320" cy="418" rx="345" ry="34"/>
      <path class="cv-tablet" d="M146 420V160a78 78 0 0 1 156 0v260Z"/><path class="cv-tablet" d="M338 420V160a78 78 0 0 1 156 0v260Z"/>
      ${row("speaks", 151, 180)}${row("whom", 151, 244)}${row("promised", 151, 308)}${row("asked", 343, 180)}${row("sign", 343, 244)}`);
  }

  function david() {
    const tips = [["speaks", 148, 176], ["whom", 234, 132], ["promised", 320, 100], ["asked", 406, 132], ["sign", 492, 176]];
    const edge = tips.map(([, x, y], i) => `${i ? "" : "M116 322L"}${x} ${y}L${i < 4 ? `${x + 43} 256` : "524 322"}`).join("L");
    return svg(`<g class="cv-moon"><path d="M576 34a42 42 0 1 0 28 72 34 34 0 0 1-28-72Z"/></g>
      <path class="cv-crown" d="${edge}Z"/><path class="cv-crown-band" d="M116 322h408v44H116Z"/>
      <path class="cv-crown-line" d="M136 344h368"/>
      ${tips.map(([q, x, y]) => `<g class="cv-hot cv-jewel${q === "sign" ? " is-hollow" : ""}" data-q="${q}"><circle cx="${x}" cy="${y}" r="38" fill="transparent"/>
        <circle class="cv-gem" cx="${x}" cy="${y}" r="14"/><text x="${x}" y="${y - 26}" text-anchor="middle">${LABEL[q]}</text></g>`).join("")}
      <path class="cv-house" d="M254 392h132v48H254ZM240 396l80-28 80 28M304 440v-26h32v26"/>`);
  }

  function cup() {
    const levels = ["speaks", "whom", "promised", "asked", "sign"];
    const bowl = "M178 62h284c6 118-44 212-142 224C222 274 172 180 178 62Z";
    const y = (i) => 258 - i * 42;
    return svg(`<defs><clipPath id="cv-bowl"><path d="${bowl}"/></clipPath></defs>
      <g clip-path="url(#cv-bowl)"><rect class="cv-wine" x="150" y="0" width="340" height="320"/></g>
      <path class="cv-cup" d="${bowl}"/><path class="cv-cup" d="M320 286v106M250 420c6-20 34-28 70-28s64 8 70 28Z"/>
      ${levels.map((q, i) => `<g class="cv-hot cv-level" data-q="${q}"><rect x="160" y="${y(i) - 21}" width="470" height="42" fill="transparent"/>
        <path d="M${[272, 228, 203, 188, 180][i]} ${y(i)}H${[368, 412, 437, 452, 460][i]}"/><path class="cv-tick" d="M${[368, 412, 437, 452, 460][i]} ${y(i)}H486"/>
        <text x="496" y="${y(i)}" dominant-baseline="central">${LABEL[q]}</text></g>`).join("")}`);
  }

  function olive() {
    const tips = [["speaks", 96, 196, "M318 300C258 276 168 262 96 196"], ["whom", 196, 92, "M320 258C290 210 250 158 196 92"], ["promised", 342, 56, "M324 240C330 180 340 120 342 56"], ["asked", 470, 96, "M330 262C378 214 428 164 470 96"], ["sign", 562, 208, "M336 300C400 280 490 264 562 208"]];
    const random = seeded(19);
    const leaves = (x, y) => Array.from({ length: 13 }, () => {
      const dx = (random() - 0.5) * 96, dy = (random() - 0.5) * 66, turn = random() * 180;
      return `<ellipse cx="${(x + dx).toFixed(0)}" cy="${(y + dy).toFixed(0)}" rx="14" ry="5" transform="rotate(${turn.toFixed(0)} ${(x + dx).toFixed(0)} ${(y + dy).toFixed(0)})"/>`;
    }).join("");
    return svg(`<ellipse class="cv-ground" cx="320" cy="438" rx="320" ry="26"/>
      <path class="cv-trunk" d="M284 428c20-48 18-104 16-164-2-26 44-26 42 0-2 60-4 116 18 164Z"/>
      <path class="cv-root" d="M284 428c-22 2-50 8-74 20M360 428c24 2 54 10 76 20M320 432v22"/>
      ${tips.map(([q, x, y, d]) => `<g class="cv-hot cv-branch${q === "whom" ? " is-grafted" : ""}" data-q="${q}"><path class="cv-limb" d="${d}"/>
        <g class="cv-leaves">${leaves(x, y)}</g><circle cx="${x}" cy="${y}" r="44" fill="transparent"/>
        <circle class="cv-olive" cx="${x}" cy="${y}" r="8"/><text x="${x}" y="${y - 44}" text-anchor="middle">${LABEL[q]}</text></g>`).join("")}
      <path class="cv-bind" d="M288 216l14-10M294 224l14-10M300 232l14-10"/>`);
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
  return { large: { noah: noah(), abraham: abraham(), sinai: sinai(), david: david(), new: cup(), heirs: olive() }, mini, LABEL };
})();
