// The drawings for The Ten Commandments, in one hand: a thin stroke, round caps, a faint wash, History orange as the
// study's colour. The motto is "Two stones. One voice. / Rescue first, then the words." So the hero is two stone
// tablets on a ledge at the foot of a mountain under cloud, with a dotted road climbing to them from the waves of the
// sea: the rescue comes first, and the words are reached by it. No face or figure of God. Fixed strings, never data.
window.TCArt = (() => {
  // A small pair of stones: the lintel line above (the preface), four lines on the left stone, six on the right.
  // "lit" names what this part reads: "pre", "left", "right", "both" or "four".
  function stones(lit) {
    const on = (yes) => (yes ? "tc-tone" : "tc-faint");
    const left = [0, 1, 2, 3].map((i) => `<path class="${on(lit === "left" || lit === "both" || (lit === "four" && i === 3))}" d="M18 ${30 + i * 7}h20"/>`).join("");
    const right = [0, 1, 2, 3, 4, 5].map((i) => `<path class="${on(lit === "right" || lit === "both")}" d="M58 ${27 + i * 5.4}h20"/>`).join("");
    const extra = lit === "both" ? `<path class="tc-tone" d="M28 18c8-8 32-8 40 0" stroke-dasharray="2 4"/>`
      : lit === "four" ? `<circle class="tc-tone" cx="86" cy="58" r="4"/><path class="tc-faint" d="M78 58h-4M86 50v-3M92 52l2-2"/>` : "";
    return `<svg viewBox="0 0 96 64" aria-hidden="true" class="tc-mini">
      <path class="${on(lit === "pre")}" d="M12 12h72"/>
      <path d="M12 60V26a16 14 0 0 1 32 0v34Z"/><path d="M52 60V26a16 14 0 0 1 32 0v34Z"/>
      ${left}${right}${extra}<path class="tc-faint" d="M4 60h88"/></svg>`;
  }
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <ellipse class="tc-orbit" cx="210" cy="172" rx="196" ry="130"/>
      <circle class="tc-ring" cx="210" cy="172" r="150"/>
      <g class="tc-cloud"><path class="tc-wash" d="M150 74c6-20 34-24 46-10 10-16 40-14 46 6 18-2 30 10 26 24H136c-8-10 0-22 14-20Z"/>
        <path d="M150 74c6-20 34-24 46-10 10-16 40-14 46 6 18-2 30 10 26 24H136c-8-10 0-22 14-20Z"/></g>
      <path class="tc-faint" d="M70 236l78-112 34 30 30-48 40 52 26-22 82 100"/>
      <path class="tc-faint" d="M182 154l-10 26M212 106l-6 30M252 158l10 24"/>
      <path d="M150 242h134" class="tc-faint"/>
      <g class="tc-stones">
        <path class="tc-wash" d="M168 240v-62a22 20 0 0 1 44 0v62Z"/><path class="tc-tone" d="M168 240v-62a22 20 0 0 1 44 0v62Z"/>
        <path class="tc-wash" d="M222 240v-62a22 20 0 0 1 44 0v62Z"/><path class="tc-tone" d="M222 240v-62a22 20 0 0 1 44 0v62Z"/>
        <path class="tc-faint" d="M178 186h24M178 198h24M178 210h24M178 222h24"/>
        <path class="tc-faint" d="M232 184h24M232 194h24M232 204h24M232 214h24M232 224h24M232 232h18"/>
      </g>
      <path class="tc-road" d="M40 300c40-6 70-10 92-24s30-28 52-34"/>
      <path class="tc-wave" d="M8 304c10-6 20-6 30 0s20 6 30 0M14 318c10-6 20-6 30 0s20 6 30 0s20 6 30 0"/>
      <path class="tc-spark" d="M96 70h10m-5-5v10M330 58h10m-5-5v10M372 150h8m-4-4v8M60 150h8m-4-4v8"/>
    </svg>`,
    parts: { "01": stones("pre"), "02": stones("left"), "03": stones("right"), "04": stones("both"), "05": stones("four") },
  };
})();
