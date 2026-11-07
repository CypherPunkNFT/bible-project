// The drawings for Grief and dying, in one hand: a thin stroke, round caps, a faint wash, History orange as the study's
// colour. The hero is the field at Machpelah that Abraham bought to bury Sarah (Genesis 23:17): a hillside with the
// mouth of the cave, the trees within the field's boundaries, the boundary stones, grass that moves slowly. No one is
// drawn: no face or figure of God, of Christ or of any mourner. Fixed strings written here, never built from data.
window.GRArt = (() => {
  const tree = (x, y, s) => `<g class="gr-tree" transform="translate(${x} ${y}) scale(${s})">
      <path d="M0 0v-34M0-18l-9-9M0-24l8-8"/>
      <path class="gr-leaf" d="M-22-40c-6-14 6-28 20-26 6-12 26-10 28 4 14 2 16 22 2 28-4 10-20 12-28 6-10 6-26 0-22-12Z"/>
      <path class="gr-faint" d="M-12-44c4-4 10-4 14 0M4-52c4-3 9-3 12 1"/></g>`;
  const tufts = (points) => points.map(([x, y], i) => `<path class="gr-grass" style="animation-delay:-${i * 1.3}s" d="M${x} ${y}c-1-5-1-9 1-13M${x + 3} ${y}c0-4 1-7 4-10M${x - 3} ${y}c-1-3-3-6-6-8"/>`).join("");
  const stones = (points) => points.map(([x, y, w]) => `<path class="gr-stone" d="M${x} ${y}h${w}c2 0 3-6 0-7h-${w}c-3 1-2 7 0 7Z"/>`).join("");
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <circle class="gr-disc" cx="210" cy="168" r="150"/>
      <ellipse class="gr-orbit" cx="210" cy="168" rx="198" ry="132"/>
      <path class="gr-faint" d="M14 262h392"/>
      <path d="M226 262c22-58 54-100 100-108 34-6 58 18 68 52"/>
      <path class="gr-faint" d="M258 214c18-28 40-46 66-52M362 170c10 6 18 16 22 28"/>
      <path class="gr-cave-wash" d="M316 262v-34c0-20 14-34 30-34s30 14 30 34v34Z"/>
      <path class="gr-tone" d="M316 262v-34c0-20 14-34 30-34s30 14 30 34v34"/>
      <path class="gr-faint" d="M326 262v-30c0-14 9-24 20-24"/>
      <path class="gr-tone" d="M384 262h-80"/>
      ${stones([[60, 262, 14], [112, 262, 10], [162, 262, 16], [216, 262, 12]])}
      <path class="gr-faint" d="M40 280c60-6 140-8 220-6 40 1 90 4 140 8"/>
      ${tree(96, 254, 1.05)}${tree(176, 256, .82)}${tree(266, 250, .7)}
      ${tufts([[40, 262], [140, 262], [236, 262], [300, 262], [396, 262]])}
      <path class="gr-spark" d="M58 72h10m-5-5v10M368 58h10m-5-5v10M150 44h8m-4-4v8"/>
      <path class="gr-faint" d="M40 132c22-8 44-8 66 0M116 104c14-6 28-6 42 0"/>
    </svg>`,
    close: `<svg viewBox="0 0 640 150" aria-hidden="true">
      <path class="gr-faint" d="M0 128h640"/>
      <path d="M380 128c14-40 40-70 80-76 30-4 54 8 70 28"/>
      <path class="gr-cave-wash" d="M452 128v-22c0-12 9-22 20-22s20 10 20 22v22Z"/><path class="gr-tone" d="M452 128v-22c0-12 9-22 20-22s20 10 20 22v22"/>
      ${tree(300, 124, .8)}${tree(220, 126, .6)}
      ${stones([[120, 128, 12], [170, 128, 10]])}
      ${tufts([[90, 128], [260, 128], [560, 128]])}
      <path class="gr-spark" d="M580 30h8m-4-4v8M80 40h8m-4-4v8"/>
    </svg>`,
  };
})();
