// The drawings for Following Jesus, in one hand: a thin stroke, round caps, a faint wash, the Gospels' violet as the
// study's colour. The motto is "Hear the words. / Build on the rock." So the hero is the two houses of Matthew 7:24–27
// under the same slow rain: one on layered rock, one on sand, the second in a broken line because "it fell". No person
// is drawn, and no face or figure of God or of Christ. Fixed strings written here, never built from data.
window.FJArt = (() => {
  const mini = (body) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="fj-mini">${body}</svg>`;
  // Long diagonal strokes with a short dash: moving the dash along them reads as rain falling, and loops seamlessly.
  const rain = (xs, top, bottom) => xs.map((x, i) => `<path class="fj-rain" style="animation-delay:-${(i * 0.7) % 4}s" d="M${x} ${top}l-${Math.round((bottom - top) / 5)} ${bottom - top}"/>`).join("");
  const house = (x, y, w, h, roof, cls = "") => `<g class="${cls}"><path d="M${x} ${y}V${y - h}h${w}V${y}"/><path d="M${x - 8} ${y - h + 4}L${x + w / 2} ${y - h - roof}L${x + w + 8} ${y - h + 4}"/></g>`;
  return {
    hero: `<svg viewBox="0 0 440 340" aria-hidden="true">
      <ellipse class="fj-orbit" cx="220" cy="176" rx="206" ry="140"/>
      <path class="fj-faint" d="M58 96c6-14 26-16 36-4 8-10 26-8 30 6M300 74c8-14 28-14 36-2 10-8 26-4 28 8M168 58c6-10 20-10 26 0"/>
      <g class="fj-rainfall">${rain([96, 120, 146, 172, 198, 226, 252, 280, 306, 334, 360, 386], 104, 236)}</g>
      <path class="fj-faint" d="M26 150c36-12 64 6 98-4M330 136c30-10 56 4 84-4"/>
      ${house(76, 252, 92, 54, 40)}
      <path class="fj-glow" d="M112 252v-30h20v30Z"/><path class="fj-tone" d="M112 252v-30h20v30"/>
      <path class="fj-faint" d="M146 214h12v12h-12z"/>
      <path d="M40 252h172"/><path class="fj-rock" d="M48 264h156M60 276h132M78 288h98M96 300h62M92 252v12M150 264v12M118 276v12M164 276v12M128 288v12"/>
      <path class="fj-tone fj-water" d="M204 262c10-7 20 7 30 0s20 7 30 0M214 276c10-7 20 7 30 0s20 7 30 0"/>
      <g class="fj-fallen" transform="rotate(7 330 258)">${house(286, 258, 86, 50, 36)}<path d="M318 258v-26h18v26"/></g>
      <path class="fj-sand" d="M252 260h160"/>
      <path class="fj-faint" d="M262 268h2M282 272h2M304 267h2M330 271h2M356 268h2M380 272h2M398 267h2"/>
      <path class="fj-spark" d="M30 70h9m-4.5-4.5v9M402 104h9m-4.5-4.5v9M226 26h7m-3.5-3.5v7"/>
    </svg>`,
    close: `<svg viewBox="0 0 640 170" aria-hidden="true">
      <path class="fj-faint" d="M0 146h640"/>
      <path d="M150 146L262 64l34 22 52-46 124 106"/>
      <path class="fj-faint" d="M232 86l30-22 18 12M330 58l18-18 26 22"/>
      <path class="fj-tone fj-path" d="M300 146c8-14-10-22 2-34s-4-20 10-30 10-18 30-30"/>
      <path class="fj-faint" d="M24 156c20-5 40 5 60 0s40 5 60 0M60 164c20-5 40 5 60 0"/>
      <path class="fj-faint" d="M520 146c4-18 12-26 16-40M536 106c-10-2-16-10-16-16M536 112c8-4 14-12 14-20"/>
      <path class="fj-spark" d="M92 42h8m-4-4v8M580 30h8m-4-4v8M424 22h6m-3-3v6"/>
      <path class="fj-faint" d="M40 30h1M130 20h1M196 36h1M470 44h1M530 60h1M610 50h1"/>
    </svg>`,
    pairs: {
      gates: mini(`<path class="fj-faint" d="M6 56h84"/><path class="fj-faint" d="M50 56V24h36v32"/><path class="fj-faint" d="M50 24c0-10 36-10 36 0"/><path class="fj-tone" d="M16 56V30h12v26"/><path class="fj-tone" d="M16 30c0-7 12-7 12 0"/>`),
      trees: mini(`<path class="fj-faint" d="M6 56h84"/><path d="M26 56V34"/><path class="fj-tone" d="M26 36c-12 0-14-16-2-18 2-8 14-8 16 0 10 2 8 18-4 18Z"/><circle class="fj-fruit" cx="22" cy="28" r="2"/><circle class="fj-fruit" cx="30" cy="24" r="2"/><circle class="fj-fruit" cx="32" cy="32" r="2"/><path class="fj-faint" d="M70 56V30M70 40l-8-8M70 36l8-8M62 32l-3-3M78 28l3-3"/>`),
      lords: mini(`<path class="fj-faint" d="M6 56h84"/><path d="M14 56V22h22v34"/><path class="fj-glow" d="M18 56V26h14v30Z"/><path class="fj-tone" d="M18 56V26h14v30"/><path class="fj-faint" d="M60 56V22h22v34M60 22l22 34"/>`),
      builders: mini(`<path d="M8 48h34"/><path class="fj-rock" d="M10 54h30M14 60h22"/><path d="M14 48V34h22v14M10 35l15-11 15 11"/><g class="fj-fallen" transform="rotate(8 70 48)"><path d="M58 48V34h22v14M54 35l15-11 15 11"/></g><path class="fj-sand" d="M52 50h38"/>`),
    },
  };
})();
