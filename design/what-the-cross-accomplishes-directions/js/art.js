// The drawings for The cross, the empty tomb and the throne, in one hand: a thin stroke, round caps, faint washes, the
// Epistles' gold as the study's colour. The motto is "One cross. Six pictures. / An empty tomb. A throne." So the hero
// is a plain cross on a low hill, a rock tomb with its stone rolled aside, and a throne with its steps, joined by one
// rising dotted thread. No face or figure of God, of Christ or of anyone. Fixed strings written here, never from data.
window.WCArt = (() => {
  const mini = (body) => `<svg viewBox="0 0 64 64" aria-hidden="true" class="wc-emblem">${body}</svg>`;
  const spark = (x, y, s = 4) => `<path class="wc-spark" d="M${x - s} ${y}h${2 * s}M${x} ${y - s}v${2 * s}"/>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <ellipse class="wc-orbit" cx="210" cy="170" rx="196" ry="128"/>
      <circle class="wc-ring" cx="210" cy="170" r="150"/>
      <path class="wc-faint" d="M8 268h404"/>
      <path class="wc-wash" d="M24 268C62 232 120 224 162 268Z"/>
      <path d="M24 268C62 232 120 224 162 268"/>
      <path class="wc-tone" d="M92 236V150M76 170h32"/>
      <path class="wc-faint" d="M40 262l6-6M58 252l5-5M130 254l6 5"/>
      <path class="wc-wash" d="M176 268c6-50 40-70 82-68 30 2 42 32 46 68Z"/>
      <path d="M176 268c6-50 40-70 82-68 30 2 42 32 46 68"/>
      <path class="wc-dark" d="M220 268v-22a14 14 0 0 1 28 0v22Z"/>
      <path d="M220 268v-22a14 14 0 0 1 28 0v22"/>
      <path class="wc-faint" d="M226 262h16M228 258h10"/>
      <circle cx="278" cy="252" r="16"/><circle class="wc-faint" cx="278" cy="252" r="9"/>
      <path class="wc-faint" d="M190 230c8-6 18-8 26-6M268 214c8 2 14 8 18 16"/>
      <path class="wc-thread" d="M100 236C150 238 176 258 234 250C290 242 300 176 354 154"/>
      <g class="wc-rays">
        <path d="M354 76V56M354 76l-14-14M354 76l14-14M354 76l-20-4M354 76l20-4M328 92h-14M380 92h14"/>
      </g>
      <path class="wc-wash-strong" d="M340 132V86q14-16 28 0v46Z"/>
      <path class="wc-tone" d="M340 132V86q14-16 28 0v46"/>
      <path class="wc-tone" d="M332 114h44M332 114v18M376 114v18"/>
      <path d="M324 142h60M318 150h72M312 158h84"/>
      ${spark(60, 92)}${spark(160, 64, 3)}${spark(394, 200, 3)}${spark(290, 70, 3)}
      <path class="wc-faint" d="M120 110c12-5 26-5 38 0M200 132c10-4 20-4 30 0"/>
    </svg>`,
    down: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="m5 12 7 7 7-7"/></svg>`,
    centre: `<svg viewBox="0 0 64 64" aria-hidden="true" class="wc-centre-mark"><path d="M32 8v48M18 24h28"/></svg>`,
    emblems: {
      // 01 the temple: a horned altar, smoke rising
      "01": mini(`<path d="M16 54h32M20 54V34h24v20M20 34l-3-5M44 34l3-5"/><path class="wc-faint" d="M20 44h24"/><path class="wc-tone wc-smoke" d="M32 28c-5-5 5-8 0-13s5-8 0-12"/>`),
      // 02 the slave market: an opened shackle and a few coins
      "02": mini(`<path d="M10 40a9 9 0 0 1 18 0v6"/><path d="M8 46h22v8H8z"/><path class="wc-faint" d="M30 50h4"/><ellipse class="wc-tone" cx="46" cy="52" rx="9" ry="3"/><ellipse class="wc-tone" cx="46" cy="46" rx="9" ry="3"/><ellipse class="wc-tone" cx="46" cy="40" rx="9" ry="3"/>`),
      // 03 a broken friendship: a dividing wall with its middle torn down
      "03": mini(`<path d="M6 54h52"/><path d="M6 54V30h16v24M6 42h16M14 30v12M42 54V30h16v24M42 42h16M50 42v12"/><path class="wc-tone" d="M26 54l4-6 6 2-2 4M30 44l6-2"/><path class="wc-faint" d="M24 30h16"/>`),
      // 04 a law court: a pair of scales, level
      "04": mini(`<path d="M32 12v40M22 54h20M12 22h40"/><path class="wc-faint" d="M12 22l-6 14M12 22l6 14M52 22l-6 14M52 22l6 14"/><path class="wc-tone" d="M5 36a7 4 0 0 0 14 0ZM45 36a7 4 0 0 0 14 0Z"/><circle cx="32" cy="12" r="2"/>`),
      // 05 a battlefield: a victor's wreath above a broken spear
      "05": mini(`<path class="wc-tone" d="M22 34a10 12 0 0 1 2-18M42 34a10 12 0 0 0-2-18"/><path class="wc-tone" d="M21 28l-4-2M22 22l-4-3M43 28l4-2M42 22l4-3"/><path d="M8 54l20-10M36 40l20-10"/><path class="wc-faint" d="M52 32l6-4-2 6"/>`),
      // 06 a family: a hearth, its three stones and its fire
      "06": mini(`<path d="M10 54h44"/><ellipse cx="20" cy="50" rx="6" ry="4"/><ellipse cx="32" cy="51" rx="6" ry="3.5"/><ellipse cx="44" cy="50" rx="6" ry="4"/><path class="wc-tone wc-flame" d="M32 44c-7-5-5-14 0-20 2 6 7 8 6 14-1 4-3 5-6 6Z"/>`),
    },
    close: `<svg viewBox="0 0 640 170" aria-hidden="true">
      <path class="wc-faint" d="M0 150h640"/>
      <path d="M30 150c30-26 80-30 120 0"/><path class="wc-tone" d="M88 128V82M78 94h20"/>
      <path class="wc-wash" d="M236 150c6-36 30-50 60-48 22 2 30 22 34 48Z"/><path d="M236 150c6-36 30-50 60-48 22 2 30 22 34 48"/>
      <path class="wc-dark" d="M268 150v-14a10 10 0 0 1 20 0v14Z"/><path d="M268 150v-14a10 10 0 0 1 20 0v14"/><circle cx="306" cy="140" r="10"/>
      <path class="wc-thread" d="M96 128C160 132 200 150 278 146C380 140 430 90 520 70"/>
      <path class="wc-tone" d="M510 62V36q10-11 20 0v26M504 50h32M504 50v12M536 50v12"/><path d="M496 70h48M490 76h60M484 82h72"/>
      <g class="wc-rays"><path d="M520 26V12M520 26l-10-10M520 26l10-10"/></g>
      ${spark(180, 40, 3)}${spark(420, 30, 3)}${spark(600, 100, 3)}
    </svg>`,
  };
})();
