// The landing: the very large title and one of the drawings, then a line of hills and the words, all on the site's own background.
Cov.drawLanding = () => {
  const { h, art, runs, plain, refLink, study } = Cov;
  const hills = `<svg viewBox="0 0 1600 300" preserveAspectRatio="none" aria-hidden="true">
    <path vector-effect="non-scaling-stroke" d="M0 118C210 74 390 84 620 112S1040 146 1260 104 1500 76 1600 92"/>
    <path vector-effect="non-scaling-stroke" d="M0 186C240 138 470 168 720 198S1210 208 1600 150"/></svg>`;

  const motto = plain(study.motto).split(" / ");
  const drawingFor = (key) => CovDrawings.stars[key] ?? CovDrawings.list[Number(key) - 1];
  const artHolder = art(drawingFor(Cov.state.drawing), "cl-art");

  // The floating version pill: changes the drawing in place, with no new page.
  const pillButtons = ["a", "b", "c", "d", "e", "f", "g", "h", "i"].map((key) => h("button", { type: "button", "aria-label": `Version ${key.toUpperCase()}`, onclick: () => Cov.set({ drawing: key }) }, key.toUpperCase()));
  const pill = h("div", { class: "cl-pill", role: "group", "aria-label": "Versions of the drawing" }, pillButtons);
  const syncPill = (key) => pillButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.textContent.toLowerCase() === key)));
  syncPill(Cov.state.drawing);
  Cov.onChange((state, before) => {
    if (state.drawing === before.drawing) return;
    artHolder.innerHTML = drawingFor(state.drawing); // fixed drawings only
    syncPill(state.drawing);
  });
  return h("header", { class: "cl-hero", id: "top" },
    h("div", { class: "cl-sky" },
      h("nav", { class: "cv-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=doctrine" }, "God & Christian Faith"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "cv-here", "aria-current": "page" }, study.title)),
      h("div", { class: "cl-title" },
        h("p", { class: "cv-concepts" }, plain(study.concepts)),
        h("h1", {}, "Covenants", h("em", {}, "and promises"))),
      artHolder),
    h("div", { class: "cl-far" }, art(hills, "cl-hills"), h("p", { class: "cl-motto" }, motto[0], h("span", {}, motto[1]))),
    h("div", { class: "cl-ground" },
      h("p", { class: "cl-lede" }, runs(study.lead)),
      h("figure", { class: "cl-opening" },
        h("blockquote", {}, study.opening.t),
        h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible"))),
    pill);
};
