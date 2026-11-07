// The drawings for Leviticus: holiness and sacrifice, in one hand: a thin stroke, round caps, a faint wash, History
// orange as the study's colour. The motto is Leviticus 1:1, "The LORD called / from the Tent of Meeting." So the hero is
// the court and the Tent of Meeting with the cloud settled over it and smoke rising from the altar. No face or figure of
// God: the cloud stands for His presence. Fixed strings written here, never built from data.
window.LevArt = (() => {
  const posts = (x0, x1, y, step) => Array.from({ length: Math.floor((x1 - x0) / step) + 1 }, (_, i) => `M${x0 + i * step} ${y}v-16`).join("");
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <ellipse class="lv-orbit" cx="210" cy="172" rx="196" ry="128"/>
      <path class="lv-faint" d="M10 262h400"/>
      <g class="lv-cloud"><path class="lv-wash" d="M226 92c-4-16 12-26 26-20 6-16 32-18 40-2 14-6 30 2 28 18 12 2 16 18 4 24h-92c-14-2-16-18-6-20Z"/>
        <path class="lv-tone" d="M226 92c-4-16 12-26 26-20 6-16 32-18 40-2 14-6 30 2 28 18 12 2 16 18 4 24h-92c-14-2-16-18-6-20Z"/>
        <path class="lv-faint" d="M260 118v22M286 118v26M312 118v20" stroke-dasharray="2 5"/></g>
      <g><path d="M232 214v-58h112v58"/><path class="lv-faint" d="M226 158l6-4h112l6 4"/><path class="lv-faint" d="M262 156v58M314 156v58"/>
        <path class="lv-tone" d="M232 214v-46h30v46"/><path class="lv-faint" d="M240 176h14M240 186h14M240 196h14"/></g>
      <path d="M60 262v-24h300v24" class="lv-faint"/><path class="lv-faint" d="${posts(60, 360, 262, 20)}"/>
      <path class="lv-faint" d="M60 238h120M240 238h120"/><path class="lv-faint" d="M180 238c10-6 50-6 60 0" stroke-dasharray="2 4"/>
      <g><path d="M120 252v-22h36v22"/><path d="M118 230h40"/><path d="M120 230v-5M156 230v-5"/>
        <path class="lv-glow" d="M128 230c2-6 6-8 10-6 2-5 8-5 10 0"/></g>
      <path class="lv-smoke" d="M138 222c-6-14 8-20 2-34s8-22 2-36"/>
      <path class="lv-smoke lv-smoke-2" d="M144 222c6-12-6-20 0-32s-6-22 2-34"/>
      <path class="lv-spark" d="M64 72h10m-5-5v10M378 60h10m-5-5v10M168 46h8m-4-4v8"/>
      <path class="lv-faint" d="M24 300c60-6 120-8 180-6M230 296c50-4 110-2 170 4"/>
    </svg>`,
    close: `<svg viewBox="0 0 640 150" aria-hidden="true">
      <path class="lv-faint" d="M0 128h640"/>
      <path d="M380 128v-44h104v44"/><path class="lv-faint" d="M374 86l6-4h104l6 4"/><path class="lv-tone" d="M380 128v-34h28v34"/>
      <path class="lv-faint" d="M40 116c40-8 80-12 140-12M60 128c30-14 70-22 120-22" stroke-dasharray="3 6"/>
      <path class="lv-faint" d="M200 128c20-4 40-4 60 0M520 128c20-4 40-4 60 0"/>
      <path class="lv-spark" d="M560 40h8m-4-4v8M110 56h8m-4-4v8"/>
    </svg>`,
  };
})();
