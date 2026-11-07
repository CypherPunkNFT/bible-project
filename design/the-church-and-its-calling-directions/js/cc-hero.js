// The heading, the wall of stones with its slow light, the figures and the statement of what this page chose.
(() => {
  if (!window.CCK) return;
  const { h, art, runs, plain, refLink, page, reducedMotion } = CCK;
  const { study, numbers } = window.CC;
  const motto = plain(study.motto).split(" / ");
  const pauseButton = h("button", { type: "button", class: "cc-pause", "aria-pressed": "false" }, "Pause the moving light");
  const stage = h("div", { class: "cc-stage" }, art(CCArt.hero));
  const figures = [
    ["The word in the New Testament", numbers.uses, `Each time the Berean prints church or churches, in ${numbers.verses} verses. One English word, counted by script. No Greek was compared.`],
    ["A people you could visit", numbers.people, "Uses on the three smaller rings: a house, a place, many places. Which ring is this study's judgment."],
    ["All who are Christ's", numbers.rings.all, `Uses on the widest ring, ${numbers.inTwo} of them in Ephesians and Colossians. Also this study's judgment.`],
    ["Baptisms told in Acts", numbers.baptisms, "Counted as the section below says. It says which words came before the water, and where it tells nothing."],
  ];
  page.append(h("section", { class: "t-sec-landing cc-hero", id: "top" },
    h("div", { class: "hc-intro cc-intro" },
      h("div", {},
        h("nav", { class: "cc-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=doctrine" }, "God & Christian Faith"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "cc-here" }, study.title)),
        h("p", { class: "cc-concepts" }, plain(study.concepts)),
        h("h1", {}, "The church ", h("em", {}, "and its calling")),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "cc-opening" },
          h("blockquote", {}, study.opening.t),
          h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "cc-hero-art" }, stage,
        h("figcaption", {},
          h("span", { class: "cc-motto" }, motto[0], h("br"), h("span", {}, motto[1])),
          h("span", { class: "cc-art-note" }, "Illustrative forms: a wall of stones with its top course still open and one stone on its way. The picture comes from ", refLink("1PE.2.4-5", "1 Peter 2:4–5"), " and ", refLink("EPH.2.21", "Ephesians 2:21"), ". The drawing is this study's, and no verse describes it."),
          pauseButton))),
    h("dl", { class: "cc-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
    h("p", { class: "cc-selection" }, runs(study.selection))));

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
