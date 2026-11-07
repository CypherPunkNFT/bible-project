// The heading, the crown and scroll with the line letting itself down and drawing back, the figures and the statement of what this page chose.
(() => {
  if (!window.RCK) return;
  const { h, art, runs, plain, refLink, page, reducedMotion } = RCK;
  const { study, numbers } = window.RC;
  const motto = plain(study.motto).split(" / ");
  const pauseButton = h("button", { type: "button", class: "rc-pause", "aria-pressed": "false" }, "Pause the moving line");
  const stage = h("div", { class: "rc-stage" }, art(RCArt.hero));
  const figures = [
    ["Rulers on the two beams", numbers.rulersCount, `${numbers.israel} of Israel and ${numbers.judah} of Judah, as the books of Kings tell them. David and Solomon reigned before the parting and are not counted.`],
    ["Tied to Jeroboam", `${numbers.tiedCount} of ${numbers.afterCount}`, "Israel's kings after him whose line, or the verse beside it, names his way or his sins. Which verse carries it is this study's reading."],
    ["Set against David", `${numbers.davidCount} of ${numbers.judah}`, `Judah's rulers measured by name against him: ${numbers.davidAsCount} as he did, ${numbers.davidCount - numbers.davidAsCount} not.`],
    ["Did right, with a note", `${numbers.notedCount} of ${numbers.rightCount}`, "Of those the writer says did right, how many have the high places left standing in the line beneath."],
  ];
  page.append(h("section", { class: "t-sec-landing rc-hero", id: "top" },
    h("div", { class: "hc-intro rc-intro" },
      h("div", {},
        h("nav", { class: "rc-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=people" }, "People of Scripture"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "rc-here" }, study.title)),
        h("p", { class: "rc-concepts" }, plain(study.concepts)),
        h("h1", {}, "Rulers ", h("em", {}, "and their choices")),
        h("p", { class: "hc-lede" }, runs(study.lead)),
        h("figure", { class: "rc-opening" },
          h("blockquote", {}, study.opening.t),
          h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "rc-hero-art" }, stage,
        h("figcaption", {},
          h("span", { class: "rc-motto" }, motto[0], h("br"), h("span", {}, motto[1])),
          h("span", { class: "rc-art-note" }, "Illustrative forms: a crown on an open scroll, and a plumb line let down beside them. The line comes from ", refLink("2KI.21.13", "2 Kings 21:13"), " and the scroll from ", refLink("DEU.17.18", "Deuteronomy 17:18"), ". The drawing is this study's, and no verse describes it."),
          pauseButton))),
    h("dl", { class: "rc-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
    h("p", { class: "rc-selection" }, runs(study.selection))));

  let paused = false, visible = true;
  const update = () => {
    pauseButton.hidden = reducedMotion.matches;
    stage.classList.toggle("is-still", paused || !visible || document.hidden || reducedMotion.matches);
  };
  pauseButton.addEventListener("click", () => {
    paused = !paused;
    pauseButton.setAttribute("aria-pressed", String(paused));
    pauseButton.textContent = paused ? "Play the moving line" : "Pause the moving line";
    update();
  });
  new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; update(); }).observe(stage);
  document.addEventListener("visibilitychange", update);
  reducedMotion.addEventListener("change", update);
  update();
})();
