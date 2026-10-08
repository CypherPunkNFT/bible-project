// H · The merged page. The three-forties ring as the header; under it the burning bush on a slow loop; then three
// cinema chapters (Egypt, Midian, the wilderness), each with its giant numeral and a quiet star field, scenes sliding
// sideways, and "See the map" sliding the journey map in beside the chapter on the same page; the open questions as
// floating words; and a strip to a second page (#merged-more) for the approved sections that do not fit here.
(() => {
  const ROMAN = ["", "I", "II", "III"];
  let X = null; // data/merged.json: the bush callouts (KJV phrases) and the short question titles
  const loadX = async () => { if (X) return X; const res = await fetch("data/merged.json"); if (!res.ok) throw new Error(`merged.json: expected 200, got ${res.status}`); X = await res.json(); return X; };
  // Chapters by place. Egypt holds his first forty and his return at 80 (the plagues, the sea); range = the stretch of
  // the road (in stop units of data/moses.json map.route) the map lights for the chapter.
  const CHAPTERS = [
    { n: 1, id: "egypt", act: 1, tone: "var(--egypt)", title: "Egypt", years: "Years 0–40, and back at 80", scenes: ["river", "prince", "pharaoh", "sea"], range: [3, 7.55], stops: [0, 3, 4, 5, 6, 7, 8], road: "Egypt to the sea" },
    { n: 2, id: "midian", act: 2, tone: "var(--midian)", title: "Midian", years: "Years 40–80", scenes: ["stranger", "bush", "sent"], range: [0, 2], stops: [0, 1, 2], road: "Egypt to Midian and Horeb" },
    { n: 3, id: "wilderness", act: 3, tone: "var(--wild)", title: "The wilderness", years: "Years 80–120", scenes: ["rephidim", "sinai", "tabernacle", "forty", "nebo"], range: [7.55, 15], stops: [8, 9, 10, 11, 12, 13, 14, 15], road: "The sea to Kadesh and Nebo" },
  ];
  const chapterOfScene = (id) => CHAPTERS.find((c) => c.scenes.includes(id));
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tickerOpen = () => !!document.querySelector(".ticker:not(.is-closed)");
  const drawerFor = {};

  const detail = (s) => `<span class="mg-kick">${esc(s.placeName)} · ${esc(refText(s.verse.ref))}</span><h3>${esc(s.title)}</h3>${s.verse2 ? kjv(s.verse2) : ""}${sceneLines(s)}${s.more.map((c) => claim(c)).join("")}${s.burial ? quoteSpan({ text: s.burial.text, span: s.burial.span }) : ""}${(s.tradition ?? []).map((c) => claim(c)).join("")}`;
  const sceneSlide = (s, c) => {
    drawerFor[s.id] = detail(s);
    const notes = s.more.length + s.lines.length + (s.tradition?.length ?? 0);
    return `<div class="mg-slide ${s.plagues ? "has-plagues" : ""}" data-id="${s.id}" style="--tone:${c.tone}">
      <div class="mg-text"><span class="mg-kick">${icon("map", 13)}${esc(s.placeName)}</span><h3 class="mg-title">${esc(s.title)}</h3>
        <blockquote class="mg-verse"><p>${esc(s.verse.text)}</p><footer>${refLink(s.verse.ref)} · KJV</footer></blockquote>
        <div class="mg-line">${claim(s.lines[0])}</div>
        <div class="mg-actions"><button type="button" class="mg-link" data-drawer="${s.id}">${icon("layers", 15)}The full detail <small>${notes} sourced notes</small></button>
          <button type="button" class="mg-link" data-map="${c.id}">${icon("map", 15)}See the map</button></div></div>
      ${s.plagues ? `<div class="mg-art mg-art-plagues">${plagueDots()}</div>` : `<div class="mg-art">${art(s.art)}</div>`}</div>`;
  };
  const titleSlide = (c) => {
    const f = actOf(c.act), list = c.scenes.map((id) => M.sceneById[id]);
    return `<div class="mg-slide mg-slide-title" data-id="${c.id}" style="--tone:${c.tone}">
      <div class="mg-text"><span class="mg-kick">Chapter ${ROMAN[c.n]} · ${esc(c.years)}</span><h2 class="mg-title mg-title-xl">${esc(c.title)}</h2>
        <blockquote class="mg-verse"><p>${esc(f.verse.text)}</p><footer>${refLink(f.verse.ref)} · KJV · Stephen's telling</footer></blockquote>
        <div class="mg-actions"><button type="button" class="mg-link" data-map="${c.id}">${icon("map", 15)}See the map <small>${esc(c.road)}</small></button></div></div>
      <ol class="mg-index">${list.map((s, i) => `<li><button type="button" data-go="${i + 1}"><span>${String(i + 1).padStart(2, "0")}</span><b>${esc(s.title)}</b><small>${esc(refText(s.verse.ref))}</small></button></li>`).join("")}</ol></div>`;
  };
  const stopsLine = (c) => c.stops.map((i) => M.map.route[i]).filter((s, i, all) => all.findIndex((x) => x.name === s.name) === i)
    .map((s) => `<li><b>${esc(s.name)}</b>${refLink(s.verse.ref)}<small>${Math.round(s.confidence * 100)}%</small></li>`).join("");
  const chapter = (c) => {
    const slides = [titleSlide(c), ...c.scenes.map((id) => sceneSlide(M.sceneById[id], c))];
    return `<section class="mg-ch" id="mg-${c.id}" data-ch="${c.id}" style="--tone:${c.tone}" aria-label="Chapter ${ROMAN[c.n]}: ${esc(c.title)}">
      ${starField(c.n * 131)}<div class="mg-num" aria-hidden="true">${ROMAN[c.n]}</div>
      <div class="mg-stage"><div class="mg-viewport"><div class="mg-track" style="--x:0">${slides.join("")}</div></div>
        <div class="mg-nav"><button type="button" class="mg-arrow" data-step="-1" aria-label="Previous scene">${icon("arrowLeft", 17)}</button>
          <div class="mg-dots">${slides.map((_, i) => `<button type="button" data-go="${i}" aria-label="Scene ${i + 1}" ${i === 0 ? 'aria-current="true"' : ""}></button>`).join("")}</div>
          <span class="mg-count"><b>1</b> / ${slides.length}</span><button type="button" class="mg-arrow" data-step="1" aria-label="Next scene">${icon("arrowRight", 17)}</button>
          <button type="button" class="mg-maptoggle" data-map="${c.id}" aria-expanded="false">${icon("map", 15)}<span>See the map</span></button></div></div>
      <aside class="mg-map" aria-hidden="true" aria-label="The road: ${esc(c.road)}"><div class="mg-map-in">
        <header><span class="mg-kick">The road · ${esc(c.road)}</span><button type="button" class="mg-mapclose" data-mapclose aria-label="Close the map">${icon("x", 17)}</button>
          <ol class="mg-stops">${stopsLine(c)}</ol><p>Places from the Atlas, with how sure it is of each spot (%). The way between stops is reconstructed.</p></header>
        <div class="mg-maphost"></div></div></aside></section>`;
  };

  DIRECTIONS.merged = {
    name: "The merged page", swatch: "#c9842f",
    mount(main) {
      main.innerHTML = `<div class="wrap mg-wait">${topline()}<p>Opening the page…</p></div>`;
      let alive = true, teardown = () => {};
      loadX().then(() => {
        if (!alive) return;
        try { teardown = draw(main); } catch (error) { console.error("merged: the page failed to draw", error); main.innerHTML = `<p class="wrap">The merged page failed to draw: ${esc(error.message)}</p>`; }
      }).catch((error) => { console.error("merged: could not load data/merged.json", error); main.innerHTML = `<p class="wrap">Could not load data/merged.json: ${esc(error.message)}</p>`; });
      return () => { alive = false; teardown(); };
    },
  };

  function draw(main) {
    const p = M.person, bushScene = M.sceneById.bush;
    main.innerHTML = `
      <section class="mg-head"><div class="wrap">${topline()}
        <div class="mg-hero">
          <div class="mg-copy"><span class="mg-kick" style="--tone:var(--accent)">${esc(p.prophetTitle)}</span><h1>Moses</h1><p class="mg-lede">One life of 120 years, told by Stephen as three forties.</p>
            <ol class="mg-acts">${CHAPTERS.map((c) => { const f = actOf(c.act); return `<li style="--tone:${c.tone}"><a href="#mg-${c.id}" data-goch="${c.id}"><b>${ROMAN[c.n]}</b><span>${esc(f.name)}<small>Years ${f.from}–${f.to} · ${esc(refText(f.verse.ref))}</small></span>${icon("arrowRight", 15)}</a></li>`; }).join("")}</ol>
            <p class="mg-end"><b>120</b> ${esc(M.end.text)} ${refLink(M.end.ref)}</p></div>
          <div class="mg-ring">${DIRECTIONS.forties.ring()}</div></div></div></section>
      <section class="mg-bush" style="--tone:var(--egypt)" aria-label="The burning bush">
        <div class="mg-bush-art">${MergedBush.svg(X.callouts)}</div>
        <div class="wrap mg-bush-cap"><span class="mg-kick">Mount Horeb · the call</span><p>${esc(bushScene.verse.text)}</p><footer>${refLink(bushScene.verse.ref)} · KJV<a class="read" href="${refHref(bushScene.verse.ref)}">${icon("open", 14)}Read the passage</a></footer>
          <ul class="mg-callist">${X.callouts.map((c) => `<li><span>${refLink(c.ref)}</span>“${esc(c.phrase)}”</li>`).join("")}</ul></div></section>
      ${CHAPTERS.map(chapter).join("")}
      ${MergedAsk.html(X.questionTitles)}
      <div class="wrap">${moreStrip()}
        <div class="mg-sources">${expander(null, sourcesBlock(), { closed: `Sources · ${M.citations.length} scholars and writers, and every passage read`, opened: "Hide the sources" })}</div></div>
      <div class="cn-drawer mg-drawer" aria-hidden="true"><div class="cn-scrim" data-close></div><div class="cn-sheet"><button type="button" class="cn-close" data-close aria-label="Close">${icon("x", 18)}</button><div class="cn-sheet-body"></div></div></div>`;
    main.querySelector("#sources")?.removeAttribute("id");
    main.querySelector(".mg-sources").id = "sources";

    // The clock holds one animation at a time. Starting a new one first finishes the one still playing (so nothing is
    // ever left half-drawn: the cause of C's frozen drawings); when an animation ends, the bush resumes its loop.
    let cur = null;
    const play = (job) => {
      if (cur && !cur.ended) { cur.ended = true; try { cur.frame(1); } catch (error) { console.error(`merged: could not finish "${cur.label}"`, error); } }
      const frame = job.frame, done = job.done;
      job.frame = (q) => { if (q < 1) job.ended = false; frame(q); };
      job.done = () => { job.ended = true; done?.(); if (cur === job) idle(); };
      cur = job; Clock.run(job);
    };
    const busy = () => cur && !cur.ended;

    // The bush: draws itself once, then loops (9 s a loop) while it is on screen; again on every return.
    const bushSvg = main.querySelector(".mb"), LOOP = 9000, INTRO = 3200, OFFSET = INTRO / LOOP;
    let bushOn = false, bushDrawn = false;
    MergedBush.frame(bushSvg, OFFSET, 0);
    const bushJob = () => (bushDrawn
      ? { bush: true, label: "The burning bush: the flame flickers, sparks drift up (one 9-second loop)", duration: LOOP, frame: (q) => MergedBush.frame(bushSvg, (q + OFFSET) % 1, 1), moving: () => ["flame tongues", "sparks rising", "glow breathing"] }
      : { bush: true, label: "The bush draws itself, then catches fire", duration: INTRO, frame: (q) => MergedBush.frame(bushSvg, q * OFFSET, q), done: () => { bushDrawn = true; }, moving: (q) => [q < .8 && "drawing itself", q > .45 && "fire catching"].filter(Boolean) });
    const startBush = () => { if (!busy()) play(bushJob()); };
    const idle = () => { if (bushOn && (!reduced() || tickerOpen())) play(bushJob()); };
    const bushIo = new IntersectionObserver(([e]) => { bushOn = e.isIntersecting; if (bushOn) startBush(); }, { threshold: .2 });
    bushIo.observe(main.querySelector(".mg-bush"));

    // The ring: the hand sweeps 0 to 120 once; each act's arc lights as it passes.
    const ring = main.querySelector(".tf-ring"), hand = ring.querySelector(".tf-hand"), big = ring.querySelector(".tf-big"), sub = ring.querySelector(".tf-sub");
    const arcs = [...ring.querySelectorAll(".tf-arc")], ringDots = [...ring.querySelectorAll(".tf-dot")];
    const restRing = () => { big.textContent = "120"; sub.textContent = "years"; };
    play({ label: "The ring: 120 years sweep round as three forties", duration: 2600,
      frame: (q) => { const y = 120 * easeInOut(q);
        arcs.forEach((a) => a.style.setProperty("--p", clamp01((y - (Number(a.dataset.act) - 1) * 40) / 40).toFixed(3)));
        ringDots.forEach((d) => d.classList.toggle("is-lit", (Number(d.dataset.act) - 1) * 40 + 20 <= y + 6));
        hand.style.transform = `rotate(${y * 3}deg)`; big.textContent = String(Math.round(y)); sub.textContent = "years"; },
      moving: (q) => (q < 1 ? ["ring hand", "arcs lighting", "year count"] : []) });
    const onRingOver = (e) => { const a = e.target.closest(".tf-hit, .tf-actlabel"); if (!a || busy()) return; const f = actOf(Number(a.dataset.act)); big.textContent = `${f.from}–${f.to}`; sub.textContent = f.name; };
    ring.addEventListener("pointerover", onRingOver); ring.addEventListener("pointerleave", () => { if (!busy()) restRing(); });

    // Chapters: scenes slide sideways; each scene's drawing draws itself on arrival and on every return, then idles.
    const state = new Map(), maps = new Map();
    const chOf = (id) => main.querySelector(`#mg-${id}`), dataOf = (ch) => CHAPTERS.find((c) => c.id === ch.dataset.ch);
    const slideTo = (ch, to) => {
      const track = ch.querySelector(".mg-track"), slides = [...track.children], from = state.get(ch) ?? 0;
      to = Math.max(0, Math.min(slides.length - 1, to)); state.set(ch, to);
      ch.querySelectorAll(".mg-dots button").forEach((b, i) => b.toggleAttribute("aria-current", i === to));
      ch.querySelector(".mg-count b").textContent = String(to + 1);
      const slide = slides[to], target = slide.querySelector(".art"), cells = [...slide.querySelectorAll(".mg-pl")];
      target?.classList.remove("is-idle"); target?.style.setProperty("--draw", "0");
      play({ label: `Slide to "${slide.querySelector(".mg-title")?.textContent ?? ""}"`, duration: from === to ? 1700 : 2300,
        frame: (q) => {
          track.style.setProperty("--x", (from + (to - from) * easeInOut(span(q, 0, .45))).toFixed(4));
          target?.style.setProperty("--draw", span(q, .3, 1).toFixed(3));
          cells.forEach((c, i) => c.style.setProperty("--draw", easeOut(span(q, .3 + i * .05, .62 + i * .05)).toFixed(3)));
          if (q >= 1) target?.classList.add("is-idle");
        },
        moving: (q) => [from !== to && q < .45 && "scenes sliding sideways", (target || cells.length) && q > .3 && q < 1 && "line drawing drawing itself"].filter(Boolean) });
    };
    // The map slides in beside the chapter (the chapter narrows to the left) and lights that chapter's stretch of road.
    const boxFor = (stops) => { const xs = stops.map((i) => M.map.route[i].xy[0]), ys = stops.map((i) => M.map.route[i].xy[1]), pad = 46;
      return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2]; };
    const setMapUi = (ch, open) => { ch.classList.toggle("is-map", open); ch.querySelector(".mg-map").setAttribute("aria-hidden", String(!open));
      ch.querySelectorAll(".mg-maptoggle").forEach((b) => { b.setAttribute("aria-expanded", String(open)); b.querySelector("span").textContent = open ? "Hide the map" : "See the map"; }); };
    const openMap = (ch) => {
      const c = dataOf(ch);
      if (!maps.has(ch)) maps.set(ch, MosesMap(ch.querySelector(".mg-maphost")));
      const m = maps.get(ch), r = m.size(), top = ch.querySelector(".mg-map header").offsetHeight - 10, bottom = 36;
      m.setView(m.fit(boxFor(c.stops), { x: 24, y: top, w: r.width - 48, h: r.height - top - bottom }));
      m.setRange(c.range[0], c.range[0]); setMapUi(ch, true);
      // The map holds to the screen while the chapter is under it; near the chapter's end (always on a phone, where the
      // chapter is tall) bring the chapter's top up first, so the map's heading and close button are in view.
      const box = ch.getBoundingClientRect();
      if (innerWidth <= 760 || box.bottom < innerHeight - 10) ch.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
      play({ label: `The map slides in beside ${c.title}`, duration: 1700,
        frame: (q) => { ch.style.setProperty("--m", easeInOut(span(q, 0, .5)).toFixed(4)); m.setRange(c.range[0], c.range[0] + (c.range[1] - c.range[0]) * easeInOut(span(q, .35, 1))); },
        moving: (q) => [q < .5 && "map sliding in, chapter narrowing", q > .35 && q < 1 && "route drawing"].filter(Boolean) });
    };
    const closeMap = (ch, animate = true) => {
      if (!ch.classList.contains("is-map")) return;
      if (!animate) { ch.style.setProperty("--m", "0"); setMapUi(ch, false); return; } // it has left the screen already
      const start = Number(ch.style.getPropertyValue("--m") || 1);
      play({ label: `The map slides back from ${dataOf(ch).title}`, duration: 900,
        frame: (q) => { ch.style.setProperty("--m", (start * (1 - easeInOut(q))).toFixed(4)); if (q >= 1) setMapUi(ch, false); },
        moving: (q) => (q < 1 ? ["map sliding back, chapter widening"] : []) });
    };
    const inView = new WeakSet();
    const chIo = new IntersectionObserver((entries) => entries.forEach((e) => {
      const ch = e.target;
      if (e.intersectionRatio >= .45 && !inView.has(ch)) { inView.add(ch); slideTo(ch, state.get(ch) ?? 0); }
      else if (e.intersectionRatio < .2 && inView.has(ch)) { inView.delete(ch); closeMap(ch, false); }
    }), { threshold: [0, .2, .45, .7] });
    main.querySelectorAll(".mg-ch").forEach((ch) => { ch.querySelectorAll(".art").forEach((a) => a.style.setProperty("--draw", "0")); chIo.observe(ch); });

    const drawer = main.querySelector(".mg-drawer"), sheet = drawer.querySelector(".cn-sheet-body");
    const openDrawer = (html, tone) => { sheet.innerHTML = html; drawer.style.setProperty("--tone", tone); drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false"); sheet.scrollTop = 0; };
    const closeDrawer = () => { drawer.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true"); };
    const goChapter = (id, scene) => {
      const ch = chOf(id);
      if (scene !== undefined) { if (inView.has(ch)) slideTo(ch, scene); else state.set(ch, scene); }
      ch.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
    };
    const onClick = (e) => {
      const ch = e.target.closest(".mg-ch");
      const step = e.target.closest("[data-step]"); if (step && ch) { slideTo(ch, (state.get(ch) ?? 0) + Number(step.dataset.step)); return; }
      const go = e.target.closest("[data-go]"); if (go && ch) { slideTo(ch, Number(go.dataset.go)); return; }
      const mp = e.target.closest("[data-map]"); if (mp && ch) { if (ch.classList.contains("is-map")) closeMap(ch); else openMap(ch); return; }
      if (e.target.closest("[data-mapclose]") && ch) { closeMap(ch); return; }
      const pl = e.target.closest("[data-plague]");
      if (pl) { const box = pl.closest(".mg-art-plagues"); box.querySelectorAll("[data-plague]").forEach((b) => b.setAttribute("aria-pressed", String(b === pl))); box.querySelector("[data-plline]").innerHTML = plagueLine(Number(pl.dataset.plague)); return; }
      const d = e.target.closest("[data-drawer]"); if (d) { openDrawer(drawerFor[d.dataset.drawer], getComputedStyle(d.closest(".mg-slide")).getPropertyValue("--tone")); return; }
      if (e.target.closest("[data-close]")) { closeDrawer(); return; }
      const gc = e.target.closest("[data-goch]"); if (gc) { e.preventDefault(); goChapter(gc.dataset.goch); return; }
      const hit = e.target.closest(".tf-hit, .tf-actlabel"); if (hit) { goChapter(CHAPTERS.find((c) => c.act === Number(hit.dataset.act)).id); return; }
      const dot = e.target.closest(".tf-dot"); if (dot) { const c = chapterOfScene(dot.dataset.scene); goChapter(c.id, c.scenes.indexOf(dot.dataset.scene) + 1); return; }
      const more = e.target.closest("[data-more]"); if (more) { try { sessionStorage.setItem("mg-more", more.dataset.more); } catch (error) { console.warn("merged: could not remember the section to open", error); } }
    };
    const onKey = (e) => {
      if (e.key === "Escape") { closeDrawer(); main.querySelectorAll(".mg-ch.is-map").forEach(closeMap); return; }
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const ch = [...main.querySelectorAll(".mg-ch")].find((c) => { const r = c.getBoundingClientRect(); return r.top < innerHeight / 2 && r.bottom > innerHeight / 2; });
      if (ch) slideTo(ch, (state.get(ch) ?? 0) + (e.key === "ArrowRight" ? 1 : -1));
    };
    let sx = null;
    const onDown = (e) => { if (e.target.closest(".mg-viewport")) sx = [e.clientX, e.clientY, e.target.closest(".mg-ch")]; };
    const onUp = (e) => { if (!sx) return; const dx = e.clientX - sx[0], dy = e.clientY - sx[1]; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) slideTo(sx[2], (state.get(sx[2]) ?? 0) + (dx < 0 ? 1 : -1)); sx = null; };
    main.addEventListener("click", onClick); addEventListener("keydown", onKey); main.addEventListener("pointerdown", onDown); addEventListener("pointerup", onUp);
    const offAsk = MergedAsk.wire(main.querySelector(".mg-ask"));
    return () => { bushIo.disconnect(); chIo.disconnect(); maps.forEach((m) => m.destroy()); offAsk(); removeEventListener("keydown", onKey); removeEventListener("pointerup", onUp); };
  }
})();
