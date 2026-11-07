// The drawings for What Scripture promises the sick, in one hand: a thin stroke, round caps, a faint wash, the
// Prophets' blue as the study's colour. The motto is Isaiah 38:5, "I have heard your prayer; / I have seen your tears."
// So the hero is a sickroom at night: a window with a thin moon and a faint line of dawn, the edge of an empty bed,
// a folded letter on the blanket, and a table with an oil lamp, a dish of pressed figs (Isaiah 38:21) and a flask of
// oil (James 5:14). No one is drawn, and no face or figure of God or of Christ. Fixed strings, never built from data.
window.IHArt = (() => {
  const mini = (body) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="ih-mini">${body}</svg>`;
  const spark = (x, y, s = 4) => `M${x - s} ${y}h${s * 2}M${x} ${y - s}v${s * 2}`;
  const windowFrame = (x, y, w, h) => `<path d="M${x} ${y + h}V${y + 18}a${w / 2} 18 0 0 1 ${w} 0V${y + h}Z"/>
      <path class="ih-faint" d="M${x + w / 2} ${y + 2}V${y + h}M${x} ${y + h * 0.55}h${w}"/>
      <path d="M${x - 8} ${y + h}h${w + 16}"/>`;
  const figs = (cx, cy) => `<path d="M${cx - 18} ${cy}h36c-2 6-8 9-18 9s-16-3-18-9Z"/>
      <circle class="ih-tone" cx="${cx - 8}" cy="${cy - 4}" r="4.2"/><circle class="ih-tone" cx="${cx + 1}" cy="${cy - 5}" r="4.6"/><circle class="ih-tone" cx="${cx + 9}" cy="${cy - 3.5}" r="3.8"/>`;
  const flask = (x, y) => `<path d="M${x - 3} ${y - 30}h6M${x - 2} ${y - 30}v8c-7 3-10 9-10 15 0 5 2 7 12 7s12-2 12-7c0-6-3-12-10-15v-8"/>
      <path class="ih-oil" d="M${x - 9} ${y - 6}c0 4 2 6 9 6s9-2 9-6Z"/>`;
  const lamp = (x, y, lit) => `<path d="M${x - 22} ${y}c4-10 36-10 40-2l10-4c-4 7-10 10-16 10H${x - 14}c-5 0-8-2-8-4Z"/>
      <path class="ih-faint" d="M${x - 2} ${y - 6}v-3"/>
      ${lit ? `<g class="ih-flame"><path class="ih-glow" d="M${x + 27} ${y - 6}c-7-6-3-15 1-22 5 8 7 15-1 22Z"/><path class="ih-tone" d="M${x + 27} ${y - 6}c-7-6-3-15 1-22 5 8 7 15-1 22Z"/></g>
      <circle class="ih-halo" cx="${x + 27}" cy="${y - 16}" r="34"/>`
    : `<path class="ih-faint ih-smoke" d="M${x + 28} ${y - 8}c-4-6 4-10 0-16s4-10 0-16"/>`}`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <circle class="ih-disc" cx="210" cy="168" r="152"/>
      <ellipse class="ih-orbit" cx="210" cy="168" rx="198" ry="136"/>
      <g class="ih-sky"><path class="ih-dawn" d="M262 156c20-10 56-10 76 0"/><path class="ih-faint" d="M262 156h76"/>
        <path class="ih-tone" d="M318 76a12 12 0 1 1-10-17 9 9 0 0 0 10 17Z"/>
        <path class="ih-spark" d="${spark(282, 82, 3)}${spark(300, 112, 2.5)}${spark(330, 124, 2.5)}"/></g>
      ${windowFrame(258, 46, 84, 112)}
      <path d="M22 286V196c0-8 6-12 14-12h10M22 236h214v50M236 214v22"/>
      <path d="M30 212c10-12 30-14 44-8M46 236c4-14 10-24 22-26 30-6 70-2 100 0 22 2 40 8 68 4"/>
      <path class="ih-faint" d="M70 236c8-12 24-20 46-20M120 236c10-10 30-14 54-12M84 222c30-6 70-4 104 2"/>
      <path d="M150 214l22-8 22 6-22 8Z"/><path class="ih-faint" d="M158 213l14-5M162 216l14-5M172 206v14"/>
      <path d="M256 236h138M266 236v50M384 236v50M262 252h126"/>
      ${lamp(286, 230, true)}
      ${figs(338, 232)}
      ${flask(372, 236)}
      <path class="ih-faint" d="M8 286h404"/>
      <path class="ih-spark" d="${spark(52, 70)}${spark(150, 44, 3)}${spark(392, 190, 3)}"/>
    </svg>`,
    close: `<svg viewBox="0 0 640 170" aria-hidden="true">
      <path class="ih-faint" d="M0 150h640"/>
      <path class="ih-dawn-up" d="M380 120a40 40 0 0 1 80 0Z"/>
      <path class="ih-faint" d="M372 120h96M420 64v-12M384 80l-8-8M456 80l8-8"/>
      ${windowFrame(372, 30, 96, 90)}
      <path d="M150 150V128h138v22M160 128v-6M278 128v-6"/>
      ${lamp(186, 122, false)}
      ${figs(236, 124)}
      ${flask(270, 128)}
      <path class="ih-spark" d="${spark(560, 40, 3)}${spark(90, 56, 3)}"/>
    </svg>`,
    parts: {
      "01": mini(`<path class="ih-faint" d="M6 56h84"/><path d="M18 56c6-12 18-18 30-18s24 6 30 18"/><path class="ih-tone" d="M58 30l10-6 6 8-12 4Z"/><path class="ih-faint" d="M30 50h4M42 46h4M54 50h4M66 46h4"/>`),
      "02": mini(`<path d="M32 56c-8-14-8-30 2-44M64 56c8-14 8-30-2-44M34 14h28M34 56h28"/><path class="ih-tone" d="M42 16v38M48 15v40M54 16v38"/>`),
      "03": mini(figs(48, 40) + `<path class="ih-faint" d="M6 52h84"/>`),
      "04": mini(`<path class="ih-faint" d="M6 50c14-3 26 3 40 0s28-3 44 0"/><path d="M12 44h22v6M18 44v-8"/><path class="ih-tone" d="M58 40h26l-4 6H62Z"/><path class="ih-tone" d="M71 40V20l10 16"/>`),
      "05": mini(`<path d="M20 10c10 6 46 6 56 0l-4 32c-12 4-36 4-48 0Z"/><path class="ih-tone" d="M30 44v10M40 45v12M50 45v12M60 45v12M70 44v10"/>`),
      "06": mini(flask(48, 54)),
      "07": mini(`<path class="ih-faint" d="M6 56c20-10 64-10 84 0"/><path class="ih-dawn-up" d="M64 48a12 12 0 0 1 24 0Z"/><path d="M40 52V12M30 22h20"/>`),
    },
    // The register's outcome marks: the shape carries the meaning, so colour never does it alone.
    mark: {
      recovered: `<svg viewBox="0 0 20 20" aria-hidden="true" class="ih-mark"><circle cx="10" cy="10" r="6.5" class="ih-fill"/></svg>`,
      heard: `<svg viewBox="0 0 20 20" aria-hidden="true" class="ih-mark"><circle cx="10" cy="10" r="6.5"/><circle cx="10" cy="10" r="2.4" class="ih-fill"/></svg>`,
      kept: `<svg viewBox="0 0 20 20" aria-hidden="true" class="ih-mark"><circle cx="10" cy="10" r="6.5"/><path d="M5.5 14.5l9-9"/></svg>`,
      left: `<svg viewBox="0 0 20 20" aria-hidden="true" class="ih-mark"><path d="M14.6 5.4A6.5 6.5 0 1 0 16.5 10"/></svg>`,
      untold: `<svg viewBox="0 0 20 20" aria-hidden="true" class="ih-mark"><circle cx="10" cy="10" r="6.5" stroke-dasharray="2 2.6"/></svg>`,
      dark: `<svg viewBox="0 0 20 20" aria-hidden="true" class="ih-mark"><circle cx="10" cy="10" r="6.5"/><path class="ih-fill-ink" d="M10 3.5a6.5 6.5 0 0 1 0 13Z"/></svg>`,
    },
    questions: [
      `<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="12" r="7"/><path d="M10 18l-2 7 6-3 6 3-2-7"/><path class="ih-tone" d="M14 8.5v7M10.5 12h7"/></svg>`,
      `<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M3 18h22"/><path class="ih-tone" d="M8 18a6 6 0 0 1 12 0"/><path class="ih-faint" d="M3 22h22" stroke-dasharray="2 3"/></svg>`,
      `<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M7 9c-2 2-3 5-2 8M11 9c-2 2-3 5-2 8"/><path class="ih-tone" d="M17 19c2-2 3-5 2-8M21 19c2-2 3-5 2-8"/></svg>`,
    ],
  };
})();
