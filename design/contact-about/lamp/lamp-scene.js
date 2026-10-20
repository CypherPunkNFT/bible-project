// The landing drawing for direction D: Jacksonville at night. Stars over the St. Johns River, a cable-stayed bridge, the
// city and a church steeple across the water, and on the near bank one lit window, reflected in the river: where the work
// is done. Everything loops slowly (stars, water, the lamp); styles in lamp.css (.lp-scene).
window.lampScene = () => {
  let seed = 7;
  const random = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const stars = Array.from({ length: 70 }, (_, i) => {
    const x = random() * 900, y = random() * 230, r = random() < .15 ? 1.6 : .9;
    return `<circle class="lp-star${i % 4 === 0 ? " lp-twinkle" : ""}" style="--i:${i % 9}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/>`;
  }).join("");

  // The skyline across the river: [x, width, height]; a few windows lit.
  const towers = [[352, 26, 52], [380, 18, 78], [400, 30, 112], [432, 22, 64], [456, 34, 140], [492, 20, 90], [514, 28, 120], [544, 18, 70], [564, 32, 96], [598, 22, 58], [622, 26, 84], [650, 18, 46]];
  const city = towers.map(([x, w, h]) => {
    const top = 330 - h;
    const lit = Array.from({ length: Math.floor(h / 22) }, (_, j) => (j + x) % 3 === 0 ? `<rect class="lp-lit" x="${x + w / 2 - 2}" y="${top + 10 + j * 20}" width="4" height="5"/>` : "").join("");
    return `<path class="lp-paper" d="M${x} 330V${top}H${x + w}V330"/>${lit}`;
  }).join("");

  // The bridge: two A-frame pylons, the deck and the fan of stays.
  const pylon = (x) => `<path d="M${x - 10} 352L${x} 214L${x + 10} 352"/><path class="lp-faint" d="M${x - 6} 300H${x + 6}"/>` +
    [0, 1, 2, 3, 4, 5].map((k) => `<path class="lp-stay" d="M${x} ${222 + k * 6}L${x - 30 - k * 24} 338M${x} ${222 + k * 6}L${x + 30 + k * 24} 338"/>`).join("");
  const water = [376, 392, 410, 430, 452].map((y, i) => `<path class="lp-wave" style="--i:${i}" d="M0 ${y}${Array.from({ length: 10 }, (_, k) => `q22 -${3 - (i % 2)} 45 0t45 0`).join("")}"/>`).join("");

  return `<svg viewBox="0 0 900 520" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <defs><radialGradient id="lp-window-glow"><stop offset="0" stop-color="var(--accent)" stop-opacity=".45"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></radialGradient></defs>
    ${stars}
    <path class="lp-moon" d="M792 58a30 30 0 1 0 22 50a24 24 0 1 1 -22 -50Z"/>
    <path class="lp-faint" d="M0 330Q120 318 240 326T470 322T900 328"/>
    <g class="lp-city">${city}
      <path class="lp-paper" d="M232 330V250L250 222L268 250V330Z"/><path d="M250 222V170"/><path class="lp-accent" d="M250 150V176M241 160H259" stroke-width="1.6"/>
      <path class="lp-faint" d="M240 276H260M240 296H260"/><path class="lp-paper" d="M268 330V286H312V330"/><path class="lp-faint" d="M282 330V308Q290 300 298 308V330"/>
    </g>
    <g class="lp-bridge">${pylon(170)}${pylon(740)}<path d="M0 340Q450 326 900 340M0 352Q450 338 900 352"/></g>
    <path class="lp-river" d="M0 360H900V470H0Z"/>
    ${water}
    <g class="lp-reflection">${[0, 1, 2, 3, 4, 5].map((k) => `<path style="--i:${k}" d="M${646 + (k % 3) * 6} ${372 + k * 15}h${22 - k * 2}"/>`).join("")}</g>
    <g class="lp-house">
      <path class="lp-paper" d="M600 470V378L650 340L700 378V470Z"/>
      <path d="M592 384L650 334L708 384"/><path class="lp-faint" d="M676 352V336H690V364"/>
      <rect class="lp-window" x="626" y="392" width="48" height="40" rx="2"/>
      <circle class="lp-halo" cx="650" cy="412" r="70" stroke="none"/>
      <path class="lp-faint" d="M650 392V432M626 412H674"/>
      <path class="lp-lamp" d="M640 428V420M634 428H646M640 420L652 404M646 402L660 404L656 410Z"/>
      <path class="lp-faint" d="M614 470V448H632V470"/>
    </g>
    <path d="M0 470Q200 462 420 468T900 466"/>
    ${Array.from({ length: 34 }, (_, k) => `<path class="lp-faint" d="M${12 + k * 26} 478l3 -7M${20 + k * 26} 480l-2 -6"/>`).join("")}
    <g class="lp-callouts">
      <path d="M250 146V112"/><circle cx="250" cy="112" r="2"/><text x="250" y="102" text-anchor="middle">HIS CHURCH</text>
      <path d="M700 410H770"/><circle cx="770" cy="410" r="2"/><text x="778" y="413">WHERE IT IS BUILT</text>
      <path d="M456 186V160"/><circle cx="456" cy="160" r="2"/><text x="456" y="150" text-anchor="middle">JACKSONVILLE, FLORIDA</text>
    </g>
  </svg>`;
};
