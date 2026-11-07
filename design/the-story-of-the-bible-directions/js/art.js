// The drawings for The story of the Bible, in one hand: a thin stroke, round caps, a faint wash. The motto is "A garden
// lost. A city given. / One promise, kept." So the hero is the whole story in one landscape: a garden at the left with
// its tree, the flame that guards the way back (Genesis 3:24), one road climbing to a walled city whose gates stand
// open, with a river running out of it and a tree beside the river inside (Revelation 21:25; 22:1-2). No person is
// drawn: no face or figure of God, of Christ or of anyone. Fixed strings written here, never built from data.
window.SBArt = (() => {
  const mini = (body) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="sb-mini">${body}</svg>`;
  const spark = (x, y, s, d) => `<path class="sb-spark" style="animation-delay:${d}s" d="M${x} ${y - s}L${x + s * .28} ${y - s * .28}L${x + s} ${y}L${x + s * .28} ${y + s * .28}L${x} ${y + s}L${x - s * .28} ${y + s * .28}L${x - s} ${y}L${x - s * .28} ${y - s * .28}Z"/>`;
  const tree = (x, y, s, cls = "") => `<g class="${cls}" transform="translate(${x} ${y}) scale(${s})">
      <circle class="sb-wash" cx="0" cy="-46" r="26"/>
      <path d="M0 0C-1-14 1-26 0-36M0-22c-7-5-13-9-18-17M0-28c6-5 12-9 17-16M0-36c-3-7-6-12-7-18M0-36c4-6 7-12 8-19"/>
      <path class="sb-faint" d="M-24-46c0-15 11-26 24-26s25 11 25 26-11 22-25 22-24-7-24-22Z"/>
      <circle class="sb-fruit" cx="-11" cy="-52" r="1.6"/><circle class="sb-fruit" cx="9" cy="-58" r="1.6"/><circle class="sb-fruit" cx="14" cy="-42" r="1.6"/><circle class="sb-fruit" cx="-15" cy="-38" r="1.6"/>
    </g>`;
  const flame = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path class="sb-flame" d="M0 0C-6-4-6-11-2-16C-1-11 2-11 2-15C6-11 7-4 0 0Z"/><path class="sb-faint" d="M0 2V12"/></g>`;
  const city = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
      <circle class="sb-glow" cx="52" cy="-26" r="34"/>
      <path class="sb-faint" d="M14-40l8-8 8 8M34-46l10-12 10 12M60-44l8-9 8 9M80-40l6-6 6 6"/>
      <path d="M0 0V-46h8v-6h6v6h6v-6h6v6h6v-6h6v6h4V0M66 0V-46h4v-6h6v6h6v-6h6v6h6v-6h6v6h2V0"/>
      <path d="M-4 0V-58h12V0M96 0V-58h12V0M-6-58h16M94-58h16M-4-58v-5h3v5M5-58v-5h3v5M96-58v-5h3v5M105-58v-5h3v5"/>
      <path class="sb-tone" d="M42 0V-24A10 10 0 0 1 62-24V0"/>
      <path class="sb-tone sb-faint" d="M42-1l-10 4V-22l10-4M62-1l10 4V-22l-10-4"/>
      <g transform="translate(84 -48) scale(.42)"><circle class="sb-wash" cx="0" cy="-46" r="26"/><path d="M0 0C-1-14 1-26 0-36M0-22c-7-5-13-9-18-17M0-28c6-5 12-9 17-16"/><path class="sb-faint" d="M-24-46c0-15 11-26 24-26s25 11 25 26-11 22-25 22-24-7-24-22Z"/></g>
    </g>`;
  const hero = `<svg viewBox="0 0 420 330" aria-hidden="true">
    <circle class="sb-ring" cx="226" cy="158" r="140"/>
    <circle class="sb-orbit" cx="226" cy="158" r="158"/>
    <g class="sb-turn"><circle class="sb-gold-dot" cx="226" cy="0" r="2.6"/></g>
    ${spark(330, 64, 6, 0)}${spark(282, 84, 4, 2.5)}${spark(378, 82, 4.5, 5)}
    <path d="M40 252C110 248 160 246 206 236S318 202 404 196"/>
    <path class="sb-faint" d="M60 262c30-2 60-3 90-4M250 236c40-8 90-16 130-20"/>
    ${tree(112, 246, 1.25)}${tree(76, 250, .7, "sb-faint")}
    <path class="sb-faint" d="M138 246c4-6 10-8 14-6M58 250c4-5 9-6 13-4"/>
    ${flame(176, 238, 1)}
    <path class="sb-road" d="M184 244C214 238 212 222 240 216S280 206 290 196"/>
    <path class="sb-road sb-road-mid" d="M184 244C214 238 212 222 240 216S280 206 290 196"/>
    ${city(258, 194, 1)}
    <path class="sb-river" d="M310 196C312 210 300 220 286 228S246 244 232 262"/>
    <path class="sb-river sb-flow" d="M310 196C312 210 300 220 286 228S246 244 232 262"/>
  </svg>`;
  const parts = {
    "01": mini(`<path class="sb-faint" d="M6 58h84"/>${tree(34, 58, .72)}${flame(66, 50, 1)}`),
    "02": mini(`<path class="sb-faint" d="M6 58h84"/><path d="M30 58L48 30L66 58M48 30V58M42 58l6-10 6 10"/>${spark(18, 14, 2.5, 0)}${spark(40, 8, 2, 1.5)}${spark(64, 12, 3, 3)}${spark(82, 22, 2, 4.5)}`),
    "03": mini(`<path class="sb-faint" d="M4 58h88"/><path d="M14 58L44 18L74 58"/><path class="sb-faint" d="M30 22c4-6 12-8 18-4 4-5 14-4 16 3 6 0 9 6 5 9H30c-5 0-6-6 0-8Z"/><path class="sb-tone" d="M66 58v-8h16v8M66 50l8-5 8 5"/>`),
    "04": mini(`<path class="sb-faint" d="M6 58h84"/><path d="M30 58V36L48 24L66 36V58M44 58V46h8v12"/><path class="sb-tone" d="M38 16l4-8 6 6 6-6 4 8Z"/>`),
    "05": mini(`<path class="sb-faint" d="M4 58h88"/><path d="M8 58V30h4v-4h4v4h4v-4h4v4h4V58M56 58V30h4v-4h4v4h4v-4h4v4h4v4h4V58"/><path class="sb-faint" d="M32 58l4-14 6 6 4-10 6 8 4-6"/><path class="sb-tone sb-road" d="M44 62C52 54 70 52 92 50"/>`),
    "06": mini(`<path class="sb-faint" d="M4 58h88"/><path d="M14 58C18 30 40 20 60 26S84 46 86 58"/><path d="M34 58V44A8 8 0 0 1 50 44V58"/><circle cx="62" cy="50" r="8"/><path class="sb-tone sb-faint" d="M78 18l6-4M84 26h7M72 12l2-7"/>`),
    "07": mini(`<path class="sb-faint" d="M4 50c8-3 14-3 22 0s14 3 22 0 14-3 22 0 14 3 22 0M14 58c8-3 14-3 22 0s14 3 22 0 14-3 22 0"/><path d="M30 44h40l-6 6H36Z"/><path d="M50 44V10"/><path class="sb-tone" d="M52 12c12 6 16 18 14 28H52Z"/><path class="sb-faint" d="M48 14c-10 6-12 16-12 26h12Z"/>`),
    "08": mini(`<path class="sb-faint" d="M4 58h88"/>${city(18, 58, .58)}`),
  };
  const close = `<svg viewBox="0 0 800 150" aria-hidden="true">
    <path d="M10 132C150 130 300 128 420 118S640 92 790 88"/>
    ${tree(70, 131, .9, "sb-faint")}${flame(118, 124, .9)}
    <path class="sb-road" d="M128 130C250 126 330 122 430 112S560 96 600 90"/>
    <path class="sb-road sb-road-mid" d="M128 130C250 126 330 122 430 112S560 96 600 90"/>
    ${city(586, 90, 1.05)}
    <path class="sb-river" d="M641 90C640 104 616 112 590 118S520 130 480 140"/>
    <path class="sb-river sb-flow" d="M641 90C640 104 616 112 590 118S520 130 480 140"/>
    ${spark(660, 22, 5, 1)}${spark(560, 34, 3.5, 3.5)}${spark(730, 30, 4, 6)}
  </svg>`;
  return { hero, parts, close };
})();
