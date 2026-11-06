// The drawings for The good news, in one hand: a thin stroke, round caps, a faint wash, the Gospels' colour as the
// study's colour. The motto is "A father running. / A door left open." So the hero is a house with its door open and
// lamplight across a road, and a line of running footprints coming out of the door to meet a far smaller set coming
// home. No face or figure of God, of Christ or of the father. Fixed strings written here, never built from data.
window.GNArt = (() => {
  const mini = (body) => `<svg viewBox="0 0 96 64" aria-hidden="true" class="gn-mini">${body}</svg>`;
  const prints = (points, cls = "gn-tone") => points.map(([x, y, r]) => `<ellipse class="${cls} gn-print" cx="${x}" cy="${y}" rx="2.2" ry="3.6" transform="rotate(${r} ${x} ${y})"/>`).join("");
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <ellipse class="gn-orbit" cx="210" cy="170" rx="196" ry="128"/>
      <path class="gn-faint" d="M8 250h404"/>
      <g><path d="M232 250V150l58-44 58 44v100"/><path class="gn-faint" d="M222 158l68-52 68 52"/><path class="gn-faint" d="M318 120v-26h14v36"/>
        <path class="gn-glow" d="M268 250v-62h34v62Z"/><path class="gn-tone" d="M268 250v-62h34v62"/><path d="M268 188l-16 8v62"/>
        <path class="gn-faint" d="M318 170h16v16h-16zM248 170h-0"/><circle class="gn-tone" cx="285" cy="176" r="2"/></g>
      <path class="gn-light" d="M268 250L120 318h260L302 250Z"/>
      <path class="gn-faint" d="M268 250C220 270 150 280 40 300M302 250c30 22 70 40 110 48"/>
      ${prints([[252, 262, -62], [236, 266, -66], [218, 271, -66], [200, 275, -70], [182, 279, -72], [164, 283, -74]])}
      ${prints([[70, 296, 104], [84, 293, 106], [98, 291, 104]], "gn-far")}
      <path class="gn-spark" d="M60 70h10m-5-5v10M372 52h10m-5-5v10M150 40h8m-4-4v8"/>
      <path class="gn-faint" d="M40 120c20-8 40-8 60 0M110 96c14-6 28-6 42 0"/>
    </svg>`,
    close: `<svg viewBox="0 0 640 170" aria-hidden="true">
      <path class="gn-faint" d="M0 140h640"/>
      <path d="M420 140V70l50-36 50 36v70"/><path class="gn-glow" d="M456 140V96h28v44Z"/><path class="gn-tone" d="M456 140V96h28v44"/><path d="M456 96l-12 6v44"/>
      <path class="gn-light" d="M456 140L330 168h210l-56-28Z"/>
      <path class="gn-faint" d="M40 150c120-6 240-8 290-10"/>
      ${prints([[440, 150, -80], [420, 152, -82], [400, 154, -84], [380, 155, -86]])}
      ${prints([[120, 152, 92], [140, 151, 92]], "gn-far")}
      <path class="gn-spark" d="M560 40h8m-4-4v8M90 60h8m-4-4v8"/>
    </svg>`,
    parts: {
      "01": mini(`<circle class="gn-tone" cx="48" cy="26" r="9"/><path class="gn-faint" d="M48 8v5M48 39v5M30 26h5M61 26h5M35 13l4 4M57 35l4 4M35 39l4-4M57 17l4-4"/><path d="M6 54c20-8 64-8 84 0"/>`),
      "02": mini(`<path class="gn-faint" d="M6 56h84"/>${prints([[22, 50, 70], [34, 46, 70], [46, 44, 80]], "")}<path class="gn-tone" d="M50 42c10-4 20-14 26-26" stroke-dasharray="2 5"/><path d="M76 16l2 8M76 16l-7 4"/>`),
      "03": mini(`<path d="M40 54h16l-2-10H42Z"/><path class="gn-glow" d="M48 42c-5-5-5-12 0-18 5 6 5 13 0 18Z"/><path class="gn-tone" d="M48 42c-5-5-5-12 0-18 5 6 5 13 0 18Z"/><circle class="gn-tone" cx="72" cy="54" r="3.5"/><path class="gn-faint" d="M6 58h84M64 50l-4-3M80 50l4-3"/>`),
      "04": mini(`<path d="M20 54V34a16 16 0 0 1 32 0v20"/><path class="gn-glow" d="M28 54V36a8 8 0 0 1 16 0v18Z"/><circle class="gn-tone" cx="64" cy="46" r="8"/><path class="gn-faint" d="M6 54h84"/><path class="gn-spark" d="M78 14h6m-3-3v6"/>`),
      "05": mini(`<path class="gn-faint" d="M6 56h84"/><path d="M14 46c18 0 30-4 40-14"/><path class="gn-tone" d="M54 32c6-6 14-8 22-4-4 8-12 14-24 16"/><path class="gn-tone" d="M70 24l6 4-4 6"/>`),
      "06": mini(`<path d="M30 56V26l18-14 18 14v30"/><path class="gn-glow" d="M42 56V40h12v16Z"/><path class="gn-tone" d="M42 56V40h12v16"/><path class="gn-faint" d="M6 56h84"/><path class="gn-faint" d="M70 50c4-3 8-3 12 0M70 54c4-3 8-3 12 0"/>`),
    },
  };
})();
