// H · The merged page. B's three-forties landing, as it is; the whole road in the Atlas; three dense Roman-numeral
// chapters (Egypt, Midian, the wilderness), each with a sky of faint dots, a giant numeral, scenes that slide sideways,
// every event of the period with its verse, and a line-art landscape for ground, with "See the map" sliding the journey
// map in beside the chapter; then the man, the word, the people around him (the constellation), the questions, a link
// to the long memory, and the sources. C's dot navigation runs down the right edge.
(() => {
  const ROMAN = ["", "I", "II", "III"];
  let X = null; // data/merged.json
  const loadX = async () => { if (X) return X; const res = await fetch("data/merged.json"); if (!res.ok) throw new Error(`merged.json: expected 200, got ${res.status}`); X = await res.json(); return X; };
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const toneVar = (t) => `var(--${t})`;
  const drawerFor = {};

  const detail = (s) => `<span class="mg-kick">${esc(s.placeName)} · ${esc(refText(s.verse.ref))}</span><h3>${esc(s.title)}</h3>${s.verse2 ? kjv(s.verse2) : ""}${sceneLines(s)}${s.more.map((c) => claim(c)).join("")}${s.burial ? quoteSpan({ text: s.burial.text, span: s.burial.span }) : ""}${(s.tradition ?? []).map((c) => claim(c)).join("")}`;
  const sceneSlide = (s, c) => {
    drawerFor[s.id] = detail(s);
    const notes = s.more.length + s.lines.length + (s.tradition?.length ?? 0);
    return `<div class="mg-slide ${s.plagues ? "has-plagues" : ""}" data-id="${s.id}" style="--tone:${toneVar(c.tone)}">
      <div class="mg-text"><span class="mg-kick">${icon("map", 13)}${esc(s.placeName)}</span><h3 class="mg-title">${esc(s.title)}</h3>
        <blockquote class="mg-verse"><p>${esc(s.verse.text)}</p><footer>${refLink(s.verse.ref)} · KJV</footer></blockquote>
        <div class="mg-line">${claim(s.lines[0])}</div>
        <div class="mg-actions"><button type="button" class="mg-link" data-drawer="${s.id}">${icon("layers", 15)}The full detail <small>${notes} sourced notes</small></button>
          <button type="button" class="mg-link" data-map="${c.id}">${icon("map", 15)}See the map</button></div></div>
      ${s.plagues ? `<div class="mg-art mg-art-plagues">${plagueDots()}</div>` : `<div class="mg-art">${art(s.art)}</div>`}</div>`;
  };
  const titleSlide = (c) => {
    const f = actOf(c.act), list = c.scenes.map((id) => M.sceneById[id]);
    return `<div class="mg-slide mg-slide-title" data-id="${c.id}" style="--tone:${toneVar(c.tone)}">
      <div class="mg-text"><span class="mg-kick">Chapter ${ROMAN[c.n]} · ${esc(c.years)}</span><h2 class="mg-title mg-title-xl">${esc(c.title)}</h2>
        <blockquote class="mg-verse"><p>${esc(f.verse.text)}</p><footer>${refLink(f.verse.ref)} · KJV · Stephen's telling</footer></blockquote>
        <div class="mg-actions"><button type="button" class="mg-link" data-map="${c.id}">${icon("map", 15)}See the map <small>${esc(c.road)}</small></button>
          <a class="mg-link" href="#mg-${c.id}-events" data-events="${c.id}">${icon("route", 15)}Every event <small>${c.timeline.filter((e) => e.k !== "gap").length}, with their verses</small></a></div></div>
      <ol class="mg-index">${list.map((s, i) => `<li><button type="button" data-go="${i + 1}"><span>${String(i + 1).padStart(2, "0")}</span><b>${esc(s.title)}</b><small>${esc(refText(s.verse.ref))}</small></button></li>`).join("")}</ol></div>`;
  };
  const stopsLine = (c) => c.stops.map((i) => M.map.route[i]).filter((s, i, all) => all.findIndex((x) => x.name === s.name) === i)
    .map((s) => `<li><b>${esc(s.name)}</b>${refLink(s.verse.ref)}<small>${Math.round(s.confidence * 100)}%</small></li>`).join("");
  const chapter = (c) => {
    const slides = [titleSlide(c), ...c.scenes.map((id) => sceneSlide(M.sceneById[id], c))];
    return `<section class="mg-ch" id="mg-${c.id}" data-ch="${c.id}" style="--tone:${toneVar(c.tone)}" aria-label="Chapter ${ROMAN[c.n]}: ${esc(c.title)}">
      ${starField(c.n * 131)}<div class="mg-num" aria-hidden="true">${ROMAN[c.n]}</div>
      <div class="mg-stage">
        <div class="mg-viewport"><div class="mg-track" style="--x:0">${slides.join("")}</div></div>
        <div class="mg-nav"><button type="button" class="mg-arrow" data-step="-1" aria-label="Previous scene">${icon("arrowLeft", 17)}</button>
          <div class="mg-dots">${slides.map((_, i) => `<button type="button" data-go="${i}" aria-label="Scene ${i + 1}" ${i === 0 ? 'aria-current="true"' : ""}></button>`).join("")}</div>
          <span class="mg-count"><b>1</b> / ${slides.length}</span><button type="button" class="mg-arrow" data-step="1" aria-label="Next scene">${icon("arrowRight", 17)}</button>
          <button type="button" class="mg-maptoggle" data-map="${c.id}" aria-expanded="false">${icon("map", 15)}<span>See the map</span></button></div>
        <div class="mg-ledger" id="mg-${c.id}-events">${MergedLedger.html(c, X)}</div>
        <div class="mg-ground">${MergedLand.svg(c.land)}</div>
      </div>
      <aside class="mg-map" aria-hidden="true" aria-label="The road: ${esc(c.road)}"><div class="mg-map-in">
        <header><span class="mg-kick">The road · ${esc(c.road)}</span><button type="button" class="mg-mapclose" data-mapclose aria-label="Hide the map">${icon("x", 17)}</button>
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
    const CH = X.chapters, people = MergedSections.peopleData(X);
    const RAIL = [{ target: "mg-top", label: "Moses" }, { target: "mg-atlas", label: "In the Atlas" }, ...CH.map((c) => ({ target: `mg-${c.id}`, label: `${ROMAN[c.n]} · ${c.title}` })),
      { target: "mg-man", label: "The man" }, { target: "mg-word", label: "The word" }, { target: "mg-people", label: "The people around him" }, { target: "mg-ask", label: "What readers ask" }, { target: "sources", label: "Sources" }];
    main.innerHTML = `
      <div id="mg-top" class="mg-top">${DIRECTIONS.forties.landing()}</div>
      ${MergedSections.atlas(X)}
      ${CH.map(chapter).join("")}
      ${MergedSections.man(X)}
      ${MergedSections.word(X)}
      ${MergedSections.people(X, people)}
      <div id="mg-ask">${MergedAsk.html(X.questionTitles)}</div>
      <div class="wrap mg-end-links"><a class="mg-memory" href="#memory">${icon("sparkle", 16)}<span>The long memory: every verse that names him</span>${icon("arrowRight", 16)}</a></div>
      <div class="wrap"><div class="mg-sources">${expander(null, sourcesBlock(), { closed: `Sources · ${M.citations.length} scholars and writers, and every passage read`, opened: "Hide the sources" })}</div></div>
      <div class="cn-drawer mg-drawer" aria-hidden="true"><div class="cn-scrim" data-close></div><div class="cn-sheet"><button type="button" class="cn-close" data-close aria-label="Close">${icon("x", 18)}</button><div class="cn-sheet-body"></div></div></div>
      ${MergedRail.html(RAIL)}`;
    main.querySelector("#sources")?.removeAttribute("id");
    main.querySelector(".mg-sources").id = "sources";

    // The clock holds one animation at a time. Starting a new one first finishes the one still playing, so nothing is
    // ever left half-drawn or half-slid.
    let cur = null;
    const play = (job) => {
      if (cur && !cur.ended) { cur.ended = true; try { cur.frame(1); } catch (error) { console.error(`merged: could not finish "${cur.label}"`, error); } cur.done?.(); }
      const frame = job.frame, done = job.done;
      job.frame = (q) => { if (q < 1) job.ended = false; frame(q); };
      job.done = () => { if (job.finished) return; job.finished = true; job.ended = true; done?.(); };
      cur = job; Clock.run(job);
    };

    // The landing: B's ring sweeps 0 to 120 once, then rests on Act I with its card chosen (as in B).
    const ring = main.querySelector(".tf-ring"), cards = [...main.querySelectorAll(".tf-act-btn")];
    const chooseAct = (a) => { cards.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.act) === a))); ring.dataset.act = String(a); };
    chooseAct(1);
    play({ label: "The 120-year ring sweeps, then rests on Act I", duration: 2400, frame: (q) => DIRECTIONS.forties.ringFrame(ring, q, { full: true, to: 1 }),
      moving: (q) => (q < 1 ? ["ring hand and arcs", "year count"] : []) });
    const turnTo = (a) => { chooseAct(a); play({ label: `Act ${ROMAN[a]}: the ring turns`, duration: 900, frame: (q) => DIRECTIONS.forties.ringFrame(ring, q, { full: false, to: a }), moving: (q) => (q < 1 ? ["ring hand"] : []) }); };

    // The Atlas band, the people field and the dot navigation.
    const offAtlas = MergedSections.wireAtlas(main.querySelector(".mx-atlas"), X);
    const peopleUi = MergedSections.wirePeople(main.querySelector(".mx-people"), X, people);
    const offRail = MergedRail.wire(main, RAIL);
    const offAsk = MergedAsk.wire(main.querySelector(".mg-ask"));

    // Chapters: scenes slide sideways; each scene's drawing draws itself on arrival and on every return, then idles.
    const state = new Map(), maps = new Map();
    const chOf = (id) => main.querySelector(`#mg-${id}`), dataOf = (ch) => CH.find((c) => c.id === ch.dataset.ch);
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
          target?.classList.toggle("is-idle", q >= 1);
        },
        moving: (q) => [from !== to && q < .45 && "scenes sliding sideways", (target || cells.length) && q > .3 && q < 1 && "line drawing drawing itself"].filter(Boolean) });
    };

    // The map slides in beside the chapter (the chapter narrows to the left) and lights the chapter's stretch of road;
    // "Hide the map" plays the same motion backwards: the map slides out and the chapter widens. Both run on the clock,
    // so the ticker can step either one. On a phone the map is a sheet that slides up from the bottom.
    const boxFor = (stops) => { const xs = stops.map((i) => M.map.route[i].xy[0]), ys = stops.map((i) => M.map.route[i].xy[1]), pad = 46;
      return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2]; };
    // is-map: the map is on screen (also while it slides out); mapdir: which way it is going, for the buttons.
    const setMapUi = (ch, shown) => { if (ch.classList.contains("is-map") === shown) return; ch.classList.toggle("is-map", shown); ch.querySelector(".mg-map").setAttribute("aria-hidden", String(!shown)); };
    const setDir = (ch, dir) => {
      ch.dataset.mapdir = dir;
      ch.querySelectorAll(".mg-maptoggle").forEach((b) => { b.setAttribute("aria-expanded", String(dir === "in")); b.querySelector("span").textContent = dir === "in" ? "Hide the map" : "See the map"; });
    };
    const setM = (ch, v) => { ch.style.setProperty("--m", v.toFixed(4)); ch.dataset.mapping = v > 0 && v < 1 ? "1" : ""; };
    const openMap = (ch) => {
      const c = dataOf(ch);
      setMapUi(ch, true); setDir(ch, "in"); ch.classList.add("is-narrow");
      if (!maps.has(ch)) maps.set(ch, MosesMap(ch.querySelector(".mg-maphost")));
      const m = maps.get(ch);
      requestAnimationFrame(() => { const r = m.size(), top = ch.querySelector(".mg-map header").offsetHeight - 10; m.setView(m.fit(boxFor(c.stops), { x: 24, y: top, w: r.width - 48, h: r.height - top - 36 })); });
      m.setRange(c.range[0], c.range[0]);
      // Bring the chapter's top into view first when its end is on screen, so the map's heading and close are in view.
      const box = ch.getBoundingClientRect();
      if (innerWidth > 760 && box.top > 0 && box.top > innerHeight * .4) ch.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
      const start = Number(ch.style.getPropertyValue("--m") || 0);
      play({ label: `The map slides in beside ${c.title}`, duration: 1600,
        frame: (q) => { setMapUi(ch, true); setM(ch, start + (1 - start) * easeInOut(span(q, 0, .55))); m.setRange(c.range[0], c.range[0] + (c.range[1] - c.range[0]) * easeInOut(span(q, .35, 1))); },
        moving: (q) => [q < .55 && "map sliding in, chapter narrowing", q > .35 && q < 1 && "route drawing"].filter(Boolean) });
    };
    const closeMap = (ch, animate = true) => {
      if (!ch.classList.contains("is-map")) return;
      setDir(ch, "out"); ch.classList.remove("is-narrow");
      if (!animate) { setM(ch, 0); setMapUi(ch, false); return; } // it has left the screen already
      const start = Number(ch.style.getPropertyValue("--m") || 1);
      play({ label: `The map slides back out from ${dataOf(ch).title}`, duration: 1200,
        frame: (q) => { setMapUi(ch, true); setM(ch, start * (1 - easeInOut(q))); if (q >= 1) setMapUi(ch, false); },
        moving: (q) => (q < 1 ? ["map sliding out, chapter widening"] : []) });
    };
    // A chapter's scene draws when its scenes come into view; a chapter that leaves the screen puts its map away.
    const seen = new WeakSet();
    const vpIo = new IntersectionObserver((entries) => entries.forEach((e) => {
      const ch = e.target.closest(".mg-ch");
      if (e.isIntersecting && !seen.has(ch)) { seen.add(ch); slideTo(ch, state.get(ch) ?? 0); }
      else if (!e.isIntersecting) seen.delete(ch);
    }), { threshold: .45 });
    const chIo = new IntersectionObserver((entries) => entries.forEach((e) => { if (!e.isIntersecting) closeMap(e.target, false); }), { threshold: 0 });
    main.querySelectorAll(".mg-ch").forEach((ch) => { ch.querySelectorAll(".art").forEach((a) => a.style.setProperty("--draw", "0")); vpIo.observe(ch.querySelector(".mg-viewport")); chIo.observe(ch); });
    // The people field blooms when it comes into view.
    let bloomed = false;
    const pIo = new IntersectionObserver(([e]) => { if (e.isIntersecting && !bloomed) { bloomed = true; play({ label: "The people around him bloom out from Moses", duration: 2600, frame: peopleUi.field.bloomFrame, moving: peopleUi.field.bloomMoving }); } }, { threshold: .3 });
    pIo.observe(main.querySelector(".mx-pfield"));

    const drawer = main.querySelector(".mg-drawer"), sheet = drawer.querySelector(".cn-sheet-body");
    const openDrawer = (html, tone) => { sheet.innerHTML = html; drawer.style.setProperty("--tone", tone); drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false"); sheet.scrollTop = 0; };
    const closeDrawer = () => { drawer.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true"); };
    const goChapter = (id, scene) => {
      const ch = chOf(id);
      if (scene !== undefined) { if (seen.has(ch)) slideTo(ch, scene); else state.set(ch, scene); }
      ch.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
    };
    const onClick = (e) => {
      const ch = e.target.closest(".mg-ch");
      const step = e.target.closest("[data-step]"); if (step && ch) { slideTo(ch, (state.get(ch) ?? 0) + Number(step.dataset.step)); return; }
      const go = e.target.closest("[data-go]"); if (go && ch) { slideTo(ch, Number(go.dataset.go)); return; }
      const mp = e.target.closest("[data-map]"); if (mp && ch) { if (ch.dataset.mapdir === "in") closeMap(ch); else openMap(ch); return; }
      if (e.target.closest("[data-mapclose]") && ch) { closeMap(ch); return; }
      const ev = e.target.closest("[data-events]"); if (ev) { e.preventDefault(); main.querySelector(`#mg-${ev.dataset.events}-events`).scrollIntoView({ behavior: reduced() ? "auto" : "smooth" }); return; }
      const pl = e.target.closest("[data-plague]");
      if (pl) { const box = pl.closest(".mg-art-plagues"); box.querySelectorAll("[data-plague]").forEach((b) => b.setAttribute("aria-pressed", String(b === pl))); box.querySelector("[data-plline]").innerHTML = plagueLine(Number(pl.dataset.plague)); return; }
      const d = e.target.closest("[data-drawer]"); if (d) { openDrawer(drawerFor[d.dataset.drawer], getComputedStyle(d.closest(".mg-slide")).getPropertyValue("--tone")); return; }
      if (e.target.closest("[data-close]")) { closeDrawer(); return; }
      const fam = e.target.closest("[data-fam]"); if (fam) { main.querySelectorAll("[data-fam]").forEach((g) => g.classList.toggle("is-on", g === fam)); main.querySelector(".mx-fd").innerHTML = MergedSections.famDetail(X, fam.dataset.fam); return; }
      const ask = e.target.closest("[data-askq]"); if (ask) { e.preventDefault(); const w = main.querySelector(`.mg-word[data-q="${ask.dataset.askq}"]`); main.querySelector("#mg-ask").scrollIntoView({ behavior: reduced() ? "auto" : "smooth" }); if (w && w.getAttribute("aria-expanded") !== "true") w.click(); return; }
      const gc = e.target.closest("[data-goch]"); if (gc) { e.preventDefault(); goChapter(gc.dataset.goch); return; }
      const card = e.target.closest(".tf-act-btn"); if (card) { const a = Number(card.dataset.act); turnTo(a); goChapter(CH.find((c) => c.act === a)?.id ?? CH[CH.length - 1].id); return; }
      const hit = e.target.closest(".tf-hit, .tf-actlabel"); if (hit) { const a = Number(hit.dataset.act); turnTo(a); goChapter(CH.find((c) => c.act === a).id); return; }
      const dot = e.target.closest(".tf-dot"); if (dot) { const c = CH.find((x) => x.scenes.includes(dot.dataset.scene)); goChapter(c.id, c.scenes.indexOf(dot.dataset.scene) + 1); }
    };
    const onKey = (e) => {
      if (e.key === "Escape") { closeDrawer(); main.querySelectorAll(".mg-ch.is-map").forEach((ch) => closeMap(ch)); return; }
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const ch = [...main.querySelectorAll(".mg-ch")].find((c) => { const r = c.querySelector(".mg-viewport").getBoundingClientRect(); return r.top < innerHeight / 2 && r.bottom > innerHeight / 2; });
      if (ch) slideTo(ch, (state.get(ch) ?? 0) + (e.key === "ArrowRight" ? 1 : -1));
    };
    let sx = null;
    const onDown = (e) => { if (e.target.closest(".mg-viewport")) sx = [e.clientX, e.clientY, e.target.closest(".mg-ch")]; };
    const onUp = (e) => { if (!sx) return; const dx = e.clientX - sx[0], dy = e.clientY - sx[1]; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) slideTo(sx[2], (state.get(sx[2]) ?? 0) + (dx < 0 ? 1 : -1)); sx = null; };
    main.addEventListener("click", onClick); addEventListener("keydown", onKey); main.addEventListener("pointerdown", onDown); addEventListener("pointerup", onUp);
    return () => { vpIo.disconnect(); chIo.disconnect(); pIo.disconnect(); maps.forEach((m) => m.destroy()); offAtlas(); peopleUi.destroy(); offRail(); offAsk(); removeEventListener("keydown", onKey); removeEventListener("pointerup", onUp); };
  }
})();
