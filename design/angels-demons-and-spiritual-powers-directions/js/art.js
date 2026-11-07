// The drawings for Angels, demons and spiritual powers, in one hand: a thin stroke, round caps, a faint wash, the
// Prophets' blue as the study's colour. The hero is 2 Kings 6:17: the hills round a small walled town, full of
// chariots of fire, drawn as wheels and slow flames along the ridges. No riders, no faces, no figure of God, of an
// angel or of a demon: the unseen is drawn as fire and light. The close is the same hills, ordinary again.
// Fixed strings written here, never built from data. No inline styles (the page's security policy forbids them).
window.ADPArt = (() => {
  const mini = (body) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="adp-mini">${body}</svg>`;
  const spark = (x, y, r = 5) => `<path class="adp-spark" d="M${x - r} ${y}h${2 * r}M${x} ${y - r}v${2 * r}"/>`;
  // A chariot of fire: a wheel with spokes, a low car, and two tongues of flame that rise and fall.
  const chariot = (x, y, s, n) => {
    const r = 7 * s;
    const spokes = [0, 45, 90, 135].map((a) => {
      const dx = (Math.cos((a * Math.PI) / 180) * r).toFixed(1), dy = (Math.sin((a * Math.PI) / 180) * r).toFixed(1);
      return `M${(x - dx).toFixed(1)} ${(y - dy).toFixed(1)}L${(x + +dx).toFixed(1)} ${(y + +dy).toFixed(1)}`;
    }).join("");
    const car = `M${x - 4 * s} ${y - r}h${16 * s}l${-3 * s} ${-7 * s}h${-10 * s}z`;
    const flame = (fx, h, k) => `<path class="adp-flame adp-f${k}" d="M${fx} ${y - r - 7 * s}c${-4 * s} ${-h * 0.4} ${2 * s} ${-h * 0.7} 0 ${-h}c${5 * s} ${h * 0.35} ${5 * s} ${h * 0.75} 0 ${h}"/>`;
    const wash = `<path class="adp-fire" d="M${x - 6 * s} ${y - r - 6 * s}c${-2 * s} ${-10 * s} ${8 * s} ${-14 * s} ${9 * s} ${-26 * s}c${4 * s} ${8 * s} ${12 * s} ${12 * s} ${8 * s} ${26 * s}Z"/>`;
    return `<g class="adp-chariot">${wash}<circle cx="${x}" cy="${y}" r="${r}"/><path class="adp-faint" d="${spokes}"/><path d="${car}"/>${flame(x + 1 * s, 16 * s, n % 4)}${flame(x + 7 * s, 11 * s, (n + 2) % 4)}</g>`;
  };
  const ridges = `
      <path d="M8 236c40-30 80-44 128-40s70 22 108 18 70-34 112-36 52 12 56 16"/>
      <path class="adp-faint" d="M8 206c34-22 70-46 120-44s60 18 96 12 64-30 106-30 70 18 82 26"/>
      <path class="adp-faint" d="M40 176c30-14 60-24 92-22M300 156c30-4 58 4 84 18"/>`;
  const town = `
      <path d="M170 262v-34h80v34"/><path class="adp-faint" d="M170 228v-6h8v6h8v-6h8v6h8v-6h8v6h8v-6h8v6h8v-6h8v6h8v-6h8v6"/>
      <path d="M202 262v-16a8 8 0 0 1 16 0v16"/><path class="adp-faint" d="M182 220l10-10 10 10M226 220l12-12 12 12"/>
      <rect class="adp-lit" x="236" y="236" width="6" height="7"/>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <circle class="adp-disc" cx="210" cy="170" r="150"/>
      <ellipse class="adp-orbit" cx="210" cy="170" rx="198" ry="132"/>
      ${ridges}
      <path class="adp-glow" d="M60 220c40-26 90-40 150-36s110 10 150 26v40H60Z"/>
      ${chariot(96, 166, 0.75, 2)}${chariot(146, 160, 0.7, 3)}${chariot(196, 166, 0.65, 0)}${chariot(250, 160, 0.7, 2)}${chariot(298, 152, 0.75, 1)}${chariot(346, 160, 0.7, 3)}
      ${chariot(58, 216, 1.3, 0)}${chariot(112, 196, 1.4, 1)}${chariot(300, 194, 1.4, 3)}${chariot(356, 198, 1.3, 2)}${chariot(150, 214, 1.1, 2)}${chariot(268, 216, 1.1, 0)}
      <path d="M8 262h404"/>
      ${town}
      <path class="adp-faint" d="M120 288c40 6 140 10 180 0M80 304c60 6 200 8 260 0"/>
      ${spark(70, 70)}${spark(352, 60)}${spark(208, 40, 4)}${spark(286, 96, 3)}${spark(130, 104, 3)}
    </svg>`,
    close: `<svg viewBox="0 0 640 170" aria-hidden="true">
      <path d="M0 128c60-30 120-44 190-40s100 22 150 18 100-34 160-36 100 14 140 22"/>
      <path class="adp-faint" d="M0 100c50-20 110-40 180-38s90 16 140 10 90-26 150-26 120 16 170 24"/>
      <path d="M0 150h640"/>
      <path d="M270 150v-24h70v24"/><path class="adp-faint" d="M270 126v-5h7v5h7v-5h7v5h7v-5h7v5h7v-5h7v5h7v-5h7v5h7v-5h7v5"/>
      <path d="M298 150v-11a7 7 0 0 1 14 0v11"/>
      <path class="adp-wash" d="M420 40a40 40 0 0 1 80 0Z"/><path class="adp-faint" d="M400 40h120"/>
      ${spark(120, 40, 4)}${spark(560, 60, 4)}
    </svg>`,
    // The three questions: an open eye (what does the text say), a dashed edge (where does it stop), an arrow that
    // points up (where does it point).
    marks: {
      shows: `<svg viewBox="0 0 24 24" aria-hidden="true" class="adp-mark"><path d="M2 12c3-5 7-7 10-7s7 2 10 7c-3 5-7 7-10 7s-7-2-10-7Z"/><circle cx="12" cy="12" r="3.2"/></svg>`,
      means: `<svg viewBox="0 0 24 24" aria-hidden="true" class="adp-mark"><path d="M4 7h16M4 12h12M4 17h14"/></svg>`,
      unsaid: `<svg viewBox="0 0 24 24" aria-hidden="true" class="adp-mark"><path class="adp-dash" d="M12 2v20"/><path d="M4 8h5M4 12h5M4 16h5"/></svg>`,
      points: `<svg viewBox="0 0 24 24" aria-hidden="true" class="adp-mark"><path d="M12 21V4M6 10l6-6 6 6"/></svg>`,
    },
    parts: {
      // 01 Made by him and for him: one line, a point of light above it, everything made below it.
      "01": mini(`<path d="M8 30h80"/><path class="adp-tone" d="M48 8v12M42 14h12"/><circle class="adp-faint" cx="20" cy="44" r="2"/><circle class="adp-faint" cx="36" cy="50" r="1.5"/><circle cx="60" cy="42" r="5"/><path class="adp-faint" d="M70 52l4-6 4 6M14 54h10"/>${spark(84, 46, 3)}`),
      // 02 Sent to serve: Peter's cell door open, the chain fallen (Acts 12:7).
      "02": mini(`<path d="M20 58V12h30v46"/><path class="adp-faint" d="M28 12v46M36 12v46M42 12v46"/><path d="M50 12l20 6v40"/><path class="adp-tone" d="M60 54c4-4 8-4 10 0s6 4 10 0"/><circle class="adp-tone" cx="56" cy="54" r="2.4"/>${spark(80, 16, 4)}`),
      // 03 The angel who speaks as God: the spring in the desert where Hagar was found (Genesis 16:7).
      "03": mini(`<path d="M6 46c20-6 64-6 84 0"/><ellipse class="adp-tone" cx="48" cy="48" rx="16" ry="4"/><path class="adp-faint" d="M40 48h16M44 52h8"/><path d="M74 46V24M74 24c-8-2-12 2-14 6M74 24c8-2 12 2 14 6M74 24c-4-6-10-8-14-6M74 24c4-6 10-8 14-6"/>${spark(20, 18, 4)}`),
      // 04 The adversary: a hedge round a house, and a line outside it that stops at the hedge (Job 1:10–12).
      "04": mini(`<circle class="adp-dash" cx="40" cy="36" r="22"/><path d="M32 44V34l8-6 8 6v10"/><path class="adp-tone" d="M90 58c-8 0-6-10-14-10s-6 8-12 4"/>`),
      // 05 Demons and the authority of Jesus: the synagogue at Capernaum, its door open (Mark 1:21–27).
      "05": mini(`<path d="M18 58V24h60v34"/><path class="adp-faint" d="M14 24l34-14 34 14"/><path d="M40 58V42a8 8 0 0 1 16 0v16"/><path class="adp-faint" d="M26 32v18M70 32v18"/><path class="adp-tone" d="M44 50h8"/>`),
      // 06 Disarmed at the cross: the cross, and the record of debt nailed to it, struck through (Colossians 2:14).
      "06": mini(`<path d="M48 6v54M32 20h32"/><path class="adp-tone" d="M40 26h16v18H40z"/><path class="adp-faint" d="M43 31h10M43 35h10M43 39h7"/><path class="adp-tone" d="M38 46l20-22"/><path class="adp-faint" d="M10 60h76"/>`),
      // 07 Standing firm: a shield and a sword standing upright (Ephesians 6:16–17).
      "07": mini(`<path d="M36 12h24v20c0 12-12 20-12 20s-12-8-12-20Z"/><path class="adp-tone" d="M48 18v26"/><path d="M72 8v42M66 42h12M72 50v6"/><path class="adp-faint" d="M10 60h76"/>`),
    },
  };
})();
