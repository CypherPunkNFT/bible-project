// The heading, the drawing with its slow thread, the figures, the frame and the statement of what this page chose.
(() => {
  if (!window.NCK) return;
  const { h, art, runs, refLink, page, reducedMotion } = NCK;
  const { study, numbers, passages } = window.NC;
  const [name, subtitle] = study.title.split(": ");
  const turn = name.split(" ").pop();
  const garment = passages["COL.3.9-10"] ? refLink("COL.3.9-10", "Colossians 3:9–10") : "Colossians 3:9–10";
  const pauseButton = h("button", { type: "button", class: "nc-pause", "aria-pressed": "false" }, "Pause the moving thread");
  const stage = h("div", { class: "nc-stage" }, art(NCArt.hero));
  const figures = [
    ["Parts", numbers.parts, "Each turns on one place in a letter, drawn across the fold below."],
    ["Verses walked", numbers.verses, "The main readings of the six parts, each verse counted once."],
    ["Places across the fold", numbers.places, `The six the parts turn on and the six the text names; ${numbers.shared} are the same. The words are checked; the pairing is this study’s reading.`],
    ["Hard questions", numbers.questions, "Each opens with the reading this study follows, then what else has been said."],
  ];
  page.append(h("section", { class: "t-sec-landing nc-hero", id: "top" },
    h("div", { class: "hc-intro nc-intro" },
      h("div", {},
        h("nav", { class: "nc-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=life" }, "Living the Christian Life"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "nc-here" }, name)),
        h("p", { class: "nc-concepts" }, study.concepts.join(" · ")),
        h("h1", {}, name.slice(0, -turn.length), h("em", {}, turn)),
        subtitle ? h("p", { class: "nc-subtitle" }, subtitle) : null,
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "nc-opening" },
          h("blockquote", {}, study.opening.t),
          h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible · Read it in its paragraph: ", refLink(study.close.passage, passages[study.close.passage].label)))),
      h("figure", { class: "nc-hero-art" }, stage,
        h("figcaption", {},
          h("span", { class: "nc-motto" }, study.motto[0], h("br"), h("span", {}, study.motto[1])),
          h("span", { class: "nc-art-note" }, "Illustrative forms: an old garment laid down and a new one hung ready (", garment, "). No person is drawn."),
          pauseButton))),
    h("dl", { class: "nc-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
    h("p", { class: "nc-frame" }, runs(study.frame)),
    h("p", { class: "nc-selection" }, runs(study.selection))));

  let paused = false, visible = true;
  const update = () => {
    pauseButton.hidden = reducedMotion.matches;
    stage.classList.toggle("is-still", paused || !visible || document.hidden || reducedMotion.matches);
  };
  pauseButton.addEventListener("click", () => {
    paused = !paused;
    pauseButton.setAttribute("aria-pressed", String(paused));
    pauseButton.textContent = paused ? "Play the moving thread" : "Pause the moving thread";
    update();
  });
  new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; update(); }).observe(stage);
  document.addEventListener("visibilitychange", update);
  reducedMotion.addEventListener("change", update);
  update();
})();
