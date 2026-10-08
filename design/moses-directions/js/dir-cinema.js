// C · Cinema. Full-screen chapters, each with a large line drawing; scenes slide sideways within a chapter; the full
// sourced text waits in a drawer that slides up from the bottom.
(() => {
  const ROMAN = ["", "I", "II", "III"];
  const NAMES = { 1: "Forty years in Egypt", 2: "Forty years in Midian", 3: "Forty years in the wilderness" };
  const drawerFor = {}; // slide id -> drawer html
  const sceneSlide = (s) => {
    drawerFor[s.id] = `<span class="kicker">${esc(s.placeName)} · ${esc(refText(s.verse.ref))}</span><h3>${esc(s.title)}</h3>${s.verse2 ? kjv(s.verse2) : ""}${sceneLines(s)}${s.more.map((c) => claim(c)).join("")}${s.burial ? `<blockquote class="q"><p>${esc(s.burial.text)}</p><footer>${refLink(s.burial.span)} · KJV</footer></blockquote>` : ""}${(s.tradition ?? []).map((c) => claim(c)).join("")}`;
    return `<div class="cn-slide" data-id="${s.id}" style="--tone:${ACT_TONE[s.act]}">
      <div class="cn-text"><span class="kicker">${placeTag(s)}</span><h3 class="cn-title">${esc(s.title)}</h3>
        <blockquote class="cn-verse"><p>${esc(s.verse.text)}</p><footer>${esc(refText(s.verse.ref))} · KJV</footer></blockquote>
        ${s.plagues ? `<div class="cn-plagues" role="group" aria-label="The ten plagues">${M.plagues.map((pl) => `<button type="button" data-plague="${pl.n}" title="${pl.n}. ${esc(pl.word)}">${glyph(pl.word, 26)}<span>${esc(pl.word)}</span></button>`).join("")}</div>` : ""}
        <div class="cn-actions"><button type="button" class="cn-drawer-btn" data-drawer="${s.id}">${icon("layers", 16)}The full detail<small>${s.more.length + s.lines.length} sourced notes</small></button>
          <a class="read" href="${refHref(s.verse.ref)}">${icon("open", 14)}Read the passage</a></div></div>
      <div class="cn-art">${art(s.art)}</div></div>`;
  };
  const titleSlide = (f) => `<div class="cn-slide cn-slide-title" data-id="act-${f.act}" style="--tone:${ACT_TONE[f.act]}">
      <div class="cn-text"><span class="cn-roman">${ROMAN[f.act]}</span><span class="kicker">Years ${f.from}–${f.to}</span><h2 class="cn-title cn-title-xl">${NAMES[f.act]}</h2>
        <blockquote class="cn-verse"><p>${esc(f.verse.text)}</p><footer>${esc(refText(f.verse.ref))} · KJV · Stephen's telling</footer></blockquote></div>
      <div class="cn-mapcard glass"><div class="cn-mapcard-top"><span class="kicker">The road in this act</span><b>${esc(M.map.route.filter((s) => s.act === f.act).map((s) => s.name).filter((n, i, all) => all.indexOf(n) === i).slice(0, 6).join(" · "))}${f.act === 3 ? " …" : ""}</b></div><div class="cn-map" data-act="${f.act}"></div></div></div>`;
  const chapter = (id, tone, label, slides, bg = "") => `<section class="cn-chapter" id="cn-${id}" data-chapter="${id}" style="--tone:${tone}" aria-label="${esc(label)}">
      <div class="cn-bgnum" aria-hidden="true">${bg}</div>
      <div class="cn-viewport"><div class="cn-track" style="--x:0">${slides.join("")}</div></div>
      ${slides.length > 1 ? `<div class="cn-nav"><button type="button" class="cn-arrow" data-step="-1" aria-label="Previous scene">${icon("arrowLeft", 18)}</button>
        <div class="cn-dots">${slides.map((_, i) => `<button type="button" data-go="${i}" aria-label="Scene ${i + 1}" ${i === 0 ? 'aria-current="true"' : ""}></button>`).join("")}</div>
        <span class="cn-count"><b>1</b> / ${slides.length}</span><button type="button" class="cn-arrow" data-step="1" aria-label="Next scene">${icon("arrowRight", 18)}</button></div>` : ""}</section>`;

  DIRECTIONS.cinema = {
    name: "Cinema", swatch: "#b0472c",
    mount(main) {
      const p = M.person;
      const prologue = `<div class="cn-slide cn-prologue" data-id="prologue" style="--tone:var(--accent)">
        <div class="cn-text">${topline()}<span class="kicker">${esc(p.leaderTitle)}</span><h1 class="cn-name">Moses</h1>
          <p class="cn-tag">${esc(p.short)}</p>
          <div class="cn-forties">${M.forties.map((f) => `<a href="#cn-${f.id}" data-jump="${f.id}" style="--tone:${ACT_TONE[f.act]}"><b>${ROMAN[f.act]}</b><span>${esc(f.name)}</span><small>${f.from}–${f.to}</small></a>`).join("")}</div>
          <p class="cn-end">${esc(M.end.text)} <span>${esc(refText(M.end.ref))}</span></p></div>
        <div class="cn-art">${art("bush")}</div></div>`;
      const wordSlides = [
        `<div class="cn-slide cn-panel-slide" data-id="call" style="--tone:var(--wild)"><div class="cn-wide"><span class="kicker">The word · 1 of 3</span><h3 class="cn-title">The call</h3><div class="cn-cols">${callSteps()}</div></div></div>`,
        `<div class="cn-slide cn-panel-slide" data-id="signs" style="--tone:var(--wild)"><div class="cn-wide"><span class="kicker">The word · 2 of 3</span><h3 class="cn-title">Signs</h3><div class="signs">${signTiles()}</div></div></div>`,
        `<div class="cn-slide cn-panel-slide" data-id="fulfil" style="--tone:var(--wild)"><div class="cn-wide"><span class="kicker">The word · 3 of 3</span><h3 class="cn-title">What came of the word</h3><div class="cn-scroll">${fulfilPairs()}</div><div class="cn-actions"><button type="button" class="cn-drawer-btn" data-drawer="word-more">${icon("layers", 16)}How the word came, the message, and his words</button></div></div></div>`,
      ];
      drawerFor["word-more"] = `<span class="kicker">The word</span><h3>How it came, what it said</h3>${wordMore()}`;
      drawerFor.questions = `<span class="kicker">Open questions</span><h3>What readers still ask</h3>${questionList()}<h4 class="cn-h4">Two accounts, side by side</h4>${twoAccounts()}<h4 class="cn-h4">When?</h4>${datesBlock()}`;
      main.innerHTML = [
        chapter("prologue", "var(--accent)", "Moses", [prologue]),
        ...M.forties.map((f) => chapter(f.id, ACT_TONE[f.act], NAMES[f.act], [titleSlide(f), ...M.scenes.filter((s) => s.act === f.act).map(sceneSlide)], ROMAN[f.act])),
        chapter("people", "var(--midian)", "The people around him", [`<div class="cn-slide cn-panel-slide" data-id="people"><div class="cn-wide"><span class="kicker">Chapter IV</span><h3 class="cn-title">The people around him</h3>${peopleNet()}</div></div>`], "IV"),
        chapter("word", "var(--wild)", "The word", wordSlides, "V"),
        chapter("questions", "var(--prophets)", "Questions", [`<div class="cn-slide cn-panel-slide" data-id="q"><div class="cn-wide cn-q"><div><span class="kicker">Chapter VI</span><h3 class="cn-title">What readers still ask</h3>
          <div class="cn-qlist">${M.questions.map((q) => `<button type="button" class="cn-qcard glass" data-drawer="questions">${icon("help", 22)}<span>${esc(q.question)}</span><small>${q.views.length} views</small></button>`).join("")}</div></div>
          <div class="cn-notsaid glass"><span class="kicker">What Scripture does not say</span>${notSaid()}</div></div></div>`], "VI"),
        chapter("sources", "var(--accent)", "Sources", [`<div class="cn-slide cn-panel-slide" data-id="sources"><div class="cn-wide"><span class="kicker">Credits</span><h3 class="cn-title">Where every line comes from</h3>${sourcesBlock()}</div></div>`], "VII"),
      ].join("") + `<nav class="cn-rail" aria-label="Chapters">${["prologue", "egypt", "midian", "wilderness", "people", "word", "questions", "sources"].map((id, i) => `<a href="#cn-${id}" data-jump="${id}" title="${id}"><i></i><span>${["Moses", "Egypt", "Midian", "Wilderness", "People", "The word", "Questions", "Sources"][i]}</span></a>`).join("")}</nav>
        <div class="cn-drawer" aria-hidden="true"><div class="cn-scrim" data-close></div><div class="cn-sheet glass"><button type="button" class="cn-close" data-close aria-label="Close">${icon("x", 18)}</button><div class="cn-sheet-body"></div></div></div>`;

      const maps = [...main.querySelectorAll(".cn-map")].map((host) => {
        const m = MosesMap(host, { mini: true }), a = Number(host.dataset.act);
        requestAnimationFrame(() => { const r = m.size(); m.setView(m.fit(m.viewFor(a), { x: 12, y: 12, w: r.width - 24, h: r.height - 24 })); m.setProgress(a === 1 ? 0 : a === 2 ? 3 : 15); });
        return m;
      });
      const state = new Map(); // chapter -> index
      let finishPending = null;
      // Sliding to a scene: the track moves sideways and the new scene's drawing draws itself, on the clock.
      const slideTo = (ch, to, animate = true) => {
        const track = ch.querySelector(".cn-track"), slides = [...track.children], from = state.get(ch) ?? 0;
        to = Math.max(0, Math.min(slides.length - 1, to));
        state.set(ch, to);
        ch.querySelectorAll(".cn-dots button").forEach((b, i) => b.toggleAttribute("aria-current", i === to));
        const count = ch.querySelector(".cn-count b"); if (count) count.textContent = String(to + 1);
        const target = slides[to].querySelector(".art");
        const label = slides[to].querySelector(".cn-title")?.textContent ?? "";
        if (!animate) { track.style.setProperty("--x", String(to)); target?.style.setProperty("--draw", "1"); return; }
        target?.style.setProperty("--draw", "0");
        finishPending?.(); // a drawing the clock was still playing is finished, not left half-drawn
        finishPending = () => { track.style.setProperty("--x", String(to)); target?.style.setProperty("--draw", "1"); };
        Clock.run({ label: `Slide to "${label}"`, duration: from === to ? 1600 : 2200, done: () => { finishPending = null; },
          frame: (q) => { track.style.setProperty("--x", (from + (to - from) * easeInOut(span(q, 0, .45))).toFixed(4)); target?.style.setProperty("--draw", span(q, .3, 1).toFixed(3)); },
          moving: (q) => [from !== to && q < .45 && "scenes sliding sideways", target && q > .3 && q < 1 && "line drawing drawing itself"].filter(Boolean) });
      };
      main.querySelectorAll(".cn-slide .art").forEach((a) => a.style.setProperty("--draw", "0"));
      const io = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const id = e.target.dataset.chapter;
        main.querySelectorAll(".cn-rail a").forEach((a) => a.toggleAttribute("aria-current", a.dataset.jump === id));
        slideTo(e.target, state.get(e.target) ?? 0); // every return draws the scene again
      }), { threshold: .45 });
      main.querySelectorAll(".cn-chapter").forEach((c) => io.observe(c));

      const drawer = main.querySelector(".cn-drawer"), sheet = drawer.querySelector(".cn-sheet-body");
      const openDrawer = (html, tone) => { sheet.innerHTML = html; drawer.style.setProperty("--tone", tone); drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false"); sheet.scrollTop = 0; };
      const closeDrawer = () => { drawer.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true"); };
      const onClick = (e) => {
        const ch = e.target.closest(".cn-chapter");
        const step = e.target.closest("[data-step]"); if (step && ch) { slideTo(ch, (state.get(ch) ?? 0) + Number(step.dataset.step)); return; }
        const go = e.target.closest("[data-go]"); if (go && ch) { slideTo(ch, Number(go.dataset.go)); return; }
        const jump = e.target.closest("[data-jump]"); if (jump) { e.preventDefault(); main.querySelector(`#cn-${jump.dataset.jump}`)?.scrollIntoView({ behavior: "smooth" }); return; }
        const d = e.target.closest("[data-drawer]"); if (d) { openDrawer(drawerFor[d.dataset.drawer], getComputedStyle(d.closest("[style*='--tone']") ?? main).getPropertyValue("--tone")); return; }
        const pl = e.target.closest("[data-plague]");
        if (pl) { const x = M.plagues[Number(pl.dataset.plague) - 1]; openDrawer(`<span class="kicker">Plague ${x.n} of 10</span><h3 class="cn-pl-h">${glyph(x.word, 54)}${esc(x.word)}</h3>${kjv(x.verse)}<div class="cn-pl-row">${M.plagues.map((y) => `<button type="button" data-plague="${y.n}" aria-pressed="${y.n === x.n}">${glyph(y.word, 22)}</button>`).join("")}</div>`, "var(--midian)"); return; }
        if (e.target.closest("[data-close]")) closeDrawer();
      };
      const onKey = (e) => {
        if (e.key === "Escape") { closeDrawer(); return; }
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const ch = [...main.querySelectorAll(".cn-chapter")].find((c) => { const r = c.getBoundingClientRect(); return r.top < innerHeight / 2 && r.bottom > innerHeight / 2; });
        if (ch) slideTo(ch, (state.get(ch) ?? 0) + (e.key === "ArrowRight" ? 1 : -1));
      };
      let sx = null;
      const onDown = (e) => { if (e.target.closest(".cn-viewport")) sx = [e.clientX, e.clientY, e.target.closest(".cn-chapter")]; };
      const onUp = (e) => { if (!sx) return; const dx = e.clientX - sx[0], dy = e.clientY - sx[1]; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) slideTo(sx[2], (state.get(sx[2]) ?? 0) + (dx < 0 ? 1 : -1)); sx = null; };
      main.addEventListener("click", onClick); addEventListener("keydown", onKey); main.addEventListener("pointerdown", onDown); addEventListener("pointerup", onUp);
      return () => { io.disconnect(); maps.forEach((m) => m.destroy()); removeEventListener("keydown", onKey); removeEventListener("pointerup", onUp); };
    },
  };
})();
