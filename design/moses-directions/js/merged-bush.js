// H · the burning bush under the header: a detailed line drawing (Horeb, the flock, the bush, the shoes put off) whose
// flame flickers and whose sparks drift up on a slow loop. Everything moving is a function of one loop phase (0..1), so
// the clock and its ticker can play, pause and scrub it, and every loop joins the next without a seam.
(() => {
  const TAU = Math.PI * 2, CX = 600, GROUND = 372;
  // A small seeded random, so the bush is the same drawing on every visit.
  const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const f1 = (n) => n.toFixed(1);
  const S = (d, delay, cls = "") => `<path class="s ${cls}" pathLength="1" style="--d:${delay.toFixed(2)}" d="${d}"/>`;

  // The bush: three stems from the root, each forking twice or three times; leaves at the tips.
  function bush() {
    const r = rng(7), stems = [], leaves = [];
    const grow = (x, y, ang, len, depth) => {
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len, bend = (r() - .5) * len * .5;
      const cx = (x + x2) / 2 + Math.cos(ang + Math.PI / 2) * bend, cy = (y + y2) / 2 + Math.sin(ang + Math.PI / 2) * bend;
      stems.push(S(`M${f1(x)} ${f1(y)}Q${f1(cx)} ${f1(cy)} ${f1(x2)} ${f1(y2)}`, .12 + (3 - depth) * .09, depth > 1 ? "mb-stem" : "mb-twig"));
      if (depth === 0) {
        for (let k = 0; k < 2; k++) {
          const a = ang + (k ? .7 : -.6) + (r() - .5) * .5, tx = x2 + Math.cos(a) * 9, ty = y2 + Math.sin(a) * 9, nx = Math.cos(a + Math.PI / 2) * 3.4, ny = Math.sin(a + Math.PI / 2) * 3.4;
          leaves.push(S(`M${f1(x2)} ${f1(y2)}Q${f1((x2 + tx) / 2 + nx)} ${f1((y2 + ty) / 2 + ny)} ${f1(tx)} ${f1(ty)}Q${f1((x2 + tx) / 2 - nx)} ${f1((y2 + ty) / 2 - ny)} ${f1(x2)} ${f1(y2)}`, .5 + r() * .12, "mb-leaf"));
        }
        return;
      }
      const n = depth === 3 ? 3 : 2 + (r() > .6 ? 1 : 0);
      for (let k = 0; k < n; k++) grow(x2, y2, ang + (k - (n - 1) / 2) * (.5 + r() * .25) + (r() - .5) * .2, len * (.62 + r() * .14), depth - 1);
    };
    [-2.05, -1.72, -1.42, -1.1].forEach((a, i) => grow(CX + (i - 1.5) * 7, GROUND, a, 58 + (i % 2) * 10, 3));
    return stems.join("") + leaves.join("");
  }
  // Flame tongues on the crown: where each sits, its size, and its own rhythm (whole numbers keep the loop seamless).
  const TONGUES = [[602, 236, 96, 19, 3, .2, 4], [574, 250, 74, 15, 4, 1.7, -6], [632, 246, 80, 16, 3, 3.1, 7], [554, 258, 58, 13, 5, 4.4, -8], [652, 255, 62, 13, 4, .9, 9],
    [538, 276, 40, 10, 6, 2.5, -9], [668, 272, 44, 10, 5, 5.3, 10], [588, 228, 52, 10, 6, 3.7, -3], [618, 232, 56, 10, 5, 1.1, 5]];
  const r2 = rng(19);
  const SPARKS = Array.from({ length: 26 }, () => ({ x: CX + (r2() - .5) * 170, y: 214 + r2() * 60, rise: 80 + r2() * 110, k: 2 + Math.floor(r2() * 3), o: r2(), w: (r2() - .3) * 22, ph: r2() * TAU }));
  const sheep = (x, y, s, d) => S(`M${x} ${y}c0-${9 * s} ${24 * s}-${9 * s} ${24 * s} 0c${5 * s} 0 ${5 * s} ${9 * s} 0 ${9 * s}h-${24 * s}c-${5 * s} 0-${5 * s}-${9 * s} 0-${9 * s}zM${x + 24 * s} ${y + s}c${4 * s}-${s} ${7 * s} ${s} ${7 * s} ${4 * s}M${x + 3 * s} ${y + 9 * s}v${6 * s}M${x + 19 * s} ${y + 9 * s}v${6 * s}`, d, "mb-fine");

  // Callout anchors and label positions (viewBox units), by callout id in data/merged.json.
  const SPOT = { mountain: [[448, 156], [470, 92], "start"], flock: [[904, 344], [952, 278], "start"], flame: [[612, 172], [776, 140], "start"], unburnt: [[560, 344], [352, 262], "end"], shoes: [[478, 376], [318, 414], "end"] };

  window.MergedBush = {
    svg(callouts) {
      const r = rng(3);
      const stars = Array.from({ length: 26 }, () => `<circle class="mb-star" cx="${f1(r() * 1200)}" cy="${f1(r() * 150 + 8)}" r="${f1(.6 + r() * 1.1)}" style="--tw:${f1(3 + r() * 5)}s;--td:${f1(-r() * 6)}s"/>`).join("");
      const grit = Array.from({ length: 46 }, () => { const x = r() * 1200, y = GROUND + 6 + r() * 50; return S(`M${f1(x)} ${f1(y)}h${f1(4 + r() * 14)}`, .05 + r() * .2, "mb-grit"); }).join("");
      const calls = callouts.map((c) => {
        const [[ax, ay], [lx, ly], anchor] = SPOT[c.id], bend = anchor === "end" ? lx + 10 : lx - 10;
        return `<a class="mb-call" href="${refHref(c.ref)}" data-call="${c.id}"><path class="s mb-lead" pathLength="1" style="--d:.75" d="M${ax} ${ay}L${bend} ${ly - 4}"/><circle class="mb-anchor" cx="${ax}" cy="${ay}" r="2.6"/>
          <text x="${lx}" y="${ly - 12}" text-anchor="${anchor}" class="mb-cref">${esc(refText(c.ref))}</text><text x="${lx}" y="${ly + 8}" text-anchor="${anchor}" class="mb-cphrase">“${esc(c.phrase)}”</text></a>`;
      }).join("");
      return `<svg class="mb" viewBox="0 0 1200 440" preserveAspectRatio="xMidYMid slice" fill="none" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Line drawing: the bush burning at Horeb, the flock nearby, and the shoes put off">
        <defs><radialGradient id="mb-glow"><stop offset="0" class="mb-g1"/><stop offset=".55" class="mb-g2"/><stop offset="1" class="mb-g3"/></radialGradient></defs>
        <g class="mb-sky">${stars}</g>
        ${S("M0 306 120 266 190 284 300 210 372 236 448 152 520 200 562 182 640 240 722 212 806 262 902 226 1004 270 1110 236 1200 252", .02, "mb-far")}
        ${S("M300 210l14 26M448 152l-6 40M448 152l22 30M562 182l-10 34M902 226l-8 30", .1, "mb-far")}
        ${S("M0 340c120-18 220-6 330-22s170 4 240-4M640 330c90-10 200 6 300-8s170-4 260 4", .06, "mb-mid")}
        ${S(`M0 ${GROUND + 6}C200 ${GROUND - 6} 400 ${GROUND + 2} ${CX} ${GROUND}S1000 ${GROUND - 8} 1200 ${GROUND}`, .04, "mb-ground")}
        ${grit}
        ${S("M690 372c6-16 26-22 40-12 10-12 30-8 34 8M402 374c4-12 18-16 28-8 6-8 20-6 22 6", .3, "mb-fine")}
        ${sheep(872, 338, 1, .55)}${sheep(916, 350, .85, .6)}${sheep(960, 334, .75, .65)}${sheep(842, 356, .7, .62)}
        ${S("M462 374c-2-5 4-8 14-8s22 1 24 5-6 6-18 6-18 1-20-3zM470 368c2-4 8-6 12-4M488 383c-2-5 4-8 14-8s20 1 22 5-6 6-17 6-17 1-19-3zM496 377c2-4 8-6 12-4", .7, "mb-tone")}
        <ellipse class="mb-glow" cx="${CX}" cy="262" rx="170" ry="150" fill="url(#mb-glow)"/>
        <g class="mb-bush">${bush()}</g>
        <g class="mb-fire">${TONGUES.map(() => '<path class="mb-flame"/>').join("")}${TONGUES.slice(0, 5).map(() => '<path class="mb-core"/>').join("")}</g>
        <g class="mb-sparks">${SPARKS.map(() => '<circle class="mb-spark" r="1.4"/>').join("")}</g>
        <g class="mb-calls">${calls}</g>
      </svg>`;
    },
    // One frame: phase (0..1 around the loop) and draw (0..1, how much of the drawing has drawn itself).
    frame(svg, phase, draw = 1) {
      svg.style.setProperty("--draw", draw.toFixed(3));
      const lit = easeOut(span(draw, .45, 1)), flames = svg.querySelectorAll(".mb-flame"), cores = svg.querySelectorAll(".mb-core");
      TONGUES.forEach(([x, y, h, w, k, ph, lean], i) => {
        const s = TAU * phase, flick = 1 + .1 * Math.sin(s * k * 2 + ph) + .05 * Math.sin(s * k * 5 + ph * 2);
        const sway = (Math.sin(s * k + ph) * .12 + Math.sin(s * k * 3 + ph) * .05) * h;
        // A tongue leans and curls: its two sides are drawn differently, and the tip bends with the sway.
        const tongue = (hh, ww, sw) => { const tx = x + sw + lean * hh / 90, ty = y - hh, bend = sw * .6;
          return `M${f1(x - ww)} ${f1(y)}C${f1(x - ww * 1.3)} ${f1(y - hh * .3)} ${f1(tx - ww * .75 - bend)} ${f1(ty + hh * .5)} ${f1(tx)} ${f1(ty)}C${f1(tx + ww * .15 - bend * .4)} ${f1(ty + hh * .28)} ${f1(x + ww * 1.35)} ${f1(y - hh * .52)} ${f1(x + ww)} ${f1(y)}Q${f1(x + ww * .1)} ${f1(y + ww * .55)} ${f1(x - ww)} ${f1(y)}Z`; };
        flames[i].setAttribute("d", tongue(h * flick * lit, w * (.4 + .6 * lit), sway * lit));
        if (cores[i]) cores[i].setAttribute("d", tongue(h * .5 * (1 + .14 * Math.sin(s * k * 3 + ph + 1)) * lit, w * .45 * lit, sway * .7 * lit));
      });
      svg.querySelectorAll(".mb-spark").forEach((el, i) => {
        const p = SPARKS[i], L = ((phase * p.k + p.o) % 1 + 1) % 1, a = Math.pow(Math.sin(Math.PI * L), 1.4) * lit;
        el.setAttribute("cx", f1(p.x + Math.sin(TAU * L * 1.3 + p.ph) * 10 * L + p.w * L));
        el.setAttribute("cy", f1(p.y - p.rise * L));
        el.setAttribute("r", (1.9 - L * 1.1).toFixed(2));
        el.style.opacity = (a * .9).toFixed(3);
      });
      svg.querySelector(".mb-glow").style.opacity = ((.7 + .18 * Math.sin(TAU * phase * 3) + .07 * Math.sin(TAU * phase * 7)) * lit).toFixed(3);
    },
  };
})();
