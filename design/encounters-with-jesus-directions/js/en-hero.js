// The heading, the two paths meeting at a well with a jar left beside it, the figures and the statement of what this page chose.
(() => {
  if (!window.ENK) return;
  const { h, art, runs, plain, refLink, page, reducedMotion } = ENK;
  const { study, numbers } = window.EN;
  const motto = plain(study.motto).split(" / ");
  const pauseButton = h("button", { type: "button", class: "en-pause", "aria-pressed": "false" }, "Pause the moving paths");
  const stage = h("div", { class: "en-stage" }, art(ENArt.hero));
  const figures = [
    ["Meetings read to their end", numbers.meetings, "One scene with one person or party. A selection, and the note below says how it was chosen."],
    ["He began it", `${numbers.rows.he} of ${numbers.meetings}`, `They came to Him in ${numbers.rows.they}. In ${numbers.rows.both}, each moved toward the other. This study's reading of each first line.`],
    ["No further word", `${numbers.columns.silent} of ${numbers.meetings}`, "The record gives these people nothing more to say or do. It does not say why, and this does not mean nothing happened."],
    ["Seen again", `${numbers.back} of ${numbers.meetings}`, "Come back later in Scripture by name, or by the meeting itself. The rest, as far as the record lets us tell, do not."],
  ];
  page.append(h("section", { class: "t-sec-landing en-hero", id: "top" },
    h("div", { class: "hc-intro en-intro" },
      h("div", {},
        h("nav", { class: "en-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=jesus" }, "Jesus Christ"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "en-here" }, study.title)),
        h("p", { class: "en-concepts" }, plain(study.concepts)),
        h("h1", {}, "Encounters ", h("em", {}, "with Jesus")),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "en-opening" },
          h("blockquote", {}, study.opening.t),
          h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "en-hero-art" }, stage,
        h("figcaption", {},
          h("span", { class: "en-motto" }, motto[0], h("br"), h("span", {}, motto[1])),
          h("span", { class: "en-art-note" }, "Illustrative forms: two paths coming to a well, and a water jar left beside it, from ", refLink("JHN.4.28", "John 4:28"), ". The drawing is this study's, and it is not a picture of the place."),
          pauseButton))),
    h("dl", { class: "en-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
    h("p", { class: "en-selection" }, runs(study.selection))));

  let paused = false, visible = true;
  const update = () => {
    pauseButton.hidden = reducedMotion.matches;
    stage.classList.toggle("is-still", paused || !visible || document.hidden || reducedMotion.matches);
  };
  pauseButton.addEventListener("click", () => {
    paused = !paused;
    pauseButton.setAttribute("aria-pressed", String(paused));
    pauseButton.textContent = paused ? "Play the moving paths" : "Pause the moving paths";
    update();
  });
  new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; update(); }).observe(stage);
  document.addEventListener("visibilitychange", update);
  reducedMotion.addEventListener("change", update);
  update();
})();
