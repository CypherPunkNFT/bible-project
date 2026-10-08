// H · The strata. The evidence itself as the picture: four glass plates stacked in 3D (CSS transforms), Scripture at
// the bottom, then early church writers, later tradition, and scholars' views on top. Each plate carries that layer's
// claims as dots on a shared life-line (Origins · Called · With Jesus · Acts and letters · The end). Drag to tilt and
// spin, slide to explode the stack, click a plate to bring it up, click a dot to read it. A core drilled through every
// plate at one point of the life shows Scripture beside what was said later, never blended.
(() => {
  const PLATES = [
    { id: "scripture", name: "Scripture", sub: "the Bible's own words, and what we count from them", c: "var(--p-scripture)" },
    { id: "early", name: "Early church", sub: "writers of the first centuries", c: "var(--p-early)" },
    { id: "tradition", name: "Later tradition", sub: "apocryphal acts and legends", c: "var(--p-tradition)" },
    { id: "scholars", name: "Scholars' views", sub: "harmonies, commentaries, encyclopedias", c: "var(--p-scholars)" },
  ];
  const PHASES = ["Origins", "Called", "With Jesus", "Acts and letters", "The end"];
  const plateOf = (layer) => (layer === "scripture" || layer === "text" ? "scripture" : layer === "early-church" ? "early" : layer === "tradition" ? "tradition" : "scholars");
  // Where an open question sits on the life-line (our reading of what it is about).
  const Q_PHASE = { "peter-rome": 4, "peter-antioch": 3, "thaddaeus-judas": 0, "judas-brother-or-son": 0, "judas-jude": 0, "paul-voice": 1, "paul-release": 4, "paul-dates": 3 };
  const phaseOfRefs = (refs = [], fallback = 3) => { const b = refs.map((r) => bookOf(r[0])); return b.some((x) => x >= 40 && x <= 43) ? 2 : b.length ? 3 : fallback; };

  function collect() {
    const out = [];
    const add = (c, phase, from, title = "") => c && out.push({ c, phase, from, title, plate: plateOf(c.layer), id: out.length });
    if (P.home) add(P.home, 0, "Home");
    if (P.trade) add(P.trade, 0, "Trade");
    P.family.forEach((c) => add(c, 0, "Family"));
    P.identifications.forEach((c) => add(c, 0, "Names"));
    if (P.lists.length) add({ text: P.lists.map((l) => `${{ MAT: "Matthew 10", MRK: "Mark 3", LUK: "Luke 6", ACT: "Acts 1" }[l.book]}: number ${l.position}, “${l.name}”`).join("; ") + ".", layer: "scripture", refs: P.lists.map((l) => l.span) }, 1, "In the lists of the Twelve");
    P.calling.forEach((c) => { add({ text: c.quote.text, layer: "scripture", refs: [c.quote.span], quote: true }, 1, "The call", c.label); if (c.claim) add(c.claim, 1, "The call", c.label); });
    P.events.filter((e) => e.kind === "moment").forEach((e) => add({ text: e.label, layer: "scripture", refs: e.refs, moment: true }, e.callings.length ? 1 : e.movement === "gospels" ? 2 : 3, e.h ? `Moment · §${e.h.n}` : "Moment"));
    P.acts.forEach((c) => add(c, 3, "Acts and the letters"));
    P.companions.forEach((c) => add(c.claim, phaseOfRefs(c.claim.refs), "Companion", c.person.name));
    P.ending.scripture.forEach((c) => add(c, 4, "How the story ends"));
    P.ending.tradition.forEach((c) => add(c, 4, "How the story ends"));
    P.questions.forEach((q) => q.views.forEach((v) => add(v.argument, Q_PHASE[q.id] ?? phaseOfRefs(v.argument.refs, 4), "Open question", `${v.label} (${v.holders})`)));
    return out;
  }
  const claimCard = (x) => `<div class="sx-claim">${x.title ? `<h4>${esc(x.title)}</h4>` : ""}<p class="${x.c.quote ? "kjv-q" : ""}">${esc(x.c.text)}</p>${x.c.who ? `<span class="who">${esc(x.c.who)}${x.c.when ? `, ${esc(x.c.when)}` : ""}</span>` : ""}${claimFoot({ ...x.c, who: null })}</div>`;

  DIRECTIONS.strata = {
    name: "The strata", letter: "H", swatch: "#e0b25c",
    mount(main) {
      const items = collect();
      const byPlate = Object.fromEntries(PLATES.map((p) => [p.id, items.filter((x) => x.plate === p.id)]));
      const max = Math.max(...PLATES.map((p) => byPlate[p.id].length));
      let readPlate = "scripture", corePhase = 4, sel = null;
      const endS = byPlate.scripture.filter((x) => x.phase === 4).length, endUp = items.filter((x) => x.phase === 4 && x.plate !== "scripture" && x.from === "How the story ends").length;
      const scarce = isScarce() ? `<p class="sx-scarce"><b>Scripture tells little about him.</b> ${esc(P.notSaid[0])} At “The end”, Scripture's plate holds ${endS} ${endS === 1 ? "line" : "lines"}; the ${endUp} later ${endUp === 1 ? "report" : "reports"} of his last years all lie in the upper layers.</p>` : "";
      main.innerHTML = `<div class="sx-wrap">${topline()}
        <div class="sx-top">
          <div class="sx-hero"><p class="k">${icon("layers", 15)}H · The strata · ${esc(P.title)}</p>
            <h1 style="--fit: ${Math.round(330 / (P.first.length * .62))}px">${esc(P.first)}${P.name !== P.first ? `<small>${esc(P.name)}</small>` : ""}</h1>
            <p class="aka">${esc(P.otherNames.join(" · "))}</p><p class="tag">${esc(P.tagline)}</p>${scarce}</div>
            <div class="sx-side"><div class="sx-column"><div class="sx-bands" aria-hidden="true">${[...PLATES].reverse().map((p) => `<span class="sx-band" style="--c:${p.c}; flex: ${Math.max(1, byPlate[p.id].length)} 1 0"></span>`).join("")}</div>
              <div class="sx-band-labels">${[...PLATES].reverse().map((p) => `<button type="button" data-plate="${p.id}" style="--c:${p.c}"><span>${esc(p.name)}<small>${esc(p.sub)}</small></span><b>${byPlate[p.id].length}</b></button>`).join("")}</div></div>
            <div class="sx-writings">${P.writings.length ? P.writings.map((w) => `<a href="${writingHref(w)}">${icon("scroll", 15)}${esc(w.title)}</a>`).join("") : `<p>No book of the Bible bears his name.</p>`}</div>
            <div class="sx-spec glass" hidden></div></div>
          <div class="sx-stage" aria-label="The evidence as four stacked plates: drag to tilt and spin; click a plate or a dot">
            <span class="sx-hint">${icon("hand", 14)}Drag to tilt · click a plate · click a dot</span>
            <div class="sx-stack"></div>
            <div class="sx-ctl"><button type="button" data-view="stack" aria-pressed="true">Stack</button><button type="button" data-view="explode">Explode</button><button type="button" data-view="side">Cross-section</button>
              <label>${icon("layers", 14)}Spread <input type="range" min="0" max="100" value="45" aria-label="How far apart the plates are"></label></div>
          </div>
        </div>
        <section class="sx-sec"><header class="sx-sec-head"><span class="g">${icon("drill", 26)}</span><div><p class="k">Core sample</p><h2>Drill through every layer at one point</h2></div><p class="d">The beam in the stack marks the point. Scripture is the bottom row; what later writers said sits above it, each with who and when. They are never blended.</p></header>
          <div class="sx-chips" data-chips="phase">${PHASES.map((ph, k) => `<button type="button" data-phase="${k}" aria-pressed="${k === corePhase}">${esc(ph)}</button>`).join("")}</div><div class="sx-core"></div></section>
        <section class="sx-sec"><header class="sx-sec-head"><span class="g">${icon("layers", 26)}</span><div><p class="k">Read a plate</p><h2>Everything in one layer, along the life</h2></div></header>
          <div class="sx-chips" data-chips="plate">${PLATES.map((p) => `<button type="button" data-plate="${p.id}" style="--c:${p.c}" aria-pressed="${p.id === readPlate}"><i></i>${esc(p.name)} · ${byPlate[p.id].length}</button>`).join("")}</div><div class="sx-read"></div></section>
        <section class="sx-sec"><header class="sx-sec-head"><span class="g">${icon("help", 26)}</span><div><p class="k">Fault lines</p><h2>Where the layers disagree</h2></div><p class="d">Each open question, with every view coloured by the layer it comes from. The page gives no verdict.</p></header>
          <div class="sx-faults">${P.questions.map((q) => `<article class="sx-fault glass" style="--tone:${PLATES.find((p) => p.id === plateOf(q.views[0].argument.layer)).c}"><h3>${esc(q.question)}</h3><svg class="crack" viewBox="0 0 600 14" preserveAspectRatio="none"><path d="M0 7 L60 4 L95 10 L150 5 L210 9 L260 3 L330 10 L390 6 L440 11 L500 4 L560 8 L600 6" fill="none" stroke="var(--tone)" stroke-width="1.5"/></svg>
            <div class="views">${q.views.map((v) => `<div class="view" style="--c:${PLATES.find((p) => p.id === plateOf(v.argument.layer)).c}"><b>${esc(v.label)}</b><small>${esc(v.holders)}</small><p>${esc(v.argument.text)}</p>${claimFoot(v.argument)}</div>`).join("")}</div></article>`).join("")}</div></section>
        <section class="sx-sec"><header class="sx-sec-head"><span class="g">${icon("rest", 26)}</span><div><p class="k">Voids</p><h2>What the bedrock does not contain</h2></div></header><ul class="sx-voids">${P.notSaid.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></section>
        <section class="sx-sec"><header class="sx-sec-head"><span class="g">${icon("library", 26)}</span><div><p class="k">Sources</p><h2>Who we cite for the upper layers</h2></div></header>${sourceList("sx-src")}</section></div>`;

      const stage = main.querySelector(".sx-stage"), stack = main.querySelector(".sx-stack"), range = main.querySelector(".sx-ctl input");
      const st = { tilt: 60, spin: -28, spread: 45, raise: PLATES.map(() => 0), up: -1 };
      let pw = 0, ph = 0;
      // ── Build the plates (dots placed by phase, in a small grid rising from the life-line) ──
      function build() {
        const w = stage.getBoundingClientRect().width;
        pw = Math.round(Math.min(800, w * (w < 760 ? .8 : .66))); ph = Math.round(pw * .42);
        stack.style.setProperty("--pw", `${pw}px`); stack.style.setProperty("--ph", `${ph}px`);
        const cellW = 92 / PHASES.length;
        stack.innerHTML = PLATES.map((p, i) => {
          const dots = [];
          PHASES.forEach((_, k) => {
            const list = byPlate[p.id].filter((x) => x.phase === k), cols = 6, colW = (cellW - 3) / cols;
            const rowH = Math.min(7, 54 / Math.max(1, Math.ceil(list.length / cols)));
            list.forEach((x, n) => { const left = 4 + k * cellW + 1.5 + (n % cols + .5) * colW, top = 70 - 5 - Math.floor(n / cols) * rowH; dots.push(`<button type="button" class="sx-dot ${x.c.quote ? "is-quote" : x.c.layer === "text" ? "is-text" : ""} ${sel === x.id ? "is-sel" : ""}" data-claim="${x.id}" style="left:${left.toFixed(2)}%; top:${top.toFixed(2)}%" aria-label="${esc(x.from)}: ${esc(x.c.text.slice(0, 80))}"></button>`); });
          });
          const ticks = PHASES.map((name, k) => { const x = 4 + (k + .5) * cellW; return `<i class="tk" style="left:${x}%"></i><span class="ph" style="left:${x}%">${esc(name)}</span>`; }).join("");
          return `<div class="sx-plate" data-plate="${p.id}" data-i="${i}" style="--c:${p.c}"><span class="lab">${String(i + 1).padStart(2, "0")} ${esc(p.name)}<small>${byPlate[p.id].length} ${byPlate[p.id].length === 1 ? "claim" : "claims"}</small></span><span class="line"></span>${ticks}${dots.join("")}${byPlate[p.id].length ? "" : `<span class="sx-empty">Nothing in this layer</span>`}<span class="sx-ring"></span></div>`;
        }).join("") + `<span class="sx-beam"></span>`;
        apply();
      }
      // ── Apply the view (tilt, spin, spread, raised plate, core beam) ──
      function apply() {
        const gap = ph * (.06 + .9 * st.spread / 100);
        const lift = (1.15 * gap + Math.max(...st.raise) * .5) * Math.sin((st.tilt * Math.PI) / 180);
        stack.style.transform = `translateY(${lift.toFixed(1)}px) rotateX(${st.tilt.toFixed(2)}deg) rotateZ(${st.spin.toFixed(2)}deg)`;
        stack.querySelectorAll(".sx-plate").forEach((el, i) => {
          el.style.transform = `translateZ(${(i * gap + st.raise[i]).toFixed(1)}px)`;
          el.classList.toggle("is-up", st.up === i); el.classList.toggle("is-dim", st.up >= 0 && st.up !== i);
        });
        const cellW = 92 / PHASES.length, xPct = 4 + (corePhase + .5) * cellW;
        const beam = stack.querySelector(".sx-beam"), top = Math.max(...st.raise) + 3 * gap + 30;
        beam.style.left = `${(((xPct / 100) - .5) * pw).toFixed(1)}px`; beam.style.top = `${((.7 - .5) * ph).toFixed(1)}px`;
        beam.style.height = `${top.toFixed(1)}px`; beam.style.transform = `translateZ(-14px) rotateX(90deg)`;
        stack.querySelectorAll(".sx-ring").forEach((r) => { r.style.left = `${xPct}%`; r.style.top = "70%"; });
        main.querySelectorAll(".sx-ctl [data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
        range.value = String(Math.round(st.spread));
      }
      // ── Tweens through Clock (the ticker's main animation) ──
      let view = "stack";
      const VIEWS = { stack: { tilt: 60, spin: -28, spread: 45 }, explode: { tilt: 56, spin: -22, spread: 100 }, side: { tilt: 84, spin: -2, spread: 52 } };
      function tween(to, label, upIndex = -1) {
        const from = { tilt: st.tilt, spin: st.spin, spread: st.spread, raise: [...st.raise] };
        const gapTo = ph * (.06 + .9 * to.spread / 100);
        const raiseTo = PLATES.map((_, i) => (i === upIndex ? (PLATES.length - 1 - i) * gapTo + ph * .6 : 0)); // clear of the top plate
        st.up = upIndex;
        Clock.run({
          label, duration: 900,
          frame(p) { const e = easeInOut(p); st.tilt = from.tilt + (to.tilt - from.tilt) * e; st.spin = from.spin + (to.spin - from.spin) * e; st.spread = from.spread + (to.spread - from.spread) * e; st.raise = from.raise.map((r, i) => r + (raiseTo[i] - r) * e); apply(); },
          moving: () => ["the stack, turning", upIndex >= 0 ? `the ${PLATES[upIndex].name} plate, rising` : ""].filter(Boolean),
        });
      }
      function focusPlate(id) {
        const i = PLATES.findIndex((p) => p.id === id);
        if (st.up === i) { view = "stack"; tween(VIEWS.stack, "The plate goes back into the stack"); return; }
        view = "focus"; tween({ tilt: 30, spin: -8, spread: 55 }, `The ${PLATES[i].name} plate comes up`, i);
        setRead(id);
      }
      // ── Panels below ──
      function renderCore() {
        main.querySelector(".sx-core").innerHTML = [...PLATES].reverse().map((p) => {
          const list = byPlate[p.id].filter((x) => x.phase === corePhase);
          return `<div class="sx-core-row" style="--c:${p.c}"><h3>${esc(p.name)}<small>${list.length} at “${esc(PHASES[corePhase])}”</small></h3><div class="items">${list.length ? list.map(claimCard).join("") : `<p class="none">Nothing in this layer at this point of the life.</p>`}</div></div>`;
        }).join("");
      }
      function setRead(id) {
        readPlate = id;
        main.querySelectorAll('[data-chips="plate"] button').forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.plate === id)));
        const p = PLATES.find((x) => x.id === id);
        main.querySelector(".sx-read").innerHTML = PHASES.map((ph2, k) => { const list = byPlate[id].filter((x) => x.phase === k); return `<div class="sx-read-col" style="--c:${p.c}"><h3>${esc(ph2)} <small>${list.length}</small></h3>${list.length ? list.map(claimCard).join("") : `<p class="none">Nothing here.</p>`}</div>`; }).join("");
      }
      function showSpec(id) {
        sel = id;
        const x = items[id], p = PLATES.find((q) => q.id === x.plate), spec = main.querySelector(".sx-spec");
        spec.hidden = false; spec.style.setProperty("--c", p.c);
        spec.innerHTML = `<h3>${icon("layers", 13)}${esc(p.name)} · ${esc(PHASES[x.phase])} · ${esc(x.from)}</h3>${claimCard(x)}`;
        stack.querySelectorAll(".sx-dot.is-sel").forEach((d) => d.classList.remove("is-sel"));
        stack.querySelector(`[data-claim="${id}"]`)?.classList.add("is-sel");
      }
      // ── Interaction ──
      let drag = null;
      stage.addEventListener("pointerdown", (e) => { if (e.target.closest(".sx-ctl")) return; drag = { x: e.clientX, y: e.clientY, tilt: st.tilt, spin: st.spin, moved: false }; stage.setPointerCapture(e.pointerId); });
      stage.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) > 5) { drag.moved = true; stage.classList.add("is-dragging"); Clock.stop(); }
        if (!drag.moved) return;
        st.spin = drag.spin + dx * .35; st.tilt = Math.max(0, Math.min(86, drag.tilt - dy * .3)); view = "free"; apply();
      });
      const up = (e) => {
        if (!drag) return;
        const wasDrag = drag.moved; drag = null; stage.classList.remove("is-dragging");
        if (wasDrag) return;
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const dot = target?.closest("[data-claim]"), plate = target?.closest(".sx-plate");
        if (dot) showSpec(Number(dot.dataset.claim)); else if (plate) focusPlate(plate.dataset.plate);
      };
      stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", () => { drag = null; stage.classList.remove("is-dragging"); });
      range.addEventListener("input", () => { st.spread = Number(range.value); view = "free"; apply(); });
      main.addEventListener("click", (e) => {
        const v = e.target.closest(".sx-ctl [data-view]");
        if (v) { view = v.dataset.view; tween(VIEWS[view], { stack: "The plates settle into a stack", explode: "The stack explodes", side: "The stack turns to a cross-section" }[view]); return; }
        const ph2 = e.target.closest("[data-phase]");
        if (ph2) { corePhase = Number(ph2.dataset.phase); main.querySelectorAll("[data-phase]").forEach((b) => b.setAttribute("aria-pressed", String(b === ph2))); renderCore(); apply(); return; }
        const pl = e.target.closest(".sx-chips [data-plate], .sx-band-labels [data-plate]");
        if (pl) { if (pl.closest(".sx-band-labels")) focusPlate(pl.dataset.plate); else setRead(pl.dataset.plate); }
      });
      build(); renderCore(); setRead(readPlate);
      // The opening: the plates fall into place, bedrock first.
      const fall = PLATES.map((_, i) => ph * 3 + i * ph * .8);
      Clock.run({
        label: "The plates settle into a stack, Scripture first", duration: 1300,
        frame(p) { st.raise = fall.map((f, i) => f * (1 - easeOut(span01(p, i * .14, .45 + i * .14)))); stack.querySelectorAll(".sx-plate").forEach((el, i) => { const q = span01(p, i * .14, .25 + i * .14); el.style.opacity = q >= 1 ? "" : String(q); }); apply(); },
        moving: (p) => PLATES.filter((_, i) => p > i * .14 && p < .45 + i * .14).map((x) => `the ${x.name} plate, falling`),
      });
      const ro = new ResizeObserver(() => { const w = Math.round(stage.getBoundingClientRect().width); if (w && Math.abs(Math.min(800, w * (w < 760 ? .8 : .66)) - pw) > 2) build(); });
      ro.observe(stage);
      return () => ro.disconnect();
    },
  };
})();
