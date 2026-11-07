// The drawings for Money, possessions and generosity, in the site's one hand: a thin stroke, round caps, faint washes,
// four-point sparkles. The hero is what the study's six passages hand from one to another: a bound sheaf of the
// harvest (Deuteronomy 14), a jar for oil, and two small copper coins (Mark 12:42) on the stone step of a gate
// (Deuteronomy 14:29, Luke 16:20). The close is a low table set outside an open gate: the feast with its guests.
// No one is drawn: no face or figure of God, of Christ or of anyone. Fixed strings written here, never built from data.
window.MPArt = (() => {
  const spark = (x, y, s, delay) => `<path class="mp-spark" style="animation-delay:-${delay}s" d="M${x} ${y - s}q1 ${s - 1} ${s} ${s}q${-(s - 1)} 1 ${-s} ${s}q-1 ${-(s - 1)} ${-s} ${-s}q${s - 1} -1 ${s} ${-s}Z"/>`;
  const ear = (x, y, angle, delay) => `<g class="mp-ear" style="animation-delay:-${delay}s" transform="translate(${x} ${y}) rotate(${angle})">
      <path d="M0 0v-52"/><path class="mp-grain" d="M0-52c-4-5-4-11 0-15 4 4 4 10 0 15ZM0-42c-6-2-9-7-8-12 5 1 8 5 8 12ZM0-42c6-2 9-7 8-12-5 1-8 5-8 12ZM0-31c-6-2-9-7-8-12 5 1 8 5 8 12ZM0-31c6-2 9-7 8-12-5 1-8 5-8 12Z"/></g>`;
  const sheaf = [[-14, -6, 1], [-7, -10, 2.2], [0, -12, .6], [7, -10, 3.1], [14, -6, 1.7], [-3, 4, 2.6], [4, 3, .3]]
    .map(([a, d, t], i) => ear(150 + i * 3 - 9, 214, a + d / 4, t)).join("");
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <circle class="mp-disc" cx="210" cy="168" r="150"/>
      <ellipse class="mp-orbit" cx="210" cy="168" rx="198" ry="132"/>
      <path class="mp-faint" d="M18 262h384"/>
      <path class="mp-stone" d="M262 262V96c0-14 10-22 22-22h40c12 0 22 8 22 22v166"/>
      <path class="mp-faint" d="M262 128h84M262 176h84M262 222h84M294 74v54M314 128v48M290 176v46M318 222v40"/>
      <path class="mp-door" d="M276 262V112c0-8 6-14 14-14h28c8 0 14 6 14 14v150"/>
      <path class="mp-faint" d="M282 262V118"/>
      <path class="mp-step" d="M90 262v-14h300v14"/>
      <path class="mp-faint" d="M120 248v14M190 248v14M250 248v14M330 248v14"/>
      <g>${sheaf}</g>
      <path d="M134 220c8 6 26 6 36 0M136 226c8 5 24 5 32 0"/>
      <path class="mp-tone" d="M140 236c4 4 22 4 26 0"/>
      <path class="mp-jar" d="M200 248c-14-6-18-26-12-42 4-10 6-16 4-22h24c-2 6 0 12 4 22 6 16 2 36-12 42Z"/>
      <path d="M196 184c0-4 2-6 4-6h16c2 0 4 2 4 6M193 204c10 3 20 3 30 0"/>
      <path class="mp-faint" d="M220 196c4 10 4 24-2 36"/>
      <ellipse class="mp-coin" cx="236" cy="244" rx="8" ry="3.2"/>
      <ellipse class="mp-coin" cx="252" cy="246" rx="8" ry="3.2"/>
      <path class="mp-faint" d="M228 244v2c0 2 4 3 8 3s8-1 8-3v-2M244 246v2c0 2 4 3 8 3s8-1 8-3v-2"/>
      ${spark(110, 92, 7, 0)}${spark(352, 50, 5, 2.6)}${spark(70, 176, 4, 5.1)}${spark(380, 200, 4, 3.8)}
    </svg>`,
    close: `<svg viewBox="0 0 640 170" aria-hidden="true">
      <path class="mp-faint" d="M10 150h620"/>
      <path class="mp-stone" d="M452 150V40c0-10 8-16 16-16h46c8 0 16 6 16 16v110"/>
      <path class="mp-door is-open" d="M466 150V50c0-6 4-10 10-10h30c6 0 10 4 10 10v100"/>
      <path class="mp-faint" d="M516 150l40-10V36l-40 4"/>
      <path d="M150 112h250M164 112v38M386 112v38M150 112l6-8h238l6 8"/>
      <path class="mp-loaf" d="M188 104c0-10 12-14 22-14s22 4 22 14ZM246 104c0-8 10-12 18-12s18 4 18 12Z"/>
      <path class="mp-jar" d="M310 104c-6-3-8-12-5-19 2-4 2-7 1-10h12c-1 3-1 6 1 10 3 7 1 16-5 19Z"/>
      <path class="mp-tone" d="M346 104h26l-3-12h-20Z"/>
      <path class="mp-faint" d="M120 150c4-14 18-22 30-24M430 150c-4-14-18-22-30-24"/>
      ${spark(90, 46, 6, 1.2)}${spark(600, 64, 5, 4)}${spark(270, 34, 4, 2.4)}
    </svg>`,
  };
})();
