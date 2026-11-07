// The heading, the drawing with its slow light along the chain, the figures, what this page chose and the two words.
(() => {
  if (!window.BWK) return;
  const { h, art, runs, refLink, quoteView, page, reducedMotion } = BWK;
  const { study, numbers, passages, chainRange, rings } = window.BW;
  const [title, turn] = study.title.split(": ");
  const pauseButton = h("button", { type: "button", class: "bw-pause", "aria-pressed": "false" }, "Pause the moving light");
  const stage = h("div", { class: "bw-stage" }, art(BWArt.hero));
  const chainLabel = passages[chainRange].label;
  const figures = [
    ["Passages walked", numbers.parts, "Each chosen because it answers a different question about telling others."],
    ["Verses read", numbers.versesWalked, "The main readings of the passages, each verse counted once."],
    ["Links in the chain", numbers.links, `${chainLabel}: from being sent to calling on the Lord.`],
    ["Questions readers ask", numbers.questions, "Answered after the passages, with the views that differ."],
  ];
  page.append(h("section", { class: "t-sec-landing bw-hero", id: "top" },
    h("div", { class: "hc-intro bw-intro" },
      h("div", {},
        h("nav", { class: "bw-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=life" }, "Living the Christian Life"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "bw-here" }, title)),
        h("p", { class: "bw-concepts" }, study.concepts.join(" · ")),
        h("h1", {}, `${title}:`, h("em", {}, turn)),
        h("p", { class: "hc-lede" }, runs(study.lead.runs)),
        h("div", { class: "bw-opening" }, quoteView(study.verse))),
      h("figure", { class: "bw-hero-art" }, stage,
        h("figcaption", {},
          h("span", { class: "bw-motto" }, study.motto[0], h("br"), h("span", {}, study.motto[1])),
          h("span", { class: "bw-art-note" }, "Illustrative forms: a city on a hill with three rings around it (", refLink(rings.r, passages[rings.r].label), "), a chain of five links reaching across them (", refLink(chainRange, chainLabel), "), and a shoot at the far edge (", refLink(study.verse.r, study.verse.label), "). No person is drawn."),
          pauseButton))),
    h("dl", { class: "bw-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
    h("div", { class: "bw-chosen" },
      h("p", { class: "bw-selection" }, runs(study.selection.runs)),
      h("p", { class: "bw-words" }, runs(study.words.runs)))));

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
