// Drawings 17–24, in the same 320 × 240 scene space and classes as art.js (.t tone, .f faint, .ft faint tone, .pf
// page-coloured fill). Added to window.ART.
(() => {
  const { n, svg, tuft, leaf, stars, bird } = window.Parts;
  const range = (count, fn) => Array.from({ length: count }, (_, i) => fn(i)).join("");
  /** A repeatable sequence of numbers in 0..1, so the scattered leaves and stars come out the same every time. */
  const seeded = (seed) => () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  /** A small bird perched, facing right (or left when flip), its feet at (x, y). */
  const perched = (x, y, flip = false, cls = "perch") => `<g class="${cls}" style="transform-origin:${x}px ${y}px"><g transform="translate(${x} ${y}) scale(${flip ? -1 : 1} 1)">
      <path class="pf" d="M-6-5C-4-11 4-13 9-10C12-13 16-13 17-10L20-9L17-8C16-5 12-3 8-3C2-2-3-3-6-5Z"/>
      <path d="M-6-5C-4-11 4-13 9-10C12-13 16-13 17-10L20-9L17-8C16-5 12-3 8-3C2-2-3-3-6-5Z"/><path d="M-6-5L-13-2"/>
      <circle cx="14.5" cy="-10" r=".7" fill="currentColor"/><path d="M4-3V0M7-3V0"/><path class="f" d="M0-7C3-9 7-9 9-7"/></g></g>`;
  /** An ear of wheat on its stalk, rooted at (x, y), leaning by a degrees. */
  const ear = (x, y, h, lean, cls = "stalk") => {
    const tx = x + lean, ty = y - h;
    const grains = range(5, (i) => { const gx = n(tx + lean * .02 * i), gy = ty - 3 - i * 3.4; return leaf(gx, gy + 1, -60 - lean, 5, 1.8, "", false) + leaf(gx, gy + 1, -120 - lean, 5, 1.8, "", false); });
    return `<g class="${cls}" style="transform-origin:${x}px ${y}px"><path d="M${x} ${y}C${x} ${y - h * .5} ${n(x + lean * .5)} ${n(y - h * .8)} ${tx} ${ty}"/><g class="t">${grains}<path d="M${tx} ${ty - 18}l0 -6"/></g></g>`;
  };
  /** A standing sheaf: stalks bound at the waist, heads fanned at the top; base centred at (x, y). */
  const sheaf = (x, y, h, s = 1) => {
    const w = 12 * s, waist = y - h * .55;
    const stalks = range(7, (i) => { const t = i / 6 - .5, bx = n(x + t * w * 2), wx = n(x + t * w * .5), tx = n(x + t * w * 2.6), ty = n(y - h + Math.abs(t) * 6 * s); return `<path d="M${bx} ${y}L${wx} ${waist}L${tx} ${ty}"/>`; });
    const heads = range(7, (i) => { const t = i / 6 - .5, tx = n(x + t * w * 2.6), ty = n(y - h + Math.abs(t) * 6 * s); return leaf(tx, ty, -90 + t * 70, 9 * s, 2.6 * s, "", false); });
    return `${stalks}<g class="t">${heads}</g><path class="t" d="M${n(x - w * .45)} ${n(waist - 1)}C${x} ${n(waist + 3)} ${x} ${n(waist + 3)} ${n(x + w * .45)} ${n(waist - 1)}"/>`;
  };
  /** A field anemone ("the lilies of the field"), its cup facing a little up, on a stem rooted at (x, y). */
  const anemone = (x, y, h, lean, s = 1, cls = "bloom") => {
    const fx = x + lean, fy = y - h;
    return `<g class="${cls}" style="transform-origin:${x}px ${y}px"><path d="M${x} ${y}C${x} ${y - h * .5} ${n(x + lean * .4)} ${n(y - h * .8)} ${fx} ${fy}"/>
      <path class="f" d="M${x} ${n(y - h * .3)}C${x - 8} ${n(y - h * .4)} ${x - 10} ${n(y - h * .5)} ${x - 12} ${n(y - h * .6)}M${x} ${n(y - h * .3)}C${x + 7} ${n(y - h * .42)} ${x + 9} ${n(y - h * .52)} ${x + 11} ${n(y - h * .64)}"/>
      <g class="t" transform="translate(${fx} ${fy}) scale(${s})"><path class="pf" d="M-10-5C-14-13-10-20-5-17C-3-22 3-22 5-17C10-20 14-13 10-5C6 1-6 1-10-5Z"/><path d="M-10-5C-14-13-10-20-5-17C-3-22 3-22 5-17C10-20 14-13 10-5C6 1-6 1-10-5Z"/>
        <path class="ft" d="M-5-17C-4-12-3-8-1-4M5-17C4-12 3-8 1-4"/><circle cx="-3" cy="-17.5" r=".9" fill="currentColor"/><circle cx="0" cy="-19.5" r=".9" fill="currentColor"/><circle cx="3" cy="-17.5" r=".9" fill="currentColor"/></g></g>`;
  };
  const butterfly = `<g class="flutter"><g class="wing-l"><path d="M0 0C-6-8-14-8-14-2C-14 2-8 4 0 0ZM0 0C-4 4-10 8-10 4C-10 1-6 0 0 0Z"/></g>
      <g class="wing-r"><path d="M0 0C6-8 14-8 14-2C14 2 8 4 0 0ZM0 0C4 4 10 8 10 4C10 1 6 0 0 0Z"/></g><path d="M0-3V3M0-3L-2-7M0-3L2-7"/></g>`;

  Object.assign(window.ART, {
    // 17 · The mustard tree (Matthew 13:32): a broad tree grown from the least of seeds, birds lodging in its branches.
    mustard: () => {
      const rnd = seeded(11);
      const leaves = range(84, () => { const a = rnd() * Math.PI, r = .35 + .65 * Math.sqrt(rnd()); const x = n(160 + Math.cos(a) * 108 * r * (rnd() < .5 ? -1 : 1)), y = n(112 - Math.sin(a) * 52 * r + 8); return leaf(x, y, Math.round(rnd() * 360), 9, 3, rnd() < .5 ? "lf" : "lf late", false); });
      return svg("Line drawing: a broad tree with wide branches, small birds perched in it and another flying in", `
      <path class="f" d="M0 176C50 166 100 164 140 170M190 170C240 162 280 164 320 172"/>
      <path d="M10 206C80 202 240 202 310 206"/>
      <g class="ft">${leaves}</g>
      <path d="M150 206C154 190 148 176 154 160C156 154 156 148 158 140"/><path d="M172 206C168 190 174 176 166 160C164 154 164 148 162 140"/>
      <path class="f" d="M158 196C160 186 158 176 160 168"/>
      <path d="M156 160C140 150 118 140 86 134C72 131 60 130 50 128"/><path d="M158 150C146 132 130 116 106 102C96 96 86 92 76 90"/>
      <path d="M164 158C182 148 206 140 236 136C250 134 262 134 272 132"/><path d="M162 148C174 130 192 114 216 100C226 94 236 90 246 88"/>
      <path d="M160 142C160 124 162 104 160 76"/>
      <path class="f" d="M106 102C108 92 112 84 118 78M216 100C214 90 210 82 204 76M86 134C84 124 86 116 90 110M236 136C238 126 236 118 232 112M160 100C150 92 140 86 130 84M160 96C170 88 180 82 190 80"/>
      ${perched(96, 136)}${perched(212, 103, true)}${perched(244, 135, true, "perch late")}${perched(126, 113, false, "perch late")}${perched(160, 77)}
      <g class="incoming">${bird(0, 0, 1.2)}</g>
      ${tuft(60, 206)}${tuft(76, 205, .7)}${tuft(250, 205, .8)}${tuft(270, 206)}`);
    },

    // 18 · Count the stars (Genesis 15:5): a tent under a sky full of stars, light inside, a small fire burning.
    tent: () => {
      const rnd = seeded(5);
      const sky = Array.from({ length: 46 }, () => [n(rnd() * 320), n(rnd() * 128), n(.5 + rnd() * .9)]);
      return svg("Line drawing: a tent in the desert under a sky full of stars, lamplight inside, a small fire outside", `
      ${stars(sky)}
      <path class="f" d="M0 170C40 156 80 152 120 160C160 168 220 150 320 158"/>
      <path d="M0 200C80 196 240 196 320 200"/>
      <path class="pf" d="M52 198V178C66 164 78 154 88 150C112 160 132 158 160 140C188 158 208 160 232 150C242 154 254 164 268 178V198Z"/>
      <path d="M52 178C66 164 78 154 88 150C112 160 132 158 160 140C188 158 208 160 232 150C242 154 254 164 268 178"/><path d="M52 178V198M268 178V198"/><path d="M160 140V132M88 150V145M232 150V145"/>
      <path class="f" d="M100 160C98 172 98 186 100 198M124 160C122 174 122 186 124 198M196 160C198 174 198 186 196 198M220 160C222 172 222 186 220 198M60 172C66 180 68 190 68 198M260 172C254 180 252 190 252 198"/>
      <path class="f" d="M88 146L56 202M232 146L264 202"/><path d="M54 200l4 2M262 200l4 2"/>
      <path class="ft lit" d="M148 197V160L160 150L172 160V197Z"/><path d="M144 198V158L160 146L176 158V198"/>
      <path class="t lit" d="M160 186C158.4 184.4 158.8 182 160 180C161.2 182 161.6 184.4 160 186Z"/><path class="f" d="M155 188H165"/>
      <path d="M212 204L232 198M214 198L234 204"/>
      <g class="flame"><path class="t" d="M223 198C216 192 218 184 223 176C228 184 230 192 223 198Z"/><path class="t" d="M223 195C221 192 221 188 223 184C225 188 225 192 223 195Z"/></g>
      ${range(4, (i) => `<circle class="spark t" style="--i:${i}" cx="${221 + (i % 2) * 4}" cy="174" r=".9" fill="currentColor"/>`)}`);
    },

    // 19 · The bow in the cloud (Genesis 9:13): a rainbow over the hills as the rain moves away.
    rainbow: () => svg("Line drawing: a rainbow arching over green hills as the rain moves away and the sun comes out", `
      <g class="bow">${["history", "epistles", "poetry", "prophets", "gospels"].map((c, i) => { const r = 118 - i * 7; return `<path style="stroke: var(--${c})" d="M${174 - r} 200A${r} ${r} 0 0 1 ${174 + r} 200"/>`; }).join("")}</g>
      <g class="f cloud"><path d="M20 66C18 56 30 50 38 56C42 46 58 46 62 56C72 54 78 64 72 70H24C20 70 18 68 20 66Z"/></g>
      <g class="rain f">${range(9, (i) => `<path d="M${28 + i * 6} ${78 + (i % 3) * 6}l-3 10"/>`)}${range(9, (i) => `<path d="M${30 + i * 6} ${104 + (i % 3) * 6}l-3 10"/>`)}</g>
      <circle class="f" cx="276" cy="50" r="12"/><g class="f rays">${range(8, (i) => { const a = i * Math.PI / 4; return `<path d="M${n(276 + Math.cos(a) * 17)} ${n(50 + Math.sin(a) * 17)}L${n(276 + Math.cos(a) * 23)} ${n(50 + Math.sin(a) * 23)}"/>`; })}</g>
      <path class="pf" d="M0 160C40 146 80 142 120 150C160 158 200 140 250 138C280 137 302 144 320 148V240H0Z"/>
      <path d="M0 160C40 146 80 142 120 150C160 158 200 140 250 138C280 137 302 144 320 148"/>
      ${[[70, 152], [86, 150], [232, 142], [250, 140]].map(([x, y]) => `<path d="M${x} ${y}V${y - 7}"/><path d="M${x - 6} ${y - 10}C${x - 8} ${y - 16} ${x - 2} ${y - 20} ${x + 1} ${y - 17}C${x + 5} ${y - 20} ${x + 9} ${y - 14} ${x + 6} ${y - 10}C${x + 4} ${y - 6} ${x - 4} ${y - 6} ${x - 6} ${y - 10}Z"/>`).join("")}
      <path class="pf" d="M0 194C60 180 120 182 180 192C230 200 280 192 320 186V240H0Z"/>
      <path d="M0 194C60 180 120 182 180 192C230 200 280 192 320 186"/>
      <path class="f" d="M30 210C80 202 130 204 170 212M200 214C240 208 280 206 310 202M80 228C130 222 180 224 220 230"/>
      <g class="flock">${bird(196, 96, .9)}${bird(214, 86, .7)}</g>
      ${tuft(40, 190)}${tuft(56, 188, .7)}${tuft(270, 192)}${tuft(140, 186, .6)}`),

    // 20 · Reap in joy (Psalm 126:5): sheaves standing in a reaped field at evening, ripe wheat at the edges.
    sheaves: () => svg("Line drawing: sheaves of wheat standing in a reaped field at evening, ripe ears swaying in the foreground", `
      <path class="ft" d="M136 128A24 24 0 0 1 184 128"/><g class="ft rays">${range(7, (i) => { const a = Math.PI + (i + 1) * Math.PI / 8; return `<path d="M${n(160 + Math.cos(a) * 30)} ${n(128 + Math.sin(a) * 30)}L${n(160 + Math.cos(a) * 40)} ${n(128 + Math.sin(a) * 40)}"/>`; })}</g>
      <path d="M0 128H320"/><path class="f" d="M0 122C40 114 80 112 120 118M200 118C240 112 280 112 320 120"/>
      <path class="f" d="M16.0 150l-0.4 -2.0M48.0 150l-0.4 -2.0M80.0 150l-0.4 -2.0M112.0 150l-0.4 -2.0M144.0 150l-0.4 -2.0M176.0 150l-0.4 -2.0M208.0 150l-0.4 -2.0M240.0 150l-0.4 -2.0M272.0 150l-0.4 -2.0M304.0 150l-0.4 -2.0M26.7 162l-0.8 -3.2M53.3 162l-0.8 -3.2M80.0 162l-0.8 -3.2M106.7 162l-0.8 -3.2M133.3 162l-0.8 -3.2M160.0 162l-0.8 -3.2M186.7 162l-0.8 -3.2M213.3 162l-0.8 -3.2M240.0 162l-0.8 -3.2M266.7 162l-0.8 -3.2M293.3 162l-0.8 -3.2M11.4 176l-1.2 -4.4M34.3 176l-1.2 -4.4M57.1 176l-1.2 -4.4M80.0 176l-1.2 -4.4M102.9 176l-1.2 -4.4M125.7 176l-1.2 -4.4M148.6 176l-1.2 -4.4M171.4 176l-1.2 -4.4M194.3 176l-1.2 -4.4M217.1 176l-1.2 -4.4M240.0 176l-1.2 -4.4M262.9 176l-1.2 -4.4M285.7 176l-1.2 -4.4M308.6 176l-1.2 -4.4M20.0 192l-1.6 -5.6M40.0 192l-1.6 -5.6M60.0 192l-1.6 -5.6M80.0 192l-1.6 -5.6M100.0 192l-1.6 -5.6M120.0 192l-1.6 -5.6M140.0 192l-1.6 -5.6M160.0 192l-1.6 -5.6M180.0 192l-1.6 -5.6M200.0 192l-1.6 -5.6M220.0 192l-1.6 -5.6M240.0 192l-1.6 -5.6M260.0 192l-1.6 -5.6M280.0 192l-1.6 -5.6M300.0 192l-1.6 -5.6M8.9 210l-2.0 -6.8M26.7 210l-2.0 -6.8M44.4 210l-2.0 -6.8M62.2 210l-2.0 -6.8M80.0 210l-2.0 -6.8M97.8 210l-2.0 -6.8M115.6 210l-2.0 -6.8M133.3 210l-2.0 -6.8M151.1 210l-2.0 -6.8M168.9 210l-2.0 -6.8M186.7 210l-2.0 -6.8M204.4 210l-2.0 -6.8M222.2 210l-2.0 -6.8M240.0 210l-2.0 -6.8M257.8 210l-2.0 -6.8M275.6 210l-2.0 -6.8M293.3 210l-2.0 -6.8M311.1 210l-2.0 -6.8M16.0 228l-2.4 -8.0M32.0 228l-2.4 -8.0M48.0 228l-2.4 -8.0M64.0 228l-2.4 -8.0M80.0 228l-2.4 -8.0M96.0 228l-2.4 -8.0M112.0 228l-2.4 -8.0M128.0 228l-2.4 -8.0M144.0 228l-2.4 -8.0M160.0 228l-2.4 -8.0M176.0 228l-2.4 -8.0M192.0 228l-2.4 -8.0M208.0 228l-2.4 -8.0M224.0 228l-2.4 -8.0M240.0 228l-2.4 -8.0M256.0 228l-2.4 -8.0M272.0 228l-2.4 -8.0M288.0 228l-2.4 -8.0M304.0 228l-2.4 -8.0"/>
      <g>${sheaf(92, 196, 46, 1.05)}</g><g>${sheaf(172, 170, 34, .8)}</g><g>${sheaf(240, 190, 42, .95)}</g><g>${sheaf(130, 152, 22, .55)}</g><g>${sheaf(214, 148, 18, .45)}</g>
      ${ear(14, 240, 64, 6)}${ear(26, 240, 56, -4, "stalk late")}${ear(38, 240, 48, 8)}${ear(286, 240, 58, -6, "stalk late")}${ear(300, 240, 66, 4)}${ear(312, 240, 50, -8, "stalk late")}
      <g class="flock">${bird(60, 70, .9)}${bird(78, 60, .7)}${bird(92, 74, .6)}</g>`),

    // 21 · The lilies of the field (Matthew 6:28): field anemones in the grass, nodding, a butterfly passing.
    lily: () => svg("Line drawing: wild flowers of the field growing in the grass, a butterfly passing over them", `
      <path class="f" d="M0 128C40 114 84 110 124 118C164 126 196 114 236 112C272 110 300 116 320 120"/>
      <path class="f" d="M0 160C60 152 120 154 180 158C240 162 290 156 320 154"/>
      <path d="M0 214C80 208 240 208 320 214"/>
      ${anemone(70, 214, 70, -6, 1.1)}${anemone(110, 214, 92, 6, 1.25, "bloom late")}${anemone(150, 214, 60, -4, .95)}${anemone(196, 214, 84, 8, 1.15, "bloom late")}${anemone(240, 214, 66, -6, 1)}${anemone(272, 214, 50, 4, .8, "bloom late")}${anemone(40, 214, 44, 4, .75, "bloom late")}
      ${[[88, 214, 34, -10], [132, 214, 40, 8], [176, 214, 30, -6], [222, 214, 38, 10], [258, 214, 28, -8], [56, 214, 30, 10]].map(([x, y, h, l], i) => `<path class="f ${i % 2 ? "tuft" : "tuft"}" d="M${x} ${y}C${x} ${y - h * .5} ${x + l * .5} ${y - h * .8} ${x + l} ${y - h}"/>`).join("")}
      ${tuft(20, 214)}${tuft(300, 214)}${tuft(160, 214, .8)}${tuft(214, 214, .7)}
      <g class="drift"><g transform="translate(150 70)">${butterfly}</g></g>
      <path class="f" d="M40 60C56 56 72 56 86 60M220 40C236 37 252 37 266 40"/>`),

    // 22 · A tree by the rivers of water (Psalm 1:3): a fruit tree on the bank, its roots by the stream, the water moving.
    river: () => {
      const rnd = seeded(3);
      const leaves = range(86, () => { const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()); return leaf(n(98 + Math.cos(a) * 64 * r), n(80 + Math.sin(a) * 40 * r), Math.round(rnd() * 360), 9, 3, rnd() < .5 ? "lf" : "lf late", false); });
      return svg("Line drawing: a fruit tree growing on the bank of a river, its roots reaching the water, trees on the far bank", `
      <path class="f" d="M0 112C40 102 80 100 120 106C170 112 230 98 320 104"/>
      <path d="M0 140C60 134 120 138 180 136C240 134 290 136 320 138"/>
      ${[[200, 136, 1], [226, 134, .8], [262, 135, 1.1], [292, 136, .9]].map(([x, y, s]) => `<path d="M${x} ${y}V${n(y - 8 * s)}"/><path d="M${n(x - 8 * s)} ${n(y - 12 * s)}C${n(x - 11 * s)} ${n(y - 20 * s)} ${n(x - 3 * s)} ${n(y - 26 * s)} ${n(x + 1 * s)} ${n(y - 22 * s)}C${n(x + 6 * s)} ${n(y - 26 * s)} ${n(x + 12 * s)} ${n(y - 18 * s)} ${n(x + 8 * s)} ${n(y - 12 * s)}C${n(x + 5 * s)} ${n(y - 7 * s)} ${n(x - 5 * s)} ${n(y - 7 * s)} ${n(x - 8 * s)} ${n(y - 12 * s)}Z"/>`).join("")}
      <g class="t water"><path class="ripple" style="--dx:6px" d="M10 150H120M150 150H230M250 150H310"/><path class="ripple" style="--dx:-7px" d="M0 164H60M130 164H220M240 164H320"/>
        <path class="ripple" style="--dx:7px" d="M20 178H70M124 178H190M210 178H300"/><path class="ripple" style="--dx:-8px" d="M0 192H80M140 192H260M280 192H320"/></g>
      <g class="floating"><path class="ft" d="M0 0C3-3 8-3 10 0C8 3 3 3 0 0Z" transform="translate(150 171)"/></g>
      <path d="M0 200C60 197 120 196 180 198C240 200 290 198 320 200"/>
      <path class="pf" d="M88 200C92 178 88 156 92 134C94 124 92 116 94 108L104 108C104 118 104 126 106 136C110 156 106 178 110 200Z"/>
      <path d="M88 200C92 178 88 156 92 134C94 124 92 116 94 108"/><path d="M110 200C106 178 110 156 106 136C104 126 104 118 104 108"/>
      <path class="f" d="M96 190C98 176 96 162 98 150"/>
      <path d="M88 200C82 202 74 204 64 206M110 200C116 202 124 204 134 206M95 200C93 204 91 206 88 209M104 200C106 204 108 206 112 209"/>
      <path d="M94 108C84 96 72 90 58 88M104 108C112 96 124 88 140 86M98 108C98 96 98 84 100 70"/>
      <g class="ft">${leaves}</g>
      ${[[66, 92], [84, 104], [122, 96], [136, 88], [100, 66], [74, 74], [114, 80]].map(([x, y], i) => `<g class="fruit" style="transform-origin:${x}px ${y - 4}px;--i:${i}"><path d="M${x} ${y - 4}V${y}"/><circle class="t chick" cx="${x}" cy="${y + 3}" r="3"/></g>`).join("")}
      ${tuft(30, 210)}${tuft(48, 208, .7)}${tuft(240, 207, .8)}${tuft(280, 210)}`);
    },

    // 23 · Lay me down in peace (Psalm 4:8): a window at night, rain falling outside, a candle lit on the sill.
    window: () => svg("Line drawing: a window at night seen from inside, rain falling beyond the glass, a candle lit on the sill, curtains tied back", `
      <defs><clipPath id="pane-clip"><path d="M96 168V58C96 40 126 28 160 28C194 28 224 40 224 58V168Z"/></clipPath></defs>
      <g clip-path="url(#pane-clip)">
        <path class="f" d="M90 150C120 140 150 138 180 144C200 148 214 144 230 140"/>
        <path class="f" transform="translate(-74 2)" d="M196 146C196 132 194 124 198 114M190 124C180 116 182 104 192 102C190 92 204 88 208 96C216 92 222 102 218 110C222 118 214 124 206 120C202 126 194 126 190 124Z"/>
        <g class="rain-fall ft">${range(8, (row) => range(6, (col) => `<path d="M${102 + col * 22 + (row % 2) * 11} ${row * 24 - 24}l-3 10"/>`))}</g></g>
      <path d="M96 168V58C96 40 126 28 160 28C194 28 224 40 224 58V168"/><path d="M88 170V56C88 34 122 20 160 20C198 20 232 34 232 56V170"/>
      <path d="M160 28V168M96 98H224"/>
      <g class="trickle t">${[[120, 64, 0], [190, 110, 1], [140, 120, 2]].map(([x, y, i]) => `<path style="--i:${i}" d="M${x} ${y}C${x - 1} ${y + 6} ${x + 1} ${y + 10} ${x} ${y + 16}"/>`).join("")}</g>
      <path d="M76 170H244"/><path d="M80 176H240"/><path class="f" d="M84 182H236"/>
      <path class="pf" d="M60 10C70 40 66 110 80 150C72 160 66 200 62 232H40C44 180 44 80 40 10Z"/><path d="M60 10C70 40 66 110 80 150C72 160 66 200 62 232"/><path class="f" d="M50 14C54 60 52 120 64 154M46 60C48 110 50 170 52 230"/>
      <path class="pf" d="M260 10C250 40 254 110 240 150C248 160 254 200 258 232H280C276 180 276 80 280 10Z"/><path d="M260 10C250 40 254 110 240 150C248 160 254 200 258 232"/><path class="f" d="M270 14C266 60 268 120 256 154M274 60C272 110 270 170 268 230"/>
      <path class="t" d="M74 148C78 152 80 156 78 160M246 148C242 152 240 156 242 160"/>
      <path d="M30 6H290"/>
      <path class="pf" d="M184 170V140H198V170Z"/><path d="M184 170V140H198V170"/><path d="M178 170C178 166 204 166 204 170"/><path d="M204 168C210 166 210 160 204 160"/>
      <path class="f" d="M191 140V136"/>
      <g class="flame"><path class="t" d="M191 136C186 130 187 123 191 116C195 123 196 130 191 136Z"/><path class="t" d="M191 133C189.6 130.6 189.6 127.6 191 125C192.4 127.6 192.4 130.6 191 133Z"/></g>
      <g class="glow ft"><path d="M178 118C182 106 200 106 204 118M172 122C176 98 206 98 210 122"/></g>
      <path d="M112 170V160H148V170"/><path class="f" d="M114 160V164H146V160M116 156H144V160"/>`),

    // 24 · A city set on an hill (Matthew 5:14): a walled town on a hilltop at dusk, its windows lit, a road winding up.
    city: () => svg("Line drawing: a walled town on a hilltop at dusk, its small windows lit, a road winding up to its gate", `
      ${stars([[30, 30], [70, 18, 1.2], [118, 40], [220, 20], [262, 36, 1.2], [300, 60, .9], [180, 12, .8], [24, 80, .8]])}
      <path class="f" d="M0 150C30 140 60 140 80 146M250 144C280 138 300 140 320 146"/>
      <path class="pf" d="M0 216C50 204 72 178 80 140C83 126 84 116 84 108H238C238 116 239 126 242 140C250 178 270 204 320 216V240H0Z"/>
      <path d="M0 216C50 204 72 178 80 140C83 126 84 116 84 108"/><path d="M238 108C238 116 239 126 242 140C250 178 270 204 320 216"/>
      <g transform="translate(161 108) scale(1.4) translate(-161 -108)">
      <path class="pf" d="M108 82H124V70L132 64L140 70V82H150V60H164V52L172 46L180 52V60H190V82H204V74H214V108H108Z"/>
      <path d="M108 108V82H124V70L132 64L140 70V82H150V60H164V52L172 46L180 52V60H190V82H204V74H214V108"/>
      <path d="M150 60V82M190 60V82M164 60H180M124 82H140"/><path class="f" d="M156 68h4M184 68h2M128 76h8"/>
      <path d="M104 108H218"/><path d="M106 108V100H112V104H118V100H124V104H130V100H136V104H142V100H148V104H154V100H160V104H166V100H172V104H178V100H184V104H190V100H196V104H202V100H208V104H214V100H218V108"/>
      <path d="M154 108V98C154 94 168 94 168 98V108" class="pf"/><path d="M154 108V98C154 94 168 94 168 98V108"/>
      ${[[132, 76], [176, 56], [168, 70], [196, 86], [116, 92], [144, 92], [186, 94], [208, 92], [124, 74]].map(([x, y], i) => `<rect class="t window-lit" style="--i:${i}" x="${x}" y="${y}" width="2.6" height="4" rx="1.3"/>`).join("")}
      </g>
      <path class="f" d="M161 108C164 124 150 136 156 152C162 168 190 176 186 196C184 208 168 220 172 240"/><path class="f" d="M168 108C170 124 158 136 164 152C170 166 198 174 194 196C192 208 178 220 182 240"/>
      ${[[62, 176], [76, 150], [250, 156], [262, 182], [40, 200], [282, 200]].map(([x, y]) => `<path d="M${x} ${y}V${y - 6}"/><path d="M${x - 5} ${y - 8}C${x - 7} ${y - 13} ${x - 2} ${y - 16} ${x + 1} ${y - 14}C${x + 4} ${y - 16} ${x + 8} ${y - 12} ${x + 5} ${y - 8}C${x + 3} ${y - 5} ${x - 3} ${y - 5} ${x - 5} ${y - 8}Z"/>`).join("")}
      <path class="f" d="M30 222C70 216 100 216 130 222M220 224C250 220 280 220 306 222"/>`),
  });
})();
