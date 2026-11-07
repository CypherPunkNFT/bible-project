// The drawings for Baptism and the Lord's Supper, in one hand: a thin stroke, round caps, a faint wash, the Gospels'
// violet as the study's colour. The motto is "Water once. Bread again and again." So the hero is water with one set of
// rings spreading from where something went under, and a broken loaf and a cup on a table's edge with a row of small
// marks running on past them. No person is drawn: no face or figure of God, of Christ or of anyone. Fixed strings
// written here, never built from data.
window.BLArt = (() => {
  const spark = (x, y, s = 5) => `<path class="bl-spark" d="M${x - s} ${y}h${2 * s}M${x} ${y - s}v${2 * s}M${x - s / 3} ${y - s / 3}l${s / 1.5} ${s / 1.5}M${x + s / 3} ${y - s / 3}l${-s / 1.5} ${s / 1.5}"/>`;
  const mini = (body) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="bl-mini">${body}</svg>`;
  const wave = (x, y, w, n = 4) => `M${x} ${y}` + Array.from({ length: n }, () => `q${w / (2 * n)} -4 ${w / n} 0`).join("");
  const rings = (x, y, r) => [1, 2, 3].map((i) => `<ellipse class="bl-ring bl-ring-${i}" cx="${x}" cy="${y}" rx="${r}" ry="${r / 4.5}"/>`).join("");
  const loaf = (x, y, s = 1) => `
      <path class="bl-wash" d="M${x - 26 * s} ${y}c0-14 ${8 * s}-${22 * s} ${21 * s}-${22 * s}l${4 * s} ${7 * s}-${4 * s} ${6 * s} ${5 * s} ${9 * s}Z"/>
      <path d="M${x - 26 * s} ${y}c0-14 ${8 * s}-${22 * s} ${21 * s}-${22 * s}l${4 * s} ${7 * s}-${4 * s} ${6 * s} ${5 * s} ${9 * s}"/>
      <path class="bl-wash" d="M${x + 4 * s} ${y}l-${4 * s}-${8 * s} ${4 * s}-${6 * s}-${3 * s}-${8 * s}c${14 * s} 1 ${24 * s} ${9 * s} ${24 * s} ${22 * s}Z"/>
      <path d="M${x + 4 * s} ${y}l-${4 * s}-${8 * s} ${4 * s}-${6 * s}-${3 * s}-${8 * s}c${14 * s} 1 ${24 * s} ${9 * s} ${24 * s} ${22 * s}"/>
      <path class="bl-faint" d="M${x - 18 * s} ${y - 9 * s}c${4 * s}-${3 * s} ${8 * s}-${4 * s} ${12 * s}-${4 * s}M${x + 10 * s} ${y - 12 * s}c${4 * s} 0 ${7 * s} ${2 * s} ${9 * s} ${4 * s}"/>`;
  const cup = (x, y, s = 1) => `
      <path class="bl-wash" d="M${x - 18 * s} ${y - 50 * s}h${36 * s}c0 ${22 * s}-${8 * s} ${33 * s}-${18 * s} ${33 * s}s-${18 * s}-${11 * s}-${18 * s}-${33 * s}Z"/>
      <path d="M${x - 18 * s} ${y - 50 * s}h${36 * s}c0 ${22 * s}-${8 * s} ${33 * s}-${18 * s} ${33 * s}s-${18 * s}-${11 * s}-${18 * s}-${33 * s}Z"/>
      <path d="M${x} ${y - 17 * s}v${12 * s}M${x - 12 * s} ${y}c${2 * s}-${4 * s} ${6 * s}-${5 * s} ${12 * s}-${5 * s}s${10 * s} 1 ${12 * s} ${5 * s}"/>
      <path class="bl-faint" d="M${x - 14 * s} ${y - 44 * s}h${28 * s}"/>`;
  const marks = (x, y, n, gap) => Array.from({ length: n }, (_, i) => `<circle class="bl-mark" style="--i:${i}" cx="${x + i * gap}" cy="${y}" r="2.6"/>`).join("");
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <ellipse class="bl-orbit" cx="210" cy="168" rx="198" ry="142"/>
      <circle class="bl-circle" cx="210" cy="168" r="128"/>
      <g class="bl-tone">
        <path d="${wave(34, 214, 196, 7)}"/>
        <path class="bl-faint" d="${wave(48, 228, 168, 6)}"/>
        <path class="bl-faint" d="${wave(64, 242, 132, 5)}"/>
        ${rings(130, 214, 22)}
        <path class="bl-drop" d="M130 150c-5 8-7 12-7 16a7 7 0 0 0 14 0c0-4-2-8-7-16Z"/>
      </g>
      <path d="M232 250h168"/><path class="bl-faint" d="M240 258h152"/>
      <g>${loaf(276, 250)}</g>
      <g>${cup(352, 250)}</g>
      <g class="bl-tone">${marks(246, 280, 9, 18)}</g>
      ${spark(84, 96)}${spark(356, 84, 6)}${spark(214, 40, 4)}
    </svg>`,
    close: `<svg viewBox="0 0 640 190" aria-hidden="true">
      <g class="bl-tone"><path d="${wave(30, 140, 180, 6)}"/><path class="bl-faint" d="${wave(46, 154, 148, 5)}"/>${rings(110, 140, 20)}</g>
      <path d="M240 150h380"/><path class="bl-faint" d="M248 158h360"/>
      <g>${loaf(296, 150, .8)}</g><g>${cup(366, 150, .8)}</g>
      <g class="bl-tone">${marks(410, 136, 12, 18)}</g>
      ${spark(180, 54)}${spark(560, 60, 6)}
    </svg>`,
    glyph: {
      water: `<svg viewBox="0 0 28 16" aria-hidden="true" class="bl-glyph"><path d="${wave(2, 8, 24, 3)}"/><path class="bl-faint" d="${wave(6, 13, 16, 2)}"/></svg>`,
      table: `<svg viewBox="0 0 28 16" aria-hidden="true" class="bl-glyph"><path d="M3 14c0-6 3-9 8-9l1 3-1 3 2 3ZM15 14l-1-3 1-3-1-3c5 0 9 3 9 9Z"/></svg>`,
      both: `<svg viewBox="0 0 28 16" aria-hidden="true" class="bl-glyph"><path d="${wave(1, 10, 11, 2)}"/><path d="M16 14c0-5 2-8 5-8s5 3 5 8Z"/></svg>`,
    },
    parts: {
      "01": mini(`<g class="bl-tone"><path d="${wave(8, 40, 34, 3)}"/><path class="bl-faint" d="${wave(12, 48, 26, 2)}"/></g><path d="M54 48c0-12 6-18 14-18s14 6 14 18Z"/><path class="bl-faint" d="M50 52h36"/>`),
      "02": mini(`<path class="bl-tone" d="${wave(6, 30, 84, 6)}"/><path d="M14 18h16c5 0 7 4 7 10v8c0 9 5 14 11 14s11-5 11-14v-8c0-6 2-10 7-10h16"/><path class="bl-faint" d="M44 14l4-5 4 5M48 9v10"/>`),
      "03": mini(`<path class="bl-tone" d="${wave(4, 40, 88, 8)}"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${9 + i * 8.6} 22v12"/>`).join("")}<path class="bl-faint" d="M6 54h84"/>`),
      "04": mini(`<path d="M8 20h16v8h12v8h12v8"/><path class="bl-tone" d="${wave(44, 44, 46, 3)}"/><path class="bl-tone bl-faint" d="${wave(52, 52, 34, 2)}"/>`),
      "05": mini(`<path d="M30 56V14h36v42"/><path class="bl-tone" d="M28 12h40M30 16v10M66 16v10"/><path class="bl-faint" d="M40 56V26h16v30"/><path class="bl-faint" d="M10 56h76"/>`),
      "06": mini(`<path d="M22 50c0-10 5-16 12-16l2 5-2 5 3 6ZM40 50l-2-6 2-5-2-5c7 0 12 6 12 16Z"/><path class="bl-tone" d="M60 22h20c0 12-4 18-10 18s-10-6-10-18ZM70 40v8M64 52h12"/><path class="bl-faint" d="M12 56h76"/>`),
      "07": mini(`<path d="M10 40h76"/><path class="bl-faint" d="M14 46h68"/>${[22, 38, 54].map((x) => `<circle cx="${x}" cy="32" r="4"/>`).join("")}<circle class="bl-tone" cx="70" cy="32" r="4" stroke-dasharray="2 2"/>`),
    },
  };
})();
