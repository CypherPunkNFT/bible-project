// Direction B, "War in heaven": Revelation 12 as a night-sky chart in fine line. Every figure is drawn only as the
// text names it: a woman clothed with the sun (no body drawn), a dragon of seven heads, ten horns and seven crowns
// (a constellation, not a beast), Michael and his angels as points of light. Each verse lights the part it describes.
(() => {
  const W = 1600, H = 760, N = 12;
  const rnd = seeded(12);
  const STARS = Array.from({ length: 240 }, (_, i) => ({ x: rnd() * W, y: rnd() * 600 + 20, r: rnd() * 1.4 + .4, third: i % 3 === 0 }));
  const WOMAN = { x: 470, y: 300 }, WILD = { x: 250, y: 590 }, THRONE = { x: 800, y: 70 };
  // The dragon: a spine of stars, seven necks with heads, a crown on each head, ten horns shared among the heads.
  const SPINE = [[880, 470], [930, 430], [1000, 410], [1060, 430], [1120, 450], [1190, 430], [1240, 380], [1280, 320], [1320, 280]];
  const HEADS = Array.from({ length: 7 }, (_, i) => { const a = -2.3 + i * .32; return { x: 1320 + Math.cos(a) * 120, y: 280 + Math.sin(a) * 110, a, horns: [2, 1, 2, 1, 2, 1, 1][i] }; });
  const MICHAEL = { x: 720, y: 220 };
  const ANGELS = Array.from({ length: 11 }, (_, i) => ({ x: 640 + (i % 4) * 46 + (i > 7 ? 30 : 0) + rnd() * 18, y: 150 + Math.floor(i / 4) * 52 + rnd() * 18 }));
  const FOES = Array.from({ length: 10 }, (_, i) => ({ x: 1100 + (i % 4) * 52 + rnd() * 24, y: 150 + Math.floor(i / 4) * 64 + rnd() * 30 }));
  const FOCUS = [WOMAN, WOMAN, { x: 1180, y: 300 }, { x: 1000, y: 470 }, { x: 640, y: 190 }, { x: 330, y: 520 }, { x: 960, y: 240 }, { x: 1180, y: 300 }, { x: 1050, y: 560 }, { x: 800, y: 380 }, { x: 800, y: 380 }, { x: 800, y: 380 }];
  const SAYS = ["a woman clothed with the sun, the moon under her feet, a crown of twelve stars", "she cried, travailing in birth", "a great red dragon: seven heads, ten horns, seven crowns", "his tail drew the third part of the stars", "her child was caught up unto God, and to his throne", "the woman fled into the wilderness: 1,260 days", "war in heaven: Michael and his angels fought against the dragon", "the dragon prevailed not; their place was found no more", "cast out into the earth, and his angels with him", "a loud voice in heaven: the accuser is cast down", "they overcame him by the blood of the Lamb", "rejoice, ye heavens"];

  const crown = (x, y) => `<path class="w-crown" d="M${x - 7} ${y - 9}l2 -7 3 4 2 -6 2 6 3 -4 2 7z"/>`;
  const svg = () => {
    const grid = [180, 330, 480, 630].map((r) => `<circle cx="800" cy="980" r="${r + 420}"/>`).join("") + Array.from({ length: 9 }, (_, i) => `<path d="M800 980 L${-400 + i * 300} -200"/>`).join("");
    const stars = STARS.map((s, i) => `<circle class="w-star${s.third ? " is-third" : ""}" data-i="${i}" cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${s.r.toFixed(2)}"/>`).join("");
    const twelve = Array.from({ length: 12 }, (_, i) => { const a = Math.PI * (1.12 + i * .068); return `<circle class="w-twelve" cx="${(Math.cos(a) * 92).toFixed(1)}" cy="${(Math.sin(a) * 92).toFixed(1)}" r="3.2"/>`; }).join("");
    const rays = Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return `<path d="M${(Math.cos(a) * 52).toFixed(1)} ${(Math.sin(a) * 52).toFixed(1)}L${(Math.cos(a) * (i % 2 ? 64 : 74)).toFixed(1)} ${(Math.sin(a) * (i % 2 ? 64 : 74)).toFixed(1)}"/>`; }).join("");
    const spine = `M${SPINE.map((p) => p.join(" ")).join(" L")}`;
    const heads = HEADS.map((h) => {
      const horns = Array.from({ length: h.horns }, (_, k) => { const a = h.a + (k - (h.horns - 1) / 2) * .5; return `<path class="w-horn" d="M${h.x.toFixed(1)} ${h.y.toFixed(1)}l${(Math.cos(a) * 16).toFixed(1)} ${(Math.sin(a) * 16).toFixed(1)}"/>`; }).join("");
      return `<path class="w-neck" d="M1320 280 Q ${(1320 + Math.cos(h.a) * 60).toFixed(1)} ${(280 + Math.sin(h.a) * 40).toFixed(1)} ${h.x.toFixed(1)} ${h.y.toFixed(1)}"/>${horns}<circle class="w-head" cx="${h.x.toFixed(1)}" cy="${h.y.toFixed(1)}" r="4.5"/>${crown(h.x, h.y - 6)}`;
    }).join("");
    const pts = (arr, cls) => arr.map((p) => `<circle class="${cls}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3"/>`).join("");
    const links = ANGELS.slice(0, 6).map((a, i) => `<path class="w-clash" pathLength="1" d="M${a.x.toFixed(1)} ${a.y.toFixed(1)} L${FOES[i].x.toFixed(1)} ${FOES[i].y.toFixed(1)}"/>`).join("");
    return `<svg class="w-sky" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Revelation 12 drawn as a chart of the sky">
      <defs><radialGradient id="w-glow"><stop offset="0" stop-color="var(--w-gold)" stop-opacity=".55"/><stop offset="1" stop-color="var(--w-gold)" stop-opacity="0"/></radialGradient>
</defs>
      <g class="w-grid">${grid}</g>
      <g class="w-stars">${stars}</g>
      <g class="w-throne" transform="translate(${THRONE.x} ${THRONE.y})"><circle r="60" fill="url(#w-glow)"/><circle r="15"/><circle r="26" class="w-ring"/><text y="48" text-anchor="middle">God, and his throne · 12:5</text></g>
      <path class="w-child-path" pathLength="1" d="M${WOMAN.x} ${WOMAN.y - 20} C ${WOMAN.x + 40} 200, ${THRONE.x - 120} 120, ${THRONE.x} ${THRONE.y + 16}"/>
      <circle class="w-child" r="5"/>
      <g class="w-wild" transform="translate(${WILD.x} ${WILD.y})"><path d="M-170 10 C -150 -60 -40 -80 40 -60 S 170 -10 160 30 S 30 80 -60 70 S -180 60 -170 10Z"/><text y="98" text-anchor="middle">the wilderness · a place prepared of God · 12:6</text></g>
      <g class="w-woman"><circle r="60" fill="url(#w-glow)"/><g class="w-rays">${rays}</g><circle class="w-sun" r="44"/><circle class="w-sun-in" r="30"/>
        <path class="w-moon" d="M-34 70 A 40 40 0 0 0 34 70 A 32 32 0 0 1 -34 70Z"/><g>${twelve}</g><text y="122" text-anchor="middle">a woman clothed with the sun · 12:1</text></g>
      <g class="w-dragon-all">
        <ellipse class="w-place" cx="1200" cy="330" rx="260" ry="200" pathLength="1"/>
        <g class="w-dragon"><path class="w-spine" pathLength="1" d="${spine}"/>${SPINE.map(([x, y]) => `<circle class="w-node" cx="${x}" cy="${y}" r="3.2"/>`).join("")}<g class="w-heads">${heads}</g>
          <text class="w-dlabel" x="1180" y="520" text-anchor="middle">a great red dragon · seven heads, ten horns, seven crowns · 12:3</text>
          <text class="w-dname" x="1180" y="545" text-anchor="middle">“that old serpent, called the Devil, and Satan” · 12:9</text></g>
        <g class="w-foes">${pts(FOES, "w-foe")}</g>
      </g>
      <g class="w-host"><circle class="w-mglow" cx="${MICHAEL.x}" cy="${MICHAEL.y}" r="46" fill="url(#w-glow)"/>${pts(ANGELS, "w-angel")}<circle class="w-michael" cx="${MICHAEL.x}" cy="${MICHAEL.y}" r="7"/>
        <text x="${MICHAEL.x}" y="${MICHAEL.y - 24}" text-anchor="middle">Michael and his angels · 12:7</text></g>
      <g class="w-clashes">${links}</g>
      <path class="w-earth" d="M-200 690Q800 630 1800 690"/><text class="w-earth-l" x="1500" y="712" text-anchor="end">the earth</text>
    </svg>`;
  };

  // Where each part is at progress p (0..1): verse k runs from k/12 to (k+1)/12.
  function frame(el, p, mobile) {
    const at = (k) => span(p, k / N, (k + 1) / N); // 0..1 within verse k+1
    const done = (k) => (p >= (k + 1) / N ? 1 : at(k));
    const v = Math.min(N - 1, Math.floor(p * N));
    el.style.setProperty("--w1", done(0).toFixed(3)); // woman
    el.style.setProperty("--w3", done(2).toFixed(3)); // dragon appears
    el.style.setProperty("--w7", easeOut(done(6)).toFixed(3)); // war
    el.style.setProperty("--w8", easeOut(done(7)).toFixed(3)); // place no more
    el.style.setProperty("--w10", done(9).toFixed(3));
    const fall = easeInOut(done(8));
    el.querySelector(".w-dragon-all").setAttribute("transform", `translate(0 ${(fall * 330).toFixed(1)})`);
    // 12:4 the tail draws a third of the stars toward the earth.
    const tail = easeInOut(done(3));
    el.querySelectorAll(".w-star.is-third").forEach((c) => { const s = STARS[c.dataset.i]; c.setAttribute("cy", (s.y + (690 - s.y) * tail * (.75 + (s.x % 50) / 200)).toFixed(1)); });
    // 12:5 the child is caught up; 12:6 the woman flees.
    const path = el.querySelector(".w-child-path"), up = easeInOut(done(4));
    path.style.strokeDashoffset = String(1 - up);
    const len = path.getTotalLength(), pt = path.getPointAtLength(len * up);
    const child = el.querySelector(".w-child");
    child.setAttribute("cx", pt.x.toFixed(1)); child.setAttribute("cy", pt.y.toFixed(1)); child.style.opacity = p >= 1 / N ? String(1 - done(5) * .3) : "0";
    const flee = easeInOut(done(5));
    el.querySelector(".w-woman").setAttribute("transform", `translate(${lerp(WOMAN.x, WILD.x, flee).toFixed(1)} ${lerp(WOMAN.y, WILD.y - 70, flee).toFixed(1)}) scale(${lerp(1, .62, flee).toFixed(3)})`);
    // The camera: on a phone the view follows the part each verse describes.
    const box = el.querySelector(".w-sky");
    if (mobile) {
      const a = FOCUS[v], b = FOCUS[Math.min(N - 1, v + 1)], t = easeInOut(span(at(v), .7, 1)), w = 560, h = w * (box.clientHeight / Math.max(1, box.clientWidth));
      const cx = lerp(a.x, b.x, t), cy = lerp(a.y, b.y, t);
      box.setAttribute("viewBox", `${Math.max(0, Math.min(W - w, cx - w / 2)).toFixed(1)} ${Math.max(0, Math.min(H - h, cy - h / 2)).toFixed(1)} ${w} ${h.toFixed(1)}`);
      box.setAttribute("preserveAspectRatio", "xMidYMid slice");
    } else { box.setAttribute("viewBox", `0 0 ${W} ${H}`); box.setAttribute("preserveAspectRatio", "xMidYMid meet"); }
    el.dataset.v = String(v);
    if (el.dataset.shown !== String(v)) {
      el.dataset.shown = String(v);
      const x = M.rev12[v];
      el.querySelector(".w-cap-verse").innerHTML = `<span class="kicker">Revelation 12:${v + 1} · ${esc(SAYS[v])}</span><p>${esc(x.text).replace(/(Michael)/g, "<mark>$1</mark>")}</p><a class="read" href="${refHref(x.ref)}">${icon("open", 14)}Read Revelation 12</a>`;
      el.querySelectorAll("[data-wv]").forEach((b, i) => { b.classList.toggle("is-on", i === v); b.classList.toggle("is-past", i < v); });
    }
  }

  const passGlyph = (n) => {
    const g = {
      1: '<circle cx="18" cy="40" r="4" class="g-a"/><circle cx="62" cy="40" r="4" class="g-b"/><circle cx="62" cy="14" r="5" class="g-m"/><path d="M62 19V35M22 40H58"/>',
      2: '<circle cx="24" cy="40" r="4" class="g-a"/><circle cx="56" cy="40" r="5" class="g-m"/><path d="M28 40H51" stroke-dasharray="2 4"/><path d="M40 12v10M35 17h10"/>',
      3: '<circle cx="40" cy="12" r="5" class="g-m"/><path d="M40 18v10"/>' + Array.from({ length: 9 }, (_, i) => `<circle cx="${12 + i * 7}" cy="${40 + (i % 2) * 6}" r="1.8"/>`).join(""),
      4: '<circle cx="18" cy="28" r="5" class="g-m"/><circle cx="62" cy="28" r="4" class="g-b"/><path d="M24 28H56"/><path d="M34 46h12" />',
      5: Array.from({ length: 6 }, (_, i) => `<circle cx="${14 + (i % 3) * 9}" cy="${18 + Math.floor(i / 3) * 16}" r="${i ? 2.4 : 4.5}" class="${i ? "" : "g-m"}"/>`).join("") + Array.from({ length: 6 }, (_, i) => `<circle cx="${50 + (i % 3) * 9}" cy="${18 + Math.floor(i / 3) * 16}" r="2.4" class="g-b"/>`).join("") + '<path d="M36 26h10M36 34h10"/>',
    }[n];
    return `<svg class="w-glyph" viewBox="0 0 80 56" aria-hidden="true">${g}</svg>`;
  };
  const passages = () => M.passages.map((p, i) => `<article class="w-pass ${i === 4 ? "is-wide" : ""}">${passGlyph(p.n)}
      <span class="w-pass-ref">${esc(p.short)}</span><h3>${esc(p.title)}</h3><p class="w-where">${esc(p.where)} · ${esc(p.when)}</p>
      ${passageSays(p)}${expander(null, passageBody(p), { closed: "The verses", opened: "Hide the verses" })}</article>`).join("");

  function mount(main) {
    main.innerHTML = `<section class="w-hero" aria-label="War in heaven, Revelation 12">
        <div class="w-frame">${svg()}
          <div class="w-title wrap"><span class="kicker">${icon("star", 14)}The unseen · Angels</span><h1>Michael</h1><p>the archangel · “there was war in heaven”</p></div>
        </div>
        <div class="w-cap glass"><div class="w-cap-verse"></div></div>
        <nav class="w-rail wrap" aria-label="Verses of Revelation 12">${Array.from({ length: N }, (_, i) => `<button type="button" data-wv="${i}"><b>${i + 1}</b><span>${esc(SAYS[i].split(":")[0].split(",")[0])}</span></button>`).join("")}
          <button type="button" class="w-play" data-wplay>${icon("play", 13)}Play</button></nav>
        <p class="w-note wrap">${icon("eye", 14)}Drawn only as the text names things: no bodies, no faces. The dragon is drawn as a figure of stars because the text calls it “another wonder in heaven” (12:3).</p>
      </section>
      <div class="wrap">${topline()}
        <section class="section">${secHead("star", "Five times named", "Michael in Scripture", "Revelation 12 is the last of five passages. Each card opens to its verses.")}<div class="w-passes">${passages()}</div></section>
        <section class="section">${secHead("layers", "From the text", "What the five passages add up to")}<div class="grid-2"><div class="glass w-panel">${fromTextList()}</div><div class="glass w-panel"><h3 class="w-h3">${icon("eye", 18)}What the text does not say</h3>${notSaidList()}</div></div></section>
        <section class="section">${secHead("river", "Context", "Before Revelation 12")}<div class="grid-3">${contextCards("w-ctx")}</div></section>
        <section class="section">${secHead("help", "Questions", "Where readers differ")}<div>${questionRows(["who", "captain", "jude", "persia", "name"])}</div></section>
        <section class="section">${secHead("hourglass", "Tradition", "A catalogue of later sayings", "Listed by date. Each entry names its source.")}${tradRule()}
          <ol class="w-cat">${[...M.tradition].sort((a, b) => a.sort - b.sort).map((t) => `<li>${tradCard(t, "w-trad")}</li>`).join("")}</ol></section>
        <section class="section" id="sources">${secHead("library", "Sources", "Where every line comes from")}${sourcesBlock()}</section>
      </div>`;
    const el = main.querySelector(".w-hero");
    const mobile = () => innerWidth < 760;
    const job = { label: "War in heaven: Revelation 12:1–12", duration: 24000, poster: 7 / 12 - .002, frame: (p) => frame(el, p, mobile()), moving: (p) => [SAYS[Math.min(N - 1, Math.floor(p * N))]] };
    Clock.run(job);
    const onClick = (e) => {
      const b = e.target.closest("[data-wv]");
      if (b) { Clock.seek((Number(b.dataset.wv) + 1) / N - .001); return; }
      if (e.target.closest("[data-wplay]")) { if (Clock.progress >= 1) Clock.restart(); else Clock.play(); }
    };
    el.addEventListener("click", onClick);
    const onResize = () => frame(el, Clock.progress, mobile());
    addEventListener("resize", onResize);
    return () => removeEventListener("resize", onResize);
  }

  DIRECTIONS.war = { name: "War in heaven", swatch: "var(--revelation)", mount };
})();
