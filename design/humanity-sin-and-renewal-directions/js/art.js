// The drawings for Humanity, sin and renewal, all in one hand: one thin stroke, round caps, a faint wash, the site's gold as
// the study's colour. A plain human outline with no face, never God or Christ. Fixed strings written here, never built from data.
window.HSArt = (() => {
  // The one figure, in a 200 by 420 box. The hero's dust, the body figure and the small drawings all use this same outline.
  const head = "M128 44a28 28 0 1 1-56 0a28 28 0 1 1 56 0Z";
  const trunk = "M100 78C124 78 146 86 152 108L168 214C170 226 154 230 151 218L136 138L134 232L142 396C143 410 120 412 118 398L104 254L96 254L82 398C80 412 57 410 58 396L66 232L64 138L49 218C46 230 30 226 32 214L48 108C54 86 76 78 100 78Z";
  const outline = `${head}${trunk}`;
  const figure = `<g transform="translate(29 11) scale(.19)"><path class="hs-fig" d="${outline}"/></g>`;
  const ring = `<ellipse class="hs-ring" cx="48" cy="52" rx="40" ry="46"/>`;
  const marks = {
    crown: `<path class="hs-gold" d="M40 13l3 4 5-5 5 5 3-4v8H40Z"/>`,
    child: `<g transform="translate(58 58) scale(.09)"><path class="hs-gold" d="${outline}"/></g>`,
    plain: "",
    leaves: `<path class="hs-gold" d="M38 52c-8-1-13-5-14-11 7-1 13 3 14 11ZM58 52c8-1 13-5 14-11-7-1-13 3-14 11ZM48 62c-5 4-5 9-3 13 4-2 6-8 3-13Z"/>`,
    gap: `<path class="hs-gold" d="M48 6a40 46 0 0 1 40 46"/>`,
    light: `<path class="hs-gold" d="M48 16v12M48 76v12M18 52h12M66 52h12M27 28l8 8M61 68l8 8M69 28l-8 8M35 68l-8 8"/><circle class="hs-gold" cx="48" cy="52" r="9"/>`,
    garment: `<path class="hs-gold" d="M38 32l-4 12 5 2v26h18V46l5-2-4-12c-6 3-14 3-20 0Z"/>`,
    ring: `<ellipse class="hs-gold" cx="48" cy="52" rx="40" ry="46"/>`,
  };
  const small = (mark) => `<svg viewBox="0 0 96 104" aria-hidden="true" class="hs-mini">${ring}${mark === "light" ? "" : figure}${marks[mark]}</svg>`;
  return {
    outline,
    head,
    trunk,
    small,
    orbits: `<svg class="hs-orbits" viewBox="0 0 460 460" aria-hidden="true">
      <ellipse class="ms-orbit" cx="230" cy="230" rx="214" ry="206"/>
      <ellipse class="ms-orbit ms-orbit-2" cx="230" cy="230" rx="176" ry="218" transform="rotate(-16 230 230)"/>
      <path class="ms-mark hs-spark" d="M408 72h10m-5-5v10M34 84h8m-4-4v8M398 396h8m-4-4v8"/>
    </svg>`,
    foot: `<svg viewBox="0 0 1200 130" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path class="hs-faint" d="M0 118c200-16 340-14 500-4s340 8 700-12"/>
      <path d="M0 96c120-14 220-18 340-8s200 14 310 0 240-22 360-8 130 12 190 8"/>
      <g class="hs-gold"><path d="M300 92c0-8-7-14-14-14-1 7 4 14 14 14Zm0 0c0-10 8-17 16-17 1 9-6 17-16 17Zm0 0v8"/></g>
      <g transform="translate(872 18) scale(.17)"><path d="${outline}"/></g>
      <circle class="hs-gold" cx="1010" cy="34" r="1.6"/><circle class="hs-gold" cx="1040" cy="52" r="1.2"/><circle class="hs-gold" cx="1064" cy="30" r="1.4"/>
    </svg>`,
  };
})();
