// The drawings for Encounters with Jesus: one thin stroke, round caps, one colour for the wash. Objects and places only: no person and no face. Fixed strings written here, never built from data.
const S = (body) => '<svg viewBox="0 0 64 64" aria-hidden="true">' + body + "</svg>";
window.ENArt = {
  hero: `<svg class="en-scene" viewBox="0 0 520 420" aria-hidden="true">
    <circle class="en-orbit" cx="260" cy="210" r="196"/>
    <circle class="en-faint" cx="260" cy="210" r="170"/>
    <path class="en-path-faint" d="M24 330c70-8 118-30 170-44"/>
    <path class="en-path-faint" d="M496 262c-60 6-106 16-164 26"/>
    <path class="en-path en-path-a" d="M24 330c70-8 118-30 170-44"/>
    <path class="en-path en-path-b" d="M496 262c-60 6-106 16-164 26"/>
    <path class="en-wash" d="M196 240h128v62c-30 12-98 12-128 0Z"/>
    <path d="M196 240c30-12 98-12 128 0s-98 12-128 0Z"/>
    <path d="M196 240v62c30 12 98 12 128 0v-62"/>
    <path class="en-faint" d="M212 262h96M204 280h112M196 268l18-2M300 274l24 4M230 298v-16M276 300v-20M250 262v14"/>
    <path d="M214 232V132M306 232V132"/>
    <path d="M200 134h120"/>
    <path d="M252 134v46"/>
    <path d="M244 180h16v14c0 5-16 5-16 0Z"/>
    <circle cx="214" cy="126" r="5"/><circle cx="306" cy="126" r="5"/>
    <path class="en-wash" d="M356 296c-10 0-16 10-16 26s8 30 22 30 22-14 22-30-6-26-16-26v-8h-12Z"/>
    <path d="M356 296c-10 0-16 10-16 26s8 30 22 30 22-14 22-30-6-26-16-26v-8h-12Z"/>
    <path d="M350 288h24"/>
    <path class="en-faint" d="M344 316c10 4 26 4 36 0"/>
    <path class="en-star" d="M116 110l2.4 6.6L125 119l-6.6 2.4L116 128l-2.4-6.6L107 119l6.6-2.4Z"/>
    <path class="en-star" d="M404 96l1.8 5.2 5.2 1.8-5.2 1.8-1.8 5.2-1.8-5.2-5.2-1.8 5.2-1.8Z"/>
    <path class="en-star" d="M148 204l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5Z"/>
    <path d="M36 372c150-8 298-8 448 0"/>
    <path class="en-faint" d="M78 388c122-5 242-5 364 0"/>
  </svg>`,
  nets: S(`<path d="M10 16c14 8 30 8 44 0"/><path class="en-wash" d="M12 18c2 16 8 30 20 36 12-6 18-20 20-36-13 7-27 7-40 0Z"/><path d="M12 18c2 16 8 30 20 36 12-6 18-20 20-36"/><path class="en-faint" d="M22 21l10 33M32 23v31M42 21L32 54M15 30c11 5 23 5 34 0M20 42c8 3 16 3 24 0"/><circle cx="10" cy="14" r="2"/><circle cx="54" cy="14" r="2"/>`),
  booth: S(`<path class="en-wash" d="M10 30h44v6H10Z"/><path d="M10 30h44v6H10ZM16 36v18M48 36v18"/><path d="M14 30V14h36v16"/><path class="en-faint" d="M14 20h36"/><circle cx="26" cy="27" r="3"/><circle cx="34" cy="27" r="3"/><circle cx="30" cy="23" r="3"/>`),
  jar: S(`<path class="en-wash" d="M24 16c-8 4-12 12-12 20 0 10 8 18 20 18s20-8 20-18c0-8-4-16-12-20Z"/><path d="M24 16c-8 4-12 12-12 20 0 10 8 18 20 18s20-8 20-18c0-8-4-16-12-20"/><path d="M22 10h20M24 10v6M40 10v6"/><path class="en-faint" d="M16 34c10 4 22 4 32 0"/>`),
  hand: S(`<path class="en-wash" d="M22 54V30l-6-10c-2-4 3-6 5-3l5 8V10c0-4 5-4 5 0v13-15c0-4 5-4 5 0v15-12c0-4 5-4 5 0v14-9c0-4 5-4 5 0v22c0 8-3 12-5 16Z"/><path d="M22 54V30l-6-10c-2-4 3-6 5-3l5 8V10c0-4 5-4 5 0v13M31 23V8c0-4 5-4 5 0v15M36 23V11c0-4 5-4 5 0v14M41 25v-9c0-4 5-4 5 0v22c0 8-3 12-5 16"/>`),
  door: S(`<path class="en-wash" d="M16 58V8h32v50Z"/><path d="M16 58V8h32v50M10 58h44"/><path class="en-faint" d="M24 8v50M32 8v50M40 8v50"/><path d="M14 28h36M14 38h36"/><circle cx="43" cy="33" r="2"/>`),
  tree: S(`<path class="en-wash" d="M32 8c-10 0-20 6-20 16 0 8 8 12 20 12s20-4 20-12c0-10-10-16-20-16Z"/><path d="M32 8c-10 0-20 6-20 16 0 8 8 12 20 12s20-4 20-12c0-10-10-16-20-16Z"/><path d="M28 58c2-8 2-16 1-24M36 58c-2-8-2-16-1-24"/><path d="M29 40c-5-1-9-4-11-8M35 42c5-1 9-4 11-9"/><path class="en-faint" d="M10 58h44"/>`),
  bowl: S(`<path class="en-wash" d="M10 32h44c0 14-10 20-22 20s-22-6-22-20Z"/><path d="M10 32h44c0 14-10 20-22 20s-22-6-22-20ZM24 52v4h16v-4"/><path d="M18 26c0-6 6-10 14-10s14 4 14 10"/><path class="en-faint" d="M24 20c3 3 3 6 0 8M32 18c3 3 3 7 0 10M40 20c3 3 3 6 0 8"/>`),
  cloak: S(`<path class="en-wash" d="M14 10h36l6 34H8Z"/><path d="M14 10h36l6 34H8Z"/><path d="M12 50v4M18 50v5M24 50v4M30 50v5M36 50v4M42 50v5M48 50v4M54 50v4"/><path d="M8 44c0 3 2 6 4 6h40c2 0 4-3 4-6"/><path class="en-faint" d="M26 10l-4 34M38 10l4 34"/>`),
  lamp: S(`<path class="en-wash" d="M12 38c8-6 28-6 36 0l10-4c-2 10-10 14-22 14s-20-2-24-10Z"/><path d="M12 38c8-6 28-6 36 0l10-4c-2 10-10 14-22 14s-20-2-24-10Z"/><path d="M26 48v6h12v-6"/><path d="M52 30c-3-3-3-7 0-12 3 5 3 9 0 12Z"/><path class="en-star" d="M16 12l1.2 3.4 3.4 1.2-3.4 1.2L16 21.2l-1.2-3.4-3.4-1.2 3.4-1.2Z"/><path class="en-star" d="M34 8l1 2.8 2.8 1-2.8 1L34 15.6l-1-2.8-2.8-1 2.8-1Z"/>`),
  eye: S(`<path class="en-wash" d="M6 32c8-12 18-18 26-18s18 6 26 18c-8 12-18 18-26 18S14 44 6 32Z"/><path d="M6 32c8-12 18-18 26-18s18 6 26 18c-8 12-18 18-26 18S14 44 6 32Z"/><circle cx="32" cy="32" r="8"/><circle class="en-faint" cx="32" cy="32" r="3"/>`),
  coin: S(`<circle class="en-wash" cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="22"/><circle class="en-faint" cx="32" cy="32" r="17"/><path d="M28 44c0-6-2-8-2-14s4-10 8-10 7 3 7 7c0 2 2 4 3 6l-4 1v5h-4v5"/>`),
  road: S(`<path class="en-wash" d="M4 58c12-12 26-10 32-20 4-7 10-14 24-16v6c-11 2-16 8-20 14-7 11-20 12-28 16Z"/><path d="M4 58c12-12 26-10 32-20 4-7 10-14 24-16M12 58c8-4 21-5 28-16 4-6 9-12 20-14"/><path class="en-faint" d="M4 40c6-6 12-8 18-8"/><path class="en-star" d="M44 12l1.2 3.4 3.4 1.2-3.4 1.2L44 21.2l-1.2-3.4-3.4-1.2 3.4-1.2Z"/>`),
  thrown: S(`<path class="en-wash" d="M12 46c2-12 12-22 24-22 8 0 14 4 18 12l-6 14c-12 4-26 4-36-4Z"/><path d="M12 46c2-12 12-22 24-22 8 0 14 4 18 12l-6 14c-12 4-26 4-36-4Z"/><path class="en-faint" d="M24 34c4 6 8 10 14 16M36 28c2 6 6 10 12 14"/><path d="M6 58h52"/><path class="en-faint" d="M46 16l6-6M40 12l2-6"/>`),
  stone: S(`<path class="en-wash" d="M6 54c0-26 12-42 26-42s26 16 26 42Z"/><path d="M6 54c0-26 12-42 26-42s26 16 26 42Z"/><circle class="en-wash" cx="32" cy="40" r="14"/><circle cx="32" cy="40" r="14"/><path d="M2 54h60"/><path class="en-faint" d="M24 34c4-4 12-4 16 0M22 44c6 3 14 3 20 0"/>`),
  tears: S(`<path class="en-wash" d="M32 8c-8 12-12 18-12 24a12 12 0 0 0 24 0c0-6-4-12-12-24Z"/><path d="M32 8c-8 12-12 18-12 24a12 12 0 0 0 24 0c0-6-4-12-12-24Z"/><path d="M14 40c-3 4-4 6-4 8a4 4 0 0 0 8 0c0-2-1-4-4-8ZM50 42c-3 4-4 6-4 8a4 4 0 0 0 8 0c0-2-1-4-4-8Z"/><path class="en-faint" d="M6 60h52"/>`),
  foot: `<svg viewBox="0 0 1200 110" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <path d="M0 96c120-14 210-24 320-16 60 4 110-22 190-22s130 18 180 20c130 6 300-22 510 12"/>
    <path class="en-path" d="M180 100c90-18 210-24 330-34M1030 96c-110-22-240-30-368-30"/>
    <path d="M556 66V52c0-8 44-8 44 0v14"/>
    <path d="M556 52c8 5 36 5 44 0"/>
    <path class="en-faint" d="M410 74h110M640 72h120"/>
    <path class="en-star" d="M300 26l1.8 5.2 5.2 1.8-5.2 1.8-1.8 5.2-1.8-5.2-5.2-1.8 5.2-1.8Z"/>
    <path class="en-star" d="M880 20l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5Z"/>
  </svg>`,
};
