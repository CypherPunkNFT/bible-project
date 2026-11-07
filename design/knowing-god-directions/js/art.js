// The drawings for Knowing God, in one hand: a thin stroke, round caps, a faint wash, History orange as the study's
// colour. The motto is "He tells us His name. / He keeps the world He made." So the opening drawing is the bush that
// burns and is not burned up, with the sandals taken off for holy ground (Exodus 3:2, 5), under the stars He calls by
// name (Isaiah 40:26), with a sparrow on a stone (Matthew 10:29). No face or figure of God, of Christ or of anyone.
// Fixed strings written here, never built from data.
window.KGArt = (() => {
  const mini = (body) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="kg-mini">${body}</svg>`;
  const spark = (x, y, s = 4) => `M${x - s} ${y}h${2 * s}m-${s}-${s}v${2 * s}`;
  const flame = (x, y, h = 12) => `<path class="kg-flame" style="transform-origin:${x}px ${y}px" d="M${x} ${y}c-${h / 2.4}-${h / 2.2}-${h / 3}-${h * 0.8} 0-${h}c${h / 3} ${h * 0.2} ${h / 2.4} ${h * 0.55} 0 ${h}Z"/>`;
  const sandal = (x, y, r) => `<g transform="rotate(${r} ${x} ${y})"><path d="M${x - 9} ${y}c0-4 4-5 9-5s10 1 10 5-5 5-10 5-9-1-9-5Z"/><path class="kg-faint" d="M${x - 3} ${y - 5}v10M${x + 4} ${y - 5}l-2 10"/></g>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <ellipse class="kg-orbit" cx="210" cy="170" rx="196" ry="128"/>
      <path class="kg-faint" d="M30 252L118 160l34 22 64-86 62 74 30-18 60 100"/>
      <path class="kg-faint" d="M182 136l12-14 10 12M248 112l8 10"/>
      <path d="M8 252c60-4 140-6 210-4s140 6 194 2"/>
      <ellipse class="kg-glow" cx="222" cy="214" rx="46" ry="38"/>
      <g class="kg-bush">
        <path d="M222 250c-2-12-8-22-20-30M222 250c2-14 10-26 24-34M222 250c0-16-2-30 2-46M204 222c-8-2-14 0-18 4M244 218c8-4 14-4 20 0M224 206c-6-6-8-12-6-18M226 210c6-4 10-10 10-16"/>
        <path class="kg-faint" d="M200 220l-4-6M246 216l4-6M218 190l-4-4M236 196l4-4M190 226l-6 2M262 218l6 2"/>
      </g>
      <g class="kg-tone">${flame(203, 220, 14)}${flame(246, 216, 13)}${flame(224, 204, 18)}${flame(218, 189, 10)}${flame(236, 195, 11)}${flame(188, 226, 9)}${flame(262, 218, 9)}</g>
      <g>${sandal(122, 264, -8)}${sandal(146, 268, 6)}</g>
      <g class="kg-faint"><path d="M318 214c3-4 9-4 12 0 2 3-1 6-6 6s-8-3-6-6ZM330 214l4-3M352 200c3-4 9-4 12 0 2 3-1 6-6 6s-8-3-6-6ZM364 200l4-3M320 220v4M326 220v4M354 206v4M360 206v4"/></g>
      <path d="M318 252c2-10 10-14 22-14s20 4 22 14"/>
      <path class="kg-tone" d="M334 236c3-6 12-7 17-2-2 4-9 6-17 2Z"/><path class="kg-tone" d="M334 236l-7 3M351 234l4-1M343 238l-1 4M346 238l1 4"/>
      <path class="kg-spark" d="${spark(70, 64)}${spark(358, 52)}${spark(150, 36, 3)}${spark(290, 30, 3)}"/>
      <g class="kg-stars"><circle cx="104" cy="92" r="1.2"/><circle cx="126" cy="58" r="1"/><circle cx="196" cy="48" r="1.2"/><circle cx="246" cy="64" r="1"/><circle cx="318" cy="84" r="1.2"/><circle cx="336" cy="120" r="1"/><circle cx="88" cy="128" r="1"/><circle cx="270" cy="44" r="1"/></g>
    </svg>`,
    close: `<svg viewBox="0 0 640 170" aria-hidden="true">
      <path class="kg-faint" d="M0 150h640"/>
      <path d="M180 150l110-104 46 38 40-30 120 96"/>
      <path class="kg-cloud" d="M244 62c-4-14 12-22 24-14 4-14 24-16 32-4 10-8 26-2 26 10 14 0 18 16 6 20H250c-12 0-16-10-6-12Z"/>
      <path class="kg-faint" d="M262 84v14M282 86v18M302 84v12"/>
      <g class="kg-tone"><path d="M372 150v-26c0-6 10-6 10 0v26M388 150v-26c0-6 10-6 10 0v26"/><path class="kg-faint" d="M375 130h4M375 136h4M375 142h4M391 130h4M391 136h4M391 142h4"/></g>
      <path class="kg-faint" d="M40 160c90-4 180-6 300-8"/>
      <path class="kg-spark" d="${spark(560, 40)}${spark(90, 56)}${spark(470, 24, 3)}"/>
    </svg>`,
    parts: {
      "01": mini(`<path class="kg-faint" d="M6 56h84"/><path d="M48 56c-1-8-5-14-12-18M48 56c1-9 6-15 13-19M48 56c0-10-1-18 1-26"/><g class="kg-tone">${flame(37, 38, 9)}${flame(61, 37, 9)}${flame(49, 30, 12)}</g>${sandal(18, 58, -6)}`),
      "02": mini(`<path d="M14 18l40 24M14 30l40 12"/><circle class="kg-glow" cx="62" cy="44" r="9"/><circle class="kg-tone" cx="62" cy="44" r="4.5"/><path class="kg-faint" d="M70 30c4-4 4-8 0-12M78 34c4-5 4-11 0-16M6 56h84"/>`),
      "03": mini(`<path d="M30 56V24c0-10 16-10 16 0v32M50 56V24c0-10 16-10 16 0v32"/><path class="kg-faint" d="M34 30h8M34 36h8M34 42h8M54 30h8M54 36h8M54 42h8M6 56h84"/><path class="kg-tone" d="M74 22l10-10M72 24l4 4"/>`),
      "04": mini(`<path d="M16 50c0-10 8-16 18-16s18 6 18 16Z"/><path class="kg-faint" d="M24 42c2-2 4-2 6 0M34 40c2-2 4-2 6 0"/><path class="kg-tone" d="M58 50l4-18h20l4 18ZM62 32l10 8 10-8"/><path class="kg-faint" d="M6 54h84"/>`),
      "05": mini(`<path d="M18 52h20l-3-8H21ZM58 52h20l-3-8H61Z"/>${flame(28, 42, 12)}<g class="kg-tone">${flame(68, 42, 12)}</g><path class="kg-faint kg-dash" d="M34 26c8-8 20-8 28 0"/><path class="kg-faint" d="M6 56h84"/>`),
      "06": mini(`<path d="M48 14v38M28 22h40M28 22l-8 16h16ZM68 22l-8 16h16Z"/><path class="kg-tone" d="M20 38l5-7 3 3 3-4 5 8"/><path class="kg-spark" d="${spark(12, 10, 3)}${spark(84, 12, 3)}"/><path class="kg-faint" d="M40 56h16"/>`),
      "07": mini(`<path d="M28 56V30h40v26M24 30h48"/><path class="kg-faint kg-dash" d="M36 38h24M36 44h24"/><path class="kg-faint" d="M6 56h84"/><path class="kg-tone" d="M48 26c-3-4-3-8 0-12 3 4 3 8 0 12Z"/>`),
      "08": mini(`<path d="M10 40c20 2 46 2 76-6"/><path class="kg-faint" d="M30 41l-4 6M52 40l2 7M70 37l4 6"/><path class="kg-tone" d="M42 34c4-8 16-9 22-2-3 5-12 7-22 2ZM42 34l-9 3M64 32l5-1"/><path class="kg-faint" d="M50 38v6M55 38v6M6 58h84"/>`),
      "09": mini(`<path d="M30 56c-2-12 2-26 0-38M30 56c-6-10-8-24-6-34M30 56c6-10 8-24 6-34"/><path class="kg-tone" d="M24 30l12 0"/><path d="M58 56V34c0-8 20-8 20 0v22Z"/><path class="kg-faint" d="M58 40h20M6 56h84"/>`),
      "10": mini(`<ellipse class="kg-faint kg-dash" cx="48" cy="34" rx="28" ry="18"/><circle class="kg-tone" cx="20" cy="34" r="3"/><circle class="kg-tone" cx="48" cy="16" r="3"/><circle class="kg-tone" cx="76" cy="34" r="3"/><path d="M70 46l6-12 6 10"/>`),
    },
    loop: `<svg viewBox="0 0 600 120" aria-hidden="true"><path class="kg-faint kg-dash" d="M90 60h420"/><path d="M510 60c60 0 60 54 0 54H90c-60 0-60-54 0-54"/><path class="kg-tone" d="M96 108l-8 6 8 6"/></svg>`,
  };
})();
