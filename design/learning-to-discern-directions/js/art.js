// The drawings for Learning to discern, in one hand: a thin stroke, round caps, a faint wash, the Prophets blue as the
// study's colour. The hero is the motto drawn: voices arrive from the left and settle on an open book on its stand,
// with a small lamp beside it (Acts 17:11, "examined the Scriptures every day"). The voices keep moving and the flame
// keeps breathing; nothing plays once and stops. No person, no face, no figure of God or of Christ.
// Fixed strings written here, never built from data. No inline styles (the page's security policy forbids them).
window.LTDArt = (() => {
  const mini = (body) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="ltd-mini">${body}</svg>`;
  const spark = (x, y, r = 5) => `<path class="ltd-spark" d="M${x - r} ${y}h${2 * r}M${x} ${y - r}v${2 * r}"/>`;
  // An open book: two curved pages meeting at the spine (x), the gutter at y, with faint lines of text.
  const book = (x, y, s) => `<g class="ltd-book">
      <path class="ltd-wash" d="M${x} ${y}c${-20 * s} ${-10 * s} ${-50 * s} ${-12 * s} ${-82 * s} ${-6 * s}l${8 * s} ${-40 * s}c${30 * s} ${-8 * s} ${56 * s} ${-4 * s} ${74 * s} ${8 * s}zM${x} ${y}c${20 * s} ${-10 * s} ${50 * s} ${-12 * s} ${82 * s} ${-6 * s}l${-8 * s} ${-40 * s}c${-30 * s} ${-8 * s} ${-56 * s} ${-4 * s} ${-74 * s} ${8 * s}z"/>
      <path d="M${x} ${y}c${-20 * s} ${-10 * s} ${-50 * s} ${-12 * s} ${-82 * s} ${-6 * s}l${8 * s} ${-40 * s}c${30 * s} ${-8 * s} ${56 * s} ${-4 * s} ${74 * s} ${8 * s}zM${x} ${y}c${20 * s} ${-10 * s} ${50 * s} ${-12 * s} ${82 * s} ${-6 * s}l${-8 * s} ${-40 * s}c${-30 * s} ${-8 * s} ${-56 * s} ${-4 * s} ${-74 * s} ${8 * s}z"/>
      <path class="ltd-faint" d="M${x - 64 * s} ${y - 34 * s}c${16 * s} ${-3 * s} ${34 * s} ${-2 * s} ${52 * s} ${5 * s}M${x - 66 * s} ${y - 25 * s}c${16 * s} ${-3 * s} ${36 * s} ${-2 * s} ${54 * s} ${5 * s}M${x - 68 * s} ${y - 16 * s}c${16 * s} ${-3 * s} ${36 * s} ${-2 * s} ${56 * s} ${5 * s}"/>
      <path class="ltd-faint" d="M${x + 12 * s} ${y - 29 * s}c${18 * s} ${-7 * s} ${36 * s} ${-8 * s} ${52 * s} ${-5 * s}M${x + 12 * s} ${y - 20 * s}c${18 * s} ${-7 * s} ${38 * s} ${-8 * s} ${54 * s} ${-5 * s}M${x + 12 * s} ${y - 11 * s}c${18 * s} ${-7 * s} ${38 * s} ${-8 * s} ${56 * s} ${-5 * s}"/>
      <path class="ltd-tone" d="M${x + 3 * s} ${y}l${2 * s} ${18 * s}l${-3 * s} ${-3 * s}l${-3 * s} ${3 * s}z"/>
    </g>`;
  // A small oil lamp with a breathing flame.
  const lamp = (x, y, s) => `<g class="ltd-lamp">
      <circle class="ltd-glow" cx="${x + 30 * s}" cy="${y - 18 * s}" r="${18 * s}"/>
      <path d="M${x} ${y}c0 ${-10 * s} ${36 * s} ${-10 * s} ${36 * s} 0c0 ${6 * s} ${-36 * s} ${6 * s} ${-36 * s} 0zM${x + 36 * s} ${y - 3 * s}l${10 * s} ${-6 * s}M${x - 2 * s} ${y - 2 * s}c${-6 * s} ${-2 * s} ${-8 * s} ${-8 * s} ${-3 * s} ${-10 * s}"/>
      <path class="ltd-flame" d="M${x + 47 * s} ${y - 10 * s}c${-5 * s} ${-4 * s} ${-4 * s} ${-12 * s} ${1 * s} ${-18 * s}c${4 * s} ${6 * s} ${4 * s} ${14 * s} ${-1 * s} ${18 * s}z"/>
    </g>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <circle class="ltd-disc" cx="210" cy="168" r="150"/>
      <circle class="ltd-orbit" cx="210" cy="168" r="162"/>
      <path class="ltd-voice" d="M34 118c26-8 46 4 62 20s34 30 52 36"/>
      <path class="ltd-voice ltd-v2" d="M26 164c28-6 52 0 72 8s36 12 50 12"/>
      <path class="ltd-voice ltd-v3" d="M40 214c24 0 44-6 62-14s34-14 46-16"/>
      <circle class="ltd-dot ltd-faint" cx="34" cy="118" r="2.5"/><circle class="ltd-dot ltd-faint" cx="26" cy="164" r="2.5"/><circle class="ltd-dot ltd-faint" cx="40" cy="214" r="2.5"/>
      ${book(210, 210, 1)}
      <path d="M150 214h120M210 216v72M186 296c4-6 14-8 24-8s20 2 24 8M150 296h150"/>
      <path class="ltd-faint" d="M206 220v64M120 296h-26M330 296h30M176 302h66"/>
      ${lamp(286, 292, 1)}
      ${spark(304, 98)}${spark(116, 78, 4)}${spark(346, 162, 3)}${spark(250, 60, 3)}
    </svg>`,
    parts: {
      // 01 John's test as two clauses: one way confesses and comes from God; the other does not.
      "01": mini(`<path d="M8 32h22"/><path class="ltd-tone" d="M30 32c10 0 14-14 26-14h20"/><circle class="ltd-dot" cx="80" cy="18" r="3"/>
        <path class="ltd-faint ltd-dash" d="M30 32c10 0 14 14 26 14h18"/><circle cx="8" cy="32" r="2"/>${spark(86, 44, 3)}`),
      // 02 The fixed line: three marks above it, and the line does not move for any of them.
      "02": mini(`<path class="ltd-tone" d="M8 44h80"/><path d="M14 44v10M82 44v10"/><circle cx="28" cy="28" r="3"/><circle cx="48" cy="20" r="3"/>
        <circle cx="68" cy="28" r="3"/><path class="ltd-faint" d="M28 31v10M48 23v18M68 31v10"/>`),
      // 03 A scroll open on its stand, and the day's arc over it: "every day".
      "03": mini(`<path class="ltd-faint ltd-dash" d="M14 30a34 22 0 0 1 68 0"/><circle class="ltd-dot" cx="22" cy="18" r="2.5"/>
        <path d="M30 40h36M30 40c-4 0-6-3-6-6s2-6 6-6M66 40c4 0 6-3 6-6s-2-6-6-6M30 28h36M48 40l-8 16M48 40l8 16"/>
        <path class="ltd-faint" d="M34 32h12M50 32h12M34 36h10M50 36h12"/>`),
      // 04 Wisdom from above: water falling from a height into a still pool.
      "04": mini(`<path d="M30 8c6-4 30-4 36 0"/><path class="ltd-tone" d="M42 10c0 12 -2 24 2 36M54 10c0 12 2 24-2 36"/>
        <path d="M22 50c8-4 44-4 52 0c-8 6-44 6-52 0z"/><path class="ltd-faint ltd-ripple" d="M34 50c6-2 22-2 28 0"/>${spark(76, 22, 3)}`),
      // 05 A fold's fence and gate, and tracks that come in quietly.
      "05": mini(`<path d="M8 50h80M14 50V26M30 50V26M66 50V26M82 50V26M14 32h16M66 32h16M14 42h16M66 42h16"/>
        <path class="ltd-faint ltd-dash" d="M30 30l36 6"/><g class="ltd-track"><ellipse cx="42" cy="58" rx="2" ry="1.4"/><ellipse cx="50" cy="54" rx="2" ry="1.4"/><ellipse cx="56" cy="58" rx="2" ry="1.4"/><ellipse cx="62" cy="53" rx="2" ry="1.4"/></g>`),
      // 06 A neighbour's door, and an open book on the step.
      "06": mini(`<path d="M30 54V18a18 18 0 0 1 36 0v36M24 54h48"/><path class="ltd-faint" d="M36 54V22a12 12 0 0 1 24 0v32"/><circle cx="56" cy="38" r="1.5"/>
        <path class="ltd-tone" d="M48 60c-4-2-10-2-14-1l1-5c4-1 9 0 13 2zM48 60c4-2 10-2 14-1l-1-5c-4-1-9 0-13 2z"/>`),
    },
    // The close: the same book and lamp, and one line leaving it to the right, the habit carried to the next voice.
    close: `<svg viewBox="0 0 420 200" aria-hidden="true">
      ${book(170, 130, 0.8)}
      <path d="M122 134h96M170 136v40M152 186c3-6 10-8 18-8s15 2 18 8M120 186h110"/>
      ${lamp(236, 182, 0.6)}
      <path class="ltd-voice ltd-out" d="M262 120c40 0 80-6 130-18"/>
      ${spark(330, 70, 4)}${spark(90, 60, 3)}
    </svg>`,
  };
})();
