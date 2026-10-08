// Direction A, "The veil": two realms on one screen. Below, the earthly story of Daniel 10 (three weeks of mourning,
// the great river); above, the unseen conflict, drawn only as a diagram of what the text says (who withstood whom,
// for how many days, who came to help). Scrolling lifts the veil between them; the ticker steps through it.
(() => {
  const DAYS = 21;
  const v = (n, c = 10) => M.dan10.find((x) => x.ref[1] === c && x.ref[2] === n);
  const STEP_TO = [.22, .4, .6, .78, 1];
  const PHASES = [
    { at: 0, label: "Daniel mourns three full weeks", refs: [[10, 2], [10, 3]] },
    { at: .25, label: "By the great river, he lifts up his eyes", refs: [[10, 4], [10, 5]] },
    { at: .44, label: "“From the first day … thy words were heard”", refs: [[10, 12]] },
    { at: .64, label: "Withstood twenty-one days; Michael came to help", refs: [[10, 13]] },
    { at: .82, label: "“None that holdeth with me … but Michael your prince”", refs: [[10, 20], [10, 21]] },
  ];
  const phaseAt = (p) => PHASES.reduce((k, ph, i) => (p >= ph.at ? i : k), 0);
  const cells = (cls) => `<div class="v-cells ${cls}">${Array.from({ length: DAYS }, (_, i) => `<i data-d="${i + 1}"></i>`).join("")}</div>`;

  const lane = (id, name, note, body, extra = "") => `<div class="v-lane" data-lane="${id}"><div class="v-who"><b>${name}</b><small>${note}</small></div><div class="v-track">${body}</div><div class="v-then">${extra}</div></div>`;

  // The earthly scene: the river Hiddekel, reeds, a far colonnade for Persia, a low sun. Line art only.
  const earthArt = () => {
    const rnd = seeded(7);
    const reeds = Array.from({ length: 26 }, (_, i) => { const x = 20 + i * 9 + rnd() * 6, h = 40 + rnd() * 50; return `<path d="M${x} 236 q ${rnd() * 8 - 4} ${-h / 2} ${rnd() * 14 - 7} ${-h}"/>`; }).join("");
    const cols = Array.from({ length: 7 }, (_, i) => { const x = 560 + i * 46; return `<path d="M${x - 3} 194V136M${x + 3} 194V136M${x - 8} 194h16M${x - 11} 136h22M${x - 11} 136c-5 0-7-7-2-9M${x + 11} 136c5 0 7-7 2-9M${x - 9} 127h18"/>`; }).join("");
    const waves = Array.from({ length: 5 }, (_, i) => { const y = 248 + i * 12; return `<path class="v-wave" style="--i:${i}" d="M-20 ${y} ${Array.from({ length: 16 }, (_, k) => `q 40 ${k % 2 ? 7 : -7} 80 0`).join(" ")}"/>`; }).join("");
    return `<svg class="v-earth-art" viewBox="0 0 1200 320" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <circle class="v-sun" cx="420" cy="120" r="22"/><path class="v-sun-rays" d="M420 86v-12M420 166v-12M386 120h-12M466 120h-12M396 96l-9-9M453 153l-9-9M396 144l-9 9M453 87l-9 9"/>
      <path class="v-hill" d="M0 210 C 160 180 300 192 430 204 S 700 186 820 198 S 1060 182 1200 196"/>
      <g class="v-cols">${cols}<path d="M540 196h330M542 120h326M548 113h314"/></g>
      <path class="v-bank" d="M0 236 C 240 228 520 240 760 232 S 1080 226 1200 232"/>
      <g class="v-reeds">${reeds}</g><g class="v-waves">${waves}</g>
      <text class="v-tag" x="300" y="222">the great river, Hiddekel · Daniel 10:4</text>
    </svg>`;
  };
  // A fine field of points and a measuring grid for the unseen half: a diagram, not a picture.
  const unseenArt = () => {
    const rnd = seeded(21);
    const dots = Array.from({ length: 90 }, () => `<circle cx="${(rnd() * 1200).toFixed(1)}" cy="${(rnd() * 400).toFixed(1)}" r="${(rnd() * 1.3 + .3).toFixed(2)}"/>`).join("");
    const grid = Array.from({ length: 13 }, (_, i) => `<path d="M${i * 100} 0V400"/>`).join("") + Array.from({ length: 5 }, (_, i) => `<path d="M0 ${i * 100}H1200"/>`).join("");
    return `<svg class="v-unseen-art" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="v-grid">${grid}</g><g class="v-dots">${dots}</g></svg>`;
  };

  const stage = () => `<section class="v-wrap" aria-label="Daniel 10 in two realms">
    <div class="v-stage">
      <div class="v-unseen">${unseenArt()}<svg class="v-link" aria-hidden="true"><path pathLength="1" d=""/><circle r="4"/></svg>
        <div class="v-realm-tag"><span>${icon("eye", 14)}The unseen</span><small>as far as Daniel 10 describes it</small></div>
        <div class="v-lanes">
          ${lane("speaker", "The speaker", "sent to Daniel · not named", cells("c-speaker"), `<span class="v-node n-return">return to fight<em>10:20</em></span>`)}
          ${lane("persia", "The prince of the kingdom of Persia", "not described", cells("c-persia") + `<span class="v-bar-label">withstood me one and twenty days · 10:13</span>`)}
          ${lane("michael", "Michael", "one of the chief princes", `<span class="v-node n-michael">${icon("star", 14)}came to help me<em>10:13</em></span>`, `<span class="v-node n-prince">your prince<em>10:21</em></span>`)}
          ${lane("grecia", "The prince of Grecia", "not described", `<span class="v-hatch">the text describes nothing here</span>`, `<span class="v-node n-grecia">shall come<em>10:20</em></span>`)}
        </div>
      </div>
      <div class="v-veil" aria-hidden="true"><div class="v-veil-cloth"></div><span class="v-veil-q">What does the text say of the unseen?</span><span class="v-veil-label">${icon("veil", 16)}Scroll to lift the veil</span></div>
      <div class="v-earth">${earthArt()}
        <div class="v-realm-tag is-earth"><span>${icon("river", 14)}On earth</span><small>the third year of Cyrus king of Persia · 10:1</small></div>
        <div class="v-lanes">${lane("daniel", "Daniel", "mourning · no pleasant bread", cells("c-daniel") + `<span class="v-weeks"><b>week 1</b><b>week 2</b><b>week 3</b></span>`, `<span class="v-node n-river">${icon("river", 14)}day 24, by the river<em>10:4</em></span>`)}</div>
      </div>
      <div class="v-caption glass"><span class="kicker" id="v-phase"></span><div id="v-verse"></div>
        <div class="v-steps">${PHASES.map((ph, i) => `<button type="button" data-vstep="${i}" aria-label="${esc(ph.label)}"><span></span></button>`).join("")}<button type="button" class="v-play" data-vplay>${icon("play", 13)}Play</button></div></div>
    </div></section>`;

  // The line from Michael to the speaker he came to help (Daniel 10:13), measured from the laid-out lanes.
  function drawLink(root, t) {
    const svg = root.querySelector(".v-link"), box = svg.getBoundingClientRect();
    const a = root.querySelector(".n-michael").getBoundingClientRect(), b = root.querySelector(".c-speaker i:last-child").getBoundingClientRect();
    const x1 = a.left + a.width / 2 - box.left, y1 = a.top - box.top, x2 = b.left + b.width / 2 - box.left, y2 = b.bottom - box.top;
    svg.firstElementChild.setAttribute("d", `M${x1.toFixed(1)} ${y1.toFixed(1)} C ${x1.toFixed(1)} ${(y1 - 30).toFixed(1)}, ${x2.toFixed(1)} ${(y2 + 30).toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    svg.style.setProperty("--t", t.toFixed(4));
    svg.lastElementChild.setAttribute("cx", x2.toFixed(1)); svg.lastElementChild.setAttribute("cy", y2.toFixed(1));
  }
  function frame(root, p) {
    const earthDays = Math.round(DAYS * span(p, .02, .24));
    const lift = easeInOut(span(p, .26, .46));
    const seenDays = DAYS * span(p, .46, .64);
    const michael = easeOut(span(p, .64, .76));
    const fin = easeOut(span(p, .84, .96));
    root.style.setProperty("--lift", lift.toFixed(4));
    root.style.setProperty("--michael", michael.toFixed(4));
    root.style.setProperty("--fin", fin.toFixed(4));
    root.querySelectorAll(".c-daniel i").forEach((c, i) => c.classList.toggle("on", i < earthDays));
    root.querySelectorAll(".c-speaker i, .c-persia i").forEach((c) => c.classList.toggle("on", Number(c.dataset.d) <= seenDays + .001));
    root.querySelector(".n-river").classList.toggle("on", p >= .25);
    drawLink(root, michael);
    const k = phaseAt(p), ph = PHASES[k];
    if (root.dataset.phase !== String(k)) {
      root.dataset.phase = String(k);
      root.querySelector("#v-phase").textContent = `${k + 1} of ${PHASES.length} · ${ph.label}`;
      root.querySelector("#v-verse").innerHTML = ph.refs.map(([c, n]) => { const x = v(n, c); return `<p><sup>${c}:${n}</sup>${esc(x.text).replace(/(Michael)/g, "<mark>$1</mark>")}</p>`; }).join("");
      root.querySelectorAll("[data-vstep]").forEach((b, i) => b.classList.toggle("is-on", i <= k));
    }
  }
  const moving = (p) => [p < .25 && "Daniel's days", p >= .26 && p < .46 && "the veil", p >= .46 && p < .64 && "the withstanding", p >= .64 && p < .76 && "Michael", p >= .84 && p < .96 && "Persia, Grecia, your prince"].filter(Boolean);

  const passages = () => M.passages.map((p) => `<article class="v-pass" data-id="${p.id}">
      <div class="v-pass-up"><span class="v-pass-n">${p.n}</span><span class="kicker">${icon("eye", 13)}What the text says</span><h3>${esc(p.title)}</h3>${passageSays(p)}</div>
      <div class="v-pass-hem" aria-hidden="true"></div>
      <div class="v-pass-down"><span class="kicker">${icon("river", 13)}${esc(p.where)}</span><small>${esc(p.when)}</small>${passageBody(p)}</div></article>`).join("");

  function mount(main) {
    main.innerHTML = `<div class="wrap">${topline()}
      <header class="v-hero"><div><span class="kicker">${icon("wing", 14)}The unseen · Angels</span><h1>Michael</h1><p class="v-sub">the archangel</p>
        <p class="v-lede">Daniel mourned three full weeks, then saw a man by the great river. Only then does the text lift the veil on the unseen: a prince of Persia who withstood for one and twenty days, and Michael, who came to help.</p></div>${heroFacts()}</header></div>
      ${stage()}
      <div class="wrap">
        <section class="section">${secHead("star", "Five times named", "Where Scripture names Michael", "Each passage in two parts: above, what the text says of the unseen; below, where it happens and the verses themselves.")}<div class="v-passes">${passages()}</div></section>
        <section class="section v-band">${secHead("layers", "From the text", "What the five passages add up to")}<div class="grid-2"><div class="glass v-panel">${fromTextList()}</div><div class="glass v-panel v-still"><h3>${icon("veil", 20)}Still veiled</h3><p>What the text leaves undescribed stays undescribed here.</p>${notSaidList()}</div></div></section>
        <section class="section">${secHead("river", "Context", "Daniel's vision, the princes, the title")}<div class="grid-3">${contextCards()}</div></section>
        <section class="section">${secHead("help", "Questions", "Where readers differ", "Each question starts with what the text says, then the views, each with the people who hold it.")}<div class="v-qs">${questionRows()}</div></section>
        <section class="section">${secHead("hourglass", "Tradition", "What was said later, with its date", "")}${tradRule()}<div class="grid-3 v-trad">${M.tradition.map((t) => tradCard(t)).join("")}</div></section>
        <section class="section" id="sources">${secHead("library", "Sources", "Where every line comes from")}${sourcesBlock()}</section>
      </div>`;
    const root = main.querySelector(".v-wrap");
    const job = { label: "The veil lifts: Daniel 10", duration: 14000, paused: true, frame: (p) => frame(root, p), moving };
    Clock.run(job);
    let raf = 0, lastSeek = -1;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = root.getBoundingClientRect(), range = r.height - innerHeight;
        if (range <= 0) return;
        const sp = clamp01(-r.top / range);
        if (Math.abs(sp - lastSeek) > .0005 && r.top < innerHeight && r.bottom > 0) { lastSeek = sp; Clock.seek(sp); }
      });
    };
    addEventListener("scroll", onScroll, { passive: true });
    const onClick = (e) => {
      const s = e.target.closest("[data-vstep]");
      if (s) { Clock.seek(STEP_TO[Number(s.dataset.vstep)]); return; }
      if (e.target.closest("[data-vplay]")) { if (Clock.progress >= 1) Clock.restart(); else Clock.play(); }
    };
    root.addEventListener("click", onClick);
    return () => { removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }

  DIRECTIONS.veil = { name: "The veil", swatch: "var(--unseen)", mount };
})();
