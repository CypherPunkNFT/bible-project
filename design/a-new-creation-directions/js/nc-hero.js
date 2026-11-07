// The heading, the drawing with its slow thread, the figures and the statement of what this page chose.
(() => {
  if (!window.NCK) return;
  const { h, art, runs, plain, refLink, page, reducedMotion } = NCK;
  const { study, numbers } = window.NC;
  const motto = plain(study.motto).split(" / ");
  const pauseButton = h("button", { type: "button", class: "nc-pause", "aria-pressed": "false" }, "Pause the moving thread");
  const stage = h("div", { class: "nc-stage" }, art(NCArt.hero));
  const figures = [
    ["Readings", numbers.readings, `From ${numbers.letters} letters, each reading turning on one place in the text.`],
    ["Verses walked", numbers.verses, "The passages the readings set you to read, each verse counted once."],
    ["Places side by side", numbers.folds, "Already so, then to do. The words are checked; the pairing is this study’s judgment."],
    ["Where four letters turn", `${numbers.low}–${numbers.high}%`, "How far through each letter this study marks the turn. Not every letter has one."],
  ];
  page.append(h("section", { class: "t-sec-landing nc-hero", id: "top" },
    h("div", { class: "hc-intro nc-intro" },
      h("div", {},
        h("nav", { class: "nc-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=life" }, "Living the Christian Life"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "nc-here" }, study.title)),
        h("p", { class: "nc-concepts" }, plain(study.concepts)),
        h("h1", {}, "A new ", h("em", {}, "creation")),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "nc-opening" },
          h("blockquote", {}, study.opening.t),
          h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible · Read it in its paragraph: ", refLink("2CO.5.14-21", "2 Corinthians 5:14–21")))),
      h("figure", { class: "nc-hero-art" }, stage,
        h("figcaption", {},
          h("span", { class: "nc-motto" }, motto[0], h("br"), h("span", {}, motto[1])),
          h("span", { class: "nc-art-note" }, "Illustrative forms: an old garment laid down and a new one hung ready (", refLink("COL.3.9-14", "Colossians 3:9–14"), "). No person is drawn."),
          pauseButton))),
    h("dl", { class: "nc-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
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
