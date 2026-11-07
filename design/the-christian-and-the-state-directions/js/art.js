// The drawings for The Christian and the state, in one hand: a thin stroke, round caps, a faint wash, Gospels & Acts
// violet as the study's colour. The hero is a Roman coin with an emperor's laurelled head, small inside the large faint
// circle: the second column is larger, and Caesar is inside it (Mark 12:17). The head is the emperor's; no face or
// figure of God, of Christ or of the Father is drawn anywhere. Fixed strings written here, never built from data.
window.CSArt = (() => {
  const beads = (cx, cy, r, n) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `<circle class="cs-bead" cx="${(cx + r * Math.cos(a)).toFixed(1)}" cy="${(cy + r * Math.sin(a)).toFixed(1)}" r="1.1"/>`;
  }).join("");
  // Letters on a coin are drawn as short marks: illustrative, not a legend to be read.
  const legend = (cx, cy, r, from, to, n) => Array.from({ length: n }, (_, i) => {
    const a = (from + ((to - from) * i) / (n - 1)) * Math.PI / 180;
    const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    const dx = 3.2 * Math.cos(a), dy = 3.2 * Math.sin(a);
    return `<path class="cs-faint" d="M${(x - dx).toFixed(1)} ${(y - dy).toFixed(1)}L${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)}"/>`;
  }).join("");
  const leaf = (x, y, r) => `<path class="cs-leaf" transform="translate(${x} ${y}) rotate(${r})" d="M0 0c4-6 12-7 16-3-5 4-11 6-16 3Z"/>`;
  const head = `
      <path d="M222 108c-14-4-30 2-38 16-6 10-6 22-2 30l-8 12c-2 3 0 5 3 5h7l-1 8c0 3 2 5 5 5h6l1 9c1 6 6 9 12 8l10-2 4 16"/>
      <path d="M190 194c10 4 24 6 40 4"/>
      <path class="cs-tone" d="M224 104c10 4 18 14 20 28 2 16-2 30-10 40"/>
      ${leaf(186, 118, -60)}${leaf(196, 106, -35)}${leaf(210, 100, -10)}${leaf(226, 100, 15)}${leaf(238, 108, 40)}${leaf(246, 122, 65)}${leaf(248, 138, 88)}${leaf(244, 154, 112)}
      <path class="cs-tone" d="M240 166c6 4 10 12 10 20M244 168c8 2 14 8 16 16"/>
      <path class="cs-faint" d="M214 132c4-2 8-2 11 1"/>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <circle class="cs-disc" cx="210" cy="160" r="150"/>
      <ellipse class="cs-orbit" cx="210" cy="160" rx="198" ry="132"/>
      <ellipse class="cs-shadow" cx="216" cy="252" rx="86" ry="10"/>
      <circle class="cs-coin" cx="214" cy="152" r="86"/>
      <circle class="cs-tone" cx="214" cy="152" r="86"/>
      <circle class="cs-faint" cx="214" cy="152" r="78"/>
      ${beads(214, 152, 82, 72)}
      ${legend(214, 152, 68, 150, 30, 14)}
      <g transform="translate(6 2)">${head}</g>
      <path class="cs-glint" d="M156 96c10-14 26-24 44-28"/>
      <path class="cs-spark" d="M66 70h10m-5-5v10M352 92h8m-4-4v8M330 236h8m-4-4v8"/>
    </svg>`,
    close: `<svg viewBox="0 0 640 160" aria-hidden="true">
      <path class="cs-faint" d="M0 138h640"/>
      <path class="cs-faint" d="M40 136c120-18 260-26 400-26M60 128c120-22 260-32 420-32M90 120c110-24 240-38 410-40"/>
      <path class="cs-tone" d="M440 110l46-10c14-3 26 2 32 12l6 12-58 6c-12 1-22-6-26-20Z"/>
      <path d="M486 100l26-52M512 48l40-10M520 60l34-8"/>
      <path class="cs-faint" d="M470 130l-30 8"/>
      ${[120, 200, 280, 360].map((x, i) => `<path class="cs-sprout" style="animation-delay:-${i * 1.7}s" d="M${x} 112c0-6 0-10 2-14M${x + 2} 104c4-3 8-3 11 0M${x + 1} 106c-4-3-8-3-10 0"/>`).join("")}
      <path class="cs-spark" d="M580 34h8m-4-4v8M70 44h8m-4-4v8"/>
    </svg>`,
    // The six "will take" lines run to this seat. An empty seat: the office, not a person.
    seat: `<svg viewBox="0 0 120 140" aria-hidden="true">
      <path class="cs-tone" d="M30 20h60v60H30Z"/>
      <path d="M22 80h76M30 80v44M90 80v44M22 80v-14h8M98 80v-14h-8"/>
      <path class="cs-faint" d="M40 32h40M40 44h40M40 56h40M14 124h92"/>
    </svg>`,
    // Isaiah 2:2–4, one small drawing for each step.
    steps: {
      mountain: `<svg viewBox="0 0 80 56" aria-hidden="true"><path d="M6 50l28-38 14 18 8-10 18 30Z"/><path class="cs-tone" d="M34 12v-6M10 30c6 2 12 8 14 14M70 30c-6 2-12 8-14 14"/></svg>`,
      scroll: `<svg viewBox="0 0 80 56" aria-hidden="true"><path d="M16 10h48v36H16Z"/><path class="cs-tone" d="M12 10a4 4 0 0 1 8 0v36a4 4 0 0 1-8 0ZM60 10a4 4 0 0 1 8 0v36a4 4 0 0 1-8 0Z"/><path class="cs-faint" d="M26 20h28M26 28h28M26 36h20"/></svg>`,
      scales: `<svg viewBox="0 0 80 56" aria-hidden="true"><path d="M40 8v42M26 50h28M14 16h52"/><path class="cs-tone" d="M14 16l-8 16h16ZM66 16l-8 16h16Z"/></svg>`,
      plow: `<svg viewBox="0 0 80 56" aria-hidden="true"><path class="cs-faint" d="M8 28l20-20M12 32l20-20"/><path d="M36 30h20l10 14H44Z"/><path class="cs-tone" d="M56 30l12-22"/><path class="cs-faint" d="M30 46h44"/></svg>`,
    },
    // How the two columns stand in a part: the ruler's line on the left, God's on the right.
    states: {
      "01": `<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M18 6v36"/><path class="cs-tone" d="M46 6v36"/><path class="cs-dash" d="M44 18H22m4-4-4 4 4 4"/></svg>`,
      "02": `<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M20 16v26"/><path class="cs-tone" d="M46 6v36M10 10h44"/></svg>`,
      "03": `<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M22 14v24"/><path class="cs-tone" d="M42 6v36M10 6v36M10 6h32M10 42h32"/></svg>`,
      "04": `<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M14 6l14 18"/><path class="cs-tone" d="M50 6L36 24"/><path d="M28 24h8" class="cs-tone"/><path class="cs-faint" d="M14 42l14-18M50 42L36 24"/></svg>`,
      "05": `<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M14 6v36"/><circle class="cs-tone" cx="42" cy="24" r="14"/><path class="cs-tone" d="M42 14v20"/></svg>`,
      "06": `<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M16 6v22c0 8 6 12 14 14"/><path class="cs-tone" d="M46 6v36"/></svg>`,
    },
  };
})();
