// The drawings for The signs and works of Jesus: one thin stroke, round caps. Objects and places only: no person and no face. Fixed strings written here, never built from data.
const S = (body) => '<svg viewBox="0 0 64 64" aria-hidden="true">' + body + "</svg>";
window.SWArt = {
  hero: `<svg class="sw-scene" viewBox="0 0 520 420" aria-hidden="true">
    <circle class="sw-orbit" cx="260" cy="210" r="196"/>
    <circle class="sw-faint" cx="260" cy="210" r="170"/>
    <path class="sw-cord-faint" d="M24 150c70 26 150 26 236 0s166-26 236 0"/>
    <path class="sw-cord" d="M24 150c70 26 150 26 236 0s166-26 236 0"/>
    <path class="sw-star" d="M260 112l9 29 29 9-29 9-9 29-9-29-29-9 29-9Z"/>
    <path d="M260 112l9 29 29 9-29 9-9 29-9-29-29-9 29-9Z"/>
    <path class="sw-wash" d="M170 296h180l-22 34c-40 8-96 8-136 0Z"/>
    <path d="M170 296h180l-22 34c-40 8-96 8-136 0Z"/>
    <path d="M260 296v-64M260 240l44 46h-44"/>
    <path class="sw-faint" d="M198 312h124M212 324h96"/>
    <path d="M36 350c40-14 66-14 106 0s66 14 106 0 66-14 106 0 66 14 130 0"/>
    <path class="sw-faint" d="M70 376c34-10 56-10 90 0s56 10 90 0 56-10 90 0 56 10 110 0"/>
  </svg>`,
  foot: `<svg viewBox="0 0 1200 110" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <path d="M0 80c160-30 300-30 460 0s300 30 460 0 200-30 280 0"/>
    <path class="sw-faint" d="M0 90c160-20 300-20 460 0s300 20 460 0 200-20 280 0"/>
    <path class="sw-star" d="M600 48l5 16 16 5-16 5-5 16-5-16-16-5 16-5Z"/>
    <path d="M600 48l5 16 16 5-16 5-5 16-5-16-16-5 16-5Z"/>
  </svg>`,
  star: S(`<path d="M32 6l7 19 19 7-19 7-7 19-7-19-19-7 19-7Z"/>`),
};
