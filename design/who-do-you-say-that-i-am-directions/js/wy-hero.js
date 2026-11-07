// The heading, and its figure: one tick for each line on the wall, in the wall's groups and order, with one gap left in the ring.
(() => {
  if (!window.WYK) return;
  const { h, runs, plain, refLink, page, reducedMotion } = WYK;
  const { study, numbers, words, groups, answers } = window.WY;
  const motto = plain(study.motto).split(" / ");
  const CENTRE = 210, RADIUS = 172;
  const GROUP_SPACE = 1, GAP_SPACE = 5; // measured in ticks
  const TICKS = { said: [14, 14], reported: [14, 14], asked: [14, 2], dared: [2, 14], mocked: [2, 14], charged: [2, 14] }; // how far in and how far out from the ring

  const svg = (tag, attrs = {}, text) => {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    if (text) element.textContent = text;
    return element;
  };
  const at = (angle, radius) => [CENTRE + radius * Math.cos(angle), CENTRE + radius * Math.sin(angle)].map((value) => value.toFixed(2));

  function ring() {
    const slots = answers.length + groups.length * GROUP_SPACE - GROUP_SPACE + GAP_SPACE;
    const step = (2 * Math.PI) / slots;
    let angle = -Math.PI / 2 + (step * GAP_SPACE) / 2;
    const drawn = svg("svg", { viewBox: "0 0 420 420", class: "wy-ring", role: "img", "aria-label": `A ring of ${answers.length} ticks, one for each line on the wall below, sorted into ${words.groups} groups, with one gap left at the top.` });
    for (const group of groups) {
      const first = angle;
      for (const answer of answers.filter((a) => a.group === group.id)) {
        const [inner, outer] = TICKS[answer.how];
        const [x1, y1] = at(angle, RADIUS - inner), [x2, y2] = at(angle, RADIUS + outer);
        drawn.append(svg("line", { x1, y1, x2, y2, class: `wy-tick wy-tick-${answer.how}` }));
        angle += step;
      }
      const last = angle - step;
      const [ax, ay] = at(first, RADIUS - 24), [bx, by] = at(last, RADIUS - 24);
      drawn.append(svg("path", { d: `M${ax} ${ay}A${RADIUS - 24} ${RADIUS - 24} 0 ${last - first > Math.PI ? 1 : 0} 1 ${bx} ${by}`, class: "wy-arc" }));
      angle += step * GROUP_SPACE;
    }
    const [gapX, gapY] = at(-Math.PI / 2, RADIUS);
    drawn.append(svg("circle", { cx: gapX, cy: gapY, r: 7, class: "wy-gap" }));
    drawn.append(svg("text", { x: CENTRE, y: CENTRE - 22, class: "wy-ring-say" }, "Who do you say"));
    drawn.append(svg("text", { x: CENTRE, y: CENTRE + 4, class: "wy-ring-say" }, "I am?"));
    drawn.append(svg("line", { x1: CENTRE - 76, y1: CENTRE + 46, x2: CENTRE + 76, y2: CENTRE + 46, class: "wy-ring-blank" }));
    const [dotX, dotY] = at(-Math.PI / 2, RADIUS + 26);
    const moving = svg("g", { class: "wy-ring-move" });
    moving.append(svg("circle", { cx: dotX, cy: dotY, r: 2.6, class: "wy-ring-dot" }));
    drawn.append(moving);
    return drawn;
  }

  const pauseButton = h("button", { type: "button", class: "wy-pause", "aria-pressed": "false" }, "Pause the moving dot");
  const stage = h("div", { class: "wy-stage" }, ring());
  const figures = [
    ["Answers kept here", numbers.answers, "A selection of what the Gospels record, each in the speaker's own words."],
    ["Kinds of speaker", numbers.groups, "From a tempter and His accusers to His friends and a voice from heaven."],
    ["Say Son of God", `${numbers.son} lines`, `From ${words.sonGroups} of the ${words.groups} groups. Not all of them mean it the same way.`],
    ["Left blank", "1", "Yours. This page records nothing."],
  ];
  page.append(h("section", { class: "t-sec-landing wy-hero", id: "top" },
    h("div", { class: "wy-intro" },
      h("div", {},
        h("nav", { class: "wy-trail", "aria-label": "Study trail" }, h("a", { href: "/study" }, "Study"), h("span", { "aria-hidden": "true" }, "/"), h("a", { href: "/study/theology?area=jesus" }, "Jesus Christ"), h("span", { "aria-hidden": "true" }, "/"), h("span", { class: "wy-here" }, study.title)),
        h("p", { class: "wy-concepts" }, plain(study.concepts)),
        h("h1", {}, "Who do you say ", h("em", {}, "I am?")),
        h("p", { class: "wy-lede" }, runs(study.lead)),
        h("figure", { class: "wy-opening" },
          h("blockquote", {}, study.opening.t),
          h("figcaption", {}, refLink(study.opening.r, study.opening.label), " · Berean Standard Bible"))),
      h("figure", { class: "wy-hero-art" }, stage,
        h("figcaption", {},
          h("span", { class: "wy-motto" }, motto[0], h("br"), h("span", {}, motto[1])),
          h("span", { class: "wy-art-note" }, "Each tick is one line on the wall below: long if stated, shorter if asked, heavy if thrown. Which group each sits in is this study's sorting. The gap is left on purpose."),
          pauseButton))),
    h("dl", { class: "wy-figures" }, figures.map(([label, value, note]) => h("div", {}, h("dt", {}, label), h("dd", {}, String(value)), h("small", {}, note)))),
    h("div", { class: "wy-stance" }, h("p", {}, runs(study.stance)), h("p", {}, runs(study.selection)))));

  let paused = false, visible = true;
  const update = () => {
    pauseButton.hidden = reducedMotion.matches;
    stage.classList.toggle("is-still", paused || !visible || document.hidden || reducedMotion.matches);
  };
  pauseButton.addEventListener("click", () => {
    paused = !paused;
    pauseButton.setAttribute("aria-pressed", String(paused));
    pauseButton.textContent = paused ? "Play the moving dot" : "Pause the moving dot";
    update();
  });
  new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; update(); }).observe(stage);
  document.addEventListener("visibilitychange", update);
  reducedMotion.addEventListener("change", update);
  update();
})();
