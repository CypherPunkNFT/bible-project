// The drawings for Reading Daniel and Revelation, in one hand: a thin stroke, round caps, a faint wash. Daniel is drawn in
// the Prophets' blue and Revelation in its rose, the site's fixed section colours. The hero is Daniel 7 as the motto
// gives it: the churning sea below with the four beasts rising (only their backs, wings and horns above the waves), and
// above them the throne of fire with its wheels and its river of fire (7:9–10), set while they rise. Nothing is drawn on the throne: no face or figure
// of God, of Christ or of the Father; the seat holds only light. Fixed strings written here, never built from data.
window.RDRArt = (() => {
  const wave = (y, amp, phase) => {
    let d = `M0 ${y}`;
    for (let x = 0; x <= 420; x += 30) d += ` Q${x + 15} ${y + (((x / 30 + phase) % 2) ? amp : -amp)} ${x + 30} ${y}`;
    return d;
  };
  const sparks = [[52, 52], [372, 40], [330, 96], [84, 120], [250, 30], [140, 70]].map(([x, y]) =>
    `<path class="rdr-spark" d="M${x} ${y - 4}v8M${x - 4} ${y}h8" style="animation-delay:${(x % 7) * 0.9}s"/>`).join("");
  const seal = (broken) => `<svg viewBox="0 0 40 40" aria-hidden="true" class="rdr-seal-svg">
      <path class="rdr-seal-wax" d="M20 3c4 0 5 3 8 4s6 0 7 4-1 6 0 9 3 6 0 9-6 1-8 4-4 4-7 4-5-3-8-4-6 0-7-4 1-6 0-9-3-6 0-9 6-1 8-4 4-4 7-4Z"/>
      <circle class="rdr-seal-ring" cx="20" cy="20" r="11"/>
      ${broken ? '<path class="rdr-seal-crack" d="M20 2l-3 9 5 6-4 7 3 14"/><path class="rdr-seal-crack" d="M20 2l-3 9 5 6-4 7 3 14"/>' : ""}
    </svg>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <ellipse class="rdr-orbit" cx="210" cy="168" rx="196" ry="130"/>
      ${sparks}
      <g class="rdr-cloud rdr-faint"><path d="M86 118c-12 0-14-14-2-16 2-12 20-12 24-2 8-6 20 0 16 10 10 2 8 10-2 10Z"/><path d="M308 112c-10 0-12-12 0-14 4-10 20-10 22 0 10-4 18 4 12 10 8 2 6 8-2 8Z"/></g>
      <g class="rdr-throne">
        <path class="rdr-fire-wash" d="M150 178c0-70 26-120 60-138 34 18 60 68 60 138Z"/>
        <path class="rdr-seat-light" d="M192 132V96c0-11 8-19 18-19s18 8 18 19v36Z"/>
        <path class="rdr-tone-r" d="M178 160V92c0-20 14-34 32-34s32 14 32 34v68"/>
        <path class="rdr-tone-r rdr-faint" d="M188 132V96c0-13 10-23 22-23s22 10 22 23v36"/>
        <path class="rdr-tone-r" d="M168 132h84v9h-84ZM170 141v19M250 141v19"/>
        <path class="rdr-tone-r" d="M154 160h112M146 168h128M138 176h144"/>
        <g class="rdr-flames rdr-tone-r"><path d="M182 72c-6-8 0-14-2-22 8 6 10 14 6 22"/><path d="M238 72c6-8 0-14 2-22-8 6-10 14-6 22"/><path d="M210 52c-5-9 2-16 0-26 8 9 9 17 3 26"/><path d="M196 58c-4-6 0-11-1-16 6 5 7 10 4 16"/><path d="M224 58c4-6 0-11 1-16-6 5-7 10-4 16"/></g>
        <g class="rdr-wheel rdr-tone-r"><circle cx="144" cy="150" r="12"/><circle cx="144" cy="150" r="3"/><path d="M144 138v24M132 150h24M136 142l16 16M152 142l-16 16"/></g>
        <g class="rdr-wheel rdr-tone-r"><circle cx="276" cy="150" r="12"/><circle cx="276" cy="150" r="3"/><path d="M276 138v24M264 150h24M268 142l16 16M284 142l-16 16"/></g>
        <path class="rdr-river rdr-tone-r rdr-faint" d="M204 176c-8 12 6 20-2 32s8 18 2 28M216 176c-8 12 6 20-2 32s8 18 2 28"/>
      </g>
      <g class="rdr-beasts rdr-tone-d">
        <path d="M58 236c4-14 18-20 30-14 6-8 18-6 20 4"/><path d="M64 226c-8-12-4-22 4-28M70 224c-2-14 4-22 12-26"/>
        <path d="M134 238c2-12 14-20 30-18 10 2 16 10 16 18"/><circle cx="146" cy="226" r="1.6"/>
        <path d="M218 238c4-10 16-14 28-10 8-8 22-4 22 8"/><path d="M228 226l-8-14M238 222l2-16M252 224l10-12M260 230l14-8"/><circle cx="240" cy="232" r="1.2"/><circle cx="252" cy="234" r="1.2"/>
        <path d="M304 240c4-14 22-22 40-16 6 2 10 8 10 14"/>
        <path d="M312 230l-6-16M318 226l-3-18M325 224l0-18M332 224l4-18M338 226l7-16M344 229l10-13M308 234l-10-10M350 233l13-8M301 238l-13-6M356 238l14-4"/>
      </g>
      <path class="rdr-sea rdr-tone-d" d="${wave(244, 7, 0)}"/>
      <path class="rdr-sea rdr-tone-d rdr-faint" d="${wave(262, 6, 1)}"/>
      <path class="rdr-sea rdr-tone-d rdr-faint" d="${wave(282, 5, 0)}"/>
      <path class="rdr-wind rdr-faint" d="M24 204c30-8 54 4 80-4M310 196c26-6 50 6 84-2M150 210c20-4 40 2 60-2"/>
    </svg>`,
    sealWhole: seal(false),
    sealBroken: seal(true),
    // Small drawings for part 02's key, one per self-explained picture.
    glyphs: {
      beasts: `<svg viewBox="0 0 48 32" aria-hidden="true"><path d="M2 26q6-6 12 0t12 0 12 0 10-2"/><path d="M8 22c2-6 8-8 12-4M26 22c2-6 10-8 14-2M30 18l-2-6M34 16l1-7M38 18l4-5"/></svg>`,
      ram: `<svg viewBox="0 0 48 32" aria-hidden="true"><path d="M8 24c0-8 6-12 12-12h8"/><path d="M14 12c-6-2-8 4-4 6M20 11c-2-6 4-8 7-5"/><path d="M30 24c2-8 8-12 14-10M38 13l4-9"/></svg>`,
      stars: `<svg viewBox="0 0 48 32" aria-hidden="true"><path d="M8 26v-10M16 26v-12M24 26v-14M32 26v-12M40 26v-10"/><path d="M10 6v4M8 8h4M24 3v4M22 5h4M38 6v4M36 8h4"/></svg>`,
      dragon: `<svg viewBox="0 0 48 32" aria-hidden="true"><path d="M4 22c6-10 12 4 18-4s10 6 16-2c4-6 8-4 8 0"/><path d="M40 14l2-6M44 16l3-5"/></svg>`,
      bowl: `<svg viewBox="0 0 48 32" aria-hidden="true"><path d="M10 16h28c0 8-6 12-14 12s-14-4-14-12Z"/><path class="rdr-faint" d="M20 12c-2-4 2-6 0-10M28 12c-2-4 2-6 0-10"/></svg>`,
    },
    ear: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 9a5 5 0 1 1 9 3c-2 2-3 3-3 6a3 3 0 0 1-5 1"/><path d="M11 10a2 2 0 1 1 3 2"/></svg>`,
    eye: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12c4-6 16-6 20 0-4 6-16 6-20 0Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  };
})();
