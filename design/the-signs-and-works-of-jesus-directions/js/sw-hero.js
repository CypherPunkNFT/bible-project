// The heading, the drawing, the figures and the statement of what this page chose.
(() => {
  if (!window.SWK) return;
  const { h, art, runs, plain, refLink, page, reducedMotion } = SWK;
  const { study, numbers, words } = window.SW;
  const motto = plain(study.motto).split(" / ");
  const pauseButton = h("button", { type: "button", class: "sw-pause", "aria-pressed": "false" }, "Pause the moving cord");
  const stage = h("div", { class: "sw-stage" }, art(SWArt.hero));
  const figures = [
    ["Verses read", numbers.verses, `Across ${words.accounts} accounts read whole, sorted one verse at a time by this study.`],
    ["Tell the deed", `${numbers.deed} of ${numbers.verses}`, "The verses in which the work happens. Everything else stands on these."],
    ["After the deed", numbers.after, "Verses that come after the first deed in an account and are not a deed themselves."],
    ["Others speak", numbers.others, "The largest kind: people asking, afraid, believing, leaving."],
  ];
  page.append(h("section", { class: "t-sec-landing sw-hero", id: "top" },
    h("div", { class: "hc-intro sw-intro" },
      h("div", {},
        h("nav", { class: "sw-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=jesus" }, "Jesus Christ"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "sw-here" }, study.title)),
        h("p", { class: "sw-concepts" }, plain(study.concepts)),
        h("h1", {}, "The signs and works ", h("em", {}, "of Jesus")),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "sw-opening" },
          h("blockquote", {}, study.opening.t),
          h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "sw-hero-art" }, stage,
        h("figcaption", {},
          h("span", { class: "sw-motto" }, motto[0], h("br"), h("span", {}, motto[1])),
          h("span", { class: "sw-art-note" }, "Illustrative forms: a cord with one star on it, over a boat on the water. The drawing is this study's, and it is not a picture of any place."),
          pauseButton))),
    h("dl", { class: "sw-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
    h("p", { class: "sw-selection" }, runs(study.selection))));

  let paused = false, visible = true;
  const update = () => {
    pauseButton.hidden = reducedMotion.matches;
    stage.classList.toggle("is-still", paused || !visible || document.hidden || reducedMotion.matches);
  };
  pauseButton.addEventListener("click", () => {
    paused = !paused;
    pauseButton.setAttribute("aria-pressed", String(paused));
    pauseButton.textContent = paused ? "Play the moving cord" : "Pause the moving cord";
    update();
  });
  new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; update(); }).observe(stage);
  document.addEventListener("visibilitychange", update);
  reducedMotion.addEventListener("change", update);
  update();
})();
