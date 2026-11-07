// The drawings for Women of the Bible, in one hand: a thin stroke, round caps, a faint wash, History orange as the
// study's colour. The motto is "What she has done / will also be told." (Mark 14:9), so the hero is the alabaster jar
// broken at the neck, the nard running out and its scent rising. Each story has one small object from its own text.
// No face or figure of anyone, and none of God or of Christ. Fixed strings written here, never built from data.
window.WBArt = (() => {
  const mini = (body) => `<svg viewBox="0 0 64 48" aria-hidden="true" class="wb-mini-svg">${body}</svg>`;
  const scent = (x, y, cls = "wb-scent") => `<path class="${cls}" d="M${x} ${y}c-6-8 6-14 0-22s6-14 0-22"/>`;
  // An alabastron: a long flask with a narrow neck, here snapped off at the neck, as in Mark 14:3.
  const jar = `<path d="M185 120C170 128 160 140 160 160V250c0 30 16 46 32 46s32-16 32-46V160c0-20-10-32-25-40Z"/>
      <path d="M185 120v-18M199 120v-18"/><path class="wb-tone" d="M185 102l4-5 3 4 4-6 3 5"/>
      <path class="wb-faint" d="M162 172c18 7 42 7 60 0M161 238c19 7 43 7 62 0M168 196c10-6 20 4 30-2s14 4 22 0M170 214c8-4 18 3 26-1M172 262c10-5 22 4 34-1"/>
      <path class="wb-faint" d="M188 104v14M195 104v14"/>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <ellipse class="wb-orbit" cx="210" cy="168" rx="196" ry="130"/>
      <path class="wb-faint" d="M24 282h372"/>
      <path class="wb-faint" d="M44 294h332M74 306h272"/>
      <path class="wb-wash" d="M279 172c18 10 28 40 33 70 3 18 8 30 14 36h-24c0-26-8-60-23-90Z"/>
      <g transform="translate(0 24) rotate(60 192 200)">${jar}</g>
      <path class="wb-tone wb-pour" d="M279 172c18 10 28 40 33 70 3 18 8 30 14 36"/>
      <ellipse class="wb-pool" cx="328" cy="281" rx="48" ry="6"/>
      <g transform="rotate(100 352 268)"><path d="M346 262h12v14h-12Z"/><path class="wb-tone" d="M346 262l3-4 3 3 3-5 3 6"/></g>
      <path class="wb-shard" d="M244 278l9-5 4 7-10 2Z M372 278l7-3 2 6Z"/>
      <g class="wb-rise">${scent(270, 150)}${scent(300, 136)}${scent(326, 250)}${scent(350, 240)}</g>
      <path class="wb-spark" d="M78 74h10m-5-5v10M352 58h10m-5-5v10M128 42h8m-4-4v8M60 200h8m-4-4v8"/>
    </svg>`,
    close: `<svg viewBox="0 0 420 200" aria-hidden="true">
      <path class="wb-faint" d="M60 186h300"/>
      <g transform="translate(54 -60) scale(.8)">${jar}</g>
      <g class="wb-rise">${scent(204, 14)}${scent(222, 6)}</g>
      <path class="wb-spark" d="M120 70h8m-4-4v8M300 50h8m-4-4v8"/>
    </svg>`,
    mark: {
      did: `<svg viewBox="0 0 20 20" aria-hidden="true" class="wb-mark-svg"><path d="M3 5c3-1 5-1 7 1 2-2 4-2 7-1v10c-3-1-5-1-7 1-2-2-4-2-7-1Z"/><path d="M10 6v10"/></svg>`,
      god: `<svg viewBox="0 0 20 20" aria-hidden="true" class="wb-mark-svg"><path d="M10 2c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8Z"/></svg>`,
      memory: `<svg viewBox="0 0 20 20" aria-hidden="true" class="wb-mark-svg"><path d="M3 15C4 7 9 4 16 5"/><path d="M12 2l4 3-3 4"/><circle cx="3" cy="15" r="1.4"/></svg>`,
    },
    minis: {
      sarah: mini(`<path d="M8 40L32 10l24 30"/><path d="M32 10v30M26 40l6-14 6 14"/><path class="wb-faint" d="M4 40h56"/><path class="wb-tone" d="M46 8h4m-2-2v4"/>`),
      hagar: mini(`<ellipse cx="32" cy="34" rx="18" ry="6"/><path class="wb-faint" d="M14 34v4c0 3 8 6 18 6s18-3 18-6v-4"/><path class="wb-tone" d="M24 34c3-2 13-2 16 0"/><path class="wb-tone wb-ripple" d="M28 34c1-1 7-1 8 0"/><path d="M50 26c4-1 6 2 6 6"/><path class="wb-faint" d="M6 42h52"/>`),
      miriam: mini(`<circle cx="26" cy="22" r="12"/><circle class="wb-faint" cx="26" cy="22" r="8"/><circle class="wb-tone" cx="26" cy="10" r="1.6"/><circle class="wb-tone" cx="38" cy="22" r="1.6"/><circle class="wb-tone" cx="14" cy="22" r="1.6"/><circle class="wb-tone" cx="26" cy="34" r="1.6"/><path class="wb-faint" d="M4 42c6-3 10-3 16 0s10 3 16 0 10-3 16 0 6 2 8 1"/>`),
      rahab: mini(`<path d="M8 44V8h48v36"/><path class="wb-faint" d="M8 16h48M8 26h48M8 36h48M20 8v8M40 16v10M28 26v10M46 36v8"/><path d="M24 14h16v14H24Z"/><path class="wb-tone wb-cord" d="M34 28c-1 6 1 10-1 16"/>`),
      deborah: mini(`<path d="M32 44V20"/><path d="M32 20c-6-6-14-6-20-2M32 20c6-6 14-6 20-2M32 20c-4-8-10-12-16-12M32 20c4-8 10-12 16-12M32 20c0-6 0-10-2-14"/><path class="wb-faint" d="M6 44h52"/><path class="wb-tone" d="M30 24c1 2 3 2 4 0"/>`),
      huldah: mini(`<path d="M10 14c0-4 6-4 6 0v22c0 4-6 4-6 0Z"/><path d="M48 14c0-4 6-4 6 0v22c0 4-6 4-6 0Z"/><path d="M16 12h32M16 38h32"/><path class="wb-faint" d="M22 18h20M22 23h20M22 28h16M22 33h18"/><path class="wb-tone" d="M22 18h8"/>`),
      ruth: mini(`<path d="M32 44V18M32 30l-8-14M32 30l8-14M32 36l-12-12M32 36l12-12"/><path class="wb-tone" d="M24 16c-1-4 0-7 2-9M40 16c1-4 0-7-2-9M32 18c0-4 0-7 0-10M20 24c-2-3-2-6-1-8M44 24c2-3 2-6 1-8"/><path class="wb-faint" d="M26 36c4 2 8 2 12 0M6 44h52"/>`),
      hannah: mini(`<path d="M18 44V12h28v32"/><path class="wb-faint" d="M14 12h36M22 12V8h20v4"/><path d="M26 44V22c0-4 12-4 12 0v22"/><path class="wb-tone wb-flame" d="M32 18c-2-2 0-5 0-6 0 1 2 4 0 6Z"/><path class="wb-faint" d="M4 44h56"/>`),
      abigail: mini(`<ellipse cx="18" cy="36" rx="10" ry="5"/><ellipse class="wb-faint" cx="18" cy="31" rx="9" ry="4"/><path d="M38 38c-2-10 0-18 6-22 6 4 8 12 6 22Z"/><path d="M42 16l2-6 2 6"/><path class="wb-tone" d="M40 30c2 1 6 1 8 0"/><path class="wb-faint" d="M4 42h56"/>`),
      esther: mini(`<path d="M10 38L50 14"/><circle class="wb-tone" cx="52" cy="13" r="3.2"/><path class="wb-faint" d="M8 40l4-3M6 36h6"/><path class="wb-faint" d="M14 44h44"/><path class="wb-spark" d="M56 4h4m-2-2v4"/>`),
      mary: mini(`<path d="M22 12h20M24 12c-6 4-8 12-8 20 0 6 4 10 8 10h16c4 0 8-4 8-10 0-8-2-16-8-20"/><path class="wb-faint" d="M18 24h28M17 32h30"/><path class="wb-tone" d="M26 16c3 1 9 1 12 0"/><path class="wb-faint" d="M6 44h52"/>`),
      magdalene: mini(`<path d="M8 42V24c0-10 8-16 16-16s16 6 16 16v18"/><path class="wb-faint" d="M14 42V26c0-6 4-10 10-10s10 4 10 10v16"/><circle cx="48" cy="34" r="9"/><circle class="wb-faint" cx="48" cy="34" r="5"/><path class="wb-tone" d="M20 30h8"/><path class="wb-faint" d="M4 44h58"/>`),
      bethany: mini(`<path d="M26 42c-6-2-9-9-8-16 1-6 4-10 8-12l1-4h10l1 4c4 2 7 6 8 12 1 7-2 14-8 16Z"/><path class="wb-faint" d="M22 26c6 2 14 2 20 0"/>${scent(32, 8, "wb-scent wb-tone")}<path class="wb-faint" d="M6 44h52"/>`),
      lydia: mini(`<path class="wb-faint" d="M6 8h52"/><path d="M14 8v24c4 3 8 3 12 0V8M30 8v30c4 3 8 3 12 0V8"/><path class="wb-tone" d="M30 16h12M30 22h12M14 16h12"/><path class="wb-faint" d="M4 42c8-3 14-3 22 0s14 3 22 0 10-2 12-1"/>`),
      priscilla: mini(`<path d="M8 12h30v26H8Z"/><path class="wb-faint" d="M8 25h30M23 12v26"/><path class="wb-tone" d="M12 25h2m3 0h2m3 0h2m3 0h2m3 0h2"/><path d="M44 40L56 8"/><circle cx="55" cy="10" r="1.2"/><path class="wb-faint" d="M4 44h56"/>`),
      phoebe: mini(`<path d="M10 14h36c4 0 4 6 0 6H10c-4 0-4-6 0-6Z"/><path d="M12 20v18c0 3 4 3 4 0V20M44 20v18"/><path d="M16 38h28"/><path class="wb-faint" d="M20 26h18M20 31h14"/><circle class="wb-tone" cx="44" cy="38" r="3"/>`),
      junia: mini(`<ellipse cx="18" cy="24" rx="8" ry="5"/><ellipse cx="32" cy="24" rx="8" ry="5"/><path class="wb-faint" d="M40 24h4"/><ellipse class="wb-tone" cx="52" cy="26" rx="7" ry="5" transform="rotate(24 52 26)"/><path class="wb-faint" d="M6 42h52"/>`),
    },
  };
})();
