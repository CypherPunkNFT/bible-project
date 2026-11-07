// The drawings for The kingdom he announced, in one hand: a thin stroke, round caps, a faint wash, the Gospels' colour
// as the study's colour. The motto is "A small seed. A shut door. / Near now, coming still." So the hero is a mustard
// tree grown from one seed, with birds in its branches (Matthew 13:31–32), and a closed arched door with an oil lamp
// burning at its threshold (Matthew 25:1–10). No person is drawn: no face or figure of God, of Christ or of anyone.
// Fixed strings written here, never built from data.
window.KHArt = (() => {
  const mini = (body) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="kh-mini">${body}</svg>`;
  const tree = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
      <ellipse class="kh-leaf" cx="0" cy="-74" rx="54" ry="34"/>
      <path d="M0 0C-2-20 2-40 0-60M0-40c-12-8-26-16-34-30M0-48c10-8 22-14 32-28M0-60c-4-12-10-22-12-34M0-60c6-12 12-24 14-36M-20-54c-10-2-20 0-26 6M18-60c10 0 20 4 26 10"/>
      <path class="kh-faint" d="M0 0c-6 2-10 4-16 4M0 0c6 2 10 4 14 4"/>
      <g class="kh-tone kh-leaves"><path transform="translate(-34 -73) rotate(-30)" d="M0 0q4-5 9 0q-5 5-9 0Z"/><path transform="translate(-40 -66) rotate(20)" d="M0 0q4-5 9 0q-5 5-9 0Z"/><path transform="translate(-46 -50) rotate(-10)" d="M0 0q4-5 9 0q-5 5-9 0Z"/><path transform="translate(-50 -56) rotate(40)" d="M0 0q4-5 9 0q-5 5-9 0Z"/><path transform="translate(32 -79) rotate(30)" d="M0 0q4-5 9 0q-5 5-9 0Z"/><path transform="translate(38 -72) rotate(-20)" d="M0 0q4-5 9 0q-5 5-9 0Z"/><path transform="translate(45 -51) rotate(10)" d="M0 0q4-5 9 0q-5 5-9 0Z"/><path transform="translate(48 -58) rotate(-40)" d="M0 0q4-5 9 0q-5 5-9 0Z"/><path transform="translate(-12 -97) rotate(-15)" d="M0 0q4-5 9 0q-5 5-9 0Z"/><path transform="translate(-6 -102) rotate(35)" d="M0 0q4-5 9 0q-5 5-9 0Z"/><path transform="translate(14 -99) rotate(20)" d="M0 0q4-5 9 0q-5 5-9 0Z"/><path transform="translate(19 -92) rotate(-30)" d="M0 0q4-5 9 0q-5 5-9 0Z"/><path transform="translate(1 -80) rotate(0)" d="M0 0q4-5 9 0q-5 5-9 0Z"/><path transform="translate(-24 -88) rotate(25)" d="M0 0q4-5 9 0q-5 5-9 0Z"/><path transform="translate(28 -94) rotate(-25)" d="M0 0q4-5 9 0q-5 5-9 0Z"/><path transform="translate(-30 -80) rotate(-45)" d="M0 0q4-5 9 0q-5 5-9 0Z"/><path transform="translate(36 -86) rotate(45)" d="M0 0q4-5 9 0q-5 5-9 0Z"/><path transform="translate(-18 -70) rotate(10)" d="M0 0q4-5 9 0q-5 5-9 0Z"/><path transform="translate(20 -68) rotate(-10)" d="M0 0q4-5 9 0q-5 5-9 0Z"/></g>
      <path class="kh-tone" d="M16-63q7 6 14 0M-40-50q5 4 10 0"/>
      <path class="kh-tone" d="M-30-62l3-3 3 2 2-2M22-70l3-3 3 2 2-2M-8-90l3-3 3 2 2-2"/>
      <path class="kh-tone kh-bird" d="M34-118l4 3 4-3M-46-110l3 2 3-2"/>
    </g>`;
  const door = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-34 0v-70a34 34 0 0 1 68 0V0"/><path class="kh-faint" d="M-42 0v-70a42 42 0 0 1 84 0V0"/>
      <path class="kh-faint" d="M-17-96V0M0-104V0M17-96V0"/><path d="M-34-40h68M-34-16h68"/><circle class="kh-tone" cx="22" cy="-30" r="2.4"/>
      <path class="kh-faint" d="M-50 0h100"/>
    </g>`;
  const lamp = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
      <path class="kh-glow" d="M0-20c-12 0-20-8-20-16S-10-58 0-58 20-44 20-36 12-20 0-20Z"/>
      <path d="M-16-6c4-8 26-8 32 0-4 6-26 6-32 0ZM16-8c4-2 10-4 12-2M-16-6c-4-4-8-4-10-2"/>
      <path class="kh-tone kh-flame" d="M14-12c-4-4-4-10 0-16 4 6 4 12 0 16Z"/>
    </g>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <ellipse class="kh-orbit" cx="210" cy="165" rx="198" ry="132"/>
      <circle class="kh-ring" cx="210" cy="165" r="122"/>
      <path class="kh-faint" d="M24 262h372"/>
      <path class="kh-faint" d="M40 270c40-4 80-4 120 0M250 270c40-4 90-4 130 0"/>
      ${tree(136, 262, 1.6)}
      <circle class="kh-tone kh-seed" cx="70" cy="276" r="2.6"/><path class="kh-faint" d="M73 276c18 2 40-2 60-12" stroke-dasharray="1 5"/>
      ${door(296, 262, 1.25)}
      ${lamp(256, 262, 1.1)}
      <path class="kh-spark" d="M60 92h10m-5-5v10M368 70h10m-5-5v10M214 34h8m-4-4v8"/>
    </svg>`,
    close: `<svg viewBox="0 0 640 170" aria-hidden="true">
      <path class="kh-faint" d="M0 150h640"/>
      <circle class="kh-tone kh-seed" cx="120" cy="150" r="2.4"/>
      ${tree(250, 150, 1.05)}
      ${lamp(410, 150, .9)}
      ${door(480, 150, .95)}
      <path class="kh-spark" d="M560 40h8m-4-4v8M80 60h8m-4-4v8"/>
    </svg>`,
    parts: {
      "01": mini(`<path d="M4 54l22-26 14 14 16-22 20 22 16-12"/><path class="kh-faint" d="M28 54c6-6 14-10 22-12M50 42c10-2 20-6 26-14"/><path class="kh-tone" d="M70 18v-6m-3 3h6M60 22h14l-2 6H62Z"/><path class="kh-faint" d="M4 58h88"/>`),
      "02": mini(`<path class="kh-faint" d="M4 50h88"/><path d="M28 50a20 20 0 0 1 40 0"/><path class="kh-tone" d="M48 22v-8M30 30l-5-5M66 30l5-5M20 46h-8M76 46h8"/><path class="kh-faint" d="M10 58c20-4 56-4 76 0"/>`),
      "03": mini(`<path class="kh-faint" d="M4 50c24-4 64-4 88 0M4 58c24-4 64-4 88 0"/><circle class="kh-tone" cx="22" cy="46" r="1.6"/><circle class="kh-tone" cx="36" cy="44" r="1.6"/><path d="M62 48c0-10 0-18 2-26"/><path class="kh-tone" d="M64 30c6-6 14-6 18-2-6 6-12 6-18 2ZM63 36c-6-6-12-6-16-2 4 4 10 4 16 2Z"/>`),
      "04": mini(`<path d="M18 56V30l26-18 26 18v26"/><path class="kh-faint" d="M10 56h76"/><path d="M36 56V38h16v18"/><path class="kh-tone" d="M30 44l28-4"/><path class="kh-faint" d="M60 36l10-12M66 40l14-8"/>`),
      "05": mini(`<path class="kh-faint" d="M6 56h84"/><path d="M26 44c0 8 10 12 22 12s22-4 22-12Z"/><path class="kh-faint" d="M26 44h44M30 48h36"/><path class="kh-tone" d="M38 40c2-6 18-6 20 0"/><path class="kh-spark" d="M76 18h6m-3-3v6"/>`),
      "06": mini(`<path d="M50 56V26a14 14 0 0 1 28 0v30"/><path class="kh-faint" d="M64 14v42M50 38h28"/><path class="kh-faint" d="M6 56h86"/><path d="M20 52c2-4 14-4 16 0-2 3-14 3-16 0Z"/><path class="kh-tone kh-flame" d="M34 49c-2-2-2-6 0-9 2 3 2 7 0 9Z"/>`),
    },
  };
})();
