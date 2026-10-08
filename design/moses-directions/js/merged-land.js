// H · the ground of each chapter: a quiet line-art landscape along its bottom edge, drawn by hand here (no images).
// Egypt: the river, reeds and brick-kilns. Midian: hills, tents and the flock. The wilderness: Sinai, the camp around the
// tabernacle, and Nebo looking over the Jordan. Low contrast; only the water and the smoke move, very slowly.
(() => {
  const P = (d, cls = "ml-line") => `<path class="${cls}" d="${d}"/>`;
  const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const reeds = (x0, n, r, base = 200) => Array.from({ length: n }, (_, i) => {
    const x = x0 + i * (7 + r() * 6), h = 34 + r() * 30, lean = (r() - .5) * 12, tx = x + lean, ty = base - h;
    return P(`M${x.toFixed(1)} ${base}C${(x + lean * .3).toFixed(1)} ${(base - h * .5).toFixed(1)} ${(tx - lean * .2).toFixed(1)} ${(ty + 8).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`)
      + (i % 2 ? P(`M${tx.toFixed(1)} ${ty.toFixed(1)}l-6-7M${tx.toFixed(1)} ${ty.toFixed(1)}l6-7M${tx.toFixed(1)} ${ty.toFixed(1)}l-1-9M${tx.toFixed(1)} ${ty.toFixed(1)}l4-9`, "ml-tone") : "");
  }).join("");
  const water = (y0, rows, amp = 3) => Array.from({ length: rows }, (_, i) => {
    const y = y0 + i * 11, off = (i % 2) * 40;
    let d = `M${-80 + off} ${y}`; for (let x = -80 + off; x < 1680; x += 80) d += `q20 -${amp} 40 0t40 0`;
    return P(d, `ml-water ${i % 2 ? "is-b" : ""}`);
  }).join("");
  const kiln = (x, s = 1) => [
    P(`M${x - 34 * s} 196C${x - 36 * s} ${196 - 44 * s} ${x + 36 * s} ${196 - 44 * s} ${x + 34 * s} 196`),
    P(`M${x - 9 * s} 196v-${12 * s}a${9 * s} ${9 * s} 0 0 1 ${18 * s} 0v${12 * s}`), P(`M${x - 6 * s} ${196 - 40 * s}h${12 * s}v-${6 * s}h-${12 * s}z`),
    P(`M${x} ${190 - 48 * s}c-7-9 6-15 0-24s7-15 0-24`, "ml-smoke"),
  ].join("");
  const bricks = (x, y, cols, rows) => { let d = ""; for (let r = 0; r < rows; r++) { const off = r % 2 ? 7 : 0; d += `M${x + off} ${y - r * 7}h${cols * 14}`; for (let c = 0; c <= cols; c++) d += `M${x + off + c * 14} ${y - r * 7}v-7`; } return P(d + `M${x} ${y - rows * 7}h${cols * 14 + 7}`, "ml-faint"); };
  const palm = (x, h) => P(`M${x} 198c2-${h * .4} -4-${h * .7} 3-${h}`) + P(`M${x + 3} ${198 - h}c-14-2-24 4-30 12M${x + 3} ${198 - h}c14-3 24 2 30 10M${x + 3} ${198 - h}c-8-10-20-12-28-10M${x + 3} ${198 - h}c8-10 20-12 28-8M${x + 3} ${198 - h}c-2-8 2-14 6-16`, "ml-tone");
  // A sheep in its own small frame (facing right, or left when dir is -1): a woolly body, a head with an ear, four legs.
  const sheep = (x, y, k = 1, dir = 1) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(k * dir).toFixed(2)} ${k.toFixed(2)})">${
    P("M0 0c-1-4 3-6 6-5c2-3 7-3 9 0c3-1 6 2 5 5c1 3-2 5-5 4h-10c-3 1-6-2-5-4z")}${P("M20-3c3-1 6 1 5 4c-1 2-4 2-5 1M21-3l-2-2")}${P("M4 4v5M7 4.5v5M14 4.5v5M17 4v5", "ml-faint")}</g>`;
  const tent = (x, w = 110) => [P(`M${x} 196L${x + w * .08} 178Q${x + w * .2} 170 ${x + w * .32} 175Q${x + w * .46} 168 ${x + w * .6} 174Q${x + w * .74} 168 ${x + w * .88} 176L${x + w} 196`),
    P(`M${x + w * .2} 172v26M${x + w * .46} 170v28M${x + w * .74} 170v28M${x + w * .2} 172l-${w * .22} 26M${x + w * .74} 170l${w * .3} 28`, "ml-faint")].join("");
  const smallTent = (x, y, s = 1) => P(`M${x - 8 * s} ${y}l${8 * s}-${11 * s}l${8 * s} ${11 * s}M${x} ${y - 11 * s}v${11 * s}`, "ml-faint");

  const LAND = {
    egypt() {
      const r = rng(17);
      return [
        P("M0 152C220 144 420 150 640 141S1040 147 1240 139S1500 144 1600 138", "ml-far"),
        P("M0 198C300 194 600 199 900 195S1400 199 1600 196", "ml-line"),
        kiln(330), kiln(430, .8), bricks(470, 196, 5, 3), kiln(1170, .9), bricks(1060, 196, 4, 2), bricks(1214, 196, 3, 2),
        palm(250, 64), palm(1300, 78), palm(1336, 56), palm(760, 48),
        reeds(60, 12, r), reeds(600, 9, r), reeds(900, 7, r), reeds(1400, 14, r),
        water(210, 3, 3),
      ].join("");
    },
    midian() {
      const r = rng(29);
      const flock = Array.from({ length: 13 }, (_, i) => sheep(870 + i * 36 + r() * 16, 180 + (i % 3) * 6 + r() * 4, .9 + r() * .3, i % 4 ? 1 : -1)).join("");
      return [
        P("M0 130C160 96 300 92 440 120S700 150 860 112S1180 70 1360 104S1540 128 1600 118", "ml-far"),
        P("M0 170C200 146 380 150 560 166S880 176 1060 156S1400 140 1600 162", "ml-mid"),
        P("M0 198C260 194 520 200 800 196S1300 200 1600 197", "ml-line"),
        tent(150), tent(300, 90), tent(1380, 120),
        P("M640 198c0-14 52-14 52 0M636 198h60M650 184v-22M678 184v-22M644 162h40M664 162v12", "ml-line"),
        P("M560 198c2-24-2-40 4-58M564 140c-16-6-30-2-38 8M564 140c14-10 32-8 40 2M564 140c-8-10-6-20 2-24", "ml-tone"),
        flock,
      ].join("");
    },
    wilderness() {
      const camp = [];
      for (let row = 0; row < 3; row++) for (let i = 0; i < 16; i++) { const x = 660 + i * 26 + (row % 2) * 13; if (x > 780 && x < 900 && row < 2) continue; camp.push(smallTent(x, 186 + row * 7, .8 + row * .1)); }
      return [
        P("M0 196L120 166L190 178L300 112L340 128L408 58L452 98L478 88L560 156L640 196", "ml-line"),
        P("M300 112l14 28M408 58l-10 40M452 98l-6 24M408 58l18 30", "ml-faint"),
        P("M380 54c-16 0-16-16 0-16 4-12 27-12 31-2 9-9 31-5 29 7 14 0 14 16 0 16z", "ml-faint"),
        P("M0 198C300 194 640 199 1000 196S1400 198 1600 196", "ml-line"),
        camp.join(""),
        P("M792 198v-22h96v22M800 176l40-10 40 10M828 198v-14h24v14", "ml-tone"),
        P("M840 160c-6-10 6-16 0-26s6-16 0-26", "ml-smoke"),
        P("M1080 198C1160 170 1240 120 1330 96C1360 90 1380 96 1400 108C1450 140 1500 170 1600 182", "ml-line"),
        P("M1330 96c-2-6 4-10 6-4M1333 92v-8M1333 86l-4 4M1333 86l4 4", "ml-tone"),
        P("M1338 90C1420 70 1500 72 1590 84", "ml-dash"),
        P("M1440 136C1500 112 1550 104 1600 106", "ml-far"),
        P("M1490 198c10-10 4-18 16-26s8-16 20-22 6-10 18-14", "ml-water"),
        P("M1556 160c0-8 2-14 4-18M1560 142c-6-2-10 0-12 4M1560 142c5-3 9-2 11 2M1572 152c0-6 1-10 3-13M1575 139c-4-2-7 0-9 3M1575 139c4-2 7-1 8 2", "ml-faint"),
      ].join("");
    },
  };
  window.MergedLand = {
    svg: (kind) => `<svg class="ml ml-${kind}" viewBox="0 0 1600 240" preserveAspectRatio="xMidYMax slice" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(LAND[kind] ?? LAND.wilderness)()}</svg>`,
  };
})();
