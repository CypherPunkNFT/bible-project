// Direction D, "Who is like God?": the name is the centrepiece. The Hebrew מִיכָאֵל is read in its three parts with
// the lexicons' meaning; then the whole Bible as one luminous spine, its 1,189 chapters to scale, with a light where
// Michael is named and a ring where the same question is asked. Each light opens its scene.
(() => {
  // The lights: the five passages (two share Daniel 10) and the echoes of the question.
  const lights = () => [
    ...M.passages.map((p) => ({ id: p.id, kind: "pass", ref: p.key[0].ref, label: p.short, p })),
    ...M.echoes.map((e, i) => ({ id: `echo-${i}`, kind: "echo", ref: e.ref, label: refText(e.ref), e })),
  ];

  // The spine, horizontal on wide screens and vertical on phones; callouts fan out so close lights stay readable.
  function spineSvg(vertical) {
    const L = lights(), passes = L.filter((x) => x.kind === "pass"), echoes = L.filter((x) => x.kind === "echo");
    const len = vertical ? 900 : 1400, cross = vertical ? 400 : 330, pad = 30, axis = vertical ? 200 : 150;
    const at = (pos) => pad + pos * (len - pad * 2);
    const P = (a, c) => (vertical ? [c, a] : [a, c]);
    const books = M.books.map((b, i) => { const a = at(b.start / M.totalCh) + .8, z = at((b.start + b.ch) / M.totalCh) - .8; const [x1, y1] = P(a, axis), [x2, y2] = P(z, axis);
      return `<path class="n-book${i >= 39 ? " is-nt" : ""}" d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}"><title>${esc(b.name)}</title></path>`; }).join("");
    const lab = (pos, text, off) => { const [x, y] = P(at(pos), axis + off); return `<text class="n-tick" x="${x}" y="${y}" ${vertical ? 'dominant-baseline="middle"' : 'text-anchor="middle"'}>${text}</text>`; };
    const marks = [["GEN", "Genesis"], ["PSA", "Psalms"], ["DAN", "Daniel"], ["MAT", "Matthew"], ["REV", "Revelation"]].map(([c, n]) => lab(M.bookBy[c].start / M.totalCh, n, vertical ? 0 : 30)).join("");
    // Callouts: passes on one side, echoes on the other, spread evenly along their own band.
    const callouts = (items, side, from, to) => items.map((it, i) => {
      const pos = biblePos(it.ref), a0 = at(pos), a1 = lerp(at(from), at(to), items.length === 1 ? .5 : i / (items.length - 1));
      const c0 = axis, c1 = axis + side * (vertical ? 36 : (it.kind === "pass" ? 104 : 86));
      const [x0, y0] = P(a0, c0), [x1, y1] = P(a1, c1), [xm, ym] = P(a0, c0 + side * (vertical ? 14 : 34));
      return `<g class="n-light is-${it.kind}" data-light="${it.id}" tabindex="0" role="button" aria-label="${esc(it.label)}">
        <path class="n-lead" pathLength="1" d="M${x0.toFixed(1)} ${y0.toFixed(1)} L${xm.toFixed(1)} ${ym.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)}"/>
        <circle class="n-glow" cx="${x0.toFixed(1)}" cy="${y0.toFixed(1)}" r="${it.kind === "pass" ? 16 : 9}"/><circle class="n-dot" cx="${x0.toFixed(1)}" cy="${y0.toFixed(1)}" r="${it.kind === "pass" ? 5 : 3.5}"/>
        <g class="n-tag" transform="translate(${x1.toFixed(1)} ${y1.toFixed(1)})"><rect x="${vertical ? (side < 0 ? -156 : 0) : -78}" y="${vertical ? -17 : side < 0 ? -34 : 0}" width="156" height="34" rx="17"/>
          <text x="${vertical ? (side < 0 ? -78 : 78) : 0}" y="${vertical ? 1 : side < 0 ? -16 : 18}" text-anchor="middle" dominant-baseline="middle">${it.kind === "pass" ? `${it.p.n} · ` : ""}${esc(it.label)}</text></g></g>`;
    }).join("");
    const w = vertical ? cross : len, h = vertical ? len : cross;
    const passBand = vertical ? [.5, .98] : [.42, .98], echoBand = vertical ? [.04, .44] : [.04, .5];
    return `<svg class="n-spine-svg${vertical ? " is-vertical" : ""}" viewBox="0 0 ${w} ${h}" role="group" aria-label="The whole Bible as one line, with the places Michael is named">
      <defs><linearGradient id="n-flow" ${vertical ? 'x1="0" y1="0" x2="0" y2="1"' : ""}><stop offset="0" stop-color="var(--n-a)"/><stop offset="1" stop-color="var(--n-b)"/></linearGradient></defs>
      <g class="n-books">${books}</g><path class="n-sweep" pathLength="1" d="M${P(at(0), axis).join(" ")}L${P(at(1), axis).join(" ")}"/>
      ${marks}${callouts(passes, vertical ? 1 : -1, ...passBand)}${callouts(echoes, vertical ? -1 : 1, ...echoBand)}</svg>`;
  }

  function scene(it) {
    if (it.kind === "pass") {
      const p = it.p;
      return `<span class="kicker">${icon("star", 13)}Where the name is spoken · ${p.n} of 5</span><h3>${esc(p.short)} · ${esc(p.title)}</h3><p class="n-where">${esc(p.where)} · ${esc(p.when)}</p>
        <div class="n-scene-grid"><div>${passageBody(p)}</div><div>${passageSays(p)}</div></div>`;
    }
    const e = it.e, beast = e.ref[0] === "REV";
    return `<span class="kicker">${icon("help", 13)}The same question, asked elsewhere</span><h3>${esc(refText(e.ref))}</h3><p class="n-where">${esc(e.who)}</p>
      ${kjv(e, "", "[Ww]ho is (?:a God )?(?:a strong LORD )?like(?: unto)?|[Ww]ho among the sons of the mighty can be likened|can be compared")}
      <div class="n-note">${claim({ text: beast ? "Here the question is asked of the beast, not of God." : "The question is asked of God. The verse does not mention Michael.", layer: "text", refs: [e.ref] })}${beast ? claim(M.name.parody) : ""}</div>`;
  }

  function frame(root, p) {
    const spell = span(p, 0, .42), sweep = easeInOut(span(p, .42, 1));
    root.querySelectorAll(".n-part").forEach((el, i) => el.style.setProperty("--on", easeOut(span(spell, i / 3, (i + 1) / 3)).toFixed(3)));
    root.style.setProperty("--q", easeOut(span(spell, .85, 1)).toFixed(3));
    const svg = root.querySelector(".n-spine-svg");
    if (!svg) return;
    svg.style.setProperty("--sweep", sweep.toFixed(4));
    svg.querySelectorAll(".n-light").forEach((g) => { const it = lights().find((x) => x.id === g.dataset.light); g.classList.toggle("is-lit", sweep >= biblePos(it.ref) || p >= 1); });
  }

  function mount(main) {
    const parts = M.name.parts;
    main.innerHTML = `<section class="n-hero"><div class="wrap">${topline()}
        <div class="n-name"><span class="kicker">${icon("letter", 14)}The unseen · Angels · Michael the archangel</span>
          <div class="n-he he" lang="he" aria-label="${esc(M.name.hebrew)}">${parts.map((x, i) => `<span class="n-part" style="--i:${i}"><b>${esc(x.he)}</b><small dir="ltr"><i>${esc(x.tr)}</i>${esc(x.en)}</small></span>`).join("")}</div>
          <p class="n-rtl">${icon("arrowLeft", 14)}Hebrew reads right to left</p>
          <h1 class="n-q"><span>Who</span> <span>is like</span> <span>God?</span></h1>
          <p class="n-also"><span><em>Greek</em>${esc(M.name.greek)}</span><span><em>Latin, on his shield in art</em>${esc(M.name.latin)}</span><span><em>English</em>Michael</span></p>
          <p class="n-lex">The meaning as the lexicons give it: ${cites(["bdb", "strong", "thayer"])}</p></div></div></section>
      <div class="wrap">
        <section class="section n-spine-sec">${secHead("spine", "The whole Bible, one line", "Five lights", "Every book to scale, 1,189 chapters from Genesis to Revelation. Gold lights: where Michael is named. Rings: where the question in his name is asked of God, or of the beast. Choose any light.")}
          <div class="n-spine"></div><div class="n-scene glass" aria-live="polite"></div></section>
        <section class="section">${secHead("letter", "The name", "What the lexicons say", "A name is a word before it is a person. These dictionaries read it as a question.")}
          <div class="grid-2 n-lexicons">${M.name.meanings.map((m) => `<div class="n-entry">${claim(m)}</div>`).join("")}</div>
          <div class="n-outlier">${icon("help", 18)}${claim(M.name.outlier)}</div></section>
        <section class="section">${secHead("help", "Questions", "Where readers differ", "First, the question his name raises. Each view is shown with the people who hold it.")}<div>${questionRows(["name", "who", "captain", "persia", "jude"])}</div></section>
        <section class="section">${secHead("layers", "From the text", "What the five passages add up to")}<div class="grid-2"><div class="glass n-panel">${fromTextList()}</div><div class="glass n-panel"><h3 class="n-h3">${icon("x", 18)}What the text does not say</h3>${notSaidList()}</div></div></section>
        <section class="section">${secHead("river", "Context", "Around the five passages")}<div class="grid-3">${contextCards("n-ctx")}</div></section>
        <section class="section">${secHead("hourglass", "Tradition", "What was said later, with its date")}${tradRule()}<div class="grid-3 n-trad">${[M.name.shield && { id: "shield", stratum: "later", when: "in Christian art (as described in 1911)", title: "“Quis ut Deus” on his shield", text: M.name.shield.text, cites: M.name.shield.cites, layer: "tradition" }, ...M.tradition].filter(Boolean).map((t) => tradCard(t)).join("")}</div></section>
        <section class="section" id="sources">${secHead("library", "Sources", "Where every line comes from")}${sourcesBlock()}</section>
      </div>`;
    const root = main;
    let vertical = null, current = "dan-10-13";
    const draw = () => {
      const v = innerWidth < 760;
      if (v !== vertical) { vertical = v; root.querySelector(".n-spine").innerHTML = spineSvg(v); select(current, false); frame(root, Clock.progress); }
    };
    const select = (id, slide = true) => {
      current = id;
      const it = lights().find((x) => x.id === id);
      root.querySelectorAll(".n-light").forEach((g) => g.classList.toggle("is-on", g.dataset.light === id));
      const box = root.querySelector(".n-scene");
      box.innerHTML = `<div class="${slide ? "n-slide" : ""}">${scene(it)}</div>`;
    };
    draw();
    Clock.run({ label: "The name, then the whole Bible", duration: 10000, frame: (p) => frame(root, p), moving: (p) => (p < .42 ? ["the three parts of the name"] : ["the sweep from Genesis to Revelation"]) });
    const onClick = (e) => { const g = e.target.closest("[data-light]"); if (g) select(g.dataset.light); };
    const onKey = (e) => { const g = e.target.closest?.("[data-light]"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select(g.dataset.light); } };
    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKey);
    addEventListener("resize", draw);
    return () => removeEventListener("resize", draw);
  }

  DIRECTIONS.name = { name: "Who is like God?", swatch: "var(--accent)", mount };
})();
