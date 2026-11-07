// The drawings for Sexuality, singleness and divorce, in one hand: a thin stroke, round caps, a faint wash, the History
// orange as the study's colour. The hero is the garden at the beginning (Genesis 2:8–10): a river leaving Eden and
// parting into four, two trees, the ground God called very good. No person, no face, no figure of God. The water
// moves slowly and keeps moving. The close is the same garden, seen again from the path.
// Fixed strings written here, never built from data. No inline styles (the page's security policy forbids them).
window.MSDArt = (() => {
  const mini = (body) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="msd-mini">${body}</svg>`;
  const spark = (x, y, r = 5) => `<path class="msd-spark" d="M${x - r} ${y}h${2 * r}M${x} ${y - r}v${2 * r}"/>`;
  // A tree: a trunk that forks, and a crown of overlapping arcs with a faint wash.
  const tree = (x, y, s) => `<g class="msd-tree">
      <path class="msd-leaf" d="M${x - 30 * s} ${y - 58 * s}c${-6 * s} ${-26 * s} ${24 * s} ${-44 * s} ${42 * s} ${-30 * s}c${14 * s} ${-14 * s} ${40 * s} ${2 * s} ${30 * s} ${22 * s}c${14 * s} ${10 * s} ${4 * s} ${34 * s} ${-18 * s} ${30 * s}c${-12 * s} ${12 * s} ${-36 * s} ${8 * s} ${-40 * s} ${-4 * s}c${-18 * s} ${2 * s} ${-26 * s} ${-14 * s} ${-14 * s} ${-18 * s}z"/>
      <path d="M${x - 30 * s} ${y - 58 * s}c${-6 * s} ${-26 * s} ${24 * s} ${-44 * s} ${42 * s} ${-30 * s}c${14 * s} ${-14 * s} ${40 * s} ${2 * s} ${30 * s} ${22 * s}c${14 * s} ${10 * s} ${4 * s} ${34 * s} ${-18 * s} ${30 * s}"/>
      <path class="msd-faint" d="M${x - 16 * s} ${y - 32 * s}c${-12 * s} ${2 * s} ${-20 * s} ${-14 * s} ${-14 * s} ${-26 * s}"/>
      <path d="M${x} ${y}v${-34 * s}l${-10 * s} ${-14 * s}M${x} ${y - 30 * s}l${11 * s} ${-12 * s}M${x - 3 * s} ${y}c${-4 * s} ${2 * s} ${-8 * s} ${2 * s} ${-12 * s} 0M${x + 3 * s} ${y}c${4 * s} ${2 * s} ${8 * s} ${2 * s} ${12 * s} 0"/>
      <circle class="msd-fruit" cx="${x + 12 * s}" cy="${y - 64 * s}" r="${2.2 * s}"/><circle class="msd-fruit" cx="${x - 14 * s}" cy="${y - 50 * s}" r="${2.2 * s}"/>
    </g>`;
  const grass = (x, y) => `<path class="msd-faint" d="M${x} ${y}c1-5 3-8 6-10M${x + 4} ${y}c0-4 1-7 2-9M${x + 8} ${y}c1-3 3-5 5-6"/>`;
  // The river: one stream from the spring, then four headwaters (Genesis 2:10), each with a slow moving ripple.
  const river = `
      <path class="msd-tone" d="M206 118c-4 26 8 44 2 70"/>
      <path class="msd-tone" d="M208 188c-8 20-44 34-86 56M208 188c-6 22-20 40-40 60M208 188c6 22 20 40 40 60M208 188c8 20 44 34 86 56"/>
      <path class="msd-ripple" d="M206 124c-3 22 7 40 2 62M206 192c-10 18-42 32-80 50M209 194c8 18 40 32 80 50"/>
      <path class="msd-ripple msd-r2" d="M207 196c-6 18-18 34-36 50M210 196c6 18 18 34 36 50"/>
      <circle class="msd-spring" cx="206" cy="114" r="5"/>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <circle class="msd-disc" cx="210" cy="168" r="150"/>
      <circle class="msd-orbit" cx="210" cy="168" r="162"/>
      <path class="msd-glow" d="M176 96a34 34 0 0 1 68 0z"/>
      <path class="msd-faint" d="M176 96a34 34 0 0 1 68 0M210 52v-10M184 62l-7-7M236 62l7-7M164 84l-9-3M256 84l9-3"/>
      <path d="M64 252c40-6 92-10 146-10s106 4 146 10"/>
      <path class="msd-faint" d="M90 270c36-4 78-6 120-6s84 2 120 6M120 286c30-2 60-3 90-3s60 1 90 3"/>
      ${river}
      ${tree(118, 238, 1)}
      ${tree(306, 238, 0.86)}
      ${grass(84, 252)}${grass(150, 248)}${grass(250, 248)}${grass(330, 252)}
      ${spark(96, 92)}${spark(330, 104, 4)}${spark(270, 58, 3)}
    </svg>`,
    close: `<svg viewBox="0 0 420 150" aria-hidden="true">
      <path d="M10 128c60-8 130-12 200-12s140 4 200 12"/>
      <path class="msd-faint" d="M150 146c20-10 40-22 60-30M270 146c-20-10-40-22-60-30"/>
      <path class="msd-tone" d="M210 64c-2 14 4 24 0 36c-4 8-22 14-44 22M210 100c4 8 22 14 44 22"/>
      <path class="msd-ripple" d="M210 70c-2 12 3 20 0 30"/>
      ${tree(132, 120, 0.7)}${tree(292, 120, 0.62)}
      ${spark(60, 54, 4)}${spark(360, 40, 3)}
    </svg>`,
    marks: {
      // The study's three questions: a root that goes down; a question in a circle; holiness and grace held together.
      beginning: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h18"/><path class="msd-tone" d="M12 9v11M12 14l-4 5M12 14l4 5"/><path class="msd-faint" d="M12 9c-2-3-2-5 0-7c2 2 2 4 0 7"/></svg>`,
      asked: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path class="msd-tone" d="M9.4 9.4a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1 .8-1 1.6v.8"/><circle class="msd-dot" cx="12" cy="17.2" r=".9"/></svg>`,
      balance: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M7 21h10M4 7h16"/><path class="msd-tone" d="M4 7l-2.5 6h5zM20 7l-2.5 6h5z"/></svg>`,
    },
    parts: {
      "01": mini(`<path class="msd-tone" d="M48 6c-2 10 3 16 0 24"/><path class="msd-tone" d="M48 30c-4 8-18 14-34 22M48 30c-2 9-8 16-16 24M48 30c2 9 8 16 16 24M48 30c4 8 18 14 34 22"/><path class="msd-faint" d="M6 58h84"/><circle class="msd-spring" cx="48" cy="5" r="2.5"/>`),
      "02": mini(`<ellipse cx="48" cy="26" rx="22" ry="6"/><path d="M26 26v22c0 4 10 8 22 8s22-4 22-8V26"/><path class="msd-faint" d="M30 36h36M30 46h36"/><path class="msd-tone" d="M36 26c4 3 20 3 24 0"/><path d="M48 8v12M40 8h16"/><path class="msd-tone msd-drop" d="M48 14c-2 3-2 5 0 6c2-1 2-3 0-6"/>`),
      "03": mini(`<path d="M24 58V24l24-16l24 16v34"/><path d="M38 58V36a10 10 0 0 1 20 0v22"/><path class="msd-faint" d="M18 58h60M30 24h36"/><path class="msd-flame" d="M48 44c-3 4-3 7 0 9c3-2 3-5 0-9"/>`),
      "04": mini(`<path d="M30 56V36l-6-6M30 40l7-7"/><path class="msd-leaf" d="M16 30c-6-10 4-22 14-18c6-8 20-4 18 8c6 6 0 16-10 14c-6 6-18 4-22-4z"/><path d="M16 30c-6-10 4-22 14-18c6-8 20-4 18 8"/><path class="msd-faint" d="M66 56V44l-5-6M66 46l5-7M70 39l3-3"/><path class="msd-faint" d="M8 56h80"/>${spark(80, 16, 3)}`),
      "05": mini(`<path d="M22 18h46c4 0 6 3 6 6v24c0 3-2 6-6 6H28"/><path d="M22 18c-4 0-6 3-6 6s2 6 6 6h6V18"/><path d="M28 54c-4 0-6-3-6-6s2-6 6-6"/><path class="msd-faint" d="M36 28h30M36 34h30M36 40h22"/><circle class="msd-tone" cx="62" cy="46" r="4"/>`),
      "06": mini(`<path d="M14 36h68M20 36v20M76 36v20"/><path class="msd-faint" d="M8 44v12M8 44h8M88 44v12M88 44h-8"/><path d="M44 36v-8h8v8"/><path class="msd-flame" d="M48 26c-3-4-3-8 0-12c3 4 3 8 0 12"/><path class="msd-faint" d="M30 36v-4h8v4M58 36v-4h8v4"/>`),
    },
  };
})();
