// The landing: a night landscape holding every covenant at once, under one bow. Sky, hills, then the ground with the words.
// The drawing is fixed strings built here from numbers, never from data. Illustrative only.
Cov.drawLanding = () => {
  const { h, art, runs, plain, refLink, study } = Cov;
  const seeded = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const fixed = (n) => n.toFixed(1);
  const CX = 400, CY = 470; // the bow's centre, on the horizon

  function sky() {
    const random = seeded(4099);
    let dots = "", twinkles = "", crosses = "";
    for (let i = 0; i < 230; i++) {
      const x = random() * 780 - 10, y = random() * 330, r = 0.5 + random() * 1.1;
      if (Math.hypot(x - CX, y - CY) < 346) continue; // the sky is outside the bow
      if (i % 7 === 0) twinkles += `<circle style="animation-delay:-${fixed(random() * 8)}s" cx="${fixed(x)}" cy="${fixed(y)}" r="${fixed(r + 0.3)}"/>`;
      else dots += `<circle cx="${fixed(x)}" cy="${fixed(y)}" r="${fixed(r)}"/>`;
    }
    for (const [x, y, size] of [[190, 60, 15], [566, 42, 19], [664, 118, 12], [96, 190, 10], [400, 54, 11], [290, 126, 7], [512, 142, 7]]) {
      const w = size * 0.24;
      crosses += `<path d="M${x} ${y - size}L${x + w} ${y - w}L${x + size} ${y}L${x + w} ${y + w}L${x} ${y + size}L${x - w} ${y + w}L${x - size} ${y}L${x - w} ${y - w}Z"/>`;
    }
    return `<g class="cl-stars">${dots}</g><g class="cl-stars cl-twinkle">${twinkles}</g><g class="cl-gold cl-star">${crosses}</g>
      <g class="cl-moon"><path class="cl-wash-gold" d="M78 44a34 34 0 1 0 28 54 28 28 0 0 1-28-54Z"/><path class="cl-gold" d="M78 44a34 34 0 1 0 28 54 28 28 0 0 1-28-54Z"/></g>`;
  }

  function bow() {
    const arc = (r) => `M${CX - r} ${CY}A${r} ${r} 0 0 1 ${CX + r} ${CY}`;
    const colours = [["#7767a8", 289.6], ["#4b8ca6", 300.8], ["#86a356", 312], ["#d99a3a", 323.2], ["#c75f47", 334.4]];
    return `<path class="cl-ring" d="${arc(372)}"/>
      ${colours.map(([colour, r]) => `<path class="cl-band" stroke="${colour}" d="${arc(r)}"/>`).join("")}
      <path class="cl-gold cl-bold" d="${arc(340)}${arc(284)}"/>`;
  }

  const cloud = (x, y, s) => { const d = `M${x - 62 * s} ${y}c-14-${fixed(20 * s)} ${fixed(16 * s)}-${fixed(32 * s)} ${fixed(32 * s)}-${fixed(20 * s)}c${fixed(6 * s)}-${fixed(24 * s)} ${fixed(44 * s)}-${fixed(26 * s)} ${fixed(52 * s)}-${fixed(4 * s)}c${fixed(14 * s)}-${fixed(16 * s)} ${fixed(40 * s)}-${fixed(8 * s)} ${fixed(38 * s)} ${fixed(10 * s)}c${fixed(14 * s)}-${fixed(2 * s)} ${fixed(24 * s)} ${fixed(6 * s)} ${fixed(20 * s)} ${fixed(14 * s)}Z`; return `<path class="cl-cover" d="${d}"/><path d="${d}"/>`; };

  function sinai() {
    const ridge = [[196, 470], [250, 400], [278, 412], [322, 320], [346, 338], [400, 190], [446, 300], [470, 288], [506, 372], [526, 388], [560, 470]];
    const random = seeded(733);
    let hatch = "";
    for (let i = 0; i < ridge.length - 1; i++) {
      const [ax, ay] = ridge[i], [bx, by] = ridge[i + 1];
      for (let t = 0.05; t < 1; t += 0.11) {
        const x = ax + (bx - ax) * t, y = ay + (by - ay) * t, length = 16 + random() * 46;
        const lean = (x < CX ? -1 : 1) * (2 + random() * 10);
        if (y + length < 468) hatch += `M${fixed(x)} ${fixed(y + 4)}l${fixed(lean)} ${fixed(length)}`;
      }
    }
    const shape = `M${ridge.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
    const rays = Array.from({ length: 19 }, (_, i) => {
      const a = Math.PI * (0.04 + 0.92 * i / 18), from = 64, to = i % 2 ? 84 : 104;
      return `M${fixed(CX + from * Math.cos(a))} ${fixed(330 - from * Math.sin(a))}L${fixed(CX + to * Math.cos(a))} ${fixed(330 - to * Math.sin(a))}`;
    }).join("");
    const tablet = (x) => `M${x} 410V321a21 21 0 0 1 42 0V410Z`;
    const lines = [356, 402].map((x) => [335, 350, 365, 380, 395].map((y) => `M${x + 9} ${y}h24`).join("")).join("");
    return `<path class="cl-cover" d="${shape}"/><path d="${shape}"/><path class="cl-tick" d="${hatch}"/>
      ${cloud(392, 226, 1.25)}${cloud(446, 248, 0.75)}
      <path class="cl-gold cl-bold" d="M326 232l-10 20 10-3-13 26M482 262l9 17-9-2 11 23"/>
      <path class="cl-gold cl-ray" d="${rays}"/>
      <path class="cl-cover" d="${tablet(356)}${tablet(402)}"/><path class="cl-wash-gold" d="${tablet(356)}${tablet(402)}"/>
      <path class="cl-gold cl-bold" d="${tablet(356)}${tablet(402)}"/><path class="cl-gold" d="${lines}"/>`;
  }

  function city() {
    let wall = "M78 470V426";
    for (let x = 104; x < 216; x += 16) wall += `H${x + 8}v-7h8v7`;
    wall += "H242V470Z";
    const towers = "M78 470V396h6v6h7v-6h6v6h7v-6v74M216 470V396h6v6h7v-6h6v6h7v-6v74";
    return `<path class="cl-cover" d="${wall}${towers}"/><path d="${wall}"/><path d="${towers}"/>
      <path class="cl-wash-gold" d="M148 470v-24a12 12 0 0 1 24 0v24Z"/><path class="cl-gold" d="M148 470v-24a12 12 0 0 1 24 0v24ZM118 470v-14a6 6 0 0 1 12 0v14ZM190 470v-14a6 6 0 0 1 12 0v14Z"/>
      <path class="cl-wash-gold" d="M116 392v-40l22 20 22-34 22 34 22-20v40Z"/><path class="cl-gold cl-bold" d="M116 392v-40l22 20 22-34 22 34 22-20v40ZM116 402h88"/>
      <g class="cl-fruit"><circle cx="116" cy="350" r="3.500"/><circle cx="160" cy="336" r="4"/><circle cx="204" cy="350" r="3.500"/><circle cx="138" cy="384" r="2.500"/><circle cx="160" cy="384" r="2.500"/><circle cx="182" cy="384" r="2.500"/></g>`;
  }

  function cup() {
    const bowl = "M566 330h84c4 46-16 78-42 78s-46-32-42-78Z";
    const wine = "M570 360h76c-4 28-18 44-38 44s-34-16-38-44Z";
    const cluster = (x, y) => [[0, 0], [6, 0], [-6, 0], [3, 5], [-3, 5], [0, 10]].map(([a, b]) => `<circle cx="${x + a}" cy="${y + b}" r="2.400"/>`).join("");
    const leaf = (x, y, flip) => `<path transform="translate(${x} ${y}) scale(${flip} 1)" d="M0 0c7-10 17-10 21-4-2 9-13 12-21 4Z"/>`;
    return `<path class="cl-faint" d="M664 472c20-20 24-50 14-82"/>
      <g class="cl-faint">${leaf(676, 420, 1)}${leaf(680, 392, 1)}</g>
      <g class="cl-fruit">${cluster(672, 432)}</g>
      <path class="cl-cover" d="${bowl}"/><path class="cl-wash-gold" d="${bowl}"/><path class="cl-wine" d="${wine}"/><path class="cl-gold cl-bold" d="${bowl}"/>
      <path class="cl-gold cl-bold" d="M608 408v48M582 470c3-9 13-14 26-14s23 5 26 14Z"/><path class="cl-cover" d="M556 470h104l6 10H550Z"/><path d="M556 470h104l6 10H550Z"/>`;
  }

  function promiseGround() {
    const pairs = [[506, 24], [534, 34], [564, 46], [598, 60]].map(([y, gap]) => {
      const half = 14 + (y - 500) / 6, tall = half * 0.32;
      const piece = (x) => `<path class="cl-cover" d="M${fixed(x - half)} ${y}c${fixed(half * 0.5)}-${fixed(tall * 1.5)} ${fixed(half * 1.5)}-${fixed(tall * 1.5)} ${fixed(half * 2)} 0c-${fixed(half * 0.5)} ${fixed(tall * 1.3)}-${fixed(half * 1.5)} ${fixed(tall * 1.3)}-${fixed(half * 2)} 0Z"/><path d="M${fixed(x - half)} ${y}c${fixed(half * 0.5)}-${fixed(tall * 1.5)} ${fixed(half * 1.5)}-${fixed(tall * 1.5)} ${fixed(half * 2)} 0c-${fixed(half * 0.5)} ${fixed(tall * 1.3)}-${fixed(half * 1.5)} ${fixed(tall * 1.3)}-${fixed(half * 2)} 0Z"/>`;
      return piece(CX - gap - half) + piece(CX + gap + half);
    }).join("");
    return `<path class="cl-line-soft" d="M0 500c120-16 230-14 330-4M470 498c110-10 200-10 290 6M0 536c90-10 190-10 260-2M540 540c80-8 160-6 220 4"/>
      <path class="cl-gold cl-road" d="M400 414v196"/>
      ${pairs}
      <path class="cl-wash-gold" d="M386 530h28l-5 26h-18Z"/><path class="cl-gold cl-bold" d="M386 530h28l-5 26h-18ZM384 530h32"/>
      <path class="cl-gold cl-flame" d="M400 494c8 10 12 16 12 23a12 12 0 0 1-24 0c0-7 4-13 12-23Z"/>
      <path class="cl-faint" d="M404 490c-7-9 7-14 0-24M394 488c-5-7 5-11 0-18"/>`;
  }

  // Abram outside, looking up at what he has been told to count.
  const man = `<g transform="translate(58 -6)"><circle cx="500" cy="548" r="5"/><path d="M499 554c-8 4-11 18-13 44h26c-1-22-3-36-13-44ZM503 559l13-12"/><path class="cl-faint" d="M520 600l6-48"/></g>`;
  const ark = `<path class="cl-cover" d="M606 546h86l-13 17h-60Z"/><path d="M606 546h86l-13 17h-60ZM626 546v-12h46v12M649 534v-10"/><path class="cl-gold" d="M696 500c7-6 13-6 17-1 5-5 11-5 17 1-7-2-12 0-17 5-5-5-10-7-17-5Z"/>`;

  // The olive with one branch grafted in, grown from one seed, so it is the same on every load.
  function olive() {
    const random = seeded(1289);
    let limbs = "", leaves = "", fruit = "", grafted = "";
    const grow = (x, y, angle, length, depth, gold) => {
      const endX = x + Math.cos(angle) * length, endY = y + Math.sin(angle) * length;
      const bendX = (x + endX) / 2 + (random() - 0.5) * length * 0.25, bendY = (y + endY) / 2 + (random() - 0.5) * length * 0.25;
      const part = `M${fixed(x)} ${fixed(y)}Q${fixed(bendX)} ${fixed(bendY)} ${fixed(endX)} ${fixed(endY)}`;
      if (gold) grafted += part; else limbs += part;
      if (depth === 0) {
        const turn = random() * 180;
        leaves += `<ellipse cx="${fixed(endX)}" cy="${fixed(endY)}" rx="6" ry="2.200" transform="rotate(${fixed(turn)} ${fixed(endX)} ${fixed(endY)})"/>`;
        if (random() < 0.3) fruit += `<circle cx="${fixed(endX)}" cy="${fixed(endY)}" r="1.800"/>`;
        return;
      }
      const spread = 0.42 + random() * 0.3;
      const isGraftPoint = depth === 4 && angle < -1.9 && !graftDone;
      if (isGraftPoint) graftDone = true;
      grow(endX, endY, angle - spread, length * (0.68 + random() * 0.12), depth - 1, gold || isGraftPoint);
      grow(endX, endY, angle + spread, length * (0.68 + random() * 0.12), depth - 1, gold);
    };
    let graftDone = false;
    grow(116, 616, -Math.PI / 2, 44, 6, false);
    return `<path class="cl-trunk" d="${limbs}"/><path class="cl-trunk cl-bole" d="M116 616v-42"/><path class="cl-gold" d="${grafted}"/><g class="cl-leaf">${leaves}</g><g class="cl-fruit">${fruit}</g>
      <path class="cl-faint" d="M78 620c20-6 58-8 80 0"/>`;
  }

  const drawing = `<svg viewBox="0 0 760 630" aria-hidden="true">
    <defs><radialGradient id="cl-glow"><stop class="cl-glow-in" offset="0"/><stop class="cl-glow-out" offset="1"/></radialGradient></defs>
    ${sky()}<circle cx="${CX}" cy="340" r="240" fill="url(#cl-glow)" stroke="none"/>${bow()}
    ${cloud(82, 478, 1.25)}${cloud(716, 478, 1.15)}
    ${sinai()}${city()}${cup()}${promiseGround()}${man}${ark}${olive()}
  </svg>`;
  const hills = `<svg viewBox="0 0 1600 300" preserveAspectRatio="none" aria-hidden="true">
    <path class="cl-hill-far" d="M0 118C210 74 390 84 620 112S1040 146 1260 104 1500 76 1600 92V300H0Z"/>
    <path class="cl-hill-mid" d="M0 186C240 138 470 168 720 198S1210 208 1600 150V300H0Z"/>
    <path class="cl-hill-near" d="M0 262C330 232 620 250 900 266S1350 262 1600 236V300H0Z"/></svg>`;

  const motto = plain(study.motto).split(" / ");
  return h("header", { class: "cl-hero", id: "top" },
    h("div", { class: "cl-sky" },
      h("nav", { class: "cv-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=doctrine" }, "God & Christian Faith"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "cv-here", "aria-current": "page" }, study.title)),
      h("div", { class: "cl-title" },
        h("p", { class: "cv-concepts" }, plain(study.concepts)),
        h("h1", {}, "Covenants", h("em", {}, "and promises"))),
      art(drawing, "cl-art")),
    h("div", { class: "cl-far" }, art(hills, "cl-hills"), h("p", { class: "cl-motto" }, motto[0], h("span", {}, motto[1]))),
    h("div", { class: "cl-ground" },
      h("p", { class: "cl-lede" }, runs(study.lead)),
      h("figure", { class: "cl-opening" },
        h("blockquote", {}, study.opening.t),
        h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible"))));
};
