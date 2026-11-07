// The wisdom books: fixed drawings only. No data is ever spliced into these strings.
// The heading: a windlass over a mine shaft, the rope going down past veins of silver into the dark (Job 28:1–11).
// No face or figure of God is drawn.
window.WBArt = (() => {
  const hero = `<svg viewBox="0 0 320 320" role="img" aria-label="A windlass over a mine shaft, its rope going down past veins of silver into the dark">
  <circle class="wb-disc" cx="160" cy="160" r="150"/>
  <circle class="wb-orbit" cx="160" cy="160" r="156"/>
  <g class="wb-ground">
    <path d="M38 132 H128 M192 132 H282"/>
    <path class="wb-faint" d="M52 140 l6 -4 M70 141 l5 -5 M236 140 l6 -5 M258 141 l5 -4"/>
  </g>
  <g class="wb-rock">
    <path d="M44 168 C 80 160, 104 172, 128 166 M192 170 C 222 162, 250 174, 276 166"/>
    <path d="M40 204 C 76 198, 100 210, 128 204 M192 206 C 220 198, 252 212, 280 202"/>
    <path d="M52 240 C 86 234, 108 246, 128 240 M192 242 C 222 236, 246 246, 268 238"/>
  </g>
  <g class="wb-vein">
    <path d="M62 184 l10 -5 l9 6 l11 -4 l8 5"/>
    <path d="M214 222 l9 -6 l10 5 l12 -5 l9 4"/>
    <path d="M226 250 l8 -4 l10 4 l9 -3"/>
  </g>
  <path class="wb-shaft" d="M128 132 V250 M192 132 V250 M128 250 H192"/>
  <path class="wb-dark" d="M130 212 H190 V249 H130 Z"/>
  <g class="wb-frame">
    <path d="M118 132 L136 70 M202 132 L184 70 M128 70 H192"/>
    <circle cx="160" cy="70" r="9"/>
    <path d="M160 70 l14 -14 M169 61 h10"/>
  </g>
  <g class="wb-bucket">
    <path class="wb-rope" d="M160 79 V170"/>
    <path d="M148 170 h24 l-3 18 h-18 Z"/>
    <path class="wb-ore" d="M153 176 l4 -3 l5 3 l5 -2"/>
  </g>
</svg>`;

  // The four kinds of saying, each a shape so colour is never the only carrier.
  const kinds = {
    debate: `<svg viewBox="0 0 32 20" aria-hidden="true"><path d="M10 3 C 4 7, 4 13, 10 17 M22 3 C 28 7, 28 13, 22 17"/></svg>`,
    pair: `<svg viewBox="0 0 32 20" aria-hidden="true"><path d="M5 7 H27 M5 13 H27"/><path d="M16 2 V18" class="wb-faint"/></svg>`,
    arc: `<svg viewBox="0 0 32 20" aria-hidden="true"><path d="M6 15 C 6 3, 26 3, 26 12"/><circle cx="26" cy="17" r="1.4" class="wb-dot"/></svg>`,
    wave: `<svg viewBox="0 0 32 20" aria-hidden="true"><path d="M3 10 C 7 3, 11 3, 15 10 S 23 17, 29 10"/></svg>`,
  };

  // The close: the same shaft seen from above ground, the bucket at rest at the top.
  const close = `<svg viewBox="0 0 240 90" aria-hidden="true">
  <path d="M10 70 H96 M144 70 H230" class="wb-faint"/>
  <path class="wb-shaft" d="M96 70 V88 M144 70 V88"/>
  <path d="M88 70 L102 26 M152 70 L138 26 M102 26 H138"/>
  <circle cx="120" cy="26" r="6"/>
  <path d="M120 32 V44"/>
  <path d="M111 44 h18 l-2 12 h-14 Z"/>
</svg>`;

  return { hero, kinds, close };
})();
