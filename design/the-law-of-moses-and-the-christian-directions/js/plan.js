// The plan of the camp, drawn as nested outlines: the land, the camp, the court with its altar, the Holy Place and the
// Most Holy Place behind the veil, with the wilderness beyond. A schematic, not to scale. The same plan is the large
// graphic in section 00 and the miniature at the head of every part. Fixed geometry; only the lit zone, the points and
// the reading (Israel or the New Testament) change.
window.LevPlan = (() => {
  const W = 640, H = 360;
  // Where each point stands, in plan units. 04w is part 04's second point, the goat sent into the wilderness.
  const at = { "01": [215, 180], "02": [330, 180], "03": [38, 205], "04": [430, 180], "04w": [592, 92], "05": [578, 292], "06": [112, 78], "07": [320, 330] };
  const zones = {
    land: `<rect class="lv-z lv-z-land" x="6" y="6" width="628" height="348"/>`,
    camp: `<rect class="lv-z lv-z-camp" x="70" y="40" width="440" height="260"/>`,
    court: `<path class="lv-z lv-z-court" d="M150 162V120h320v120H150v-42"/>`,
    holy: `<rect class="lv-z lv-z-holy" x="330" y="160" width="80" height="40"/>`,
    "most-holy": `<rect class="lv-z lv-z-most" x="410" y="160" width="40" height="40"/>`,
    outside: `<path class="lv-z lv-z-out" d="M8 120h60M8 290h60"/>`,
  };
  const labels = `<g class="lv-plan-labels">
      <text x="16" y="24">The land</text><text x="80" y="58">The camp</text><text x="160" y="136">The court</text>
      <text x="334" y="154">Holy Place</text><text x="372" y="226">Most Holy Place</text>
      <text x="14" y="140">Outside</text><text x="14" y="153">the camp</text><text x="548" y="64">Wilderness</text>
      <text x="196" y="208">altar</text><text x="540" y="252">the field</text></g>`;
  const furniture = `<rect class="lv-altar" x="205" y="170" width="20" height="20"/>
      <path class="lv-faint" d="M96 92l8-10 8 10M126 90l8-10 8 10M96 260l8-10 8 10M470 92l8-10 8 10M470 262l8-10 8 10M160 280l8-10 8 10"/>
      <path class="lv-faint" d="M530 270h88M530 282h88M530 294h88M530 306h88M530 318h88"/>
      <path class="lv-faint lv-goat-path" d="M450 180C490 170 500 120 592 92"/>`;
  function svg({ zone = null, points = [], mode = "israel", mini = false } = {}) {
    const veil = mode === "nt"
      ? `<path class="lv-veil lv-veil-open" d="M410 160v12M410 188v12"/><path class="lv-way" d="M150 180H446"/>`
      : `<path class="lv-veil" d="M410 160v40"/>`;
    const lit = zone ? zones[zone].replace('class="lv-z', 'class="lv-z is-lit') : "";
    const dots = points.map((n) => at[n] ? `<circle class="lv-pt" cx="${at[n][0]}" cy="${at[n][1]}" r="${mini ? 12 : 5}"/>` : "").join("");
    return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true" class="${mini ? "lv-plan-mini" : "lv-plan-svg"}">
      ${Object.values(zones).join("")}${lit}${furniture}${veil}${mini ? "" : labels}${dots}</svg>`;
  }
  return { svg, at, W, H };
})();
