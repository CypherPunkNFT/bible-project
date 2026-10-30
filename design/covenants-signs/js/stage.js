// The stage: one full-width room that becomes each covenant's world. The sign is the control. A second view lays one
// question across all five covenants at once.
Cov.drawStage = () => {
  const { h, art, miniSign, runs, QUESTIONS, readings, passages, study, covenants, worldName } = Cov;
  const slugs = study.readings.map((r) => r.slug);
  const total = String(slugs.length).padStart(2, "0");

  // Backgrounds and signs stay in the page and cross-fade.
  const skies = slugs.map((slug) => h("div", { class: `cv-sky cv-w-${slug}`, "data-world": slug }));
  const signs = slugs.map((slug) => {
    const holder = art(CovSigns.large[slug], `cv-sign cv-w-${slug}`);
    holder.dataset.world = slug;
    return holder;
  });
  const signBox = h("div", { class: "cv-signs" }, signs);
  signBox.addEventListener("click", (event) => {
    const hot = event.target.closest("[data-q]");
    if (hot) Cov.set({ q: hot.dataset.q });
  });
  signBox.addEventListener("pointerover", (event) => {
    const hot = event.target.closest("[data-q]");
    if (hot && event.pointerType === "mouse" && hot.dataset.q !== Cov.state.q) Cov.set({ q: hot.dataset.q });
  });

  // ── One at a time: the words beside the sign ──
  const kind = h("p", { class: "cv-kind" });
  const title = h("h3", { class: "cv-title", tabindex: "-1" });
  const hook = h("p", { class: "cv-hook" });
  const questionButtons = new Map();
  const questionRow = h("div", { class: "cv-questions", role: "tablist", "aria-label": "The five questions" },
    QUESTIONS.map(([key, label]) => {
      const button = h("button", { type: "button", role: "tab", class: "cv-question", onclick: () => Cov.set({ q: key }) }, label);
      questionButtons.set(key, button);
      return button;
    }));
  Cov.roving(questionRow, ".cv-question", (button) => button.click());
  const answer = h("p", { class: "cv-answer", role: "tabpanel", "aria-live": "polite" });
  const passagesLine = h("p", { class: "cv-passages" });
  const openButton = h("button", { type: "button", class: "cv-open", onclick: (event) => Cov.openReading(Cov.state.world, event.currentTarget) }, "Read it where it was spoken →");
  const words = h("div", { class: "cv-words" }, kind, title, hook, questionRow, answer, passagesLine, openButton);
  const room = h("div", { class: "cv-room" }, signBox, words);

  // ── Side by side: one question across the five covenants ──
  const acrossButtons = new Map();
  const acrossRow = h("div", { class: "cv-questions cv-across-questions", role: "tablist", "aria-label": "Ask all five one question" },
    QUESTIONS.map(([key, label]) => {
      const button = h("button", { type: "button", role: "tab", class: "cv-question", onclick: () => Cov.set({ q: key }) }, label);
      acrossButtons.set(key, button);
      return button;
    }));
  Cov.roving(acrossRow, ".cv-question", (button) => button.click());
  const strips = h("div", { class: "cv-strips" });
  const across = h("div", { class: "cv-across" },
    h("div", { class: "cv-across-head" },
      h("h3", {}, "Five covenants. ", h("em", {}, "Five questions.")),
      h("p", {}, "Do all God's promises say the same thing to the same people? Ask each one the same five questions and look across."),
      h("p", { class: "cv-across-reads" }, "God speaks first every time. The people, the demands and the signs all differ, and 2 Samuel 7, the great promise to David, names no sign at all.")),
    acrossRow, strips,
    h("p", { class: "cv-across-note" }, "Every answer is a short summary with its verse: this site's wording around the Berean's. The letters are left out here because Paul is reading these covenants, not making a sixth; their answers are in reading 06."));

  // ── The row of worlds ──
  const worldButtons = new Map();
  const dock = h("div", { class: "cv-dock", role: "tablist", "aria-label": "The five covenants and their heirs" },
    slugs.map((slug) => {
      const button = h("button", { type: "button", role: "tab", class: "cv-dock-item", onclick: () => Cov.set({ world: slug, view: "one" }) }, miniSign(slug, 34), h("span", {}, worldName(slug)));
      worldButtons.set(slug, button);
      return button;
    }));
  Cov.roving(dock, ".cv-dock-item", (button) => button.click());
  const viewButtons = new Map();
  const viewSwitch = h("div", { class: "cv-view", role: "group", "aria-label": "How to see the covenants" },
    [["one", "One world"], ["across", "All five, side by side"]].map(([id, label]) => {
      const button = h("button", { type: "button", onclick: () => Cov.set({ view: id }) }, label);
      viewButtons.set(id, button);
      return button;
    }));

  const stageInner = h("div", {}, room, across, h("div", { class: "cv-bar" }, dock, viewSwitch));
  const stage = h("section", { class: "cv-stage", id: "worlds", "aria-label": "The covenants" }, skies, stageInner);

  function drawStrips(q) {
    const label = QUESTIONS.find(([key]) => key === q)[1];
    strips.replaceChildren(...Object.keys(covenants).map((slug) => h("article", { class: `cv-strip cv-w-${slug}` },
      miniSign(slug, 56),
      h("h4", {}, worldName(slug)),
      h("p", { class: "cv-strip-q" }, label),
      h("p", { class: "cv-strip-a" }, runs(readings.get(slug)[q])),
      h("button", { type: "button", class: "cv-strip-go", onclick: () => Cov.set({ world: slug, view: "one" }) }, "Step inside →"))));
  }

  function sync(state, before) {
    const reading = readings.get(state.world);
    stage.dataset.world = state.world;
    stage.dataset.view = state.view;
    stageInner.className = state.view === "one" ? `cv-stage-in cv-w-${state.world}` : "cv-stage-in";
    room.hidden = state.view !== "one";
    across.hidden = state.view !== "across";
    for (const sky of skies) sky.classList.toggle("is-on", state.view === "one" && sky.dataset.world === state.world);
    for (const sign of signs) {
      const on = sign.dataset.world === state.world;
      sign.classList.toggle("is-on", on);
      sign.dataset.q = state.q;
      sign.querySelectorAll("[data-q]").forEach((part) => part.classList.toggle("is-on", on && part.dataset.q === state.q));
    }
    for (const [slug, button] of worldButtons) {
      const on = state.view === "one" && slug === state.world;
      button.setAttribute("aria-selected", String(on));
      button.tabIndex = slug === state.world ? 0 : -1;
    }
    // On a phone the row scrolls sideways: keep the chosen world in sight, without moving the page.
    const chosen = worldButtons.get(state.world);
    dock.scrollLeft = Math.max(0, chosen.offsetLeft - dock.offsetLeft - (dock.clientWidth - chosen.offsetWidth) / 2);
    for (const row of [questionButtons, acrossButtons]) for (const [key, button] of row) {
      button.setAttribute("aria-selected", String(key === state.q));
      button.tabIndex = key === state.q ? 0 : -1;
    }
    for (const [id, button] of viewButtons) button.setAttribute("aria-pressed", String(id === state.view));
    kind.replaceChildren("Reading ", h("b", {}, `${reading.n} / ${total}`));
    title.textContent = reading.title;
    hook.replaceChildren(...runs(reading.hook));
    answer.replaceChildren(...runs(reading[state.q]));
    answer.setAttribute("aria-label", QUESTIONS.find(([key]) => key === state.q)[1]);
    passagesLine.textContent = `${reading.verseCount} verses · ${reading.read.map((id) => passages[id].label).join(" · ")}`;
    if (state.view === "across" && (before?.q !== state.q || before?.view !== state.view || !strips.childElementCount)) drawStrips(state.q);
  }
  Cov.onChange(sync);
  sync(Cov.state);
  return stage;
};
