// Line drawings for the Letters cards, in the Topics/Atlas card style: 480×185, drawn in currentColor (the card's tone),
// faint construction lines at low opacity, one confident main shape, a few bright dots.
const S = "var(--surface)";
const dots = (pts, r = 2) => pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? r * .75 : r}" fill="currentColor" opacity=".5"/>`).join("");
const ray = (cx, cy, r1, r2, deg) => { const a = (deg * Math.PI) / 180; return `M${(cx + r1 * Math.cos(a)).toFixed(1)} ${(cy + r1 * Math.sin(a)).toFixed(1)}L${(cx + r2 * Math.cos(a)).toFixed(1)} ${(cy + r2 * Math.sin(a)).toFixed(1)}`; };
const range = (n) => Array.from({ length: n }, (_, i) => i);

window.ART = {
  // Paul's letters: a journey across the sea, city to city, ending in a sealed letter.
  paul: `
    <g stroke="currentColor" opacity=".14"><path d="M20 128Q90 104 150 132T290 120T460 136"/><path d="M30 150Q120 132 200 156T380 146T470 158"/></g>
    <path d="M62 120C110 60 150 56 196 92S268 140 310 86S380 40 420 70" stroke="currentColor" stroke-dasharray="4 5" opacity=".7"/>
    ${[[62, 120], [196, 92], [310, 86]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${S}" stroke="currentColor" stroke-opacity=".5"/><circle cx="${x}" cy="${y}" r="3.6" fill="currentColor"/>`).join("")}
    <g transform="translate(404 52)"><rect width="40" height="28" rx="3" fill="${S}" stroke="currentColor"/><path d="M0 2L20 16 40 2" stroke="currentColor" stroke-opacity=".6"/><circle cx="20" cy="20" r="5" fill="currentColor" fill-opacity=".85"/></g>
    ${dots([[110, 40], [250, 30], [150, 160], [360, 160]])}`,
  // Hebrews: the veil of the tabernacle drawn back, light coming through.
  hebrews: `
    <path d="M40 166H440" stroke="currentColor" opacity=".22"/>
    <g stroke="currentColor" opacity=".45">${range(14).map((i) => `<path d="${ray(240, 112, 34, i % 2 ? 62 : 80, 180 + i * 13.8)}"/>`).join("")}</g>
    <path d="M150 166V34H330V166" stroke="currentColor" stroke-opacity=".6"/>
    <path d="M150 34Q178 90 168 166M150 34Q196 80 196 166" fill="currentColor" fill-opacity=".08" stroke="currentColor"/>
    <path d="M330 34Q302 90 312 166M330 34Q284 80 284 166" fill="currentColor" fill-opacity=".08" stroke="currentColor"/>
    <rect x="222" y="122" width="36" height="26" rx="2" fill="${S}" stroke="currentColor"/><path d="M226 122V114H254V122" stroke="currentColor" stroke-opacity=".6"/>
    <path d="M140 28H340" stroke="currentColor" stroke-width="3"/>${dots([[80, 60], [400, 56], [96, 130], [384, 128]])}`,
  // James, Peter & Jude: believers scattered abroad, one word reaching each.
  general: `
    <g stroke="currentColor" opacity=".13"><ellipse cx="240" cy="96" rx="200" ry="68"/><ellipse cx="240" cy="96" rx="130" ry="44"/></g>
    <g stroke="currentColor" stroke-dasharray="3 5" opacity=".5">${[[70, 64], [118, 140], [176, 44], [306, 40], [368, 142], [416, 76], [240, 162]].map(([x, y]) => `<path d="M240 96L${x} ${y}"/>`).join("")}</g>
    ${[[70, 64], [118, 140], [176, 44], [306, 40], [368, 142], [416, 76], [240, 162]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${S}" stroke="currentColor"/>`).join("")}
    <circle cx="240" cy="96" r="22" fill="${S}" stroke="currentColor"/><path d="M228 90H252M228 97H252M228 104H244" stroke="currentColor" stroke-opacity=".7"/>`,
  // The letters of John: a lamp, and the light around it in three rings.
  john: `
    <g stroke="currentColor">${[34, 56, 80].map((r, i) => `<circle cx="240" cy="96" r="${r}" opacity="${.5 - i * .14}" ${i ? 'stroke-dasharray="2 5"' : ""}/>`).join("")}</g>
    <g stroke="currentColor" opacity=".35">${range(16).map((i) => `<path d="${ray(240, 96, 88, i % 2 ? 98 : 108, i * 22.5)}"/>`).join("")}</g>
    <path d="M214 112Q240 126 266 112L258 104H222Z" fill="${S}" stroke="currentColor"/><path d="M266 112Q280 108 284 98" stroke="currentColor"/>
    <path d="M240 102Q232 90 240 76Q248 90 240 102Z" fill="currentColor" fill-opacity=".85"/>
    <path d="M60 160H420" stroke="currentColor" opacity=".18"/>${dots([[70, 40], [410, 44], [92, 150], [392, 150]])}`,

  // When they were written: overlapping date ranges on a year line.
  when: `
    <path d="M30 150H450" stroke="currentColor" opacity=".35"/>
    <g stroke="currentColor" opacity=".25">${range(8).map((i) => `<path d="M${50 + i * 56} 150V158"/>`).join("")}</g>
    ${[[60, 40, 130, 1], [110, 62, 120, .45], [150, 84, 170, 1], [210, 106, 110, .45], [250, 40, 150, .45], [300, 84, 120, 1], [330, 128, 100, .45]].map(([x, y, w, o]) =>
      `<rect x="${x}" y="${y}" width="${w}" height="13" rx="6.5" fill="currentColor" fill-opacity="${o * .3}" stroke="currentColor" stroke-opacity="${o}"/>`).join("")}
    ${dots([[40, 30], [440, 34]])}`,
  // Where they went: a coastline, and dashed lines from the writer to the churches.
  where: `
    <path d="M24 118Q70 80 120 96T200 78Q236 70 262 98T330 92Q380 70 456 96" fill="currentColor" fill-opacity=".06" stroke="currentColor" stroke-opacity=".4"/>
    <path d="M40 150Q140 136 240 152T450 146" stroke="currentColor" opacity=".16"/>
    <g stroke="currentColor" stroke-dasharray="3 5" opacity=".6"><path d="M96 132Q170 60 230 60"/><path d="M96 132Q220 100 300 110"/><path d="M96 132Q260 30 392 64"/></g>
    ${[[230, 60], [300, 110], [392, 64], [344, 40], [178, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${S}" stroke="currentColor" stroke-opacity=".55"/><circle cx="${x}" cy="${y}" r="3" fill="currentColor"/>`).join("")}
    <circle cx="96" cy="132" r="10" fill="currentColor" fill-opacity=".2" stroke="currentColor"/>`,
  // How a letter was built: one sheet, its parts bracketed — greeting, thanks, body, farewell.
  form: `
    <rect x="170" y="18" width="140" height="152" rx="4" fill="currentColor" fill-opacity=".05" stroke="currentColor" stroke-opacity=".6"/>
    <path d="M186 36H260" stroke="currentColor" stroke-width="2.4"/>
    <g stroke="currentColor" opacity=".55">${[52, 60].map((y) => `<path d="M186 ${y}H${y === 60 ? 270 : 294}"/>`).join("")}${range(6).map((i) => `<path d="M186 ${80 + i * 9}H${i % 3 === 2 ? 252 : 294}"/>`).join("")}</g>
    <path d="M186 146H230M240 156Q252 142 262 154T290 150" stroke="currentColor"/>
    <g stroke="currentColor" opacity=".45"><path d="M160 30H150V40M160 46H150V64H160M160 76H150V130H160M160 140H150V162H160"/></g>
    <g class="art-word" style="font-size:13px">${[["Greeting", 35], ["Thanks", 57], ["Body", 106], ["Farewell", 154]].map(([t, y]) => `<text x="140" y="${y + 4}" text-anchor="end">${t}</text>`).join("")}</g>`,
  // The hands that wrote and carried them: a quill on a line, a seal, a traveller's road.
  hands: `
    <path d="M70 120Q130 112 190 120" stroke="currentColor" stroke-opacity=".5"/>
    <path d="M150 116L236 30Q250 22 252 36L166 122Z" fill="currentColor" fill-opacity=".1" stroke="currentColor"/><path d="M182 84L214 52" stroke="currentColor" stroke-opacity=".5"/>
    <circle cx="300" cy="104" r="20" fill="currentColor" fill-opacity=".2" stroke="currentColor"/><path d="M290 104H310M300 94V114" stroke="currentColor" stroke-opacity=".7"/>
    <path d="M240 160Q330 140 450 156" stroke="currentColor" stroke-dasharray="3 6" opacity=".6"/>
    ${range(5).map((i) => `<ellipse cx="${270 + i * 34}" cy="${152 - (i % 2) * 6}" rx="3.2" ry="5" fill="currentColor" opacity=".45"/>`).join("")}
    ${dots([[60, 40], [420, 40], [400, 92]])}`,

  // The Old Testament behind them: books on the left, bands flowing into the letters.
  ot: `
    ${[[34, 40], [80, 32], [118, 22], [146, 16], [168, 12]].map(([y, h]) => `<rect x="70" y="${y}" width="8" height="${h - 4}" rx="2" fill="currentColor"/>`).join("")}
    ${[[30, 56], [96, 34], [140, 40]].map(([y, h]) => `<rect x="402" y="${y}" width="8" height="${h}" rx="2" fill="currentColor" fill-opacity=".8"/>`).join("")}
    <g fill="currentColor">${[[34, 16, 30, 0.3], [50, 18, 96, 0.22], [80, 14, 50, 0.3], [94, 12, 140, 0.22], [118, 10, 112, 0.28], [146, 8, 64, 0.22], [168, 6, 160, 0.2]].map(([y0, h, y1, o]) =>
      `<path d="M78 ${y0}C240 ${y0} 240 ${y1} 402 ${y1}V${y1 + h}C240 ${y1 + h} 240 ${y0 + h} 78 ${y0 + h}Z" opacity="${o}"/>`).join("")}</g>
    ${dots([[30, 28], [450, 26], [450, 172]])}`,
  // The words they lean on: a constellation, rows of stars by size.
  words: `
    <g stroke="currentColor" stroke-dasharray="1 6" opacity=".4">${[44, 92, 140].map((y) => `<path d="M40 ${y}H440"/>`).join("")}</g>
    ${[[96, 44, 12], [196, 44, 6], [300, 44, 9], [396, 44, 4], [96, 92, 5], [196, 92, 14], [300, 92, 7], [396, 92, 10], [96, 140, 8], [196, 140, 4], [300, 140, 13], [396, 140, 6]].map(([x, y, r]) =>
      `<circle cx="${x}" cy="${y}" r="${r + 5}" fill="currentColor" opacity=".12"/><circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" opacity=".8"/>`).join("")}
    <path d="M196 92L300 140L396 92" stroke="currentColor" stroke-opacity=".35"/>`,
  // The themes they share: threads braided across the groups.
  themes: `
    <g stroke="currentColor" fill="none">
      <path d="M30 60C120 60 140 130 240 130S360 60 450 60" stroke-width="1.6"/>
      <path d="M30 130C120 130 140 60 240 60S360 130 450 130" stroke-opacity=".6" stroke-width="1.6"/>
      <path d="M30 96C110 70 180 122 240 96S370 70 450 96" stroke-opacity=".35"/></g>
    ${[[160, 96], [320, 96], [240, 96]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${S}" stroke="currentColor"/><circle cx="${x}" cy="${y}" r="2.6" fill="currentColor"/>`).join("")}
    ${dots([[40, 30], [440, 160], [440, 30], [40, 160]])}`,
  // The people who cross the groups: names linked to the letters that mention them.
  people: `
    ${[30, 62, 94, 126, 158].map((y) => `<circle cx="120" cy="${y}" r="6" fill="currentColor" fill-opacity=".85"/>`).join("")}
    ${[46, 96, 146].map((y) => `<circle cx="360" cy="${y}" r="9" fill="${S}" stroke="currentColor"/>`).join("")}
    <g stroke="currentColor" opacity=".45">${[[30, 46], [30, 96], [62, 46], [94, 96], [94, 146], [126, 146], [158, 96], [158, 146], [62, 146]].map(([a, b]) => `<path d="M126 ${a}L351 ${b}"/>`).join("")}</g>
    ${dots([[60, 96], [420, 96]])}`,

  // Compare any two letters: two rails joined by ribbons.
  compare: `
    <rect x="40" y="36" width="400" height="5" rx="2.5" fill="currentColor" opacity=".3"/><rect x="40" y="146" width="400" height="5" rx="2.5" fill="currentColor" opacity=".3"/>
    <g fill="currentColor">${[[70, 18, 180, 14, .3], [150, 12, 96, 16, .22], [230, 20, 300, 12, .35], [330, 14, 380, 18, .22], [390, 10, 220, 12, .18]].map(([a, w, b, v, o]) =>
      `<path d="M${a} 41C${a} 94 ${b} 94 ${b} 146H${b + v}C${b + v} 94 ${a + w} 94 ${a + w} 41Z" opacity="${o}"/><rect x="${a}" y="36" width="${w}" height="5" rx="2"/><rect x="${b}" y="146" width="${v}" height="5" rx="2"/>`).join("")}</g>`,
  // All twenty-one side by side: bars as long as each letter, cut into sections.
  shape: `
    ${[[24, 380], [46, 300], [68, 220], [90, 150], [112, 260], [134, 90], [156, 40]].map(([y, w], i) =>
      `<rect x="60" y="${y}" width="${w}" height="12" rx="4" fill="currentColor" fill-opacity="${i === 1 ? .75 : .3}"/>${range(Math.floor(w / 60)).map((j) => `<path d="M${60 + (j + 1) * 60 - (j % 2) * 18} ${y}V${y + 12}" stroke="${S}" stroke-width="2"/>`).join("")}`).join("")}`,
  // Where readers have differed: one road dividing, each way marked by those who took it.
  questions: `
    <path d="M40 120H190" stroke="currentColor" stroke-width="2"/>
    <path d="M190 120C250 120 260 54 330 54H440M190 120H440M190 120C250 120 260 170 330 170H440" stroke="currentColor" stroke-opacity=".55"/>
    <circle cx="190" cy="120" r="9" fill="${S}" stroke="currentColor"/>
    ${[[350, 54], [392, 54], [370, 120], [410, 120], [356, 170]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="currentColor" opacity=".8"/>`).join("")}
    <g class="art-word" style="font-size:20px"><text x="104" y="92" text-anchor="middle">?</text></g>`,
  // How they were gathered and accepted: lanes of witnesses over time, filling in.
  canon: `
    ${[44, 80, 116, 152].map((y, li) => `<path d="M40 ${y}H440" stroke="currentColor" opacity=".18"/>${range(7).map((i) => {
      const x = 70 + i * 58, done = i >= 3 - li % 2 + (li === 3 ? 2 : 0);
      return `<circle cx="${x}" cy="${y}" r="6" fill="${done ? "currentColor" : S}" fill-opacity="${done ? .85 : 1}" stroke="currentColor" stroke-opacity="${done ? 1 : .5}"/>`; }).join("")}`).join("")}`,

  // Christ in the letters: the cross on the hill, morning breaking behind it (the Topics drawing's hand).
  christ: `
    <g stroke="currentColor" opacity=".16" stroke-dasharray="3 5"><path d="M150 132A90 90 0 0 1 330 132"/><path d="M110 132A130 130 0 0 1 370 132"/><path d="M70 132A170 170 0 0 1 410 132"/></g>
    <path d="M40 160Q240 92 440 160" fill="currentColor" fill-opacity=".07" stroke="currentColor" stroke-opacity=".55"/>
    <path d="M20 168H460" stroke="currentColor" opacity=".25"/>
    <path d="M240 126V30M216 54H264" stroke="currentColor" stroke-width="3"/>
    <path d="M222 24L230 12 240 20 250 12 258 24Z" stroke="currentColor" opacity=".7"/>
    ${dots([[90, 40], [390, 36], [120, 150], [362, 150]])}`,

  // Paul's page extras ─────────────
  // Life and letters: one long line of a life, letters dropping from it.
  life: `
    <path d="M30 70H450" stroke="currentColor" stroke-width="2" stroke-opacity=".6"/>
    ${[90, 150, 200, 250, 300, 340, 380, 410].map((x, i) => `<path d="M${x} 70V${110 + (i % 3) * 18}" stroke="currentColor" stroke-opacity=".4"/><rect x="${x - 9}" y="${110 + (i % 3) * 18}" width="18" height="13" rx="2" fill="${S}" stroke="currentColor"/>`).join("")}
    <circle cx="40" cy="70" r="5" fill="currentColor"/><circle cx="440" cy="70" r="7" fill="${S}" stroke="currentColor"/>${dots([[60, 34], [420, 34]])}`,
  // The story of Onesimus: a runaway sent home with a letter, from Rome to Colossae.
  onesimus: `
    <path d="M80 120Q240 20 400 120" stroke="currentColor" stroke-dasharray="4 5" opacity=".6"/>
    <circle cx="80" cy="120" r="18" fill="${S}" stroke="currentColor"/><circle cx="400" cy="120" r="18" fill="${S}" stroke="currentColor"/>
    <g class="art-word" style="font-size:13px"><text x="80" y="160" text-anchor="middle">Rome</text><text x="400" y="160" text-anchor="middle">Colossae</text></g>
    <g transform="translate(222 52)"><rect width="36" height="24" rx="3" fill="${S}" stroke="currentColor"/><path d="M0 2L18 14 36 2" stroke="currentColor" stroke-opacity=".6"/></g>
    <circle cx="80" cy="114" r="5" fill="currentColor"/><path d="M72 132Q80 124 88 132" stroke="currentColor"/><circle cx="400" cy="114" r="5" fill="currentColor"/><path d="M392 132Q400 124 408 132" stroke="currentColor"/>`,
  // At a glance: an open page, its key verse picked out.
  glance: `
    <path d="M240 40Q190 26 120 32V160Q190 154 240 168Q290 154 360 160V32Q290 26 240 40Z" fill="currentColor" fill-opacity=".05" stroke="currentColor" stroke-opacity=".6"/>
    <path d="M240 40V168" stroke="currentColor" stroke-opacity=".4"/>
    <g stroke="currentColor" opacity=".45">${range(7).map((i) => `<path d="M138 ${56 + i * 14}H${i === 3 ? 200 : 222}M258 ${56 + i * 14}H${i % 3 === 1 ? 312 : 342}"/>`).join("")}</g>
    <rect x="254" y="92" width="94" height="14" rx="3" fill="currentColor" fill-opacity=".3"/>${dots([[80, 50], [400, 50], [90, 150], [392, 150]])}`,
};

// Small icons for the card eyebrows (Lucide-style, 18px).
window.ICON = {
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  tent: '<path d="M3.5 21 14 3M20.5 21 10 3M15.5 21 12 15l-3.5 6M2 21h20"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
  lamp: '<path d="M8 2h8l4 10H4L8 2ZM12 12v6M8 22v-2c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v2H8Z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  map: '<path d="M14.1 6.3 9.9 4.2a2 2 0 0 0-1.8 0L3.6 6.4A1 1 0 0 0 3 7.3v12.2a1 1 0 0 0 1.4.9l3.7-1.9a2 2 0 0 1 1.8 0l4.2 2.1a2 2 0 0 0 1.8 0l4.5-2.2a1 1 0 0 0 .6-.9V5.3a1 1 0 0 0-1.4-.9l-3.7 1.9a2 2 0 0 1-1.8 0ZM15 5.8v15M9 3.2v15"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  pen: '<path d="M12 20h9M16.4 3.6a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/>',
  scroll: '<path d="M19 17V5a2 2 0 0 0-2-2H4M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>',
  star: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  compare: '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7M11 18H8a2 2 0 0 1-2-2V9"/>',
  bars: '<path d="M3 5h18M3 12h12M3 19h7"/>',
  split: '<path d="M16 3h5v5M8 3H3v5M12 22v-8.3a4 4 0 0 0-1.2-2.8L3 3M15 9l6-6"/>',
  check: '<path d="M21.8 10A10 10 0 1 1 17 3.3"/><path d="m9 11 3 3L22 4"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2ZM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z"/>',
  cross: '<path d="M12 2v20M6 8h12"/>',
  arrowUp: '<path d="M7 17 17 7M7 7h10v10"/>',
  arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
};
