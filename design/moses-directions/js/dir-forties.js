// B · Three forties. A command-deck hero: a 120-year ring split into the three forties of Acts 7. Choose an act and its
// bento tiles (scenes, people, words, places) fill the screen and open in place.
(() => {
  const C = 260, R = 196;
  const pt = (y, r = R) => { const a = ((-90 + y * 3) * Math.PI) / 180; return [C + Math.cos(a) * r, C + Math.sin(a) * r]; };
  const arc = (y0, y1, r = R) => { const [x0, y0p] = pt(y0, r), [x1, y1p] = pt(y1, r); return `M${x0.toFixed(1)},${y0p.toFixed(1)}A${r},${r} 0 ${y1 - y0 > 60 ? 1 : 0} 1 ${x1.toFixed(1)},${y1p.toFixed(1)}`; };
  // Ages Scripture itself gives (Acts 7:23, Exodus 7:7, Deuteronomy 34:7), and the years of the forty it numbers.
  const STATED = [[40, "40 · Acts 7:23", "end"], [80, "80 · Exodus 7:7", "start"], [120, "120 · Deut 34:7", "end"]];
  const ACT = {
    1: { people: ["amram-exo-6-18", "jochebed-exo-6-20", "miriam-exo-15-20", "aaron-exo-4-14"], stops: [0, 0] },
    2: { people: ["zipporah-exo-2-21", "jethro-exo-2-18", "gershom-exo-2-22", "aaron-exo-4-14"], stops: [0, 3] },
    3: { people: ["pharaoh-exo-3-10", "aaron-exo-4-14", "miriam-exo-15-20", "joshua-exo-17-9", "korah-exo-6-21", "eldad-num-11-26", "jannes-2ti-3-8", "balak-num-22-2", "sihon-num-21-21", "og-num-21-33", "hur-num-31-8", "eliezer-exo-18-4"], stops: [3, 15] },
  };
  // Where each act's name sits: beside its arc, never across it or its dots.
  const LABEL_AT = { 1: () => { const [x, y] = pt(20, R + 52); return [x - 26, y]; }, 2: () => pt(60, R + 52), 3: () => { const [x, y] = pt(108.5, R + 40); return [x + 22, y - 2]; } };
  const LABEL_ANCHOR = { 1: "start", 2: "middle", 3: "end" };
  const ring = () => {
    const ticks = Array.from({ length: 25 }, (_, i) => i * 5).map((y) => { const [a, b] = [pt(y, R + 18), pt(y, R + (y % 10 ? 24 : 30))]; return `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" class="${y % 40 ? "" : "is-major"}"/>`; }).join("");
    const dots = M.forties.map((f) => { const list = M.scenes.filter((s) => s.act === f.act); return list.map((s, i) => { const [x, y] = pt(f.from + ((i + 1) * 40) / (list.length + 1)); return `<g class="tf-dot" data-scene="${s.id}" data-act="${f.act}" style="--tone:${ACT_TONE[f.act]}" tabindex="0" role="button" aria-label="${esc(s.title)}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7"/><title>${esc(s.title)}</title></g>`; }).join(""); }).join("");
    const stated = STATED.map(([y, label, anchor]) => { const [x, yy] = y === 120 ? [250, 132] : pt(y, R - 44); return `<text class="tf-stated" text-anchor="${anchor}" x="${x.toFixed(1)}" y="${yy.toFixed(1)}">${label}</text>`; }).join("");
    return `<svg class="tf-ring" viewBox="-74 -6 668 532" role="group" aria-label="Moses' 120 years in three forties">
      <defs><filter id="tf-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <circle class="tf-orbit" cx="${C}" cy="${C}" r="${R + 50}"/><circle class="tf-orbit" cx="${C}" cy="${C}" r="${R - 58}"/>
      <g class="tf-ticks">${ticks}</g><circle class="tf-track" cx="${C}" cy="${C}" r="${R}"/>
      ${M.forties.map((f) => `<path class="tf-arc" data-act="${f.act}" style="--tone:${ACT_TONE[f.act]}" d="${arc(f.from + .8, f.to - .8)}" pathLength="1" filter="url(#tf-glow)"/>
        <path class="tf-hit" data-act="${f.act}" d="${arc(f.from + .8, f.to - .8)}"><title>${esc(f.name)}, years ${f.from}–${f.to}</title></path>`).join("")}
      ${M.forties.map((f) => { const [x, y] = LABEL_AT[f.act](); return `<text class="tf-actlabel" data-act="${f.act}" style="--tone:${ACT_TONE[f.act]};text-anchor:${LABEL_ANCHOR[f.act]}" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${["I", "II", "III"][f.act - 1]} · ${esc(f.name)}</text>`; }).join("")}
      ${dots}${stated}
      <g class="tf-hand"><line x1="${C}" y1="${C - R + 62}" x2="${C}" y2="${C - R + 10}"/><circle cx="${C}" cy="${C - R}" r="5"/></g>
      <text class="tf-big" x="${C}" y="${C + 16}">120</text><text class="tf-sub" x="${C}" y="${C + 44}">years</text>
    </svg>`;
  };
  const sceneTile = (s, i) => `<article class="tf-tile tf-scene glass xp ${i === 0 ? "t-wide" : "t-mid"}" id="tf-${s.id}" style="--tone:${ACT_TONE[s.act]};--k:${i}">
      <div class="tf-art">${art(s.art)}</div>
      <div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon(SCENE_ICON[s.art] ?? "sparkle", 28, 1.4)}</span><div><span class="kicker">${esc(s.placeName)}</span><h3>${esc(s.title)}</h3></div></div>
        ${kjv(s.verse, "kjv-sm")}
        <button type="button" class="tf-open" data-xp aria-expanded="false" data-open="Close" data-closed="Open the scene"><span class="xp-label">Open the scene</span>${icon("expand", 14)}</button></div>
      <div class="xp-body"><div class="xp-inner tf-deep">${s.verse2 ? kjv(s.verse2, "kjv-sm") : ""}${sceneLines(s)}${[...s.more.map((c) => claim(c)), s.burial ? `<blockquote class="q"><p>${esc(s.burial.text)}</p><footer>${refLink(s.burial.span)} · KJV</footer></blockquote>` : "", ...(s.tradition ?? []).map((c) => claim(c))].join("")}</div></div></article>`;
  const peopleTile = (a) => {
    const all = peopleList(), list = ACT[a].people.map((id) => all.find((p) => p.id === id)).filter(Boolean);
    return `<article class="tf-tile tf-people glass t-mid" style="--tone:${ACT_TONE[a]};--k:8"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("users", 28, 1.4)}</span><div><span class="kicker">People in this act</span><h3>${list.length} people</h3></div></div>
      <div class="tf-chips">${list.map((p) => `<button type="button" class="tf-chip" data-pick="${p.id}"><span>${esc(p.name[0])}</span>${esc(p.name.replace(/, one of five kings of Midian/, "").replace(/ of the Exodus/, ""))}</button>`).join("")}</div>
      <div class="tf-pick">${personDetail(list[0])}</div></div></article>`;
  };
  const placesTile = (a) => {
    const [s0, s1] = ACT[a].stops, stops = M.map.route.slice(s0, s1 + 1).filter((s, i, all) => all.findIndex((x) => x.name === s.name) === i);
    return `<article class="tf-tile tf-places glass t-sm t-tall" style="--tone:${ACT_TONE[a]};--k:9"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("map", 28, 1.4)}</span><div><span class="kicker">Places</span><h3>${stops.length === 1 ? stops[0].name : `${stops[0].name} to ${stops[stops.length - 1].name}`}</h3></div></div>
      <ol class="tf-stops">${stops.map((s) => `<li><b>${esc(s.name)}</b><span>${refLink(s.verse.ref)}</span><small>${Math.round(s.confidence * 100)}%</small></li>`).join("")}</ol><p class="tf-note">Percent: how sure the Atlas is of the spot.</p></div>
      <div class="tf-minimap" data-act="${a}"></div></article>`;
  };
  const wordsTile = (a) => {
    const body = a === 1 ? M.leader.accession.slice(0, 1).map((c) => claim(c)).join("") : a === 2 ? callSteps().split("</article>").slice(0, 2).join("</article>") + "</article>" : M.word.words.map((w) => `<div class="word-to"><b>To ${esc(w.to)}</b>${quoteSpan(w.quote)}</div>`).join("");
    return `<article class="tf-tile tf-words glass ${a === 3 ? "t-mid" : "t-mid"}" style="--tone:${ACT_TONE[a]};--k:10"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon(a === 2 ? "flame" : "message", 28, 1.4)}</span><div><span class="kicker">${a === 2 ? "The call" : a === 1 ? "Refused" : "His words"}</span><h3>${a === 2 ? "Sent from the bush" : a === 1 ? "\"Who made thee a prince?\"" : "Words to people"}</h3></div></div>${body}</div></article>`;
  };
  const verseTile = (f) => `<article class="tf-tile tf-verse glass t-wide" style="--tone:${ACT_TONE[f.act]};--k:0"><div class="tf-tile-body"><span class="tf-roman">${["I", "II", "III"][f.act - 1]}</span>
      <div><span class="kicker">Act ${f.act} · years ${f.from}–${f.to} · ${esc(f.name)}</span><p class="tf-acts">${esc(f.verse.text)}</p><footer>${refLink(f.verse.ref)} · KJV · Stephen's telling of the life</footer></div></div></article>`;
  const bento = (a) => {
    const f = actOf(a), scenes = M.scenes.filter((s) => s.act === a);
    const extra = a === 3 ? `<article class="tf-tile tf-plagues glass t-full" style="--tone:var(--midian);--k:2"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("darkness", 28, 1.4)}</span><div><span class="kicker">Exodus 7–12</span><h3>The ten plagues</h3></div></div>${plaguesGrid()}</div></article>` : "";
    const [first, ...rest] = scenes;
    return verseTile(f) + placesTile(a) + sceneTile(first, 0) + extra + rest.map((s, i) => sceneTile(s, i + 1)).join("") + peopleTile(a) + (a === 1 ? "" : wordsTile(a));
  };

  // B's landing: the ring beside the three act cards and the Deuteronomy 34:7 line. H (the merged page) mounts it as is.
  const landing = () => { const p = M.person; return `
        <section class="tf-deck"><div class="wrap">${topline()}
          <div class="tf-hero">
            <div class="tf-copy"><span class="kicker">${esc(p.prophetTitle)}</span><h1>Moses</h1><p class="tf-lede">One life of 120 years, told by Stephen as three forties.</p>
              <div class="tf-acts-btns">${M.forties.map((f) => `<button type="button" class="tf-act-btn" data-act="${f.act}" style="--tone:${ACT_TONE[f.act]}"><span class="tf-n">${["I", "II", "III"][f.act - 1]}</span><span><b>${esc(f.name)}</b><small>Years ${f.from}–${f.to} · ${esc(refText(f.verse.ref))}</small></span>${icon("arrowRight", 16)}</button>`).join("")}</div>
              <p class="tf-end"><b>120</b> ${esc(M.end.text)} ${refLink(M.end.ref)}</p></div>
            <div class="tf-ring-wrap">${ring()}</div>
          </div></div></section>`; };
  // One frame of the ring: on the first sweep (full) the hand runs 0 to 120 and lights each forty, then rests on act
  // "to"; otherwise it turns to act "to". q is 0..1 over the ring's part of the motion.
  const ringFrame = (svg, q, { full, to }) => {
    const hand = svg.querySelector(".tf-hand"), big = svg.querySelector(".tf-big"), sub = svg.querySelector(".tf-sub"), f = actOf(to);
    const y = full ? 120 * easeInOut(q) : f.from + 40 * easeInOut(q);
    svg.querySelectorAll(".tf-arc").forEach((a) => a.style.setProperty("--p", full ? clamp01((y - (Number(a.dataset.act) - 1) * 40) / 40).toFixed(3) : "1"));
    svg.querySelectorAll(".tf-dot").forEach((d) => d.classList.toggle("is-lit", full ? (Number(d.dataset.act) - 1) * 40 + 20 <= y + 6 : true));
    hand.style.transform = `rotate(${(full ? y : f.from + 20 * easeInOut(q)) * 3}deg)`;
    big.textContent = full && q < 1 ? String(Math.round(y)) : `${f.from}–${f.to}`;
    sub.textContent = full && q < 1 ? "years" : f.name;
  };

  DIRECTIONS.forties = {
    name: "Three forties", swatch: "#22599f",
    ring, landing, ringFrame, // reused by H (the merged page)
    mount(main) {
      main.innerHTML = `${landing()}
        <section class="wrap tf-board"><div class="tf-board-head"><span class="kicker tf-board-k">Act I · Egypt</span><h2 class="tf-board-h">The scenes of this forty</h2><span class="tf-hint">Open any tile; it grows in place.</span></div>
          <div class="tf-bento"></div></section>
        <section class="wrap tf-board tf-across"><div class="tf-board-head"><span class="kicker" style="--tone:var(--accent)">Across all 120 years</span><h2>The man, the word, the questions</h2></div>
          <div class="tf-bento is-static">
            <article class="tf-tile glass t-full" style="--tone:var(--midian)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("users", 28, 1.4)}</span><div><span class="kicker">The people around him</span><h3>Family, companions and those against him</h3></div></div>${peopleNet()}</div></article>
            <article class="tf-tile glass t-mid" style="--tone:var(--accent)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("quote", 28, 1.4)}</span><div><span class="kicker">How Scripture remembers him</span><h3>${M.leader.scriptureSays.length} sayings</h3></div></div><div class="tf-scroll">${saysList()}</div></div></article>
            <article class="tf-tile glass t-mid" style="--tone:var(--wild)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("flame", 28, 1.4)}</span><div><span class="kicker">The word</span><h3>The call</h3></div></div><div class="tf-scroll">${callSteps()}</div></div></article>
            <article class="tf-tile glass t-full" style="--tone:var(--wild)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("sparkle", 28, 1.4)}</span><div><span class="kicker">Signs</span><h3>Six signs</h3></div></div><div class="signs">${signTiles()}</div></div></article>
            <article class="tf-tile glass t-full" style="--tone:var(--wild)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("arrowRight", 28, 1.4)}</span><div><span class="kicker">What came of the word</span><h3>Said, then reported</h3></div></div>${fulfilPairs()}<div class="tf-more">${wordMore()}</div></div></article>
            <article class="tf-tile glass t-wide" style="--tone:var(--prophets)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("help", 28, 1.4)}</span><div><span class="kicker">Open questions</span><h3>${M.questions.length} questions readers ask</h3></div></div>${questionList()}</div></article>
            <article class="tf-tile glass t-sm" style="--tone:var(--prophets)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("hourglass", 28, 1.4)}</span><div><span class="kicker">When?</span><h3>Dates</h3></div></div>${datesBlock()}</div></article>
            <article class="tf-tile glass t-mid" style="--tone:var(--accent)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("layers", 28, 1.4)}</span><div><span class="kicker">Two accounts</span><h3>Exodus beside Deuteronomy</h3></div></div>${twoAccounts()}</div></article>
            <article class="tf-tile glass t-mid" style="--tone:var(--accent)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("eye", 28, 1.4)}</span><div><span class="kicker">Not said</span><h3>What Scripture does not say</h3></div></div>${notSaid()}</div></article>
            <article class="tf-tile glass t-full" id="sources" style="--tone:var(--accent)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("library", 28, 1.4)}</span><div><span class="kicker">Sources</span><h3>Where every line comes from</h3></div></div>${sourcesBlock()}</div></article>
          </div></section>`;
      const svg = main.querySelector(".tf-ring"), board = main.querySelector(".tf-bento");
      let act = 0, mini = null;
      // The sweep: the hand runs 0→120 and lights each forty; on choosing an act, its tiles rise in turn.
      const sweep = (to) => {
        const tiles = [...board.querySelectorAll(".tf-tile")];
        tiles.forEach((t) => t.style.setProperty("--in", "0"));
        const full = act === 0;
        Clock.run({ label: full ? "The 120-year ring sweeps, then Act I's tiles rise" : `Act ${to}: the ring turns, tiles rise`, duration: full ? 3200 : 1700,
          frame: (q) => {
            ringFrame(svg, full ? span(q, 0, .62) : span(q, 0, .4), { full, to });
            const tq = full ? span(q, .55, 1) : span(q, .2, 1);
            tiles.forEach((t, i) => t.style.setProperty("--in", easeOut(span(tq * (tiles.length + 3), i * .7, i * .7 + 2.4)).toFixed(3)));
            mini?.setProgress(ACT[to].stops[0] + (ACT[to].stops[1] - ACT[to].stops[0]) * easeInOut(span(q, .4, 1)));
          },
          moving: (q) => [full && q < .62 && "ring hand and arcs", full && q < .62 && "year count", (!full || q > .55) && q < 1 && "tiles rising", q > .4 && q < 1 && "minimap route"].filter(Boolean) });
      };
      const choose = (a) => {
        if (a === act) return;
        const first = act === 0;
        main.querySelectorAll(".tf-act-btn").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.act) === a)));
        svg.dataset.act = String(a);
        const f = actOf(a);
        main.querySelector(".tf-board-k").textContent = `Act ${["I", "II", "III"][a - 1]} · ${f.name} · years ${f.from}–${f.to}`;
        main.querySelector(".tf-board").style.setProperty("--tone", ACT_TONE[a]);
        board.innerHTML = bento(a);
        mini?.destroy();
        const host = board.querySelector(".tf-minimap");
        mini = MosesMap(host, { mini: true });
        requestAnimationFrame(() => { const r = mini.size(); mini.setView(mini.fit(mini.viewFor(a), { x: 14, y: 14, w: r.width - 28, h: r.height - 28 })); });
        act = first ? 0 : a;
        sweep(a);
        act = a;
      };
      const onClick = (e) => {
        const b = e.target.closest("[data-act]");
        if (b && (b.classList.contains("tf-act-btn") || b.classList.contains("tf-hit") || b.classList.contains("tf-actlabel"))) { choose(Number(b.dataset.act)); if (b.classList.contains("tf-act-btn") && innerWidth < 900) main.querySelector(".tf-board").scrollIntoView({ behavior: "smooth" }); return; }
        const d = e.target.closest(".tf-dot");
        if (d) { choose(Number(d.dataset.act)); const tile = main.querySelector(`#tf-${d.dataset.scene}`); if (tile) { tile.classList.add("is-open"); tile.querySelector("[data-xp]")?.setAttribute("aria-expanded", "true"); setTimeout(() => tile.scrollIntoView({ behavior: "smooth", block: "center" }), 300); } return; }
        const pick = e.target.closest("[data-pick]");
        if (pick) { const tile = pick.closest(".tf-people"); tile.querySelectorAll("[data-pick]").forEach((x) => x.setAttribute("aria-pressed", String(x === pick))); tile.querySelector(".tf-pick").innerHTML = personDetail(peopleList().find((p) => p.id === pick.dataset.pick)); }
      };
      main.addEventListener("click", onClick);
      choose(1);
      return () => mini?.destroy();
    },
  };
})();
