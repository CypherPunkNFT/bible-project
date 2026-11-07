// The heading, the drawing with its slow small cloud, the figures and the statement of what this page chose.
(() => {
  if (!window.PTK) return;
  const { h, art, runs, plain, refLink, page, reducedMotion } = PTK;
  const { study, numbers } = window.PT;
  const motto = plain(study.motto).split(" / ");
  const pauseButton = h("button", { type: "button", class: "pt-pause", "aria-pressed": "false" }, "Pause the moving cloud");
  const stage = h("div", { class: "pt-stage" }, art(PTArt.hero));
  const figures = [
    ["Prophets walked", numbers.prophets, `${numbers.books} whose names head books, and two who speak inside Kings.`],
    ["Book openings naming a ruler", `${numbers.named} of ${numbers.books}`, "The other six name no ruler, so this page does not place them."],
    ["Questions asked of each", numbers.questions, `${numbers.lines} lines of the record, each given a verse or left empty.`],
    ["Lines left empty", numbers.silent, "An empty line says what this study found, not what did or did not happen."],
  ];
  page.append(h("section", { class: "t-sec-landing pt-hero", id: "top" },
    h("div", { class: "hc-intro pt-intro" },
      h("div", {},
        h("nav", { class: "pt-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=people" }, "People of Scripture"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "pt-here" }, study.title)),
        h("p", { class: "pt-concepts" }, plain(study.concepts)),
        h("h1", {}, "Prophets", h("em", {}, "in their times")),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "pt-opening" },
          h("blockquote", {}, study.opening.t),
          h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "pt-hero-art" }, stage,
        h("figcaption", {},
          h("span", { class: "pt-motto" }, motto[0], h("br"), h("span", {}, motto[1])),
          h("span", { class: "pt-art-note" }, "Illustrative forms: a city gate (", refLink("AMO.5.10-24", "Amos 5:10–24"), "), a broken jar (", refLink("JER.19.1-15", "Jeremiah 19:1–15"), ") and a small cloud far off (", refLink("1KI.18.41-46", "1 Kings 18:41–46"), "). No person is drawn."),
          pauseButton))),
    h("dl", { class: "pt-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
    h("p", { class: "pt-selection" }, runs(study.selection))));

  let paused = false, visible = true;
  const update = () => {
    pauseButton.hidden = reducedMotion.matches;
    stage.classList.toggle("is-still", paused || !visible || document.hidden || reducedMotion.matches);
  };
  pauseButton.addEventListener("click", () => {
    paused = !paused;
    pauseButton.setAttribute("aria-pressed", String(paused));
    pauseButton.textContent = paused ? "Play the moving cloud" : "Pause the moving cloud";
    update();
  });
  new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; update(); }).observe(stage);
  document.addEventListener("visibilitychange", update);
  reducedMotion.addEventListener("change", update);
  update();
})();
