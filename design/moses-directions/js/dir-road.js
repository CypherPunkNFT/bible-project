// A · The road. The map is the page: a full-width journey map stays in place while you scroll, the route draws itself
// act by act, and each scene rises over it as a glass panel. Then the people, the word, the questions and the sources.
DIRECTIONS.road = {
  name: "The road", swatch: "#b8862b",
  mount(main) {
    const p = M.person, ACT_NAMES = { 1: "Forty years in Egypt", 2: "Forty years in Midian", 3: "Forty years in the wilderness" };
    // Where each panel leaves the traveller on the road (stop index), and which act it belongs to.
    const STOP = { river: 0, prince: 0, stranger: 1, bush: 2, sent: 3, pharaoh: 4, sea: 7.55, rephidim: 10, sinai: 11, tabernacle: 11, forty: 13, nebo: 15 };
    const actCard = (f) => `<article class="rd-panel rd-act glass" data-stop="${f.act === 3 ? 3 : 0}" data-view="${f.act}" data-name="${f.act === 3 ? "Egypt" : f.act === 2 ? "Egypt, then Midian" : "Egypt"}" style="--tone:${ACT_TONE[f.act]}">
        <div class="rd-act-n">${["I", "II", "III"][f.act - 1]}</div><div><span class="kicker">Act ${f.act} · years ${f.from}–${f.to}</span><h2>${ACT_NAMES[f.act]}</h2>
        <p class="rd-act-verse">${esc(f.verse.text)}</p><footer>${refLink(f.verse.ref)} · KJV</footer></div></article>`;
    const scenePanel = (s) => `<article class="rd-panel rd-scene glass" id="scene-${s.id}" data-stop="${STOP[s.id]}" data-view="${s.act}" data-place="${s.place}" data-name="${esc(s.placeName)}" style="--tone:${ACT_TONE[s.act]}">
        <div class="rd-art">${art(s.art, "", "xMidYMid slice")}</div>
        <div class="rd-scene-body"><div class="rd-scene-top"><span class="badge">${icon(SCENE_ICON[s.art] ?? "sparkle", 30, 1.4)}</span><div><span class="kicker">${placeTag(s)}</span><h3>${esc(s.title)}</h3></div></div>
        ${kjv(s.verse)}${s.verse2 ? kjv(s.verse2) : ""}<div class="rd-lines">${sceneLines(s)}</div>${s.plagues ? `<h4 class="rd-sub">${icon("darkness", 16)}The ten plagues <small>Choose one to read its verse</small></h4>${plaguesGrid()}` : ""}${sceneMore(s)}</div></article>`;
    const panels = M.forties.map((f) => actCard(f) + M.scenes.filter((s) => s.act === f.act).map(scenePanel).join("")).join("");

    main.innerHTML = `
      <section class="wrap rd-hero">${topline()}
        <div class="rd-hero-grid">
          <div class="rd-hero-copy"><span class="kicker" style="--tone:var(--accent)">${esc(p.leaderTitle)}</span>
            <h1>Moses</h1><p class="rd-acts-line"><span style="--tone:var(--egypt)">Egypt</span><span style="--tone:var(--midian)">Midian</span><span style="--tone:var(--wild)">the wilderness</span></p>
            <p class="rd-lede">${esc(p.short)}</p>
            <div class="rd-meta"><span>${icon("users", 15)}Tribe of ${esc(p.tribe)}</span><span>${icon("hourglass", 15)}${esc(p.era)}</span><span>${icon("book", 15)}${p.verseCount} verses name him</span></div>
            <a class="rd-go" href="#rd-road" data-go>${icon("route", 18)}Follow the road<span>Egypt to Nebo, ${M.map.route.length} stops</span></a></div>
          <div class="rd-forties">${fortiesCards("glass")}<p class="rd-end">${esc(M.end.text)} <span>${refLink(M.end.ref)}</span></p></div>
        </div>
      </section>
      <section class="rd-road" id="rd-road">
        <div class="rd-stage"><div class="rd-map"></div>
          <div class="rd-hud glass" style="--tone:var(--egypt)"><span class="rd-hud-n">I</span><div><b class="rd-hud-t">Forty years in Egypt</b><small class="rd-hud-s">Stop 1 of ${M.map.route.length} · Egypt</small></div></div>
          <div class="rd-bar">${M.forties.map((f) => `<i data-act="${f.act}" style="--tone:${ACT_TONE[f.act]}"><b></b></i>`).join("")}</div>
          <div class="rd-mapfoot"><button type="button" class="rd-play glass" data-play>${icon("play", 15)}Play the whole road</button>
            <div class="mm-key glass"><span><i></i>The way between stops is reconstructed</span><span><i class="k-battle"></i>Battles</span><span>Places: the Atlas, with its confidence</span></div></div>
        </div>
        <div class="rd-scenes">${panels}<div class="rd-tail"></div></div>
      </section>
      <section class="wrap rd-sec" style="--tone:var(--accent)">
        <div class="sec-head"><span class="badge badge-lg">${icon("quote", 36, 1.3)}</span><div><span class="kicker">How Scripture remembers him</span><h2>A ruler, a deliverer, a prophet</h2></div></div>
        <div class="rd-says">${M.leader.scriptureSays.map((c) => `<div class="glass rd-say">${claim(c)}</div>`).join("")}</div>
      </section>
      <section class="wrap rd-sec" style="--tone:var(--midian)">
        <div class="sec-head"><span class="badge badge-lg">${icon("users", 36, 1.3)}</span><div><span class="kicker">The people around him</span><h2>Family, companions and those who withstood him</h2><p>Choose anyone to see what Scripture says of them beside Moses.</p></div></div>
        <div class="glass rd-pad">${peopleNet()}</div>
        <div class="rd-two">${expander(`<button type="button" class="xp-head" data-xp aria-expanded="false">${icon("crown", 18)}<span>The powers he faced</span><em>${M.leader.worldStage.length}</em>${icon("chevronDown", 16)}</button>`, worldStage(), { cls: "xp-row" })}</div>
      </section>
      <section class="wrap rd-sec" style="--tone:var(--wild)">
        <div class="sec-head"><span class="badge badge-lg">${icon("tablets", 36, 1.3)}</span><div><span class="kicker">The word</span><h2>Called, given signs, and what came of the word</h2><p>${esc(p.prophetTagline)}</p></div></div>
        <div class="rd-word">
          <div class="glass rd-pad"><h3 class="rd-h3">${icon("flame", 20)}The call</h3>${callSteps()}</div>
          <div class="glass rd-pad"><h3 class="rd-h3">${icon("sparkle", 20)}Signs</h3><div class="signs rd-signs">${signTiles()}</div></div>
        </div>
        <div class="glass rd-pad rd-fulfil"><h3 class="rd-h3">${icon("arrowRight", 20)}What came of the word</h3>${fulfilPairs()}</div>
        <div class="rd-more">${wordMore()}</div>
      </section>
      <section class="wrap rd-sec" style="--tone:var(--prophets)">
        <div class="sec-head"><span class="badge badge-lg">${icon("help", 36, 1.3)}</span><div><span class="kicker">Open questions</span><h2>What readers still ask</h2><p>Each view with who holds it. Scripture's own words are kept apart from scholars' readings.</p></div></div>
        <div class="glass rd-pad">${questionList()}</div>
        <div class="rd-qgrid"><div class="glass rd-pad"><h3 class="rd-h3">${icon("layers", 20)}Two accounts, side by side</h3>${twoAccounts()}</div>
          <div class="glass rd-pad"><h3 class="rd-h3">${icon("hourglass", 20)}When?</h3>${datesBlock()}</div></div>
        <div class="glass rd-pad"><h3 class="rd-h3">${icon("eye", 20)}What Scripture does not say</h3>${notSaid()}</div>
      </section>
      <section class="wrap rd-sec" id="sources" style="--tone:var(--accent)"><div class="sec-head"><span class="badge badge-lg">${icon("library", 36, 1.3)}</span><div><span class="kicker">Sources</span><h2>Where every line comes from</h2></div></div>
        <div class="glass rd-pad">${sourcesBlock()}</div></section>`;

    const map = MosesMap(main.querySelector(".rd-map"));
    const hud = main.querySelector(".rd-hud"), bar = main.querySelector(".rd-bar");
    // On wide screens the panels cover the left of the map, so the map looks a little to the right of its focus.
    const wide = () => innerWidth > 960;
    const look = (a) => {
      const r = map.size();
      return map.fit(map.viewFor(a), wide() ? { x: r.width * .47, y: r.height * .2, w: r.width * .45, h: r.height * .52 } : { x: 10, y: 58, w: r.width - 20, h: r.height - 58 - 46 });
    };
    let t = 0, view = look(1), active = null;
    map.setView(view); map.setProgress(0);
    main.querySelectorAll(".rd-scene .art").forEach((a) => a.style.setProperty("--draw", "0"));
    const show = (tt, vv) => { t = tt; view = vv; map.setProgress(t); map.setView(view); };
    const setHud = (panel) => {
      const a = Number(panel.dataset.view), f = actOf(a);
      hud.style.setProperty("--tone", ACT_TONE[a]);
      hud.querySelector(".rd-hud-n").textContent = ["I", "II", "III"][a - 1];
      hud.querySelector(".rd-hud-t").textContent = ACT_NAMES[a];
      hud.querySelector(".rd-hud-s").textContent = `Years ${f.from}–${f.to} · Stop ${Math.round(Number(panel.dataset.stop)) + 1} of ${M.map.route.length} · ${panel.dataset.name}`;
      bar.querySelectorAll("i").forEach((i) => i.classList.toggle("is-on", Number(i.dataset.act) <= a));
      bar.querySelectorAll("i").forEach((i) => i.classList.toggle("is-now", Number(i.dataset.act) === a));
      map.pulse(panel.dataset.place ?? null);
    };
    // The route draws from where it is to the panel's stop, on the clock (so the ticker can slow and step it).
    const travel = (panel) => {
      if (panel === active) return;
      active?.querySelector(".art")?.style.setProperty("--draw", "1");
      active = panel; setHud(panel);
      const t0 = t, t1 = Number(panel.dataset.stop), v0 = view.slice(), v1 = look(Number(panel.dataset.view)), drawing = panel.querySelector(".art");
      const fresh = drawing && parseFloat(drawing.style.getPropertyValue("--draw") || "1") < 1;
      const legs = Math.abs(t1 - t0), from = M.map.route[Math.round(t0)].name, to = M.map.route[Math.round(t1)].name;
      Clock.run({ label: `Route: ${from} → ${to}`, duration: 900 + Math.min(2600, legs * 420),
        frame: (q) => { show(t0 + (t1 - t0) * easeInOut(span(q, .15, 1)), map.lerpView(v0, v1, easeInOut(span(q, 0, .7)))); if (fresh) drawing.style.setProperty("--draw", span(q, 0, 1).toFixed(3)); },
        moving: (q) => [fresh && q < 1 && "scene drawing", q < .7 && "map zoom", q > .15 && q < 1 && t1 !== t0 && "route line drawing", q > .15 && q < 1 && t1 !== t0 && "traveller"].filter(Boolean) });
    };
    const io = new IntersectionObserver((entries) => {
      const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) travel(hit.target);
    }, { rootMargin: wide() ? "-48% 0px -48% 0px" : "-64% 0px -34% 0px" });
    main.querySelectorAll(".rd-panel").forEach((el) => io.observe(el));
    const onClick = (e) => {
      if (e.target.closest("[data-go]")) { e.preventDefault(); main.querySelector(".rd-road").scrollIntoView({ behavior: "smooth" }); }
      if (e.target.closest("[data-play]")) {
        active = null;
        const v0 = view.slice(), vAll = look(0), n = M.map.route.length - 1;
        Clock.run({ label: "The whole road, Egypt to Nebo", duration: 14000, frame: (q) => show(n * easeInOut(span(q, .08, 1)), map.lerpView(v0, vAll, easeInOut(span(q, 0, .08)))),
          moving: (q) => [q < .08 && "map zoom out", q >= .08 && q < 1 && "route line drawing", q >= .08 && q < 1 && `traveller near ${M.map.route[Math.round(n * easeInOut(span(q, .08, 1)))].name}`].filter(Boolean) });
      }
    };
    main.addEventListener("click", onClick);
    const onResize = () => { if (active) show(t, look(Number(active.dataset.view))); };
    addEventListener("resize", onResize);
    return () => { io.disconnect(); map.destroy(); removeEventListener("resize", onResize); };
  },
};
