// The drawings for Covenants and promises, all in one hand: one thin stroke, round caps, a faint wash, the site's gold as
// the study's colour. A bow, stars, stone, a crown and a cup on one dotted thread: five signs and gifts, one God keeping
// His word. No face or figure of God. Fixed strings written here, never built from data. Illustrative only.
window.CPArt = (() => {
  const mini = (body) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="cp-mini">${body}</svg>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <ellipse class="ms-orbit" cx="210" cy="170" rx="196" ry="128"/>
      <ellipse class="ms-orbit ms-orbit-2" cx="210" cy="170" rx="160" ry="150" transform="rotate(-18 210 170)"/>
      <path class="cp-gold cp-thread" d="M34 244C78 128 132 88 210 92s130 56 176 152" stroke-dasharray="2 7"/>
      <g class="cp-bow"><path d="M18 262a40 40 0 0 1 80 0"/><path class="cp-gold" d="M28 262a30 30 0 0 1 60 0"/><path class="cp-faint" d="M38 262a20 20 0 0 1 40 0"/><path class="cp-faint" d="M10 262h96"/></g>
      <g class="cp-stars"><path class="cp-gold" d="M112 118l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/><path d="M82 142l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/><path d="M138 92l2 4 4 2-4 2-2 4-2-4-4-2 4-2Z"/><path class="cp-faint" d="M96 92l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z"/><path class="cp-faint" d="M152 128l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z"/></g>
      <g class="cp-stone"><path d="M188 150v-34c0-9 10-9 10 0v0c0-9 12-9 12 0v34Z" transform="translate(2 -36)"/><path d="M210 114v-34c0-9 12-9 12 0 0-9 10-9 10 0v34Z"/><path class="cp-faint" d="M196 92h10M196 100h10M196 108h10M216 92h10M216 100h10M216 108h10"/></g>
      <g class="cp-crown"><path class="cp-gold" d="M286 150l-6-30 16 12 12-20 12 20 16-12-6 30Z"/><path d="M286 158h44"/><path class="cp-faint" d="M292 166h32"/></g>
      <g class="cp-cup"><path d="M344 214h46c0 20-9 32-23 32s-23-12-23-32Z"/><path class="cp-gold cp-wine" d="M349 222c10 4 26-4 36 0-2 12-9 20-18 20s-16-8-18-20Z"/><path d="M367 246v18M352 266h30"/></g>
      <path class="ms-mark cp-spark" d="M42 56h10m-5-5v10M372 62h10m-5-5v10M260 40h8m-4-4v8"/>
    </svg>`,
    cards: {
      noah: mini(`<path d="M12 54a36 36 0 0 1 72 0"/><path class="cp-gold" d="M22 54a26 26 0 0 1 52 0"/><path class="cp-faint" d="M32 54a16 16 0 0 1 32 0"/><path d="M6 54h84"/><path class="cp-faint" d="M18 60c6-2 10 2 16 0s10 2 16 0 10 2 16 0"/>`),
      abraham: mini(`<path class="cp-gold" d="M48 8l3 9 9 3-9 3-3 9-3-9-9-3 9-3Z"/><path d="M20 20l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/><path d="M76 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/><path class="cp-faint" d="M34 40l1 3 3 1-3 1-1 3-1-3-3-1 3-1ZM64 42l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z"/><path d="M6 58h84"/>`),
      sinai: mini(`<path d="M30 56V18c0-11 18-11 18 0v38Z"/><path d="M48 56V18c0-11 18-11 18 0v38Z"/><path class="cp-gold" d="M36 26h6M36 34h6M36 42h6M54 26h6M54 34h6M54 42h6"/><path class="cp-faint" d="M14 60h68"/>`),
      david: mini(`<path class="cp-gold" d="M28 44l-6-26 15 10 11-18 11 18 15-10-6 26Z"/><path d="M28 52h40"/><path class="cp-faint" d="M34 58h28"/><circle cx="48" cy="10" r="1.6"/>`),
      new: mini(`<path d="M32 10h32c0 16-6 26-16 26S32 26 32 10Z"/><path class="cp-gold" d="M36 18c7 3 17-3 24 0-1 8-6 14-12 14s-11-6-12-14Z"/><path d="M48 36v16M38 54h20"/>`),
      heirs: mini(`<path d="M18 60c6-16 14-26 28-34 12-7 22-10 34-12"/><path d="M46 26c-8-4-14-10-16-18"/><path class="cp-gold" d="M58 36c6 4 12 6 20 6M58 36l-8-6"/><path class="cp-gold" d="M78 42c0-6 5-9 10-9 0 6-4 10-10 9Z"/><path class="cp-faint" d="M6 60h84"/>`),
    },
    land: `<svg viewBox="0 0 1200 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g class="cp-sky"><circle cx="90" cy="30" r="1"/><circle cx="240" cy="16" r="1"/><circle cx="410" cy="38" r="1"/><circle cx="560" cy="14" r="1"/><circle cx="720" cy="34" r="1"/><circle cx="880" cy="20" r="1"/><circle cx="1060" cy="36" r="1"/></g>
      <path class="cp-gold cp-faint" d="M380 165a220 150 0 0 1 440 0"/>
      <path class="cp-faint" d="M410 165a190 124 0 0 1 380 0"/>
      <path d="M0 132c120-44 220-52 340-22s190 28 300-8 240-52 360-14 140 34 200 22"/>
      <path class="cp-faint" d="M0 152c180-24 320-22 480-6s320 10 720-20"/>
      <path d="M0 165H1200"/>
      <path class="cp-gold cp-road" d="M20 160H1180" stroke-dasharray="3 9"/>
    </svg>`,
  };
})();
