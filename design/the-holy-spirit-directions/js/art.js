// The drawings for The Holy Spirit, in one hand: a thin stroke, round caps, a faint wash, the Gospels' colour as the
// study's colour. The motto is "Wind you cannot see. / A light that falls on Jesus." So the hero is a hillside with
// grass and a small tree bent by a wind that is not drawn, and a beam from beyond the circle falling on an empty cross.
// The lamp is never shown: a floodlight is not meant to be looked at. No face or figure of God, of Christ or of anyone.
// Fixed strings written here, never built from data.
window.HSArt = (() => {
  // A clump of grass blades, every one leaning the same way: the wind's direction, though the wind is not drawn.
  const grass = (x0, y, count, step, h) => Array.from({ length: count }, (_, i) => {
    const x = x0 + i * step + (i % 2) * 1.5, tall = h * [1, 0.72, 0.9, 0.6, 0.82][i % 5], lean = tall * 0.42;
    return `<path d="M${x} ${y}q${lean * 0.15} -${tall * 0.6} ${lean} -${tall}"/>`;
  }).join("");
  const leaves = (points) => points.map(([x, y, r], i) => `<ellipse class="hs-leaf hs-leaf-${i % 3}" cx="${x}" cy="${y}" rx="3.4" ry="1.6" transform="rotate(${r} ${x} ${y})"/>`).join("");
  const glyph = (body) => `<svg viewBox="0 0 48 32" aria-hidden="true" class="hs-glyph">${body}</svg>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <circle class="hs-ring" cx="210" cy="168" r="150"/>
      <ellipse class="hs-orbit" cx="210" cy="168" rx="200" ry="132"/>
      <path class="hs-beam" d="M-24 -40L46 -40L336 206L272 214Z"/>
      <path class="hs-beam-core" d="M2 -40L22 -40L316 204L292 208Z"/>
      <path class="hs-faint" d="M10 276c60-6 120-8 170-6"/>
      <path d="M168 276c34-30 74-56 118-64 44-6 84 20 124 64"/>
      <path class="hs-faint" d="M220 276c30-20 60-34 92-38"/>
      <g class="hs-cross"><path d="M304 212v-70M290 160h28"/></g>
      <path class="hs-faint" d="M292 212c6-2 18-2 24 0"/>
      <g class="hs-tree"><path d="M92 276c0-22 2-44 10-62s16-30 26-40"/>
        <path d="M102 222c12-4 26-4 38 0M108 204c10-8 22-12 34-12M120 184c8-6 18-8 28-6M98 240c-8-4-16-4-24-2"/>
        <path class="hs-faint" d="M140 222c8 2 14 6 18 10M142 192c8 0 16 4 20 8M148 178c6 0 12 2 16 6"/></g>
      ${leaves([[160, 230, 24], [164, 200, 14], [168, 182, 30], [150, 214, 40], [190, 214, 20], [214, 196, 34], [238, 222, 18]])}
      <g class="hs-sway">${grass(22, 277, 9, 6, 30)}</g>
      <g class="hs-sway hs-sway-2">${grass(120, 277, 7, 6, 24)}</g>
      <g class="hs-sway">${grass(354, 266, 6, 7, 22)}</g>
      <path class="hs-faint hs-wind" d="M20 112c36-12 76-12 112 0s70 10 100-2M44 146c30-8 60-8 88 0M250 82c30-10 64-10 96 0"/>
      <path class="hs-spark" d="M370 70h10m-5-5v10M68 64h8m-4-4v8M352 138h8m-4-4v8"/>
    </svg>`,
    close: `<svg viewBox="0 0 640 170" aria-hidden="true">
      <path class="hs-beam" d="M120 -10L170 -10L466 128L420 132Z"/>
      <path class="hs-faint" d="M0 150c120-8 260-10 380-8M360 150c50-30 110-46 150-46s80 22 130 46"/>
      <g class="hs-cross"><path d="M450 112v-50M438 76h24"/></g>
      <g class="hs-sway">${grass(24, 152, 18, 10, 22)}</g>
      <g class="hs-sway hs-sway-2">${grass(250, 150, 10, 9, 16)}</g>
      ${leaves([[230, 112, 20], [258, 124, 34], [282, 108, 12], [306, 120, 28]])}
      <path class="hs-faint hs-wind" d="M40 80c40-10 80-8 120 2M520 40c30-6 60-6 90 0"/>
      <path class="hs-spark" d="M560 30h8m-4-4v8M70 40h8m-4-4v8"/>
    </svg>`,
    // A small arrow for each of the four concepts: coming toward, down, in, out.
    glyphs: {
      "Promised": glyph(`<path class="hs-faint" d="M4 16h22" stroke-dasharray="2 4"/><path d="M26 16h10M32 11l5 5-5 5"/><circle class="hs-tone" cx="42" cy="16" r="3"/>`),
      "Poured out": glyph(`<path d="M14 4v14M24 2v18M34 4v14M10 14l4 4 4-4M20 16l4 4 4-4M30 14l4 4 4-4"/><path class="hs-tone" d="M6 27h36"/>`),
      "Living within": glyph(`<circle class="hs-tone" cx="30" cy="16" r="11"/><path d="M2 16h24M21 11l5 5-5 5"/>`),
      "Given for others": glyph(`<circle class="hs-tone" cx="24" cy="16" r="5"/><path d="M30 16h14M40 12l4 4-4 4M18 16H4M8 12l-4 4 4 4M24 10V2M24 22v8"/>`),
    },
    // The three places the light falls: an empty cross, a sprouting seed, three people as points joined by lines.
    targets: {
      jesus: `<path d="M24 40V6M14 16h20"/><path class="hs-faint" d="M8 44h32"/>`,
      life: `<path d="M24 42V24"/><path class="hs-tone" d="M24 28c-8 0-12-6-12-12 8 0 12 6 12 12ZM24 24c0-8 6-12 12-12 0 8-6 12-12 12Z"/><path class="hs-faint" d="M8 44h32"/>`,
      others: `<circle cx="10" cy="24" r="4"/><circle cx="24" cy="18" r="4"/><circle cx="38" cy="24" r="4"/><path class="hs-tone" d="M14 23l6-3M28 20l6 3"/><path class="hs-faint" d="M8 44h32"/>`,
    },
  };
})();
