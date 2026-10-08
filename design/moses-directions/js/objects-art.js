// F · In his hands: line drawings of the objects, drawn here by hand. They show the parts the verses name; they are not
// pictures of the real objects. Every stroke has pathLength=1 so a drawing can plot itself (CSS reads --draw on the svg).
(() => {
  const P = (d, cls = "o-line", delay = 0) => `<path pathLength="1" class="${cls}" style="--d:${delay}" d="${d}"/>`;
  const E = (cx, cy, rx, ry, cls = "o-line", delay = 0, rot = 0) => `<ellipse pathLength="1" class="${cls}" style="--d:${delay}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ""}/>`;
  const C = (cx, cy, r, cls = "o-line", delay = 0) => E(cx, cy, r, r, cls, delay);
  const plinth = (y = 186, w = 84) => P(`M${120 - w} ${y}H${120 + w}`, "o-floor", 0);
  const mirror = (d) => d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (m, x, y) => `${240 - Number(x)} ${y}`);
  const rows = (x0, x1, y0, y1, step, delay) => { let s = ""; for (let y = y0, i = 0; y <= y1; y += step, i++) { const cut = x0 + (x1 - x0) * (.45 + ((i * 37) % 30) / 100); s += P(`M${x0} ${y}H${cut - 3}M${cut + 3} ${y}H${x1 - ((i * 13) % 9)}`, "o-fine", delay + i * .02); } return s; };

  const ART = {
    basket: () => {
      const blade = (x, h, lean, d) => P(`M${x} 176C${x + lean * .3} ${176 - h * .5} ${x + lean * .7} ${176 - h * .8} ${x + lean} ${176 - h}C${x + lean * .55} ${176 - h * .75} ${x + 3 + lean * .2} ${176 - h * .45} ${x + 4} 176`, "o-fine", d);
      return [
        P("M6 172C40 165 70 176 100 169S160 162 190 170 228 173 236 168", "o-fine", .05), P("M22 186C58 180 96 191 132 184S192 179 222 186", "o-fine", .1),
        P("M46 122C48 150 76 164 120 164S192 150 194 122", "o-line", .15), E(120, 122, 74, 17, "o-line", .2),
        P("M52 119C54 92 84 80 120 80S186 92 188 119", "o-line", .3), P("M60 112C64 96 88 88 120 88S176 96 180 112", "o-fine", .38),
        ...[0, 1, 2, 3, 4].map((i) => P(`M${70 + i * 25} ${118 - (i === 2 ? 4 : 0)}C${74 + i * 24} 100 ${86 + i * 18} 90 ${92 + i * 14} 84`, "o-fine", .42 + i * .02)),
        P("M50 134C64 151 176 151 190 134", "o-fine", .5), P("M58 148C80 160 160 160 182 148", "o-fine", .55),
        ...[66, 82, 98, 114, 130, 146, 162, 176].map((x, i) => P(`M${x} ${138 + Math.abs(120 - x) / 10}v${18 - Math.abs(120 - x) / 9}`, "o-fine", .58 + i * .015)),
        P("M62 156C86 170 154 170 178 156", "o-tone", .7), E(120, 82, 6, 2.5, "o-tone", .72),
        blade(14, 120, 10, .25), blade(26, 92, 18, .3), blade(36, 70, -8, .35), blade(206, 110, -12, .3), blade(218, 84, 10, .35), blade(196, 64, -16, .4),
      ].join("");
    },
    shoes: () => {
      const sole = "M78 40C58 40 52 62 54 86C56 112 60 128 58 150C56 172 70 184 86 182C102 180 106 166 104 148C102 124 108 100 106 76C104 52 98 40 78 40Z";
      const straps = ["M64 72C74 63 94 65 103 74", "M57 104C72 95 93 95 105 103", "M59 134C70 125 92 125 103 134", "M80 50V70"];
      return [plinth(194, 96), P(sole, "o-line", .05), P(mirror(sole), "o-line", .15), ...straps.map((d, i) => P(d, "o-tone", .4 + i * .05)), ...straps.map((d, i) => P(mirror(d), "o-tone", .45 + i * .05)),
        P("M66 56C62 80 66 120 64 160", "o-fine", .6), P(mirror("M66 56C62 80 66 120 64 160"), "o-fine", .65)].join("");
    },
    rod: () => [plinth(194, 70), P("M62 192C80 150 96 120 118 84C134 58 150 36 172 10", "o-line", .05), P("M70 194C88 152 104 122 126 86C142 60 158 38 180 12", "o-line", .1),
      E(108, 102, 6, 3, "o-fine", .45, -55), E(149, 46, 5, 3, "o-fine", .5, -50), P("M172 10C176 8 180 10 180 12", "o-line", .3),
      P("M72 172l9 4M75 166l9 4M78 160l9 4", "o-tone", .6)].join(""),
    bones: () => [plinth(186, 100), P("M40 98H176V162H40Z", "o-line", .05), P("M40 98L66 78H202L176 98", "o-line", .15), P("M176 98L202 78V142L176 162", "o-line", .2),
      P("M40 110H176M40 150H176", "o-fine", .4), P("M176 110L202 90M176 150L202 130", "o-fine", .45), P("M46 92L70 74H200", "o-tone", .55), E(108, 130, 20, 8, "o-fine", .6)].join(""),
    manna: () => [plinth(186, 60), E(120, 52, 22, 5, "o-line", .05), P("M100 54C100 63 96 67 93 71M140 54C140 63 144 67 147 71", "o-line", .15),
      P("M93 71C58 86 58 150 90 170C104 178 136 178 150 170C182 150 182 86 147 71", "o-line", .2), P("M100 172L104 182H136L140 172", "o-line", .35),
      P("M74 98C100 106 140 106 166 98M70 146C100 156 140 156 170 146", "o-fine", .45), ...[[108, 50], [116, 47], [124, 49], [132, 47], [112, 53], [128, 53]].map(([x, y], i) => C(x, y, 2.2, "o-tone", .6 + i * .03))].join(""),
    tablets: () => {
      const slab = (x, y, d) => [P(`M${x} ${y}H${x + 62}V${y + 136}H${x}Z`, "o-line", d), P(`M${x} ${y}L${x + 8} ${y - 6}H${x + 70}L${x + 62} ${y}`, "o-line", d + .08), P(`M${x + 62} ${y}L${x + 70} ${y - 6}V${y + 130}L${x + 62} ${y + 136}`, "o-line", d + .1), rows(x + 8, x + 54, y + 14, y + 124, 10, d + .3)].join("");
      return [plinth(190, 90), slab(48, 42, .05), slab(124, 46, .2)].join("");
    },
    ark: () => [plinth(184, 104),
      P("M56 104H168V160H56Z", "o-line", .05), P("M56 104L80 88H192L168 104", "o-line", .12), P("M168 104L192 88V144L168 160", "o-line", .16),
      P("M56 112H168L192 96", "o-fine", .35), P("M54 99L80 82H194L168 99ZM54 99V104M168 99V104M194 82V88", "o-line", .38),
      P("M14 150H206M16 156H206", "o-line", .4), C(72, 153, 6, "o-tone", .5), C(152, 153, 6, "o-tone", .52), P("M196 140H230M196 135H230", "o-fine", .45), P("M28 140H54", "o-fine", .45),
      P("M98 86C86 64 92 40 120 30C108 46 110 64 116 84", "o-tone", .6), P("M100 70C98 60 100 52 106 46M104 78C104 66 106 58 112 50", "o-tone", .66),
      P("M174 86C186 64 180 40 152 30C164 46 162 64 156 84", "o-tone", .62), P("M172 70C174 60 172 52 166 46M168 78C168 66 166 58 160 50", "o-tone", .68)].join(""),
    veil: () => [plinth(192, 80),
      ...Array.from({ length: 11 }, (_, i) => { const a = ((200 + i * 14) * Math.PI) / 180, r0 = 70, r1 = 92 + (i % 2) * 12; return P(`M${(120 + Math.cos(a) * r0).toFixed(1)} ${(78 + Math.sin(a) * r0).toFixed(1)}L${(120 + Math.cos(a) * r1).toFixed(1)} ${(78 + Math.sin(a) * r1).toFixed(1)}`, "o-tone", .05 + i * .02); }),
      P("M62 54C100 44 140 44 178 54", "o-line", .3), P("M62 54C58 92 64 132 56 178", "o-line", .35), P("M178 54C182 92 176 132 184 178", "o-line", .38),
      P("M56 178C80 186 100 172 120 182C140 190 162 174 184 178", "o-line", .45), P("M86 52C82 100 90 140 82 180M120 48C118 100 124 140 120 182M154 52C158 100 150 140 158 178", "o-fine", .55)].join(""),
    budded: () => [plinth(194, 60), P("M120 196C118 150 122 100 120 24", "o-line", .05), P("M124 196C122 150 126 100 124 26", "o-fine", .1),
      P("M122 70L138 58M122 100L104 90M123 128L140 120M121 150L104 144M121 42L134 34", "o-fine", .3),
      ...[[142, 56], [100, 88]].map(([x, y], i) => [0, 72, 144, 216, 288].map((a) => C((x + Math.cos((a * Math.PI) / 180) * 7).toFixed(1), (y + Math.sin((a * Math.PI) / 180) * 7).toFixed(1), 5, "o-tone", .45 + i * .08)).join("") + C(x, y, 2, "o-line", .5 + i * .08)),
      E(145, 117, 8, 5, "o-line", .6, -25), E(100, 146, 8, 5, "o-line", .62, 25), E(136, 32, 6, 4, "o-line", .64, -30), E(124, 176, 3, 4, "o-tone", .66), E(119, 86, 3, 4, "o-tone", .68)].join(""),
    serpent: () => [plinth(196, 50), P("M120 196V30", "o-line", .05), P("M124 196V32", "o-fine", .08),
      P("M122 44C152 48 152 70 122 74C92 78 92 100 122 104C152 108 152 130 122 134C102 137 98 150 106 158", "o-tone", .3),
      P("M122 52C144 56 144 66 122 66M122 82C100 86 100 96 122 96M122 112C144 116 144 126 122 126", "o-fine", .5),
      E(114, 40, 9, 5, "o-tone", .6, -10), P("M105 40l-9-3M105 40l-9 3", "o-tone", .7), C(112, 38, 1, "o-line", .75)].join(""),
    book: () => {
      const roll = (x) => [P(`M${x} 54C${x} 48 ${x + 24} 48 ${x + 24} 54V156C${x + 24} 162 ${x} 162 ${x} 156Z`, "o-line", .05), E(x + 12, 54, 12, 4, "o-fine", .15), P(`M${x + 12} 38V50M${x + 12} 160V174`, "o-line", .2)].join("");
      return [plinth(186, 90), roll(46), roll(170), P("M70 58H170M70 152H170", "o-line", .25), rows(80, 112, 70, 140, 8, .4), rows(126, 160, 70, 140, 8, .5)].join("");
    },
  };
  window.objectArt = (id, cls = "") => `<svg class="o-art ${cls}" viewBox="0 0 240 200" aria-hidden="true">${(ART[id] ?? (() => ""))()}</svg>`;

  // A plain standing figure for scale (no particular person): head, body, arms, legs.
  window.scaleFigure = (x, ground, h) => {
    const u = h / 8, top = ground - h, r = (x0, y0, w, hh) => `<rect x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${w.toFixed(1)}" height="${hh.toFixed(1)}" rx="${(w / 2).toFixed(1)}"/>`;
    return `<g class="o-figure"><circle cx="${x}" cy="${(top + u * .55).toFixed(1)}" r="${(u * .55).toFixed(1)}"/>${r(x - u * .95, top + u * 1.25, u * 1.9, u * 3.1)}${r(x - u * 1.42, top + u * 1.35, u * .42, u * 2.7)}${r(x + u, top + u * 1.35, u * .42, u * 2.7)}${r(x - u * .78, top + u * 3.9, u * .7, u * 4.1)}${r(x + u * .08, top + u * 3.9, u * .7, u * 4.1)}</g>`;
  };
})();
