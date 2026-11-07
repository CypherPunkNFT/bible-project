// The drawings for Children and the home, in one hand: a thin stroke, round caps, a faint wash, History orange as the
// study's colour. The hero is the study's motto: a doorpost with its small case (Deuteronomy 6:9), the road that runs
// from it to the horizon (6:7), five young olive saplings along it for the five links of Psalm 78:5–6, and an olive with young shoots at
// its foot beside a low table, shoots around it (Psalm 128:3). No one is drawn: no face or figure of God, of Christ, of the father in Luke 15, or of anyone.
// Fixed strings written here, never built from data.
window.CHArt = (() => {
  const stones = [[236, 252, 11], [262, 228, 8.5], [281, 210, 6.5], [295, 196, 5], [305, 185, 3.8]]
    .map(([x, y, s], i) => `<g class="ch-sapling" style="animation-delay:-${i * 1.6}s" transform="translate(${x} ${y}) scale(${s / 10})"><path d="M0 0v-16"/><path class="ch-leaf-s" d="M0-9c-5-1-8-4-8-8 5 0 8 3 8 8ZM0-13c4-1 7-4 7-8-4 0-7 3-7 8Z"/></g>`).join("");
  const leaves = [[-26, -64, -30], [-8, -76, 10], [14, -70, 34], [-30, -48, -50], [24, -54, 50], [2, -88, -8], [-16, -86, -24], [20, -82, 22]]
    .map(([x, y, r], i) => `<path class="ch-leaf" style="animation-delay:-${i * .9}s" transform="translate(${x} ${y}) rotate(${r})" d="M0 0c4-3 10-3 14 0-4 3-10 3-14 0Z"/>`).join("");
  const marks = {
    doorpost: '<path d="M6 21V4h12v17"/><path class="ch-mark-tone" d="M15.2 7.2l1.7.7-1 2.8-1.7-.7z"/><path d="M4 21h16"/>',
    steps: '<path d="M3 20h4.5v-4h4.5v-4h4.5v-4H21"/><path class="ch-mark-tone" d="M18 4.5l2 1.5-2 1.5"/>',
    road: '<path d="M3 20c5-.5 8-3 9.5-7S17 6 21 5"/><circle class="ch-mark-tone" cx="21" cy="5" r="1.4"/><path d="M6 21.5c4-1 7.5-3.5 9-7"/>',
    scales: '<path d="M12 4v15M7 20h10M5 8h14"/><path class="ch-mark-tone" d="M5 8l-2.5 5h5zM19 8l-2.5 5h5z"/>',
    letter: '<path d="M4 6h16v12H4z"/><path d="M4 6l8 6 8-6"/>',
  };
  const mark = (name, size = 24) => `<svg class="ch-mark" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${marks[name] || ""}</svg>`;
  const mini = {
    "01": '<path d="M18 52V10h24v42"/><path class="ch-tone" d="M36.5 18l3.4 1.4-2 5.6-3.4-1.4z"/><path class="ch-faint" d="M10 52h40M22 52V14"/>',
    "02": '<path d="M8 40h44M14 40v12M46 40v12"/><path class="ch-tone" d="M20 40c0-6 1-12 2-14h8c1 2 2 8 2 14"/><path class="ch-faint" d="M36 38c2-3 10-3 12 0"/><path class="ch-faint" d="M24 22c0-3 4-3 4-6"/>',
    "03": '<path d="M12 52V28l18-14 18 14v24z"/><path class="ch-faint" d="M26 52V40h8v12"/><path class="ch-tone" d="M46 6a7 7 0 1 0 6 10 6 6 0 0 1-6-10z"/>',
    "04": '<path d="M22 10h16l10 10-6 5-4-4v31H22V21l-4 4-6-5z"/><path class="ch-tone" d="M22 30h16M22 38h16M22 46h16"/>',
    "05": '<path d="M6 52l14-30h20l14 30"/><path d="M20 22l10 30 10-30"/><path class="ch-faint" d="M4 52h52"/><path class="ch-tone" d="M30 10v6M27 13h6"/>',
    "06": '<path class="ch-faint" d="M4 24h52"/><path d="M14 54c6-10 12-20 15-30M46 54c-6-10-10-20-13-30"/><path class="ch-tone" d="M40 44c0-3 1-4 2-4s2 1 2 4z"/>',
  };
  const miniature = (n) => `<svg class="ch-mini" viewBox="0 0 60 60" aria-hidden="true">${mini[n] || ""}</svg>`;
  return {
    mark, miniature,
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <circle class="ch-disc" cx="210" cy="168" r="150"/>
      <ellipse class="ch-orbit" cx="210" cy="168" rx="198" ry="132"/>
      <path class="ch-faint" d="M150 172c40-10 70-14 104-10 34 4 70 2 120-10"/>
      <path class="ch-faint" d="M210 166c24-16 50-22 74-16M318 160c16-10 34-12 52-6"/>
      <g class="ch-sun"><path class="ch-tone" d="M308 168a24 24 0 0 1 48 0"/>
        <path class="ch-ray" d="M332 132v-10M306 142l-7-7M358 142l7-7M296 160h-10M368 160h10"/></g>
      <path d="M118 262c46-14 120-50 186-92"/>
      <path d="M254 262c10-24 34-56 58-90"/>
      <path class="ch-faint" d="M196 248c18-8 32-16 46-26M262 196c8-8 16-16 22-22"/>
      ${stones}
      <path d="M78 262V64M112 262V64"/><path d="M68 64h54M72 56h46"/>
      <path class="ch-faint" d="M86 252V76M104 252V76"/>
      <path class="ch-case" d="M100 104l8 3.6-5 14.4-8-3.6z"/>
      <path class="ch-tone" d="M101.5 108.5l3 1.4"/>
      <path class="ch-faint" d="M14 262h392"/>
      <path d="M298 242h48M304 242v20M340 242v20"/><path class="ch-faint" d="M310 236h8M326 236h8"/>
      <path class="ch-shoot" d="M290 262c-1-5 0-9 3-12M290 255l-4-2"/>
      <g transform="translate(366 262)"><path d="M0 0v-44M0-30c-6-6-14-8-20-8M0-38c6-6 12-8 18-8"/>${leaves}
        <path class="ch-shoot" d="M-14 0c-2-6-1-12 3-16M-14-8l-5-3M16 0c1-6 0-10-3-14M15-8l5-2"/></g>
      <path class="ch-spark" d="M48 52h10m-5-5v10M372 64h10m-5-5v10M200 40h8m-4-4v8"/>
    </svg>`,
    close: `<svg viewBox="0 0 640 140" aria-hidden="true">
      <path class="ch-faint" d="M0 112h640"/>
      <path d="M40 112V30h28v82"/><path class="ch-tone" d="M60 44l5 2.2-3 8.6-5-2.2z"/>
      <path d="M68 112c120-6 240-30 360-62s140-20 200-14"/>
      <path class="ch-faint" d="M68 124c140-4 280-24 420-56"/>
      <path class="ch-tone" d="M560 50a14 14 0 0 1 28 0"/>
      <path class="ch-spark" d="M300 24h8m-4-4v8M470 18h8m-4-4v8"/>
    </svg>`,
  };
})();
