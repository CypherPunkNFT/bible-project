// Three more versions of the landing's drawing, each led by a different covenant, for the owner to compare on drawings.html.
// ?drawing=2, 3 or 4 on the study's page shows that version in place. Seeded, so they never change between visits.
(() => {
  const { seeded, fixed, cloud, list } = CovDrawings;
  const svg = (body) => `<svg viewBox="0 0 760 630" aria-hidden="true">${body}</svg>`;
  const star = (x, y, size) => { const w = size * 0.24; return `<path d="M${x} ${y - size}L${x + w} ${y - w}L${x + size} ${y}L${x + w} ${y + w}L${x} ${y + size}L${x - w} ${y + w}L${x - size} ${y}L${x - w} ${y - w}Z"/>`; };
  const polar = (cx, cy, r, a) => `${fixed(cx + r * Math.cos(a))} ${fixed(cy + r * Math.sin(a))}`;
  // Rays from a point: every fifth is long and strong. `from` and `to` are angles; canvas angles, so up is -PI/2.
  function rays(cx, cy, inner, outer, from, to, count, wider = 0) {
    let strong = "", fine = "";
    for (let i = 0; i <= count; i++) {
      const a = from + (to - from) * (i / count);
      const longest = outer * (1 + wider * Math.cos(a) ** 2);
      const reach = i % 5 === 0 ? longest : i % 5 === 2 ? inner + (longest - inner) * 0.62 : inner + (longest - inner) * 0.4;
      const part = `M${polar(cx, cy, inner, a)}L${polar(cx, cy, reach, a)}`;
      if (i % 5 === 0) strong += part; else fine += part;
    }
    return `<path class="cl-gold" d="${strong}"/><path class="cl-gold cl-ray" d="${fine}"/>`;
  }

  // The wheeling sky of Count the stars, shared with the versions in drawings-stars.js.
  function starSky() {
    const random = seeded(5003), cx = 380, cy = 236;
    let trails = "", gold = "", dots = "";
    for (let i = 0; i < 210; i++) {
      const r = 26 + random() * 400, start = random() * Math.PI * 2, span = 0.1 + random() * 0.55;
      const part = `M${polar(cx, cy, r, start)}A${fixed(r)} ${fixed(r)} 0 0 1 ${polar(cx, cy, r, start + span)}`;
      if (i % 6 === 0) gold += part; else trails += part;
    }
    for (let i = 0; i < 150; i++) dots += `<circle cx="${fixed(random() * 780 - 10)}" cy="${fixed(random() * 470)}" r="${fixed(0.5 + random())}"/>`;
    return `<defs><clipPath id="cl-above"><rect width="760" height="470"/></clipPath></defs>
      <g clip-path="url(#cl-above)"><path class="cl-trail" d="${trails}"/><path class="cl-gold cl-trail-gold" d="${gold}"/><g class="cl-stars">${dots}</g></g>
      <g class="cl-gold cl-star">${star(cx, cy, 24)}${star(196, 120, 14)}${star(586, 92, 17)}${star(650, 300, 11)}${star(108, 330, 11)}${star(470, 372, 9)}${star(286, 330, 8)}</g>`;
  }

  // 2. Count the stars: the sky wheels over Abram's tents, and the fire passes between the pieces.
  function stars() {
    const tent = (x, y, s) => `<path class="cl-cover" d="M${x - 40 * s} ${y}L${x} ${y - 34 * s}L${x + 40 * s} ${y}Z"/><path d="M${x - 40 * s} ${y}L${x} ${y - 34 * s}L${x + 40 * s} ${y}ZM${x} ${y - 34 * s}V${y}M${x - 8 * s} ${y}L${x} ${y - 20 * s}L${x + 8 * s} ${y}"/>`;
    const pieces = [[530, 16], [556, 24], [586, 34]].map(([y, half]) => [-1, 1].map((side) => {
      const x = 590 + side * (half + 18), tall = half * 0.5;
      return `<path d="M${x - half} ${y}q${half} -${fixed(tall * 1.6)} ${half * 2} 0q-${half} ${fixed(tall * 1.3)} -${half * 2} 0Z"/>`;
    }).join("")).join("");
    return svg(`${starSky()}
      <path class="cl-cover" d="M-40 470C120 444 260 462 380 474S640 456 800 470V640H-40Z"/>
      <path d="M-40 470C120 444 260 462 380 474S640 456 800 470"/>
      <path class="cl-line-soft" d="M-40 512C100 494 240 510 360 522M-40 566C90 552 200 562 300 576M620 500c60-8 120-6 180 4"/>
      ${tent(96, 484, 1)}${tent(186, 494, 1.25)}${tent(52, 516, 1.35)}
      <g transform="translate(336 506) scale(1.45)"><circle cx="0" cy="-34" r="4.500"/><path d="M-1-29c-7 3-9 15-11 34h22c-1-18-3-31-11-34ZM3-25l11-12"/><path class="cl-faint" d="M18 6l5-42"/></g>
      ${pieces}
      <path class="cl-gold cl-road" d="M590 500v112"/>
      <path class="cl-wash-gold" d="M578 546h24l-4 22h-16Z"/><path class="cl-gold cl-bold" d="M578 546h24l-4 22h-16ZM576 546h28"/>
      <path class="cl-gold cl-flame" d="M590 512c7 8 10 14 10 20a10 10 0 0 1-20 0c0-6 3-12 10-20Z"/>
      <path class="cl-faint" d="M594 506c-6-8 6-12 0-20M584 504c-4-6 4-10 0-16"/>`);
  }

  // 3. The mountain: Sinai fills the sky, the tablets lit in the cloud, the people camped below and the twelve pillars at its foot.
  function mountain() {
    const random = seeded(8123), peak = [380, 74];
    const left = [[34, 490], [96, 420], [130, 432], [190, 330], [220, 346], [270, 236], [296, 250], [340, 136]];
    const right = [[414, 150], [452, 232], [480, 222], [530, 322], [566, 310], [628, 416], [660, 408], [726, 490]];
    const ridge = [...left, peak, ...right];
    let hatch = "", deep = "";
    for (let i = 0; i < ridge.length - 1; i++) {
      const [ax, ay] = ridge[i], [bx, by] = ridge[i + 1];
      for (let t = 0.03; t < 1; t += 0.07) {
        const x = ax + (bx - ax) * t, y = ay + (by - ay) * t, length = 24 + random() * 110;
        const lean = (x - 380) * 0.12 + (random() - 0.5) * 8;
        hatch += `M${fixed(x)} ${fixed(y + 4)}l${fixed(lean)} ${fixed(Math.min(length, 486 - y))}`;
      }
    }
    for (const line of ["M380 74L352 180L392 260L346 360L398 486", "M190 330L232 406L206 486", "M530 322L492 402L536 486", "M270 236L298 340L268 486", "M452 232L440 340L474 486"]) deep += line;
    const shape = `M${ridge.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
    const tablet = (x) => `M${x} 306V222a26 26 0 0 1 52 0V306Z`;
    const carved = [324, 382].map((x) => [232, 250, 268, 286].map((y) => `M${x + 10} ${y}h32`).join("")).join("");
    const tent = (x, y, s) => `<path class="cl-cover" d="M${fixed(x - 13 * s)} ${y}L${x} ${fixed(y - 13 * s)}L${fixed(x + 13 * s)} ${y}Z"/><path d="M${fixed(x - 13 * s)} ${y}L${x} ${fixed(y - 13 * s)}L${fixed(x + 13 * s)} ${y}Z"/>`;
    let camp = "";
    [[522, 0.8, 34], [554, 1, 40], [590, 1.25, 48], [622, 1.5, 60]].forEach(([y, s, step]) => {
      for (let x = 20 + random() * step; x < 750; x += step) if (Math.abs(x - 380) > 120 - (y - 522) * 0.2) camp += tent(Math.round(x), y, s);
    });
    let pillars = "";
    for (let i = 0; i < 12; i++) { const x = (i < 6 ? 278 : 402) + (i % 6) * 13; pillars += `M${x} 508v-18h6v18`; }
    return svg(`<path class="cl-cover" d="${shape}"/><path class="cl-bold" d="${shape}"/>
      <path class="cl-tick" d="${hatch}"/><path class="cl-faint" d="${deep}"/>
      ${rays(380, 256, 76, 220, -Math.PI * 1.02, Math.PI * 0.02, 75)}
      ${cloud(280, 130, 1.5)}${cloud(486, 120, 1.7)}${cloud(380, 84, 1.25)}${cloud(164, 240, 1)}${cloud(610, 230, 1.05)}
      <path class="cl-gold cl-bold" d="M222 148l-16 34 15-5-20 42M560 142l14 30-14-4 18 40M116 256l-10 20 10-3-13 26M660 248l9 19-9-3 12 26"/>
      <path class="cl-cover" d="${tablet(324)}${tablet(382)}"/><path class="cl-wash-gold" d="${tablet(324)}${tablet(382)}"/>
      <path class="cl-gold cl-bold" d="${tablet(324)}${tablet(382)}"/><path class="cl-gold" d="${carved}"/>
      <path class="cl-cover" d="M272 486H488V512H272Z"/><path d="M-40 490H272M488 490H800"/><path class="cl-gold" d="${pillars}"/>
      <path class="cl-wash-gold" d="M360 512V494h40v18Z"/><path class="cl-gold cl-bold" d="M360 512V494h40v18ZM372 494c-4-7 4-11 0-18M388 494c-4-7 4-11 0-18"/>
      <path d="M272 512H488"/>${camp}`);
  }

  // 4. The cup: lifted over the table with the old city behind it, and the law written on the heart inside it.
  function cup() {
    const random = seeded(3307);
    const bowl = "M226 112H534C546 256 470 352 380 352S214 256 226 112Z";
    const wine = "M233 176H527C520 280 456 344 380 344S240 280 233 176Z";
    let wall = "";
    for (const [from, to] of [[-20, 256], [504, 780]]) {
      wall += `M${from} 492V456`;
      for (let x = from; x < to; x += 18) wall += `H${x + 9}v-7h9v7`;
      wall += `V492Z`;
    }
    const tower = (x, top, w) => `M${x} 456V${top}h${w / 5}v-8h${w / 5}v8h${w / 5}v-8h${w / 5}v8h${w / 5}V456`;
    const towers = tower(46, 396, 40) + tower(170, 416, 34) + tower(560, 412, 34) + tower(678, 386, 42);
    let windows = "";
    for (const [x, y] of [[60, 416], [183, 432], [573, 428], [693, 406]]) windows += `M${x} ${y + 16}v-10a5 5 0 0 1 10 0v10Z`;
    const vine = (side) => {
      const sx = (x) => 380 + side * x;
      let leaves = "", grapes = "";
      for (const [x, y] of [[130, 430], [196, 404], [262, 380], [318, 330], [352, 268]]) {
        leaves += `<path transform="translate(${sx(x)} ${y}) scale(${side} 1) rotate(${fixed(-40 + random() * 60)})" d="M0 0c10-14 26-14 32-5-3 13-19 17-32 5Z"/>`;
        for (const [a, b] of [[0, 0], [8, 0], [-8, 0], [4, 7], [-4, 7], [0, 14]]) grapes += `<circle cx="${sx(x + 4) + a}" cy="${y + 16 + b}" r="3"/>`;
      }
      return `<path d="M${sx(62)} 506C${sx(130)} 470 ${sx(120)} 430 ${sx(170)} 420S${sx(290)} 410 ${sx(310)} 350 ${sx(370)} 300 ${sx(360)} 232"/><g class="cl-leaf">${leaves}</g><g class="cl-fruit">${grapes}</g>`;
    };
    const lines = "M348 226h64M340 244h80M348 262h64M360 280h40";
    return svg(`${rays(380, 240, 186, 234, -Math.PI * 1.1, Math.PI * 0.1, 90, 0.5)}
      <path class="cl-cover" d="${wall}${towers}"/><path d="${wall}"/><path d="${towers}"/><path class="cl-gold" d="${windows}"/>
      <path d="M-40 492H800"/>${vine(-1)}${vine(1)}
      <path class="cl-cover" d="${bowl}"/><path class="cl-wine" d="${wine}"/><path class="cl-gold cl-bold" d="${bowl}M226 112c20 18 288 18 308 0"/>
      <path class="cl-heart" d="M380 318C318 270 304 228 330 208c20-14 40-6 50 12 10-18 30-26 50-12 26 20 12 62-50 110Z"/><path class="cl-gold" d="${lines}"/>
      <path class="cl-cover" d="M362 352h36v126h-36Z"/><path class="cl-gold cl-bold" d="M362 352V478M398 352V478M354 410h52M300 526c8-30 40-48 80-48s72 18 80 48Z"/>
      <path class="cl-cover" d="M92 526H668L690 560H70Z"/><path d="M92 526H668L690 560H70ZM70 560v14H690v-14M110 574l-14 56M650 574l14 56"/>
      <path class="cl-cover" d="M300 526c8-30 40-48 80-48s72 18 80 48Z"/><path class="cl-wash-gold" d="M300 526c8-30 40-48 80-48s72 18 80 48Z"/><path class="cl-gold cl-bold" d="M300 526c8-30 40-48 80-48s72 18 80 48Z"/>
      <path d="M150 526c0-22 24-34 48-34 8 0 14 8 10 16l-6 4 4 14ZM218 526l-6-14 6-4c-4-8 2-16 10-16 22 2 42 14 42 34Z"/><path class="cl-faint" d="M170 508l6-8M186 512l6-8M238 508l6-8M252 514l6-8"/>`);
  }

  list.push(stars(), mountain(), cup());
  CovDrawings.starSky = starSky;
})();
