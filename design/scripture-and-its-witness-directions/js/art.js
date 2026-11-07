// The drawings for What the Bible says about itself, in one hand: a thin stroke, round caps, the poetry colour as the
// study's colour. The motto is "A lamp. A dark place. / Read by its own light." So the opening drawing is a clay lamp
// beside an open scroll in the dark, its light falling on the lines nearest it. No face or figure of God or of Christ.
// Fixed strings written here, never built from data.
window.SWArt = (() => {
  const mini = (body) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="sw-mini">${body}</svg>`;
  const lines = (x, y, widths, cls) => widths.map((w, i) => `<path class="${cls}" d="M${x} ${y + i * 9}h${w}"/>`).join("");
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <defs><radialGradient id="sw-pool" cx="62%" cy="54%" r="46%"><stop offset="0" class="sw-pool-in"/><stop offset="1" class="sw-pool-out"/></radialGradient></defs>
      <circle class="sw-disc" cx="210" cy="166" r="142"/>
      <ellipse class="ms-orbit" cx="210" cy="168" rx="198" ry="130"/>
      <ellipse class="ms-orbit ms-orbit-2" cx="210" cy="168" rx="170" ry="150"/>
      <circle class="sw-pool" cx="282" cy="222" r="118"/>
      <path class="sw-faint" d="M40 262h336"/>
      <g class="sw-scroll">
        <path class="sw-leaf" d="M70 214c36-10 156-10 192 0v36c-36-10-156-10-192 0Z"/>
        <path class="sw-roll" d="M58 206c0-6 6-10 12-10s12 4 12 10v46c0 6-6 10-12 10s-12-4-12-10Z"/>
        <path class="sw-roll" d="M250 206c0-6 6-10 12-10s12 4 12 10v46c0 6-6 10-12 10s-12-4-12-10Z"/>
        <ellipse class="sw-roll-end" cx="70" cy="200" rx="12" ry="4"/><ellipse class="sw-roll-end" cx="262" cy="200" rx="12" ry="4"/>
        ${lines(90, 220, [48, 42, 46], "sw-ink sw-ink-dim")}
        ${lines(152, 220, [36, 40, 30], "sw-ink sw-ink-mid")}
        ${lines(202, 220, [40, 34, 42], "sw-ink sw-ink-lit")}
      </g>
      <g class="sw-lamp" transform="translate(320 262) scale(.72) translate(-258 -188)">
        <path class="sw-clay" d="M246 186c-20 0-34-6-34-14s14-14 34-14 34 6 40 10l20 2c4 1 4 5 0 6l-20 2c-6 4-20 8-40 8Z"/>
        <path class="sw-faint" d="M232 166c6-3 22-3 28 0"/><circle class="sw-faint" cx="246" cy="168" r="3"/>
        <path class="sw-faint" d="M212 172c-8-2-12-8-8-12"/>
        <path class="sw-flame" d="M308 167c-6-6-4-14 2-22 2 8 8 12 4 20-1 2-4 3-6 2Z"/>
        <path class="sw-flame-core" d="M309 164c-2-3-1-6 1-9 1 3 3 5 1 8Z"/>
      </g>
      <g class="sw-dust"><circle cx="330" cy="180" r="1.2"/><circle cx="300" cy="150" r="1"/><circle cx="350" cy="140" r=".9"/><circle cx="276" cy="170" r="1.1"/></g>
    </svg>`,
    tests: {
      stones: mini(`<path class="sw-faint" d="M6 54h84"/><path d="M18 54c-2-8 4-12 10-12s10 4 9 12"/><path d="M40 54c0-6 4-9 8-9s8 3 8 9"/><path d="M60 54c-1-10 6-15 12-14s9 6 8 14"/><path class="sw-tone" d="M48 30c4 0 8 3 8 7H40c0-4 4-7 8-7Z"/><path class="sw-faint" d="M48 26v-6"/>`),
      pinnacle: mini(`<path class="sw-faint" d="M4 58h88"/><path d="M30 58V20h30v38"/><path d="M26 20h38M30 14h30v6M36 14V8h18v6"/><path class="sw-faint" d="M36 30h6v8h-6zM48 30h6v8h-6zM36 44h6v8h-6zM48 44h6v8h-6z"/><path class="sw-tone sw-drop" d="M70 12v42"/>`),
      kingdoms: mini(`<path d="M8 50l22-30 12 14 10-12 30 28"/><path class="sw-faint" d="M4 58h88"/><path class="sw-faint" d="M58 54v-6h4v-3h4v3h4v6M74 54v-8h6v8M14 54v-5h5v5"/><path class="sw-tone" d="M30 20v-6"/>`),
    },
    close: `<svg viewBox="0 0 160 70" aria-hidden="true">
      <path class="sw-faint" d="M10 60h140"/>
      <path class="sw-clay" d="M60 56c-16 0-26-4-26-10s10-10 26-10 26 4 30 7l15 1c3 1 3 4 0 4l-15 2c-4 3-14 6-30 6Z"/>
      <path class="sw-flame" d="M107 44c-5-5-3-11 2-17 2 6 6 9 3 15-1 2-3 2-5 2Z"/>
    </svg>`,
  };
})();
