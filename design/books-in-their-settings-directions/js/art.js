// The drawings for Reading the Bible well, in one hand: a thin stroke, round caps, a faint wash, the Poetry teal of
// Psalm 119 as the study's colour and gold for the one flame. The hero is the motto drawn: a clay oil lamp set low on
// a path of stepping stones; its light falls on the next three stones and the rest of the path is only dotted
// ("a lamp to my feet", Psalm 119:105). The flame keeps breathing; nothing plays once and stops. No person is drawn.
// Fixed strings written here, never built from data. No inline styles (the page's security policy forbids them).
window.RBWArt = (() => {
  // A flat stepping stone seen from the side and a little above: an uneven oval with a lip.
  const stone = (x, y, w, cls = "") => `<g class="${cls}">
      <path class="rbw-stone-top" d="M${x - w} ${y}c${w * .2} ${-w * .34} ${w * 1.7} ${-w * .38} ${w * 2} ${-w * .04}c${w * .1} ${w * .26} ${-w * 1.5} ${w * .4} ${-w * 2} ${w * .04}z"/>
      <path d="M${x - w} ${y}c${w * .2} ${-w * .34} ${w * 1.7} ${-w * .38} ${w * 2} ${-w * .04}c${w * .1} ${w * .26} ${-w * 1.5} ${w * .4} ${-w * 2} ${w * .04}z"/>
      <path class="rbw-faint" d="M${x - w * .98} ${y + 1}c${0} ${w * .12} ${w * .5} ${w * .26} ${w * 1.1} ${w * .22}"/>
    </g>`;
  // The lamp: a round clay body, its filling hole, a nozzle to the right and a ring handle to the left; the flame on
  // the nozzle. s scales it; (x, y) is the foot.
  const lamp = (x, y, s, glow = true) => `<g class="rbw-lamp">
      ${glow ? `<ellipse class="rbw-glow" cx="${x + 46 * s}" cy="${y - 34 * s}" rx="${34 * s}" ry="${30 * s}"/>` : ""}
      <path class="rbw-clay" d="M${x - 30 * s} ${y - 14 * s}c${2 * s} ${-16 * s} ${44 * s} ${-20 * s} ${58 * s} ${-6 * s}l${18 * s} ${-4 * s}c${6 * s} ${-1 * s} ${8 * s} ${6 * s} ${2 * s} ${9 * s}l${-20 * s} ${8 * s}c${-12 * s} ${10 * s} ${-52 * s} ${10 * s} ${-58 * s} ${-7 * s}z"/>
      <path d="M${x - 30 * s} ${y - 14 * s}c${2 * s} ${-16 * s} ${44 * s} ${-20 * s} ${58 * s} ${-6 * s}l${18 * s} ${-4 * s}c${6 * s} ${-1 * s} ${8 * s} ${6 * s} ${2 * s} ${9 * s}l${-20 * s} ${8 * s}c${-12 * s} ${10 * s} ${-52 * s} ${10 * s} ${-58 * s} ${-7 * s}z"/>
      <ellipse cx="${x - 2 * s}" cy="${y - 19 * s}" rx="${7 * s}" ry="${2.4 * s}"/>
      <path class="rbw-faint" d="M${x - 18 * s} ${y - 21 * s}c${8 * s} ${-4 * s} ${24 * s} ${-5 * s} ${34 * s} ${-1 * s}M${x - 24 * s} ${y - 9 * s}c${14 * s} ${5 * s} ${36 * s} ${5 * s} ${48 * s} ${-1 * s}"/>
      <path d="M${x - 30 * s} ${y - 13 * s}c${-12 * s} ${-2 * s} ${-14 * s} ${-14 * s} ${-3 * s} ${-14 * s}"/>
      <path d="M${x - 20 * s} ${y - 1 * s}l${-2 * s} ${5 * s}h${36 * s}l${-2 * s} ${-5 * s}"/>
      <path class="rbw-flame" d="M${x + 46 * s} ${y - 19 * s}c${-7 * s} ${-5 * s} ${-6 * s} ${-17 * s} ${1 * s} ${-26 * s}c${6 * s} ${9 * s} ${6 * s} ${20 * s} ${-1 * s} ${26 * s}z"/>
      <path class="rbw-flame-core" d="M${x + 46 * s} ${y - 20 * s}c${-2 * s} ${-3 * s} ${-2 * s} ${-8 * s} ${.5 * s} ${-11 * s}c${2 * s} ${4 * s} ${2 * s} ${8 * s} ${-.5 * s} ${11 * s}z"/>
    </g>`;
  const mini = (body, box = "0 0 32 24") => `<svg viewBox="${box}" aria-hidden="true" class="rbw-mini">${body}</svg>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <circle class="rbw-disc" cx="210" cy="168" r="150"/>
      <circle class="rbw-orbit" cx="210" cy="168" r="162"/>
      <path class="rbw-edge" d="M120 300c70-22 150-62 206-112"/>
      <path class="rbw-edge" d="M232 306c48-26 92-62 120-100"/>
      <ellipse class="rbw-pool" cx="214" cy="250" rx="132" ry="46"/>
      <ellipse class="rbw-pool rbw-pool-in" cx="180" cy="262" rx="80" ry="26"/>
      ${stone(200, 276, 30, "rbw-lit")}
      ${stone(268, 246, 25, "rbw-lit")}
      ${stone(318, 216, 20, "rbw-lit")}
      ${stone(350, 190, 14, "rbw-dark")}
      ${stone(368, 168, 10, "rbw-dark")}
      ${stone(378, 150, 7, "rbw-dark")}
      <path class="rbw-path-on" d="M384 138c3-8 4-16 4-24"/>
      ${lamp(104, 270, 1.45)}
      <path class="rbw-spark" d="M118 92h10M123 87v10"/>
      <path class="rbw-spark rbw-s2" d="M176 64h6M179 61v6"/>
      <path class="rbw-spark rbw-s3" d="M92 140h6M95 137v6"/>
      <path class="rbw-spark rbw-s2" d="M250 106h6M253 103v6"/>
    </svg>`,
    close: `<svg viewBox="0 0 300 150" aria-hidden="true">
      <ellipse class="rbw-pool" cx="150" cy="120" rx="96" ry="22"/>
      ${stone(170, 124, 22, "rbw-lit")}
      ${stone(226, 106, 15, "rbw-dark")}
      ${stone(262, 92, 10, "rbw-dark")}
      ${lamp(84, 132, .9)}
    </svg>`,
    stoneLamp: mini(`${lamp(18, 30, .32, false)}`, "0 0 40 34"),
    fish: mini(`<path d="M4 12c6-7 16-7 21 0c-5 7-15 7-21 0zM25 12l5-5v10z"/><circle class="rbw-dot" cx="9" cy="11" r="1.1"/>`),
    vine: mini(`<path d="M6 22c4-6 4-12 10-16M16 6c3 0 6 2 7 5c-3 1-6 0-7-5zM10 14c-3-2-6-1-7 1c2 2 5 2 7-1zM13 9c-2-3-1-6 1-7c1 2 1 5-1 7z"/>`),
    worm: mini(`<path d="M4 16c3-6 6-6 8 0s5 6 8 0s5-6 8 0"/><circle class="rbw-dot" cx="28" cy="16" r="1.2"/>`),
    wind: mini(`<path d="M3 9h18c4 0 4-5 0-5M3 14h24c4 0 4 6 0 6M3 19h10"/>`),
  };
})();
