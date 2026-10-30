// The opening and section 01. Each reading stands alone on the land, one at a time and large: sky is what is promised and what it
// leaves open, the hills are that reading's own view, and the ground is what it asks now. A reading opens below, in one column.
(() => {
  if (!window.HZ) return;
  const { h, art, refLink, runs, plain, state, setView, onView, page, sectionHead, blockView, reducedMotion, SCENES, HILLS, LINE_ART } = HZ;
  const { study, passages, numbers } = HP;
  const QUESTIONS = [
    ["up", "Look up", "What is promised", "promised"],
    ["out", "Look out", "What it leaves open", "open"],
    ["down", "Look down", "What it asks now", "asks"],
  ];
  const [PROMISED, LEFT_OPEN, ASKED] = QUESTIONS.map((question) => question[2]);
  const titleParts = (reading) => reading.title.split(": ");
  const titleOf = (reading) => { const [first, turn] = titleParts(reading); return [`${first}: `, h("em", {}, turn)]; };

  // The band at the foot of the first screen. Every phrase is the verses' own wording, checked below; all of it is also in section 02.
  const MARQUEE = ["You also must be ready", "Keep watch", "Always excel in the work of the Lord", "Stand firm in the Lord", "Encourage one another", "Make every effort to be found at peace", "Be patient and strengthen your hearts", "We will always be with the Lord", "We will be like Him", "A new heaven and a new earth", "Behold, I make all things new"];
  function marquee() {
    const said = [study.opening.t, ...HP.therefore.flatMap((row) => [row.callText, row.promiseText])].join(" | ").toLowerCase();
    MARQUEE.filter((words) => !said.includes(words.toLowerCase())).forEach((words) => console.error(`The hope to come: marquee phrase not in the verses: "${words}"`));
    const run = () => h("div", { class: "hz-marquee-run" }, MARQUEE.map((words) => h("span", {}, words)));
    return h("div", { class: "hz-marquee", "aria-hidden": "true" }, h("div", { class: "hz-marquee-track" }, run(), run()));
  }

  // ── The heading: sky, then the land down to the foot of the screen ──
  const motto = plain(study.motto).split(" / ");
  const hero = h("header", { class: "hz-hero", id: "top" },
    h("div", { class: "hz-hero-sky" },
      h("nav", { class: "hz-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=doctrine" }, "God & Christian Faith"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "hz-here", "aria-current": "page" }, study.title)),
      h("div", { class: "hz-hero-title" },
        h("p", { class: "hz-concepts" }, plain(study.concepts)),
        h("h1", {}, "The hope", h("em", {}, "to come")),
        h("figure", { class: "hz-opening" },
          h("blockquote", {}, study.opening.t),
          h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible"))),
      art(LINE_ART, "hz-hero-art")),
    h("div", { class: "hz-hero-far" },
      art(HILLS, "hz-hills"),
      h("div", { class: "hz-hero-lay" },
        h("p", { class: "hz-lede" }, runs(study.lead)),
        h("p", { class: "hz-motto" }, motto[0], h("span", {}, motto[1])))),
    marquee());

  // The lead fills the land from just under the hill's edge to just above the marquee: the largest size that fits, then its lines spaced to fill the rest.
  const lede = hero.querySelector(".hz-lede"), lay = lede.parentElement;
  function spreadLede() {
    lede.style.fontSize = lede.style.lineHeight = "";
    if (getComputedStyle(lay).flexDirection === "column") return;
    lede.style.fontSize = "15px";
    lede.style.lineHeight = "1.2";
    const style = getComputedStyle(lede), room = lay.clientHeight - parseFloat(getComputedStyle(lay).paddingTop) - parseFloat(style.marginTop) - parseFloat(style.marginBottom);
    let size = 21.6;
    for (; size > 15; size -= .4) {
      lede.style.fontSize = `${size}px`;
      lede.style.lineHeight = `${size * 1.6}px`;
      if (lede.offsetHeight <= room) break;
    }
    const lines = Math.round(lede.offsetHeight / (size * 1.6));
    lede.style.lineHeight = `${Math.min(room / lines, size * 2.3)}px`;
  }
  requestAnimationFrame(spreadLede);
  document.fonts?.ready.then(spreadLede);
  addEventListener("resize", spreadLede);

  // ── The six stops along the horizon ──
  const stops = new Map();
  const ROMAN = ["I", "II", "III", "IV", "V", "VI"];
  const romanOf = (reading) => ROMAN[Number(reading.n) - 1];
  const question = (label, runList, kind) => h("div", { class: `hz-q hz-q-${kind}` }, h("span", { class: "hz-q-label" }, label), h("p", {}, runs(runList)));
  const stageStops = study.readings.map((reading) => {
    const parts = reading.read.map((id) => passages[id].label);
    const open = h("a", { class: "hz-open", href: `?reading=${reading.slug}`, "data-reading": reading.slug, "aria-expanded": "false", "aria-controls": "hz-reading" }, h("span", { class: "hz-open-text" }, "Open the reading"), h("span", { "aria-hidden": "true" }, " ↓"));
    const stop = h("article", { class: "hz-stop", "data-at": reading.slug },
      h("div", { class: "hz-roman", "aria-hidden": "true" }, romanOf(reading)),
      h("div", { class: "hz-stop-sky" },
        h("header", {},
          h("p", { class: "hz-kind" }, "Reading ", h("b", {}, romanOf(reading))),
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
    h("button", { type: "button", class: "hz-rail-stop", "aria-pressed": "false", onclick: () => moveTo(reading.slug) }, h("span", { class: "hz-rail-n" }, romanOf(reading)), h("span", { class: "hz-rail-name" }, titleParts(reading)[0]))]));
  const rail = h("nav", { class: "hz-rail", "aria-label": "The six readings" }, [...railButtons.values()]);
  const panel = h("section", { class: "hz-dig", id: "hz-reading", hidden: true });
  const currentStop = () => state.reading ?? state.at ?? study.readings[0].slug;
  // The arrows at each end of the bar, which stays in sight while a reading is scrolled.
  const slugs = study.readings.map((reading) => reading.slug);
  const stepBy = (step) => moveTo(slugs[slugs.indexOf(currentStop()) + step]);
  const previousStep = h("button", { type: "button", class: "hz-slide-arrow", onclick: () => stepBy(-1) }, h("span", { "aria-hidden": "true" }, "←"));
  const nextStep = h("button", { type: "button", class: "hz-slide-arrow", onclick: () => stepBy(1) }, h("span", { "aria-hidden": "true" }, "→"));
  const railBar = h("div", { class: "hz-rail-bar" }, previousStep, rail, nextStep);
  let readingsBar = railBar;
  // After a move from further down a reading, the new reading starts at its top, just under the bar.
  function moveTo(slug) {
    setView({ at: slug, reading: state.reading ? slug : null });
    const gap = document.querySelector(".hz-stage").getBoundingClientRect().top - (readingsBar ? readingsBar.getBoundingClientRect().bottom : 76);
    if (gap < 0) scrollBy(0, gap);
  }
  Object.assign(HZ, { romanOf, moveTo, stepBy, currentStop, setReadingsBar: (bar) => { readingsBar = bar; } });

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
    askList.replaceChildren(...study.readings.map((reading) => h("li", {}, h("span", { class: "hz-asks-who" }, h("b", {}, romanOf(reading)), titleParts(reading)[0]), h("p", {}, runs(reading[current[3]])))));
  }

  // The sun rising behind the section's opening words, drawn like the one behind the city in the heading.
  const RISING_SUN = (() => {
    const [cx, cy] = [800, 600], rays = [[], []], circle = (name, r) => `<circle class="${name}" cx="${cx}" cy="${cy}" r="${r}"/>`;
    for (let i = 0; i < 96; i += 1) {
      const angle = (i * Math.PI * 2) / 96, cos = Math.cos(angle), sin = Math.sin(angle);
      const edge = 1 / Math.hypot(cos / 780, sin / 470), reach = Math.min(edge, i % 8 === 0 ? 900 : i % 4 === 0 ? 700 : i % 2 === 0 ? 420 : 270);
      rays[i % 4 === 0 ? 0 : 1].push(`M${(cx + cos * 131).toFixed(1)} ${(cy + sin * 131).toFixed(1)}L${(cx + cos * reach).toFixed(1)} ${(cy + sin * reach).toFixed(1)}`);
    }
    return `<svg viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path class="ln-gold hz-rise-long" d="${rays[0].join("")}"/><path class="ln-gold hz-rise-fine" d="${rays[1].join("")}"/>${circle("ln-sun", 110)}${circle("ln-gold", 110)}${circle("ln-gold ln-faint", 122)}${circle("ln-ring", 175)}${circle("ln-ring", 244)}${circle("ln-ring", 315)}</svg>`;
  })();
  const figures = [
    ["Readings", numbers.readings, "each opens where it sits, and each starts with its passage"],
    ["Verses walked", numbers.verses, "each counted once, in the Berean"],
    ["Promise and call", numbers.rows, `joined in the verse itself; ${numbers.saysTherefore} say therefore. Chosen for the pattern, not a count of it`],
    ["First and last pages", numbers.bookends, `${numbers.shares} share a word, ${numbers.echoes} are this study's matching`],
    ["The thousand years", numbers.thousandVerses, "verses, all in Revelation 20, the only place the Bible ties those years to a reign"],
  ];
  page.append(hero, h("section", { class: "hz-readings", id: "readings" },
    h("header", { class: "hz-rise" },
      art(RISING_SUN, "hz-rise-rays"),
      h("div", { class: "hz-rise-words" },
        h("span", { class: "hz-num", "aria-hidden": "true" }, "01"),
        h("h2", {}, "A bright and shining hope.", " ", h("em", {}, "The promise of an eternal King.")),
        h("p", {}, "The King is coming back. The grave will give up its dead. Everything wrong will be put right, and God will live with His people. Six passages, taken one at a time, show what that hope is and what it asks of you today."))),
    h("div", { class: "hz-slider" }, railBar, h("div", { class: "hz-stage" }, stageStops)),
    panel,
    askBand,
    h("div", { class: "hz-under" },
      h("dl", { class: "hz-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
      h("div", { class: "hz-under-notes" },
        h("p", {}, h("b", {}, "How to read this page: "), "gold-referenced lines set apart are Scripture, in the Berean. Plain text is written by this site from Scripture. Outside sources are named, with what was read. An application is called an application. The numbers mark the order of the readings, not levels of difficulty."),
        h("p", {}, runs(study.frame)),
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
          h("p", { class: "hz-kind" }, "Reading ", h("b", {}, romanOf(reading))),
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
    const at = currentStop(), place = slugs.indexOf(at);
    previousStep.disabled = place === 0;
    nextStep.disabled = place === slugs.length - 1;
    previousStep.setAttribute("aria-label", place ? `Previous reading: ${study.readings[place - 1].title}` : "Previous reading");
    nextStep.setAttribute("aria-label", place < slugs.length - 1 ? `Next reading: ${study.readings[place + 1].title}` : "Next reading");
    for (const [slug, { stop, open }] of stops) {
      const here = slug === at, reading = slug === state.reading;
      stop.classList.toggle("is-here", here);
      stop.style.setProperty("--slide", slugs.indexOf(slug) - place);
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
  // A sideways swipe on a phone moves between readings; an up-and-down one still scrolls the page.
  let swipeFrom = null;
  const stage = document.querySelector(".hz-stage");
  stage.addEventListener("touchstart", ({ touches }) => { swipeFrom = touches.length === 1 ? touches[0] : null; }, { passive: true });
  stage.addEventListener("touchend", ({ changedTouches: [end] }) => {
    if (!swipeFrom) return;
    const across = end.clientX - swipeFrom.clientX, down = end.clientY - swipeFrom.clientY, place = slugs.indexOf(currentStop()) + (across < 0 ? 1 : -1);
    swipeFrom = null;
    if (Math.abs(across) > 60 && Math.abs(across) > Math.abs(down) * 1.5 && slugs[place]) moveTo(slugs[place]);
  }, { passive: true });
  addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !state.sheet && state.reading && panel.contains(document.activeElement)) { event.preventDefault(); setReading(null, true); }
  });
  onView(syncStage);
  onView(syncAsk);
  syncStage();
  syncAsk();
})();
