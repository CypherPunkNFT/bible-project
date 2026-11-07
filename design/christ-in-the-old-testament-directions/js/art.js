// The drawings for Christ in the Old Testament, in one hand: a thin stroke, round caps, a faint wash, the Prophets'
// blue as the study's colour. The motto is Luke 24:27's "Beginning with Moses / and all the Prophets", so the hero is
// the road to Emmaus at evening: a village on a rise with one lit window, the sun low, and in front an unrolled scroll
// whose columns fall into three groups, for the Law of Moses, the Prophets and the Psalms. No one is drawn on the
// road: no face or figure of God, of Christ or of the Father, and no figure in any drawing here.
// Fixed strings written here, never built from data.
window.COTArt = (() => {
  const mini = (body) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="cot-mini">${body}</svg>`;
  const columns = (x0, count, gap) => Array.from({ length: count }, (_, i) => {
    const x = x0 + i * gap;
    return `<path class="cot-faint" d="M${x} 262v34M${x + 6} 262v30M${x + 12} 262v33"/>`;
  }).join("");
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <circle class="cot-disc" cx="210" cy="176" r="150"/>
      <ellipse class="cot-orbit" cx="210" cy="168" rx="196" ry="128"/>
      <circle class="cot-sun" cx="300" cy="118" r="26"/>
      <path class="cot-faint" d="M18 186c60-10 120-14 180-8s130 10 204-2"/>
      <path class="cot-faint" d="M40 160c40-14 80-18 120-10M250 150c30-8 60-8 96 2"/>
      <g class="cot-village"><path d="M268 178v-22l14-10 14 10v22M296 178v-16h22v16M318 178v-26l10-8 10 8v26"/>
        <path class="cot-window" d="M279 166h6v8h-6Z"/><path class="cot-tone" d="M279 166h6v8h-6"/></g>
      <path d="M300 182C270 200 200 214 150 232S70 256 40 250"/>
      <path class="cot-faint" d="M316 182C290 204 222 222 176 240S96 268 60 270"/>
      <path class="cot-road" d="M300 182C270 200 200 214 150 232S70 256 40 250L60 270C96 268 140 256 176 240S290 204 316 182Z"/>
      <g class="cot-scroll"><path d="M62 258h296v42H62z" class="cot-wash"/><path d="M62 258h296M62 300h296"/>
        <ellipse cx="62" cy="279" rx="9" ry="22"/><ellipse cx="358" cy="279" rx="9" ry="22"/>
        ${columns(84, 5, 20)}${columns(204, 4, 20)}${columns(298, 2, 20)}
        <path class="cot-tone" d="M184 270v24M284 270v24" stroke-dasharray="1 4"/></g>
      <path class="cot-spark" d="M70 70h10m-5-5v10M372 60h8m-4-4v8M150 44h8m-4-4v8"/>
    </svg>`,
    close: `<svg viewBox="0 0 640 170" aria-hidden="true">
      <path class="cot-faint" d="M0 146h640"/>
      <path d="M180 112h300M200 112v34M460 112v34"/>
      <path d="M232 112c0-14 10-22 22-22s22 8 22 22"/><path d="M286 112c2-12 12-18 22-16"/><path class="cot-faint" d="M254 96v-4M262 98l3-3"/>
      <path d="M372 112v-20h8v20M368 92h16"/><path class="cot-flame" d="M376 88c-5-6-2-12 0-16 2 4 5 10 0 16Z"/>
      <path class="cot-glow" d="M376 80m-30 0a30 30 0 1 0 60 0a30 30 0 1 0 -60 0"/>
      <path d="M404 112h60M404 112c-4-6-4-12 0-16M464 112c4-6 4-12 0-16M404 96h60" class="cot-faint"/>
      <path d="M540 146V60h50v86M540 90h50M565 60v86" class="cot-faint"/><path class="cot-window" d="M548 68h34v18h-34Z"/>
      <path class="cot-spark" d="M560 30h8m-4-4v8M90 50h8m-4-4v8"/>
    </svg>`,
    parts: {
      "01": mini(`<path d="M30 58V14h36v44"/><path class="cot-tone" d="M30 14h36M30 20v16M66 20v16" stroke-width="2.4"/><path class="cot-faint" d="M36 58V20h24v38"/><path class="cot-faint" d="M6 58h84"/>`),
      "02": mini(`<path d="M20 56l14-26h28l14 26"/><path d="M34 30v26M62 30v26M48 30v26" class="cot-faint"/><path class="cot-tone" d="M30 18c2-6 10-8 14-4 3-6 13-6 15 1 6-1 9 5 6 9H30c-4 0-4-6 0-6Z"/><path class="cot-faint" d="M6 56h84"/>`),
      "03": mini(`<path d="M18 8v50M78 8v50M18 10h60"/><path class="cot-faint" d="M26 10c0 16 4 32 0 48M38 10c2 16-2 32 0 48M58 10c-2 16 2 32 0 48M70 10c0 16-4 32 0 48"/><path class="cot-tone" d="M42 50h12l-2 6h-8Z"/><path class="cot-faint cot-smoke" d="M48 48c-4-6 4-8 0-14s4-8 0-12"/>`),
      "04": mini(`<path d="M26 46l-4-24 14 12 12-18 12 18 14-12-4 24Z"/><path class="cot-tone" d="M26 46h44v6H26Z"/><circle class="cot-faint" cx="48" cy="40" r="2.5"/><path class="cot-faint" d="M6 58h84"/>`),
      "05": mini(`<circle cx="30" cy="40" r="16"/><circle cx="30" cy="40" r="3"/><path class="cot-faint" d="M30 24v32M14 40h32M19 29l22 22M41 29L19 51"/><path class="cot-tone" d="M54 22h30v20H54z"/><path d="M54 22c-4 0-4 20 0 20M84 22c4 0 4 20 0 20"/><path class="cot-faint" d="M60 28h18M60 33h18M60 38h12"/>`),
      "06": mini(`<path d="M28 58V10"/><path class="cot-tone" d="M28 14c8 2 8 8 0 10s-8 8 0 10 8 8 0 10"/><path class="cot-shadow" d="M28 58l58-10"/><path class="cot-faint" d="M6 58h84"/>`),
    },
  };
})();
