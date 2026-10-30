// The stage: one full-width room that becomes each covenant's world, with its drawing beside the words and the five question buttons.
Cov.drawStage = () => {
  const { h, art, miniSign, runs, QUESTIONS, readings, passages, study, worldName } = Cov;
  const total = String(study.readings.length).padStart(2, "0");
  // The letters' reading is not a covenant of its own, so it has its own section under the stage (see page.js).
  const slugs = study.readings.map((r) => r.slug).filter((slug) => slug !== "heirs");
  let shown = slugs[0];

  // Backgrounds and signs stay in the page and cross-fade.
  const skies = slugs.map((slug) => h("div", { class: `cv-sky cv-w-${slug}`, "data-world": slug }));
  const signs = slugs.map((slug) => {
    const holder = art(CovSigns.large[slug], `cv-sign cv-w-${slug}`);
    holder.dataset.world = slug;
    return holder;
  });
  const signBox = h("div", { class: "cv-signs" }, signs);
  // ── The words beside the drawing ──
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
  const openButton = h("button", { type: "button", class: "cv-open" }, "Read it where it was spoken →");
  const words = h("div", { class: "cv-words" }, kind, title, hook, questionRow, answer, passagesLine, openButton);
  const room = h("div", { class: "cv-room" }, signBox, words);

  // ── The row of worlds ──
  const worldButtons = new Map();
  const dock = h("div", { class: "cv-dock", role: "tablist", "aria-label": "The five covenants" },
    slugs.map((slug) => {
      const button = h("button", { type: "button", role: "tab", class: "cv-dock-item", onclick: () => Cov.set({ world: slug }) }, miniSign(slug, 34), h("span", {}, worldName(slug)));
      worldButtons.set(slug, button);
      return button;
    }));
  Cov.roving(dock, ".cv-dock-item", (button) => button.click());
  const stageInner = h("div", {}, room, h("div", { class: "cv-bar" }, dock));
  const stage = h("section", { class: "cv-stage", id: "worlds", "aria-label": "The covenants" }, skies, stageInner);

  function sync(state) {
    if (slugs.includes(state.world)) shown = state.world;
    const reading = readings.get(shown);
    stage.dataset.world = shown;
    stageInner.className = `cv-stage-in cv-w-${shown}`;
    for (const sky of skies) sky.classList.toggle("is-on", sky.dataset.world === shown);
    for (const sign of signs) sign.classList.toggle("is-on", sign.dataset.world === shown);
    for (const [slug, button] of worldButtons) {
      button.setAttribute("aria-selected", String(slug === shown));
      button.tabIndex = slug === shown ? 0 : -1;
    }
    // On a phone the row scrolls sideways: keep the chosen world in sight, without moving the page.
    const chosen = worldButtons.get(shown);
    dock.scrollLeft = Math.max(0, chosen.offsetLeft - dock.offsetLeft - (dock.clientWidth - chosen.offsetWidth) / 2);
    for (const [key, button] of questionButtons) {
      button.setAttribute("aria-selected", String(key === state.q));
      button.tabIndex = key === state.q ? 0 : -1;
    }
    kind.replaceChildren("Reading ", h("b", {}, `${reading.n} / ${total}`));
    title.textContent = reading.title;
    hook.replaceChildren(...runs(reading.hook));
    answer.replaceChildren(...runs(reading[state.q]));
    answer.setAttribute("aria-label", QUESTIONS.find(([key]) => key === state.q)[1]);
    passagesLine.textContent = `${reading.verseCount} verses · ${reading.read.map((id) => passages[id].label).join(" · ")}`;
    openButton.onclick = (event) => Cov.openReading(shown, event.currentTarget);
  }
  Cov.onChange(sync);
  sync(Cov.state);
  return stage;
};
