// The drawings for The book of Psalms, in one hand: a thin stroke, round caps, a faint wash, Poetry & Wisdom teal as
// the study's colour. The motto is "A gate. Five books. / A last word of praise." So the hero is an open gateway with a
// tree planted by streams of water beyond it (Psalm 1:3), the water moving slowly. No figure of God or of Christ, and
// no staves, strings or notes. Fixed strings written here, never built from data.
window.PSArt = (() => {
  const mini = (body) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="ps-mini">${body}</svg>`;
  const spark = (x, y, r = 4) => `M${x - r} ${y}h${2 * r}M${x} ${y - r}v${2 * r}`;
  const leaves = (points) => points.map(([x, y, a]) => `<path class="ps-leaf" d="M${x} ${y}c3-4 8-5 11-4-2 4-7 6-11 4Z" transform="rotate(${a} ${x} ${y})"/>`).join("");
  const tree = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M0 0c1-22-2-40 2-62M1-30c-8-6-16-8-26-8M2-44c8-6 18-8 28-6M1-18c6-4 12-5 20-4M2-58c-6-6-14-8-22-6"/>
      ${leaves([[-26, -38, 200], [-18, -40, 160], [28, -50, -20], [20, -52, 10], [20, -22, -10], [-22, -64, 190], [-12, -66, 150], [4, -66, -60], [10, -60, -30], [-30, -32, 220]])}
      <path class="ps-faint" d="M-6 0c4-2 8-2 12 0"/></g>`;
  return {
    hero: `<svg viewBox="0 0 420 340" aria-hidden="true">
      <circle class="ps-disc" cx="210" cy="172" r="146"/>
      <ellipse class="ps-orbit" cx="210" cy="172" rx="200" ry="122" transform="rotate(-8 210 172)"/>
      <path class="ps-faint" d="M70 262h280"/>
      <g class="ps-gate"><path d="M118 262V136h26v126M276 262V136h26v126"/><path d="M110 136h42M268 136h42M114 128h34M272 128h34"/>
        <path d="M144 150c18-44 114-44 132 0"/><path class="ps-faint" d="M152 158c16-34 100-34 116 0"/>
        <path class="ps-faint" d="M124 160h14M124 190h14M124 220h14M282 160h14M282 190h14M282 220h14"/></g>
      <path class="ps-wash" d="M144 262c20-6 40-10 66-30 26 20 46 24 66 30Z"/>
      <path class="ps-faint" d="M160 262c18-10 32-20 50-36M260 262c-18-10-32-20-50-36"/>
      ${tree(210, 224, 0.95)}
      <g class="ps-water"><path d="M84 284c30-6 60 6 90 0s60-6 90 0 50 4 72 0"/><path d="M104 298c26-5 52 5 78 0s52-5 78 0 40 3 56 0"/><path d="M130 311c22-4 44 4 66 0s44-4 66 0"/></g>
      <path class="ps-spark" d="${spark(90, 92)}${spark(338, 74, 5)}${spark(250, 58, 3)}${spark(66, 196, 3)}"/>
      <path class="ps-faint" d="M318 112c12-5 24-5 36 0M58 128c10-4 20-4 30 0"/>
    </svg>`,
    close: `<svg viewBox="0 0 640 170" aria-hidden="true">
      <path class="ps-faint" d="M40 140h560"/>
      <g class="ps-gate"><path d="M250 140V64h18v76M372 140V64h18v76"/><path d="M244 64h30M366 64h30"/><path d="M268 74c14-32 90-32 104 0"/></g>
      ${tree(320, 128, 0.62)}
      <g class="ps-water"><path d="M120 152c40-6 80 6 120 0s80-6 120 0 80 6 160 0"/><path d="M180 163c30-4 60 4 90 0s60-4 90 0 60 4 100 0"/></g>
      <path class="ps-spark" d="${spark(470, 44, 5)}${spark(160, 60, 4)}${spark(540, 92, 3)}"/>
    </svg>`,
    parts: {
      "01": mini(`<path class="ps-faint" d="M8 56h80"/><path d="M10 48h28M10 40h21M10 32h12M10 24h12M10 16h31"/><path class="ps-tone ps-spark" d="${spark(46, 48, 3)}${spark(39, 40, 3)}${spark(30, 32, 3)}${spark(30, 24, 3)}"/><path class="ps-tone" d="${spark(52, 16, 5)}"/>`),
      "02": mini(`<path d="M24 58V18h10v40M62 58V18h10v40M20 18h18M58 18h18"/><path class="ps-tone" d="M34 26c8-14 20-14 28 0"/><path class="ps-faint" d="M8 58h80"/>`),
      "03": mini(`<path d="M18 14h56v40H18z"/><path class="ps-tone" d="M24 22h30"/><path class="ps-faint" d="M24 32h44M24 38h40M24 44h44"/><path d="M14 14h8M70 54h8"/>`),
      "04": mini(`<path class="ps-faint" d="M8 56h80"/><path class="ps-tone" d="M10 22c10 4 16 20 26 28 10 6 20-4 28-16 6-10 14-18 22-20"/><circle cx="10" cy="22" r="2"/><circle cx="86" cy="14" r="2"/>`),
      "05": mini(Array.from({ length: 6 }, (_, c) => Array.from({ length: 5 }, (_, r) => `<circle class="${c === 3 ? "ps-tone" : "ps-faint"}" cx="${18 + c * 12}" cy="${14 + r * 9}" r="2"/>`).join("")).join("")),
      "06": mini(`<circle class="ps-tone" cx="16" cy="44" r="4"/><path class="ps-faint" d="M20 42c18-26 44-30 64-26M20 43c20-14 42-14 64-6M20 45c22-4 44 0 64 8"/><path d="M84 16v2M84 37v2M84 53v2"/>`),
      "07": mini(`<path class="ps-tone" d="M8 50c14-4 26 4 40 0s26-4 40 0M8 58c14-4 26 4 40 0s26-4 40 0"/><path d="M30 44V12M30 14c-6 8-8 18-8 28M30 16c6 8 8 16 9 26M66 44V18M66 20c-5 8-7 14-7 22"/>`),
    },
  };
})();
