// The opening and section 01. Each reading stands alone on the land, one at a time and large: sky is what is promised and what it
// leaves open, the hills are that reading's own view, and the ground is what it asks now. A reading opens below, in one column.
(() => {
  if (!window.HZ) return;
  const { h, art, refLink, runs, plain, state, setView, onView, page, sectionHead, blockView, reducedMotion, SCENES, HILLS } = HZ;
  const { study, passages, numbers } = HP;
  const QUESTIONS = [
    ["up", "Look up", "What is promised", "promised"],
    ["out", "Look out", "What it leaves open", "open"],
    ["down", "Look down", "What it asks now", "asks"],
  ];
  const [PROMISED, LEFT_OPEN, ASKED] = QUESTIONS.map((question) => question[2]);
  const titleParts = (reading) => reading.title.split(": ");
  const titleOf = (reading) => { const [first, turn] = titleParts(reading); return [`${first}: `, h("em", {}, turn)]; };

  // ── The heading: sky, hills, ground, as at the close ──
  const motto = plain(study.motto).split(" / ");
  const hero = h("header", { class: "hz-hero", id: "top" },
    h("div", { class: "hz-hero-sky" },
      h("nav", { class: "hz-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=doctrine" }, "God & Christian Faith"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "hz-here", "aria-current": "page" }, study.title)),
      h("p", { class: "hz-concepts" }, plain(study.concepts)),
      h("h1", {}, "The hope", h("em", {}, "to come"))),
    h("div", { class: "hz-hero-far" }, art(HILLS, "hz-hills"), h("p", { class: "hz-motto" }, motto[0], h("span", {}, motto[1]))),
    h("div", { class: "hz-hero-ground" },
      h("p", { class: "hz-lede" }, runs(study.lead)),
      h("figure", { class: "hz-opening" },
        h("blockquote", {}, study.opening.t),
        h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible"))));

  // ── The six stops along the horizon ──
  const stops = new Map();
  const question = (label, runList, kind) => h("div", { class: `hz-q hz-q-${kind}` }, h("span", { class: "hz-q-label" }, label), h("p", {}, runs(runList)));
  const stageStops = study.readings.map((reading) => {
    const parts = reading.read.map((id) => passages[id].label);
    const open = h("a", { class: "hz-open", href: `?reading=${reading.slug}`, "data-reading": reading.slug, "aria-expanded": "false", "aria-controls": "hz-reading" }, h("span", { class: "hz-open-text" }, "Open the reading"), h("span", { "aria-hidden": "true" }, " ↓"));
    const stop = h("article", { class: "hz-stop", "data-at": reading.slug },
      h("div", { class: "hz-stop-sky" },
        h("header", {},
          h("p", { class: "hz-kind" }, "Reading ", h("b", {}, `${reading.n} / ${String(study.readings.length).padStart(2, "0")}`)),
          h("h3", {}, titleOf(reading))),
        h("div", { class: "hz-stop-questions" }, question(PROMISED, reading.promised, "sky"), question(LEFT_OPEN, reading.open, "haze"))),
      art(SCENES[reading.slug], "hz-view"),
      h("div", { class: "hz-stop-ground" },
        question(ASKED, reading.asks, "ground"),
        h("div", { class: "hz-stop-foot" },
          h("p", { class: "hz-hook" }, runs(reading.hook)),
          h("p", { class: "hz-verses" }, `${reading.verseCount} verses · ${parts.join(" · ")}`),
          open)));
    stops.set(reading.slug, { stop, open });
    return stop;
  });
  const railButtons = new Map(study.readings.map((reading) => [reading.slug,
    h("button", { type: "button", class: "hz-rail-stop", "aria-pressed": "false", onclick: () => moveTo(reading.slug) }, h("span", { class: "hz-rail-n" }, reading.n), h("span", { class: "hz-rail-name" }, titleParts(reading)[0]))]));
  const rail = h("nav", { class: "hz-rail", "aria-label": "The six readings" }, [...railButtons.values()]);
  const panel = h("section", { class: "hz-dig", id: "hz-reading", hidden: true });
  const currentStop = () => state.reading ?? state.at ?? study.readings[0].slug;
  function moveTo(slug) { setView({ at: slug, reading: state.reading ? slug : null }); }

  // ── One question asked of all six ──
  const askButtons = QUESTIONS.map(([key, verb, words]) => h("button", { type: "button", class: "hz-ask", "aria-pressed": "false", "data-look": key, onclick: () => setView({ look: key }) }, h("b", {}, verb), h("span", {}, words)));
  const askList = h("ol", { class: "hz-asks" });
  const askBand = h("section", { class: "hz-ask-band", "data-look": "up", "aria-label": "One question asked of all six readings" },
    h("h3", {}, "Ask one question of all six."),
    h("div", { class: "hz-ask-row" }, askButtons),
    askList);
  function syncAsk() {
    const current = QUESTIONS.find(([key]) => key === (state.look ?? "up"));
    askBand.dataset.look = current[0];
    askButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.look === current[0])));
    askList.replaceChildren(...study.readings.map((reading) => h("li", {}, h("span", { class: "hz-asks-who" }, h("b", {}, reading.n), titleParts(reading)[0]), h("p", {}, runs(reading[current[3]])))));
  }

  const figures = [
    ["Readings", numbers.readings, "each opens where it sits, and each starts with its passage"],
    ["Verses walked", numbers.verses, "each counted once, in the Berean"],
    ["Promise and call", numbers.rows, `joined in the verse itself; ${numbers.saysTherefore} say therefore. Chosen for the pattern, not a count of it`],
    ["First and last pages", numbers.bookends, `${numbers.shares} share a word, ${numbers.echoes} are this study's matching`],
    ["The thousand years", numbers.thousandVerses, "verses, all in Revelation 20, the only place the Bible ties those years to a reign"],
  ];
  page.append(hero, h("section", { class: "hz-readings", id: "readings" },
    h("div", { class: "hz-sec hz-sec-tight" }, sectionHead("01", "Six readings.", "Three questions each.", runs(study.frame))),
    rail,
    h("div", { class: "hz-stage" }, stageStops),
    panel,
    askBand,
    h("div", { class: "hz-under" },
      h("dl", { class: "hz-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
      h("div", { class: "hz-under-notes" },
        h("p", {}, h("b", {}, "How to read this page: "), "gold-referenced lines set apart are Scripture, in the Berean. Plain text is written by this site from Scripture. Outside sources are named, with what was read. An application is called an application. The numbers mark the order of the readings, not levels of difficulty."),
        h("p", {}, runs(study.selection))))));

  // ── A reading, in one column ──
  // Reading 02's four pairs, set either side of a line. Every word is checked against the study's own paragraph.
  const PAIRS = [["perishable", "imperishable"], ["dishonor", "glory"], ["weakness", "power"], ["a natural body", "a spiritual body"]];
  function sownRaised(paragraph) {
    const text = plain(paragraph.runs);
    PAIRS.flat().forEach((word) => { if (!text.includes(`"${word}"`)) console.error(`The hope to come: "${word}" is not quoted in the sown and raised paragraph`); });
    return h("figure", { class: "hz-pairs" },
      h("div", { class: "hz-pairs-row" }, h("span", { class: "hz-pairs-label" }, "Raised"), PAIRS.map(([, raised]) => h("b", {}, raised))),
      h("div", { class: "hz-pairs-row hz-pairs-sown" }, h("span", { class: "hz-pairs-label" }, "Sown"), PAIRS.map(([sown]) => h("span", {}, sown))),
      h("figcaption", {}, refLink("1CO.15.42-44", "1 Corinthians 15:42–44"), " · the four pairs, as Paul sets them"));
  }
  function partBody(reading, part) {
    return part.blocks.flatMap((block) => {
      const view = blockView[block.k](block);
      return reading.slug === "raised" && part.title === "What you sow" && block.k === "p" && plain(block.runs).includes("four pairs") ? [view, sownRaised(block)] : [view];
    });
  }
  function drawPanel(reading) {
    const next = study.readings[(study.readings.indexOf(reading) + 1) % study.readings.length];
    const closeButton = h("button", { type: "button", class: "hz-dig-close", "aria-label": `Close the reading: ${reading.title}`, onclick: () => setReading(null, true) });
    closeButton.append(art(icon("x", 20)));
    panel.replaceChildren(
      h("header", { class: "hz-dig-head" },
        h("div", {},
          h("p", { class: "hz-kind" }, "Reading ", h("b", {}, reading.n)),
          h("h3", { tabindex: "-1", id: "hz-reading-title" }, titleOf(reading))),
        h("div", { class: "hz-dig-begin" },
          h("p", {}, h("span", {}, "Begin with the passage: "), reading.read.flatMap((id, i) => [i ? " · " : null, refLink(id, passages[id].label)])),
          h("p", {}, h("span", {}, "Its setting: "), runs(reading.setting))),
        closeButton),
      h("div", { class: "hz-dig-text" }, reading.parts.map((part) => h("div", { class: "hz-part" }, h("h4", {}, part.title), partBody(reading, part)))),
      h("div", { class: "hz-prompts" },
        h("div", {}, h("h4", {}, "Look closely"), h("p", {}, runs(reading.look))),
        h("div", {}, h("h4", {}, "Your response"), h("p", {}, runs(reading.response)))),
      h("footer", { class: "hz-dig-foot" },
        h("button", { type: "button", onclick: () => setReading(next.slug, false) }, `Next: ${next.title} →`),
        h("button", { type: "button", onclick: () => setReading(null, true) }, "Close this reading ↑")));
  }
  let drawnReading = null;
  function syncStage() {
    const at = currentStop();
    for (const [slug, { stop, open }] of stops) {
      const here = slug === at, reading = slug === state.reading;
      stop.classList.toggle("is-here", here);
      railButtons.get(slug).setAttribute("aria-pressed", String(here));
      open.setAttribute("aria-expanded", String(reading));
      open.querySelector(".hz-open-text").textContent = reading ? "Reading now · close" : "Open the reading";
    }
    if (state.reading === drawnReading) return;
    drawnReading = state.reading;
    if (state.reading) {
      drawPanel(study.readings.find((r) => r.slug === state.reading));
      panel.hidden = false;
    } else {
      panel.hidden = true;
      panel.replaceChildren();
    }
  }
  function setReading(slug, returnFocus) {
    const previous = state.reading;
    setView({ reading: slug, at: slug ?? previous });
    if (slug) {
      document.getElementById("hz-reading-title")?.focus({ preventScroll: true });
      panel.scrollIntoView({ block: "start", behavior: reducedMotion.matches ? "auto" : "smooth" });
    } else if (returnFocus && previous) {
      const { open } = stops.get(previous);
      open.focus({ preventScroll: true });
      open.scrollIntoView({ block: "center" });
    }
  }
  document.querySelector(".hz-stage").addEventListener("click", (event) => {
    const link = event.target.closest("a.hz-open");
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    setReading(state.reading === link.dataset.reading ? null : link.dataset.reading, true);
  });
  addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !state.sheet && state.reading && panel.contains(document.activeElement)) { event.preventDefault(); setReading(null, true); }
  });
  onView(syncStage);
  onView(syncAsk);
  syncStage();
  syncAsk();
})();
