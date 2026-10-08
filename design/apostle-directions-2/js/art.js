// Our own line drawings for the apostle pages (no stock images). Each scene is a 400×260 SVG whose strokes draw in
// once, then keep moving slowly for as long as the page is open: water drifts, the net hauls in and out, flames
// flicker, sparks rise, the sheet of Acts 10 is let down and received up again. The motion is CSS (art.css), so it
// never stops when the scene scrolls away and back. Tradition is drawn dashed, as everywhere on the page.
(() => {
  const P = (d, cls = "ln", delay = 0) => `<path pathLength="1" class="${cls}" style="--d:${delay}" d="${d}"/>`;
  const C = (cx, cy, r, cls = "ln", delay = 0) => `<circle pathLength="1" class="${cls}" style="--d:${delay}" cx="${cx}" cy="${cy}" r="${r}"/>`;
  const E = (cx, cy, rx, ry, cls = "ln", delay = 0) => `<ellipse pathLength="1" class="${cls}" style="--d:${delay}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
  const Gr = (cls, inner, style = "") => `<g class="${cls}" ${style ? `style="${style}"` : ""}>${inner}</g>`;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const stars = (n, y1 = 90, s = 3) => { seed = s; return Array.from({ length: n }, (_, i) => `<circle class="star" style="--d:${(rnd() * 6).toFixed(2)}s" cx="${(rnd() * 400).toFixed(1)}" cy="${(8 + rnd() * (y1 - 8)).toFixed(1)}" r="${(.6 + rnd() * .9).toFixed(2)}"/>`).join(""); };
  const water = (y0, rows, cls = "wt drift", s = 5) => { seed = s; let o = ""; for (let r = 0; r < rows; r++) { const y = y0 + r * (10 + r * 2.4); let x = -20 + rnd() * 40; while (x < 400) { const w = 30 + rnd() * 70; o += `<path class="${cls}" style="--d:${(rnd() * -9).toFixed(2)}s" d="M${x.toFixed(0)} ${y.toFixed(0)}c${(w / 4).toFixed(0)} -3 ${(w * .75).toFixed(0)} 3 ${w.toFixed(0)} 0"/>`; x += w + 20 + rnd() * 50; } } return o; };
  const birds = (s = 2) => { seed = s; return Gr("glide", Array.from({ length: 3 }, () => { const x = 40 + rnd() * 300, y = 30 + rnd() * 40; return `<path class="fn" d="M${x} ${y}q5 -5 10 0q5 -5 10 0"/>`; }).join("")); };
  const flame = (x, y, s = 1, d = 0) => Gr("flick", P(`M${x} ${y}c${-9 * s} ${-10 * s} ${-6 * s} ${-22 * s} 0 ${-34 * s}c${6 * s} ${12 * s} ${9 * s} ${24 * s} 0 ${34 * s}z`, "tn", d) + P(`M${x} ${y - 4 * s}c${-3 * s} ${-5 * s} ${-2 * s} ${-11 * s} 0 ${-16 * s}c${2 * s} ${5 * s} ${3 * s} ${11 * s} 0 ${16 * s}z`, "tn fill", d + .05), `transform-origin:${x}px ${y}px`);
  const sparks = (x, y, n = 5) => Array.from({ length: n }, (_, i) => `<circle class="spark" style="--d:${(i * .9).toFixed(1)}s;--x:${((i % 3) - 1) * 9}px" cx="${x + ((i * 7) % 13) - 6}" cy="${y}" r="1.3"/>`).join("");
  const hills = (y, cls = "fn", d = 0) => P(`M0 ${y}c40 -12 70 -18 110 -10s70 -14 110 -6 80 -12 120 -2 50 6 60 2`, cls, d);
  const ground = (y = 214) => P(`M0 ${y}h400`, "fn", 0);
  const wall = (x0, x1, y, h, d = .1) => { let s = `M${x0} ${y}V${y - h}`; for (let x = x0; x < x1; x += 16) s += `h8v-5h8v5`; s += `V${y}`; return P(s, "ln", d); };
  const boat = (x, y, k = 1, d = .2, sail = true) => P(`M${x - 70 * k} ${y - 6 * k}c${30 * k} ${16 * k} ${110 * k} ${16 * k} ${142 * k} ${-2 * k}l${-8 * k} ${-6 * k}h${-126 * k}z`, "ln", d)
    + P(`M${x - 62 * k} ${y - 2 * k}h${124 * k}`, "fn", d + .05) + (sail ? P(`M${x} ${y - 14 * k}V${y - 96 * k}`, "ln", d + .1) + P(`M${x - 34 * k} ${y - 88 * k}h${68 * k}`, "ln", d + .15) + P(`M${x - 30 * k} ${y - 86 * k}c${10 * k} ${30 * k} ${50 * k} ${30 * k} ${60 * k} 0`, "fn", d + .2) : "");
  const scroll = (x, y, w, h, d = .1) => P(`M${x} ${y}h${w}M${x} ${y + h}h${w}`, "ln", d) + E(x, y + h / 2, 7, h / 2 + 6, "ln", d + .05) + E(x + w, y + h / 2, 7, h / 2 + 6, "ln", d + .08)
    + P(`M${x} ${y - 10}v-8M${x} ${y + h + 10}v8M${x + w} ${y - 10}v-8M${x + w} ${y + h + 10}v8`, "ln", d + .1);
  const lines = (x, y, n, w, gap = 11, d = .3, cls = "fn write", s = 4) => { seed = s; return Array.from({ length: n }, (_, i) => P(`M${x} ${y + i * gap}h${(w * (.55 + rnd() * .45)).toFixed(0)}`, cls, d + i * .04)).join(""); };

  const SCENES = {
    // ── Peter ──
    lake: () => [stars(14, 60, 11), C(330, 48, 16, "tn pulse", 0), birds(4), hills(112, "fn", .02), hills(124, "fn", .05), P("M0 132H400", "ln", .05), water(146, 6),
      Gr("bob", boat(176, 172, 1, .15) + Gr("haul", P("M244 168c18 20 54 34 88 30 22-2 26-16 14-28", "ln", .35) + P("M244 168c30 2 70 0 102 2", "fn", .4)
        + [0, 1, 2, 3, 4, 5].map((i) => P(`M${252 + i * 16} 168l${10 - i} ${22 - i * 2}`, "fn", .45 + i * .02) + P(`M${262 + i * 16} 168l${-12 + i} ${22 - i * 2}`, "fn", .46 + i * .02)).join("")
        + [0, 1, 2, 3, 4].map((i) => C(258 + i * 20, 168, 2.4, "tn", .5)).join("") + E(292, 186, 7, 2.6, "tn pulse", .6) + E(312, 190, 6, 2.4, "tn pulse", .65) + E(276, 182, 6, 2.2, "tn pulse", .7)),
        "transform-origin:176px 172px")].join(""),
    nets: () => [stars(8, 50, 5), hills(118), P("M0 150c80-6 140 6 220 0s120-8 180-2", "ln", .05), water(166, 5, "wt drift", 9),
      P("M70 214V96M190 214V96", "ln", .15), P("M70 100c40 26 80 26 120 0", "ln", .2), Gr("sway", P("M74 104c10 40 6 80 14 108M98 114c4 40 2 70 6 98M122 118c2 36 0 64 2 94M146 116c-2 36 0 64-2 96M170 108c-6 40-4 74-10 104", "fn", .3)
        + P("M76 130h108M80 154h100M84 180h94", "fn", .35), "transform-origin:130px 100px"), Gr("bob", boat(300, 200, .7, .4, false), "transform-origin:300px 200px")].join(""),
    house: () => [stars(10, 60, 8), ground(), P("M90 214V120h150v94", "ln", .05), P("M80 120h170", "ln", .1), P("M84 114h162", "fn", .12), P("M150 214v-46a14 14 0 0 1 28 0v46", "ln", .2),
      P("M196 140h22v18h-22z", "ln", .25), C(207, 149, 3, "tn pulse", .35), P("M240 214l40-46h30", "ln", .3), P("M250 202h20M262 188h20M274 176h20", "fn", .35),
      P("M330 214c2-40-2-70 4-100", "ln", .4), Gr("sway", P("M334 114c-14-10-30-8-40 4M334 114c12-14 30-14 40-4M334 114c-6-16-2-28 8-34M334 114c-18 0-26 8-30 20M334 114c16 0 26 10 28 22", "tn", .5), "transform-origin:334px 114px"),
      P("M40 214c0-16 8-22 16-22s16 6 16 22", "fn", .45)].join(""),
    catch: () => [stars(6, 40, 2), hills(104), P("M0 118H400", "fn", .03), water(132, 7, "wt drift", 3),
      Gr("bob", boat(120, 150, .85, .1), "transform-origin:120px 150px"), Gr("bob slow", boat(300, 156, .85, .15), "transform-origin:300px 156px"),
      Gr("haul", P("M160 150c10 40 70 56 120 30", "ln", .3) + P("M160 150c40 10 90 10 122 2", "fn", .32) + [0, 1, 2, 3, 4, 5, 6].map((i) => P(`M${170 + i * 16} 152l6 ${26 + (i % 3) * 4}`, "fn", .35 + i * .02) + P(`M${178 + i * 16} 152l-6 ${26 + (i % 3) * 4}`, "fn", .36 + i * .02)).join("")
        + Array.from({ length: 11 }, (_, i) => E(176 + (i * 37) % 100, 164 + (i * 13) % 22, 6, 2.2, "tn pulse", .5 + i * .02)).join("") + P("M226 190l6 8M240 188l-4 10", "tn", .7))].join(""),
    waves: () => [stars(16, 70, 21), C(60, 46, 12, "fn", 0), Gr("drift-x", P("M-20 60c60-10 120 10 200-4s160-8 240 4", "fn", .05) + P("M-20 78c70-8 130 8 210-2", "fn", .08)),
      water(120, 8, "wt drift fast", 13), Gr("toss", boat(250, 168, .8, .2), "transform-origin:250px 168px"),
      P("M60 200c20-30 50-30 70 0s50 30 70 0", "wt", .4), P("M150 230c24-26 52-26 76 0", "wt", .45)].join(""),
    rock: () => [stars(10, 60, 31), P("M0 128c40-14 80-30 120-26s60 20 90 14 70-40 110-38 60 26 80 34", "fn", .02), ground(220),
      P("M70 220l14-58 20-18 8-26 26-14 30 6 16 20 26 4 20 26 10 34 8 26", "ln", .1), P("M112 118l10 24-6 22M168 112l-4 30 12 22M214 140l-8 28M144 170l18 10 10 26", "fn", .25),
      P("M40 220c4-10 14-14 22-8M262 220c6-12 20-14 30-6M300 220c4-8 12-10 18-4", "fn", .35), Gr("drift", P("M286 210c8-2 16 2 24 0M300 202c6-2 12 2 18 0", "wt", .4))].join(""),
    mountain: () => [stars(18, 70, 41), P("M20 236 150 90l40 30 40-54 150 170", "ln", .05), P("M150 90l20 40M230 66l-10 40", "fn", .2),
      Gr("pulse", P("M140 70c-20 0-22-24 0-26 6-20 40-22 48-6 14-14 46-8 44 12 22 2 22 26 0 26z", "tn", .3)), Gr("turn", P("M200 20v-14M160 32l-10-10M240 32l10-10M130 60h-14M270 60h14", "tn", .5), "transform-origin:200px 54px"),
      P("M196 92h8M188 100h24", "fn", .6)].join(""),
    firecock: () => [stars(18, 80, 51), P("M20 214h360", "fn", 0), P("M40 214V110h100v104M260 214V96h100v118", "fn", .05), P("M80 214v-50a20 20 0 0 1 40 0v50", "ln", .1),
      P("M168 214c4-12 16-14 32-14s28 2 32 14", "ln", .2), P("M176 206h48", "fn", .25), flame(186, 204, .7, .35), flame(200, 202, .9, .38), flame(214, 204, .7, .4), sparks(200, 172, 6),
      P("M312 54c-16 2-26 14-24 26 2 10 16 14 28 8 9-5 11-16 6-26", "ln", .5), C(318, 46, 5.5, "ln", .52), P("M314 41c1-4 4-5 6-2 1-3 4-4 6-1", "tn", .55), P("M323 46l6 2-6 2", "tn", .56),
      P("M292 74c-12-6-15-20-8-30M296 70c-6-10-2-24 8-28M288 82c-12-2-20-10-20-22", "tn", .6), P("M306 88v8M314 88v8", "fn", .62)].join(""),
    shore: () => [C(310, 112, 26, "tn pulse", 0), P("M0 120h400", "fn", .03), water(132, 4, "wt drift", 17), P("M0 168c90-8 200-8 400 4", "ln", .08),
      P("M150 214c4-12 16-14 30-14s26 2 30 14", "ln", .2), flame(166, 210, .6, .3), flame(180, 208, .8, .32), flame(194, 210, .6, .34), sparks(180, 180, 4),
      E(166, 196, 9, 3, "tn", .4), E(196, 196, 9, 3, "tn", .42), P("M226 210c6-6 18-6 24 0", "ln", .45),
      P("M270 214c10-20 50-24 90-14", "fn", .5), Array.from({ length: 7 }, (_, i) => E(286 + i * 10, 206 - (i % 2) * 4, 5, 2, "tn", .55 + i * .02)).join(""), Gr("bob slow", boat(80, 166, .55, .2, false), "transform-origin:80px 166px")].join(""),
    tongues: () => [stars(14, 60, 61), ground(), P("M80 214V100l120-50 120 50v114", "ln", .05), P("M80 100h240", "fn", .1), P("M180 214v-50h40v50", "ln", .15),
      P("M110 130h30v24h-30zM260 130h30v24h-30z", "fn", .2), flame(130, 92, .6, .3), flame(170, 76, .7, .34), flame(200, 66, .8, .38), flame(230, 76, .7, .42), flame(270, 92, .6, .46),
      Gr("drift-x", P("M10 40c30-10 50 6 80-2M300 30c30-8 50 6 90-2", "fn", .5))].join(""),
    gate: () => [ground(220), P("M110 220V70h180v150", "ln", .05), P("M140 220v-96a60 60 0 0 1 120 0v96", "ln", .12), P("M100 70h200M96 62h208", "ln", .18),
      P("M120 82h160M128 92h144", "fn", .2), P("M200 64v-18M190 50h20", "tn", .3), P("M60 220h280M70 232h260M80 244h240", "fn", .35), P("M160 124c10-8 70-8 80 0", "tn pulse", .4),
      Gr("pulse", C(200, 150, 4, "tn", .5))].join(""),
    sheet: () => [stars(22, 120, 71), Gr("lower", P("M120 10L150 130M280 10L250 130M150 10l10 120M250 10l-10 120", "fn", .1) + P("M146 130c30 40 78 40 108 0z", "ln", .2) + P("M150 132c30 26 70 26 100 0", "fn", .25)
      + P("M172 140c4-6 12-6 14 0M200 146c3-5 9-5 11 0l2 4M222 138c2-4 8-4 10 0", "tn", .35) + P("M186 152q6-4 12 0q6-4 12 0", "tn", .4)), P("M20 220h360", "fn", .05),
      P("M60 220V150h80v70M260 220V160h90v60", "fn", .1), P("M60 150l40-20 40 20M260 160l45-22 45 22", "fn", .15)].join(""),
    chains: () => [P("M40 232V30h320v202", "fn", .02), P("M40 232h320", "ln", .05), P("M176 44h48v34h-48zM188 44v34M200 44v34M212 44v34", "ln", .08),
      Gr("pulse", P("M178 80L120 230M222 80L280 230M190 80l-24 150M210 80l24 150", "tn rays", .15)),
      C(110, 96, 6, "ln", .2), C(290, 96, 6, "ln", .22), Gr("sway", Array.from({ length: 6 }, (_, i) => E(110, 108 + i * 12, i % 2 ? 2 : 4.5, 6.5, "ln", .3 + i * .03)).join("") + E(110, 184, 9, 6, "ln", .5), "transform-origin:110px 96px"),
      Gr("sway slow", Array.from({ length: 6 }, (_, i) => E(290, 108 + i * 12, i % 2 ? 2 : 4.5, 6.5, "ln", .32 + i * .03)).join("") + E(290, 184, 9, 6, "ln", .52), "transform-origin:290px 96px"),
      P("M140 228c8-5 16-5 24 0s16 5 24 0 16-5 24 0", "ln", .55)].join(""),
    girded: () => [stars(30, 140, 81), C(330, 56, 13, "fn", 0), P("M0 150c70-6 130-4 200-2s140 0 200-4", "fn", .02), P("M40 150c30-14 60-20 90-16M280 148c30-10 60-12 90-6", "fn", .05),
      P("M120 260C150 210 176 176 194 152M290 260C252 212 222 178 206 152", "ln", .1), P("M200 252v-14M200 222v-11M200 198v-8M200 180v-6M200 166v-4", "fn", .2),
      Gr("sway slow", P("M46 236c-14-2-20-12-12-20s26-6 30 4-4 18-18 16-16-12-8-18 18-2 18 6M64 232c18 4 34 2 46-6", "tn", .35), "transform-origin:64px 226px")].join(""),
    rome: () => [stars(20, 90, 91), P("M20 220h360", "tr", .02), P("M50 220V140h300v80", "tr", .05), P("M80 220v-40a20 20 0 0 1 40 0v40M140 220v-40a20 20 0 0 1 40 0v40M200 220v-40a20 20 0 0 1 40 0v40M260 220v-40a20 20 0 0 1 40 0v40", "tr", .1),
      P("M60 140v-30h280v30M90 110v-20a14 14 0 0 1 28 0v20M150 110v-20a14 14 0 0 1 28 0v20M210 110v-20a14 14 0 0 1 28 0v20M270 110v-20a14 14 0 0 1 28 0v20", "tr", .2), P("M30 240c120-10 220-10 340 0", "tr", .3)].join(""),
    // ── Paul ──
    road: () => [stars(10, 60, 101), Gr("turn", P("M200 -10L110 210M200 -10L150 214M200 -10L200 214M200 -10L250 214M200 -10L290 210", "tn rays", .3), "transform-origin:200px -10px"),
      P("M0 124c60-6 120-8 200-6s140 4 200 6", "fn", .02), wall(146, 254, 124, 18, .08), P("M190 124v-12a10 10 0 0 1 20 0v12", "ln", .12), P("M150 106v-12h12v12M238 106v-12h12v12", "ln", .14),
      P("M40 260L186 126M360 260L214 126", "ln", .15), P("M200 250v-14M200 220v-10M200 196v-8M200 176v-6M200 160v-4", "fn", .2), P("M70 230c8-6 16-6 22 0M300 220c6-5 14-5 20 0", "fn", .3),
      Array.from({ length: 8 }, (_, i) => `<circle class="mote" style="--d:${(i * 1.1).toFixed(1)}s" cx="${150 + (i * 23) % 100}" cy="${200 - (i * 17) % 60}" r="1.2"/>`).join("")].join(""),
    light: () => SCENES.road(),
    city: () => [stars(12, 60, 111), ground(214), wall(40, 360, 214, 70, .05), P("M60 144v-30h30v30M310 144v-30h30v30M180 144v-40h40v40", "ln", .15), P("M186 214v-30a14 14 0 0 1 28 0v30", "ln", .2),
      P("M100 170h16v14h-16zM280 170h16v14h-16z", "fn", .25), Gr("sway", P("M370 214c2-30-2-50 2-70M372 144c-10-8-22-6-28 2M372 144c8-10 22-10 28-2M372 144c-4-12 0-20 6-24", "tn", .4), "transform-origin:372px 144px")].join(""),
    garments: () => [stars(8, 70, 121), ground(214), P("M140 214h120l-6-16H146z", "ln", .1), P("M150 198h100l-8-14h-84z", "ln", .15), P("M162 184h76l-8-12h-60z", "ln", .2),
      P("M160 206h80M170 191h60M178 178h44", "fn", .25), P("M246 198c10 4 14 10 12 16M142 198c-8 4-10 10-8 16", "fn", .3),
      ...[[70, 208], [96, 212], [300, 210], [324, 206], [112, 204], [286, 202], [58, 200]].map(([x, y], i) => P(`M${x} ${y}c0-8 6-12 12-12s12 4 12 12z`, "fn", .35 + i * .03))].join(""),
    letters: () => [ground(214), scroll(120, 120, 120, 60, .05), lines(136, 134, 4, 90, 11, .25), C(250, 196, 7, "tn", .4), P("M246 192l8 8M254 192l-8 8", "tn", .45),
      P("M70 210c0-20 10-30 30-30h20", "fn", .3), P("M290 214c4-30 30-40 50-40", "fn", .35), Gr("sway", P("M300 120l30-40M296 124l8 2", "ln", .5), "transform-origin:300px 120px")].join(""),
    basket: () => [stars(22, 120, 131), C(330, 50, 14, "fn", 0), P("M60 260V40h180v220", "ln", .05), P("M60 40h180", "fn", .08), P("M136 100h28v30h-28z", "ln", .15),
      Gr("lower slow", P("M150 130V178", "fn", .3) + P("M134 178h32l-4 22h-24z", "ln", .35) + P("M138 186h24M140 194h20", "fn", .4)), P("M0 250h400", "fn", .1), P("M90 70h120M90 160h120M90 210h120", "fn", .2)].join(""),
    ship: () => [stars(10, 60, 141), P("M0 126H400", "fn", .03), water(140, 7, "wt drift", 23), Gr("bob", boat(200, 164, 1.05, .15) + P("M168 76c16 30 48 30 64 0", "tn", .4), "transform-origin:200px 164px"),
      birds(6), C(70, 60, 12, "fn", 0)].join(""),
    tents: () => [stars(16, 80, 151), ground(214), P("M70 214l70-90 70 90M140 124v90", "ln", .1), P("M110 214l30-40 30 40", "fn", .15), P("M220 214l60-76 60 76M280 138v76", "ln", .2),
      P("M140 124l-90 90M140 124l100 90M280 138l-70 76M280 138l80 76", "fn", .3), Gr("pulse", C(190, 206, 3, "tn", .45))].join(""),
    storm: () => [Gr("drift-rain", Array.from({ length: 16 }, (_, i) => P(`M${10 + i * 26} ${10 + (i % 3) * 8}l-10 30`, "fn", .02 + i * .01)).join("")), water(118, 9, "wt drift fast", 33),
      Gr("toss", boat(200, 170, .95, .15) + [0, 1, 2, 3].map((i) => P(`M${140 + i * 4} 166c-10 20-14 40-12 ${56 + i * 4}`, "fn", .4 + i * .02) + P(`M${118 + i * 4} ${222 + i * 4}l8 6 8-6`, "tn", .45 + i * .02)).join(""), "transform-origin:200px 170px")].join(""),
    parchments: () => [ground(214), scroll(60, 140, 100, 50, .05), lines(74, 152, 3, 70, 10, .25), P("M210 214v-70l70-10v70z", "ln", .2), P("M280 204v-70l70 10v70z", "ln", .25), lines(222, 160, 4, 46, 10, .35, "fn write", 9), lines(292, 162, 4, 46, 10, .4, "fn write", 12),
      Gr("sway", P("M120 120l40-50M118 124l6 2", "ln", .5), "transform-origin:120px 120px"), stars(6, 60, 161)].join(""),
    westroad: () => [C(70, 140, 26, "tn pulse", 0), P("M0 140h400", "fn", .03), water(150, 3, "wt drift", 41), P("M400 230c-80-30-160-60-260-86", "ln", .1), P("M140 144c-30-6-60-8-90-6", "tr", .3), birds(12), stars(10, 80, 171)].join(""),
    // ── Thaddaeus ──
    scroll: () => [stars(16, 60, 181), scroll(90, 84, 220, 120, .05), Array.from({ length: 12 }, (_, i) => {
      const col = i < 6 ? 0 : 1, row = i % 6, x = 112 + col * 104, y = 102 + row * 17, him = i === 9;
      return P(`M${x} ${y}h${him ? 74 : 50 + ((i * 13) % 30)}`, him ? "tn write him" : "fn write", .2 + i * .05) + (him ? C(x - 8, y, 2.4, "tn pulse", .8) : "");
    }).join("")].join(""),
    blank: () => [stars(12, 60, 191), scroll(110, 96, 180, 96, .05), P("M128 118h70", "fn write", .3), P("M128 134h0M128 150h0", "fn", .4), C(120, 118, 2, "tn pulse", .5)].join(""),
    sandals: () => [stars(12, 60, 201), P("M0 150c90-10 160 4 220-2s120-6 180 0", "fn", .02), P("M40 260C120 200 160 180 200 160s90-30 160-40", "ln", .1), P("M70 260C140 210 180 192 214 176s100-34 170-44", "fn", .15),
      wall(300, 360, 132, 14, .2), wall(40, 90, 150, 10, .25)].join(""),
    lamp: () => [stars(18, 90, 211), P("M40 206h320", "ln", .05), P("M60 206v34M340 206v34", "fn", .1), P("M150 200c0-16 18-24 40-24s46 6 46 16c-14 8-32 8-52 8z", "ln", .2), P("M226 186l24-10", "ln", .25), flame(256, 172, .7, .3),
      P("M180 176c4-8 16-10 22-2", "fn", .3), E(96, 198, 26, 7, "fn", .35), P("M286 200v-30h22v30M282 170h30", "fn", .4)].join(""),
    upper: () => [stars(14, 60, 221), ground(), P("M120 214V90h170v124", "ln", .05), P("M110 90h190", "fn", .1), P("M180 140h50v30h-50z", "ln", .15), C(205, 155, 3, "tn pulse", .3),
      P("M60 214l60-60h20", "ln", .2), P("M70 204h16M82 192h16M94 180h16M106 168h16", "fn", .25), P("M140 214v-40h30v40", "fn", .3)].join(""),
    eastroad: () => [stars(30, 120, 231), P("M0 190h400", "tr", .02), P("M0 250c100-20 200-50 330-60", "tr", .1), P("M330 190v-30h40v30M336 160l14-10 14 10", "tr", .3), P("M40 190c20-20 40-30 60-30", "tr", .2), C(360, 60, 12, "tn pulse", 0)].join(""),
  };

  // Objects for the cabinet: 200×150, simpler, centred on the thing itself.
  const OBJECTS = {
    "o-net": () => P("M30 30c40 14 100 14 140 0", "ln") + [0, 1, 2, 3, 4, 5, 6].map((i) => P(`M${40 + i * 20} 34c-6 30-4 60 6 86`, "fn", .1 + i * .02)).join("") + P("M36 60h128M40 88h120M48 114h104", "fn", .2) + [0, 1, 2, 3, 4].map((i) => C(46 + i * 27, 32, 3, "tn", .3)).join(""),
    "o-ship": () => Gr("bob", P("M30 100c30 18 110 18 140 0l-8-8H38z", "ln") + P("M100 92V24M70 32h60", "ln", .2) + P("M72 34c8 26 48 26 56 0", "fn", .3), "transform-origin:100px 100px") + `<path class="wt drift" d="M24 120c20-4 40 4 60 0"/><path class="wt drift" style="--d:-3s" d="M100 124c20-4 40 4 70 0"/><path class="wt drift" style="--d:-5s" d="M50 134c20-3 40 3 56 0"/>`,
    "o-coin": () => C(100, 74, 30, "ln") + C(100, 74, 24, "fn", .2) + P("M88 64c6-6 18-6 24 0M86 84h28", "tn", .3) + P("M40 120c20-10 40-10 60 0s40 10 60 0", "wt drift", .1),
    "o-keys": () => C(58, 44, 14, "ln") + C(58, 44, 6, "fn", .1) + P("M68 54l78 66M128 104l-9 10M138 113l-9 10", "ln", .2) + C(142, 44, 14, "tn", .3) + C(142, 44, 6, "fn", .35) + P("M132 54l-78 66M72 104l9 10M62 113l9 10", "tn", .4),
    "o-sword": () => P("M40 116L150 30", "ln") + P("M146 26l10 2-2 10", "ln", .1) + P("M56 96l20 20M48 124l-8 8", "ln", .2) + P("M66 106l-8 8", "tn", .3),
    "o-fire": () => P("M50 124c10-14 30-18 50-18s40 4 50 18", "ln") + flame(84, 116, .7, .2) + flame(100, 112, .95, .25) + flame(116, 116, .7, .3) + sparks(100, 70, 5),
    "o-cock": () => P("M70 110c0-30 14-46 34-46 6-14 22-14 26 0-8 4-12 10-12 16 18 0 30 16 26 36-4 18-22 26-40 22-20-4-34-14-34-28z", "ln") + P("M120 64l6-10 6 10", "tn", .2) + P("M136 70l12-2-8 8", "tn", .25) + P("M92 136l-4 10M104 136l2 10", "fn", .3) + P("M40 136h120", "fn", .3),
    "o-coat": () => Gr("sway", P("M70 30h60l20 30-14 8v66H64V68l-14-8z", "ln") + P("M100 30v20M80 30c4 12 36 12 40 0", "fn", .2) + P("M64 96c20 6 52 6 72 0", "tn", .3), "transform-origin:100px 30px"),
    "o-sheet": () => Gr("lower", P("M40 10l20 70M160 10l-20 70M70 10l2 70M130 10l-2 70", "fn") + P("M56 80c20 34 68 34 88 0z", "ln", .2) + P("M78 92c3-5 9-5 11 0M104 96c3-4 8-4 10 0", "tn", .3)),
    "o-chains": () => P("M40 14h120", "fn") + Gr("sway", Array.from({ length: 7 }, (_, i) => E(76, 26 + i * 13, i % 2 ? 2.2 : 5.5, 8, "ln", i * .04)).join("") + E(76, 124, 11, 7, "ln", .35), "transform-origin:76px 14px")
      + Gr("sway slow", Array.from({ length: 7 }, (_, i) => E(124, 26 + i * 13, i % 2 ? 2.2 : 5.5, 8, "ln", .1 + i * .04)).join("") + E(124, 124, 11, 7, "ln", .45), "transform-origin:124px 14px"),
    "o-gate": () => P("M40 130V30h120v100", "ln") + [0, 1, 2, 3, 4].map((i) => P(`M${60 + i * 20} 30v100`, "ln", .1 + i * .03)).join("") + P("M40 60h120M40 100h120", "fn", .3) + Gr("pulse", C(150, 80, 3, "tn", .4)),
    "o-clothes": () => P("M40 124h120l-6-18H46z", "ln") + P("M52 106h96l-8-16H60z", "ln", .1) + P("M64 90h72l-8-14H72z", "ln", .2) + P("M56 116h88M66 98h68M76 83h48", "fn", .3) + P("M30 128h140", "fn", .35),
    "o-letters": () => scroll(50, 50, 100, 46, .05) + lines(64, 62, 3, 70, 10, .2) + C(150, 108, 7, "tn", .4),
    "o-basket": () => Gr("lower slow", P("M100 10V60", "fn") + P("M70 60h60l-8 50H78z", "ln", .1) + P("M74 74h52M76 88h48M78 100h44", "fn", .2) + P("M84 60l4 50M100 60v50M116 60l-4 50", "fn", .3)),
    "o-stocks": () => P("M30 70h140v24H30z", "ln") + C(76, 82, 8, "fn", .2) + C(124, 82, 8, "fn", .25) + P("M40 94v40M160 94v40", "ln", .3) + P("M100 70v24", "fn", .35),
    "o-tent": () => P("M40 124l60-84 60 84M100 40v84", "ln") + P("M100 40L20 124M100 40l80 84", "fn", .2) + P("M80 124l20-28 20 28", "fn", .3),
    "o-cloth": () => Gr("sway", P("M60 30h80v70c-14 10-26-6-40 4s-26-6-40 4z", "ln") + P("M72 46h56M72 62h56", "fn", .2), "transform-origin:100px 30px"),
    "o-anchor": () => C(100, 30, 8, "ln") + P("M100 38v80M80 56h40", "ln", .2) + P("M60 96c6 22 26 30 40 30s34-8 40-30M60 96l-6 8M140 96l6 8", "ln", .3),
    "o-viper": () => P("M40 120c30-10 30-40 60-40s30 30 60 20 20-30 0-40", "ln") + P("M160 60l10-6-4 10", "tn", .3) + flame(60, 126, .5, .4) + flame(74, 128, .6, .45),
    "o-parchment": () => scroll(46, 46, 108, 56, .05) + lines(60, 60, 4, 80, 10, .2, "fn write", 7) + Gr("sway", P("M150 40l20-26", "ln", .5), "transform-origin:150px 40px"),
  };

  window.Art = {
    scene(name, cls = "") { const f = SCENES[name] ?? SCENES.girded; return `<svg class="art ${cls}" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${f()}</svg>`; },
    object(name) { const f = OBJECTS[name]; if (!f) console.error(`art: no object drawing "${name}"`); return `<svg class="art obj" viewBox="0 0 200 150" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${f ? f() : ""}</svg>`; },
    has: (name) => !!SCENES[name],
  };
})();
