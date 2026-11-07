// The drawings for Fear, anxiety and despair, in one hand: a thin stroke, round caps, faint washes, the Poetry teal as
// the study's colour. The hero is the motto drawn (1 Kings 19:5–7): night in the wilderness, a broom tree, a cloak
// left on the ground where someone slept, and by its head a cake of bread on hot coals and a jar of water; a path
// leaves toward a far mountain, because "the journey will be too much for you". The coals smoke and the stars turn
// slowly, on a loop. No person, no face, no figure of God or of Christ. The close is the same road at first light,
// arriving at the mouth of a cave on Horeb, after the wind, the earthquake and the fire.
// Fixed strings written here, never built from data. No inline styles (the page's security policy forbids them).
window.FADArt = (() => {
  const mini = (body) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="fad-mini">${body}</svg>`;
  const spark = (x, y, r = 4) => `<path class="fad-spark" d="M${x - r} ${y}h${2 * r}M${x} ${y - r}v${2 * r}"/>`;
  const stars = (list) => list.map(([x, y, r]) => spark(x, y, r)).join("");
  // A broom tree: a low trunk splitting into thin wands, with small leaf strokes along them.
  const broom = (x, y, s) => `<g class="fad-broom">
      <path d="M${x} ${y}c${2 * s} ${-18 * s} ${-2 * s} ${-30 * s} ${-14 * s} ${-52 * s}M${x} ${y}c${4 * s} ${-22 * s} ${10 * s} ${-36 * s} ${22 * s} ${-58 * s}M${x - 2 * s} ${y - 20 * s}c${-14 * s} ${-8 * s} ${-26 * s} ${-12 * s} ${-40 * s} ${-26 * s}M${x + 4 * s} ${y - 26 * s}c${14 * s} ${-6 * s} ${28 * s} ${-14 * s} ${40 * s} ${-28 * s}M${x} ${y - 30 * s}c${0} ${-14 * s} ${2 * s} ${-30 * s} ${4 * s} ${-44 * s}"/>
      <path class="fad-faint fad-sway" d="M${x - 14 * s} ${y - 52 * s}l${-6 * s} ${-6 * s}M${x - 10 * s} ${y - 44 * s}l${-7 * s} ${-3 * s}M${x + 22 * s} ${y - 58 * s}l${5 * s} ${-7 * s}M${x + 16 * s} ${y - 48 * s}l${8 * s} ${-3 * s}M${x - 40 * s} ${y - 46 * s}l${-6 * s} ${-4 * s}M${x - 30 * s} ${y - 40 * s}l${-4 * s} ${-6 * s}M${x + 44 * s} ${y - 54 * s}l${6 * s} ${-4 * s}M${x + 34 * s} ${y - 46 * s}l${4 * s} ${-6 * s}M${x + 4 * s} ${y - 74 * s}l${-3 * s} ${-7 * s}M${x + 4 * s} ${y - 64 * s}l${5 * s} ${-5 * s}"/>
    </g>`;
  // Bread on hot coals, with smoke that rises on a loop, and a jar of water beside it.
  const bread = (x, y, s) => `<g class="fad-bread">
      <path class="fad-coal" d="M${x - 16 * s} ${y}c${4 * s} ${-4 * s} ${8 * s} ${-4 * s} ${10 * s} 0M${x - 6 * s} ${y}c${4 * s} ${-5 * s} ${10 * s} ${-5 * s} ${12 * s} 0M${x + 6 * s} ${y}c${3 * s} ${-4 * s} ${8 * s} ${-4 * s} ${10 * s} 0"/>
      <ellipse class="fad-wash" cx="${x}" cy="${y - 7 * s}" rx="${13 * s}" ry="${4.5 * s}"/>
      <ellipse cx="${x}" cy="${y - 7 * s}" rx="${13 * s}" ry="${4.5 * s}"/>
      <path class="fad-smoke" d="M${x - 4 * s} ${y - 14 * s}c${-4 * s} ${-6 * s} ${4 * s} ${-10 * s} 0 ${-18 * s}s${4 * s} ${-12 * s} 0 ${-18 * s}"/>
      <path class="fad-smoke fad-smoke2" d="M${x + 4 * s} ${y - 14 * s}c${4 * s} ${-6 * s} ${-4 * s} ${-10 * s} 0 ${-18 * s}s${-4 * s} ${-12 * s} 0 ${-18 * s}"/>
      <path class="fad-wash" d="M${x + 24 * s} ${y}c${-5 * s} 0 ${-6 * s} ${-12 * s} ${-2 * s} ${-16 * s}l0 ${-5 * s}h${8 * s}l0 ${5 * s}c${4 * s} ${4 * s} ${3 * s} ${16 * s} ${-2 * s} ${16 * s}z"/>
      <path d="M${x + 24 * s} ${y}c${-5 * s} 0 ${-6 * s} ${-12 * s} ${-2 * s} ${-16 * s}l0 ${-5 * s}h${8 * s}l0 ${5 * s}c${4 * s} ${4 * s} ${3 * s} ${16 * s} ${-2 * s} ${16 * s}zM${x + 21 * s} ${y - 9 * s}h${10 * s}"/>
    </g>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <circle class="fad-disc" cx="210" cy="168" r="150"/>
      <circle class="fad-orbit" cx="210" cy="168" r="162"/>
      <g class="fad-sky">${stars([[120, 70, 3], [170, 52, 2.5], [262, 62, 3.5], [300, 96, 2.5], [96, 118, 2], [236, 40, 2]])}</g>
      <path class="fad-moon" d="M318 70a16 16 0 1 0 8 26a12 12 0 1 1 -8 -26z"/>
      <path class="fad-faint" d="M70 230c40-6 80-4 120-8s90-2 160 4"/>
      <path class="fad-faint fad-dash" d="M238 236c24-8 50-24 70-44s34-40 44-58"/>
      <path class="fad-mount" d="M318 150l18-30 12 14 10-18 22 34"/>
      ${broom(150, 238, 1.15)}
      <path class="fad-wash" d="M110 250c14-8 46-10 70-6s30 10 10 14-62 4-80-8z"/>
      <path d="M110 250c14-8 46-10 70-6s30 10 10 14-62 4-80-8zM132 247c10 2 22 2 34 0"/>
      ${bread(214, 252, 1.1)}
      <path class="fad-faint" d="M60 268h300"/>
    </svg>`,
    close: `<svg viewBox="0 0 420 200" aria-hidden="true">
      <path class="fad-dawn" d="M30 170h360"/>
      <circle class="fad-glow" cx="300" cy="170" r="44"/>
      <path class="fad-faint" d="M300 120v-14M262 132l-9-10M338 132l9-10"/>
      <path class="fad-wash" d="M120 170l40-70 26 22 30-52 50 100z"/>
      <path d="M120 170l40-70 26 22 30-52 50 100z"/>
      <path d="M196 170c0-16 8-26 18-26s18 10 18 26"/>
      <path class="fad-faint fad-dash" d="M30 186c40-8 90-14 160-16"/>
      <path class="fad-still" d="M240 150c14-2 26-2 40 0"/>
      ${spark(96, 70, 3)}${spark(352, 60, 3.5)}
    </svg>`,
    parts: {
      // 01 The Tent of Meeting, with seventy small marks for the elders gathered round it.
      "01": mini(`<path class="fad-wash" d="M36 46l12-16 12 16z"/><path d="M36 46l12-16 12 16zM48 30v-6"/>${Array.from({ length: 70 }, (_, i) => { const a = (i / 70) * Math.PI * 2; return `<circle class="fad-dot" cx="${(48 + Math.cos(a) * 30).toFixed(1)}" cy="${(40 + Math.sin(a) * 15).toFixed(1)}" r=".9"/>`; }).join("")}`),
      // 02 The broom tree and the bread by its foot.
      "02": mini(`${broom(40, 56, .55)}${bread(66, 56, .55)}`),
      // 03 A scroll, open, with a small flame shut up in it (Jeremiah 20:9).
      "03": mini(`<path class="fad-wash" d="M24 22h48v26H24z"/><path d="M24 22h48v26H24zM24 22c-4 0-4 26 0 26M72 22c4 0 4 26 0 26M32 30h18M32 36h24M32 42h14"/><path class="fad-flame" d="M62 42c-4-3-3-9 1-13 3 4 3 10-1 13z"/>`),
      // 04 Streams of water, where the deer of Psalm 42:1 comes to drink (water only).
      "04": mini(`<path class="fad-tone" d="M14 40c10-4 20 4 30 0s20-4 30 0 14 2 14 2"/><path class="fad-faint" d="M18 48c10-4 20 4 30 0s20-4 30 0M22 32c8-3 16 3 24 0"/>${spark(70, 18, 3)}`),
      // 05 A small bottle, for "Put my tears in Your bottle" (Psalm 56:8).
      "05": mini(`<path class="fad-wash" d="M40 54c-8 0-10-16-2-22v-10h12v10c8 6 6 22-2 22z"/><path d="M40 54c-8 0-10-16-2-22v-10h12v10c8 6 6 22-2 22zM37 22h14"/><path class="fad-drop" d="M64 24c-3 4-3 7 0 7s3-3 0-7z"/>`),
      // 06 Waters and a fire, with a path through both (Isaiah 43:2).
      "06": mini(`<path class="fad-tone" d="M10 44c6-3 12 3 18 0s12-3 18 0"/><path class="fad-faint" d="M10 50c6-3 12 3 18 0s12-3 18 0"/><path class="fad-flame" d="M66 50c-6-4-5-14 2-20 5 6 5 16-2 20z"/><path class="fad-faint fad-dash" d="M6 56h84"/>`),
    },
  };
})();
