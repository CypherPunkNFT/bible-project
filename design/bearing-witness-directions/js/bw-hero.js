// The heading, the drawing with its slow motes of light, the figures and the statement of what this page chose.
(() => {
  if (!window.BWK) return;
  const { h, art, runs, plain, refLink, page, reducedMotion } = BWK;
  const { study, numbers } = window.BW;
  const motto = plain(study.motto).split(" / ");
  const pauseButton = h("button", { type: "button", class: "bw-pause", "aria-pressed": "false" }, "Pause the moving light");
  const stage = h("div", { class: "bw-stage" }, art(BWArt.hero));
  const figures = [
    ["Readings", numbers.readings, `From ${numbers.letters} letters, following the order of Colossians 4.`],
    ["Verses walked", numbers.verses, "The passages the readings set you to read, each verse counted once."],
    ["Phrases sorted", numbers.speaker + numbers.other + numbers.god, `Across ${numbers.rows} passages. The words are checked; the sorting is this study’s judgment.`],
    ["Open doors listed", numbers.doors, "Not one door. One is only asked for, and two name no opener."],
  ];
  page.append(h("section", { class: "t-sec-landing bw-hero", id: "top" },
    h("div", { class: "hc-intro bw-intro" },
      h("div", {},
        h("nav", { class: "bw-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=life" }, "Living the Christian Life"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "bw-here" }, study.title)),
        h("p", { class: "bw-concepts" }, plain(study.concepts)),
        h("h1", {}, "Bearing", h("em", {}, "witness")),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "bw-opening" },
          h("blockquote", {}, study.opening.t),
          h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "bw-hero-art" }, stage,
        h("figcaption", {},
          h("span", { class: "bw-motto" }, motto[0], h("br"), h("span", {}, motto[1])),
          h("span", { class: "bw-art-note" }, "Illustrative forms: a door standing ajar (", refLink("COL.4.3", "Colossians 4:3"), ") and a chain hanging beside it (", refLink("EPH.6.20", "Ephesians 6:20"), "). No person is drawn."),
          pauseButton))),
    h("dl", { class: "bw-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
    h("p", { class: "bw-selection" }, runs(study.selection))));

  let paused = false, visible = true;
  const update = () => {
    pauseButton.hidden = reducedMotion.matches;
    stage.classList.toggle("is-still", paused || !visible || document.hidden || reducedMotion.matches);
  };
  pauseButton.addEventListener("click", () => {
    paused = !paused;
    pauseButton.setAttribute("aria-pressed", String(paused));
    pauseButton.textContent = paused ? "Play the moving light" : "Pause the moving light";
    update();
  });
  new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; update(); }).observe(stage);
  document.addEventListener("visibilitychange", update);
  reducedMotion.addEventListener("change", update);
  update();
})();
