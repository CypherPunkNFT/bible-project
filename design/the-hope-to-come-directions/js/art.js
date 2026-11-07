// The drawings for The hope to come, all in one hand: one thin stroke, round caps, a faint wash, the site's gold as the
// study's colour. An empty tomb, a throne, a tree and a city on one dotted thread, as the motto says. No face or figure of
// God or of Christ. Fixed strings written here, never built from data. Illustrative only.
window.HPArt = (() => {
  const mini = (body) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="hp-mini">${body}</svg>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <ellipse class="ms-orbit" cx="210" cy="170" rx="196" ry="128"/>
      <ellipse class="ms-orbit ms-orbit-2" cx="210" cy="170" rx="160" ry="150" transform="rotate(-18 210 170)"/>
      <path class="hp-gold hp-thread" d="M62 232C96 142 150 104 210 100s112 30 150 116" stroke-dasharray="2 7"/>
      <g><path d="M20 276v-34a42 42 0 0 1 84 0v34"/><path class="hp-wash" d="M38 276v-30a24 24 0 0 1 48 0v30Z"/><path d="M38 276v-30a24 24 0 0 1 48 0v30"/><circle class="hp-gold" cx="104" cy="258" r="18"/><path class="hp-faint" d="M8 276h120"/></g>
      <g><path class="hp-gold" d="M178 138V84c0-8 8-14 14-14h36c6 0 14 6 14 14v54"/><path d="M168 138h84M176 138v22M244 138v22"/><path class="hp-faint" d="M192 90h36M192 104h36M192 118h36"/><path class="hp-faint" d="M160 170h100"/></g>
      <g><path d="M210 290v-58"/><path d="M210 256c-10-4-16-10-20-18M210 244c10-4 16-10 20-18"/><path class="hp-gold hp-wash" d="M210 180c-26 0-38 18-34 34 3 12 16 18 34 18s31-6 34-18c4-16-8-34-34-34Z"/><path class="hp-gold" d="M210 180c-26 0-38 18-34 34 3 12 16 18 34 18s31-6 34-18c4-16-8-34-34-34Z"/><path class="hp-faint" d="M168 290h84"/></g>
      <g><path d="M310 276v-52l14-14v-16h8v16l12 12 12-12v-22h8v22l14 14v52"/><path class="hp-gold" d="M336 276v-24a8 8 0 0 1 16 0v24"/><path class="hp-faint" d="M322 232h8M322 248h8M358 232h8M358 248h8"/><path class="hp-faint" d="M296 276h98"/></g>
      <path class="ms-mark hp-spark" d="M42 56h10m-5-5v10M372 62h10m-5-5v10M286 40h8m-4-4v8"/>
    </svg>`,
    cards: {
      return: mini(`<path class="hp-gold" d="M48 6v22M41 21l7 7 7-7"/><path d="M18 42c0-6 5-10 11-10 2-6 9-9 15-7 3-4 11-4 15 0 8-2 15 3 15 10 5 0 8 3 8 7H14c0-1 1-0 4 0Z"/><path class="hp-faint" d="M6 58h84"/>`),
      raised: mini(`<path d="M6 44h84"/><path class="hp-faint" d="M14 52h68M26 59h44"/><path d="M48 50c-5 0-8-3-8-6s3-6 8-6 8 3 8 6-3 6-8 6Z"/><path class="hp-gold" d="M48 38V14"/><path class="hp-gold" d="M48 24c-8 0-13-5-14-12 8 0 13 5 14 12ZM48 18c6 0 11-4 12-11-7 0-11 4-12 11Z"/>`),
      judgment: mini(`<path d="M48 16c-8-5-20-5-30-1v34c10-4 22-4 30 1 8-5 20-5 30-1V15c-10-4-22-4-30 1Z"/><path d="M48 16v34"/><path class="hp-gold" d="M26 24c6-1 11-1 15 1M26 32c6-1 11-1 15 1M26 40c6-1 11-1 15 1"/><path class="hp-faint" d="M55 25c4-2 9-2 15-1M55 33c4-2 9-2 15-1M55 41c4-2 9-2 15-1"/><path class="hp-faint" d="M10 58h76"/>`),
      creation: mini(`<path d="M4 50c14-12 24-14 38-6s28 6 50-8"/><path class="hp-faint" d="M4 58c20-6 40-6 88-4"/><path class="hp-gold" d="M30 44V26M30 34c-5 0-8-3-9-8 5 0 8 3 9 8ZM30 30c5 0 8-3 9-8-5 0-8 3-9 8Z"/><circle class="hp-faint" cx="72" cy="14" r="8"/><path class="hp-faint" d="M72 2v-0M60 14h-4M88 14h-4"/>`),
      new: mini(`<path d="M20 58V22l10-8v-8h6v8l12 10 12-10v-8h6v8l10 8v36"/><path class="hp-gold" d="M40 58V42a8 8 0 0 1 16 0v16"/><path class="hp-faint" d="M28 30h6M28 40h6M62 30h6M62 40h6M8 58h80"/>`),
      waiting: mini(`<path d="M30 40c0-6 8-8 18-8s18 2 18 8c0 7-8 12-18 12s-18-5-18-12Z"/><path d="M66 38c6-2 12-1 16-6M40 52l-4 6h24l-4-6"/><path class="hp-gold" d="M48 28c-5-3-7-8-3-13 1 3 3 4 4 2 2-3 1-6 0-9 6 3 8 10 6 15-1 3-4 5-7 5Z"/><path class="hp-faint" d="M10 60h76"/>`),
    },
    land: `<svg viewBox="0 0 1200 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g class="hp-sky"><circle cx="90" cy="30" r="1"/><circle cx="240" cy="16" r="1"/><circle cx="410" cy="38" r="1"/><circle cx="560" cy="14" r="1"/><circle cx="720" cy="34" r="1"/><circle cx="880" cy="20" r="1"/><circle cx="1060" cy="36" r="1"/></g>
      <path d="M0 132c120-44 220-52 340-22s190 28 300-8 240-52 360-14 140 34 200 22"/>
      <path class="hp-faint" d="M0 152c180-24 320-22 480-6s320 10 720-20"/>
      <g><path d="M520 165v-54l20-16v-18h10v18l24 18 26-18v-18h10v18l20 16v54"/><path class="hp-gold" d="M560 165v-26a14 14 0 0 1 28 0v26"/></g>
      <g><path d="M760 165v-40"/><path class="hp-gold" d="M760 90c-18 0-26 12-24 24 2 8 12 12 24 12s22-4 24-12c2-12-6-24-24-24Z"/></g>
      <path d="M0 165H1200"/>
      <path class="hp-gold hp-road" d="M20 160H1180" stroke-dasharray="3 9"/>
    </svg>`,
  };
})();
