// The drawings for Genesis 1–11, in one hand: a thin stroke, round caps, faint washes, four-point sparkles, History
// orange as the study's colour. The motto is "Eleven chapters. Eight questions. / Read the verse before the view." So
// the hero holds the whole world of these chapters at once: the lights of day four over a wide horizon, the ark resting
// on a ridge of mountains, a plain unfinished tower (not a stepped temple tower, which the study calls background), and
// one thin road leaving to the right, as Genesis 12:1 narrows to one man. No person and no figure of God is drawn.
// Fixed strings written here, never built from data.
window.GBArt = (() => {
  const mini = (title, body) => `<svg viewBox="0 0 96 64" class="gb-mini" role="img" aria-label="${title}">${body}</svg>`;
  const spark = (x, y, s = 4) => `<path class="gb-spark" d="M${x - s} ${y}h${s * 2}M${x} ${y - s}v${s * 2}"/>`;
  return {
    hero: `<svg viewBox="0 0 420 330" role="img" aria-labelledby="gb-hero-t">
      <title id="gb-hero-t">The lights over a wide horizon, the ark resting on a ridge of mountains, an unfinished tower, and one road leaving to the right</title>
      <ellipse class="gb-orbit" cx="210" cy="168" rx="198" ry="132"/>
      <circle class="gb-faint" cx="210" cy="168" r="122"/>
      <circle class="gb-tone" cx="92" cy="92" r="15"/><path class="gb-faint" d="M92 64v8M92 112v8M64 92h8M112 92h8M72 72l5 5M107 107l5 5M72 112l5-5M107 77l5-5"/>
      <path d="M146 70a11 11 0 1 0 9 17a9 9 0 1 1-9-17Z"/>
      ${spark(56, 150)}${spark(196, 46, 5)}${spark(352, 76)}${spark(250, 104, 3)}
      <path class="gb-faint" d="M14 226h392"/>
      <path d="M118 226l38-46 22 20 30-40 34 44 26-22 34 44"/>
      <path class="gb-faint" d="M150 188l8-6M204 172l10-12M262 206l6-6"/>
      <g class="gb-tone"><path d="M178 172h62l-6 14h-50Z"/><path d="M188 172v-12h42v12"/><path d="M196 166h6M214 166h6"/></g>
      <g><path d="M318 226v-92h40v92"/><path class="gb-faint" d="M318 210h40M318 194h40M318 178h40M318 162h40M318 146h40M330 226v-16M346 210v-16M330 194v-16M346 178v-16M330 162v-16"/>
        <path d="M318 134l6-8M358 134l-4-10M336 134v-6"/><path class="gb-faint" d="M310 226V112M366 226V120M310 150h56M310 186h56"/></g>
      <path class="gb-tone gb-road" d="M358 226c14 10 30 16 50 20"/>
      <path class="gb-tone" stroke-dasharray="2 6" d="M362 236c20 12 34 18 44 22"/>
      <g class="gb-water"><path class="gb-faint" d="M24 250c20-6 40-6 60 0s40 6 60 0 40-6 60 0 40 6 60 0 40-6 60 0"/>
        <path class="gb-faint" d="M54 268c20-5 40-5 60 0s40 5 60 0 40-5 60 0 40 5 60 0"/></g>
      ${spark(398, 206, 5)}
    </svg>`,
    close: `<svg viewBox="0 0 640 170" role="img" aria-labelledby="gb-close-t">
      <title id="gb-close-t">A wide horizon with the scattered peoples, narrowing to one road toward a tent under a star</title>
      <path class="gb-faint" d="M0 132h640"/>
      <g class="gb-faint">${[[40, 118], [70, 104], [96, 122], [128, 98], [150, 116], [182, 106], [60, 140], [112, 146], [168, 140], [210, 124], [236, 110], [24, 102]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2"/>`).join("")}</g>
      <path class="gb-faint" d="M40 118C200 128 300 132 420 134M70 104C200 120 300 128 420 134M60 140C200 138 300 136 420 134"/>
      <path class="gb-tone" d="M420 134C470 134 510 132 540 128"/>
      <path class="gb-tone" d="M548 128l18-26 18 26M566 102v-6"/>
      ${spark(566, 54, 6)}${spark(300, 40, 3)}${spark(120, 30, 3)}
    </svg>`,
    minis: {
      "01": mini("Evening and morning: the lights over a horizon, six days marked and the seventh open", `<circle class="gb-tone" cx="30" cy="22" r="7"/><path d="M62 15a7 7 0 1 0 6 11a6 6 0 1 1-6-11Z"/><path class="gb-faint" d="M6 40h84"/>${[12, 24, 36, 48, 60, 72].map((x) => `<circle cx="${x}" cy="52" r="2.4" class="gb-dot"/>`).join("")}<circle cx="84" cy="52" r="2.4"/>`),
      "02": mini("Dust of the ground, and a line of descent", `<path class="gb-faint" d="M6 54c16-8 30-8 42-4s28 4 42-2"/><path class="gb-tone" stroke-dasharray="1 5" d="M48 46V8"/>${[40, 30, 20, 10].map((y) => `<circle cx="48" cy="${y}" r="2.2"/>`).join("")}`),
      "03": mini("The first city", `<path d="M16 54V30l8-6 8 6v24M32 54V22h16v32M48 54V34l10-8 10 8v20M68 54V30h12v24"/><path class="gb-faint" d="M6 54h84M38 54v-8h4v8"/>`),
      "04": mini("Long lives, growing shorter", `${[[10, 50], [20, 48], [30, 49], [40, 47], [50, 30], [58, 24], [66, 20], [74, 14], [82, 10]].map(([x, h], i) => `<path class="${i < 4 ? "" : "gb-tone"}" d="M${x} 56V${56 - h}"/>`).join("")}<path class="gb-faint" d="M4 56h88"/>`),
      "05": mini("Stars above the earth, and an open question between", `${spark(22, 14, 4)}${spark(48, 8, 5)}${spark(74, 16, 4)}<path class="gb-faint" d="M6 52h84"/><path class="gb-tone" stroke-dasharray="2 5" d="M48 20v28"/>`),
      "06": mini("The ark resting on the mountains", `<path d="M8 56l18-22 12 10 12-16 14 14 12-8 12 22"/><g class="gb-tone"><path d="M36 26h26l-3 6H39Z"/><path d="M40 26v-6h18v6"/></g><path class="gb-faint" d="M4 60c8-3 16-3 24 0s16 3 24 0 16-3 24 0"/>`),
      "07": mini("A garment carried to cover", `<path d="M22 18h52l-6 34H28Z"/><path class="gb-faint" d="M30 18l6 34M48 18v34M66 18l-6 34"/><path class="gb-tone" d="M14 14c10-6 58-6 68 0"/>`),
      "08": mini("An unfinished tower", `<path d="M34 58V16h28v42"/><path class="gb-faint" d="M34 46h28M34 34h28M34 22h28M44 58v-12M54 46v-12M44 34v-12"/><path d="M34 16l4-6M62 16l-3-7M48 16v-4"/><path class="gb-tone" d="M62 58c10 2 18 0 28-4"/>`),
    },
  };
})();
