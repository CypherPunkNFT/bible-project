// 01 The line of six passages, and the passage opened beneath it.
(() => {
  if (!window.HSK) return;
  const { h, svg, refLink, runs, page, sectionHead, partView, readings, reducedMotion } = HSK;
  const { study, passages, garden } = window.HS;
  // How far down the line each passage sits: what it is mostly about, the wrong or God's answer. This page's picture, not a measure.
  const DROPS = { image: 0.06, hid: 0.56, "under-sin": 0.94, "one-man": 0.6, renewed: 0.34, bodies: 0.2 };
  const BAND = 120;
  const list = study.readings;

  function linePath(from, to) {
    const x = (i) => (i + 0.5) * (600 / list.length), y = (slug) => DROPS[slug] * BAND;
    const mid = (x(from) + x(to)) / 2;
    return `M${x(from)} ${y(list[from].slug)}C${mid} ${y(list[from].slug)} ${mid} ${y(list[to].slug)} ${x(to)} ${y(list[to].slug)}`;
  }
  const lineDrawing = svg("svg", { class: "hs-line-art", viewBox: `0 0 600 ${BAND}`, preserveAspectRatio: "none", "aria-hidden": "true" },
    list.slice(0, -1).map((_, i) => svg("path", { class: i === list.length - 2 ? "hs-line-ahead" : "hs-line-path", d: linePath(i, i + 1), "vector-effect": "non-scaling-stroke" })));

  const buttons = new Map();
  const holder = h("div", { class: "hs-reading", id: "passage" });
  function chooseReading(slug) {
    HSK.setView({ reading: slug });
    drawReading();
    const heading = holder.querySelector("h3");
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: "start", behavior: reducedMotion.matches ? "auto" : "smooth" });
  }
  const points = list.map((reading) => {
    const button = h("button", { type: "button", class: "hs-point", style: `--drop:${DROPS[reading.slug]}`, onclick: () => chooseReading(reading.slug) },
      h("i", { class: "hs-dot", "aria-hidden": "true" }),
      h("span", { class: "hs-point-n", "aria-hidden": "true" }, reading.n),
      h("span", { class: "hs-point-title" }, reading.title),
      h("span", { class: "hs-point-line" }, HSK.plain(reading.line)));
    buttons.set(reading.slug, button);
    return button;
  });

  function passageView(identity) {
    const p = passages[identity];
    let chapter = null;
    const text = h("p", { class: "hs-passage-text" });
    p.verses.forEach((v) => {
      if (v.c !== chapter) { chapter = v.c; if (p.chapters.length > 1) text.append(h("span", { class: "hs-sheet-ch" }, `Chapter ${v.c}`)); }
      text.append(h("sup", {}, String(v.v)), `${v.t} `);
    });
    return h("div", { class: "hs-passage-one" }, h("p", { class: "hs-small" }, refLink(identity, p.label), " · Berean"), text);
  }
  // Genesis 3: the two orders, one above the other. Left to right is the order spoken, not rank.
  const gardenStep = (step) => h("li", { class: step.r ? "" : "hs-empty" }, h("b", {}, step.who),
    step.r ? [h("span", {}, `“${step.text}”`), refLink(step.r, step.label)] : h("span", {}, "Not asked anything"));
  const gardenView = () => h("figure", { class: "hs-garden" },
    h("div", {}, h("p", { class: "hs-small" }, "God asks"), h("ol", {}, garden.asked.map(gardenStep))),
    h("div", {}, h("p", { class: "hs-small" }, "God speaks"), h("ol", {}, garden.spoken.map(gardenStep))),
    h("p", { class: "hs-garden-then" }, "Then, to both of them: “", garden.then.text, "” ", refLink(garden.then.r, garden.then.label)),
    h("figcaption", {}, "Left to right is the order spoken, not rank. This page's layout of Genesis 3."));

  const question = (mark, label, content) => h("p", { class: `hs-q hs-q-${mark}` }, h("b", {}, label), " ", runs(content));
  function neighbour(reading, step) {
    const next = list[list.indexOf(reading) + step];
    return next ? h("button", { type: "button", class: "hs-action", onclick: () => chooseReading(next.slug) }, step < 0 ? `← ${next.title}` : `${next.title} →`) : null;
  }
  function drawReading() {
    const reading = readings.get(HSK.state.reading);
    for (const [slug, button] of buttons) {
      if (slug === reading.slug) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    }
    holder.replaceChildren(
      h("header", { class: "hs-reading-head" },
        h("p", { class: "hs-small" }, `Passage ${reading.n} of ${list.length} · ${reading.verseCount} verses`),
        h("h3", { tabindex: "-1" }, reading.title),
        h("p", { class: "hs-hook" }, runs(reading.hook)),
        h("p", { class: "hs-setting" }, runs(reading.setting))),
      h("div", { class: "hs-open" },
        h("div", { class: "hs-passage" }, reading.read.map(passageView)),
        h("aside", { class: "hs-margin", "aria-label": "The three questions, asked of this passage" },
          question("honours", "It honours", reading.honours),
          question("refuses", "It will not excuse", reading.refuses),
          question("points", "It points to", reading.points))),
      h("div", { class: "hs-says" },
        h("p", { class: "hs-pass" }, "The text says, and this study reads"),
        reading.parts.map((part, index) => {
          const view = partView(part);
          if (reading.slug === "hid" && index === 1) view.children[1].after(gardenView()); // directly after the paragraph that names the two orders
          return view;
        })),
      h("div", { class: "hs-you" },
        h("p", { class: "hs-pass" }, "You"),
        h("h4", {}, "Look closely"), h("p", {}, runs(reading.look)),
        h("h4", {}, "Your response"), h("p", {}, runs(reading.response))),
      h("nav", { class: "hs-neighbours", "aria-label": "Other passages" }, neighbour(reading, -1), neighbour(reading, 1)));
  }
  HSK.syncers.push(drawReading);

  page.append(h("section", { class: "t-sec hs-line-sec", id: "line" },
    sectionHead("01", "Six passages,", "one line", runs(study.frame)),
    h("div", { class: "hs-line" },
      h("span", { class: "hs-axis hs-axis-top", "aria-hidden": "true" }, "God's answer"),
      h("span", { class: "hs-axis hs-axis-low", "aria-hidden": "true" }, "The wrong"),
      lineDrawing,
      h("div", { class: "hs-points" }, points)),
    h("p", { class: "hs-note hs-line-note" }, "This line is this page's picture. Its height says what a passage is mostly about, and it is not anyone's worth. The last stretch is dashed because that part is not finished. Only one thing in the study is said to go further: “grace increased all the more” (", refLink(window.HS.leaves.find((row) => row.hinge === "all the more").r, "Romans 5:20"), ")."),
    holder,
    h("p", { class: "hs-note" }, runs(study.selection))));
  drawReading();
})();
