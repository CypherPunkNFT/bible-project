// The drawings for Saved by grace, in one hand: a thin stroke, round caps, a faint wash, the Epistles' gold as the
// study's colour. The motto is "Dead, then alive. / Guilty, then declared right." The hero is one open, empty hand,
// palm up, and a sealed scroll coming down to it out of plain light: the verdict is given, not earned (Ephesians 2:8,
// "it is the gift of God"); faith is the empty hand that takes it (part 01). The light is abstract. No face or figure of God, of Christ or of the Father.
// Fixed strings written here, never built from data.
window.SGArt = (() => {
  const mini = (body) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="sg-mini">${body}</svg>`;
  const sparkle = (x, y, r) => `<path class="sg-spark" d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z"/>`;
  // One open hand, palm up, drawn on a 24-unit grid and scaled; the stroke keeps its own width at any scale.
  const hand = (x, y, scale) => `<g transform="translate(${x} ${y}) scale(${scale})" class="sg-hand">
      <path class="sg-wash" d="M7 15.5C8 14.6 9 14.3 10.5 14.3L19.5 13.2C21.2 13 21.8 15.3 20.2 15.9L13.5 17.6L10 18.8C9.2 19 8.6 19.4 8 20Z"/>
      <path d="M2 21L7 15.5C8 14.6 9 14.3 10.5 14.3L19.5 13.2C21.2 13 21.8 15.3 20.2 15.9L13.5 17.6L10 18.8C9.2 19 8.6 19.4 8 20L5.4 23"/>
      <path d="M10.5 14.3C10.7 12.6 11.6 11.2 12.9 10.4C13.9 9.8 14.8 11 14.1 12L13.2 13.9"/>
      <path class="sg-faint" d="M14.2 15.2L19.6 14.5M13.6 16.5L18.6 15.6M10.6 16.6C11.6 16.2 12.4 16.1 13.2 16.1"/>
      <path class="sg-faint" d="M0.6 19.6L4.6 23.8M1.6 18.6L5.8 22.8"/></g>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <ellipse class="sg-orbit" cx="210" cy="168" rx="196" ry="132"/>
      <circle class="sg-ring" cx="210" cy="160" r="122"/>
      <g class="sg-rays"><path d="M260 18v44M236 22l10 40M284 22l-10 40M214 30l20 36M306 30l-20 36"/></g>
      <path class="sg-light" d="M232 64h56l34 160H198Z"/>
      <g class="sg-float">
        <path class="sg-wash" d="M226 120h68v26h-68Z"/>
        <path d="M226 120h68M226 146h68"/><ellipse cx="226" cy="133" rx="6" ry="13"/><ellipse cx="294" cy="133" rx="6" ry="13"/>
        <path class="sg-faint" d="M238 128h44M238 134h36M238 140h40"/>
        <path class="sg-tone" d="M256 146l-6 22M264 146l6 22"/><circle class="sg-tone sg-seal" cx="260" cy="152" r="7"/>
      </g>
      ${hand(118, 78, 9.6)}
      ${sparkle(92, 88, 7)}${sparkle(334, 70, 9)}${sparkle(300, 128, 5)}${sparkle(120, 140, 4)}
    </svg>`,
    close: `<svg viewBox="0 0 640 170" aria-hidden="true">
      <path class="sg-faint" d="M40 160h560"/>
      ${hand(196, 0, 7)}
      <path class="sg-wash" d="M282 92c18-5 86-5 104 0v-58c-18-5-86-5-104 0Z"/>
      <path d="M282 92c18-5 86-5 104 0v-58c-18-5-86-5-104 0Z"/><path d="M334 30v60"/>
      <path class="sg-faint" d="M290 46h36M290 56h30M290 66h34M342 46h36M342 56h28M342 66h32"/>
      <circle class="sg-tone" cx="362" cy="80" r="6"/>
      ${sparkle(200, 40, 6)}${sparkle(452, 30, 8)}
    </svg>`,
    parts: {
      // 01 "We are God's workmanship": a finished bowl on the bench, the mallet laid down.
      "01": mini(`<path class="sg-faint" d="M6 56h84"/><path d="M26 40c0 10 8 16 22 16s22-6 22-16Z"/><path class="sg-wash" d="M26 40c0 10 8 16 22 16s22-6 22-16Z"/><path class="sg-tone" d="M24 40h48"/><path d="M76 52l12-12M84 36l8 8-4 4-8-8Z"/>${sparkle(48, 20, 5)}`),
      // 02 Two men went up to pray: the temple's columns, and one man standing at a distance.
      "02": mini(`<path class="sg-faint" d="M6 58h84"/><path d="M14 58V22M30 58V22M10 22h24M8 18h28l-14-8Z"/><path class="sg-faint" d="M46 58V22M42 22h8"/><circle class="sg-tone" cx="74" cy="34" r="3.2"/><path class="sg-tone" d="M74 38v12M74 50l-4 8M74 50l4 8M74 42l-3 3"/>`),
      // 03 "This is the Spirit He poured out on us abundantly": water poured into a basin.
      "03": mini(`<path class="sg-faint" d="M6 58h84"/><path d="M30 46c0 6 8 10 18 10s18-4 18-10Z"/><path d="M24 12c0 6 6 8 6 14 0 4-4 6-8 6s-8-2-8-6c0-6 6-8 6-14ZM30 18l12-6"/><path class="sg-tone sg-pour" d="M42 12c4 8 6 20 6 32"/><path class="sg-faint" d="M38 50c6 2 14 2 20 0"/>`),
      // 04 Declared right: an account book, one entry made and credited.
      "04": mini(`<path class="sg-faint" d="M6 58h84"/><path d="M14 18c10-3 24-3 34 2v34c-10-5-24-5-34-2ZM82 18c-10-3-24-3-34 2v34c10-5 24-5 34-2Z"/><path class="sg-faint" d="M20 28h22M20 34h22M20 40h22"/><path d="M18 26l26 18"/><path class="sg-tone" d="M54 34h22"/><circle class="sg-tone" cx="72" cy="44" r="3"/>`),
      // 05 "No longer a slave, but a son": a shackle lying open.
      "05": mini(`<path class="sg-faint" d="M6 58h84"/><path d="M26 44a12 12 0 1 1 18 6"/><path d="M58 44a12 12 0 1 0-6-16"/><path class="sg-faint" d="M44 50l4 2M52 28l4-6"/><path class="sg-tone" d="M70 18l6-6M74 24h8"/>`),
      // 06 Faith that is alive: a loaf and a folded cloak, given to the neighbour in need.
      "06": mini(`<path class="sg-faint" d="M6 58h84"/><path d="M18 50c0-12 8-18 18-18s18 6 18 18Z"/><path class="sg-wash" d="M18 50c0-12 8-18 18-18s18 6 18 18Z"/><path class="sg-faint" d="M28 40l4-4M36 40l4-4M44 42l3-3"/><path class="sg-tone" d="M60 54h24v-10H60ZM60 44l4-6h16l4 6"/>`),
      // 07 Growing holy: a young tree tied to its stake, still growing.
      "07": mini(`<path class="sg-faint" d="M6 58h84"/><path d="M48 58V20"/><path class="sg-faint" d="M58 58V24"/><path d="M48 38l10-2M48 30l-10-6M48 24l8-8"/><path class="sg-tone" d="M38 24c-6-2-8-8-6-12 6 0 8 6 6 12ZM56 16c2-6 8-8 12-6-1 6-7 8-12 6Z"/>${sparkle(26, 12, 4)}`),
    },
  };
})();
