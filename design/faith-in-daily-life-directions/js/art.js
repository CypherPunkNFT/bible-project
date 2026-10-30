// The drawings for Faith in daily life, all in one hand: one thin stroke, round caps, a faint wash, the Epistles gold as
// the study's colour, slow loops. Fixed strings written here, never built from data. Illustrative only.
window.FDArt = (() => {
  const scene = (body) => `<svg viewBox="0 0 320 130" aria-hidden="true">${body}</svg>`;
  const stars = `<path class="sk-star" d="M26 22h8m-4-4v8"/><path class="sk-star sk-star-2" d="M292 16h8m-4-4v8"/><path class="sk-star sk-star-3" d="M268 44h6m-3-3v6"/>`;
  return {
    hero: `<svg viewBox="0 0 420 330" aria-hidden="true">
      <ellipse class="ms-orbit" cx="210" cy="170" rx="196" ry="128"/>
      <ellipse class="ms-orbit ms-orbit-2" cx="210" cy="170" rx="160" ry="150" transform="rotate(-18 210 170)"/>
      <circle class="fd-halo" cx="210" cy="168" r="118"/>
      <path class="fd-ground" d="M44 268H376"/><path class="fd-ground fd-faint" d="M70 278H240M270 278H350"/>
      <g class="fd-door"><path class="fd-wash" d="M78 268V128a42 42 0 0 1 84 0V268Z"/><path d="M78 268V128a42 42 0 0 1 84 0V268"/>
        <path d="M90 268V132a30 30 0 0 1 60 0V268"/><path class="fd-gold fd-light" d="M120 268 150 132V268Z"/>
        <path class="fd-faint" d="M120 102v-4M100 110l-3-3M140 110l3-3"/><circle cx="140" cy="200" r="2.2"/></g>
      <g class="fd-bench"><path d="M196 214H318"/><path d="M196 222H318"/><path d="M206 222 198 268M308 222 316 268M212 244H302"/>
        <path d="M226 214v-16h34v16"/><path d="M234 198v-7a9 9 0 0 1 18 0v7"/>
        <path class="fd-faint" d="M272 214l26-18 6 8-26 18"/><path d="M298 196l11-8 5 7-10 9"/><path class="fd-faint" d="M204 208c8-3 12 3 18 0"/></g>
      <g class="fd-bowl"><path class="fd-wash fd-gold" d="M236 132h72c0 22-14 34-36 34s-36-12-36-34Z"/><path class="fd-gold" d="M236 132h72c0 22-14 34-36 34s-36-12-36-34Z"/>
        <path class="fd-gold" d="M258 170h28"/><path class="fd-gold" d="M248 130c4-12 16-16 24-16s20 4 24 16"/>
        <path class="fd-steam" d="M258 102c-5-8 5-12 0-20"/><path class="fd-steam fd-steam-2" d="M274 98c-5-8 5-12 0-20"/><path class="fd-steam fd-steam-3" d="M290 102c-5-8 5-12 0-20"/></g>
      <path class="fd-thread" d="M152 236C182 256 206 176 236 148"/>
      <path class="ms-mark fd-spark" d="M32 66h10m-5-5v10M382 262h10m-5-5v10M366 58h8m-4-4v8"/>
    </svg>`,
    cards: {
      // A house at evening: a lit door and window, a family on the path, smoke rising.
      home: scene(`${stars}<path class="sk-faint" d="M0 112c50-10 90-12 140-6s120 8 180-4"/><path d="M0 120H320"/>
        <path class="sk-wash" d="M110 118V62l50-32 50 32v56Z"/><path d="M100 68 160 28l60 40"/><path d="M110 62v56h100V62"/>
        <path d="M188 40V20h12v28"/><path class="sk-rise" d="M194 16c-5-6 5-9 0-15"/><path class="sk-rise sk-rise-2" d="M200 14c-5-6 5-9 0-13"/>
        <path class="sk-glow" d="M148 118V88a12 12 0 0 1 24 0v30Z"/><path class="sk-gold" d="M148 118V88a12 12 0 0 1 24 0v30"/>
        <path class="sk-glow sk-glow-2" d="M122 78h16v16h-16ZM182 78h16v16h-16Z"/><path class="sk-gold" d="M122 78h16v16h-16ZM130 78v16M122 86h16M182 78h16v16h-16ZM190 78v16M182 86h16"/>
        <circle cx="62" cy="88" r="5"/><path d="M62 93v15M62 98l-7 7M62 98l7 6M62 108l-5 11M62 108l5 11"/>
        <circle cx="84" cy="92" r="4.5"/><path d="M84 97v11M84 100l-6 6M84 100l-8-2M84 108l-4 11M84 108l4 11"/>
        <circle cx="98" cy="102" r="3.2"/><path d="M98 105v7M98 107l-5-3M98 112l-3 7M98 112l3 7"/>
        <path class="sk-path" d="M104 119c14-6 26-4 44-1"/>
        <path class="sk-faint" d="M250 118v-26M250 98c-9-2-13-8-13-13 7 0 13 4 13 9 0-7 6-13 13-13 0 8-5 15-13 17M282 118v-18M282 104c-6-1-9-5-9-9 5 0 9 3 9 6 0-5 4-9 9-9 0 6-3 10-9 12"/>`),
      // A workbench: saw, plane, hammer and shavings, the day's light moving overhead.
      work: scene(`${stars}<path d="M0 120H320"/>
        <path class="sk-gold" d="M60 58a100 100 0 0 1 200 0" stroke-dasharray="2 6"/><circle class="sk-glow" cx="160" cy="26" r="12"/><circle class="sk-gold" cx="160" cy="26" r="8"/>
        <path class="sk-wash" d="M48 78h224v10H48Z"/><path d="M48 78h224M48 88h224M48 78v10M272 78v10M66 88l-8 32M254 88l8 32M72 106h176"/>
        <path d="M84 78V66h52v12"/><path d="M92 66V58q0-6 6-6h24q6 0 6 6v8"/><path class="sk-faint" d="M84 72h52"/>
        <path class="sk-gold" d="M152 78l36-20 5 7-36 20"/><path class="sk-gold" d="M188 58l14-9 8 10-14 8M162 73l2 4M170 68l2 4M178 64l2 4"/>
        <path d="M226 78l-4-18h10l6 18"/><path d="M216 60h22v-8h-22ZM238 56h10"/>
        <path class="sk-faint" d="M112 118c6-6 14-6 16 0-6 2-10 2-16 0M150 116c5-5 12-5 15 0-5 3-10 3-15 0M186 118c6-4 11-4 14 0"/>
        <path class="sk-faint" d="M24 120V86l10-8 10 8v34M288 120V94h20v26"/>`),
      // An open hand with coins, passing them to another open hand across a dotted line.
      money: scene(`${stars}<path d="M0 124H320"/>
        <path d="M20 96c18-8 34-8 50 0l24 8c7 2 7 12-2 12H66"/><path d="M20 118c30 8 62 6 92-10l16-11c6-5 0-13-8-8l-16 10"/>
        <path d="M300 96c-18-8-34-8-50 0l-24 8c-7 2-7 12 2 12h26"/><path d="M300 118c-30 8-62 6-92-10l-16-11c-6-5 0-13 8-8l16 10"/>
        <g class="sk-gold"><ellipse cx="84" cy="78" rx="18" ry="6"/><path d="M66 78v8c0 3 8 6 18 6s18-3 18-6v-8"/><ellipse cx="84" cy="64" rx="18" ry="6"/><path d="M66 64v8M102 64v8"/><ellipse cx="84" cy="50" rx="18" ry="6"/><path d="M66 50v8M102 50v8"/></g>
        <path class="sk-wash-gold" d="M66 50c0 3 8 6 18 6s18-3 18-6-8-6-18-6-18 3-18 6Z"/>
        <path class="sk-path" d="M108 56C146 18 180 18 216 66"/>
        <g class="sk-gold"><ellipse cx="160" cy="31" rx="8" ry="3"/><ellipse cx="232" cy="82" rx="14" ry="5"/><path d="M218 82v6c0 2 6 4 14 4s14-2 14-4v-6"/></g>
        <circle class="sk-glow" cx="160" cy="31" r="12"/>`),
      // A long table with bread and a bowl, a door standing open and a guest arriving.
      table: scene(`${stars}<path d="M0 120H320"/>
        <path class="sk-wash" d="M28 120V44a26 26 0 0 1 52 0v76Z"/><path d="M28 120V44a26 26 0 0 1 52 0v76"/><path d="M38 120V46a16 16 0 0 1 32 0v74"/>
        <path class="sk-glow" d="M54 120 70 46v74Z"/>
        <circle cx="54" cy="72" r="5"/><path d="M54 77v18M54 82l-7 8M54 82l8 6M54 95l-5 18M54 95l5 18"/>
        <path class="sk-path" d="M72 116c20-6 36-4 52-2"/>
        <path class="sk-wash" d="M126 80h170v6H126Z"/><path d="M126 80h170M126 86h170M140 86l-6 34M282 86l6 34M150 104h122"/>
        <g class="sk-gold"><path d="M158 80c0-9 8-13 18-13s18 4 18 13"/><path d="M164 73c3-2 6-2 9 0M178 73c3-2 6-2 9 0"/>
          <path d="M212 66h44c0 10-8 14-22 14s-22-4-22-14Z"/><path class="sk-wash-gold" d="M212 66h44c0 10-8 14-22 14s-22-4-22-14Z"/>
          <path class="sk-rise" d="M224 58c-4-6 4-9 0-14"/><path class="sk-rise sk-rise-2" d="M236 56c-4-6 4-9 0-14"/><path class="sk-rise sk-rise-3" d="M248 58c-4-6 4-9 0-14"/></g>
        <path d="M270 80V62l5-5h10l5 5v18"/><path class="sk-faint" d="M275 57v-5h10v5"/>
        <path d="M130 120V96M122 96h16M122 96v-16M292 120V96M300 96h-16M300 96v-16"/>`),
      // A street of houses, one neighbour crossing with a bowl for another, windows lit.
      street: scene(`${stars}<path d="M0 120H320"/><path class="sk-path" d="M6 126H314"/>
        <path class="sk-wash" d="M18 120V72l32-24 32 24v48Z"/><path d="M12 76 50 46l38 30"/><path d="M18 72v48h64V72"/><path d="M40 120V96h20v24"/>
        <path class="sk-glow" d="M26 80h10v10H26ZM64 80h10v10H64Z"/><path class="sk-gold" d="M26 80h10v10H26ZM64 80h10v10H64Z"/>
        <path d="M96 120V84h52v36M96 84l26-18 26 18M112 120v-18h20v18"/>
        <path class="sk-wash" d="M238 120V72l32-24 32 24v48Z"/><path d="M232 76l38-30 38 30"/><path d="M238 72v48h64V72"/><path d="M260 120V96h20v24"/>
        <path class="sk-glow sk-glow-2" d="M246 80h10v10h-10ZM284 80h10v10h-10Z"/><path class="sk-gold" d="M246 80h10v10h-10ZM284 80h10v10h-10Z"/>
        <path d="M172 120V92h48v28M172 92l24-16 24 16"/>
        <circle class="sk-gold" cx="156" cy="88" r="5"/><path class="sk-gold" d="M156 93v14M156 97l9 4M156 97l-6 8M156 107l-5 12M156 107l5 12"/>
        <path class="sk-gold" d="M163 100h14c0 5-3 7-7 7s-7-2-7-7Z"/><path class="sk-rise" d="M170 96c-3-4 3-6 0-10"/>`),
      // A balance: one plate on one side, one person on the other, a brother weighed against a meal.
      conscience: scene(`${stars}<path d="M0 120H320"/>
        <path class="sk-wash" d="M142 120l10-10h16l10 10Z"/><path d="M142 120l10-10h16l10 10M160 110V34"/>
        <g><path class="sk-gold" d="M78 44 242 28"/><circle class="sk-gold" cx="160" cy="36" r="4"/>
          <path class="sk-gold" d="M78 44 54 84M78 44l24 40M242 28 218 68M242 28l24 40"/>
          <path class="sk-gold" d="M46 84h64c0 10-14 16-32 16s-32-6-32-16Z"/><path class="sk-wash-gold" d="M46 84h64c0 10-14 16-32 16s-32-6-32-16Z"/>
          <path class="sk-gold" d="M210 68h64c0 10-14 16-32 16s-32-6-32-16Z"/><path class="sk-wash-gold" d="M210 68h64c0 10-14 16-32 16s-32-6-32-16Z"/>
          <ellipse cx="78" cy="79" rx="20" ry="5"/><path d="M68 77c4-5 16-5 20 0"/>
          <circle cx="242" cy="46" r="5"/><path d="M242 51v12M242 55l-7 6M242 55l7 6"/></g>
        <path class="sk-faint" d="M20 120c6-10 14-14 26-14M300 120c-6-10-14-14-26-14"/>`),
    },
    street: `<svg viewBox="0 0 1200 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g class="fd-sky"><circle cx="90" cy="30" r="1"/><circle cx="240" cy="16" r="1"/><circle cx="410" cy="38" r="1"/><circle cx="560" cy="14" r="1"/><circle cx="720" cy="34" r="1"/><circle cx="880" cy="20" r="1"/><circle cx="1060" cy="36" r="1"/></g>
      <path d="M0 150H1200"/>
      <path d="M70 150V96l44-30 44 30v54M100 150v-30h28v30"/>
      <path d="M210 150V110h74v40M232 150v-22h24v22M210 110l37-24 37 24"/>
      <path d="M350 150V88l60-34 60 34v62M392 150v-40a18 18 0 0 1 36 0v40"/>
      <path class="fd-gold fd-window" d="M366 104h12v14h-12ZM442 104h12v14h-12Z"/>
      <path d="M540 150v-30h110v30M556 120v-14h78v14"/><path class="fd-gold" d="M572 106a22 12 0 0 1 46 0"/>
      <path d="M720 150V96l44-30 44 30v54M750 150v-30h28v30"/>
      <path class="fd-gold fd-window fd-window-2" d="M736 104h12v14h-12ZM782 104h12v14h-12Z"/>
      <path d="M880 150v-52h100v52M906 150v-26h22v26M950 118h18v14h-18ZM880 98l50-28 50 28"/>
      <path d="M1050 150v-44l34-22 34 22v44M1072 150v-22h24v22"/>
      <path class="fd-gold fd-road" d="M20 160H1180" stroke-dasharray="3 9"/>
    </svg>`,
  };
})();
