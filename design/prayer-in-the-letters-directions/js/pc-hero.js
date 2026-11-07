// The heading, the drawing with its slow thread, the figures and the statement of what this page chose.
(() => {
  if (!window.PCK) return;
  const { h, art, runs, plain, refLink, page, reducedMotion } = PCK;
  const { study, numbers } = window.PC;
  const motto = plain(study.motto).split(" / ");
  const pauseButton = h("button", { type: "button", class: "pc-pause", "aria-pressed": "false" }, "Pause the moving thread");
  const stage = h("div", { class: "pc-stage" }, art(PCArt.hero));
  const figures = [
    ["Passages kept whole", numbers.passages, `${numbers.reported} reported prayers and ${numbers.instructions} where a writer tells or asks others to pray.`],
    ["Verses", numbers.verses, "All of those passages, each verse counted once."],
    ["Say so that", `${numbers.reported} of ${numbers.reported}`, "Reported prayers that use these words in the Berean. No Greek was compared."],
    ["Lines named", numbers.named, "Phrases labelled thanks, asks, so that or arrives at. The words are checked; the labels are this study’s judgment."],
  ];
  page.append(h("section", { class: "t-sec-landing pc-hero", id: "top" },
    h("div", { class: "hc-intro pc-intro" },
      h("div", {},
        h("nav", { class: "pc-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=life" }, "Living the Christian Life"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "pc-here" }, study.title)),
        h("p", { class: "pc-concepts" }, plain(study.concepts)),
        h("h1", {}, "Prayer ", h("em", {}, "in the letters")),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "pc-opening" },
          h("blockquote", {}, study.opening.t),
          h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible · Read it in its paragraph: ", refLink("COL.4.2-6", "Colossians 4:2–6")))),
      h("figure", { class: "pc-hero-art" }, stage,
        h("figcaption", {},
          h("span", { class: "pc-motto" }, motto[0], h("br"), h("span", {}, motto[1])),
          h("span", { class: "pc-art-note" }, "Illustrative forms: a leaf of a letter, its marks not real writing. The thread going on past the page is this study’s picture, not a verse."),
          pauseButton))),
    h("dl", { class: "pc-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
    h("p", { class: "pc-selection" }, runs(study.selection))));

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
