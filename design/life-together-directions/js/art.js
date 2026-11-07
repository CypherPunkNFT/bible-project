// The drawings for Life together, in one hand: a thin stroke, round caps, a faint wash, the Epistles' gold as the
// study's colour. The motto is "Loved first. / Then one another." So the hero is the basin, the jug and the towel of
// John 13:1–17, set down after the washing; the close pours the water again. No person is drawn: no face or figure of
// God, of Christ or of anyone. Fixed strings written here, never built from data.
window.LTArt = (() => {
  const spark = (x, y, s = 5) => `<path class="lt-spark" d="M${x - s} ${y}h${2 * s}M${x} ${y - s}v${2 * s}M${x - s / 3} ${y - s / 3}l${s / 1.5} ${s / 1.5}M${x + s / 3} ${y - s / 3}l${-s / 1.5} ${s / 1.5}"/>`;
  const mini = (body) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="lt-mini">${body}</svg>`;
  const basin = (x, y, w) => `
      <ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w / 5}"/>
      <path d="M${x - w} ${y}C${x - w + 6} ${y + w * .44} ${x - w * .4} ${y + w * .6} ${x} ${y + w * .6}S${x + w - 6} ${y + w * .44} ${x + w} ${y}"/>
      <path d="M${x - w * .3} ${y + w * .6}l-6 ${w * .11}h${w * .6 + 12}l-6 ${-w * .11}"/>
      <ellipse class="lt-water" cx="${x}" cy="${y + 4}" rx="${w * .8}" ry="${w / 9}"/>
      <ellipse class="lt-ripple" cx="${x}" cy="${y + 4}" rx="${w * .3}" ry="${w / 26}"/>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <ellipse class="lt-orbit" cx="210" cy="168" rx="198" ry="142"/>
      <circle class="lt-ring" cx="210" cy="168" r="128"/>
      <path class="lt-faint" d="M52 262h316"/>
      <g class="lt-tone">${basin(176, 214, 74)}</g>
      <g><path class="lt-wash" d="M132 206c-8-6-22-8-30-2-6 5-7 14-8 24l-4 30c10 4 26 4 36 0l2-34c1-8 2-14 4-18Z"/>
        <path d="M132 206c-8-6-22-8-30-2-6 5-7 14-8 24l-4 30c10 4 26 4 36 0l2-34c1-8 2-14 4-18"/>
        <path class="lt-faint" d="M93 248c10 3 24 3 34 0M92 253c10 3 24 3 34 0"/><path class="lt-faint" d="M92 262l-1 5M100 263l-1 5M108 263v5M116 263v5M124 262l1 5"/></g>
      <g><path d="M292 262c-9-20-11-44-3-64 6-14 8-26 4-40l-2-12h38l-2 12c-4 14-2 26 4 40 8 20 6 44-3 64Z"/>
        <path class="lt-wash" d="M292 262c-9-20-11-44-3-64 6-14 8-26 4-40l-2-12h38l-2 12c-4 14-2 26 4 40 8 20 6 44-3 64Z"/>
        <path d="M289 146l-13-9"/><path d="M327 158c22 2 26 42 3 52"/><path class="lt-faint" d="M296 214h34"/></g>
      <path class="lt-faint" d="M70 120c18-7 36-7 54 0M300 92c14-6 28-6 42 0"/>
      ${spark(70, 74)}${spark(352, 60, 6)}${spark(210, 30, 4)}
    </svg>`,
    close: `<svg viewBox="0 0 640 190" aria-hidden="true">
      <path class="lt-faint" d="M40 172h560"/>
      <g class="lt-tone">${basin(300, 132, 70)}</g>
      <g transform="rotate(-38 400 70)"><path d="M392 120c-8-17-9-37-2-54 5-12 6-22 3-34l-2-10h32l-2 10c-3 12-2 22 3 34 7 17 6 37-2 54Z"/>
        <path class="lt-wash" d="M392 120c-8-17-9-37-2-54 5-12 6-22 3-34l-2-10h32l-2 10c-3 12-2 22 3 34 7 17 6 37-2 54Z"/>
        <path d="M389 22l-11-8"/><path d="M423 32c19 2 22 36 3 44"/></g>
      <path class="lt-tone lt-pour" d="M338 58c-8 14-14 34-16 66"/>
      <g><path class="lt-wash" d="M246 126c-8-6-20-7-28-2-6 4-7 12-8 20l-3 26c9 4 23 4 32 0l2-28c1-7 2-12 5-16Z"/>
        <path d="M246 126c-8-6-20-7-28-2-6 4-7 12-8 20l-3 26c9 4 23 4 32 0l2-28c1-7 2-12 5-16"/><path class="lt-faint" d="M208 162c9 3 22 3 31 0"/></g>
      ${spark(120, 60)}${spark(520, 48, 6)}
    </svg>`,
    parts: {
      "01": mini(`<g class="lt-tone"><ellipse cx="48" cy="40" rx="26" ry="5"/><path d="M22 40c2 10 14 14 26 14s24-4 26-14"/></g><path d="M66 18l-8 14"/><path class="lt-faint" d="M10 58h76"/>`),
      "02": mini(`<path d="M20 52c-2-12 2-24 14-26h10c12 2 16 14 14 26Z"/><path class="lt-faint" d="M30 26c0-6 4-9 9-9s9 3 9 9"/><g class="lt-tone"><path d="M64 52v-14h14v14Z"/><path d="M68 38v-4h6v4"/></g><path class="lt-faint" d="M10 56h76"/>`),
      "03": mini(`<g class="lt-tone"><path d="M36 50c0-10 6-14 12-14s12 4 12 14Z"/><path d="M48 36c-5-6-2-12 0-16 2 4 5 10 0 16Z"/></g><path class="lt-faint" d="M24 22l-6-4M72 22l6-4M48 12V6"/><path class="lt-faint" d="M10 56h76"/>`),
      "04": mini(`<circle cx="16" cy="44" r="3"/><circle cx="36" cy="44" r="3"/><circle cx="56" cy="44" r="3"/><circle class="lt-faint" cx="78" cy="44" r="3" stroke-dasharray="2 2"/><path class="lt-tone" d="M16 38C24 12 70 12 78 38"/><path class="lt-faint" d="M10 56h76"/>`),
      "05": mini(`<path d="M30 54V22h36v32"/><path class="lt-tone" d="M42 54V32h12v22"/><path class="lt-faint" d="M18 54v-10h6v10M72 54v-10h6v10"/><path class="lt-faint" d="M10 56h76"/>`),
      "06": mini(`<g class="lt-tone"><path d="M12 30c12-10 24 10 36 0s24 10 36 0"/><path d="M12 36c12 10 24-10 36 0s24-10 36 0"/></g><path class="lt-faint" d="M10 56h76"/>`),
    },
  };
})();
