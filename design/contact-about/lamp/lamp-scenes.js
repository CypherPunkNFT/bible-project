// Four biblical night scenes for direction D (owner, 2026-10-20: "bring it to a biblical thing", not Jacksonville).
// Each is a 900 × 520 line drawing that loops slowly (stars, flames, light), styled by lamp.css (.lp-scene).
// psalm: Psalm 119:105 · shiloh: 1 Samuel 3:3–10 · hill: Matthew 5:14–15 · night: John 3:1–2.
(() => {
  const stars = (count, seedStart, maxY) => {
    let seed = seedStart;
    const random = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: count }, (_, i) => `<circle class="lp-star${i % 4 === 0 ? " lp-twinkle" : ""}" style="--i:${i % 9}" cx="${(random() * 900).toFixed(1)}" cy="${(random() * maxY).toFixed(1)}" r="${random() < .15 ? 1.6 : .9}"/>`).join("");
  };
  const moon = (x, y, r = 26) => `<path class="lp-moon" d="M${x} ${y - r}a${r} ${r} 0 1 0 ${r * .75} ${r * 1.7}a${r * .8} ${r * .8} 0 1 1 ${-r * .75} ${-r * 1.7}Z"/>`;
  const flame = (x, y, size = 1) => `<path class="lp-flame" style="transform-origin:${x}px ${y}px" d="M${x} ${y}C${x - 6 * size} ${y - 8 * size} ${x - 2 * size} ${y - 17 * size} ${x} ${y - 24 * size}C${x + 2 * size} ${y - 17 * size} ${x + 6 * size} ${y - 8 * size} ${x} ${y}Z"/>`;
  const glow = (id, x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id})" stroke="none" class="lp-breathe"/>`;
  const callout = (x, y, toX, toY, label, anchor = "middle") => `<g class="lp-callouts"><path d="M${toX} ${toY}L${x} ${y + 5}"/><circle cx="${toX}" cy="${toY}" r="2"/><text x="${x}" y="${y}" text-anchor="${anchor}">${label}</text></g>`;
  // A clay oil lamp of the Herodian kind: a round body, a long nozzle to the right with the flame, a small handle.
  const oilLamp = (x, y) => `<path class="lp-paper" d="M${x - 40} ${y}Q${x - 40} ${y + 18} ${x} ${y + 18}Q${x + 40} ${y + 16} ${x + 58} ${y + 4}Q${x + 65} ${y} ${x + 58} ${y - 4}Q${x + 40} ${y - 14} ${x} ${y - 16}Q${x - 40} ${y - 16} ${x - 40} ${y}Z"/>
    <ellipse class="lp-faint" cx="${x - 4}" cy="${y - 8}" rx="9" ry="3"/><path d="M${x - 40} ${y - 4}q-16 -4 -14 8q2 8 14 4"/><path class="lp-faint" d="M${x - 28} ${y + 6}Q${x} ${y + 12} ${x + 30} ${y + 4}"/>
    ${flame(x + 61, y - 4, 1.1)}`;
  const defs = (id, opacity = .45) => `<defs><radialGradient id="${id}"><stop offset="0" stop-color="var(--accent)" stop-opacity="${opacity}"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></radialGradient></defs>`;
  const open = '<svg viewBox="0 0 900 520" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';

  // Psalm 119:105. Dark hills, a path winding away, and the oil lamp lighting only the first steps of it.
  function psalm() {
    const steps = [[452, 486, 1], [470, 452, .85], [492, 424, .7], [508, 398, .55], [514, 374, .4], [510, 352, .28], [500, 334, .18], [494, 318, .1]]
      .map(([x, y, o], i) => `<path class="lp-step" style="opacity:${o}" d="M${x - 16 + i * 1.6} ${y}h${32 - i * 3.2}"/>`).join("");
    return `${open}${defs("lp-g-psalm")}${stars(80, 11, 250)}${moon(770, 70)}
      <path class="lp-faint" d="M0 300Q120 260 240 290T480 270T720 296T900 276"/>
      <path class="lp-hill" d="M0 340Q160 300 300 330T600 318T900 336V520H0Z"/><path class="lp-ridge" d="M0 340Q160 300 300 330T600 318T900 336"/>
      <path class="lp-hill lp-hill-near" d="M0 410Q180 380 360 404T700 396T900 412V520H0Z"/><path class="lp-ridge" d="M0 410Q180 380 360 404T700 396T900 412"/>
      <path class="lp-faint" d="M470 520Q420 470 480 430T530 370Q536 340 500 316M560 520Q500 470 540 430T556 370Q556 340 506 316"/>
      ${steps}
      ${glow("lp-g-psalm", 360, 470, 150)}
      <g transform="translate(330 470) scale(1.7) translate(-330 -470)">${oilLamp(330, 470)}</g>
      ${callout(220, 380, 290, 452, "THY WORD")}
      ${callout(600, 470, 470, 452, "A LAMP UNTO MY FEET", "start")}
      ${callout(640, 330, 508, 336, "A LIGHT UNTO MY PATH", "start")}</svg>`;
  }

  // 1 Samuel 3. The tabernacle at Shiloh, its door open on the lampstand still burning; the boy Samuel laid down beside.
  function shiloh() {
    const mx = 450, top = 330;
    const arms = [1, 2, 3].map((k) => `<path d="M${mx - k * 16} ${top}Q${mx - k * 16} ${top + k * 15} ${mx} ${top + k * 15}Q${mx + k * 16} ${top + k * 15} ${mx + k * 16} ${top}"/>`).join("");
    const flames = [-3, -2, -1, 0, 1, 2, 3].map((j) => flame(mx + j * 16, top - 1, .6)).join("");
    const posts = Array.from({ length: 19 }, (_, k) => `<path class="lp-faint" d="M${60 + k * 43} 470V430"/>`).join("");
    return `${open}${defs("lp-g-shiloh", .5)}${stars(80, 23, 220)}${moon(130, 70, 22)}
      <path class="lp-faint" d="M0 280Q200 240 420 270T900 250"/>
      <path class="lp-paper" d="M230 450V300L300 250H600L670 300V450Z"/>
      <path d="M230 300H670M300 250V300M600 250V300"/>
      <path class="lp-faint" d="M260 310V450M290 310V450M610 310V450M640 310V450"/>
      <path class="lp-door" d="M380 450V306H520V450Z"/>
      ${glow("lp-g-shiloh", mx, 360, 120)}
      <g class="lp-menorah">${arms}<path d="M${mx} ${top}V${top + 80}M${mx - 16} ${top + 92}L${mx} ${top + 80}L${mx + 16} ${top + 92}"/>${flames}</g>
      <path class="lp-paper" d="M540 450H660V440Q650 424 596 426H540Z"/><circle class="lp-paper" cx="556" cy="422" r="10"/><path class="lp-faint" d="M532 452H668"/>
      <path d="M40 430H860"/>${posts}<path d="M40 470H860"/>
      ${callout(450, 220, 450, 300, "THE LAMP OF GOD")}
      ${callout(720, 400, 640, 430, "SAMUEL WAS LAID DOWN", "start")}
      ${callout(150, 360, 230, 330, "SHILOH", "end")}</svg>`;
  }

  // Matthew 5:14–15. A walled city lit on its hill; in front, a lamp set on its stand and the bushel basket left empty.
  function hill() {
    const houses = [[330, 40, 34], [372, 30, 52], [404, 44, 70], [450, 36, 90], [488, 40, 62], [530, 34, 44], [566, 30, 30]];
    const city = houses.map(([x, w, h], i) => `<path class="lp-paper" d="M${x} 240V${240 - h}H${x + w}V240"/>
      <rect class="lp-lit" x="${x + w / 2 - 3}" y="${240 - h + 10}" width="6" height="7"/>${h > 50 ? `<rect class="lp-lit" style="--i:${i}" x="${x + w / 2 - 3}" y="${240 - h + 30}" width="6" height="7"/>` : ""}`).join("");
    const wall = Array.from({ length: 14 }, (_, k) => `h12v-6h12v6`).join("");
    return `${open}${defs("lp-g-hill", .4)}${stars(70, 37, 170)}
      ${glow("lp-g-hill", 450, 210, 190)}
      <path class="lp-hill" d="M0 470Q150 460 260 330Q340 238 450 238Q560 238 640 330Q750 460 900 470V520H0Z"/><path class="lp-ridge" d="M0 470Q150 460 260 330Q340 238 450 238Q560 238 640 330Q750 460 900 470"/>
      ${city}
      <path class="lp-paper" d="M300 252V240${wall}V252Z"/>
      <path class="lp-faint" d="M450 470Q420 420 470 380T430 300Q440 270 450 252"/>
      <path d="M0 470H900"/>
      <g class="lp-stand"><path d="M760 470V350M738 470H782M742 350H778"/>${flame(760, 346, 1)}</g>
      ${glow("lp-g-hill", 760, 330, 70)}
      <path class="lp-paper" d="M640 470L652 420H708L720 470Z"/><path class="lp-faint" d="M648 436H712M645 452H716"/>
      ${callout(450, 120, 450, 160, "A CITY SET ON AN HILL")}
      ${callout(600, 390, 660, 420, "NOT UNDER A BUSHEL", "end")}
      ${callout(840, 300, 772, 352, "ON A CANDLESTICK", "end")}</svg>`;
  }

  // John 3:1–2. A Jerusalem rooftop at night: the teacher and Nicodemus seated with a lamp between them; the Temple beyond.
  function night() {
    const figure = (x, facing) => `<g class="lp-figure"><circle class="lp-paper" cx="${x}" cy="374" r="11"/>
      <path class="lp-paper" d="M${x - 22} 440Q${x - 20} 394 ${x} 388Q${x + 20} 394 ${x + 22} 440Z"/><path class="lp-faint" d="M${x} 392V440"/>
      <path d="M${x + facing * 6} 404Q${x + facing * 22} 414 ${x + facing * 30} 424"/></g>`;
    const roofs = [[40, 120, 330], [160, 90, 312], [250, 110, 336], [700, 120, 320], [820, 80, 340]].map(([x, w, y]) => `<path class="lp-paper" d="M${x} 352V${y}H${x + w}V352"/>`).join("");
    const columns = Array.from({ length: 8 }, (_, k) => `<path class="lp-faint" d="M${532 + k * 18} 300V250"/>`).join("");
    return `${open}${defs("lp-g-night", .5)}${stars(80, 51, 230)}${moon(140, 76)}
      <path class="lp-faint" d="M0 290Q180 256 360 276T700 262T900 280"/>
      <path class="lp-paper" d="M500 300V230H700V300Z"/><path d="M490 230H710L690 210H510Z"/>${columns}<path class="lp-paper" d="M560 210V180H640V210Z"/>
      ${roofs}
      <path d="M0 352H900"/>
      <path class="lp-paper" d="M60 440H840V452H60Z"/><path class="lp-faint" d="M60 470H840M70 452L40 520M830 452L860 520"/>
      ${glow("lp-g-night", 450, 420, 130)}
      ${figure(390, 1)}${figure(510, -1)}
      <g transform="translate(436 430) scale(.45)">${oilLamp(0, 0)}</g>
      ${callout(450, 320, 450, 396, "BY NIGHT")}
      ${callout(260, 390, 372, 400, "RABBI", "end")}
      ${callout(640, 390, 528, 400, "NICODEMUS", "start")}
      ${callout(600, 160, 600, 182, "THE TEMPLE")}</svg>`;
  }

  window.LAMP_SCENES = {
    psalm: { draw: psalm, numeral: "I", title: "A lamp unto my feet", h1: "A light for the path.<em>Write, and walk it with us.</em>",
      lead: "Questions, corrections, or a word of encouragement. Ask what you are reading, and we will look at it with you.",
      verse: "Thy word is a lamp unto my feet, and a light unto my path.", ref: "Psalm 119:105",
      line: "A clay oil lamp lights only the first steps of a path through dark hills; the light fades as the path goes on." },
    shiloh: { draw: shiloh, numeral: "II", title: "The lamp of God", h1: "Speak;<em>for thy servant heareth.</em>",
      lead: "Questions, corrections, or a word of encouragement. Every message is heard, and every one is read.",
      verse: "And ere the lamp of God went out in the temple of the LORD … Samuel was laid down to sleep.", ref: "1 Samuel 3:3",
      line: "The tabernacle at Shiloh at night, its door open on the lampstand still burning, and the boy Samuel laid down beside it." },
    hill: { draw: hill, numeral: "III", title: "A city set on a hill", h1: "Not under a bushel.<em>Open to everyone.</em>",
      lead: "Free, and fully open to the public. Questions, corrections, or a word of encouragement: every message is read.",
      verse: "A city that is set on an hill cannot be hid. Neither do men light a candle, and put it under a bushel, but on a candlestick.", ref: "Matthew 5:14–15",
      line: "A walled city lit on its hill, and in front of it a lamp set on its stand beside the empty bushel basket." },
    night: { draw: night, numeral: "IV", title: "He came by night", h1: "Come by night.<em>Bring your questions.</em>",
      lead: "No question is too small or too hard. Write, and the one person who builds this will read it.",
      verse: "The same came to Jesus by night, and said unto him, Rabbi, we know that thou art a teacher come from God.", ref: "John 3:2",
      line: "A Jerusalem rooftop at night: the teacher and Nicodemus seated with a lamp between them, the Temple beyond." },
  };
})();
