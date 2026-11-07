// The drawings for The shape of Scripture, all in one hand: one thin stroke, round caps, a faint wash. Six kinds of writing
// on one river, from a tree to a city. Fixed strings written here, never built from data. Illustrative forms only.
window.SSArt = (() => {
  const forms = {
    law: `<path d="M26 58V20a22 16 0 0 1 44 0v38Z"/><path class="ss-wash" d="M26 58V20a22 16 0 0 1 44 0v38Z"/><path class="ss-tone" d="M36 20h24M36 29h24M36 38h24M36 47h16"/>`,
    history: `<path d="M22 14h46a7 7 0 0 1 7 7v30"/><path d="M22 14a7 7 0 0 0-7 7v3h14v-3a7 7 0 0 0-7-7Z"/><path d="M29 21v32a6 6 0 0 0 6 6h46a6 6 0 0 1-6-6v-2H41v2a6 6 0 0 1-6 6"/><path class="ss-tone" d="M37 24h28M37 32h28M37 40h20"/>`,
    poetry: `<path d="M30 56c-12-8-14-30-6-44 4 2 6 6 7 10h34c1-4 3-8 7-10 8 14 6 36-6 44Z"/><path class="ss-wash" d="M30 56c-12-8-14-30-6-44 4 2 6 6 7 10h34c1-4 3-8 7-10 8 14 6 36-6 44Z"/><path class="ss-tone" d="M38 22v34M48 22v34M58 22v34"/><path d="M28 34h40"/>`,
    prophets: `<path d="M12 42c18 4 40-2 58-26 3-4 8-2 8 2 0 26-26 42-60 34-6-1-10-8-6-10Z"/><path class="ss-wash" d="M12 42c18 4 40-2 58-26 3-4 8-2 8 2 0 26-26 42-60 34-6-1-10-8-6-10Z"/><path class="ss-tone" d="M84 10l6-4M86 20h7M84 30l6 4"/>`,
    gospels: `<path d="M48 16c-9-5-23-5-34-1v38c11-4 25-4 34 1 9-5 23-5 34-1V15c-11-4-25-4-34 1Z"/><path d="M48 16v38"/><path class="ss-tone" d="M21 24c7-1 14-1 20 1M21 33c7-1 14-1 20 1M21 42c7-1 14-1 20 1"/><path class="ss-faint" d="M55 25c6-2 13-2 20-1M55 34c6-2 13-2 20-1M55 43c6-2 13-2 20-1"/>`,
    letters: `<rect x="14" y="16" width="68" height="40" rx="2"/><path class="ss-wash" d="M14 16h68v40H14Z"/><path d="M14 18l34 22 34-22"/><circle class="ss-tone" cx="48" cy="40" r="5"/><path class="ss-tone" d="M45 45l-3 7M51 45l3 7"/>`,
  };
  const mini = (slug) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="ss-mini ss-t-${slug}">${forms[slug]}</svg>`;
  const place = (slug, x, y) => `<g class="ss-t-${slug}" transform="translate(${x} ${y})">${forms[slug]}</g>`;
  return {
    mini,
    hero: `<svg viewBox="0 0 460 400" aria-hidden="true">
      <ellipse class="ms-orbit" cx="230" cy="200" rx="218" ry="176"/>
      <ellipse class="ms-orbit ms-orbit-2" cx="230" cy="200" rx="176" ry="196" transform="rotate(-16 230 200)"/>
      <path class="ss-river" d="M36 362C110 340 96 276 164 268s134 22 186-14 8-96-56-96-132 12-168-22 26-86 112-84"/>
      <path class="ss-river ss-river-2" d="M50 372C124 350 112 286 176 280s140 20 192-20 8-110-66-110-124 10-158-22 26-76 106-74"/>
      <g class="ss-t-law"><path d="M24 372v-40"/><path class="ss-wash" d="M24 332c-20 0-30-14-27-29 3-12 14-18 27-18s24 6 27 18c3 15-7 29-27 29Z"/><path class="ss-tone" d="M24 332c-20 0-30-14-27-29 3-12 14-18 27-18s24 6 27 18c3 15-7 29-27 29Z"/></g>
      ${place("law", 88, 196)}${place("history", 244, 206)}${place("poetry", 340, 124)}${place("prophets", 188, 92)}${place("gospels", 34, 84)}${place("letters", 182, 4)}
      <g class="ss-t-letters"><path d="M322 66V36l9-8v-8h5v8l11 9 12-9v-8h5v8l9 8v30"/><path class="ss-tone" d="M341 66V52a6 6 0 0 1 12 0v14"/><path class="ss-faint" d="M314 66h72"/></g>
      <path class="ms-mark ss-spark" d="M408 322h10m-5-5v10M28 28h8m-4-4v8M410 40h8m-4-4v8"/>
    </svg>`,
    river: `<svg viewBox="0 0 1200 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path class="ss-river" d="M0 92c120-30 220-36 340-14s200 22 310-4 240-40 360-10 130 26 190 18"/>
      <path class="ss-faint" d="M0 112c200-18 340-16 500-4s340 8 700-14"/>
      <g class="ss-t-law"><path d="M70 92V50"/><path class="ss-tone" d="M70 54c-18 0-26-12-24-24 2-8 12-12 24-12s22 4 24 12c2 12-6 24-24 24Z"/></g>
      <g class="ss-t-letters"><path d="M1090 92V48l14-12V22h7v14l17 13 18-13V22h7v14l14 12v44"/><path class="ss-tone" d="M1118 92V72a10 10 0 0 1 20 0v20"/></g>
    </svg>`,
  };
})();
