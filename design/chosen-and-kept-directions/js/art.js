// The drawings for Chosen and kept, in one hand: a thin stroke, round caps, a faint wash, four-point sparkles. The motto
// is "Two hands. One grip. / No one snatches." (John 10:28-29). So the hero is a small flock asleep in a low stone fold
// at night, inside the heading's own two rings (the faint circle and the dotted orbit), with a line of tracks that comes
// along the outer ring and turns away. No hand, face or figure of God, of Christ or of the Father is drawn.
// Fixed strings written here, never built from data.
window.CKArt = (() => {
  // One sheep, side on. Lying sheep have no legs; one standing sheep lifts its head to listen (John 10:27).
  const sheep = (x, y, s, lying, flip) => {
    const k = flip ? -1 : 1;
    const legs = lying ? "" : `<path d="M${x - 8 * s} ${y + 7 * s}v${7 * s}M${x - 3 * s} ${y + 8 * s}v${6 * s}M${x + 4 * s} ${y + 8 * s}v${6 * s}M${x + 9 * s} ${y + 7 * s}v${7 * s}"/>`;
    return `<g class="ck-sheep${lying ? "" : " ck-listen"}">
      <path class="ck-wool" d="M${x - 14 * s} ${y + 2 * s}c-2-6 3-10 8-9c1-5 8-6 11-3c3-4 10-3 11 2c5 0 7 5 5 9c1 5-4 8-9 7c-4 3-12 3-16 0c-6 1-11-2-10-6z"/>
      <path d="M${x + k * 14 * s} ${y - 1 * s}c${k * 3 * s} ${-5 * s} ${k * 9 * s} ${-5 * s} ${k * 10 * s} ${1 * s}c${k * 1 * s} ${4 * s} ${k * -3 * s} ${7 * s} ${k * -7 * s} ${6 * s}"/>
      <path d="M${x + k * 17 * s} ${y - 3 * s}l${k * -2 * s} ${-3 * s}"/>${legs}</g>`;
  };
  // A paw print: one pad and three toes.
  const paw = (x, y, r, i) => `<g class="ck-paw ck-paw-${i % 6}" transform="rotate(${r} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="2.6" ry="2.2"/><circle cx="${x - 2.6}" cy="${y - 3.4}" r=".9"/><circle cx="${x}" cy="${y - 4.2}" r=".9"/><circle cx="${x + 2.6}" cy="${y - 3.4}" r=".9"/></g>`;
  // A low round wall of stones seen from a little above: its top edge all round, its foot along the near side, and the
  // joints between stones on the near side, where the face of the wall shows.
  const wall = (cx, cy, rx, ry, tall, n) => {
    const at = (a, dy = 0) => `${(cx + rx * Math.cos(a)).toFixed(1)} ${(cy + ry * Math.sin(a) + dy).toFixed(1)}`;
    const joints = Array.from({ length: n }, (_, i) => { const a = (Math.PI * (i + 0.5)) / n; return `M${at(a)}L${at(a, tall)}`; }).join("");
    const back = Array.from({ length: n }, (_, i) => { const a = Math.PI + (Math.PI * (i + 0.5)) / n; return `M${at(a)}L${at(a, -tall * 0.35)}`; }).join("");
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/><path d="M${at(0)}L${at(0, tall)}A${rx} ${ry} 0 0 1 ${at(Math.PI, tall)}L${at(Math.PI)}"/>
      <path class="ck-joint" d="${joints}"/><path class="ck-joint ck-faint" d="${back}"/>`;
  };
  const spark = (x, y, r) => `<path class="ck-spark" d="M${x} ${y - r}L${x + r * 0.22} ${y - r * 0.22}L${x + r} ${y}L${x + r * 0.22} ${y + r * 0.22}L${x} ${y + r}L${x - r * 0.22} ${y + r * 0.22}L${x - r} ${y}L${x - r * 0.22} ${y - r * 0.22}Z"/>`;
  const glyph = (body) => `<svg viewBox="0 0 32 32" aria-hidden="true" class="ck-glyph">${body}</svg>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <circle class="ck-ring" cx="210" cy="168" r="150"/>
      <ellipse class="ck-orbit" cx="210" cy="168" rx="200" ry="132"/>
      ${spark(120, 70, 7)}${spark(300, 58, 5)}${spark(342, 118, 4)}${spark(84, 128, 4)}
      <path class="ck-faint" d="M246 52a26 26 0 1 0 22 40a20 20 0 1 1 -22 -40z"/>
      <path class="ck-faint" d="M62 236c40-18 90-26 148-26s110 8 150 26"/>
      <g class="ck-wall">${wall(210, 222, 118, 36, 14, 14)}</g>
      ${sheep(150, 214, 1.35, true, false)}${sheep(268, 212, 1.3, true, true)}${sheep(214, 232, 1.45, true, true)}
      ${sheep(196, 196, 1.25, false, true)}${sheep(250, 190, 1.05, true, false)}
      <g class="ck-tracks">${[[26, 120, 150], [34, 102, 140], [46, 86, 128], [60, 72, 118], [76, 60, 104], [92, 52, 84], [110, 48, 66], [126, 50, 44]].map(([x, y, r], i) => paw(x, y, r, i)).join("")}</g>
    </svg>`,
    close: `<svg viewBox="0 0 640 150" aria-hidden="true">
      <path class="ck-faint" d="M0 128c120-10 240-14 340-12s200 6 300 14"/>
      <path class="ck-sun" d="M520 112a34 34 0 0 1 68 0"/>
      <path class="ck-faint" d="M554 66v-12M520 76l-8-8M588 76l8-8"/>
      <g class="ck-wall">${wall(250, 108, 96, 20, 9, 12)}</g>
      ${sheep(212, 100, 1.05, false, false)}${sheep(262, 110, 1, true, true)}${sheep(300, 98, 0.95, false, true)}
      ${spark(90, 40, 5)}${spark(420, 30, 4)}
    </svg>`,
    // Two fields, one rain (Hebrews 6:7-8): rows of grain on the left, thorns on the right.
    fields: `<svg viewBox="0 0 640 190" aria-hidden="true">
      <g class="ck-rain">${Array.from({ length: 30 }, (_, i) => `<path d="M${20 + i * 21} ${8 + (i % 4) * 9}l-5 14"/>`).join("")}</g>
      <path d="M20 160h270M350 160h270"/>
      <g class="ck-grain">${Array.from({ length: 13 }, (_, i) => { const x = 34 + i * 20; return `<path d="M${x} 160v-46"/><path class="ck-head" d="M${x} 114c-4-6-4-14 0-20c4 6 4 14 0 20zM${x} 126l-6-6M${x} 126l6-6"/>`; }).join("")}</g>
      <g class="ck-thorn">${Array.from({ length: 7 }, (_, i) => { const x = 370 + i * 36; return `<path d="M${x} 160c2-14-4-24 2-36m-2 36c8-10 18-14 20-26m-10 14l6-2m-14-10l-6-4m8-8l5-4m12 6l5 2"/>`; }).join("")}</g>
    </svg>`,
    // The four purposes: a song rising, a promise holding, a warning over a field, an answer turning back.
    glyphs: {
      praise: glyph(`<path d="M6 26c5-7 10-10 18-11M8 19c4-5 9-8 16-9M10 12c4-4 8-6 14-6"/>`),
      comfort: glyph(`<circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="6"/><circle class="ck-fill" cx="16" cy="16" r="2.2"/>`),
      warn: glyph(`<path d="M4 25h24M6 25l3-7 3 7 3-7 3 7 3-7 3 7 3-7 3 7"/><path d="M16 4v8M16 15v.5"/>`),
      answer: glyph(`<path d="M5 11h19l-4-4M24 11l-4 4M27 21H8l4-4M8 21l4 4"/>`),
    },
  };
})();
