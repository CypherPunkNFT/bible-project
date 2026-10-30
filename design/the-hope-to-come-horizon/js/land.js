// The opening and section 01: one land seen from one place. Sky is what is promised, the far haze is what is left open, the
// ground under the reader's feet is what is asked now. The six readings stand along it, and a reading opens below ground.
(() => {
  if (!window.HZ) return;
  const { h, art, refLink, runs, plain, state, setView, onView, page, sectionHead, blockView, reducedMotion } = HZ;
  const { study, passages, numbers } = HP;

  // Furrows run to one vanishing point on the horizon. Fixed drawing, stretched to the ground's size.
  const furrowLines = [];
  for (let x = -5200; x <= 6200; x += 260) furrowLines.push(`<path d="M500 0L${x} 100"/>`);
  const FURROWS = `<svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">${furrowLines.join("")}</svg>`;
  const skyLines = [];
  for (let i = 0, y = 97; i < 8; i += 1, y -= 1.6 + i * .9) skyLines.push(`<path d="M0 ${y.toFixed(1)}H1000"/>`);
  const SKY = `<svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">${skyLines.join("")}</svg>`;

  // One far ridge along the horizon, so the sky meets land and not a ruled line.
  const RIDGE = `<svg viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40V30C60 22 110 26 170 19S290 12 350 22 470 33 540 24 640 8 720 15 840 30 900 23 970 18 1000 24V40Z"/></svg>`;

  const GAZE = [
    ["up", "Look up", "What is promised"],
    ["out", "Look out", "What it leaves open"],
    ["down", "Look down", "What it asks now"],
  ];
  const gazeButtons = new Set();
  const gazeButton = ([key, verb, question], rowClass) => {
    const button = h("button", { type: "button", class: `hz-gaze ${rowClass}`, "aria-pressed": "false", "data-look": key, onclick: () => turnGaze(state.look === key ? null : key) },
      h("b", {}, verb), h("span", {}, question));
    gazeButtons.add(button);
    return button;
  };
  function turnGaze(look) {
    const apply = () => setView({ look });
    if (document.startViewTransition && !reducedMotion.matches) document.startViewTransition(apply);
    else apply();
  }

  // ── The heading, standing in the sky ──
  const motto = plain(study.motto).split(" / ");
  const hero = h("div", { class: "hz-hero", id: "top" },
    h("div", { class: "hz-hero-main" },
      h("nav", { class: "hz-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=doctrine" }, "God & Christian Faith"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "hz-here", "aria-current": "page" }, study.title)),
      h("p", { class: "hz-concepts" }, plain(study.concepts)),
      h("h1", {}, "The hope", h("em", {}, "to come"))),
    h("div", { class: "hz-hero-strip", "aria-hidden": "true" }, art(RIDGE, "hz-ridge"), art(FURROWS, "hz-furrows")),
    h("p", { class: "hz-lede" }, runs(study.lead)),
    h("div", { class: "hz-hero-side" },
      h("figure", { class: "hz-opening" },
        h("blockquote", {}, study.opening.t),
        h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible")),
      h("p", { class: "hz-motto" }, motto[0], h("span", {}, motto[1]))));

  // ── The land itself: six readings along one horizon ──
  const columns = new Map();
  const scene = h("div", { class: "hz-scene", "data-look": state.look ?? "level" },
    h("div", { class: "hz-band-sky" }, art(SKY, "hz-skylines")),
    h("div", { class: "hz-band-haze" }, art(RIDGE, "hz-ridge")),
    h("div", { class: "hz-band-ground" }, art(FURROWS, "hz-furrows")),
    h("div", { class: "hz-horizon", "aria-hidden": "true" }),
    gazeButton(GAZE[0], "hz-row-sky"), gazeButton(GAZE[1], "hz-row-haze"), gazeButton(GAZE[2], "hz-row-ground"),
    study.readings.map((reading, index) => {
      const parts = reading.read.map((id) => passages[id].label);
      const open = h("a", { class: "hz-open", href: `?reading=${reading.slug}`, "data-reading": reading.slug, "aria-expanded": "false", "aria-controls": "hz-reading" }, h("span", { class: "hz-open-text" }, "Open the reading"), h("span", { "aria-hidden": "true" }, " ↓"));
      const column = h("article", { class: "hz-column", style: `--i:${index}` },
        h("header", { class: "hz-column-head" },
          h("span", { class: "hz-kind" }, "Reading ", h("b", {}, `${reading.n} / ${String(study.readings.length).padStart(2, "0")}`)),
          h("h3", {}, reading.title)),
        h("div", { class: "hz-cell hz-cell-sky" }, h("span", { class: "hz-cell-label" }, GAZE[0][2]), h("p", {}, runs(reading.promised))),
        h("div", { class: "hz-cell hz-cell-haze" }, h("span", { class: "hz-cell-label" }, GAZE[1][2]), h("p", {}, runs(reading.open))),
        h("div", { class: "hz-cell hz-cell-ground" }, h("span", { class: "hz-cell-label" }, GAZE[2][2]), h("p", {}, runs(reading.asks))),
        h("footer", { class: "hz-column-foot" }, h("p", { class: "hz-hook" }, runs(reading.hook)), h("span", {}, `${reading.verseCount} verses · ${parts.join(" · ")}`), open));
      columns.set(reading.slug, { column, open });
      return column;
    }));
  const scroller = h("div", { class: "hz-scroller", role: "group", "aria-label": "The six readings along the horizon" }, scene);
  const panel = h("section", { class: "hz-dig", id: "hz-reading", hidden: true });

  const figures = [
    ["Readings", numbers.readings, "each opens where it sits, and each starts with its passage"],
    ["Verses walked", numbers.verses, "each counted once, in the Berean"],
    ["Promise and call", numbers.rows, `joined in the verse itself; ${numbers.saysTherefore} say therefore. Chosen for the pattern, not a count of it`],
    ["First and last pages", numbers.bookends, `${numbers.shares} share a word, ${numbers.echoes} are this study's matching`],
    ["The thousand years", numbers.thousandVerses, "verses, all in Revelation 20, the only place the Bible ties those years to a reign"],
  ];
  page.append(h("section", { class: "hz-land", id: "readings" },
    hero,
    h("div", { class: "hz-land-head" }, sectionHead("01", "Six readings.", "Three questions each.", runs(study.frame))),
    h("div", { class: "hz-gaze-row" }, GAZE.map((g) => gazeButton(g, ""))),
    scroller,
    h("p", { class: "hz-pan-hint" }, "Swipe along the horizon for all six."),
    panel,
    h("div", { class: "hz-under" },
      h("dl", { class: "hz-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
      h("div", { class: "hz-under-notes" },
        h("p", { class: "hz-note" }, h("b", {}, "How to read this page: "), "gold-referenced lines set apart are Scripture, in the Berean. Plain text is written by this site from Scripture. Outside sources are named, with what was read. An application is called an application. The numbers mark the order of the readings, not levels of difficulty."),
        h("p", { class: "hz-note" }, runs(study.selection))))));

  // ── A reading, below ground ──
  // Reading 02's four pairs, set either side of the line. Every word is checked against the study's own paragraph.
  const PAIRS = [["perishable", "imperishable"], ["dishonor", "glory"], ["weakness", "power"], ["a natural body", "a spiritual body"]];
  function sownRaised(paragraph) {
    const text = plain(paragraph.runs);
    PAIRS.flat().forEach((word) => { if (!text.includes(`"${word}"`)) console.error(`The hope to come: "${word}" is not quoted in the sown and raised paragraph`); });
    return h("figure", { class: "hz-pairs" },
      h("div", { class: "hz-pairs-row" }, h("span", { class: "hz-pairs-label" }, "Raised"), PAIRS.map(([, raised]) => h("b", {}, raised))),
      h("div", { class: "hz-pairs-row hz-pairs-sown" }, h("span", { class: "hz-pairs-label" }, "Sown"), PAIRS.map(([sown]) => h("span", {}, sown))),
      h("figcaption", {}, refLink("1CO.15.42-44", "1 Corinthians 15:42–44"), " · the four pairs, as Paul sets them"));
  }
  const isAside = (block) => !["p", "quote"].includes(block.k);
  // A lone aside stands in the margin. A run of them, or one with no text left to stand beside, goes across the page in reading order.
  function partBody(reading, part, isLastPart) {
    const out = [];
    part.blocks.forEach((block, index) => {
      if (isAside(block)) {
        const last = out.at(-1);
        if (index && isAside(part.blocks[index - 1]) && last) {
          if (last.classList.contains("hz-aside-band")) last.classList.remove("hz-aside-band-one");
          else { const band = h("div", { class: "hz-aside-band" }, last); out[out.length - 1] = band; }
          out.at(-1).append(blockView[block.k](block));
        } else {
          const nothingAfter = part.blocks.slice(index + 1).every(isAside);
          const noneBefore = part.blocks.slice(0, index).every(isAside);
          out.push(nothingAfter && (isLastPart || noneBefore) ? h("div", { class: "hz-aside-band hz-aside-band-one" }, blockView[block.k](block)) : blockView[block.k](block));
        }
        return;
      }
      out.push(blockView[block.k](block));
      if (reading.slug === "raised" && part.title === "What you sow" && block.k === "p" && plain(block.runs).includes("four pairs")) out.push(sownRaised(block));
    });
    return out;
  }
  function drawPanel(reading) {
    const next = study.readings[(study.readings.indexOf(reading) + 1) % study.readings.length];
    const closeButton = h("button", { type: "button", class: "hz-dig-close", "aria-label": `Close the reading: ${reading.title}`, onclick: () => setReading(null, true) });
    closeButton.append(art(icon("x", 18)));
    panel.replaceChildren(
      h("div", { class: "hz-dig-inner" },
        h("header", { class: "hz-dig-head" },
          h("p", { class: "hz-kind" }, "Reading ", h("b", {}, reading.n)),
          h("h3", { tabindex: "-1", id: "hz-reading-title" }, reading.title),
          h("p", { class: "hz-dig-read" }, h("span", {}, "Begin with the passage: "), reading.read.flatMap((id, i) => [i ? " · " : null, refLink(id, passages[id].label)])),
          h("p", { class: "hz-dig-setting" }, h("span", {}, "Its setting: "), runs(reading.setting)),
          closeButton),
        h("div", { class: "hz-dig-text" },
          reading.parts.map((part, index) => h("div", { class: "hz-part" }, h("h4", {}, part.title), partBody(reading, part, index === reading.parts.length - 1))),
          h("div", { class: "hz-prompts" },
            h("div", {}, h("h4", {}, "Look closely"), h("p", {}, runs(reading.look))),
            h("div", {}, h("h4", {}, "Your response"), h("p", {}, runs(reading.response)))),
          h("footer", { class: "hz-dig-foot" },
            h("button", { type: "button", onclick: () => setReading(next.slug, false) }, `Next: ${next.title} →`),
            h("button", { type: "button", onclick: () => setReading(null, true) }, "Close this reading ↑")))));
  }
  // The shaft: a gold line from the open column's foot down into the reading.
  function placeShaft() {
    if (!state.reading) return;
    const { open } = columns.get(state.reading);
    panel.style.setProperty("--shaft", `${Math.round(open.closest(".hz-column").getBoundingClientRect().left + 1)}px`);
  }
  let drawnReading = null;
  function syncReading() {
    for (const [slug, { column, open }] of columns) {
      const on = slug === state.reading;
      open.setAttribute("aria-expanded", String(on));
      column.classList.toggle("is-on", on);
      open.querySelector(".hz-open-text").textContent = on ? "Reading now · close" : "Open the reading";
    }
    if (state.reading === drawnReading) return;
    drawnReading = state.reading;
    if (state.reading) {
      drawPanel(study.readings.find((r) => r.slug === state.reading));
      panel.hidden = false;
      placeShaft();
    } else {
      panel.hidden = true;
      panel.replaceChildren();
    }
  }
  function setReading(slug, returnFocus) {
    const previous = state.reading;
    setView({ reading: slug });
    if (slug) {
      document.getElementById("hz-reading-title")?.focus({ preventScroll: true });
      panel.scrollIntoView({ block: "start", behavior: reducedMotion.matches ? "auto" : "smooth" });
    } else if (returnFocus && previous) {
      const { open } = columns.get(previous);
      open.focus({ preventScroll: true });
      open.scrollIntoView({ block: "center", inline: "nearest" });
    }
  }
  scene.addEventListener("click", (event) => {
    const link = event.target.closest("a.hz-open");
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    setReading(state.reading === link.dataset.reading ? null : link.dataset.reading, true);
  });
  // The strip takes keyboard focus only while there is something to scroll.
  function syncScroller() {
    if (scroller.scrollWidth > scroller.clientWidth) scroller.setAttribute("tabindex", "0");
    else scroller.removeAttribute("tabindex");
    placeShaft();
  }
  scroller.addEventListener("scroll", placeShaft, { passive: true });
  addEventListener("resize", syncScroller);
  addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !state.sheet && state.reading && panel.contains(document.activeElement)) { event.preventDefault(); setReading(null, true); }
  });

  function syncGaze() {
    scene.dataset.look = state.look ?? "level";
    gazeButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.look === state.look)));
  }
  onView(syncGaze);
  onView(syncReading);
  syncGaze();
  syncReading();
  syncScroller();
})();
