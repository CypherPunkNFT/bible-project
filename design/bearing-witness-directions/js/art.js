// The drawings for Witness and the nations: one thin stroke, round caps, the letters' colour for the light. A city on a
// hill with the three rings of Acts 1:8 around it, the chain of Romans 10:14-15 reaching out across them, and a shoot at
// the far edge (1 Corinthians 3:6). No person and no face. Fixed strings written here, never built from data.
window.BWArt = (() => {
  // One chain link as a long oval, turned along the chain's line.
  const link = (x, y, turn, cls = "") => `<ellipse class="bw-link ${cls}" cx="${x}" cy="${y}" rx="15" ry="6.5" transform="rotate(${turn} ${x} ${y})"/>`;
  const links = [[182, 262, -38], [204, 245, -38], [227, 226, -36], [251, 208, -34], [276, 191, -32]]
    .map(([x, y, turn], index) => link(x, y, turn, `bw-l${index + 1}`)).join("");
  return {
    hero: `<svg class="bw-scene" viewBox="0 0 460 400" aria-hidden="true">
      <circle class="bw-halo" cx="230" cy="214" r="168"/>
      <ellipse class="bw-orbit" cx="230" cy="214" rx="214" ry="150"/>
      <path class="bw-faint bw-ring" d="M150 318a80 80 0 0 1 160 0"/>
      <path class="bw-faint bw-ring" d="M96 318a134 134 0 0 1 268 0"/>
      <path class="bw-faint bw-ring" d="M40 318a190 190 0 0 1 380 0"/>
      <path class="bw-faint" d="M20 318h420"/>
      <path class="bw-hill" d="M150 318c22-26 46-36 80-36s58 10 80 36Z"/>
      <path d="M196 296v-22h10v-8h8v8h12v-8h8v8h12v-8h8v8h10v22"/>
      <path class="bw-light" d="M224 296v-10a6 6 0 0 1 12 0v10Z"/>
      <path d="M224 296v-10a6 6 0 0 1 12 0v10"/>
      <path class="bw-faint" d="M200 282h6M254 282h6"/>
      <g class="bw-chain">${links}</g>
      <path class="bw-faint" d="M290 180l40-34"/>
      <path class="bw-accent" d="M372 132c0-14 4-24 12-30M372 132c-2-10-8-16-16-18M384 102c6 0 10 4 11 9-6 2-10-2-11-9ZM356 114c-5 3-9 2-11-3 5-3 9-2 11 3Z"/>
      <path class="bw-faint" d="M356 134h32"/>
      <path class="bw-faint" d="M70 120c18-6 34-6 50 0M330 70c14-5 28-5 42 0M110 76c10-4 20-4 30 0"/>
    </svg>`,
    // The chain figure's links, drawn behind the words (section 01). Five, in a row.
    chainRow: `<svg class="bw-chain-svg" viewBox="0 0 500 40" preserveAspectRatio="none" aria-hidden="true">
      <path class="bw-faint" d="M0 20h500"/>
      ${[50, 150, 250, 350, 450].map((x) => `<rect class="bw-link" x="${x - 40}" y="8" width="80" height="24" rx="12"/>`).join("")}
    </svg>`,
    // Acts 1:8, three rings around Jerusalem (part 01). The labels are words set beside it by the page.
    rings: `<svg class="bw-rings-svg" viewBox="0 0 240 132" aria-hidden="true">
      <path class="bw-faint" d="M4 126h232"/>
      <path class="bw-ring-1" d="M90 126a30 30 0 0 1 60 0"/>
      <path class="bw-ring-2" d="M54 126a66 66 0 0 1 132 0"/>
      <path class="bw-ring-3 bw-accent" d="M12 126a108 108 0 0 1 216 0"/>
      <path d="M110 126v-9h4v-4h4v4h4v-4h4v4h4v9"/>
    </svg>`,
    // The close: planted, watered, grown (1 Corinthians 3:6), on one line of ground.
    foot: `<svg viewBox="0 0 1200 110" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path class="bw-faint" d="M0 96h1200"/>
      <path class="bw-faint" d="M760 96c0-4 4-6 8-6s8 2 8 6"/><circle cx="768" cy="99" r="2.2"/>
      <path class="bw-faint" d="M880 70v4M888 64v4M872 62v4"/><path d="M872 96c0-3 4-5 8-5s8 2 8 5M880 91v-8"/>
      <path class="bw-accent" d="M1000 96V54M1000 74c-10-2-18-8-20-18 10 0 18 6 20 18ZM1000 62c8-2 14-8 16-16-8 0-14 6-16 16Z"/>
      <path class="bw-faint" d="M40 98c160-4 360-4 680-2"/>
    </svg>`,
  };
})();
